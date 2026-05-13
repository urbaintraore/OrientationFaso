import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, CreditCard, CheckCircle, XCircle, Search, Trash2, Plus, X, Eye, GraduationCap, School, Calendar, Filter, Download, FileText, TrendingUp, AlertTriangle, ToggleLeft as ToggleLeftIcon, ToggleRight as ToggleRightIcon, Loader2, RefreshCw, Zap, Sparkles, Building2, Bell, ShieldCheck, AlertCircle } from 'lucide-react';
import { AnalysisResult, UniversityAnalysisResult } from '../types';
import { mockInstitutions } from '../data/mockInstitutions';
import { jsPDF } from 'jspdf';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { academicGatheringService } from '../services/academicGatheringService';
import { governmentGatheringService } from '../services/governmentGatheringService';
import { notificationService } from '../services/notificationService';
import { crawlInstitutions } from '../services/gemini';

// Mock data for users with more details
const INITIAL_USERS = [
  { 
    id: 1, 
    name: 'Jean Kaboré', 
    email: 'jean.k@example.com', 
    hasPaid: true, 
    date: '2024-03-15', 
    status: 'Actif',
    loginEnabled: true,
    details: {
      age: 18,
      school: 'Lycée Philippe Zinda Kaboré',
      level: 'Terminale D',
      trimesters: [
        { trimester: 1, average: 14.2, grades: [{ subject: 'Maths', grade: 15 }, { subject: 'PC', grade: 13 }] },
        { trimester: 2, average: 14.8, grades: [{ subject: 'Maths', grade: 16 }, { subject: 'PC', grade: 14 }] },
        { trimester: 3, average: 14.5, grades: [{ subject: 'Maths', grade: 14 }, { subject: 'PC', grade: 15 }] }
      ],
      bepc: {
        average: 14.5,
        year: 2021,
        grades: [
          { subject: 'Mathématiques', grade: 15 },
          { subject: 'Physique-Chimie', grade: 14 },
          { subject: 'SVT', grade: 16 },
          { subject: 'Français', grade: 12 },
          { subject: 'Anglais', grade: 13 },
          { subject: 'Histoire-Géo', grade: 14 },
        ]
      },
      bac: null,
      analysisResult: {
        recommendedSeries: 'C',
        top3Series: [
          { series: 'C', score: 85, matchReason: 'Excellents résultats en Maths et PC' },
          { series: 'D', score: 75, matchReason: 'Bon niveau scientifique global' },
          { series: 'E', score: 60, matchReason: 'Profil technique intéressant' }
        ],
        bacSuccessProbability: 92,
        bacMentionProbability: 65,
        projectedBacAverage: 14.5,
        motivationMessage: "Tu as un profil scientifique solide, idéal pour la série C.",
        risks: ["Attention à la philosophie", "Maintenir le rythme en SVT"],
        improvementTips: ["Renforcer l'anglais", "Participer à des clubs scientifiques"],
        analysis: {
          regularity: "Constante",
          dominance: "Scientifique",
          progression: "En hausse"
        },
        testimonials: [],
        usefulLinks: [],
        suitableUniversityMajors: ["Mathématiques", "Physique", "Informatique"],
        futureJobOpportunities: ["Ingénieur (Burkina)", "Data Scientist (International)"],
        estimatedIncomeLevel: "Élevé"
      } as AnalysisResult
    }
  },
  { 
    id: 2, 
    name: 'Aminata Diallo', 
    email: 'ami.d@example.com', 
    hasPaid: true, 
    date: '2024-03-14', 
    status: 'Actif',
    loginEnabled: true,
    details: {
      age: 19,
      school: 'Collège Saint-Viateur',
      level: 'Post-BAC',
      bepc: {
        average: 16.0,
        year: 2020,
        grades: [
          { subject: 'Mathématiques', grade: 17 },
          { subject: 'Physique-Chimie', grade: 16 },
          { subject: 'SVT', grade: 15 },
          { subject: 'Français', grade: 14 },
        ]
      },
      bac: {
        series: 'D',
        average: 15.5,
        year: 2023,
        grades: [
          { subject: 'Mathématiques', grade: 16 },
          { subject: 'Physique-Chimie', grade: 15 },
          { subject: 'SVT', grade: 16 },
          { subject: 'Philosophie', grade: 12 },
        ]
      },
      analysisResult: null
    }
  },
  { 
    id: 3, 
    name: 'Moussa Ouédraogo', 
    email: 'moussa.o@example.com', 
    hasPaid: false, 
    date: '2024-03-14', 
    status: 'En attente',
    loginEnabled: false,
    details: {
      age: 17,
      school: 'Lycée Mixte de Gounghin',
      level: 'Première C',
      bepc: {
        average: 13.0,
        year: 2022,
        grades: [
          { subject: 'Mathématiques', grade: 14 },
          { subject: 'Physique-Chimie', grade: 13 },
          { subject: 'SVT', grade: 12 },
          { subject: 'Français', grade: 11 },
        ]
      },
      bac: null,
      analysisResult: null
    }
  },
  { 
    id: 4, 
    name: 'Fatou Sanou', 
    email: 'fatou.s@example.com', 
    hasPaid: true, 
    date: '2024-03-13', 
    status: 'Actif',
    loginEnabled: true,
    details: {
      age: 18,
      school: 'Lycée Nelson Mandela',
      level: 'Terminale A4',
      bepc: {
        average: 15.0,
        year: 2021,
        grades: [
          { subject: 'Mathématiques', grade: 12 },
          { subject: 'Français', grade: 16 },
          { subject: 'Anglais', grade: 15 },
          { subject: 'Histoire-Géo', grade: 16 },
        ]
      },
      bac: null,
      analysisResult: {
        recommendedSeries: 'A4',
        top3Series: [
          { series: 'A4', score: 88, matchReason: 'Excellence en langues et lettres' },
          { series: 'D', score: 55, matchReason: 'Niveau scientifique moyen' },
          { series: 'G2', score: 65, matchReason: 'Bonnes capacités de rédaction' }
        ],
        bacSuccessProbability: 85,
        bacMentionProbability: 50,
        projectedBacAverage: 13.5,
        motivationMessage: "Tes talents littéraires te destinent naturellement à la série A4.",
        risks: ["Mathématiques à surveiller", "Gestion du stress"],
        improvementTips: ["Lire davantage d'auteurs classiques", "Pratiquer l'anglais oral"],
        analysis: {
          regularity: "Bonne",
          dominance: "Littéraire",
          progression: "Stable"
        },
        testimonials: [],
        usefulLinks: []
      } as AnalysisResult
    }
  },
  { 
    id: 5, 
    name: 'Paul Zongo', 
    email: 'paul.z@example.com', 
    hasPaid: false, 
    date: '2024-03-12', 
    status: 'En attente',
    loginEnabled: false,
    details: {
      age: 20,
      school: 'Université Joseph Ki-Zerbo',
      level: 'Licence 1',
      bepc: {
        average: 12.5,
        year: 2019,
        grades: [
          { subject: 'Mathématiques', grade: 13 },
          { subject: 'Physique-Chimie', grade: 12 },
          { subject: 'SVT', grade: 11 },
          { subject: 'Français', grade: 14 },
          { subject: 'Anglais', grade: 14 },
          { subject: 'Histoire-Géo', grade: 12 },
        ]
      },
      bac: {
        series: 'C',
        average: 13.0,
        year: 2022,
        grades: [
          { subject: 'Mathématiques', grade: 14 },
          { subject: 'Physique-Chimie', grade: 13 },
        ]
      },
      analysisResult: {
        recommendedMajors: [
          { major: 'Informatique', score: 90, matchReason: 'Excellentes notes en maths' },
          { major: 'Génie Civil', score: 85, matchReason: 'Bon profil technique' },
          { major: 'Mathématiques', score: 80, matchReason: 'Passion pour les maths' }
        ],
        successProbability: 88,
        justification: "Ton profil scientifique solide te permet de viser des filières d'excellence.",
        opportunities: ["Développeur Web", "Data Scientist", "Ingénieur Logiciel"],
        employabilityRating: "Très Élevée",
        strategicAdvice: ["Participer à des hackathons", "Améliorer l'anglais technique"],
        testimonials: [],
        usefulLinks: [],
        universities: {
          burkinaPublic: ["Université Joseph Ki-Zerbo", "Université Nazi Boni"],
          burkinaPrivate: ["Aube Nouvelle", "USTA"],
          africa: ["UCAD (Sénégal)", "INPHB (Côte d'Ivoire)"],
          europe: ["Université de Paris-Saclay", "EPFL (Suisse)"],
          usa: ["MIT", "Stanford"],
          asia: ["Tsinghua University", "University of Tokyo"],
          canada: ["Université de Montréal", "McGill University"]
        }
      } as unknown as AnalysisResult
    }
  },
  {
    id: 6,
    name: 'Fatima Ouédraogo',
    email: 'fatima.o@example.com',
    date: '2024-03-15',
    status: 'Actif',
    loginEnabled: true,
    hasPaid: true,
    details: {
      age: 18,
      school: 'Lycée Saint-Exupéry',
      level: 'Terminale D',
      bepc: {
        average: 15.5,
        year: 2020,
        grades: [
          { subject: 'Mathématiques', grade: 16 },
          { subject: 'Physique-Chimie', grade: 15 },
          { subject: 'SVT', grade: 17 },
          { subject: 'Français', grade: 14 },
          { subject: 'Anglais', grade: 15 }
        ]
      },
      bac: {
        series: 'D',
        average: 14.2,
        year: 2023,
        grades: [
          { subject: 'Mathématiques', grade: 14 },
          { subject: 'Physique-Chimie', grade: 15 },
          { subject: 'SVT', grade: 16 },
          { subject: 'Philosophie', grade: 12 },
          { subject: 'Anglais', grade: 14 }
        ]
      },
      analysisResult: {
        recommendedMajors: [
          { major: 'Médecine', score: 95, matchReason: 'Excellentes notes en SVT et sciences' },
          { major: 'Pharmacie', score: 92, matchReason: 'Profil scientifique complet' },
          { major: 'Biologie Médicale', score: 88, matchReason: 'Intérêt marqué pour le vivant' },
          { major: 'Agronomie', score: 85, matchReason: 'Compétences en SVT et chimie' },
          { major: 'Nutrition Humaine', score: 82, matchReason: 'Lien santé-alimentation' },
          { major: 'Génie Biomédical', score: 80, matchReason: 'Alliance santé et technique' },
          { major: 'Biochimie', score: 78, matchReason: 'Bases solides en chimie' },
          { major: 'Santé Publique', score: 75, matchReason: 'Profil polyvalent' },
          { major: 'Environnement', score: 72, matchReason: 'Sensibilité écologique' },
          { major: 'Enseignement SVT', score: 70, matchReason: 'Capacité de transmission' }
        ],
        successProbability: 92,
        justification: "Votre parcours académique exemplaire, notamment en sciences de la vie, vous positionne idéalement pour les carrières médicales et paramédicales.",
        opportunities: [
          "Médecin Généraliste", "Pharmacien d'Officine", "Biologiste Médical", 
          "Ingénieur Agronome", "Nutritionniste", "Chercheur en Biomédical",
          "Responsable Qualité Agroalimentaire", "Épidémiologiste", 
          "Consultant en Environnement", "Enseignant-Chercheur"
        ],
        employabilityRating: "Maximale",
        strategicAdvice: [
          "Préparer les concours d'entrée en médecine dès maintenant",
          "Effectuer des stages d'observation en milieu hospitalier",
          "Renforcer l'anglais scientifique"
        ],
        testimonials: [],
        usefulLinks: [],
        universities: {
          burkinaPublic: [
            "Université Joseph Ki-Zerbo (UFR SDS)", 
            "Université Nazi Boni (Bobo-Dioulasso)", 
            "Université Norbert Zongo (Koudougou)",
            "Université de Ouahigouya (Médecine)",
            "Université de Fada N'Gourma"
          ],
          burkinaPrivate: [
            "Université Saint Thomas d'Aquin (USTA)", 
            "Université Aube Nouvelle", 
            "Université Catholique de l'Afrique de l'Ouest (UCAO)",
            "Institut Supérieur de Santé (ISS)",
            "École Privée de Santé Sainte Edwige"
          ],
          africa: [
            "UCAD (Sénégal - Médecine)", 
            "Université Gamal Abdel Nasser (Guinée)", 
            "USTTB (Mali)", 
            "Université de Lomé (Togo)", 
            "Université d'Abomey-Calavi (Bénin)",
            "Université Mohammed VI (Maroc)",
            "University of Ghana (Legon)",
            "University of Ibadan (Nigeria)",
            "Makerere University (Ouganda)",
            "University of Cape Town (Afrique du Sud)"
          ],
          europe: [
            "Sorbonne Université (France)", 
            "Université de Paris Cité (France)", 
            "UCLouvain (Belgique)", 
            "Université de Genève (Suisse)", 
            "Karolinska Institute (Suède)",
            "Charité - Universitätsmedizin Berlin (Allemagne)",
            "University of Amsterdam (Pays-Bas)",
            "University of Copenhagen (Danemark)",
            "Trinity College Dublin (Irlande)",
            "University of Barcelona (Espagne)"
          ],
          usa: [
            "Johns Hopkins University", 
            "Harvard Medical School", 
            "Stanford Medicine", 
            "UCSF School of Medicine", 
            "Mayo Clinic Alix School of Medicine",
            "University of Pennsylvania",
            "Columbia University",
            "Duke University",
            "University of Washington",
            "UCLA David Geffen School of Medicine"
          ],
          asia: [
            "National University of Singapore (NUS)", 
            "University of Tokyo (Japon)", 
            "Peking University (Chine)", 
            "Seoul National University (Corée du Sud)", 
            "University of Hong Kong",
            "Kyoto University (Japon)",
            "Fudan University (Chine)",
            "Tsinghua University (Chine)",
            "Mahidol University (Thaïlande)",
            "Taipei Medical University (Taiwan)"
          ],
          canada: [
            "University of Toronto", 
            "McGill University", 
            "Université de Montréal", 
            "University of British Columbia", 
            "McMaster University",
            "University of Alberta",
            "Université Laval",
            "Western University",
            "University of Ottawa",
            "Dalhousie University"
          ]
        }
      } as unknown as AnalysisResult
    }
  },
];

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  useEffect(() => {
    fetchRealUsers();
    fetchRealInstitutions();
  }, []);

  const fetchRealInstitutions = async () => {
    setLoadingInstitutions(true);
    try {
      const q = query(collection(db, 'institutions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInstitutions(data);
    } catch (e) {
      console.error("Error fetching institutions:", e);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const fetchRealUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const realUsers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.fullName || 'Utilisateur sans nom',
          email: data.email || 'Pas d\'email',
          hasPaid: data.hasPaid || false,
          date: data.createdAt ? data.createdAt.split('T')[0] : (data.date || new Date().toISOString().split('T')[0]),
          status: data.hasPaid ? 'Actif' : 'En attente',
          loginEnabled: data.loginEnabled !== undefined ? data.loginEnabled : true,
          details: {
            age: data.age || 0,
            school: data.school || 'Non renseigné',
            level: data.level || (
              data.profileType === 'student' ? 'Élève' : 
              data.profileType === 'etablissement' ? 'Établissement' :
              data.profileType === 'parent' ? 'Parent' :
              data.profileType === 'system_admin' ? 'Super Admin' :
              (data.profileType || 'Non renseigné')
            ),
            trimesters: data.trimesters || [],
            bepc: data.bepc || { average: 0, year: 0, grades: [] },
            bac: data.bac || null,
            analysisResult: data.analysisResult || null
          }
        };
      });

      // Sort realUsers by date descending in memory
      realUsers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Merge with initial users
      setUsers([...realUsers, ...INITIAL_USERS.filter(mu => !realUsers.some(ru => ru.email === mu.email))]);
    } catch (error) {
      console.error("Error fetching users from Firestore:", error);
    } finally {
      setLoadingUsers(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'institutions' | 'notifications' | 'intelligence' | 'gov_sync'>('users');
  
  // Intelligence state
  const [intelUrl, setIntelUrl] = useState('');
  const [intelStatus, setIntelStatus] = useState('');
  const [isIntelRunning, setIsIntelRunning] = useState(false);
  const [intelStats, setIntelStats] = useState({ institutions: 0, programs: 0 });

  // Gov Sync state
  const [isGovSyncRunning, setIsGovSyncRunning] = useState(false);
  const [govSyncStatus, setGovSyncStatus] = useState('');
  const [govSyncResult, setGovSyncResult] = useState<{ added: number; updated: number; errors: string[] } | null>(null);

  const handleGovSync = async () => {
    setIsGovSyncRunning(true);
    setGovSyncStatus('Analyse en cours des sites gouvernementaux (CIOSPB, FOSER)...');
    try {
      const results = await governmentGatheringService.gatherAll();
      if (results) {
        setGovSyncResult(results);
        setGovSyncStatus('Synchronisation terminée avec succès.');
        
        // Notify users if new offers were found
        if (results.added > 0) {
          await notificationService.sendNotification({
            title: "Nouvelles opportunités gouvernementales !",
            message: `${results.added} bourses/aides ont été ajoutées sur la plateforme.`,
            category: 'scholarship',
            target: 'all',
            link: 'scholarships'
          });
        }
      } else {
        throw new Error("Aucun résultat retourné par le service.");
      }
    } catch (error: any) {
      console.error(error);
      setGovSyncStatus(`Erreur lors de la synchronisation: ${error.message || 'Erreur inconnue'}`);
      setGovSyncResult({ added: 0, updated: 0, errors: [error.message || 'Erreur inconnue'] });
    } finally {
      setIsGovSyncRunning(false);
    }
  };

  const handleCleanDuplicates = async () => {
    if (!window.confirm("Voulez-vous fusionner les établissements en double ? Cette action est irréversible.")) return;
    setLoadingInstitutions(true);
    try {
      const res = await academicGatheringService.cleanDuplicates();
      alert(`Nettoyage terminé : ${res.removed} doublons supprimés.`);
      fetchRealInstitutions();
    } catch (e) {
      alert("Erreur lors du nettoyage.");
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const handleRunIntel = async () => {
    if (!intelUrl) return;
    setIsIntelRunning(true);
    setIntelStatus('Exploration de la cible...');
    try {
      // Si l'URL ne commence pas par http, on considère que c'est une recherche par région/nom
      if (!intelUrl.startsWith('http')) {
        const results = await crawlInstitutions(intelUrl);
        if (results && results.length > 0) {
          setIntelStatus(`Importation de ${results.length} établissements...`);
          for (const inst of results) {
            await academicGatheringService.saveCrawledData({
              institution: inst,
              programs: inst.programs || []
            });
          }
          setIntelStats(prev => ({
            institutions: prev.institutions + results.length,
            programs: prev.programs + results.reduce((acc, curr) => acc + (curr.programs?.length || 0), 0)
          }));
          setIntelStatus('Succès ! Base de données enrichie.');
        } else {
          setIntelStatus('Aucun résultat trouvé pour cette recherche.');
        }
      } else {
        // Extraction par URL (Simulation de contenu car CORS bloque le fetch direct)
        // On demande à Gemini d'analyser le site via son URL (grounding)
        const data = await academicGatheringService.extractAcademicData(`Analyse du site: ${intelUrl}`, intelUrl);
        if (data && data.institution && data.institution.name) {
          setIntelStatus('Enregistrement des données...');
          await academicGatheringService.saveCrawledData(data);
          setIntelStats(prev => ({
            institutions: prev.institutions + 1,
            programs: prev.programs + (data.programs?.length || 0)
          }));
          setIntelStatus('Succès ! Etablissement importé.');
          setIntelUrl('');
        } else {
          setIntelStatus('Aucune donnée structurée détectée sur ce site.');
        }
      }
    } catch (e) {
      console.error(e);
      setIntelStatus('Erreur critique lors de l\'analyse.');
    } finally {
      setIsIntelRunning(false);
    }
  };

  const handleSyncBurkina = async () => {
    setIntelUrl('Burkina Faso');
    setTimeout(() => handleRunIntel(), 100);
  };
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    category: 'scholarship' as any,
    target: 'all' as any,
    link: 'scholarships' as any
  });
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationForm.title || !notificationForm.message) return;
    
    setIsSendingNotif(true);
    try {
      await notificationService.sendNotification({
        title: notificationForm.title,
        message: notificationForm.message,
        category: notificationForm.category,
        target: notificationForm.target,
        link: notificationForm.link
      });
      alert('Notification diffusée avec succès !');
      setNotificationForm({
        title: '',
        message: '',
        category: 'scholarship',
        target: 'all',
        link: 'scholarships'
      });
    } catch (e) {
      alert('Erreur lors de l\'envoi.');
    } finally {
      setIsSendingNotif(false);
    }
  };
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof INITIAL_USERS[0] | null>(null);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    hasPaid: false,
    loginEnabled: true,
    school: '',
    level: '',
    age: ''
  });
  
  // Advanced filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'Actif' | 'En attente'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seriesFilter, setSeriesFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sorting & Bulk Selection
  const [usersSortBy, setUsersSortBy] = useState<'name' | 'date' | 'status' | 'payment'>('date');
  const [usersSortOrder, setUsersSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const SERIES_OPTIONS = ['A', 'A4', 'C', 'D', 'E', 'F', 'G1', 'G2'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    let matchesSeries = true;
    if (seriesFilter !== 'all') {
      const levelSeries = user.details.level.split(' ').pop(); // Ex: "Terminale D" -> "D"
      const bacSeries = user.details.bac?.series;
      
      matchesSeries = (levelSeries === seriesFilter) || (bacSeries === seriesFilter) || 
                      (seriesFilter === 'A' && levelSeries === 'A4');
    }

    const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
    
    const matchesDate = (!startDate || user.date >= startDate) && 
                        (!endDate || user.date <= endDate);

    return matchesSearch && matchesSeries && matchesStatus && matchesDate;
  }).sort((a, b) => {
    let comparison = 0;
    if (usersSortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (usersSortBy === 'date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (usersSortBy === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (usersSortBy === 'payment') {
      comparison = (a.hasPaid === b.hasPaid) ? 0 : a.hasPaid ? 1 : -1;
    }
    return usersSortOrder === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Derived payments data
  const payments = users.map(user => ({
    id: `PAY-${1000 + user.id}`,
    userId: user.id,
    userName: user.name,
    amount: 2000,
    date: user.date,
    status: user.hasPaid ? 'Completed' : 'Pending',
    method: user.hasPaid ? (user.id % 2 === 0 ? 'Orange Money' : 'Moov Money') : '-'
  }));

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.userName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                          payment.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchesStatus = paymentStatusFilter === 'all' 
      ? true 
      : paymentStatusFilter === 'paid' 
        ? payment.status === 'Completed'
        : payment.status === 'Pending';
    
    const matchesDate = (!startDate || payment.date >= startDate) && 
                         (!endDate || payment.date <= endDate);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const paymentPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleLoginStatus = (id: number | string) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, loginEnabled: !user.loginEnabled } : user
    ));
  };

  const updateUserStatus = (id: number | string, newStatus: string) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, status: newStatus } : user
    ));
  };

  const handleExport = () => {
    const isUsers = activeTab === 'users';
    const data = isUsers ? filteredUsers : filteredPayments;
    const filename = `export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    const headers = isUsers 
      ? ['ID', 'Nom', 'Email', 'Date', 'Connexion', 'Statut Paiement', 'Statut Compte', 'Etablissement', 'Niveau']
      : ['ID Transaction', 'Utilisateur', 'Montant', 'Date', 'Methode', 'Statut'];

    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (isUsers) {
          const user = item as any;
          return [
            user.id,
            `"${user.name}"`,
            user.email,
            user.date,
            user.loginEnabled ? 'Activé' : 'Désactivé',
            user.hasPaid ? 'Payé' : 'En attente',
            user.status,
            `"${user.details.school}"`,
            `"${user.details.level}"`
          ].join(',');
        } else {
          const payment = item as typeof payments[0];
          return [
            payment.id,
            `"${payment.userName}"`,
            payment.amount,
            payment.date,
            payment.method,
            payment.status === 'Completed' ? 'Complété' : 'En attente'
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const togglePaymentStatus = (id: number) => {
    setUsers(users.map(user => {
      if (user.id === id) {
        const newStatus = !user.hasPaid;
        return {
          ...user,
          hasPaid: newStatus,
          status: newStatus ? 'Actif' : 'En attente'
        };
      }
      return user;
    }));
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(user => user.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUserIds.length} utilisateur(s) ?`)) {
      setUsers(users.filter(user => !selectedUserIds.includes(user.id)));
      setSelectedUserIds([]);
    }
  };

  const toggleUserSelection = (id: number) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]);
  };
  
  const toggleAllUsers = () => {
    if (selectedUserIds.length === paginatedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map(user => user.id));
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      name: newUser.name,
      email: newUser.email,
      hasPaid: newUser.hasPaid,
      loginEnabled: newUser.loginEnabled,
      date: new Date().toISOString().split('T')[0],
      status: newUser.hasPaid ? 'Actif' : 'En attente',
      details: {
        age: parseInt(newUser.age) || 0,
        school: newUser.school || 'Non renseigné',
        level: newUser.level || 'Non renseigné',
        trimesters: [],
        bepc: { average: 0, year: 0, grades: [] },
        bac: null
      }
    };
    setUsers([user, ...users]);
    setIsAddModalOpen(false);
    setNewUser({ name: '', email: '', hasPaid: false, school: '', level: '', age: '' });
  };

  const generateTestUser = () => {
    const randomId = Math.floor(Math.random() * 10000);
    const mockSubjects = [
      { subject: 'Mathématiques', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Physique-Chimie', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'SVT', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Français', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Anglais', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Histoire-Géo', grade: Math.floor(Math.random() * 11) + 8 },
    ];
    const avg = parseFloat((mockSubjects.reduce((acc, curr) => acc + curr.grade, 0) / mockSubjects.length).toFixed(2));
    
    const testUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      name: `Utilisateur Test ${randomId}`,
      email: `test${randomId}@example.com`,
      hasPaid: true,
      loginEnabled: true,
      date: new Date().toISOString().split('T')[0],
      status: 'Actif',
      details: {
        age: 18,
        school: 'Lycée Test',
        level: 'Troisième',
        trimesters: [],
        bepc: { 
          average: avg, 
          year: new Date().getFullYear(), 
          grades: mockSubjects 
        },
        bac: null,
        analysisResult: null
      }
    };
    setUsers([testUser as any, ...users]);
  };

  const generateBacUser = () => {
    const randomId = Math.floor(Math.random() * 10000);
    const mockSubjects = [
      { subject: 'Mathématiques', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Physique-Chimie', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'SVT', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Philosophie', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Anglais', grade: Math.floor(Math.random() * 11) + 8 },
    ];
    const avg = parseFloat((mockSubjects.reduce((acc, curr) => acc + curr.grade, 0) / mockSubjects.length).toFixed(2));
    
    const mockAnalysis = {
        recommendedMajors: [
          { major: 'Génie Logiciel', score: 92, matchReason: 'Fort potentiel en sciences exactes' },
          { major: 'Mathématiques', score: 85, matchReason: 'Excellente capacité analytique' }
        ],
        successProbability: 88,
        justification: "Profil scientifique prometteur avec de bonnes aptitudes d'analyse.",
        opportunities: ["Ingénieur Logiciel", "Data Analyst"],
        employabilityRating: "Très Élevée",
        strategicAdvice: ["Participer à des projets open-source"],
        testimonials: [],
        usefulLinks: [],
        universities: {
          burkinaPublic: ["Université Joseph Ki-Zerbo"],
          burkinaPrivate: ["Aube Nouvelle", "USTA"],
          africa: [], europe: [], usa: [], asia: [], canada: []
        }
    };

    const testUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      name: `Bachelier Test ${randomId}`,
      email: `bac${randomId}@example.com`,
      hasPaid: true,
      loginEnabled: true,
      date: new Date().toISOString().split('T')[0],
      status: 'Actif',
      details: {
        age: 19,
        school: 'Lycée Test BAC',
        level: 'Terminale D',
        trimesters: [],
        bepc: {
          average: 13.5,
          year: new Date().getFullYear() - 3,
          grades: []
        },
        bac: { 
          series: 'D',
          average: avg, 
          year: new Date().getFullYear(), 
          grades: mockSubjects 
        },
        analysisResult: mockAnalysis as unknown as AnalysisResult
      }
    };
    setUsers([testUser as any, ...users]);
  };

  const generateGradesForSelectedUser = (type: 'bepc' | 'bac') => {
    if (!selectedUser) return;
    
    const mockSubjects = type === 'bepc' ? [
      { subject: 'Mathématiques', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Physique-Chimie', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'SVT', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Français', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Anglais', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Histoire-Géo', grade: Math.floor(Math.random() * 11) + 8 },
    ] : [
      { subject: 'Mathématiques', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Physique-Chimie', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'SVT', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Philosophie', grade: Math.floor(Math.random() * 11) + 8 },
      { subject: 'Anglais', grade: Math.floor(Math.random() * 11) + 8 },
    ];
    
    const avg = parseFloat((mockSubjects.reduce((acc, curr) => acc + curr.grade, 0) / mockSubjects.length).toFixed(2));
    
    const updatedUser = { ...selectedUser };
    if (type === 'bepc') {
      updatedUser.details.bepc = {
        average: avg,
        year: updatedUser.details.bepc?.year || new Date().getFullYear(),
        grades: mockSubjects
      };
    } else if (type === 'bac' && updatedUser.details.bac) {
      updatedUser.details.bac = {
        ...updatedUser.details.bac,
        average: avg,
        grades: mockSubjects
      };
    }
    
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUser(updatedUser);
  };

  const handleDownloadAnalysis = (user: typeof INITIAL_USERS[0]) => {
    if (!user.details.analysisResult) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const addTitle = (text: string) => {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin, y);
      y += 10;
    };

    const addSubtitle = (text: string) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100);
      doc.text(text, margin, y);
      doc.setTextColor(0);
      y += 7;
    };

    const addText = (text: string) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(splitText, margin, y);
      y += splitText.length * 5 + 2;
    };

    const checkPageBreak = (heightNeeded: number = 20) => {
      if (y + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = 20;
      }
    };

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229); // Indigo color
    doc.text("RAPPORT D'ORIENTATION - ORIENTEBF", pageWidth / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 15;

    // User Info
    addSubtitle("INFORMATIONS PERSONNELLES");
    addText(`Nom: ${user.name}`);
    addText(`Date: ${user.date}`);
    addText(`Etablissement: ${user.details.school}`);
    addText(`Niveau: ${user.details.level}`);
    y += 5;

    // Check if it's Post-BAC (UniversityAnalysisResult) or Post-BEPC (AnalysisResult)
    // We can check for 'recommendedMajors' which is specific to UniversityAnalysisResult
    const isPostBac = 'recommendedMajors' in user.details.analysisResult;

    if (isPostBac) {
      const result = user.details.analysisResult as unknown as UniversityAnalysisResult;

      checkPageBreak();
      addTitle("RÉSULTATS D'ANALYSE (POST-BAC)");
      
      addSubtitle("FILIÈRES RECOMMANDÉES");
      result.recommendedMajors.forEach((m, i) => {
        checkPageBreak();
        addText(`${i + 1}. ${m.major} (Score: ${m.score}/100)`);
        doc.setFont("helvetica", "italic");
        addText(`   "${m.matchReason}"`);
        doc.setFont("helvetica", "normal");
        y += 2;
      });

      checkPageBreak();
      addSubtitle("ANALYSE & PROBABILITÉS");
      addText(`Probabilité de réussite: ${result.successProbability}%`);
      addText(`Justification: ${result.justification}`);
      
      checkPageBreak();
      addSubtitle("DÉBOUCHÉS PROFESSIONNELS");
      result.opportunities.forEach(op => addText(`- ${op}`));

      checkPageBreak();
      addTitle("UNIVERSITÉS & ÉCOLES RECOMMANDÉES");

      const addUniSection = (title: string, list: string[]) => {
        if (!list || list.length === 0) return;
        checkPageBreak(list.length * 5 + 15);
        addSubtitle(title);
        list.forEach(u => addText(`- ${u}`));
        y += 3;
      };

      if (result.universities) {
        addUniSection("Burkina Faso (Public)", result.universities.burkinaPublic);
        addUniSection("Burkina Faso (Privé)", result.universities.burkinaPrivate);
        addUniSection("Afrique", result.universities.africa);
        addUniSection("Europe", result.universities.europe);
        addUniSection("USA", result.universities.usa);
        addUniSection("Asie", result.universities.asia);
        addUniSection("Canada", result.universities.canada);
      }

    } else {
      const result = user.details.analysisResult as AnalysisResult;

      checkPageBreak();
      addTitle("RÉSULTATS D'ANALYSE (POST-BEPC)");
      
      addSubtitle("SÉRIE RECOMMANDÉE");
      addText(`Série: ${result.recommendedSeries}`);
      addText(`Probabilité de succès BAC: ${result.bacSuccessProbability}%`);
      
      checkPageBreak();
      addSubtitle("MOTIVATION");
      addText(result.motivationMessage);

      checkPageBreak();
      addSubtitle("TOP 3 SÉRIES");
      result.top3Series.forEach(s => {
        addText(`- Série ${s.series}: ${s.score}/100 (${s.matchReason})`);
      });

      if (result.suitableUniversityMajors) {
        checkPageBreak();
        addSubtitle("FILIÈRES UNIVERSITAIRES ENVISAGEABLES");
        result.suitableUniversityMajors.forEach(m => addText(`- ${m}`));
      }

      if (result.futureJobOpportunities) {
        checkPageBreak();
        addSubtitle("DÉBOUCHÉS PROFESSIONNELS");
        result.futureJobOpportunities.forEach(j => addText(`- ${j}`));
      }

      checkPageBreak();
      addSubtitle("CONSEILS & RISQUES");
      addText("Conseils:");
      result.improvementTips.forEach(t => addText(`- ${t}`));
      y += 2;
      addText("Risques:");
      result.risks.forEach(r => addText(`- ${r}`));
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Généré par OrienteBF - Page ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }

    doc.save(`rapport_${user.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="container mx-auto px-4 py-12 relative">
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Console Admin</h2>
          {loadingUsers && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchRealUsers}
            disabled={loadingUsers}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button 
            onClick={onBack}
            className="text-sm font-bold text-slate-400 hover:text-indigo-600 px-4 py-2"
          >
            Retour
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Utilisateurs Total</div>
              <div className="text-2xl font-bold text-slate-900">{users.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Revenus (Est.)</div>
              <div className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.hasPaid).length * 2000} FCFA
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Taux de conversion</div>
              <div className="text-2xl font-bold text-slate-900">
                {users.length > 0 ? Math.round((users.filter(u => u.hasPaid).length / users.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'payments' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Paiements
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-amber-50 text-amber-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('institutions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'institutions' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Établissements
            </button>
            {activeTab === 'institutions' && (
              <button
                onClick={handleCleanDuplicates}
                className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase hover:bg-red-100 transition-colors border border-red-100"
              >
                Nettoyer Doublons
              </button>
            )}
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'intelligence' 
                  ? 'bg-purple-50 text-purple-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Intelligence Académique
            </button>
            <button
              onClick={() => setActiveTab('gov_sync')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'gov_sync' 
                  ? 'bg-red-50 text-red-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Opportunités Gov (Sync)
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
            {/* Search Bar - Common */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'users' ? "Rechercher un utilisateur..." : "Rechercher un paiement..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
              />
            </div>

            {/* Date Range Filters - Common */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-xs text-slate-600"
                title="Date de début"
              />
              <span className="text-slate-400">à</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-xs text-slate-600"
                title="Date de fin"
              />
            </div>

            {/* Users Actions */}
            {activeTab === 'users' && (
              <>
                <select
                  value={`${usersSortBy}-${usersSortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setUsersSortBy(by as any);
                    setUsersSortOrder(order as any);
                    setCurrentPage(1);
                  }}
                  className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-600 bg-white"
                >
                  <option value="date-desc">Plus récents d'abord</option>
                  <option value="date-asc">Plus anciens d'abord</option>
                  <option value="name-asc">Nom (A-Z)</option>
                  <option value="name-desc">Nom (Z-A)</option>
                  <option value="status-asc">Statut (A-Z)</option>
                  <option value="status-desc">Statut (Z-A)</option>
                  <option value="payment-desc">Paiement (Payés d'abord)</option>
                  <option value="payment-asc">Paiement (En attente d'abord)</option>
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-600 bg-white"
                >
                  <option value="all">Tous les paiements</option>
                  <option value="Actif">Payé</option>
                  <option value="En attente">En attente</option>
                </select>
                <select
                  value={seriesFilter}
                  onChange={(e) => {
                    setSeriesFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-600 bg-white"
                >
                  <option value="all">Toutes les séries</option>
                  {SERIES_OPTIONS.map(series => (
                    <option key={series} value={series}>Série {series}</option>
                  ))}
                </select>
                <button
                  onClick={handleExport}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Exporter les utilisateurs"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={generateTestUser}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  title="Générer un utilisateur avec des notes aléatoires pour tester"
                >
                  <Plus className="w-4 h-4" />
                  Générer Notes Test
                </button>
                <button
                  onClick={generateBacUser}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  title="Générer un utilisateur BAC"
                >
                  <Plus className="w-4 h-4" />
                  Générer BAC
                </button>
                {selectedUserIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    title={`Supprimer ${selectedUserIds.length} utilisateur(s)`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer ({selectedUserIds.length})
                  </button>
                )}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </>
            )}

            {/* Payments Actions */}
            {activeTab === 'payments' && (
              <>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-600 bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="paid">Payé</option>
                  <option value="pending">En attente</option>
                </select>
                <button 
                  onClick={handleExport}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                  title="Exporter les paiements"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'intelligence' ? (
            <div className="p-8 max-w-4xl mx-auto">
              <div className="bg-purple-50 border border-purple-100 rounded-3xl p-8 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Collecteur Académique Mondial</h3>
                    <p className="text-sm text-slate-500 font-medium">Entrez une URL ou un pays/région (France, USA, Canada, Chine, Japon...) pour parcourir le monde.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="URL (https://...) ou Région (Burkina Faso, Sénégal...)"
                      value={intelUrl}
                      onChange={(e) => setIntelUrl(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-purple-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRunIntel}
                      disabled={isIntelRunning || !intelUrl}
                      className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50 flex items-center gap-3"
                    >
                      {isIntelRunning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Explorer le Monde
                    </button>
                    <button
                      onClick={handleSyncBurkina}
                      disabled={isIntelRunning}
                      className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3"
                    >
                      <RefreshCw className={`w-4 h-4 ${isIntelRunning ? 'animate-spin' : ''}`} />
                      Sync Burkina
                    </button>
                    <button
                      onClick={async () => {
                        const randomCountries = ['France', 'USA', 'Canada', 'Chine', 'Japon', 'Allemagne', 'Sénégal', 'Côte d\'Ivoire'];
                        const country = randomCountries[Math.floor(Math.random() * randomCountries.length)];
                        setIntelUrl(country);
                        setTimeout(() => handleRunIntel(), 100);
                      }}
                      disabled={isIntelRunning}
                      className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-600/10 flex items-center gap-3"
                    >
                      <Sparkles className={`w-4 h-4 ${isIntelRunning ? 'animate-pulse' : ''}`} />
                      Sync Monde
                    </button>
                    <button
                      onClick={async () => {
                        setIsIntelRunning(true);
                        setIntelStatus('Mise à jour globale des métadonnées...');
                        try {
                          const res = await academicGatheringService.refreshAllInstitutions();
                          setIntelStatus(`Succès ! ${res.updated} établissements mis à jour.`);
                        } catch (e) {
                          setIntelStatus('Erreur lors de la mise à jour globale.');
                        } finally {
                          setIsIntelRunning(false);
                        }
                      }}
                      disabled={isIntelRunning}
                      className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/10 flex items-center gap-3"
                    >
                      <Zap className={`w-4 h-4 ${isIntelRunning ? 'animate-pulse' : ''}`} />
                      Update Métadonnées
                    </button>
                  </div>
                </div>

                {intelStatus && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-purple-700 animate-pulse">
                    <RefreshCw className="w-4 h-4" />
                    {intelStatus}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-3xl font-black text-slate-900">{intelStats.institutions}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Écoles Détectées</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-3xl font-black text-slate-900">{intelStats.programs}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filières Indexées</div>
                </div>
              </div>
            </div>
          ) : activeTab === 'gov_sync' ? (
            <div className="p-8 max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-100 rounded-3xl p-8 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg">
                    <RefreshCw className={`w-8 h-8 ${isGovSyncRunning ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Synchronisation Gouvernementale</h3>
                    <p className="text-sm text-slate-500 font-medium">Récupérez automatiquement les bourses du CIOSPB et les aides du FOSER.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-5 h-5 text-red-500" />
                        <span className="font-bold text-slate-900">CIOSPB</span>
                      </div>
                      <p className="text-xs text-slate-500">Source: https://www.ciospb.gov.bf</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-slate-900">FOSER</span>
                      </div>
                      <p className="text-xs text-slate-500">Source: https://foser.bf</p>
                    </div>
                  </div>

                  <button
                    onClick={handleGovSync}
                    disabled={isGovSyncRunning}
                    className="w-full bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-900 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isGovSyncRunning ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    Synchroniser Maintenant
                  </button>
                </div>

                {govSyncStatus && (
                  <div className="mt-6 p-4 bg-white/50 rounded-xl border border-red-100 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isGovSyncRunning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span className="text-sm font-bold text-slate-700">{govSyncStatus}</span>
                  </div>
                )}

                {govSyncResult && (
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <div className="text-2xl font-black text-emerald-600">{govSyncResult.added}</div>
                      <div className="text-[10px] font-black uppercase text-emerald-700">Nouvelles Offres</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                      <div className="text-2xl font-black text-blue-600">{govSyncResult.updated}</div>
                      <div className="text-[10px] font-black uppercase text-blue-700">Mises à Jour</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                      <div className="text-2xl font-black text-red-600">{govSyncResult.errors.length}</div>
                      <div className="text-[10px] font-black uppercase text-red-700">Erreurs</div>
                    </div>
                  </div>
                )}
                
                {govSyncResult && govSyncResult.errors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="text-xs font-black text-red-700 uppercase mb-2 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4" /> Détails des erreurs
                    </div>
                    <ul className="text-xs text-red-600 space-y-1">
                      {govSyncResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                      onChange={toggleAllUsers}
                    />
                  </th>
                  <th className="px-6 py-4">Nom</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Inscrit le</th>
                  <th className="px-6 py-4">Connexion</th>
                  <th className="px-6 py-4">Statut Compte</th>
                  <th className="px-6 py-4">Statut Paiement</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-indigo-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </td>
                    <td 
                      className="px-6 py-4 font-medium text-slate-900 cursor-pointer hover:text-indigo-600"
                      onClick={() => setSelectedUser(user)}
                    >
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[150px]">{user.email}</td>
                    <td className="px-6 py-4 text-slate-600">{user.date}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleLoginStatus(user.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          user.loginEnabled 
                            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                            : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                        }`}
                        title={user.loginEnabled ? "Désactiver la connexion" : "Activer la connexion"}
                      >
                        {user.loginEnabled ? (
                          <ToggleRightIcon className="w-6 h-6" />
                        ) : (
                          <ToggleLeftIcon className="w-6 h-6" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.status}
                        onChange={(e) => updateUserStatus(user.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border outline-none transition-all ${
                          user.status === 'Actif'
                            ? 'bg-green-50 border-green-100 text-green-700 focus:ring-green-200'
                            : 'bg-amber-50 border-amber-100 text-amber-700 focus:ring-amber-200'
                        }`}
                      >
                        <option value="Actif">Actif</option>
                        <option value="En attente">En attente</option>
                        <option value="Bloqué">Bloqué</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePaymentStatus(typeof user.id === 'string' ? parseInt(user.id) : user.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          user.hasPaid
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                        title="Cliquez pour changer le statut"
                      >
                        {user.hasPaid ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Payé
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> En attente
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownloadAnalysis(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.details.analysisResult 
                              ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50' 
                              : 'text-slate-200 cursor-not-allowed'
                          }`}
                          title="Télécharger le rapport d'analyse"
                          disabled={!user.details.analysisResult}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 font-medium p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID Transaction</th>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Méthode</th>
                  <th className="px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{payment.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{payment.userName}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{payment.amount} FCFA</td>
                    <td className="px-6 py-4 text-slate-600">{payment.date}</td>
                    <td className="px-6 py-4 text-slate-600">{payment.method}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {payment.status === 'Completed' ? 'Complété' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Aucun paiement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'institutions' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 rounded-tl-lg">École</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Ville</th>
                  <th className="px-6 py-4">Filières</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...institutions, ...mockInstitutions.filter(mi => !institutions.some(ri => ri.name === mi.name))].map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={inst.logo} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                        <span className="font-semibold text-slate-900">{inst.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{inst.type}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{inst.city}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{inst.programs?.length || inst.programsCount || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inst.isVerified
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inst.isVerified ? 'Vérifié' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded transition-colors text-sm font-medium border border-indigo-200">
                        Gérer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'notifications' && (
            <div className="p-12 text-center max-w-2xl mx-auto">
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bell className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Diffusion de Masse (Push-Sync)</h3>
               <p className="text-slate-500 mb-8 font-medium">Envoyez des alertes intelligentes à tous les utilisateurs en temps réel.</p>
               
               <form className="space-y-4 text-left" onSubmit={handleSendNotification}>
                 <div>
                   <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Titre de la notification</label>
                   <input 
                     type="text" 
                     required
                     value={notificationForm.title}
                     onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                     placeholder="Nouvelle Bourse d'excellence !"
                     className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-amber-500 transition-all font-medium"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Message</label>
                   <textarea 
                     required
                     rows={3}
                     value={notificationForm.message}
                     onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                     placeholder="Le gouvernement marocain offre 500 bourses aux étudiants burkinabè..."
                     className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-amber-500 transition-all font-medium"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cible</label>
                     <select 
                       value={notificationForm.target}
                       onChange={(e) => setNotificationForm({...notificationForm, target: e.target.value as any})}
                       className="w-full px-4 py-3 rounded-xl border border-slate-100 outline-none font-medium bg-white"
                     >
                        <option value="all">Tous les utilisateurs</option>
                        <option value="students">Élèves (3ème / Terminale)</option>
                        <option value="bacheliers">Bacheliers</option>
                        <option value="parents">Parents</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lien / Action</label>
                     <select 
                       value={notificationForm.link}
                       onChange={(e) => setNotificationForm({...notificationForm, link: e.target.value as any})}
                       className="w-full px-4 py-3 rounded-xl border border-slate-100 outline-none font-medium bg-white"
                     >
                        <option value="scholarships">Page des bourses</option>
                        <option value="marketplace">Marketplace</option>
                        <option value="hero">Page d'accueil</option>
                        <option value="project-list">Dashboard</option>
                     </select>
                   </div>
                 </div>
                 <button 
                   type="submit"
                   disabled={isSendingNotif}
                   className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-500 transition-all mt-4 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                 >
                    {isSendingNotif ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                    Diffuser la notification maintenant
                 </button>
               </form>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="text-sm text-slate-500">
            Affichage de {activeTab === 'users' ? paginatedUsers.length : paginatedPayments.length} sur {activeTab === 'users' ? filteredUsers.length : filteredPayments.length} résultats
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>
            <div className="flex gap-1">
              {Array.from({ length: activeTab === 'users' ? totalPages : paymentPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, activeTab === 'users' ? totalPages : paymentPages))}
              disabled={currentPage === (activeTab === 'users' ? totalPages : paymentPages) || (activeTab === 'users' ? totalPages : paymentPages) === 0}
              className="px-3 py-1 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Ajouter un utilisateur</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ex: Jean Kaboré"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ex: jean@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Établissement</label>
                <input
                  type="text"
                  value={newUser.school}
                  onChange={(e) => setNewUser({...newUser, school: e.target.value})}
                  className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ex: Lycée Philippe Zinda Kaboré"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Niveau</label>
                  <input
                    type="text"
                    value={newUser.level}
                    onChange={(e) => setNewUser({...newUser, level: e.target.value})}
                    className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: Terminale D"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Âge</label>
                  <input
                    type="number"
                    value={newUser.age}
                    onChange={(e) => setNewUser({...newUser, age: e.target.value})}
                    className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: 18"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasPaid"
                  checked={newUser.hasPaid}
                  onChange={(e) => setNewUser({...newUser, hasPaid: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="hasPaid" className="text-sm font-medium text-slate-700">
                  A déjà payé (2000 FCFA)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="loginEnabled"
                  checked={newUser.loginEnabled}
                  onChange={(e) => setNewUser({...newUser, loginEnabled: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="loginEnabled" className="text-sm font-medium text-slate-700">
                  Autoriser la connexion
                </label>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedUser.name}</h3>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Info Générale */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm">
                    <School className="w-4 h-4" /> Établissement
                  </div>
                  <div className="font-medium text-slate-900">{selectedUser.details.school}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm">
                    <GraduationCap className="w-4 h-4" /> Niveau
                  </div>
                  <div className="font-medium text-slate-900">{selectedUser.details.level}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm">
                    <Calendar className="w-4 h-4" /> Âge
                  </div>
                  <div className="font-medium text-slate-900">{selectedUser.details.age} ans</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm">
                    <CheckCircle className="w-4 h-4" /> Statut
                  </div>
                  <div className={`font-medium ${selectedUser.hasPaid ? 'text-green-600' : 'text-amber-600'}`}>
                    {selectedUser.status}
                  </div>
                </div>
              </div>

              {/* Trimesters */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                  Notes par Trimestre
                </h4>
                {selectedUser.details.trimesters && selectedUser.details.trimesters.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {selectedUser.details.trimesters.map((trim: any) => (
                      <div key={trim.trimester} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                          <span className="font-medium text-slate-700">Trimestre {trim.trimester}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            Moy: {trim.average}/20
                          </span>
                        </div>
                        <div className="p-3 space-y-2">
                          {trim.grades.map((g: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-slate-600">{g.subject}</span>
                              <span className="font-medium text-slate-900">{g.grade}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-sm">Aucune note trimestrielle disponible.</p>
                )}
              </div>

              {/* BEPC */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                  Résultats BEPC
                </h4>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-medium text-slate-700">Année: {selectedUser.details.bepc.year}</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                      Moyenne: {selectedUser.details.bepc.average}/20
                    </span>
                  </div>
                  <div className="p-4">
                    {selectedUser.details.bepc.grades.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedUser.details.bepc.grades.map((grade, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">{grade.subject}</span>
                            <span className="font-bold text-slate-900">{grade.grade}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <p className="text-slate-500 italic text-sm">Aucune note détaillée disponible.</p>
                        <button 
                          onClick={() => generateGradesForSelectedUser('bepc')}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs font-medium transition-colors"
                        >
                          Générer notes (Test)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BAC (if available) */}
              {selectedUser.details.bac ? (
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    Résultats BAC
                  </h4>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <span className="font-medium text-slate-700">
                        Série {selectedUser.details.bac.series} ({selectedUser.details.bac.year})
                      </span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                        Moyenne: {selectedUser.details.bac.average}/20
                      </span>
                    </div>
                    <div className="p-4">
                      {selectedUser.details.bac.grades.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedUser.details.bac.grades.map((grade: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                              <span className="text-sm text-slate-600">{grade.subject}</span>
                              <span className="font-bold text-slate-900">{grade.grade}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <p className="text-slate-500 italic text-sm">Aucune note détaillée disponible.</p>
                          <button 
                            onClick={() => generateGradesForSelectedUser('bac')}
                            className="px-3 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-medium transition-colors"
                          >
                            Générer notes (Test)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Ajouter Résultats BAC</h4>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const newBac = {
                        series: formData.get('series'),
                        year: parseInt(formData.get('year') as string),
                        average: parseFloat(formData.get('average') as string),
                        grades: [] // Simplified for now
                      };
                      
                      const updatedUser = {
                        ...selectedUser,
                        details: {
                          ...selectedUser.details,
                          bac: newBac
                        }
                      };
                      
                      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
                      setSelectedUser(updatedUser);
                    }}
                    className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Série</label>
                        <input name="series" required className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm" placeholder="Ex: D" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Année</label>
                        <input name="year" type="number" required className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm" placeholder="2023" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Moyenne</label>
                        <input name="average" type="number" step="0.01" required className="w-full rounded-lg border-slate-200 px-3 py-2 text-sm" placeholder="12.5" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                      Enregistrer le BAC
                    </button>
                  </form>
                </div>
              )}

              {/* Analysis Result */}
              {selectedUser.details.analysisResult && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                      Résultat de l'Analyse
                    </h4>
                    <button
                      onClick={() => handleDownloadAnalysis(selectedUser)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le rapport
                    </button>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm text-purple-700 font-medium mb-1">Série Recommandée</div>
                        {/* @ts-ignore */}
                        <div className="text-3xl font-bold text-slate-900">{selectedUser.details.analysisResult.recommendedSeries}</div>
                        {/* @ts-ignore */}
                        <p className="text-slate-600 text-sm mt-1">"{selectedUser.details.analysisResult.motivationMessage}"</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Probabilité Réussite</div>
                        {/* @ts-ignore */}
                        <div className="text-2xl font-bold text-slate-900">{selectedUser.details.analysisResult.bacSuccessProbability}%</div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                          {/* @ts-ignore */}
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${selectedUser.details.analysisResult.bacSuccessProbability}%` }}></div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                         <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Moyenne Projetée</div>
                         {/* @ts-ignore */}
                         <div className="text-2xl font-bold text-slate-900">{selectedUser.details.analysisResult.projectedBacAverage}/20</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
