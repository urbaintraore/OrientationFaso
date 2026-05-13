import { GoogleGenAI, Type } from "@google/genai";
import { Institution, Program, InstitutionType } from "../types";
import { institutionService } from "./institutionService";
import { programService } from "./programService";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '';
    if (!apiKey) throw new Error("Clé API Gemini introuvable.");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export const academicGatheringService = {
  /**
   * Analyzes a text content (from a website) and extracts Institution and Programs data.
   */
  async extractAcademicData(rawContent: string, sourceUrl: string): Promise<{ institution: Partial<Institution>; programs: Partial<Program>[] }> {
    const prompt = `
      Tu es un extracteur de données académiques intelligent. Analyse le contenu texte suivant provenant d'un site web universitaire (${sourceUrl}) et extrait les informations structurées.
      
      CONTENU :
      ${rawContent}
      
      MISSION :
      1. Extraire les détails de l'établissement.
      2. Lister toutes les filières (programmes) détectées.
      3. Compter précisément le nombre de filières.
      4. Déterminer les niveaux (BTS, Licence, Master, Doctorat).
      5. Associer un score d'employabilité (0-100) et une tendance (Très Forte Demande, etc.) pour chaque filière selon le marché du Burkina Faso.

      FORMAT JSON ATTENDU :
      {
        "institution": {
          "name": "Nom complet",
          "type": "Université Publique" | "Université Privée" | "Grande École" | "Institut",
          "description": "Résumé",
          "city": "Ville (Burkina Faso)",
          "address": "...",
          "phone": "...",
          "email": "...",
          "website": "${sourceUrl}",
          "socialLinks": {
            "facebook": "...",
            "linkedin": "...",
            "twitter": "...",
            "instagram": "..."
          },
          "programsCount": 123,
          "degrees": ["BTS", "Licence", "..."]
        },
        "programs": [
          {
            "name": "Nom filière",
            "field": "Domaine (Informatique, Droit...)",
            "degreeLevel": "Licence",
            "duration": "3 ans",
            "description": "...",
            "careerOpportunities": ["Métier 1", "..."],
            "employmentTrend": "Très Forte Demande",
            "employmentScore": 95
          }
        ]
      }
    `;

    try {
      const response = await getAiClient().models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || '{}');
      return data;
    } catch (error) {
      console.error("Extraction error:", error);
      throw error;
    }
  },

  /**
   * Saves crawled data to Firestore.
   */
  async saveCrawledData(data: { institution: Partial<Institution>; programs: Partial<Program>[] }) {
    try {
      // 1. Check if institution exists
      const q = query(collection(db, 'institutions'), where('name', '==', data.institution.name));
      const snap = await getDocs(q);
      
      let institutionId: string;
      
      if (snap.empty) {
        institutionId = await institutionService.addInstitution({
          ...data.institution,
          logo: `https://logo.clearbit.com/${new URL(data.institution.website || '').hostname}`,
          coverImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
          isVerified: false,
          tier: 'Free',
          overallRating: 4.0,
          reputationScore: 80,
          employabilityRate: 85,
          accreditations: ['CAMES'],
          reviews: [],
          gallery: [],
          socialLinks: {},
          establishedYear: 2000,
          studentCount: 1000,
          contactEmail: data.institution.email || '',
          contactPhone: data.institution.phone || '',
          country: 'Burkina Faso'
        } as any);
      } else {
        institutionId = snap.docs[0].id;
        // Update counts if needed
        await institutionService.updateInstitution(institutionId, { 
          programsCount: data.institution.programsCount,
          degrees: data.institution.degrees,
          socialLinks: data.institution.socialLinks || snap.docs[0].data().socialLinks
        });
      }

      // 2. Add programs
      for (const prog of data.programs) {
        const pq = query(collection(db, 'programs'), 
          where('institutionId', '==', institutionId), 
          where('name', '==', prog.name)
        );
        const psnap = await getDocs(pq);
        if (psnap.empty) {
          await programService.addProgram({
            ...prog,
            institutionId,
            tuitionFee: 0,
            skills: [],
            averageSalary: 'A discuter',
            admissionCriteria: 'Dossier',
            createdAt: new Date().toISOString()
          } as any);
        }
      }
      
      return institutionId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'academic_gathering');
      throw error;
    }
  },

  /**
   * Refreshes metadata (programsCount, socialLinks) for a list of institutions.
   */
  async refreshAllInstitutions() {
    const q = query(collection(db, 'institutions'));
    const snap = await getDocs(q);
    
    const results = { updated: 0, failed: 0 };
    
    for (const docSnap of snap.docs) {
      const inst = docSnap.data() as Institution;
      try {
        // Use Gemini to find social links and exact program count if not already accurate
        const prompt = `Recherche les informations officielles mis à jour pour l'établissement "${inst.name}" à ${inst.city}, ${inst.country}.
        Donne :
        1. Le nombre exact de filières proposées actuellement.
        2. Les liens officiels : Site web, Page Facebook, LinkedIn, Instagram.
        
        FORMAT JSON :
        {
          "programsCount": number,
          "website": "string",
          "socialLinks": {
            "facebook": "string",
            "linkedin": "string",
            "instagram": "string"
          }
        }`;

        const response = await getAiClient().models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const updatedData = JSON.parse(response.text || '{}');
        await institutionService.updateInstitution(docSnap.id, updatedData);
        results.updated++;
      } catch (e) {
        console.error(`Failed to refresh ${inst.name}`, e);
        results.failed++;
      }
    }
    return results;
  }
};
