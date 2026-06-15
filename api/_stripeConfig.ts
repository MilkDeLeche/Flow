import Stripe from 'stripe';

export type CheckoutProduct = 'student' | 'studio' | 'focus_pack';

const PRODUCT_PRICES: Record<CheckoutProduct, string | undefined> = {
  student: process.env.STRIPE_PRICE_STUDENT,
  studio: process.env.STRIPE_PRICE_STUDIO,
  focus_pack: process.env.STRIPE_PRICE_FOCUS_PACK,
};

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function appBaseUrl(reqOrigin?: string): string {
  const configured =
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;
  const base = (configured || reqOrigin || 'http://localhost:5173').replace(/\/+$/, '');
  return base;
}

export function priceIdFor(product: CheckoutProduct): string | null {
  const id = PRODUCT_PRICES[product];
  return id?.trim() || null;
}

export function isCheckoutProduct(value: unknown): value is CheckoutProduct {
  return value === 'student' || value === 'studio' || value === 'focus_pack';
}
