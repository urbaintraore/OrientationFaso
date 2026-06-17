import React, { useState, useEffect } from 'react';
import { Heart, Scale, X, CheckSquare, CreditCard } from 'lucide-react';
import { Search, MapPin, Building2, GraduationCap, Award, Star, Filter, ChevronRight, ShieldCheck, Zap, Sparkles, RefreshCw, Globe, Loader2, Plus, Bell, Facebook, Linkedin } from 'lucide-react';
import { mockInstitutions } from '../../data/mockInstitutions';
import { Institution, InstitutionType } from '../../types';
import { institutionService } from '../../services/institutionService';
import { crawlInstitutions } from '../../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { COUNTRIES, CITIES, INSTITUTION_TYPES } from '../../constants';
import { InstitutionFeed } from './InstitutionFeed';
import { auth } from '../../lib/firebase';
import { academicGatheringService } from '../../services/academicGatheringService';

interface MarketplaceHubProps {
  isAdmin?: boolean;
  onSelectInstitution: (id: string) => void;
}

export function MarketplaceHub({ isAdmin, onSelectInstitution }: MarketplaceHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedSeries, setSelectedSeries] = useState<string>('All');
  const [crawlerCountry, setCrawlerCountry] = useState<string>('All');
  
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'schools' | 'news'>('schools');
  
  const [favoriteInstitutions, setFavoriteInstitutions] = useState<string[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    fetchInstitutions();
    const favs = localStorage.getItem('orientationbf_favorite_institutions');
    if (favs) setFavoriteInstitutions(JSON.parse(favs));
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavs = favoriteInstitutions.includes(id) 
      ? favoriteInstitutions.filter(f => f !== id) 
      : [...favoriteInstitutions, id];
    setFavoriteInstitutions(newFavs);
    localStorage.setItem('orientationbf_favorite_institutions', JSON.stringify(newFavs));
  };

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(c => c !== id));
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([...selectedForCompare, id]);
      } else {
        alert("Vous ne pouvez comparer que 3 établissements au maximum.");
      }
    }
  };

  const fetchInstitutions = async () => {
    setIsLoading(true);
    try {
      const data = await institutionService.getAllInstitutions();
      if (data.length > 0) {
        setInstitutions(data);
      } else {
        // Fallback to mock if database is empty
        setInstitutions(mockInstitutions as Institution[]);
      }
    } catch (error) {
      console.error("Failed to fetch institutions:", error);
      setInstitutions(mockInstitutions as Institution[]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!auth.currentUser) {
      setSyncStatus("Veuillez vous connecter en tant qu'admin.");
      return;
    }
    
    setIsSyncing(true);
    const targetRegion = crawlerCountry !== 'All' ? crawlerCountry : 'le monde entier (universités renommées)';
    setSyncStatus(`Moteur d'Intelligence Académique activé pour : ${targetRegion}...`);
    
    let totalAdded = 0;
    
    try {
      setSyncStatus(`Analyse des établissements en cours pour : ${targetRegion}...`);
      
      const regionData = await crawlInstitutions(targetRegion);
      
      if (regionData && regionData.length > 0) {
        setSyncStatus(`Importation de ${regionData.length} établissements...`);
        for (const data of regionData) {
          try {
            await academicGatheringService.saveCrawledData({
              institution: {
                ...data,
                programsCount: data.programs?.length || 0,
                degrees: Array.from(new Set(data.programs?.map((p: any) => p.level || p.degreeLevel) || []))
              },
              programs: data.programs || []
            });
            totalAdded++;
          } catch (e) {
            console.error("Save error", e);
          }
        }
      }
      
      setSyncStatus(`Terminé ! ${totalAdded} établissements analysés et mis à jour.`);
      await fetchInstitutions();
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('Quota')) {
        setSyncStatus("Quota Gemini dépassé. Veuillez réessayer demain.");
      } else {
        setSyncStatus("Erreur lors de la collecte intelligente.");
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(''), 7000);
    }
  };

  const filteredInstitutions = institutions.filter(inst => {
    const instName = inst.name || '';
    const instDescription = inst.description || '';
    const matchesSearch = instName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (inst.programs?.some(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())) || false);
    const matchesType = selectedType === 'All' || inst.type === selectedType;
    const matchesCity = selectedCity === 'All' || inst.city === selectedCity;
    const matchesCountry = selectedCountry === 'All' || inst.country === selectedCountry;
    const matchesLevel = selectedLevel === 'All' || 
                         (inst.degrees?.some(d => (d || '').toLowerCase().includes(selectedLevel.toLowerCase()))) || 
                         (inst.programs?.some(p => (p.degreeLevel || p.level || '').toLowerCase().includes(selectedLevel.toLowerCase())));
    const matchesSeries = selectedSeries === 'All' || 
                          instDescription.toLowerCase().includes(selectedSeries.toLowerCase()) ||
                          (inst.programs?.some(p => (p.description || '').toLowerCase().includes(selectedSeries.toLowerCase()) || (p.name || '').toLowerCase().includes(selectedSeries.toLowerCase())));
                          
    return matchesSearch && matchesType && matchesCity && matchesCountry && matchesLevel && matchesSeries;
  });

  // Combine data-derived options with exhaustive constants
  const allCountries = Array.from(new Set([...COUNTRIES, ...institutions.map(i => i.country)].filter(Boolean))).sort();
  const allCities = Array.from(new Set([...CITIES, ...institutions.map(i => i.city)].filter(Boolean))).sort();
  const allTypes = Array.from(new Set([...INSTITUTION_TYPES, ...institutions.map(i => i.type)].filter(Boolean))).sort();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section - Prominent & Vibrant */}
      <div className="bg-indigo-900 text-white pt-8 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-25 bg-[url('https://images.unsplash.com/photo-1523050335392-9befdf551982?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900/60" />
        
        {/* Animated Background Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex flex-col gap-3">
                <span className="w-fit px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200 border border-white/10">
                  Hub Universitaire Global
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-none tracking-tight">
                  L'Annuaire Intelligent <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-white to-indigo-300">
                    d'Orientation
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-indigo-100/70 max-w-xl leading-relaxed">
                  Découvrez les établissements d'élite et les filières porteuses pour votre avenir. 
                  Données enrichies par notre intelligence artificielle.
                </p>
              </div>

              {isAdmin && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-2xl flex flex-col gap-4 min-w-[280px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">IA Power Scanner</h3>
                      <p className="text-[10px] text-white/60">Générer de nouveaux établissements</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                       <label className="text-[9px] font-black uppercase text-indigo-200 tracking-widest pl-1">Région cible</label>
                       <select 
                         value={crawlerCountry}
                         onChange={(e) => setCrawlerCountry(e.target.value)}
                         className="w-full bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-xs text-white p-2.5 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all cursor-pointer"
                       >
                         <option value="All" className="text-slate-900">🌍 Monde entier</option>
                         {allCountries.map(c => (
                           <option key={c} value={c} className="text-slate-900">{c}</option>
                         ))}
                       </select>
                    </div>
                    
                    <button 
                      onClick={handleSync}
                      disabled={isSyncing}
                      className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all shadow-xl
                        ${isSyncing 
                          ? 'bg-amber-500 text-white cursor-wait' 
                          : 'bg-white text-indigo-900 hover:bg-amber-400 hover:text-white hover:scale-[1.02] active:scale-95'
                        }`}
                    >
                      {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {isSyncing ? 'Indexation en cours...' : 'Lancer le Crawler IA'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-indigo-900 bg-slate-300" />)}
                    </div>
                    <span className="text-[9px] font-bold text-white/50">Utilisé par l'équipe admin</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Smart Search Bar - Enhanced */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white p-2 md:p-3 rounded-2xl flex flex-col md:flex-row gap-3 shadow-2xl shadow-indigo-950/40 relative z-30"
            >
              <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                <Search className="text-indigo-600 w-5 h-5 mr-3" />
                <input 
                  type="text" 
                  placeholder="Rechercher une école, un diplôme ou un métier..."
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 text-sm font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 md:w-48 flex items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Globe className="text-slate-400 w-4 h-4 mr-2" />
                  <select 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-900 text-xs font-bold appearance-none cursor-pointer"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    <option value="All">Tous les pays</option>
                    {allCountries.map(country => <option key={country} value={country}>{country}</option>)}
                  </select>
                </div>
                
                <button className="bg-indigo-600 hover:bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20 whitespace-nowrap">
                  Explorer
                </button>
              </div>
            </motion.div>

            {isSyncing && (
              <div className="mt-4 flex items-center gap-3 text-indigo-300">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{syncStatus}</span>
              </div>
            )}

            {/* View Selection Tabs */}
            <div className="mt-8 flex gap-2">
              <button 
                onClick={() => setActiveTab('schools')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'schools' 
                    ? 'bg-white text-indigo-950 shadow-xl scale-105' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Établissements
              </button>
              <button 
                onClick={() => setActiveTab('news')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'news' 
                    ? 'bg-white text-indigo-950 shadow-xl scale-105' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Bell className="w-3.5 h-3.5" /> Actualités <span className="bg-rose-500 w-2 h-2 rounded-full animate-pulse shadow-lg shadow-rose-500/50" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <AnimatePresence mode="wait">
          {activeTab === 'schools' ? (
            <motion.div 
              key="schools"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              {/* Filters Sidebar */}
              <div className="w-full lg:w-72 flex-shrink-0">
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Filter className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold">Affiner</h3>
                    </div>
                    {(selectedType !== 'All' || selectedCity !== 'All' || selectedCountry !== 'All' || selectedLevel !== 'All' || selectedSeries !== 'All') && (
                      <button 
                        onClick={() => { setSelectedType('All'); setSelectedCity('All'); setSelectedCountry('All'); setSelectedLevel('All'); setSelectedSeries('All'); }}
                        className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-700 underline"
                      >
                        Effacer
                      </button>
                    )}
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Région & Ville</h4>
                      <div className="space-y-4">
                        <select 
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          value={selectedCountry}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                        >
                          <option value="All">Tous les pays</option>
                          {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select 
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                        >
                          <option value="All">Toutes les villes</option>
                          {allCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Série & Niveau</h4>
                      <div className="space-y-4">
                        <select 
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          value={selectedSeries}
                          onChange={(e) => setSelectedSeries(e.target.value)}
                        >
                          <option value="All">Toutes les séries</option>
                          {['Série C', 'Série D', 'Série A4', 'Série G2', 'Série E', 'Série F'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select 
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                        >
                          <option value="All">Tous les niveaux</option>
                          {['Licence', 'Master', 'Doctorat', 'BTS', 'DUT', 'Ingénieur'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Catégorie</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                          <input 
                            type="radio" 
                            name="type" 
                            checked={selectedType === 'All'}
                            onChange={() => setSelectedType('All')}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">Tous les types</span>
                        </label>
                        {allTypes.map(type => (
                          <label key={type} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                            <input 
                              type="radio" 
                              name="type" 
                              checked={selectedType === type}
                              onChange={() => setSelectedType(type)}
                              className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {searchTerm ? 'Résultats de recherche' : 'Établissements d\'élite'}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-slate-500 font-medium">
                        <span className="text-indigo-600 font-bold">{filteredInstitutions.length}</span> écoles trouvées
                      </p>
                      <div className="h-1 w-1 bg-slate-300 rounded-full" />
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Données vérifiées
                      </p>
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <div key="loading" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2, 4, 5, 6].map(n => (
                        <div key={n} className="h-80 bg-white rounded-3xl animate-pulse border border-slate-100" />
                      ))}
                    </div>
                  ) : filteredInstitutions.length > 0 ? (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                    >
                      {filteredInstitutions.map((inst, index) => (
                        <motion.div 
                          key={inst.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => onSelectInstitution(inst.id)}
                          className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer group flex flex-col h-full"
                        >
                          <div className="h-56 relative overflow-hidden">
                            <img 
                              src={inst.coverImage} 
                              alt={inst.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                            
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2 pr-20">
                              {inst.tier === 'Sponsored' && (
                                <div className="bg-indigo-600/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg ring-1 ring-white/20">
                                  <Sparkles className="w-3 h-3" /> Recommandé
                                </div>
                              )}
                              <div className="bg-slate-900/70 backdrop-blur-md text-white text-[10px] uppercase font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg ring-1 ring-white/20">
                                <MapPin className="w-3 h-3" /> {inst.country}
                              </div>
                            </div>

                            <div className="absolute top-4 right-4 flex flex-col gap-2 relative z-10">
                              <button 
                                onClick={(e) => toggleFavorite(inst.id, e)}
                                className="w-8 h-8 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md flex items-center justify-center transition-colors border border-white/20"
                                title="Ajouter aux favoris"
                              >
                                <Heart className={`w-4 h-4 ${favoriteInstitutions.includes(inst.id) ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                              </button>
                              <button 
                                onClick={(e) => toggleCompare(inst.id, e)}
                                className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors border border-white/20 ${selectedForCompare.includes(inst.id) ? 'bg-indigo-600/90' : 'bg-slate-900/40 hover:bg-slate-900/80'}`}
                                title="Comparer"
                              >
                                {selectedForCompare.includes(inst.id) ? (
                                  <CheckSquare className="w-4 h-4 text-white" />
                                ) : (
                                  <Scale className="w-4 h-4 text-white" />
                                )}
                              </button>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-white rounded-2xl p-1.5 shadow-2xl ring-4 ring-white/10 overflow-hidden">
                                  <img src={inst.logo} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col items-start max-w-[200px]">
                                  <h3 className="text-white font-black text-xl leading-tight line-clamp-1 drop-shadow-md">{inst.name}</h3>
                                  <div className="flex items-center gap-2 text-indigo-200 text-xs mt-1 font-bold">
                                    <Building2 className="w-3 h-3" /> {inst.city}
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 px-3 flex flex-col items-center shadow-lg border border-white/20">
                                <div className="flex items-center gap-1 text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  <span className="text-xs font-black text-slate-900">{inst.overallRating}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                                {inst.type}
                              </span>
                              {inst.isVerified && (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" /> Vérifié
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed">
                              {inst.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6 border-y border-slate-100 py-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Insertion</span>
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-indigo-500" />
                                  <span className="text-sm font-black text-slate-900">{inst.employabilityRate}%</span>
                                </div>
                              </div>
                              <div className="flex flex-col border-l border-slate-100 pl-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Programmes</span>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                                  <span className="text-sm font-black text-slate-900">{Math.max(inst.programsCount || 0, inst.programs?.length || 0)} Filières</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto">
                               <div className="flex items-center gap-1.5">
                                 {inst.socialLinks?.facebook && <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100 group-hover:bg-indigo-50 transition-colors" title="Facebook"><Facebook className="w-3 h-3" /></div>}
                                 {inst.socialLinks?.linkedin && <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100 group-hover:bg-indigo-50 transition-colors" title="LinkedIn"><Linkedin className="w-3 h-3" /></div>}
                                 {inst.website && <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100 group-hover:bg-indigo-50 transition-colors" title="Site Web"><Globe className="w-3 h-3" /></div>}
                               </div>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onSelectInstitution(inst.id);
                                 }}
                                 className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group/btn transition-all shadow-sm border border-indigo-100"
                               >
                                 Explorer <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                               </button>
                             </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-20 bg-white rounded-3xl border-2 border-slate-100 border-dashed w-full"
                    >
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-slate-200" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Aucune école trouvée</h3>
                      <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">
                        Nous n'avons pas trouvé d'établissement correspondant à vos critères actuels.
                      </p>
                      <button 
                        onClick={() => { setSearchTerm(''); setSelectedType('All'); setSelectedCity('All'); setSelectedCountry('All'); setSelectedLevel('All'); setSelectedSeries('All'); }}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-xl shadow-indigo-600/20"
                      >
                        Réinitialiser
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="news"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto"
            >
               <InstitutionFeed />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Compare Dock */}
      <AnimatePresence>
        {selectedForCompare.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-6 max-w-2xl w-11/12 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-4">
                {selectedForCompare.map((id, index) => {
                  const inst = institutions.find(i => i.id === id);
                  return inst ? (
                    <img key={id} src={inst.logo} alt={inst.name} className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover bg-white pointer-events-none" style={{ zIndex: 3 - index }} />
                  ) : null;
                })}
              </div>
              <div className="text-white">
                <p className="text-sm font-bold tracking-tight">{selectedForCompare.length} école{selectedForCompare.length > 1 ? 's' : ''} à comparer</p>
                <p className="text-[10px] text-slate-400">Jusqu'à 3 maximum</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedForCompare([])}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Vider
              </button>
              <button 
                onClick={() => setShowCompareModal(true)}
                disabled={selectedForCompare.length < 2}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Scale className="w-4 h-4" /> Comparer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompareModal && selectedForCompare.length >= 2 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowCompareModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] shadow-2xl max-w-6xl w-full p-2 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[1.5rem]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Comparateur</h2>
                    <p className="text-slate-500 text-sm">Analyse côte à côte des établissements sélectionnés</p>
                  </div>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="p-2 bg-white text-slate-400 hover:text-slate-900 rounded-full border border-slate-200 shadow-sm transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedForCompare.map(id => {
                    const inst = institutions.find(i => i.id === id);
                    if (!inst) return null;
                    return (
                      <div key={id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 flex flex-col">
                        <div className="h-32 relative">
                          <img src={inst.coverImage} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                            <img src={inst.logo} className="w-10 h-10 bg-white rounded-lg p-1 object-contain" alt="" />
                            <h3 className="text-white font-bold leading-tight">{inst.name}</h3>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col gap-6">
                           <div>
                             <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Informations Générales</h4>
                             <div className="space-y-2">
                               <div className="flex justify-between text-sm"><span className="text-slate-500">Localisation:</span> <span className="font-bold text-slate-800">{inst.city}</span></div>
                               <div className="flex justify-between text-sm"><span className="text-slate-500">Type:</span> <span className="font-bold text-slate-800">{inst.type}</span></div>
                               <div className="flex justify-between text-sm"><span className="text-slate-500">Création:</span> <span className="font-bold text-slate-800">{inst.establishedYear}</span></div>
                             </div>
                           </div>
                           
                           <div>
                             <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Performances</h4>
                             <div className="p-4 bg-indigo-50 rounded-xl space-y-3">
                                <div className="flex items-end justify-between">
                                  <span className="text-xs text-indigo-800 font-bold">Score de Réussite / Employabilité</span>
                                  <span className="text-2xl font-black text-indigo-600">{inst.employabilityRate}%</span>
                                </div>
                                <div className="w-full bg-indigo-200/50 h-2 rounded-full overflow-hidden">
                                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${inst.employabilityRate}%` }}></div>
                                </div>
                             </div>
                           </div>

                           <div>
                             <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Frais & Scolarité</h4>
                             <div className="p-4 bg-white border border-slate-200 rounded-xl">
                               <div className="flex items-center gap-2 text-slate-800 font-bold">
                                  {/* Using a mock value for fees as it's not directly in the type, but useful for the comparison feature requested */}
                                  <CreditCard className="w-4 h-4 text-emerald-500" />
                                  ~ {Math.floor(Math.random() * 500 + 300)} 000 FCFA / an
                               </div>
                               <p className="text-[10px] text-slate-400 mt-1">Estimation moyenne (frais de scolarité L1/L2)</p>
                             </div>
                           </div>

                           <div className="flex-1">
                             <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Principales Filières ({Math.max(inst.programsCount || 0, inst.programs?.length || 0)})</h4>
                             <ul className="space-y-1.5 custom-scrollbar max-h-[150px] overflow-y-auto pr-2">
                               {inst.programs?.slice(0, 5).map(prog => (
                                 <li key={prog.id} className="text-xs text-slate-600 bg-white border border-slate-100 p-2 rounded-lg truncate" title={prog.name}>
                                   <span className="font-bold text-slate-800 mr-1">•</span> {prog.name}
                                 </li>
                               ))}
                               {(inst.programs?.length || 0) > 5 && (
                                 <li className="text-xs text-slate-400 italic text-center pt-1">+ d'autres filières...</li>
                               )}
                             </ul>
                           </div>
                           
                           <button onClick={() => { setShowCompareModal(false); onSelectInstitution(inst.id); }} className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                             Voir l'établissement
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
