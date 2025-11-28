
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants';

// Initialize Firebase using the centralized config
const app = initializeApp(FIREBASE_CONFIG);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
