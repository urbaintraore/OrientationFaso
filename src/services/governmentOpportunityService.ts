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
  setDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GovernmentOpportunity, GovernmentOpportunityType, GovernmentOpportunityStatus, CareerOpportunity } from '../types';

const COLLECTION_NAME = 'government_opportunities';

export const governmentOpportunityService = {
  async getAllOpportunities(filters?: { type?: string; source?: string; status?: string }) {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GovernmentOpportunity[];

      if (filters?.type && filters.type !== 'all') {
        results = results.filter(o => o.type === filters.type);
      }
      
      if (filters?.source && filters.source !== 'all') {
        results = results.filter(o => o.source === filters.source);
      }

      if (filters?.status && filters.status !== 'all') {
        results = results.filter(o => o.status === filters.status);
      }

      return results;
    } catch (error) {
      console.error("Error fetching government opportunities:", error);
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async addOpportunity(opportunity: Omit<GovernmentOpportunity, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const data = {
        ...opportunity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  },

  async updateOpportunity(id: string, updates: Partial<GovernmentOpportunity>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const data = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, data);
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

  async syncWithSource(source: string, opportunities: Omit<GovernmentOpportunity, 'id' | 'createdAt' | 'updatedAt'>[]) {
    try {
      let added = 0;
      let updated = 0;

      for (const opp of opportunities) {
        // Check if exists by officialUrl
        const q = query(collection(db, COLLECTION_NAME), where('officialUrl', '==', opp.officialUrl));
        const snap = await getDocs(q);

        if (snap.empty) {
          await this.addOpportunity(opp);
          added++;
        } else {
          const existingId = snap.docs[0].id;
          await this.updateOpportunity(existingId, opp);
          updated++;
        }
      }

      return { added, updated };
    } catch (error) {
      console.error(`Error syncing ${source}:`, error);
      throw error;
    }
  },

  async syncCareerOpportunitiesToGov(opportunities: CareerOpportunity[]) {
    try {
      let added = 0;
      let updated = 0;

      for (const opp of opportunities) {
        // Check if exists by title or officialUrl to avoid duplicates
        const q = query(
          collection(db, COLLECTION_NAME), 
          where('title', '==', opp.title)
        );
        const snap = await getDocs(q);

        const data = {
          title: opp.title,
          description: opp.conditions || opp.title,
          organization: opp.organization,
          officialUrl: opp.officialUrl || '',
          deadline: opp.deadline || 'Non renseigné',
          eligibility: opp.requiredDegree || 'Non spécifié',
          requiredDocuments: [],
          type: 'concours' as GovernmentOpportunityType,
          status: 'ouverte' as GovernmentOpportunityStatus,
          pdfUrl: null,
          source: 'CareerSync'
        };

        if (snap.empty) {
          await this.addOpportunity(data);
          added++;
        } else {
          const existingId = snap.docs[0].id;
          await this.updateOpportunity(existingId, data);
          updated++;
        }
      }

      return { added, updated };
    } catch (error) {
      console.error("Error syncing career opportunities:", error);
      throw error;
    }
  }
};
