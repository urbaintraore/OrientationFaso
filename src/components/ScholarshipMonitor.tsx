import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, AlertCircle, CheckCircle, Clock, Globe, ShieldAlert, BarChart3, Search, RefreshCw, Smartphone } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function ScholarshipMonitor() {
  const [stats, setStats] = useState({
    nbFoundToday: 0,
    lastSuccess: null as string | null,
    avgExecutionTime: 0,
    successRate: 100,
    errorCount: 0
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMonitorData();
  }, []);

  const fetchMonitorData = async () => {
    setIsLoading(true);
    try {
      // In a real app, we'd have a 'logs' collection
      // For now, we simulate based on scholarship creation dates
      const q = query(collection(db, 'scholarships'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const scholarships = snap.docs.map(doc => doc.data());
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const foundToday = scholarships.filter(s => new Date(s.createdAt) >= today).length;
      const lastSuccess = scholarships.length > 0 ? scholarships[0].createdAt : null;

      setStats({
        nbFoundToday: foundToday,
        lastSuccess,
        avgExecutionTime: 12450, // Simulated ms
        successRate: 98,
        errorCount: 2
      });

      // Mocking some system logs for the UI
      setLogs([
        { id: 1, type: 'SUCCESS', message: 'Scan multi-sources terminé. CIOSPB: OK, DAAD: OK.', time: new Date().toISOString() },
        { id: 2, type: 'INFO', message: 'Mise à jour du cache effectuée (Vercel Edge).', time: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
        { id: 3, type: 'WARNING', message: 'Timeout sur la source Campus France. Tentative 2 réussie.', time: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { id: 4, type: 'SUCCESS', message: 'Dédoublonnage IA effectué : 3 doublons fusionnés.', time: new Date(Date.now() - 1000 * 3600).toISOString() },
        { id: 5, type: 'ERROR', message: 'Clé API Gemini quota atteint temporairement. Passage en mode Fallback.', time: new Date(Date.now() - 1000 * 3600 * 2).toISOString() }
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Surveillance du Moteur</h2>
          <p className="text-slate-500 font-medium">État de santé en temps réel de l'intelligence collectrice.</p>
        </div>
        <button 
          onClick={fetchMonitorData}
          className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Real-time Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Aujourd'hui</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.nbFoundToday}</p>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1">Bourses Trouvées</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {stats.lastSuccess ? new Date(stats.lastSuccess).toLocaleTimeString() : '---'}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1">Dernier Scan Réussi</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900">{Math.round(stats.avgExecutionTime / 1000)}s</p>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1">Temps Moyen de Scan</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Alertes</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.errorCount}</p>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1">Erreurs (24h)</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Source Health */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              État des Sources
            </h3>
            <div className="space-y-4">
              {[
                { name: 'CIOSPB (BF)', status: 'ALIVE', speed: '2.1s' },
                { name: 'DAAD (DE)', status: 'ALIVE', speed: '4.5s' },
                { name: 'Campus France', status: 'SLOW', speed: '8.9s' },
                { name: 'Erasmus+', status: 'ALIVE', speed: '3.2s' },
                { name: 'Mastercard F.', status: 'DOWN', speed: '---' }
              ].map(source => (
                <div key={source.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      source.status === 'ALIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                      source.status === 'SLOW' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <span className="text-sm font-bold">{source.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{source.speed}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Alertes SMS/WhatsApp
            </h3>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
              <p className="text-xs text-emerald-800 font-medium">
                Le système d'alertes 24h sans bourses est <strong>ACTIF</strong>.
              </p>
            </div>
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
              Configurer les numéros
            </button>
          </div>
        </div>

        {/* System Logs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-400" />
                Journal de l'IA (Collecteur)
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temps Réel</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      log.type === 'SUCCESS' ? 'bg-emerald-500' :
                      log.type === 'WARNING' ? 'bg-amber-500' : 
                      log.type === 'ERROR' ? 'bg-rose-500' : 'bg-slate-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          log.type === 'SUCCESS' ? 'text-emerald-600' :
                          log.type === 'WARNING' ? 'text-amber-600' :
                          log.type === 'ERROR' ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(log.time).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
                Voir tout l'historique
                <Zap className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
