-- Flow Studio usage credits (voice read-aloud + tutor chat).
-- Server writes via service role; users read their own row.

alter table public.user_plans
  add column if not exists billing_period_start date not null default current_date,
  add column if not exists voice_minutes_used numeric not null default 0,
  add column if not exists voice_minutes_included int not null default 20,
  add column if not exists voice_minutes_bonus int not null default 0,
  add column if not exists tutor_messages_used int not null default 0,
  add column if not exists tutor_messages_included int not null default 30,
  add column if not exists tutor_messages_bonus int not null default 0,
  add column if not exists focus_packs_purchased int not null default 0;

-- Drop legacy columns if present from 005 draft
alter table public.user_plans
  drop column if exists studio_minutes_used,
  drop column if exists studio_minutes_cap;

create or replace function public.ensure_user_plan(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_plans (user_id)
  values (p_user)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.maybe_reset_studio_period(p_user uuid)
returns public.user_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.user_plans;
begin
  perform public.ensure_user_plan(p_user);
  select * into row from public.user_plans where user_id = p_user for update;

  if row.billing_period_start <= (current_date - interval '1 month')::date then
    update public.user_plans
    set
      billing_period_start = current_date,
      voice_minutes_used = 0,
      tutor_messages_used = 0,
      voice_minutes_bonus = 0,
      tutor_messages_bonus = 0,
      updated_at = now()
    where user_id = p_user
    returning * into row;
  end if;

  return row;
end;
$$;

create or replace function public.get_studio_usage(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.user_plans;
begin
  row := public.maybe_reset_studio_period(p_user);
  return jsonb_build_object(
    'plan_tier', row.plan_tier,
    'billing_period_start', row.billing_period_start,
    'voice_minutes_used', row.voice_minutes_used,
    'voice_minutes_included', row.voice_minutes_included,
    'voice_minutes_bonus', row.voice_minutes_bonus,
    'tutor_messages_used', row.tutor_messages_used,
    'tutor_messages_included', row.tutor_messages_included,
    'tutor_messages_bonus', row.tutor_messages_bonus,
    'focus_packs_purchased', row.focus_packs_purchased
  );
end;
$$;

create or replace function public.consume_studio_credit(
  p_user uuid,
  p_kind text,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.user_plans;
  cap numeric;
  used numeric;
  bonus int;
  included int;
  hard_cap numeric;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  end if;

  row := public.maybe_reset_studio_period(p_user);

  if row.plan_tier <> 'studio' then
    return jsonb_build_object('ok', false, 'reason', 'not_studio');
  end if;

  if p_kind = 'voice' then
    included := row.voice_minutes_included;
    bonus := row.voice_minutes_bonus;
    used := row.voice_minutes_used;
    hard_cap := 120;
    cap := least(included + bonus, hard_cap);
    if used + p_amount > cap then
      return jsonb_build_object(
        'ok', false,
        'reason', 'voice_limit',
        'remaining', greatest(0, cap - used)
      );
    end if;
    update public.user_plans
    set voice_minutes_used = used + p_amount, updated_at = now()
    where user_id = p_user;
  elsif p_kind = 'tutor' then
    included := row.tutor_messages_included;
    bonus := row.tutor_messages_bonus;
    used := row.tutor_messages_used;
    hard_cap := 150;
    cap := least(included + bonus, hard_cap);
    if used + p_amount > cap then
      return jsonb_build_object(
        'ok', false,
        'reason', 'tutor_limit',
        'remaining', greatest(0, cap - used)
      );
    end if;
    update public.user_plans
    set tutor_messages_used = used + p_amount, updated_at = now()
    where user_id = p_user;
  else
    return jsonb_build_object('ok', false, 'reason', 'unknown_kind');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Admin / Stripe webhook: apply $10 Focus Pack
create or replace function public.apply_focus_pack(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.user_plans;
begin
  row := public.maybe_reset_studio_period(p_user);
  update public.user_plans
  set
    voice_minutes_bonus = voice_minutes_bonus + 25,
    tutor_messages_bonus = tutor_messages_bonus + 20,
    focus_packs_purchased = focus_packs_purchased + 1,
    updated_at = now()
  where user_id = p_user
  returning * into row;

  return public.get_studio_usage(p_user);
end;
$$;

revoke all on function public.ensure_user_plan(uuid) from public;
revoke all on function public.maybe_reset_studio_period(uuid) from public;
revoke all on function public.get_studio_usage(uuid) from public;
revoke all on function public.consume_studio_credit(uuid, text, numeric) from public;
revoke all on function public.apply_focus_pack(uuid) from public;

grant execute on function public.get_studio_usage(uuid) to service_role;
grant execute on function public.consume_studio_credit(uuid, text, numeric) to service_role;
grant execute on function public.apply_focus_pack(uuid) to service_role;
grant execute on function public.maybe_reset_studio_period(uuid) to service_role;
grant execute on function public.ensure_user_plan(uuid) to service_role;

create or replace function public.get_my_studio_usage()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return null;
  end if;
  return public.get_studio_usage(auth.uid());
end;
$$;

revoke all on function public.get_my_studio_usage() from public;
grant execute on function public.get_my_studio_usage() to authenticated;

notify pgrst, 'reload schema';
