import Stripe from 'stripe';

// Server-side Stripe instance only
// Omit apiVersion to use the version bundled with the installed SDK,
// which avoids mismatched literal type errors during upgrades.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
