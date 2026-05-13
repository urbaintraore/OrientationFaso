import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Scholarship } from '../types';

const COLLECTION_NAME = 'scholarships';

export const scholarshipService = {
  async getAllScholarships(filters?: { country?: string; degreeLevel?: string; isExpired?: boolean; academicYear?: string; category?: string }) {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      
      const querySnapshot = await getDocs(q);
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Scholarship[];

      // Filtrage côté client
      if (filters?.country && filters.country !== 'all') {
        results = results.filter(s => s.country === filters.country);
      }
      
      if (filters?.degreeLevel && filters.degreeLevel !== 'all') {
        results = results.filter(s => s.degreeLevel === filters.degreeLevel);
      }

      if (filters?.academicYear && filters.academicYear !== 'all') {
        results = results.filter(s => s.academicYear === filters.academicYear);
      }

      if (filters?.category && filters.category !== 'all') {
        results = results.filter(s => s.category === filters.category);
      }
      
      if (filters?.isExpired !== undefined) {
        results = results.filter(s => s.isExpired === filters.isExpired);
      } else {
        // By default, filter out expired ones based on deadline
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        results = results.filter(s => {
          if (!s.deadline) return true;
          const deadlineDate = new Date(s.deadline);
          return deadlineDate >= today;
        });
      }

      // Tri par date de création décroissante
      return results.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error("Firestore Scholarship Query Error:", error);
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async getScholarshipById(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDocs(query(collection(db, COLLECTION_NAME), where('id', '==', id)));
      if (!docSnap.empty) {
        return { id: docSnap.docs[0].id, ...docSnap.docs[0].data() } as Scholarship;
      }
      // Fallback fallback: try direct doc ref
      const directDoc = await getDocs(query(collection(db, COLLECTION_NAME)));
      const found = directDoc.docs.find(d => d.id === id);
      return found ? { id: found.id, ...found.data() } as Scholarship : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  async triggerCrawl() {
    try {
      const response = await fetch('/api/scholarships/crawl', {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Crawl trigger failed:', error);
      throw error;
    }
  },

  async addScholarship(scholarship: Omit<Scholarship, 'id' | 'createdAt'>) {
    try {
      const data = {
        ...scholarship,
        createdAt: new Date().toISOString(),
        isExpired: false
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  }
};
