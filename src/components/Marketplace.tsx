
import React, { useState, useEffect, useRef } from 'react';
import { TIERS, t } from '../constants';
import { PremiumTier } from '../types';
import { Check, Loader2, Coins, CreditCard, Sparkles } from 'lucide-react';

interface Props {
  currentTier: PremiumTier;
  onUpgrade: (tier: PremiumTier) => Promise<void>;
  onCoinPurchase: (amount: number) => Promise<void>;
}

const COIN_PACKS = [
  { id: 'pack_small', name: 'Starter Cache', amount: 100, price: '$1.99', color: 'text-zinc-400', border: 'border-zinc-700' },
  { id: 'pack_medium', name: 'Neural Reserve', amount: 500, price: '$4.99', color: 'text-amber-400', border: 'border-amber-500/50' },
  { id: 'pack_large', name: 'Infinite Stream', amount: 1200, price: '$9.99', color: 'text-indigo-400', border: 'border-indigo-500/50' }
];

const Marketplace: React.FC<Props> = ({ currentTier, onUpgrade, onCoinPurchase }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const mounted = useRef(true);
  
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const getTierLevel = (tier: PremiumTier) => {
    if (tier === PremiumTier.MASTER) return 3;
    if (tier === PremiumTier.PLUS) return 2;
    if (tier === PremiumTier.BASIC) return 1;
    return 0; // FREE
  };

  const handleSelectTier = async (tierId: PremiumTier) => {
    if (tierId === currentTier) return;
    
    setProcessingId(tierId);
    try {
      await onUpgrade(tierId);
    } catch (error) {
      console.error(error);
    } finally {
      if (mounted.current) setProcessingId(null);
    }
  };

  const handleBuyCoins = async (packId: string, amount: number) => {
    setProcessingId(packId);
    try {
      await onCoinPurchase(amount);
    } catch (error) {
      console.error(error);
    } finally {
      if (mounted.current) setProcessingId(null);
    }
  };

  return (
    <div className="p-6 pb-24 overflow-y-auto h-full scrollbar-hide">
      <h2 className="text-3xl font-light text-white mb-2 text-center">{t('marketplace.title')}</h2>
      <p className="text-zinc-400 text-center mb-8 text-sm">{t('marketplace.desc')}</p>
      
      {/* COIN PACKS SECTION */}
      <div className="mb-12 max-w-5xl mx-auto">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Coins className="text-amber-500" size={20} />
          {t('marketplace.packs')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {COIN_PACKS.map(pack => (
             <div key={pack.id} className={`p-5 rounded-xl border bg-zinc-900/50 ${pack.border} relative overflow-hidden group hover:bg-zinc-900 transition-colors`}>
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div>
                     <div className={`text-2xl font-bold ${pack.color} flex items-center gap-2`}>
                        {pack.amount} 
                        <Coins size={16} className="text-current opacity-70"/>
                     </div>
                     <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{pack.name}</div>
                   </div>
                   <div className="text-white font-mono bg-white/5 px-2 py-1 rounded">{pack.price}</div>
                </div>
                
                {pack.id === 'pack_large' && (
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <Sparkles size={64} className="text-indigo-500" />
                  </div>
                )}

                <button
                  onClick={() => handleBuyCoins(pack.id, pack.amount)}
                  disabled={!!processingId}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg border border-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  {processingId === pack.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                  {t('marketplace.buy')}
                </button>
             </div>
           ))}
        </div>
      </div>

      {/* SUBSCRIPTION TIERS SECTION */}
      <div className="max-w-7xl mx-auto">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
           <Check className="text-indigo-500" size={20} />
           {t('marketplace.tiers')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const isActive = currentTier === tier.id;
            const level = getTierLevel(tier.id);
            const currentLevel = getTierLevel(currentTier);
            const isProcessing = processingId === tier.id;

            let btnText = t('marketplace.select');
            if (isActive) btnText = t('marketplace.current');
            else if (level > currentLevel) btnText = t('marketplace.upgrade');
            else btnText = t('marketplace.downgrade');

            return (
              <div key={tier.id} className={`p-6 rounded-2xl border flex flex-col ${isActive ? 'bg-zinc-900 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-zinc-800 border-zinc-700'}`}>
                <h3 className="text-lg font-bold text-white mb-2">{t(`tier.${tier.id.toLowerCase()}`)}</h3>
                <div className="text-2xl font-light text-zinc-200 mb-6">{tier.price}</div>
                <ul className="flex-1 space-y-3 mb-6">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-400"><Check size={14} className="text-emerald-500 mt-1 flex-shrink-0"/> {t(f)}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectTier(tier.id)}
                  disabled={isActive || !!processingId}
                  className={`w-full py-3 rounded-lg font-bold flex justify-center gap-2 ${isActive ? 'bg-zinc-700 text-zinc-500' : 'bg-white text-black hover:bg-zinc-200'}`}
                >
                  {isProcessing && <Loader2 className="animate-spin"/>} {btnText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
