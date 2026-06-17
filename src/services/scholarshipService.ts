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
import { db, handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';
import { Scholarship } from '../types';

const COLLECTION_NAME = 'scholarships';

export const mockScholarships: Scholarship[] = [
  {
    id: "bourse-001",
    title: "Bourse d'Excellence Eiffel (Gouvernement Français)",
    academicYear: "2026/2027",
    category: "Bourse",
    country: "France",
    organization: "Ministère de l'Europe et des Affaires Étrangères",
    university: "Toutes universités et grandes écoles françaises",
    degreeLevel: "Master",
    field: ["Ingénierie", "Informatique", "Sciences de l'Environnement", "Économie", "Droit"],
    deadline: "2027-01-10",
    fundingType: "Full",
    coverage: ["Frais d'études complets", "Allocation mensuelle de 1 181 €", "Billet d'avion A/R", "Couverture santé"],
    eligibility: "Nationalité burkinabè (ou hors France), âge inférieur à 25 ans au moment du dépôt, excellence académique.",
    applicationUrl: "https://www.campusfrance.org/fr/le-programme-de-bourses-d-excellence-eiffel",
    officialSource: "Campus France",
    summaryAI: "Bourse prestigieuse réservée aux futurs leaders académiques et professionnels burkinabè voulant étudier en France.",
    difficultyScore: "Élite",
    isForAfricans: true,
    isForBurkina: true,
    createdAt: new Date().toISOString(),
    isExpired: false
  },
  {
    id: "bourse-002",
    title: "Bourse d'Études de Coopération Algérienne (CIOSPB)",
    academicYear: "2025/2026",
    category: "Bourse",
    country: "Algérie",
    organization: "Gouvernement Algérien et CIOSPB Burkina Faso",
    university: "Toutes universités publiques en Algérie",
    degreeLevel: "Licence",
    field: ["Génie Civil", "Informatique", "Médecine", "Télécommunications", "Sciences de la Terre"],
    deadline: "2026-08-15",
    fundingType: "Full",
    coverage: ["Scolarité", "Chambre en cité universitaire", "Bourse trimestrielle"],
    eligibility: "Bacheliers burkinabè session 2025 ou 2026, moyenne au BAC supérieure ou égale à 13/20.",
    applicationUrl: "http://www.ciospb.gov.bf",
    officialSource: "CIOSPB (Burkina Faso)",
    summaryAI: "Chaque année l'Algérie offre plus de 100 bourses aux étudiants burkinabè de haut niveau scientifique.",
    difficultyScore: "Compétitif",
    isForAfricans: true,
    isForBurkina: true,
    createdAt: new Date().toISOString(),
    isExpired: false
  },
  {
    id: "bourse-003",
    title: "Bourse d'Excellence du Gouvernement Chinois (CSC)",
    academicYear: "2026/2027",
    category: "Bourse",
    country: "Chine",
    organization: "China Scholarship Council",
    university: "Universités d'élite en Chine (Tsinghua, Peking University, etc.)",
    degreeLevel: "Master",
    field: ["Technologies Web", "Médecine", "Énergies Renouvelables", "Agronomie", "Management"],
    deadline: "2026-12-15",
    fundingType: "Full",
    coverage: ["Frais de scolarité complets", "Hébergement gratuit", "Allocation mensuelle de 3 000 RMB", "Assurance médicale"],
    eligibility: "Diplôme de Licence de bon niveau, être âgé de moins de 35 ans, bon niveau d'anglais ou de chinois.",
    applicationUrl: "http://www.campuschina.org",
    officialSource: "Ambassade de Chine au Burkina Faso",
    summaryAI: "Option idéale pour acquérir des compétences techniques avancées dans les infrastructures informatiques en Chine.",
    difficultyScore: "Élite",
    isForAfricans: true,
    isForBurkina: true,
    createdAt: new Date().toISOString(),
    isExpired: false
  },
  {
    id: "bourse-004",
    title: "Bourses d'Étude du Royaume du Maroc (AMCI)",
    academicYear: "2025/2026",
    category: "Bourse",
    country: "Maroc",
    organization: "Agence Marocaine de Coopération Internationale",
    university: "Universités publiques et instituts spécialisés au Maroc",
    degreeLevel: "Licence",
    field: ["Gestion de Projet", "Agronomie", "Intelligence Artificielle", "Énergies", "Tourisme"],
    deadline: "2026-08-30",
    fundingType: "Full",
    coverage: ["Frais d'inscription", "Bourse de subsistance", "Logement prioritaire"],
    eligibility: "Bacheliers burkinabè de la session en cours, mentions Très Bien, Bien ou Assez Bien.",
    applicationUrl: "http://www.amci.ma",
    officialSource: "Ministère des Affaires Étrangères du Burkina Faso",
    summaryAI: "Une des bourses les plus populaires auprès des étudiants burkinabè pour des cursus techniques professionnalisants.",
    difficultyScore: "Compétitif",
    isForAfricans: true,
    isForBurkina: true,
    createdAt: new Date().toISOString(),
    isExpired: false
  }
];

export const scholarshipService = {
  async getAllScholarships(filters?: { country?: string; degreeLevel?: string; isExpired?: boolean; academicYear?: string; category?: string }) {
    try {
      let results: Scholarship[] = [];
      const cached = typeof window !== 'undefined' ? localStorage.getItem('orientationbf_cached_scholarships_data') : null;
      if (cached) {
        try {
          results = JSON.parse(cached);
        } catch (_) {}
      }

      if (isFirebaseConfigured) {
        try {
          const q = query(collection(db, COLLECTION_NAME));
          
          // Timeout to prevent UI stall if firestore is offline or slow
          const getDocsPromise = getDocs(q);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore timeout')), 10000)
          );
          
          const querySnapshot = await Promise.race([getDocsPromise, timeoutPromise]) as any;
          
          const fromDb = querySnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as Scholarship[];
          
          // Merge seamlessly with mockScholarships as templates so we don't drop items
          let mergedList = [...fromDb];
          for (const mock of mockScholarships) {
            if (!mergedList.some(s => (s.title || '').trim().toLowerCase() === mock.title.trim().toLowerCase())) {
              mergedList.push(mock);
            }
          }
          results = mergedList;
          if (typeof window !== 'undefined') {
            localStorage.setItem('orientationbf_cached_scholarships_data', JSON.stringify(results));
          }
        } catch (err) {
          console.error("Failed to query scholarships from Firestore, using cache/mock:", err);
        }
      }

      if (results.length === 0) {
        results = mockScholarships;
      } else {
        // Also merge mock catalog items into cached data if missing
        let mergedList = [...results];
        for (const mock of mockScholarships) {
          if (!mergedList.some(s => (s.title || '').trim().toLowerCase() === mock.title.trim().toLowerCase())) {
            mergedList.push(mock);
          }
        }
        results = mergedList;
      }

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
        if (filters.isExpired === false) {
          // Only active ones
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          results = results.filter(s => {
            if (!s.deadline) return true;
            try {
              const deadlineDate = new Date(s.deadline);
              return deadlineDate >= today;
            } catch {
              return true;
            }
          });
        } else if (filters.isExpired === true) {
          // Only expired ones
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          results = results.filter(s => {
            if (!s.deadline) return false;
            try {
              const deadlineDate = new Date(s.deadline);
              return deadlineDate < today;
            } catch {
              return false;
            }
          });
        }
        // else if isExpired is not filtered, return all
      } else {
        // By default, for public view, we might still want to hide expired ones 
        // but let's make it smarter: if the user didn't specify, we show active ones.
        // But for this fix, let's keep all unless explicitly filtered for clarity.
        // Actually, let's just make it show everything and let the UI handle the toggle.
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
      return mockScholarships;
    }
  },

  async getScholarshipById(id: string) {
    try {
      if (isFirebaseConfigured) {
        const docSnap = await getDocs(query(collection(db, COLLECTION_NAME), where('id', '==', id)));
        if (!docSnap.empty) {
          return { id: docSnap.docs[0].id, ...docSnap.docs[0].data() } as Scholarship;
        }
      }
      
      // Fallback search in mockScholarships
      const foundMock = mockScholarships.find(s => s.id === id);
      if (foundMock) return foundMock;

      if (isFirebaseConfigured) {
        // Fallback fallback: try direct doc ref or list
        const directDoc = await getDocs(query(collection(db, COLLECTION_NAME)));
        const found = directDoc.docs.find(d => d.id === id);
        if (found) return { id: found.id, ...found.data() } as Scholarship;
      }

      return null;
    } catch (error) {
      console.error("Error fetching scholarship by id, trying mock fallback:", error);
      const foundMock = mockScholarships.find(s => s.id === id);
      if (foundMock) return foundMock;

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
      
      const fallbackItem = { id: 'mock-' + Date.now() + Math.floor(Math.random()*1000), ...data } as Scholarship;

      if (!isFirebaseConfigured) {
        mockScholarships.push(fallbackItem);
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('orientationbf_cached_scholarships_data');
            let parsed = [];
            if (cached) parsed = JSON.parse(cached);
            parsed.push(fallbackItem);
            localStorage.setItem('orientationbf_cached_scholarships_data', JSON.stringify(parsed));
          } catch(e) {}
        }
        return fallbackItem;
      }

      try {
        const addDocPromise = addDoc(collection(db, COLLECTION_NAME), data);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore addDoc timeout')), 10000)
        );
        const docRef = await Promise.race([addDocPromise, timeoutPromise]) as any;
        return { id: docRef.id, ...data };
      } catch (err: any) {
        console.warn("Firestore addDoc failed, using local mock cache sync.", err.message);
        const fallbackItem = { id: 'mock-' + Date.now() + Math.floor(Math.random()*1000), ...data } as Scholarship;
        mockScholarships.push(fallbackItem);
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('orientationbf_cached_scholarships_data');
            let parsed = [];
            if (cached) parsed = JSON.parse(cached);
            parsed.push(fallbackItem);
            localStorage.setItem('orientationbf_cached_scholarships_data', JSON.stringify(parsed));
          } catch(e) {}
        }
        return fallbackItem;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  }
};
