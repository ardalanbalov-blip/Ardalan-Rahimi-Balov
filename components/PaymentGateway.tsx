import React, { useState } from 'react';
import { PremiumTier, UserState, PaymentMethod } from '../types';
import { TIERS } from '../constants';

interface PaymentGatewayProps {
  selectedTier: PremiumTier;
  userId: string;
  userEmail: string;
  onSuccess: (updatedUserStateFields: Partial<UserState>) => void;
  onBack: () => void;
  t: (key: string) => string;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ selectedTier, userId, userEmail, onSuccess, onBack, t }) => {
  const [error, setError] = useState<string | null>(null);

  const tierConfig = TIERS.find(t => t.id === selectedTier);

  if (!tierConfig || !tierConfig.stripeBuyButtonId) {
    return (
      <div className="min-h-screen bg-aura-black text-white flex flex-col items-center justify-center p-6">
        <div className="bg-red-900/50 p-6 rounded-xl border border-red-700">
          <h2 className="text-xl text-red-400">Konfigurationsfel</h2>
          <p className="text-sm text-red-300 mt-2">Kunde inte hitta Stripe Buy Button ID för {selectedTier}. Kontrollera constants.ts.</p>
          <button onClick={onBack} className="mt-4 text-sm text-white/70 hover:text-white">← {t('button.back')}</button>
        </div>
      </div>
    );
  }

  // NOTE: För att hantera framgångsrika betalningar korrekt i en produktionsmiljö, 
  // måste du ställa in Stripe Webhooks på serversidan.
  // Denna komponent renderar bara knappen. Webhooken ska uppdatera Firestore/DB.

  const handleStripeError = () => {
    // Denna funktion exekveras inte direkt av Stripe Buy Button.
    // Vi använder i stället `client-reference-id` och Webhooks.
    console.warn("Stripe Buy Button interaktion initierad. Framgångs- och felhantering sker via Webhooks.");
  };

  const currentTierName = t(`tier.${tierConfig.id.toLowerCase()}`);

  return (
    <div className="min-h-screen bg-aura-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-aura-card p-8 rounded-2xl shadow-xl border border-zinc-800">
        <button onClick={onBack} className="text-zinc-500 hover:text-white mb-4 block">← {t('button.back')}</button>
        
        <h2 className="text-3xl font-bold mb-2 text-center">{t('button.proceed')}</h2>
        <p className="text-zinc-400 text-sm mb-8 text-center">
            {currentTierName} {t('landing.perMonth')} ({tierConfig.price})
        </p>

        <div className="border border-zinc-700 p-6 rounded-xl bg-zinc-800/50">
          <p className="text-zinc-300 mb-4 text-center">{t('common.secure')}</p>
          
          {/* STRIPE BUY BUTTON WEB COMPONENT */}
          <stripe-buy-button
            buy-button-id={tierConfig.stripeBuyButtonId}
            publishable-key={(import.meta as any).env.VITE_STRIPE_PK || 'pk_test_PLACEHOLDER_PUBLISHABLE_KEY'} // Hämta från ENV
            client-reference-id={userId} // KRITISKT: Används i Webhooks för att identifiera användaren
            customer-email={userEmail} // Fyller i användarens email i Stripe Checkout
            // Dessa stilar är anpassade för att matcha Aura-temat
            style={{
              width: '100%',
              display: 'block',
              '--stripe-buy-button-text-color': '#0a0a0b',
              '--stripe-buy-button-background-color': '#FFFFFF',
              '--stripe-buy-button-border-radius': '6px',
              '--stripe-buy-button-font-size': '16px',
              '--stripe-buy-button-box-shadow': 'none'
            } as any}
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        
        <p className="text-xs text-zinc-600 mt-6 text-center">
            Observera: Du måste ha ställt in Stripe Webhooks på din server för att användarprofilen i Aura ska uppdateras korrekt efter en lyckad betalning.
        </p>
      </div>
    </div>
  );
};

export default PaymentGateway;