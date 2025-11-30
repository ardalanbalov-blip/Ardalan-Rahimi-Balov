import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { FIREBASE_CONFIG } from '../constants';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_CONFIG.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_CONFIG.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CONFIG.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || FIREBASE_CONFIG.appId
};

// Initialize Firebase
// Export 'app' so other services (like Stripe) can use the initialized instance
export const app = initializeApp(firebaseConfig);

// Export Auth, Firestore, and Functions instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize functions with the specific region 'europe-west4' to match your backend deployment
export const functions = getFunctions(app, 'europe-west4');
