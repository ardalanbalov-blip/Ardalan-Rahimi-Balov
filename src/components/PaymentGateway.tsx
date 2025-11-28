
import React, { useState } from 'react';
import { PremiumTier, PaymentMethod } from '../types';
import { TIERS, t } from '../constants';
import { stripeService } from '../services/stripeService';
import { Shield, CheckCircle, ArrowLeft, Loader2, CreditCard } from 'lucide-react';

interface Props {
  selectedTier: PremiumTier;
  userId: string;
  userEmail: string;
  onSuccess: (subscriptionData: any, paymentMethod: PaymentMethod) => void;
  onBack: () => void;
}

const PaymentGateway: React.FC<Props> = ({ selectedTier, onBack }) => {
  const tierDetails = TIERS.find(t => t.id === selectedTier);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!tierDetails) return;
    setLoading(true);
    setError(null);
    try {
      await stripeService.startCheckout(selectedTier);
      // Logic pauses here as window redirects
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to start checkout. Please try again.");
      setLoading(false);
    }
  };

  if (!tierDetails) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/10 via-black to-zinc-900/50 pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative z-10">
        <button onClick={onBack} className="absolute -top-12 left-0 text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft size={16} /> {t('button.back')}
        </button>

        {/* Left Side: Order Summary */}
        <div className="bg-[#121214] border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-lg">
               <Shield size={16} />
             </div>
             <span className="text-sm font-medium tracking-wide text-emerald-400">{t('common.secure')}</span>
          </div>

          <div>
            <h2 className="text-3xl font-light mb-2">{t('button.proceed')}</h2>
            <p className="text-zinc-400">Stripe Secure Checkout</p>
          </div>

          <div className="py-6 border-t border-b border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-white text-lg">{t(`tier.${tierDetails.id.toLowerCase()}`)}</div>
                <div className="text-zinc-500 text-sm">{t('marketplace.tiers')}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xl">{tierDetails.price}</div>
              </div>
            </div>
            <ul className="space-y-2">
              {tierDetails.features.slice(0, 3).map((f, i) => (
                <li key={i} className="text-sm text-zinc-400 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {t(f)}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between items-center text-sm font-medium">
            <span>{t('common.cost')}</span>
            <span className="text-xl text-white">{tierDetails.price}</span>
          </div>
        </div>

        {/* Right Side: Action Area */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-3xl min-h-[400px] flex flex-col justify-center items-center text-center">
          
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
             <CreditCard size={32} className="text-white" />
          </div>
          
          <h3 className="text-xl font-medium text-white mb-2">{t('marketplace.buy')}</h3>
          <p className="text-zinc-400 text-sm mb-8 max-w-xs">
            You will be redirected to Stripe to complete your secure purchase.
          </p>
          
          {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}

          <button 
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
             {loading ? <Loader2 className="animate-spin" /> : t('button.proceed')}
          </button>
          
          <p className="text-xs text-zinc-600 mt-4">
            Secured by Stripe
          </p>

        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
