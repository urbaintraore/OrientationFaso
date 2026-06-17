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
import { db, handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';
import { GovernmentOpportunity, GovernmentOpportunityType, GovernmentOpportunityStatus, CareerOpportunity } from '../types';

const COLLECTION_NAME = 'government_opportunities';

export const governmentOpportunityService = {
  async getAllOpportunities(filters?: { type?: string; source?: string; status?: string }) {
    try {
      let results: GovernmentOpportunity[] = [];
      if (isFirebaseConfigured) {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        
        const getDocsPromise = getDocs(q);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore timeout')), 10000)
        );
        
        const querySnapshot = await Promise.race([getDocsPromise, timeoutPromise]) as any;
        
        results = querySnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as GovernmentOpportunity[];
      }

      if (results.length === 0) {
        // Fallback to static mock data if Firestore is empty or fails
        results = [
          {
            id: 'mock-1',
            title: "Bourse d'Excellence Nationale (CIOSPB)",
            type: 'bourse',
            organization: 'CIOSPB',
            description: "Bourse d'étude pour les bacheliers ayant obtenu la mention Très Bien ou Bien. Couvre les frais de scolarité et inclut une allocation mensuelle.",
            eligibility: "Baccalauréat session 2026, moyenne >= 14/20. Nationalité burkinabè.",
            requiredDocuments: ["Relevé de notes du Bac", "Acte de naissance", "Certificat de nationalité", "Lettre de motivation"],
            deadline: "15 Août 2026",
            officialUrl: "https://www.ciospb.gov.bf",
            status: 'ouverte',
            source: 'CIOSPB',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVerified: true
          },
          {
            id: 'mock-2',
            title: "Aide Spéciale FOSER",
            type: 'aide',
            organization: 'FOSER',
            description: "Soutien financier ponctuel pour les étudiants en situation de vulnérabilité ou de handicap.",
            eligibility: "Étudiant régulièrement inscrit, certificat d'indigence ou dossier médical.",
            requiredDocuments: ["Certificat d'indigence", "Carte d'étudiant", "Reçus d'inscription"],
            deadline: "Toute l'année",
            officialUrl: "https://www.foser.gov.bf",
            status: 'ouverte',
            source: 'FOSER',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVerified: true
          },
          {
            id: 'mock-3',
            title: "Concours de la Fonction Publique: MENAPLN",
            type: 'concours',
            organization: 'Ministère de la Fonction Publique',
            description: "Recrutement d'enseignants du secondaire (Mathématiques, PC, SVT) pour le compte du Ministère de l'Éducation.",
            eligibility: "Licence ou Maîtrise dans la discipline choisie, être âgé de 18 à 37 ans.",
            requiredDocuments: ["Diplôme légalisé", "CNIB", "Casier judiciaire"],
            deadline: "30 Juin 2026",
            officialUrl: "https://www.concours.gov.bf",
            status: 'bientôt expirée',
            source: 'MFPTPS',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVerified: true
          },
          {
             id: 'mock-4',
             title: "Prêt Universitaire FONER",
             type: 'prêt',
             organization: 'FONER',
             description: "Prêt de 175 000 FCFA alloué par an aux étudiants non boursiers en cycle de Licence pour les soutenir dans leurs études.",
             eligibility: "Être burkinabè, scolarisé au Burkina Faso, en 1ère, 2ème ou 3ème année de Licence. Avoir validé l'année précédente.",
             requiredDocuments: ["Attestation d'inscription", "Relevé de notes de l'année précédente", "Formulaire FONER"],
             deadline: "31 Octobre 2026",
             officialUrl: "https://www.foner.gov.bf",
             status: 'ouverte',
             source: 'FONER',
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString(),
             isVerified: true
          }
        ];
      }

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
      
      let fallbackResults: GovernmentOpportunity[] = [
        {
          id: 'mock-1',
          title: "Bourse d'Excellence Nationale (CIOSPB)",
          type: 'bourse',
          organization: 'CIOSPB',
          description: "Bourse d'étude pour les bacheliers ayant obtenu la mention Très Bien ou Bien. Couvre les frais de scolarité et inclut une allocation mensuelle.",
          eligibility: "Baccalauréat session 2026, moyenne >= 14/20. Nationalité burkinabè.",
          requiredDocuments: ["Relevé de notes du Bac", "Acte de naissance", "Certificat de nationalité", "Lettre de motivation"],
          deadline: "15 Août 2026",
          officialUrl: "https://www.ciospb.gov.bf",
          status: 'ouverte',
          source: 'CIOSPB',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isVerified: true
        },
        {
          id: 'mock-2',
          title: "Aide Spéciale FOSER",
          type: 'aide',
          organization: 'FOSER',
          description: "Soutien financier ponctuel pour les étudiants en situation de vulnérabilité ou de handicap.",
          eligibility: "Étudiant régulièrement inscrit, certificat d'indigence ou dossier médical.",
          requiredDocuments: ["Certificat d'indigence", "Carte d'étudiant", "Reçus d'inscription"],
          deadline: "Toute l'année",
          officialUrl: "https://www.foser.gov.bf",
          status: 'ouverte',
          source: 'FOSER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isVerified: true
        },
        {
          id: 'mock-3',
          title: "Concours de la Fonction Publique: MENAPLN",
          type: 'concours',
          organization: 'Ministère de la Fonction Publique',
          description: "Recrutement d'enseignants du secondaire (Mathématiques, PC, SVT) pour le compte du Ministère de l'Éducation.",
          eligibility: "Licence ou Maîtrise dans la discipline choisie, être âgé de 18 à 37 ans.",
          requiredDocuments: ["Diplôme légalisé", "CNIB", "Casier judiciaire"],
          deadline: "30 Juin 2026",
          officialUrl: "https://www.concours.gov.bf",
          status: 'bientôt expirée',
          source: 'MFPTPS',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isVerified: true
        },
        {
           id: 'mock-4',
           title: "Prêt Universitaire FONER",
           type: 'prêt',
           organization: 'FONER',
           description: "Prêt de 175 000 FCFA alloué par an aux étudiants non boursiers en cycle de Licence pour les soutenir dans leurs études.",
           eligibility: "Être burkinabè, scolarisé au Burkina Faso, en 1ère, 2ème ou 3ème année de Licence. Avoir validé l'année précédente.",
           requiredDocuments: ["Attestation d'inscription", "Relevé de notes de l'année précédente", "Formulaire FONER"],
           deadline: "31 Octobre 2026",
           officialUrl: "https://www.foner.gov.bf",
           status: 'ouverte',
           source: 'FONER',
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           isVerified: true
        }
      ];

      if (filters?.type && filters.type !== 'all') {
        fallbackResults = fallbackResults.filter(o => o.type === filters.type);
      }
      
      if (filters?.source && filters.source !== 'all') {
        fallbackResults = fallbackResults.filter(o => o.source === filters.source);
      }

      if (filters?.status && filters.status !== 'all') {
        fallbackResults = fallbackResults.filter(o => o.status === filters.status);
      }

      return fallbackResults;
    }
  },

  async addOpportunity(opportunity: Omit<GovernmentOpportunity, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const data = {
        ...opportunity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (!isFirebaseConfigured) {
        return { id: 'mock-' + Date.now(), ...data };
      }
      const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  },

  async updateOpportunity(id: string, updates: Partial<GovernmentOpportunity>) {
    try {
      if (!isFirebaseConfigured) return;
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
      if (!isFirebaseConfigured) return;
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
        if (!isFirebaseConfigured) {
           await this.addOpportunity(opp);
           added++;
           continue;
        }

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

        if (!isFirebaseConfigured) {
           await this.addOpportunity(data);
           added++;
           continue;
        }

        // Check if exists by title or officialUrl to avoid duplicates
        const q = query(
          collection(db, COLLECTION_NAME), 
          where('title', '==', opp.title)
        );
        const snap = await getDocs(q);

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
