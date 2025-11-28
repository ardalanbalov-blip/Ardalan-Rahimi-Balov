import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, AuthMode, UserState, Message, AppData, CoachingMode, PremiumTier, TwinState, PaymentMethod, SubscriptionStatus, ChatThread } from './types';
import { APP_NAME, INITIAL_TWIN_STATE, MODE_CONFIG, TIERS } from './constants';
import { generateTwinResponse, analyzeTwinState, generateMetaInsight, preprocessUserSignal, generateInitialTelemetry, scanForCoreMemories } from './services/geminiService';
import { MockPaymentService } from './services/mockPaymentService';
import TwinAvatar from './components/TwinAvatar';
import InsightsDashboard from './components/InsightsDashboard';
import Marketplace from './components/Marketplace';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import PaymentGateway from './components/PaymentGateway';
import SubscriptionPortal from './components/SubscriptionPortal';


import { MessageSquare, BarChart2, Send, LogOut, Activity, Eye, Zap, Brain, Hash, Layers, User, Volume2, VolumeX, Coins, Lock, Mic, MicOff, Menu } from 'lucide-react';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// 1. STRICT ORDER DEFINITION
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
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simple translation helper for legacy App.tsx
  const t = (key: string) => key;

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
    setData(prev => ({ ...prev, user: { ...prev.user!, voiceEnabled: newState } }));
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

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('aura_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration & Defaults
      if (!parsed.user) { setView('LANDING'); return; }
      if (!parsed.user.memories) parsed.user.memories = [];
      if (parsed.user.coins === undefined) parsed.user.coins = 0;
      if (parsed.user.voiceEnabled === undefined) parsed.user.voiceEnabled = true;
      setData(parsed);
      if (checkAccess(parsed.user)) {
         if (parsed.threads.length === 0) createNewThread(CoachingMode.BASELINE);
         setView('CHAT');
      }
    }
  }, []);

  useEffect(() => {
    if (data.user) localStorage.setItem('aura_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (view === 'CHAT') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.threads, isTyping, view]);

  // --- Logic Helpers ---
  const checkAccess = (user: UserState): boolean => {
    if (user.tier === PremiumTier.FREE || user.subscriptionStatus === 'free' || user.subscriptionStatus === 'cancelled') return true;
    if (['incomplete', 'past_due', 'paused', 'unpaid'].includes(user.subscriptionStatus)) return false;
    if (user.subscriptionStatus === 'active_subscription') return true;
    if (user.subscriptionStatus === 'trial_active') return true; 
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

  const hasModeAccess = (mode: CoachingMode): boolean => {
    if (!data.user) return false;
    const requiredTier = MODE_CONFIG[mode].minTier;
    const userTierVal = getTierValue(data.user.tier);
    const requiredTierVal = getTierValue(requiredTier);
    
    // Check if subscription is valid/active, otherwise downgrade capability to FREE
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

  const createNewThread = (mode: CoachingMode) => {
    const newThread = createThreadObject(mode);
    setData(prev => ({ ...prev, threads: [...prev.threads, newThread], activeThreadId: newThread.id, currentMode: mode }));
  };

  // --- Handlers ---
  const handleAuthComplete = (userState: UserState) => {
    setData(prev => ({ ...prev, user: userState }));
    
    if (userState.tier !== PremiumTier.FREE && userState.subscriptionStatus === 'incomplete') {
        setView('PAYMENT');
    } else if (!userState.name) {
        setView('ONBOARDING');
    } else {
        setView('CHAT');
    }
  };

  const handlePaymentSuccess = (updatedFields: Partial<UserState>) => {
    if (!data.user) return;
    const updatedUser: UserState = { ...data.user, ...updatedFields };
    
    // Ensure current mode is valid for new tier, if not fallback to Baseline
    const safeMode = getTierValue(updatedUser.tier) >= getTierValue(MODE_CONFIG[data.currentMode].minTier) 
      ? data.currentMode 
      : CoachingMode.BASELINE;

    setData(prev => ({ ...prev, user: updatedUser, currentMode: safeMode }));
    setView(updatedUser.name ? 'CHAT' : 'ONBOARDING');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !data.user || !data.activeThreadId) return;
    if (!checkAccess(data.user)) { setView('MARKETPLACE'); return; }

    const threadId = data.activeThreadId;
    const thread = data.threads.find(t => t.id === threadId);
    if (!thread) return;

    setIsTyping(true);
    setInput('');

    // 1. Preprocessing & Memory Scan (Parallel)
    const historyContext = thread.messages.slice(-5).map(m => m.text).join('\n');
    const [signal, newMemory] = await Promise.all([
      preprocessUserSignal(input, historyContext),
      scanForCoreMemories(input, data.user.memories)
    ]);

    // 2. Add User Message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now(), mode: data.currentMode, signal };
    
    // 3. Update State
    setData(prev => {
      const updatedMemories = newMemory ? [...prev.user!.memories, newMemory] : prev.user!.memories;
      return {
        ...prev,
        user: { ...prev.user!, memories: updatedMemories, coins: prev.user!.coins + 10 },
        threads: prev.threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, userMsg], updatedAt: Date.now() } : t)
      };
    });

    if (newMemory) console.log("New Core Memory:", newMemory);

    // 4. Initial Telemetry
    const updatedHistory = [...thread.messages, userMsg];
    if (updatedHistory.length >= 2 && data.insights.length === 0) {
      generateInitialTelemetry(updatedHistory, data.user.name || 'User', signal).then(insights => {
        if (insights.length) setData(d => ({ ...d, insights: [...d.insights, ...insights] }));
      });
    }

    // 5. Generate AI Response
    const responseText = await generateTwinResponse(
      userMsg.text, 
      thread.messages, 
      data.currentMode, 
      data.user.name || 'User',
      data.insights.slice(-5), 
      signal,
      data.user.memories
    );

    // 6. Handle AI Message & Voice
    const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now(), mode: data.currentMode };
    setIsTyping(false);
    speakResponse(responseText);

    setData(prev => ({
      ...prev,
      threads: prev.threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, botMsg], updatedAt: Date.now() } : t)
    }));
    
    // 7. Background Analysis
    analyzeTwinState([...updatedHistory, botMsg], data.currentMode, signal).then(({ twinState, insight }) => {
       if (insight) setData(d => ({ ...d, twinState, insights: [...d.insights, insight] }));
    });
  };

  const handleSubscriptionAction = async (action: 'cancel' | 'resume' | 'update_payment' | 'change_plan_view') => {
    if (!data.user) return;
    const subId = data.user.subscriptionId || `sub_gen_${Date.now()}`;
    
    if (action === 'change_plan_view') { setShowPortal(false); setView('MARKETPLACE'); return; }

    if (action === 'cancel') {
      const res = await MockPaymentService.cancelSubscription(subId);
      if (res.success && res.data) {
        setData(prev => ({ ...prev, user: { ...prev.user!, subscriptionId: subId, subscriptionStatus: res.data!.status, cancelAtPeriodEnd: true } }));
      }
    }
    if (action === 'resume') {
       const res = await MockPaymentService.reactivateSubscription(subId);
       if (res.success && res.data) {
         setData(prev => ({ ...prev, user: { ...prev.user!, subscriptionId: subId, subscriptionStatus: res.data!.status, cancelAtPeriodEnd: false } }));
       }
    }
    if (action === 'update_payment') {
      const res = await MockPaymentService.updatePaymentMethod(subId, { type: 'card' });
      if (res.success && res.data) {
        setData(prev => ({ ...prev, user: { ...prev.user!, paymentMethod: res.data } }));
      }
    }
  };

  const handlePlanChange = async (newTier: PremiumTier) => {
    if (!data.user) return;
    
    // Check if Upgrade
    const isUpgrade = getTierValue(newTier) > getTierValue(data.user.tier);
    
    if (isUpgrade) {
      setSelectedPlan(newTier); setShowPortal(false); setView('PAYMENT');
      return;
    }
    
    // Downgrade Immediately
    const subId = data.user.subscriptionId || `sub_gen_${Date.now()}`;
    const res = await MockPaymentService.changePlan(subId, newTier);
    if (res.success && res.data) {
      // Check if current mode is allowed in new tier, otherwise fallback to Baseline
      const safeMode = getTierValue(newTier) >= getTierValue(MODE_CONFIG[data.currentMode].minTier) 
        ? data.currentMode 
        : CoachingMode.BASELINE;

      setData(prev => ({ 
        ...prev, 
        currentMode: safeMode,
        user: { ...prev.user!, tier: newTier, subscriptionStatus: res.data!.status, cancelAtPeriodEnd: false } 
      }));
      setShowPortal(false); setView('CHAT');
    }
  };

  const handleModeSwitch = (mode: CoachingMode) => {
    if (hasModeAccess(mode)) {
      setData(prev => ({ ...prev, currentMode: mode }));
    } else {
      setShowPortal(true);
    }
  };

  // --- Render Views ---
  if (view === 'LANDING') return <LandingPage onLogin={() => {setAuthMode('LOGIN'); setView('AUTH')}} onSelectPlan={(t) => {setSelectedPlan(t); setAuthMode('SIGNUP'); setView('AUTH')}} />;
  if (view === 'AUTH') return <Auth mode={authMode} selectedPlan={selectedPlan} onAuthComplete={handleAuthComplete} onSwitchMode={setAuthMode} onBack={() => setView('LANDING')} />;
  if (view === 'PAYMENT') return <PaymentGateway selectedTier={selectedPlan} userId={data.user?.id || ''} userEmail={data.user?.email || ''} onSuccess={handlePaymentSuccess} onBack={() => setView('AUTH')} t={t} />;
  if (view === 'ONBOARDING') return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-light mb-4">Identify Yourself</h1>
      <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const name = fd.get('name') as string; setData(prev => ({...prev, user: {...prev.user!, name}})); createNewThread(CoachingMode.BASELINE); setView('CHAT'); }}>
        <input name="name" required placeholder="Your Name" className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center w-full max-w-xs mb-4 text-white" />
        <button type="submit" className="bg-white text-black px-8 py-3 rounded-xl font-bold">Begin</button>
      </form>
    </div>
  );

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {showPortal && data.user && <SubscriptionPortal user={data.user} onClose={() => setShowPortal(false)} onAction={handleSubscriptionAction} t={t} />}
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">AURA</h1>
          <div className="text-xs text-zinc-500 uppercase flex justify-between mt-1">
             <span>{data.user?.tier}</span>
             <span className="text-amber-400 flex items-center gap-1"><Coins size={10}/> {data.user?.coins}</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1 mb-8">
          <button onClick={() => setView('CHAT')} className={`w-full flex gap-3 p-3 rounded-xl transition-all ${view === 'CHAT' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}><MessageSquare size={18}/> Chat</button>
          <button onClick={() => setView('INSIGHTS')} className={`w-full flex gap-3 p-3 rounded-xl transition-all ${view === 'INSIGHTS' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}><BarChart2 size={18}/> Dossier</button>
          <button onClick={() => setView('MARKETPLACE')} className={`w-full flex gap-3 p-3 rounded-xl transition-all ${view === 'MARKETPLACE' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}><Zap size={18}/> Upgrade</button>
        </nav>

        {/* Desktop Sidebar: Coaching Modes */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3 px-2">Coaching Modes</h3>
          <div className="space-y-1">
            {MODE_LIST.map((mode) => {
               const locked = !hasModeAccess(mode);
               const active = data.currentMode === mode;
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
                     <span>{config.name}</span>
                   </div>
                   {locked && <Lock size={12} className="text-zinc-600 group-hover:text-zinc-500" />}
                 </button>
               );
            })}
          </div>
        </div>

        {/* Footer Settings */}
        <div className="border-t border-zinc-800 pt-4 space-y-2 mt-4">
          <div className="flex items-center justify-between text-zinc-500 px-2">
            <span className="text-xs uppercase">Voice</span>
            <button onClick={toggleVoice}>{data.user?.voiceEnabled ? <Volume2 size={16} className="text-emerald-400"/> : <VolumeX size={16}/>}</button>
          </div>
          <button onClick={() => setShowPortal(true)} className="w-full flex gap-3 p-3 text-zinc-500 hover:text-white"><User size={18}/> Subscription</button>
          <button onClick={() => { localStorage.removeItem('aura_data'); setView('LANDING'); }} className="w-full flex gap-3 p-3 text-zinc-500 hover:text-red-400"><LogOut size={18}/> Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-zinc-950">
        
        {/* MOBILE TOP HEADER (Simplified) */}
        <header className="md:hidden p-4 border-b border-zinc-800 flex justify-between bg-zinc-950 items-center">
           <span className="font-bold tracking-widest text-sm">AURA</span>
           <div className="flex items-center gap-3">
             <span className="text-xs text-amber-500 flex items-center gap-1 font-mono"><Coins size={10}/> {data.user?.coins}</span>
             <button onClick={() => setShowPortal(true)}><User size={18}/></button>
           </div>
        </header>

        {view === 'CHAT' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Avatar Area */}
            <div className="flex-none h-48 md:h-64 flex items-center justify-center border-b border-zinc-800 bg-zinc-900/30 relative">
               <TwinAvatar state={data.twinState} mode={data.currentMode} />
               
               {/* In-Avatar Mode Indicator (Visual Feedback) */}
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

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 md:pb-4">
              {data.threads.find(t => t.id === data.activeThreadId)?.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-zinc-500 text-xs animate-pulse ml-4">Thinking...</div>}
              <div ref={messagesEndRef}/>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
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
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-10 pr-12 text-white focus:outline-none placeholder:text-zinc-600" 
                   placeholder={isListening ? "Listening..." : "Message..."} 
                 />
                 <button onClick={handleSendMessage} className="absolute right-2 top-2 p-1.5 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"><Send size={16}/></button>
               </div>
            </div>
          </div>
        )}

        {view === 'INSIGHTS' && <InsightsDashboard insights={data.insights} tier={data.user?.tier || PremiumTier.BASIC} />}
        {view === 'MARKETPLACE' && <Marketplace currentTier={data.user?.tier || PremiumTier.FREE} onUpgrade={handlePlanChange} />}

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0b] border-t border-zinc-800 h-16 flex items-center px-2 overflow-x-auto scrollbar-hide z-40 gap-2">
          
          {/* Main Nav Items */}
          <button 
            onClick={() => setView('CHAT')} 
            className={`flex flex-col items-center justify-center min-w-[25px] h-full ${view === 'CHAT' ? 'text-white' : 'text-zinc-500'}`}
          >
            <MessageSquare size={20} />
            <span className="text-[10px] mt-1">Chat</span>
          </button>
          
          <button 
            onClick={() => setView('INSIGHTS')} 
            className={`flex flex-col items-center justify-center min-w-[25px] h-full ${view === 'INSIGHTS' ? 'text-white' : 'text-zinc-500'}`}
          >
            <BarChart2 size={20} />
            <span className="text-[10px] mt-1">Dossier</span>
          </button>
          
          <button 
            onClick={() => setView('MARKETPLACE')} 
            className={`flex flex-col items-center justify-center min-w-[25px] h-full ${view === 'MARKETPLACE' ? 'text-white' : 'text-zinc-500'}`}
          >
            <Zap size={20} />
            <span className="text-[10px] mt-1">Store</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-zinc-800 mx-2 flex-shrink-0" />

          {/* Coaching Modes Scrollable */}
          {MODE_LIST.map((mode) => {
             const active = data.currentMode === mode;
             const locked = !hasModeAccess(mode);
             const config = MODE_CONFIG[mode];
             
             return (
               <button
                 key={mode}
                 onClick={() => {
                   if(view !== 'CHAT') setView('CHAT');
                   handleModeSwitch(mode);
                 }}
                 className={`flex flex-col items-center justify-center min-w-[25px] h-full flex-shrink-0 relative group`}
               >
                 <div className={`p-1.5 rounded-lg mb-0.5 transition-all ${active ? 'bg-white/10 text-white' : 'text-zinc-500'}`}>
                   <ModeIcon mode={mode} size={20} />
                 </div>
                 {/* Locked Indicator Overlay */}
                 {locked && (
                   <div className="absolute top-2 right-2 bg-black rounded-full p-0.5 border border-zinc-800">
                     <Lock size={8} className="text-zinc-500"/>
                   </div>
                 )}
               </button>
             );
          })}
        </nav>
      </main>
    </div>
  );
};

export default App;