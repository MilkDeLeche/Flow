-- Support email reminders for due spaced-repetition reviews.
-- missed_questions is keyed by display name, so we add a user_id (filled by
-- default on new rows) to map reliably to an email, plus a service-role-only
-- aggregate the reminder cron reads.
--
-- Apply with: supabase db push  (or paste into the Supabase SQL editor).

alter table if exists public.missed_questions
  add column if not exists user_id uuid default auth.uid();

create index if not exists missed_questions_user_id_due_idx
  on public.missed_questions (user_id, due_at);

-- Users with at least one review due right now, with their email + count.
create or replace function public.due_reviews_by_user()
returns table (user_id uuid, email text, due_count bigint)
language sql
security definer
set search_path = public
as $$
  select m.user_id, u.email, count(*) as due_count
  from public.missed_questions m
  join auth.users u on u.id = m.user_id
  where m.user_id is not null
    and m.due_at is not null
    and m.due_at <= now()
  group by m.user_id, u.email
  having count(*) > 0;
$$;

-- Only the server (service role) may read this; never the client.
revoke all on function public.due_reviews_by_user() from anon, authenticated;
grant execute on function public.due_reviews_by_user() to service_role;

notify pgrst, 'reload schema';
