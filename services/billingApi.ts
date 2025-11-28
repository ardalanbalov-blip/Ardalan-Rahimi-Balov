import { UserState, PremiumTier, SubscriptionStatus, PaymentMethod, PaymentMethodType } from '../types';

interface BillingResponseSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface BillingResponseError {
  success: false;
  error: string;
}

type BillingResponse<T> = BillingResponseSuccess<T> | BillingResponseError;

const simulateDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// --- STRIPE & SUBSCRIPTION LOGIK (Simulerad API-proxy) ---
// I en riktig applikation skulle dessa funktioner anropa en säker backend (t.ex. Cloud Function)
// som i sin tur kommunicerar med Stripe API (server-side).

/**
 * Simulerar hantering av ett Stripe Checkout Session ID (token) från PaymentGateway 
 * för att slutföra en ny prenumeration på serversidan.
 */
export const createSubscriptionSecure = async (
  userId: string,
  tier: PremiumTier,
  token: string // Detta skulle vara ett Stripe Session ID eller liknande
): Promise<BillingResponse<Partial<UserState>>> => {
  await simulateDelay();
  
  // Normalt sett: Din server kallar Stripe API för att hämta sessionen,
  // skapar prenumerationen och hämtar betalningsinformation.
  
  console.log(`API: Creating subscription for User ${userId} with Token ${token} to Tier ${tier}`);

  // Simulerar ett lyckat svar
  const newSubscriptionStatus: SubscriptionStatus = 'active_subscription';
  const newPaymentMethod: PaymentMethod = {
      id: `pm_${Math.random().toString(36).substring(2, 9)}`,
      type: 'card',
      brand: 'Visa',
      last4: '4242',
  };
  
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 dagar

  const updatedUserState: Partial<UserState> = {
    tier: tier,
    subscriptionId: `sub_${Math.random().toString(36).substring(2, 9)}`,
    subscriptionStatus: newSubscriptionStatus,
    nextBillingDate: currentPeriodEnd,
    paymentMethod: newPaymentMethod,
    trialEndsAt: undefined, // Avslutar provperioden
    cancelAtPeriodEnd: false
  };

  return { 
    success: true, 
    message: `Prenumeration ${tier} aktiverad!`, 
    data: updatedUserState 
  };
};


/** Simulerar avbokning av prenumeration. */
export const cancelSubscriptionSecure = async (
  subscriptionId: string
): Promise<BillingResponse<{ status: SubscriptionStatus, cancelAtPeriodEnd: boolean }>> => {
  await simulateDelay();
  
  // Normalt sett: Din server kallar Stripe API för att sätta 'cancel_at_period_end=true'.
  console.log(`API: Scheduling cancellation for ${subscriptionId}`);

  return { 
    success: true, 
    message: 'Avbokning schemalagd. Din prenumeration är aktiv till slutet av perioden.', 
    data: { 
      status: 'downgrade_scheduled' as SubscriptionStatus,
      cancelAtPeriodEnd: true
    }
  };
};

/** Simulerar återaktivering av prenumeration. */
export const reactivateSubscriptionSecure = async (
  subscriptionId: string
): Promise<BillingResponse<{ status: SubscriptionStatus, cancelAtPeriodEnd: boolean }>> => {
    await simulateDelay();
    console.log(`API: Reactivating subscription ${subscriptionId}`);

    return { 
        success: true, 
        message: 'Prenumeration återaktiverad.', 
        data: { 
            status: 'active_subscription' as SubscriptionStatus,
            cancelAtPeriodEnd: false
        }
    };
};

/** Simulerar uppdatering av betalningsmetod. */
export const updatePaymentMethodSecure = async (
  subscriptionId: string,
  details: { type: PaymentMethodType } // I verkligheten, ett Payment Method ID
): Promise<BillingResponse<PaymentMethod>> => {
  await simulateDelay();
  console.log(`API: Updating payment method for ${subscriptionId}`);

  // Simulerar ny betalningsmetod
  const newPaymentMethod: PaymentMethod = {
      id: `pm_${Math.random().toString(36).substring(2, 9)}`,
      type: details.type,
      brand: 'Mastercard',
      last4: '1234',
  };

  return { 
    success: true, 
    message: 'Betalningsmetod uppdaterad.', 
    data: newPaymentMethod 
  };
};

/** Simulerar planbyte (t.ex. Basic till Plus, eller nedgradering). */
export const changePlanSecure = async (
  subscriptionId: string,
  newTier: PremiumTier
): Promise<BillingResponse<{ tier: PremiumTier, status: SubscriptionStatus }>> => {
  await simulateDelay();
  console.log(`API: Changing plan for ${subscriptionId} to ${newTier}`);

  // I verkligheten hanteras detta på servern baserat på om det är upp- eller nedgradering
  const status: SubscriptionStatus = 'active_subscription';

  return { 
    success: true, 
    message: `Plan ändrad till ${newTier}.`, 
    data: { 
      tier: newTier, 
      status 
    }
  };
};

/** Simulerar köp av myntpaket. */
export const buyCoinPackSecure = async (
  userId: string,
  packId: string, // t.ex. 'coin_pack_100'
  amount: number
): Promise<BillingResponse<number>> => { // Returnerar det tillagda antalet mynt
    await simulateDelay();
    console.log(`API: User ${userId} bought ${amount} coins via ${packId}`);
    return {
        success: true,
        message: `Du fick ${amount} mynt!`,
        data: amount
    };
}

export const billingApi = {
    createSubscriptionSecure,
    cancelSubscriptionSecure,
    reactivateSubscriptionSecure,
    updatePaymentMethodSecure,
    changePlanSecure,
    buyCoinPackSecure
};