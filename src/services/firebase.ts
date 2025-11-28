import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants';

// Se till att FIREBASE_CONFIG är definierad i constants.ts
const firebaseConfig = {
  apiKey: FIREBASE_CONFIG.apiKey,
  authDomain: FIREBASE_CONFIG.authDomain,
  projectId: FIREBASE_CONFIG.projectId,
  storageBucket: FIREBASE_CONFIG.storageBucket,
  messagingSenderId: FIREBASE_CONFIG.messagingSenderId,
  appId: FIREBASE_CONFIG.appId,
};

// Initialisera Firebase
const app = initializeApp(firebaseConfig);

// Exportera Auth och Firestore instanser
export const auth = getAuth(app);
export const db = getFirestore(app);