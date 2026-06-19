-- Spaced repetition for the review pile.
-- Adds a per-question schedule so missed questions resurface over time instead
-- of leaving the pile after a single correct answer.
--
-- Apply with: supabase db push  (or paste into the Supabase SQL editor).
-- Idempotent — safe to run more than once.

alter table if exists public.missed_questions
  add column if not exists due_at timestamptz,
  add column if not exists interval_days integer not null default 0,
  add column if not exists streak integer not null default 0;

-- Existing rows become due immediately so nothing is lost on rollout.
update public.missed_questions
  set due_at = coalesce(due_at, updated_at, now())
  where due_at is null;

-- Fast "what's due for this user" lookups.
create index if not exists missed_questions_due_idx
  on public.missed_questions (user_name, due_at);
