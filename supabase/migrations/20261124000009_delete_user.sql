-- ============================================================
-- Ien — Real account deletion (Workflow §30 — delete account)
--
-- The browser can never hold a service-role key, so deletion goes
-- through a SECURITY DEFINER function: the signed-in user calls
-- delete_user(), which removes THEIR OWN auth.users row. Every
-- table in the Ien schema references auth.users ON DELETE CASCADE,
-- so profiles, spaces, categories, pages, checklists, reminders,
-- and revisions all disappear with it. Storage objects are cleaned
-- up by the app before calling this (best effort).
-- ============================================================

create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

-- Only signed-in users may execute it, and only for themselves
-- (auth.uid() inside the function is the caller's own id).
revoke execute on function public.delete_user() from public;
revoke execute on function public.delete_user() from anon;
grant execute on function public.delete_user() to authenticated;
