import { useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { tierFromUser, type PlanTier } from './tiers';

export function usePlanTier(session: Session | null): PlanTier {
  return useMemo(() => tierFromUser(session?.user), [session?.user]);
}
