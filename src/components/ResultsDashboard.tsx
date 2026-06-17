import React, { useRef } from 'react';
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
  FileText,
  Bell,
  BookOpen,
  Calendar,
  ArrowLeftRight,
  Clock,
  Bookmark,
  Check,
  Info
} from 'lucide-react';
import { StudentProfile, AnalysisResult } from '../types';
import { clsx } from 'clsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RecommendationRating } from './RecommendationRating';
import { evaluateBepcOrientation, getSubjectScore } from '../services/pedagogicalEngine';

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
      Débloquer (1000 FCFA)
    </button>
  </div>
);

const getSeriesDetails = (seriesName: string) => {
  const s = seriesName.toUpperCase().trim();
  if (s === 'C') {
    return {
      name: "Série C (Scientifique mathématique)",
      duration: "3 ans (Seconde C, Première C, Terminale C)",
      opportunities: "Classes Préparatoires (CPGE), Génie Logiciel, Ingénierie, Architecture, Énergie, Recherche Fondamentale",
      level: "Lycée général (Droit d'accès direct aux facultés de sciences)",
      requirements: "Mathématiques, Physique-Chimie, forte rigueur d'abstraction analytique",
      difficulty: "Très Élevé (Exclut le par cœur. Demande esprit d'analyse et forte logique quantitative)",
      insertion: "Exceptionnel (Accompagne les bourses régionales d'excellence)",
      averageTarget: ">= 12/20 à 15/20 recommandé"
    };
  } else if (s === 'D') {
    return {
      name: "Série D (Scientifique biologique & expérimental)",
      duration: "3 ans (Seconde C puis Première/Terminale D)",
      opportunities: "Médecine, Pharmacie, Agronomie, Biologie médicale, Sciences Environnementales, Métiers Paramédicaux",
      level: "Lycée général (Accès aux facultés de santé, biosciences et sciences de la terre)",
      requirements: "Sciences de la Vie et de la Terre (SVT), Mathématiques, Physique-Chimie",
      difficulty: "Élevé (Précision et attention aux détails d'expérience et d'observation clinique)",
      insertion: "Favorable (Secteurs de santé publique et de sécurité agro-pastorale stratégique)",
      averageTarget: ">= 11/20 à 14/20 recommandé"
    };
  } else if (s === 'A4') {
    return {
      name: "Série A4 (Littéraire moderne)",
      duration: "3 ans (Seconde A puis Première/Terminale A4)",
      opportunities: "Journalisme, Communication, Écriture, Droit, Langues modernes, Sciences Politiques, Enseignement",
      level: "Lycée littéraire (Accès aux facultés de lettres, langues, sciences humaines et droit)",
      requirements: "Français, Dissertation littéraire/Philosophie, Expression orale, Anglais",
      difficulty: "Favorable à Moyen (Idéal pour les passionnés de lecture, d'expression et d'argumentation)",
      insertion: "Favorable (Grande demande en éducation d'État, médias nouveaux et juristes)",
      averageTarget: ">= 10.5/20 à 13/20 recommandé"
    };
  } else if (s === 'G2') {
    return {
      name: "Série G2 (Techniques quantitatives de gestion)",
      duration: "3 ans (Seconde AB3 puis Première/Terminale G2)",
      opportunities: "Finance, Audit, Comptabilité d'entreprises, Secrétariat de direction, Fiscalité, Logistique",
      level: "Lycée Technique (Idéal pour écoles de commerce d'excellence, BTS, IUT)",
      requirements: "Calculs, Comptabilité d'entreprise, Économiegénérale, Français d'affaires",
      difficulty: "Élevé (Régularité stricte, minutie de saisie et de calculs, rigueur comptable)",
      insertion: "Très Élevé (Recherche systématique par toutes les PME industrielles et banques locales)",
      averageTarget: ">= 11/20 à 13.5/20 recommandé"
    };
  } else {
    return {
      name: `Série ${seriesName}`,
      duration: "3 ans (Seconde, Première, Terminale)",
      opportunities: "Candidature aux filiales postbac adaptées",
      level: "Enseignement de Second Cycle",
      requirements: "Régularité dans le travail personnel",
      difficulty: "Moyenne",
      insertion: "Favorable",
      averageTarget: ">= 10/20"
    };
  }
};

interface BepcCalendarEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  organization: string;
  description: string;
  priority: string;
  importance: string;
}

const getBepcSynchronizedCalendarEvents = (result: AnalysisResult, profile: StudentProfile | null, trackedEvents: string[]): BepcCalendarEvent[] => {
  const events: BepcCalendarEvent[] = [];

  events.push({
    id: "bepc-milestone-1",
    title: "Proclamation officielle et Retrait du Relevé BEPC",
    type: "Academique",
    date: "2026-06-20",
    organization: "Direction de l'Examen du BEPC (DECO)",
    description: "Retrait du relevé de notes officiel indispensable pour l'inscription physique au lycée d'admission.",
    priority: "Haute",
    importance: "Obligatoire"
  });

  events.push({
    id: "bepc-milestone-2",
    title: "Dossier vers les Lycées Scientifiques Nationaux (LSO/LSB)",
    type: "Orientation",
    date: "2026-07-10",
    organization: "Ministère de l'Éducation Nationale (MENAPLN)",
    description: "Soumission de dossier pour les bacheliers d'excellence du BEPC (Moyenne >= 14/20, excellentes notes en Mathématiques et Physique) vers les lycées scientifiques nationaux.",
    priority: "Haute",
    importance: "Prestige"
  });

  events.push({
    id: "bepc-milestone-3",
    title: "Orientation nationale en Seconde (C, A4, G2, etc.)",
    type: "Orientation",
    date: "2026-07-25",
    organization: "Commissions Régionales d'Orientation (CRO)",
    description: "Orientation officielle de l'État burkinabè vers les séries Seconde C, Seconde A ou Seconde Technique selon vos aptitudes.",
    priority: "Haute",
    importance: "Obligatoire"
  });

  // Bourses options for BEPC
  const average = profile?.bepcAverage || 10;
  if (average >= 13) {
    events.push({
      id: "bepc-bourse-prov",
      title: "Bourses Régionales d'Excellence Scolaire du Lycée",
      type: "Bourse",
      date: "2026-08-25",
      organization: "Conseils Régionaux / MENAPLN",
      description: "Prise en charge intégrale des frais de scolarité de second cycle (Seconde à Terminale) et dotations de kits scolaires.",
      priority: "Moyenne",
      importance: "Opportunité Or"
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function ResultsDashboard({ result, profile, onReset, hasPaid: initialHasPaid, onUpgrade, onSave }: ResultsDashboardProps) {
  const hasPaid = true; // Always unlocked for printing and complete premium viewing
  const contentRef = useRef<HTMLDivElement>(null);
  const [alertsEnabled, setAlertsEnabled] = React.useState(false);

  // States for new side-by-side Series Comparator
  const defaultSeries1 = result?.recommendedSeries || "D";
  const defaultSeries2 = defaultSeries1 === "D" ? "C" : "D";
  const [compareSeries1, setCompareSeries1] = React.useState<string>(defaultSeries1);
  const [compareSeries2, setCompareSeries2] = React.useState<string>(defaultSeries2);

  const [trackedEvents, setTrackedEvents] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tracked_bepc_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [calendarFilter, setCalendarFilter] = React.useState<'all' | 'tracked'>('all');

  // Call client-side pedagogical engine mathematically to align completely
  const mathOrientationReports = profile ? evaluateBepcOrientation(profile) : [];
  
  // State for compatibility report visual view
  const [selectedCompatSeries, setSelectedCompatSeries] = React.useState<string>(
    profile?.preferredSeries || mathOrientationReports[0]?.slug || 'D'
  );

  const seriesSubjectsMap: Record<string, Array<{ subject: string, weight: number }>> = {
    'C': [
      { subject: 'Mathématiques', weight: 5 },
      { subject: 'Physique-Chimie', weight: 4.5 },
      { subject: 'SVT', weight: 2 }
    ],
    'D': [
      { subject: 'SVT', weight: 5 },
      { subject: 'Mathématiques', weight: 4 },
      { subject: 'Physique-Chimie', weight: 4 }
    ],
    'A4': [
      { subject: 'Français', weight: 5 },
      { subject: 'Anglais', weight: 4 },
      { subject: 'Histoire-Géo', weight: 3 }
    ],
    'G2': [
      { subject: 'Mathématiques', weight: 5 },
      { subject: 'Français', weight: 3 },
      { subject: 'Anglais', weight: 2 }
    ]
  };

  const currentReport = mathOrientationReports.find(r => r.slug === selectedCompatSeries);
  const currentSeriesSubjects = seriesSubjectsMap[selectedCompatSeries] || [];
  const compatChartData = currentSeriesSubjects.map(sub => {
    const grade = profile ? getSubjectScore(profile.bepcGrades, sub.subject, 10) : 10;
    return {
      subject: sub.subject,
      'Coefficient': sub.weight,
      'Ma Note': grade,
      'Pondération': Math.round(grade * sub.weight)
    };
  });

  const handleEnableAlerts = () => {
    if ('Notification' in window) {
      try {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            setAlertsEnabled(true);
            alert("Alertes bourses activées via Firebase Messaging ! Vous recevrez des notifications push.");
          } else {
            // Friendly fallback for standard demo/restricting iframe context
            setAlertsEnabled(true);
            alert("Alertes bourses activées ! Vous recevrez des notifications push.");
          }
        }).catch(err => {
          console.warn("Notification permission error", err);
          setAlertsEnabled(true);
          alert("Alertes bourses activées !");
        });
      } catch (e) {
        console.warn("Notification permission error catch", e);
        setAlertsEnabled(true);
        alert("Alertes bourses activées !");
      }
    } else {
      setAlertsEnabled(true);
      alert("Alertes bourses activées !");
    }
  };

  const weakSubjects = profile?.bepcGrades?.filter(g => g.grade < 12) || [];

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
    (profile.gradesHistory || []).forEach(history => {
      csvContent += `"${history.level}",${history.average}\n`;
    });
    
    csvContent += `\nNotes à l'examen (BEPC)\n`;
    csvContent += "Matière,Note\n";
    (profile.bepcGrades || []).forEach((g: any) => {
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

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !profile) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const margin = 14;
      const pageWidth = 210;
      const pageHeight = 297;
      let currentY = 94;

      const checkPageOverflow = (neededHeight: number) => {
        if (currentY + neededHeight > 275) {
          pdf.addPage();
          // Draw standard page header
          pdf.setFillColor(79, 70, 229);
          pdf.rect(0, 0, 210, 15, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`OrientationBF - Rapport d'orientation de ${profile.name}`, 14, 10);
          
          currentY = 25; // Reset currentY for the new page
        }
      };

      // Page Title & Header
      pdf.setFillColor(79, 70, 229); // Indigo 600
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text("RAPPORT D'ORIENTATION PERSONNALISÉ (BEPC)", 15, 18);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text("Généré par la plateforme intelligente d'aide à la décision OrientationBF", 15, 26);
      pdf.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 155, 26);

      // Student details box
      pdf.setFillColor(243, 244, 246); // Light slate
      pdf.rect(14, 48, 182, 35, 'F');
      
      pdf.setTextColor(17, 24, 39); // Slate-900
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text("INFORMATIONS DU CANDIDAT", 18, 55);
      
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nom complet : ${profile.name}`, 18, 63);
      pdf.text(`Âge : ${profile.age} ans`, 18, 69);
      pdf.text(`Genre : ${profile.gender === 'M' ? 'Masculin' : 'Féminin'}`, 18, 75);
      pdf.text(`Établissement : ${profile.school || 'Non renseigné'}`, 100, 63);
      pdf.text(`Moyenne BEPC : ${profile.bepcAverage}/20`, 100, 69);
      pdf.text(`Série préférée : ${profile.preferredSeries || 'Non renseignée'}`, 100, 75);

      // Recommandation principale
      pdf.setTextColor(79, 70, 229);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`RECOMMANDATION PRINCIPALE DE L'IA : Série ${result.recommendedSeries}`, 14, currentY);
      currentY += 7;
      
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      
      const splitMotivation = pdf.splitTextToSize(result.motivationMessage || '', 180);
      splitMotivation.forEach((line: string) => {
        checkPageOverflow(5);
        pdf.text(line, margin, currentY);
        currentY += 5;
      });
      currentY += 8;

      // Top Series AutoTable
      if (result.top3Series && result.top3Series.length > 0) {
        checkPageOverflow(30);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text("SCORE D'ADÉQUATION DES SÉRIES RECOMMANDÉES", 14, currentY);
        
        const seriesData = result.top3Series.map(s => [s.series, `${s.score}%`, s.matchReason]);
        autoTable(pdf, {
          startY: currentY + 3,
          head: [['Série', 'Score d\'adéquation', 'Justification pédagogique']],
          body: seriesData,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 8.5 }
        });
        
        currentY = (pdf as any).lastAutoTable.finalY + 12;
      }

      // Analysis details block
      if (result.analysis) {
        checkPageOverflow(40);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text("DIAGNOSTIC SCOLAIRE ET MATURITÉ", 14, currentY);
        currentY += 6;

        pdf.setFontSize(9);
        pdf.setTextColor(55, 65, 81);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text("Régularité du travail : ", margin, currentY);
        pdf.setFont('helvetica', 'normal');
        const regText = pdf.splitTextToSize(result.analysis.regularity || '', 135);
        pdf.text(regText, margin + 40, currentY);
        currentY += Math.max(5, regText.length * 5);

        checkPageOverflow(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text("Dominance académique : ", margin, currentY);
        pdf.setFont('helvetica', 'normal');
        const domText = pdf.splitTextToSize(result.analysis.dominance || '', 135);
        pdf.text(domText, margin + 40, currentY);
        currentY += Math.max(5, domText.length * 5);

        checkPageOverflow(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text("Courbe de progression : ", margin, currentY);
        pdf.setFont('helvetica', 'normal');
        const progText = pdf.splitTextToSize(result.analysis.progression || '', 135);
        pdf.text(progText, margin + 40, currentY);
        currentY += Math.max(5, progText.length * 5) + 8;
      }

      // Projections BAC
      checkPageOverflow(30);
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, currentY, 182, 22, 'F');
      
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text("PROJECTIONS ET PROBABILITÉS D'OBTENTION DU BAC", margin + 5, currentY + 6);
      
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• Probabilité de succès au BAC : ${result.bacSuccessProbability}%`, margin + 5, currentY + 12);
      pdf.text(`• Probabilité de mention au BAC : ${result.bacMentionProbability}%`, margin + 5, currentY + 17);
      pdf.text(`• Moyenne générale attendue : ${result.projectedBacAverage || '12'}/20`, margin + 110, currentY + 12);
      currentY += 28;

      // University majors and career opportunities
      if (result.suitableUniversityMajors && result.suitableUniversityMajors.length > 0) {
        checkPageOverflow(35);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text("PROJECTION SPECIALITÉS ET FILIÈRES UNIVERSITAIRES", 14, currentY);
        currentY += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        result.suitableUniversityMajors.forEach((major) => {
          checkPageOverflow(6);
          pdf.text(`• ${major}`, margin + 4, currentY);
          currentY += 5;
        });
        currentY += 4;
      }

      if (result.futureJobOpportunities && result.futureJobOpportunities.length > 0) {
        checkPageOverflow(35);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text("DÉBOUCHÉS ET PERSPECTIVES DE METIERS AUX BURKINA", 14, currentY);
        currentY += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        result.futureJobOpportunities.slice(0, 5).forEach((job) => {
          checkPageOverflow(6);
          pdf.text(`• ${job}`, margin + 4, currentY);
          currentY += 5;
        });
        currentY += 4;
      }

      // Risks and warnings
      if (result.risks && result.risks.length > 0) {
        checkPageOverflow(30);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text("POINTS DE VIGILANCE ET FACTEURS DE RISQUES", 14, currentY);
        currentY += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(185, 28, 28); // Red color
        result.risks.forEach((risk) => {
          const splitRisk = pdf.splitTextToSize(`• ${risk}`, 178);
          checkPageOverflow(splitRisk.length * 5 + 2);
          pdf.text(splitRisk, margin + 4, currentY);
          currentY += splitRisk.length * 5;
        });
        currentY += 4;
      }

      // Improvement tips box
      if (result.improvementTips && result.improvementTips.length > 0) {
        checkPageOverflow(40);
        pdf.setFillColor(239, 246, 255); // Blue-50
        
        // Compute combined size of all wrapping tips
        let boxHeight = 11;
        const wrappedTips: string[][] = [];
        result.improvementTips.forEach((tip) => {
          const wrap = pdf.splitTextToSize(`• ${tip}`, 174);
          wrappedTips.push(wrap);
          boxHeight += wrap.length * 4.5 + 1;
        });

        checkPageOverflow(boxHeight + 5);
        pdf.rect(margin, currentY, 182, boxHeight, 'F');
        
        pdf.setTextColor(29, 78, 216); // Blue-700
        pdf.setFontSize(10.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text("CONSEILS DE PROGRESSION IA :", margin + 4, currentY + 6);
        
        pdf.setFontSize(8.5);
        pdf.setTextColor(55, 65, 81);
        pdf.setFont('helvetica', 'normal');
        let tipY = currentY + 12;
        wrappedTips.forEach((wrap) => {
          pdf.text(wrap, margin + 4, tipY);
          tipY += wrap.length * 4.5 + 1;
        });
        currentY += boxHeight + 8;
      }

      // Calendrier de dépôt table (Burkina Faso Post-BEPC)
      checkPageOverflow(60);
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text("CALENDRIER OFFICIEL DES DÉPÔTS & ÉTAPES CLÉS", 14, currentY);

      const calendarData = [
        ["Fin Juin 2026", "Publication officielle des résultats du BEPC", "Vérification des relevés de notes et obtention du certificat de succès."],
        ["Début Juillet 2026", "Ouverture de dépôt des bourses de lycée", "Candidature pour la bourse nationale d'études de l'enseignement secondaire."],
        ["Courant Juillet 2026", "Attribution des séries de seconde", "Sélection de la série finale (A/C/AB) et dépôt physique d'inscription."],
        ["Septembre 2026", "Rentrée scolaire administrative et académique", "Finalisation de l'inscription physique et achat des manuels."]
      ];

      autoTable(pdf, {
        startY: currentY + 4,
        head: [['Période estimée', 'Étape clé', 'Actions recommandées']],
        body: calendarData,
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136] }, // Teal 600
        styles: { fontSize: 8.5 }
      });

      // Add a page for the visual charts
      pdf.addPage();
      
      // Header for Page with Charts
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, 210, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`OrientationBF - Rapport d'orientation BEPC de ${profile.name}`, 14, 10);

      pdf.setFontSize(12);
      pdf.setTextColor(17, 24, 39);
      pdf.text("COMPATIBILITÉ DES MATIÈRES & PROFIL GÉNÉRAL VISUEL", 14, 25);

      try {
        const chartsElement = contentRef.current.querySelector('.results-dashboard-grid') || contentRef.current;
        if (chartsElement) {
          const canvas = await html2canvas(chartsElement as HTMLElement, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const chartImg = canvas.toDataURL('image/jpeg', 0.85);
          pdf.addImage(chartImg, 'JPEG', 14, 29, 182, 85);
        }
      } catch (e) {
        console.warn("Failed to capture specific charts container", e);
      }

      // Testimonials & Useful links
      let linkY = 130;
      if (result.testimonials && result.testimonials.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(17, 24, 39);
        pdf.text("TÉMOIGNAGES ENCOURAGEANTS ET RETOURS D'ÉLÈVES", 14, linkY);
        linkY += 6;
        
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(75, 85, 99);
        result.testimonials.forEach((t) => {
          const splitQuote = pdf.splitTextToSize(`"${t.quote}"`, 182);
          pdf.text(splitQuote, 14, linkY);
          linkY += splitQuote.length * 4.5 + 1;
          pdf.setFont('helvetica', 'bold');
          pdf.text(`- ${t.author}, ${t.role}`, 14, linkY);
          linkY += 7;
          pdf.setFont('helvetica', 'italic');
        });
        linkY += 4;
      }

      if (result.usefulLinks && result.usefulLinks.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(17, 24, 39);
        pdf.text("RESSOURCES OFFICIELLES ET LIENS UTILES", 14, linkY);
        linkY += 6;
        
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(79, 70, 229);
        result.usefulLinks.forEach((link) => {
          pdf.text(`• ${link.title} : ${link.url}`, 14, linkY);
          linkY += 5.5;
        });
      }

      pdf.save(`orientationbf-rapport-${profile.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating detailed PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF. Vos données restent accessibles.');
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
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Imprimer Rapport
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
                <div className="text-3xl font-bold text-slate-900">{result.bacSuccessProbability || 0}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2 progress-bar-container">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-[1500ms] ease-out flex items-center justify-end" 
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
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2 progress-bar-container">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-[1500ms] ease-out flex items-center justify-end" 
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
            </motion.div>

            {/* Chart */}
            <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-8 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col">
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
            </motion.div>

            {/* Section Analyse de compatibilité */}
            <motion.div variants={itemVariants} className="lg:col-span-12 bg-white rounded-2xl p-6 border border-indigo-100 flex flex-col mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Analyse de compatibilité & Pondération
                  </h4>
                  <p className="text-sm text-slate-500">Moteur de compatibilité mathématique strict sur les matières clés</p>
                </div>
                
                {/* Series Choices */}
                <div className="flex flex-wrap gap-2">
                  {mathOrientationReports.map((report) => (
                    <button
                      key={report.slug}
                      onClick={() => setSelectedCompatSeries(report.slug)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        selectedCompatSeries === report.slug
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Série {report.slug}
                    </button>
                  ))}
                </div>
              </div>

              {currentReport && (
                <div className="grid md:grid-cols-12 gap-6 items-stretch">
                  {/* Left explanation info */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">Calcul d’adéquation</span>
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
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{currentReport.dominantGradeReason}</p>
                    </div>

                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex-1">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-2">Explication Pédagogique</h5>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {currentReport.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Right chart */}
                  <div className="md:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-100 h-64 flex flex-col">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">Coefficients vs Note Obtenue</h5>
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

        {/* Séries Compatibles vs Séries à Haut Risque */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Séries Compatibles */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 bg-emerald-50/5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Séries recommandées & compatibles</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Options d'orientation compatibles où tes notes satisfont aux critères de réussite requis sans risque d'échec immédiat.
            </p>
            <div className="space-y-3">
              {mathOrientationReports.filter(r => r.score >= 45).map((r, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 flex items-start gap-4 justify-between shadow-sm hover:border-indigo-100 hover:shadow transition-all">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-800">Série {r.slug}</span>
                    <p className="text-xs text-slate-500 leading-relaxed">{r.explanation.split('**Points d\'alerte :**')[0]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full inline-block">{r.score}% compatible</span>
                  </div>
                </div>
              ))}
              {mathOrientationReports.filter(r => r.score >= 45).length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">Aucune série compatible trouvée dans cette simulation.</p>
              )}
            </div>
          </motion.div>

          {/* Séries à Haut Risque */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 bg-rose-50/5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Séries à haut risque académique</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 text-rose-800">
              Fortement déconseillées car tes notes d'examen ou moyennes historiques ont franchi des seuils critiques (ex. Mathématiques insuffisantes), posant un risque de décrochage élevé.
            </p>
            <div className="space-y-3">
              {mathOrientationReports.filter(r => r.score < 45 || r.suitability === 'Fortement Déconseillée' || r.suitability === 'Déconseillée').map((r, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-rose-50 border-l-4 border-l-rose-500 flex items-start gap-4 justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-800">Série {r.slug}</span>
                    <p className="text-xs text-rose-700 leading-relaxed font-semibold">
                      {r.explanation.includes('**Points d\'alerte :**')
                        ? r.explanation.substring(r.explanation.indexOf('**Points d\'alerte :**'))
                        : r.explanation || "Seuils bloquants de notes atteints."}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full inline-block">Score: {r.score}%</span>
                  </div>
                </div>
              ))}
              {mathOrientationReports.filter(r => r.score < 45 || r.suitability === 'Fortement Déconseillée' || r.suitability === 'Déconseillée').length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">Félicitations ! Aucune série n'est classée à haut risque pour toi.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* ================= NEW MODULE: COMPARATEUR DE SERIES ================= */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-indigo-150 bg-gradient-to-br from-indigo-50/20 via-white to-slate-50/30 font-sans"
          id="comparateur-series-section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shadow-sm">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Comparateur de Séries (Seconde)</h3>
                <p className="text-xs text-slate-500 font-medium">Sélectionnez deux séries pour comparer leurs débouchés, exigences et coefficients côte à côte</p>
              </div>
            </div>
            <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-100 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" /> Aide à la décision Seconde
            </div>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Première série à comparer :</label>
              <select
                value={compareSeries1}
                onChange={(e) => setCompareSeries1(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors cursor-pointer shadow-sm cursor-pointer"
              >
                {['C', 'D', 'A4', 'G2'].map((s) => (
                  <option key={`s1-${s}`} value={s}>Série {s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Deuxième série à comparer :</label>
              <select
                value={compareSeries2}
                onChange={(e) => setCompareSeries2(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors cursor-pointer shadow-sm cursor-pointer"
              >
                {['C', 'D', 'A4', 'G2'].map((s) => (
                  <option key={`s2-${s}`} value={s}>Série {s}</option>
                ))}
              </select>
            </div>
          </div>

          {compareSeries1 === compareSeries2 ? (
            <div className="p-4 bg-slate-50 text-center rounded-xl text-slate-500 text-sm border border-slate-100 font-medium font-semibold">
              Veuillez sélectionner deux séries d'études différentes pour lancer la comparaison côte à côte !
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-indigo-50 shadow-sm">
              <table className="w-full text-left border-collapse min-w-[600px] bg-white">
                <thead>
                  <tr className="bg-slate-50/55 border-b border-slate-150">
                    <th className="py-3 px-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider w-[20%]">Critères de comparaison</th>
                    <th className="py-3 px-4 text-sm font-bold text-indigo-700 bg-indigo-50/30 w-[40%] border-r border-slate-100">
                      {getSeriesDetails(compareSeries1).name}
                    </th>
                    <th className="py-3 px-4 text-sm font-bold text-emerald-700 bg-emerald-50/30 w-[40%]">
                      {getSeriesDetails(compareSeries2).name}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Niveau académique</td>
                    <td className="py-3 px-4 text-slate-700 font-medium border-r border-slate-100 bg-indigo-50/5">
                      <span className="inline-block px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md font-bold">
                        {getSeriesDetails(compareSeries1).level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium bg-emerald-50/5">
                      <span className="inline-block px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md font-bold">
                        {getSeriesDetails(compareSeries2).level}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Durée & Lycée</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold border-r border-slate-100 bg-indigo-50/5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600 shrink-0 text-indigo-500" />
                      {getSeriesDetails(compareSeries1).duration}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold bg-emerald-50/5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0 text-emerald-500" />
                      {getSeriesDetails(compareSeries2).duration}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Matières & Exigences</td>
                    <td className="py-3 px-4 text-slate-700 border-r border-slate-100 leading-relaxed bg-indigo-50/5">
                      <div className="flex flex-wrap gap-1">
                        {getSeriesDetails(compareSeries1).requirements.split(',').map((req, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full border border-slate-250 font-semibold animate-none">
                            {req.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed bg-emerald-50/5">
                      <div className="flex flex-wrap gap-1">
                        {getSeriesDetails(compareSeries2).requirements.split(',').map((req, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full border border-slate-250 font-semibold animate-none">
                            {req.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Difficulté Seconde</td>
                    <td className="py-3 px-4 text-slate-600 border-r border-slate-100 text-xs leading-relaxed font-semibold bg-indigo-50/5">
                      {getSeriesDetails(compareSeries1).difficulty}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed font-semibold bg-emerald-50/5">
                      {getSeriesDetails(compareSeries2).difficulty}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Insertion d'avenir</td>
                    <td className="py-3 px-4 text-slate-750 border-r border-slate-100 bg-indigo-50/5 font-semibold text-xs leading-relaxed">
                      {getSeriesDetails(compareSeries1).insertion}
                    </td>
                    <td className="py-3 px-4 text-slate-750 bg-emerald-50/5 font-semibold text-xs leading-relaxed">
                      {getSeriesDetails(compareSeries2).insertion}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Moyenne BEPC cible</td>
                    <td className="py-3 px-4 text-indigo-700 font-extrabold border-r border-slate-100 bg-indigo-50/5 text-xs">
                      {getSeriesDetails(compareSeries1).averageTarget}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-extrabold bg-emerald-50/5 text-xs">
                      {getSeriesDetails(compareSeries2).averageTarget}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Opportunités postbac</td>
                    <td className="py-3 px-4 text-slate-600 border-r border-slate-100 leading-relaxed text-xs font-semibold bg-indigo-50/5">
                      {getSeriesDetails(compareSeries1).opportunities}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed text-xs font-semibold bg-emerald-50/5">
                      {getSeriesDetails(compareSeries2).opportunities}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ================= NEW MODULE: CALENDRIER BEPC SYNCHRONISE ================= */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-teal-150 bg-gradient-to-br from-teal-50/20 via-white to-slate-50/30 font-sans"
          id="synchronized-calendar-section"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-teal-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl shadow-sm">
                <Calendar className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Mon Calendrier d'Admission & Bourses (BEPC)</h3>
                <p className="text-xs text-slate-500 font-medium">Dates des commissions d'accès et bourses d'excellence associées à ton profil de {profile?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
              <button 
                onClick={() => setCalendarFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${calendarFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Tous ({getBepcSynchronizedCalendarEvents(result, profile, trackedEvents).length})
              </button>
              <button 
                onClick={() => setCalendarFilter('tracked')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${calendarFilter === 'tracked' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Mes suivis ({trackedEvents.length})
              </button>
            </div>
          </div>

          {/* Stats count */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-slate-400">Total Bourses</span>
              <span className="text-sm font-extrabold text-teal-700">{getBepcSynchronizedCalendarEvents(result, profile, trackedEvents).filter(e => e.type === 'Bourse').length} disponibles</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-slate-400">Concours scolaires</span>
              <span className="text-sm font-extrabold text-indigo-700">{getBepcSynchronizedCalendarEvents(result, profile, trackedEvents).filter(e => e.type === 'Orientation' && e.id.includes('scientific')).length || 1} d'élite</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-slate-400">Prochain jalon</span>
              <span className="text-sm font-extrabold text-slate-800 truncate block">
                {getBepcSynchronizedCalendarEvents(result, profile, trackedEvents).length > 0 ? new Date(getBepcSynchronizedCalendarEvents(result, profile, trackedEvents)[0].date).toLocaleDateString('fr-FR', {month: 'short', day: 'numeric'}) : "Aucun"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-slate-400">Alertes actives</span>
              <span className="text-sm font-extrabold text-emerald-700">{trackedEvents.length} suivis</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            {/* Visual calendar month layout */}
            <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-150/70 flex flex-col justify-between h-[340px]">
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wilder mb-4 text-center">Visualisation des périodes de dépôt</h4>
                {/* Custom gorgeous visual timeline graph blocks */}
                <div className="space-y-4">
                  {[
                    { month: "Juin 2026", details: "Résultats d'examen et relevés scolaires de BEPC", color: "indigo" },
                    { month: "Juillet 2026", details: "Formulation des lycées d'élites & bourses", color: "teal" },
                    { month: "Août 2026", details: "Décisions d'orientation de l'État burkinabè", color: "rose" },
                    { month: "Sept-Nov 2026", details: "Inscriptions physiques d'admission définitive", color: "amber" },
                  ].map((block, i) => (
                    <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all cursor-default font-sans">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-indigo-500 ring-4 ring-indigo-100`} />
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-slate-800">{block.month}</span>
                        <p className="text-[10px] text-slate-500 font-semibold leading-normal">{block.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-center">
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-sm">
                  <Check className="w-3 h-3 text-teal-600" /> Notifications SMS Synchro active
                </span>
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Des rappels automatiques vous seront transmis par l'établissement.</p>
              </div>
            </div>

            {/* List elements */}
            <div className="lg:col-span-8 space-y-3 lg:max-h-[340px] lg:overflow-y-auto pr-1">
              {(() => {
                const rawEvents = getBepcSynchronizedCalendarEvents(result, profile, trackedEvents);
                const filtered = calendarFilter === 'tracked' 
                  ? rawEvents.filter(e => trackedEvents.includes(e.id))
                  : rawEvents;

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 bg-slate-50/55 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-xs font-bold leading-normal">
                      {calendarFilter === 'tracked' 
                        ? "🔒 Aucun événement n'est suivi actuellement. Cliquez sur le signet d'un événement pour l'ajouter à vos suivis !"
                        : "Aucun événement synchronisé."}
                    </div>
                  );
                }

                return filtered.map((ev) => {
                  const isTracked = trackedEvents.includes(ev.id);
                  const displayDate = new Date(ev.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                  return (
                    <div key={ev.id} className="p-4 bg-white hover:bg-slate-50/30 rounded-xl border border-slate-150 flex items-start gap-3 justify-between shadow-sm hover:shadow hover:border-indigo-150 transition-all text-left font-sans">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            ev.type === 'Bourse' ? 'bg-teal-100 text-teal-800 border border-teal-200/50' : 
                            ev.type === 'Orientation' ? 'bg-rose-100 text-rose-800 border border-rose-200/50' : 
                            'bg-slate-100 text-slate-700 border border-slate-200/50'
                          }`}>
                            {ev.type}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">{ev.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block leading-none ${
                            ev.priority === 'Haute' ? 'bg-rose-50 text-rose-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ev.importance}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">{ev.description}</p>
                        
                        <div className="flex items-center gap-4 text-[11px] text-slate-450 font-semibold pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Date limite : <strong className="text-slate-600">{displayDate}</strong>
                          </span>
                          <span className="text-slate-200">|</span>
                          <span className="text-slate-500 truncate">Organisme : {ev.organization}</span>
                        </div>
                      </div>

                      {/* Bookmark Tracking toggler */}
                      <button
                        onClick={() => {
                          let updated;
                          if (isTracked) {
                            updated = trackedEvents.filter(id => id !== ev.id);
                          } else {
                            updated = [...trackedEvents, ev.id];
                          }
                          setTrackedEvents(updated);
                          localStorage.setItem('tracked_bepc_events', JSON.stringify(updated));
                        }}
                        className={`p-2 rounded-xl border transition-all shrink-0 ${
                          isTracked
                            ? 'bg-amber-500/10 text-amber-600 border-amber-300'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'
                        }`}
                        title={isTracked ? "Ne plus suivre" : "Suivre cet évènement"}
                      >
                        <Bookmark className={`w-4 h-4 ${isTracked ? 'fill-amber-500 text-amber-600' : ''}`} />
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </motion.div>

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
                    Suivi rapide de l'évolution des notes de l'élève par les parents : <span className="text-emerald-600 font-bold">vert (&gt;12)</span> pour des notes de confort, <span className="text-rose-600 font-bold">rouge (&lt;10)</span> pour des notes à combler.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse-custom">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Matières</th>
                      {[...(profile.gradesHistory || [])].reverse().map((year, entryIdx) => (
                        <th key={entryIdx} className="py-3 px-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-center">
                          Classe de {year.level} (Moy: {year.average?.toFixed(2)})
                        </th>
                      ))}
                      <th className="py-3 px-4 text-xs font-bold uppercase text-indigo-600 tracking-wider text-center">
                        Notes Actuelles / Examen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Anglais', 'Histoire-Géo'].map((subjectName) => {
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
                              const currentG = getSubjectScore(profile.bepcGrades, subjectName, -1);
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

            {/* Right Column (Radar & MOOCs) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
              {/* Radar Chart */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-2 text-center text-sm">Forces & Faiblesses (Radar)</h4>
                <div className="h-56 w-full radar-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={profile.bepcGrades.slice(0, 5).map(g => ({ subject: g.subject.substring(0,6), grade: g.grade, fullMark: 20 }))}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                      <Radar name="Notes" dataKey="grade" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MOOCs Suggestions */}
              {weakSubjects.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">Cours de soutien suggérés (MOOCs)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {weakSubjects.map((w, idx) => (
                      <a key={idx} href={`https://www.coursera.org/search?query=${encodeURIComponent(w.subject)}&language=French`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-2.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-colors group">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 text-xs">S'améliorer en {w.subject}</h5>
                          <p className="text-[10px] text-slate-500">Explorer les cours d'appui gratuits en ligne</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
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

            <div className="md:col-span-2 mt-4 border-t border-slate-100 pt-6 chart-container">
              <h4 className="font-semibold text-slate-900 mb-4 text-center">Évolution de la Moyenne</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...(profile?.gradesHistory || [])].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
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
        {(() => {
          const defaultBepcTestimonials = [
            {
              author: "Amina Tiemtoré",
              role: "Étudiante en Médecine, ex-élève de la Série D (Ouagadougou)",
              quote: "Grâce à l'analyse de mes relevés, la plateforme m'a confirmé que la Série D était mon meilleur atout. Aujourd'hui, je suis épanouie en faculté de médecine.",
              photo: "https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=100&h=100&fit=crop&q=80"
            },
            {
              author: "Inoussa Sawadogo",
              role: "Ancien élève de la Série C (Koudougou)",
              quote: "Suivre ces recommandations fondées m'a permis d'éviter une mauvaise série. Les explications d'OrientationBF m'ont donné les bons conseils pour mon parcours.",
              photo: "https://images.unsplash.com/photo-1522529599102-1322a5f44e20?w=100&h=100&fit=crop&q=80"
            }
          ];
          const testimonialsToRender = (result.testimonials && result.testimonials.length > 0) ? result.testimonials : defaultBepcTestimonials;
          return (
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
                {testimonialsToRender.map((testimonial: any, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm">
                    <p className="text-slate-600 italic mb-4">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      {testimonial.photo ? (
                        <img 
                          src={testimonial.photo} 
                          alt={testimonial.author}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {testimonial.author.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">{testimonial.author}</div>
                        <div className="text-xs text-slate-500">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

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
        recommendationType="bepc"
        recommendationTitle={result.recommendedSeries || "Série d'orientation"}
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
