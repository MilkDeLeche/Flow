-- Study planner, synced per user so plans follow them across devices.
-- Previously stored only in the browser (localStorage).
--
-- Apply with: supabase db push  (or paste into the Supabase SQL editor).

create table if not exists public.study_plans (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_id          uuid references public.courses (id) on delete cascade,
  course_name        text not null,
  title              text not null,
  test_date          date not null,
  quizzes_per_week   int not null default 3,
  completed_sessions text[] not null default '{}',
  color_index        int,
  created_at         timestamptz not null default now()
);

create index if not exists study_plans_user_idx
  on public.study_plans (user_id, test_date);

alter table public.study_plans enable row level security;

drop policy if exists "owner_all" on public.study_plans;
create policy "owner_all" on public.study_plans
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all on public.study_plans to authenticated;
grant all on public.study_plans to service_role;

notify pgrst, 'reload schema';
