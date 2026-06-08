// Per-user BYOK storage, encrypted at rest. The plaintext key NEVER leaves the
// server: it is encrypted on save and only decrypted server-side at request
// time to call the provider. The browser only ever sees provider/model/hint.
//
// The user_api_keys table has RLS enabled with NO user policies, so normal
// users (anon/authenticated) cannot touch it — only the service role (this
// module) can, mirroring the rate-limit table.
import { createClient } from '@supabase/supabase-js';
import type { ServerSupabase } from './_auth.js';
import { encryptSecret, decryptSecret, maskKey } from './_crypto.js';
import { isProvider, keyLooksValid, resolveModel, type Provider } from './_providers.js';

const TABLE = 'user_api_keys';

function admin(cfg: ServerSupabase) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient(cfg.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface StoredKeyStatus {
  configured: boolean;
  provider?: Provider;
  model?: string;
  hint?: string;
}

/** Non-secret status for the UI. Never returns the key. */
export async function getStoredKeyStatus(
  userId: string,
  cfg: ServerSupabase
): Promise<StoredKeyStatus> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { configured: false };
  try {
    const { data, error } = await admin(cfg)
      .from(TABLE)
      .select('provider,model,hint')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return { configured: false };
    return {
      configured: true,
      provider: data.provider as Provider,
      model: data.model as string,
      hint: data.hint as string,
    };
  } catch {
    return { configured: false };
  }
}

/**
 * Decrypts and returns the user's key for server-side use only.
 * Returns null (fail-safe) if storage/encryption isn't configured or the row is
 * missing/corrupt — callers then fall back to the strict free tier.
 */
export async function getStoredKey(
  userId: string,
  cfg: ServerSupabase
): Promise<{ provider: Provider; key: string; model: string } | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const { data, error } = await admin(cfg)
      .from(TABLE)
      .select('provider,model,enc')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    const key = decryptSecret(data.enc as string);
    if (!isProvider(data.provider) || !keyLooksValid(data.provider, key)) return null;
    return {
      provider: data.provider,
      key,
      model: resolveModel(data.provider, (data.model as string) || ''),
    };
  } catch {
    return null;
  }
}

export async function setStoredKey(
  userId: string,
  cfg: ServerSupabase,
  provider: Provider,
  key: string,
  model: string
): Promise<StoredKeyStatus> {
  const trimmed = key.trim();
  const resolvedModel = resolveModel(provider, model);
  const row = {
    user_id: userId,
    provider,
    model: resolvedModel,
    hint: maskKey(trimmed),
    enc: encryptSecret(trimmed),
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin(cfg).from(TABLE).upsert(row, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
  return { configured: true, provider, model: resolvedModel, hint: row.hint };
}

export async function deleteStoredKey(
  userId: string,
  cfg: ServerSupabase
): Promise<void> {
  await admin(cfg).from(TABLE).delete().eq('user_id', userId);
}
