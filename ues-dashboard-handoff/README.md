# UES Reliability Dashboard — handoff to Claude Code

Everything here is ready to hand to Claude Code (desktop app, VS Code extension, or terminal) to start the real build.

## Files
- `prototype.jsx` — the fully-designed, click-through React prototype built in this conversation. Every page, KPI, modal, and interaction pattern reflects real decisions made with the UES stakeholder (location-primary nav, AIM boundary, criticality tiers, resolve/downgrade workflow, etc). Treat this as the UI/UX source of truth.
- `BUILD_SPEC.md` — the technical spec: full Postgres schema (Neon), auth approach, business logic for resolving/downgrading issues, KPI calculation approach, weekly digest email, and a deferred Phase 2 design for AI-powered maintenance history lookup (RAG over cleaned AIM work order notes).

## Suggested first prompt to Claude Code
"Read BUILD_SPEC.md and prototype.jsx. Set up a new Next.js + Neon project implementing the schema and pages described, starting with the build order in section 7 of the spec."

## Known open decisions (flagged in the spec, not yet resolved)
- Auth provider: Auth.js vs Clerk — spec leans Clerk for speed, Auth.js for no extra vendor
- Soft-delete vs hard-delete on equipment (spec recommends soft delete via `deleted_at`)
- Phase 2 (AI history lookup) is intentionally deferred until real historical WO data exists
