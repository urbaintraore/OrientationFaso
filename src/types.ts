export type Subject = 
  | 'Mathématiques'
  | 'Physique-Chimie'
  | 'SVT'
  | 'Français'
  | 'Anglais'
  | 'Histoire-Géo'
  | 'Philosophie'
  | 'EPS'
  | 'Allemand' // Added for high school
  | 'Espagnol'; // Added for high school

export type GradeLevel = '6ème' | '5ème' | '4ème' | '3ème' | 'Seconde' | 'Première' | 'Terminale';

export interface GradeEntry {
  subject: Subject | string; // Allow string for specific technical subjects
  grade: number;
}

export interface YearGrades {
  level: GradeLevel;
  grades: GradeEntry[];
  average: number;
}

export interface StudentProfile {
  name: string;
  age: number;
  gender: 'M' | 'F';
  school: string;
  gradesHistory: YearGrades[];
  bepcGrades: GradeEntry[];
  bepcAverage: number;
  preferredSeries: string;
  motivation: string;
  hobbies: string;
  transcriptUrl?: string;
}

export interface SeriesRecommendation {
  series: string;
  score: number; // 0-100
  matchReason: string;
}

export interface Testimonial {
  author: string;
  role: string;
  quote: string;
}

export interface UsefulLink {
  title: string;
  url: string;
}

export interface AnalysisResult {
  recommendedSeries: string;
  top3Series: SeriesRecommendation[];
  bacSuccessProbability: number; // 0-100
  bacMentionProbability: number; // 0-100
  projectedBacAverage?: number; // Added
  suitableUniversityMajors?: string[]; // Added
  futureJobOpportunities?: string[]; // Added
  estimatedIncomeLevel?: string; // Added
  motivationMessage: string;
  risks: string[];
  improvementTips: string[];
  analysis: {
    regularity: string;
    dominance: string;
    progression: string;
  };
  testimonials: Testimonial[];
  usefulLinks: UsefulLink[];
}

// Post-BAC Types

export interface PostBacProfile {
  name: string;
  age: number;
  gender: 'M' | 'F';
  school: string;
  bacSeries: string;
  gradesHistory: YearGrades[]; // Seconde, Première, Terminale
  bacGrades: GradeEntry[];
  bacAverage: number;
  preferredFields: string;
  motivation: string;
  hobbies: string;
  transcriptUrl?: string;
}

export interface JobOpportunity {
  title: string;
  description: string;
  requiredSkills: string[];
  averageSalary: string;
  demandLevel: string;
  automationRisk: string;
  internationalOpportunities: string;
  jobVideoUrl: string;
  careerRoadmap: string[];
}

export type InstitutionType = 
  | 'Université Publique' 
  | 'Université Privée' 
  | 'Institut Public' 
  | 'Institut Privé' 
  | 'École d’Ingénieurs' 
  | 'École de Commerce' 
  | 'École de Santé' 
  | 'Centre Professionnel' 
  | 'Centre TIC' 
  | 'Collège' 
  | 'Lycée' 
  | 'Lycée Technique' 
  | 'Lycée Scientifique'
  | 'Collège et Lycée'
  | 'École Internationale';

export interface Program {
  id: string;
  institutionId?: string;
  ufrId?: string;
  departmentId?: string;
  name: string;
  field: string;
  description: string;
  duration: string;
  degreeLevel?: string;
  level?: string;
  tuitionFee: number;
  skills: string[];
  careerOpportunities?: string[];
  careers?: string[];
  furtherStudies?: string[];
  subjects?: string[];
  employmentTrend?: 'Très Forte Demande' | 'Forte Demande' | 'Stable' | 'Saturé';
  employmentScore?: number; // 0-100
  averageSalary: string;
  internationalOpportunities?: string;
  admissionCriteria: string;
  employmentRate?: number;
  marketDemand?: 'Forte' | 'Moyenne' | 'Faible';
  growthPotential?: 'Croissant' | 'Stable' | 'Déclin';
  createdAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  profileType: 'student' | 'parent' | 'teacher' | 'etablissement' | 'system_admin';
  createdAt: string;
  hasPaid?: boolean;
  paymentStatus?: 'none' | 'pending' | 'validated' | 'rejected';
  paymentMethod?: 'orange' | 'moov' | 'telecel';
  paymentTransactionId?: string;
  paymentDate?: string;
}

export interface UFR {
  id: string;
  institutionId: string;
  name: string;
  description: string;
  image?: string;
  headOfDepartment?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  institutionId: string;
  ufrId: string;
  name: string;
  description: string;
  headOfDepartment?: string;
  createdAt: string;
}

export type PostCategory = 
  | 'Annonce' 
  | 'Événement' 
  | 'Concours' 
  | 'Filière' 
  | 'Portes Ouvertes' 
  | 'Conférence' 
  | 'Recrutement' 
  | 'Résultats' 
  | 'Actualité';

export interface EstablishmentPost {
  id: string;
  establishmentId: string;
  establishmentName: string;
  establishmentLogo?: string;
  category: PostCategory;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'pdf' | 'link';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isImportant?: boolean;
  isVerified?: boolean;
  eventDate?: string;
  location?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  author: string;
  role: string; // Étudiant, Ancien, etc.
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface Institution {
  id: string;
  ownerId?: string; // To link to a UserProfile
  name: string;
  type: InstitutionType;
  logo: string;
  coverImage: string;
  gallery: string[]; // URLs
  videoUrl?: string;
  description: string;
  city: string;
  country: string;
  address: string;
  website: string;
  phone?: string;
  email?: string;
  establishedYear: number;
  studentCount: number;
  programs?: Program[]; // For backward compatibility or shallow loading
  programsCount?: number;
  degrees?: string[];
  reviews: Review[];
  overallRating: number;
  employabilityRate: number; // %
  reputationScore: number; // IA Score 0-100
  tier: 'Free' | 'Premium' | 'Sponsored';
  accreditations: string[];
  scholarshipsAvailable: boolean;
  virtualTourUrl?: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  location?: {
    lat: number;
    lng: number;
  };
  isVerified: boolean;
  specialOffer?: string;
  aiSuccessIndex?: number; // Calculated dynamically match with user
}

export interface UniversityMajorRecommendation {
  major: string;
  score: number;
  matchReason: string;
}

export interface CareerOpportunity {
  id: string;
  title: string;
  type: 'concours' | 'recrutement_societe_etat' | 'autre';
  organization: string; // e.g. "Ministère de la Fonction Publique", "ONEA", "SONABEL"
  requiredDegree: string;
  compatibleFields: string[];
  positionsCount: number;
  conditions: string;
  ageLimit: string;
  documentsRequired: string[];
  deadline: string;
  officialUrl: string;
  pdfUrl?: string;
  status: 'ouvert' | 'bientôt ouvert' | 'expiré';
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

export interface UniversityAnalysisResult {
  recommendedMajors: UniversityMajorRecommendation[]; // Changed from top5Majors to support 10+
  successProbability: number;
  justification: string;
  opportunities: JobOpportunity[]; // Débouchés métiers détaillés
  employabilityRating: string;
  strategicAdvice: string[];
  testimonials: Testimonial[];
  usefulLinks: UsefulLink[];
  universities: {
    burkinaPublic: string[];
    burkinaPrivate: string[];
    africa: string[];
    europe: string[];
    usa: string[];
    asia: string[];
    canada: string[];
  };
  careerOpportunities?: CareerOpportunity[]; // Nouveaux concours et recrutements d'État
}

export interface SavedProject {
  id: string;
  userId: string; // For future backend integration
  type: 'bepc' | 'bac';
  name: string; // e.g. "Simulation BEPC - Jean"
  date: string; // ISO string
  profile: StudentProfile | PostBacProfile;
  result: AnalysisResult | UniversityAnalysisResult;
}

export type GovernmentOpportunityType = 'bourse' | 'aide' | 'prêt' | 'concours' | 'autre';
export type GovernmentOpportunityStatus = 'ouverte' | 'bientôt expirée' | 'expirée' | 'résultats disponibles';

export interface GovernmentOpportunity {
  id: string;
  title: string;
  type: GovernmentOpportunityType;
  organization: string;
  description: string;
  eligibility: string;
  requiredDocuments: string[];
  deadline: string;
  officialUrl: string;
  pdfUrl?: string;
  thumbnail?: string;
  status: GovernmentOpportunityStatus;
  source: string;
  levelConcerns?: string[]; // e.g. ["Bachelor", "Master"]
  countryConcerns?: string[];
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

export interface Scholarship {
  id: string;
  title: string;
  academicYear?: string; // e.g. "2024/2025", "2025/2026"
  category?: 'Bourse' | 'Aide Financière' | 'Financement Participatif' | 'Prêt Étudiant';
  country: string;
  organization: string;
  university?: string;
  degreeLevel: string; // "Licence", "Master", "Doctorat", "Post-doc"
  field: string[];
  deadline: string;
  fundingType: string; // "Full", "Partial"
  coverage: string[]; // "Frais de scolarité", "Logement", "Transport", "Assurance"
  eligibility: string;
  applicationUrl: string;
  officialSource: string;
  summaryAI: string;
  difficultyScore: 'Très accessible' | 'Compétitif' | 'Élite';
  isForAfricans: boolean;
  isForBurkina: boolean;
  createdAt: string;
  isExpired: boolean;
  imageUrl?: string;
  recommendedProfiles?: string[];
  admissionChance?: number;
}
