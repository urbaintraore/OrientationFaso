import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  category: 'scholarship' | 'news' | 'system' | 'establishment';
  link?: string;
  target?: 'all' | 'students' | 'parents' | 'bacheliers';
  createdAt: Timestamp | any;
  isRead?: boolean;
}

export const notificationService = {
  async sendNotification(notification: Omit<AppNotification, 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error sending notification:", error);
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
      throw error;
    }
  },

  listenToNotifications(callback: (notifications: AppNotification[]) => void) {
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
      callback(notifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
  }
};
