import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const COLLECTION_NAME = 'useful_links';

export interface UsefulLink {
  id?: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  createdAt?: any;
}

export const usefulLinkService = {
  async getAllLinks(): Promise<UsefulLink[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UsefulLink[];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return [];
    }
  },

  async addLink(link: Omit<UsefulLink, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...link,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  },

  async updateLink(id: string, updates: Partial<UsefulLink>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
      throw error;
    }
  },

  async deleteLink(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
      throw error;
    }
  }
};
