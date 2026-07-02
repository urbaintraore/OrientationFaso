import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { 
  ShieldCheck, 
  TrendingUp, 
  BookOpen, 
  Calendar, 
  Mail, 
  Phone, 
  CheckCircle, 
  Bell, 
  FileText, 
  Sparkles, 
  Users,
  Target,
  ArrowRight
} from 'lucide-react';
import { StudentProfile, PostBacProfile } from '../types';

interface ParentFollowUpViewProps {
  profile: StudentProfile | PostBacProfile | null;
  result: any;
  isBac?: boolean;
}

export function ParentFollowUpView({ profile, result, isBac = false }: ParentFollowUpViewProps) {
  const [email, setEmail] = useState((profile as any)?.email || '');
  const [phone, setPhone] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'CIOSPB Bourses',
    'Campus Faso Inscriptions',
    'Dates Concours Fonction Publique'
  ]);
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [successMsg, setSuccessMsg] = useState('');

  // Parent tracking checkboard progress from localStorage
  const trackerKey = `parent_tracker_${profile?.name || 'child'}_${isBac ? 'bac' : 'bepc'}`;
  const [actions, setActions] = useState<{ id: string; label: string; checked: boolean }[]>(() => {
    try {
      const stored = localStorage.getItem(trackerKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    
    return [
      { id: 'act-1', label: "Retrait du relevé de notes officiel de l'examen", checked: false },
      { id: 'act-2', label: "Validation finale du choix de série/filière recommandée", checked: true },
      { id: 'act-3', label: "Création du compte d'accès (eConcours ou Campus Faso)", checked: false },
      { id: 'act-4', label: "Rassemblement des pièces civiles (CNIB légalisée, Extrait de naissance)", checked: false },
      { id: 'act-5', label: "Soumission du dossier d'aide financière ou bourse CIOSPB", checked: false }
    ];
  });

  const toggleAction = (id: string) => {
    const next = actions.map(act => act.id === id ? { ...act, checked: !act.checked } : act);
    setActions(next);
    try {
      localStorage.setItem(trackerKey, JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
  };

  // Generate clean historical chart data over the years
  // Post-BEPC covers Middle school years: 6ème, 5ème, 4ème, 3ème
  // Post-BAC covers High school years: 2nde, 1ère, Terminale
  const chartData = React.useMemo(() => {
    if (profile && (profile as any).gradesHistory && (profile as any).gradesHistory.length > 0) {
      return (profile as any).gradesHistory.map((h: any) => ({
        level: h.level,
        Moyenne: parseFloat(h.average) || 0,
        Target: 12.0
      }));
    }

    // Dynamic clean proxy mock data aligned with exam average if profile history is empty
    const examAvg = isBac 
      ? (profile as any).bacAverage || 11.5
      : (profile as any).bepcAverage || 12.0;

    if (isBac) {
      return [
        { level: "Seconde (2nde)", Moyenne: Math.max(10, Number((examAvg - 0.75).toFixed(2))), Target: 12.0 },
        { level: "Première (1ère)", Moyenne: Math.max(10, Number((examAvg - 0.3).toFixed(2))), Target: 12.0 },
        { level: "Terminale (Tle)", Moyenne: Number(Number(examAvg).toFixed(2)), Target: 12.0 }
      ];
    } else {
      return [
        { level: "6ème", Moyenne: Math.max(10, Number((examAvg + 0.5).toFixed(2))), Target: 12.0 },
        { level: "5ème", Moyenne: Math.max(10, Number((examAvg + 0.2).toFixed(2))), Target: 12.0 },
        { level: "4ème", Moyenne: Math.max(10, Number((examAvg - 0.4).toFixed(2))), Target: 12.0 },
        { level: "3ème (Examen)", Moyenne: Number(Number(examAvg).toFixed(2)), Target: 12.0 }
      ];
    }
  }, [profile, isBac]);

  const currentAvg = chartData[chartData.length - 1]?.Moyenne || 10;
  const initialAvg = chartData[0]?.Moyenne || 10;
  const growthRate = ((currentAvg - initialAvg) / initialAvg * 100).toFixed(1);
  const isUpwardTrend = currentAvg >= initialAvg;

  // Customized parent guide tips based on recommended series / fields
  const getParentCoachingTips = () => {
    const stream = (result?.recommendedSeries || result?.recommendedMajor || "Scientifique").toUpperCase();
    if (stream.includes('C') || stream.includes('INFORMATIQUE') || stream.includes('MÉDECINE') || stream.includes('TECHNOLOGIE')) {
      return [
        "Aménager un espace de travail calme à la maison, exempt de distractions sonores, car les disciplines scientifiques requièrent une concentration abstraite prolongée.",
        "Soutenir l'acquisition d'un équipement informatique de base (ordinateur portable simple, même de seconde main) et d'un accès internet régulé pour les recherches de code ou d'exercices physiques.",
        "Encourager l'autonomie en évitant le par cœur. Posez-lui des questions sur l'application concrète de ses théorèmes mathématiques dans la vie moderne.",
        "Prévoir un budget d'accompagnement de cours de soutien ou l'abonnement à des manuels d'exercices corrigés de mathématiques (collection Diadem ou similaire courante au Burkina)."
      ];
    } else if (stream.includes('A') || stream.includes('DROIT') || stream.includes('LITTÉRAIRE') || stream.includes('JOURNALISME')) {
      return [
        "Alimenter sa curiosité et son vocabulaire en lui offrant régulièrement des livres scolaires, des revues scientifiques burkinabè ou des romans littéraires d'auteurs africains.",
        "Organiser des débats d'actualité en famille lors des repas pour stimuler son art de l'argumentation orale, de la rhétorique et de l'esprit critique de synthèse.",
        "Veiller à la maîtrise parfaite de la rédaction française. Relisez périodiquement ses rédactions et ses devoirs littéraires pour l'aider à corriger l'orthographe.",
        "Valoriser les carrières de la communication internationale, du droit d'affaires ou de la diplomatie qui offrent de formidables opportunités aux profils littéraires d'excellence."
      ];
    } else {
      return [
        "Valoriser l'aspect technique et professionnel de son orientation. Les carrières industrielles, commerciales et tertiaires d'aujourd'hui exigent de fortes compétences d'application directe.",
        "L'accompagner dans la recherche d'un stage de découverte court (1 à 2 semaines pendant les grandes vacances) dans son secteur futur (ex: comptabilité, cabinet, entreprise agricole).",
        "Suivre rigoureusement l'esprit d'initiative. Incitez-le à concevoir de petits projets personnels d'application professionnelle (ex: gestion d'un budget fictif).",
        "S'assurer du suivi rigoureux de l'apprentissage de l'anglais des affaires, clé d'insertion incontournable dans l'espace économique de l'UEMOA."
      ];
    }
  };

  const handleToggleEvent = (eventName: string) => {
    if (selectedEvents.includes(eventName)) {
      setSelectedEvents(selectedEvents.filter(e => e !== eventName));
    } else {
      setSelectedEvents([...selectedEvents, eventName]);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubscribeStatus('loading');
    try {
      const res = await fetch('/api/reminders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          targetSegment: isBac ? 'BAC' : 'BEPC',
          eventsToNotify: selectedEvents
        })
      });

      if (!res.ok) throw new Error("Erreur de communication avec l'assistant cloud.");

      const data = await res.json();
      setSubscribeStatus('success');
      setSuccessMsg(data.message);
    } catch (err: any) {
      console.error(err);
      setSubscribeStatus('error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Parents Intro Premium Badge */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-505/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> Espace Parent de Confiance
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Tableau de Suivi Scolaire de {profile?.name || 'votre enfant'}
            </h3>
            <p className="text-indigo-200 text-sm max-w-2xl leading-relaxed">
              En tant que parent, suivez la courbe d'évolution académique de votre enfant, validez les étapes clés administratives burkinabè et programmez les rappels officiels d'admission par Email/SMS.
            </p>
          </div>
          <div className="shrink-0 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
            <div className="text-xs text-indigo-200">Examen visé</div>
            <div className="text-2xl font-black mt-1 uppercase text-amber-300">
              {isBac ? 'BAC' : 'BEPC'} 2026
            </div>
            <div className="text-[10px] text-indigo-300 mt-1">Série/Filière Recommandée : {result?.recommendedSeries || result?.recommendedMajor || 'Série C'}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Evolutionary progression chart (Recharts) */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Courbe d'Évolution Académique des Moyennes
              </h4>
              <span className={`text-xs font-extrabold px-2 py-1 rounded-md flex items-center gap-1 ${isUpwardTrend ? 'bg-green-50 text-green-750' : 'bg-amber-50 text-amber-700'}`}>
                {isUpwardTrend ? 'Tendance Progressive' : 'Tendance Stable'} ({growthRate}% depuis le début)
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Visualisation pluriannuelle de l'élève par rapport au seuil minimal optimal de réussite autonome (12/20).
            </p>
          </div>

          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoyenne" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="level" 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[8, 20]} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' 
                  }} 
                />
                <ReferenceLine y={12.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Seuil Confort (12/20)', fill: '#b45309', fontSize: 10, position: 'top' }} />
                <Line 
                  type="monotone" 
                  dataKey="Moyenne" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-start gap-3">
            <Target className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-650 leading-relaxed">
              <strong>Analyse Parentale :</strong> L'élève conserve une moyenne générale de <strong>{currentAvg}/20</strong>. Son cheminement académique présente des aptitudes propices. La série <strong>{result?.recommendedSeries || result?.recommendedMajor || 'Scientifique'}</strong> demandera une rigueur continue que vous pouvez favoriser par le suivi ci-dessous.
            </div>
          </div>
        </div>

        {/* Cloud Functions email subscriber date reminders */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Rappels Officiels par Email / SMS
            </h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Abonnez-vous aux alertes déclenchées par les fonctions cloud Firebase de notre académie pour recevoir les échéances scolaires burkinabè.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Adresse Email de Parent</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@gmail.com"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Numéro (SMS d'alerte, optionnel)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +226 70 00 00 00"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-700 block mb-2">Échéances d'Orientation de l'État :</span>
                <div className="space-y-2">
                  {[
                    { key: 'CIOSPB Bourses', label: 'Dossiers bourses de l\'État (CIOSPB)' },
                    { key: 'Campus Faso Inscriptions', label: 'Inscriptions & Choix Campus Faso' },
                    { key: 'Dates Concours Fonction Publique', label: 'Lancement Concours Fonction Publique (eConcours)' }
                  ].map((evt) => (
                    <label key={evt.key} className="flex items-center gap-2.5 text-xs text-slate-650 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(evt.key)}
                        onChange={() => handleToggleEvent(evt.key)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 h-4 w-4 accent-indigo-600"
                      />
                      <span>{evt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={subscribeStatus === 'loading'}
                className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Mail className="h-4 w-4" />
                {subscribeStatus === 'loading' ? 'Souscription en cours...' : 'S\'abonner aux Rappels Cloud'}
              </button>
            </form>

            <AnimatePresence>
              {subscribeStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800"
                >
                  <div className="flex gap-2 font-bold mb-1 items-center">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Abonnement Réussi !</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">{successMsg}</p>
                </motion.div>
              )}
              {subscribeStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800"
                >
                  Une erreur s'est produite lors de la connexion au service de messagerie d'État. Veuillez réessayer.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Parent Checkboard Action Checklist */}
        <div className="col-span-12 md:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Étapes Officielles à Valider par le Parent
            </h4>
            <p className="text-xs text-slate-500 mb-6">
              Cochez les jalons terminés pour garder une visibilité totale sur l'orientation administrative au lycée ou à l'université.
            </p>

            <div className="space-y-3">
              {actions.map((act) => (
                <button
                  key={act.id}
                  onClick={() => toggleAction(act.id)}
                  className="w-full text-left p-3.5 rounded-2xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 flex items-start gap-3 transition-all cursor-pointer focus:outline-none"
                >
                  <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-md flex items-center justify-center border transition-all ${act.checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                    {act.checked && <CheckCircle className="h-4.5 w-4.5" />}
                  </div>
                  <span className={`text-xs md:text-sm font-medium ${act.checked ? 'text-slate-500 line-through' : 'text-slate-850'}`}>
                    {act.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Progression</span>
            <span>{actions.filter(a => a.checked).length} / {actions.length} validés</span>
          </div>
        </div>

        {/* Accompagnement tips block */}
        <div className="col-span-12 md:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Conseils d'Accompagnement Pédagogique
            </h4>
            <p className="text-xs text-slate-500 mb-6">
              Directives spécifiques adaptées à la filière visée pour maximiser la réussite de l'étudiant.
            </p>

            <ul className="space-y-4">
              {getParentCoachingTips().map((tip, idx) => (
                <li key={idx} className="flex gap-2.5 items-start">
                  <div className="h-5 w-5 bg-indigo-50 text-indigo-600 font-bold shrink-0 rounded-full flex items-center justify-center text-[10px] mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed md:text-sm">
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
            <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 uppercase tracking-wide">
              Moteur de Guidance Pédagogique Burkina <Sparkles className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
