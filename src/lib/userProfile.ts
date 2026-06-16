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

function normalizeAvatarUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return '';
  if (url.startsWith('//')) url = `https:${url}`;
  if (url.includes('googleusercontent.com')) {
    if (/=s\d+-c/.test(url)) return url.replace(/=s\d+-c/, '=s128-c');
    if (!/=s\d+/.test(url)) return `${url}=s128-c`;
  }
  return url;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return normalizeAvatarUrl(value);
    }
  }
  return null;
}

function avatarFromUser(user: User): string | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const fromMeta = firstString(
    meta.avatar_url,
    meta.picture,
    meta.photo_url,
    meta.profile_picture
  );
  if (fromMeta) return fromMeta;

  for (const identity of user.identities ?? []) {
    const data = (identity.identity_data ?? {}) as Record<string, unknown>;
    const fromIdentity = firstString(
      data.avatar_url,
      data.picture,
      data.photo_url,
      data.profile_picture
    );
    if (fromIdentity) return fromIdentity;
  }

  return null;
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

  return {
    displayName: fromMeta || (email ? nameFromEmail(email) : 'Student'),
    email,
    avatarUrl: avatarFromUser(user),
  };
}

export function profileFromSession(session: Session | null): UserProfile {
  return getUserProfile(session?.user);
}
