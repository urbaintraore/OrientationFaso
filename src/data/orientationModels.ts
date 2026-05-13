export interface SubjectCoefficient {
  subject: string;
  coef: number;
}

export interface SeriesModel {
  name: string;
  description: string;
  coefficients: SubjectCoefficient[];
  threshold: number; // Moyenne pondérée minimale recommandée
}

export const BEPC_MODELS: SeriesModel[] = [
  {
    name: "Série C (Sciences Exactes)",
    description: "Dominante Mathématiques et Physique-Chimie. Pour les élèves rigoureux et logiques.",
    coefficients: [
      { subject: "Mathématiques", coef: 5 },
      { subject: "Physique-Chimie", coef: 5 },
      { subject: "SVT", coef: 2 },
      { subject: "Français", coef: 2 },
      { subject: "Anglais", coef: 2 },
      { subject: "Histoire-Géo", coef: 2 }
    ],
    threshold: 12
  },
  {
    name: "Série D (Sciences de la Nature)",
    description: "Équilibre entre Biologie, Physique et Maths. La série scientifique la plus polyvalente.",
    coefficients: [
      { subject: "Mathématiques", coef: 4 },
      { subject: "Physique-Chimie", coef: 4 },
      { subject: "SVT", coef: 5 },
      { subject: "Français", coef: 2 },
      { subject: "Anglais", coef: 2 },
      { subject: "Histoire-Géo", coef: 2 }
    ],
    threshold: 11
  },
  {
    name: "Série A (Lettres & Arts)",
    description: "Dominante Littéraire et Linguistique. Pour les passionnés de lecture, langues et sciences humaines.",
    coefficients: [
      { subject: "Français", coef: 5 },
      { subject: "Anglais", coef: 4 },
      { subject: "Histoire-Géo", coef: 4 },
      { subject: "Mathématiques", coef: 1 },
      { subject: "Physique-Chimie", coef: 1 },
      { subject: "SVT", coef: 1 }
    ],
    threshold: 10
  },
  {
    name: "Série E (Maths & Technique)",
    description: "Excellence scientifique et technique. Très sélective.",
    coefficients: [
      { subject: "Mathématiques", coef: 6 },
      { subject: "Physique-Chimie", coef: 5 },
      { subject: "Français", coef: 2 },
      { subject: "Anglais", coef: 3 },
      { subject: "Dessin Technique", coef: 4 }
    ],
    threshold: 14
  },
  {
    name: "Série F (Technologie Industrielle)",
    description: "F1 (Méca), F2 (Élec), F3 (Électrotech), F4 (Génie Civil). Pour les esprits pratiques.",
    coefficients: [
      { subject: "Mathématiques", coef: 4 },
      { subject: "Physique-Chimie", coef: 4 },
      { subject: "Français", coef: 2 },
      { subject: "Anglais", coef: 2 },
      { subject: "SVT", coef: 1 }
    ],
    threshold: 11
  },
  {
    name: "Série G (Techniques de Gestion)",
    description: "G2 (Comptabilité) et G3 (Commerce). Vers le monde de l'entreprise.",
    coefficients: [
      { subject: "Mathématiques", coef: 3 },
      { subject: "Français", coef: 4 },
      { subject: "Anglais", coef: 3 },
      { subject: "Histoire-Géo", coef: 2 },
      { subject: "Physique-Chimie", coef: 1 }
    ],
    threshold: 10
  }
];

export const UNIVERSITY_MODELS: SeriesModel[] = [
  {
    name: "Sciences de la Santé (Médecine, Pharmacie...)",
    description: "Nécessite un BAC C ou D avec d'excellentes notes.",
    coefficients: [
      { subject: "SVT", coef: 5 },
      { subject: "Physique-Chimie", coef: 4 },
      { subject: "Mathématiques", coef: 3 },
      { subject: "Français", coef: 1 }
    ],
    threshold: 14
  },
  {
    name: "Sciences & Technologies (MPI, Info...)",
    description: "Priorité aux Mathématiques et à la Physique.",
    coefficients: [
      { subject: "Mathématiques", coef: 5 },
      { subject: "Physique-Chimie", coef: 5 },
      { subject: "Anglais", coef: 2 },
      { subject: "Français", coef: 1 }
    ],
    threshold: 12
  },
  {
    name: "Sciences Juridiques & Politiques",
    description: "Capacité d'analyse, rédaction et culture générale.",
    coefficients: [
      { subject: "Français", coef: 5 },
      { subject: "Philosophie", coef: 4 },
      { subject: "Histoire-Géo", coef: 4 },
      { subject: "Anglais", coef: 3 }
    ],
    threshold: 11
  },
  {
    name: "Économie & Gestion",
    description: "Bon niveau en Maths requis, même pour les séries non-scientifiques.",
    coefficients: [
      { subject: "Mathématiques", coef: 4 },
      { subject: "Français", coef: 3 },
      { subject: "Anglais", coef: 3 },
      { subject: "Histoire-Géo", coef: 2 }
    ],
    threshold: 11
  },
  {
    name: "Lettres, Langues & Arts",
    description: "Maîtrise des langues et de la littérature.",
    coefficients: [
      { subject: "Français", coef: 5 },
      { subject: "Anglais", coef: 5 },
      { subject: "Philosophie", coef: 3 },
      { subject: "Histoire-Géo", coef: 2 }
    ],
    threshold: 10
  }
];
