import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';
import { auth } from './firebase';
import { dbService } from './dbService';
import { UserState, PremiumTier } from '../types';

// Mock Session Key for LocalStorage
const MOCK_SESSION_KEY = 'aura_mock_session';

// Helper to create a mock User object that mimics Firebase User
const createMockUser = (email: string, uid: string = 'mock-user-123'): User => {
  return {
    uid,
    email,
    emailVerified: true,
    displayName: 'Demo User',
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase',
  } as unknown as User;
};

// Helper to handle API Key errors by falling back to Mock Mode
const runWithFallback = async <T>(
  operation: () => Promise<T>, 
  fallbackFn: () => Promise<T>
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (
      error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' || 
      error.message?.includes('api-key-not-valid') ||
      error.code === 'auth/operation-not-allowed'
    ) {
      console.warn("Firebase Auth Error (Invalid Key/Config). Switching to Mock Auth Mode.");
      return await fallbackFn();
    }
    throw error;
  }
};

// --- AUTH METHODS ---

export const signInWithGoogle = async (plan: PremiumTier): Promise<{ user: User, userState: UserState } | null> => {
  const provider = new GoogleAuthProvider();
  return runWithFallback(
    async () => {
      const result = await signInWithPopup(auth, provider);
      const userState = await dbService.initializeUserInDB(result.user, plan);
      return { user: result.user, userState };
    },
    async () => {
      // Fallback Mock Google Login
      const mockUser = createMockUser('google-demo@aura.ai', `mock-google-${Date.now()}`);
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: mockUser.uid, email: mockUser.email }));
      const userState = await dbService.initializeUserInDB(mockUser, plan);
      // Trigger listener update
      window.dispatchEvent(new Event('storage'));
      return { user: mockUser, userState };
    }
  );
};

export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    return runWithFallback(
      async () => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
      },
      async () => {
        // Fallback Mock Email Login
        // In a real app we'd verify password, but for mock demo we allow entry
        const mockUser = createMockUser(email, `mock-${email.replace(/[^a-zA-Z0-9]/g, '')}`);
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: mockUser.uid, email: mockUser.email }));
        window.dispatchEvent(new Event('storage'));
        return mockUser;
      }
    );
};

export const signUpWithEmail = async (email: string, password: string, plan: PremiumTier): Promise<{ user: User, userState: UserState } | null> => {
    return runWithFallback(
      async () => {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          const userState = await dbService.initializeUserInDB(result.user, plan);
          return { user: result.user, userState };
      },
      async () => {
          // Fallback Mock Sign Up
          const mockUser = createMockUser(email, `mock-${email.replace(/[^a-zA-Z0-9]/g, '')}`);
          localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: mockUser.uid, email: mockUser.email }));
          const userState = await dbService.initializeUserInDB(mockUser, plan);
          window.dispatchEvent(new Event('storage'));
          return { user: mockUser, userState };
      }
    );
};

export const resetPassword = async (email: string): Promise<void> => {
    return runWithFallback(
        async () => {
             await sendPasswordResetEmail(auth, email);
        },
        async () => {
             console.log("Mock Password Reset Email sent to:", email);
        }
    );
};

export const signOutUser = async (): Promise<void> => {
  try {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    
    // Clear mock session
    localStorage.removeItem(MOCK_SESSION_KEY);
    
    await signOut(auth).catch(() => {}); // Ignore auth errors on signout
    window.location.reload(); // Force refresh to clear state
  } catch (error) {
    console.error('Sign-Out Error:', error);
  }
};

// --- AUTH STATE LISTENER ---

export const onAuthStateChange = (callback: (user: User | null) => void) => {
    let unsubscribed = false;

    // 1. Listen to real Firebase Auth
    const firebaseUnsub = onAuthStateChanged(auth, (user) => {
        if (unsubscribed) return;
        
        if (user) {
            callback(user);
        } else {
            // 2. If no Firebase user, check for mock session in LocalStorage
            const mockSession = localStorage.getItem(MOCK_SESSION_KEY);
            if (mockSession) {
                try {
                  const data = JSON.parse(mockSession);
                  const mockUser = createMockUser(data.email, data.uid);
                  callback(mockUser);
                } catch (e) {
                  callback(null);
                }
            } else {
                callback(null);
            }
        }
    });

    // 3. Listen for Storage events (to handle cross-tab or same-tab mock updates)
    const storageHandler = () => {
       const mockSession = localStorage.getItem(MOCK_SESSION_KEY);
       if (mockSession && !auth.currentUser) {
           const data = JSON.parse(mockSession);
           const mockUser = createMockUser(data.email, data.uid);
           callback(mockUser);
       }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
        unsubscribed = true;
        firebaseUnsub();
        window.removeEventListener('storage', storageHandler);
    };
};

export const authService = {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signOutUser,
  onAuthStateChange
};