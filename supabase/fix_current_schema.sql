-- Flow current schema repair.
-- Additive and idempotent: safe to run without deleting existing data.
-- Paste the whole file into Supabase -> SQL Editor -> Run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Courses and course images
-- ---------------------------------------------------------------------
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  name        text not null,
  description text not null default '',
  theme       text not null default 'sage',
  image_url   text
);

alter table public.courses
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists name text,
  add column if not exists description text not null default '',
  add column if not exists theme text not null default 'sage',
  add column if not exists image_url text,
  add column if not exists semester text not null default '',
  add column if not exists year text not null default '',
  add column if not exists finished_at timestamptz;

update public.courses
set name = coalesce(nullif(name, ''), 'Untitled course')
where name is null or name = '';

alter table public.courses
  alter column name set not null;

alter table public.courses enable row level security;

drop policy if exists "owner_all" on public.courses;
create policy "owner_all" on public.courses
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;

-- Link materials and attempts to courses/history modes.
alter table public.materials
  add column if not exists course_id uuid references public.courses (id) on delete set null;

create index if not exists materials_course_idx
  on public.materials (user_id, course_id, created_at);

create index if not exists courses_finished_idx
  on public.courses (user_id, finished_at, created_at);

alter table public.attempts
  add column if not exists mode text not null default 'practice';

-- ---------------------------------------------------------------------
-- Per-student chapter reader highlights and notes
-- ---------------------------------------------------------------------
create table if not exists public.reader_marks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  section_id  text not null,
  highlighted boolean not null default false,
  note        text not null default '',
  updated_at  timestamptz not null default now(),
  unique (material_id, section_id)
);

alter table public.reader_marks
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  add column if not exists material_id uuid references public.materials (id) on delete cascade,
  add column if not exists section_id text,
  add column if not exists highlighted boolean not null default false,
  add column if not exists note text not null default '',
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists reader_marks_material_section_key
  on public.reader_marks (material_id, section_id);

create index if not exists reader_marks_user_material_idx
  on public.reader_marks (user_id, material_id, updated_at);

alter table public.reader_marks enable row level security;

drop policy if exists "owner_all" on public.reader_marks;
create policy "owner_all" on public.reader_marks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.reader_marks to authenticated;
grant all on public.reader_marks to service_role;

-- ---------------------------------------------------------------------
-- Per-user encrypted BYOK key storage
-- ---------------------------------------------------------------------
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

-- Quick verification query:
-- select table_name, column_name
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('courses', 'reader_marks', 'user_api_keys')
-- order by table_name, ordinal_position;
