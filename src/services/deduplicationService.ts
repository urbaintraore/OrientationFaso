import { institutionService } from './institutionService';
import { programService } from './programService';
import { db } from '../lib/firebase';
import { Institution } from '../types';
import { doc, writeBatch, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export interface DuplicateCluster {
  master: Institution;
  duplicates: Institution[];
  confidence: number;
  reason: string;
}

// Distance de Levenshtein
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalizeAndGenerateAcronym(name: string): { normalized: string; acronym: string; cleaned: string } {
  let normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Acronym generation (e.g. université joseph ki zerbo -> ujkz)
  const stopWords = ['de', 'des', 'la', 'le', 'l', 'd', 'et', 'en', 'pour', 'au'];
  const words = normalized.split(' ').filter(w => !stopWords.includes(w) && w.length > 0);
  const acronym = words.map(w => w[0]).join('');

  // Cleaned name (remove generic words for matching)
  const genericWords = ['universite', 'institut', 'ecole', 'superieur', 'superieure', 'centre', 'formation', 'privee', 'prive', 'publique'];
  const cleaned = words.filter(w => !genericWords.includes(w)).join(' ');

  return { normalized, acronym, cleaned };
}

function calculateSimilarity(a: string, b: string): number {
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return ((maxLen - dist) / maxLen) * 100;
}

export const deduplicationService = {
  /**
   * Vérifie la similarité d'un nouveau nom avec la base existante
   */
  async checkSimilarName(name: string): Promise<Institution[]> {
    const allInstitutions = await institutionService.getAllInstitutions();
    const newNlp = normalizeAndGenerateAcronym(name);
    
    const similar: Institution[] = [];
    for (const inst of allInstitutions) {
      if (inst.name === name) {
        similar.push(inst);
        continue;
      }
      
      const nlp = normalizeAndGenerateAcronym(inst.name);
      if (nlp.normalized === newNlp.normalized) {
        similar.push(inst);
      } else if ((nlp.acronym === newNlp.normalized && nlp.acronym.length > 2) || 
                 (newNlp.acronym === nlp.normalized && newNlp.acronym.length > 2)) {
        similar.push(inst);
      } else {
        const sim = calculateSimilarity(nlp.cleaned, newNlp.cleaned);
        if (sim > 85) {
          similar.push(inst);
        }
      }
    }
    return similar;
  },

  /**
   * Analyse et retourne des clusters de doublons potentiels
   */
  async findDuplicates(): Promise<DuplicateCluster[]> {
    const allInstitutions = await institutionService.getAllInstitutions();
    const clusters: DuplicateCluster[] = [];
    const processedIds = new Set<string>();

    const enriched = allInstitutions.map(inst => ({
      ...inst,
      nlp: normalizeAndGenerateAcronym(inst.name)
    }));

    for (let i = 0; i < enriched.length; i++) {
      const instA = enriched[i];
      if (processedIds.has(instA.id)) continue;

      const currentCluster: Institution[] = [];
      let bestConfidence = 0;
      let clusterReason = '';

      for (let j = i + 1; j < enriched.length; j++) {
        const instB = enriched[j];
        if (processedIds.has(instB.id)) continue;

        let isMatch = false;
        let confidence = 0;
        let reason = '';

        // 1. Same normalized name
        if (instA.nlp.normalized === instB.nlp.normalized) {
          isMatch = true; confidence = 100; reason = "Nom exact identique";
        } 
        // 2. Acronym match against full name or vice-versa (e.g. ISIG == Institut ...)
        else if ((instA.nlp.acronym === instB.nlp.normalized && instA.nlp.acronym.length > 2) || 
                 (instB.nlp.acronym === instA.nlp.normalized && instB.nlp.acronym.length > 2)) {
          isMatch = true; confidence = 95; reason = "Correspondance Acronyme <-> Nom";
        }
        else if (instA.nlp.acronym === instB.nlp.acronym && instA.nlp.acronym.length > 3) {
          // If acronyms match and they are long enough (prevent Univ. A & Univ B matching)
           if (calculateSimilarity(instA.nlp.cleaned, instB.nlp.cleaned) > 60) {
             isMatch = true; confidence = 85; reason = "Même acronyme et mots clés similaires";
           }
        }
        // 3. Very high fuzzy match on cleaned words
        else {
          const sim = calculateSimilarity(instA.nlp.cleaned, instB.nlp.cleaned);
          if (sim > 85 && instA.type === instB.type) {
            isMatch = true; confidence = sim; reason = "Noms structurellement similaires";
          }
        }

        if (isMatch) {
          currentCluster.push(allInstitutions[j]);
          processedIds.add(instB.id);
          if (confidence > bestConfidence) {
            bestConfidence = Math.round(confidence);
            clusterReason = reason;
          }
        }
      }

      if (currentCluster.length > 0) {
        processedIds.add(instA.id);
        // Master choice: the one with the most data or longest name
        const clusterAll = [allInstitutions[i], ...currentCluster];
        clusterAll.sort((a, b) => {
          let scoreA = (a.description?.length || 0) + (a.programsCount || 0) * 100 + (a.name.length);
          let scoreB = (b.description?.length || 0) + (b.programsCount || 0) * 100 + (b.name.length);
          return scoreB - scoreA;
        });

        clusters.push({
          master: clusterAll[0],
          duplicates: clusterAll.slice(1),
          confidence: bestConfidence,
          reason: clusterReason
        });
      }
    }

    return clusters;
  },

  /**
   * Fusionner un ensemble d'établissements dans le master
   */
  async mergeInstitutions(masterId: string, duplicateIds: string[]) {
    // We use a batched write to make sure relations update consistently
    const batch = writeBatch(db);
    
    // 1. Get all programs related to duplicates and change their institutionId
    for (const dupId of duplicateIds) {
      const pQuery = query(collection(db, 'programs'), where('institutionId', '==', dupId));
      const pDocs = await getDocs(pQuery);
      pDocs.forEach(docSnap => {
        batch.update(docSnap.ref, { institutionId: masterId });
      });
      
      // 2. Add an alias field in the master to prevent recreating duplicates (optional but good practice)
      // Done outside loop, see below
    }

    // 3. Fetch duplicate institutions to merge their arrays (accreditations, degrees) and views if needed
    const masterRef = doc(db, 'institutions', masterId);
    let masterData: any;
    try {
      const docSnap = await institutionService.getInstitutionById(masterId);
      masterData = docSnap;
    } catch(e) {}
    
    let combinedAccreditations = new Set(masterData?.accreditations || []);
    let combinedDegrees = new Set(masterData?.degrees || []);
    let newAliases = new Set(masterData?.aliases || []);

    for (const dupId of duplicateIds) {
      const dupData = await institutionService.getInstitutionById(dupId);
      if (dupData) {
        (dupData.accreditations || []).forEach(a => combinedAccreditations.add(a));
        (dupData.degrees || []).forEach(a => combinedDegrees.add(a));
        newAliases.add(dupData.name);
        
        // Delete the duplicate document
        batch.delete(doc(db, 'institutions', dupId));
      }
    }

    // Update master
    batch.update(masterRef, {
      accreditations: Array.from(combinedAccreditations),
      degrees: Array.from(combinedDegrees),
      aliases: Array.from(newAliases),
      description: masterData?.description || "",
      city: masterData?.city || "",
      country: masterData?.country || "Burkina Faso",
      website: masterData?.website || ""
    });

    await batch.commit();
  }
};
