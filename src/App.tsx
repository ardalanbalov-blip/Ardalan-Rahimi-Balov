
import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, AuthMode, UserState, Message, AppData, CoachingMode, PremiumTier, TwinState, PaymentMethod, ChatThread } from './types';
import { APP_NAME, INITIAL_TWIN_STATE, MODE_CONFIG, t } from './constants';
import { generateTwinResponse, analyzeTwinState, preprocessUserSignal, generateInitialTelemetry, scanForCoreMemories } from './services/geminiService';
import { billingApi } from './services/billingApi';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import TwinAvatar from './components/TwinAvatar';
import InsightsDashboard from './components/InsightsDashboard';
import Marketplace from './components/Marketplace';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import PaymentGateway from './components/PaymentGateway';
import SubscriptionPortal from './components/SubscriptionPortal';
import MarketingBanner from './components/MarketingBanner';
import { MessageSquare, BarChart2, Send, LogOut, Activity, Eye, Zap, Brain, Hash, Layers, User, Volume2, VolumeX, Coins, Lock, Mic, MicOff, Clock, Search, X } from 'lucide-react';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const MODE_LIST = [
  CoachingMode.BASELINE,
  CoachingMode.ADAPTIVE,
  CoachingMode.SHADOW,
  CoachingMode.FUTURE,
  CoachingMode.PATTERN,
  CoachingMode.META
];

const ModeIcon = ({ mode, size = 16 }: { mode: CoachingMode, size?: number }) => {
  switch (mode) {
    case CoachingMode.BASELINE: return <Activity size={size} />;
    case CoachingMode.ADAPTIVE: return <Brain size={size} />;
    case CoachingMode.SHADOW: return <Eye size={size} />;
    case CoachingMode.FUTURE: return <Zap size={size} />;
    case CoachingMode.PATTERN: return <Hash size={size} />;
    case CoachingMode.META: return <Layers size={size} />;
    default: return <Activity size={size} />;
  }
};

const CURRENT_MARKETING_VERSION = 1;

const App = () => {
  const [data, setData] = useState<AppData>({
    user: null,
    threads: [],
    activeThreadId: null,
    insights: [],
    currentMode: CoachingMode.BASELINE,
    twinState: INITIAL_TWIN_STATE,
    rentalAccess: {}
  });
  const [view, setView] = useState<ViewMode>('LANDING');
  const [authMode, setAuthMode] = useState<AuthMode>('SIGNUP');
  const [selectedPlan, setSelectedPlan] = useState<PremiumTier>(PremiumTier.BASIC);
  const [showPortal, setShowPortal] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingApp, setLoadingApp] = useState(true);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Voice Synthesis Helper ---
  const speakResponse = (text: string) => {
    if (!data.user?.voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    if (!data.user) return;
    const newState = !data.user.voiceEnabled;
    const updatedUser = { ...data.user, voiceEnabled: newState };
    setData(prev => ({ ...prev, user: updatedUser }));
    dbService.updateUserFields(data.user.id, { voiceEnabled: newState });
    if (!newState) window.speechSynthesis.cancel();
  };

  // --- Voice Input (STT) Helper ---
  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' : '') + transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setInput(prev => prev ? prev : "Error: Microphone access denied.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- Authentication & Persistence ---
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let user = await dbService.loadUserState(firebaseUser.uid);
          
          if (user) {
             const threads = await dbService.loadThreads(firebaseUser.uid);
             const insights = await dbService.loadInsights(firebaseUser.uid);
             
             const initialThread = threads.length > 0 ? threads[0] : null;
             
             setData(prev => ({
               ...prev,
               user,
               threads,
               activeThreadId: initialThread ? initialThread.id : null,
               currentMode: initialThread ? initialThread.mode : CoachingMode.BASELINE,
               insights
             }));
             
             if (view === 'LANDING' || view === 'AUTH') {
                if (!user.name) setView('ONBOARDING');
                else if (user.subscriptionStatus === 'incomplete' && user.tier !== PremiumTier.FREE) setView('PAYMENT');
                else setView('CHAT');
             }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      } else {
        setData({
          user: null,
          threads: [],
          activeThreadId: null,
          insights: [],
          currentMode: CoachingMode.BASELINE,
          twinState: INITIAL_TWIN_STATE,
          rentalAccess: {}
        });
        setView('LANDING');
      }
      setLoadingApp(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Only auto-scroll if NOT searching to avoid jumping
    if (view === 'CHAT' && !searchQuery) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data.threads, isTyping, view, searchQuery]);

  // --- Logic Helpers ---
  const checkAccess = (user: UserState): boolean => {
    if (user.tier === PremiumTier.FREE || user.subscriptionStatus === 'free' || user.subscriptionStatus === 'cancelled') return true;
    if (['incomplete', 'past_due', 'paused', 'unpaid'].includes(user.subscriptionStatus)) return false;
    return true;
  };

  const getTierValue = (tier: PremiumTier): number => {
    switch (tier) {
      case PremiumTier.MASTER: return 3;
      case PremiumTier.PLUS: return 2;
      case PremiumTier.BASIC: return 1;
      case PremiumTier.FREE: return 0;
      default: return 0;
    }
  };

  const isRentalActive = (mode: CoachingMode) => {
    if (!data.rentalAccess) return false;
    return (data.rentalAccess[mode] || 0) > Date.now();
  };

  const hasModeAccess = (mode: CoachingMode): boolean => {
    if (!data.user) return false;
    if (isRentalActive(mode)) return true;
    
    const requiredTier = MODE_CONFIG[mode].minTier;
    const userTierVal = getTierValue(data.user.tier);
    const requiredTierVal = getTierValue(requiredTier);
    
    const isSubActive = ['active_subscription', 'trial_active', 'free', 'cancelled'].includes(data.user.subscriptionStatus);
    if (!isSubActive) return requiredTierVal === 0;

    return userTierVal >= requiredTierVal;
  };

  const createThreadObject = (mode: CoachingMode): ChatThread => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    mode,
    title: `${MODE_CONFIG[mode].name} Session`,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const createNewThread = async (mode: CoachingMode) => {
    if (!data.user) return;
    const newThread = createThreadObject(mode);
    setData(prev => ({ ...prev, threads: [...prev.threads, newThread], activeThreadId: newThread.id, currentMode: mode }));
    await dbService.saveChatThread(data.user.id, newThread);
  };

  // --- Handlers ---
  const handleAuthComplete = async (email: string, plan: PremiumTier, uid: string) => {
    let user = await dbService.loadUserState(uid);
    if (!user) {
      user = {
        id: uid,
        email,
        emailVerified: false,
        joinedAt: new Date().toISOString(),
        tier: plan,
        subscriptionStatus: plan === PremiumTier.FREE ? 'free' : 'incomplete',
        coins: 100,
        streakDays: 1,
        voiceEnabled: true,
        memories: [],
        lastViewedMarketingVersion: 0
      };
      await dbService.saveUserState(uid, user);
      
      setData({
        user,
        threads: [],
        activeThreadId: null,
        insights: [],
        currentMode: CoachingMode.BASELINE,
        twinState: INITIAL_TWIN_STATE,
        rentalAccess: {}
      });

      if (plan !== PremiumTier.FREE) {
        setView('PAYMENT');
      } else {
        setView('ONBOARDING');
      }
    } else {
       if (user.subscriptionStatus === 'incomplete' && user.tier !== PremiumTier.FREE) {
         setView('PAYMENT');
       } else if (!user.name) {
         setView('ONBOARDING');
       } else {
         setView('CHAT');
       }
    }
  };

  const handlePaymentSuccess = async (subData: any, pm: PaymentMethod) => {
    if (!data.user) return;
    const updatedUser: UserState = {
      ...data.user,
      subscriptionId: subData.subscriptionId,
      subscriptionStatus: subData.status,
      tier: selectedPlan,
      nextBillingDate: subData.currentPeriodEnd,
      paymentMethod: pm,
      cancelAtPeriodEnd: false
    };
    
    const safeMode = getTierValue(selectedPlan) >= getTierValue(MODE_CONFIG[data.currentMode].minTier) 
      ? data.currentMode 
      : CoachingMode.BASELINE;

    setData(prev => ({ ...prev, user: updatedUser, currentMode: safeMode }));
    await dbService.saveUserState(data.user!.id, updatedUser);
    setView(updatedUser.name ? 'CHAT' : 'ONBOARDING');
  };

  const handleCoinPurchase = async (amount: number) => {
    if (!data.user) return;
    await billingApi.buyCoinPackSecure(data.user.id, 'coin_pack', amount);
    const newBalance = data.user.coins + amount;
    
    const updatedUser = { ...data.user, coins: newBalance };
    setData(prev => ({ ...prev, user: updatedUser }));
    await dbService.updateUserFields(data.user!.id, { coins: newBalance });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !data.user) return;
    if (!checkAccess(data.user)) { setView('MARKETPLACE'); return; }

    let threadId = data.activeThreadId;
    let thread = data.threads.find(t => t.id === threadId);
    let isNewThread = false;

    if (!thread) {
        const newThread = createThreadObject(data.currentMode);
        thread = newThread;
        threadId = newThread.id;
        isNewThread = true;
    }

    setIsTyping(true);
    setInput('');

    const historyContext = thread.messages.slice(-5).map(m => m.text).join('\n');
    const [signal, newMemory] = await Promise.all([
      preprocessUserSignal(input, historyContext),
      scanForCoreMemories(input, data.user.memories)
    ]);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now(), mode: data.currentMode, signal };
    
    const updatedMemories = newMemory ? [...data.user.memories, newMemory] : data.user.memories;
    const coinsEarned = 10;
    
    const updatedUser = { ...data.user, memories: updatedMemories, coins: data.user.coins + coinsEarned };
    
    setData(prev => {
      let updatedThreads;
      if (isNewThread) {
          updatedThreads = [...prev.threads, { ...thread!, messages: [userMsg], updatedAt: Date.now() }];
      } else {
          updatedThreads = prev.threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, userMsg], updatedAt: Date.now() } : t);
      }
      return {
          ...prev,
          user: updatedUser,
          threads: updatedThreads,
          activeThreadId: threadId
      };
    });

    dbService.updateUserFields(data.user.id, { memories: updatedMemories, coins: updatedUser.coins });

    const threadWithMsg = { ...thread, messages: [...thread.messages, userMsg], updatedAt: Date.now() };
    await dbService.saveChatThread(data.user.id, threadWithMsg);

    const updatedHistory = [...thread.messages, userMsg];
    if (updatedHistory.length >= 2 && data.insights.length === 0) {
      generateInitialTelemetry(updatedHistory, data.user.name || 'User', signal).then(insights => {
        if (insights.length) {
            setData(d => ({ ...d, insights: [...d.insights, ...insights] }));
            insights.forEach(i => dbService.saveInsight(data.user!.id, i));
        }
      });
    }

    const responseText = await generateTwinResponse(
      userMsg.text, 
      thread.messages, 
      data.currentMode, 
      data.user.name || 'User',
      data.insights.slice(-5), 
      signal,
      data.user.memories
    );

    const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now(), mode: data.currentMode };
    setIsTyping(false);
    speakResponse(responseText);

    const finalThread = { ...threadWithMsg, messages: [...threadWithMsg.messages, botMsg], updatedAt: Date.now() };

    setData(prev => ({
      ...prev,
      threads: prev.threads.map(t => t.id === threadId ? finalThread : t)
    }));
    dbService.saveChatThread(data.user.id, finalThread);
    
    analyzeTwinState([...updatedHistory, botMsg], data.currentMode, signal).then(({ twinState, insight }) => {
       if (insight) {
           setData(d => ({ ...d, twinState, insights: [...d.insights, insight] }));
           dbService.saveInsight(data.user!.id, insight);
       } else {
           setData(d => ({ ...d, twinState }));
       }
    });
  };

  const handleSubscriptionAction = async (action: 'cancel' | 'resume' | 'update_payment' | 'change_plan_view') => {
    if (!data.user) return;
    const subId = data.user.subscriptionId || `sub_gen_${Date.now()}`;
    
    if (action === 'change_plan_view') { setShowPortal(false); setView('MARKETPLACE'); return; }

    if (action === 'cancel') {
      const res = await billingApi.cancelSubscriptionSecure(subId);
      if (res.success && res.data) {
        const updated = { ...data.user, subscriptionId: subId, subscriptionStatus: res.data.status, cancelAtPeriodEnd: true };
        setData(prev => ({ ...prev, user: updated }));
        dbService.saveUserState(data.user!.id, updated);
      }
    }
    if (action === 'resume') {
       const res = await billingApi.reactivateSubscriptionSecure(subId);
       if (res.success && res.data) {
         const updated = { ...data.user, subscriptionId: subId, subscriptionStatus: res.data.status, cancelAtPeriodEnd: false };
         setData(prev => ({ ...prev, user: updated }));
         dbService.saveUserState(data.user!.id, updated);
       }
    }
    if (action === 'update_payment') {
      const res = await billingApi.updatePaymentMethodSecure(subId, { type: 'card' });
      if (res.success && res.data) {
        const updated = { ...data.user, paymentMethod: res.data };
        setData(prev => ({ ...prev, user: updated }));
        dbService.saveUserState(data.user!.id, updated);
      }
    }
  };

  const handlePlanChange = async (newTier: PremiumTier) => {
    if (!data.user) return;
    
    const isUpgrade = getTierValue(newTier) > getTierValue(data.user.tier);
    
    if (isUpgrade) {
      setSelectedPlan(newTier); setShowPortal(false); setView('PAYMENT');
      return;
    }
    
    const subId = data.user.subscriptionId || `sub_gen_${Date.now()}`;
    const res = await billingApi.changePlanSecure(subId, newTier);
    if (res.success && res.data) {
      const safeMode = getTierValue(newTier) >= getTierValue(MODE_CONFIG[data.currentMode].minTier) 
        ? data.currentMode 
        : CoachingMode.BASELINE;

      const updated = { 
        ...data.user, 
        tier: newTier, 
        subscriptionStatus: res.data.status, 
        cancelAtPeriodEnd: false 
      };
      
      setData(prev => ({ 
        ...prev, 
        currentMode: safeMode,
        user: updated
      }));
      dbService.saveUserState(data.user!.id, updated);
      setShowPortal(false); setView('CHAT');
    }
  };

  const handleModeSwitch = (mode: CoachingMode) => {
    if (hasModeAccess(mode)) {
      const existingThread = data.threads.find(t => t.mode === mode);
      setData(prev => ({ 
        ...prev, 
        currentMode: mode,
        activeThreadId: existingThread ? existingThread.id : null
      }));
    } else {
      setShowPortal(true);
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
      e.preventDefault(); 
      if (!data.user) return;
      const fd = new FormData(e.currentTarget as HTMLFormElement); 
      const name = fd.get('name') as string; 
      
      const updated = { ...data.user, name };
      setData(prev => ({...prev, user: updated})); 
      await dbService.updateUserFields(data.user!.id, { name });
      
      createNewThread(CoachingMode.BASELINE); 
      setView('CHAT');
  }

  const handleDismissMarketing = async () => {
    if (!data.user) return;
    const updated = { ...data.user, lastViewedMarketingVersion: CURRENT_MARKETING_VERSION };
    setData(prev => ({ ...prev, user: updated }));
    await dbService.updateUserFields(data.user.id, { lastViewedMarketingVersion: CURRENT_MARKETING_VERSION });
  };
  
  // Filter messages based on search query
  const getFilteredMessages = () => {
    const activeThread = data.threads.find(t => t.id === data.activeThreadId);
    if (!activeThread) return [];
    if (!searchQuery.trim()) return activeThread.messages;
    
    return activeThread.messages.filter(m => 
        m.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (loadingApp && view !== 'LANDING') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
           <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse" />
           <p className="text-zinc-500 text-sm">{t('loading.sync')}</p>
         </div>
      </div>
    );
  }

  if (view === 'LANDING') return <LandingPage onLogin={() => {setAuthMode('LOGIN'); setView('AUTH')}} onSelectPlan={(tier) => {setSelectedPlan(tier); setAuthMode('SIGNUP'); setView('AUTH')}} />; 
  if (view === 'AUTH') return <Auth mode={authMode} selectedPlan={selectedPlan} onAuthComplete={handleAuthComplete} onSwitchMode={setAuthMode} onBack={() => setView('LANDING')} />; 
  if (view === 'PAYMENT') return <PaymentGateway selectedTier={selectedPlan} userId={data.user?.id || ''} userEmail={data.user?.email || ''} onSuccess={handlePaymentSuccess} onBack={() => setView('AUTH')} />; 
  if (view === 'ONBOARDING') return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-light mb-4">{t('onboarding.title')}</h1>
      <form onSubmit={handleOnboard}>
        <input name="name" required placeholder={t('onboarding.namePlaceholder')} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center w-full max-w-xs mb-4 text-white" />
        <button type="submit" className="bg-white text-black px-8 py-3 rounded-xl font-bold">{t('onboarding.begin')}</button>
      </form>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-black text-white font-sans overflow-hidden">
      {showPortal && data.user && <SubscriptionPortal user={data.user} onClose={() => setShowPortal(false)} onAction={handleSubscriptionAction} />}
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <div className="text-xs text-zinc-500 uppercase flex justify-between mt-1">
             <span>{data.user?.tier}</span>
             <span className="text-amber-400 flex items-center gap-1"><Coins size={10}/> {data.user?.coins}</span>
          </div>
        </div>
        
        <nav className="space-y-1 mb-8">
          <button onClick={() => setView('CHAT')} className={`w-full flex gap-3 p-3 rounded-xl transition-all ${view === 'CHAT' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}><MessageSquare size={18}/> {t('nav.chat')}</button>
          <button onClick={() => setView('INSIGHTS')} className={`w-full flex gap-3 p-3 rounded-xl transition-all ${view === 'INSIGHTS' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}><BarChart2 size={18}/> {t('nav.dossier')}</button>
          <button onClick={() => setView('MARKETPLACE')} className={`w-full flex gap-3 p-3 rounded-xl transition-all ${view === 'MARKETPLACE' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}><Zap size={18}/> {t('nav.store')}</button>
        </nav>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3 px-2">{t('sidebar.coachingModes')}</h3>
          <div className="space-y-1">
            {MODE_LIST.map((mode) => {
               const active = data.currentMode === mode;
               const locked = !hasModeAccess(mode);
               const rented = isRentalActive(mode);
               const modeName = t(`mode.${mode.toLowerCase()}.name`);
               const config = MODE_CONFIG[mode];
               
               return (
                 <button
                   key={mode}
                   onClick={() => handleModeSwitch(mode)}
                   className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all group ${active ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                 >
                   <div className="flex items-center gap-3">
                     <span className={`${active ? 'text-white' : config.color.replace('text-', 'text-opacity-70 text-')}`}>
                       <ModeIcon mode={mode} size={18} />
                     </span>
                     <span>{modeName}</span>
                   </div>
                   {rented && <Clock size={12} className="text-amber-500" />}
                   {locked && !rented && <Lock size={12} className="text-zinc-600 group-hover:text-zinc-500" />}
                 </button>
               );
            })}
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-4 space-y-2 mt-4">
          <div className="flex items-center justify-between text-zinc-500 px-2">
            <span className="text-xs uppercase">{t('sidebar.voice')}</span>
            <button onClick={toggleVoice}>{data.user?.voiceEnabled ? <Volume2 size={16} className="text-emerald-400"/> : <VolumeX size={16}/>}</button>
          </div>
          <button onClick={() => setShowPortal(true)} className="w-full flex gap-3 p-3 text-zinc-500 hover:text-white"><User size={18}/> {t('sidebar.subscription')}</button>
          <button onClick={async () => { 
            await authService.signOutUser(); 
          }} className="w-full flex gap-3 p-3 text-zinc-500 hover:text-red-400"><LogOut size={18}/> {t('nav.logout')}</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-zinc-950 min-w-0">
        
        {/* MOBILE TOP HEADER */}
        <header className="md:hidden p-4 border-b border-zinc-800 flex justify-between bg-zinc-950 items-center flex-none">
           <span className="font-bold tracking-widest text-sm">{APP_NAME}</span>
           <div className="flex items-center gap-3">
             <span className="text-xs text-amber-500 flex items-center gap-1 font-mono"><Coins size={10}/> {data.user?.coins}</span>
             <button onClick={() => setShowPortal(true)}><User size={18}/></button>
           </div>
        </header>

        {view === 'CHAT' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            
            {/* SEARCH OVERLAY */}
            {isSearchOpen && (
                <div className="absolute top-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm z-30 p-4 border-b border-zinc-700 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 max-w-3xl mx-auto">
                        <Search size={18} className="text-zinc-400" />
                        <input 
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('placeholder.search')}
                            className="bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-500 flex-1 text-sm h-10"
                        />
                        <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2 text-zinc-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {!isSearchOpen && (
                <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="absolute top-4 right-4 z-20 p-2 text-zinc-500 hover:text-white bg-zinc-900/50 rounded-full border border-zinc-800/50 backdrop-blur-md md:top-6 md:right-6 transition-colors"
                >
                    <Search size={16} />
                </button>
            )}

            <div className="flex-none h-40 md:h-64 flex items-center justify-center border-b border-zinc-800 bg-zinc-900/30 relative overflow-hidden">
               <div className="scale-[0.6] md:scale-100 origin-center transition-transform duration-300">
                  <TwinAvatar state={data.twinState} mode={data.currentMode} />
               </div>
               
               <div className="absolute bottom-4 flex gap-2 md:hidden">
                 {MODE_LIST.map(m => {
                   const active = data.currentMode === m;
                   const locked = !hasModeAccess(m);
                   return (
                     <div key={m} className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white scale-125' : locked ? 'bg-zinc-700' : 'bg-zinc-500'}`} />
                   );
                 })}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 pb-4 md:pb-4 min-h-0 scrollbar-hide">
              {data.user && data.user.lastViewedMarketingVersion < CURRENT_MARKETING_VERSION && (
                <MarketingBanner 
                  title={t('banner.shadowTitle')}
                  description={t('banner.shadowDesc')}
                  onDismiss={handleDismissMarketing}
                  actionLabel={t('button.learnMore')}
                  onAction={() => setView('MARKETPLACE')}
                />
              )}

              {data.activeThreadId ? (
                  getFilteredMessages().length > 0 ? (
                      getFilteredMessages().map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`
                            max-w-[90%] md:max-w-[70%] 
                            p-3.5 md:p-4 
                            text-sm leading-relaxed 
                            break-words shadow-sm
                            ${msg.role === 'user' 
                              ? 'bg-zinc-800 text-white rounded-2xl rounded-tr-sm' 
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-sm'}
                          `}>
                            {msg.text}
                          </div>
                        </div>
                      ))
                  ) : searchQuery ? (
                      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                          No messages found for "{searchQuery}"
                      </div>
                  ) : (
                       <div className="flex items-center justify-center h-full text-zinc-600 text-sm italic pb-10">
                          {t('placeholder.startSession')} {t(`mode.${data.currentMode.toLowerCase()}.name`)}...
                       </div>
                  )
              ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600 text-sm italic pb-10">
                      {t('placeholder.startSession')} {t(`mode.${data.currentMode.toLowerCase()}.name`)}...
                  </div>
              )}
              {isTyping && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-12">
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>

            <div className="flex-none px-3 py-3 border-t border-zinc-800 bg-zinc-950 pb-28 md:pb-4 z-10 safe-area-bottom">
               <div className="relative max-w-3xl mx-auto">
                 <button 
                    onClick={toggleVoiceInput}
                    className={`absolute left-2 top-2 p-1.5 rounded-full z-10 transition-colors ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-zinc-400 hover:text-white'}`}
                    title="Toggle Voice Input"
                 >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                 </button>

                 <input 
                   value={input} 
                   onChange={e => setInput(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-10 pr-12 text-white focus:outline-none placeholder:text-zinc-600 text-base md:text-sm" 
                   placeholder={isListening ? t('placeholder.listening') : t('placeholder.message')} 
                 />
                 <button onClick={handleSendMessage} className="absolute right-2 top-2 p-1.5 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"><Send size={16}/></button>
               </div>
            </div>
          </div>
        )}

        {view === 'INSIGHTS' && <InsightsDashboard insights={data.insights} tier={data.user?.tier || PremiumTier.BASIC} />}
        {view === 'MARKETPLACE' && <Marketplace currentTier={data.user?.tier || PremiumTier.FREE} onUpgrade={handlePlanChange} onCoinPurchase={handleCoinPurchase} />}

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0b] border-t border-zinc-800 h-16 flex items-center px-1 z-50 safe-area-bottom min-w-0">
          
          <div className="flex-none flex items-center gap-1 h-full mr-1">
            <button 
              onClick={() => setView('CHAT')} 
              className={`flex flex-col items-center justify-center w-12 h-full ${view === 'CHAT' ? 'text-white' : 'text-zinc-500'}`}
            >
              <MessageSquare size={18} />
              <span className="text-[9px] mt-1 font-medium tracking-tight">{t('nav.chat')}</span>
            </button>
            
            <button 
              onClick={() => setView('INSIGHTS')} 
              className={`flex flex-col items-center justify-center w-12 h-full ${view === 'INSIGHTS' ? 'text-white' : 'text-zinc-500'}`}
            >
              <BarChart2 size={18} />
              <span className="text-[9px] mt-1 font-medium tracking-tight">{t('nav.dossier')}</span>
            </button>
            
            <button 
              onClick={() => setView('MARKETPLACE')} 
              className={`flex flex-col items-center justify-center w-12 h-full ${view === 'MARKETPLACE' ? 'text-white' : 'text-zinc-500'}`}
            >
              <Zap size={18} />
              <span className="text-[9px] mt-1 font-medium tracking-tight">{t('nav.store')}</span>
            </button>
          </div>

          <div className="flex-1 h-full flex items-center overflow-x-auto scrollbar-hide min-w-0">
            <div className="w-px h-8 bg-zinc-800 mx-1 flex-shrink-0" />

            <div className="flex items-center h-full pr-4 gap-1">
              {MODE_LIST.map((mode) => {
                const active = data.currentMode === mode;
                const locked = !hasModeAccess(mode);
                const rented = isRentalActive(mode);
                
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if(view !== 'CHAT') setView('CHAT');
                      handleModeSwitch(mode);
                    }}
                    className={`flex flex-col items-center justify-center w-12 h-full relative group flex-shrink-0`}
                  >
                    <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-white/10 text-white' : 'text-zinc-500'}`}>
                      <ModeIcon mode={mode} size={12} />
                    </div>
                    {rented && (
                      <div className="absolute top-3 right-3 bg-black rounded-full p-[1px] border border-amber-500/50 flex items-center justify-center">
                        <Clock size={6} className="text-amber-500"/>
                      </div>
                    )}
                    {locked && !rented && (
                      <div className="absolute top-3 right-3 bg-black rounded-full p-[1px] border border-zinc-800 flex items-center justify-center">
                        <Lock size={6} className="text-zinc-500"/>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </main>
    </div>
  );
};

export default App;