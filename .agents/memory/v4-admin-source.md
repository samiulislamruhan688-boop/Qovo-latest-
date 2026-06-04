---
name: V4 Admin & Source features
description: Soft-delete/trash system, error reports table, year explorer, admin panel — key decisions and patterns.
---

## Soft Delete
- `questions.deletedAt timestamp` column added; all read queries must filter `isNull(questions.deletedAt)`.
- DELETE /api/questions/:id now soft-deletes (backward compat). Explicit soft-delete: PATCH /api/questions/:id/trash.
- Restore: PATCH /api/questions/:id/restore. Permanent: DELETE /api/questions/:id/permanent.
- Practice pages use DELETE (soft-delete), admin page uses PATCH /trash for clarity.

**Why:** Keep quiz history intact; allow accidental-delete recovery without complex versioning.

## Error Reports Table
- `error_reports` table in `lib/db/src/schema/errorReports.ts`. Exported from `lib/db/src/schema/index.ts`.
- Routes: POST /api/questions/:id/report, GET /api/admin/reports, DELETE /api/admin/reports/:id.

## Admin Router
- `artifacts/api-server/src/routes/admin.ts` registered in routes/index.ts as `adminRouter`.
- Handles: trash CRUD, bulk ops, advanced search, error reports.
- Admin page at `/admin` only visible in sidebar when `localStorage.getItem("qovo-admin-mode") === "1"`.

## Source Page (Utsho 3.0)
- Rewritten with two tabs: "উৎস অনুযায়ী" (source drill-down) and "সাল অনুযায়ী" (year drill-down).
- Source insight shown on subjects step: GET /api/source-nav/insight?source=... returns { totalQuestions, totalSubjects, totalChapters, recentQuestions }.
- Year explorer endpoints: /source-nav/years, /year-subjects, /year-chapters, /year-questions.

## api-client-react
- `useGetSubjects` does NOT exist in `@workspace/api-client-react`. Use direct `useQuery` with `fetch("/api/subjects")` instead.

**How to apply:** Before using any hook from api-client-react, verify it exists in the generated file.
