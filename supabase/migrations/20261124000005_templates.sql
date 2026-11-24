-- ============================================================
-- Ien — Page templates (Workflow §47 future feature)
--
-- A template is an ordinary page (or checklist) flagged
-- is_template = true. It never appears in normal listings —
-- those queries filter is_template = false — and can be
-- instantiated into a fresh page with one click.
-- ============================================================

alter table public.pages
  add column if not exists is_template boolean not null default false;

create index if not exists pages_template_idx
  on public.pages (user_id, updated_at desc)
  where is_template;
