import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { UserState, SubscriptionStatus, ChatThread, DailyInsight, CoreMemory, PremiumTier } from '../types';
import { TRIAL_DURATION_DAYS } from '../constants';

const USERS_COLLECTION = 'users';
const CUSTOMERS_COLLECTION = 'customers';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const THREADS_COLLECTION = 'threads';
const INSIGHTS_COLLECTION = 'insights';
const MEMORIES_COLLECTION = 'memories';

// --- INITIERING OCH PROFIL ---

export const initializeUserInDB = async (user: User, initialPlan: PremiumTier): Promise<UserState> => {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userSnap = await getDoc(userRef);
  const now = new Date().toISOString();

  if (userSnap.exists()) {
    // If user exists, we should check their authoritative subscription status from Stripe
    const existingUser = userSnap.data() as UserState;
    const syncedUser = await syncSubscriptionStatus(existingUser);
    if (syncedUser) return syncedUser;
    return existingUser;
  }
  
  // New User
  const isTrial = initialPlan !== PremiumTier.FREE;
  const trialEndsAt = isTrial ? new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString() : undefined;
  
  // Default to 'free' or 'trial' until Stripe webhook confirms subscription
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

  await setDoc(userRef, newUserState);
  return newUserState;
};

/**
 * Checks the 'customers/{uid}/subscriptions' collection managed by the Stripe Extension.
 * Updates the user's local UserState if the authoritative Stripe status differs.
 */
const syncSubscriptionStatus = async (userState: UserState): Promise<UserState | null> => {
  try {
    const subsRef = collection(db, CUSTOMERS_COLLECTION, userState.id, SUBSCRIPTIONS_COLLECTION);
    const q = query(subsRef); // Get all subscriptions
    const snap = await getDocs(q);
    
    // Find the most relevant active subscription
    const activeSub = snap.docs.find(d => ['active', 'trialing'].includes(d.data().status));
    
    if (activeSub) {
      const subData = activeSub.data();
      const status: SubscriptionStatus = subData.status === 'trialing' ? 'trial_active' : 'active_subscription';
      const periodEnd = subData.current_period_end ? new Date(subData.current_period_end.seconds * 1000).toISOString() : undefined;
      const cancelAtPeriodEnd = subData.cancel_at_period_end || false;

      // Only update if something changed
      if (userState.subscriptionStatus !== status || userState.cancelAtPeriodEnd !== cancelAtPeriodEnd) {
         const updates: Partial<UserState> = { 
           subscriptionStatus: status,
           nextBillingDate: periodEnd,
           cancelAtPeriodEnd: cancelAtPeriodEnd,
           subscriptionId: activeSub.id
         };
         await updateUserFields(userState.id, updates);
         return { ...userState, ...updates } as UserState;
      }
    } else if (userState.subscriptionStatus === 'active_subscription') {
      // If no active sub found in Stripe but user thinks they are active -> Downgrade to free/cancelled
      // (This handles expired subs that weren't synced yet)
       await updateUserFields(userState.id, { subscriptionStatus: 'cancelled' });
       return { ...userState, subscriptionStatus: 'cancelled' };
    }
  } catch (e) {
    console.warn("Failed to sync stripe subscription", e);
  }
  return null;
}

export const loadUserState = async (userId: string): Promise<UserState | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  
  const user = userSnap.data() as UserState;
  
  // Attempt sync on load
  const synced = await syncSubscriptionStatus(user);
  return synced || user;
};

export const updateUserFields = async (userId: string, fields: Partial<UserState>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, fields);
};

// --- CHATT & MINNE ---

export const saveChatThread = async (userId: string, thread: ChatThread): Promise<void> => {
  const threadRef = doc(db, USERS_COLLECTION, userId, THREADS_COLLECTION, thread.id);
  await setDoc(threadRef, thread, { merge: true });
};

export const loadThreads = async (userId: string): Promise<ChatThread[]> => {
  const q = query(collection(db, USERS_COLLECTION, userId, THREADS_COLLECTION));
  const querySnapshot = await getDocs(q);
  const threads: ChatThread[] = [];
  querySnapshot.forEach((doc) => {
    threads.push(doc.data() as ChatThread);
  });
  return threads.sort((a, b) => b.updatedAt - a.updatedAt); 
};

export const saveCoreMemory = async (userId: string, memory: CoreMemory): Promise<void> => {
  const memoryRef = doc(db, USERS_COLLECTION, userId, MEMORIES_COLLECTION, memory.id);
  await setDoc(memoryRef, memory);
};

// --- INSIKTER ---

export const saveInsight = async (userId: string, insight: DailyInsight): Promise<void> => {
  const insightRef = doc(db, USERS_COLLECTION, userId, INSIGHTS_COLLECTION, insight.date);
  await setDoc(insightRef, insight);
};

export const loadInsights = async (userId: string): Promise<DailyInsight[]> => {
  const q = query(collection(db, USERS_COLLECTION, userId, INSIGHTS_COLLECTION));
  const querySnapshot = await getDocs(q);
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