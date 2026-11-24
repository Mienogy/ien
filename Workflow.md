# Build "Ien" — Modern Notion-Inspired Notes & Knowledge Management App

You are helping me build a **portfolio-quality personal notes and knowledge management application** called **Ien** (capital letter `I`, lowercase `en`).

The goal is to create a modern, elegant, polished note-taking system inspired by the usability and flexibility of Notion, while having its own visual identity.

This is also a learning project for me. **I am new to Supabase**, so implement the Supabase integration properly and keep the architecture understandable and well documented. Do not hide important logic behind unnecessary abstractions.

---

## 1. PROJECT GOALS

Build a responsive web application where authenticated users can:

- Create and manage notes
- Organize notes into spaces
- Create categories
- Create pages and sub-pages
- Create checklists
- Edit and delete content
- Search notes
- Favorite/star important pages
- Archive pages
- Manage their profile
- Upload/change their profile picture
- Change account information
- Change password
- Recover a forgotten password through email
- Use their email as their unique account identifier
- Enable additional sign-in security such as:
  - PIN/passcode protection
  - Authenticator app / TOTP-based two-factor authentication
- Sign in using Google OAuth
- Sign out securely

The application should feel like a **real SaaS/productivity application**, not a basic CRUD demo.

---

# 2. BRANDING

## Application name

**Ien**

Important:

- The first character is a capital letter `I`.
- The name should be displayed as `Ien`.
- Do not use `lEn`, `ien`, or an emoji representation.

## Logo

Create a minimal, elegant **yellow tulip logo**.

The tulip should be:

- A real graphical/vector-style logo
- Minimal
- Modern
- Elegant
- Recognizable at small sizes
- Suitable for a web application sidebar
- Suitable for favicon/app icon
- Not an emoji
- Not a stock-photo-style image

Use the tulip as part of the visual identity.

The yellow should be used as an accent rather than overwhelming the entire UI.

Suggested visual direction:

- Soft golden yellow
- Warm gray
- Charcoal
- Off-white
- Light gray
- Dark gray

Avoid making the application look overly colorful.

---

# 3. DESIGN DIRECTION

The application should have a **modern gray-based interface**.

Think:

- Notion-inspired productivity interface
- Google Workspace / Google Sans cleanliness
- Modern SaaS dashboard
- Elegant minimalism
- Soft rounded corners
- Generous spacing
- Subtle borders
- Very subtle shadows
- Clear typography hierarchy
- Minimal visual noise

The interface should feel:

> Calm, intelligent, organized, premium, and professional.

Do NOT make it look like a generic Bootstrap dashboard.

Avoid:

- Excessive gradients
- Excessive cards
- Neon colors
- Excessive shadows
- Cluttered layouts
- Giant buttons
- Overly rounded "bubble" UI
- Emoji-based icons everywhere

---

# 4. TYPOGRAPHY

Use **Poppins** if practical.

If Poppins is not appropriate for certain UI elements, use a clean modern sans-serif similar to:

- Google Sans
- Inter
- DM Sans

Typography should have:

- Strong hierarchy
- Comfortable line height
- Medium/semibold headings
- Regular body text
- Smaller muted metadata text

The typography should contribute significantly to the polished appearance.

---

# 5. COLOR SYSTEM

Create a centralized design system using CSS variables/tokens.

Primary palette should be based around gray.

Example direction:

```text
Background:
#F7F7F5
#F1F1EF

Surface:
#FFFFFF

Primary text:
#202124
#292929

Secondary text:
#6B6B6B

Muted text:
#929292

Borders:
#E5E5E3

Dark UI:
#242424
#1E1E1E

Accent:
Warm yellow / tulip yellow

Example:
#E8B84A
```

Do not hard-code colors throughout individual components.

Create reusable theme variables.

The yellow accent should primarily be used for:

- Tulip logo
- Active states
- Important actions
- Favorites
- Small highlights
- Selected UI elements

---

# 6. RESPONSIVE DESIGN

The application must work properly on:

- Desktop
- Laptop
- Tablet
- Mobile

Desktop should be the primary experience because this is a notes/knowledge management application.

However, mobile should still provide a usable experience.

Use responsive layouts rather than simply shrinking the desktop UI.

---

# 7. RECOMMENDED APPLICATION STRUCTURE

Use a structure similar to:

```text
Ien
│
├── Authentication
│   ├── Login
│   ├── Register
│   ├── Forgot Password
│   ├── Reset Password
│   ├── Google Login
│   └── 2FA / Authenticator
│
├── Main Application
│   ├── Sidebar
│   ├── Top Navigation
│   ├── Workspace
│   ├── Search
│   └── User Profile
│
├── Spaces
│   ├── Space Dashboard
│   ├── Categories
│   └── Pages
│
├── Pages
│   ├── Page Editor
│   ├── Sub-pages
│   ├── Checklists
│   ├── Favorites
│   └── Archive
│
└── Settings
    ├── Profile
    ├── Security
    ├── Password
    ├── 2FA
    └── Account
```

---

# 8. SIDEBAR

Create a clean Notion-inspired sidebar.

The sidebar should contain:

### Top

- Ien logo
- Ien name
- Collapse sidebar button

### Navigation

- Home
- Inbox
- Search
- Favorites
- Recent
- Archive

### Spaces

Display user-created spaces.

Example:

```text
WORK
  Projects
  Meeting Notes
  Documentation

PERSONAL
  Journal
  Ideas
  Learning
```

Users should be able to:

- Create a Space
- Rename a Space
- Delete a Space
- Add pages to a Space

Use subtle indentation for hierarchy.

---

# 9. HOME DASHBOARD

Create a polished dashboard.

Possible sections:

### Greeting

Example:

```text
Good morning, Mienzan.
What would you like to work on?
```

Do not hard-code the user's name. Pull it from their profile.

### Quick actions

Buttons:

- New Page
- New Space
- New Checklist

### Recent pages

Display recently modified pages.

### Favorites

Display favorited pages.

### Quick overview

Possible statistics:

```text
12 Spaces
48 Pages
17 Favorites
6 Checklists
```

Use clean typography rather than large dashboard cards.

---

# 10. PAGE SYSTEM

Pages are the heart of Ien.

Users should be able to create:

- Pages
- Sub-pages
- Checklists
- Notes

Each page should support:

- Title
- Content
- Cover image (optional)
- Icon (optional)
- Favorite
- Archive
- Created date
- Updated date

Pages should support nesting:

```text
Project Alpha
│
├── Requirements
├── Meeting Notes
│   ├── Meeting 1
│   └── Meeting 2
├── Tasks
└── Documentation
```

---

# 11. EDITOR

Create a modern block-style editor inspired by Notion.

Support blocks such as:

### Basic

- Paragraph
- Heading 1
- Heading 2
- Heading 3
- Quote
- Divider

### Lists

- Bullet list
- Numbered list
- Checklist

### Advanced

- Code block
- Link
- Image
- Callout
- Table if practical

The editor should feel smooth and intuitive.

Consider using a well-supported editor library such as:

- Tiptap
- Lexical
- BlockNote

Choose the library that provides the best balance of functionality, maintainability, and learning value.

Do not build a complex rich-text engine from scratch unless necessary.

---

# 12. CHECKLISTS

Users should be able to create checklist items.

Example:

```text
☐ Finish portfolio
☑ Create Supabase database
☐ Configure authentication
☐ Deploy application
```

Checklist items should be editable.

Users should be able to:

- Add
- Edit
- Complete
- Uncomplete
- Delete
- Reorder

Persist checklist data in Supabase.

---

# 13. CATEGORIES

Users should be able to create categories.

Examples:

```text
Work
Personal
Programming
Ideas
Projects
Learning
Journal
```

A page can belong to a category.

Categories should be:

- Createable
- Editable
- Deletable
- Searchable

---

# 14. SEARCH

Implement global search.

Users should be able to search:

- Page title
- Page content
- Space
- Category

Search should be fast and have a clean UI.

Include:

- Search icon
- Keyboard shortcut if practical
- Search results
- Empty state
- Recent searches if practical

Potential shortcut:

```text
Ctrl + K
```

or

```text
Cmd + K
```

---

# 15. FAVORITES

Users can favorite pages.

Favorites should appear in the sidebar and dashboard.

A favorite should be represented with a subtle star icon.

---

# 16. ARCHIVE

Users should be able to archive pages.

Archived pages should not appear in normal page listings.

Provide:

```text
Archive
├── Archived pages
├── Restore
└── Permanently delete
```

Use confirmation dialogs for destructive actions.

---

# 17. USER ACCOUNT

Implement a complete profile management system.

Users should be able to:

- View profile
- Edit first name
- Edit last name
- Change display name
- Change email where supported
- Change password
- Upload profile picture
- Replace profile picture
- Remove profile picture

Profile picture should be stored using **Supabase Storage**.

The UI should show:

- Avatar
- Name
- Email
- Account creation information where appropriate

---

# 18. AUTHENTICATION

Use **Supabase Authentication**.

Authentication methods:

### Email/password

Users can:

- Register
- Login
- Logout
- Change password
- Reset password

Email should be the unique identifier for the authentication account.

Do not create insecure custom password storage.

Never store plain-text passwords.

---

# 19. FORGOT PASSWORD

Implement a complete password recovery flow.

Flow:

```text
Login
 ↓
Forgot password?
 ↓
Enter email
 ↓
Supabase sends recovery email
 ↓
User opens recovery link
 ↓
Reset password
 ↓
Return to login
```

Create proper success/error states.

Never expose whether an email exists in a way that could enable account enumeration.

---

# 20. GOOGLE AUTHENTICATION

Implement Google OAuth using Supabase.

Login page should include:

```text
Continue with Google
```

Use Supabase OAuth.

Handle:

- Successful login
- Failed login
- OAuth callback
- Existing account
- Redirect to application

Do not implement Google authentication manually.

---

# 21. ADDITIONAL SECURITY / 2FA

Implement optional two-factor authentication.

Preferred approach:

### TOTP Authenticator

Allow users to connect an authenticator app such as:

- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password

Flow:

```text
Settings
 ↓
Security
 ↓
Enable Two-Factor Authentication
 ↓
Generate secret
 ↓
Display QR code
 ↓
User scans QR code
 ↓
Enter verification code
 ↓
Confirm
 ↓
2FA enabled
```

At login:

```text
Email/password
      ↓
Password accepted
      ↓
2FA required
      ↓
Enter authenticator code
      ↓
Authenticated
```

Use Supabase's supported MFA functionality where possible.

Do not invent a custom cryptographic authentication system.

---

# 22. OPTIONAL PIN SECURITY

A PIN can be added as an additional application-level security feature.

Important:

Do NOT store the PIN as plain text.

If implementing PIN functionality:

- Hash it securely
- Never expose it through API responses
- Provide PIN creation/change
- Provide PIN removal
- Rate-limit attempts
- Provide account recovery options

The PIN should not replace proper authentication.

If implementing PIN protection becomes unnecessarily complex, prioritize Supabase MFA first and keep PIN as a future feature.

---

# 23. SUPABASE DATABASE

Use Supabase PostgreSQL.

Design a normalized relational database.

Potential tables:

```text
profiles
spaces
categories
pages
page_blocks
checklist_items
favorites
```

You may adjust the schema if a better architecture exists.

Suggested relationships:

```text
auth.users
    │
    └── profiles
           │
           ├── spaces
           │      │
           │      └── pages
           │             │
           │             ├── sub-pages
           │             └── blocks
           │
           ├── categories
           └── favorites
```

Each user's data must belong to that authenticated user.

---

# 24. SUPABASE SECURITY

This is extremely important.

Implement **Row Level Security (RLS)** properly.

A user should only be able to access their own:

- Profile
- Spaces
- Categories
- Pages
- Blocks
- Checklist items
- Favorites

Do NOT rely only on frontend checks.

Use Supabase RLS policies.

Example concept:

```text
auth.uid() = user_id
```

where appropriate.

Make sure users cannot access another user's notes by manipulating IDs in requests.

---

# 25. SUPABASE STORAGE

Use Supabase Storage for profile images.

Suggested structure:

```text
avatars/
    user-id/
        profile.jpg
```

Users should only be able to upload/manage their own profile images.

Consider:

- File type validation
- File size limits
- Safe filenames
- Replacement/deletion of old images
- Public vs private bucket considerations

Choose the safest practical configuration.

---

# 26. DATA PERSISTENCE

All important application data must persist after refresh.

Do NOT use localStorage as the primary database.

Supabase should be the source of truth.

Local state may be used for UI state, caching, drafts, etc.

---

# 27. LOADING / ERROR STATES

Every asynchronous operation should have appropriate states.

Implement:

- Loading
- Empty
- Success
- Error
- Saving
- Saved
- Unauthorized
- Not found

For example:

```text
Saving...
Saved just now
```

Avoid making the interface feel frozen while waiting for Supabase.

---

# 28. TOAST NOTIFICATIONS

Use elegant toast notifications.

Examples:

```text
Page created successfully
Changes saved
Profile updated
Password changed
Space deleted
Failed to save changes
```

Avoid excessive notifications.

---

# 29. MODALS AND CONFIRMATIONS

Use polished modal dialogs for destructive actions.

Example:

```text
Delete "Project Alpha"?

This action cannot be undone.

[Cancel] [Delete]
```

Use confirmation for:

- Delete page
- Delete space
- Delete category
- Remove profile image
- Delete account

---

# 30. PROFILE SETTINGS PAGE

Create a beautiful settings interface.

Sections:

```text
Settings

Profile
├── Profile picture
├── First name
├── Last name
├── Display name
└── Email

Security
├── Change password
├── Two-factor authentication
└── PIN security

Preferences
├── Theme
├── Notifications
└── Editor preferences

Account
├── Export data
└── Delete account
```

---

# 31. DARK MODE

Implement light and dark themes.

Light mode should use:

- Warm white
- Light gray
- Charcoal
- Yellow accent

Dark mode should use:

- Near-black / charcoal background
- Dark gray surfaces
- Soft white text
- Muted gray text
- Same yellow tulip accent

Avoid pure black/white extremes where possible.

Persist theme preference.

---

# 32. ACCESSIBILITY

Implement basic accessibility standards:

- Proper button labels
- Keyboard navigation
- Focus states
- Sufficient contrast
- ARIA labels where appropriate
- Semantic HTML
- Accessible dialogs
- Accessible form errors

Do not sacrifice accessibility for visual design.

---

# 33. UX DETAILS

Add small polished interactions:

- Hover states
- Smooth transitions
- Sidebar collapse
- Active navigation indicators
- Autosave indicator
- Keyboard shortcuts
- Context menus
- Drag/reorder where practical
- Breadcrumbs for nested pages
- Empty states
- Skeleton loaders

Keep animations subtle.

---

# 34. TECHNICAL REQUIREMENTS

Before implementing anything, inspect the existing project structure.

Do not blindly overwrite existing files.

Identify:

- Framework
- Build tool
- Package manager
- Existing components
- Existing styling system
- Existing routes
- Existing environment configuration

Reuse existing architecture where sensible.

If the project is empty, establish a clean scalable architecture.

---

# 35. ENVIRONMENT VARIABLES

Use environment variables for Supabase configuration.

For example:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never hard-code secrets into source code.

Never expose service-role keys in frontend code.

Create an appropriate `.env.example`.

---

# 36. CODE QUALITY

Write production-quality code.

Prioritize:

- Reusable components
- Clear naming
- Separation of concerns
- Maintainability
- Type safety if TypeScript is being used
- Reusable composables/hooks
- Proper error handling
- Secure database access
- Minimal duplication

Avoid giant components.

Avoid putting database queries directly everywhere in UI components.

Create a sensible service/data-access layer.

---

# 37. PROJECT STRUCTURE

Aim for a structure similar to:

```text
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── editor/
│   ├── sidebar/
│   └── profile/
│
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── notes/
│   ├── spaces/
│   └── settings/
│
├── services/
│   └── supabase/
│
├── composables/
│
├── stores/
│
├── lib/
│
├── types/
│
├── router/
│
└── assets/
    └── branding/
```

Adapt this structure to the actual framework being used.

---

# 38. SUPABASE SETUP DOCUMENTATION

Because I am learning Supabase, create a clear setup guide.

Include:

### Step 1

Create Supabase project.

### Step 2

Configure environment variables.

### Step 3

Create database tables.

### Step 4

Run SQL migrations.

### Step 5

Enable RLS.

### Step 6

Create RLS policies.

### Step 7

Configure Storage.

### Step 8

Configure Google OAuth.

### Step 9

Configure password recovery URLs.

### Step 10

Configure MFA.

Explain **why** each step exists.

Do not just give me commands without explaining them.

---

# 39. DATABASE MIGRATIONS

Use SQL migration files rather than asking me to manually create everything through the Supabase UI.

Create migrations for:

- Profiles
- Spaces
- Categories
- Pages
- Page blocks
- Checklist items
- Favorites
- Necessary indexes
- RLS policies
- Storage policies where appropriate

Keep migrations organized and reproducible.

---

# 40. SEED / DEMO DATA

Create optional development seed data.

For example:

```text
Personal
├── Ideas
├── Journal
└── Learning

Work
├── Projects
├── Meeting Notes
└── Documentation
```

Clearly separate development/demo data from real user data.

---

# 41. SECURITY REVIEW

Before considering the project complete, review the implementation for:

- Broken access control
- Missing RLS
- Exposed secrets
- Unsafe file uploads
- Plain-text passwords/PINs
- Cross-user data access
- Incorrect Supabase policies
- Client-side-only authorization
- Unsafe database queries
- Account enumeration
- Improper OAuth handling

Fix security issues you identify.

---

# 42. PERFORMANCE

Avoid unnecessary database requests.

Use:

- Proper indexes
- Efficient queries
- Pagination where appropriate
- Debounced search
- Lazy loading
- Optimistic UI where appropriate
- Efficient image handling

Do not over-engineer caching.

---

# 43. PORTFOLIO QUALITY

This project will be included in my portfolio.

Therefore, the final application should demonstrate that I understand:

- Modern frontend development
- Authentication
- OAuth
- MFA
- Database design
- PostgreSQL
- Supabase
- Row Level Security
- File storage
- CRUD
- Responsive UI
- Component architecture
- Security
- UX design

The project should look impressive when demonstrated to recruiters or hiring managers.

---

# 44. DEVELOPMENT APPROACH

Do NOT try to implement every feature at once.

Build in logical phases.

## Phase 1 — Foundation

Implement:

- Project structure
- Design system
- Typography
- Branding
- Supabase client
- Basic routing
- Layout
- Sidebar
- Responsive shell

## Phase 2 — Authentication

Implement:

- Registration
- Login
- Logout
- Forgot password
- Reset password
- Auth state
- Protected routes

## Phase 3 — User Profile

Implement:

- Profile
- Profile editing
- Profile image
- Supabase Storage
- Account settings

## Phase 4 — Core Notes

Implement:

- Spaces
- Categories
- Pages
- Page hierarchy
- Basic editor
- CRUD
- Autosave

## Phase 5 — Productivity Features

Implement:

- Checklists
- Favorites
- Archive
- Search
- Recent pages

## Phase 6 — Advanced Authentication

Implement:

- Google OAuth
- TOTP MFA
- Authenticator application setup
- Security settings

## Phase 7 — Polish

Implement:

- Dark mode
- Animations
- Loading states
- Empty states
- Keyboard shortcuts
- Accessibility
- Performance improvements

---

# 45. IMPORTANT IMPLEMENTATION RULE

After each major phase:

1. Explain what was implemented.
2. Explain the relevant Supabase concepts.
3. Tell me which files were created/changed.
4. Tell me how to test the feature.
5. Identify any manual Supabase dashboard configuration I need to perform.
6. Tell me any security considerations.
7. Do not move to the next major phase if the current implementation has obvious errors.

I want to **learn while building**, not just receive generated code.

---

# 46. ERROR HANDLING

If something doesn't work:

Do not randomly rewrite large sections of the project.

Instead:

1. Identify the error.
2. Explain the likely cause.
3. Inspect the relevant code.
4. Make the smallest appropriate fix.
5. Explain why the fix works.
6. Retest the affected functionality.

Preserve existing working functionality.

---

# 47. FINAL DELIVERABLE

The final application should feel like:

> "A personal, elegant, modern knowledge management system."

Not:

> "A basic notes CRUD project."

The interface should have its own identity through the **Ien yellow tulip branding**, gray modern aesthetic, typography, spacing, and polished interactions.

The architecture should be strong enough that I can continue adding features later.

Potential future features should be easy to add, such as:

- Calendar
- Reminders
- Public pages
- Shared workspaces
- Collaboration
- Comments
- File attachments
- AI-assisted notes
- Templates
- Version history
- Import/export
- Markdown support

Do not implement these future features unless necessary. Instead, structure the application so they can be added later.

---

# 48. START NOW

First, inspect the existing project.

Tell me:

1. What framework and tooling the project currently uses.
2. What is already implemented.
3. What needs to be created.
4. Whether Supabase is already configured.
5. Any dependencies that need to be installed.
6. Any architectural issues you see.

Then begin with **Phase 1 — Foundation**.

Do not generate a huge amount of code blindly.

Build the application incrementally, keeping the project runnable after every major change.

Remember:

**I am learning this project, so explain important architectural and Supabase decisions as you make them.**

# 49. GIT / GITHUB VERSION CONTROL

This project will be maintained using **Git** and pushed to a remote Git repository, such as GitHub.

Git should be treated as part of the development workflow from the beginning.

Follow good version-control practices.

## Repository

The project should have:

- A clean Git repository
- A meaningful `README.md`
- A proper `.gitignore`
- No secrets committed to Git
- No `.env` files containing real credentials committed to the repository

Create and maintain:

```text
.env
.env.local
.env.*.local
```

as appropriate in `.gitignore`.

Provide an `.env.example` containing only placeholder values, for example:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never commit:

- Supabase service-role keys
- Private API keys
- OAuth client secrets
- Passwords
- Tokens
- Authentication secrets
- Production credentials

---

# 50. GIT COMMIT WORKFLOW

I will be pushing my changes to Git regularly.

Structure development into logical commits rather than one enormous commit.

Use clear commit messages such as:

```text
feat: add Supabase authentication
feat: add profile management
feat: add notes editor
feat: add spaces and categories
feat: add Google OAuth
feat: add TOTP MFA
fix: resolve profile image upload issue
fix: correct page autosave
style: improve sidebar navigation
refactor: separate Supabase data services
docs: update Supabase setup guide
```

Do not create commits that contain unrelated changes whenever avoidable.

When implementing a feature, tell me:

1. What changed
2. Which files changed
3. What should be tested
4. A recommended commit message

Do not automatically run destructive Git commands.

Never use commands such as:

```bash
git reset --hard
git clean -fd
git push --force
```

unless I explicitly request them.

---

# 51. GITHUB README

Create a professional `README.md` suitable for a portfolio project.

It should include:

## Ien

A short description such as:

> Ien is a modern personal knowledge management and note-taking application inspired by tools such as Notion, built with a modern frontend stack and Supabase.

Include sections for:

- Features
- Tech stack
- Architecture
- Authentication
- Supabase setup
- Database structure
- Storage
- Security / RLS
- Environment variables
- Local development
- Deployment
- Screenshots
- Future improvements

Do not claim features that have not actually been implemented.

Include a section explaining the project was built as a personal portfolio project and learning experience with Supabase.

---

# 52. VERCEL DEPLOYMENT

The application will be deployed to **Vercel**.

Design and configure the application so it can be deployed to Vercel without requiring a traditional backend server.

Do not introduce backend architecture that requires a persistent server unless it is actually necessary.

The application should work correctly with:

```text
Local Development
        ↓
Git Repository
        ↓
Vercel
        ↓
Production
        ↓
Supabase
```

---

# 53. VERCEL ENVIRONMENT VARIABLES

The production application must use Vercel Environment Variables.

Do not commit production environment variables to Git.

The Supabase configuration should be supplied through Vercel's environment configuration.

For example:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Use the appropriate environment-variable naming convention for the selected framework.

Explain which variables need to be configured in:

- Development
- Preview
- Production

---

# 54. VERCEL PREVIEW DEPLOYMENTS

Take advantage of Vercel's preview deployments.

The intended workflow is:

```text
Create feature branch
        ↓
Make changes
        ↓
Commit changes
        ↓
Push to GitHub
        ↓
Vercel Preview Deployment
        ↓
Test feature
        ↓
Merge into main
        ↓
Production Deployment
```

Keep the project compatible with this workflow.

Avoid hard-coding localhost URLs.

Use environment variables for URLs that differ between environments.

---

# 55. SUPABASE + VERCEL CONFIGURATION

Make sure authentication works correctly after deployment.

Pay particular attention to:

### Supabase Auth

Configure appropriate redirect URLs for:

```text
Local development
Vercel preview
Production
```

Google OAuth must also use the correct production/preview callback configuration.

Password recovery links must work correctly after deployment.

Do not assume that authentication working on localhost means it will automatically work on Vercel.

Document the required Supabase Auth URL configuration.

---

# 56. PRODUCTION READINESS

Before declaring the project deployment-ready, check:

### Frontend

- No localhost URLs accidentally used in production
- No hard-coded secrets
- Correct production environment variables
- Responsive layout
- No console errors
- No broken routes
- Proper loading/error states

### Supabase

- RLS enabled
- RLS policies tested
- Storage policies tested
- Authentication configured
- OAuth configured
- MFA configured
- Password recovery configured

### Vercel

- Build succeeds
- Production environment variables configured
- Preview deployment works
- Production deployment works

### Git

- `.env` is ignored
- No secrets in Git history
- README is up to date
- Repository structure is clean

---

# 57. DEPLOYMENT DOCUMENTATION

Add a deployment section to the README explaining how to deploy the project to Vercel.

The documentation should explain:

1. Push project to GitHub.
2. Import repository into Vercel.
3. Configure environment variables.
4. Deploy.
5. Configure Supabase authentication redirect URLs.
6. Configure Google OAuth if enabled.
7. Test authentication.
8. Test database access.
9. Test profile image uploads.
10. Test production note creation/editing.

Keep this documentation understandable for someone who is also learning.

---

# 58. DEVELOPMENT + DEPLOYMENT RULE

Every significant feature should be developed with production deployment in mind.

Do not build something that only works locally.

The project should remain deployable throughout development.

Recommended workflow:

```text
FEATURE
   ↓
Develop locally
   ↓
Test locally
   ↓
Git commit
   ↓
Push branch
   ↓
Vercel Preview
   ↓
Test preview
   ↓
Fix issues
   ↓
Merge to main
   ↓
Vercel Production
```

When I ask you to implement a feature, consider:

- Local development
- Git version control
- Supabase integration
- Vercel deployment
- Production security

as part of the implementation.