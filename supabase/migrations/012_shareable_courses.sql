-- Shareable, read-only course links. A course gets an opaque share_id; anyone
-- with the link can view the chapters (read-only) without an account.
--
-- Safety: the base tables stay locked down by RLS. Public read happens ONLY
-- through the get_shared_course() function below, which runs as definer and
-- returns data solely for a course that has an active share_id.
--
-- Apply with: supabase db push  (or paste into the Supabase SQL editor).

alter table if exists public.courses
  add column if not exists share_id text unique;

create or replace function public.get_shared_course(p_share_id text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'name', c.name,
    'description', coalesce(c.description, ''),
    'theme', c.theme,
    'chapters', coalesce((
      select json_agg(
        json_build_object(
          'id', m.id,
          'title', m.title,
          'content', m.content,
          'sourceType', m.source_type
        ) order by m.created_at
      )
      from public.materials m
      where m.course_id = c.id
    ), '[]'::json)
  )
  from public.courses c
  where c.share_id = p_share_id
  limit 1;
$$;

grant execute on function public.get_shared_course(text) to anon, authenticated;

notify pgrst, 'reload schema';
