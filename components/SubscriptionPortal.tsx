import React from 'react';
import { UserState, PremiumTier, SubscriptionStatus } from '../types';
// MÅSTE BORT: import { useLanguage } from '../src/context/LanguageContext';
import { LogOut, X, Clock, Zap, DollarSign, CreditCard } from 'lucide-react';
import { TIERS } from '../constants';

interface SubscriptionPortalProps {
  user: UserState;
  onClose: () => void;
  onAction: (action: 'cancel' | 'resume' | 'update_payment' | 'change_plan_view') => void;
  // NU EN PROP:
  t: (key: string) => string; 
}

// t är nu en prop
const SubscriptionPortal: React.FC<SubscriptionPortalProps> = ({ user, onClose, onAction, t }) => {
  // MÅSTE BORT: const { t } = useLanguage(); 

  const isTierActive = (tier: PremiumTier): boolean => {
    const userTierConfig = TIERS.find(t => t.id === user.tier);
    const targetTierConfig = TIERS.find(t => t.id === tier);
    if (!userTierConfig || !targetTierConfig) return false;
    
    // Använd TIERS-ordningen för att jämföra nivåer
    const userIndex = TIERS.indexOf(userTierConfig);
    const targetIndex = TIERS.indexOf(targetTierConfig);

    return userIndex >= targetIndex;
  };
  
  const currentTierConfig = TIERS.find(t => t.id === user.tier)!;
  
  const isCancellable = user.subscriptionStatus === 'active_subscription' || user.subscriptionStatus === 'trial_active';
  const isDowngradeScheduled = user.subscriptionStatus === 'downgrade_scheduled';
  const isPaymentIssue = ['incomplete', 'past_due', 'unpaid'].includes(user.subscriptionStatus);
  const isFree = user.tier === PremiumTier.FREE || user.subscriptionStatus === 'free';
  
  const getStatusDisplay = (status: SubscriptionStatus) => {
    switch(status) {
      case 'active_subscription': return <span className="text-emerald-400 font-semibold">Aktiv</span>;
      case 'trial_active': return <span className="text-cyan-400 font-semibold">Aktiv (Provperiod)</span>;
      case 'downgrade_scheduled': return <span className="text-amber-400 font-semibold">Nedgradering Schemalagd</span>;
      case 'incomplete':
      case 'past_due':
      case 'unpaid': return <span className="text-red-500 font-semibold">Betalningsproblem</span>;
      case 'free': 
      case 'cancelled': return <span className="text-zinc-500 font-semibold">Inaktiv</span>;
      default: return <span>{status}</span>;
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-aura-card w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
        
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t('sidebar.subscription')}</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white rounded-full transition"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
            {/* Användarstatus */}
            <div className="bg-zinc-900 p-4 rounded-xl space-y-2">
                <p className="text-zinc-400 text-sm flex items-center gap-2"><Zap size={16} className="text-aura-accent"/> Nuvarande Plan: <span className="text-white font-semibold">{t(`tier.${user.tier.toLowerCase()}`)}</span></p>
                <p className="text-zinc-400 text-sm flex items-center gap-2"><Clock size={16} className="text-zinc-500"/> Status: {getStatusDisplay(user.subscriptionStatus)}</p>
                
                {user.nextBillingDate && (
                    <p className="text-zinc-400 text-sm flex items-center gap-2"><DollarSign size={16} className="text-emerald-400"/> Nästa faktura: <span className="text-white font-semibold">{new Date(user.nextBillingDate).toLocaleDateString()}</span></p>
                )}
                
                {user.paymentMethod && (
                     <p className="text-zinc-400 text-sm flex items-center gap-2"><CreditCard size={16} className="text-zinc-500"/> Betalmetod: <span className="text-white font-semibold">{user.paymentMethod.brand} ****{user.paymentMethod.last4}</span></p>
                )}
            </div>

            {/* Varnings/Aktionsmeddelanden */}
            {isPaymentIssue && (
                <div className="p-4 bg-red-900/50 rounded-xl border border-red-700 space-y-2">
                    <p className="text-red-400 font-semibold">Varning: Din prenumeration är i riskzonen.</p>
                    <button 
                        onClick={() => onAction('update_payment')} 
                        className="text-sm bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition"
                    >
                        Uppdatera Betalningsmetod Nu
                    </button>
                </div>
            )}
            
            {/* Huvudknappar */}
            <div className="flex flex-col space-y-3 pt-3">
                <button 
                    onClick={() => onAction('change_plan_view')} 
                    className="w-full bg-aura-accent text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition duration-150"
                >
                    {isFree ? t('marketplace.upgrade') : "Ändra Plan"}
                </button>
                
                {isCancellable && (
                    <button 
                        onClick={() => onAction('cancel')} 
                        className="w-full bg-red-600/20 text-red-400 py-3 rounded-lg font-semibold hover:bg-red-600/30 transition duration-150 border border-red-700/50"
                    >
                        Avbryt Prenumeration
                    </button>
                )}

                {isDowngradeScheduled && (
                    <button 
                        onClick={() => onAction('resume')} 
                        className="w-full bg-emerald-600/20 text-emerald-400 py-3 rounded-lg font-semibold hover:bg-emerald-600/30 transition duration-150 border border-emerald-700/50"
                    >
                        Återaktivera Prenumeration
                    </button>
                )}
                
            </div>
            
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPortal;