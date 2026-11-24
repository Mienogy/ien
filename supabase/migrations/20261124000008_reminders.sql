-- ============================================================
-- Ien — Reminders (Workflow §47 future feature)
--
-- Page-level reminders: one row per due date, attached to a page.
-- The app lists upcoming (not-done) reminders sorted by due_at;
-- completing keeps the row for history, deleting removes it.
-- ============================================================

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  page_id uuid not null references public.pages (id) on delete cascade,
  due_at timestamptz not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_user_due_idx
  on public.reminders (user_id, due_at)
  where not is_done;

create index if not exists reminders_page_idx
  on public.reminders (page_id);

drop trigger if exists reminders_updated_at on public.reminders;
create trigger reminders_updated_at
  before update on public.reminders
  for each row
  execute function public.handle_updated_at();

alter table public.reminders enable row level security;

drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own"
  on public.reminders for select
  using (auth.uid() = user_id);

drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own"
  on public.reminders for insert
  with check (auth.uid() = user_id);

drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own"
  on public.reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own"
  on public.reminders for delete
  using (auth.uid() = user_id);
