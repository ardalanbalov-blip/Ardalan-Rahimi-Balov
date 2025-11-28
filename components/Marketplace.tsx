
import React, { useState, useEffect, useRef } from 'react';
import { TIERS } from '../constants';
import { PremiumTier } from '../types';
import { Check, Loader2 } from 'lucide-react';

interface Props {
  currentTier: PremiumTier;
  onUpgrade: (tier: PremiumTier) => Promise<void>;
}

const Marketplace: React.FC<Props> = ({ currentTier, onUpgrade }) => {
  const [processingId, setProcessingId] = useState<PremiumTier | null>(null);
  const mounted = useRef(true);
  
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const getTierLevel = (t: PremiumTier) => {
    if (t === PremiumTier.MASTER) return 3;
    if (t === PremiumTier.PLUS) return 2;
    if (t === PremiumTier.BASIC) return 1;
    return 0; // FREE
  };

  const handleSelect = async (tierId: PremiumTier) => {
    if (tierId === currentTier) return;
    
    // No confirm() dialog used here. Immediate action.
    setProcessingId(tierId);
    try {
      await onUpgrade(tierId);
    } catch (error) {
      console.error(error);
      if (mounted.current) setProcessingId(null);
    }
  };

  return (
    <div className="p-6 pb-24 overflow-y-auto h-full scrollbar-hide">
      <h2 className="text-3xl font-light text-white mb-8 text-center">Marketplace</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {TIERS.map((tier) => {
          const isActive = currentTier === tier.id;
          const level = getTierLevel(tier.id);
          const currentLevel = getTierLevel(currentTier);
          const isProcessing = processingId === tier.id;

          let btnText = "Select";
          if (isActive) btnText = "Current Plan";
          else if (level > currentLevel) btnText = "Upgrade";
          else btnText = "Downgrade";

          return (
            <div key={tier.id} className={`p-6 rounded-2xl border flex flex-col ${isActive ? 'bg-zinc-900 border-indigo-500' : 'bg-zinc-800 border-zinc-700'}`}>
              <h3 className="text-lg font-bold text-white mb-2">{tier.name}</h3>
              <div className="text-2xl font-light text-zinc-200 mb-6">{tier.price}</div>
              <ul className="flex-1 space-y-3 mb-6">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-400"><Check size={14} className="text-emerald-500 mt-1"/> {f}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(tier.id)}
                disabled={isActive || isProcessing}
                className={`w-full py-3 rounded-lg font-bold flex justify-center gap-2 ${isActive ? 'bg-zinc-700 text-zinc-500' : 'bg-white text-black hover:bg-zinc-200'}`}
              >
                {isProcessing && <Loader2 className="animate-spin"/>} {btnText}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Marketplace;
