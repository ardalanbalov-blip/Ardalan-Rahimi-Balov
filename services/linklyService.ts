
import { PremiumTier, SubscriptionStatus, PaymentMethod, Invoice, PaymentMethodType } from "../types";
import { TIERS, TRIAL_DURATION_DAYS } from "../constants";

// Types for Linkly Service Responses
interface LinklyResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: 'card_declined' | 'insufficient_funds' | 'expired_card' | 'network_timeout' | 'invalid_request';
}

interface SubscriptionResult {
  subscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Linkly Service (Simulated) - DEPRECATED / LEGACY FALLBACK
 * Use MockPaymentService instead. Kept for type safety.
 */
export const LinklyService = {
  
  async createSubscription(
    userEmail: string, 
    tierId: PremiumTier, 
    paymentMethodType: PaymentMethodType,
    paymentDetails?: { cardNumber?: string, expiry?: string, cvc?: string }
  ): Promise<LinklyResponse<SubscriptionResult>> {
    
    // Legacy fallback behavior
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(now.getDate() + TRIAL_DURATION_DAYS);

    return Promise.resolve({
          success: true,
          data: {
            subscriptionId: `sub_lnk_${Math.random().toString(36).substr(2, 9)}`,
            status: 'trial_active',
            currentPeriodEnd: trialEndDate.toISOString(),
            trialEnd: trialEndDate.toISOString(),
            cancelAtPeriodEnd: false
          }
    });
  },

  async changePlan(subscriptionId: string, newTierId: PremiumTier): Promise<LinklyResponse<SubscriptionResult>> {
     return Promise.resolve({
          success: true,
          data: {
            subscriptionId: subscriptionId,
            status: 'active_subscription',
            currentPeriodEnd: new Date().toISOString(),
            cancelAtPeriodEnd: false
          }
     });
  },

  async cancelSubscription(subscriptionId: string): Promise<LinklyResponse<{ canceledAt: string; cancelAtPeriodEnd: boolean; status: SubscriptionStatus }>> {
    return Promise.resolve({
          success: true,
          data: { 
            canceledAt: new Date().toISOString(),
            cancelAtPeriodEnd: true,
            status: 'active_subscription'
          }
    });
  },

  async reactivateSubscription(subscriptionId: string): Promise<LinklyResponse<{ status: SubscriptionStatus; cancelAtPeriodEnd: boolean }>> {
    return Promise.resolve({
          success: true,
          data: {
            status: 'active_subscription',
            cancelAtPeriodEnd: false
          }
    });
  },

  async updatePaymentMethod(subscriptionId: string, paymentDetails: any): Promise<LinklyResponse<PaymentMethod>> {
     return Promise.resolve({
           success: true,
           data: {
              id: 'pm_legacy',
              type: 'card',
              brand: 'Visa',
              last4: '1234'
           }
     });
  },

  async getInvoices(subscriptionId: string): Promise<Invoice[]> {
    return [];
  },

  getPaymentMethodDetails(type: PaymentMethodType, cardNumber?: string): PaymentMethod {
    return {
      id: 'pm_legacy',
      type: 'card',
      brand: 'Visa',
      last4: '0000'
    };
  }
};
