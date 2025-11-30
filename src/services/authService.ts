import firebase from 'firebase/compat/app';
import { auth } from './firebase';
import { dbService } from './dbService';
import { UserState, PremiumTier } from '../types';

// --- AUTH METODER ---

export const signInWithGoogle = async (plan: PremiumTier): Promise<{ user: firebase.User, userState: UserState } | null> => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const userState = await dbService.initializeUserInDB(result.user!, plan);
    return { user: result.user!, userState };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw new Error('Autentisering med Google misslyckades.');
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<firebase.User | null> => {
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Ogiltig e-post eller lösenord.');
        }
        console.error('Email Sign-In Error:', error);
        throw new Error('Inloggning misslyckades.');
    }
};

export const signUpWithEmail = async (email: string, password: string, plan: PremiumTier): Promise<{ user: firebase.User, userState: UserState } | null> => {
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        const userState = await dbService.initializeUserInDB(result.user!, plan);
        // Här kan man också lägga till att skicka verifieringsmail:
        // await result.user!.sendEmailVerification();
        return { user: result.user!, userState };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
             throw new Error('E-postadressen används redan.');
        }
        console.error('Email Sign-Up Error:', error);
        throw new Error('Registrering misslyckades.');
    }
};

export const resetPassword = async (email: string): Promise<void> => {
    try {
        await auth.sendPasswordResetEmail(email);
    } catch (error) {
        console.error('Password Reset Error:', error);
        throw new Error('Kunde inte skicka återställningslänk.');
    }
};

export const signOutUser = async (): Promise<void> => {
  try {
    // Avbryt all aktiv röstutmatning innan utloggning
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    await auth.signOut();
  } catch (error) {
    console.error('Sign-Out Error:', error);
  }
};

// --- AUTH STATE LISTENER ---

export const onAuthStateChange = (callback: (user: firebase.User | null) => void) => {
    return auth.onAuthStateChanged(callback);
};

export const authService = {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signOutUser,
  onAuthStateChange
};