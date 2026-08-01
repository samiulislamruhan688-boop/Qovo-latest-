---
name: Multi-user auth and legacy data
description: Rules for preserving the original learner while separating private progress after the multi-user migration.
---

Global curriculum entities remain shared and must never receive a user filter. Only answers, attempts, stats, and conversations are private per user.

**Why:** The original app stored one learner's activity without an owner. Filtering global content or requiring a new user before migration makes the app appear empty and hides valid historical progress.

**How to apply:** Keep ownership derivation server-side, migrate orphaned private rows to the preserved legacy learner, send session cookies on client requests, and keep any development-only legacy session fallback disabled in production.