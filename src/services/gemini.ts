import { GoogleGenAI, Type } from "@google/genai";
import { StudentProfile, AnalysisResult, PostBacProfile, UniversityAnalysisResult, Scholarship } from "../types";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    // In this environment, process.env.GEMINI_API_KEY is injected by the platform
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '';
    
    if (!apiKey) {
      throw new Error("Clé API Gemini introuvable (GEMINI_API_KEY).");
    }
    
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function parseResponse<T>(text: string): T {
  try {
    // First try: direct parse
    return JSON.parse(text.trim()) as T;
  } catch (e) {
    try {
      // Second try: remove markdown code blocks and trailing/leading garbage
      const cleaned = text.replace(/```json\n?|```/g, '').trim();
      // Find the first [ and last ] or first { and last }
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      let targetJson = cleaned;
      
      if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        targetJson = cleaned.substring(firstBracket, lastBracket + 1);
      } else if (firstBrace !== -1 && lastBrace !== -1) {
        targetJson = cleaned.substring(firstBrace, lastBrace + 1);
      }
      
      return JSON.parse(targetJson) as T;
    } catch (e2) {
      console.error("Critical JSON Parse Error. Raw text:", text);
      throw new Error("Impossible de lire les données envoyées par l'IA.");
    }
  }
}

export async function analyzeProfile(profile: StudentProfile): Promise<AnalysisResult> {
  const prompt = `
    Tu es une plateforme intelligente d’orientation scolaire au Burkina Faso.
    Ta mission est d’analyser les données académiques complètes d’un élève et de produire un rapport structuré comprenant :

    1. Analyse statistique des performances (Régularité, Dominance, Progression)
    2. Diagnostic académique (Points forts, points faibles, potentiel)
    3. Recommandation de série après BEPC (Basée sur les notes et le profil)
    4. Projection de réussite au Bac (Probabilité de succès et de mention)
    5. Orientation universitaire adaptée (Filières potentielles après le Bac)
    6. Débouchés professionnels au Burkina Faso (Métiers d'avenir locaux)
    7. Motivation détaillée : Explique clairement pourquoi cette série est recommandée en te basant sur ses points forts spécifiques.

    Profil de l'élève :
    Nom: ${profile.name}
    Âge: ${profile.age}
    École: ${profile.school}
    
    Notes historiques (Moyennes annuelles par matière):
    ${profile.gradesHistory.map(y => `
      Classe: ${y.level}
      Moyenne Générale: ${y.average}
      Notes: ${y.grades.map(g => `${g.subject}: ${g.grade}/20`).join(', ')}
    `).join('\n')}

    Notes du BEPC (Estimées ou Réelles):
    Moyenne BEPC: ${profile.bepcAverage}
    Détails: ${profile.bepcGrades.map(g => `${g.subject}: ${g.grade}/20`).join(', ')}

    Choix exprimé par l'élève : ${profile.preferredSeries}
    Motivation personnelle : ${profile.motivation}
    Centres d'intérêt : ${profile.hobbies}

    Séries disponibles au Burkina Faso :
    - Enseignement Général : 
      - Série A (Lettres - Philosophie - Arts)
      - Série C (Mathématiques - Sciences Physiques)
      - Série D (Mathématiques - Sciences de la Nature)
    - Enseignement Technique : 
      - Série E (Mathématiques et Technique)
      - Série F1 (Construction Mécanique)
      - Série F2 (Électronique)
      - Série F3 (Électrotechnique)
      - Série F4 (Génie Civil)
      - Série G2 (Techniques Quantitatives de Gestion - Comptabilité)
      - Série G3 (Techniques Commerciales)

    Méthodologie d'analyse :
    1. Calcule un score de compatibilité (0-100) pour chaque série basée sur les notes (Maths/PC pour C/D/E/F, Français/Anglais/HG pour A/G).
    2. Analyse la régularité (écart-type implicite), la dominance (matières fortes vs faibles) et la progression (évolution 6ème -> 3ème).
    3. Estime la probabilité de succès au BAC et d'une mention.
    4. Identifie des débouchés spécifiques au contexte économique du Burkina Faso.

    Format de réponse JSON attendu :
    {
      "recommendedSeries": "Nom de la série idéale",
      "top3Series": [
        { "series": "Série 1", "score": 85, "matchReason": "Pourquoi ce choix" },
        { "series": "Série 2", "score": 70, "matchReason": "Pourquoi ce choix" },
        { "series": "Série 3", "score": 60, "matchReason": "Pourquoi ce choix" }
      ],
      "bacSuccessProbability": 85,
      "bacMentionProbability": 40,
      "motivationMessage": "Explication détaillée et motivante du choix de la série recommandée, mettant en avant les atouts de l'élève.",
      "risks": ["Risque 1", "Risque 2"],
      "improvementTips": ["Conseil 1", "Conseil 2"],
      "analysis": {
        "regularity": "Analyse de la régularité des performances",
        "dominance": "Analyse des matières dominantes",
        "progression": "Analyse de la progression académique"
      },
      "testimonials": [
        { "author": "Nom Prénom", "role": "Métier ou Étudiant en ...", "quote": "Citation inspirante liée à la série recommandée..." }
      ],
      "usefulLinks": [
        { "title": "Titre du lien", "url": "URL pertinente (ex: site du ministère, université, etc.)" }
      ],
      "projectedBacAverage": 12.5,
      "suitableUniversityMajors": ["Filière Universitaire 1", "Filière Universitaire 2", "Filière Universitaire 3"],
      "futureJobOpportunities": ["Métier 1 (Burkina)", "Métier 2 (Burkina)"],
      "estimatedIncomeLevel": "Moyen / Élevé / Très Élevé"
    }
  `;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedSeries: { type: Type.STRING },
            top3Series: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  series: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  matchReason: { type: Type.STRING },
                }
              }
            },
            bacSuccessProbability: { type: Type.NUMBER },
            bacMentionProbability: { type: Type.NUMBER },
            motivationMessage: { type: Type.STRING },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            analysis: {
              type: Type.OBJECT,
              properties: {
                regularity: { type: Type.STRING },
                dominance: { type: Type.STRING },
                progression: { type: Type.STRING },
              }
            },
            testimonials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  author: { type: Type.STRING },
                  role: { type: Type.STRING },
                  quote: { type: Type.STRING },
                }
              }
            },
            usefulLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                }
              }
            },
            projectedBacAverage: { type: Type.NUMBER },
            suitableUniversityMajors: { type: Type.ARRAY, items: { type: Type.STRING } },
            futureJobOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedIncomeLevel: { type: Type.STRING }
          }
        }
      }
    });

    console.log("Raw API Response (BEPC):", response.text);

    if (response.text) {
      return parseResponse<AnalysisResult>(response.text);
    }
    
    throw new Error("Failed to generate analysis: empty response");
  } catch (error: any) {
    console.error("Gemini API Error (BEPC):", error);
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
      throw new Error("Quota Gemini dépassé. Veuillez patienter ou utiliser une clé API avec facturation activée dans les Paramètres > Secrets.");
    }
    throw new Error(`Erreur API Gemini: ${error.message || "Erreur inconnue"}`);
  }
}

export async function analyzePostBacProfile(profile: PostBacProfile): Promise<UniversityAnalysisResult> {
  const prompt = `
    Tu es une plateforme d’orientation universitaire intelligente au Burkina Faso.
    Ta mission est d’analyser le profil post-BAC d'un élève pour lui recommander les meilleures filières universitaires.

    Profil de l'élève :
    Nom: ${profile.name}
    Série du Bac: ${profile.bacSeries}
    Moyenne au Bac: ${profile.bacAverage}
    
    Notes historiques (Seconde à Terminale):
    ${profile.gradesHistory.map(y => `
      Classe: ${y.level}
      Moyenne Générale: ${y.average}
      Notes: ${y.grades.map(g => `${g.subject}: ${g.grade}/20`).join(', ')}
    `).join('\n')}

    Notes du Bac (Détails):
    ${profile.bacGrades.map(g => `${g.subject}: ${g.grade}/20`).join(', ')}

    Matières dominantes (à déduire des notes).
    Motivation de l’élève : ${profile.motivation}
    Centres d'intérêt : ${profile.hobbies}
    Domaines préférés : ${profile.preferredFields}

    🎓 FILIÈRES À CONSIDÉRER (MAXIMUM COUVERTURE) :
    - Sciences & Technologies (Maths, Physique, Chimie, Info, Génie civil/électrique/énergétique/industriel, Mines, Télécoms, IA, Data science)
    - Santé (Médecine, Pharmacie, Odonto, Soins infirmiers, Sage-femme, Santé publique, Biologie médicale)
    - Agriculture & Environnement (Agronomie, Zootechnie, Eaux et forêts, Gestion env., Dév. rural)
    - Économie & Gestion (Compta, Finance, Audit, Banque, Assurance, Gestion, Logistique, Marketing, Commerce int.)
    - Droit & Sciences sociales (Droit public/privé, Sc. Po, RI, Socio, Histoire, Géo)
    - Lettres & Communication (Lettres, Langues, Com, Journalisme, Traduction)
    - Arts & Création (Design, Archi, Arts plastiques, Cinéma)
    - Filières Professionnelles (BTS, Licences pro, Gestion projets, Maintenance, Réseaux)

    Méthode d'analyse :
    1. Évaluer la compatibilité série ↔ filière (ex: Bac C -> Sciences, Bac A -> Lettres/Droit).
    2. Analyser les notes clés pour chaque filière.
    3. Calculer un score d’adéquation pour les filières les plus pertinentes.
    4. Estimer la probabilité de réussite universitaire.
    5. Identifier des débouchés réalistes et porteurs au Burkina Faso et dans le monde.
    6. Citer au moins 10 filières possibles.
    7. Citer au moins 5 universités publiques au Burkina et 5 privées.
    8. Citer au moins 10 universités en Afrique, 10 en Europe, 10 aux USA, 10 en Asie, 10 au Canada.
    9. Citer au moins 10 débouchés possibles.

    Format de réponse JSON attendu :
    {
      "recommendedMajors": [
        { "major": "Nom de la filière", "score": 90, "matchReason": "Pourquoi..." }
      ],
      "successProbability": 80,
      "justification": "Explication détaillée...",
      "opportunities": [
        {
          "title": "Titre du métier",
          "description": "Brève description",
          "requiredSkills": ["Compétence 1", "Compétence 2"],
          "averageSalary": "Salaire moyen estimé (FCFA ou Euro)",
          "demandLevel": "Très élevée | Élevée | Moyenne",
          "automationRisk": "Faible | Moyen | Élevé",
          "internationalOpportunities": "Description des opportunités mondiales",
          "jobVideoUrl": "https://www.youtube.com/results?search_query=découvrir+le+métier+de+[NOM DU METIER] (Obligatoire : générez un lien de RECHERCHE YouTube, n'inventez pas de lien watch?v=)",
          "careerRoadmap": ["Étape 1", "Étape 2", "Étape 3"]
        }
      ], // Au moins 5 débouchés détaillés
      "employabilityRating": "Élevée/Moyenne/Faible",
      "strategicAdvice": ["Conseil 1", "Conseil 2"],
      "testimonials": [...],
      "usefulLinks": [...],
      "universities": {
        "burkinaPublic": ["Université 1", "Université 2", ...], // Au moins 5
        "burkinaPrivate": ["Université 1", "Université 2", ...], // Au moins 5
        "africa": ["Université 1", ...], // Au moins 10
        "europe": ["Université 1", ...], // Au moins 10
        "usa": ["Université 1", ...], // Au moins 10
        "asia": ["Université 1", ...], // Au moins 10
        "canada": ["Université 1", ...] // Au moins 10
      }
    }
  `;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedMajors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  major: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  matchReason: { type: Type.STRING },
                }
              }
            },
            successProbability: { type: Type.NUMBER },
            justification: { type: Type.STRING },
            opportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  averageSalary: { type: Type.STRING },
                  demandLevel: { type: Type.STRING },
                  automationRisk: { type: Type.STRING },
                  internationalOpportunities: { type: Type.STRING },
                  jobVideoUrl: { type: Type.STRING },
                  careerRoadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
              }
            },
            employabilityRating: { type: Type.STRING },
            strategicAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
            testimonials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  author: { type: Type.STRING },
                  role: { type: Type.STRING },
                  quote: { type: Type.STRING },
                }
              }
            },
            usefulLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                }
              }
            },
            universities: {
              type: Type.OBJECT,
              properties: {
                burkinaPublic: { type: Type.ARRAY, items: { type: Type.STRING } },
                burkinaPrivate: { type: Type.ARRAY, items: { type: Type.STRING } },
                africa: { type: Type.ARRAY, items: { type: Type.STRING } },
                europe: { type: Type.ARRAY, items: { type: Type.STRING } },
                usa: { type: Type.ARRAY, items: { type: Type.STRING } },
                asia: { type: Type.ARRAY, items: { type: Type.STRING } },
                canada: { type: Type.ARRAY, items: { type: Type.STRING } },
              }
            }
          }
        }
      }
    });

    console.log("Raw API Response (BAC):", response.text);

    if (response.text) {
      return parseResponse<UniversityAnalysisResult>(response.text);
    }
    
    throw new Error("Failed to generate university analysis: empty response");
  } catch (error: any) {
    console.error("Gemini API Error (BAC):", error);
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
      throw new Error("Quota Gemini dépassé. Veuillez patienter ou utiliser une clé API avec facturation activée.");
    }
    throw new Error(`Erreur API Gemini: ${error.message || "Erreur inconnue"}`);
  }
}

export async function analyzeScholarship(rawContent: string): Promise<Partial<Scholarship>> {
  const prompt = `
    Tu es un analyste expert en bourses d'études internationales, spécialisé pour les étudiants africains.
    Analyse le contenu suivant et extrait les données structurées.
    
    CONTENU :
    ${rawContent}
    
    RECOUVREMENT DES DONNÉES :
    - Titre clair
    - Pays de destination
    - Organisation donatrice
    - Niveau d'étude (Licence, Master, Doctorat)
    - Domaines d'études concernés (array)
    - Date limite de candidature (Format ISO YYYY-MM-DD)
    - Type de financement (Full ou Partial)
    - Résumé IA : un texte de 2-3 phrases expliquant pourquoi cette bourse est une opportunité.
    - Difficulté : Très accessible, Compétitif, Élite.
    - Admissibilité : Est-ce ouvert aux Burkinabè et Africains ?
    
    Format JSON attendu :
    {
      "title": string,
      "country": string,
      "organization": string,
      "degreeLevel": string,
      "field": string[],
      "deadline": string,
      "fundingType": "Full" | "Partial",
      "summaryAI": string,
      "difficultyScore": "Très accessible" | "Compétitif" | "Élite",
      "isForAfricans": boolean,
      "isForBurkina": boolean
    }
  `;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return parseResponse<Partial<Scholarship>>(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error: any) {
    console.error("Gemini Scholarship Analysis Error:", error);
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
      throw new Error("Quota Gemini dépassé pour l'analyse de bourse.");
    }
    throw error;
  }
}

export async function crawlInstitutions(region: string): Promise<any[]> {
  console.log(`[IA-FEED] Lancement de l'exploration pour: ${region}`);
  const prompt = `
    Tu es un crawler intelligent spécialisé dans l'éducation mondiale (Afrique, Europe, Amérique, Asie).
    Génère une liste de 15 institutions d'enseignement supérieur (Universités, Écoles, Instituts) RÉELLES pour la région ou le pays : ${region}.
    
    INSTRUCTIONS SPÉCIFIQUES :
    - Si la région est le "Burkina Faso", inclus des établissements publics (UJKZ, UNZ, UPB) et privés (USTB, Aube Nouvelle, BIT, ISGE).
    - Si la région est internationale (France, USA, Canada, Japon, etc.), choisis les universités les plus renommées et réelles du pays.
    - Sois précis sur les noms, les villes et les sites web officiels.
    
    Pour chaque institution, fournis des données détaillées selon ce format JSON (ARRAY) :
    {
      "name": "Nom complet de l'établissement",
      "type": "Université Publique" | "Université Privée" | "Grande École" | "Institut Privé" | "Centre Professionnel" | "École de Santé",
      "description": "2-3 phrases sur l'excellence et les spécialités de l'école (réel)",
      "city": "Ville réelle",
      "country": "Pays réel",
      "address": "Adresse réelle ou quartier",
      "website": "URL réelle du site web officiel",
      "establishedYear": Année de création,
      "studentCount": Nombre approximatif d'étudiants,
      "overallRating": Note entre 4.0 et 5.0,
      "employabilityRate": Pourcentage d'insertion professionnelle entre 70 et 98,
      "reputationScore": Score IA entre 80 et 100,
      "tier": "Premium" | "Sponsored" | "Free",
      "isVerified": true,
      "accreditations": ["Accréditation 1", "Accréditation 2"],
      "scholarshipsAvailable": boolean,
      "contactEmail": "email@school.com",
      "contactPhone": "Numéro de téléphone au format international",
      "socialLinks": {
        "facebook": "URL Facebook",
        "linkedin": "URL Linkedin",
        "twitter": "URL Twitter/X"
      },
      "logo": "URL via Unsplash (utilisez photo-1541339907198-e08756dedf3f pour universités)",
      "coverImage": "URL via Unsplash",
      "programsCount": Nombre exact de filières proposées,
      "degrees": ["Licence", "Master", "Doctorat", "BTS", "Ingénieur"],
      "programs": [
        {
          "name": "Nom complet de la filière",
          "field": "Domaine (Informatique, Management, Santé...)",
          "level": "Licence/Master/BTS",
          "duration": "3 ans",
          "tuitionFee": 0,
          "description": "Objectifs de la formation",
          "skills": ["Compétence 1", "Compétence 2"],
          "careerOpportunities": ["Débouché 1", "Débouché 2", "Débouché 3"],
          "admissionCriteria": "Critères d'admission",
          "averageSalary": "Fourchette salaire mensuel moyen",
          "employmentRate": 90
        }
      ] // INSTRUCTION : Génère au moins 10 à 20 filières RÉELLES pour chaque établissement. Sois exhaustif.
    }

    IMPORTANT : Ne génère que des données RÉELLES et VERIFIEES. Ne pas inventer d'établissements.
  `;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return parseResponse<any[]>(response.text);
    }
    return [];
  } catch (error: any) {
    console.error("Gemini Crawl Error:", error);
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
      console.warn("Quota Gemini dépassé pour l'exploration des institutions.");
    }
    return [];
  }
}

export async function crawlScholarshipMarket(academicYears: string[] = ['2025/2026', '2026/2027']): Promise<any[]> {
  const yearsStr = academicYears.join(' et ');
  const prompt = `
    Tu es un crawler intelligent spécialisé dans les bourses d'études et aides financières mondiales.
    Ta mission est de trouver 15 nouvelles opportunités de financement RÉELLES (Bourses, Aides, Financements) pour les étudiants, avec un focus sur les années académiques : ${yearsStr}.
    
    CRITÈRES DE RECHERCHE :
    - Bourses d'Excellence (Full coverage)
    - Aides financières d'urgence (Financial aid)
    - Prêts étudiants à taux 0 ou spéciaux
    - Financements spécifiques pour les Burkinabè et Africains (BGF, Campus France, DAAD, Commonwealth, Chevening, MEXT, etc.)
    - Focus sur les candidatures ouvertes pour ${yearsStr} mais accepte aussi les aides immédiates.
    - IMPORTANT : La date limite (deadline) DOIT être supérieure à la date actuelle (${new Date().toISOString().split('T')[0]}). Ne génère jamais d'offres expirées.
    
    Pour chaque opportunité, fournis ces données au format JSON (ARRAY) :
    {
      "title": "Nom précis de la bourse/aide",
      "academicYear": "Année académique (ex: 2025/2026)",
      "category": "Bourse" | "Aide Financière" | "Financement Participatif" | "Prêt Étudiant",
      "country": "Pays de destination (ou Global)",
      "organization": "Organisme donateur",
      "university": "Université cible (si spécifique ou null)",
      "degreeLevel": "Licence" | "Master" | "Doctorat" | "Tous niveaux",
      "field": ["Domaine 1", "Domaine 2"],
      "deadline": "YYYY-MM-DD (Date limite réelle ou estimée pour le cycle suivant)",
      "fundingType": "Full" | "Partial",
      "coverage": ["Frais de scolarité", "Allocation mensuelle", "Logement", "Transport"],
      "eligibility": "Texte court sur les critères d'éligibilité",
      "applicationUrl": "URL réelle vers la page officielle",
      "officialSource": "Nom du site source (ex: Campus France)",
      "summaryAI": "2 phrases motivantes sur pourquoi cette opportunité est une pépite.",
      "difficultyScore": "Très accessible" | "Compétitif" | "Élite",
      "isForAfricans": true,
      "isForBurkina": true,
      "imageUrl": "URL Unsplash pertinente (ex: https://images.unsplash.com/photo-1523050335456-c77443fadd89?w=800&q=80)"
    }

    IMPORTANT : Varie les destinations (Burkina, Afrique, Europe, Canada, USA, Asie).
    Assure-toi que les années académiques ${yearsStr} sont prioritaires dans tes résultats.
  `;

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return parseResponse<any[]>(response.text);
    }
    return [];
  } catch (error: any) {
    console.error("Gemini Scholarship Crawl Error:", error);
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
      console.warn("Quota Gemini dépassé pour l'exploration des bourses.");
    }
    return [];
  }
}

export async function analyzeGovernmentContent(content: string, url: string, source: string): Promise<Omit<GovernmentOpportunity, 'id' | 'createdAt' | 'updatedAt'>[]> {
  const prompt = [
    {
      role: "user",
      parts: [{
        text: `Tu es un expert en bourses et aides financières du Burkina Faso. 
Analyses le contenu textuel suivant extrait du site officiel ${source} (${url}) et extrais une liste d'opportunités (bourses, aides, prêts, concours).

CONTENU :
${content}

EXTRAIS LES DONNÉES SUIVANTES pour chaque opportunité détectée :
- titre (title)
- type ('bourse', 'aide', 'prêt', 'concours', 'autre')
- organisation (organization - p.ex. CIOSPB, FOSER, Ministère...)
- description détaillée (description)
- conditions d'éligibilité (eligibility)
- pièces à fournir (requiredDocuments - tableau de chaînes)
- date limite (deadline - format YYYY-MM-DD ou "Bientôt")
- URL officielle (officialUrl - utilise ${url} si non spécifié plus précisément)
- URL du PDF (pdfUrl - si un lien PDF semble lié à cette offre spécifique)
- statut ('ouverte', 'bientôt expirée', 'expirée', 'résultats disponibles')
- source (utilises exactement "${source}")
- pays concernés (countryConcerns - tableau)
- niveaux concernés (levelConcerns - p.ex. ["Licence", "Master"])

IMPORTANT : Ne génère que des opportunités RÉELLES trouvées dans le texte. Ignore les menus ou textes génériques.
Si le texte contient une liste de plusieurs offres, extrais-les toutes.

RÉPONDS UNIQUEMENT EN JSON avec la structure :
[
  {
    "title": "...",
    "type": "...",
    "organization": "...",
    "description": "...",
    "eligibility": "...",
    "requiredDocuments": ["...", "..."],
    "deadline": "YYYY-MM-DD",
    "officialUrl": "...",
    "pdfUrl": "...",
    "status": "...",
    "source": "${source}",
    "levelConcerns": ["..."],
    "countryConcerns": ["..."],
    "isVerified": true
  }
]
`
      }]
    }
  ];

  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return parseResponse<any[]>(response.text);
    }
    return [];
  } catch (error: any) {
    console.error("Gemini Government Analysis Error:", error);
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
      console.warn("Quota Gemini dépassé pour l'analyse gouvernementale.");
    }
    return [];
  }
}

