import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { 
  Trophy, 
  Briefcase, 
  Lightbulb, 
  GraduationCap, 
  Target,
  CheckCircle,
  TrendingUp,
  Quote,
  ExternalLink,
  Share2,
  FileText,
  Download,
  School,
  Lock,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { UniversityAnalysisResult, PostBacProfile } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface UniversityResultsDashboardProps {
  result: UniversityAnalysisResult;
  profile: PostBacProfile | null;
  onReset: () => void;
  hasPaid: boolean;
  onUpgrade: () => void;
  onSave?: () => void;
}

const PremiumOverlay = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl border border-indigo-100">
    <div className="bg-indigo-600 text-white p-3 rounded-full mb-3 shadow-lg">
      <Lock className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-1">Contenu Premium</h3>
    <p className="text-sm text-slate-600 mb-4 text-center max-w-xs">Débloque l'analyse complète pour voir ce contenu.</p>
    <button 
      onClick={onUpgrade}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-md"
    >
      Débloquer (1000 FCFA)
    </button>
  </div>
);

export function UniversityResultsDashboard({ result, profile, onReset, hasPaid, onUpgrade, onSave }: UniversityResultsDashboardProps) {
  console.log("UniversityResultsDashboard rendering with result:", result);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const chartData = result?.recommendedMajors?.slice(0, 5).map(m => ({
    name: m.major,
    score: m.score,
    reason: m.matchReason
  })) || [];

  const handleShare = async () => {
    if (!result?.recommendedMajors?.[0]) return;
    
    const text = `J'ai obtenu mon orientation sur OrienteBF !\nMa filière recommandée : ${result.recommendedMajors[0].major}\nProbabilité de réussite : ${result.successProbability}%`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon Orientation Post-BAC - OrienteBF',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Résultat copié dans le presse-papier !');
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('oriente-bf-resultats-universitaire.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      try {
        const originalTitle = document.title;
        document.title = "OrientationBF_Resultats_Univ";
        window.print();
        setTimeout(() => document.title = originalTitle, 1000);
      } catch (printError) {
        alert('Une erreur est survenue. Essayez CTRL+P ou CMD+P pour imprimer la page.');
      }
    }
  };

  if (!result) {
    console.error("UniversityResultsDashboard: No result provided");
    return null;
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="text-center relative">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-indigo-100 text-indigo-700"
        >
          <GraduationCap className="w-8 h-8" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Orientation Universitaire</h2>
        <p className="text-slate-600 mb-6">Voici les filières les plus adaptées à ton profil.</p>
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={handleShare}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Partager mes résultats"
          >
            <Share2 className="w-6 h-6" />
          </button>
          {onSave && (
            <button
              onClick={onSave}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Sauvegarder ce projet"
            >
              <FolderOpen className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={hasPaid ? handleDownloadPDF : onUpgrade}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {hasPaid ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {hasPaid ? "Télécharger le rapport" : "Rapport complet (Premium)"}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="space-y-8 p-4 bg-white/50 rounded-3xl">
        {/* Main Recommendation Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-indigo-100"
        >
          <div className="bg-indigo-600 p-8 text-white text-center">
            <h3 className="text-lg font-medium opacity-90 mb-2">Ta filière idéale est</h3>
            <div className="text-4xl font-bold tracking-tight mb-4">{result.recommendedMajors?.[0]?.major || "Non déterminée"}</div>
            <p className="max-w-2xl mx-auto text-indigo-100 italic">"{result.justification || "Analyse en cours..."}"</p>
          </div>

          <div className="px-8 py-4 bg-amber-50 border-y border-amber-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Avertissement :</strong> Ces résultats sont des conseils d'orientation basés sur votre profil scolaire pour vous aider à être orienté par l'État dans la filière idéale. Nous n'imposons rien ; le dernier mot vous appartient.
            </p>
          </div>
          
          <div className="p-8 grid md:grid-cols-3 gap-8">
            {/* Probability Stats */}
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
                {!hasPaid && <PremiumOverlay onUpgrade={onUpgrade} />}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">Score de Confiance IA</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{result.successProbability || 0}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${result.successProbability || 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">Employabilité</span>
                  <Briefcase className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-xl font-bold text-slate-900">{result.employabilityRating || "N/A"}</div>
                <p className="text-xs text-slate-500 mt-1">Sur le marché du travail actuel</p>
              </div>
            </div>

            {/* Top 5 Majors Chart */}
            <div className="md:col-span-2 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col">
              <h4 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top 5 des Filières Recommandées
              </h4>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={140} 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} 
                      interval={0}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Summary (BAC Grades) */}
        {profile && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Rappel de tes résultats (BAC)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Moyenne BAC</div>
                <div className="text-lg font-bold text-slate-900">{profile.bacAverage}/20</div>
              </div>
              {profile.bacGrades.map((grade, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1 truncate" title={grade.subject}>{grade.subject}</div>
                  <div className="text-lg font-bold text-slate-900">{grade.grade}/20</div>
                </div>
              ))}
              {profile.transcriptUrl && (
                <a 
                  href={profile.transcriptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center hover:bg-indigo-100 transition-colors group"
                >
                  <div className="text-[10px] text-indigo-500 font-bold uppercase mb-1 flex items-center gap-1">
                    Relevé <ExternalLink className="w-2 h-2" />
                  </div>
                  <div className="text-indigo-700">
                    <FileText className="w-5 h-5" />
                  </div>
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 relative">
          {!hasPaid && (
            <div className="absolute inset-0 z-20">
              <PremiumOverlay onUpgrade={onUpgrade} />
            </div>
          )}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Métiers & Débouchés Dédiés</h3>
            </div>
            <div className="space-y-4">
              {result.opportunities?.map((opp, i) => {
                // Compatibility check: in case previous data format (strings) is passed
                if (typeof opp === 'string') {
                  return (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-emerald-50/50 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {opp}
                    </div>
                  );
                }
                
                return (
                  <div key={i} className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-emerald-900 text-base">{opp.title}</h4>
                      <a href={opp.jobVideoUrl?.startsWith('http') && !opp.jobVideoUrl.includes('[') && !opp.jobVideoUrl.includes('(') ? opp.jobVideoUrl : `https://www.youtube.com/results?search_query=${encodeURIComponent('découvrir le métier de ' + opp.title)}`} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Vidéo Métier
                      </a>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">{opp.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white p-2 rounded-lg border border-emerald-50/50">
                        <span className="block text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Salaire Moyen</span>
                        <span className="text-xs font-medium text-slate-800">{opp.averageSalary}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-emerald-50/50">
                        <span className="block text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Demande</span>
                        <span className="text-xs font-medium text-slate-800">{opp.demandLevel}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-emerald-50/50">
                        <span className="block text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Risque Auto.</span>
                        <span className="text-xs font-medium text-slate-800">{opp.automationRisk}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-emerald-50/50">
                        <span className="block text-[10px] uppercase font-semibold text-slate-400 mb-0.5">International</span>
                        <span className="text-xs font-medium text-slate-800 truncate" title={opp.internationalOpportunities}>
                          {opp.internationalOpportunities}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-600 block mb-1">Compétences Requises:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {opp.requiredSkills?.map((skill, idx) => (
                            <span key={idx} className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full border border-indigo-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-xs font-semibold text-slate-600 block mb-1">Roadmap Carrière:</span>
                        <div className="space-y-1">
                          {opp.careerRoadmap?.map((step, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-xs text-slate-700">
                              <span className="text-emerald-500 font-bold mt-[1px]">{idx + 1}.</span>
                              <p>{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Conseils Stratégiques</h3>
            </div>
            <ul className="space-y-3">
              {result.strategicAdvice?.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-amber-50/50 p-3 rounded-lg">
                  <Target className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Career Opportunities / Concours Publics */}
        {result.careerOpportunities && result.careerOpportunities.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden mt-6"
          >
            {!hasPaid && <PremiumOverlay onUpgrade={onUpgrade} />}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Concours & Opportunités Professionnelles</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {result.careerOpportunities.map((opp, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg ${
                    opp.status === 'ouvert' ? 'bg-emerald-100 text-emerald-700' :
                    opp.status === 'bientôt ouvert' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {opp.status}
                  </div>
                  
                  <div className="mb-3 pr-20">
                     <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded inline-block mb-2">
                       {opp.type === 'concours' ? 'Concours Public' : opp.type === 'recrutement_societe_etat' ? 'Société d\'État' : 'Autre'}
                     </span>
                     <h4 className="font-bold text-slate-900 text-lg leading-tight">{opp.title}</h4>
                     <p className="text-sm font-medium text-slate-600 mt-1">{opp.organization}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white p-2 text-xs rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase">Niveau requis</span>
                      <span className="font-semibold text-slate-700">{opp.requiredDegree}</span>
                    </div>
                    <div className="bg-white p-2 text-xs rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase">Postes</span>
                      <span className="font-semibold text-slate-700">{opp.positionsCount > 0 ? opp.positionsCount : 'Non précisé'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Filières compatibles:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {opp.compatibleFields?.map((f, idx) => (
                          <span key={idx} className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Date cible:</strong> {opp.deadline}
                    </div>
                    {opp.conditions && (
                      <div className="text-xs text-slate-600 line-clamp-2" title={opp.conditions}>
                        <strong>Conditions:</strong> {opp.conditions}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
                    <a 
                      href={opp.officialUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Voir Modalités <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* University Lists Section */}
        {result.universities && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden"
          >
            {!hasPaid && <PremiumOverlay onUpgrade={onUpgrade} />}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <School className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Universités & Écoles Recommandées</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Burkina Faso */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-indigo-900 mb-3 border-b border-indigo-100 pb-2">Burkina Faso (Public)</h4>
                  <ul className="space-y-2">
                    {result.universities.burkinaPublic?.map((uni, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                        {uni}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-900 mb-3 border-b border-indigo-100 pb-2">Burkina Faso (Privé)</h4>
                  <ul className="space-y-2">
                    {result.universities.burkinaPrivate?.map((uni, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                        {uni}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* International */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide text-slate-500">Afrique</h4>
                    <ul className="space-y-1">
                      {result.universities.africa?.slice(0, 5).map((uni, i) => (
                        <li key={i} className="text-xs text-slate-600 truncate" title={uni}>• {uni}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide text-slate-500">Europe</h4>
                    <ul className="space-y-1">
                      {result.universities.europe?.slice(0, 5).map((uni, i) => (
                        <li key={i} className="text-xs text-slate-600 truncate" title={uni}>• {uni}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide text-slate-500">Amériques (USA/Canada)</h4>
                    <ul className="space-y-1">
                      {[...(result.universities.usa || []), ...(result.universities.canada || [])].slice(0, 5).map((uni, i) => (
                        <li key={i} className="text-xs text-slate-600 truncate" title={uni}>• {uni}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide text-slate-500">Asie</h4>
                    <ul className="space-y-1">
                      {result.universities.asia?.slice(0, 5).map((uni, i) => (
                        <li key={i} className="text-xs text-slate-600 truncate" title={uni}>• {uni}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Testimonials Section */}
        {result.testimonials && result.testimonials.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm">
                <Quote className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-indigo-900">Ils ont choisi cette voie</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {result.testimonials.map((testimonial, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm">
                  <p className="text-slate-600 italic mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.author}</div>
                      <div className="text-xs text-slate-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Useful Links Section */}
        {result.usefulLinks && result.usefulLinks.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-8 border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <ExternalLink className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Ressources Utiles</h3>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {result.usefulLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group border border-slate-100"
                >
                  <span className="font-medium text-sm truncate pr-2">{link.title}</span>
                  <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          Faire une nouvelle analyse
        </button>
      </div>
    </div>
  );
}
