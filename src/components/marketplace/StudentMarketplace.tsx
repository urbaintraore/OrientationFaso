import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Tag, 
  Plus, 
  AlertTriangle, 
  Phone, 
  Clock, 
  BookOpen, 
  Wrench, 
  TrendingUp,
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Info,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  AlertCircle,
  Upload
} from 'lucide-react';
import { auth, isFirebaseConfigured } from '../../lib/firebase';
import { MarketplaceListing } from '../../types';
import { marketplaceService, mockMarketplaceListings } from '../../services/marketplaceService';
import { motion, AnimatePresence } from 'motion/react';

// Predefined categories
const CATEGORIES: MarketplaceListing['category'][] = [
  'Livres scolaires & universitaires',
  'Matériel didactique',
  'Vélos & Motos',
  'Vie étudiante & Autres'
];

// Predefined conditions
const CONDITIONS: MarketplaceListing['condition'][] = [
  'Neuf',
  'Très bon état',
  'Bon état',
  'État satisfaisant'
];

// Default sample URLs matching categories for easier listing creation
const CATEGORY_DEFAULT_IMAGES: Record<MarketplaceListing['category'], string[]> = {
  'Livres scolaires & universitaires': [
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600'
  ],
  'Matériel didactique': [
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1581091870622-0cc69dedfc4d?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600'
  ],
  'Vélos & Motos': [
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=600'
  ],
  'Vie étudiante & Autres': [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600'
  ]
};

// Forbidden / Spam keyword detection
const SPAM_KEYWORDS = [
  'viagra', 'casino', 'free cryptomoney', 'gagner de l\'argent facilement', 
  'bitcoin gratuit', 'investissement garanti', 'devenir riche', 'credit sans justificatif'
];

interface StudentMarketplaceProps {
  onLogin?: () => void;
}

export function StudentMarketplace({ onLogin }: StudentMarketplaceProps) {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'feed' | 'my-listings'>('feed');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track reactive auth state
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('All');

  // Detail Modal view
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  // Create/Edit Listing Modal
  const [showFormModal, setShowShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Listing Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<MarketplaceListing['category']>('Livres scolaires & universitaires');
  const [formCondition, setFormCondition] = useState<MarketplaceListing['condition']>('Très bon état');
  const [formLocation, setFormLocation] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  
  // Custom image input or presets selection
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // User messages
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userNotification, setUserNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom visual dialog states to bypass standard alert/confirm iframe blocks
  const [dialog, setDialog] = useState<{
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    primaryLabel?: string;
    cancelLabel?: string;
    onPrimary?: () => void;
  } | null>(null);

  const showAlert = (title: string, message: string) => {
    setDialog({
      type: 'alert',
      title,
      message,
      primaryLabel: "D'accord"
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      type: 'confirm',
      title,
      message,
      primaryLabel: 'Confirmer',
      cancelLabel: 'Annuler',
      onPrimary: onConfirm
    });
  };

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await marketplaceService.getActiveListings();
      setListings(data);
    } catch (e) {
      console.error(e);
      // Fallback
      setListings(mockMarketplaceListings);
    } finally {
      setIsLoading(false);
    }
  };

  const currentUserId = currentUser?.uid || null;

  // Basic anti-spam validation
  const validateMarketplaceData = (title: string, description: string): string | null => {
    const combinedContent = `${title} ${description}`.toLowerCase();
    
    // Check empty or near empty
    if (title.trim().length < 5) {
      return "Le titre de l'annonce doit faire au moins 5 caractères.";
    }
    if (description.trim().length < 15) {
      return "Veuillez fournir une description plus détaillée (minimum 15 caractères).";
    }

    // Check spam tags
    for (const kw of SPAM_KEYWORDS) {
      if (combinedContent.includes(kw)) {
        return `Votre annonce contient des termes bloqués par notre système de sécurité anti-spam : "${kw}".`;
      }
    }
    return null;
  };

  // Submit Listing
  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      setFormError("Vous devez être connecté pour publier une annonce.");
      return;
    }

    // Input checking
    if (formPrice < 0) {
      setFormError("Le prix ne peut pas être un montant négatif.");
      return;
    }

    const spamCheck = validateMarketplaceData(formTitle, formDescription);
    if (spamCheck) {
      setFormError(spamCheck);
      return;
    }

    if (!formLocation.trim()) {
      setFormError("La localisation (ville / quartier) est obligatoire.");
      return;
    }

    if (!formContact.trim()) {
      setFormError("Veuillez renseigner un moyen de contact (ex: Téléphone ou Email).");
      return;
    }

    // Compose images list (using preset categories defaults if empty)
    let imagesToUpload = [...formImages];
    if (imagesToUpload.length === 0) {
      // Pick a random default photo from matching category
      const defaults = CATEGORY_DEFAULT_IMAGES[formCategory];
      const randomUrl = defaults[Math.floor(Math.random() * defaults.length)];
      imagesToUpload = [randomUrl];
    }

    if (imagesToUpload.length > 4) {
      setFormError("Le nombre d'images maximum autorisé est de 4.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (isEditing && editingId) {
        // Edit update
        await marketplaceService.updateListing(editingId, {
          title: formTitle,
          description: formDescription,
          price: formPrice,
          category: formCategory,
          condition: formCondition,
          location: formLocation,
          contact: formContact,
          images: imagesToUpload
        });
        setSuccessMessage("Votre annonce a été modifiée avec succès !");
      } else {
        // Create new
        await marketplaceService.createListing({
          userId: currentUserId,
          userName: auth.currentUser?.displayName || 'Étudiant anonyme',
          userEmail: auth.currentUser?.email || '',
          title: formTitle,
          description: formDescription,
          price: formPrice,
          category: formCategory,
          condition: formCondition,
          location: formLocation,
          contact: formContact,
          images: imagesToUpload
        });
        setSuccessMessage("Félicitations, votre annonce a été publiée sur la Marketplace !");
      }

      // Close modal & refresh
      setTimeout(() => {
        setSuccessMessage(null);
        setShowShowFormModal(false);
        resetForm();
        loadListings();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setFormError("Erreur lors de la sauvegarde : " + (err.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPrice(0);
    setFormCategory('Livres scolaires & universitaires');
    setFormCondition('Très bon état');
    setFormLocation('');
    setFormContact('');
    setFormImages([]);
    setImageUrlInput('');
    setIsEditing(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleEditClick = (listing: MarketplaceListing, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingId(listing.id);
    setFormTitle(listing.title);
    setFormDescription(listing.description);
    setFormPrice(listing.price);
    setFormCategory(listing.category);
    setFormCondition(listing.condition);
    setFormLocation(listing.location);
    setFormContact(listing.contact);
    setFormImages(listing.images);
    setShowShowFormModal(true);
  };

  const handleDeleteListing = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      "Confirmation",
      "Êtes-vous sûr de vouloir retirer cette annonce de la marketplace ?",
      async () => {
        try {
          await marketplaceService.deleteListing(id);
          setUserNotification("L'annonce a été retirée avec succès.");
          loadListings();
          if (selectedListing?.id === id) {
            setSelectedListing(null);
          }
          setTimeout(() => setUserNotification(null), 3000);
        } catch (err) {
          console.error(err);
          showAlert("Erreur", "Erreur lors du retrait de l'annonce.");
        }
      }
    );
  };

  const handleReportListing = async (listingId: string) => {
    if (!currentUserId) {
      showAlert("Non connecté", "Vous devez être connecté pour signaler une annonce inappropriée.");
      return;
    }
    
    showConfirm(
      "Signaler l'annonce",
      "Voulez-vous vraiment signaler cette annonce comme spam ou contenu inapproprié ?",
      async () => {
        try {
          await marketplaceService.reportListing(listingId, currentUserId);
          showAlert("Signalement pris en compte", "Merci, votre signalement a été pris en compte. L'annonce est en cours d'évaluation.");
          loadListings();
          setSelectedListing(null);
        } catch (e: any) {
          showAlert("Erreur", e.message || "Erreur de signalement.");
        }
      }
    );
  };

  const toggleMarkAsSold = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'sold' ? 'active' : 'sold';
    const message = nextStatus === 'sold' ? "Marquer cet objet comme vendu ?" : "Remettre cet objet en vente ?";
    
    showConfirm(
      "Changement de statut",
      message,
      async () => {
        try {
          await marketplaceService.updateListing(id, { status: nextStatus });
          setUserNotification(`Statut de l'annonce mis à jour.`);
          loadListings();
          setTimeout(() => setUserNotification(null), 2500);
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleFileSelection = (files: File[]) => {
    if (formImages.length >= 4) {
      showAlert("Limite atteinte", "Le nombre maximum d'images autorisé pour une annonce est de 4.");
      return;
    }
    
    const maxAllowed = 4 - formImages.length;
    const filesToProcess = files.slice(0, maxAllowed);
    
    if (files.length > maxAllowed) {
      showAlert("Limite atteinte", `Vous ne pouvez ajouter que ${maxAllowed} image(s) supplémentaire(s).`);
    }

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showAlert("Fichier non supporté", "Veuillez ne sélectionner que des fichiers images.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (formImages.length >= 4) {
      showAlert("Limite atteinte", "Le nombre maximum d'images autorisé pour une annonce est de 4.");
      return;
    }
    setFormImages([...formImages, trimmed]);
    setImageUrlInput('');
  };

  const removeImageIndex = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  // Listings dynamic filtering
  const filteredListings = listings.filter(item => {
    // Basic search match
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase()) ||
                          item.location.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesCondition = selectedCondition === 'All' || item.condition === selectedCondition;
    
    const itemMaxPrice = maxPrice ? parseFloat(maxPrice) : Infinity;
    const matchesPrice = isNaN(itemMaxPrice) || item.price <= itemMaxPrice;

    // Filter cities
    const matchesCity = selectedCity === 'All' || 
                        item.location.toLowerCase().includes(selectedCity.toLowerCase());

    const isUsersOwn = item.userId === currentUserId;

    if (activeTab === 'my-listings') {
      return isUsersOwn && item.status !== 'deleted';
    }

    // Default feed tab: only active listings
    return matchesSearch && matchesCategory && matchesCondition && matchesPrice && matchesCity && item.status === 'active';
  });

  // Extract cities from existing listings for filters
  const availableCities: string[] = Array.from(new Set(
    listings.map(l => {
      const parts = l.location.split(',');
      return parts[0].trim();
    })
  )).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      
      {/* Decorative header matching Burkina student theme */}
      <div className="bg-gradient-to-br from-teal-900 via-indigo-950 to-slate-950 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-700/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 backdrop-blur-md rounded-full text-amber-400 text-xs font-black uppercase tracking-wider mb-4 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" /> NOUVEAUTÉ • BROCANTE ÉTUDIANTE
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-3">
              Marketplace <span className="text-teal-400">Pour Élèves & Étudiants</span>
            </h1>
            
            <p className="text-gray-300/80 text-sm md:text-base max-w-xl mx-auto mb-6">
              Achetez ou vendez des livres scolaires, du matériel didactique ou des vélos et motos d&apos;occasion directement entre élèves au Burkina Faso.
            </p>

            {/* Quick stats / warning */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-400">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Transactions sécurisées de main en main</div>
              <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
              <div className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-400" /> Réservé uniquement à la vie étudiante</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">

          {/* User notification toast */}
          {userNotification && (
            <div className="p-3 bg-teal-50 border-l-4 border-teal-500 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in animate-bounce">
              <Check className="w-4 h-4 text-teal-600" />
              {userNotification}
            </div>
          )}

          {/* Mode Tabs && Post button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex gap-1.5 bg-slate-200/40 dark:bg-slate-800/40 p-1.5 rounded-2xl w-fit">
              <button 
                onClick={() => { setActiveTab('feed'); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'feed' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-950 dark:text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                Annonces actives ({listings.filter(l => l.status === 'active').length})
              </button>
              <button 
                onClick={() => {
                  if (!currentUserId) {
                    if (onLogin) {
                      showConfirm(
                        "Connexion requise",
                        "Vous devez être connecté pour gérer vos annonces. Voulez-vous vous connecter maintenant ?",
                        () => onLogin()
                      );
                    } else {
                      showAlert("Connexion requise", "Veuillez d'abord vous connecter pour voir vos annonces.");
                    }
                    return;
                  }
                  setActiveTab('my-listings');
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'my-listings' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-950 dark:text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                Gérer mes annonces
              </button>
            </div>

            <button 
              onClick={() => {
                if (!currentUserId) {
                  if (onLogin) {
                    showConfirm(
                      "Connexion requise",
                      "Veuillez d'abord vous connecter pour créer une annonce ! Voulez-vous vous connecter ?",
                      () => onLogin()
                    );
                  } else {
                    showAlert("Connexion requise", "Veuillez d'abord vous connecter pour créer une annonce !");
                  }
                  return;
                }
                resetForm();
                setShowShowFormModal(true);
              }}
              className="px-5 py-3 bg-teal-600 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-teal-700/10 hover:shadow-none hover:scale-[1.02] active:scale-95 duration-200"
            >
              <Plus className="w-4 h-4" /> Publier une annonce
            </button>
          </div>

          {/* Top Horizontal Quick Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center gap-4 transition-all">
            
            {/* Category select dropdown */}
            <div className="flex-1 space-y-1.5 min-w-0">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Filtrer par Catégorie</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
              >
                <option value="All">🚀 Toutes les catégories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Price Filter input */}
            <div className="w-full md:w-64 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Prix maximum (FCFA)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Illimité"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
                {maxPrice && (
                  <button
                    onClick={() => setMaxPrice('')}
                    className="absolute right-3.5 top-3.5 text-[10px] text-gray-400 hover:text-rose-600 font-extrabold cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Quick city filter */}
            <div className="w-full md:w-56 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Ville / Localisation</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
              >
                <option value="All">🌍 Partout au Burkina</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Reset button if any filter is dirty */}
            {(selectedCategory !== 'All' || maxPrice !== '' || selectedCity !== 'All' || search !== '') && (
              <div className="md:mt-5 self-stretch md:self-auto flex items-center">
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                    setSelectedCondition('All');
                    setMaxPrice('');
                    setSelectedCity('All');
                  }}
                  className="w-full md:w-auto px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-rose-100 dark:border-rose-900/40 text-center"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Filters panel on Left Side */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800/80 space-y-6">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest flex items-center gap-2">
                    Filtres
                  </h3>
                  <button 
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('All');
                      setSelectedCondition('All');
                      setMaxPrice('');
                      setSelectedCity('All');
                    }}
                    className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 hover:text-teal-800 underline"
                  >
                    Réinitialiser
                  </button>
                </div>

                {/* Text Search */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Ex: dictionnaire, livre, vélo..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 active:outline-none focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 font-semibold">Catégories</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === 'All' 
                          ? 'bg-teal-50 dark:bg-slate-900 text-teal-700 dark:text-teal-400 font-bold' 
                          : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span>Toutes les catégories</span>
                    </button>
                    {CATEGORIES.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                          selectedCategory === category 
                            ? 'bg-teal-50 dark:bg-slate-900 text-teal-700 dark:text-teal-400 font-bold' 
                            : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <span className="truncate">{category}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Limit price */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Prix maximum (FCFA)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 10000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 active:outline-none focus:outline-none transition-all"
                  />
                </div>

                {/* Condition filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">État de l&apos;objet</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSelectedCondition('All')}
                      className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded-lg border text-center transition-colors ${
                        selectedCondition === 'All'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-slate-900 dark:border-slate-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Tous
                    </button>
                    {CONDITIONS.map(cond => (
                      <button
                        key={cond}
                        onClick={() => setSelectedCondition(cond)}
                        className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded-lg border text-center transition-colors truncate ${
                          selectedCondition === cond
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-slate-900 dark:border-slate-700'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350'
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cities filter */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Ville</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  >
                    <option value="All">Tout le Burkina</option>
                    <option value="Ouagadougou">Ouagadougou</option>
                    <option value="Bobo">Bobo-Dioulasso</option>
                    <option value="Koudougou">Koudougou</option>
                    {availableCities.map(city => {
                      if (['ouagadougou', 'bobo', 'koudougou'].includes(city.toLowerCase())) return null;
                      return <option key={city} value={city}>{city}</option>;
                    })}
                  </select>
                </div>

              </div>
            </div>

            {/* Main view panel with listings */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {activeTab === 'my-listings' ? 'Mes publications d\'annonces' : 'Dernières trouvailles'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Nous avons trouvé <span className="font-bold text-teal-600">{filteredListings.length}</span> objet{filteredListings.length > 1 ? 's' : ''} disponible{filteredListings.length > 1 ? 's' : ''} selon vos filtres.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-80 animate-pulse border border-slate-100 dark:border-slate-800" />
                  ))}
                </div>
              ) : filteredListings.length > 0 ? (
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedListing(item)}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full relative"
                    >
                      {/* Image header */}
                      <div className="h-44 relative overflow-hidden bg-slate-100">
                        <img 
                          src={item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400'} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                        
                        {/* Sold tag badge */}
                        {item.status === 'sold' && (
                          <div className="absolute inset-0 bg-slate-950/70 p-3 flex items-center justify-center">
                            <span className="bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-xl">
                              VENDU 🤝
                            </span>
                          </div>
                        )}

                        {/* Price badge */}
                        <div className="absolute bottom-3 left-3 bg-teal-600 text-white font-black text-xs px-2.5 py-1.5 rounded-lg shadow-lg">
                          {item.price.toLocaleString()} FCFA
                        </div>

                        {/* Condition tag */}
                        <div className="absolute top-3 right-3 bg-slate-900/60 backdrop-blur-md text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                          {item.condition}
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-teal-650 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          
                          <h3 className="font-bold text-slate-800 dark:text-white text-sm mt-2 leading-snug line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {item.title}
                          </h3>
                          
                          <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location.split(',')[0]}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        
                        {/* Manage buttons overlay */}
                        {activeTab === 'my-listings' && (
                          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 relative z-20">
                            <button
                              onClick={(e) => handleEditClick(item, e)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Éditer
                            </button>
                            <button
                              onClick={(e) => handleDeleteListing(item.id, e)}
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Retirer
                            </button>
                            <button
                              onClick={(e) => toggleMarkAsSold(item.id, item.status, e)}
                              className="col-span-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 font-bold rounded-lg text-[10px] uppercase tracking-wider text-center"
                            >
                              {item.status === 'sold' ? "🤝 Remettre en vente" : "Mark comme vendu"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
              ) : (
                
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200/80 dark:border-slate-800 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Aucune annonce trouvée</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                    Nous n&apos;avons pas d&apos;annonces correspondant à vos critères actuels. Essayez de réinitialiser vos filtres ou soyez le premier à publier !
                  </p>
                  <button 
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('All');
                      setSelectedCondition('All');
                      setMaxPrice('');
                      setSelectedCity('All');
                    }}
                    className="mt-6 px-6 py-2.5 bg-teal-600 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                  >
                    Effacer les filtres
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Listing Detail Popup Modal */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedListing(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Image banner slide / gallery */}
              <div className="h-56 md:h-72 bg-slate-100 relative">
                <img 
                  src={selectedListing.images && selectedListing.images[0] ? selectedListing.images[0] : 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800'} 
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                
                {/* Close */}
                <button 
                  onClick={() => setSelectedListing(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-950/45 hover:bg-slate-950 text-white rounded-full transition-colors border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <span className="bg-teal-600 text-white font-black text-sm md:text-base px-3.5 py-2 rounded-xl shadow-lg">
                    {selectedListing.price.toLocaleString()} FCFA
                  </span>

                  <span className="bg-slate-900/60 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                    {selectedListing.condition}
                  </span>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase font-black text-teal-600 dark:text-teal-400">
                    <span>{selectedListing.category}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>Burkina Faso</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-snug">
                    {selectedListing.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {selectedListing.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Publié le {new Date(selectedListing.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description détaillée</h4>
                  <p className="text-xs md:text-sm text-slate-650 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                    {selectedListing.description}
                  </p>
                </div>

                {/* Seller & Contact Box */}
                <div className="p-5 bg-gradient-to-tr from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Vendeur / Propriétaire</span>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{selectedListing.userName || 'Membre d\'OrientationBF'}</h4>
                    </div>
                    {/* Signal / Report listing */}
                    {selectedListing.userId !== currentUserId && (
                      <button
                        onClick={() => handleReportListing(selectedListing.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-bold uppercase transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Signaler l&apos;annonce
                      </button>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-200">{selectedListing.contact}</span>
                    </div>
                    <a 
                      href={`tel:${selectedListing.contact}`}
                      className="px-4 py-2.5 bg-teal-650 hover:bg-slate-900 text-white rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3.5 h-3.5" /> Appeler le vendeur
                    </a>
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedListing.userId === currentUserId ? (
                    <>
                      <button
                        onClick={(e) => { setSelectedListing(null); handleEditClick(selectedListing, e); }}
                        className="flex-1 py-3 bg-slate-900 hover:bg-teal-650 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" /> Modifier les détails
                      </button>
                      <button
                        onClick={(e) => { handleDeleteListing(selectedListing.id, e); }}
                        className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Retirer l'annonce"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReportListing(selectedListing.id)}
                      className="w-full py-3.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-300 text-orange-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                      Signaler cette annonce
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creation / Editing Form Modal Popup */}
      <AnimatePresence>
        {showFormModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-2 max-h-[92vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 rounded-t-[1.5rem] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-600">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {isEditing ? "Modifier l'annonce" : "Nouvelle publication"}
                    </h2>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Publiez gratuitement un produit destiné aux élèves</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShowFormModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveListing} className="p-6 overflow-y-auto flex-1 space-y-4">
                
                {formError && (
                  <div className="p-3.5 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">Titre de l&apos;objet *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Livre Terminale D Seuil Physique, Velo Orbea VTT..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">Catégorie *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">État *</label>
                    <select
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      {CONDITIONS.map(cond => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">Prix demandé (FCFA) *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      placeholder="Ex: 5000"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5 font-semibold">Localisation (Ville, Quartier) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Ouagadougou, Patte d'Oie"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">Moyen de contact rapide (Tél, WhatsApp) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: +226 70123456"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">Description de l&apos;état / détails *</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Décrivez l'année d'achat, l'état d'usure, ou toute autre spécification utile pour la vente..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {/* Listing Images selector */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-teal-600" />
                      Images d&apos;illustration (Max 4)
                    </label>
                    <span className="text-[9px] text-gray-400 font-medium">Déposez vos images ou entrez des URLs</span>
                  </div>

                  {/* Drag and Drop Zone + Click File Selector */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files) as File[];
                      handleFileSelection(files);
                    }}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-950/20 transition-all relative"
                    onClick={() => document.getElementById('marketplace-file-input')?.click()}
                  >
                    <input 
                      id="marketplace-file-input"
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileSelection(Array.from(e.target.files) as File[]);
                        }
                      }}
                    />
                    <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2 animate-bounce" />
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Glisser-déposer des images ou cliquez ici pour en sélectionner</p>
                    <p className="text-[9px] text-slate-400 mt-1">Formats acceptés : JPG, PNG, WEBP (Max 4 images)</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Ou coller l'adresse URL d'une image d'objet..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addImageUrl();
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="px-4 py-2 bg-teal-600 hover:bg-slate-950 text-white rounded-lg text-xs font-black uppercase text-center transition-all cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </div>

                  {/* List of images added */}
                  {formImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-2 animate-fade-in">
                      {formImages.map((img, idx) => (
                        <div key={idx} className="h-16 rounded-lg relative overflow-hidden bg-slate-200 border border-slate-350">
                          <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => removeImageIndex(idx)}
                            className="absolute top-0.5 right-0.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-teal-600 hover:bg-slate-900 border-none rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-teal-500/10 hover:shadow-none hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:bg-slate-400"
                >
                  {isSubmitting ? (
                    <span>Indexation en cours...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {isEditing ? "Confirmer les modifications" : "Publier l'annonce maintenant"}
                    </>
                  )}
                </button>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-blocking custom alert and confirm modal fallback for iframe previews */}
      <AnimatePresence>
        {dialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700/80 text-center relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-100 dark:border-teal-900/60">
                {dialog.type === 'confirm' ? (
                  <Check className="w-6 h-6 animate-pulse" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>
              
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm mb-2">
                {dialog.title}
              </h3>
              
              <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed mb-6">
                {dialog.message}
              </p>
              
              <div className="flex gap-2 justify-center">
                {dialog.cancelLabel && (
                  <button
                    onClick={() => setDialog(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    {dialog.cancelLabel}
                  </button>
                )}
                <button
                  onClick={() => {
                    dialog.onPrimary?.();
                    setDialog(null);
                  }}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
                >
                  {dialog.primaryLabel || "D'accord"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
