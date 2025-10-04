import { loadStripe } from '@stripe/stripe-js';

// Client-side Stripe instance only
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'thb', // Thai Baht
  payment_method_types: ['card'],
  billing_address_collection: 'required',
  shipping_address_collection: {
    allowed_countries: ['TH'], // Thailand only
  },
};
