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
import { Institution, InstitutionType, Program } from '../types';
import { handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';
import { mockInstitutions } from '../data/mockInstitutions';

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
      let results: Institution[] = [];
      const cached = typeof window !== 'undefined' ? localStorage.getItem('orientationbf_cached_institutions_data') : null;
      if (cached) {
        try {
          results = JSON.parse(cached);
        } catch (_) {}
      }

      if (isFirebaseConfigured) {
        try {
          const qInst = query(collection(db, COLLECTION_NAME));
          const getDocsPromise = getDocs(qInst);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore timeout')), 10000)
          );
          const querySnapshot = await Promise.race([getDocsPromise, timeoutPromise]) as any;
          
          const qProgs = query(collection(db, 'programs'));
          const progsSnapshot = await getDocs(qProgs);
          const allPrograms = progsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Program[];

          const dbInstitutions = querySnapshot.docs.map((doc: any) => {
            const instData = doc.data() as Institution;
            const instId = doc.id;
            const instPrograms = allPrograms.filter(p => p.institutionId === instId);
            return {
              id: instId,
              ...instData,
              programs: instPrograms.length > 0 ? instPrograms : (instData.programs || [])
            };
          }) as Institution[];
          
          // Match existing institutions from DB by id or by normalized name
          const dbMap = new Map<string, Institution>();
          dbInstitutions.forEach(inst => {
            dbMap.set(inst.id, inst);
            if (inst.name) {
              dbMap.set(normalizeName(inst.name), inst);
            }
          });

          const merged: Institution[] = [];
          mockInstitutions.forEach(mockInst => {
            const normalizedMock = normalizeName(mockInst.name);
            const dbVer = dbMap.get(mockInst.id) || dbMap.get(normalizedMock);
            
            if (dbVer) {
              merged.push({
                ...mockInst,
                ...dbVer,
                programs: dbVer.programs && dbVer.programs.length > 0 ? dbVer.programs : mockInst.programs
              });
              dbMap.delete(dbVer.id);
              if (dbVer.name) dbMap.delete(normalizeName(dbVer.name));
            } else {
              merged.push(mockInst);
            }
          });

          dbMap.forEach(dbInst => {
            if (dbInst.name) {
              merged.push(dbInst);
            }
          });

          if (merged.length > 0) {
            results = merged;
            if (typeof window !== 'undefined') {
              localStorage.setItem('orientationbf_cached_institutions_data', JSON.stringify(merged));
            }
          }
        } catch (err) {
          console.error("Failed to fetch fresh institutions from Firestore, using cache/mock:", err);
        }
      }

      if (results.length === 0) {
        results = mockInstitutions;
      }

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
      return mockInstitutions.sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0));
    }
  },

  async getInstitutionById(id: string) {
    try {
      if (isFirebaseConfigured) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        
        const qProgs = query(collection(db, 'programs'), where('institutionId', '==', id));
        const progsSnapshot = await getDocs(qProgs);
        const instPrograms = progsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Program[];

        if (docSnap.exists()) {
          const instData = docSnap.data() as Institution;
          return { 
            id: docSnap.id, 
            ...instData,
            programs: instPrograms.length > 0 ? instPrograms : (instData.programs || [])
          } as Institution;
        }
      }
      
      const foundMock = mockInstitutions.find(inst => inst.id === id);
      if (foundMock) {
        return {
          ...foundMock,
          programs: foundMock.programs
        } as Institution;
      }
      return null;
    } catch (error) {
      console.warn("Error getting institution by id, trying mock fallback:", error);
      const foundMock = mockInstitutions.find(inst => inst.id === id);
      if (foundMock) return foundMock;
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  async getByOwnerId(ownerId: string) {
    try {
      if (!isFirebaseConfigured) return null;
      const q = query(
        collection(db, COLLECTION_NAME),
        where('ownerId', '==', ownerId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const instId = docSnap.id;
        const instData = docSnap.data() as Institution;
        
        const qProgs = query(collection(db, 'programs'), where('institutionId', '==', instId));
        const progsSnapshot = await getDocs(qProgs);
        const instPrograms = progsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Program[];

        return { 
          id: instId, 
          ...instData,
          programs: instPrograms.length > 0 ? instPrograms : (instData.programs || [])
        } as Institution;
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orientationbf_cached_institutions_data');
      }
      const normName = normalizeName(institution.name);
      const normDomain = institution.website ? normalizeDomain(institution.website) : "";
      const slug = generateSlug(institution.name, institution.city);
      if (!isFirebaseConfigured) return 'mock-' + Date.now();
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
      if (!isFirebaseConfigured) return;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orientationbf_cached_institutions_data');
      }
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
      if (!isFirebaseConfigured) return;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orientationbf_cached_institutions_data');
      }
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
      throw error;
    }
  }
};
