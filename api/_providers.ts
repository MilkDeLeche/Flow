export type Provider = 'anthropic' | 'openai' | 'gemini';

// Allowed models per provider (cheapest first). Free tier uses FREE_MODEL.
export const PROVIDER_MODELS: Record<Provider, string[]> = {
  anthropic: ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8'],
  openai: ['gpt-4o-mini', 'gpt-4o'],
  gemini: ['gemini-1.5-flash', 'gemini-1.5-pro'],
};

export const FREE_MODEL = 'claude-haiku-4-5';

export function isProvider(v: unknown): v is Provider {
  return v === 'anthropic' || v === 'openai' || v === 'gemini';
}

export function keyLooksValid(provider: Provider, key: string): boolean {
  const k = key.trim();
  if (provider === 'anthropic') return /^sk-ant-[A-Za-z0-9_-]{10,}$/.test(k);
  if (provider === 'openai') return /^sk-[A-Za-z0-9_-]{20,}$/.test(k);
  return /^AIza[A-Za-z0-9_-]{20,}$/.test(k);
}

/** Falls back to the cheapest allowed model if an unknown one is requested. */
export function resolveModel(provider: Provider, model: string): string {
  const list = PROVIDER_MODELS[provider];
  return list.includes(model) ? model : list[0];
}
