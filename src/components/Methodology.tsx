import React from 'react';
import { motion } from 'motion/react';
import { BEPC_MODELS, UNIVERSITY_MODELS } from '../data/orientationModels';
import { Calculator, ArrowLeft } from 'lucide-react';

interface MethodologyProps {
  onBack: () => void;
}

export function Methodology({ onBack }: MethodologyProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-indigo-100 text-indigo-700">
          <Calculator className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Nos Modèles Mathématiques</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          OrientationBF utilise des algorithmes pondérés pour calculer votre compatibilité avec chaque filière.
          Voici les coefficients officiels utilisés par notre intelligence artificielle pour affiner ses recommandations.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* BEPC Models */}
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">1</span>
            Orientation Post-BEPC
          </h3>
          <div className="space-y-6">
            {BEPC_MODELS.map((model, idx) => (
              <motion.div 
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900">{model.name}</h4>
                  <p className="text-sm text-slate-500">{model.description}</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {model.coefficients.map((coef) => (
                      <div key={coef.subject} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{coef.subject}</span>
                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          Coeff {coef.coef}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="text-slate-500">Moyenne conseillée :</span>
                    <span className="font-bold text-slate-900">{model.threshold}/20</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* University Models */}
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm">2</span>
            Orientation Universitaire
          </h3>
          <div className="space-y-6">
            {UNIVERSITY_MODELS.map((model, idx) => (
              <motion.div 
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900">{model.name}</h4>
                  <p className="text-sm text-slate-500">{model.description}</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {model.coefficients.map((coef) => (
                      <div key={coef.subject} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{coef.subject}</span>
                        <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          Coeff {coef.coef}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="text-slate-500">Moyenne conseillée :</span>
                    <span className="font-bold text-slate-900">{model.threshold}/20</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
