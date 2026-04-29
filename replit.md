# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Hosts the **Shikkha AI** project — a free Bengali AI study/exam-prep app for Bangladeshi students.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, wouter, TanStack Query, Tailwind, framer-motion, recharts, lucide-react
- **AI**: Anthropic via Replit AI Integrations proxy (`claude-sonnet-4-6`, max_tokens 8192), SSE streaming

## Artifacts

- `artifacts/api-server` — Express API at `/api`
- `artifacts/shikkha-ai` — Shikkha AI web app at `/`
- `artifacts/mockup-sandbox` — Canvas component sandbox

## Shikkha AI features

- Bilingual UI (Bengali primary)
- 8 subjects, 31 chapters, 66 MCQs, 7 model tests pre-seeded
- MCQ practice with instant feedback + explanations
- Timed model tests with question palette and result breakdown
- Progress dashboard (subject-wise accuracy, streak, level)
- Leaderboard (current user vs. seeded competitors)
- AI tutor chat (streaming responses in Bengali)
- No emojis anywhere — including AI responses (system prompt enforces this)
- Single-user app (no auth) — `userStats` table holds the one user

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push --force` — push DB schema changes (dev only)
- Seed DB: `cd artifacts/api-server && pnpm exec esbuild src/seed.ts --bundle --platform=node --format=cjs --outfile=dist/seed.cjs && node dist/seed.cjs` (idempotent)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
