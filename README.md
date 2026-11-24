# Ien

> A modern personal knowledge management and note-taking application inspired by tools such as Notion, built with Vue 3, TypeScript, and Supabase.

Ien is a portfolio project and a learning experience with Supabase — authentication, PostgreSQL with Row Level Security, file storage, and MFA — wrapped in a calm, gray-based interface with a yellow tulip identity.

## Features

- **Spaces & pages** — organize notes into spaces, with fully nested sub-pages
- **Block editor** — headings, lists, task lists, quotes, code blocks, tables, images, links (Tiptap)
- **Checklists** — dedicated checklist pages with add/edit/complete/reorder/delete
- **Categories** — cross-space labels for your pages
- **Search** — global search with `Ctrl/Cmd + K` command palette (title + content)
- **Favorites & archive** — star important pages; archive hides them with restore/permanent delete
- **Home dashboard** — greeting, quick actions, recents, favorites, workspace stats
- **Authentication** — email/password, Google OAuth, password recovery, TOTP two-factor (authenticator apps)
- **Profile** — names, display name, avatar upload via Supabase Storage
- **Dark mode** — light and dark themes, persisted per device
- **Responsive** — desktop-first with a proper mobile navigation drawer

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vue 3 (`<script setup>`), TypeScript, Vite |
| State | Pinia |
| Routing | Vue Router (lazy-loaded routes, auth guards) |
| Editor | Tiptap 3 |
| Backend | Supabase (PostgreSQL, Auth, Storage, MFA) |
| Styling | Plain CSS with centralized design tokens (no UI framework) |
| Icons | lucide-vue-next |
| Fonts | Poppins (`@fontsource`) |
| Lint/format | ESLint (flat config) + Prettier |

## Architecture

```text
src/
├── components/
│   ├── ui/            # Button, Input, Modal, Toast, Avatar, Skeleton…
│   ├── layout/        # AppShell, Sidebar, Topbar
│   ├── editor/        # Tiptap wrapper + toolbar
│   ├── sidebar/       # Space menu, page trees
│   ├── notes/         # Page list, checklist editor, dialogs
│   ├── search/        # Ctrl+K command palette
│   └── auth/          # Google sign-in button
├── pages/             # Route components (auth, dashboard, notes, spaces, settings)
├── services/supabase/ # ← ALL database/auth/storage calls live here
├── stores/            # Pinia: auth, ui, content
├── composables/       # useToasts (more to come)
├── router/            # Routes + auth guards
├── styles/            # tokens.css (design system), base.css, editor.css
└── types/             # Shared model types
```

**Key rule:** UI components never call Supabase directly. Every query goes through `src/services/supabase/*`, which keeps the data layer testable and the components thin.

## Database structure

```text
auth.users
   └── profiles          (name, avatar — auto-created by trigger)
          ├── spaces     ──┐
          ├── categories ──┤
          └── pages        │  (parent_id → self, for sub-pages)
                 └── checklist_items
```

| Table | Purpose |
|---|---|
| `profiles` | Display data per user; row created by a `auth.users` insert trigger |
| `spaces` | Top-level containers (e.g. WORK, PERSONAL) |
| `categories` | Labels assignable to pages |
| `pages` | Notes/sub-pages/checklists; `content` is the Tiptap JSON document, `search_text` is its plain-text projection for search |
| `checklist_items` | Rows belonging to `type = 'checklist'` pages |

**Design notes** (deviations from the original spec, made deliberately):

- Editor content is stored as a single `jsonb` document on `pages` rather than a `page_blocks` table — this matches Tiptap's document model and makes autosave a single upsert.
- Favorites are a boolean (`is_favorite`) instead of a join table — fewer joins, identical RLS guarantees.
- Search uses PostgreSQL trigram indexes (`pg_trgm`) + `ILIKE`, which is simple and fast at personal-notes scale.

## Security / RLS

Every table has Row Level Security enabled with policies of the shape:

```sql
using (auth.uid() = user_id)
```

This means the database itself rejects any read/write for rows you don't own — even if someone crafts requests with the public anon key. Frontend checks are convenience only; **RLS is the real authorization layer**.

Storage policies scope avatar writes to your own folder:

```sql
auth.uid()::text = (storage.foldername(name))[1]   -- avatars/{your-user-id}/…
```

Additional security measures:

- Passwords hashed by Supabase Auth (never handled by the app)
- Password-recovery responses are identical whether or not the email exists (no account enumeration)
- Profile uploads validated by MIME type and 5 MB size limit
- TOTP MFA via Supabase's built-in MFA (no custom crypto)
- `.env` git-ignored; only the public anon key ships to the browser

## Environment variables

```env
VITE_SUPABASE_URL=          # Project Settings → API → Project URL
VITE_SUPABASE_ANON_KEY=     # Project Settings → API → anon public key
```

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

## Local development

```bash
npm install
npm run dev        # start Vite dev server
npm run typecheck  # vue-tsc
npm run lint       # eslint
npm run build      # typecheck + production build
```

## Supabase setup (step by step)

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `ien`) and a strong database password (save it — this is the *database* password, not your app password)
3. Pick a region close to you
4. Wait ~2 minutes for provisioning

*Why:* this gives you a hosted PostgreSQL database, an Auth service, and a Storage service without running any server yourself.

### Step 2 — Configure environment variables

In the Supabase dashboard: **Project Settings → API**. Copy the **Project URL** and **anon public** key into `.env` as shown above, then restart `npm run dev`.

*Why:* the app needs to know *which* Supabase project to talk to. The anon key is safe in the browser because RLS (Step 5–6) protects the data.

### Step 3–4 — Create tables (run the migrations)

Migrations live in `supabase/migrations/`:

| File | Contents |
|---|---|
| `20261124000001_initial_schema.sql` | Tables, indexes, triggers, profile auto-creation |
| `20261124000002_row_level_security.sql` | RLS enablement + policies |
| `20261124000003_storage_avatars.sql` | `avatars` bucket + storage policies |

**Option A (recommended): Supabase CLI**

```bash
npx supabase link --project-ref <your-project-ref>   # find ref in Project Settings → General
npx supabase db push                                 # applies pending migrations
```

**Option B (manual):** open **SQL Editor** in the dashboard, paste each file's contents in order, and run.

*Why migrations:* SQL files are version-controlled, reviewable, and reproducible — unlike clicking through the table editor, you can re-create the whole schema anywhere.

### Step 5–6 — Enable RLS

Already handled: the second migration enables RLS and creates the policies. After running it, check **Authentication → Database → Tables** — every table should show **RLS enabled**.

*Why:* without RLS, anyone with the anon key could read every row in your database.

### Step 7 — Configure Storage

The third migration creates the public `avatars` bucket with per-user write policies. Verify under **Storage → Buckets → avatars**.

### Step 8 — Configure Google OAuth (optional)

1. In Google Cloud Console → **Credentials** → create an **OAuth client ID** (Web application)
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. In Supabase: **Authentication → Providers → Google** → paste Client ID + Secret → enable

*Why:* Supabase handles the OAuth dance; you only register the provider once.

### Step 9 — Configure password recovery URLs

In Supabase: **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:5173` during development
- **Redirect URLs:** add
  - `http://localhost:5173/auth/callback`
  - `http://localhost:5173/reset-password`
  - (production equivalents after deploy — see below)

*Why:* Supabase only redirects to whitelisted URLs — this prevents attackers from turning your recovery emails into open redirects.

### Step 10 — Configure MFA

MFA (TOTP) works out of the box with Supabase Auth. Users enable it in **Settings → Security** inside the app. No dashboard configuration required.

### Optional — seed demo data

Edit `supabase/seed.sql`, replace `REPLACE_WITH_YOUR_USER_ID` (find it in **Authentication → Users**), and run it in the SQL editor.

## Deployment (Vercel)

1. **Push to GitHub**
2. **Import** the repository at [vercel.com/new](https://vercel.com/new) — Vercel auto-detects Vite
3. **Environment variables** — add for Production *and* Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**
5. **Update Supabase URL configuration:**
   - Site URL: `https://<your-app>.vercel.app`
   - Redirect URLs: add `https://<your-app>.vercel.app/auth/callback` and `.../reset-password`
   - If you enabled Google OAuth, its redirect URI stays the Supabase callback (no change needed)
6. **Test the production build:** sign up, sign in, password recovery, create/edit a note, upload an avatar

> Vercel preview deployments get their own URL — add it to Supabase redirect URLs too if you want auth to work on previews.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `vue-tsc` typecheck + production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |
| `npm run lint` / `lint:fix` | ESLint check / auto-fix |
| `npm run format` | Prettier write |

## Future improvements

Calendar view, reminders, public/shared pages, comments, file attachments, templates, version history, markdown import/export, AI-assisted notes — the service-layer architecture is designed so these can be added without rewrites.

---

*Built as a personal portfolio project and learning experience with Supabase.*
