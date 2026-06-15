import type { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim();
  if (!local) return 'Student';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getUserProfile(user: User | null | undefined): UserProfile {
  if (!user) {
    return { displayName: 'Student', email: '', avatarUrl: null };
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? '';
  const fromMeta =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    '';

  const avatarUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    null;

  return {
    displayName: fromMeta || (email ? nameFromEmail(email) : 'Student'),
    email,
    avatarUrl,
  };
}

export function profileFromSession(session: Session | null): UserProfile {
  return getUserProfile(session?.user);
}
