import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from './firebase'; 
import { PremiumTier } from '../types';
import { TIERS } from '../constants';

/**
 * Initiates a Stripe Checkout Session for a given tier.
 * This function manually creates a document in the 'checkout_sessions' collection,
 * which the Stripe Firebase Extension detects to generate a checkout URL.
 */
export const startCheckout = async (tier: PremiumTier) => {
  const tierConfig = TIERS.find(t => t.id === tier);
  
  if (!tierConfig || !tierConfig.stripePriceId) {
    throw new Error(`Stripe configuration missing for tier: ${tier}. Please check constants.ts`);
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to start a checkout session.");
  }

  try {
    // Reference the subcollection for the specific user
    const checkoutSessionsRef = collection(db, 'customers', user.uid, 'checkout_sessions');
    
    // Create the checkout session document
    const docRef = await addDoc(checkoutSessionsRef, {
      price: tierConfig.stripePriceId,
      success_url: window.location.origin,
      cancel_url: window.location.origin,
      // allow_promotion_codes: true, // Optional: enable if you have promo codes in Stripe
      // trial_from_plan: true // Default behaviour
    });

    // Listen for the extension to append the URL or error to the document
    return new Promise<void>((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const data = snap.data();
        if (data) {
          if (data.error) {
            unsubscribe();
            reject(new Error(data.error.message));
          }
          if (data.url) {
            unsubscribe();
            window.location.assign(data.url);
            resolve();
          }
        }
      });
    });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    throw new Error(error.message || "Failed to start checkout process.");
  }
}

/**
 * Redirects the user to the Stripe Customer Portal to manage subscriptions.
 * Uses the extension's callable function via Firebase Functions.
 */
export const goToPortal = async () => {
  // Use the shared functions instance (configured for europe-west4)
  const functionRef = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
  
  try {
    const { data }: any = await functionRef({
      returnUrl: window.location.origin,
    });
    window.location.assign(data.url);
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    throw new Error(error.message || "Failed to access subscription portal.");
  }
}

export const stripeService = {
  startCheckout,
  goToPortal
};