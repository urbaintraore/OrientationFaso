import React from 'react';
import { SavedProject } from '../types';
import { motion } from 'motion/react';
import { FolderOpen, Trash2, Calendar, User, GraduationCap, School, ArrowRight } from 'lucide-react';

interface ProjectListProps {
  projects: SavedProject[];
  onSelectProject: (project: SavedProject) => void;
  onDeleteProject: (projectId: string) => void;
  onNewProject: () => void;
}

export function ProjectList({ projects, onSelectProject, onDeleteProject, onNewProject }: ProjectListProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Mes Projets</h2>
          <p className="text-slate-600">Retrouve tes simulations et analyses sauvegardées.</p>
        </div>
        <button
          onClick={onNewProject}
          className="mt-4 md:mt-0 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <FolderOpen className="w-5 h-5" />
          Nouveau Projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun projet sauvegardé</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Commence une nouvelle analyse pour obtenir des recommandations d'orientation et sauvegarde-les ici.</p>
          <button
            onClick={onNewProject}
            className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
          >
            Créer mon premier projet
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Es-tu sûr de vouloir supprimer ce projet ?')) {
                      onDeleteProject(project.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer le projet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
  );
}
