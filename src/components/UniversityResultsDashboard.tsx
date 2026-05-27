import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
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
  FolderOpen,
  Bell,
  BookOpen
} from 'lucide-react';
import { UniversityAnalysisResult, PostBacProfile } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RecommendationRating } from './RecommendationRating';
import { evaluateBacOrientation, getSubjectScore } from '../services/pedagogicalEngine';

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
  const [filterType, setFilterType] = useState<string>('Tous');
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  // Call client-side pedagogical engine mathematically to align completely
  const mathOrientationReports = profile ? evaluateBacOrientation(profile) : [];
  
  // State for compatibility report visual view
  const [selectedCompatMajor, setSelectedCompatMajor] = useState<string>(
    mathOrientationReports[0]?.slug || 'Genie_Logiciel'
  );

  const majorSubjectsMap: Record<string, Array<{ subject: string, weight: number }>> = {
    'Genie_Logiciel': [
      { subject: 'Mathématiques', weight: 5 },
      { subject: 'Physique-Chimie', weight: 4 },
      { subject: 'Anglais', weight: 3 }
    ],
    'Reseaux_Telecoms': [
      { subject: 'Mathématiques', weight: 5 },
      { subject: 'Physique-Chimie', weight: 4 },
      { subject: 'Anglais', weight: 3 }
    ],
    'Medecine': [
      { subject: 'Chimie', weight: 5 },
      { subject: 'SVT', weight: 5 },
      { subject: 'Physique-Chimie', weight: 4 },
      { subject: 'Mathématiques', weight: 3.5 }
    ],
    'Agronomie_SVT': [
      { subject: 'SVT', weight: 5 },
      { subject: 'Chimie', weight: 4 },
      { subject: 'Mathématiques', weight: 3 }
    ],
    'Journalisme_Com': [
      { subject: 'Français', weight: 5 },
      { subject: 'Philosophie', weight: 4 },
      { subject: 'Anglais', weight: 4 }
    ],
    'Sciences_Eco_Gestion': [
      { subject: 'Mathématiques', weight: 5 },
      { subject: 'Français', weight: 3 },
      { subject: 'Anglais', weight: 3 }
    ],
    'Droit_Sciences_Pol': [
      { subject: 'Français', weight: 5 },
      { subject: 'Philosophie', weight: 4 },
      { subject: 'Histoire-Géo', weight: 3 }
    ],
    'Genie_Civil_Mines': [
      { subject: 'Mathématiques', weight: 5 },
      { subject: 'Physique-Chimie', weight: 5 },
      { subject: 'Français', weight: 2 }
    ]
  };

  const currentReport = mathOrientationReports.find(r => r.slug === selectedCompatMajor);
  const currentMajorSubjects = majorSubjectsMap[selectedCompatMajor] || [];
  const compatChartData = currentMajorSubjects.map(sub => {
    const grade = profile ? getSubjectScore(profile.bacGrades, sub.subject, 10) : 10;
    return {
      subject: sub.subject,
      'Coefficient': sub.weight,
      'Ma Note': grade,
      'Pondération': Math.round(grade * sub.weight)
    };
  });
  
  const handleEnableAlerts = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          setAlertsEnabled(true);
          alert("Alertes bourses activées via Firebase Messaging ! Vous recevrez des notifications push.");
        } else {
          alert("Vous devez autoriser les notifications pour activer les alertes bourses.");
        }
      });
    } else {
      setAlertsEnabled(true);
      alert("Alertes bourses activées !");
    }
  };

  const weakSubjects = profile?.bacGrades?.filter(g => g.grade < 12) || [];
  
  const chartData = result?.recommendedMajors?.slice(0, 5).map(m => ({
    name: m.major,
    score: m.score,
    reason: m.matchReason
  })) || [];

  const filteredMajors = result?.recommendedMajors?.filter(m => {
    if (filterType === 'Tous') return true;
    const nameLower = m.major.toLowerCase();
    if (filterType === 'Licence') return nameLower.includes('licence');
    if (filterType === 'Master') return nameLower.includes('master');
    if (filterType === 'BTS/DUT') return nameLower.includes('bts') || nameLower.includes('dut');
    if (filterType === 'Ingénieur') return nameLower.includes('ingénieur') || nameLower.includes('ingenieur');
    return true;
  }) || [];

  const handleDownloadCSV = () => {
    if (!profile) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Informations Personnelles\n";
    csvContent += `Nom,"${profile.name}"\n`;
    csvContent += `Âge,"${profile.age}"\n`;
    csvContent += `Sexe,"${profile.gender}"\n`;
    csvContent += `École,"${profile.school}"\n\n`;

    csvContent += "Historique des Moyennes\n";
    csvContent += "Niveau,Moyenne Générale\n";
    (profile.gradesHistory || []).forEach(h => {
      csvContent += `"${h.level}",${h.average}\n`;
    });
    
    csvContent += `\nNotes à l'examen (BAC)\n`;
    csvContent += "Matière,Note\n";
    (profile.bacGrades || []).forEach((g: any) => {
      csvContent += `"${g.subject}",${g.grade}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `profil_${profile.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    if (!contentRef.current || !profile) return;

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

      pdf.setFontSize(22);
      pdf.text(`Rapport d'Orientation Post-BAC - ${profile.name}`, 14, 20);

      const gradesTableBody = [...(profile.gradesHistory || [])].reverse().map(h => [h.level, h.average.toString()]);
      
      autoTable(pdf, {
        startY: 30,
        head: [['Niveau / Année', 'Moyenne Générale']],
        body: gradesTableBody,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 1) {
            const avg = parseFloat(data.cell.raw as string);
            if (!isNaN(avg)) {
              if (avg >= 12) {
                data.cell.styles.textColor = [22, 163, 74];
                data.cell.styles.fontStyle = 'bold';
              } else if (avg < 10) {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        }
      });

      const finalY = (pdf as any).lastAutoTable.finalY + 10;
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = finalY;

      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`oriente-bf-resultats-universitaire-${profile.name}.pdf`);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
        
        <div className="flex justify-center gap-4 action-buttons-container">
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
            onClick={handleEnableAlerts}
            className={`flex items-center gap-2 px-4 py-2 ${alertsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'} rounded-lg transition-colors shadow-sm`}
            title="Activer les alertes bourses via Firebase Messaging"
          >
            <Bell className="w-4 h-4" />
            {alertsEnabled ? 'Alertes Activées' : 'Activer Alertes Bourses'}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
            title="Exporter au format CSV"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={hasPaid ? handleDownloadPDF : onUpgrade}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {hasPaid ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {hasPaid ? "Imprimer Rapport" : "Rapport complet (Premium)"}
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
          
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="p-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 results-dashboard-grid"
          >
            {/* Probability Stats */}
            <motion.div variants={itemVariants} className="space-y-6 md:col-span-2 lg:col-span-4">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
                {!hasPaid && <PremiumOverlay onUpgrade={onUpgrade} />}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">Score de Confiance IA</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{result.successProbability || 0}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2 progress-bar-container">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-[1500ms] ease-out flex items-center justify-end" 
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
            </motion.div>

            {/* Top 5 Majors Chart */}
            <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-8 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col">
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
            </motion.div>

            {/* Section Analyse de compatibilité */}
            <motion.div variants={itemVariants} className="lg:col-span-12 bg-white rounded-2xl p-6 border border-indigo-100 flex flex-col mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Analyse de compatibilité & Pondération des Matières
                  </h4>
                  <p className="text-sm text-slate-500">Moteur pédagogique d’adéquation basé sur les coefficients stricts de chaque filière universitaire</p>
                </div>
                
                {/* Major Choices Dropdown */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedCompatMajor}
                    onChange={(e) => setSelectedCompatMajor(e.target.value)}
                    className="bg-slate-50 text-slate-800 font-bold text-sm px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {mathOrientationReports.map((report) => (
                      <option key={report.slug} value={report.slug}>
                        {report.name} (Match: {report.score}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentReport && (
                <div className="grid md:grid-cols-12 gap-6 items-stretch">
                  {/* Left explanation info */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">Indice d'Orientation</span>
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                          currentReport.score >= 75 ? 'bg-emerald-100 text-emerald-800' :
                          currentReport.score >= 55 ? 'bg-blue-100 text-blue-800' :
                          currentReport.score >= 35 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {currentReport.suitability}
                        </span>
                      </div>
                      <div className="text-4xl font-extrabold text-indigo-900 mb-2">{currentReport.score}%</div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">{currentReport.dominantGradeReason}</p>
                    </div>

                    <div className="p-4 bg-indigo-50/55 rounded-xl border border-indigo-100/50 flex-1">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-2">Critères de Décision</h5>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {currentReport.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Right chart */}
                  <div className="md:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-100 h-64 flex flex-col">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">Profil des Notes vs Exigence de Coefficient</h5>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compatChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                          <YAxis yAxisId="left" domain={[0, 20]} stroke="#4f46e5" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="right" domain={[0, 5]} orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar yAxisId="left" dataKey="Ma Note" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          <Bar yAxisId="right" dataKey="Coefficient" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Filières Compatibles vs Filières à Haut Risque */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Filières Compatibles */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 bg-emerald-50/5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Filières universitaires compatibles</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Domaines d'études recommandés où ton profil assure une excellente assimilation scientifique avec un niveau adéquat dans les matières clefs.
            </p>
            <div className="space-y-3">
              {mathOrientationReports.filter(r => r.score >= 45).map((r, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 flex items-start gap-4 justify-between shadow-sm hover:border-indigo-100 hover:shadow transition-all">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-800">{r.name}</span>
                    <p className="text-xs text-slate-500 leading-relaxed">{r.explanation.split('**Points d\'alerte :**')[0]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full inline-block">{r.score}% match</span>
                  </div>
                </div>
              ))}
              {mathOrientationReports.filter(r => r.score >= 45).length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">Aucune filière compatible trouvée dans cette simulation.</p>
              )}
            </div>
          </motion.div>

          {/* Filières à Haut Risque */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 bg-rose-50/5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Filières à haut risque académique</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 text-rose-800">
              Fortement déconseillées car tes résultats d'examens se situent en dessous des seuils d'apprentissage exigés (ex. &lt;7/20, &lt;8/20), entraînant des risques importants de redoublement.
            </p>
            <div className="space-y-3">
              {mathOrientationReports.filter(r => r.score < 45 || r.suitability === 'Fortement Déconseillée' || r.suitability === 'Déconseillée').map((r, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-rose-50 border-l-4 border-l-rose-500 flex items-start gap-4 justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-800">{r.name}</span>
                    <p className="text-xs text-rose-700 leading-relaxed font-bold">
                      {r.explanation.includes('**Points d\'alerte :**')
                        ? r.explanation.substring(r.explanation.indexOf('**Points d\'alerte :**'))
                        : r.explanation || "Seuils académiques inatteignables."}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full inline-block">Score: {r.score}%</span>
                  </div>
                </div>
              ))}
              {mathOrientationReports.filter(r => r.score < 45 || r.suitability === 'Fortement Déconseillée' || r.suitability === 'Déconseillée').length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">Excellente trajectoire : aucune filière ne présente de risque critique.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tableau Récapitulatif Scolaire de 3 Ans (Lecteur Parental) & Radar Summary */}
        {profile && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column (Table) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tableau Trajectoire & Lecture Parentale (Notes sur 3 ans)</h3>
                  <p className="text-xs text-slate-500">
                    Suivi de l'évolution de l'élève par les parents de la classe de Seconde au BAC : <span className="text-emerald-600 font-bold">vert (&gt;12)</span> pour des notes régulières, <span className="text-rose-600 font-bold">rouge (&lt;10)</span> pour des moyennes à redresser.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Matières</th>
                      {[...(profile.gradesHistory || [])].reverse().map((year, entryIdx) => (
                        <th key={entryIdx} className="py-3 px-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-center">
                          Classe de {year.level} (Moy: {year.average?.toFixed(2)})
                        </th>
                      ))}
                      <th className="py-3 px-4 text-xs font-bold uppercase text-indigo-600 tracking-wider text-center">
                        Notes Finales BAC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['Mathématiques', 'Physique-Chimie', 'SVT', 'Chimie', 'Français', 'Anglais', 'Philosophie', 'Histoire-Géo'].map((subjectName) => {
                      return (
                        <tr key={subjectName} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-sm text-slate-800">{subjectName}</td>
                          {[...(profile.gradesHistory || [])].reverse().map((year, yrIdx) => {
                            const yearGrade = getSubjectScore(year.grades, subjectName, -1);
                            return (
                              <td key={yrIdx} className="py-3 px-4 text-center">
                                {yearGrade === -1 ? (
                                  <span className="text-slate-400 font-medium">-</span>
                                ) : (
                                  <span className={`px-2.5 py-1 rounded font-bold text-sm inline-block ${
                                    yearGrade >= 12 ? 'bg-emerald-50 text-emerald-700' :
                                    yearGrade < 10 ? 'bg-rose-50 text-rose-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {yearGrade.toFixed(1)}/20
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-3 px-4 text-center">
                            {(() => {
                              const currentG = getSubjectScore(profile.bacGrades, subjectName, -1);
                              if (currentG === -1) return <span className="text-slate-400 font-medium">-</span>;
                              return (
                                <span className={`px-2.5 py-1 rounded-md font-extrabold text-sm inline-block border ${
                                  currentG >= 12 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                  currentG < 10 ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                  'bg-indigo-50 text-indigo-800 border-indigo-200'
                                }`}>
                                  {currentG.toFixed(1)}/20
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column (Radar & History Line Chart & MOOC suggestions) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
              {/* Radar Chart */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-2 text-center text-sm">Forces & Faiblesses (Radar)</h4>
                <div className="h-56 w-full radar-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={profile.bacGrades.slice(0, 5).map(g => ({ subject: g.subject.substring(0,6), grade: g.grade, fullMark: 20 }))}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                      <Radar name="Notes" dataKey="grade" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Evolution Chart over 3 years */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-2 text-center text-sm">Évolution de la Moyenne</h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...(profile.gradesHistory || [])].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} / 20`, 'Moyenne']}
                        labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="average" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MOOCs Suggestions */}
              {weakSubjects.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">Cours de soutien suggérés (MOOCs)</h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {weakSubjects.map((w, idx) => (
                      <a key={idx} href={`https://www.coursera.org/search?query=${encodeURIComponent(w.subject)}&language=French`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-2.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-colors group">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 text-xs">Améliorer en {w.subject}</h5>
                          <p className="text-[10px] text-slate-500 font-medium">Explorer les cours gratuits d'appui</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
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

      <RecommendationRating 
        recommendationType="bac"
        recommendationTitle={result.recommendedMajors?.[0]?.major || "Filière universitaire recommandée"}
        userId={profile?.name}
      />

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
