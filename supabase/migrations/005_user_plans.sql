-- Subscription tier for paid features (BYOK, Flow Studio reader/tutor).
-- Stripe webhooks (future) set plan_tier via service role. Until then, set manually in Dashboard.

create table if not exists public.user_plans (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  plan_tier   text not null default 'free' check (plan_tier in ('free', 'student', 'studio')),
  stripe_customer_id text,
  stripe_subscription_id text,
  studio_minutes_used int not null default 0,
  studio_minutes_cap int not null default 120,
  updated_at  timestamptz not null default now()
);

alter table public.user_plans enable row level security;

drop policy if exists "read_own_plan" on public.user_plans;
create policy "read_own_plan" on public.user_plans
  for select to authenticated
  using (auth.uid() = user_id);

grant select on public.user_plans to authenticated;
grant all on public.user_plans to service_role;

notify pgrst, 'reload schema';
