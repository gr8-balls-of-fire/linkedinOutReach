# Spexsure Outreach — Product & Engineering Context

## Product
**Spexsure Outreach** — a two-agent LinkedIn Sales Navigator prospecting engine: Agent 1 sends a capped daily
batch of personalized connection requests across one or more target lists; Agent 2 runs a day later, finds
inbound replies, tags their intent, and produces a daily digest so the user can follow up.

**Spec:** `outreach.md` (original PRD — see "Deviations from outreach.md" below for what changed after review)
**Status (2026-09-23):** UI scaffolded with a stubbed in-memory backend, pending review. Agent 3 (LinkedIn →
verified email finder) discussed and put on hold — not in scope yet.

## Why this exists
Standalone lead-gen tool to feed top-of-funnel pipeline (e.g. for Spexsure and other Heuristicworks products),
independent of the Spexsure SaaS product itself. Not part of the spexsure.com codebase.

## Deviations from outreach.md (as clarified 2026-09-23)
- **No AI-generated messages.** The user writes/pastes the connection-request draft per list. `outreach.md`'s
  "Agent 1 generates a personalized two-sentence message via LLM" step is *not* built — replaced by a per-list
  draft template with merge tags (`{{firstName}}`, `{{company}}`, `{{title}}`).
- **Multiple simultaneous lists share one daily cap.** The user may run several Sales Navigator searches
  ("lists") at once, but total outbound connection requests across *all* active lists stays at 20/day (100/rolling
  7 days) — the cap is global, not per-list.
- **Agent 2 timing:** runs the day *after* Agent 1 dispatches, specifically to catch replies to requests sent the
  prior day (not a rolling "past 24 hours from now" window as originally scoped).
- **Agent 3 (email verification) — on hold.** Originally proposed as a follow-on: given a LinkedIn profile, find
  and verify a work email via a provider (Hunter.io / Apollo.io / RocketReach), triggered after connection
  acceptance (not before, to avoid spending lookup credits on people who never connect). Not started.

## Tech decision: web app on localhost, not a packaged install
Matches the rest of the Heuristicworks stack (Spexsure, ArcAI, Meridian) — Next.js dev server on `localhost`,
no Electron/native packaging. Rationale: zero packaging/signing overhead, reuses existing tooling/conventions,
and a one-line path to a real Vercel deploy later if needed. Tradeoff accepted: requires `npm run dev` running
in a terminal rather than a double-click desktop icon.

## Current build status
- **UI: built**, all 5 screens live and manually verified (curl 200s on every route + API endpoint).
- **Backend: stubbed.** `lib/store.ts` is an in-memory mock store — no real Unipile/LinkedAPI, HubSpot, or
  email/Slack integration yet. Resets on dev server restart. This is intentional: UI/UX is under review before
  wiring the real backend.
- **Next step:** user reviews UI/UX at `localhost:3001` (port 3000 was occupied during dev), then gives go-ahead
  to build the real backend (n8n/Make orchestration or direct API integration — not yet decided).

## Repo structure
```
spexsureOutReach/
├── CLAUDE.md              ← this file
├── outreach.md            ← original PRD (see deviations above)
├── package.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── lib/
│   └── store.ts           ← stub "backend" — in-memory data + functions; swap for real integrations later
├── components/
│   ├── app-shell.tsx      ← sidebar nav shell (Dashboard / Lists / Pending / Digest / Settings)
│   └── ui.tsx             ← Card, CardTitle, Badge, ProgressBar, Toggle — shared primitives
└── app/
    ├── layout.tsx
    ├── globals.css
    ├── page.tsx           ← Dashboard: today's send progress, per-list breakdown, activity log, health, pause/resume
    ├── lists/page.tsx     ← Lists & Drafts: add/edit/delete list, active toggle, priority
    ├── pending/page.tsx   ← Pending Queue: outstanding requests, age, auto-withdraw countdown, manual withdraw
    ├── digest/page.tsx    ← Response Digest: date picker, intent-tag counts, per-reply table (retag, mark followed up)
    ├── settings/page.tsx  ← Global caps, send window, connections status, digest delivery (email/Slack/instant alert)
    └── api/
        ├── lists/route.ts, lists/[id]/route.ts
        ├── settings/route.ts
        ├── run/today/route.ts, run/pause/route.ts
        ├── pending/route.ts, pending/[id]/route.ts
        ├── digest/route.ts, digest/[id]/route.ts
        ├── notifications/route.ts
        └── health/route.ts
```

## Tech stack
| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.35 App Router, TypeScript |
| Styling | Tailwind CSS (brand color `#4f6ef7`, matches Spexsure indigo) |
| Backend (current) | In-memory stub in `lib/store.ts`, exposed via Next.js route handlers |
| Backend (planned) | Not decided — likely n8n/Make orchestration per `outreach.md`, calling Unipile/LinkedAPI + HubSpot |
| CRM | HubSpot (not yet integrated — digest rows link out via placeholder `hubspotUrl`) |

## API seam for the real backend
Every page talks to `/api/*` route handlers rather than importing `lib/store.ts` data directly into components.
This is deliberate: when the real backend (n8n webhook, direct Unipile/HubSpot calls, or a real DB) is ready,
only the route handlers need to change — no page/component changes required.

## Running locally
```
npm install
npm run dev
```
Next.js will pick the next free port if 3000 is taken (was on 3001 during this build).

## Key decisions log
[2026-09-23] Web app on localhost (Next.js), not a packaged desktop install — see rationale above
[2026-09-23] UI + stub backend built first; real backend build gated on UI/UX review and go-ahead
[2026-09-23] Agent 3 (LinkedIn → verified email) scoped but put on hold, not built
[2026-09-23] Daily/weekly send caps are global across all active lists, not per-list
[2026-09-23] No LLM-generated outreach copy — user supplies the draft message per list
