-- Encrypted per-user BYOK key storage.
-- Additive and idempotent: safe to run more than once.
-- Paste this file into Supabase -> SQL Editor -> Run.

create extension if not exists pgcrypto;

create table if not exists public.user_api_keys (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  provider   text not null,
  model      text not null default '',
  hint       text not null default '',
  enc        text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_api_keys
  add column if not exists provider text,
  add column if not exists model text not null default '',
  add column if not exists hint text not null default '',
  add column if not exists enc text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.user_api_keys enable row level security;

-- Users should not read ciphertext directly. The Vercel API uses service_role.
revoke all on public.user_api_keys from anon, authenticated;
grant all on public.user_api_keys to service_role;

-- Force Supabase/PostgREST to refresh table and column metadata now.
notify pgrst, 'reload schema';
