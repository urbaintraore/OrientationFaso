import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Search, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';

interface ScholarshipLandingProps {
  onExplore: (query?: string) => void;
}

export const ScholarshipLanding: React.FC<ScholarshipLandingProps> = ({ onExplore }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onExplore(searchQuery);
  };

  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-6"
            >
              <Sparkles className="w-3 h-3" />
              Recherche Intelligence Artificielle
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight"
            >
              Trouvez votre financement <br />
              <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">sur mesure.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600 mb-10 leading-relaxed"
            >
              Utilisez notre moteur de recherche intelligent pour scanner des milliers de bourses mondiales et d'aides gouvernementales (CIOSPB, FOSER) adaptées à votre profil.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSearch}
              className="relative mb-8"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-600/10 blur-xl group-hover:bg-indigo-600/20 transition-all rounded-full"></div>
                <div className="relative flex flex-col md:flex-row gap-3">
                  <div className="flex-grow relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Ex: Bourse pour master en France, Aide FOSER..." 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 shadow-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                  >
                    Chercher <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.form>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Aides Gov Vérifiées
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                +2500 Bourses Mondiales
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-48"
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm uppercase mb-1">CIOSPB</h4>
                <p className="text-[10px] text-slate-500 font-medium">Bourses d'excellence et aides classiques de l'État.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl flex flex-col justify-between h-48 mt-8"
            >
              <div className="w-10 h-10 bg-white/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-white text-sm uppercase mb-1">FOSER</h4>
                <p className="text-[10px] text-slate-400 font-medium">Prêts et aides d'urgence pour les étudiants en difficulté.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-48"
            >
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm uppercase mb-1">CAMES</h4>
                <p className="text-[10px] text-slate-500 font-medium">Reconnaissance de diplômes et bourses de recherche.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-indigo-600 text-white rounded-3xl shadow-xl flex flex-col justify-between h-48 mt-8"
            >
              <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center mb-4">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-white text-sm uppercase mb-1">Plus...</h4>
                <p className="text-[10px] text-indigo-100 font-medium">Bourses privées, fondations et universités étrangères.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
