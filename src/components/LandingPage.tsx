
import React from 'react';
import { PremiumTier } from '../types';
import { TIERS, t } from '../constants';
import { ArrowDown, DollarSign, Zap, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-zinc-900/50 pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-thin tracking-tighter mb-4">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-10">
            {t('landing.heroSubtitle')}
          </p>
          <button 
            onClick={onLogin} 
            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-indigo-500 transition-colors shadow-lg"
          >
            {t('button.beginJourney')}
          </button>
        </div>
        <a href="#tiers" className="absolute bottom-10 text-zinc-500 animate-bounce">
          <ArrowDown size={32} />
        </a>
      </section>

      {/* 2. Feature/Architecture Section */}
      <section className="py-20 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-light text-center mb-16">{t('landing.cognitiveArch')}</h2>
          
          <div className="grid md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col items-center text-center">
              <Zap size={32} className="text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('landing.deepMirroring')}</h3>
              <p className="text-zinc-400">{t('landing.deepMirroringDesc')}</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col items-center text-center">
              <DollarSign size={32} className="text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('landing.predictiveGuidance')}</h3>
              <p className="text-zinc-400">{t('landing.predictiveGuidanceDesc')}</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col items-center text-center">
              <ArrowDown size={32} className="text-red-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('landing.emotionalAnalytics')}</h3>
              <p className="text-zinc-400">{t('landing.emotionalAnalyticsDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tiers/Pricing Section */}
      <section id="tiers" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-light text-center mb-16">{t('marketplace.tiers')}</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {TIERS.filter(tier => tier.id !== PremiumTier.FREE).map((tier) => (
              <div 
                key={tier.id}
                className={`
                  p-6 rounded-3xl border 
                  ${isPremiumHighlight(tier.id) 
                    ? 'bg-indigo-900/30 border-indigo-700 shadow-xl shadow-indigo-900/20' 
                    : 'bg-zinc-900 border-zinc-700'}
                  transform hover:scale-[1.02] transition-all duration-300
                `}
              >
                <h3 className={`text-2xl font-bold mb-2 ${isPremiumHighlight(tier.id) ? 'text-indigo-300' : 'text-white'}`}>
                  {t(`tier.${tier.id.toLowerCase()}`)}
                </h3>
                <p className="text-4xl font-extrabold mb-4">{tier.price} <span className="text-lg font-medium text-zinc-500">{t('landing.perMonth')}</span></p>
                
                <ul className="space-y-3 mb-6 text-zinc-300">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={16} className={`flex-shrink-0 mt-1 ${isPremiumHighlight(tier.id) ? 'text-indigo-400' : 'text-emerald-400'}`} />
                      {t(feature)}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleSelectPlan(tier.id)}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors 
                    ${isPremiumHighlight(tier.id) 
                      ? 'bg-white text-black hover:bg-zinc-200' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'}
                  `}
                >
                  {t('button.startTrial')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Footer Section */}
      <footer className="py-8 text-center border-t border-zinc-800 bg-zinc-950">
        <p className="text-zinc-500 text-sm">{t('landing.footer')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
