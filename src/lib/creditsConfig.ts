/**
 * Flow Studio included allowances + top-up pack (display + server must stay in sync).
 * Economics target: average Studio user costs ~$3–5/mo in API; heavy user hits cap ~$8–10
 * before needing a $10 top-up (~$4–5 your cost, ~$5–6 margin).
 */

export const STUDIO_MONTHLY_USD = 20;
export const FOCUS_PACK_USD = 10;

/** Included with Flow Studio each billing month */
export const STUDIO_INCLUDED = {
  voiceMinutes: 20,
  tutorMessages: 30,
} as const;

/** One-time $10 Focus Pack add-on (stacks until used; does not expire mid-month) */
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
