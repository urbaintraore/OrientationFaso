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
import { Program } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firebase';

const COLLECTION_NAME = 'programs';

export const programService = {
  async getProgramsByInstitution(institutionId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('institutionId', '==', institutionId)
      );
      const querySnapshot = await getDocs(q);
      const programs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Program[];
      
      // Sort in memory instead of Firestore to avoid composite index requirement
      return programs.sort((a, b) => {
        const dateA = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.seconds * 1000) : 0;
        const dateB = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.seconds * 1000) : 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error("Error fetching programs:", error);
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async addProgram(program: Omit<Program, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...program,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      throw error;
    }
  },

  async updateProgram(id: string, data: Partial<Program>) {
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

  async deleteProgram(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
      throw error;
    }
  }
};
