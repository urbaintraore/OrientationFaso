import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// Safely resolve the configuration using a glob pattern so the compiler doesn't demand the file to exist during gitignored production builds
const configFiles = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const firebaseConfigJson: any = (configFiles['../../firebase-applet-config.json'] as any)?.default || {};

// Support both environment variables and fallback config JSON
const getEnvVal = (envVal: string | undefined, jsonVal: string | undefined): string => {
  if (!envVal) return jsonVal || "";
  const trimmed = envVal.trim();
  if (trimmed === "" || trimmed.startsWith("re_") || trimmed.includes("PLACEHOLDER") || trimmed === "MY_API_KEY") {
    return jsonVal || "";
  }
  return trimmed;
};

const firebaseConfig = {
  apiKey: getEnvVal(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfigJson.apiKey) || "dummy-api-key-for-applet-safety",
  authDomain: getEnvVal(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfigJson.authDomain) || "dummy-project.firebaseapp.com",
  projectId: getEnvVal(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfigJson.projectId) || "dummy-project",
  storageBucket: getEnvVal(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfigJson.storageBucket) || "dummy-project.appspot.com",
  messagingSenderId: getEnvVal(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfigJson.messagingSenderId) || "123456789",
  appId: getEnvVal(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfigJson.appId) || "1:123456789:web:123456789",
  measurementId: getEnvVal(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, firebaseConfigJson.measurementId || "") || "",
  firestoreDatabaseId: getEnvVal(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID, firebaseConfigJson.firestoreDatabaseId) || ""
};

export const isFirebaseConfigured = !!getEnvVal(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfigJson.apiKey);

const app = initializeApp(firebaseConfig);

const dbSettings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false
};

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? initializeFirestore(app, dbSettings, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, dbSettings);

// Enable local offline persistence for firestore to allow direct caching
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed-precondition (multiple tabs open)');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence unimplemented (unsupported browser)');
      }
    });
  } catch (err) {
    console.warn('Could not enable Firestore persistence:', err);
  }
}

export const auth = getAuth(app);
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
  const errMsg = error instanceof Error ? error.message : String(error);
  const isOffline = errMsg.toLowerCase().includes('offline') || 
                    errMsg.toLowerCase().includes('unreachable') || 
                    errMsg.toLowerCase().includes('unavailable') || 
                    errMsg.toLowerCase().includes('network-request-failed') ||
                    errMsg.toLowerCase().includes('could not reach') || 
                    !navigator.onLine;

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
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

  if (isOffline) {
    console.info(`[Firestore Offline Cache Operation] Type: ${operationType} on path: ${path}. Operating gracefully from local persistence.`);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  
  throw error; // throw original error so caller catching mechanisms and mock fallbacks function correctly
}
