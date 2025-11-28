
import React from 'react';
import { PremiumTier } from '../types';
import { TIERS, t } from '../constants';
import { ArrowDown, CheckCircle2, Sparkles, Shield } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onSelectPlan: (tier: PremiumTier) => void;
}

const LandingPage: React.FC<Props> = ({ onLogin, onSelectPlan }) => {
  const handleSelectPlan = (tier: PremiumTier) => {
    onSelectPlan(tier);
  };
  
  const isPremiumHighlight = (tierId: PremiumTier) => tierId === PremiumTier.PLUS || tierId === PremiumTier.MASTER;

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
            <button onClick={onLogin} className="text-xs font-medium uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
              {t('button.login')}
            </button>
            <button 
              onClick={() => document.getElementById('tiers')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs font-medium uppercase tracking-widest text-white border border-white/20 px-6 py-2 rounded-full hover:bg-white/5 transition-colors"
            >
              {t('header.startTrial')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Aura Circles */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        
        {/* Atmospheric Background */}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[120px] animate-pulse-slow" />
           <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[100px]" />
           <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPgo8L3N2Zz4=')] mix-blend-overlay"></div>
        </div>

        {/* Aura Centerpiece */}
        <div className="relative z-10 mb-12 scale-90 md:scale-100 transition-transform duration-500">
           <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              <div className="absolute w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse" />
              
              <div className="absolute inset-0 border border-violet-800/10 rounded-full scale-40 animate-spin" style={{ animationDuration: '10s' }} />
              <div className="absolute inset-0 border border-indigo-800/10 rounded-full scale-80 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
              <div className="absolute inset-0 border border-white/5 rounded-full scale-125 animate-pulse-slow" />
              
              <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-violet-900/20 via-transparent to-indigo-900/20 backdrop-blur-sm border border-white/5 shadow-[0_0_50px_rgba(139,92,246,0.1)] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse" />
              </div>
           </div>
        </div>

        {/* Text Content */}
        <div className="relative z-10 text-center max-w-4xl px-6 space-y-6">
           <h1 className="text-4xl md:text-7xl font-thin tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30 pb-2">
             {t('landing.heroTitle')}
           </h1>
           <p className="text-base md:text-lg text-zinc-400 font-light max-w-xl mx-auto leading-relaxed tracking-wide">
             {t('landing.heroSubtitle')}
           </p>
           
           <div className="pt-8">
             <button 
               onClick={onLogin}
               className="group relative px-10 py-4 bg-white/5 border border-white/10 rounded-full overflow-hidden transition-all duration-500 hover:bg-white/10 hover:border-violet-500/30 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)]"
             >
               <span className="relative z-10 text-xs font-medium tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">
                 {t('landing.beginJourney')}
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
             </button>
           </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
          <ArrowDown size={20} className="text-white" />
        </div>

      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-[#050505] relative z-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-violet-500 mb-4 block">{t('landing.cognitiveArch')}</span>
            <h2 className="text-3xl font-light text-zinc-200">{t('landing.processingLayers')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
            {[
              { 
                title: t('landing.deepMirroring'), 
                desc: t('landing.deepMirroringDesc')
              },
              { 
                title: t('landing.predictiveGuidance'), 
                desc: t('landing.predictiveGuidanceDesc')
              },
              { 
                title: t('landing.emotionalAnalytics'), 
                desc: t('landing.emotionalAnalyticsDesc')
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
      <section id="tiers" className="py-32 px-6 bg-[#050505] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0b] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-light text-white">{t('landing.unlockTwin')}</h2>
            <div className="inline-flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest border border-white/5 px-4 py-1.5 rounded-full">
              <Shield size={10} />
              {t('landing.secureAccess')}
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
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-4">{t(`tier.${tier.id.toLowerCase()}`)}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-light text-white">{tier.price.split('/')[0]}</span>
                    <span className="text-zinc-600 text-sm">{t('landing.perMonth')}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                  {tier.features.slice(0, 4).map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={14} className="text-violet-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-zinc-400 font-light">{t(feature)}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleSelectPlan(tier.id)}
                  className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    tier.highlight
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {t('landing.startTrial')}
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
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{t('landing.footer')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
