import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
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
