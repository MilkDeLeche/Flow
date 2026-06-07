// "Bring your own key" — a personal LLM key (Anthropic / OpenAI / Gemini).
// Stored ONLY in this browser and sent per-request; never stored on our server.
// With a key set, the user runs on their own key/budget with no shared limits.
export type Provider = 'anthropic' | 'openai' | 'gemini';

export interface Byok {
  provider: Provider;
  key: string;
  model: string;
}

const STORE = 'flow_byok';

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

export function getByok(): Byok | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const v = JSON.parse(raw) as Byok;
    return v && v.provider && v.key ? v : null;
  } catch {
    return null;
  }
}

export function setByok(value: Byok | null) {
  try {
    if (value) localStorage.setItem(STORE, JSON.stringify(value));
    else localStorage.removeItem(STORE);
  } catch {
    /* ignore */
  }
}

export function hasByok(): boolean {
  return !!getByok();
}
