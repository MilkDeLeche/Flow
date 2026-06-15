import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';
import { getServerSupabase } from './_auth.js';
import {
  applyFocusPack,
  applyPlanFromStripe,
  clearStudioSubscription,
  findUserIdByStripeCustomer,
  findUserIdByStripeSubscription,
} from './_planAdmin.js';
import { getStripe } from './_stripeConfig.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

function send(res: ServerResponse, status: number, body: string) {
  res.statusCode = status;
  res.setHeader('content-type', 'text/plain');
  res.end(body);
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const anyReq = req as IncomingMessage & { body?: unknown };
  if (Buffer.isBuffer(anyReq.body)) return anyReq.body;
  if (typeof anyReq.body === 'string') return Buffer.from(anyReq.body);
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function handleCheckoutCompleted(
  cfg: NonNullable<ReturnType<typeof getServerSupabase>>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id || session.client_reference_id;
  if (!userId) {
    console.error('checkout.session.completed missing user id');
    return;
  }

  const product = session.metadata?.product;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  if (session.mode === 'subscription' || product === 'studio') {
    await applyPlanFromStripe(cfg, userId, {
      planTier: 'studio',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    });
    return;
  }

  if (product === 'student') {
    await applyPlanFromStripe(cfg, userId, {
      planTier: 'student',
      lifetimeStudent: true,
      stripeCustomerId: customerId,
    });
    return;
  }

  if (product === 'focus_pack') {
    if (customerId) {
      await applyPlanFromStripe(cfg, userId, {
        planTier: 'studio',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      });
    }
    await applyFocusPack(cfg, userId);
  }
}

async function handleSubscriptionChange(
  cfg: NonNullable<ReturnType<typeof getServerSupabase>>,
  subscription: Stripe.Subscription
) {
  const subscriptionId = subscription.id;
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  let userId = await findUserIdByStripeSubscription(cfg, subscriptionId);
  if (!userId && customerId) {
    userId = await findUserIdByStripeCustomer(cfg, customerId);
  }
  if (!userId) {
    console.error('subscription event: user not found', subscriptionId);
    return;
  }

  const active = subscription.status === 'active' || subscription.status === 'trialing';

  if (active) {
    await applyPlanFromStripe(cfg, userId, {
      planTier: 'studio',
      stripeCustomerId: customerId ?? null,
      stripeSubscriptionId: subscriptionId,
    });
    return;
  }

  await clearStudioSubscription(cfg, userId);
}

export default async function handler(
  req: IncomingMessage & { method?: string; headers?: Record<string, string | string[] | undefined> },
  res: ServerResponse
) {
  if (req.method !== 'POST') return send(res, 405, 'Method not allowed');

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sb = getServerSupabase();

  if (!stripe || !webhookSecret || !sb) {
    return send(res, 503, 'Stripe webhook is not configured.');
  }

  const signature = req.headers?.['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    return send(res, 400, 'Missing Stripe signature.');
  }

  let event: Stripe.Event;
  try {
    const payload = await readRawBody(req);
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    console.error('stripe webhook verify failed:', message);
    return send(res, 400, `Webhook Error: ${message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(sb, event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(sb, event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error('stripe webhook handler failed:', err);
    return send(res, 500, 'Webhook handler failed.');
  }

  return send(res, 200, 'ok');
}
