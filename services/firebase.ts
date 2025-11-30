import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants';

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

export const app = firebase.app();
export const auth = firebase.auth();
export const db = firebase.firestore();

export default firebase;