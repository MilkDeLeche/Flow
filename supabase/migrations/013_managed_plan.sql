-- Allow the 'managed' (Flow Plus) tier on user_plans.plan_tier.
-- Flow Plus = paid plan that uses the shared AI key (no BYOK), with generous caps.
--
-- Apply with: supabase db push  (or paste into the Supabase SQL editor).
--
-- NOTE: if your apply_plan_from_stripe() function validates the tier value
-- internally, add 'managed' to that check too.

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.user_plans'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%plan_tier%'
  loop
    execute format('alter table public.user_plans drop constraint %I', c);
  end loop;
end $$;

alter table public.user_plans
  add constraint user_plans_plan_tier_check
  check (plan_tier in ('free', 'student', 'studio', 'managed'));

notify pgrst, 'reload schema';
