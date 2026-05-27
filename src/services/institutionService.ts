import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Institution, InstitutionType } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase';

const COLLECTION_NAME = 'institutions';

export function normalizeName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, " ")     // replace special chars with space
    .replace(/\s+/g, " ")           // remove redundant spaces
    .trim();
}

export function extractAcronym(name: string): string {
  const norm = normalizeName(name);
  const stopWords = ['de', 'des', 'la', 'le', 'l', 'd', 'et', 'en', 'pour', 'au', 'du', 'sur', 'sous', 'dans', 'of', 'the', 'and', 'for', 'in', 'at', 'on', 'a'];
  const words = norm.split(' ').filter(w => !stopWords.includes(w) && w.length > 0);
  return words.map(w => w[0]).join('').toLowerCase();
}

export function normalizeDomain(url: string): string {
  if (!url) return "";
  let cleanUrl = url.trim().toLowerCase();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = "https://" + cleanUrl;
  }
  try {
    const parsed = new URL(cleanUrl);
    return parsed.hostname.replace(/^www\./, "");
  } catch (e) {
    return cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

export function generateSlug(name: string, city: string = ""): string {
  const norm = normalizeName(name);
  let base = norm.replace(/\s+/g, "-");
  if (city) {
    base += "-" + normalizeName(city).replace(/\s+/g, "-");
  }
  return base;
}

export const institutionService = {
  async getAllInstitutions(filters?: { country?: string; type?: string; city?: string }) {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Institution[];

      if (filters?.country && filters.country !== 'All') {
        results = results.filter(i => i.country === filters.country);
      }
      
      if (filters?.type && filters.type !== 'All') {
        results = results.filter(i => i.type === filters.type as InstitutionType);
      }
      
      if (filters?.city && filters.city !== 'All') {
        results = results.filter(i => i.city === filters.city);
      }

      return results.sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0));
    } catch (error) {
      console.error("Firestore Institutions Query Error:", error);
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async getInstitutionById(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Institution;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  async getByOwnerId(ownerId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('ownerId', '==', ownerId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Institution;
      }
      return null;
    } catch (error) {
      console.error("Error fetching institution by owner:", error);
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  async addInstitution(institution: Omit<Institution, 'id'>) {
    try {
      const normName = normalizeName(institution.name);
      const normDomain = institution.website ? normalizeDomain(institution.website) : "";
      const slug = generateSlug(institution.name, institution.city);
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...institution,
        normalized_name: normName,
        normalized_domain: normDomain,
        slug: slug,
        aliases: institution.aliases || [],
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      throw error;
    }
  },

  async updateInstitution(id: string, data: Partial<Institution>, isAutomatedScript: boolean = false) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = { ...data };
      
      // If this is an automated script, prevent overwriting manually verified fields
      if (isAutomatedScript) {
        const existingData = await this.getInstitutionById(id);
        if (existingData && existingData.isVerified) {
          // Selectively merge: only update fields that are currently empty/null/undefined in the verified record
          // or fields that are lists where we can append non-destructively (optional, keeping it simple to just not overwrite existing scalars)
          Object.keys(data).forEach((key) => {
            const typedKey = key as keyof Institution;
            const existingVal = existingData[typedKey];
            const newVal = data[typedKey];
            
            // Skip overwriting if the existing value is truthy (or explicitly false but defined), 
            // arrays should probably be merged if needed, but for scalar values it's strict:
            if (existingVal !== undefined && existingVal !== null && existingVal !== "" && (Array.isArray(existingVal) ? existingVal.length > 0 : true)) {
              delete updateData[typedKey];
            }
          });
        }
      }

      if (Object.keys(updateData).length === 0) {
        console.log(`Skipped update for ${id} (no new valid automated data to merge)`);
        return;
      }

      if (updateData.name) {
        updateData.normalized_name = normalizeName(updateData.name);
        updateData.slug = generateSlug(updateData.name, updateData.city || "");
      }
      if (updateData.website) {
        updateData.normalized_domain = normalizeDomain(updateData.website);
      }
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      throw error;
    }
  },

  async deleteInstitution(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
      throw error;
    }
  }
};
