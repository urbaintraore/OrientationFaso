/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, Footer } from './components/Layout';
import { Partners } from './components/Partners';
import { Hero } from './components/Hero';
import { SuccessStories } from './components/SuccessStories';
import { ScholarshipLanding } from './components/ScholarshipLanding';
import { UsefulLinksView } from './components/UsefulLinksView';
import { AssessmentForm } from './components/AssessmentForm';
import { PostBacForm } from './components/PostBacForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { UniversityResultsDashboard } from './components/UniversityResultsDashboard';
import { Auth } from './components/Auth';
import { Payment } from './components/Payment';
import { Methodology } from './components/Methodology';
import { AdminDashboard } from './components/AdminDashboard';
import { PricingPage } from './components/PricingPage';
import { ProjectList } from './components/ProjectList';
import { MarketplaceHub } from './components/marketplace/MarketplaceHub';
import { InstitutionDetails } from './components/marketplace/InstitutionDetails';
import { StudentMarketplace } from './components/marketplace/StudentMarketplace';
import { EstablishmentDashboard } from './components/establishment/EstablishmentDashboard';
import { ScholarshipHub } from './components/opportunities/ScholarshipHub';
import { AboutPage } from './components/AboutPage';
import { LiveChatWidget } from './components/LiveChatWidget';
import { QuizHub } from './components/quiz/QuizHub';
import { FormationsHub } from './components/FormationsHub';
import { MyAlerts } from './components/MyAlerts';
import { analyzeProfile, analyzePostBacProfile } from './services/gemini';
import { careerGatheringService } from './services/careerGatheringService';
import { StudentProfile, AnalysisResult, PostBacProfile, UniversityAnalysisResult, SavedProject, UserProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { School, GraduationCap, Building2, Sparkles, ChevronRight, Check } from 'lucide-react';

import { auth, db, requestNotificationPermission, isFirebaseConfigured } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer, collection, query, where, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

async function testFirebaseConnection() {
  if (!isFirebaseConfigured) {
    console.log("Firebase Connection: Running in Local Demo Mode (Unconfigured)");
    return;
  }
  try {
    // Attempt to fetch a non-existent doc from server to verify connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firebase Connection: OK");
  } catch (error: any) {
    if (error.message?.includes('offline') || error.code === 'unavailable') {
      console.error("Firebase is offline or unreachable. Please check network and firewall.");
    }
  }
}

type ViewState = 'hero' | 'mode-selection' | 'auth' | 'payment' | 'form-bepc' | 'form-bac' | 'results-bepc' | 'results-bac' | 'methodology' | 'admin-dashboard' | 'establishment-dashboard' | 'pricing' | 'project-list' | 'alerts' | 'marketplace' | 'student-marketplace' | 'institution-details' | 'scholarships' | 'about' | 'useful-links' | 'quiz-hub' | 'formations';

interface TourStepData {
  step: number;
  title: string;
  message: string;
  highlight: string;
  badge: string;
}

const TOUR_STEPS: TourStepData[] = [
  {
    step: 1,
    title: "Bienvenue sur OrientationBF ! 🚀",
    message: "Découvrez notre plateforme d'orientation scolaire intelligente alimentée par l'IA au Burkina Faso. Laissez-nous vous guider en 5 étapes simples !",
    highlight: "Sachez que vous pouvez quitter la visite guidée à tout moment.",
    badge: "Introduction"
  },
  {
    step: 2,
    title: "1. Profil d'Orientation Scientifique 🎯",
    message: "Saisissez vos notes scolaires pour obtenir des recommandations d'orientation personnalisées (BEPC pour le lycée, BAC pour l'université).",
    highlight: "La simulation IA estime vos chances d'admission dans chaque parcours.",
    badge: "Analyse IA"
  },
  {
    step: 3,
    title: "2. Écoles & Universités (Marketplace) 🏫",
    message: "Explorez notre répertoire intelligent de grandes écoles, universités et lycées d'excellence, au Burkina Faso comme à l'étranger.",
    highlight: "Visualisez les frais d'inscription exacts, les filières agréées CAMES et les adresses.",
    badge: "Marketplace"
  },
  {
    step: 4,
    title: "3. Sauvegarde de Projets & PDF 💾",
    message: "Retrouvez ici toutes vos fiches de recommandation générées, vos bourses d'études favorites ou universités enregistrées.",
    highlight: "Exportez-les instantanément en rapports PDF professionnels pour vos dossiers de candidature.",
    badge: "Sauvegarde"
  },
  {
    step: 5,
    title: "Prêt pour le grand départ ! 🎉",
    message: "Vous détenez maintenant toutes les clés pour prendre le contrôle de votre parcours et viser l'excellence académique !",
    highlight: "Fermez ce guide et commencez dès aujourd'hui vos simulations d'orientation.",
    badge: "C'est parti !"
  }
];

export default function App() {
  const [view, setView] = useState<ViewState>('hero');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEstablishment, setIsEstablishment] = useState(false);
  
  useEffect(() => {
    testFirebaseConnection();
  }, []);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('orientationbf_user') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('orientationbf_admin') === 'true';
  });

  const getSubscriptionDate = (userProfileData: any): Date | null => {
    if (!userProfileData?.paymentDate) return null;
    const pDate = userProfileData.paymentDate;
    if (pDate.seconds) {
      return new Date(pDate.seconds * 1000);
    } else if (pDate.toDate && typeof pDate.toDate === 'function') {
      return pDate.toDate();
    }
    return new Date(pDate);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Offline / Local Demo mode state sync
      const cachedProfile = localStorage.getItem('orientationbf_demo_user_profile');
      if (cachedProfile) {
        try {
          const profileData = JSON.parse(cachedProfile);
          
          let activeHasPaid = !!profileData.hasPaid;
          if (profileData.hasPaid && profileData.paymentDate) {
            const subDate = getSubscriptionDate(profileData);
            if (subDate) {
              const now = new Date();
              const diffTime = now.getTime() - subDate.getTime();
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              if (diffDays > 30) {
                activeHasPaid = false;
                profileData.hasPaid = false;
                profileData.paymentStatus = 'none';
                profileData.testsRunCount = 0;
                localStorage.setItem('orientationbf_demo_user_profile', JSON.stringify(profileData));
              }
            }
          }
          
          setUserProfile(profileData);
          setHasPaid(activeHasPaid);
          if (profileData.profileType === 'etablissement') {
            setIsEstablishment(true);
          }
        } catch (e) {
          console.error("Failed to parse cached profile", e);
        }
      } else if (isAuthenticated) {
        // Fallback demo profile matching the stored role state
        const isCurrentlyAdmin = localStorage.getItem('orientationbf_admin') === 'true';
        const profileData: UserProfile = {
          uid: 'demo-local-user',
          email: isCurrentlyAdmin ? 'admin@orientationbf.com' : 'demo@orientationbf.com',
          displayName: isCurrentlyAdmin ? 'Administrateur OrientationBF' : 'Utilisateur Démo',
          profileType: isCurrentlyAdmin ? 'system_admin' : 'student',
          createdAt: new Date().toISOString(),
          hasPaid: true
        };
        setUserProfile(profileData);
        setHasPaid(true);
      }
      return; // Do not use live auth listener when Firebase is not configured
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        if (user.email === 'admin@orientationbf.com' || user.email === 'urbain.traoreurb@gmail.com' || user.email === 'urbain.traore@gmail.com') {
          setIsAdmin(true);
          localStorage.setItem('orientationbf_admin', 'true');
        }

        // Fetch user profile from database
        try {
          // Request notification permission if user is logged in
          requestNotificationPermission().then(token => {
             if (token) {
               console.log("FCM Token:", token);
               // save this token to the user's profile in Firestore
               setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
             }
          });

          const profileRef = doc(db, 'users', user.uid);
          
          // Use onSnapshot for real-time profile updates (like payment validation)
          const profileUnsubscribe = onSnapshot(profileRef, async (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              
              let activeHasPaid = !!profileData.hasPaid;
              if (profileData.hasPaid && profileData.paymentDate) {
                const subDate = getSubscriptionDate(profileData);
                if (subDate) {
                  const now = new Date();
                  const diffTime = now.getTime() - subDate.getTime();
                  const diffDays = diffTime / (1000 * 60 * 60 * 24);
                  if (diffDays > 30) {
                    activeHasPaid = false;
                    console.log("Subscription expired (over 30 days). Resetting paid status.");
                    setHasPaid(false);
                    setUserProfile({ ...profileData, hasPaid: false, paymentStatus: 'none', testsRunCount: 0 });
                    try {
                      await updateDoc(profileRef, {
                        hasPaid: false,
                        paymentStatus: 'none',
                        testsRunCount: 0
                      });
                    } catch (err) {
                      console.error("Error auto-updating expired payment status in firestore", err);
                    }
                    return;
                  }
                }
              }
              
              setUserProfile(profileData);
              setHasPaid(activeHasPaid);
              if (profileData.profileType === 'etablissement') {
                setIsEstablishment(true);
              }
            }
          });

          // Check if profile exists and create if admin
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists() && (user.email === 'admin@orientationbf.com' || user.email === 'urbain.traoreurb@gmail.com' || user.email === 'urbain.traore@gmail.com')) {
            const adminProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Admin',
              profileType: 'system_admin',
              createdAt: new Date().toISOString(),
              hasPaid: true
            };
            await setDoc(profileRef, adminProfile);
          }

          return () => profileUnsubscribe();
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        // Only clear if not mock admin
        if (localStorage.getItem('orientationbf_admin') !== 'true') {
           setIsAuthenticated(false);
           setIsAdmin(false);
           setIsEstablishment(false);
           setUserProfile(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);
  const [hasPaid, setHasPaid] = useState(() => {
    return localStorage.getItem('orientationbf_haspaid') === 'true';
  });
  const [selectedMode, setSelectedMode] = useState<'bepc' | 'bac' | null>(null);

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [bepcAnalysis, setBepcAnalysis] = useState<AnalysisResult | null>(null);
  const [bepcProfile, setBepcProfile] = useState<StudentProfile | null>(null);
  const [bacAnalysis, setBacAnalysis] = useState<UniversityAnalysisResult | null>(null);
  const [bacProfile, setBacProfile] = useState<PostBacProfile | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isFirebaseConfigured && isAuthenticated && auth.currentUser) {
      const q = query(
        collection(db, 'saved_projects'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const projects: SavedProject[] = [];
        snapshot.forEach((doc) => {
          projects.push(doc.data() as SavedProject);
        });
        projects.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSavedProjects(projects);
      }, (err) => {
        console.error("Error listening to saved projects:", err);
      });
      
      return () => unsubscribe();
    } else {
      const localProjects = localStorage.getItem('orientationbf_local_saved_projects');
      if (localProjects) {
        try {
          const parsed = JSON.parse(localProjects) as SavedProject[];
          parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setSavedProjects(parsed);
        } catch (e) {
          console.error("Failed to parse local projects", e);
          setSavedProjects([]);
        }
      } else {
        setSavedProjects([]);
      }
    }
  }, [isAuthenticated, isFirebaseConfigured]);

  useEffect(() => {
    localStorage.setItem('orientationbf_user', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('orientationbf_admin', String(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem('orientationbf_haspaid', String(hasPaid));
  }, [hasPaid]);

  // Student statistics state
  const [viewedScholarshipsCount, setViewedScholarshipsCount] = useState<number>(() => {
    try {
      const viewedStr = localStorage.getItem('orientationbf_viewed_scholarships');
      if (viewedStr) {
        const parsed = JSON.parse(viewedStr);
        if (Array.isArray(parsed)) return parsed.length;
      } else {
        const initial = ["bourse-001", "bourse-002", "bourse-003"];
        localStorage.setItem('orientationbf_viewed_scholarships', JSON.stringify(initial));
        return 3;
      }
    } catch {}
    return 3;
  });

  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(() => {
    try {
      const cached = localStorage.getItem('orientationbf_local_notifications');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter((n: any) => !n.isRead).length;
        }
      }
    } catch {}
    return 3;
  });

  useEffect(() => {
    const handleViewedUpdate = () => {
      try {
        const viewedStr = localStorage.getItem('orientationbf_viewed_scholarships');
        if (viewedStr) {
          const parsed = JSON.parse(viewedStr);
          if (Array.isArray(parsed)) {
            setViewedScholarshipsCount(parsed.length);
          }
        }
      } catch (e) {
        console.error("Error reading viewed list", e);
      }
    };
    window.addEventListener('orientationbf_scholarship_viewed', handleViewedUpdate);

    const checkAlerts = () => {
      try {
        const cached = localStorage.getItem('orientationbf_local_notifications');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setActiveAlertsCount(parsed.filter((n: any) => !n.isRead).length);
          }
        }
      } catch {}
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 5450);

    return () => {
      window.removeEventListener('orientationbf_scholarship_viewed', handleViewedUpdate);
      clearInterval(interval);
    };
  }, []);

  // Guided Tour State
  const [tourStep, setTourStep] = useState<number | null>(null);

  const startGuidedTour = () => {
    setTourStep(1);
    setView('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextTourStep = () => {
    if (tourStep === null) return;
    const nextStep = tourStep + 1;
    if (nextStep > 5) {
      setTourStep(null);
      setView('hero');
    } else {
      setTourStep(nextStep);
      if (nextStep === 2) {
        setView('mode-selection');
      } else if (nextStep === 3) {
        setView('marketplace');
      } else if (nextStep === 4) {
        setView('project-list');
      } else if (nextStep === 5) {
        setView('hero');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevTourStep = () => {
    if (tourStep === null || tourStep === 1) return;
    const prevStep = tourStep - 1;
    setTourStep(prevStep);
    if (prevStep === 1) {
      setView('hero');
    } else if (prevStep === 2) {
      setView('mode-selection');
    } else if (prevStep === 3) {
      setView('marketplace');
    } else if (prevStep === 4) {
      setView('project-list');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEndTour = () => {
    setTourStep(null);
    setView('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStart = () => {
    setView('mode-selection');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePricing = () => {
    setView('pricing');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkSubAndLimit = (): { allowed: boolean; reason?: 'expired' | 'limit_reached' } => {
    if (!hasPaid) {
      return { allowed: true };
    }

    if (userProfile?.paymentDate) {
      const subDate = getSubscriptionDate(userProfile);
      if (subDate) {
        const now = new Date();
        const diffTime = now.getTime() - subDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays > 30) {
          return { allowed: false, reason: 'expired' };
        }
      }
    }

    const count = userProfile?.testsRunCount || 0;
    if (count >= 2) {
      return { allowed: false, reason: 'limit_reached' };
    }

    return { allowed: true };
  };

  const incrementTestCount = async () => {
    if (!hasPaid) return;

    const currentCount = userProfile?.testsRunCount || 0;
    const nextCount = currentCount + 1;
    
    // Update local profile state
    const updatedProfile = { ...userProfile, testsRunCount: nextCount };
    setUserProfile(updatedProfile as UserProfile);

    // Persist to DB or local storage
    if (isFirebaseConfigured && auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { testsRunCount: nextCount });
      } catch (err) {
        console.error("Error updating test run count in firestore:", err);
      }
    } else {
      localStorage.setItem('orientationbf_demo_user_profile', JSON.stringify(updatedProfile));
    }
  };

  const handleSelectMode = (mode: 'bepc' | 'bac') => {
    setSelectedMode(mode);
    setError(null);
    if (!isAuthenticated) {
      setView('auth');
    } else {
      setView(mode === 'bepc' ? 'form-bepc' : 'form-bac');
    }
  };

  const handleLogin = (email?: string, password?: string) => {
    setIsAuthenticated(true);
    setError(null);
    const cleanEmail = email?.trim().toLowerCase() || '';
    const cleanPassword = password?.trim() || '';
    const isMockAdmin = (cleanEmail === 'admin@orientationbf.com' && cleanPassword === 'admin123') || cleanEmail === 'urbain.traoreurb@gmail.com' || cleanEmail === 'urbain.traore@gmail.com';
    if (isMockAdmin) {
      setIsAdmin(true);
      localStorage.setItem('orientationbf_admin', 'true');
    }
    
    if (!isFirebaseConfigured) {
      if (isMockAdmin) {
        const adminProfile: UserProfile = {
          uid: 'demo-admin-uid',
          email: cleanEmail || 'admin@orientationbf.com',
          displayName: 'Administrateur OrientationBF',
          profileType: 'system_admin',
          createdAt: new Date().toISOString(),
          hasPaid: true
        };
        setUserProfile(adminProfile);
        localStorage.setItem('orientationbf_demo_user_profile', JSON.stringify(adminProfile));
      } else if (cleanEmail) {
        const isEtabEmail = cleanEmail.toLowerCase().includes('etab') || cleanEmail.toLowerCase().includes('school') || cleanEmail.toLowerCase().includes('universite');
        const defaultProfile: UserProfile = {
          uid: 'demo-local-user',
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          profileType: isEtabEmail ? 'etablissement' : 'student',
          createdAt: new Date().toISOString(),
          hasPaid: true
        };
        if (isEtabEmail) {
          setIsEstablishment(true);
        }
        setUserProfile(defaultProfile);
        localStorage.setItem('orientationbf_demo_user_profile', JSON.stringify(defaultProfile));
      }
    }
    
    if (selectedMode) {
      setView(selectedMode === 'bepc' ? 'form-bepc' : 'form-bac');
    } else {
      setView('mode-selection');
    }
  };

  const handlePaymentComplete = () => {
    setHasPaid(true);
    setError(null);
    if (selectedMode === 'bepc' && bepcAnalysis) {
      setView('results-bepc');
    } else if (selectedMode === 'bac' && bacAnalysis) {
      setView('results-bac');
    } else {
      setView(selectedMode === 'bepc' ? 'form-bepc' : 'form-bac');
    }
  };

  const handleBepcSubmit = async (profile: StudentProfile) => {
    console.log("Starting BEPC analysis for profile:", profile);
    setError(null);
    
    // Check subscription & limit
    const subCheck = checkSubAndLimit();
    if (!subCheck.allowed) {
      if (subCheck.reason === 'expired') {
        setError("Votre abonnement de 30 jours a expiré. Veuillez le renouveler pour continuer à générer des analyses d'orientation scolaires.");
      } else {
        setError("🔒 Limite d'orientation atteinte (2 tests maximum par abonnement) : Chaque abonnement de 30 jours donne droit à un maximum de deux (2) analyses d'orientation d'élèves différents. Afin de prévenir le partage abusif de compte, veuillez renouveler votre abonnement pour tester d'autres profils. Vos précédents tests restent consultables gratuitement dans votre 'Espace Projets'.");
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    setBepcProfile(profile);
    try {
      const result = await analyzeProfile(profile);
      console.log("BEPC Analysis result received:", result);
      
      // Increment test count upon successful analysis
      await incrementTestCount();
      
      setBepcAnalysis(result);
      setView('results-bepc');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("BEPC Analysis failed:", error);
      setError(error.message || "Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBacSubmit = async (profile: PostBacProfile) => {
    console.log("Starting BAC analysis for profile:", profile);
    setError(null);

    // Check subscription & limit
    const subCheck = checkSubAndLimit();
    if (!subCheck.allowed) {
      if (subCheck.reason === 'expired') {
        setError("Votre abonnement de 30 jours a expiré. Veuillez le renouveler pour continuer à générer des analyses d'orientation scolaires.");
      } else {
        setError("🔒 Limite d'orientation atteinte (2 tests maximum par abonnement) : Chaque abonnement de 30 jours donne droit à un maximum de deux (2) analyses d'orientation d'élèves différents. Afin de prévenir le partage abusif de compte, veuillez renouveler votre abonnement pour tester d'autres profils. Vos précédents tests restent consultables gratuitement dans votre 'Espace Projets'.");
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    setBacProfile(profile);
    try {
      // Fetch careers from DB to use as context for AI
      let dbCareersContext = '';
      try {
        const careers = await careerGatheringService.getOpportunities();
        if (careers.length > 0) {
          dbCareersContext = JSON.stringify(careers.map(c => ({
            title: c.title,
            organization: c.organization,
            status: c.status,
            compatibleFields: c.compatibleFields
          })));
        }
      } catch (e) {
        console.warn("Could not fetch careers context", e);
      }

      const result = await analyzePostBacProfile(profile, dbCareersContext);
      console.log("BAC Analysis result received:", result);
      
      // Increment test count upon successful analysis
      await incrementTestCount();
      
      setBacAnalysis(result);
      setView('results-bac');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("BAC Analysis failed:", error);
      setError(error.message || "Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setBepcAnalysis(null);
    setBepcProfile(null);
    setBacAnalysis(null);
    setBacProfile(null);
    // Optional: Reset auth/payment if you want them to go through it again
    // setIsAuthenticated(false);
    // setHasPaid(false);
    setView('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsEstablishment(false);
    setHasPaid(false);
    setUserProfile(null);
    localStorage.removeItem('orientationbf_admin');
    localStorage.removeItem('orientationbf_user');
    localStorage.removeItem('orientationbf_demo_user_profile');
    setView('hero');
  };

  const handleSaveProject = async () => {
    setIsLoading(true);
    const projectId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    
    // Determine user ID
    const userId = (isFirebaseConfigured && auth.currentUser)
      ? auth.currentUser.uid
      : (userProfile?.uid || 'demo-local-user');

    const newProject: SavedProject = {
      id: projectId,
      userId: userId,
      type: selectedMode || 'bepc',
      name: `Projet ${selectedMode === 'bepc' ? 'BEPC' : 'BAC'} - ${new Date().toLocaleDateString('fr-FR')}`,
      date: new Date().toISOString(),
      profile: (selectedMode === 'bepc' ? bepcProfile : bacProfile)!,
      result: (selectedMode === 'bepc' ? bepcAnalysis : bacAnalysis)!
    };

    try {
      if (isFirebaseConfigured && auth.currentUser) {
        await setDoc(doc(db, 'saved_projects', projectId), newProject);
      }
      
      // Always store in localStorage as safety / offline fallback
      const localStr = localStorage.getItem('orientationbf_local_saved_projects');
      let localProjects: SavedProject[] = [];
      if (localStr) {
        try {
          localProjects = JSON.parse(localStr);
        } catch (e) {
          console.error("Error parsing local projects in handleSaveProject", e);
        }
      }
      localProjects.unshift(newProject);
      localStorage.setItem('orientationbf_local_saved_projects', JSON.stringify(localProjects));

      // Synchronize in-memory state for local testing/demo fallback instantly
      if (!isFirebaseConfigured || !auth.currentUser) {
        setSavedProjects(localProjects);
      }

      alert('Projet sauvegardé avec succès !');
      setView('project-list');
    } catch (error) {
      console.error("Error saving project:", error);
      alert('Erreur lors de la sauvegarde du projet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      if (isFirebaseConfigured && auth.currentUser) {
        await deleteDoc(doc(db, 'saved_projects', projectId));
      }
      
      const localStr = localStorage.getItem('orientationbf_local_saved_projects');
      if (localStr) {
        try {
          const localProjects = JSON.parse(localStr) as SavedProject[];
          const filtered = localProjects.filter(p => p.id !== projectId);
          localStorage.setItem('orientationbf_local_saved_projects', JSON.stringify(filtered));
          
          if (!isFirebaseConfigured || !auth.currentUser) {
            setSavedProjects(filtered);
          }
        } catch (e) {
          console.error("Failed to parse local projects on delete", e);
        }
      }
      alert('Projet supprimé avec succès !');
    } catch (error) {
      console.error("Error deleting project:", error);
      alert('Erreur lors de la suppression du projet.');
    }
  };

  const handleSelectProject = (project: SavedProject) => {
    if (project.type === 'bepc') {
      setBepcProfile(project.profile as StudentProfile);
      setBepcAnalysis(project.result as AnalysisResult);
      setSelectedMode('bepc');
      setView('results-bepc');
    } else {
      setBacProfile(project.profile as PostBacProfile);
      setBacAnalysis(project.result as UniversityAnalysisResult);
      setSelectedMode('bac');
      setView('results-bac');
    }
  };

  const handleNewProject = () => {
    setView('mode-selection');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header 
        onStart={handleStart} 
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        isEstablishment={isEstablishment}
        onLogin={() => setView('auth')}
        onLogout={handleLogout}
        onPricing={handlePricing}
        onProjects={() => setView('project-list')}
        onAlerts={() => setView('alerts')}
        onMarketplace={() => setView('marketplace')}
        onStudentMarketplace={() => setView('student-marketplace')}
        onScholarships={() => setView('scholarships')}
        onUsefulLinks={() => setView('useful-links')}
        onAdmin={() => setView('admin-dashboard')}
        onEstablishmentDashboard={() => setView('establishment-dashboard')}
        onAbout={() => setView('about')}
        onQuizHub={() => setView('quiz-hub')}
        onFormations={() => setView('formations')}
      />
      
      <main className="flex-grow relative">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-slate-900">Analyse en cours...</h3>
              <p className="text-slate-600">Nos algorithmes étudient ton profil.</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'hero' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero 
                onStart={handleStart} 
                savedProjectsCount={savedProjects.length}
                viewedScholarshipsCount={viewedScholarshipsCount}
                activeAlertsCount={activeAlertsCount}
                onStartTour={startGuidedTour}
              />
              <Partners />
              <SuccessStories />
              <ScholarshipLanding onExplore={(query) => {
                setView('scholarships');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} />
            </motion.div>
          )}

          {view === 'useful-links' && (
            <motion.div
              key="useful-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UsefulLinksView />
            </motion.div>
          )}

          {view === 'establishment-dashboard' && (
            <motion.div
              key="establishment-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EstablishmentDashboard onBack={handleReset} />
            </motion.div>
          )}

          {view === 'mode-selection' && (
            <motion.div
              key="mode-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-20"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Quel est ton niveau actuel ?</h2>
                <p className="text-slate-600">Choisis ton niveau pour obtenir une orientation adaptée.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <button
                  onClick={() => handleSelectMode('bepc')}
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 border border-slate-100 text-left h-full"
                >
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <School className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Après le BEPC</h3>
                  <p className="text-slate-600 mb-6">
                    Tu viens d'obtenir ton BEPC ? Découvre quelle série (A, C, D, E, F, G) est faite pour toi.
                  </p>
                  <span className="text-indigo-600 font-medium group-hover:translate-x-1 transition-transform inline-block">
                    Choisir l'orientation Lycée →
                  </span>
                </button>

                <button
                  onClick={() => handleSelectMode('bac')}
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 border border-slate-100 text-left h-full"
                >
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Après le BAC</h3>
                  <p className="text-slate-600 mb-6">
                    Tu as ton BAC en poche ? Trouve la filière universitaire idéale pour ton avenir professionnel.
                  </p>
                  <span className="text-emerald-600 font-medium group-hover:translate-x-1 transition-transform inline-block">
                    Choisir l'orientation Université →
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (isAuthenticated && (isEstablishment || isAdmin)) {
                      setView('establishment-dashboard');
                    } else {
                      setView('auth');
                    }
                  }}
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 border border-slate-100 text-left h-full"
                >
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">E-Portail</h3>
                  <p className="text-slate-600 mb-6">
                    Espace réservé aux établissements d'enseignement pour gérer leurs filières et communiquer avec les élèves.
                  </p>
                  <span className="text-amber-600 font-medium group-hover:translate-x-1 transition-transform inline-block">
                    Accéder au portail →
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-12"
            >
              <Auth onLogin={handleLogin} />
            </motion.div>
          )}

          {view === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-12"
            >
              <Payment onPaymentComplete={handlePaymentComplete} />
            </motion.div>
          )}

          {view === 'form-bepc' && (
            <motion.div
              key="form-bepc"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-12"
            >
              <div className="mb-8 text-center">
                <button onClick={() => setView('mode-selection')} className="text-sm text-slate-500 hover:text-indigo-600 mb-4">← Retour au choix</button>
                <h2 className="text-3xl font-bold text-slate-900">Orientation Post-BEPC</h2>
                <p className="text-slate-600">Analyse de ton profil pour le choix de la série au lycée.</p>
              </div>
              <AssessmentForm onSubmit={handleBepcSubmit} isLoading={isLoading} />
            </motion.div>
          )}

          {view === 'form-bac' && (
            <motion.div
              key="form-bac"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container mx-auto px-4 py-12"
            >
              <div className="mb-8 text-center">
                <button onClick={() => setView('mode-selection')} className="text-sm text-slate-500 hover:text-indigo-600 mb-4">← Retour au choix</button>
                <h2 className="text-3xl font-bold text-slate-900">Orientation Post-BAC</h2>
                <p className="text-slate-600">Analyse de ton profil pour le choix de la filière universitaire.</p>
              </div>
              <PostBacForm onSubmit={handleBacSubmit} isLoading={isLoading} />
            </motion.div>
          )}

          {view === 'results-bepc' && bepcAnalysis && (
            <motion.div
              key="results-bepc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-4 py-12"
            >
              <ResultsDashboard 
                result={bepcAnalysis} 
                profile={bepcProfile} 
                onReset={handleReset} 
                hasPaid={hasPaid}
                onUpgrade={() => setView('payment')}
                onSave={handleSaveProject}
              />
            </motion.div>
          )}

          {view === 'results-bac' && bacAnalysis && (
            <motion.div
              key="results-bac"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-4 py-12"
            >
              <UniversityResultsDashboard 
                result={bacAnalysis} 
                profile={bacProfile} 
                onReset={handleReset} 
                hasPaid={hasPaid}
                onUpgrade={() => setView('payment')}
                onSave={handleSaveProject}
              />
            </motion.div>
          )}

          {view === 'project-list' && (
            <motion.div
              key="project-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProjectList 
                projects={savedProjects}
                onSelectProject={handleSelectProject}
                onDeleteProject={handleDeleteProject}
                onNewProject={handleNewProject}
              />
            </motion.div>
          )}

          {view === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MyAlerts />
            </motion.div>
          )}

          {view === 'methodology' && (
            <motion.div
              key="methodology"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Methodology onBack={() => setView('hero')} />
            </motion.div>
          )}

          {view === 'admin-dashboard' && isAdmin && (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard onBack={() => setView('hero')} />
            </motion.div>
          )}

          {view === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PricingPage onStart={handleStart} />
            </motion.div>
          )}

          {view === 'marketplace' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MarketplaceHub 
                isAdmin={isAdmin}
                onSelectInstitution={(id) => {
                  setSelectedInstitutionId(id);
                  setView('institution-details');
                }}
              />
            </motion.div>
          )}

          {view === 'student-marketplace' && (
            <motion.div
              key="student-marketplace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StudentMarketplace onLogin={() => setView('auth')} />
            </motion.div>
          )}

          {view === 'institution-details' && selectedInstitutionId && (
            <motion.div
              key="institution-details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InstitutionDetails 
                institutionId={selectedInstitutionId}
                onBack={() => setView('marketplace')}
              />
            </motion.div>
          )}

          {view === 'scholarships' && (
            <motion.div
              key="scholarships"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScholarshipHub 
                isAdmin={isAdmin} 
                userProfile={selectedMode === 'bepc' ? bepcProfile : (selectedMode === 'bac' ? bacProfile : null)}
              />
            </motion.div>
          )}

          {view === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AboutPage />
            </motion.div>
          )}

          {view === 'quiz-hub' && (
            <motion.div
              key="quiz-hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuizHub 
                onBack={() => {
                  setView('hero');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                userEmail={userProfile?.email || undefined}
              />
            </motion.div>
          )}

          {view === 'formations' && (
            <motion.div
              key="formations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FormationsHub 
                userProfile={userProfile}
                isAdmin={isAdmin}
                isEstablishment={isEstablishment}
                onBackToHero={() => setView('hero')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer 
        isAdmin={isAdmin}
        onOpenMethodology={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setView('methodology');
        }}
        onOpenAdmin={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setView('admin-dashboard');
        }}
      />

      {/* Live Chat & Support Support Widgets */}
      <LiveChatWidget />

      {/* Visite Guidée (Tour) Widget Overlay */}
      {tourStep !== null && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-24 right-6 z-50 max-w-sm w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-indigo-500 p-6 shadow-indigo-150/40 dark:shadow-none transition-all duration-300"
          style={{ animation: 'bounce 2.5s infinite' }}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <span className="px-2.5 py-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest rounded-lg">
              {TOUR_STEPS[tourStep - 1]?.badge || "Visite"}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-bold font-mono">
              <span>{tourStep}</span>
              <span>/</span>
              <span>5</span>
            </div>
          </div>

          <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            {TOUR_STEPS[tourStep - 1]?.title}
          </h4>

          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-3">
            {TOUR_STEPS[tourStep - 1]?.message}
          </p>

          <div className="p-3 bg-indigo-50/40 dark:bg-slate-950 rounded-xl mb-4 border border-indigo-100/50 dark:border-slate-850">
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-snug">
              ℹ️ {TOUR_STEPS[tourStep - 1]?.highlight}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              onClick={handleEndTour}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Fermer
            </button>
            
            <div className="flex gap-2">
              {tourStep > 1 && (
                <button
                  onClick={handlePrevTourStep}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  Précédent
                </button>
              )}
              
              <button
                onClick={handleNextTourStep}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-1"
              >
                {tourStep === 5 ? "Terminer" : "Suivant"}
                {tourStep < 5 && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/22663375257"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 p-4 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
        title="Contactez-nous sur WhatsApp"
      >
        <svg 
          viewBox="0 0 24 24" 
          width="24" 
          height="24" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 whitespace-nowrap font-bold text-sm">
          Aide WhatsApp
        </span>
      </a>
    </div>
  );
}
