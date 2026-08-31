import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
    if (!stripePromise) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY||"pk_test_51SKZtKD3g7MoYNaI33fLyF5m4heLMOFHfNgFaIUtNR8vvc0vDn2oijlblz1v5b4QpkCTX97nYOV26cFLWa7cpcsR004RA7L2WA";
        if (!key) {
            console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
            return Promise.resolve(null);
        }
        stripePromise = loadStripe(key);
    }
    return stripePromise;
}