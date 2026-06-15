/** Server-side credit constants (keep in sync with src/lib/creditsConfig.ts). */

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
