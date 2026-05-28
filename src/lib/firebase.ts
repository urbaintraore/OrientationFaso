import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Support both environment variables and fallback config JSON
const getEnvVal = (envVal: string | undefined, jsonVal: string): string => {
  if (!envVal) return jsonVal;
  const trimmed = envVal.trim();
  if (trimmed === "" || trimmed.startsWith("re_") || trimmed.includes("PLACEHOLDER") || trimmed === "MY_API_KEY") {
    return jsonVal;
  }
  return trimmed;
};

const firebaseConfig = {
  apiKey: getEnvVal(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfigJson.apiKey),
  authDomain: getEnvVal(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfigJson.authDomain),
  projectId: getEnvVal(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfigJson.projectId),
  storageBucket: getEnvVal(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfigJson.storageBucket),
  messagingSenderId: getEnvVal(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfigJson.messagingSenderId),
  appId: getEnvVal(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfigJson.appId),
  measurementId: getEnvVal(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, firebaseConfigJson.measurementId || ""),
  firestoreDatabaseId: getEnvVal(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID, firebaseConfigJson.firestoreDatabaseId)
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
export const storage = getStorage(app);

let messaging: any = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn("Firebase Messaging not supported in this environment");
}

export { messaging };

export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // Link to docs or explain this needs config
      });
      return token;
    }
  } catch (error) {
    console.error("Unable to get permission to notify.", error);
  }
  return null;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
