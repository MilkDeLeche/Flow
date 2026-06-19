/** Server-side credit constants (keep in sync with src/lib/creditsConfig.ts). */

export const STUDENT_TIER_USD = 9.99;
export const STUDIO_MONTHLY_USD = 19.99;
export const FOCUS_PACK_USD = 9.99;
export const MANAGED_MONTHLY_USD = 12.99;

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export const STUDIO_INCLUDED = {
  voiceMinutes: 20,
  tutorMessages: 30,
} as const;

export const FOCUS_PACK_ADDS = {
  voiceMinutes: 25,
  tutorMessages: 20,
} as const;

export const STUDIO_HARD_CAP = {
  voiceMinutesPerMonth: 120,
  tutorMessagesPerMonth: 150,
} as const;
