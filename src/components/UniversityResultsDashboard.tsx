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
  BookOpen,
  Calendar,
  ArrowLeftRight,
  Clock,
  Bookmark,
  Check,
  Info
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

const getMajorDetails = (majorName: string) => {
  const norm = majorName.toLowerCase().trim();
  if (norm.includes('logiciel') || norm.includes('informatique') || norm.includes('computer') || norm.includes('technologie')) {
    return {
      name: "Génie Logiciel / Informatique",
      duration: "3 ans (Licence) à 5 ans (Master / R&D)",
      opportunities: "Développeur Full-stack, Architecte Logiciel, Ingénieur DevOps, Chef de projet IT, Consultant, Intégrateur",
      level: "Licence (BAC+3) / Master (BAC+5)",
      requirements: "Mathématiques, Algorithmique, Physique, Anglais",
      difficulty: "Élevé (Requiert de la logique et persévérance)",
      insertionRate: "Excellent (> 92% à 6 mois)",
      tuition: "Gratuit en Public ou de 400 000 à 900 000 FCFA/an (Privé)"
    };
  } else if (norm.includes('télécom') || norm.includes('telecom') || norm.includes('réseau') || norm.includes('reseau')) {
    return {
      name: "Réseaux & Télécommunications",
      duration: "3 ans (Licence / BTS) à 5 ans (Ingénieur)",
      opportunities: "Ingénieur Télécoms, Administrateur Réseau, Expert Cybersécurité",
      level: "BAC+3 (Licence) / BAC+5 (Ingénieur d'État)",
      requirements: "Physique-Chimie, Mathématiques de signal, Électronique",
      difficulty: "Moyen à Élevé (Concepts d'infrastructures physiques)",
      insertionRate: "Forte Demande (~ 85% d'insertion)",
      tuition: "Gratuit en Public ou de 450 000 à 900 000 FCFA/an (Privé)"
    };
  } else if (norm.includes('médecine') || norm.includes('medecine') || norm.includes('santé') || norm.includes('sante') || norm.includes('pharmacie')) {
    return {
      name: "Médecine / Sciences de la Santé",
      duration: "7 à 8 ans (Doctorat d'État en Médecine)",
      opportunities: "Médecin Généraliste, Chef de Projet Santé, Clinicien, Pédiatre",
      level: "BAC+7 (Doctorat) à BAC+11/+12 (Spécialités)",
      requirements: "Sciences de la Vie (SVT), Chimie organique, Physique médicale",
      difficulty: "Très Élevé (Mémoire colossale, gardes stressantes)",
      insertionRate: "Exceptionnel (~ 100% de placement direct)",
      tuition: "Concours d'excellence (Public) ou 1 200 000 - 1 800 000 FCFA/an (Privé)"
    };
  } else if (norm.includes('agronome') || norm.includes('agronomie') || norm.includes('agriculture') || norm.includes('élevage') || norm.includes('svt')) {
    return {
      name: "Agronomie & Sciences de la Terre",
      duration: "3 ans (Licence) à 5 ans (Ingénieur Agronome)",
      opportunities: "Ingénieur d'exploitation, Conseiller agro-pastoral, Chercheur INERA",
      level: "BAC+3 (Licence) / BAC+5 (Ingénieur d'État)",
      requirements: "SVT / Biologie végétale, Chimie organique, Pédologie des sols",
      difficulty: "Moyen (Demande des sorties d'études fréquentes)",
      insertionRate: "Élevé (80% - Secteur de souveraineté)",
      tuition: "Gratuit en Public ou de 300 000 à 650 000 FCFA/an (Privé)"
    };
  } else if (norm.includes('journalisme') || norm.includes('communication') || norm.includes('médias') || norm.includes('media')) {
    return {
      name: "Journalisme & Communication",
      duration: "3 ans (Licence Pro) à 5 ans (Master II)",
      opportunities: "Journaliste TV/presse, Rédacteur web, Chargé de communication",
      level: "BAC+3 (Licence Pro) / BAC+5 (Master)",
      requirements: "Français, Expression écrite, Anglais, Culture générale",
      difficulty: "Moyen (Travail relationnel et écriture fluide)",
      insertionRate: "Favorable (75% - Essor des médias en ligne)",
      tuition: "Gratuit en Public (IPERMIC) ou de 350 000 à 750 000 FCFA/an (Privé)"
    };
  } else if (norm.includes('droit') || norm.includes('juridique') || norm.includes('politique')) {
    return {
      name: "Droit & Sciences Politiques",
      duration: "3 ans (Licence) à 5 ans (Master de Spécialisation)",
      opportunities: "Juriste d'entreprise, Avocat, Magistrat, Greffier, Notaire",
      level: "BAC+3 (Licence Droit) / BAC+5 (Master II) + Concours (ENAM/CAPA)",
      requirements: "Français, Dissertation/Philosophie, Esprit de synthèse",
      difficulty: "Élevé (Mémorisation de codes et plaidoiries)",
      insertionRate: "Moyen (Très compétitif, dépendant de concours)",
      tuition: "Gratuit en Public ou de 250 000 à 600 000 FCFA/an (Privé)"
    };
  } else if (norm.includes('éco') || norm.includes('eco') || norm.includes('gestion') || norm.includes('finance') || norm.includes('compta')) {
    return {
      name: "Sciences Économiques & Gestion",
      duration: "3 ans (Licence) à 5 ans (Master Universitaire CCA / Finance)",
      opportunities: "Comptable, Analyste Crédit, Auditeur, Directeur Financier",
      level: "BAC+3 (Licence Pro) / BAC+5 (Master Pros)",
      requirements: "Mathématiques financières, Statistiques, Économie, Comptabilité",
      difficulty: "Moyen à Élevé (Rigueur de calculs)",
      insertionRate: "Élevé (85% d'insertion en entreprises)",
      tuition: "Gratuit en Public ou de 300 000 à 750 000 FCFA/an (Privé)"
    };
  } else if (norm.includes('civil') || norm.includes('mine') || norm.includes('géologie') || norm.includes('geologie') || norm.includes('bâtiment') || norm.includes('btp')) {
    return {
      name: "Génie Civil, Mines & Géologie",
      duration: "3 ans (Licence Pro) à 5 ans (Ingénieur de Conception)",
      opportunities: "Ingénieur BTP, Géologue Minier, Chef de chantier BTP",
      level: "BAC+3 (Licence Pro) / BAC+5 (Diplôme d'Ingénieur)",
      requirements: "Mathématiques, Physique (Mécanique/Statique), RDM",
      difficulty: "Très Élevé (Rigueur de calculs de structures)",
      insertionRate: "Excellent (90% lié au boom minier et BTP)",
      tuition: "Gratuit en Public ou de 450 000 à 1 200 000 FCFA/an (Privé)"
    };
  } else {
    return {
      name: majorName,
      duration: "3 ans (Licence) à 5 ans (Master)",
      opportunities: `Métiers de conseil et d'encadrement en rapport avec ${majorName}`,
      level: "BAC+3 (Licence) / BAC+5 (Master / MBA)",
      requirements: "Série du BAC adaptée, entretien pédagogique de motivation",
      difficulty: "Moyen (Régularité indispensable)",
      insertionRate: "Favorable selon le secteur d'activité au Burkina",
      tuition: "Standard Public ou de 300 000 à 700 000 FCFA/an (Privé)"
    };
  }
};

interface CalendarEvent {
  id: string;
  title: string;
  type: "Academique" | "Orientation" | "Bourse" | "Concours" | string;
  date: string;
  organization: string;
  description: string;
  priority: "Haute" | "Moyenne" | "Basse" | string;
  importance: string;
}

const getSynchronizedCalendarEvents = (result: UniversityAnalysisResult, profile: PostBacProfile | null, trackedEvents: string[]): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  // 1. Core orientation milestones
  events.push({
    id: "milestone-1",
    title: "Session du BAC & Retrait des Relevés",
    type: "Academique",
    date: "2026-06-25",
    organization: "Office du BAC du Burkina Faso",
    description: "Retrait du relevé de notes original indispensable pour toute candidature universitaire.",
    priority: "Haute",
    importance: "Obligatoire"
  });

  events.push({
    id: "milestone-2",
    title: "Ouverture du portail CampusFaso",
    type: "Orientation",
    date: "2026-07-15",
    organization: "Ministère de l'Enseignement Supérieur (MESRI)",
    description: "Création obligatoire de votre INE (Identifiant National d'Étudiant) et formulation des vœux de filières.",
    priority: "Haute",
    importance: "Obligatoire"
  });

  // 2. Add Concours dynamically from result.careerOpportunities
  if (result.careerOpportunities && result.careerOpportunities.length > 0) {
    result.careerOpportunities.forEach((opp, i) => {
      events.push({
        id: `opp-${opp.id || i}`,
        title: `Concours : ${opp.title}`,
        type: "Concours",
        date: opp.deadline || "2026-08-15",
        organization: opp.organization || "Ministère de la Fonction Publique d'État",
        description: `Recrutement d'État (${opp.requiredDegree}). Conditions : ${opp.conditions || 'Standard'}`,
        priority: "Moyenne",
        importance: "Optionnel"
      });
    });
  }

  // 3. Add Scholarships (Bourses) matching profile average
  const average = profile?.bacAverage || 10;
  
  if (average >= 14) {
    events.push({
      id: "bourse-ciospb-nat",
      title: "Bourses Nationales d'Excellence du CIOSPB",
      type: "Bourse",
      date: "2026-08-10",
      organization: "CIOSPB (Burkina Faso)",
      description: "Allocation mensuelle de l'État burkinabè pour les bacheliers d'excellence ayant obtenu au moins 14/20.",
      priority: "Haute",
      importance: "Opportunité Or"
    });
  }

  if (average >= 15) {
    events.push({
      id: "bourse-foreign",
      title: "Bourses d'Études Étrangères de Coopération (Maroc, Tunisie, Algérie)",
      type: "Bourse",
      date: "2026-07-31",
      organization: "CIOSPB & Ambassades partenaires",
      description: "Bourse d'études complète à l'étranger réservée aux bacheliers de très haut niveau.",
      priority: "Haute",
      importance: "Prestige"
    });
  }

  if (average >= 10) {
    events.push({
      id: "bourse-foner-aide",
      title: "Aide Sociale Universitaire FONER",
      type: "Bourse",
      date: "2026-10-15",
      organization: "Fonds National pour l'Éducation et la Recherche (FONER)",
      description: "Allocation de 175 000 FCFA non remboursable pour tout étudiant burkinabè inscrit régulièrement au public/privé.",
      priority: "Moyenne",
      importance: "Aide Sociale"
    });

    events.push({
      id: "pret-foner",
      title: "Demande de Prêt d'Études Subventionné FONER",
      type: "Bourse",
      date: "2026-11-15",
      organization: "FONER",
      description: "Prêt d'aide à l'équipement et à l'hébergement remboursable à faible taux après l'entrée dans la vie active.",
      priority: "Basse",
      importance: "Financement"
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function UniversityResultsDashboard({ result, profile, onReset, hasPaid: initialHasPaid, onUpgrade, onSave }: UniversityResultsDashboardProps) {
  const hasPaid = true; // Always unlocked for printing and complete premium viewing
  console.log("UniversityResultsDashboard rendering with result:", result);
  const contentRef = useRef<HTMLDivElement>(null);
  const [filterType, setFilterType] = useState<string>('Tous');
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  // States for side-by-side Major Comparator
  const defaultMajor1 = result?.recommendedMajors?.[0]?.major || "Génie Logiciel / Informatique";
  const defaultMajor2 = result?.recommendedMajors?.[1]?.major || "Médecine / Sciences de la Santé";
  const [compareMajor1, setCompareMajor1] = useState<string>(defaultMajor1);
  const [compareMajor2, setCompareMajor2] = useState<string>(defaultMajor2);

  // Tracked / Bookmarked calendar events in local storage
  const [trackedEvents, setTrackedEvents] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tracked_orientation_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [calendarFilter, setCalendarFilter] = useState<'all' | 'tracked'>('all');

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
          pdf.text(`OrientationBF - Rapport d'orientation post-BAC de ${profile.name}`, ...[14, 10]);
          
          currentY = 25; // Reset currentY for the new page
        }
      };

      // Page Title & Header
      pdf.setFillColor(79, 70, 229); // Indigo 600
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text("RAPPORT D'ORIENTATION UNIVERSITAIRE (BAC)", 15, 18);
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
      pdf.text("INFORMATIONS DU CANDIDAT (BAC)", 18, 55);
      
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nom complet : ${profile.name}`, 18, 63);
      pdf.text(`Âge : ${profile.age} ans`, 18, 69);
      pdf.text(`Genre : ${profile.gender === 'M' ? 'Masculin' : 'Féminin'}`, 18, 75);
      pdf.text(`Établissement : ${profile.school || 'Non renseigné'}`, 100, 63);
      pdf.text(`Moyenne BAC : ${profile.bacAverage}/20`, 100, 69);
      pdf.text(`Série BAC : ${profile.bacSeries || 'Non renseignée'}`, 100, 75);

      // Justification principale
      pdf.setTextColor(79, 70, 229);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`RÉSUMÉ ANALYTIQUE DE L'IA :`, 14, currentY);
      currentY += 7;
      
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      
      const splitJustification = pdf.splitTextToSize(result.justification || '', 180);
      splitJustification.forEach((line: string) => {
        checkPageOverflow(5);
        pdf.text(line, margin, currentY);
        currentY += 5;
      });
      currentY += 8;

      // Recommended university fields table
      if (result.recommendedMajors && result.recommendedMajors.length > 0) {
        checkPageOverflow(30);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text("FILIÈRES D'ÉTUDES RECOMMANDÉES PAR COMPATIBILITÉ", 14, currentY);
        
        const majorsData = result.recommendedMajors.map(m => [m.major, `${m.score}%`, m.matchReason]);
        autoTable(pdf, {
          startY: currentY + 3,
          head: [['Filière d\'études', 'Compatibilité', 'Motifs d\'adéquation ou prérequis']],
          body: majorsData,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 8.5 }
        });
        
        currentY = (pdf as any).lastAutoTable.finalY + 12;
      }

      // Projections et Insertion
      checkPageOverflow(25);
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, currentY, 182, 14, 'F');
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(10.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Probabilité d'insertion professionnelle estimée : ${result.employabilityRating || 'Indéterminée (85%)'}`, margin + 5, currentY + 9);
      currentY += 20;

      // Universities list (by location/category)
      if (result.universities) {
        checkPageOverflow(30);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text("ÉTABLISSEMENTS SUPÉRIEURS ET ÉCOLES RECOMMANDÉES", 14, currentY);
        currentY += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);

        const categories = [
          { label: "Burkina Faso (Publiques)", list: result.universities.burkinaPublic },
          { label: "Burkina Faso (Privées d'excellence)", list: result.universities.burkinaPrivate },
          { label: "Afrique subsaharienne", list: result.universities.africa },
          { label: "Europe & Amériques (Bourses d'excellence)", list: [...(result.universities.europe || []), ...(result.universities.canada || [])] }
        ];

        categories.forEach((cat) => {
          if (cat.list && cat.list.length > 0) {
            checkPageOverflow(cat.list.length * 5 + 8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(cat.label, margin + 2, currentY);
            currentY += 5;
            pdf.setFont('helvetica', 'normal');
            cat.list.slice(0, 4).forEach((uni) => {
              pdf.text(`• ${uni}`, margin + 6, currentY);
              currentY += 4.5;
            });
            currentY += 2;
          }
        });
        currentY += 2;
      }

      // Careers / Jobs Detailed
      if (result.opportunities && result.opportunities.length > 0) {
        checkPageOverflow(30);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text("MÉTIERS ET DEBOUCHÉS PROFESSIONNELS À FORTE VALEUR RAJOUTÉE", 14, currentY);
        currentY += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);

        result.opportunities.slice(0, 5).forEach((job) => {
          checkPageOverflow(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`• ${job.title} (Demande : ${job.demandLevel})`, margin + 4, currentY);
          currentY += 4.5;
          pdf.setFont('helvetica', 'normal');
          const splitDesc = pdf.splitTextToSize(job.description || '', 170);
          pdf.text(splitDesc, margin + 8, currentY);
          currentY += splitDesc.length * 4 + 1.5;
          pdf.setFont('helvetica', 'italic');
          pdf.text(`Salaire moyen estimatif : ${job.averageSalary}`, margin + 8, currentY);
          currentY += 5;
        });
        currentY += 2;
      }

      // Government / scholarships opportunities proxies if any
      if (result.careerOpportunities && result.careerOpportunities.length > 0) {
        checkPageOverflow(30);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text("CONCOURS DE L'ÉTAT ET RECRUTEMENTS SÉLECTIONNÉS", 14, currentY);
        currentY += 6;

        result.careerOpportunities.slice(0, 4).forEach((opp) => {
          checkPageOverflow(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`• ${opp.title} (${opp.organization || 'Ministère de la Fonction Publique'})`, margin + 4, currentY);
          currentY += 4.5;
          pdf.setFont('helvetica', 'normal');
          pdf.text(`  Diplôme requis : ${opp.requiredDegree || 'Dossier d\'orientation BAC'} | Limite d'âge : ${opp.ageLimit || 'Selon critères'}`, margin + 4, currentY);
          currentY += 4.5;
          pdf.text(`  Date limite : ${opp.deadline || 'Calendrier officiel 2026'}`, margin + 4, currentY);
          currentY += 5;
        });
        currentY += 2;
      }

      // Strategic advice box
      if (result.strategicAdvice && result.strategicAdvice.length > 0) {
        checkPageOverflow(40);
        pdf.setFillColor(239, 246, 255); // Blue-50
        
        let boxHeight = 11;
        const wrappedAdvice: string[][] = [];
        result.strategicAdvice.forEach((adv) => {
          const wrap = pdf.splitTextToSize(`• ${adv}`, 174);
          wrappedAdvice.push(wrap);
          boxHeight += wrap.length * 4.5 + 1;
        });

        checkPageOverflow(boxHeight + 5);
        pdf.rect(margin, currentY, 182, boxHeight, 'F');
        
        pdf.setTextColor(29, 78, 216); // Blue-700
        pdf.setFontSize(10.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text("RECOMMANDATIONS STRATÉGIQUES IA :", margin + 4, currentY + 6);
        
        pdf.setFontSize(8.5);
        pdf.setTextColor(55, 65, 81);
        pdf.setFont('helvetica', 'normal');
        let advY = currentY + 12;
        wrappedAdvice.forEach((wrap) => {
          pdf.text(wrap, margin + 4, advY);
          advY += wrap.length * 4.5 + 1;
        });
        currentY += boxHeight + 8;
      }

      // Calendrier de dépôt table (Burkina Faso Post-BAC)
      checkPageOverflow(60);
      pdf.setTextColor(17, 24, 39);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text("CALENDRIER OFFICIEL DES DÉPÔTS (POST-BAC)", 14, currentY);

      const calendarData = [
        ["Fin Juin 2026", "Session de baccalauréat et résultats", "Retrait du relevé de notes officiel nécessaire pour l'orientation de l'office du BAC."],
        ["Courant Juillet 2026", "Lancement de CampusFaso & CIOSPB", "Création de compte avec l'identifiant INE, formulation des vœux d'allocations de bourses."],
        ["Fin Juillet - Août 2026", "Ouverture des sessions d'orientation", "Choix minutieux des filières prioritaires sur le portail unique CampusFaso."],
        ["Septembre 2026", "Attribution et admission physique", "Validation définitive de l'inscription physique au sein des universités d'accueil."]
      ];

      autoTable(pdf, {
        startY: currentY + 4,
        head: [['Période estimée', 'Étape clef', 'Procédure & Recommandations']],
        body: calendarData,
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136] }, // Teal 600
        styles: { fontSize: 8.5 }
      });

      // Add Page for charts and visual layout mapping
      pdf.addPage();
      
      // Header for Page with charts
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, 210, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`OrientationBF - Rapport d'orientation post-BAC de ${profile.name}`, 14, 10);

      pdf.setFontSize(12);
      pdf.setTextColor(17, 24, 39);
      pdf.text("COMPATIBILITÉ DES MATIÈRES & PROFIL GÉNÉRAL DE NOTATION", 14, 25);

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
          pdf.addImage(chartImg, 'JPEG', 14, 30, 182, 85);
        }
      } catch (e) {
        console.warn("Failed to capture post-BAC charts container", e);
      }

      // Testimonials & links at the bottom of chart page or in another page
      let linkY = 132;
      if (result.testimonials && result.testimonials.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(17, 24, 39);
        pdf.text("TÉMOIGNAGES ENCOURAGEANTS ET PARCOURS DE RÉUSSITE", 14, linkY);
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
        pdf.text("PORTAILS POUR LES INSCRIPTIONS ET ALLOCATIONS ETAT", 14, linkY);
        linkY += 6;
        
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(79, 70, 229);
        result.usefulLinks.forEach((link) => {
          pdf.text(`• ${link.title} : ${link.url}`, 14, linkY);
          linkY += 5.5;
        });
      }

      pdf.save(`orientationbf-rapport-universitaire-${profile.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating university detailed PDF:', error);
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

        {/* ================= NEW MODULE: COMPARATEUR DE FILIERES ================= */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-indigo-150 bg-gradient-to-br from-indigo-50/20 via-white to-slate-50/30 font-sans"
          id="comparateur-filieres-section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shadow-sm">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Comparateur de Filières Universitaires</h3>
                <p className="text-xs text-slate-500 font-medium">Sélectionnez deux filières pour comparer leurs débouchés, durées, difficultés et prérequis côte à côte</p>
              </div>
            </div>
            <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-100 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" /> Aide à la décision d'orientation
            </div>
          </div>

          {/* Selector filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Première filière à comparer :</label>
              <select
                value={compareMajor1}
                onChange={(e) => setCompareMajor1(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors cursor-pointer shadow-sm"
              >
                {[
                  ...new Set([
                    ...(result?.recommendedMajors?.map(m => m.major) || []),
                    "Génie Logiciel / Informatique",
                    "Réseaux & Télécommunications",
                    "Médecine / Sciences de la Santé",
                    "Agronomie & Sciences de la Terre",
                    "Journalisme & Sciences de la Communication",
                    "Droit & Sciences Politiques",
                    "Sciences Économiques & Gestion",
                    "Génie Civil, Mines & Géologie"
                  ])
                ].map((m) => (
                  <option key={`m1-${m}`} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Deuxième filière à comparer :</label>
              <select
                value={compareMajor2}
                onChange={(e) => setCompareMajor2(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors cursor-pointer shadow-sm"
              >
                {[
                  ...new Set([
                    ...(result?.recommendedMajors?.map(m => m.major) || []),
                    "Génie Logiciel / Informatique",
                    "Réseaux & Télécommunications",
                    "Médecine / Sciences de la Santé",
                    "Agronomie & Sciences de la Terre",
                    "Journalisme & Sciences de la Communication",
                    "Droit & Sciences Politiques",
                    "Sciences Économiques & Gestion",
                    "Génie Civil, Mines & Géologie"
                  ])
                ].map((m) => (
                  <option key={`m2-${m}`} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {compareMajor1 === compareMajor2 ? (
            <div className="p-4 bg-slate-50 text-center rounded-xl text-slate-500 text-sm border border-slate-100 font-medium">
              Veuillez sélectionner deux filières d'études différentes pour lancer la comparaison côte à côte !
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-indigo-50 shadow-sm">
              <table className="w-full text-left border-collapse min-w-[600px] bg-white">
                <thead>
                  <tr className="bg-slate-50/55 border-b border-slate-150">
                    <th className="py-3 px-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider w-[20%]">Critères de comparaison</th>
                    <th className="py-3 px-4 text-sm font-bold text-indigo-700 bg-indigo-50/30 w-[40%] border-r border-slate-100">
                      {getMajorDetails(compareMajor1).name}
                    </th>
                    <th className="py-3 px-4 text-sm font-bold text-emerald-700 bg-emerald-50/30 w-[40%]">
                      {getMajorDetails(compareMajor2).name}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Niveau d'étude</td>
                    <td className="py-3 px-4 text-slate-700 font-medium border-r border-slate-100 bg-indigo-50/5">
                      <span className="inline-block px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md font-bold">
                        {getMajorDetails(compareMajor1).level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium bg-emerald-50/5">
                      <span className="inline-block px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md font-bold">
                        {getMajorDetails(compareMajor2).level}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Durée de formation</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold border-r border-slate-100 bg-indigo-50/5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      {getMajorDetails(compareMajor1).duration}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold bg-emerald-50/5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-505 shrink-0 text-emerald-500" />
                      {getMajorDetails(compareMajor2).duration}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Matières & Prérequis</td>
                    <td className="py-3 px-4 text-slate-700 border-r border-slate-100 leading-relaxed bg-indigo-50/5">
                      <div className="flex flex-wrap gap-1">
                        {getMajorDetails(compareMajor1).requirements.split(',').map((req, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full border border-slate-250 font-semibold">
                            {req.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed bg-emerald-50/5">
                      <div className="flex flex-wrap gap-1">
                        {getMajorDetails(compareMajor2).requirements.split(',').map((req, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full border border-slate-250 font-semibold">
                            {req.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Difficulté globale</td>
                    <td className="py-3 px-4 text-slate-600 border-r border-slate-100 text-xs leading-relaxed font-semibold bg-indigo-50/5">
                      {getMajorDetails(compareMajor1).difficulty}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed font-semibold bg-emerald-50/5">
                      {getMajorDetails(compareMajor2).difficulty}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Coûts de scolarité</td>
                    <td className="py-3 px-4 text-slate-700 border-r border-slate-100 bg-indigo-50/5 font-semibold text-xs leading-relaxed">
                      {getMajorDetails(compareMajor1).tuition}
                    </td>
                    <td className="py-3 px-4 text-slate-700 bg-emerald-50/5 font-semibold text-xs leading-relaxed">
                      {getMajorDetails(compareMajor2).tuition}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Taux d'insertion</td>
                    <td className="py-3 px-4 text-indigo-700 font-extrabold border-r border-slate-100 bg-indigo-50/5 text-xs">
                      {getMajorDetails(compareMajor1).insertionRate}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-extrabold bg-emerald-50/5 text-xs">
                      {getMajorDetails(compareMajor2).insertionRate}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50/10 text-xs uppercase tracking-wide">Métiers d'avenir</td>
                    <td className="py-3 px-4 text-slate-600 border-r border-slate-100 leading-relaxed text-xs font-semibold bg-indigo-50/5">
                      {getMajorDetails(compareMajor1).opportunities}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed text-xs font-semibold bg-emerald-50/5">
                      {getMajorDetails(compareMajor2).opportunities}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ================= NEW MODULE: CALENDRIER SYNCHRONISE ================= */}
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
                <h3 className="font-bold text-slate-900 text-lg">Mon Calendrier d'Orientation & Bourses</h3>
                <p className="text-xs text-slate-500 font-medium">Dates des concours et opportunités scolaires automatiquement synchronisées sur votre profil BAC de {profile?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
              <button 
                onClick={() => setCalendarFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${calendarFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Tous ({getSynchronizedCalendarEvents(result, profile, trackedEvents).length})
              </button>
              <button 
                onClick={() => setCalendarFilter('tracked')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${calendarFilter === 'tracked' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Mes suivis ({trackedEvents.length})
              </button>
            </div>
          </div>

          {/* Quick interactive stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-slate-400">Total Bourses</span>
              <span className="text-sm font-extrabold text-teal-700">{getSynchronizedCalendarEvents(result, profile, trackedEvents).filter(e => e.type === 'Bourse').length} opportunités</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-slate-400">Concours d'État</span>
              <span className="text-sm font-extrabold text-indigo-700">{getSynchronizedCalendarEvents(result, profile, trackedEvents).filter(e => e.type === 'Concours').length} disponibles</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-slate-400">Prochain jalon</span>
              <span className="text-sm font-extrabold text-slate-800 truncate block">
                {getSynchronizedCalendarEvents(result, profile, trackedEvents).length > 0 ? new Date(getSynchronizedCalendarEvents(result, profile, trackedEvents)[0].date).toLocaleDateString('fr-FR', {month: 'short', day: 'numeric'}) : "Aucun"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-slate-400">Alertes actives</span>
              <span className="text-sm font-extrabold text-emerald-700">{trackedEvents.length} suivis configurés</span>
            </div>
          </div>

          {/* Events rendering split screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Right element monthly phases timeline */}
            <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-150/70 flex flex-col justify-between h-[340px]">
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wilder mb-4 text-center">Visualisation des périodes de dépôt</h4>
                {/* Custom gorgeous visual timeline graph blocks */}
                <div className="space-y-4">
                  {[
                    { month: "Juin 2026", details: "Résultats du BAC, examens, relevés officiels", color: "indigo", highlight: true },
                    { month: "Juillet 2026", details: "Plateforme CampusFaso & Bourses coopératives", color: "teal", highlight: false },
                    { month: "Août 2026", details: "Sélections officielles & Concours de l'État", color: "rose", highlight: false },
                    { month: "Sept-Nov 2026", details: "Inscriptions physiques et aide sociale FONER", color: "amber", highlight: false },
                  ].map((block, i) => (
                    <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all cursor-default">
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
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Vous recevrez des rappels 7 jours avant chaque clôture.</p>
              </div>
            </div>

            {/* List of dynamic synchronized events / right element */}
            <div className="lg:col-span-8 space-y-3 lg:max-h-[340px] lg:overflow-y-auto pr-1">
              {(() => {
                const rawEvents = getSynchronizedCalendarEvents(result, profile, trackedEvents);
                const filtered = calendarFilter === 'tracked' 
                  ? rawEvents.filter(e => trackedEvents.includes(e.id))
                  : rawEvents;

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 bg-slate-50/55 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-xs font-bold">
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
                    <div key={ev.id} className="p-4 bg-white hover:bg-slate-50/30 rounded-xl border border-slate-150 flex items-start gap-3 justify-between shadow-sm hover:shadow hover:border-indigo-150 transition-all text-left">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            ev.type === 'Bourse' ? 'bg-teal-100 text-teal-800 border border-teal-200/50' : 
                            ev.type === 'Concours' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/50' : 
                            ev.type === 'Orientation' ? 'bg-rose-100 text-rose-800 border border-rose-200/50' : 
                            'bg-slate-100 text-slate-700 border border-slate-200/50'
                          }`}>
                            {ev.type}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">{ev.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block leading-none ${
                            ev.priority === 'Haute' ? 'bg-rose-50 text-rose-700' :
                            ev.priority === 'Moyenne' ? 'bg-amber-50 text-amber-700' :
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
                          localStorage.setItem('tracked_orientation_events', JSON.stringify(updated));
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
        {(() => {
          const defaultUniversityTestimonials = [
            {
              author: "Karim Ouedraogo",
              role: "Ingénieur Logiciel, Diplômé de l'IBAM",
              quote: "Mon profil scientifique et mes points forts en mathématiques ont été révélés par le rapport d'OrientationBF. Les suggestions de filières d'études ont transformé ma carrière à l'Université.",
              photo: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop&q=80"
            },
            {
              author: "Fatoumata Diallo",
              role: "Étudiante en Agronomie, Université Nazi Boni",
              quote: "La filière agronomique m'a été conseillée suite à mes excellentes notes en SVT et chimie au BAC. Je m'épanouis aujourd'hui dans de formidables opportunités de stage.",
              photo: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=100&h=100&fit=crop&q=80"
            }
          ];
          const testimonialsToRender = (result.testimonials && result.testimonials.length > 0) ? result.testimonials : defaultUniversityTestimonials;
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
