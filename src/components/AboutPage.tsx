import React from 'react';
import { motion } from 'motion/react';
import { Target, Cpu, Users, ChevronRight, Globe, ShieldCheck, Zap } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest rounded-full border border-indigo-100 mb-6 inline-block"> Notre Histoire </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Révolutionner l'orientation <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">au Burkina Faso.</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed font-medium">
              OrientationBF est la première plateforme d'intelligence artificielle dédiée à l'avenir académique et professionnel des étudiants burkinabè.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Notre Mission</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                    <Target className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Clarté pour tous</h3>
                    <p className="text-slate-600">Offrir à chaque bachelier burkinabè une vision claire de ses opportunités d'études basées sur ses réelles compétences.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Rapidité d'exécution</h3>
                    <p className="text-slate-600">Automatiser la recherche d'informations académiques pour gagner des semaines de prospection manuelle.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Données Fiables</h3>
                    <p className="text-slate-600">Collecter des informations vérifiées auprès des universités et instituts reconnus par l'État.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="relative">
              <div className="aspect-square bg-indigo-600 rounded-[40px] transform rotate-3 absolute inset-0 opacity-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
                alt="Students studying"
                className="relative z-10 rounded-[40px] shadow-2xl object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Cœur Technologique</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">L'IA au service de l'humain pour une orientation sans erreur.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[32px] border border-slate-100 bg-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-4">Moteur Gemini Ultra</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Nous utilisons les derniers modèles de langage de Google pour analyser les bulletins scolaires avec une précision chirurgicale.</p>
            </div>
            <div className="p-8 rounded-[32px] border border-slate-100 bg-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-4">Crawler Académique</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Un système intelligent qui parcourt quotidiennement le web burkinabè pour mettre à jour les filières et les conditions d'admission.</p>
            </div>
            <div className="p-8 rounded-[32px] border border-slate-100 bg-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-4">Algorithme de Matching</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Notre algorithme propriétaire croise vos notes, vos passions et le marché de l'emploi pour trouver votre voie idéale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-4 block">Les Fondateurs</span>
            <h2 className="text-4xl font-black tracking-tight">Une Équipe Passionnée</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="flex gap-8 items-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg">
              <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 border-2 border-indigo-500/30">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300" alt="Founder" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Moussa Traoré</h3>
                <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">CEO & Expert IA</p>
                <p className="text-slate-400 text-sm leading-relaxed font-medium italic">"L'éducation est l'arme la plus puissante. L'IA est notre levier."</p>
              </div>
            </div>
            <div className="flex gap-8 items-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg">
              <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 border-2 border-emerald-500/30">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300" alt="Founder" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Awa Ouédraogo</h3>
                <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">CTO & Data Scientist</p>
                <p className="text-slate-400 text-sm leading-relaxed font-medium italic">"Donner du sens aux données académiques pour éclairer les destins."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto py-16 px-8 rounded-[48px] bg-indigo-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-4xl font-black mb-6 tracking-tight relative z-10">Prêt à construire votre avenir ?</h2>
            <p className="text-indigo-100 mb-10 text-lg font-medium relative z-10">Rejoignez les milliers d'élèves qui ont déjà trouvé leur voie avec OrientationBF.</p>
            <button className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-indigo-900/20 active:scale-95 relative z-10">
              Démarrer mon analyse
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
