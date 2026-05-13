import React, { useRef } from 'react';
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
import { motion } from 'motion/react';
import { 
  Trophy, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  Activity, 
  Target,
  CheckCircle,
  XCircle,
  Quote,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Wallet,
  Download,
  Lock,
  Share2,
  FolderOpen,
  FileText
} from 'lucide-react';
import { StudentProfile, AnalysisResult } from '../types';
import { clsx } from 'clsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResultsDashboardProps {
  result: AnalysisResult;
  profile: StudentProfile | null;
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
      Débloquer (2000 FCFA)
    </button>
  </div>
);

export function ResultsDashboard({ result, profile, onReset, hasPaid, onUpgrade, onSave }: ResultsDashboardProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const chartData = result.top3Series?.map(s => ({
    name: s.series,
    score: s.score,
    reason: s.matchReason
  })) || [];

  const handleShare = async () => {
    if (!result?.recommendedSeries) return;
    
    const text = `J'ai obtenu mon orientation sur OrienteBF !\nMa série recommandée : ${result.recommendedSeries}\nScore de confiance IA : ${result.bacSuccessProbability}%`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon Orientation Post-BEPC - OrienteBF',
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

      pdf.save('oriente-bf-resultats.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      try {
        const originalTitle = document.title;
        document.title = "OrientationBF_Resultats";
        window.print();
        setTimeout(() => document.title = originalTitle, 1000);
      } catch (printError) {
        alert('Une erreur est survenue. Essayez CTRL+P ou CMD+P pour imprimer la page.');
      }
    }
  };

  if (!result) return null;

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col items-center justify-center relative">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-green-100 text-green-700"
        >
          <Trophy className="w-8 h-8" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Résultat de l'Orientation</h2>
        <p className="text-slate-600 mb-6">Basé sur l'analyse de ton profil scolaire et de tes ambitions.</p>
        
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
            <h3 className="text-lg font-medium opacity-90 mb-2">La série recommandée pour toi est</h3>
            <div className="text-5xl font-bold tracking-tight mb-4">{result.recommendedSeries || "Non déterminée"}</div>
            <p className="max-w-2xl mx-auto text-indigo-100 italic">"{result.motivationMessage || "Continue tes efforts !"}"</p>
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
                <div className="text-3xl font-bold text-slate-900">{result.bacSuccessProbability || 0}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${result.bacSuccessProbability || 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">Probabilité Mention</span>
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{result.bacMentionProbability || 0}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${result.bacMentionProbability || 0}%` }}
                  />
                </div>
              </div>
              
              {/* Projected Average - Premium Feature */}
              {result.projectedBacAverage && (
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden">
                  {!hasPaid && <PremiumOverlay onUpgrade={onUpgrade} />}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-indigo-700">Moyenne BAC Projetée</span>
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-3xl font-bold text-indigo-900">{result.projectedBacAverage}/20</div>
                  <p className="text-xs text-indigo-600 mt-1">Estimation basée sur ta progression actuelle</p>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="md:col-span-2 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col">
              <h4 className="font-semibold text-slate-900 mb-6">Comparatif des meilleures options</h4>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#475569', fontSize: 14, fontWeight: 500 }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32}>
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

        {/* Profile Summary (BEPC Grades) */}
        {profile && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Rappel de tes résultats (BEPC)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Moyenne BEPC</div>
                <div className="text-lg font-bold text-slate-900">{profile.bepcAverage}/20</div>
              </div>
              {profile.bepcGrades.map((grade, i) => (
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

        {/* Premium Future Projection Section */}
        {(result.suitableUniversityMajors || result.futureJobOpportunities) && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid md:grid-cols-3 gap-6 relative"
          >
            {!hasPaid && (
              <div className="absolute inset-0 z-20">
                <PremiumOverlay onUpgrade={onUpgrade} />
              </div>
            )}
            {/* University Majors */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Filières Universitaires Possibles</h3>
              </div>
              <ul className="space-y-2">
                {result.suitableUniversityMajors?.map((major, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {major}
                  </li>
                ))}
              </ul>
            </div>

            {/* Job Opportunities */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Débouchés Futurs</h3>
              </div>
              <ul className="space-y-2">
                {result.futureJobOpportunities?.map((job, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {job}
                  </li>
                ))}
              </ul>
            </div>

            {/* Income Level */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Niveau de Revenu Estimé</h3>
              </div>
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="text-2xl font-bold text-slate-900 mb-2">{result.estimatedIncomeLevel}</div>
                <p className="text-xs text-slate-500">Basé sur les tendances du marché au Burkina Faso</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analysis Details */}
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
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Analyse Détaillée</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Régularité</div>
                <p className="text-slate-700 text-sm">{result.analysis?.regularity || "N/A"}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Dominance</div>
                <p className="text-slate-700 text-sm">{result.analysis?.dominance || "N/A"}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Progression</div>
                <p className="text-slate-700 text-sm">{result.analysis?.progression || "N/A"}</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
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
                <h3 className="font-semibold text-slate-900">Conseils d'amélioration</h3>
              </div>
              <ul className="space-y-2">
                {result.improvementTips?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Points de vigilance</h3>
              </div>
              <ul className="space-y-2">
                {result.risks?.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

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
