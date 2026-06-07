import { supabase } from './supabase';
import { getRequestKey } from './byok';

export interface CourseMeta {
  name: string;
  description: string;
}

/**
 * Ask the server to auto-fill a course name + description from uploaded
 * material. Requires the user's own key (handled server-side in prod, or sent
 * inline in local dev). Throws with a friendly message on failure.
 */
export async function parseCourseFromInput(input: {
  text?: string;
  pdfBase64?: string;
  imageBase64?: string;
  imageMediaType?: string;
}): Promise<CourseMeta> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers['authorization'] = `Bearer ${token}`;
  }

  const byok = getRequestKey(); // inline key only in local dev; null in prod
  const res = await fetch('/api/parse-course', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...input,
      provider: byok?.provider,
      apiKey: byok?.key,
      model: byok?.model,
    }),
  });

  let data: { name?: string; description?: string; error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error('Auto-fill is unavailable right now. You can type the details instead.');
  }
  if (!res.ok || data.name === undefined) {
    throw new Error(data.error || 'Auto-fill failed. You can type the details instead.');
  }
  return { name: data.name, description: data.description ?? '' };
}
