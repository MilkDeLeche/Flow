-- Flow·quiz — database setup (wipes existing tables, then rebuilds correctly).
-- Paste the whole thing into Supabase -> SQL Editor -> Run.
-- Safe to run anytime, but note: re-running ERASES all data (fine while testing).

-- ============================ 1. Drop old ============================
drop function if exists public.check_rate_limit(uuid, text, int, int, int);
drop table if exists public.usage_events     cascade;
drop table if exists public.quiz_bank        cascade;
drop table if exists public.missed_questions cascade;
drop table if exists public.attempts         cascade;
drop table if exists public.materials        cascade;

-- ============================ 2. Tables ==============================
create table public.materials (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  title       text not null,
  content     text not null,
  source_type text not null default 'paste',
  char_count  integer not null default 0
);

create table public.attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  material_id    uuid references public.materials (id) on delete set null,
  material_title text not null,
  round_size     integer not null,
  score          integer not null,
  total          integer not null,
  user_name      text not null default 'Student'
);

create table public.missed_questions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  material_id    uuid references public.materials (id) on delete cascade,
  material_title text not null,
  user_name      text not null default 'Student',
  question_text  text not null,
  question       jsonb not null,
  times_wrong    integer not null default 1,
  times_seen     integer not null default 1
);

create table public.quiz_bank (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  material_id    uuid not null references public.materials (id) on delete cascade,
  material_title text not null,
  question_text  text not null,
  question       jsonb not null
);

create table public.usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  kind       text not null default 'text'
);

-- ============================ 3. Indexes =============================
create index attempts_user_created_idx on public.attempts (user_id, created_at desc);
create index missed_lookup_idx on public.missed_questions (user_id, material_id, question_text);
create index missed_rank_idx on public.missed_questions (user_id, times_wrong desc);
create index bank_material_idx on public.quiz_bank (user_id, material_id, created_at);
create index usage_user_time_idx on public.usage_events (user_id, created_at desc);

-- ======================= 4. Row Level Security =======================
alter table public.materials        enable row level security;
alter table public.attempts         enable row level security;
alter table public.missed_questions enable row level security;
alter table public.quiz_bank        enable row level security;
alter table public.usage_events     enable row level security;

-- Owner-only access on the user-data tables.
do $$
declare t text;
begin
  foreach t in array array['materials','attempts','missed_questions','quiz_bank']
  loop
    execute format(
      'create policy "owner_all" on public.%I
         for all to authenticated
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- usage_events: RLS on, NO user policies -> only the service role (via the
-- function below) can touch it, so nobody can reset their own rate limit.

-- ===================== 5. Atomic rate-limit function =================
create or replace function public.check_rate_limit(
  p_user uuid,
  p_kind text,
  p_hour_limit int,
  p_day_limit int,
  p_global_day_limit int
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  hour_count   int;
  day_count    int;
  global_count int;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  select count(*) into hour_count from usage_events
    where user_id = p_user and created_at > now() - interval '1 hour';
  if hour_count >= p_hour_limit then
    return jsonb_build_object('ok', false, 'reason', 'hour', 'retry_after', 3600);
  end if;

  select count(*) into day_count from usage_events
    where user_id = p_user and created_at > now() - interval '1 day';
  if day_count >= p_day_limit then
    return jsonb_build_object('ok', false, 'reason', 'day', 'retry_after', 86400);
  end if;

  if p_global_day_limit > 0 then
    select count(*) into global_count from usage_events
      where created_at > now() - interval '1 day';
    if global_count >= p_global_day_limit then
      return jsonb_build_object('ok', false, 'reason', 'global', 'retry_after', 3600);
    end if;
  end if;

  insert into usage_events (user_id, kind) values (p_user, p_kind);
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.check_rate_limit(uuid, text, int, int, int)
  from public, anon, authenticated;
grant execute on function public.check_rate_limit(uuid, text, int, int, int)
  to service_role;

-- Done. Verify with:
--   select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
-- You should see exactly: attempts, materials, missed_questions, quiz_bank, usage_events
