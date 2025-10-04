import Stripe from 'stripe';

// Server-side Stripe instance only
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});
