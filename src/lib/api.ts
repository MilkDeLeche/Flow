import type { QuizQuestion } from './types';
import { supabase } from './supabase';
import { getRequestKey } from './byok';

/**
 * Calls the server (Vercel function in prod, Vite middleware in dev) to
 * generate a quiz. The Anthropic API key lives only on the server, and the
 * endpoint requires a valid Supabase session when auth is configured.
 */
export async function generateQuiz(
  material: string,
  count: number,
  avoid?: string[],
  pdfBase64?: string
): Promise<QuizQuestion[]> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  // Attach the logged-in user's token so the protected endpoint accepts us.
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers['authorization'] = `Bearer ${token}`;
  }

  // In production the server uses your stored key — nothing is sent here.
  // In local dev, getRequestKey() returns the localStorage key to send inline.
  const byok = getRequestKey();

  const res = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      material,
      count,
      avoid,
      pdfBase64,
      provider: byok?.provider,
      apiKey: byok?.key,
      model: byok?.model,
    }),
  });

  let data: { questions?: QuizQuestion[]; error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error('The server returned an unexpected response.');
  }

  if (!res.ok || !data.questions) {
    throw new Error(data.error || 'Failed to generate the quiz.');
  }
  return data.questions;
}
