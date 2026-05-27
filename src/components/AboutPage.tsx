import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Cpu, Users, ChevronRight, Globe, ShieldCheck, Zap, ChevronDown, HelpCircle } from 'lucide-react';

export function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: "Comment fonctionne l'orientation par Intelligence Artificielle (IA) ?",
      answer: "Notre IA analyse vos notes de façon globale (régularité, dominance matière, points forts). Elle croise ensuite ces données de performance avec les critères officiellement requis par les universités burkinabè ainsi que les opportunités d'emploi réelles pour générer des recommandations sur-mesure."
    },
    {
      id: 2,
      question: "Mes données scolaires sont-elles confidentielles et protégées ?",
      answer: "Oui, absolument. Vos bulletins et informations académiques ne sont jamais partagés avec des tiers non autorisés. Ils servent exclusivement à calculer vos recommandations et à générer votre rapport personnalisé."
    },
    {
      id: 3,
      question: "Quelles sont les universités prises en compte au Burkina Faso ?",
      answer: "La plateforme répertorise à la fois les universités publiques (UJKZ, Université de Koudougou/UNZ, Bobo/UNB, Ouahigouya, etc.) et les instituts privés prestigieux reconnus par l'État (CAMES), garantissant ainsi un large choix de diplômes de qualité."
    },
    {
      id: 4,
      question: "OrientationBF remplace-t-elle les conseillers d'orientation réels ?",
      answer: "Non, notre plateforme est un puissant outil d'aide à la décision. Elle simplifie le travail d'analyse et répertorie les filières admissibles, mais nous encourageons vivement d'en discuter avec vos parents et des conseillers d'orientation professionnels (par exemple au CIOSPB) avant de faire votre choix final."
    },
    {
      id: 5,
      question: "Les bourses et concours d'admission sont-ils réellement mis à jour ?",
      answer: "Oui, notre robot crawler intelligent parcourt régulièrement les plateformes officielles (ministères, guichet unique, eConcours, CIOSPB) pour détecter et synchroniser les opportunités valides au Burkina Faso et à l'international."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-10 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="px-4 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest rounded-full border border-indigo-100 mb-2 inline-block"> Notre Vision </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight leading-tight">
              Révolutionner l'orientation <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 to-purple-650">au Burkina Faso.</span>
            </h1>
            <p className="text-base text-slate-600 leading-relaxed font-semibold max-w-2xl mx-auto">
              OrientationBF est la première plateforme d'intelligence artificielle dédiée à l'avenir académique et professionnel des étudiants burkinabè.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Pillars: Mission & Tech Combined (Bento Style/Compact) */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left side: Mission & Team Image */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600 shrink-0" />
                  Notre Mission & Engagement
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/60 shadow-sm">
                    <div className="w-8 h-8 bg-indigo-100/60 rounded-lg flex items-center justify-center mb-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 mb-0.5">Clarté Globale</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Offrir à chaque bachelier burkinabè une vision juste de ses options réelles.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/60 shadow-sm">
                    <div className="w-8 h-8 bg-amber-100/60 rounded-lg flex items-center justify-center mb-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 mb-0.5">Gain de Temps</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Automatiser le ciblage académique pour éviter le stress des inscriptions.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/60 shadow-sm">
                    <div className="w-8 h-8 bg-emerald-100/60 rounded-lg flex items-center justify-center mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 mb-0.5">Données State</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Informations issues des établissements reconnus et enregistrés.</p>
                  </div>
                </div>
              </div>

              {/* In-context Black Students Picture */}
              <div className="relative overflow-hidden rounded-2xl aspect-[21/9] bg-indigo-900/10 border border-slate-150">
                <img 
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1200" 
                  alt="Étudiants burkinabè travaillant sur ordinateur"
                  className="w-full h-full object-cover grayscale-[10%] hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-xs">Conçu par et pour les jeunes talents du Burkina Faso</p>
                </div>
              </div>
            </div>

            {/* Right side: Technologic Engine (Compact Stack) */}
            <div className="lg:col-span-5 bg-slate-950 text-white rounded-[24px] p-6 flex flex-col justify-between border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/20 blur-[60px] rounded-full"></div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 block">Innovation</span>
                <h2 className="text-2xl font-black mb-3 tracking-tight">Cœur Technologique</h2>
                <p className="text-slate-400 text-xs mb-5">
                  Algorithmes avancés et données fiables pour tracer votre avenir avec assurance.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">Analyse Prédictive par l'IA</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Analyse des bulletins par IA pour extraire vos filières idéales.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">Moteur de Collecte Automatisé</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Actualisation quotidienne des universités et ministères burkinabè.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">Matching Offre & Marché</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Liaison intelligente avec la réalité de l'emploi burkinabè.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                <span>Burkina Faso Intelligence</span>
                <span>v3.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founders Section (Extremely Compact Side-By-Side) */}
      <section className="py-8 bg-slate-50 border-t border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-6">
            <span className="text-indigo-600 text-xs font-black uppercase tracking-[0.2em] mb-1 block">Direction</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Une Équipe Passionnée</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-center p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-indigo-500/10 shadow-inner">
                <img 
                  src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80&w=250" 
                  alt="Moussa Traoré - CEO, expert Burkinabè" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-0.5">Moussa Traoré</h3>
                <p className="text-indigo-600 text-[9px] font-black uppercase tracking-widest mb-1.5">CEO & Expert IA</p>
                <p className="text-slate-500 text-[11px] leading-relaxed italic">"L'orientation scolaire qualifiée est le pilier économique du Burkina Faso."</p>
              </div>
            </div>

            <div className="flex gap-4 items-center p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-emerald-500/10 shadow-inner">
                <img 
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=250" 
                  alt="Awa Ouédraogo - CTO" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-0.5">Awa Ouédraogo</h3>
                <p className="text-emerald-600 text-[9px] font-black uppercase tracking-widest mb-1.5">CTO & Data Scientist</p>
                <p className="text-slate-500 text-[11px] leading-relaxed italic">"Rendre accessible l'intelligence de données aux générations futures."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section (Interactive/Optimized) */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-6">
            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 mb-2 inline-block">Questions Fréquentes</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Foire Aux Questions</h2>
          </div>

          <div className="space-y-1.5">
            {faqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'border-indigo-200 shadow-sm' 
                      : 'border-slate-200/60 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 text-left outline-none"
                  >
                    <div className="flex items-center gap-2 pr-2">
                      <HelpCircle className={`w-3.5 h-3.5 shrink-0 ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-800 tracking-tight">{faq.question}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="px-3.5 pb-2.5 pt-0 text-slate-500 leading-relaxed text-[11px] border-t border-slate-50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section Minimalist */}
      <section className="pb-10 pt-2">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto py-8 px-6 rounded-2xl bg-indigo-650 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
            <h2 className="text-xl font-black mb-2 tracking-tight">Prêt à construire votre avenir ?</h2>
            <p className="text-indigo-100 mb-5 text-xs">Prenez votre carte d'étudiant en main dès maintenant.</p>
            <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-[10px] hover:bg-slate-900 hover:text-white transition-all shadow-md active:scale-95">
              Démarrer mon analyse
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
