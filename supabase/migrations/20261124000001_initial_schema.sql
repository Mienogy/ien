-- ============================================================
-- Ien — initial schema
-- Run via: supabase db push  (or paste into the SQL editor)
--
-- Why these tables exist:
--  * profiles      → user identity beyond auth.users (name, avatar)
--  * spaces        → top-level containers (WORK, PERSONAL)
--  * categories    → cross-space labels (Work, Learning, …)
--  * pages         → the notes themselves, nested via parent_id
--  * checklist_items → rows of a checklist-type page
--
-- Every table carries user_id so Row Level Security can isolate
-- each user's data (see the second migration).
-- ============================================================

-- Required for trigram search on titles/search_text
create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- Profiles: one row per auth user, created automatically by trigger
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing profile data for each authenticated user.';

-- ------------------------------------------------------------
-- Spaces
-- ------------------------------------------------------------
create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spaces_user_id_idx on public.spaces (user_id, position);

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists categories_user_id_idx on public.categories (user_id);

-- ------------------------------------------------------------
-- Pages: notes, sub-pages, and checklists (type column)
-- ------------------------------------------------------------
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  parent_id uuid references public.pages (id) on delete cascade,
  title text not null default 'Untitled' check (char_length(title) <= 300),
  -- Tiptap document stored as JSONB (see README for the design note)
  content jsonb,
  icon text,
  cover_url text,
  type text not null default 'page' check (type in ('page', 'checklist')),
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  position integer not null default 0,
  -- Plain-text projection of content, maintained by the app for search
  search_text text,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pages_user_idx on public.pages (user_id, is_archived, updated_at desc);
create index if not exists pages_space_idx on public.pages (space_id) where space_id is not null;
create index if not exists pages_parent_idx on public.pages (parent_id) where parent_id is not null;
create index if not exists pages_favorite_idx on public.pages (user_id) where is_favorite = true;
-- Trigram indexes power ILIKE search on title and search_text
create index if not exists pages_title_trgm_idx on public.pages using gin (title gin_trgm_ops);
create index if not exists pages_search_trgm_idx on public.pages using gin (search_text gin_trgm_ops);

-- ------------------------------------------------------------
-- Checklist items
-- ------------------------------------------------------------
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  page_id uuid not null references public.pages (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checklist_items_page_idx
  on public.checklist_items (page_id, position);

-- ------------------------------------------------------------
-- updated_at maintenance
-- ------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists spaces_updated_at on public.spaces;
create trigger spaces_updated_at
  before update on public.spaces
  for each row execute function public.handle_updated_at();

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

drop trigger if exists pages_updated_at on public.pages;
create trigger pages_updated_at
  before update on public.pages
  for each row execute function public.handle_updated_at();

drop trigger if exists checklist_items_updated_at on public.checklist_items;
create trigger checklist_items_updated_at
  before update on public.checklist_items
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- Auto-create a profile row when a user signs up
-- (Google OAuth users also land here.)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
