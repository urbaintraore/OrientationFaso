import { StudentProfile, PostBacProfile, GradeEntry, YearGrades } from "../types";

export interface CalculatedProfile {
  name: string;
  globalAverage: number;
  scienceAverage: number;
  mathAverage: number;
  pcAverage: number; // General PC average
  physicsAverage: number; // Specific Physics
  chemistryAverage: number; // Specific Chemistry
  biologyAverage: number; // SVT
  literaryAverage: number; // French, Philosophy, History-Geo, English
  managementAverage: number; 
  dominantProfile: 'Scientifique-Mathématique' | 'Scientifique-Biologique' | 'Littéraire' | 'Économique' | 'Équilibré' | 'Technique-Informatique' | 'Général';
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
export function getSubjectScore(grades: GradeEntry[], subject: string, fallback = 10): number {
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

  if (normSubject === 'physique') {
    const physEntry = grades.find(g => g.subject.toLowerCase().trim() === 'physique');
    if (physEntry) return physEntry.grade;
    return getSubjectScore(grades, 'physique-chimie', fallback);
  }

  if (normSubject === 'chimie') {
    const chimEntry = grades.find(g => g.subject.toLowerCase().trim() === 'chimie');
    if (chimEntry) return chimEntry.grade;
    return getSubjectScore(grades, 'physique-chimie', fallback);
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
export function getSubjectHistoricalAverage(gradesHistory: YearGrades[], subject: string, fallbackGrade = 10): number {
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
 * Calculates notes trend from 2nd, 1er, the terminal or 6ème to 3ème in years
 */
function calculateTrend(gradesHistory: YearGrades[], subjectFilter: 'global' | 'scientific' | 'literary'): 'en hausse' | 'en baisse' | 'stable' | 'irrégulier' {
  if (!gradesHistory || gradesHistory.length < 2) return 'stable';
  
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
  const allRecentGrades = examGrades && examGrades.length > 0 ? examGrades : (gradesHistory && gradesHistory.length > 0 ? gradesHistory[gradesHistory.length - 1].grades : []);
  
  const math = getSubjectScore(allRecentGrades, 'Mathématiques', getSubjectHistoricalAverage(gradesHistory, 'Mathématiques', 10));
  const pc = getSubjectScore(allRecentGrades, 'Physique-Chimie', getSubjectHistoricalAverage(gradesHistory, 'Physique-Chimie', 10));
  const physics = getSubjectScore(allRecentGrades, 'Physique', getSubjectHistoricalAverage(gradesHistory, 'Physique', pc));
  const chemistry = getSubjectScore(allRecentGrades, 'Chimie', getSubjectHistoricalAverage(gradesHistory, 'Chimie', pc));
  const svt = getSubjectScore(allRecentGrades, 'SVT', getSubjectHistoricalAverage(gradesHistory, 'SVT', 10));
  const fr = getSubjectScore(allRecentGrades, 'Français', getSubjectHistoricalAverage(gradesHistory, 'Français', 10));
  const ang = getSubjectScore(allRecentGrades, 'Anglais', getSubjectHistoricalAverage(gradesHistory, 'Anglais', 10));
  const hg = getSubjectScore(allRecentGrades, 'Histoire-Géo', getSubjectHistoricalAverage(gradesHistory, 'Histoire-Géo', 10));
  const philo = getSubjectScore(allRecentGrades, 'Philosophie', getSubjectHistoricalAverage(gradesHistory, 'Philosophie', 10));

  const mathHist = getSubjectHistoricalAverage(gradesHistory, 'Mathématiques', math);
  const pcHist = getSubjectHistoricalAverage(gradesHistory, 'Physique-Chimie', pc);
  const physicsHist = getSubjectHistoricalAverage(gradesHistory, 'Physique', physics);
  const chemistryHist = getSubjectHistoricalAverage(gradesHistory, 'Chimie', chemistry);
  const svtHist = getSubjectHistoricalAverage(gradesHistory, 'SVT', svt);
  const frHist = getSubjectHistoricalAverage(gradesHistory, 'Français', fr);
  const angHist = getSubjectHistoricalAverage(gradesHistory, 'Anglais', ang);
  
  const mathAverage = (math * 0.6) + (mathHist * 0.4);
  const pcAverage = (pc * 0.6) + (pcHist * 0.4);
  const physicsAverage = (physics * 0.6) + (physicsHist * 0.4);
  const chemistryAverage = (chemistry * 0.6) + (chemistryHist * 0.4);
  const biologyAverage = (svt * 0.6) + (svtHist * 0.4);
  const frenchAverage = (fr * 0.6) + (frHist * 0.4);
  const englishAverage = (ang * 0.6) + (angHist * 0.4);
  
  const scienceAverage = (mathAverage + pcAverage + biologyAverage) / 3;
  const literaryAverage = (frenchAverage + englishAverage + hg + (philo > 5 ? philo : 10)) / 4;
  const managementAverage = (mathAverage + frenchAverage + hg) / 3;

  let dominantProfile: CalculatedProfile['dominantProfile'] = 'Général';
  const threshold = 10;

  const scienceMath = (mathAverage * 1.5 + physicsAverage) / 2.5;
  const scienceBio = (biologyAverage * 1.5 + chemistryAverage) / 2.5;

  if (scienceMath >= threshold && scienceMath > literaryAverage && scienceMath > scienceBio) {
    dominantProfile = 'Scientifique-Mathématique';
  } else if (scienceBio >= threshold && scienceBio >= scienceMath && scienceBio > literaryAverage) {
    dominantProfile = 'Scientifique-Biologique';
  } else if (literaryAverage >= threshold && literaryAverage > scienceMath && literaryAverage > managementAverage) {
    dominantProfile = 'Littéraire';
  } else if (managementAverage >= threshold && managementAverage > scienceMath && managementAverage > literaryAverage) {
    dominantProfile = 'Économique';
  } else if (Math.abs(scienceAverage - literaryAverage) <= 1.5 && (scienceAverage >= 10 || literaryAverage >= 10)) {
    dominantProfile = 'Équilibré';
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const checkStrengthWeakness = (score: number, label: string) => {
    if (score >= 13.0) strengths.push(label);
    if (score < 10.0) weaknesses.push(label);
  };
  
  checkStrengthWeakness(mathAverage, "Mathématiques");
  checkStrengthWeakness(physicsAverage, "Physique");
  checkStrengthWeakness(chemistryAverage, "Chimie");
  checkStrengthWeakness(biologyAverage, "Sciences de la Vie et de la Terre (SVT)");
  checkStrengthWeakness(frenchAverage, "Français");
  checkStrengthWeakness(englishAverage, "Anglais");
  checkStrengthWeakness(hg, "Histoire-Géographie");
  if (isPostBac && philo > 5) checkStrengthWeakness(philo, "Philosophie");

  return {
    name,
    globalAverage: examAverage || (scienceAverage + literaryAverage) / 2,
    scienceAverage,
    mathAverage,
    pcAverage,
    physicsAverage,
    chemistryAverage,
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
  const isScientifique = bacSeries === 'C' || bacSeries === 'D' || bacSeries === 'E';
  const isLitteraire = bacSeries === 'A' || bacSeries === 'L';
  const isTertiaire = bacSeries.startsWith('G');
  
  // Definition of specialized pedagogical matching criteria per major
  const majorsDefinitions = [
    {
      name: "Architecture & Génie Civil",
      slug: "genie-civil-mines",
      primarySubject: "Mathématiques & Physique",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Physique", weight: 4.5, score: calc.physicsAverage },
        { name: "SVT", weight: 1.5, score: calc.biologyAverage }
      ],
      preferredProfile: "Scientifique-Mathématique",
      minRequiredScore: 11.5,
      penaltyRules: [
        { check: () => calc.mathAverage < 11, penalty: 35, reason: "Des fondations insuffisantes en mathématiques vous gêneront pour l'analyse des forces structurelles." },
        { check: () => calc.physicsAverage < 10.5, penalty: 30, reason: "La résistance des matériaux et de la mécanique justifient des notes en Physique plus élevées." },
        { check: () => calc.mathAverage < 9, penalty: 45, reason: "Moyenne critique en Mathématiques." },
        { check: () => isLitteraire || isTertiaire, penalty: 70, reason: "Incohérence mécanique : inadapté aux profils (A, G)." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) return `Superbe choix. Votre concentration et profil logique très solides se prêtent parfaitement à la conception d'infrastructures ou l'architecture.`;
        return `Votre profil scientifique quantitatif actuel semble trop éloigné des exigences du calcul physique des structures.`;
      }
    },
    {
      name: "Pilotage & Aéronautique",
      slug: "aviation-pilote",
      primarySubject: "Mathématiques & Physique",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Physique", weight: 5, score: calc.physicsAverage },
        { name: "Anglais", weight: 4, score: calc.literaryAverage }
      ],
      preferredProfile: "Scientifique-Mathématique",
      minRequiredScore: 12,
      penaltyRules: [
        { check: () => calc.mathAverage < 13, penalty: 35, reason: "Le pilotage aérien exige un très bon niveau en calcul mental et de navigation (min 13 conseillé)." },
        { check: () => calc.physicsAverage < 12, penalty: 30, reason: "Comprendre les principes aérodynamiques nécessite une excellente base en Physique pure." },
        { check: () => getSubjectScore(profile.bacGrades, 'Anglais', 10) < 11, penalty: 25, reason: "Niveau d'Anglais insuffisant ; l'anglais est la langue obligatoire et technique de l'aviation civile mondiale." },
        { check: () => !isScientifique, penalty: 80, reason: "Filière exclusivement réservée aux séries scientifiques." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 80) return `Profil exceptionnel pour les carrières aéronautiques. Mathématiques, Physique et Anglais solides.`;
        return `Le pilotage est une filière très exigeante, vos fondamentaux en maths/physique ou anglais sont trop critiques.`;
      }
    },
    {
      name: "Impôts, Finance & Comptabilité",
      slug: "finance-comptabilite",
      primarySubject: "Mathématiques & Économie",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Français", weight: 2, score: calc.literaryAverage },
        { name: "Philosophie", weight: 1.5, score: getSubjectScore(profile.bacGrades, 'Philosophie', 10) }
      ],
      preferredProfile: "Économique",
      minRequiredScore: 11,
      penaltyRules: [
        { check: () => calc.mathAverage < 10.5, penalty: 35, reason: "Des faiblesses en maths pénaliseront l'analyse des bilans comptables ou fiscaux." },
        { check: () => isLitteraire && calc.mathAverage < 11, penalty: 25, reason: "Malgré un profil littéraire, la finance nécessite des bases quantitatives." },
        { check: () => calc.dominantProfile === 'Scientifique-Biologique', penalty: 20, reason: "Profil purement médical, pas de focus sur les sciences de gestion." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) return `Recommandation solide pour les métiers d'audit, comptabilité et fiscalité. Calcul mathématique aligné avec la gestion rationnelle.`;
        return `Non recommandée sans une nette progression de vos bases mathématiques et de gestion financière.`;
      }
    },
    {
      name: "Génie Logiciel & Data",
      slug: "genie-logiciel",
      primarySubject: "Mathématiques",
      keySubjects: [
        { name: "Mathématiques", weight: 5, score: calc.mathAverage },
        { name: "Physique", weight: 3, score: calc.physicsAverage },
        { name: "Anglais", weight: 2, score: calc.literaryAverage }
      ],
      preferredProfile: "Scientifique-Mathématique",
      minRequiredScore: 11,
      penaltyRules: [
        { check: () => calc.mathAverage < 10.5, penalty: 40, reason: "Le Génie Algorithmique exige un robuste bagage logique et mathématique abstrait." },
        { check: () => calc.mathAverage < 8.5, penalty: 80, reason: "L'apprentissage formel de la programmation est en péril avec une note critique de Maths." },
        { check: () => isLitteraire, penalty: 40, reason: "Les notions d'algorithmique et d'ingénierie mathématique font défaut dans votre formation d'origine." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) return `Excellent choix. Résolution de problèmes et logique algorithmique compatibles.`;
        return `La programmation nécessite des exigences mathématiques qui risquent de bloquer votre progression.`;
      }
    },
    {
      name: "Médecine, Pharmacie, Odontostomatologie",
      slug: "medecine-pharmacie",
      primarySubject: "SVT & Chimie",
      keySubjects: [
        { name: "SVT", weight: 5, score: calc.biologyAverage },
        { name: "Chimie", weight: 4.5, score: calc.chemistryAverage },
        { name: "Physique", weight: 2, score: calc.physicsAverage },
        { name: "Mathématiques", weight: 1.5, score: calc.mathAverage }
      ],
      preferredProfile: "Scientifique-Biologique",
      minRequiredScore: 12,
      penaltyRules: [
        { check: () => calc.biologyAverage < 11.5, penalty: 35, reason: "Excellence exigée en biologie humaine, cellulaire et immunologie." },
        { check: () => calc.chemistryAverage < 11.5, penalty: 30, reason: "La chimie et biochimie/pharmacologie interdisent de faibles notes en Chimie." },
        { check: () => !isScientifique, penalty: 90, reason: "Filière de sciences de la santé légalement fermée aux non-scientifiques." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 75) return `Filière d'excellence. Vos notes en SVT et Chimie sont d'excellents prédicteurs de réussite.`;
        return `Peu recommandable compte tenu de la forte exigence en chimie complexe et SVT.`;
      }
    },
    {
      name: "Agronomie, Sciences de la Terre & Biologie",
      slug: "agronomie-elevage",
      primarySubject: "SVT & Chimie",
      keySubjects: [
        { name: "SVT", weight: 4.5, score: calc.biologyAverage },
        { name: "Chimie", weight: 3.5, score: calc.chemistryAverage },
        { name: "Physique", weight: 2, score: calc.physicsAverage },
        { name: "Mathématiques", weight: 2, score: calc.mathAverage }
      ],
      preferredProfile: "Scientifique-Biologique",
      minRequiredScore: 10,
      penaltyRules: [
        { check: () => calc.biologyAverage < 10, penalty: 30, reason: "L'agriculture et l'amélioration des espèces reposent sur la SVT pure." },
        { check: () => calc.chemistryAverage < 10, penalty: 25, reason: "Bases chimiques trop faibles pour la chimie organique des sols." },
        { check: () => !isScientifique, penalty: 40, reason: "Incompatibilité. Ingénierie biologique." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Orientation pertinente. Votre affinité biologique prédispose à préserver environnement et rendements agricoles.`;
        return `Le profil de SVT reste trop faible pour garantir la réussite en biologie végétale ou géologie.`;
      }
    },
    {
      name: "Droit & Sciences Politiques",
      slug: "droit-sciences-politiques",
      primarySubject: "Français & Philosophie",
      keySubjects: [
        { name: "Français", weight: 4, score: getSubjectScore(profile.bacGrades, 'Français', 10) },
        { name: "Philosophie", weight: 3, score: getSubjectScore(profile.bacGrades, 'Philosophie', 10) },
        { name: "Histoire-Géo", weight: 2, score: calc.literaryAverage }
      ],
      preferredProfile: "Littéraire",
      minRequiredScore: 10.5,
      penaltyRules: [
        { check: () => getSubjectScore(profile.bacGrades, 'Français', 10) < 10, penalty: 35, reason: "Le Droit exige une capacité écrite (orthographe, syntaxe) irréprochable et pointue." },
        { check: () => calc.dominantProfile === 'Scientifique-Biologique' || calc.dominantProfile === 'Scientifique-Mathématique', penalty: 25, reason: "Votre cerveau est câblé 'Sciences dures' expérimentales. Risque de non affinité profonde avec la doctrine juridique theorique." },
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Une voie classique pour un esprit doué en dissertation et logique argumentative.`;
        return `Déconseillé ; le niveau des expressions conceptuelles requises dans la rédaction juridique sera handicapant.`;
      }
    },
    {
      name: "Journalisme & Communication",
      slug: "journalisme-com",
      primarySubject: "Français & Culture Générale",
      keySubjects: [
        { name: "Français", weight: 5, score: getSubjectScore(profile.bacGrades, 'Français', 10) },
        { name: "Histoire-Géo", weight: 2.5, score: calc.literaryAverage },
        { name: "Philosophie", weight: 2.5, score: getSubjectScore(profile.bacGrades, 'Philosophie', 10) }
      ],
      preferredProfile: "Littéraire",
      minRequiredScore: 10,
      penaltyRules: [
        { check: () => getSubjectScore(profile.bacGrades, 'Français', 10) < 10.5, penalty: 30, reason: "Pour assurer les relations publiques journalistiques, une maîtrise rédactionnelle est le minimum absolu." },
        { check: () => getSubjectScore(profile.bacGrades, 'Anglais', 10) < 9.5, penalty: 15, reason: "Anglais faible." },
        { check: () => calc.dominantProfile.includes('Scientifique'), penalty: 45, reason: "Votre profil de base privilégie fortement les données scientifiques expérimentales plutôt que l'éditorial." },
        { check: () => isScientifique, penalty: 35, reason: "Les bacheliers scientifiques ayant une vocation communicationnelle sont considérés comme hors cible primaire." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Idéal pour exceller dans le journalisme ou la communication institutionnelle des marques grâce à une très belle expression écrite.`;
        return `Vous ne disposez ni de l'ancrage littéraire requis, ni d'un alignement avec ce style purement rédactionnel.`;
      }
    },
    {
      name: "Traduction & Langues Étrangères",
      slug: "langues-etrangeres",
      primarySubject: "Anglais / Allemand",
      keySubjects: [
        { name: "Anglais", weight: 5, score: getSubjectScore(profile.bacGrades, 'Anglais', 10) },
        { name: "Français", weight: 3, score: getSubjectScore(profile.bacGrades, 'Français', 10) },
        { name: "Allemand", weight: 3, score: getSubjectScore(profile.bacGrades, 'Allemand', 10) }
      ],
      preferredProfile: "Littéraire",
      minRequiredScore: 11,
      penaltyRules: [
        { check: () => getSubjectScore(profile.bacGrades, 'Anglais', 10) < 11.5, penalty: 35, reason: "La littérature anglophone ou la traduction nécessite un bilinguisme fort et structuré." },
        { check: () => calc.dominantProfile.includes('Scientifique'), penalty: 45, reason: "Votre dominante purement scientifique rend périlleuse cette orientation linguistique pure." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Profil linguistique pertinent. Adapté pour l'interprétariat et les carrières diplomatiques internationales.`;
        return `Déconseillé. Le niveau requis en syntaxe des langues étrangères est particulièrement rude.`;
      }
    }
  ];

  const reports: CompatibilityReport[] = [];

  majorsDefinitions.forEach(major => {
    let sumWeights = 0;
    let sumWeightedScores = 0;
    major.keySubjects.forEach(sub => {
      sumWeightedScores += sub.score * sub.weight;
      sumWeights += sub.weight;
    });

    let baseCompatScore = (sumWeightedScores / sumWeights) * 5;

    if (calc.dominantProfile === major.preferredProfile) {
      baseCompatScore += 10;
    } else if (calc.dominantProfile === 'Équilibré') {
      baseCompatScore += 4;
    }

    let appliedPenaltiesCount = 0;
    const penaltyExplanations: string[] = [];
    
    major.penaltyRules.forEach(rule => {
      if (rule.check()) {
        baseCompatScore -= rule.penalty;
        appliedPenaltiesCount++;
        penaltyExplanations.push(rule.reason);
      }
    });

    let finalScore = Math.max(5, Math.min(99, Math.round(baseCompatScore)));

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

    if (appliedPenaltiesCount >= 2 || finalScore < 30) {
      suitability = finalScore < 20 ? 'Fortement Déconseillée' : 'Déconseillée';
    }

    const primaryGrade = getSubjectScore(profile.bacGrades, major.primarySubject, 10);
    const dominantGradeReason = `Matière fondamentale: ${major.primarySubject} (${primaryGrade.toFixed(1)}/20). Moyenne Thématique: ${calc.dominantProfile}.`;

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
        { check: () => calc.mathAverage < 12.5, penalty: 40, reason: `La série C exige d'excellentes bases (recommandé >=12.5). Votre score actuel de Mathématiques (${calc.mathAverage.toFixed(1)}/20) vous placerait en difficulté.` },
        { check: () => calc.mathAverage < 10, penalty: 60, reason: "Bases très insuffisantes en Mathématiques (<10/20) pour la série C." },
        { check: () => calc.pcAverage < 11.5, penalty: 20, reason: "Faiblesse relative en Sciences Physiques indispensables en Seconde C." },
        { check: () => calc.pcAverage < 10, penalty: 40, reason: "Moyenne critique en Physique-Chimie (<10/20) inadéquate pour le rythme de Seconde C." }
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
        { check: () => calc.biologyAverage < 10, penalty: 30, reason: "Bases en SVT insuffisantes pour entamer les études de biologie de la série D." },
        { check: () => calc.scienceAverage < 10, penalty: 30, reason: "Note scientifique globale critique ; la Seconde S/D exige un niveau de rigueur expérimental." },
        { check: () => calc.pcAverage < 10, penalty: 20, reason: "Fragilité en Physique-Chimie, matière clé d'évaluation en Seconde S/D." },
        { check: () => calc.mathAverage < 9, penalty: 25, reason: "Note de mathématiques trop basse (<9/20) pour supporter le rythme de calcul de la classe de Seconde S/D." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 70) return `Filière scientifique équilibrée tout à fait propice face à votre profil expérimental. Excellente passerelle pour de futures études médicales, d'énergie, de gestion ou d'agronomie en série D.`;
        if (score >= 45) return `Admissible comme orientation, mais les bases mathématiques et de sciences physiques doivent être stabilisées dès le premier trimestre de Seconde.`;
        return `Un redéploiement d'orientation est vivement recommandé en raison de la fragilité de vos matières de calculs et d'observation.`;
      }
    },
    {
      name: "Série A4 (Lettres, Langues & Philosophie)",
      slug: "A4",
      keySubjects: [
        { name: "Français", weight: 5, score: calc.literaryAverage },
        { name: "Anglais", weight: 4, score: calc.literaryAverage },
        { name: "Histoire-Géo", weight: 3, score: calc.literaryAverage }
      ],
      minRequiredScore: 10,
      penaltyRules: [
        { check: () => getSubjectScore(profile.bepcGrades, 'Français', 10) < 10, penalty: 35, reason: "Faiblesse majeure en rédaction et expression de Français. La série A4 nécessite une aisance rédactionnelle pour l'exercice de la dissertation d'histoire ou de philo." },
        { check: () => calc.literaryAverage < 9.5, penalty: 20, reason: "Niveau général d'expression globale insuffisant pour s'orienter vers les lettres." }
      ],
      explanationGenerator: (score: number) => {
        if (score >= 72) return `Aisance verbale excellente. Vos forces claires en expression française et langues étrangères vous assureront une scolarité gratifiante vers le BAC littéraire A4.`;
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

    if (bepcPreferred === series.slug) {
      baseScore += 8;
    }

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
