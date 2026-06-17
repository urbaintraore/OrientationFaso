import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Sparkles, 
  GraduationCap, 
  Search, 
  Building2, 
  ChevronRight,
  Info
} from 'lucide-react';
import { GovernmentOpportunities } from './GovernmentOpportunities';
import { ScholarshipIntelligence } from '../ScholarshipIntelligence';

interface ScholarshipHubProps {
  isAdmin?: boolean;
  userProfile?: any;
}

export const ScholarshipHub: React.FC<ScholarshipHubProps> = ({ isAdmin, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'official' | 'ai_search'>('ai_search');

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-slate-100 sticky top-20 z-30 overflow-x-auto no-scrollbar">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('official')}
              className={`flex items-center gap-2 py-5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'official' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${activeTab === 'official' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className="text-sm font-black uppercase tracking-tight leading-none">Opportunités Officielles</div>
                <div className="text-[10px] font-medium text-slate-400 mt-1">CIOSPB, FOSER & État</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('ai_search')}
              className={`flex items-center gap-2 py-5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'ai_search' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${activeTab === 'ai_search' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className="text-sm font-black uppercase tracking-tight leading-none">Recherche Intelligence IA</div>
                <div className="text-[10px] font-medium text-slate-400 mt-1">Analyse personnalisée & Monde</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner for Official Data */}
      {activeTab === 'official' && (
        <div className="bg-emerald-50 border-b border-emerald-100 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <Info className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-bold">
                Ces données sont synchronisées en temps réel depuis les portails officiels du Burkina Faso par l'administration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'official' ? (
          <motion.div
            key="official"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* We wrap GovernmentOpportunities but remove its internal hero since it's now in a hub */}
            <GovernmentOpportunities hideHero isAdmin={isAdmin} />
          </motion.div>
        ) : (
          <motion.div
            key="ai_search"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ScholarshipIntelligence isAdmin={isAdmin} userProfile={userProfile} />
          </motion.div>
        )
        }
      </AnimatePresence>
    </div>
  );
};
