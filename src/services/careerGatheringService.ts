import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CareerOpportunity } from '../types';
import { crawlCareerOpportunities } from './gemini';

const COLLECTION_NAME = 'career_competitions';

export const careerGatheringService = {
  async getOpportunities(): Promise<CareerOpportunity[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CareerOpportunity));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      throw error;
    }
  },

  async addOpportunity(opp: Omit<CareerOpportunity, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = doc(collection(db, COLLECTION_NAME));
      const now = new Date().toISOString();
      const newOpp = {
        ...opp,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
        isVerified: true
      };
      await setDoc(docRef, newOpp);
      return newOpp;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      throw error;
    }
  },

  async updateOpportunity(id: string, data: Partial<CareerOpportunity>) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
      throw error;
    }
  },

  async deleteOpportunity(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
      throw error;
    }
  },

  async crawlOpportunities(targetKeyword: string = 'concours fonction publique burkina'): Promise<{added: number, addedOpportunities: CareerOpportunity[], error?: string}> {
    try {
      const result = await crawlCareerOpportunities(targetKeyword);
      
      if (!result.opportunities || !Array.isArray(result.opportunities)) {
        return { added: 0, addedOpportunities: [], error: 'Format invalide reçu.' };
      }

      const existing = await this.getOpportunities();
      
      let added = 0;
      const addedOpportunities: CareerOpportunity[] = [];
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const opp of result.opportunities) {
        // Eviter les doublons simples basés sur le titre
        if (!existing.some(e => e.title.toLowerCase() === opp.title.toLowerCase())) {
          const docRef = doc(collection(db, COLLECTION_NAME));
          const newOpp = {
            ...opp,
            id: docRef.id,
            createdAt: now,
            updatedAt: now,
            isVerified: true
          };
          batch.set(docRef, newOpp);
          added++;
          addedOpportunities.push(newOpp);
        }
      }

      if (added > 0) {
        await batch.commit();
      }

      return { added, addedOpportunities };
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Quota') || e.status === 429 || e.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("Quota Gemini dépassé. Veuillez réessayer demain.");
      }
      throw e;
    }
  }
};
