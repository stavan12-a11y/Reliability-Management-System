# UES Reliability Dashboard — Build Spec

Reference prototype: `ues-reliability-dashboard.jsx` (React artifact, in-memory state only — this spec describes what to replace that in-memory state with).

## Stack
- Next.js (App Router) + Neon (serverless Postgres) via Prisma or Drizzle ORM
- Auth.js (NextAuth) or Clerk for authentication — Neon has no built-in auth, unlike Supabase
- Resend (or similar) for the weekly email digest
- Deploy target: Vercel (Neon integrates natively with the Vercel-Neon marketplace connector)

**Why this changes from the Supabase version:** Neon is just the Postgres database — no bundled auth, no bundled row-level security UI, no bundled storage. That means: (1) pick an auth provider separately, (2) enforce permissions in your API/server-action layer instead of via Supabase's RLS policies, (3) use a plain storage bucket (Vercel Blob, Cloudflare R2, or S3) for documents instead of Supabase Storage. Everything else below — schema, business logic, KPI calculations — is identical regardless of which Postgres provider you use.

## 1. Data model

### `locations`
| column | type | notes |
|---|---|---|
| id | text (pk) | e.g. `central`, `west`, `south` |
| name | text | e.g. "Central Utility Plant" |

### `systems`
| column | type | notes |
|---|---|---|
| id | text (pk) | e.g. `chw`, `steam` |
| location_id | fk → locations.id | |
| name | text | e.g. "Chilled Water System" |
| icon | text | icon key for UI (chiller/boiler/pump/etc) |

### `equipment`
| column | type | notes |
|---|---|---|
| id | text (pk) | e.g. `CHLR003` — internal short ID |
| asset_number | text | e.g. `AST-10032` — the user-facing asset tag |
| system_id | fk → systems.id | |
| location_id | fk → locations.id | denormalized for query convenience |
| class | text | Chiller / Boiler / Pump / Heat converter / etc |
| manufacturer | text | |
| model | text | |
| serial | text | |
| status | enum | `available` / `limited` / `unavailable` — **derived**, see note below |
| crit_likelihood | int (1-5) | |
| crit_consequence | int (1-5) | |
| crit_score | int | `likelihood * consequence`, or store computed |
| nameplate | jsonb | flexible per-class fields (Tonnage, MAWP, Flow, etc — see prototype's `nameplate` objects per class) |
| downtime_days_90d | numeric | **derived/cached**, see availability note below |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz, nullable | **soft delete** — see note below |

**Status derivation:** `status` should be set automatically whenever an issue is logged/resolved/downgraded against that asset — not manually edited independent of issues. Keep it as a real column (for fast filtering) but only ever write to it from the issue-mutation logic, never from a generic "edit equipment" form.

**Soft delete:** the prototype does a hard cascade delete. For production, use `deleted_at` instead — filter it out of all normal queries, but don't actually drop rows. This protects historical downtime/availability data from a mis-click. Add a "Deleted equipment" admin view if useful later.

### `issues` (active)
| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| asset_id | fk → equipment.id | |
| condition | enum | `unavailable` / `limited` |
| description | text | |
| identified_at | date | |
| next_step | text | |
| responsible | text (or fk → users, see auth section) | |
| parts_eta | date, nullable | |
| return_eta | date, nullable | |
| wo_number | text, nullable | AIM work order reference |
| overdue | boolean | **derived**: `true` if `return_eta < today` and still open |
| notes | jsonb or separate `issue_notes` table | timestamped log entries (see Updates tab) |
| created_by, updated_by | fk → users | |
| created_at, updated_at | timestamptz | |

Recommend a separate `issue_notes` table instead of jsonb if notes need to be queried/sorted independently:
```
issue_notes: id, issue_id (fk), body, created_by (fk), created_at
```

### `issue_history` (resolved)
| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| asset_id | fk → equipment.id | |
| description | text | "what was done" |
| root_cause | text | |
| failure_mode | enum, nullable | controlled vocabulary — see Phase 2 section. Nullable since old backfilled records may not have it yet |
| component | enum, nullable | controlled vocabulary, scoped per equipment class — see Phase 2 section |
| resolved_at | date | |
| identified_at | date | copied from the source issue, needed to compute downtime |
| downtime_days | int | **computed** as `resolved_at - identified_at` at resolution time, then stored (don't recompute live — see below) |
| wo_number | text, nullable | |
| resolved_by | fk → users | |
| created_at | timestamptz | |

**Why store `downtime_days` instead of computing it live from dates every time:** once resolved, the number shouldn't change even if someone edits the record later. Compute once at resolution, persist it.

**On `failure_mode`/`component` being on the table from day one:** even though the AI lookup (Phase 2) is deferred, adding these two columns now costs nothing and avoids a schema migration + backfill later. The Resolve modal in the UI can optionally prompt for them at resolution time even before Phase 2 exists — capturing the classification as issues are naturally resolved is far cheaper than retrofitting it onto old records later.

### `maintenance_log`
| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| asset_id | fk → equipment.id | |
| date | date | |
| type | enum | Overhaul / Component replacement / Test / etc |
| description | text | |
| wo_number | text, nullable | |
| created_by | fk → users | |

### `documents`
| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| asset_id | fk → equipment.id | |
| name | text | |
| type | enum | Manual / Certificate / Report / Photo |
| file_url | text | Vercel Blob / R2 / S3 URL |
| uploaded_by | fk → users | |
| uploaded_at | timestamptz | |

## 2. Resolution workflow (business logic, not just CRUD)

This is the one place with real logic beyond simple field updates — implement as a Postgres function or a server action, not client-side only:

**Resolve fully:**
1. Insert into `issue_history` (copy relevant fields, compute `downtime_days = resolved_at - identified_at`)
2. Delete (or archive) the row from `issues`
3. Update `equipment.status = 'available'`
4. Update `equipment.downtime_days_90d` (add this resolution's downtime, and separately run a periodic job — see below — to decay/roll off downtime older than 90 days)

**Downgrade (unavailable → limited):**
1. Update `issues.condition = 'limited'`
2. Append a note to `issue_notes`
3. Update `equipment.status = 'limited'`
4. Issue stays in `issues`, nothing moves to history

## 3. Availability / KPI calculation

The prototype's 90-day availability % used a rough running total. For production, two options:

- **Simpler (good enough for v1):** keep `downtime_days_90d` as a cached column on `equipment`, recalculated by a Vercel Cron Job that sums `issue_history.downtime_days` for records where `resolved_at` is within the last 90 days, for that asset. This avoids expensive live joins on every page load.
- **More accurate (later):** compute on-demand via a view/query that sums `issue_history` downtime in the trailing window — fine once data volume is still small.

MTTR, fleet availability, critical-tier availability — all derive from the same `issue_history` + `equipment` join, scoped differently per page (all equipment / one location's equipment / one asset), matching the prototype's `fleetKpis()` logic.

## 4. Auth & multi-user

Neon has no built-in auth, so pick a provider:
- **Auth.js (NextAuth)** — free, self-hosted, works cleanly with Next.js + Prisma/Drizzle adapters for Neon. Good default if you want no extra vendor.
- **Clerk** — hosted, faster to wire up, free tier is generous, nicer prebuilt UI for login/user management. Good default if you want less to build yourself.

Either way, store users in your own `users` table in Neon (Auth.js/Clerk both support syncing their session user into your database).

**Roles** (simplest useful split):
- `viewer` — read-only, sees everything
- `technician` — can log issues, quick-update, add notes
- `manager` — everything technician can do, plus resolve, edit, delete

**Enforcing permissions:** since Neon doesn't have Supabase-style Row-Level Security policies built into the client SDK, enforce roles in your server actions / API routes — every mutation (log issue, edit, resolve, delete) checks the authenticated user's role before writing. Don't rely on hiding buttons in the UI alone, since that's not real security. (Postgres RLS policies are technically still available on raw Neon since it's Postgres — but for a Next.js app, checking role in the server action is simpler and is where you'd want the logic anyway.)

Every write should stamp `created_by`/`updated_by`/`resolved_by` with the real authenticated user ID — this directly replaces the prototype's hardcoded `"You"` / `"Just now"` placeholders with real audit data.

## 5. Weekly email digest

- **Vercel Cron Job** (simplest with this stack) — hits a Next.js API route on a weekly schedule, which queries Neon and sends via Resend. Neon doesn't have Supabase's built-in `pg_cron`, so the scheduling lives in Vercel instead of the database.
- Query: count of unavailable/limited equipment, overdue issues, new issues since last digest, top 3 longest-open issues
- Render via Resend (or similar) — reuse the digest copy logic already prototyped in the Overview page's "Daily digest preview" (the text-generation part is done; only the send mechanism and schedule are new)
- Recipient list: a `digest_subscribers` table (user_id, frequency preference, optional location filter) rather than hardcoding emails

## 6. What to carry over directly from the prototype (no redesign needed)
- Full page layout/structure (Overview, Locations, Equipment, Equipment profile tabs, Active Issues, Issue History, Reports)
- Criticality tiering logic (`likelihood * consequence` → Critical/High/Medium/Low)
- The AIM boundary (no PM/work-order data duplicated — just `wo_number` as a reference/link)
- CSV export logic
- Empty states, KPI card layout per page

## 7. Suggested build order
1. Neon project + schema (via Prisma or Drizzle migrations)
2. Auth (Auth.js or Clerk) — login/signup, role assignment
3. Replace in-memory arrays with real queries (read-only pass first — get all pages rendering real data)
4. Wire up mutations (log/edit/resolve/delete) as server actions, with role checks
5. Nightly downtime-rollup job (Vercel Cron)
6. Weekly digest email job (Vercel Cron + Resend)
7. (Phase 2, once real historical data exists) AI maintenance-history lookup — see below

---

## Phase 2 — AI maintenance history lookup

**Do not build this until real historical WO data has been extracted and cleaned from AIM.** Retrieval quality depends entirely on having enough real, well-written history records — building this against near-empty sample data won't demonstrate anything useful. Treat this section as a design reference for later, not an immediate task.

### Goal
Let a technician or manager ask a plain-language question about an asset's history ("has this chiller had bearing problems before?") and get an answer grounded in — and citing — actual past work orders, not the model's general knowledge.

### Data prerequisite
Historical WO notes must first be extracted from AIM and cleaned into structured records (see `issue_history` and `maintenance_log` tables in the main schema above). Each cleaned record should also carry:
- `failure_mode` — controlled vocabulary (e.g. Bearing failure, Seal/gasket leak, Electrical fault, Control/instrumentation fault, Corrosion, Fouling, Overload, Human error) — fixed dropdown list, not free text, so it stays queryable
- `component` — controlled vocabulary, scoped per equipment class (e.g. for chillers: compressor, condenser, evaporator, control panel; for pumps: motor, bearing, seal, impeller)

Keep both as enums/lookup tables, not free text — free-text tags drift (bearing / brg / roller bearing) and quietly break both search and aggregate reporting.

### Architecture (RAG — retrieval-augmented generation)
1. **Embed** every cleaned `issue_history` and `maintenance_log` record (description + root cause + failure mode/component) using an embedding model (OpenAI `text-embedding-3-small` or similar). Store the vector alongside the record.
2. **Store vectors in Postgres via `pgvector`** — Neon supports the `pgvector` extension directly, so no separate vector database is needed. Add a `vector` column to `issue_history`/`maintenance_log`, index with `ivfflat` or `hnsw`.
3. **On a user question:**
   - Embed the question
   - Vector-similarity search against the relevant records — scoped to one asset by default (when asked from that asset's profile page), or across all assets for broader pattern questions (see below)
   - Pass only the top-matching records (not the whole history table) to the LLM along with the question, and instruct it to answer using only those records
4. **Always cite sources** — every answer must reference the specific WO number(s) it drew from, so the person can click through and verify. Never let the model answer from general knowledge alone; if nothing relevant is retrieved, say so rather than guessing.

### Where it lives in the UI
- **Primary entry point:** a chat panel/tab on the Equipment profile page, scoped to that asset by default — this is where the question naturally arises, since the person is already looking at that equipment.
- **Secondary entry point (more powerful, build later):** a cross-asset search — e.g. "have any of our boilers had this failure mode" — searching history across all equipment, not just one asset. This is where the failure_mode/component tagging pays off most, enabling real pattern analysis (e.g. "show all bearing failures across all pumps in the last 2 years").

### Extraction/cleanup workflow (manual, ongoing)
Since AIM's phase-based reports don't appear to expose free-text WO notes directly (confirmed during dashboard planning), notes will likely need to be pulled by opening individual WOs. Two things make this more tractable:
- Do the cleanup and classification (failure_mode + component tagging) in the same pass as extraction — don't do two separate passes over the same WOs.
- Standardize the target write-up format before starting extraction: asset, date, symptom, what was done, root cause (if determinable), failure mode, component, original WO number. This makes the historical batch and all future resolutions (which already capture this shape via the Resolve flow) consistent from day one.

