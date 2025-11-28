import React, { useEffect } from 'react';
import { PremiumTier, PaymentMethod } from '../types';
import { TIERS, t } from '../constants';
import { Shield, CheckCircle, ArrowLeft } from 'lucide-react';

interface Props {
  selectedTier: PremiumTier;
  userId: string;
  userEmail: string;
  onSuccess: (subscriptionData: any, paymentMethod: PaymentMethod) => void;
  onBack: () => void;
}

const PaymentGateway: React.FC<Props> = ({ selectedTier, userId, userEmail, onSuccess, onBack }) => {
  const tierDetails = TIERS.find(t => t.id === selectedTier);

  // Workaround for TypeScript error with custom element
  const StripeBuyButton = 'stripe-buy-button' as any;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://js.stripe.com/v3/buy-button.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (!tierDetails) return null;

  // Safe env access
  const publishableKey = (import.meta as any).env?.VITE_STRIPE_PK || 'pk_test_PLACEHOLDER';

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center p-6 relative">
       {/* Background Ambience */}
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
          
          <div className="text-xs text-zinc-500 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
            <p className="mb-2"><strong className="text-zinc-300">Stripe Secure:</strong> Payments are processed securely by Stripe. We do not store your card information.</p>
          </div>
        </div>

        {/* Right Side: Stripe Buy Button */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-3xl min-h-[400px] flex flex-col justify-center items-center text-center">
          
          {tierDetails.stripeBuyButtonId ? (
            <div className="w-full">
              <h3 className="text-lg font-medium text-white mb-6">{t('marketplace.buy')}</h3>
              
              <div className="flex justify-center">
                <StripeBuyButton
                  buy-button-id={tierDetails.stripeBuyButtonId}
                  publishable-key={publishableKey}
                  client-reference-id={userId}
                  customer-email={userEmail}
                >
                </StripeBuyButton>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500">
              <p>No payment required for this tier.</p>
              <button onClick={onBack} className="mt-4 px-6 py-2 bg-white text-black rounded-full text-sm font-bold">
                {t('button.back')}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;