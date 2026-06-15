import { supabase } from './supabase';
import {
  FOCUS_PACK_ADDS,
  FOCUS_PACK_USD,
  STUDIO_INCLUDED,
  voiceMinutesRemaining,
  tutorMessagesRemaining,
} from './creditsConfig';

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
}

export interface StudioUsageView extends StudioUsage {
  voiceMinutesRemaining: number;
  tutorMessagesRemaining: number;
  voiceMinutesTotal: number;
  tutorMessagesTotal: number;
}

function parseRaw(raw: Record<string, unknown>): StudioUsage {
  return {
    planTier: String(raw.plan_tier ?? 'free'),
    billingPeriodStart: String(raw.billing_period_start ?? ''),
    voiceMinutesUsed: Number(raw.voice_minutes_used ?? 0),
    voiceMinutesIncluded: Number(raw.voice_minutes_included ?? STUDIO_INCLUDED.voiceMinutes),
    voiceMinutesBonus: Number(raw.voice_minutes_bonus ?? 0),
    tutorMessagesUsed: Number(raw.tutor_messages_used ?? 0),
    tutorMessagesIncluded: Number(raw.tutor_messages_included ?? STUDIO_INCLUDED.tutorMessages),
    tutorMessagesBonus: Number(raw.tutor_messages_bonus ?? 0),
    focusPacksPurchased: Number(raw.focus_packs_purchased ?? 0),
  };
}

export function enrichUsage(usage: StudioUsage): StudioUsageView {
  const voiceMinutesTotal = usage.voiceMinutesIncluded + usage.voiceMinutesBonus;
  const tutorMessagesTotal = usage.tutorMessagesIncluded + usage.tutorMessagesBonus;
  return {
    ...usage,
    voiceMinutesTotal,
    tutorMessagesTotal,
    voiceMinutesRemaining: voiceMinutesRemaining({
      used: usage.voiceMinutesUsed,
      included: usage.voiceMinutesIncluded,
      bonus: usage.voiceMinutesBonus,
    }),
    tutorMessagesRemaining: tutorMessagesRemaining({
      used: usage.tutorMessagesUsed,
      included: usage.tutorMessagesIncluded,
      bonus: usage.tutorMessagesBonus,
    }),
  };
}

export async function loadStudioUsage(): Promise<StudioUsageView | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_my_studio_usage');
  if (error || !data) return null;

  return enrichUsage(parseRaw(data as Record<string, unknown>));
}

export { FOCUS_PACK_ADDS, FOCUS_PACK_USD, STUDIO_INCLUDED };
