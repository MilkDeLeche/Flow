// "Bring your own key" — a personal LLM key (Anthropic / OpenAI / Gemini).
//
// PRODUCTION (Supabase configured): the key is sent ONCE to /api/key over HTTPS,
// encrypted at rest, and tied to your account. It is never kept in the browser
// and never sent again — the server decrypts it server-side per request. So your
// key follows you across devices and nobody can read it from the client.
//
// LOCAL DEV (no Supabase, or `npm run dev`): falls back to localStorage for
// convenience, sent inline to the local dev API. Never used in production.
import { supabase } from './supabase';

export type Provider = 'anthropic' | 'openai' | 'gemini';

export interface Byok {
  provider: Provider;
  key: string;
  model: string;
}

export interface KeyStatus {
  configured: boolean;
  provider?: Provider;
  model?: string;
  hint?: string;
}

const STORE = 'flow_byok';

// Server-backed only when Supabase is configured AND we're not in local dev.
function serverMode(): boolean {
  return !!supabase && !import.meta.env.DEV;
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (ChatGPT)',
  gemini: 'Google Gemini',
};

// Model options per provider (cheapest first). Labels hint at cost.
export const PROVIDER_MODELS: Record<Provider, { id: string; label: string }[]> = {
  anthropic: [
    { id: 'claude-haiku-4-5', label: 'Haiku — cheapest' },
    { id: 'claude-sonnet-4-6', label: 'Sonnet — balanced' },
    { id: 'claude-opus-4-8', label: 'Opus — best' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini — cheapest' },
    { id: 'gpt-4o', label: 'GPT-4o — better' },
  ],
  gemini: [
    { id: 'gemini-1.5-flash', label: 'Flash — cheapest (free tier)' },
    { id: 'gemini-1.5-pro', label: 'Pro — better' },
  ],
};

export const KEY_HINT: Record<Provider, string> = {
  anthropic: 'sk-ant-...',
  openai: 'sk-...',
  gemini: 'AIza...',
};

export function keyLooksValid(provider: Provider, key: string): boolean {
  const k = key.trim();
  if (provider === 'anthropic') return /^sk-ant-[A-Za-z0-9_-]{10,}$/.test(k);
  if (provider === 'openai') return /^sk-[A-Za-z0-9_-]{20,}$/.test(k);
  return /^AIza[A-Za-z0-9_-]{20,}$/.test(k);
}

function mask(key: string): string {
  const k = key.trim();
  return k.length <= 8 ? '••••' : `${k.slice(0, 6)}…${k.slice(-4)}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) h['authorization'] = `Bearer ${token}`;
  }
  return h;
}

/** Current key status (configured?, provider, model, masked hint). */
export async function loadKeyStatus(): Promise<KeyStatus> {
  if (serverMode()) {
    try {
      const res = await fetch('/api/key', { headers: await authHeaders() });
      if (!res.ok) return { configured: false };
      return (await res.json()) as KeyStatus;
    } catch {
      return { configured: false };
    }
  }
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return { configured: false };
    const v = JSON.parse(raw) as Byok;
    return v?.key
      ? { configured: true, provider: v.provider, model: v.model, hint: mask(v.key) }
      : { configured: false };
  } catch {
    return { configured: false };
  }
}

export async function saveKey(
  provider: Provider,
  key: string,
  model: string
): Promise<{ ok: boolean; error?: string; status?: KeyStatus }> {
  if (serverMode()) {
    try {
      const res = await fetch('/api/key', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ provider, key: key.trim(), model }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const setupHint =
          res.status >= 500
            ? ' Check your Vercel Supabase environment variables and run the Supabase key-storage SQL migration.'
            : '';
        return {
          ok: false,
          error: data.error ? `${data.error}${setupHint}` : `Could not save your key.${setupHint}`,
        };
      }
      return { ok: true, status: data as KeyStatus };
    } catch {
      return { ok: false, error: 'Network error while saving your key.' };
    }
  }
  try {
    localStorage.setItem(STORE, JSON.stringify({ provider, key: key.trim(), model }));
  } catch {
    /* ignore quota */
  }
  return {
    ok: true,
    status: { configured: true, provider, model, hint: mask(key) },
  };
}

export async function clearKey(): Promise<void> {
  if (serverMode()) {
    try {
      await fetch('/api/key', { method: 'DELETE', headers: await authHeaders() });
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    localStorage.removeItem(STORE);
  } catch {
    /* ignore */
  }
}

/**
 * The key to send inline with a generate request — ONLY in local dev mode.
 * In production the server holds the key, so this returns null (the browser
 * never carries the key).
 */
export function getRequestKey(): Byok | null {
  if (serverMode()) return null;
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const v = JSON.parse(raw) as Byok;
    return v?.key ? v : null;
  } catch {
    return null;
  }
}
