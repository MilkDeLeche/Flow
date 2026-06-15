import { createClient } from '@supabase/supabase-js';
import type { ServerSupabase } from './_auth.js';

export type PlanTier = 'free' | 'student' | 'studio';

function adminClient(cfg: ServerSupabase) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(cfg.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getUserPlanRow(userId: string, cfg: ServerSupabase) {
  const admin = adminClient(cfg);
  if (!admin) return null;

  const { data, error } = await admin
    .from('user_plans')
    .select('plan_tier, lifetime_student, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('getUserPlanRow failed:', error.message);
    return null;
  }
  return data;
}

export async function syncUserPlanMetadata(
  cfg: ServerSupabase,
  userId: string,
  planTier: PlanTier
): Promise<boolean> {
  const admin = adminClient(cfg);
  if (!admin) return false;

  const { data: existing, error: readErr } = await admin.auth.admin.getUserById(userId);
  if (readErr || !existing.user) {
    console.error('getUserById failed:', readErr?.message);
    return false;
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existing.user.user_metadata,
      plan_tier: planTier,
    },
  });

  if (error) {
    console.error('updateUserById failed:', error.message);
    return false;
  }
  return true;
}

export async function applyPlanFromStripe(
  cfg: ServerSupabase,
  userId: string,
  opts: {
    planTier: PlanTier;
    lifetimeStudent?: boolean;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }
): Promise<boolean> {
  const admin = adminClient(cfg);
  if (!admin) return false;

  const { error } = await admin.rpc('apply_plan_from_stripe', {
    p_user: userId,
    p_tier: opts.planTier,
    p_lifetime_student: opts.lifetimeStudent ?? null,
    p_stripe_customer_id: opts.stripeCustomerId ?? null,
    p_stripe_subscription_id: opts.stripeSubscriptionId ?? null,
  });

  if (error) {
    console.error('apply_plan_from_stripe failed:', error.message);
    return false;
  }

  return syncUserPlanMetadata(cfg, userId, opts.planTier);
}

export async function clearStudioSubscription(
  cfg: ServerSupabase,
  userId: string
): Promise<boolean> {
  const admin = adminClient(cfg);
  if (!admin) return false;

  const row = await getUserPlanRow(userId, cfg);
  if (!row) return false;

  const { error } = await admin.rpc('clear_studio_subscription', { p_user: userId });
  if (error) {
    console.error('clear_studio_subscription failed:', error.message);
    return false;
  }

  const nextTier: PlanTier = row.lifetime_student ? 'student' : 'free';
  return syncUserPlanMetadata(cfg, userId, nextTier);
}

export async function applyFocusPack(cfg: ServerSupabase, userId: string): Promise<boolean> {
  const admin = adminClient(cfg);
  if (!admin) return false;

  const { error } = await admin.rpc('apply_focus_pack', { p_user: userId });
  if (error) {
    console.error('apply_focus_pack failed:', error.message);
    return false;
  }
  return true;
}

export async function findUserIdByStripeCustomer(
  cfg: ServerSupabase,
  customerId: string
): Promise<string | null> {
  const admin = adminClient(cfg);
  if (!admin) return null;

  const { data, error } = await admin
    .from('user_plans')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (error || !data?.user_id) return null;
  return data.user_id as string;
}

export async function findUserIdByStripeSubscription(
  cfg: ServerSupabase,
  subscriptionId: string
): Promise<string | null> {
  const admin = adminClient(cfg);
  if (!admin) return null;

  const { data, error } = await admin
    .from('user_plans')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (error || !data?.user_id) return null;
  return data.user_id as string;
}
