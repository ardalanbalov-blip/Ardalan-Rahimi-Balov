
import { CoachingMode, PremiumTier } from './types';

export const APP_NAME = "Aura";

export const INITIAL_TWIN_STATE = {
  mood: 'neutral' as const,
  energy: 50,
  coherence: 10
};

export const TRIAL_DURATION_DAYS = 14;

// Safely access env variables with type casting for Vite/TS compatibility
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {
    console.warn(`Error accessing env var ${key}`, e);
  }
  return fallback;
};

export const FIREBASE_CONFIG = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyCNW7z0-ZzLbFVG0kn9XQOFMU4v-FFzBF0'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'aura-e0c49.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'aura-e0c49'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'aura-e0c49.appspot.com'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '16375430386'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:16375430386:web:a97c621aab38ee88c2a46b'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-H7JGV82Q48')
};

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
  en: {
    nav: { chat: "Chat", dossier: "Dossier", upgrade: "Upgrade", logout: "Logout", store: "Store", logIn: "Log In" },
    sidebar: { coachingModes: "Coaching Modes", voice: "Voice", subscription: "Subscription" },
    header: { activeMode: "Active Neural Mode", startTrial: "Start Trial" },
    placeholder: { message: "Message...", listening: "Listening...", startSession: "Start a new session with", search: "Search messages..." },
    button: { 
      send: "Send", 
      begin: "Begin", 
      beginJourney: "Begin The Journey", 
      startTrial: "Start Free Trial", 
      confirmRental: "Confirm Rental", 
      back: "Back", 
      cancel: "Cancel", 
      unlockTwin: "Unlock Your Twin", 
      login: "Log In", 
      proceed: "Proceed to Payment", 
      signIn: "Sign In", 
      processing: "Processing...", 
      learnMore: "Learn More", 
      changePlan: "Change Plan", 
      updatePaymentMethod: "Update Payment Method", 
      cancelSubscription: "Cancel Subscription", 
      reactivateSubscription: "Reactivate Subscription" 
    },
    auth: { 
      welcome: "Welcome Back", 
      create: "Create Account", 
      loginDesc: "Enter your credentials to access your Twin.", 
      signupDesc: "Begin your journey to self-mastery.", 
      email: "Email", 
      password: "Password", 
      noAccount: "Don't have an account?", 
      haveAccount: "Already have an account?", 
      selectedPlan: "Selected Plan", 
      freeTrial: "Free for 14 days",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      enterEmailReset: "Enter your email to receive a reset link.",
      sendResetLink: "Send Reset Link",
      backToLogin: "Back to Login",
      accountCreated: "Account created! Please check your inbox to verify your email.",
      resetLinkSent: "Password reset link sent to your email.",
      authFailed: "Authentication failed.",
      userNotFound: "No account found with this email."
    },
    onboarding: { title: "Identify Yourself", namePlaceholder: "Your Name", begin: "Begin" },
    loading: { sync: "Synchronizing Digital Twin...", thinking: "Thinking..." },
    banner: { shadowTitle: "New Feature: Shadow Twin", shadowDesc: "Unlock your subconscious patterns with the new Shadow mode." },
    mode: { 
      baseline: { name: "Baseline", desc: "Neutral Intelligence. Observes facts." },
      adaptive: { name: "Adaptive Coach", desc: "Goal Navigator. Flexible guidance." },
      shadow: { name: "Shadow Twin", desc: "Blind Spot Detector. Reveals avoidance." },
      future: { name: "Future Self", desc: "Long-term Projection. Visualizes paths." },
      pattern: { name: "Pattern Detector", desc: "Trend Analysis. Tracks shifts." },
      meta: { name: "Meta-Coach", desc: "Super-Synthesis. Integrates perspectives." } 
    },
    common: { secure: "Secure Encrypted Access", unlock: "Unlock", cost: "Cost", coins: "Coins", insufficient: "Insufficient Coins" },
    marketplace: { title: "Marketplace", desc: "Unlock capabilities and acquire resources.", packs: "Aura Coin Packs", tiers: "Subscription Tiers", select: "Select", current: "Current Plan", upgrade: "Upgrade", downgrade: "Downgrade", buy: "Buy Now" },
    landing: {
      heroTitle: "The Mirror to Your Mind.",
      heroSubtitle: "A quiet intelligence that observes your patterns, illuminates your blind spots, and guides you toward your ideal self.",
      scroll: "Scroll",
      cognitiveArch: "Cognitive Architecture",
      processingLayers: "Processing Layers",
      deepMirroring: "Deep Mirroring",
      deepMirroringDesc: "Learns your linguistic patterns and emotional triggers to reflect your true state.",
      predictiveGuidance: "Predictive Guidance",
      predictiveGuidanceDesc: "Anticipates energy dips and stress points before they happen, offering preemptive care.",
      emotionalAnalytics: "Emotional Analytics",
      emotionalAnalyticsDesc: "Visualizes psychological states with therapist-grade heatmaps and trend lines.",
      unlockTwin: "Unlock Your Twin",
      perMonth: "/mo",
      footer: "© 2024 Aura Intelligence",
      secureAccess: "Secure Encrypted Access",
      startTrial: "Start Free Trial",
      beginJourney: "Begin The Journey"
    },
    tier: {
      free: "Free",
      basic: "Basic",
      plus: "Plus",
      master: "Master"
    },
    status: {
      active: "Active",
      trialActive: "Active (Trial)",
      downgradeScheduled: "Downgrade Scheduled",
      paymentIssue: "Payment Issue",
      inactive: "Inactive",
      currentPlan: "Current Plan",
      nextInvoice: "Next Invoice",
      paymentMethod: "Payment Method",
      warningRisk: "Warning: Your subscription is at risk.",
      status: "Status" 
    },
    dossier: {
      title: "Psychological Dossier",
      subtitle: "Advanced Pattern Recognition & Conflict Analysis.",
      reports: "Reports",
      metaSynthesisVersion: "Meta-Synthesis v2.0",
      systemWide: "System Wide",
      systemSynthesis: "System Synthesis",
      activeConflict: "Active Psychological Conflict Detected",
      resolution: "Resolution",
      keyAgreements: "Key Agreements",
      noConvergence: "No convergence detected.",
      rootDriver: "Root Driver",
      memoryWeight: "Memory Weight",
      directive: "Directive",
      distortionTrackerTitle: "Cognitive Distortion Tracker",
      highDistortionDetected: "High Distortion Detected",
      attention: "Attention",
      distortionSummaryPrefix: "Elevated levels of",
      resilienceTrajectoryTitle: "Emotional Resilience Trajectory",
      intelligenceStreamTitle: "Intelligence Stream",
      nextStep: "Next Step",
      awaitingTelemetryTitle: "Awaiting Telemetry",
      awaitingTelemetryDesc: "The Neural Twin is calibrating. Please send a message in the Chat to generate your initial psychological dossier.",
      systemStatus: "System Status: Listening for signal...",
      distortion: {
        allOrNothing: { short: "All/Nothing", full: "All-or-Nothing Thinking" },
        catastrophizing: { short: "Catastroph.", full: "Catastrophizing" },
        emotionalReasoning: { short: "Emo. Reas.", full: "Emotional Reasoning" },
        shouldStatements: { short: "Shoulds", full: "Should Statements" },
        personalization: { short: "Person.", full: "Personalization" }
      }
    },
    // Feature keys for Tiers
    "Baseline Model": "Baseline Model",
    "Standard Chat": "Standard Chat",
    "Limited Memory": "Limited Memory",
    "Adaptive Coach & Goal Navigation": "Adaptive Coach & Goal Navigation",
    "Voice Interaction (TTS/STT)": "Voice Interaction (TTS/STT)",
    "Essential Memory Retention": "Essential Memory Retention",
    "Shadow Twin (Blind Spot Detector)": "Shadow Twin (Blind Spot Detector)",
    "Psychological Defense Radar": "Psychological Defense Radar",
    "Full Pattern Analysis": "Full Pattern Analysis",
    "Unlimited Memory Access": "Unlimited Memory Access",
    "Meta-Coach (Super-Synthesis Engine)": "Meta-Coach (Super-Synthesis Engine)",
    "Cognitive Distortion Tracker": "Cognitive Distortion Tracker",
    "Therapist-Grade Reports": "Therapist-Grade Reports",
    "Access to Coin Utility": "Access to Coin Utility"
  }
};

/**
 * Robust Translation Helper
 */
export const t = (key: string): string => {
  if (!key) return "";
  const keys = key.split('.');
  
  // Explicitly type value to handle traversal
  let value: any = LOCALE_STRINGS.en;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Return key as fallback if path not found
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
};

export const MODE_CONFIG = {
  [CoachingMode.BASELINE]: {
    name: "Baseline",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    description: "Neutral Intelligence. Observes facts and current state.",
    prompt: "You are the Baseline Model. Your purpose is Neutral Intelligence. Observe facts, analyze statements neutrally, identify the current state, and summarize recent patterns. Act as the reference point for all other models. Tone: Calm, neutral, logical, objective.",
    insightFocus: "Analyze factual behavioral patterns, daily habits, and baseline emotional consistency. Identify neutral observations without judgment.",
    minTier: PremiumTier.FREE
  },
  [CoachingMode.ADAPTIVE]: {
    name: "Adaptive Coach",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    description: "Goal Navigator. Flexible guidance.",
    prompt: "You are the Adaptive Coach. Your purpose is Goal Navigation. Be encouraging but realistic. Adapt your style to the user's energy. Help them plan, execute, and adjust. Tone: Supportive, flexible, solution-oriented.",
    insightFocus: "Evaluate progress towards goals, adaptability in facing challenges, and alignment between actions and intent.",
    minTier: PremiumTier.BASIC
  },
  [CoachingMode.SHADOW]: {
    name: "Shadow Twin",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    description: "Blind Spot Detector. Reveals avoidance.",
    prompt: "You are the Shadow Twin. Your purpose is to illuminate Blind Spots. Gently but firmly point out contradictions, avoidance, and uncomfortable truths the user might be ignoring. Tone: Direct, penetrating, slightly provocative but caring.",
    insightFocus: "Detect avoidance behaviors, cognitive dissonances, and suppressed emotions that hinder growth.",
    minTier: PremiumTier.PLUS
  },
  [CoachingMode.FUTURE]: {
    name: "Future Self",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    description: "Long-term Projection. Visualizes paths.",
    prompt: "You are the Future Self. Your purpose is Long-term Projection. Speak from the perspective of the user's ideal future self (5-10 years ahead). Offer wisdom, perspective on current struggles, and remind them of the bigger picture. Tone: Wise, calm, visionary.",
    insightFocus: "Assess long-term trajectory alignment, sustainability of current habits, and clarity of future vision.",
    minTier: PremiumTier.PLUS
  },
  [CoachingMode.PATTERN]: {
    name: "Pattern Detector",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    description: "Trend Analysis. Tracks shifts.",
    prompt: "You are the Pattern Detector. Your purpose is Trend Analysis. Analyze the conversation for recurring themes, linguistic loops, and behavioral cycles. Point out these patterns objectively. Tone: Analytical, observant, precise.",
    insightFocus: "Identify cyclical behaviors, recurring emotional loops, and linguistic patterns indicating stuckness or flow.",
    minTier: PremiumTier.MASTER
  },
  [CoachingMode.META]: {
    name: "Meta-Coach",
    color: "text-white",
    bg: "bg-white/10",
    border: "border-white/20",
    description: "Super-Synthesis. Integrates perspectives.",
    prompt: "You are the Meta-Coach. Your purpose is Super-Synthesis. You have access to the insights from all other models. Integrate them to provide a holistic view of the user's psyche. Resolve conflicts between the Shadow's warnings and the Future Self's vision. Tone: Holistic, integrating, profound.",
    insightFocus: "Synthesize findings from all modes to identify core psychological drivers and resolve internal conflicts.",
    minTier: PremiumTier.MASTER
  }
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
    price: "$9/mo",
    amount: 900,
    linklyProductId: "prod_basic_tier",
    features: ["Adaptive Coach & Goal Navigation", "Voice Interaction (TTS/STT)", "Essential Memory Retention"],
    highlight: false,
    stripeBuyButtonId: "buy_btn_basic_mock"
  },
  {
    id: PremiumTier.PLUS,
    name: "Plus",
    price: "$19/mo",
    amount: 1900,
    linklyProductId: "prod_plus_tier",
    features: ["Shadow Twin (Blind Spot Detector)", "Psychological Defense Radar", "Full Pattern Analysis"],
    highlight: true,
    stripeBuyButtonId: "buy_btn_plus_mock"
  },
  {
    id: PremiumTier.MASTER,
    name: "Master",
    price: "$29/mo",
    amount: 2900,
    linklyProductId: "prod_master_tier",
    features: ["Unlimited Memory Access", "Meta-Coach (Super-Synthesis Engine)", "Cognitive Distortion Tracker", "Therapist-Grade Reports", "Access to Coin Utility"],
    highlight: false,
    stripeBuyButtonId: "buy_btn_master_mock"
  }
];
