-- ============================================================
-- Ien — Row Level Security
--
-- Why RLS matters: the anon key in the browser can talk to your
-- database directly. RLS is the gatekeeper — without a policy,
-- every query returns nothing (default deny). Each policy below
-- asserts: "the row's user_id must equal the signed-in user".
-- Frontend checks are convenience; these are the real protection.
-- ============================================================

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert/delete policies: profile rows are created by the
-- security-definer trigger on signup and removed with auth.users.

-- ------------------------------------------------------------
-- Spaces
-- ------------------------------------------------------------
alter table public.spaces enable row level security;

drop policy if exists "spaces_select_own" on public.spaces;
create policy "spaces_select_own"
  on public.spaces for select
  using (auth.uid() = user_id);

drop policy if exists "spaces_insert_own" on public.spaces;
create policy "spaces_insert_own"
  on public.spaces for insert
  with check (auth.uid() = user_id);

drop policy if exists "spaces_update_own" on public.spaces;
create policy "spaces_update_own"
  on public.spaces for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "spaces_delete_own" on public.spaces;
create policy "spaces_delete_own"
  on public.spaces for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own"
  on public.categories for select
  using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
  on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Pages
-- ------------------------------------------------------------
alter table public.pages enable row level security;

drop policy if exists "pages_select_own" on public.pages;
create policy "pages_select_own"
  on public.pages for select
  using (auth.uid() = user_id);

drop policy if exists "pages_insert_own" on public.pages;
create policy "pages_insert_own"
  on public.pages for insert
  with check (auth.uid() = user_id);

drop policy if exists "pages_update_own" on public.pages;
create policy "pages_update_own"
  on public.pages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pages_delete_own" on public.pages;
create policy "pages_delete_own"
  on public.pages for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Checklist items
-- ------------------------------------------------------------
alter table public.checklist_items enable row level security;

drop policy if exists "checklist_items_select_own" on public.checklist_items;
create policy "checklist_items_select_own"
  on public.checklist_items for select
  using (auth.uid() = user_id);

drop policy if exists "checklist_items_insert_own" on public.checklist_items;
create policy "checklist_items_insert_own"
  on public.checklist_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "checklist_items_update_own" on public.checklist_items;
create policy "checklist_items_update_own"
  on public.checklist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "checklist_items_delete_own" on public.checklist_items;
create policy "checklist_items_delete_own"
  on public.checklist_items for delete
  using (auth.uid() = user_id);
