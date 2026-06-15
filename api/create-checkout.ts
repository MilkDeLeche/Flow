import type { IncomingMessage, ServerResponse } from 'http';
import {
  bearerToken,
  getServerSupabase,
  verifyUser,
} from './_auth.js';
import { getUserPlanRow } from './_planAdmin.js';
import {
  appBaseUrl,
  getStripe,
  isCheckoutProduct,
  priceIdFor,
  type CheckoutProduct,
} from './_stripeConfig.js';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const anyReq = req as IncomingMessage & { body?: unknown };
  if (anyReq.body && typeof anyReq.body === 'object') {
    return anyReq.body as Record<string, unknown>;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function checkoutBlocked(
  product: CheckoutProduct,
  planTier: string
): string | null {
  if (product === 'student' && (planTier === 'student' || planTier === 'studio')) {
    return 'You already have Student access.';
  }
  if (product === 'studio' && planTier === 'studio') {
    return 'You already have Flow Studio.';
  }
  if (product === 'focus_pack' && planTier !== 'studio') {
    return 'Focus Pack requires an active Flow Studio plan.';
  }
  return null;
}

export default async function handler(
  req: IncomingMessage & { method?: string; headers?: Record<string, string | string[] | undefined> },
  res: ServerResponse
) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const stripe = getStripe();
  if (!stripe) return send(res, 503, { error: 'Stripe is not configured.' });

  const sb = getServerSupabase();
  if (!sb) return send(res, 503, { error: 'Server is not configured.' });

  const token = bearerToken(req.headers?.authorization as string | undefined);
  const user = token ? await verifyUser(token, sb) : null;
  if (!user) return send(res, 401, { error: 'Not authorized.' });

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch {
    return send(res, 400, { error: 'Invalid JSON body.' });
  }

  const product = body.product;
  if (!isCheckoutProduct(product)) {
    return send(res, 400, { error: 'Invalid product.' });
  }

  const priceId = priceIdFor(product);
  if (!priceId) {
    return send(res, 503, { error: `Stripe price for ${product} is not configured.` });
  }

  const planRow = await getUserPlanRow(user.id, sb);
  const planTier = String(planRow?.plan_tier ?? 'free');
  const blocked = checkoutBlocked(product, planTier);
  if (blocked) return send(res, 400, { error: blocked });

  const originHeader = req.headers?.origin;
  const origin = typeof originHeader === 'string' ? originHeader : undefined;
  const base = appBaseUrl(origin);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        product,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          product,
        },
      },
      ...(planRow?.stripe_customer_id
        ? { customer: planRow.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      success_url: `${base}/?checkout=success`,
      cancel_url: `${base}/?checkout=cancel`,
      allow_promotion_codes: product === 'studio',
    });

    if (!session.url) return send(res, 500, { error: 'Stripe did not return a checkout URL.' });
    return send(res, 200, { url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed.';
    console.error('create-checkout failed:', message);
    return send(res, 500, { error: message });
  }
}
