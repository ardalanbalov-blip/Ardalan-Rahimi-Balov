import firebase from 'firebase/app';
import { db } from './firebase';
import { UserState, SubscriptionStatus, ChatThread, DailyInsight, CoreMemory, PremiumTier } from '../types';
import { TRIAL_DURATION_DAYS } from '../constants';

const USERS_COLLECTION = 'users';
const CUSTOMERS_COLLECTION = 'customers';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const THREADS_COLLECTION = 'threads';
const INSIGHTS_COLLECTION = 'insights';
const MEMORIES_COLLECTION = 'memories';
const MOCK_DB_KEY = 'aura_mock_db';
const MOCK_SESSION_KEY = 'aura_mock_session';

// --- MOCK DB HELPERS ---

const isMockMode = (): boolean => {
  return !!localStorage.getItem(MOCK_SESSION_KEY);
};

const getMockData = () => {
  try {
    return JSON.parse(localStorage.getItem(MOCK_DB_KEY) || '{"users":{}, "subcollections":{}}');
  } catch {
    return { users: {}, subcollections: {} };
  }
};

const saveMockData = (data: any) => {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(data));
};

// --- INITIERING OCH PROFIL ---

export const initializeUserInDB = async (user: firebase.User, initialPlan: PremiumTier): Promise<UserState> => {
  const now = new Date().toISOString();
  
  // Default State
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

  if (isMockMode()) {
    console.log("DB: Initializing User in MOCK DB");
    const data = getMockData();
    if (data.users[user.uid]) return data.users[user.uid];
    
    data.users[user.uid] = newUserState;
    saveMockData(data);
    return newUserState;
  }

  // Real Firestore
  const userRef = db.collection(USERS_COLLECTION).doc(user.uid);
  
  try {
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const existingUser = userSnap.data() as UserState;
      const syncedUser = await syncSubscriptionStatus(existingUser);
      if (syncedUser) return syncedUser;
      return existingUser;
    }
    await userRef.set(newUserState);
    return newUserState;
  } catch (error: any) {
    console.error("DB Init Error, falling back to Mock:", error);
    // Fallback to Mock if permission denied (likely invalid API key or rules)
    const data = getMockData();
    data.users[user.uid] = newUserState;
    saveMockData(data);
    return newUserState;
  }
};

const syncSubscriptionStatus = async (userState: UserState): Promise<UserState | null> => {
  if (isMockMode()) return null;

  try {
    const subsRef = db.collection(CUSTOMERS_COLLECTION).doc(userState.id).collection(SUBSCRIPTIONS_COLLECTION);
    const snap = await subsRef.get();
    
    const activeSub = snap.docs.find(d => ['active', 'trialing'].includes(d.data().status));
    
    if (activeSub) {
      const subData = activeSub.data();
      const status: SubscriptionStatus = subData.status === 'trialing' ? 'trial_active' : 'active_subscription';
      const periodEnd = subData.current_period_end ? new Date(subData.current_period_end.seconds * 1000).toISOString() : undefined;
      const cancelAtPeriodEnd = subData.cancel_at_period_end || false;

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
    }
  } catch (e) {
    console.warn("Failed to sync stripe subscription", e);
  }
  return null;
}

export const loadUserState = async (userId: string): Promise<UserState | null> => {
  if (isMockMode()) {
    const data = getMockData();
    return data.users[userId] || null;
  }

  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  try {
    const userSnap = await userRef.get();
    if (!userSnap.exists) return null;
    const user = userSnap.data() as UserState;
    const synced = await syncSubscriptionStatus(user);
    return synced || user;
  } catch (error) {
    console.warn("Error loading user state (likely auth issue). Check permissions.", error);
    // Try mock as last resort if failed
    const data = getMockData();
    return data.users[userId] || null;
  }
};

export const updateUserFields = async (userId: string, fields: Partial<UserState>): Promise<void> => {
  if (isMockMode()) {
    const data = getMockData();
    if (data.users[userId]) {
      data.users[userId] = { ...data.users[userId], ...fields };
      saveMockData(data);
    }
    return;
  }

  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  await userRef.update(fields);
};

// --- CHATT & MINNE ---

export const saveChatThread = async (userId: string, thread: ChatThread): Promise<void> => {
  if (isMockMode()) {
    const data = getMockData();
    if (!data.subcollections[userId]) data.subcollections[userId] = {};
    if (!data.subcollections[userId].threads) data.subcollections[userId].threads = {};
    
    data.subcollections[userId].threads[thread.id] = thread;
    saveMockData(data);
    return;
  }

  const threadRef = db.collection(USERS_COLLECTION).doc(userId).collection(THREADS_COLLECTION).doc(thread.id);
  await threadRef.set(thread, { merge: true });
};

export const loadThreads = async (userId: string): Promise<ChatThread[]> => {
  if (isMockMode()) {
    const data = getMockData();
    const threadsMap = data.subcollections[userId]?.threads || {};
    return Object.values(threadsMap).sort((a: any, b: any) => b.updatedAt - a.updatedAt) as ChatThread[];
  }

  const q = db.collection(USERS_COLLECTION).doc(userId).collection(THREADS_COLLECTION);
  const querySnapshot = await q.get();
  const threads: ChatThread[] = [];
  querySnapshot.forEach((doc) => {
    threads.push(doc.data() as ChatThread);
  });
  return threads.sort((a, b) => b.updatedAt - a.updatedAt); 
};

export const saveCoreMemory = async (userId: string, memory: CoreMemory): Promise<void> => {
  if (isMockMode()) {
    const data = getMockData();
    // Memories are also stored on UserState, but if we used a subcollection:
    if (!data.subcollections[userId]) data.subcollections[userId] = {};
    if (!data.subcollections[userId].memories) data.subcollections[userId].memories = {};
    data.subcollections[userId].memories[memory.id] = memory;
    saveMockData(data);
    return;
  }

  const memoryRef = db.collection(USERS_COLLECTION).doc(userId).collection(MEMORIES_COLLECTION).doc(memory.id);
  await memoryRef.set(memory);
};

// --- INSIKTER ---

export const saveInsight = async (userId: string, insight: DailyInsight): Promise<void> => {
  if (isMockMode()) {
    const data = getMockData();
    if (!data.subcollections[userId]) data.subcollections[userId] = {};
    if (!data.subcollections[userId].insights) data.subcollections[userId].insights = {};
    data.subcollections[userId].insights[insight.date] = insight;
    saveMockData(data);
    return;
  }

  const insightRef = db.collection(USERS_COLLECTION).doc(userId).collection(INSIGHTS_COLLECTION).doc(insight.date);
  await insightRef.set(insight);
};

export const loadInsights = async (userId: string): Promise<DailyInsight[]> => {
  if (isMockMode()) {
    const data = getMockData();
    const insightsMap = data.subcollections[userId]?.insights || {};
    return Object.values(insightsMap).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) as DailyInsight[];
  }

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