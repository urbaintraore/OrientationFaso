/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, Footer } from './components/Layout';
import { Partners } from './components/Partners';
import { Hero } from './components/Hero';
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
import { EstablishmentDashboard } from './components/establishment/EstablishmentDashboard';
import { ScholarshipIntelligence } from './components/ScholarshipIntelligence';
import { AboutPage } from './components/AboutPage';
import { analyzeProfile, analyzePostBacProfile } from './services/gemini';
import { StudentProfile, AnalysisResult, PostBacProfile, UniversityAnalysisResult, SavedProject, UserProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { School, GraduationCap } from 'lucide-react';

import { auth, db, requestNotificationPermission } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer, collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';

async function testFirebaseConnection() {
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

type ViewState = 'hero' | 'mode-selection' | 'auth' | 'payment' | 'form-bepc' | 'form-bac' | 'results-bepc' | 'results-bac' | 'methodology' | 'admin-dashboard' | 'establishment-dashboard' | 'pricing' | 'project-list' | 'marketplace' | 'institution-details' | 'scholarships' | 'about';

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

  useEffect(() => {
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
               // You would typically save this token to the user's profile in Firestore here
               setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
             }
          });

          const profileRef = doc(db, 'users', user.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const profileData = profileSnap.data() as UserProfile;
            setUserProfile(profileData);
            if (profileData.profileType === 'etablissement') {
              setIsEstablishment(true);
            }
          } else if (user.email === 'admin@orientationbf.com' || user.email === 'urbain.traoreurb@gmail.com' || user.email === 'urbain.traore@gmail.com') {
            // Auto-create missing admin profile
            const adminProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Admin',
              profileType: 'system_admin',
              createdAt: new Date().toISOString()
            };
            await setDoc(profileRef, adminProfile);
            setUserProfile(adminProfile);
          }
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
    if (isAuthenticated && auth.currentUser) {
      const q = query(
        collection(db, 'saved_projects'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const projects: SavedProject[] = [];
        snapshot.forEach((doc) => {
          projects.push(doc.data() as SavedProject);
        });
        setSavedProjects(projects);
      }, (err) => {
        console.error("Error listening to saved projects:", err);
      });
      
      return () => unsubscribe();
    } else {
      setSavedProjects([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('orientationbf_user', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('orientationbf_admin', String(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem('orientationbf_haspaid', String(hasPaid));
  }, [hasPaid]);

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
    if ((email === 'admin@orientationbf.com' && password === 'admin123') || email === 'urbain.traoreurb@gmail.com' || email === 'urbain.traore@gmail.com') {
      setIsAdmin(true);
      localStorage.setItem('orientationbf_admin', 'true');
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
    setIsLoading(true);
    setError(null);
    setBepcProfile(profile);
    try {
      const result = await analyzeProfile(profile);
      console.log("BEPC Analysis result received:", result);
      setBepcAnalysis(result);
      setView('results-bepc');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("BEPC Analysis failed:", error);
      setError("Une erreur est survenue lors de l'analyse. Veuillez réessayer ou vérifier votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBacSubmit = async (profile: PostBacProfile) => {
    console.log("Starting BAC analysis for profile:", profile);
    setIsLoading(true);
    setError(null);
    setBacProfile(profile);
    try {
      const result = await analyzePostBacProfile(profile);
      console.log("BAC Analysis result received:", result);
      setBacAnalysis(result);
      setView('results-bac');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("BAC Analysis failed:", error);
      setError("Une erreur est survenue lors de l'analyse. Veuillez réessayer ou vérifier votre connexion.");
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
    setView('hero');
  };

  const handleSaveProject = async () => {
    if (!isAuthenticated || !auth.currentUser) {
      setView('auth');
      return;
    }

    setIsLoading(true);
    const projectId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const newProject: SavedProject = {
      id: projectId,
      userId: auth.currentUser.uid,
      type: selectedMode || 'bepc',
      name: `Projet ${selectedMode === 'bepc' ? 'BEPC' : 'BAC'} - ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      profile: (selectedMode === 'bepc' ? bepcProfile : bacProfile)!,
      result: (selectedMode === 'bepc' ? bepcAnalysis : bacAnalysis)!
    };

    try {
      await setDoc(doc(db, 'saved_projects', projectId), newProject);
      alert('Projet sauvegardé avec succès !');
    } catch (error) {
      console.error("Error saving project:", error);
      alert('Erreur lors de la sauvegarde du projet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'saved_projects', projectId));
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
        onMarketplace={() => setView('marketplace')}
        onScholarships={() => setView('scholarships')}
        onAdmin={() => setView('admin-dashboard')}
        onEstablishmentDashboard={() => setView('establishment-dashboard')}
        onAbout={() => setView('about')}
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
              <Hero onStart={handleStart} />
              <Partners />
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
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <button
                  onClick={() => handleSelectMode('bepc')}
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 border border-slate-100 text-left"
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
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 border border-slate-100 text-left"
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
              <ScholarshipIntelligence 
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
    </div>
  );
}
