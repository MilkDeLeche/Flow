import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Dev-only middleware so `npm run dev` serves POST /api/generate-quiz locally
// (mirrors the Vercel serverless function). Reads ANTHROPIC_API_KEY from .env.
function devApiPlugin(apiKey: string): Plugin {
  return {
    name: 'dev-generate-quiz-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/generate-quiz', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        try {
          // Match production: when Supabase is configured, require a valid user.
          const { getServerSupabase, verifyUser, bearerToken } = await import(
            './api/_auth'
          );
          const sb = getServerSupabase();
          if (sb) {
            const token = bearerToken(
              req.headers['authorization'] as string | undefined
            );
            const userId = token ? await verifyUser(token, sb) : null;
            if (!userId) {
              res.statusCode = 401;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ error: 'Not authorized. Please sign in.' }));
              return;
            }
          }

          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');

          // Imported lazily so the SDKs only load when the route is hit.
          const { generateQuiz, isProvider, keyLooksValid, resolveModel, FREE_MODEL } =
            await import('./api/_generateQuiz');
          const material = String(body.material || '').slice(0, 200_000);
          const count = Number(body.count);
          const avoid = Array.isArray(body.avoid)
            ? body.avoid.map(String)
            : undefined;
          let pdfBase64 =
            typeof body.pdfBase64 === 'string' ? body.pdfBase64 : undefined;
          let imageBase64 =
            typeof body.imageBase64 === 'string' ? body.imageBase64 : undefined;
          const imageMediaType =
            typeof body.imageMediaType === 'string' ? body.imageMediaType : 'image/png';

          const rawKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
          const reqProvider = isProvider(body.provider) ? body.provider : 'anthropic';
          if (rawKey && !keyLooksValid(reqProvider, rawKey)) {
            res.statusCode = 400;
            res.setHeader('content-type', 'application/json');
            res.end(
              JSON.stringify({ error: `That doesn’t look like a valid ${reqProvider} API key.` })
            );
            return;
          }
          const byok = rawKey ? { provider: reqProvider, key: rawKey } : null;

          if (pdfBase64 && (!byok || byok.provider !== 'anthropic')) pdfBase64 = undefined;
          if (imageBase64 && (!byok || byok.provider !== 'anthropic')) imageBase64 = undefined;

          let provider: 'anthropic' | 'openai' | 'gemini';
          let effectiveKey: string;
          let model: string;
          if (byok) {
            provider = byok.provider;
            effectiveKey = byok.key;
            model = resolveModel(provider, typeof body.model === 'string' ? body.model : '');
          } else {
            provider = 'anthropic';
            effectiveKey = apiKey;
            model = FREE_MODEL;
          }

          if (!effectiveKey) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.end(
              JSON.stringify({
                error: 'Missing ANTHROPIC_API_KEY in .env (or provide your own key).',
              })
            );
            return;
          }
          if (!pdfBase64 && !imageBase64 && material.trim().length < 40) {
            res.statusCode = 400;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: 'Material is too short.' }));
            return;
          }

          const questions = await generateQuiz({
            material,
            count,
            avoid,
            pdfBase64,
            imageBase64,
            imageMediaType,
            provider,
            apiKey: effectiveKey,
            model,
          });
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ questions }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

// Dev-only middleware for POST /api/parse-course (AI course auto-fill). Mirrors
// the Vercel function; uses the inline BYOK key sent from the browser in dev.
function devParseCoursePlugin(): Plugin {
  return {
    name: 'dev-parse-course-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/parse-course', async (req, res) => {
        const json = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
        try {
          const { getServerSupabase, verifyUser, bearerToken } = await import('./api/_auth');
          const sb = getServerSupabase();
          if (sb) {
            const token = bearerToken(req.headers['authorization'] as string | undefined);
            const user = token ? await verifyUser(token, sb) : null;
            if (!user) return json(401, { error: 'Not authorized. Please sign in.' });
          }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');

          const { isProvider, keyLooksValid, resolveModel } = await import('./api/_generateQuiz');
          const rawKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
          const provider = isProvider(body.provider) ? body.provider : 'anthropic';
          if (!rawKey || !keyLooksValid(provider, rawKey))
            return json(403, {
              error: 'AI auto-fill needs your own API key. Add one, or type the details manually.',
            });

          const { parseCourse } = await import('./api/_parseCourse');
          const meta = await parseCourse({
            provider,
            apiKey: rawKey,
            model: resolveModel(provider, typeof body.model === 'string' ? body.model : ''),
            text: typeof body.text === 'string' ? body.text : undefined,
            pdfBase64: provider === 'anthropic' ? body.pdfBase64 : undefined,
            imageBase64: provider === 'anthropic' ? body.imageBase64 : undefined,
            imageMediaType: body.imageMediaType,
          });
          return json(200, meta);
        } catch (err) {
          json(500, { error: err instanceof Error ? err.message : 'Auto-fill failed.' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv with '' prefix loads ALL vars (incl. non-VITE) from .env files.
  const env = loadEnv(mode, process.cwd(), '');
  // Expose server-side vars to process.env so the dev API + auth check can read
  // them (Node does not auto-load .env).
  process.env.SUPABASE_URL ||= env.SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  process.env.SUPABASE_ANON_KEY ||=
    env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';
  process.env.ANTHROPIC_MODEL ||= env.ANTHROPIC_MODEL || '';
  return {
    plugins: [react(), devApiPlugin(env.ANTHROPIC_API_KEY || ''), devParseCoursePlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
