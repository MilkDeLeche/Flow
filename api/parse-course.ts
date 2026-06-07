// Vercel serverless function: POST /api/parse-course
// AI auto-fill for a new course (name + description). Requires the user's OWN
// key (paid feature) — the shared free-tier key is never used here.
import type { IncomingMessage, ServerResponse } from 'http';
import { bearerToken, emailAllowed, getServerSupabase, verifyUser } from './_auth';
import { getStoredKey } from './_keys';
import { parseCourse } from './_parseCourse';
import { isProvider, keyLooksValid, resolveModel, type Provider } from './_generateQuiz';

const MAX_TEXT = 60_000;
const MAX_B64 = 4_500_000;

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  res.end(JSON.stringify(body));
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
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const sb = getServerSupabase();
  const isProd = !!process.env.VERCEL;

  let userId: string | null = null;
  if (sb) {
    const token = bearerToken(req.headers['authorization'] as string | undefined);
    const user = token ? await verifyUser(token, sb) : null;
    if (!user) return send(res, 401, { error: 'Not authorized. Please sign in.' });
    if (!emailAllowed(user.email))
      return send(res, 403, { error: 'This account is not allowed.' });
    userId = user.id;
  } else if (isProd) {
    return send(res, 503, { error: 'Server is not configured for secure access.' });
  }

  let usedByok = false;
  try {
    const body = await readJsonBody(req);
    const text = typeof body.text === 'string' ? body.text.slice(0, MAX_TEXT) : '';
    const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64 : undefined;
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : undefined;
    const imageMediaType =
      typeof body.imageMediaType === 'string' ? body.imageMediaType : undefined;

    // Resolve the user's own key: inline (dev) or stored (prod). Required.
    const rawKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    const reqProvider: Provider = isProvider(body.provider) ? body.provider : 'anthropic';
    if (rawKey && !keyLooksValid(reqProvider, rawKey))
      return send(res, 400, { error: `That doesn’t look like a valid ${reqProvider} key.` });

    let byok: { provider: Provider; key: string; model?: string } | null = rawKey
      ? { provider: reqProvider, key: rawKey }
      : null;
    if (!byok && sb && userId) {
      const stored = await getStoredKey(userId, sb);
      if (stored) byok = stored;
    }
    if (!byok)
      return send(res, 403, {
        error: 'AI auto-fill needs your own API key. Add one, or type the details manually.',
      });
    usedByok = true;

    if (!text.trim() && !pdfBase64 && !imageBase64)
      return send(res, 400, { error: 'Upload a file or paste some text first.' });
    if ((pdfBase64 && pdfBase64.length > MAX_B64) || (imageBase64 && imageBase64.length > MAX_B64))
      return send(res, 400, { error: 'That file is too large.' });

    // Vision (PDF/image) is Anthropic-only; other providers use text.
    const provider = byok.provider;
    const usePdf = provider === 'anthropic' ? pdfBase64 : undefined;
    const useImg = provider === 'anthropic' ? imageBase64 : undefined;
    if (!text.trim() && !usePdf && !useImg)
      return send(res, 400, {
        error: 'For OpenAI/Gemini, file reading needs text — paste it, or use an Anthropic key.',
      });

    const meta = await parseCourse({
      provider,
      apiKey: byok.key,
      model: resolveModel(provider, byok.model || ''),
      text,
      pdfBase64: usePdf,
      imageBase64: useImg,
      imageMediaType,
    });

    return send(res, 200, meta);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (usedByok && (status === 401 || status === 403))
      return send(res, 400, { error: 'Your API key was rejected. Update it and try again.' });
    console.error('parse-course failed:', err);
    return send(res, 500, { error: 'Could not read the course details. Try again or type them.' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };
