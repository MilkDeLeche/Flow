-- Track separate Stripe subscriptions (all plans billed monthly).

alter table public.user_plans
  add column if not exists stripe_student_subscription_id text,
  add column if not exists stripe_focus_subscription_id text;

create or replace function public.apply_plan_from_stripe(
  p_user uuid,
  p_tier text,
  p_lifetime_student boolean default null,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null,
  p_subscription_product text default null
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
      when p_subscription_product = 'studio' and p_stripe_subscription_id is not null
        then p_stripe_subscription_id
      else stripe_subscription_id
    end,
    stripe_student_subscription_id = case
      when p_subscription_product = 'student' and p_stripe_subscription_id is not null
        then p_stripe_subscription_id
      else stripe_student_subscription_id
    end,
    stripe_focus_subscription_id = case
      when p_subscription_product = 'focus_pack' and p_stripe_subscription_id is not null
        then p_stripe_subscription_id
      else stripe_focus_subscription_id
    end,
    updated_at = now()
  where user_id = p_user;
end;
$$;

create or replace function public.clear_plan_subscription(p_user uuid, p_product text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.user_plans;
  next_tier text;
begin
  select * into row from public.user_plans where user_id = p_user;
  if not found then
    return;
  end if;

  if p_product = 'studio' then
    update public.user_plans
    set stripe_subscription_id = null, updated_at = now()
    where user_id = p_user;
  elsif p_product = 'student' then
    update public.user_plans
    set stripe_student_subscription_id = null, updated_at = now()
    where user_id = p_user;
  elsif p_product = 'focus_pack' then
    update public.user_plans
    set stripe_focus_subscription_id = null, updated_at = now()
    where user_id = p_user;
    return;
  else
    return;
  end if;

  select * into row from public.user_plans where user_id = p_user;

  if row.stripe_subscription_id is not null then
    next_tier := 'studio';
  elsif row.stripe_student_subscription_id is not null or row.lifetime_student then
    next_tier := 'student';
  else
    next_tier := 'free';
  end if;

  update public.user_plans
  set plan_tier = next_tier, updated_at = now()
  where user_id = p_user;
end;
$$;

revoke all on function public.clear_plan_subscription(uuid, text) from public;
grant execute on function public.clear_plan_subscription(uuid, text) to service_role;

notify pgrst, 'reload schema';
