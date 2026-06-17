import { Institution, Program, InstitutionType } from "../types";
import { institutionService } from "./institutionService";
import { programService } from "./programService";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

const API_BASE = '/api/gemini';

/**
 * Normalizes a string for comparison (lowercase, no accents, no special chars).
 */
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(universite|university|institut|institute|school|ecole|grande|ecoles|univ|inst|superieur|technique|professionnel|groupe|centre|formation)\b/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export const academicGatheringService = {
  /**
   * Analyzes a text content (from a website) and extracts Institution and Programs data.
   */
  async extractAcademicData(rawContent: string, sourceUrl: string): Promise<{ institution: Partial<Institution>; programs: Partial<Program>[] }> {
    try {
      const response = await fetch(`${API_BASE}/extract-academic-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent, sourceUrl })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to extract academic data");
      }
      return response.json();
    } catch (error: any) {
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

      const { normalizeName, normalizeDomain, generateSlug } = await import("./institutionService");

      // Save crawler log if present
      const logDetails = (data as any)._crawlerLog;
      if (logDetails) {
        try {
          await addDoc(collection(db, 'crawler_logs'), {
            ...logDetails,
            institutionName: data.institution.name,
            timestamp: serverTimestamp()
          });
        } catch (logErr) {
          console.warn("Failed to write crawler log to Firestore:", logErr);
        }
      }

      // 1. Check if institution exists with targeted queries
      const normalizedName = normalizeName(data.institution.name);
      const normalizedDomain = data.institution.website ? normalizeDomain(data.institution.website) : "";
      
      let existingInstDoc = null;

      // Try searching by normalized name
      const nameQuery = query(collection(db, 'institutions'), where('normalized_name', '==', normalizedName));
      const nameSnap = await getDocs(nameQuery);
      
      if (!nameSnap.empty) {
        existingInstDoc = nameSnap.docs[0];
      } else if (normalizedDomain) {
        // Try searching by domain
        const domainQuery = query(collection(db, 'institutions'), where('normalized_domain', '==', normalizedDomain));
        const domainSnap = await getDocs(domainQuery);
        if (!domainSnap.empty) {
          existingInstDoc = domainSnap.docs[0];
        }
      }
      
      let institutionId: string;
      
      if (!existingInstDoc) {
        institutionId = await institutionService.addInstitution({
          ...data.institution,
          logo: data.institution.website ? `https://logo.clearbit.com/${normalizeDomain(data.institution.website)}` : 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
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
        }, true);
      }

      // 2. Add programs with duplicate check per institution
      const existingProgramsQuery = query(collection(db, 'programs'), where('institutionId', '==', institutionId));
      const existingProgramsSnap = await getDocs(existingProgramsQuery);
      const existingProgramNames = new Set(existingProgramsSnap.docs.map(d => normalizeString(d.data().name || '')));

      for (const prog of data.programs) {
        if (!prog.name) continue;
        const normalizedProgName = normalizeString(prog.name);
        
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
      }, true);
      
      return institutionId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'academic_gathering');
      throw error;
    }
  },

  /**
   * Refreshes metadata (programsCount, socialLinks) for a list of institutions.
   */
  async refreshAllInstitutions(onProgress?: (current: number, total: number, lastUpdated: string) => void) {
    const q = query(collection(db, 'institutions'));
    const snap = await getDocs(q);
    
    const results = { updated: 0, failed: 0 };
    const total = snap.docs.length;
    
    for (let i = 0; i < snap.docs.length; i++) {
      const docSnap = snap.docs[i];
      const inst = docSnap.data() as Institution;
      if (onProgress) onProgress(i + 1, total, inst.name);

      try {
        const response = await fetch(`${API_BASE}/refresh-institution`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: inst.name, city: inst.city, country: inst.country })
        });

        if (!response.ok) {
           const err = await response.json();
           throw new Error(err.error || "Failed to refresh");
        }
        
        const updatedData = await response.json();
        await institutionService.updateInstitution(docSnap.id, updatedData, true);
        results.updated++;
      } catch (e: any) {
        console.error(`Failed to refresh ${inst.name}`, e);
        results.failed++;
        if (e.message && e.message.includes('Quota')) {
           throw e;
        }
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
    let mergedCount = 0;

    for (const record of records) {
      // Create unique keys for detection
      const nameKey = `${normalizeString(record.data.name || '')}_${normalizeString(record.data.city || '')}`;
      let websiteKey = '';
      if (record.data.website) {
        try {
          websiteKey = new URL(record.data.website).hostname.replace('www.', '');
        } catch (e) {
          websiteKey = record.data.website.toLowerCase();
        }
      }
      
      let duplicateOf: string | null = null;
      
      // Look for existing match in uniqueMap
      for (const [existingKey, existingRecord] of uniqueMap.entries()) {
        const existingNameKey = `${normalizeString(existingRecord.data.name || '')}_${normalizeString(existingRecord.data.city || '')}`;
        let existingWebsiteKey = '';
        if (existingRecord.data.website) {
          try {
            existingWebsiteKey = new URL(existingRecord.data.website).hostname.replace('www.', '');
          } catch (e) {}
        }

        if (nameKey === existingNameKey || (websiteKey && websiteKey === existingWebsiteKey)) {
          duplicateOf = existingKey;
          break;
        }
      }
      
      if (duplicateOf) {
        const primary = uniqueMap.get(duplicateOf)!;
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
        mergedCount++;
      } else {
        uniqueMap.set(nameKey, record);
      }
    }

    // Update programsCount for all primary institutions
    for (const primary of uniqueMap.values()) {
      const countQuery = query(collection(db, 'programs'), where('institutionId', '==', primary.id));
      const countSnap = await getDocs(countQuery);
      await institutionService.updateInstitution(primary.id, { programsCount: countSnap.size }, true);
    }

    return { removed: mergedCount };
  },

  /**
   * Counts potential duplicates without removing them.
   */
  async countPotentialDuplicates() {
    const q = query(collection(db, 'institutions'));
    const snap = await getDocs(q);
    
    const records = snap.docs.map(doc => doc.data() as Institution);
    const uniqueMap = new Map<string, string>();
    let duplicateCount = 0;

    for (const record of records) {
      const nameKey = `${normalizeString(record.name || '')}_${normalizeString(record.city || '')}`;
      let websiteKey = '';
      if (record.website) {
        try {
          websiteKey = new URL(record.website).hostname.replace('www.', '');
        } catch (e) {}
      }

      let exists = false;
      for (const [existingKey, existingWebsite] of uniqueMap.entries()) {
        if (existingKey === nameKey || (websiteKey && websiteKey === existingWebsite)) {
          exists = true;
          break;
        }
      }

      if (exists) {
        duplicateCount++;
      } else {
        uniqueMap.set(nameKey, websiteKey);
      }
    }
    return duplicateCount;
  }
};
