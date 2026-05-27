import { StudentProfile, PostBacProfile, GradeEntry, YearGrades, AnalysisResult, UniversityAnalysisResult, CareerOpportunity } from "../types";

// Types defining pedagogical matching structures
export interface CalculatedProfile {
  name: string;
  globalAverage: number;
  scienceAverage: number;
  mathAverage: number;
  pcAverage: number; // Includes Chemistry
  biologyAverage: number; // SVT
  literaryAverage: number; // French, Philosophy, History-Geo, English
  managementAverage: number; 
  dominantProfile: 'Scientifique-Mathématique' | 'Scientifique-Biologique' | 'Littéraire' | 'Économique' | 'Équilibré' | 'Général';
  strengths: string[];
  weaknesses: string[];
  trends: {
    global: 'en hausse' | 'en baisse' | 'stable' | 'irrégulier';
    scientific: 'en hausse' | 'en baisse' | 'stable' | 'irrégulier';
    literary: 'en hausse' | 'en baisse' | 'stable' | 'irrégulier';
  };
}

export interface CompatibilityReport {
  name: string;
  slug: string;
  score: number; // 0-100
  dominantGradeReason: string;
  explanation: string;
  suitability: 'Excellente' | 'Favorable' | 'Moyenne' | 'Déconseillée' | 'Fortement Déconseillée';
}

/**
 * Normalizes lists of grades to easily query subject averages
 */
function getSubjectScore(grades: GradeEntry[], subject: string, fallback = 10): number {
  const normSubject = subject.toLowerCase().trim();
  
  if (normSubject === 'physique-chimie') {
    const pcEntry = grades.find(g => {
      const s = g.subject.toLowerCase().trim();
      return s === 'pc' || s === 'sciences physiques' || s === 'physique-chimie';
    });
    if (pcEntry) return pcEntry.grade;
    
    const physEntry = grades.find(g => g.subject.toLowerCase().trim() === 'physique');
    const chimEntry = grades.find(g => g.subject.toLowerCase().trim() === 'chimie');
    
    if (physEntry && chimEntry) {
      return (physEntry.grade + chimEntry.grade) / 2;
    } else if (physEntry) {
      return physEntry.grade;
    } else if (chimEntry) {
      return chimEntry.grade;
    }
    return fallback;
  }

  const entry = grades.find(g => {
    const s = g.subject.toLowerCase().trim();
    return s === normSubject || 
           (normSubject === 'svt' && (s === 'svt' || s === 'sciences de la vie et de la terre' || s === 'biologie')) ||
           (normSubject === 'français' && (s === 'français' || s === 'composition' || s === 'francais')) ||
           (normSubject === 'histoire-géo' && (s === 'histoire-géo' || s === 'histoire' || s === 'géographie' || s === 'histoire-gographie' || s === 'hg'));
  });
  return entry ? entry.grade : fallback;
}

/**
 * Computes average grade in any subject across all years in the student's history
 */
function getSubjectHistoricalAverage(gradesHistory: YearGrades[], subject: string, fallbackGrade = 10): number {
  if (!gradesHistory || gradesHistory.length === 0) return fallbackGrade;
  let sum = 0;
  let count = 0;
  gradesHistory.forEach(year => {
    const grade = getSubjectScore(year.grades, subject, -1);
    if (grade !== -1) {
      sum += grade;
      count++;
    }
  });
  return count > 0 ? sum / count : fallbackGrade;
}

/**
 * Calculates notes trend (slope) from 2nd, 1er, the terminal or 6ème to 3ème in years
 */
function calculateTrend(gradesHistory: YearGrades[], subjectFilter: 'global' | 'scientific' | 'literary'): 'en hausse' | 'en baisse' | 'stable' | 'irrégulier' {
  if (!gradesHistory || gradesHistory.length < 2) return 'stable';
  
  // Sort from most ancient to most recent
  const sortedYears = [...gradesHistory].sort((a, b) => {
    const levelsMap: Record<string, number> = {
      '6ème': 1, '5ème': 2, '4ème': 3, '3ème': 4,
      'Seconde': 5, 'Première': 6, 'Terminale': 7
    };
    return (levelsMap[a.level] || 0) - (levelsMap[b.level] || 0);
  });

  const getYearAverages = (year: YearGrades): number => {
    if (subjectFilter === 'global') return year.average || 10;
    
    const grades = year.grades;
    if (subjectFilter === 'scientific') {
      const maths = getSubjectScore(grades, 'Mathématiques', 10);
      const pc = getSubjectScore(grades, 'Physique-Chimie', 10);
      return (maths + pc) / 2;
    } else {
      const fr = getSubjectScore(grades, 'Français', 10);
      const eng = getSubjectScore(grades, 'Anglais', 10);
      return (fr + eng) / 2;
    }
  };

  const averages = sortedYears.map(getYearAverages);
  
  let differencesSum = 0;
  let ups = 0;
  let downs = 0;
  for (let i = 1; i < averages.length; i++) {
    const diff = averages[i] - averages[i - 1];
    differencesSum += diff;
    if (diff > 0.5) ups++;
    if (diff < -0.5) downs++;
  }

  const averageDiff = differencesSum / (averages.length - 1);
  if (averageDiff > 0.6) return 'en hausse';
  if (averageDiff < -0.6) return 'en baisse';
  if (ups > 0 && downs > 0) return 'irrégulier';
  return 'stable';
}

/**
 * Extracts and computes all academic components
 */
export function calculateAcademicProfile(
  name: string,
  isPostBac: boolean,
  gradesHistory: YearGrades[],
  examGrades: GradeEntry[],
  examAverage: number
): CalculatedProfile {
  // Aggregate grades list
  const allRecentGrades = examGrades && examGrades.length > 0 ? examGrades : (gradesHistory && gradesHistory.length > 0 ? gradesHistory[gradesHistory.length - 1].grades : []);
  
  const math = getSubjectScore(allRecentGrades, 'Mathématiques', getSubjectHistoricalAverage(gradesHistory, 'Mathématiques', 10));
  const pc = getSubjectScore(allRecentGrades, 'Physique-Chimie', getSubjectHistoricalAverage(gradesHistory, 'Physique-Chimie', 10));
  const svt = getSubjectScore(allRecentGrades, 'SVT', getSubjectHistoricalAverage(gradesHistory, 'SVT', 10));
  const fr = getSubjectScore(allRecentGrades, 'Français', getSubjectHistoricalAverage(gradesHistory, 'Français', 10));
  const ang = getSubjectScore(allRecentGrades, 'Anglais', getSubjectHistoricalAverage(gradesHistory, 'Anglais', 10));
  const hg = getSubjectScore(allRecentGrades, 'Histoire-Géo', getSubjectHistoricalAverage(gradesHistory, 'Histoire-Géo', 10));
  const philo = getSubjectScore(allRecentGrades, 'Philosophie', getSubjectHistoricalAverage(gradesHistory, 'Philosophie', 10));
  const delem = getSubjectScore(allRecentGrades, 'Allemand', getSubjectHistoricalAverage(gradesHistory, 'Allemand', 10));
  const esp = getSubjectScore(allRecentGrades, 'Espagnol', getSubjectHistoricalAverage(gradesHistory, 'Espagnol', 10));

  const mathHist = getSubjectHistoricalAverage(gradesHistory, 'Mathématiques', math);
  const pcHist = getSubjectHistoricalAverage(gradesHistory, 'Physique-Chimie', pc);
  const svtHist = getSubjectHistoricalAverage(gradesHistory, 'SVT', svt);
  const frHist = getSubjectHistoricalAverage(gradesHistory, 'Français', fr);
  const angHist = getSubjectHistoricalAverage(gradesHistory, 'Anglais', ang);
  
  // Weights the calculations
  const mathAverage = (math * 0.6) + (mathHist * 0.4);
  const pcAverage = (pc * 0.6) + (pcHist * 0.4);
  const biologyAverage = (svt * 0.6) + (svtHist * 0.4);
  const frenchAverage = (fr * 0.6) + (frHist * 0.4);
  const englishAverage = (ang * 0.6) + (angHist * 0.4);
  
  const scienceAverage = (mathAverage + pcAverage + biologyAverage) / 3;
  const literaryAverage = (frenchAverage + englishAverage + hg + (philo > 5 ? philo : 10)) / 4;
  const managementAverage = (mathAverage + frenchAverage + hg) / 3;

  // Dominant profiling
  let dominantProfile: CalculatedProfile['dominantProfile'] = 'Général';
  const threshold = 12;

  const scienceMath = (mathAverage * 1.5 + pcAverage) / 2.5;
  const scienceBio = (biologyAverage * 1.5 + pcAverage) / 2.5;

  if (scienceMath >= threshold && scienceMath > literaryAverage && scienceMath > scienceBio) {
    dominantProfile = 'Scientifique-Mathématique';
  } else if (scienceBio >= threshold && scienceBio > literaryAverage) {
    dominantProfile = 'Scientifique-Biologique';
  } else if (literaryAverage >= threshold && literaryAverage > scienceMath && literaryAverage > managementAverage) {
    dominantProfile = 'Littéraire';
  } else if (managementAverage >= threshold && managementAverage > scienceMath && managementAverage > literaryAverage) {
    dominantProfile = 'Économique';
  } else if (Math.abs(scienceAverage - literaryAverage) <= 1.2 && (scienceAverage >= 11 || literaryAverage >= 11)) {
    dominantProfile = 'Équilibré';
  }

  // Strengths and weaknesses extraction
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const checkStrengthWeakness = (score: number, label: string) => {
    if (score >= 13.5) strengths.push(label);
    if (score < 9.5) weaknesses.push(label);
  };
  
  checkStrengthWeakness(mathAverage, "Mathématiques");
  checkStrengthWeakness(pcAverage, "Physique-Chimie (Physique & Chimie)");
  checkStrengthWeakness(biologyAverage, "Sciences de la Vie et de la Terre (SVT)");
  checkStrengthWeakness(frenchAverage, "Français & Rédaction");
  checkStrengthWeakness(englishAverage, "Anglais");
  checkStrengthWeakness(hg, "Histoire-Géographie");
  if (isPostBac && philo > 5) checkStrengthWeakness(philo, "Philosophie");

  return {
    name,
    globalAverage: examAverage || (scienceAverage + literaryAverage) / 2,
    scienceAverage,
    mathAverage,
    pcAverage,
    biologyAverage,
    literaryAverage,
    managementAverage,
    dominantProfile,
    strengths,
    weaknesses,
    trends: {
      global: calculateTrend(gradesHistory, 'global'),
      scientific: calculateTrend(gradesHistory, 'scientific'),
      literary: calculateTrend(gradesHistory, 'literary'),
    }
  };
}

/**
 * MATHEMATICAL PROFILE MATCHING ENGINE (POST-BAC FILIERES)
 */
export function evaluateBacOrientation(profile: PostBacProfile): CompatibilityReport[] {
  const calc = calculateAcademicProfile(
    profile.name,
    true,
    profile.gradesHistory,
    profile.bacGrades,
    profile.bacAverage
  );

  const bacSeries = (profile.bacSeries || 'Série D').toUpperCase().trim();

  // Definition of specialized pedagogical matching criteria per major
  const majorsDefinitions = [
    {
      name: "Génie Logiciel & Systèmes d’Information",
      slug: "genie-logiciel",
      primarySubject: "Mathématiques",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Physique-Chimie", weight: 3, score: calc.pcAverage },
        { name: "Anglais", weight: 2, score: calc.literaryAverage } // Support and language
      ],
      preferredProfile: "Scientifique-Mathématique",
      minRequiredScore: 11, // Strict lower-bound for comfortable academic success
      penaltyRules: [
        {
          check: () => calc.mathAverage < 10,
          penalty: 40,
          reason: "Vos moyennes et notes de Mathématiques sont en-dessous de la moyenne générale requise (10/20). Le Génie Logiciel exige un excellent esprit d'analyse et un bagage logique poussé."
        },
        {
          check: () => calc.mathAverage < 8.5,
          penalty: 80, // Interdiction/Strict warning
          reason: "Moyenne critique en Mathématiques (<8.5/20). Le risque d'échec dans cette filière technique à haute teneur d'algorithmique et logique formelle est extrêmement élevé."
        },
        {
          check: () => calc.pcAverage < 10,
          penalty: 25,
          reason: "Faiblesse relative détectée en Physique-Chimie (Physique). L'architecture matérielle des processeurs et l'électronique numérique nécessitent des bases physiques plus sûres."
        },
        {
          check: () => calc.pcAverage < 8.5,
          penalty: 45,
          reason: "Moyenne critique en Physique-Chimie. Risque accru de difficultés majeures dans les matières d'ingénierie physique et d'électricité."
        },
        {
          check: () => bacSeries.startsWith('A') || bacSeries.startsWith('G'),
          penalty: 25,
          reason: "Venant d'une série littéraire ou tertiaire, vous ferez face à d'importantes lacunes dans l'ingénierie mathématique et les sciences dures par rapport aux bacheliers scientifiques."
        }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) {
          return `Filière hautement conseillée. Vos notes en Mathématiques (${calc.mathAverage.toFixed(1)}/20) et votre penchant d'analyse scientifique sont d'excellentes qualités de base pour la modélisation et l'ingénierie logicielle au Burkina.`;
        }
        if (score >= 50) {
          return `Orientation réaliste mais nécessitant beaucoup d'implication. Vos aptitudes de base en logique sont acceptables, mais une mise à niveau intensive en algèbre de programmation devra être engagée dès la première année.`;
        }
        return `Non recommandée d'un point de vue académique. Le fossé pédagogique actuel entre votre note en Mathématiques (${calc.mathAverage.toFixed(1)}/20) et les exigences de la programmation d'algorithmes complexes présente un risque d'échec trop important.`;
      }
    },
    {
      name: "Réseaux, Télécoms & Cybersécurité",
      slug: "reseaux-telecoms",
      primarySubject: "Mathématiques",
      keySubjects: [
        { name: "Mathématiques", weight: 4.5, score: calc.mathAverage },
        { name: "Physique-Chimie", weight: 3.5, score: calc.pcAverage },
        { name: "Anglais", weight: 2, score: calc.literaryAverage }
      ],
      preferredProfile: "Scientifique-Mathématique",
      minRequiredScore: 10.5,
      penaltyRules: [
        { check: () => calc.mathAverage < 9.5, penalty: 35, reason: "Bases fragiles en Mathématiques requises pour le cryptage des données et l'administration réseau." },
        { check: () => calc.pcAverage < 9.5, penalty: 20, reason: "La physique des ondes qui gouverne les télécommunications nécessite un niveau plus solide en Physique-Chimie." },
        { check: () => calc.mathAverage < 8.5, penalty: 50, reason: "Bases critiques en Mathématiques (<8.5/20) mettant en péril l'apprentissage de la cryptographie et de l'analyse réseau." },
        { check: () => calc.pcAverage < 8.5, penalty: 40, reason: "Note critique en Physique-Chimie (<8.5/20) pénalisant l'étude de l'électromagnétisme des transmissions sans fil." },
        { check: () => bacSeries.startsWith('A'), penalty: 30, reason: "Incohérence pédagogique : Cursus axé sur la technologie matérielle et la transmission des signaux, inadapté à une série purement littéraire." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) return `Profil idéal pour la sécurité informatique. Vos piliers de Mathématiques et de Sciences Physiques supportent parfaitement la formation d'ingénieur en infrastructures numériques.`;
        if (score >= 45) return `Acceptable. Un effort complémentaire soutenu sera indispensable en physique appliquée aux télécoms et en algèbre linéaire.`;
        return `Le niveau scientifique est insuffisant pour l'architecture des systèmes de réseaux de pointe au Burkina Faso (Moyenne scientifique : ${calc.scienceAverage.toFixed(1)}/20).`;
      }
    },
    {
      name: "Médecine, Pharmacie & Sciences de la Santé",
      slug: "medecine-pharmacie",
      primarySubject: "SVT",
      keySubjects: [
        { name: "SVT", weight: 5, score: calc.biologyAverage },
        { name: "Physique-Chimie", weight: 4, score: calc.pcAverage }, // Essential for Pharmacy & Biochemistry
        { name: "Mathématiques", weight: 1, score: calc.mathAverage }
      ],
      preferredProfile: "Scientifique-Biologique",
      minRequiredScore: 12,
      penaltyRules: [
        { check: () => calc.biologyAverage < 11.5, penalty: 35, reason: "Excellence exigée en SVT. La médecine requiert l'assimilation à haute densité de la biologie cellulaire, animale et humaine." },
        { check: () => calc.pcAverage < 10.5, penalty: 25, reason: "La chimie et la biochimie jouent un rôle primordial en médecine et pharmacie. Vos notes en Physique-Chimie sont en decà des normes d'admission." },
        { check: () => calc.mathAverage < 9.5, penalty: 20, reason: "Le raisonnement quantitatif en biostatistiques médicales et pharmacologie requiert des bases minimales en Mathématiques." },
        { check: () => !bacSeries.includes('D') && !bacSeries.includes('C'), penalty: 85, reason: "Pénalité fatale : L'accès aux facultés de sciences de la santé au Burkina Faso est légalement et pédagogiquement fermé/incompatible avec des séries littéraires, d'administration ou tertiaires." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) return `Filière d'excellence tout à fait adaptée. Vos compétences poussées en sciences de la vie (${calc.biologyAverage.toFixed(1)}/20) combinées à la chimie constituent la porte d'entrée rêvée et le garant de votre succès en faculté médicale.`;
        if (score >= 50) return `Candidature moyenne. Bien que vous ayez une base adéquate, la sélectivité des concours ou des effectifs en Université de médecine (UFR SD) exige un effort plus robuste.`;
        return `Non recommandée. Les notes de biologie et sciences expérimentales accumulées sont trop insuffisantes pour entreprendre les longues et rigoureuses études de santé.`;
      }
    },
    {
      name: "Agronomie, agro-alimentaire & bio-ingénierie",
      slug: "agronomie-elevage",
      primarySubject: "SVT",
      keySubjects: [
        { name: "SVT", weight: 4.5, score: calc.biologyAverage },
        { name: "Physique-Chimie", weight: 3.5, score: calc.pcAverage }, // Chemistry is vital here
        { name: "Mathématiques", weight: 2, score: calc.mathAverage }
      ],
      preferredProfile: "Scientifique-Biologique",
      minRequiredScore: 10,
      penaltyRules: [
        { check: () => calc.biologyAverage < 10, penalty: 30, reason: "Insuffisance en SVT. Le génie rural et l'agro-pédologie reposent entièrement sur la botanique, la zoologie et les écosystèmes." },
        { check: () => calc.pcAverage < 10, penalty: 25, reason: "La chimie organique et de la physiologie agro-alimentaire réclame de bonnes bases en Physique-Chimie." },
        { check: () => calc.mathAverage < 9, penalty: 20, reason: "Des lacunes en mathématiques compliqueront l'analyse statistique agronomique de rendement des cultures." },
        { check: () => !bacSeries.includes('D') && !bacSeries.includes('C') && !bacSeries.startsWith('F4'), penalty: 40, reason: "Incompatibilité de profil de base : L'agronomie exige l'outil expérimental des sciences naturelles dures." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Choix brillant de développement durable au Burkina. Votre niveau en biologie végétale et chimie vous prédestine à exceller dans la modernisation de l'agriculture et de l'élevage.`;
        return `Le profil de base reste trop éloigné des concepts de bio-ingénierie requis par l'industrie agricole contemporaine.`;
      }
    },
    {
      name: "Sciences Juridiques & Politiques (Droit)",
      slug: "droit-sciences-politiques",
      primarySubject: "Français",
      keySubjects: [
        { name: "Français", weight: 4.5, score: calc.literaryAverage },
        { name: "Philosophie", weight: 3.5, score: calc.pcAverage }, // Mapped internally to literary sub-scores
        { name: "Histoire-Géo", weight: 2, score: calc.literaryAverage }
      ],
      preferredProfile: "Littéraire",
      minRequiredScore: 10.5,
      penaltyRules: [
        { check: () => getSubjectScore(profile.bacGrades, 'Français', 10) < 10, penalty: 35, reason: "Orthographe, rédaction et grammaire fragilisées. Le droit exige une éloquence écrite sans faille et une capacité d'interprétation sémantique pointue." },
        { check: () => getSubjectScore(profile.bacGrades, 'Philosophie', 10) < 9.5, penalty: 20, reason: "La philo mesure votre esprit de synthèse conceptuel et logique dialectique nécessaires à la jurisprudence." }
      ],
      explanationGenerator: (score: number) => {
        const frScore = getSubjectScore(profile.bacGrades, 'Français', 10);
        if (score >= 75) return `Axe d'orientation idéal. Votre parfaite maîtrise de la langue française (${frScore}/20) et votre capacité d'expression conceptuelle ouvrent d'excellentes portes d'accès aux carrières judiciaires burkinabè (ENAM, Barreau, etc.).`;
        if (score >= 45) return `Option d'équilibre possible. Mais attention à la rigueur de structure des mémoires et démonstrations juridiques à l'université.`;
        return `Droit déconseillé car les aptitudes rédactionnelles d'expression, de dissertation ou de synthèse critique ne sont pas confortables.`;
      }
    },
    {
      name: "Finance, Audit, Comptabilité & Gestion",
      slug: "finance-comptabilite",
      primarySubject: "Mathématiques",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Français", weight: 3, score: calc.literaryAverage },
        { name: "Histoire-Géo", weight: 2, score: calc.literaryAverage }
      ],
      preferredProfile: "Économique",
      minRequiredScore: 11,
      penaltyRules: [
        { check: () => calc.mathAverage < 10.5, penalty: 35, reason: "Des faiblesses en matières quantitatives (Maths < 10.5) vous pénaliseront lors de l'analyse financière, de la comptabilité analytique complexe et des probabilités de gestion." },
        { check: () => bacSeries.startsWith('A') && calc.mathAverage < 11, penalty: 25, reason: "Les bacheliers littéraires luttent en comptabilité générale en raison du choc quantitatif à l'UTS ou dans les grandes écoles de gestion." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) return `Recommandation solide. Vos aptitudes de calcul scientifique s'accorderont parfaitement avec l'évaluation des risques budgétaires et le contrôle de gestion des PME burkinabè.`;
        if (score >= 50) return `Envisageable. Un approfondissement vigoureux des mathématiques de base et de l'arithmétique financière est recommandé.`;
        return `Faible recommandation. La finance exige des bases mathématiques affirmées que votre bulletin ne reflète pas actuellement (${calc.mathAverage.toFixed(1)}/20).`;
      }
    },
    {
      name: "Journalisme & Sciences de la Communication",
      slug: "journalisme-com",
      primarySubject: "Français",
      keySubjects: [
        { name: "Français", weight: 5, score: calc.literaryAverage },
        { name: "Anglais", weight: 3, score: calc.literaryAverage },
        { name: "Histoire-Géo", weight: 2, score: calc.literaryAverage }
      ],
      preferredProfile: "Littéraire",
      minRequiredScore: 10,
      penaltyRules: [
        { check: () => getSubjectScore(profile.bacGrades, 'Français', 10) < 10.5, penalty: 30, reason: "Pour diffuser de l'information ou assurer les relations publiques, une maîtrise quasi-parfaite du français rédactionnel est le minimum requis." },
        { check: () => getSubjectScore(profile.bacGrades, 'Anglais', 10) < 9.5, penalty: 15, reason: "Anglais faible. Les relations média contemporaines et les réseaux sociaux sont très ancrés sur l'économie numérique anglophone." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Excellent choix d'orientation en communication. Votre plume et vos notes d'anglais/français vous permettront d'être l'ambassadeur de marques d'entreprises ou journaliste professionnel renommé.`;
        return `Cursus déconseillé comme premier choix en raison d'un manque de forces littéraires nécessaires à la rédaction rapide d'éditoriaux ou de communiqués de presse.`;
      }
    },
    {
      name: "Génie Civil, Mines & Infrastructures",
      slug: "genie-civil-mines",
      primarySubject: "Mathématiques",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Physique-Chimie", weight: 4, score: calc.pcAverage },
        { name: "SVT", weight: 1, score: calc.biologyAverage } // For Mines/Environment
      ],
      preferredProfile: "Scientifique-Mathématique",
      minRequiredScore: 11.5,
      penaltyRules: [
        { check: () => calc.mathAverage < 11, penalty: 35, reason: "Des fondations insuffisantes en mathématiques vous gêneront pour l'analyse des forces structurelles et le calcul du béton armé." },
        { check: () => calc.pcAverage < 10.5, penalty: 30, reason: "La physique de la résistance des matériaux, de l'hydraulique et de la géologie nécessite des notes plus élevées." },
        { check: () => calc.mathAverage < 9, penalty: 50, reason: "Moyenne critique de Mathématiques (<9/20) rendant la réussite en génie civil ou mines extrêmement compromise." },
        { check: () => calc.pcAverage < 9, penalty: 45, reason: "Note critique en Physique-Chimie (<9/20) interdisant la validation des modules de mécanique des fluides et des sols." },
        { check: () => bacSeries.startsWith('A') || bacSeries.startsWith('G'), penalty: 70, reason: "Incohérence mécanique : Le domaine du génie civil n'est pas ouvert aux profils de lettres ou de secrétariat en raison du choc d'ingénierie." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) return `Superbe choix. Le Burkina Faso est en pleine reconstruction d'infrastructures. Votre bagage logique et mathématique de pointe vous garantit de briller en bureau d'ingénierie hydraulique ou sur les chantiers.`;
        return `Le profil scientifique n'est pas calibré pour endurer les cours rigoureux de thermodynamique et résistance structurelle du Génie Civil.`;
      }
    }
  ];

  const reports: CompatibilityReport[] = [];

  // Compute actual compatibility algorithms per major
  majorsDefinitions.forEach(major => {
    // 1. Weighted base score
    let sumWeights = 0;
    let sumWeightedScores = 0;
    major.keySubjects.forEach(sub => {
      sumWeightedScores += sub.score * sub.weight;
      sumWeights += sub.weight;
    });

    let baseCompatScore = (sumWeightedScores / sumWeights) * 5; // Rescale 0-20 to 0-100

    // 2. Adjust with profile suitability
    if (calc.dominantProfile === major.preferredProfile) {
      baseCompatScore += 10; // Dominant profile bonus
    } else if (calc.dominantProfile === 'Équilibré') {
      baseCompatScore += 4;
    }

    // 3. Strict logical penalty rules
    let appliedPenaltiesCount = 0;
    const penaltyExplanations: string[] = [];
    
    major.penaltyRules.forEach(rule => {
      if (rule.check()) {
        baseCompatScore -= rule.penalty;
        appliedPenaltiesCount++;
        penaltyExplanations.push(rule.reason);
      }
    });

    // Clamp score
    let finalScore = Math.max(5, Math.min(99, Math.round(baseCompatScore)));

    // 4. Suitability brackets based strictly on final score and penalty flags
    let suitability: CompatibilityReport['suitability'] = 'Moyenne';
    if (finalScore >= 82) {
      suitability = 'Excellente';
    } else if (finalScore >= 68) {
      suitability = 'Favorable';
    } else if (finalScore >= 45) {
      suitability = 'Moyenne';
    } else if (finalScore >= 25) {
      suitability = 'Déconseillée';
    } else {
      suitability = 'Fortement Déconseillée';
    }

    // Force lower suitability or bracket if primary subject is heavily failing
    if (appliedPenaltiesCount >= 2 || finalScore < 30) {
      suitability = finalScore < 20 ? 'Fortement Déconseillée' : 'Déconseillée';
    }

    // Dominant grade reason description
    const primaryGrade = getSubjectScore(profile.bacGrades, major.primarySubject, 10);
    const dominantGradeReason = `Matière fondamentale: ${major.primarySubject} (${primaryGrade.toFixed(1)}/20). Moyenne Thématique: ${calc.dominantProfile}.`;

    // Concat reasons
    let rawExplanation = major.explanationGenerator(finalScore);
    if (penaltyExplanations.length > 0) {
      rawExplanation += ` **Points d'alerte :** ${penaltyExplanations.join(' ')}`;
    }

    reports.push({
      name: major.name,
      slug: major.slug,
      score: finalScore,
      dominantGradeReason,
      explanation: rawExplanation,
      suitability
    });
  });

  // Sort major recommendations by key scientific scores first, and overall compatibility descending
  return reports.sort((a, b) => b.score - a.score);
}

/**
 * MATHEMATICAL ORIENTATION MATCHING FOR BEPC (POST-BEPC SERIES COHERENCE)
 */
export function evaluateBepcOrientation(profile: StudentProfile): CompatibilityReport[] {
  const calc = calculateAcademicProfile(
    profile.name,
    false,
    profile.gradesHistory,
    profile.bepcGrades,
    profile.bepcAverage
  );

  const bepcPreferred = (profile.preferredSeries || 'Série D').trim();

  const seriesDefinitions = [
    {
      name: "Série C (Sciences Mathématiques & Physiques)",
      slug: "C",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Physique-Chimie", weight: 4.5, score: calc.pcAverage },
        { name: "SVT", weight: 2, score: calc.biologyAverage }
      ],
      minRequiredScore: 12.5,
      penaltyRules: [
        { check: () => calc.mathAverage < 12.5, penalty: 40, reason: "La série C d'élite mathématique exige d'excellentes bases (recommandé >=13). Votre score actuel de Mathématiques (${calc.mathAverage.toFixed(1)}/20) vous placerait trop en difficulté." },
        { check: () => calc.mathAverage < 10, penalty: 60, reason: "Bases très insuffisantes en Mathématiques (<10/20) pour la série C." },
        { check: () => calc.pcAverage < 11.5, penalty: 20, reason: "Faiblesse relative en Sciences Physiques indispensables à l'analyse algorithmique des sciences en Seconde C." },
        { check: () => calc.pcAverage < 10, penalty: 40, reason: "Moyenne critique en Physique-Chimie (<10/20) inadéquate pour le rythme d'ingénierie scientifique de Seconde C." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 78) return `Profil de haut niveau scientifique. Votre moyenne en Mathématiques (${calc.mathAverage.toFixed(1)}/20) justifie pleinement une intégration en Seconde C pour préparer le BAC C d'ingénierie d'élite.`;
        if (score >= 50) return `Envisageable uniquement avec une solide dose de remédiation personnelle et une passion avérée pour les mathématiques abstraites.`;
        return `Non conseillée. Les concepts d'algèbre logique complexes de Seconde C requièrent une performance en Mathématiques plus forte que votre note globale actuelle (${calc.mathAverage.toFixed(1)}/20).`;
      }
    },
    {
      name: "Série D (Sciences Expérimentales & SVT)",
      slug: "D",
      keySubjects: [
        { name: "SVT", weight: 5, score: calc.biologyAverage },
        { name: "Mathématiques", weight: 4, score: calc.mathAverage },
        { name: "Physique-Chimie", weight: 4, score: calc.pcAverage }
      ],
      minRequiredScore: 10.5,
      penaltyRules: [
        { check: () => calc.biologyAverage < 10, penalty: 30, reason: "Bases en SVT insuffisantes pour entamer les études de biologie des sols et du corps humain de la série D." },
        { check: () => calc.scienceAverage < 10, penalty: 30, reason: "Note scientifique globale critique. La Seconde S/D exige un niveau de rigueur dans l'hypothèse expérimentale." },
        { check: () => calc.pcAverage < 10, penalty: 20, reason: "Fragilité en Physique-Chimie, matière clé d'évaluation en Seconde S/D." },
        { check: () => calc.mathAverage < 9, penalty: 25, reason: "Note de mathématiques trop basse (<9/20) pour supporter le rythme de calcul de la classe de Seconde S/D." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Filière scientifique équilibrée tout à fait propice face à votre profil expérimental. Excellente passerelle pour de futures études médicales, d'énergie, de gestion ou d'agronomie au Burkina Faso.`;
        if (score >= 45) return `Admissible comme orientation, mais les bases mathématiques et de sciences physiques doivent être stabilisées dès le premier trimestre de Seconde.`;
        return `Un redéploiement d'orientation est vivement recommandé en raison de la fragilité de vos matières de calculs et d'observation géologique/médicale.`;
      }
    },
    {
      name: "Série A4 (Lettres, Langues & Philosophie)",
      slug: "A4",
      keySubjects: [
        { name: "Français", weight: 5, score: calc.literaryAverage },
        { name: "Anglais", weight: 4, score: calc.literaryAverage }, // Map support score
        { name: "Histoire-Géo", weight: 3, score: calc.literaryAverage }
      ],
      minRequiredScore: 10,
      penaltyRules: [
        { check: () => getSubjectScore(profile.bepcGrades, 'Français', 10) < 10, penalty: 35, reason: "Faiblesse majeure en rédaction et dictée de Français. La série A4 nécessite une aisance rédactionnelle pointue pour préparer l'exercice de la dissertation d'histoire ou de philo." },
        { check: () => calc.literaryAverage < 9.5, penalty: 20, reason: "Niveau général de culture littéraire et d'expression globale insuffisant pour s'orienter vers les lettres." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 72) return `Aisance verbale excellente. Vos forces claires en expression française et langues étrangères vous assureront une scolarité gratifiante vers le BAC littéraire A4 ou les carrières d'enseignement, de traduction et de justice.`;
        return `Orientation réservée ou déconseillée car vos prédispositions actuelles s'illustrent plus favorablement dans les aspects techniques ou quantitatifs.`;
      }
    },
    {
      name: "Série G2 (Techniques Quantitatives de Gestion)",
      slug: "G2",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Français", weight: 3, score: calc.literaryAverage },
        { name: "Anglais", weight: 2, score: calc.literaryAverage }
      ],
      minRequiredScore: 11,
      penaltyRules: [
        { check: () => calc.mathAverage < 10, penalty: 35, reason: "La gestion comptable d'entreprise s'organise autour d'un socle d'arithmétique robuste. Ces notes fragiles de calcul constituent une barrière de réussite." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Une option tertiaire technologique parfaite. Allie l'étude d'outils analytiques économiques et financiers pour un avenir dynamique de contrôleur ou gestionnaire d'équipe commerciale.`;
        return `Le manque de rapidité de calcul numérique de mathématiques rend l'insertion difficile en gestion d'entreprise ou secrétariat comptable.`;
      }
    }
  ];

  const reports: CompatibilityReport[] = [];

  seriesDefinitions.forEach(series => {
    let sumWeights = 0;
    let sumWeightedScores = 0;
    series.keySubjects.forEach(sub => {
      sumWeightedScores += sub.score * sub.weight;
      sumWeights += sub.weight;
    });

    let baseScore = (sumWeightedScores / sumWeights) * 5;

    // Match focus preferences
    if (bepcPreferred === series.slug) {
      baseScore += 8;
    }

    // Penalty check
    series.penaltyRules.forEach(rule => {
      if (rule.check()) {
        baseScore -= rule.penalty;
      }
    });

    const finalScore = Math.max(10, Math.min(99, Math.round(baseScore)));

    let suitability: CompatibilityReport['suitability'] = 'Moyenne';
    if (finalScore >= 78) {
      suitability = 'Excellente';
    } else if (finalScore >= 66) {
      suitability = 'Favorable';
    } else if (finalScore >= 45) {
      suitability = 'Moyenne';
    } else if (finalScore >= 25) {
      suitability = 'Déconseillée';
    } else {
      suitability = 'Fortement Déconseillée';
    }

    const primaryGrade = getSubjectScore(profile.bepcGrades, series.keySubjects[0].name, 10);
    const dominantGradeReason = `Matière fondamentale: ${series.keySubjects[0].name} (${primaryGrade.toFixed(1)}/20).`;

    reports.push({
      name: series.name,
      slug: series.slug,
      score: finalScore,
      dominantGradeReason,
      explanation: series.explanationGenerator(finalScore),
      suitability
    });
  });

  return reports.sort((a, b) => b.score - a.score);
}
