import React from 'react';

export type ViewMode = 'LANDING' | 'AUTH' | 'PAYMENT' | 'ONBOARDING' | 'CHAT' | 'INSIGHTS' | 'MARKETPLACE' | 'SUBSCRIPTION' | 'SETTINGS';

export type AuthMode = 'LOGIN' | 'SIGNUP';

export type SupportedLanguage = 'en' | 'sv' | 'fr' | 'de' | 'es' | 'zh';

export enum CoachingMode {
  BASELINE = 'BASELINE',
  SHADOW = 'SHADOW',
  FUTURE = 'FUTURE',
  ADAPTIVE = 'ADAPTIVE',
  PATTERN = 'PATTERN',
  META = 'META'
}

export enum PremiumTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PLUS = 'PLUS',
  MASTER = 'MASTER'
}

export type SubscriptionStatus = 
  | 'free' 
  | 'trial_active' 
  | 'trial_expired' 
  | 'active_subscription' 
  | 'downgrade_scheduled'
  | 'cancelled' 
  | 'past_due' 
  | 'unpaid' 
  | 'incomplete' 
  | 'paused';

export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  brand: string;
  last4: string;
  expiry?: string; 
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'open' | 'void' | 'failed';
  pdfUrl: string;
}

// --- NEW MEMORY TYPES ---
export interface CoreMemory {
  id: string;
  content: string;
  category: 'emotional' | 'fact' | 'preference' | 'milestone';
  importance: number; // 1-10
  createdAt: string;
}

export interface UserState {
  id: string;
  email: string;
  emailVerified: boolean; // New security field
  name?: string; 
  joinedAt: string;
  tier: PremiumTier;
  
  // Subscription & Payment
  linklyCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: string;
  nextBillingDate?: string;
  paymentMethod?: PaymentMethod;
  lastPaymentFailureReason?: string;
  
  // Caching unlocked features
  features?: string[];
  
  // --- NEW FEATURES ---
  coins: number;
  streakDays: number;
  voiceEnabled: boolean;
  memories: CoreMemory[];
  
  // Language
  language?: string;

  // Marketing
  lastViewedMarketingVersion: number;
}

export interface SignalPackage {
  emotion: string;
  intensity: number; 
  intent: 'venting' | 'planning' | 'avoidance' | 'fear' | 'ambition' | 'reflection' | 'confusion' | 'neutral';
  hiddenMeaning: string;
  contradictionScore: number;
  stressMarker: boolean;
  topics: string[];
  detectedLanguage: string; // e.g. 'en', 'sv', 'es'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  mode: CoachingMode;
  signal?: SignalPackage;
}

export interface ChatThread {
  id: string;
  mode: CoachingMode;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type InsightTypeTag = 'behavioral' | 'emotional' | 'strategic' | 'shadow' | 'future' | 'meta' | 'conflict';

export interface DailyInsight {
  date: string;
  sourceMode: CoachingMode;
  emotionalScore: number;
  energyLevel: number;
  dominantEmotion: string;
  
  title: string;
  bullets: string[];
  trend: 'up' | 'down' | 'stable';
  tags: string[];
  insightType: InsightTypeTag;
  
  summary: string;
  patterns: string[];       
  blindSpots: string[];     
  conflicts: string[];      
  trajectory: string;       
  actionableStep: string;   

  memoryStrength: number;
  patternPersistence: number;

  agreements?: string[];    
  rootCause?: string;       
  longTermTrend?: string;   
  crossModelConflicts?: Array<{
    label: string;
    description: string;
    resolution: string;
  }>;
  
  distortions?: {
    allOrNothing: number; // 0-10
    catastrophizing: number;
    emotionalReasoning: number;
    shouldStatements: number;
    personalization: number;
  };
}

export interface TwinState {
  mood: 'neutral' | 'happy' | 'stressed' | 'focused' | 'reflective';
  energy: number;
  coherence: number;
}

export interface AppData {
  user: UserState | null;
  threads: ChatThread[];
  activeThreadId: string | null;
  insights: DailyInsight[];
  currentMode: CoachingMode;
  twinState: TwinState;
  rentalAccess: Record<string, number>; // Map of Mode ID to Expiry Timestamp
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': any;
    }
  }
}
