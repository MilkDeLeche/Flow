// Vercel serverless function: /api/key  — manage the signed-in user's stored
// BYOK provider key (encrypted at rest). GET status / POST set / DELETE remove.
// The key is sent here ONCE over HTTPS, encrypted, and never returned to the
// browser again. Same auth + allowlist gate as /api/generate-quiz.
import type { IncomingMessage, ServerResponse } from 'http';
import {
  bearerToken,
  emailAllowed,
  getServerSupabase,
  verifyUser,
} from './_auth';
import { getStoredKeyStatus, setStoredKey, deleteStoredKey } from './_keys';
import { isProvider, keyLooksValid } from './_generateQuiz';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  res.end(JSON.stringify(body));
}

function safeKeyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err || '');
  const lower = message.toLowerCase();
  if (lower.includes('user_api_keys') || lower.includes('schema cache')) {
    return 'Key storage table is missing. Run supabase/migrations/002_user_api_keys.sql in Supabase.';
  }
  if (lower.includes('encryption') || lower.includes('32 bytes')) {
    return 'Key encryption is misconfigured. APP_ENCRYPTION_KEY must be 64 hex chars or valid base64.';
  }
  if (lower.includes('permission') || lower.includes('rls') || lower.includes('policy')) {
    return 'Key storage permission failed. Check SUPABASE_SERVICE_ROLE_KEY in Vercel.';
  }
  return 'Could not update your key. Please try again.';
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const anyReq = req as any;
  if (anyReq.body && typeof anyReq.body === 'object') return anyReq.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse
) {
  const sb = getServerSupabase();
  if (!sb) return send(res, 503, { error: 'Account key storage requires Supabase.' });

  // --- Auth + allowlist (same gate as the quiz endpoint) ---
  const token = bearerToken(req.headers['authorization'] as string | undefined);
  const user = token ? await verifyUser(token, sb) : null;
  if (!user) return send(res, 401, { error: 'Not authorized. Please sign in.' });
  if (!emailAllowed(user.email))
    return send(res, 403, { error: 'This account is not allowed.' });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return send(res, 503, { error: 'Server is not fully configured.' });

  try {
    if (req.method === 'GET') {
      return send(res, 200, await getStoredKeyStatus(user.id, sb));
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const provider = body.provider;
      const key = typeof body.key === 'string' ? body.key.trim() : '';
      const model = typeof body.model === 'string' ? body.model : '';
      if (!isProvider(provider)) return send(res, 400, { error: 'Unknown provider.' });
      if (!keyLooksValid(provider, key))
        return send(res, 400, {
          error: `That doesn’t look like a valid ${provider} API key.`,
        });
      const status = await setStoredKey(user.id, sb, provider, key, model);
      return send(res, 200, status);
    }

    if (req.method === 'DELETE') {
      await deleteStoredKey(user.id, sb);
      return send(res, 200, { configured: false });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    // Never log the key itself — only a generic message.
    console.error('key endpoint failed:', (err as Error).message);
    return send(res, 500, { error: safeKeyError(err) });
  }
}
