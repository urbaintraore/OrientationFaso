import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  MapPin, 
  Clock, 
  DollarSign, 
  Filter, 
  Plus, 
  Search, 
  Calendar, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Award, 
  Send,
  Building,
  UserCheck,
  Tag
} from 'lucide-react';
import { Formation, UserProfile } from '../types';
import { formationService, DOMAINE_IMAGES, DEFAULT_FORMATION_IMAGE } from '../services/formationService';
import { motion, AnimatePresence } from 'motion/react';

interface FormationsHubProps {
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isEstablishment: boolean;
  onBackToHero?: () => void;
}

export function FormationsHub({ userProfile, isAdmin, isEstablishment, onBackToHero }: FormationsHubProps) {
  // Navigation tabs inside the Hub: 'catalog' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'catalog' | 'dashboard'>('catalog');
  
  // States for fetching and listing
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  
  // Filter States
  const [filterDomaine, setFilterDomaine] = useState<string>('');
  const [filterNiveau, setFilterNiveau] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterLieu, setFilterLieu] = useState<string>('');
  const [filterPrixMax, setFilterPrixMax] = useState<number>(1500000);
  const [usePrixFilter, setUsePrixFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Creation & Edition Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  
  // Form fields
  const [formTitre, setFormTitre] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDomaine, setFormDomaine] = useState('Informatique');
  const [formNiveau, setFormNiveau] = useState<'Débutant' | 'Intermédiaire' | 'Avancé'>('Débutant');
  const [formType, setFormType] = useState<'Présentiel' | 'En ligne' | 'Hybride'>('Présentiel');
  const [formDuree, setFormDuree] = useState('');
  const [formPrix, setFormPrix] = useState<string>('');
  const [formLieu, setFormLieu] = useState('');
  const [formDateDebut, setFormDateDebut] = useState('');
  const [formDateFin, setFormDateFin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Success Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canManage = isAdmin || isEstablishment;

  // Fetch Formations based on current views/filters
  const fetchFormationsList = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterDomaine) filters.domaine = filterDomaine;
      if (filterNiveau) filters.niveau = filterNiveau;
      if (filterType) filters.type = filterType;
      if (filterLieu) filters.lieu = filterLieu;
      if (usePrixFilter) filters.prixMax = filterPrixMax;
      
      const results = await formationService.getFormations(filters);
      
      // Clients of general catalog only see published ones, unless they are admin or owner
      let visible = results;
      if (activeTab === 'catalog') {
        visible = results.filter(f => f.statut === 'publie');
      } else if (activeTab === 'dashboard') {
        // Dashboard section shows draft or all owned ones
        if (isAdmin) {
          visible = results; // Admins see complete platform state
        } else {
          visible = results.filter(f => f.createur_id === userProfile?.uid);
        }
      }

      // Live search query matching title
      if (searchQuery) {
        visible = visible.filter(f => 
          f.titre.toLowerCase().includes(searchQuery.toLowerCase()) || 
          f.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFormations(visible);
    } catch (e: any) {
      console.error("Failed to load formations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormationsList();
  }, [activeTab, filterDomaine, filterNiveau, filterType, filterLieu, filterPrixMax, usePrixFilter, searchQuery, userProfile]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open creation or editing modal
  const handleOpenCreateModal = (formationToEdit?: Formation) => {
    if (!userProfile) {
      showNotification("S'il vous plaît connectez-vous d'abord.", "error");
      return;
    }
    
    if (formationToEdit) {
      setEditingFormation(formationToEdit);
      setFormTitre(formationToEdit.titre);
      setFormDescription(formationToEdit.description);
      setFormDomaine(formationToEdit.domaine);
      setFormNiveau(formationToEdit.niveau);
      setFormType(formationToEdit.type);
      setFormDuree(formationToEdit.duree);
      setFormPrix(formationToEdit.prix ? String(formationToEdit.prix) : '');
      setFormLieu(formationToEdit.lieu);
      setFormDateDebut(formationToEdit.date_debut);
      setFormDateFin(formationToEdit.date_fin);
    } else {
      setEditingFormation(null);
      setFormTitre('');
      setFormDescription('');
      setFormDomaine('Informatique');
      setFormNiveau('Débutant');
      setFormType('Présentiel');
      setFormDuree('');
      setFormPrix('');
      setFormLieu('');
      setFormDateDebut('');
      setFormDateFin('');
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save (Create or Update) Action
  const handleSaveFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (!formTitre || !formDescription || !formDuree || !formLieu || !formDateDebut || !formDateFin) {
      setFormError("Veuillez remplir correctement tous les champs obligatoires (*).");
      return;
    }

    setFormSaving(true);
    setFormError(null);

    const dataPayload = {
      titre: formTitre,
      description: formDescription,
      domaine: formDomaine,
      niveau: formNiveau,
      type: formType,
      duree: formDuree,
      prix: formPrix ? Number(formPrix) : undefined,
      lieu: formLieu,
      date_debut: formDateDebut,
      date_fin: formDateFin,
    };

    try {
      if (editingFormation) {
        // Update
        await formationService.updateFormation(editingFormation.id, dataPayload, userProfile);
        showNotification("Formation mise à jour avec succès !");
      } else {
        // Create
        await formationService.createFormation(dataPayload, userProfile);
        showNotification(
          isAdmin 
            ? "Formation créée et publiée instantanément !" 
            : "Formation enregistrée en brouillon. Soumise pour validation par l'administration."
        );
      }
      setIsModalOpen(false);
      fetchFormationsList();
    } catch (e: any) {
      setFormError(e.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setFormSaving(false);
    }
  };

  // Validation / Publication directly by Admin
  const handlePublishByAdmin = async (id: string) => {
    if (!userProfile || !isAdmin) return;
    try {
      await formationService.validateFormation(id, userProfile);
      showNotification("Formation approuvée et publiée avec succès !");
      fetchFormationsList();
      if (selectedFormation?.id === id) {
        setSelectedFormation(prev => prev ? { ...prev, statut: 'publie' } : null);
      }
    } catch (e: any) {
      showNotification(e.message || "Erreur lors de la publication.", "error");
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    if (!userProfile) return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible.")) {
      try {
        await formationService.deleteFormation(id, userProfile);
        showNotification("La formation a bien été supprimée.");
        setSelectedFormation(null);
        fetchFormationsList();
      } catch (e: any) {
        showNotification(e.message || "Erreur de suppression.", "error");
      }
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'publie':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="h-3 w-3" /> Validé & Publié
        </span>;
      case 'brouillon':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="h-3 w-3" /> En attente d'approbation (Brouillon)
        </span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200">
          <Clock className="h-3 w-3" /> Archivé
        </span>;
    }
  };

  return (
    <div id="formations-hub" className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Dynamic Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-24 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
              notification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className={`p-1.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
              {notification.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </div>
            <p className="font-semibold text-sm">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-medium mb-1.5">
            <Award className="h-5 w-5" />
            <span>Catalogue National des Formations</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Formations Professionnelles & Académiques</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Retrouvez les meilleures offres de formations diplômantes et certifiantes au Burkina Faso. Améliorez vos compétences ou trouvez une filière d'avenir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {canManage && (
            <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex gap-1.5 border border-slate-200">
              <button
                onClick={() => { setActiveTab('catalog'); setSelectedFormation(null); }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'catalog' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Catalogue Public
              </button>
              <button
                onClick={() => { setActiveTab('dashboard'); setSelectedFormation(null); }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                {isAdmin ? "Gestion Admin" : "Mes Formations"}
              </button>
            </div>
          )}

          {canManage && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all hover:scale-103 inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Nouvelle Formation
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-950 mb-4 pb-3 border-b border-slate-100">
              <Filter className="h-4 w-4 text-slate-500" />
              <span>Filtres de recherche</span>
            </div>

            {/* Keyword Search */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rechercher</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Mots-clés..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Domaine */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Domaine</label>
                <select
                  value={filterDomaine}
                  onChange={(e) => setFilterDomaine(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tous les domaines</option>
                  {Object.keys(DOMAINE_IMAGES).map(domainName => (
                    <option key={domainName} value={domainName}>{domainName}</option>
                  ))}
                </select>
              </div>

              {/* Niveau */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Niveau Requis</label>
                <select
                  value={filterNiveau}
                  onChange={(e) => setFilterNiveau(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tous niveaux</option>
                  <option value="Débutant">Débutant (Sans prérequis/Après BEPC)</option>
                  <option value="Intermédiaire">Intermédiaire (Bac / Lycée)</option>
                  <option value="Avancé">Avancé (Bac+2 / Professionnels)</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Type d'enseignement</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tous les types</option>
                  <option value="Présentiel">Présentiel</option>
                  <option value="En ligne">En ligne (E-Learning)</option>
                  <option value="Hybride">Hybride</option>
                </select>
              </div>

              {/* Lieu / Localisation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ville ou Établissement</label>
                <input
                  type="text"
                  placeholder="Ex: Ouagadougou..."
                  value={filterLieu}
                  onChange={(e) => setFilterLieu(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Price Range Slider */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Filtre de Budget</label>
                  <input
                    type="checkbox"
                    checked={usePrixFilter}
                    onChange={(e) => setUsePrixFilter(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                </div>
                {usePrixFilter && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input
                      type="range"
                      min="0"
                      max="1500000"
                      step="25000"
                      value={filterPrixMax}
                      onChange={(e) => setFilterPrixMax(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>0 F FCFA</span>
                      <span className="font-bold text-indigo-700">{filterPrixMax.toLocaleString()} F CFA</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setFilterDomaine('');
                  setFilterNiveau('');
                  setFilterType('');
                  setFilterLieu('');
                  setUsePrixFilter(false);
                  setSearchQuery('');
                }}
                className="w-full mt-2 py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-900 leading-none hover:bg-slate-50 rounded-xl transition-all"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        </div>

        {/* Formations Grid or Detail Component View */}
        <div className="space-y-6">
          {selectedFormation ? (
            /* Detailed Formation Display Card */
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden"
            >
              {/* Cover Banner */}
              <div className="h-64 relative bg-slate-900">
                <img
                  src={selectedFormation.image || DEFAULT_FORMATION_IMAGE}
                  alt={selectedFormation.titre}
                  className="w-full h-full object-cover opacity-75"
                />
                <button
                  onClick={() => setSelectedFormation(null)}
                  className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all flex items-center gap-1.5 font-bold text-xs"
                >
                  <X className="h-4 w-4" /> Fermer les détails
                </button>

                <div className="absolute top-4 right-4">
                  {getStatusBadge(selectedFormation.statut)}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <span className="inline-block px-3 py-1 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg mb-2">
                    {selectedFormation.domaine}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-md">
                    {selectedFormation.titre}
                  </h2>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex gap-2">
                    <div className="p-2 rounded-xl bg-white shadow-sm self-start text-emerald-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">DUREE</p>
                      <p className="text-xs font-extrabold text-slate-800">{selectedFormation.duree}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="p-2 rounded-xl bg-white shadow-sm self-start text-indigo-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">LOCALISATION / LIEU</p>
                      <p className="text-xs font-extrabold text-slate-800">{selectedFormation.lieu}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="p-2 rounded-xl bg-white shadow-sm self-start text-amber-600">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">NIVEAU REQUIS</p>
                      <p className="text-xs font-extrabold text-slate-800">{selectedFormation.niveau}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="p-2 rounded-xl bg-white shadow-sm self-start text-indigo-600">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">FRAIS D‘INSCRIPTION</p>
                      <p className="text-xs font-extrabold text-slate-800">
                        {selectedFormation.prix ? `${selectedFormation.prix.toLocaleString()} F CFA` : 'Gratuit'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Contents */}
              <div className="p-8 grid md:grid-cols-[1fr_300px] gap-8">
                {/* Information Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                      <BookOpen className="h-5 w-5 text-indigo-500" /> Description de la Formation
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line text-justify">
                      {selectedFormation.description}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <Calendar className="h-8 w-8 text-indigo-600" />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Calendrier de la session</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Début du programme le <strong className="text-slate-800">{new Date(selectedFormation.date_debut).toLocaleDateString('fr-FR')}</strong> et fin prévue vers le <strong className="text-slate-800">{new Date(selectedFormation.date_fin).toLocaleDateString('fr-FR')}</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submitting Center/Creator Info Panel */}
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <div className="h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <Building className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">Organisme de Formation</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4 flex items-center justify-center gap-1">
                      <Tag className="h-3 w-3 text-indigo-500" />
                      Type de d'organisation: {selectedFormation.createur_type === 'admin' ? "Ministère d'orientation / Admin" : "Établissement enregistré"}
                    </p>
                    
                    <a
                      href={`mailto:contact@orientationbf.com?subject=Demande d'information pour ${selectedFormation.titre}`}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-colors inline-block text-center"
                    >
                      Contacter l'Organisme
                    </a>
                  </div>

                  {/* Owner Controls */}
                  {userProfile && (isAdmin || selectedFormation.createur_id === userProfile.uid) && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-amber-200/60 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-center text-amber-800">
                        Panneau de Contrôle Directeur
                      </h4>

                      {/* Publish / Validate Action */}
                      {isAdmin && selectedFormation.statut === 'brouillon' && (
                        <button
                          onClick={() => handlePublishByAdmin(selectedFormation.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" /> Approuver & Publier
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleOpenCreateModal(selectedFormation)}
                          className="py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" /> Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(selectedFormation.id)}
                          className="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Catalogue Lists */
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-slate-500 font-medium text-sm">Chargement des données en temps réel...</p>
                </div>
              ) : formations.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
                  <div className="h-16 w-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Aucune formation trouvée</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                    Nous n'avons pas trouvé de formation correspondant à vos critères actuels. Essayez d'élargir votre filtre ou recherchez d’autres mots-clés.
                  </p>
                  <button
                    onClick={() => {
                      setFilterDomaine('');
                      setFilterNiveau('');
                      setFilterType('');
                      setFilterLieu('');
                      setUsePrixFilter(false);
                      setSearchQuery('');
                    }}
                    className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold text-xs rounded-xl transition-all"
                  >
                    Effacer tous les filtres
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {formations.map((fn) => (
                    <motion.div
                      layoutId={`form-card-${fn.id}`}
                      key={fn.id}
                      onClick={() => {
                        setSelectedFormation(fn);
                        window.scrollTo({ top: document.getElementById('formations-hub')?.offsetTop || 0, behavior: 'smooth' });
                      }}
                      className="group cursor-pointer bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-1"
                    >
                      {/* Image Thumbnail */}
                      <div className="h-44 relative bg-slate-900">
                        <img
                          src={fn.image || DEFAULT_FORMATION_IMAGE}
                          alt={fn.titre}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500 text-transparent"
                        />
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-white/95 text-slate-900 font-bold text-[8px] uppercase rounded-md shadow-sm">
                            {fn.type}
                          </span>
                        </div>

                        {activeTab === 'dashboard' && (
                          <div className="absolute top-3 right-3">
                            {fn.statut === 'publie' ? (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white font-semibold text-[8px] rounded-md shadow">
                                Publié
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-500 text-white font-semibold text-[8px] rounded-md shadow">
                                Brouillon
                              </span>
                            )}
                          </div>
                        )}

                        <div className="absolute bottom-3 left-3">
                          <span className="px-2.5 py-0.5 bg-indigo-600/90 text-white font-extrabold text-[8px] rounded-lg tracking-wider uppercase">
                            {fn.domaine}
                          </span>
                        </div>
                      </div>

                      {/* Details Area */}
                      <div className="p-5 space-y-3.5">
                        <h3 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {fn.titre}
                        </h3>

                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                          {fn.description}
                        </p>

                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            {fn.duree}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                            {fn.lieu.split('-')[0].trim()}
                          </span>
                          <span className="text-slate-900 font-black">
                            {fn.prix ? `${fn.prix.toLocaleString()} F CFA` : 'Gratuit'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Creation & Edition Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-950 text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  {editingFormation ? "Modifier la Formation" : "Créer une Nouvelle Formation"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFormation} className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Titre */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titre de la Formation *</label>
                  <input
                    type="text"
                    required
                    value={formTitre}
                    onChange={(e) => setFormTitre(e.target.value)}
                    placeholder="Ex: Technicien Webmaster Cloud"
                    className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description Détaillée *</label>
                  <textarea
                    required
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Saisissez la description du programme, matières enseignées, compétences visées, carrières..."
                    className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                </div>

                {/* Domaine & Niveau Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Domaine d'Activité *</label>
                    <select
                      value={formDomaine}
                      onChange={(e) => setFormDomaine(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.keys(DOMAINE_IMAGES).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Niveau d’admission *</label>
                    <select
                      value={formNiveau}
                      onChange={(e: any) => setFormNiveau(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                    </select>
                  </div>
                </div>

                {/* Type, Durée, Prix */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type de cours *</label>
                    <select
                      value={formType}
                      onChange={(e: any) => setFormType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Présentiel">Présentiel</option>
                      <option value="En ligne">En ligne</option>
                      <option value="Hybride">Hybride</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Durée globale *</label>
                    <input
                      type="text"
                      required
                      value={formDuree}
                      onChange={(e) => setFormDuree(e.target.value)}
                      placeholder="Ex: 3 ans, 6 mois"
                      className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Frais d'inscription (FCFA)</label>
                    <input
                      type="number"
                      value={formPrix}
                      onChange={(e) => setFormPrix(e.target.value)}
                      placeholder="Laisser vide si gratuit"
                      className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Lieu & Calendrier */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Adresse / Lieu *</label>
                    <input
                      type="text"
                      required
                      value={formLieu}
                      onChange={(e) => setFormLieu(e.target.value)}
                      placeholder="Ex: Ouagadougou - EST"
                      className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date de début *</label>
                    <input
                      type="date"
                      required
                      value={formDateDebut}
                      onChange={(e) => setFormDateDebut(e.target.value)}
                      className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date de fin *</label>
                    <input
                      type="date"
                      required
                      value={formDateFin}
                      onChange={(e) => setFormDateFin(e.target.value)}
                      className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Submitting Buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    {formSaving ? (
                      <span className="inline-block animate-spin h-3.5 w-3.5 border-t-2 border-slate-200 rounded-full"></span>
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {editingFormation ? "Sauvegarder" : "Créer la formation"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
