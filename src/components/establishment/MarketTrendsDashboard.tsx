import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  Briefcase, 
  Globe, 
  UserPlus,
  BarChart,
  Activity,
  AlertCircle
} from 'lucide-react';

export function MarketTrendsDashboard() {
  const trends = [
    {
      title: "Cybersécurité",
      demand: "Très Forte Demande",
      growth: "+45%",
      employability: 98,
      status: 'up',
      description: "Pénurie critique d'experts en Afrique de l'Ouest."
    },
    {
      title: "Énergies Renouvelables",
      demand: "Forte Demande",
      growth: "+32%",
      employability: 85,
      status: 'up',
      description: "Besoin croissant avec les projets de centrales solaires."
    },
    {
      title: "Gestion de Projets",
      demand: "Stable",
      growth: "+12%",
      employability: 70,
      status: 'steady',
      description: "Marché constant mais très compétitif."
    },
    {
      title: "Comptabilité Classique",
      demand: "Saturé",
      growth: "-5%",
      employability: 45,
      status: 'down',
      description: "Forte automatisation des tâches de base."
    }
  ];

  return (
    <div className="space-y-8">
      <header className="bg-white p-8 rounded-[40px] border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence du Marché</h2>
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">Analyse des tendances 2026</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Temps Réel</span>
          </div>
        </div>
      </header>

      {/* Employability Score Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl shadow-slate-900/40">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
              <BarChart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Top Secteurs en Croissance</h3>
          </div>

          <div className="space-y-6">
            {trends.slice(0, 3).map((trend, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black uppercase tracking-widest text-indigo-200">{trend.title}</span>
                  <span className="text-lg font-black">{trend.growth}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${trend.employability}%` }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-10 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest transition-all">
            Télécharger le rapport complet (.txt)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200/60 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Métier du Mois</span>
            <h4 className="text-xl font-black text-slate-900 tracking-tight">Ingénieur IA</h4>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-2">+120% de clics</p>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-slate-200/60 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employabilité</span>
            <h4 className="text-xl font-black text-slate-900 tracking-tight">Tech Santé</h4>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Déficit de talents</p>
          </div>
          <div className="col-span-2 bg-indigo-50 p-8 rounded-[40px] border border-indigo-100 relative overflow-hidden">
             <div className="flex items-center gap-6">
                <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200">
                  <Globe className="w-8 h-8" />
                </div>
                <div>
                   <h4 className="text-lg font-black text-slate-900 tracking-tight">Expansion Internationale</h4>
                   <p className="text-sm text-slate-600 font-medium">Les diplômes d'ingénierie agro-alimentaire ouvrent désormais les portes du Canada via le programme BF-Exp.</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Detailed Trends Table */}
      <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
           <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Tableau de Bord Employabilité</h3>
           <Briefcase className="w-6 h-6 text-slate-300" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Secteur / Filière</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Demande du Marché</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Croissance Annuelle</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Score IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trends.map((trend, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">{trend.title}</span>
                      <span className="text-[10px] font-bold text-slate-400 italic mt-1 group-hover:text-indigo-600 transition-colors">
                        {trend.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      trend.demand === 'Très Forte Demande' ? 'bg-indigo-100 text-indigo-700' :
                      trend.demand === 'Forte Demande' ? 'bg-emerald-100 text-emerald-700' :
                      trend.demand === 'Stable' ? 'bg-blue-100 text-blue-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {trend.demand}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {trend.status === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                      {trend.status === 'down' && <TrendingDown className="w-4 h-4 text-rose-500" />}
                      <span className={`text-sm font-black ${
                         trend.status === 'up' ? 'text-emerald-600' : 
                         trend.status === 'down' ? 'text-rose-600' : 
                         'text-slate-600'
                      }`}>{trend.growth}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 font-black text-sm text-slate-900">
                      {trend.employability}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[40px] flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
        <div>
          <h4 className="text-lg font-black text-slate-900 tracking-tight">Information Stratégique</h4>
          <p className="text-sm text-slate-600 font-medium leading-relaxed mt-1">
            Les données ci-dessus sont mises à jour mensuellement en collaboration avec l'Observatoire National de l'Emploi et le Hub Digital du Burkina. Elles visent à guider les établissements dans l'ajustement de leurs maquettes pédagogiques.
          </p>
        </div>
      </div>
    </div>
  );
}
