import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Globe, 
  Building2, 
  Search, 
  Clock, 
  Loader2, 
  Activity, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  ExternalLink 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { academicGatheringService } from '../services/academicGatheringService';
import { institutionService } from '../services/institutionService';

export function DiagnosticPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'incomplete' | 'invalid_urls'>('logs');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // 1. Fetch academic crawler logs
      const logsQ = query(collection(db, 'crawler_logs'), orderBy('timestamp', 'desc'));
      const logsSnap = await getDocs(logsQ);
      const logsData = logsSnap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          formattedDate: d.timestamp?.toDate ? d.timestamp.toDate().toLocaleString() : new Date().toLocaleString()
        };
      });
      setLogs(logsData);

      // 2. Fetch institutions
      const insts = await institutionService.getAllInstitutions();
      setInstitutions(insts);
    } catch (e) {
      console.error("Error loading diagnostic metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Compute stats
  const totalLogs = logs.length;
  const successfulLogs = logs.filter(l => l.success).length;
  const successRate = totalLogs > 0 ? Math.round((successfulLogs / totalLogs) * 100) : 100;

  const incompleteInstitutions = institutions.filter(inst => {
    return !inst.website || !inst.description || inst.description.length < 30 || !inst.email || !inst.phone || !inst.logo;
  });

  const invalidUrlInstitutions = institutions.filter(inst => {
    if (!inst.website) return false;
    return !inst.website.includes('.') || inst.website.length < 5 || (!inst.website.startsWith('http://') && !inst.website.startsWith('https://'));
  });

  const duplicateCount = institutions.reduce((acc, current, index, self) => {
    const isDuplicate = self.findIndex(i => i.normalized_name === current.normalized_name || (i.normalized_domain && i.normalized_domain === current.normalized_domain)) !== index;
    return isDuplicate ? acc + 1 : acc;
  }, 0);

  // Auto-Scrape to enrich an incomplete institution
  const handleEnrich = async (inst: any) => {
    if (!inst.website) return;
    setEnrichingId(inst.id);
    setStatusMessage(`Scraping de ${inst.website} en cours...`);
    try {
      const result = await academicGatheringService.extractAcademicData(`Analyse du site: ${inst.website}`, inst.website);
      if (result && result.institution) {
        setStatusMessage("Enregistrement des données enrichies par l'IA...");
        await academicGatheringService.saveCrawledData(result);
        setStatusMessage("Établissement enrichi avec succès !");
        setTimeout(() => setStatusMessage(null), 3000);
        await loadMetrics();
      } else {
        throw new Error("Aucune donnée retournée par l'extraction.");
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage(`Erreur d'enrichissement: ${e.message || "Erreur de connexion."}`);
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setEnrichingId(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 rounded-3xl mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-600" />
            Tableau de Diagnostic & Qualité des Données
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Indicateurs d'intégrité, de déduplication et de mise à jour en temps réel.
          </p>
        </div>
        <button 
          onClick={loadMetrics}
          disabled={loading}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Rafraîchir
        </button>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-sm font-semibold flex items-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          {statusMessage}
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            successRate >= 90 ? 'bg-emerald-50 text-emerald-600' : successRate >= 70 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Taux de Collecte</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{successRate}%</div>
            <div className="text-slate-400 text-xs font-medium mt-0.5">{successfulLogs} sur {totalLogs} runs</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            incompleteInstitutions.length === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Incomplets</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{incompleteInstitutions.length}</div>
            <div className="text-slate-400 text-xs font-medium mt-0.5">Fiches manquant d'infos</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            duplicateCount === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Doublons Potentiels</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{duplicateCount}</div>
            <div className="text-slate-400 text-xs font-medium mt-0.5">Sur l'ensemble de la base</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            invalidUrlInstitutions.length === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">URLs Suspectes</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{invalidUrlInstitutions.length}</div>
            <div className="text-slate-400 text-xs font-medium mt-0.5">Liens cassés ou mal formatés</div>
          </div>
        </div>
      </div>

      {/* Visual Navigation Tabs */}
      <div className="border-b border-slate-200 mb-6 flex flex-wrap gap-4">
        <button 
          onClick={() => setActiveSubTab('logs')}
          className={`pb-4 px-1 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeSubTab === 'logs' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Logs de Collecte ({logs.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('incomplete')}
          className={`pb-4 px-1 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeSubTab === 'incomplete' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Établissements Incomplets ({incompleteInstitutions.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('invalid_urls')}
          className={`pb-4 px-1 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeSubTab === 'invalid_urls' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          URLs Invalides ({invalidUrlInstitutions.length})
        </button>
      </div>

      {/* Tabs panels render */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        {activeSubTab === 'logs' && (
          <div>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <p className="font-semibold text-slate-600">Aucun log de collecte enregistré.</p>
                <p className="text-xs mt-1">Les logs s'enregistreront lors de vos scans IA ou via URL.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Établissement cible</th>
                      <th className="py-3 px-4">Statut HTTP</th>
                      <th className="py-3 px-4">Type Run</th>
                      <th className="py-3 px-4">Outil</th>
                      <th className="py-3 px-4">Run Date</th>
                      <th className="py-3 px-4">Extraction</th>
                      <th className="py-3 px-4 text-right">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800 text-sm max-w-[280px] truncate">{log.institutionName || "Inconnu"}</span>
                              <span className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]" title={log.url}>{log.url}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              log.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              HTTP {log.statusCode || 200}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                            {log.academicContentDetected ? 'AI Academic' : 'AI Raw Content'}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono text-indigo-500 font-bold">
                            {log.scraperTool || 'Gemini Analyzer'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500 flex items-center gap-1.5 pt-4">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            {log.formattedDate}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <span className="text-slate-500">{log.scrapedLength || 0} caractères</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-all font-bold text-xs"
                            >
                              {expandedLogId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {expandedLogId === log.id && (
                          <tr>
                            <td colSpan={7} className="bg-slate-50/80 p-5 rounded-xl border border-inner">
                              <div className="text-xs font-mono text-slate-700 space-y-2 max-w-4xl overflow-x-auto">
                                <p><strong className="text-slate-500 font-bold uppercase text-[10px]">Statut :</strong> <span className={log.success ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{log.success ? "RÉUSSITE" : "ÉCHEC DE CONNEXION"}</span></p>
                                {log.errorMessage && (
                                  <p><strong className="text-slate-500 font-bold uppercase text-[10px]">Rapport d'Erreur :</strong> <span className="text-rose-700">{log.errorMessage}</span></p>
                                )}
                                <p><strong className="text-slate-500 font-bold uppercase text-[10px]">Scraping Metrics :</strong> {log.scrapedLength} caractères analysés</p>
                                <p><strong className="text-slate-500 font-bold uppercase text-[10px]">Identification de Structure :</strong> {log.academicContentDetected ? "Site académique détecté et validé" : "Aucune structure académique claire détectée, enrichissement IA appliqué"}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'incomplete' && (
          <div>
            {incompleteInstitutions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <p className="font-semibold text-slate-600">Base de données complète !</p>
                <p className="text-xs mt-1">Tous les établissements possèdent des données solides.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {incompleteInstitutions.map((inst, index) => (
                  <div key={inst.id || index} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-base">{inst.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">{inst.type}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-1">Situé à : {inst.city}, {inst.country}</p>
                      
                      {/* Detailed badges for holes in data */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {!inst.website && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100 font-bold">Sans Site Web</span>}
                        {(!inst.description || inst.description.length < 35) && <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md border border-rose-100 font-bold">Sans Description</span>}
                        {!inst.email && <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md border border-sky-100 font-bold">Sans Email</span>}
                        {!inst.phone && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100 font-bold">Sans Téléphone</span>}
                        {!inst.logo && <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-250 font-bold">Sans Logo</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      {inst.website ? (
                        <button
                          onClick={() => handleEnrich(inst)}
                          disabled={enrichingId !== null}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {enrichingId === inst.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Scraper via l'IA
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl block text-center">
                          Site web requis
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'invalid_urls' && (
          <div>
            {invalidUrlInstitutions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <p className="font-semibold text-slate-600">Aucune URL invalide !</p>
                <p className="text-xs mt-1">Tous les sites web sont correctly formatés et prêts au crawling.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {invalidUrlInstitutions.map((inst, index) => (
                  <div key={inst.id || index} className="p-4 rounded-xl border border-red-100 bg-red-50/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">{inst.name}</span>
                      <span className="text-xs text-red-600 bg-red-50 py-0.5 px-2 rounded font-mono mt-1.5 inline-block">{inst.website || "Vide / Manquant"}</span>
                      <p className="text-xs text-slate-400 mt-1">L'URL doit commencer par "http://" ou "https://" et inclure un nom de domaine valide.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a 
                        href={inst.website && inst.website.startsWith('http') ? inst.website : `https://${inst.website}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Tester le lien"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
