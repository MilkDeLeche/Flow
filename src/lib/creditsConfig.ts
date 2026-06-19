/**
 * Flow Studio included allowances + top-up pack (display + server must stay in sync).
 * Prices must match Stripe Dashboard (Student one-time, Studio + Focus Pack monthly).
 * Economics target: average Studio user costs ~$3–5/mo in API; heavy user hits cap ~$8–10
 * before needing a Focus Pack top-up.
 */

/** Match Stripe one-time Student price */
export const STUDENT_TIER_USD = 9.99;
/** Match Stripe Flow Studio monthly price */
export const STUDIO_MONTHLY_USD = 19.99;
/** Match Stripe Flow Plus (managed) monthly price */
export const MANAGED_MONTHLY_USD = 12.99;
/** Match Stripe Focus Pack monthly price */
export const FOCUS_PACK_USD = 9.99;

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Included with Flow Studio each billing month */
export const STUDIO_INCLUDED = {
  voiceMinutes: 20,
  tutorMessages: 30,
} as const;

/** Focus Pack add-on (stacks until used; does not expire mid-month) */
export const FOCUS_PACK_ADDS = {
  voiceMinutes: 25,
  tutorMessages: 20,
} as const;

/** Safety ceiling so one account cannot drain the platform key */
export const STUDIO_HARD_CAP = {
  voiceMinutesPerMonth: 120,
  tutorMessagesPerMonth: 150,
} as const;

export function voiceMinutesRemaining(args: {
  used: number;
  included: number;
  bonus: number;
}): number {
  return Math.max(0, args.included + args.bonus - args.used);
}

export function tutorMessagesRemaining(args: {
  used: number;
  included: number;
  bonus: number;
}): number {
  return Math.max(0, args.included + args.bonus - args.used);
}
