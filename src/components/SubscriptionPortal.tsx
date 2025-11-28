import React from 'react';
import { UserState, PremiumTier, SubscriptionStatus } from '../types';
import { X, Clock, Zap, DollarSign, CreditCard } from 'lucide-react';
import { TIERS, t } from '../constants';

interface SubscriptionPortalProps {
  user: UserState;
  onClose: () => void;
  onAction: (action: 'cancel' | 'resume' | 'update_payment' | 'change_plan_view') => void;
}

const SubscriptionPortal: React.FC<SubscriptionPortalProps> = ({ user, onClose, onAction }) => {

  const isTierActive = (tier: PremiumTier): boolean => {
    const userTierConfig = TIERS.find(t => t.id === user.tier);
    const targetTierConfig = TIERS.find(t => t.id === tier);
    if (!userTierConfig || !targetTierConfig) return false;
    
    const userIndex = TIERS.indexOf(userTierConfig);
    const targetIndex = TIERS.indexOf(targetTierConfig);

    return userIndex >= targetIndex;
  };
  
  const isCancellable = user.subscriptionStatus === 'active_subscription' || user.subscriptionStatus === 'trial_active';
  const isDowngradeScheduled = user.subscriptionStatus === 'downgrade_scheduled';
  const isPaymentIssue = ['incomplete', 'past_due', 'unpaid'].includes(user.subscriptionStatus);
  const isFree = user.tier === PremiumTier.FREE || user.subscriptionStatus === 'free';
  
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
                
                {user.paymentMethod && (
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-sm text-zinc-300">
                       <CreditCard size={16} className="text-zinc-500"/>
                       {t('status.paymentMethod')}
                     </div>
                     <span className="text-white text-sm font-mono">{user.paymentMethod.brand} •••• {user.paymentMethod.last4}</span>
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
                    <button 
                        onClick={() => onAction('update_payment')} 
                        className="text-xs bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-bold uppercase tracking-wider"
                    >
                        {t('button.updatePaymentMethod')}
                    </button>
                </div>
            )}
            
            {/* Actions */}
            <div className="grid gap-3 pt-2">
                <button 
                    onClick={() => onAction('change_plan_view')} 
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-500 transition duration-150 shadow-lg shadow-indigo-900/20"
                >
                    {isFree ? t('marketplace.upgrade') : t('button.changePlan')}
                </button>
                
                {isDowngradeScheduled && (
                    <button 
                        onClick={() => onAction('resume')} 
                        className="w-full bg-emerald-500/10 text-emerald-400 py-3.5 rounded-xl font-semibold hover:bg-emerald-500/20 transition duration-150 border border-emerald-500/30"
                    >
                        {t('button.reactivateSubscription')}
                    </button>
                )}
                
                {isCancellable && (
                    <button 
                        onClick={() => onAction('cancel')} 
                        className="w-full bg-zinc-800 text-zinc-400 py-3.5 rounded-xl font-medium hover:bg-zinc-700 hover:text-white transition duration-150"
                    >
                        {t('button.cancelSubscription')}
                    </button>
                )}
            </div>
            
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPortal;