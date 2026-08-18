# UES Reliability Dashboard

Next.js 16 (App Router) + Prisma 7 (Neon Postgres, via `@prisma/adapter-neon`) + Auth.js v5 credentials login. See `../BUILD_SPEC.md` for the full spec this implements and `../prototype.jsx` for the UI/UX source of truth.

## Setup

1. Copy `.env` and fill in real values:
   - `DATABASE_URL` — Neon connection string (Neon Console → your project → Connection Details)
   - `AUTH_SECRET` — random secret, generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `RESEND_API_KEY` / `DIGEST_FROM_EMAIL` — only needed for the weekly digest email job
   - `CRON_SECRET` — shared secret checked by the two `/api/cron/*` routes; Vercel sends this automatically as a Bearer token when you set `CRON_SECRET` as a Vercel env var

2. Install dependencies and apply the schema:
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

## Demo logins

Seeded by `prisma/seed.ts`, password `password123` for all three:

| Email | Role |
|---|---|
| `viewer@ues.edu` | viewer — read-only |
| `tech@ues.edu` | technician — log issues, quick-update, add notes |
| `manager@ues.edu` | manager — everything above, plus resolve/edit/delete |

## Structure

- `prisma/schema.prisma` — full data model (BUILD_SPEC.md section 1)
- `src/auth.ts` / `src/proxy.ts` — Auth.js credentials login + route protection. Note: this is `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the convention, and the `proxy` runtime is always `nodejs` (unlike the old `middleware.ts` edge default), which is required here since this file imports Prisma + bcryptjs via `@/auth`.
- `src/lib/data/*` — read queries
- `src/lib/actions/*` — server actions (mutations), each starting with a `requireRole()` check — see BUILD_SPEC.md section 4
- `src/app/(dashboard)/*` — the seven pages (Overview, Locations, Equipment, Equipment profile, Active Issues, Issue History, Reports)
- `src/app/api/cron/*` — nightly downtime-rollup and weekly digest email, meant to run via Vercel Cron (see `vercel.json`)

## Known gaps / next steps

- Document uploads (`documents.fileUrl`) are seeded with placeholder URLs — wiring a real upload flow to Vercel Blob/R2/S3 is not yet built.
- Weekly digest email is implemented but untested end-to-end (needs a real `RESEND_API_KEY`).
- Phase 2 (AI maintenance-history lookup / RAG) is intentionally deferred — see BUILD_SPEC.md.
