-- Add optional custom images for course cards and banners.
alter table public.courses
  add column if not exists image_url text;
