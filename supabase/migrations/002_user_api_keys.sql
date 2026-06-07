-- Flow·quiz — per-user encrypted BYOK key storage.
-- ONE-TIME, ADDITIVE, IDEMPOTENT: safe to run again, never wipes data.
-- Paste into Supabase -> SQL Editor -> Run. (Does NOT touch your other tables.)
--
-- Stores each user's own provider API key, encrypted at rest by the server
-- (AES-256-GCM). RLS is ON with NO user policies, so only the service role can
-- read/write it — users can't see anyone's key, not even their own ciphertext.

create table if not exists public.user_api_keys (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  provider   text not null,
  model      text not null default '',
  hint       text not null default '',   -- masked preview only (safe to show)
  enc        text not null,              -- AES-256-GCM ciphertext (server-only)
  updated_at timestamptz not null default now()
);

alter table public.user_api_keys enable row level security;

-- Belt-and-suspenders: with RLS on and no policies, anon/authenticated already
-- have zero access. Revoke direct grants too.
revoke all on public.user_api_keys from anon, authenticated;

-- Verify:
--   select table_name from information_schema.tables
--   where table_schema = 'public' and table_name = 'user_api_keys';
