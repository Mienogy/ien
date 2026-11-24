-- ============================================================
-- Ien — Public page sharing (Workflow §47 future feature)
--
-- public_slug NULL   = private (unchanged behaviour)
-- public_slug set    = anyone with /p/{slug} can read the page
--
-- The slug is random (48 bits) and unlisted — there is no public
-- index of shared pages. Archived pages and templates never read
-- as public, even if a stale slug exists.
-- ============================================================

alter table public.pages
  add column if not exists public_slug text;

create unique index if not exists pages_public_slug_idx
  on public.pages (public_slug)
  where public_slug is not null;

-- Anonymous visitors may SELECT shared pages only.
drop policy if exists "pages_select_public" on public.pages;
create policy "pages_select_public"
  on public.pages for select
  using (public_slug is not null and is_archived = false and is_template = false);

-- Checklist items of shared pages travel with the page.
drop policy if exists "checklist_items_select_public" on public.checklist_items;
create policy "checklist_items_select_public"
  on public.checklist_items for select
  using (exists (
    select 1
    from public.pages p
    where p.id = checklist_items.page_id
      and p.public_slug is not null
      and p.is_archived = false
      and p.is_template = false
  ));
