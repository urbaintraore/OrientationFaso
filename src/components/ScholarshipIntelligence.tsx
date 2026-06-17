import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { crawlScholarshipMarket } from '../services/gemini';
import { 
  Search, 
  Filter, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Download,
  AlertCircle,
  Globe,
  Share2,
  Heart,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Plus,
  Zap,
  Tag
} from 'lucide-react';
import { Scholarship, StudentProfile, PostBacProfile } from '../types';
import { scholarshipService } from '../services/scholarshipService';
import { COUNTRIES } from '../constants';

interface ScholarshipIntelligenceProps {
  isAdmin?: boolean;
  userProfile?: StudentProfile | PostBacProfile | null;
}

export function ScholarshipIntelligence({ isAdmin, userProfile }: ScholarshipIntelligenceProps) {
  const [scholarships, setScholarships] = useState<Scholarship[]>(() => {
    try {
      const cached = localStorage.getItem('orientationbf_cached_scholarships_data');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('orientationbf_cached_scholarships_data');
      return cached ? JSON.parse(cached).length === 0 : true;
    } catch {
      return true;
    }
  });
  const [isApiOnline, setIsApiOnline] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recommendOnly, setRecommendOnly] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    fetchScholarships();
    checkApiStatus();
  }, [countryFilter, levelFilter, yearFilter, categoryFilter, showExpired]);

  const checkApiStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setIsApiOnline(true);
      } else {
        setIsApiOnline(false);
      }
    } catch (e) {
      setIsApiOnline(false);
    }
  };

  const fetchScholarships = async () => {
    if (scholarships.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await scholarshipService.getAllScholarships({
        country: countryFilter,
        degreeLevel: levelFilter,
        academicYear: yearFilter,
        category: categoryFilter,
        isExpired: showExpired ? undefined : false
      });
      console.log("Scholarships fetched:", data.length);
      setScholarships(data);
      localStorage.setItem('orientationbf_cached_scholarships_data', JSON.stringify(data));
    } catch (err: any) {
      console.error('Failed to fetch scholarships:', err);
      // Extraire le message JSON si possible
      try {
        const errObj = JSON.parse(err.message);
        setError(`Erreur Firestore (${errObj.operationType} sur ${errObj.path}): ${errObj.error}`);
      } catch {
        setError(err.message || "Impossible de charger les bourses.");
      }
    } finally {
      setLoading(false);
    }
  };

  const [syncReport, setSyncReport] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncReport(null);
    
    // Professionally-tailored status messages to cycle during background crawling API calls
    const statusMessages = [
      "Initialisation du scan mondial via l'IA de recherche...",
      "Exploration des bases de données DAAD (Allemagne) & Campus France...",
      "Scan des communiqués officiels du CIOSPB (Burkina Faso)...",
      "Analyse des opportunités du Royaume du Maroc (AMCI)...",
      "Indexation des bourses de la Fondation Mastercard...",
      "Analyse de l'éligibilité pour les étudiants burkinabè (Aide & Logement)...",
      "Filtrage intelligent des opportunités expirées..."
    ];
    
    let msgIndex = 0;
    setSyncStatus(statusMessages[0]);
    
    const intervalId = setInterval(() => {
      msgIndex = (msgIndex + 1) % statusMessages.length;
      setSyncStatus(statusMessages[msgIndex]);
    }, 2800);

    try {
      console.log("Starting Deep AI Sync...");
      const academicYearsList = ['2025/2026', '2026/2027'];
      const response = await crawlScholarshipMarket(academicYearsList);
      
      clearInterval(intervalId);
      
      const crawledData = response.data;
      const report = response.report;
      
      if (crawledData && crawledData.length > 0) {
        setSyncStatus(`Scan de l'IA terminé. ${crawledData.length} opportunités collectées. Début de l'analyse...`);
        await new Promise(r => setTimeout(r, 1500));
        
        // Fetch current list once to have up-to-date titles for duplicate checking
        const currentScholarships = await scholarshipService.getAllScholarships();
        
        let importedCount = 0;
        let skippedCount = 0;
        
        for (let i = 0; i < crawledData.length; i++) {
          const item = crawledData[i];
          const progressInfo = `(${i + 1}/${crawledData.length})`;
          
          try {
            const alreadyExists = currentScholarships.some(s => 
              s && s.title && item.title && 
              s.title.trim().toLowerCase() === item.title.trim().toLowerCase()
            );

            if (alreadyExists) {
              skippedCount++;
              setSyncStatus(`Analyse ${progressInfo} : Déjà existant et à jour : "${item.title.substring(0, 30)}..."`);
            } else {
              await scholarshipService.addScholarship(item);
              importedCount++;
              setSyncStatus(`Analyse ${progressInfo} : Importation réussie : "${item.title.substring(0, 30)}..."`);
            }
          } catch (e) {
            console.warn("Could not process one scholarship:", e);
          }
          // Intentionally wait 1200ms per item to make the workflow visible and premium
          await new Promise(r => setTimeout(r, 1200));
        }
        
        setSyncStatus("Mise à jour de l'affichage local...");
        await fetchScholarships();
        await new Promise(r => setTimeout(r, 800));
        
        // Build final sync report that accurately reflects the number imported VS found
        const finalReport = report ? {
          ...report,
          nbFound: crawledData.length,
          nbImported: importedCount
        } : {
          timestamp: new Date().toISOString(),
          sourcesChecked: ["Auto-crawl"],
          nbFound: crawledData.length,
          nbImported: importedCount,
          executionTime: 0,
          status: "SUCCESS"
        };
        
        setSyncReport(finalReport);
        if (importedCount > 0) {
          setSyncStatus(`Synchronisation terminée ! ${importedCount} nouvelles bourses importées, ${skippedCount} déjà enregistrées.`);
        } else {
          setSyncStatus(`Synchronisation terminée ! Toutes les ${skippedCount} bourses trouvées sont déjà à jour.`);
        }
      } else {
        setSyncReport(report);
        setSyncStatus("Aucune nouvelle bourse détectée sur les sources officielles lors de ce scan.");
      }
    } catch (err: any) {
      clearInterval(intervalId);
      console.error("Sync failed:", err);
      setError(`Échec de la synchronisation intelligente: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(''), 10000);
    }
  };

  const isRecommended = (scholarship: Scholarship) => {
    if (!userProfile || !scholarship) return false;
    const userLevelHeuristic = ('bepcAverage' in userProfile) ? 'Licence' : 'Master'; 
    const degreeLevel = scholarship.degreeLevel || '';
    const matchesLevel = degreeLevel.toLowerCase().includes(userLevelHeuristic.toLowerCase());
    return matchesLevel && !!scholarship.isForBurkina;
  };

  const filteredScholarships = scholarships.filter(s => {
    if (!s) return false;
    const title = s.title || '';
    const org = s.organization || '';
    const country = s.country || '';
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRecommendation = !recommendOnly || isRecommended(s);
    
    return matchesSearch && matchesRecommendation;
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-indigo-900 text-white py-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-indigo-800/50 border border-indigo-700/50 text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1"
            >
              <Sparkles className="w-3 h-3" />
              IA & Automatisation
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl lg:text-3xl font-black mb-1 leading-tight"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">OrientationBF Bourses Intelligence</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-indigo-100/70 mb-3 leading-relaxed"
            >
              Opportunités de financement analysées par IA en temps réel.
            </motion.p>
            
            <div className="mt-2 flex flex-wrap items-center gap-4 py-2 px-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${isApiOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-500'} ${isSyncing ? 'animate-ping' : 'animate-pulse'}`} />
                <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">
                  {isSyncing ? 'Sync IA...' : (isApiOnline ? 'Crawler Actif' : 'Hors ligne')}
                </p>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{scholarships.length}</span>
                <span className="text-[10px] text-indigo-300 uppercase font-bold">Bourses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-2 pb-20">
        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => fetchScholarships()} className="ml-auto text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors">Réessayer</button>
          </motion.div>
        )}

        {/* Admin Diagnostic Report */}
        {isAdmin && syncReport && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-6 bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden border border-slate-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${syncReport.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Rapport de Diagnostic Moteur</h3>
                  <p className="text-xs text-slate-400 font-mono">Exécuté à {new Date(syncReport.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                syncReport.status === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                {syncReport.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Bourses Trouvées</p>
                <p className="text-xl font-bold">{syncReport.nbFound}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Importées</p>
                <p className="text-xl font-bold">{syncReport.nbImported}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Temps d'exécution</p>
                <p className="text-xl font-bold">{syncReport.executionTime}ms</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Sources</p>
                <p className="text-xl font-bold">{syncReport.sourcesChecked?.length || 0}</p>
              </div>
            </div>

            {syncReport.errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs mb-6 font-mono">
                <strong>Erreur détectée:</strong> {syncReport.errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <p className="w-full text-[10px] text-slate-400 uppercase font-black mb-1">Périmètre de Scan:</p>
                {syncReport.sourcesChecked?.map((s: string) => (
                  <span key={s} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] text-slate-300 font-medium">
                    {s}
                  </span>
                ))}
              </div>

              {syncReport.foundLinks && syncReport.foundLinks.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black mb-2">Sources Web Identifiées (Grounding):</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {syncReport.foundLinks.map((link: string, idx: number) => (
                      <a 
                        key={idx} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded bg-white/5 border border-white/10 text-[10px] text-indigo-300 hover:text-white hover:bg-white/10 transition-colors truncate flex items-center gap-2"
                      >
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Search & Filters Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 mb-12">
          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Recherche..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="all">Tous types d'aide</option>
              <option value="Bourse">Bourses d'études</option>
              <option value="Aide Financière">Aides financières</option>
              <option value="Financement Participatif">Financements</option>
              <option value="Prêt Étudiant">Prêts</option>
            </select>

            <select 
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Tous les pays</option>
              {Array.from(new Set([...COUNTRIES, ...scholarships.map(s => s?.country).filter(Boolean)])).sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select 
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Tous les niveaux</option>
              <option value="Licence">Licence</option>
              <option value="Master">Master</option>
              <option value="Doctorat">Doctorat</option>
            </select>

            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Toutes années</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t border-slate-100 gap-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">Populaire:</span>
                {['Génie Logiciel', 'Santé', 'Droit', 'Économie'].map(tag => (
                  <button key={tag} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-colors">
                    {tag}
                  </button>
                ))}
              </div>

              {userProfile && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${recommendOnly ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={recommendOnly}
                      onChange={() => setRecommendOnly(!recommendOnly)}
                    />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${recommendOnly ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Adapter à mon profil</span>
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-10 h-6 rounded-full relative transition-colors ${showExpired ? 'bg-slate-600' : 'bg-slate-200'}`}>
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={showExpired}
                    onChange={() => setShowExpired(!showExpired)}
                  />
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showExpired ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Inclure expirées</span>
              </label>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-4">
                {syncStatus && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-bold text-emerald-600 animate-pulse"
                  >
                    {syncStatus}
                  </motion.span>
                )}
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Exploration IA...' : 'Crawler de bourses'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scholarships Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-100" />
            ))
          ) : filteredScholarships.length > 0 ? (
            filteredScholarships.map(scholarship => (
              <motion.div
                layout
                key={scholarship.id}
                onClick={() => {
                  setSelectedScholarship(scholarship);
                  try {
                    const viewed = localStorage.getItem('orientationbf_viewed_scholarships');
                    let list = viewed ? JSON.parse(viewed) : [];
                    if (!Array.isArray(list)) list = [];
                    if (!list.includes(scholarship.id)) {
                      list.push(scholarship.id);
                      localStorage.setItem('orientationbf_viewed_scholarships', JSON.stringify(list));
                    }
                    window.dispatchEvent(new Event('orientationbf_scholarship_viewed'));
                  } catch (e) {
                    console.error("Error updating viewed scholarships list", e);
                  }
                }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group cursor-pointer hover:shadow-xl hover:border-indigo-200 transition-all"
              >
                <div className="relative h-48 bg-slate-100">
                  {scholarship.imageUrl ? (
                    <img src={scholarship.imageUrl} alt={scholarship.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
                      <Globe className="w-12 h-12 text-indigo-200" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-sm ${
                        scholarship.category === 'Aide Financière' ? 'bg-amber-100 text-amber-700' : 
                        scholarship.category === 'Bourse' ? 'bg-indigo-100 text-indigo-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {scholarship.category || 'Bourse'}
                      </span>
                      <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[10px] font-black text-slate-900 border border-slate-200">
                        {scholarship.academicYear || '2024/2025'}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${
                      scholarship.fundingType === 'Full' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {scholarship.fundingType === 'Full' ? 'Coût Fixe' : 'Droit Réduit'}
                    </span>
                    {isRecommended(scholarship) && (
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-lg border border-indigo-400">
                        <Sparkles className="w-3 h-3" />
                        Recommandé
                      </span>
                    )}
                  </div>
                  <div className="absolute top-4 right-4">
                    <button className="p-2 rounded-full bg-white/80 backdrop-blur-md text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    <span>Cycle {scholarship.academicYear || 'Courant'}</span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                    {scholarship.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {scholarship.field.slice(0, 2).map(f => (
                      <span key={f} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 italic">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <MapPin className="w-3 h-3" />
                    <span>{scholarship.country}</span>
                    <span className="text-slate-300">•</span>
                    <GraduationCap className="w-3 h-3" />
                    <span>{scholarship.degreeLevel}</span>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 gap-2">
                    {isAdmin ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          alert("Push envoyé : '" + scholarship.title + "' a été notifié aux abonnés !");
                        }}
                        className="flex-1 py-2 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        Notifier les candidats
                      </button>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase">
                            <Clock className="w-3 h-3" />
                            <span>Expire le: {new Date(scholarship.deadline).toLocaleDateString()}</span>
                          </div>
                          {new Date(scholarship.deadline).getTime() - new Date().getTime() < 15 * 24 * 60 * 60 * 1000 && (
                            <span className="text-[9px] font-black text-rose-500 animate-pulse uppercase tracking-tighter bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 w-fit">
                              ⚠️ Délai très court
                            </span>
                          )}
                        </div>
                        <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune bourse trouvée</h3>
              <p className="text-slate-500 mb-8">Essayez d'ajuster vos filtres de recherche ou lancez une synchronisation.</p>
              
              {isAdmin && (
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
                >
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Initialiser la base de données
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Scholarship Detail Modal */}
      <AnimatePresence>
        {selectedScholarship && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedScholarship(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              layoutId={selectedScholarship.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col"
            >
              <button 
                onClick={() => setSelectedScholarship(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-black/10 hover:bg-black/20 text-black transition-colors z-20"
              >
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>

              <div className="overflow-y-auto h-full">
                <div className="relative h-64 bg-slate-900">
                  {selectedScholarship.imageUrl && (
                    <img src={selectedScholarship.imageUrl} className="w-full h-full object-cover opacity-60" alt="" />
                  )}
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30 lowercase uppercase font-mono">
                        {selectedScholarship.country}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                        {selectedScholarship.fundingType}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black">{selectedScholarship.title}</h2>
                  </div>
                </div>

                <div className="p-8 lg:p-12">
                  <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-10">
                      {/* Summary */}
                      <section>
                        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                          <Sparkles className="w-5 h-5 text-indigo-600" />
                          Résumé Intelligent (IA)
                        </h4>
                        <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-slate-700 leading-relaxed italic">
                          "{selectedScholarship.summaryAI}"
                        </div>
                      </section>

                      {/* Criteria */}
                      <section>
                        <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          Critères d'Éligibilité
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                           {/* Add individual criteria items here */}
                           <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                             <div className="mt-1"><AlertCircle className="w-4 h-4 text-indigo-600" /></div>
                             <div>
                               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Niveau d'étude</p>
                               <p className="text-sm font-medium text-slate-900">{selectedScholarship.degreeLevel}</p>
                             </div>
                           </div>
                           <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                             <div className="mt-1"><TrendingUp className="w-4 h-4 text-indigo-600" /></div>
                             <div>
                               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Difficulté</p>
                               <p className="text-sm font-medium text-slate-900">{selectedScholarship.difficultyScore}</p>
                             </div>
                           </div>
                        </div>
                      </section>
                      
                      {/* Details */}
                      <section>
                        <h4 className="text-lg font-bold text-slate-900 mb-4">Description complète</h4>
                        <div className="text-slate-600 prose prose-slate max-w-none">
                          <p>{selectedScholarship.eligibility}</p>
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
                        <div className="mb-6">
                          <p className="text-slate-400 text-xs font-bold uppercase mb-2">Date Limite</p>
                          <div className="flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-indigo-400" />
                            <span className="text-xl font-black">{new Date(selectedScholarship.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-sm text-indigo-200">Burkinabè Admissibles</span>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-sm text-indigo-200">Africains Admissibles</span>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                        </div>

                        <a 
                          href={selectedScholarship.applicationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 transition-colors"
                        >
                          Postuler Officiellement
                          <ArrowUpRight className="w-5 h-5" />
                        </a>
                        <p className="text-center text-[10px] text-slate-500 mt-4">
                          Source: {selectedScholarship.officialSource}
                        </p>
                      </div>

                      <div className="p-6 rounded-3xl border border-slate-200 bg-white">
                        <h5 className="font-bold text-slate-900 mb-4">Partager</h5>
                        <div className="flex gap-2">
                          <button className="flex-grow flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            <Share2 className="w-4 h-4" />
                            Lien
                          </button>
                          <button className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
