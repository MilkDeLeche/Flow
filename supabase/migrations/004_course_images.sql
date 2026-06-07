-- Add optional custom images for course cards and banners.
alter table public.courses
  add column if not exists image_url text;

-- Make PostgREST/Supabase REST see the new column immediately after running this.
notify pgrst, 'reload schema';
