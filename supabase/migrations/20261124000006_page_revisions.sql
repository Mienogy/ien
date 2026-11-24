-- ============================================================
-- Ien — Page version history (Workflow §47 future feature)
--
-- Snapshots of a page's title/content taken while editing.
-- The app inserts a row at most once per 5 minutes per page and
-- prunes to the newest 50 snapshots per page. Restore is done
-- through the pages table (the current state is snapshotted first,
-- so a restore is itself undoable).
-- ============================================================

create table if not exists public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  page_id uuid not null references public.pages (id) on delete cascade,
  title text not null default 'Untitled',
  content jsonb,
  search_text text,
  created_at timestamptz not null default now()
);

create index if not exists page_revisions_page_idx
  on public.page_revisions (page_id, created_at desc);

create index if not exists page_revisions_user_idx
  on public.page_revisions (user_id);

alter table public.page_revisions enable row level security;

drop policy if exists "revisions_select_own" on public.page_revisions;
create policy "revisions_select_own"
  on public.page_revisions for select
  using (auth.uid() = user_id);

drop policy if exists "revisions_insert_own" on public.page_revisions;
create policy "revisions_insert_own"
  on public.page_revisions for insert
  with check (auth.uid() = user_id);

drop policy if exists "revisions_delete_own" on public.page_revisions;
create policy "revisions_delete_own"
  on public.page_revisions for delete
  using (auth.uid() = user_id);
