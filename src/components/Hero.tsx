import React from 'react';
import { ArrowRight, CheckCircle2, BrainCircuit, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-16 pb-32 lg:pt-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm text-indigo-600">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2"></span>
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
              <a
                href="#comment-ca-marche"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
              >
                En savoir plus
              </a>
            </div>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: BrainCircuit,
              title: "Analyse IA",
              desc: "Algorithme basé sur tes notes de la 6ème à la 3ème pour le lycée et les notes de la seconde à la terminale pour l'université."
            },
            {
              icon: Target,
              title: "Orientation Précise",
              desc: "Comparaison avec les séries Générales et Techniques."
            },
            {
              icon: CheckCircle2,
              title: "Conseils Personnalisés",
              desc: "Estimation de réussite et plan d'action sur mesure."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
