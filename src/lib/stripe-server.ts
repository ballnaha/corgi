import Stripe from 'stripe';

// Lazy, safe server-side Stripe initializer to avoid import-time crashes
// when STRIPE_SECRET_KEY is missing in some environments.
let stripeInstance: Stripe | null = null;

export function getStripeServer(): Stripe {
	if (stripeInstance) return stripeInstance;

	const secret = process.env.STRIPE_SECRET_KEY;
	if (!secret || !secret.trim()) {
		const err: any = new Error(
			'Stripe configuration error: STRIPE_SECRET_KEY is not set. Please configure your environment variables.'
		);
		err.code = 'CONFIG_ERROR';
		throw err;
	}

	// Omit apiVersion to use SDK bundled version
	stripeInstance = new Stripe(secret);
	return stripeInstance;
}
