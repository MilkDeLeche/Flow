-- Stripe plan sync: lifetime Student unlock + webhook helpers.

alter table public.user_plans
  add column if not exists lifetime_student boolean not null default false;

create or replace function public.apply_plan_from_stripe(
  p_user uuid,
  p_tier text,
  p_lifetime_student boolean default null,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tier not in ('free', 'student', 'studio') then
    raise exception 'invalid plan tier';
  end if;

  perform public.ensure_user_plan(p_user);

  update public.user_plans
  set
    plan_tier = p_tier,
    lifetime_student = coalesce(p_lifetime_student, lifetime_student),
    stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = case
      when p_stripe_subscription_id is not null then p_stripe_subscription_id
      else stripe_subscription_id
    end,
    updated_at = now()
  where user_id = p_user;
end;
$$;

create or replace function public.clear_studio_subscription(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.user_plans;
begin
  select * into row from public.user_plans where user_id = p_user;
  if not found then
    return;
  end if;

  update public.user_plans
  set
    plan_tier = case when row.lifetime_student then 'student' else 'free' end,
    stripe_subscription_id = null,
    updated_at = now()
  where user_id = p_user;
end;
$$;

revoke all on function public.apply_plan_from_stripe(uuid, text, boolean, text, text) from public;
revoke all on function public.clear_studio_subscription(uuid) from public;

grant execute on function public.apply_plan_from_stripe(uuid, text, boolean, text, text) to service_role;
grant execute on function public.clear_studio_subscription(uuid) to service_role;

notify pgrst, 'reload schema';
