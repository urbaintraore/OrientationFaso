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
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...institution,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      throw error;
    }
  },

  async updateInstitution(id: string, data: Partial<Institution>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
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
