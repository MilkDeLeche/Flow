// Verifies a Supabase access token by calling the Supabase Auth API.
// Used to protect /api/generate-quiz so only logged-in users can spend your
// Anthropic budget.

export interface ServerSupabase {
  url: string;
  anonKey: string;
}

export function getServerSupabase(): ServerSupabase | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export interface AuthedUser {
  id: string;
  email: string | null;
}

/** Returns the authenticated user, or null if the token is invalid. */
export async function verifyUser(
  token: string,
  cfg: ServerSupabase
): Promise<AuthedUser | null> {
  try {
    const res = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: cfg.anonKey,
      },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string; email?: string };
    return user?.id ? { id: user.id, email: user.email ?? null } : null;
  } catch {
    return null;
  }
}

/**
 * Allowlist backstop. Set ALLOWED_EMAILS (comma-separated). Each entry is
 * either a full email (alice@school.edu) or a domain pattern starting with "@"
 * (@school.edu) to allow everyone at that domain — handy for a whole class.
 * If unset, all authenticated users are allowed (you rely on signups being off).
 */
export function emailAllowed(email: string | null): boolean {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw) return true;
  if (!email) return false;
  const e = email.toLowerCase();
  const list = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.some((entry) =>
    entry.startsWith('@') ? e.endsWith(entry) : e === entry
  );
}

export function bearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authHeader);
  return m ? m[1] : null;
}
