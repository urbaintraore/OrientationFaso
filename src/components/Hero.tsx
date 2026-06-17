import React from 'react';
import { ArrowRight, CheckCircle2, BrainCircuit, Target, Briefcase, GraduationCap, Bell, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onStart: () => void;
  savedProjectsCount: number;
  viewedScholarshipsCount: number;
  activeAlertsCount: number;
  onStartTour: () => void;
}

export function Hero({ 
  onStart, 
  savedProjectsCount, 
  viewedScholarshipsCount, 
  activeAlertsCount, 
  onStartTour 
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-16 pb-32 lg:pt-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm text-indigo-600">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-ping"></span>
              Intelligence Artificielle pour ton avenir
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Ton avenir commence avec <span className="text-indigo-600">OrientationBF</span>
            </h1>
            <p className="mb-8 text-lg text-slate-600">
              L'intelligence artificielle qui analyse ton profil scolaire pour te guider vers la réussite, du BEPC jusqu'à l'emploi.
            </p>

            <div className="mb-10 max-w-2xl mx-auto rounded-2xl bg-indigo-50/50 p-6 border border-indigo-100">
              <p className="text-lg font-medium text-slate-800 italic">
                "Nous ne décidons pas à votre place.
                <br />
                Nous analysons scientifiquement votre potentiel pour maximiser vos chances de réussite."
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5"
              >
                Commencer l'analyse
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button
                onClick={onStartTour}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-8 py-4 text-base font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-200 transition-all hover:bg-indigo-100 hover:-translate-y-0.5"
              >
                <HelpCircle className="h-5 w-5 text-indigo-600" />
                Démarrer la Visite Guidée 🚀
              </button>

              <a
                href="#comment-ca-marche"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
              >
                En savoir plus
              </a>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Statistics Dashboard */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Tableau de Bord Étudiant</h2>
            <p className="text-sm text-slate-500 mt-1">Indicateurs de suivi & opportunités de bourses relevés en temps réel</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Projects Card */}
            <div className="relative group overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Parcours</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-1">{savedProjectsCount}</h3>
              <p className="text-sm font-semibold text-slate-700">Projets d'Orientation</p>
              <p className="text-xs text-slate-500 mt-1">Fiches académiques, séries et prédictions sauvegardées</p>
            </div>

            {/* Scholarships Card */}
            <div className="relative group overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">Explorées</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-1">{viewedScholarshipsCount}</h3>
              <p className="text-sm font-semibold text-slate-700">Bourses Consultées</p>
              <p className="text-xs text-slate-500 mt-1">Opportunités nationales et d'excellence analysées</p>
            </div>

            {/* Alerts Card */}
            <div className="relative group overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Bell className="h-5 w-5 animate-swing" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Actives</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-1">{activeAlertsCount}</h3>
              <p className="text-sm font-semibold text-slate-700">Alertes Infos</p>
              <p className="text-xs text-slate-500 mt-1">Concours et communiqués ministériels en cours de validité</p>
            </div>
          </div>
        </motion.div>

        {/* Feature grid */}
        <div className="mt-24 grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: BrainCircuit,
              title: "Analyse IA",
              desc: "Algorithme basé sur tes notes de la 6ème à la 3ème pour le lycée et les notes de la seconde à la terminale pour l'université."
            },
            {
              icon: Target,
              title: "Orientation Précise",
              desc: "Comparaison avec les séries Générales, Techniques et Professionnelles burkinabè."
            },
            {
              icon: CheckCircle2,
              title: "Conseils Personnalisés",
              desc: "Estimation de réussite et plan d'action sur mesure formulé scientifiquement par l'IA."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
