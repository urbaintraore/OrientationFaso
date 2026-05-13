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
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UFR, Department } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase';

const UFR_COLLECTION = 'ufrs';
const DEPT_COLLECTION = 'departments';

export const ufrService = {
  async getUFRsByInstitution(institutionId: string) {
    try {
      const q = query(
        collection(db, UFR_COLLECTION),
        where('institutionId', '==', institutionId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UFR[];
    } catch (error) {
      console.error("Error fetching UFRs:", error);
      handleFirestoreError(error, OperationType.LIST, UFR_COLLECTION);
      return [];
    }
  },

  async addUFR(ufr: Omit<UFR, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, UFR_COLLECTION), {
        ...ufr,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, UFR_COLLECTION);
      throw error;
    }
  },

  async updateUFR(id: string, data: Partial<UFR>) {
    try {
      const docRef = doc(db, UFR_COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, UFR_COLLECTION);
      throw error;
    }
  },

  async deleteUFR(id: string) {
    try {
      await deleteDoc(doc(db, UFR_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, UFR_COLLECTION);
      throw error;
    }
  }
};
