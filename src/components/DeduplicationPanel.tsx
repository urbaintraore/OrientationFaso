import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { deduplicationService, DuplicateCluster } from '../services/deduplicationService';

export const DeduplicationPanel = () => {
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergingClusterIdx, setMergingClusterIdx] = useState<number | null>(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const data = await deduplicationService.findDuplicates();
      setClusters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleMerge = async (index: number) => {
    const cluster = clusters[index];
    if (!cluster) return;

    if (!window.confirm(`Confirmez-vous la fusion de ${cluster.duplicates.length} établissement(s) vers "${cluster.master.name}" ?`)) {
      return;
    }

    setMergingClusterIdx(index);
    try {
      const dupIds = cluster.duplicates.map(d => d.id!);
      await deduplicationService.mergeInstitutions(cluster.master.id!, dupIds);
      // Remove from list
      setClusters(prev => prev.filter((_, i) => i !== index));
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la fusion.");
    } finally {
      setMergingClusterIdx(null);
    }
  };

  const handleDismiss = (index: number) => {
    setClusters(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden mt-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-pink-500" />
            Analyse des doublons (Établissements)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Détection algorithmique (Noms, Acronymes, Fautes de saisie)
          </p>
        </div>
        <button 
          onClick={fetchDuplicates}
          disabled={loading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
          Analyser la base de données
        </button>
      </div>

      {loading && clusters.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Scan en cours de toute la base de données...</p>
        </div>
      )}

      {!loading && clusters.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-emerald-600 bg-emerald-50 rounded-2xl">
          <CheckCircle className="w-8 h-8 mb-4" />
          <p className="font-bold text-lg">Base de données propre !</p>
          <p className="text-sm opacity-80 mt-1">Aucun doublon détecté pour le moment.</p>
        </div>
      )}

      <div className="grid gap-6">
        {clusters.map((cluster, idx) => (
          <div key={idx} className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 relative overflow-hidden group">
            {mergingClusterIdx === idx && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold mb-3">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Score de similarité: {cluster.confidence}%
                </span>
                <p className="text-sm text-slate-500 uppercase tracking-widest font-black mb-1">Fiche Principale (Conservée)</p>
                <h3 className="text-lg font-bold text-slate-900">{cluster.master.name}</h3>
                <p className="text-sm text-slate-500">{cluster.master.city}, {cluster.master.country} • {cluster.master.type}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDismiss(idx)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-xl transition-all"
                >
                  Ignorer
                </button>
                <button 
                  onClick={() => handleMerge(idx)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-pink-200"
                >
                  Fusionner tout vers la Fiche Principale
                </button>
              </div>
            </div>

            <div className="pl-6 border-l-2 border-slate-200 mt-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-black mb-3">Doublons détectés (Seront fusionnés puis supprimés)</p>
              <div className="grid gap-3">
                {cluster.duplicates.map((dup, dIdx) => (
                  <div key={dIdx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-700">{dup.name}</p>
                      <p className="text-xs text-slate-500">{dup.city}, {dup.country} • {dup.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-400 block">Raison</span>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{cluster.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
