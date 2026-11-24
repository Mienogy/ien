-- ============================================================
-- Optional development seed data (Workflow §40)
--
-- Creates a demo space + pages for the FIRST signed-in user.
-- Run manually in the SQL editor after creating your account:
--   1. Sign up through the app
--   2. Replace 'REPLACE_WITH_YOUR_USER_ID' below with your user id
--      (find it in Authentication → Users in the Supabase dashboard)
--   3. Execute
--
-- Demo data is clearly named "Demo …" so it's easy to delete.
-- ============================================================

-- Space
insert into public.spaces (user_id, name, position)
values ('REPLACE_WITH_YOUR_USER_ID', 'Personal', 0)
on conflict do nothing;

-- Categories
insert into public.categories (user_id, name)
values
  ('REPLACE_WITH_YOUR_USER_ID', 'Ideas'),
  ('REPLACE_WITH_YOUR_USER_ID', 'Learning'),
  ('REPLACE_WITH_YOUR_USER_ID', 'Journal')
on conflict (user_id, name) do nothing;

-- Pages
insert into public.pages (user_id, space_id, title, content, search_text)
select
  'REPLACE_WITH_YOUR_USER_ID',
  s.id,
  'Demo — Welcome to Ien',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is a demo page. Delete it any time."}]}]}',
  'This is a demo page. Delete it any time.'
from public.spaces s
where s.user_id = 'REPLACE_WITH_YOUR_USER_ID' and s.name = 'Personal'
limit 1;
