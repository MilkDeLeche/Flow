import type { User } from '@supabase/supabase-js';

/**
 * free   = shared AI only (tight caps).
 * managed = shared AI on a paid plan (generous caps, no key needed).
 * student = BYOK unlock. studio = BYOK + Flow reader + tutor.
 */
export type PlanTier = 'free' | 'managed' | 'student' | 'studio';

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free',
  managed: 'Flow Plus',
  student: 'Student',
  studio: 'Flow Studio',
};

export function tierFromUser(user: User | null | undefined): PlanTier {
  const raw = user?.user_metadata?.plan_tier ?? user?.app_metadata?.plan_tier;
  if (raw === 'student' || raw === 'studio' || raw === 'managed') return raw;
  return 'free';
}

export function canUseByok(tier: PlanTier): boolean {
  return tier === 'student' || tier === 'studio';
}

/** Managed "Plus" plan: paid, but uses the shared key instead of BYOK. */
export function isManagedPlan(tier: PlanTier): boolean {
  return tier === 'managed';
}

export function canUseStudioFeatures(tier: PlanTier): boolean {
  return tier === 'studio';
}

/** Dev-only: treat local BYOK as Student tier for testing uploads. */
export function effectiveTier(tier: PlanTier, localByok = false): PlanTier {
  if (import.meta.env.DEV && localByok && tier === 'free') return 'student';
  return tier;
}
