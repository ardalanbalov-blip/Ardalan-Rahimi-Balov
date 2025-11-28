import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { UserState, SubscriptionStatus, ChatThread, DailyInsight, CoreMemory, PremiumTier } from '../types';
import { TRIAL_DURATION_DAYS } from '../constants';

const USERS_COLLECTION = 'users';
const THREADS_COLLECTION = 'threads';
const INSIGHTS_COLLECTION = 'insights';
const MEMORIES_COLLECTION = 'memories';

// --- STORAGE HELPERS (FALLBACK) ---

const getLocalItem = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

const setLocalItem = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Helper to run Firestore with LocalStorage Fallback
const dbOp = async <T>(
  firestoreFn: () => Promise<T>,
  localFn: () => T
): Promise<T> => {
  try {
    return await firestoreFn();
  } catch (error: any) {
    // If permission denied, invalid key, or offline, use LocalStorage
    // Common error codes for invalid config: permission-denied, unavailable, api-key-not-valid
    return localFn();
  }
};

// --- INITIERING OCH PROFIL ---

export const initializeUserInDB = async (user: User, initialPlan: PremiumTier): Promise<UserState> => {
  const now = new Date().toISOString();
  
  // Logic to build default user state
  const isTrial = initialPlan !== PremiumTier.FREE;
  const trialEndsAt = isTrial ? new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString() : undefined;
  const initialSubscription: SubscriptionStatus = isTrial ? 'trial_active' : 'free';

  const newUserState: UserState = {
    id: user.uid,
    email: user.email || '',
    emailVerified: user.emailVerified,
    name: user.displayName || undefined,
    joinedAt: now,
    tier: initialPlan,
    subscriptionStatus: initialSubscription,
    trialEndsAt: trialEndsAt,
    coins: 100,
    streakDays: 1,
    voiceEnabled: true,
    memories: [],
    lastViewedMarketingVersion: 0,
  };

  return dbOp(
    async () => {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) return userSnap.data() as UserState;
      
      await setDoc(userRef, newUserState);
      return newUserState;
    },
    () => {
      // LocalStorage Fallback
      const key = `aura_user_${user.uid}`;
      const existing = getLocalItem<UserState>(key);
      if (existing) return existing;
      
      setLocalItem(key, newUserState);
      return newUserState;
    }
  );
};

export const loadUserState = async (userId: string): Promise<UserState | null> => {
  return dbOp(
    async () => {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? (userSnap.data() as UserState) : null;
    },
    () => {
      return getLocalItem<UserState>(`aura_user_${userId}`);
    }
  );
};

export const saveUserState = async (userId: string, userState: UserState): Promise<void> => {
  return dbOp(
    async () => {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await setDoc(userRef, userState);
    },
    () => {
      setLocalItem(`aura_user_${userId}`, userState);
    }
  );
};

export const updateUserFields = async (userId: string, fields: Partial<UserState>): Promise<void> => {
  return dbOp(
    async () => {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, fields);
    },
    () => {
      const key = `aura_user_${userId}`;
      const current = getLocalItem<UserState>(key);
      if (current) {
        setLocalItem(key, { ...current, ...fields });
      }
    }
  );
};

// --- CHATT & MINNE ---

export const saveChatThread = async (userId: string, thread: ChatThread): Promise<void> => {
  return dbOp(
    async () => {
      const threadRef = doc(db, USERS_COLLECTION, userId, THREADS_COLLECTION, thread.id);
      await setDoc(threadRef, thread, { merge: true });
    },
    () => {
      const key = `aura_threads_${userId}`;
      const threads = getLocalItem<ChatThread[]>(key) || [];
      const index = threads.findIndex(t => t.id === thread.id);
      if (index >= 0) {
        threads[index] = thread;
      } else {
        threads.push(thread);
      }
      setLocalItem(key, threads);
    }
  );
};

export const loadThreads = async (userId: string): Promise<ChatThread[]> => {
  return dbOp(
    async () => {
      const q = query(collection(db, USERS_COLLECTION, userId, THREADS_COLLECTION));
      const querySnapshot = await getDocs(q);
      const threads: ChatThread[] = [];
      querySnapshot.forEach((doc) => threads.push(doc.data() as ChatThread));
      return threads.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    () => {
      const threads = getLocalItem<ChatThread[]>(`aura_threads_${userId}`) || [];
      return threads.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  );
};

export const saveCoreMemory = async (userId: string, memory: CoreMemory): Promise<void> => {
  return dbOp(
    async () => {
      const memoryRef = doc(db, USERS_COLLECTION, userId, MEMORIES_COLLECTION, memory.id);
      await setDoc(memoryRef, memory);
    },
    () => {
      // Memory is typically saved in UserState.memories as well, 
      // but if we need a separate collection fallback:
      const key = `aura_memories_collection_${userId}`;
      const memories = getLocalItem<CoreMemory[]>(key) || [];
      memories.push(memory);
      setLocalItem(key, memories);
    }
  );
};

// --- INSIKTER ---

export const saveInsight = async (userId: string, insight: DailyInsight): Promise<void> => {
  return dbOp(
    async () => {
      const insightRef = doc(db, USERS_COLLECTION, userId, INSIGHTS_COLLECTION, insight.date);
      await setDoc(insightRef, insight);
    },
    () => {
      const key = `aura_insights_${userId}`;
      const insights = getLocalItem<DailyInsight[]>(key) || [];
      insights.push(insight);
      setLocalItem(key, insights);
    }
  );
};

export const loadInsights = async (userId: string): Promise<DailyInsight[]> => {
  return dbOp(
    async () => {
      const q = query(collection(db, USERS_COLLECTION, userId, INSIGHTS_COLLECTION));
      const querySnapshot = await getDocs(q);
      const insights: DailyInsight[] = [];
      querySnapshot.forEach((doc) => insights.push(doc.data() as DailyInsight));
      return insights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    () => {
      const insights = getLocalItem<DailyInsight[]>(`aura_insights_${userId}`) || [];
      return insights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  );
};

export const dbService = {
  initializeUserInDB,
  loadUserState,
  saveUserState,
  updateUserFields,
  saveChatThread,
  loadThreads,
  saveInsight,
  loadInsights,
  saveCoreMemory
};