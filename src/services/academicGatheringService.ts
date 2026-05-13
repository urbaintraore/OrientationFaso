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
      1. Extraire les détails de l'établissement (Nom, Type, Pays, Ville, etc.).
      2. Lister toutes les filières (programmes) détectées.
      3. Compter précisément le nombre de filières.
      4. Déterminer les niveaux (BTS, Licence, Master, Doctorat, PhD).
      5. Associer un score d'employabilité (0-100) et une tendance (Très Forte Demande, etc.) pour chaque filière selon le marché du pays concerné (${sourceUrl}).

      FORMAT JSON ATTENDU :
      {
        "institution": {
          "name": "Nom complet",
          "type": "Université Publique" | "Université Privée" | "Grande École" | "Institut",
          "description": "Résumé d'excellence",
          "city": "Ville réelle",
          "country": "Pays réel",
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
          "degrees": ["Licence", "Master", "PhD", "..."]
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
        model: "gemini-3-flash-preview",
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
      if (!data.institution.name) throw new Error("Nom de l'établissement manquant.");

      // 1. Check if institution exists with a more robust check (normalized name + city)
      const normalizedName = data.institution.name.trim().toLowerCase();
      const institutionsQuery = query(collection(db, 'institutions'));
      const institutionsSnap = await getDocs(institutionsQuery);
      
      let existingInstDoc = institutionsSnap.docs.find(doc => {
        const d = doc.data();
        return (d.name?.trim().toLowerCase() === normalizedName) || 
               (d.website && data.institution.website && d.website.includes(new URL(data.institution.website).hostname));
      });
      
      let institutionId: string;
      
      if (!existingInstDoc) {
        institutionId = await institutionService.addInstitution({
          ...data.institution,
          logo: data.institution.website ? `https://logo.clearbit.com/${new URL(data.institution.website).hostname}` : 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
          coverImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
          isVerified: false,
          tier: 'Free',
          overallRating: 4.0,
          reputationScore: 80,
          employabilityRate: 85,
          accreditations: data.institution.accreditations || ['CAMES'],
          reviews: [],
          gallery: [],
          socialLinks: data.institution.socialLinks || {},
          establishedYear: data.institution.establishedYear || 2000,
          studentCount: data.institution.studentCount || 1000,
          contactEmail: data.institution.email || '',
          contactPhone: data.institution.phone || '',
          country: data.institution.country || 'Burkina Faso'
        } as any);
      } else {
        institutionId = existingInstDoc.id;
        // Update metadata if needed
        await institutionService.updateInstitution(institutionId, { 
          programsCount: Math.max((data.institution.programsCount || 0), (existingInstDoc.data().programsCount || 0)),
          degrees: Array.from(new Set([...(data.institution.degrees || []), ...(existingInstDoc.data().degrees || [])])),
          socialLinks: { ...existingInstDoc.data().socialLinks, ...data.institution.socialLinks }
        });
      }

      // 2. Add programs with duplicate check per institution
      const existingProgramsQuery = query(collection(db, 'programs'), where('institutionId', '==', institutionId));
      const existingProgramsSnap = await getDocs(existingProgramsQuery);
      const existingProgramNames = new Set(existingProgramsSnap.docs.map(d => d.data().name?.trim().toLowerCase()));

      for (const prog of data.programs) {
        if (!prog.name) continue;
        const normalizedProgName = prog.name.trim().toLowerCase();
        
        if (!existingProgramNames.has(normalizedProgName)) {
          await programService.addProgram({
            ...prog,
            institutionId,
            tuitionFee: prog.tuitionFee || 0,
            skills: prog.skills || [],
            averageSalary: prog.averageSalary || 'A discuter',
            admissionCriteria: prog.admissionCriteria || 'Dossier',
            createdAt: new Date().toISOString()
          } as any);
          existingProgramNames.add(normalizedProgName);
        }
      }

      // 3. Update the exact program count on the institution
      const finalCountQuery = query(collection(db, 'programs'), where('institutionId', '==', institutionId));
      const finalCountSnap = await getDocs(finalCountQuery);
      await institutionService.updateInstitution(institutionId, { 
        programsCount: finalCountSnap.size
      });
      
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
          model: "gemini-3-flash-preview",
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
  },

  /**
   * Cleans duplicates in the institutions collection by merging them.
   */
  async cleanDuplicates() {
    const q = query(collection(db, 'institutions'));
    const snap = await getDocs(q);
    
    const records = snap.docs.map(doc => ({ id: doc.id, data: doc.data() as Institution }));
    const uniqueMap = new Map<string, { id: string; data: Institution }>();
    const toDelete: string[] = [];
    let mergedCount = 0;

    for (const record of records) {
      // Create a unique key based on normalized name and city
      const key = `${record.data.name?.trim().toLowerCase()}_${record.data.city?.trim().toLowerCase()}`;
      
      if (uniqueMap.has(key)) {
        const primary = uniqueMap.get(key)!;
        // Merge programs from the duplicate to the primary
        const dupeProgramsQuery = query(collection(db, 'programs'), where('institutionId', '==', record.id));
        const dupeProgramsSnap = await getDocs(dupeProgramsQuery);
        
        for (const pDoc of dupeProgramsSnap.docs) {
          const pData = pDoc.data() as Program;
          // Check if primary already has this program
          const primaryProgramsQuery = query(collection(db, 'programs'), 
            where('institutionId', '==', primary.id),
            where('name', '==', pData.name)
          );
          const primaryProgramsSnap = await getDocs(primaryProgramsQuery);
          
          if (primaryProgramsSnap.empty) {
            await programService.addProgram({ ...pData, institutionId: primary.id });
          }
          // Delete program from duplicate institution
          await programService.deleteProgram(pDoc.id);
        }
        
        // Delete the duplicate institution
        await institutionService.deleteInstitution(record.id);
        toDelete.push(record.id);
        mergedCount++;
      } else {
        uniqueMap.set(key, record);
      }
    }

    // Update programsCount for all primary institutions
    for (const primary of uniqueMap.values()) {
      const countQuery = query(collection(db, 'programs'), where('institutionId', '==', primary.id));
      const countSnap = await getDocs(countQuery);
      await institutionService.updateInstitution(primary.id, { programsCount: countSnap.size });
    }

    return { removed: mergedCount };
  }
};
