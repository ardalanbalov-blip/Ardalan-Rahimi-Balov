import firebase from 'firebase/app';
import { db } from './firebase';
import { UserState, SubscriptionStatus, ChatThread, DailyInsight, CoreMemory, PremiumTier } from '../types';
import { TRIAL_DURATION_DAYS } from '../constants';

const USERS_COLLECTION = 'users';
const THREADS_COLLECTION = 'threads';
const INSIGHTS_COLLECTION = 'insights';
const MEMORIES_COLLECTION = 'memories';

// --- INITIERING OCH PROFIL ---

/** Säkerställer att användarprofilen finns i Firestore vid inloggning. */
export const initializeUserInDB = async (user: firebase.User, initialPlan: PremiumTier): Promise<UserState> => {
  const userRef = db.collection(USERS_COLLECTION).doc(user.uid);
  const userSnap = await userRef.get();
  const now = new Date().toISOString();

  if (userSnap.exists) {
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

  await userRef.set(newUserState);
  return newUserState;
};

/** Laddar hela UserState-objektet. */
export const loadUserState = async (userId: string): Promise<UserState | null> => {
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const userSnap = await userRef.get();
  return userSnap.exists ? (userSnap.data() as UserState) : null;
};

/** Uppdaterar specifika fält i UserState. */
export const updateUserFields = async (userId: string, fields: Partial<UserState>): Promise<void> => {
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  await userRef.update(fields);
};

// --- CHATT & MINNE ---

/** Sparar en komplett chat-tråd. */
export const saveChatThread = async (userId: string, thread: ChatThread): Promise<void> => {
  const threadRef = db.collection(USERS_COLLECTION).doc(userId).collection(THREADS_COLLECTION).doc(thread.id);
  await threadRef.set(thread, { merge: true });
};

/** Laddar alla chat-trådar för en användare. */
export const loadThreads = async (userId: string): Promise<ChatThread[]> => {
  const q = db.collection(USERS_COLLECTION).doc(userId).collection(THREADS_COLLECTION);
  const querySnapshot = await q.get();
  const threads: ChatThread[] = [];
  querySnapshot.forEach((doc) => {
    threads.push(doc.data() as ChatThread);
  });
  // Sortera efter senaste uppdatering
  return threads.sort((a, b) => b.updatedAt - a.updatedAt); 
};

/** Sparar en ny CoreMemory. (Obs: Memories lagras även i UserState för snabb åtkomst) */
export const saveCoreMemory = async (userId: string, memory: CoreMemory): Promise<void> => {
  const memoryRef = db.collection(USERS_COLLECTION).doc(userId).collection(MEMORIES_COLLECTION).doc(memory.id);
  await memoryRef.set(memory);
};

// --- INSIKTER ---

/** Sparar en DailyInsight. */
export const saveInsight = async (userId: string, insight: DailyInsight): Promise<void> => {
  const insightRef = db.collection(USERS_COLLECTION).doc(userId).collection(INSIGHTS_COLLECTION).doc(insight.date);
  await insightRef.set(insight);
};

/** Laddar alla insikter för en användare. */
export const loadInsights = async (userId: string): Promise<DailyInsight[]> => {
  const q = db.collection(USERS_COLLECTION).doc(userId).collection(INSIGHTS_COLLECTION);
  const querySnapshot = await q.get();
  const insights: DailyInsight[] = [];
  querySnapshot.forEach((doc) => {
    insights.push(doc.data() as DailyInsight);
  });
  return insights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

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