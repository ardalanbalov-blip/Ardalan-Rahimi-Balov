import React from 'react';
import { TIERS } from '../constants';
import { PremiumTier } from '../types';
import { Check, ArrowRight, Brain, Zap, Activity, Shield, Sparkles, ArrowDown, CheckCircle2 } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onSelectPlan: (tier: PremiumTier) => void;
}

const LandingPage: React.FC<Props> = ({ onLogin, onSelectPlan }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-violet-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
            <span className="text-sm font-light tracking-[0.2em] text-zinc-300">AURA</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={onLogin} className="text-xs font-medium uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Log In</button>
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs font-medium uppercase tracking-widest text-white border border-white/20 px-6 py-2 rounded-full hover:bg-white/5 transition-colors"
            >
              Start Trial
            </button>
          </div>
        </div>
      </nav>

      {/* MYSTIC HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        
        {/* Atmospheric Background */}
        <div className="absolute inset-0 pointer-events-none">
           {/* Deep Void Glows */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[120px] animate-pulse-slow" />
           <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[100px]" />
           
           {/* Grain Overlay for Texture */}
           <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPgo8L3N2Zz4=')] mix-blend-overlay"></div>
        </div>

        {/* The "Aura" Centerpiece */}
        <div className="relative z-10 mb-12 scale-90 md:scale-100 transition-transform duration-500">
           <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              {/* Core Light */}
              <div className="absolute w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse" />
              
              {/* Rotating Rings */}
              <div className="absolute inset-0 border border-violet-800/10 rounded-full scale-40 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 border border-indigo-800/10 rounded-full scale-80 animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-0 border border-white/5 rounded-full scale-125 animate-pulse-slow" />
              
              {/* Inner Gradient Orb */}
              <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-violet-900/20 via-transparent to-indigo-900/20 backdrop-blur-sm border border-white/5 shadow-[0_0_50px_rgba(139,92,246,0.1)] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse" />
              </div>
           </div>
        </div>

        {/* Text Content */}
        <div className="relative z-10 text-center max-w-4xl px-6 space-y-8">
           <h1 className="text-5xl md:text-7xl font-thin tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30 pb-2">
             The Mirror to Your Mind.
           </h1>
           <p className="text-lg text-zinc-400 font-light max-w-xl mx-auto leading-relaxed tracking-wide">
             A quiet intelligence that observes your patterns, illuminates your blind spots, and guides you toward your ideal self.
           </p>
           
           <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
             <button 
               onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
               className="group relative px-10 py-4 bg-white/5 border border-white/10 rounded-full overflow-hidden transition-all duration-500 hover:bg-white/10 hover:border-violet-500/30 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)]"
             >
               <span className="relative z-10 text-xs font-medium tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">
                 Begin The Journey
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
             </button>
           </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
          <ArrowDown size={20} className="text-white" />
        </div>

      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-[#050505] relative z-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-violet-500 mb-4 block">Cognitive Architecture</span>
            <h2 className="text-3xl font-light text-zinc-200">Processing Layers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
            {[
              { 
                title: "Deep Mirroring", 
                desc: "Learns your linguistic patterns and emotional triggers to reflect your true state."
              },
              { 
                title: "Predictive Guidance", 
                desc: "Anticipates energy dips and stress points before they happen, offering preemptive care."
              },
              { 
                title: "Emotional Analytics", 
                desc: "Visualizes psychological states with therapist-grade heatmaps and trend lines."
              }
            ].map((f, i) => (
              <div key={i} className="p-12 bg-[#050505] hover:bg-[#0a0a0b] transition-colors group relative">
                <div className="mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                   <Sparkles size={20} className="text-violet-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-4 tracking-wide">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - 4 Columns for Desktop */}
      <section id="pricing" className="py-32 px-6 bg-[#050505] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0b] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-light text-white">Unlock Your Twin</h2>
            <div className="inline-flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest border border-white/5 px-4 py-1.5 rounded-full">
              <Shield size={10} />
              Secure Encrypted Access
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier) => (
              <div 
                key={tier.id}
                className={`relative p-8 rounded-2xl border flex flex-col transition-all duration-300 ${
                  tier.highlight 
                    ? 'bg-zinc-900/50 border-violet-500/30 shadow-[0_0_30px_-10px_rgba(139,92,246,0.15)]' 
                    : 'bg-[#0a0a0b] border-white/5 hover:border-white/10'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute top-0 right-0 p-4">
                    <div className="w-2 h-2 bg-violet-500 rounded-full shadow-[0_0_10px_#8b5cf6]" />
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-4">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-light text-white">{tier.price.split('/')[0]}</span>
                    <span className="text-zinc-600 text-sm">/mo</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                  {tier.features.slice(0, 4).map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={14} className="text-violet-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-zinc-400 font-light">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => onSelectPlan(tier.id)}
                  className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    tier.highlight
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#050505] text-center">
        <div className="flex items-center justify-center gap-2 mb-8 opacity-30 hover:opacity-50 transition-opacity">
          <div className="w-4 h-4 bg-violet-900 rounded-full blur-[2px]" />
          <span className="text-sm font-light tracking-[0.2em]">AURA</span>
        </div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">© 2024 Aura Intelligence</p>
      </footer>
    </div>
  );
};

export default LandingPage;