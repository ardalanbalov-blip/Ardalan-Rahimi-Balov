
import React, { useState } from 'react';
import { UserState, PremiumTier, SubscriptionStatus } from '../types';
import { X, Clock, Zap, DollarSign, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { TIERS } from '../constants';
import { stripeService } from '../services/stripeService';

interface SubscriptionPortalProps {
  user: UserState;
  onClose: () => void;
  // Legacy prop for compatibility, can be ignored in favor of portal logic
  onAction: (action: 'cancel' | 'resume' | 'update_payment' | 'change_plan_view') => void; 
  t: (key: string) => string;
}

const SubscriptionPortal: React.FC<SubscriptionPortalProps> = ({ user, onClose, onAction, t }) => {
  const [loading, setLoading] = useState(false);

  const isFree = user.tier === PremiumTier.FREE || user.subscriptionStatus === 'free';
  const isPaymentIssue = ['incomplete', 'past_due', 'unpaid'].includes(user.subscriptionStatus);
  
  const handlePortalRedirect = async () => {
    setLoading(true);
    try {
      await stripeService.goToPortal();
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert("Could not redirect to portal. Please try again.");
    }
  };

  const getStatusDisplay = (status: SubscriptionStatus) => {
    switch(status) {
      case 'active_subscription': return <span className="text-emerald-400 font-semibold">{t('status.active')}</span>;
      case 'trial_active': return <span className="text-cyan-400 font-semibold">{t('status.trialActive')}</span>;
      case 'downgrade_scheduled': return <span className="text-amber-400 font-semibold">{t('status.downgradeScheduled')}</span>;
      case 'incomplete':
      case 'past_due':
      case 'unpaid': return <span className="text-red-500 font-semibold">{t('status.paymentIssue')}</span>;
      case 'free': 
      case 'cancelled': return <span className="text-zinc-500 font-semibold">{t('status.inactive')}</span>;
      default: return <span>{status}</span>;
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121214] w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
        
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#0a0a0b]">
          <h2 className="text-xl font-bold text-white">{t('sidebar.subscription')}</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white rounded-full transition-colors bg-zinc-900/50 hover:bg-zinc-800"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
            {/* User Status Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                   <span className="text-zinc-400 text-sm">{t('status.status')}</span>
                   <span className="text-sm">{getStatusDisplay(user.subscriptionStatus)}</span>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-sm text-zinc-300">
                     <Zap size={16} className="text-indigo-400"/>
                     {t('status.currentPlan')}
                   </div>
                   <span className="text-white font-semibold">{t(`tier.${user.tier.toLowerCase()}`)}</span>
                </div>
                
                {user.nextBillingDate && (
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-sm text-zinc-300">
                       <DollarSign size={16} className="text-emerald-400"/>
                       {t('status.nextInvoice')}
                     </div>
                     <span className="text-white font-mono text-sm">{new Date(user.nextBillingDate).toLocaleDateString()}</span>
                  </div>
                )}
            </div>

            {/* Warnings */}
            {isPaymentIssue && (
                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 space-y-3">
                    <p className="text-red-400 font-semibold text-sm flex items-center gap-2">
                       <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                       {t('status.warningRisk')}
                    </p>
                </div>
            )}
            
            {/* Main Action Button */}
            <div className="pt-2">
                {isFree ? (
                   <button 
                      onClick={() => onAction('change_plan_view')} 
                      className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-500 transition duration-150 shadow-lg shadow-indigo-900/20"
                   >
                      {t('marketplace.upgrade')}
                   </button>
                ) : (
                   <button 
                      onClick={handlePortalRedirect} 
                      disabled={loading}
                      className="w-full bg-white text-black py-3.5 rounded-xl font-semibold hover:bg-zinc-200 transition duration-150 flex items-center justify-center gap-2"
                   >
                      {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                          {t('button.manageStripe')} 
                          <ExternalLink size={16} />
                        </>
                      )}
                   </button>
                )}
                
                <p className="text-center text-xs text-zinc-500 mt-4">
                  Manage your billing, payment methods, and invoices securely via Stripe.
                </p>
            </div>
            
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPortal;
