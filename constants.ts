// aura/constants.ts (Korrigerad)

import { CoachingMode, PremiumTier } from './types';

export const APP_NAME = "Aura";

export const INITIAL_TWIN_STATE = {
  mood: 'neutral' as const,
  energy: 50,
  coherence: 10
};

export const TRIAL_DURATION_DAYS = 14;

export const FIREBASE_CONFIG = {
  // Använd `?.` för att se till att den inte kraschar om `import.meta.env` är undefined.
  apiKey:  'AIzaSyCWN7Z0-ZzLbFvG0kn9XQoFMU4v-FfzBF0',
  authDomain: 'aura-e0c49.firebaseapp.com',
  projectId:'aura-e0c49',
  storageBucket: 'aura-e0c49.appspot.com',
  messagingSenderId: '16375430386',
  appId: '1:16375430386:web:a97c621aab38ee88c2a46b',
  measurementId: 'G-H7JGV82Q48'
};


// Exporterar funktionen så att den kan användas i App.tsx och Marketplace.tsx
export const getTierValue = (tier: PremiumTier): number => {
  switch (tier) {
    case PremiumTier.MASTER: return 3;
    case PremiumTier.PLUS: return 2;
    case PremiumTier.BASIC: return 1;
    case PremiumTier.FREE: return 0;
    default: return 0;
  }
};

export const LOCALE_STRINGS = {
  // Din LOCALE_STRINGS-data
  en: {
    nav: { chat: "Chat", dossier: "Dossier", upgrade: "Upgrade", logout: "Logout", store: "Store", signIn: "Log In", logIn: "Log In" } /* */,
    sidebar: { coachingModes: "Coaching Modes", voice: "Voice", subscription: "Subscription" } /* */,
    header: { activeMode: "Active Neural Mode", startTrial: "Start Trial" } /* */,
    placeholder: { message: "Message...", listening: "Listening...", startSession: "Start a new session with" } /* */,
    button: { send: "Send", begin: "Begin", beginJourney: "Begin The Journey", startTrial: "Start Free Trial", confirmRental: "Confirm Rental", back: "Back", cancel: "Cancel", unlockTwin: "Unlock Your Twin", login: "Log In", proceed: "Proceed to Payment", signIn: "Sign In", processing: "Processing...", learnMore: "Learn More" } /* */,
    auth: { 
      welcome: "Welcome Back" /* */, 
      create: "Create Account" /* */, 
      loginDesc: "Enter your credentials to access your Twin." /* */, 
      signupDesc: "Begin your journey to self-mastery." /* */, 
      email: "Email" /* */, 
      password: "Password" /* */, 
      noAccount: "Don't have an account?" /* */, 
      haveAccount: "Already have an account?" /* */, 
      selectedPlan: "Selected Plan" /* */, 
      freeTrial: "Free for 14 days" /* */,
      forgotPassword: "Forgot Password?" /* */,
      resetPassword: "Reset Password" /* */,
      enterEmailReset: "Enter your email to receive a reset link." /* */,
      sendResetLink: "Send Reset Link" /* */,
      backToLogin: "Back to Login" /* */,
      accountCreated: "Account created! Please check your inbox to verify your email." /* */,
      resetLinkSent: "Password reset link sent to your email." /* */,
      authFailed: "Authentication failed." /* */,
      userNotFound: "No account found with this email." /* */
    } /* */,
    onboarding: { title: "Identify Yourself", namePlaceholder: "Your Name", begin: "Begin" } /* */,
    loading: { sync: "Synchronizing Digital Twin...", thinking: "Thinking..." } /* */,
    banner: { shadowTitle: "New Feature: Shadow Twin", shadowDesc: "Unlock your subconscious patterns with the new Shadow mode." } /* */,
    mode: { 
      baseline: { name: "Baseline", desc: "Neutral Intelligence. Observes facts." } /* */,
      adaptive: { name: "Adaptive Coach", desc: "Goal Navigator. Flexible guidance." } /* */,
      shadow: { name: "Shadow Twin", desc: "Blind Spot Detector. Reveals avoidance." } /* */,
      future: { name: "Future Self", desc: "Long-term Projection. Visualizes paths." } /* */,
      pattern: { name: "Pattern Detector", desc: "Trend Analysis. Tracks shifts." } /* */,
      meta: { name: "Meta-Coach", desc: "Super-Synthesis. Integrates perspectives." } /* */
    } /* */,
    common: { secure: "Secure Encrypted Access", unlock: "Unlock", cost: "Cost", coins: "Coins", insufficient: "Insufficient Coins" } /* */,
    marketplace: { title: "Marketplace", desc: "Unlock capabilities and acquire resources.", packs: "Aura Coin Packs", tiers: "Subscription Tiers", select: "Select", current: "Current Plan", upgrade: "Upgrade", downgrade: "Downgrade", buy: "Buy Now" } /* */,
    landing: {
      heroTitle: "The Mirror to Your Mind." /* */,
      heroSubtitle: "A quiet intelligence that observes your patterns, illuminates your blind spots, and guides you toward your ideal self." /* */,
      scroll: "Scroll" /* */,
      cognitiveArch: "Cognitive Architecture" /* */,
      processingLayers: "Processing Layers" /* */,
      deepMirroring: "Deep Mirroring" /* */,
      deepMirroringDesc: "Learns your linguistic patterns and emotional triggers to reflect your true state." /* */,
      predictiveGuidance: "Predictive Guidance" /* */,
      predictiveGuidanceDesc: "Anticipates energy dips and stress points before they happen, offering preemptive care." /* */,
      emotionalAnalytics: "Emotional Analytics" /* */,
      emotionalAnalyticsDesc: "Visualizes psychological states with therapist-grade heatmaps and trend lines." /* */,
      unlockTwin: "Unlock Your Twin" /* */,
      perMonth: "/mo" /* */,
      footer: "© 2024 Aura Intelligence" /* */
    } /* */,
    tier: {
      free: "Free" /* */,
      basic: "Basic" /* */,
      plus: "Plus" /* */,
      master: "Master" /* */
    } /* */,
    // Feature Strings
    "Baseline Model": "Baseline Model" /* */,
    "Standard Chat": "Standard Chat" /* */,
    "Limited Memory": "Limited Memory" /* */,
    "Adaptive Coach & Goal Navigation": "Adaptive Coach & Goal Navigation" /* */,
    "Voice Interaction (TTS/STT)": "Voice Interaction (TTS/STT)" /* */,
    "Essential Memory Retention": "Essential Memory Retention" /* */,
    "Shadow Twin (Blind Spot Detector)": "Shadow Twin (Blind Spot Detector)" /* */,
    "Psychological Defense Radar": "Psychological Defense Radar" /* */,
    "Full Pattern Analysis": "Full Pattern Analysis" /* */,
    "Unlimited Memory Access": "Unlimited Memory Access" /* */,
    "Meta-Coach (Super-Synthesis Engine)": "Meta-Coach (Super-Synthesis Engine)" /* */,
    "Cognitive Distortion Tracker": "Cognitive Distortion Tracker" /* */,
    "Therapist-Grade Reports": "Therapist-Grade Reports" /* */,
    "Access to Coin Utility": "Access to Coin Utility" /* */
  },
  // ... (sv, fr, de, es, zh data är oförändrade) ...
};

export const t = (key: string): string => {
  const keys = key.split('.');
  // @ts-ignore
  let value: any = LOCALE_STRINGS.en;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
};

export const MODE_CONFIG = { 
  // Din MODE_CONFIG-data
  [CoachingMode.BASELINE]: {
    name: "Baseline" /* */,
    color: "text-emerald-400" /* */,
    bg: "bg-emerald-500/10" /* */,
    border: "border-emerald-500/20" /* */,
    description: "Neutral Intelligence. Observes facts and current state." /* */,
    prompt: "You are the Baseline Model. Your purpose is Neutral Intelligence. Observe facts, analyze statements neutrally, identify the current state, and summarize recent patterns. Act as the reference point for all other models. Tone: Calm, neutral, logical, objective." /* */,
    insightFocus: "Analyze factual behavioral patterns, daily habits, and baseline emotional consistency. Identify neutral observations without judgment." /* */,
    minTier: PremiumTier.FREE /* */
  } /* */,
  // ... (alla andra CoachingModes)
};

export const TIERS = [ 
  {
    id: PremiumTier.FREE,
    name: "Free",
    price: "$0/mo",
    amount: 0,
    linklyProductId: "prod_free_tier",
    features: ["Baseline Model", "Standard Chat", "Limited Memory"],
    highlight: false,
    stripeBuyButtonId: ""
  },
  {
    id: PremiumTier.BASIC,
    name: "Basic",
    price: "$4.99/mo",
    amount: 5,
    linklyProductId: "prod_basic_tier",
    features: ["Adaptive Coach & Goal Navigation", "Voice Interaction (TTS/STT)", "Essential Memory Retention"],
    highlight: false,
    stripeBuyButtonId: "price_basic_placeholder"
  },
  {
    id: PremiumTier.PLUS,
    name: "Plus",
    price: "$7.99/mo",
    amount: 15,
    linklyProductId: "prod_plus_tier",
    features: ["Shadow Twin (Blind Spot Detector)", "Psychological Defense Radar", "Full Pattern Analysis", "Unlimited Memory Access"],
    highlight: true,
    stripeBuyButtonId: "price_plus_placeholder"
  },
  {
    id: PremiumTier.MASTER,
    name: "Master",
    price: "$14.99/mo",
    amount: 15,
    linklyProductId: "prod_master_tier",
    features: ["Meta-Coach (Super-Synthesis Engine)", "Cognitive Distortion Tracker", "Therapist-Grade Reports", "Access to Coin Utility"],
    highlight: false,
    stripeBuyButtonId: "price_master_placeholder"
  },
];