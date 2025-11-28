import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from './firebase';
import { dbService } from './dbService';
import { UserState, PremiumTier } from '../types';
import { TIERS } from '../constants';

// --- AUTH METODER ---

export const signInWithGoogle = async (plan: PremiumTier): Promise<{ user: User, userState: UserState } | null> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const userState = await dbService.initializeUserInDB(result.user, plan);
    return { user: result.user, userState };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw new Error('Autentisering med Google misslyckades.');
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Ogiltig e-post eller lösenord.');
        }
        console.error('Email Sign-In Error:', error);
        throw new Error('Inloggning misslyckades.');
    }
};

export const signUpWithEmail = async (email: string, password: string, plan: PremiumTier): Promise<{ user: User, userState: UserState } | null> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const userState = await dbService.initializeUserInDB(result.user, plan);
        // Här kan man också lägga till att skicka verifieringsmail:
        // await sendEmailVerification(result.user);
        return { user: result.user, userState };
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
        await sendPasswordResetEmail(auth, email);
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
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
  }
};

// --- AUTH STATE LISTENER ---

export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Exportera som ett objekt för att passa den stil som App.tsx redan använder: `authService.onAuthStateChange`
export const authService = {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signOutUser,
  onAuthStateChange
};