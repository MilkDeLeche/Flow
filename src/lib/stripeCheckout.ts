import { supabase } from './supabase';

export type CheckoutProduct = 'student' | 'studio' | 'focus_pack' | 'managed';

export const PENDING_CHECKOUT_KEY = 'flow_pending_checkout';

export function savePendingCheckout(product: CheckoutProduct) {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, product);
}

export function takePendingCheckout(): CheckoutProduct | null {
  const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  if (raw === 'student' || raw === 'studio' || raw === 'focus_pack' || raw === 'managed')
    return raw;
  return null;
}

export async function startCheckout(product: CheckoutProduct): Promise<string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Please sign in first.');
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify({ product }),
  });

  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok) throw new Error(body.error || 'Checkout failed.');
  if (!body.url) throw new Error('Checkout did not return a URL.');
  return body.url;
}

export async function refreshPlanAfterCheckout(maxAttempts = 6): Promise<void> {
  if (!supabase) return;

  for (let i = 0; i < maxAttempts; i++) {
    await supabase.auth.refreshSession();
    await new Promise((r) => setTimeout(r, i === 0 ? 800 : 1200));
  }
}
