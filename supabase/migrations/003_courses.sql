-- Flow — courses (classes). ONE-TIME, ADDITIVE, IDEMPOTENT: safe to re-run,
-- never wipes data. Paste into Supabase -> SQL Editor -> Run.
--
-- A course groups chapters/materials, and its quizzes & tests, under one class.

create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  name        text not null,
  description text not null default '',
  theme       text not null default 'sage'
);

alter table public.courses enable row level security;

drop policy if exists "owner_all" on public.courses;
create policy "owner_all" on public.courses
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Link materials (chapters) to a course; keep materials if a course is removed.
alter table public.materials
  add column if not exists course_id uuid references public.courses (id) on delete set null;
create index if not exists materials_course_idx
  on public.materials (user_id, course_id, created_at);

-- Distinguish quizzes (practice) from tests (exam) in a course's history.
alter table public.attempts
  add column if not exists mode text not null default 'practice';

-- Verify:
--   select table_name from information_schema.tables
--   where table_schema = 'public' and table_name = 'courses';
