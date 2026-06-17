import React, { useState, useEffect } from 'react';
import { AppNotification, notificationService } from '../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Trash2, CheckCircle, Circle, Eye, EyeOff, Calendar, GraduationCap, Award, Search, Info } from 'lucide-react';

export function MyAlerts() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const cachedFb = localStorage.getItem('orientationbf_cached_firebase_notifications');
      if (cachedFb) return JSON.parse(cachedFb);
      const cachedLocal = localStorage.getItem('orientationbf_local_notifications');
      if (cachedLocal) return JSON.parse(cachedLocal);
    } catch {}
    return [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'scholarship' | 'news'>('all');

  useEffect(() => {
    const unsubscribe = notificationService.listenToNotifications((notifs) => {
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleRead = async (id: string, currentStatus: boolean) => {
    await notificationService.markAsRead(id, !currentStatus);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette alerte ?")) {
      await notificationService.deleteNotification(id);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const notif of unread) {
      await notificationService.markAsRead(notif.id, true);
    }
    alert("Toutes les alertes ont été marquées comme lues.");
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'scholarship':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-100 dark:border-amber-900/50">
            <GraduationCap className="w-3.5 h-3.5" /> Bourse
          </span>
        );
      case 'news':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-full border border-indigo-100 dark:border-indigo-900/50">
            <Award className="w-3.5 h-3.5" /> Concours
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700">
            <Info className="w-3.5 h-3.5" /> Info
          </span>
        );
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesReadStatus = activeFilter === 'all' || 
                              (activeFilter === 'unread' && !notif.isRead) || 
                              (activeFilter === 'read' && notif.isRead);

    const matchesCategory = categoryFilter === 'all' || notif.category === categoryFilter;

    return matchesSearch && matchesReadStatus && matchesCategory;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container mx-auto px-4 py-12 min-h-[70vh]">
      <div className="max-w-4xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-indigo-600 dark:text-indigo-500 animate-pulse" />
              Mes Alertes Officielles
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {unreadCount > 0 
                ? `Tu as ${unreadCount} nouvelle(s) alerte(s) non lue(s) concernant les bourses et les concours au Burkina Faso.`
                : 'Toutes tes alertes sont à jour !'
              }
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm border border-indigo-100 dark:border-indigo-900"
            >
              <CheckCircle className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une bourse, un concours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Read/Unread Tabs */}
            <div className="flex bg-slate-50 dark:bg-slate-850 p-1 rounded-xl border border-slate-100 dark:border-slate-800 self-start md:self-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeFilter === 'all' ? 'bg-white dark:bg-slate-850 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeFilter === 'unread' ? 'bg-white dark:bg-slate-850 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Non lues ({notifications.filter(n => !n.isRead).length})
              </button>
              <button
                onClick={() => setActiveFilter('read')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeFilter === 'read' ? 'bg-white dark:bg-slate-850 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Lues ({notifications.filter(n => n.isRead).length})
              </button>
            </div>
          </div>

          {/* Category Quick Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2">Catégorie :</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${categoryFilter === 'all' ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'bg-slate-55 hover:bg-slate-100 text-slate-600 dark:text-slate-400 bg-slate-100/50'}`}
            >
              Toutes
            </button>
            <button
              onClick={() => setCategoryFilter('scholarship')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${categoryFilter === 'scholarship' ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-400 bg-slate-100/50 hover:bg-amber-50/50'}`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Bourses
            </button>
            <button
              onClick={() => setCategoryFilter('news')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${categoryFilter === 'news' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 bg-slate-100/50 hover:bg-indigo-50/50'}`}
            >
              <Award className="w-3.5 h-3.5" /> Concours
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="inline-flex items-center justify-center p-3.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Aucune alerte trouvée</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-1">Examine tes critères de recherche ou détends-toi, plus d'alertes viendront bientôt !</p>
              </motion.div>
            ) : (
              filteredNotifications.map((notif) => {
                const formattedDate = notif.createdAt 
                  ? typeof notif.createdAt === 'string' 
                    ? new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : notif.createdAt.toDate 
                      ? notif.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Récemment';

                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-6 rounded-2xl border transition-all ${
                      notif.isRead 
                        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-90' 
                        : 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100/40 dark:border-indigo-900/40 shadow-sm relative overflow-hidden'
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 dark:bg-indigo-500" />
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        {/* Title and Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          {getCategoryBadge(notif.category)}
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formattedDate}
                          </div>
                        </div>

                        {/* Text and Title */}
                        <h3 className={`text-lg font-bold dark:text-white ${notif.isRead ? 'text-slate-700' : 'text-slate-900 font-extrabold'}`}>
                          {notif.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {notif.message}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-start">
                        {/* Toggle Read */}
                        <button
                          onClick={() => handleToggleRead(notif.id, !!notif.isRead)}
                          className={`p-2 rounded-xl transition-all ${
                            notif.isRead 
                              ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800' 
                              : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                          }`}
                          title={notif.isRead ? "Marquer comme non lue" : "Marquer comme lue"}
                        >
                          {notif.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                          title="Supprimer cette alerte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
