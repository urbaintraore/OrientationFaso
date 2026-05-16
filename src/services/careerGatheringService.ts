import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CareerOpportunity } from '../types';
import { getAiClient } from './gemini';

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

  async crawlOpportunities(targetKeyword: string = 'concours fonction publique burkina'): Promise<{added: number, error?: string}> {
    const prompt = `
      Tu es un agent d'intelligence économique spécialisé dans les carrières publiques et parapubliques au Burkina Faso.
      Recherche les informations actuelles sur Internet (ou utilise ta base de données récente) pour le sujet : "${targetKeyword}".
      Cherche les concours de la fonction publique, les recrutements des sociétés d'État (SONABEL, ONEA, SONABHY, ONATEL, etc.) et les grandes opportunités.

      Tu dois renvoyer UNIQUEMENT un JSON contenant un tableau d'opportunités, avec ce format :
      {
        "opportunities": [
          {
            "title": "Nom complet du concours ou du poste",
            "type": "concours", // ou "recrutement_societe_etat" ou "autre"
            "organization": "Ex: Ministère de la Fonction Publique, SONABEL",
            "requiredDegree": "Ex: BAC, Licence, Master",
            "compatibleFields": ["Informatique", "Droit", "Gestion", "Génie Civil"],
            "positionsCount": 10, // Nombre. Mets 0 si inconnu
            "conditions": "Conditions particulières ou d'aptitude",
            "ageLimit": "18 à 37 ans",
            "documentsRequired": ["Extrait de naissance", "Diplôme"],
            "deadline": "Période de dépôt ou date exacte",
            "officialUrl": "Lien vers la source officielle ou site d'information pertinent",
            "status": "ouvert" // ou "bientôt ouvert" ou "expiré"
          }
        ]
      }
      
      Assure-toi de lister au moins 5 opportunités pertinentes.
    `;

    try {
      const response = await getAiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        }
      });

      const result = JSON.parse(response.text || '{"opportunities": []}');
      
      if (!result.opportunities || !Array.isArray(result.opportunities)) {
        return { added: 0, error: 'Format invalide reçu.' };
      }

      const existing = await this.getOpportunities();
      
      let added = 0;
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const opp of result.opportunities) {
        // Eviter les doublons simples basés sur le titre
        if (!existing.some(e => e.title.toLowerCase() === opp.title.toLowerCase())) {
          const docRef = doc(collection(db, COLLECTION_NAME));
          batch.set(docRef, {
            ...opp,
            id: docRef.id,
            createdAt: now,
            updatedAt: now,
            isVerified: true
          });
          added++;
        }
      }

      if (added > 0) {
        await batch.commit();
      }

      return { added };
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Quota') || e.status === 429 || e.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("Quota Gemini dépassé. Veuillez réessayer demain.");
      }
      throw e;
    }
  }
};
