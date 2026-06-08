-- Per-student chapter reader highlights and notes.
-- Additive and idempotent: safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.reader_marks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  section_id  text not null,
  highlighted boolean not null default false,
  note        text not null default '',
  updated_at  timestamptz not null default now(),
  unique (material_id, section_id)
);

alter table public.reader_marks
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  add column if not exists material_id uuid references public.materials (id) on delete cascade,
  add column if not exists section_id text,
  add column if not exists highlighted boolean not null default false,
  add column if not exists note text not null default '',
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists reader_marks_material_section_key
  on public.reader_marks (material_id, section_id);

create index if not exists reader_marks_user_material_idx
  on public.reader_marks (user_id, material_id, updated_at);

alter table public.reader_marks enable row level security;

drop policy if exists "owner_all" on public.reader_marks;
create policy "owner_all" on public.reader_marks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.reader_marks to authenticated;
grant all on public.reader_marks to service_role;

notify pgrst, 'reload schema';
