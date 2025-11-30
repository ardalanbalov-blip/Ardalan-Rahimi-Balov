import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Initialize Firebase
// Using the imported config which already handles env variables in constants.ts
// or falling back to the hardcoded values if constants.ts is not fully set up in this context.
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyCNW7z0-ZzLbFVG0kn9XQOFMU4v-FFzBF0',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'aura-e0c49.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'aura-e0c49',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'aura-e0c49.appspot.com',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '16375430386',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:16375430386:web:a97c621aab38ee88c2a46b'
};

export const app = initializeApp(firebaseConfig);

// Export Auth, Firestore, and Functions instances
export const auth = getAuth(app);
export const db = getFirestore(app);
// Explicitly initialize functions with the correct region to avoid "Service functions is not available"
export const functions = getFunctions(app, 'europe-west4');
