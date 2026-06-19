/** Server-side spend / abuse caps. Override via env in Vercel. */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

/** Shared Anthropic key — strict per-user + global caps. */
export const FREE_LIMITS = {
  hour: envInt('FREE_LIMIT_HOUR', 1),
  day: envInt('FREE_LIMIT_DAY', 2),
  maxQuestions: envInt('FREE_MAX_COUNT', 8),
  maxMaterialChars: envInt('FREE_MAX_MATERIAL_CHARS', 12_000),
} as const;

/** Total free-tier quiz generations/day across all users. 0 = off. */
export const GLOBAL_DAILY_FREE_LIMIT = envInt('GLOBAL_DAILY_LIMIT', 50);

/** Managed plan ("Plus"): shared key, but generous caps the operator absorbs. */
export const MANAGED_LIMITS = {
  hour: envInt('MANAGED_LIMIT_HOUR', 20),
  day: envInt('MANAGED_LIMIT_DAY', 80),
  maxQuestions: envInt('MANAGED_MAX_COUNT', 50),
  maxMaterialChars: envInt('MANAGED_MAX_MATERIAL_CHARS', 60_000),
} as const;

/** BYOK still hits Vercel — cap runaway scripts (paid Student / Studio). */
export const PAID_BYOK_LIMITS = {
  hour: envInt('PAID_BYOK_LIMIT_HOUR', 60),
  day: envInt('PAID_BYOK_LIMIT_DAY', 300),
} as const;

/** Course auto-fill (BYOK only, but still a serverless call). */
export const PARSE_LIMITS = {
  hour: envInt('PARSE_LIMIT_HOUR', 5),
  day: envInt('PARSE_LIMIT_DAY', 20),
} as const;
