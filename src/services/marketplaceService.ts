import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';
import { MarketplaceListing } from '../types';

const COLLECTION_NAME = 'marketplace_listings';

// Initial Mock Listings for Burkina Faso students
export const mockMarketplaceListings: MarketplaceListing[] = [
  {
    id: 'mock-listing-1',
    userId: 'mock-student-1',
    userName: 'Alassane Sawadogo',
    userEmail: 'alassane@univ.bf',
    title: 'Physique-Chimie Terminale D - Diabate',
    description: 'Livre complet de Physique-Chimie pour la Terminale D, très bon état. Contient de nombreux exercices corrigés pour préparer le BAC.',
    price: 3500,
    category: 'Livres scolaires & universitaires',
    condition: 'Très bon état',
    images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600'],
    location: 'Ouagadougou, Zone 1',
    contact: '+226 70123456',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    status: 'active'
  },
  {
    id: 'mock-listing-2',
    userId: 'mock-student-2',
    userName: 'Fatoumata Barry',
    userEmail: 'fatou@univ.bf',
    title: 'Calculatrice Graphique Casio Graph 35+',
    description: 'Idéal pour le lycée (Série C, D, E) et les écoles d’ingénieur. Vendue avec son couvercle de protection. Piles neuves fournies.',
    price: 15000,
    category: 'Matériel didactique',
    condition: 'Bon état',
    images: ['https://images.unsplash.com/photo-1548345680-f5475ea5df84?auto=format&fit=crop&q=80&w=600'],
    location: 'Bobo-Dioulasso, Belleville',
    contact: '+226 65891234',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    status: 'active'
  },
  {
    id: 'mock-listing-3',
    userId: 'mock-student-3',
    userName: 'Urbain Traoré',
    userEmail: 'urbain@univ.bf',
    title: 'Moto Rato 110cc en très bon état',
    description: 'Moto solide et fiable pour se déplacer sur le campus universitaire d’Ouaga 2. Clignotants ok, vidange faite récemment. Documents à jour.',
    price: 280000,
    category: 'Vélos & Motos',
    condition: 'Très bon état',
    images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600'],
    location: 'Ouagadougou, Dassasgho',
    contact: '+226 76543210',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    status: 'active'
  },
  {
    id: 'mock-listing-4',
    userId: 'mock-student-4',
    userName: 'Aminata Ouédraogo',
    userEmail: 'aminata@univ.bf',
    title: 'Table à dessin technique A3 rotative',
    description: 'Matériel idéal pour les étudiants en génie civil et architecture (ENSUT, 2iE). Presque neuve, livrée dans sa housse de transport.',
    price: 8000,
    category: 'Matériel didactique',
    condition: 'Neuf',
    images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600'],
    location: 'Koudougou, Secteur 2',
    contact: '+226 78901234',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    status: 'active'
  }
];

export const marketplaceService = {
  // Get active listings
  async getActiveListings(): Promise<MarketplaceListing[]> {
    if (!isFirebaseConfigured) {
      return this.getLocalListings();
    }

    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketplaceListing[];
      
      // Merge with mock listings to ensure good visual feed
      const merged = [...listings];
      mockMarketplaceListings.forEach(mock => {
        if (!merged.some(l => l.id === mock.id)) {
          merged.push(mock);
        }
      });
      
      return merged.filter(l => l.status === 'active');
    } catch (error) {
      console.error("Failed to fetch marketplace listings from firestore, using local / mock:", error);
      return this.getLocalListings();
    }
  },

  // Helper to fetch from localStorage & mocks
  getLocalListings(): MarketplaceListing[] {
    if (typeof window === 'undefined') return mockMarketplaceListings;
    try {
      const cached = localStorage.getItem('orientationbf_marketplace_listings');
      if (cached) {
        const parsed = JSON.parse(cached) as MarketplaceListing[];
        // Merge with initial mocks if not already present
        const merged = [...parsed];
        mockMarketplaceListings.forEach(mock => {
          if (!merged.some(l => l.id === mock.id)) {
            merged.push(mock);
          }
        });
        return merged.filter(l => l.status === 'active');
      }
    } catch (e) {
      console.error(e);
    }
    return mockMarketplaceListings;
  },

  // Save a local listing list
  saveLocalListings(listings: MarketplaceListing[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('orientationbf_marketplace_listings', JSON.stringify(listings));
    } catch (e) {
      console.error(e);
    }
  },

  // Get a single listing by ID
  async getListingById(id: string): Promise<MarketplaceListing | null> {
    if (!isFirebaseConfigured) {
      const local = this.getLocalListings();
      return local.find(l => l.id === id) || null;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MarketplaceListing;
      }
      
      // Fallback in mock / local
      const local = this.getLocalListings();
      return local.find(l => l.id === id) || null;
    } catch (error) {
      console.error(`Error getting listing ${id} from Firestore, trying fallback:`, error);
      const local = this.getLocalListings();
      return local.find(l => l.id === id) || null;
    }
  },

  // Create a new listing
  async createListing(listingData: Omit<MarketplaceListing, 'id' | 'createdAt' | 'status'> & { id?: string }): Promise<MarketplaceListing> {
    const freshListing: MarketplaceListing = {
      id: listingData.id || 'list-' + Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      status: 'active',
      reportsCount: 0,
      reportedBy: [],
      ...listingData,
    };

    // Pre-validation to prevent negative prices
    if (freshListing.price < 0) {
      throw new Error("Le prix ne peut pas être négatif.");
    }
    if (freshListing.images.length > 4) {
      throw new Error("Vous ne pouvez pas télécharger plus de 4 images.");
    }
    if (!freshListing.title.trim() || !freshListing.description.trim()) {
      throw new Error("Le titre et la description ne peuvent pas être vides.");
    }

    if (!isFirebaseConfigured) {
      const local = this.getLocalListings();
      // Overwrite/insert
      const existingIdx = local.findIndex(l => l.id === freshListing.id);
      if (existingIdx > -1) {
        local[existingIdx] = freshListing;
      } else {
        local.unshift(freshListing);
      }
      this.saveLocalListings(local);
      return freshListing;
    }

    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        userId: freshListing.userId,
        userName: freshListing.userName || '',
        userEmail: freshListing.userEmail || '',
        title: freshListing.title,
        description: freshListing.description,
        price: freshListing.price,
        category: freshListing.category,
        condition: freshListing.condition,
        images: freshListing.images,
        location: freshListing.location,
        contact: freshListing.contact,
        createdAt: freshListing.createdAt,
        status: freshListing.status,
        reportsCount: 0,
        reportedBy: []
      });
      return { ...freshListing, id: docRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  },

  // Update a listing
  async updateListing(id: string, updates: Partial<MarketplaceListing>): Promise<void> {
    if (updates.price !== undefined && updates.price < 0) {
      throw new Error("Le prix ne peut pas être négatif.");
    }

    if (!isFirebaseConfigured) {
      const local = this.getLocalListings();
      const idx = local.findIndex(l => l.id === id);
      if (idx > -1) {
        local[idx] = { ...local[idx], ...updates };
        this.saveLocalListings(local);
      }
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
      throw error;
    }
  },

  // Delete / Archive a listing
  async deleteListing(id: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const local = this.getLocalListings();
      const idx = local.findIndex(l => l.id === id);
      if (idx > -1) {
        // We can completely delete or mark deleted
        local[idx].status = 'deleted';
        this.saveLocalListings(local);
      }
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      // Soft-delete is preferred so we can keep audit or do standard delete
      await updateDoc(docRef, { status: 'deleted' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
      throw error;
    }
  },

  // Report a listing (Security / validation for inappropriate content / spam)
  async reportListing(id: string, reporterId: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const local = this.getLocalListings();
      const idx = local.findIndex(l => l.id === id);
      if (idx > -1) {
        const item = local[idx];
        const reportedBy = item.reportedBy || [];
        if (reportedBy.includes(reporterId)) {
          throw new Error("Vous avez déjà signalé cette annonce.");
        }
        reportedBy.push(reporterId);
        item.reportedBy = reportedBy;
        item.reportsCount = (item.reportsCount || 0) + 1;
        
        // Auto hide if reported multiple times (e.g., 3 warnings)
        if (item.reportsCount >= 3) {
          item.status = 'reported';
        }
        this.saveLocalListings(local);
      }
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const item = docSnap.data() as MarketplaceListing;
        const reportedBy = item.reportedBy || [];
        if (reportedBy.includes(reporterId)) {
          throw new Error("Vous avez déjà signalé cette annonce.");
        }
        
        const nextReportedBy = [...reportedBy, reporterId];
        const nextReportsCount = (item.reportsCount || 0) + 1;
        
        await updateDoc(docRef, {
          reportsCount: nextReportsCount,
          reportedBy: nextReportedBy,
          // Auto hide if reported multiple times
          status: nextReportsCount >= 3 ? 'reported' : item.status
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}/report`);
      throw error;
    }
  }
};
