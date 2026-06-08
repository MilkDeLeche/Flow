-- Optional course term/status fields.
-- Additive and idempotent: safe to run more than once.

alter table public.courses
  add column if not exists semester text not null default '',
  add column if not exists year text not null default '',
  add column if not exists finished_at timestamptz;

create index if not exists courses_finished_idx
  on public.courses (user_id, finished_at, created_at);

notify pgrst, 'reload schema';
