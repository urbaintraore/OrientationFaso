import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Calendar, 
  ExternalLink, 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  GraduationCap, 
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { GovernmentOpportunity, GovernmentOpportunityType, GovernmentOpportunityStatus } from '../../types';
import { governmentOpportunityService } from '../../services/governmentOpportunityService';

interface GovernmentOpportunitiesProps {
  isAdmin?: boolean;
  hideHero?: boolean;
}

export const GovernmentOpportunities: React.FC<GovernmentOpportunitiesProps> = ({ isAdmin, hideHero }) => {
  const [opportunities, setOpportunities] = useState<GovernmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | GovernmentOpportunityType>('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<GovernmentOpportunity | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data = await governmentOpportunityService.getAllOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || opp.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: GovernmentOpportunityStatus) => {
    switch (status) {
      case 'ouverte': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'bientôt expirée': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'expirée': return 'bg-red-100 text-red-700 border-red-200';
      case 'résultats disponibles': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: GovernmentOpportunityType) => {
    switch (type) {
      case 'bourse': return <GraduationCap className="w-5 h-5" />;
      case 'aide': return <HelpCircle className="w-5 h-5" />;
      case 'prêt': return <ShieldCheck className="w-5 h-5" />;
      case 'concours': return <Building2 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 pb-20 ${hideHero ? 'pt-8' : ''}`}>
      {/* Hero Section */}
      {!hideHero && (
        <div className="bg-indigo-900 text-white pt-24 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                Portail Officiel Gouvernemental
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-black mb-6 leading-tight"
              >
                Bourses, Aides & <br />
                <span className="text-emerald-400">Prêts Étudiants</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-indigo-100 mb-8 max-w-2xl leading-relaxed"
              >
                Accédez en temps réel à toutes les opportunités de financement de l'État burkinabè (CIOSPB, FOSER) et des partenaires internationaux.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative flex flex-col md:flex-row gap-4"
              >
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text"
                    placeholder="Rechercher une bourse, un concours..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 border-none shadow-xl focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                  Rechercher
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`container mx-auto px-4 ${hideHero ? 'pt-4' : '-mt-8'}`}>
        {/* Hub Title in Hub mode */}
        {hideHero && (
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Opportunités Vérifiées</h2>
            <p className="text-slate-500 font-medium">Consultez les dernières annonces officielles du CIOSPB et du FOSER.</p>
            
            <div className="mt-8 relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Filtrer parmi les offres officielles..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {(['all', 'bourse', 'aide', 'prêt', 'concours'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all border shadow-sm ${
                activeFilter === filter 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {filter === 'all' ? 'Toutes les offres' : filter === 'concours' ? 'Concours de la fonction publique' : filter.charAt(0).toUpperCase() + filter.slice(1) + 's'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 h-64 animate-pulse border border-slate-100 shadow-sm"></div>
            ))}
          </div>
        ) : filteredOpportunities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => (
              <motion.div
                key={opp.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                onClick={() => setSelectedOpportunity(opp)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${
                    opp.type === 'bourse' ? 'bg-indigo-50 text-indigo-600' :
                    opp.type === 'prêt' ? 'bg-emerald-50 text-emerald-600' :
                    opp.type === 'aide' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {getTypeIcon(opp.type)}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(opp.status)}`}>
                    {opp.status}
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="text-[10px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {opp.organization}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-3 line-clamp-2 leading-snug">
                    {opp.title}
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      Limite: {opp.deadline}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                  {opp.pdfUrl ? (
                    <div className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase">
                      <FileText className="w-3 h-3" />
                      PDF Disponible
                    </div>
                  ) : <div></div>}
                  <button className="flex items-center gap-1 text-xs font-black text-indigo-600 group">
                    Détails 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun résultat trouvé</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Nous n'avons trouvé aucune opportunité correspondant à votre recherche. Essayez d'autres mots-clés.
            </p>
          </div>
        )}
      </div>

      {/* Opportunity Modal */}
      <AnimatePresence>
        {selectedOpportunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedOpportunity(null)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>

              <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    selectedOpportunity.type === 'bourse' ? 'bg-indigo-50 text-indigo-600' :
                    selectedOpportunity.type === 'prêt' ? 'bg-emerald-50 text-emerald-600' :
                    selectedOpportunity.type === 'aide' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {getTypeIcon(selectedOpportunity.type)}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{selectedOpportunity.organization}</div>
                    <div className={`px-2 py-0.5 mt-1 inline-block rounded-full text-[9px] font-black uppercase border ${getStatusColor(selectedOpportunity.status)}`}>
                      {selectedOpportunity.status}
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 leading-tight">
                  {selectedOpportunity.title}
                </h2>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Date de clôture
                    </div>
                    <div className="text-sm font-bold text-slate-900">{selectedOpportunity.deadline}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" />
                      Source vérifiée
                    </div>
                    <div className="text-sm font-bold text-slate-900">{selectedOpportunity.source} (Portail Gov)</div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Description de l'offre
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedOpportunity.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      Critères d'éligibilité
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedOpportunity.eligibility}
                    </p>
                  </div>

                  {selectedOpportunity.requiredDocuments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
                        Pièces à fournir
                      </h4>
                      <ul className="space-y-2">
                        {selectedOpportunity.requiredDocuments.map((doc, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></span>
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-12 flex flex-col md:flex-row gap-4">
                  <a 
                    href={selectedOpportunity.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-grow py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    Postuler en ligne
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {selectedOpportunity.pdfUrl && (
                    <a 
                      href={selectedOpportunity.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-8 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-2xl border border-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      Communiqué PDF
                      <FileText className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
