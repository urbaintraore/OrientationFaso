import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { Formation, UserProfile } from '../types';

const FORMATIONS_COLLECTION = 'formations';

// Proposer de bonnes images professionnelles basées sur le domaine
export const DOMAINE_IMAGES: Record<string, string> = {
  "Informatique": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
  "Santé": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
  "Commerce & Gestion": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
  "Agriculture & Élevage": "https://images.unsplash.com/photo-1625246143124-2e68b63e0017?auto=format&fit=crop&q=80&w=800",
  "Génie Civil & BTP": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
  "Tourisme, Hôtellerie & Restauration": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
  "Énergies Renouvelables": "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800",
  "Droit & Sciences Politiques": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800",
  "Lettres & Communication": "https://images.unsplash.com/photo-1557426367-0eb02fc37596?auto=format&fit=crop&q=80&w=800",
  "Art, Design & Mode": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800"
};

export const DEFAULT_FORMATION_IMAGE = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800";

export function getFormationImage(domaine: string): string {
  return DOMAINE_IMAGES[domaine] || DEFAULT_FORMATION_IMAGE;
}

// In-Memory Fallback Local Cache for Offline / Local Demo mode
let mockFormations: Formation[] = [
  {
    id: "demo-f1",
    titre: "Licence en Génie Logiciel & Cloud Computing",
    description: "Une formation d'excellence pour maîtriser le développement web, mobile et l'administration des infrastructures cloud (AWS, GCP). Intègre des projets réels et un stage garanti.",
    domaine: "Informatique",
    niveau: "Débutant",
    type: "Présentiel",
    duree: "3 ans",
    prix: 650000,
    lieu: "Ouagadougou - IPERMIC",
    date_debut: "2026-10-05",
    date_fin: "2029-06-30",
    image: DOMAINE_IMAGES["Informatique"],
    createur_id: "demo-admin",
    createur_type: "admin",
    statut: "publie",
    date_creation: "2026-05-30T10:00:00.000Z",
    region: "Centre (Ouagadougou)",
    type_diplome: "Licence",
    secteur_activite: "Technologies de l'Information"
  },
  {
    id: "demo-f2",
    titre: "Technicien Supérieur en Énergie Solaire",
    description: "Devenez expert en installation, dimensionnement et maintenance de systèmes photovoltaïques autonomes et hybrides, un secteur en pleine expansion au Burkina Faso.",
    domaine: "Énergies Renouvelables",
    niveau: "Intermédiaire",
    type: "Hybride",
    duree: "2 ans",
    prix: 450000,
    lieu: "Bobo-Dioulasso - Institut de Technologie",
    date_debut: "2026-11-02",
    date_fin: "2028-06-30",
    image: DOMAINE_IMAGES["Énergies Renouvelables"],
    createur_id: "demo-etab-1",
    createur_type: "etablissement",
    statut: "publie",
    date_creation: "2026-05-29T14:30:00.000Z",
    region: "Hauts-Bassins",
    type_diplome: "BTS / Technicien",
    secteur_activite: "Génie Électrique & Énergies"
  },
  {
    id: "demo-f3",
    titre: "Certificat de Spécialisation en Entreprenariat Agricole",
    description: "Maîtrisez les techniques de production maraîchère moderne au Burkina, la gestion financière d'une exploitation agricole et les stratégies de commercialisation.",
    domaine: "Agriculture & Élevage",
    niveau: "Débutant",
    type: "Présentiel",
    duree: "6 mois",
    prix: 150000,
    lieu: "Koudougou - Ferme Pilote",
    date_debut: "2026-09-01",
    date_fin: "2027-03-01",
    image: DOMAINE_IMAGES["Agriculture & Élevage"],
    createur_id: "demo-etab-1",
    createur_type: "etablissement",
    statut: "brouillon",
    date_creation: "2026-05-31T09:15:00.000Z",
    region: "Centre-Ouest",
    type_diplome: "Certificat",
    secteur_activite: "Agriculture, Élevage & Agroalimentaire"
  },
  {
    id: "demo-f4",
    titre: "Master de Recherche en Santé Publique",
    description: "Formez-vous aux enjeux de santé communautaire, d'épidémiologie et de gestion des politiques sanitaires en Afrique de l'Ouest.",
    domaine: "Santé",
    niveau: "Avancé",
    type: "Présentiel",
    duree: "2 ans",
    prix: 800000,
    lieu: "Ouagadougou - Faculté de Santé",
    date_debut: "2026-10-15",
    date_fin: "2028-06-30",
    image: DOMAINE_IMAGES["Santé"],
    createur_id: "demo-etab-1",
    createur_type: "etablissement",
    statut: "publie",
    date_creation: "2026-05-28T08:00:00.000Z",
    region: "Centre (Ouagadougou)",
    type_diplome: "Master",
    secteur_activite: "Santé & Médical"
  }
];

export const formationService = {
  /**
   * Consultation publique : Récupérer toutes les formations de manière réactive ou statique
   */
  async getFormations(filters?: {
    domaine?: string;
    niveau?: string;
    type?: string;
    lieu?: string;
    prixMax?: number;
    statut?: string;
    region?: string;
    type_diplome?: string;
    secteur_activite?: string;
  }): Promise<Formation[]> {
    if (!isFirebaseConfigured) {
      console.log("Using Mock Formations - Firebase not configured");
      let list = [...mockFormations];
      if (filters) {
        if (filters.domaine) list = list.filter(f => f.domaine === filters.domaine);
        if (filters.niveau) list = list.filter(f => f.niveau === filters.niveau);
        if (filters.type) list = list.filter(f => f.type === filters.type);
        if (filters.lieu) list = list.filter(f => f.lieu.toLowerCase().includes(filters.lieu!.toLowerCase()));
        if (filters.prixMax !== undefined) list = list.filter(f => !f.prix || f.prix <= filters.prixMax!);
        if (filters.statut) list = list.filter(f => f.statut === filters.statut);
        if (filters.region) list = list.filter(f => f.region === filters.region);
        if (filters.type_diplome) list = list.filter(f => f.type_diplome === filters.type_diplome);
        if (filters.secteur_activite) list = list.filter(f => f.secteur_activite === filters.secteur_activite);
      }
      return list;
    }

    try {
      // Pour éviter les restrictions d'indexation complexes sur Firestore en production,
      // on récupère de base et filtre côté client.
      const q = query(collection(db, FORMATIONS_COLLECTION));
      const querySnapshot = await getDocs(q);
      let list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Formation[];

      if (filters) {
        if (filters.domaine) list = list.filter(f => f.domaine === filters.domaine);
        if (filters.niveau) list = list.filter(f => f.niveau === filters.niveau);
        if (filters.type) list = list.filter(f => f.type === filters.type);
        if (filters.lieu) list = list.filter(f => f.lieu.toLowerCase().includes(filters.lieu!.toLowerCase()));
        if (filters.prixMax !== undefined) list = list.filter(f => !f.prix || f.prix <= filters.prixMax!);
        if (filters.statut) list = list.filter(f => f.statut === filters.statut);
        if (filters.region) list = list.filter(f => f.region === filters.region);
        if (filters.type_diplome) list = list.filter(f => f.type_diplome === filters.type_diplome);
        if (filters.secteur_activite) list = list.filter(f => f.secteur_activite === filters.secteur_activite);
      }
      return list;
    } catch (error) {
      console.error("Error fetching formations:", error);
      handleFirestoreError(error, OperationType.LIST, FORMATIONS_COLLECTION);
      return [];
    }
  },

  /**
   * Consultation publique : Écouter en temps réel les formations publiées
   */
  subscribeToPublishedFormations(callback: (formations: Formation[]) => void, filters?: {
    domaine?: string;
    niveau?: string;
    type?: string;
    lieu?: string;
    prixMax?: number;
    region?: string;
    type_diplome?: string;
    secteur_activite?: string;
  }) {
    if (!isFirebaseConfigured) {
      // Mode simulation hors-ligne immédiat
      let list = mockFormations.filter(f => f.statut === 'publie');
      if (filters) {
        if (filters.domaine) list = list.filter(f => f.domaine === filters.domaine);
        if (filters.niveau) list = list.filter(f => f.niveau === filters.niveau);
        if (filters.type) list = list.filter(f => f.type === filters.type);
        if (filters.lieu) list = list.filter(f => f.lieu.toLowerCase().includes(filters.lieu!.toLowerCase()));
        if (filters.prixMax !== undefined) list = list.filter(f => !f.prix || f.prix <= filters.prixMax!);
        if (filters.region) list = list.filter(f => f.region === filters.region);
        if (filters.type_diplome) list = list.filter(f => f.type_diplome === filters.type_diplome);
        if (filters.secteur_activite) list = list.filter(f => f.secteur_activite === filters.secteur_activite);
      }
      callback(list);
      return () => {};
    }

    const q = query(
      collection(db, FORMATIONS_COLLECTION),
      where('statut', '==', 'publie')
    );

    return onSnapshot(q, (snapshot) => {
      let list: Formation[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Formation);
      });

      if (filters) {
        if (filters.domaine) list = list.filter(f => f.domaine === filters.domaine);
        if (filters.niveau) list = list.filter(f => f.niveau === filters.niveau);
        if (filters.type) list = list.filter(f => f.type === filters.type);
        if (filters.lieu) list = list.filter(f => f.lieu.toLowerCase().includes(filters.lieu!.toLowerCase()));
        if (filters.prixMax !== undefined) list = list.filter(f => !f.prix || f.prix <= filters.prixMax!);
        if (filters.region) list = list.filter(f => f.region === filters.region);
        if (filters.type_diplome) list = list.filter(f => f.type_diplome === filters.type_diplome);
        if (filters.secteur_activite) list = list.filter(f => f.secteur_activite === filters.secteur_activite);
      }
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, FORMATIONS_COLLECTION);
    });
  },

  /**
   * Écouter les formations spécifiques d'un créateur (pour dashboard)
   */
  subscribeToCreatorFormations(creatorId: string, callback: (formations: Formation[]) => void) {
    if (!isFirebaseConfigured) {
      callback(mockFormations.filter(f => f.createur_id === creatorId));
      return () => {};
    }

    const q = query(
      collection(db, FORMATIONS_COLLECTION),
      where('createur_id', '==', creatorId)
    );

    return onSnapshot(q, (snapshot) => {
      const list: Formation[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Formation);
      });
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, FORMATIONS_COLLECTION);
    });
  },

  /**
   * Récupérer une formation par son ID
   */
  async getFormationById(id: string): Promise<Formation | null> {
    if (!isFirebaseConfigured) {
      return mockFormations.find(f => f.id === id) || null;
    }

    try {
      const docRef = doc(db, FORMATIONS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Formation;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, FORMATIONS_COLLECTION);
      return null;
    }
  },

  /**
   * Créer une formation
   */
  async createFormation(formation: Omit<Formation, 'id' | 'image' | 'date_creation' | 'createur_id' | 'createur_type' | 'statut'>, userProfile: UserProfile): Promise<string> {
    // 1. Contrôle d'accès basé sur les rôles (ABAC)
    const canCreate = userProfile.profileType === 'system_admin' || userProfile.profileType === 'etablissement';
    if (!canCreate) {
      throw new Error("Opération non autorisée : Seuls l'administrateur et les établissements peuvent créer des formations.");
    }

    const image = getFormationImage(formation.domaine);
    const date_creation = new Date().toISOString();

    // 2. Publication directe pour admin / Brouillon par défaut pour Etablissement
    const statut = userProfile.profileType === 'system_admin' ? 'publie' : 'brouillon';

    const cleanData = {
      ...formation,
      image,
      createur_id: userProfile.uid,
      createur_type: (userProfile.profileType === 'system_admin' ? 'admin' : 'etablissement') as 'admin' | 'etablissement',
      statut: statut as 'publie' | 'brouillon',
      date_creation
    };

    if (!isFirebaseConfigured) {
      const newId = "f-" + Date.now();
      const newFormation: Formation = { id: newId, ...cleanData };
      mockFormations.push(newFormation);
      console.log("Mock formation created under Offline Demo Mode", newFormation);
      return newId;
    }

    try {
      const docRef = await addDoc(collection(db, FORMATIONS_COLLECTION), cleanData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, FORMATIONS_COLLECTION);
      throw error;
    }
  },

  /**
   * Modifier une formation
   */
  async updateFormation(id: string, updatedData: Partial<Formation>, userProfile: UserProfile): Promise<void> {
    // 1. Contrôle d'accès rigoureux
    const existingFormation = await this.getFormationById(id);
    if (!existingFormation) {
      throw new Error("Formation introuvable.");
    }

    const isAdmin = userProfile.profileType === 'system_admin';
    const isOwner = existingFormation.createur_id === userProfile.uid;

    if (!isAdmin && !isOwner) {
      throw new Error("Opération de modification non autorisée : Vous ne pouvez modifier que vos propres formations.");
    }

    // Un établissement ne peut pas changer le créateur d'origine
    if (!isAdmin) {
      delete updatedData.createur_id;
      delete updatedData.createur_type;
      delete updatedData.date_creation;
      
      // Si l'établissement modifie un brouillon, il doit rester brouillon ou soumis
      if (existingFormation.statut !== 'brouillon' && updatedData.statut === 'publie') {
        throw new Error("Validation requise : Seul un administrateur peut modifier le statut en 'publie'.");
      }
    }

    if (updatedData.domaine) {
      updatedData.image = getFormationImage(updatedData.domaine);
    }

    if (!isFirebaseConfigured) {
      mockFormations = mockFormations.map(f => f.id === id ? { ...f, ...updatedData } as Formation : f);
      return;
    }

    try {
      const docRef = doc(db, FORMATIONS_COLLECTION, id);
      await updateDoc(docRef, updatedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, FORMATIONS_COLLECTION);
      throw error;
    }
  },

  /**
   * Valider/Publier directement une formation (Réservé à l'Admin)
   */
  async validateFormation(id: string, userProfile: UserProfile): Promise<void> {
    if (userProfile.profileType !== 'system_admin') {
      throw new Error("Réservé aux administrateurs : Vous ne disposez pas des privilèges nécessaires.");
    }

    if (!isFirebaseConfigured) {
      mockFormations = mockFormations.map(f => f.id === id ? { ...f, statut: 'publie' } : f);
      return;
    }

    try {
      const docRef = doc(db, FORMATIONS_COLLECTION, id);
      await updateDoc(docRef, { statut: 'publie' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, FORMATIONS_COLLECTION);
      throw error;
    }
  },

  /**
   * Supprimer une formation
   */
  async deleteFormation(id: string, userProfile: UserProfile): Promise<void> {
    const existingFormation = await this.getFormationById(id);
    if (!existingFormation) {
      throw new Error("Formation introuvable.");
    }

    const isAdmin = userProfile.profileType === 'system_admin';
    const isOwner = existingFormation.createur_id === userProfile.uid;

    if (!isAdmin && !isOwner) {
      throw new Error("Opération non autorisée : Vous ne pouvez supprimer que vos propres créations.");
    }

    if (!isFirebaseConfigured) {
      mockFormations = mockFormations.filter(f => f.id !== id);
      return;
    }

    try {
      const docRef = doc(db, FORMATIONS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, FORMATIONS_COLLECTION);
      throw error;
    }
  }
};
