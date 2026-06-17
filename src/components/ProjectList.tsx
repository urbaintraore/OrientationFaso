import React, { useState, useEffect } from 'react';
import { SavedProject } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { FolderOpen, Trash2, Calendar, User, GraduationCap, School, ArrowRight, AlertTriangle, Heart, BookOpen, ExternalLink } from 'lucide-react';
import { mockInstitutions } from '../data/mockInstitutions';
import { Institution, GovernmentOpportunity } from '../types';
import { governmentOpportunityService } from '../services/governmentOpportunityService';

interface ProjectListProps {
  projects: SavedProject[];
  onSelectProject: (project: SavedProject) => void;
  onDeleteProject: (projectId: string) => void;
  onNewProject: () => void;
}

export function ProjectList({ projects, onSelectProject, onDeleteProject, onNewProject }: ProjectListProps) {
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'favorites'>('projects');
  const [favoriteInstitutions, setFavoriteInstitutions] = useState<string[]>([]);
  const [favoriteScholarships, setFavoriteScholarships] = useState<string[]>([]);
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [scholarshipsData, setScholarshipsData] = useState<GovernmentOpportunity[]>([]);
  
  useEffect(() => {
    const savedFavs = localStorage.getItem('orientationbf_favorite_institutions');
    if (savedFavs) {
      setFavoriteInstitutions(JSON.parse(savedFavs));
    }
    const savedScholars = localStorage.getItem('orientationbf_favorite_scholarships');
    if (savedScholars) {
      setFavoriteScholarships(JSON.parse(savedScholars));
      fetchScholarships();
    }
    const savedFavProjects = localStorage.getItem('orientationbf_favorite_project_ids');
    if (savedFavProjects) {
      setFavoriteProjectIds(JSON.parse(savedFavProjects));
    }
  }, []);

  const toggleProjectFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favoriteProjectIds.includes(id)
      ? favoriteProjectIds.filter(pid => pid !== id)
      : [...favoriteProjectIds, id];
    setFavoriteProjectIds(updated);
    localStorage.setItem('orientationbf_favorite_project_ids', JSON.stringify(updated));
  };

  const fetchScholarships = async () => {
    try {
      const opps = await governmentOpportunityService.getAllOpportunities();
      setScholarshipsData(opps);
    } catch (e) {
      console.error(e);
    }
  };

  const removeFavorite = (id: string) => {
    const updated = favoriteInstitutions.filter(fav => fav !== id);
    setFavoriteInstitutions(updated);
    localStorage.setItem('orientationbf_favorite_institutions', JSON.stringify(updated));
  };
  
  const removeFavoriteScholarship = (id: string) => {
    const updated = favoriteScholarships.filter(fav => fav !== id);
    setFavoriteScholarships(updated);
    localStorage.setItem('orientationbf_favorite_scholarships', JSON.stringify(updated));
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const favInstitutionsData = mockInstitutions.filter(inst => favoriteInstitutions.includes(inst.id));
  const favScholarshipsData = scholarshipsData.filter(opp => favoriteScholarships.includes(opp.id));

  return (
    <div className="container mx-auto px-4 py-12 min-h-[60vh]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Mon Espace</h2>
          <p className="text-slate-600">Gère tes projets d'orientation et tes favoris.</p>
        </div>
        <button
          onClick={onNewProject}
          className="mt-4 md:mt-0 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <FolderOpen className="w-5 h-5" />
          Nouveau Projet
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-4 px-4 font-semibold text-sm transition-colors relative ${activeTab === 'projects' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Mes Simulations
          </div>
          {activeTab === 'projects' && (
            <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-4 px-4 font-semibold text-sm transition-colors relative ${activeTab === 'favorites' ? 'text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Mes Favoris
          </div>
          {activeTab === 'favorites' && (
            <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600" />
          )}
        </button>
      </div>

      {activeTab === 'projects' && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
        >
          {projects.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                <FolderOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun projet sauvegardé</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">Commence une nouvelle analyse pour obtenir des recommandations d\'orientation et sauvegarde-les ici.</p>
              <button
                onClick={onNewProject}
                className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
              >
                Créer mon premier projet
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Projects Filter Header */}
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 text-sm rounded-xl border border-slate-100 mb-2">
                <span className="text-slate-650 font-medium">Filtrer mes analyses :</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOnlyFavorites(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showOnlyFavorites ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Tout ({projects.length})
                  </button>
                  <button
                    onClick={() => setShowOnlyFavorites(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${showOnlyFavorites ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white' : 'text-rose-500 fill-rose-500'}`} />
                    Mes Favoris ({projects.filter(p => favoriteProjectIds.includes(p.id)).length})
                  </button>
                </div>
              </div>

              {projects.filter(p => !showOnlyFavorites || favoriteProjectIds.includes(p.id)).length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
                  <Heart className="w-8 h-8 text-rose-300 mx-auto mb-2 fill-rose-100" />
                  <p className="text-slate-500 font-medium">Aucun projet marqué comme favori pour l'instant.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects
                    .filter(p => !showOnlyFavorites || favoriteProjectIds.includes(p.id))
                    .map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-xl ${project.type === 'bepc' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {project.type === 'bepc' ? <School className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => toggleProjectFavorite(project.id, e)}
                              className={`p-2 rounded-lg transition-colors ${favoriteProjectIds.includes(project.id) ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                              title={favoriteProjectIds.includes(project.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                            >
                              <Heart className={`w-4 h-4 ${favoriteProjectIds.includes(project.id) ? 'fill-rose-600' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToDelete(project.id);
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer le projet"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                          {project.name}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {project.profile.name}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">
                            {project.type === 'bepc' ? 'Orientation Lycée' : 'Orientation Université'}
                          </span>
                          <button
                            onClick={() => onSelectProject(project)}
                            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform"
                          >
                            Voir <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'favorites' && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
        >
          {favInstitutionsData.length === 0 && favScholarshipsData.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4 text-rose-300">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun favori</h3>
              <p className="text-slate-500 max-w-md mx-auto">Explorez les écoles, universités et bourses pour les ajouter à vos favoris.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {favInstitutionsData.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <School className="w-5 h-5 text-indigo-600" />
                    Écoles & Universités
                  </h3>
                   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {favInstitutionsData.map((inst) => (
                       <motion.div key={inst.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                          <div className="h-32 overflow-hidden relative">
                             <img src={inst.coverImage} alt={inst.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                               <span className="text-white font-bold text-sm truncate">{inst.name}</span>
                             </div>
                             <button onClick={() => removeFavorite(inst.id)} className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-rose-500 text-white rounded-full backdrop-blur-sm transition-colors">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                              <School className="w-3 h-3" />
                              <span>{inst.type}</span>
                              <span>•</span>
                              <span>{inst.city}</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">{inst.description}</p>
                          </div>
                       </motion.div>
                     ))}
                   </div>
                </div>
              )}

              {favScholarshipsData.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    Bourses & Opportunités
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {favScholarshipsData.map((opp) => (
                       <motion.div key={opp.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full relative">
                          <button onClick={() => removeFavoriteScholarship(opp.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-start mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="text-[10px] font-black text-emerald-600 uppercase mb-1">{opp.organization}</div>
                            <h4 className="text-md font-bold text-slate-900 mb-3 line-clamp-2">{opp.title}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              Limite: {opp.deadline}
                            </div>
                          </div>
                       </motion.div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Supprimer le projet ?</h3>
              </div>
              <p className="text-slate-600 mb-8">
                Cette action est irréversible. Toutes les données, analyses et recommandations associées à ce projet seront définitivement perdues.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
