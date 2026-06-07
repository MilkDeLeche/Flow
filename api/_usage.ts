// Tamper-proof, atomic per-user rate limiting.
//
// Usage is written with the Supabase SERVICE-ROLE key via a SECURITY DEFINER
// Postgres function (check_rate_limit). Normal users have NO access to the
// usage_events table at all (RLS denies them), so nobody can read, inflate, or
// delete their own counter to bypass the limit. The DB function takes a per-user
// advisory lock, so concurrent requests can't race past the cap.
import { createClient } from '@supabase/supabase-js';
import type { ServerSupabase } from './_auth';

// Total requests/day across ALL users (protects your overall budget). 0 = off.
const GLOBAL_DAY_LIMIT = Number(process.env.GLOBAL_DAILY_LIMIT || 0);

export interface RateResult {
  ok: boolean;
  status?: number;
  message?: string;
  retryAfter?: number; // seconds
}

export async function checkAndRecordUsage(
  userId: string,
  cfg: ServerSupabase,
  kind: 'text' | 'vision',
  limits: { hour: number; day: number }
): Promise<RateResult> {
  const HOUR_LIMIT = limits.hour;
  const DAY_LIMIT = limits.day;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    // No service key: refuse in production (fail closed), allow locally.
    if (process.env.VERCEL) {
      console.error('SUPABASE_SERVICE_ROLE_KEY missing — refusing to run.');
      return { ok: false, status: 503, message: 'Server is not fully configured.' };
    }
    return { ok: true };
  }

  const admin = createClient(cfg.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_user: userId,
      p_kind: kind,
      p_hour_limit: HOUR_LIMIT,
      p_day_limit: DAY_LIMIT,
      p_global_day_limit: GLOBAL_DAY_LIMIT,
    });
    if (error) {
      console.error('check_rate_limit failed:', error.message);
      return { ok: false, status: 503, message: 'Usage tracking unavailable.' };
    }

    const r = data as { ok: boolean; reason?: string; retry_after?: number };
    if (!r.ok) {
      const message =
        r.reason === 'global'
          ? 'The app is at capacity for today. Please try again later.'
          : r.reason === 'hour'
          ? `Hourly limit reached (${HOUR_LIMIT}). Please try again later.`
          : `Daily limit reached (${DAY_LIMIT}). Please try again tomorrow.`;
      return { ok: false, status: 429, message, retryAfter: r.retry_after };
    }
    return { ok: true };
  } catch (err) {
    console.error('rate-limit error:', err);
    return { ok: false, status: 503, message: 'Usage tracking unavailable.' };
  }
}
