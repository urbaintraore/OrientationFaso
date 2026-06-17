import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'scholarship' | 'news' | 'system' | 'establishment';
  link?: string;
  target?: 'all' | 'students' | 'parents' | 'bacheliers';
  createdAt: any;
  isRead?: boolean;
}

const DEFAULT_LOCAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Bourse Nationale 2026 Débutée',
    message: 'Le Ministère de l\'Enseignement Supérieur (MESS) annonce l\'ouverture des candidatures pour la bourse nationale d\'études universitaires au Burkina Faso. Date limite : 31 Juillet 2026.',
    category: 'scholarship',
    createdAt: new Date().toISOString(),
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'Concours Direct d\'entrée à l\'ENAREF',
    message: 'Les inscriptions au concours d\'accès à l\'École Nationale des Régies Financières (ENAREF) pour les bacheliers sont officiellement lancées. 120 places disponibles.',
    category: 'news',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'Offre Mobilité - Bourse d\'excellence du CIOSPB',
    message: 'Le CIOSPB recrute des lauréats du Baccalauréat pour l\'attribution de bourses d\'études d\'excellence au Maroc, en Tunisie et au Sénégal. Examinez les critères.',
    category: 'scholarship',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
    isRead: true
  },
  {
    id: 'notif-4',
    title: 'Concours des Professeurs d\'Écoles (EP)',
    message: 'Le dépôt des dossiers physiques pour le concours de recrutement d\'élèves-professeurs d\'écoles primaires au Burkina Faso se poursuit dans les chefs-lieux de région.',
    category: 'news',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    isRead: false
  }
];

export const notificationService = {
  getNotificationsFromLocalStorage(): AppNotification[] {
    const data = localStorage.getItem('orientationbf_local_notifications');
    if (!data) {
      localStorage.setItem('orientationbf_local_notifications', JSON.stringify(DEFAULT_LOCAL_NOTIFICATIONS));
      return DEFAULT_LOCAL_NOTIFICATIONS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_LOCAL_NOTIFICATIONS;
    }
  },

  saveNotificationsToLocalStorage(notifications: AppNotification[]) {
    localStorage.setItem('orientationbf_local_notifications', JSON.stringify(notifications));
  },

  async sendNotification(notification: Omit<AppNotification, 'createdAt' | 'id'>) {
    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'notifications'), {
          ...notification,
          createdAt: serverTimestamp()
        });
        return docRef.id;
      } catch (error) {
        console.error("Error sending notification:", error);
        handleFirestoreError(error, OperationType.WRITE, 'notifications');
      }
    }

    // Local fallback support
    const local = this.getNotificationsFromLocalStorage();
    const newNotif: AppNotification = {
      ...notification,
      id: 'local-' + Date.now().toString(),
      createdAt: new Date().toISOString(),
      isRead: false
    };
    local.unshift(newNotif);
    this.saveNotificationsToLocalStorage(local);
    // Dispatch custom event to let other components know they should update
    window.dispatchEvent(new Event('local-notifications-updated'));
    return newNotif.id;
  },

  async markAsRead(id: string, isRead = true) {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'notifications', id), { isRead });
      } catch (error) {
        console.error("Error updating notification read status :", error);
      }
    }

    // Local update
    const local = this.getNotificationsFromLocalStorage();
    const updated = local.map(n => n.id === id ? { ...n, isRead } : n);
    this.saveNotificationsToLocalStorage(updated);
    window.dispatchEvent(new Event('local-notifications-updated'));
  },

  async deleteNotification(id: string) {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch (error) {
        console.error("Error deleting notification from Firestore:", error);
      }
    }

    // Local update
    const local = this.getNotificationsFromLocalStorage();
    const filtered = local.filter(n => n.id !== id);
    this.saveNotificationsToLocalStorage(filtered);
    window.dispatchEvent(new Event('local-notifications-updated'));
  },

  listenToNotifications(callback: (notifications: AppNotification[]) => void) {
    if (isFirebaseConfigured) {
      // Immediately call with cached firebase notifications if available
      try {
        const cached = localStorage.getItem('orientationbf_cached_firebase_notifications');
        if (cached) {
          callback(JSON.parse(cached));
        } else {
          // fallback to default local notifications on first launch
          callback(this.getNotificationsFromLocalStorage());
        }
      } catch (e) {
        console.error("Error loading cached notifications:", e);
      }

      const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AppNotification[];
        
        try {
          localStorage.setItem('orientationbf_cached_firebase_notifications', JSON.stringify(notifications));
        } catch (e) {
          console.error("Error caching notifications:", e);
        }
        
        callback(notifications);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
        // fallback to cached/local on error
        const cached = localStorage.getItem('orientationbf_cached_firebase_notifications');
        if (cached) {
          try {
            callback(JSON.parse(cached));
            return;
          } catch {}
        }
        callback(this.getNotificationsFromLocalStorage());
      });
    } else {
      // Local setup trigger listener
      const handler = () => {
        callback(this.getNotificationsFromLocalStorage());
      };
      window.addEventListener('local-notifications-updated', handler);
      // Run immediately
      handler();
      return () => {
        window.removeEventListener('local-notifications-updated', handler);
      };
    }
  }
};
