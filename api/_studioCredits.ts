import { createClient } from '@supabase/supabase-js';
import type { ServerSupabase } from './_auth.js';
import {
  FOCUS_PACK_ADDS,
  STUDIO_HARD_CAP,
  STUDIO_INCLUDED,
} from './_creditsConfig.js';

export interface StudioUsage {
  planTier: string;
  billingPeriodStart: string;
  voiceMinutesUsed: number;
  voiceMinutesIncluded: number;
  voiceMinutesBonus: number;
  tutorMessagesUsed: number;
  tutorMessagesIncluded: number;
  tutorMessagesBonus: number;
  focusPacksPurchased: number;
  voiceMinutesRemaining: number;
  tutorMessagesRemaining: number;
}

function adminClient(cfg: ServerSupabase) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(cfg.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseUsage(raw: Record<string, unknown>): StudioUsage {
  const voiceUsed = Number(raw.voice_minutes_used ?? 0);
  const voiceIncluded = Number(raw.voice_minutes_included ?? STUDIO_INCLUDED.voiceMinutes);
  const voiceBonus = Number(raw.voice_minutes_bonus ?? 0);
  const tutorUsed = Number(raw.tutor_messages_used ?? 0);
  const tutorIncluded = Number(raw.tutor_messages_included ?? STUDIO_INCLUDED.tutorMessages);
  const tutorBonus = Number(raw.tutor_messages_bonus ?? 0);

  const voiceCap = Math.min(voiceIncluded + voiceBonus, STUDIO_HARD_CAP.voiceMinutesPerMonth);
  const tutorCap = Math.min(tutorIncluded + tutorBonus, STUDIO_HARD_CAP.tutorMessagesPerMonth);

  return {
    planTier: String(raw.plan_tier ?? 'free'),
    billingPeriodStart: String(raw.billing_period_start ?? ''),
    voiceMinutesUsed: voiceUsed,
    voiceMinutesIncluded: voiceIncluded,
    voiceMinutesBonus: voiceBonus,
    tutorMessagesUsed: tutorUsed,
    tutorMessagesIncluded: tutorIncluded,
    tutorMessagesBonus: tutorBonus,
    focusPacksPurchased: Number(raw.focus_packs_purchased ?? 0),
    voiceMinutesRemaining: Math.max(0, voiceCap - voiceUsed),
    tutorMessagesRemaining: Math.max(0, tutorCap - tutorUsed),
  };
}

export async function fetchStudioUsage(
  userId: string,
  cfg: ServerSupabase
): Promise<StudioUsage | null> {
  const admin = adminClient(cfg);
  if (!admin) return null;

  const { data, error } = await admin.rpc('get_studio_usage', { p_user: userId });
  if (error || !data) {
    console.error('get_studio_usage failed:', error?.message);
    return null;
  }
  return parseUsage(data as Record<string, unknown>);
}

export async function consumeStudioCredit(
  userId: string,
  cfg: ServerSupabase,
  kind: 'voice' | 'tutor',
  amount: number
): Promise<{ ok: boolean; reason?: string; remaining?: number }> {
  const admin = adminClient(cfg);
  if (!admin) {
    if (process.env.VERCEL) return { ok: false, reason: 'not_configured' };
    return { ok: true };
  }

  const { data, error } = await admin.rpc('consume_studio_credit', {
    p_user: userId,
    p_kind: kind,
    p_amount: amount,
  });
  if (error) {
    console.error('consume_studio_credit failed:', error.message);
    return { ok: false, reason: 'error' };
  }
  const r = data as { ok: boolean; reason?: string; remaining?: number };
  return r;
}

export { FOCUS_PACK_ADDS, STUDIO_INCLUDED };
