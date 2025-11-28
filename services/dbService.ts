import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { UserState, SubscriptionStatus, ChatThread, DailyInsight, CoreMemory, PremiumTier } from '../types';
import { TRIAL_DURATION_DAYS } from '../constants';

const USERS_COLLECTION = 'users';
const THREADS_COLLECTION = 'threads';
const INSIGHTS_COLLECTION = 'insights';
const MEMORIES_COLLECTION = 'memories';

// --- INITIERING OCH PROFIL ---

/** Säkerställer att användarprofilen finns i Firestore vid inloggning. */
export const initializeUserInDB = async (user: User, initialPlan: PremiumTier): Promise<UserState> => {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userSnap = await getDoc(userRef);
  const now = new Date().toISOString();

  if (userSnap.exists()) {
    // Returnera befintlig profil
    return userSnap.data() as UserState;
  }
  
  // Skapa en ny användarprofil
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
    coins: 100, // Initiala mynt
    streakDays: 1,
    voiceEnabled: true,
    memories: [],
    lastViewedMarketingVersion: 0,
    // Övriga prenumerationsfält sätts när betalning/Stripe-event hanteras
  };

  await setDoc(userRef, newUserState);
  return newUserState;
};

/** Laddar hela UserState-objektet. */
export const loadUserState = async (userId: string): Promise<UserState | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? (userSnap.data() as UserState) : null;
};

/** Uppdaterar specifika fält i UserState. */
export const updateUserFields = async (userId: string, fields: Partial<UserState>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, fields);
};

// --- CHATT & MINNE ---

/** Sparar en komplett chat-tråd. */
export const saveChatThread = async (userId: string, thread: ChatThread): Promise<void> => {
  const threadRef = doc(db, USERS_COLLECTION, userId, THREADS_COLLECTION, thread.id);
  await setDoc(threadRef, thread, { merge: true });
};

/** Laddar alla chat-trådar för en användare. */
export const loadThreads = async (userId: string): Promise<ChatThread[]> => {
  const q = query(collection(db, USERS_COLLECTION, userId, THREADS_COLLECTION));
  const querySnapshot = await getDocs(q);
  const threads: ChatThread[] = [];
  querySnapshot.forEach((doc) => {
    threads.push(doc.data() as ChatThread);
  });
  // Sortera efter senaste uppdatering
  return threads.sort((a, b) => b.updatedAt - a.updatedAt); 
};

/** Sparar en ny CoreMemory. (Obs: Memories lagras även i UserState för snabb åtkomst) */
export const saveCoreMemory = async (userId: string, memory: CoreMemory): Promise<void> => {
  const memoryRef = doc(db, USERS_COLLECTION, userId, MEMORIES_COLLECTION, memory.id);
  await setDoc(memoryRef, memory);
};

// --- INSIKTER ---

/** Sparar en DailyInsight. */
export const saveInsight = async (userId: string, insight: DailyInsight): Promise<void> => {
  const insightRef = doc(db, USERS_COLLECTION, userId, INSIGHTS_COLLECTION, insight.date);
  await setDoc(insightRef, insight);
};

/** Laddar alla insikter för en användare. */
export const loadInsights = async (userId: string): Promise<DailyInsight[]> => {
  const q = query(collection(db, USERS_COLLECTION, userId, INSIGHTS_COLLECTION));
  const querySnapshot = await getDocs(q);
  const insights: DailyInsight[] = [];
  querySnapshot.forEach((doc) => {
    insights.push(doc.data() as DailyInsight);
  });
  return insights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Exportera som ett objekt för att passa den stil som App.tsx redan använder: `dbService.loadUserState`
export const dbService = {
  initializeUserInDB,
  loadUserState,
  updateUserFields,
  saveChatThread,
  loadThreads,
  saveInsight,
  loadInsights,
  saveCoreMemory
};
