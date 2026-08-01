---
name: Multi-user auth and legacy data
description: Google OAuth session architecture, guest mode design, legacy data migration, and auth context patterns.
---

## Auth architecture (current)
- **Backend**: `requireAuth` in `artifacts/api-server/src/lib/auth.ts` — checks `req.session.userId` only. No dev bridge (removed after Google credentials were added).
- **Google OAuth**: Passport GoogleStrategy in `artifacts/api-server/src/routes/auth.ts`. Only initialised when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars are present. Callback URL uses `REPLIT_DEV_DOMAIN`.
- **Session store**: `connect-pg-simple` with `user_sessions` table. Table provisioned manually (NOT at runtime — runtime DDL fails in esbuild bundles because `table.sql` is not copied to dist). `createTableIfMissing: false`.
- **Auth flow**: `GET /api/auth/google` → Google → `GET /api/auth/google/callback` → session set → redirect `/?auth=success`.
- **Logout**: `POST /api/auth/logout` destroys session and clears `qovo.sid` cookie.

## Frontend AuthContext
- File: `artifacts/shikkha-ai/src/contexts/AuthContext.tsx`
- Fetches `/api/auth/me` on mount with `credentials: "include"`.
- Sets `user = null` on 401; `isLoading = false` when done.
- Cleans up `?auth=success` / `?auth=failed` URL params after OAuth redirect.
- Wrapped in `App.tsx` around the full component tree (inside `QueryClientProvider`, outside `WouterRouter`).

**Why:** A single source of truth for auth state — avoids per-page session fetches and race conditions.

## Guest mode design
- Global curriculum (subjects, chapters, questions, tests, source nav) — public, no auth.
- Private data (progress, activity, test attempts, conversations, leaderboard) — `requireAuth` on backend.
- Profile page: shows `SignInCard` if `!user`.
- Progress page: shows `SignInCard` if `!user`.
- Home page: shows hero/banner/quick-actions for everyone; stats and activity/tests sections hidden for guests, replaced by `SignInCard`.
- Shared component: `artifacts/shikkha-ai/src/components/auth/SignInCard.tsx` — glassmorphism card with Google G icon button, `window.location.href = "/api/auth/google"`.

## Legacy data migration
- Pre-auth data (930 answers, 5 test attempts, 2 stats rows, 3 conversations) preserved by assigning to `legacy-single-user` account.
- All private tables have `user_id` NOT NULL FK to `users`.
- Dev bridge (auto-login legacy user when Google not configured) was REMOVED once Google credentials were added.

## Data ownership rules
- **Global**: subjects, chapters, questions, tests, source_nav — never filter by userId.
- **Private**: user_answers, test_attempts, user_stats, conversations — always scope to `req.session.userId`.
- Admin routes use `x-admin-token` PIN mechanism and bypass ownership for global CRUD.

**How to apply:** Before adding a new API route, determine if it touches global curriculum data (no auth needed) or private user data (requireAuth + userId scoping).

## Production notes
- Production deploy needs the `user_sessions` table to exist — it is provisioned via the schema push in `scripts/post-merge.sh` (`pnpm --filter db push`). Verify after first production deploy.
- Callback URL is constructed from `REPLIT_DEV_DOMAIN` for development. In production, the Replit proxy handles domain routing correctly.
