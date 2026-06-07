// Vercel serverless function: POST /api/generate-quiz
// Holds the ANTHROPIC_API_KEY server-side so it never reaches the browser.
import type { IncomingMessage, ServerResponse } from 'http';
import {
  generateQuiz,
  isProvider,
  keyLooksValid,
  resolveModel,
  FREE_MODEL,
  type Provider,
} from './_generateQuiz';
import {
  bearerToken,
  emailAllowed,
  getServerSupabase,
  verifyUser,
} from './_auth';
import { checkAndRecordUsage } from './_usage';

const MAX_MATERIAL_CHARS = 200_000;
const MAX_PDF_BYTES = 4_500_000; // Vercel request-body ceiling

// Free tier: strict + cheapest. BYOK bypasses these (user's own key/cost).
const FREE_HOUR = Number(process.env.FREE_LIMIT_HOUR || 1);
const FREE_DAY = Number(process.env.FREE_LIMIT_DAY || 2);

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  // Vercel usually pre-parses JSON onto req.body; fall back to reading the stream.
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

  const serverKey = process.env.ANTHROPIC_API_KEY;

  // --- Auth (fails CLOSED in production) ---
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
    // No auth configured in production = refuse, rather than expose the key.
    console.error('Refusing to run: Supabase auth is not configured in production');
    return send(res, 503, { error: 'Server is not configured for secure access.' });
  }

  let usedByok = false;
  try {
    const body = await readJsonBody(req);
    const material = String(body.material || '').slice(0, MAX_MATERIAL_CHARS);
    const count = Number(body.count);
    const avoid = Array.isArray(body.avoid) ? body.avoid.map(String) : undefined;
    let pdfBase64 =
      typeof body.pdfBase64 === 'string' ? body.pdfBase64 : undefined;

    // BYOK: user's own provider key (never stored/logged). If present + valid,
    // they run on their own key/budget and skip the free-tier cap.
    const rawKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    const reqProvider: Provider = isProvider(body.provider)
      ? body.provider
      : 'anthropic';
    if (rawKey && !keyLooksValid(reqProvider, rawKey))
      return send(res, 400, {
        error: `That doesn’t look like a valid ${reqProvider} API key.`,
      });
    const byok = rawKey ? { provider: reqProvider, key: rawKey } : null;
    usedByok = !!byok;

    if (!pdfBase64 && material.trim().length < 40)
      return send(res, 400, { error: 'Material is too short to make a quiz from.' });

    if (!Number.isInteger(count) || count < 1 || count > 50)
      return send(res, 400, { error: 'Invalid question count.' });

    // PDF / diagram vision is Anthropic-only and BYOK-only.
    if (pdfBase64) {
      if (!byok)
        return send(res, 403, {
          error: 'PDF & diagram parsing needs your own API key. Free is paste-text only.',
        });
      if (byok.provider !== 'anthropic') pdfBase64 = undefined; // others: text only
    }
    if (pdfBase64) {
      const approxBytes = Math.floor(pdfBase64.length * 0.75);
      if (approxBytes > MAX_PDF_BYTES)
        return send(res, 400, { error: 'PDF is too large.' });
      const head = Buffer.from(pdfBase64.slice(0, 16), 'base64').toString('latin1');
      if (!head.startsWith('%PDF'))
        return send(res, 400, { error: 'That file is not a valid PDF.' });
    }

    // Resolve provider / key / model.
    let provider: Provider;
    let apiKey: string;
    let model: string;

    if (byok) {
      provider = byok.provider;
      apiKey = byok.key;
      model = resolveModel(provider, typeof body.model === 'string' ? body.model : '');
    } else {
      // Free tier: cheapest model on the shared key, strictly rate-limited.
      if (!serverKey) {
        console.error('No server ANTHROPIC_API_KEY and no BYOK.');
        return send(res, 500, { error: 'Server is not configured.' });
      }
      provider = 'anthropic';
      apiKey = serverKey;
      model = FREE_MODEL;

      if (sb && userId) {
        const rate = await checkAndRecordUsage(userId, sb, 'text', {
          hour: FREE_HOUR,
          day: FREE_DAY,
        });
        if (!rate.ok) {
          if (rate.retryAfter) res.setHeader('retry-after', String(rate.retryAfter));
          return send(res, rate.status ?? 429, {
            error:
              (rate.message ?? 'Limit reached.') +
              ' Add your own free key (Anthropic, OpenAI, or Gemini) for unlimited use.',
          });
        }
      }
    }

    const questions = await generateQuiz({
      material,
      count,
      avoid,
      pdfBase64,
      provider,
      apiKey,
      model,
    });

    return send(res, 200, { questions });
  } catch (err) {
    // Surface a clear message when the user's OWN key is rejected.
    const status = (err as { status?: number })?.status;
    if (usedByok && (status === 401 || status === 403))
      return send(res, 400, {
        error: 'Your API key was rejected. Check the key and try again.',
      });
    // Otherwise log server-side and return a generic message.
    console.error('generate-quiz failed:', err);
    return send(res, 500, { error: 'Could not generate the quiz. Please try again.' });
  }
}

// Allow larger payloads (base64 PDFs for diagram-based material).
export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };
