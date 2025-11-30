import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyCNW7z0-ZzLbFVG0kn9XQOFMU4v-FFzBF0',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'aura-e0c49.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'aura-e0c49',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'aura-e0c49.appspot.com',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '16375430386',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:16375430386:web:a97c621aab38ee88c2a46b'
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const app = firebase.app();
export const auth = firebase.auth();
export const db = firebase.firestore();
export const functions = app.functions('europe-west4');

export default firebase;