
import { PremiumTier, SubscriptionStatus, PaymentMethod, Invoice, PaymentMethodType } from "../types";
import { TIERS, TRIAL_DURATION_DAYS } from "../constants";

interface MockResponse<T> {
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

export const MockPaymentService = {
  
  async createSubscription(
    userEmail: string, 
    tierId: PremiumTier, 
    paymentMethodType: PaymentMethodType,
    paymentDetails?: { cardNumber?: string, expiry?: string, cvc?: string }
  ): Promise<MockResponse<SubscriptionResult>> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date();
        const nextBilling = new Date(now);
        nextBilling.setDate(now.getDate() + 30); 

        resolve({
          success: true,
          data: {
            subscriptionId: `sub_mock_${Math.random().toString(36).substr(2, 9)}`,
            status: 'trial_active', 
            currentPeriodEnd: nextBilling.toISOString(),
            trialEnd: nextBilling.toISOString(), 
            cancelAtPeriodEnd: false
          }
        });
      }, 1000); 
    });
  },

  async changePlan(subscriptionId: string, newTierId: PremiumTier): Promise<MockResponse<SubscriptionResult>> {
     return new Promise((resolve) => {
      setTimeout(() => {
        const activeSubId = subscriptionId || `sub_mock_fallback_${Date.now()}`;
        const now = new Date();
        const nextBilling = new Date(now);
        nextBilling.setMonth(now.getMonth() + 1);

        const status: SubscriptionStatus = newTierId === PremiumTier.FREE ? 'free' : 'active_subscription';

        resolve({
          success: true,
          data: {
            subscriptionId: activeSubId,
            status: status, 
            currentPeriodEnd: nextBilling.toISOString(),
            cancelAtPeriodEnd: false // Resets cancellation on plan change
          }
        });
      }, 500); 
     });
  },

  async cancelSubscription(subscriptionId: string): Promise<MockResponse<{ canceledAt: string; cancelAtPeriodEnd: boolean; status: SubscriptionStatus }>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: { 
            canceledAt: new Date().toISOString(),
            cancelAtPeriodEnd: true, 
            status: 'active_subscription' // Remains active per SaaS logic
          }
        });
      }, 500);
    });
  },

  async reactivateSubscription(subscriptionId: string): Promise<MockResponse<{ status: SubscriptionStatus; cancelAtPeriodEnd: boolean }>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            status: 'active_subscription',
            cancelAtPeriodEnd: false
          }
        });
      }, 500);
    });
  },

  async updatePaymentMethod(subscriptionId: string, paymentDetails: any): Promise<MockResponse<PaymentMethod>> {
    return new Promise((resolve) => {
      setTimeout(() => {
         const pm: PaymentMethod = {
           id: `pm_${Math.random()}`,
           type: 'card',
           brand: 'Visa',
           last4: '4242'
         };
         resolve({ success: true, data: pm });
      }, 800);
    });
  },

  async getInvoices(subscriptionId: string): Promise<Invoice[]> {
    return [];
  },

  getPaymentMethodDetails(type: PaymentMethodType, cardNumber?: string): PaymentMethod {
    return {
      id: `pm_${Math.random()}`,
      type: 'card',
      brand: 'Visa',
      last4: cardNumber?.slice(-4) || '1234'
    };
  }
};
