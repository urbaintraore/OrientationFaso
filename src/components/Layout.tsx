import React, { useState, useEffect } from 'react';
import { BookOpen, LineChart, Building2, Bell, X, ExternalLink, Menu, Info, GraduationCap, School, CreditCard } from 'lucide-react';
import { Logo } from './Logo';
import { notificationService, AppNotification } from '../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onStart?: () => void;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onPricing?: () => void;
  onProjects?: () => void;
  onMarketplace?: () => void;
  onScholarships?: () => void;
  onAdmin?: () => void;
  onEstablishmentDashboard?: () => void;
  onAbout?: () => void;
  isEstablishment?: boolean;
}

export function Header({ onStart, isAuthenticated, isAdmin, isEstablishment, onLogin, onLogout, onPricing, onProjects, onMarketplace, onScholarships, onAdmin, onEstablishmentDashboard, onAbout }: HeaderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = notificationService.listenToNotifications((notifs) => {
        setNotifications(notifs);
        setUnreadCount(notifs.length); // For now, treat all as new for demo
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onStart}>
          <Logo className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight text-slate-900">OrientationBF</span>
          {isAdmin && (
            <span className="ml-2 px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-full border border-rose-100">
              Admin
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={onAbout} className="hover:text-indigo-600 transition-colors">
            À Propos
          </button>
          <button onClick={onScholarships} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
            <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black uppercase font-black">Plus</span>
            Bourses & Aides
          </button>
          <button onClick={onMarketplace} className="hover:text-indigo-600 transition-colors">
            Écoles & Universités
          </button>
          <button onClick={onPricing} className="hover:text-indigo-600 transition-colors">
            Nos Offres
          </button>
          {(isEstablishment || isAdmin) && (
            <button onClick={onEstablishmentDashboard} className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl transition-all">
              <Building2 className="w-4 h-4" />
              E-Portail
            </button>
          )}
          {isAuthenticated && (
            <button onClick={onProjects} className="hover:text-indigo-600 transition-colors flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Mes Projets
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          {isAuthenticated && (
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  setUnreadCount(0);
                }}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Notifications</span>
                      <button onClick={() => setShowNotifs(false)}><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                          Aucune notification pour le moment.
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                notif.category === 'scholarship' ? 'bg-amber-100 text-amber-700' : 
                                notif.category === 'news' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {notif.category}
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold">
                                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Récemment'}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 mb-1">{notif.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isAdmin && (
            <button onClick={onAdmin} className="hidden md:flex text-rose-600 hover:bg-rose-50 p-2 rounded-full transition-colors" title="Admin">
              <LineChart className="w-5 h-5" />
            </button>
          )}

          {isAuthenticated ? (
            <button 
              onClick={onLogout}
              className="hidden md:block text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors px-2"
            >
              Quitter
            </button>
          ) : (
            <button 
              onClick={onLogin}
              className="hidden md:block text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Connexion
            </button>
          )}
          
          <button 
            onClick={onStart}
            className="hidden sm:block rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
          >
            S'orienter
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={toggleMobileMenu}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-2">
              <button 
                onClick={() => { onAbout?.(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors"
              >
                <Info className="w-4 h-4 text-slate-400" />
                À Propos
              </button>
              <button 
                onClick={() => { onMarketplace?.(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors"
              >
                <School className="w-4 h-4 text-slate-400" />
                Écoles & Universités
              </button>
              <button 
                onClick={() => { onScholarships?.(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                Bourses & Aides
              </button>
              <button 
                onClick={() => { onPricing?.(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                Nos Offres
              </button>

              {isAdmin && (
                <button 
                  onClick={() => { onAdmin?.(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm transition-colors"
                >
                  <LineChart className="w-4 h-4" />
                  Administration
                </button>
              )}

              {(isEstablishment || isAdmin) && (
                <button 
                  onClick={() => { onEstablishmentDashboard?.(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  E-Portail
                </button>
              )}

              <div className="pt-4 border-t border-slate-50 flex gap-2">
                {!isAuthenticated ? (
                  <>
                    <button 
                      onClick={() => { onLogin?.(); setIsMobileMenuOpen(false); }}
                      className="flex-1 py-3 rounded-xl text-center text-sm font-black uppercase tracking-widest text-indigo-600 border border-indigo-100"
                    >
                      Connexion
                    </button>
                    <button 
                      onClick={() => { onStart?.(); setIsMobileMenuOpen(false); }}
                      className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-center text-sm font-black uppercase tracking-widest shadow-lg"
                    >
                      Démarrer
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { onLogout?.(); setIsMobileMenuOpen(false); }}
                    className="w-full py-3 rounded-xl text-center text-sm font-black uppercase tracking-widest text-rose-600 bg-rose-50"
                  >
                    Déconnexion
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

interface FooterProps {
  onOpenMethodology?: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}

export function Footer({ onOpenMethodology, onOpenAdmin, isAdmin }: FooterProps) {
  const toggleAdmin = () => {
    const newState = !isAdmin;
    localStorage.setItem('orientationbf_admin', String(newState));
    window.location.reload();
  };

  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="container mx-auto px-4 text-center text-slate-500">
        <div className="flex flex-col items-center gap-4 mb-8">
          <button 
            onClick={toggleAdmin}
            className="text-[10px] uppercase tracking-widest font-black text-slate-300 hover:text-indigo-400 transition-colors"
          >
            {isAdmin ? "Désactiver Mode Admin" : "Activer Mode Admin (Debug)"}
          </button>
        </div>
        <p className="mb-4 text-sm">
          © {new Date().getFullYear()} OrientationBF. Plateforme d'aide à la décision pour l'orientation post-BEPC.
        </p>
        
        {isAdmin && (
          <div className="flex justify-center gap-4 mb-6 text-sm">
            {onOpenMethodology && (
              <button 
                onClick={onOpenMethodology}
                className="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Modèles mathématiques
              </button>
            )}
            <span className="text-slate-300">|</span>
            {onOpenAdmin && (
              <button 
                onClick={onOpenAdmin}
                className="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Tableau de bord Admin
              </button>
            )}
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Logo className="h-6 w-6 opacity-50 grayscale" />
          <BookOpen className="h-5 w-5 opacity-50" />
          <LineChart className="h-5 w-5 opacity-50" />
        </div>
      </div>
    </footer>
  );
}
