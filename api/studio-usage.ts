import type { IncomingMessage, ServerResponse } from 'http';
import { bearerToken, getServerSupabase, verifyUser } from './_auth.js';
import { fetchStudioUsage } from './_studioCredits.js';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse
) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const sb = getServerSupabase();
  if (!sb) return send(res, 503, { error: 'Server is not configured.' });

  const token = bearerToken(req.headers['authorization'] as string | undefined);
  const user = token ? await verifyUser(token, sb) : null;
  if (!user) return send(res, 401, { error: 'Not authorized.' });

  const usage = await fetchStudioUsage(user.id, sb);
  if (!usage) return send(res, 503, { error: 'Usage tracking unavailable.' });

  return send(res, 200, { usage });
}
