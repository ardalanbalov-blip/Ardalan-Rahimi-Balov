import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import { FIREBASE_CONFIG } from '../constants';

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

export const app = firebase.app();
export const auth = firebase.auth();
export const db = firebase.firestore();
export const functions = app.functions('europe-west4');

export default firebase;