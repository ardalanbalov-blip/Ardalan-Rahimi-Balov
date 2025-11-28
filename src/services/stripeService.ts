
import { getStripePayments, createCheckoutSession, createPortalLink } from '@stripe/firestore-stripe-payments';
import { app } from './firebase';
import { PremiumTier } from '../types';
import { TIERS } from '../constants';

const payments = getStripePayments(app, {
  productsCollection: 'products',
  customersCollection: 'customers',
});

/**
 * Initiates a Stripe Checkout Session for a given tier.
 * This function creates a document in the 'checkout_sessions' collection,
 * which the Stripe Firebase Extension detects to generate a checkout URL.
 */
export const startCheckout = async (tier: PremiumTier) => {
  const tierConfig = TIERS.find(t => t.id === tier);
  
  if (!tierConfig || !tierConfig.stripePriceId) {
    throw new Error(`Stripe configuration missing for tier: ${tier}. Please check constants.ts`);
  }

  try {
    const session = await createCheckoutSession(payments, {
      price: tierConfig.stripePriceId,
      success_url: window.location.origin,
      cancel_url: window.location.origin,
      // allow_promotion_codes: true, // Optional: enable if you have promo codes in Stripe
      // trial_from_plan: true // Default behaviour
    });
    
    // Redirect to Stripe
    window.location.assign(session.url);
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    throw new Error(error.message || "Failed to start checkout process.");
  }
}

/**
 * Redirects the user to the Stripe Customer Portal to manage subscriptions.
 * Uses the extension's callable function.
 */
export const goToPortal = async () => {
  try {
    const { url } = await createPortalLink(payments, {
      returnUrl: window.location.origin,
    });
    window.location.assign(url);
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    throw new Error(error.message || "Failed to access subscription portal.");
  }
}

export const stripeService = {
  startCheckout,
  goToPortal
};
