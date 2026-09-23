# Spexsure Outreach — Product & Engineering Context

## Product
**Spexsure Outreach** — a two-agent LinkedIn Sales Navigator prospecting engine: Agent 1 sends a capped daily
batch of personalized connection requests across one or more target lists; Agent 2 runs a day later, finds
inbound replies, tags their intent, and produces a daily digest so the user can follow up.

**Spec:** `outreach.md` (original PRD — see "Deviations from outreach.md" below for what changed after review)
**Status (2026-09-23):** Real backend built — file-backed JSON store, Playwright-driven LinkedIn automation for
both agents, manual "run now" triggers in the UI, Task Scheduler registration scripts. Not yet installer-packaged.
Live end-to-end test with 2 real contacts pending (needs the user to complete the LinkedIn login step — see
"How to actually test this" below). Agent 3 (LinkedIn → verified email finder) and a self-built lightweight
email verifier were discussed and explicitly deferred to a later phase — not in scope yet. GitHub public repo
created and pushed: `gr8-balls-of-fire/linkedinOutReach`.

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
- **List source: search URL OR CSV import.** A list can be sourced either from a Sales Navigator search URL or
  from a pasted/uploaded CSV export (Name/Title/Company/LinkedIn URL columns). CSV import exists because there's
  no LinkedIn API to walk search-result pages without session automation — CSV export is LinkedIn's own native,
  lower-risk feature for the "who to contact" half of the problem. `search_url` lists are recognized by the data
  model but **live scraping of them is not implemented** — Agent 1 currently only sends to `csv`-sourced leads
  and logs a skip note for `search_url` lists. Revisit if/when that's needed.
- **No paid LinkedIn API exists for any of this.** Corrected mid-conversation: there is no official third-party
  API for Sales Navigator search or sending connection requests. Automation happens via a real, authenticated
  browser session (Playwright, driving the user's own logged-in LinkedIn) — same category of tool as
  Unipile/PhantomBuster/Dux-Soup, just self-built and free instead of a paid hosted service. This is also why
  the original PRD's dedicated-IP/proxy and randomized-delay requirements exist: they're mitigations against
  LinkedIn detecting the automation, not features of an API.
- **A lightweight, self-built email verifier (DNS MX + SMTP `RCPT TO` handshake, no paid API) is feasible and
  explicitly deferred to Phase 2.** Main blocker to validate first: most residential/office ISPs block outbound
  port 25, which this technique requires — test that before investing further.

## NEXT TASK — dual-channel sending (scoped 2026-09-23, not started)
Current build only ever sends a standard LinkedIn **connection request + note**
(`sendConnectionRequest()` in `lib/linkedin/actions.ts`, via a normal `linkedin.com/in/...` profile page).
The user flagged this as wrong for part of the intended use: some lists should go out as regular connection
requests, but lists targeting people reached via **Sales Navigator should use InMail** instead — a proper
long-form intro message, not a short connect note.

What needs to change:
- **Per-list channel choice.** Add a `channel: "connection_request" | "inmail"` field to `OutreachList`
  (`lib/store.ts`), surfaced as a selector on the Lists page next to source type.
- **Connection request** stays as-is: short note (~300 char cap), sent via the existing profile-page Connect
  flow, works for any LinkedIn account.
- **InMail is a different automation surface entirely** — it's a Sales Navigator feature, sent through
  Sales Navigator's own messaging UI (`linkedin.com/sales/...`, not `linkedin.com/in/...`), consumes InMail
  credits, doesn't require the recipient to accept anything first, and supports a subject + long-form body
  (unlike the short connection note). Needs its own Playwright function, e.g. `sendInmail()` in
  `lib/linkedin/actions.ts` — not written yet. Likely also needs a subject field added to the list's draft
  message data, not just a body.
- **Requires the user's LinkedIn account to actually have Sales Navigator** for InMail lists to work at all —
  worth a settings-level check/warning rather than a silent failure.
- **Agent 2 impact:** replies to InMail messages land in Sales Navigator's own inbox
  (`linkedin.com/sales/inbox`), which may be a different page/DOM than the regular messaging inbox
  (`linkedin.com/messaging/`) that `readRecentInboxMessages()` currently reads. Agent 2 likely needs to check
  both inboxes, tagging which channel each reply came in on.
- This should land **before** running the live 2-person test, since which channel is used changes what
  actually gets sent.

## Tech decision: web app on localhost, not a packaged install
Matches the rest of the Heuristicworks stack (Spexsure, ArcAI, Meridian) — Next.js dev server on `localhost`,
no Electron/native packaging. Rationale: zero packaging/signing overhead, reuses existing tooling/conventions,
and a one-line path to a real Vercel deploy later if needed. Tradeoff accepted: requires `npm run dev` running
in a terminal rather than a double-click desktop icon.

## Current build status
- **UI: built**, all 5 screens live and manually verified (curl 200s on every route + API endpoint).
- **Backend: real, file-backed.** `lib/store.ts` reads/writes `data/*.json` on disk — survives restarts and
  process kills (every write is synchronous, so there's no in-memory state to lose). No HubSpot or email/Slack
  integration — explicitly deferred; digest lives in the dashboard only for now.
- **LinkedIn automation: Playwright**, driving the user's own real logged-in session (not a paid API — see
  deviations above for why). Session is saved once via a headed-browser login flow and reused headlessly by
  both agents.
- **Agent 1 (`scripts/agent1-outbound.ts`)**: reads active lists + settings from `data/`, respects the shared
  daily/weekly cap, skips already-contacted profiles (`data/contacted.json`), sends a connection request + note
  via Playwright to each `csv`-sourced lead within budget, random delay between sends, logs every attempt to
  `data/run-log/<date>.json`, adds sent ones to `data/pending.json`.
- **Agent 2 (`scripts/agent2-digest.ts`)**: reads the LinkedIn messaging inbox via Playwright, matches senders
  against `data/pending.json` by name, classifies intent with a **keyword-based classifier** (`lib/intent.ts` —
  no LLM call, no API key needed; swapping in a real LLM call later only means changing that one function's
  body), writes matched replies to `data/digest/<date>.json`.
- **Manual "run now" triggers wired into the UI** so this can be tested without waiting for a schedule:
  Dashboard has "Run Agent 1 now", Digest page has "Check for replies now". Both spawn the real script and show
  its console output inline.
- **Auto-shutdown**: the dashboard pings `/api/heartbeat` every 20s while a browser tab is open
  (`components/app-shell.tsx`); `instrumentation.ts` starts a watchdog on server boot that exits the process
  after 60s with no ping. Nothing to persist on exit — see above.
- **Task Scheduler scripts written** (`scripts/register-tasks.ps1` / `unregister-tasks.ps1`) — create/remove the
  two no-admin-required scheduled tasks, reading actual configured times out of `data/settings.json` /
  `data/notifications.json`. **Not yet wired into an installer** — run manually for now.
- **Not yet built**: the Inno Setup installer, portable-Node bundling, hidden-console `.vbs` launcher. These
  were scoped in conversation but not started — the current priority is validating the live LinkedIn mechanism
  works at all before packaging it.

## How to actually test this (needs you, not just me)
I can't complete the LinkedIn login or watch your 2 test contacts reply — that part is inherently yours:
1. `npm run connect-linkedin` — opens a real, visible Chromium window. Log into LinkedIn in it normally. Once
   you land on your feed, the script detects it and saves the session to `data/linkedin-session.json` (gitignored,
   never commit this file — it's your live session).
2. In the dashboard (`npm run dev`, then the Lists page), add a list with source type **CSV import**, containing
   your 2 test contacts' names + LinkedIn profile URLs, and a draft message.
3. On the Dashboard, click **"Run Agent 1 now"**. Watch the output panel — it'll say `Sent to <name>` for each,
   or explain why it skipped/failed.
4. Once your contacts reply, go to the Digest page and click **"Check for replies now"**. It should show their
   replies tagged by intent.
5. Report back what actually happened (especially any Playwright selector failures in the output — the
   `sendConnectionRequest` / `readRecentInboxMessages` selectors in `lib/linkedin/actions.ts` are best-effort
   against LinkedIn's current DOM and are the most likely thing to need repair).

## Repo structure
```
spexsureOutReach/
├── CLAUDE.md                    ← this file
├── outreach.md                  ← original PRD (see deviations above)
├── package.json
├── next.config.js               ← experimental.instrumentationHook: true (needed for the auto-shutdown watchdog)
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── instrumentation.ts           ← starts the heartbeat watchdog on server boot
├── data/                        ← gitignored. lists.json, settings.json, notifications.json, pending.json,
│                                    contacted.json, run-state.json, linkedin-session.json, run-log/<date>.json,
│                                    digest/<date>.json. Created on first run by lib/store.ts's bootstrap().
├── lib/
│   ├── data-file.ts             ← readJson/writeJson/listFiles helpers over data/
│   ├── store.ts                 ← file-backed data layer; same function signatures the API routes call
│   ├── intent.ts                ← classifyIntent(text) — keyword-based, swap for an LLM call later
│   ├── merge-tags.ts            ← renderTemplate() for {{firstName}}/{{company}}/{{title}}, firstNameOf()
│   ├── heartbeat.ts             ← recordHeartbeat() + startWatchdog() — auto-shutdown after 60s idle
│   ├── run-script.ts            ← spawns a tsx script, captures stdout/stderr, used by the "run now" API routes
│   └── linkedin/
│       ├── session.ts           ← sessionPath()/hasSession()/sessionSavedAt() over data/linkedin-session.json
│       └── actions.ts           ← sendConnectionRequest(), readRecentInboxMessages() — Playwright, best-effort
│                                    selectors against LinkedIn's DOM, most likely thing to need repair
├── scripts/
│   ├── connect-linkedin.ts      ← headed browser login flow, saves session (npm run connect-linkedin)
│   ├── agent1-outbound.ts       ← real send logic (npm run agent1 / Task Scheduler)
│   ├── agent2-digest.ts         ← real reply-detection + tagging logic (npm run agent2 / Task Scheduler)
│   ├── register-tasks.ps1       ← creates the 2 no-admin scheduled tasks, reads times from data/*.json
│   └── unregister-tasks.ps1     ← removes them
├── components/
│   ├── app-shell.tsx            ← sidebar nav shell + heartbeat ping every 20s
│   └── ui.tsx                   ← Card, CardTitle, Badge, ProgressBar, Toggle — shared primitives
└── app/
    ├── layout.tsx
    ├── globals.css
    ├── page.tsx                 ← Dashboard: send progress, activity log, health, pause/resume, "Run Agent 1 now"
    ├── lists/page.tsx           ← Lists & Drafts: search-URL or CSV-import source, per-list draft, priority
    ├── pending/page.tsx         ← Pending Queue: outstanding requests, age, auto-withdraw countdown, manual withdraw
    ├── digest/page.tsx          ← Response Digest: date picker, intent counts, reply table, "Check for replies now"
    ├── settings/page.tsx        ← Caps, send window, real LinkedIn connect button + status, digest delivery
    └── api/
        ├── lists/route.ts, lists/[id]/route.ts
        ├── settings/route.ts
        ├── run/today/route.ts, run/pause/route.ts
        ├── pending/route.ts, pending/[id]/route.ts
        ├── digest/route.ts, digest/[id]/route.ts
        ├── notifications/route.ts
        ├── health/route.ts
        ├── heartbeat/route.ts        ← records a ping; watchdog in lib/heartbeat.ts checks it
        ├── linkedin/status/route.ts  ← GET — is there a saved session
        ├── linkedin/connect/route.ts ← POST — spawns connect-linkedin.ts detached (opens a visible browser)
        └── agents/run-outbound/route.ts, agents/run-digest/route.ts ← POST — spawn agent1/agent2, wait, return output
```

## Tech stack
| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.35 App Router, TypeScript |
| Styling | Tailwind CSS (brand color `#4f6ef7`, matches Spexsure indigo) |
| Backend | File-backed JSON store (`lib/store.ts` + `data/*.json`), exposed via Next.js route handlers |
| LinkedIn automation | Playwright (`playwright` + Chromium), driving the user's own real session — free, self-hosted, no paid API/service. Session saved via `scripts/connect-linkedin.ts`, reused headlessly by both agents |
| Script runner | `tsx` — runs the TypeScript agent scripts directly (`npm run agent1` / `agent2` / `connect-linkedin`) without a separate build step |
| Scheduling | Windows Task Scheduler (native, free, no admin rights needed) via `scripts/register-tasks.ps1` — not n8n/Make, decided against per-list automation platform in favor of a local install |
| Intent classification | Keyword-based (`lib/intent.ts`) — no LLM call, no API key. Swappable later |
| CRM | None — explicitly deferred. Digest replies are tracked in the dashboard only for now (`hubspotUrl` field kept empty, UI hides the link when absent) |

## API seam
Every page talks to `/api/*` route handlers rather than importing `lib/store.ts` directly into components. This
held up through the real-backend build: `lib/store.ts`'s function signatures didn't change when it went from
in-memory to file-backed, and the agent scripts import the exact same functions the API routes use — one source
of truth for reads/writes, whether it's a page, an API route, or a scheduled script touching the data.

## Running locally
```
npm install
npx playwright install chromium   # one-time, ~300MB
npm run dev
```
Next.js will pick the next free port if 3000 is taken (was on 3001 during this build).

## Known limitations / fragile spots
- `lib/linkedin/actions.ts` selectors are best-effort against LinkedIn's current DOM — not verified against a
  real account by me, since that needs your login. Most likely thing to break first.
- `search_url`-sourced lists are not scraped — only `csv`-sourced leads actually get contacted right now.
- Auto-withdrawal of stale (>14 day) pending requests is bookkeeping-only — nothing yet visits LinkedIn's sent-
  invitations page to actually click "Withdraw" there.
- Email verifier (Phase 2) not started; port-25 outbound reachability from your network is unvalidated.
- No installer yet — Task Scheduler scripts exist but aren't wired into a packaged install flow.

## Key decisions log
[2026-09-23] Web app on localhost (Next.js), not a packaged desktop install — see rationale above
[2026-09-23] UI + stub backend built first; real backend build gated on UI/UX review and go-ahead
[2026-09-23] Agent 3 (LinkedIn → verified email) scoped but put on hold, not built
[2026-09-23] Daily/weekly send caps are global across all active lists, not per-list
[2026-09-23] No LLM-generated outreach copy — user supplies the draft message per list
[2026-09-23] Public GitHub repo created: gr8-balls-of-fire/linkedinOutReach; code pushed
[2026-09-23] Windows-only distribution target; batch file + free installer (Inno Setup), not Electron/Tauri
[2026-09-23] Console hidden via a .vbs launcher wrapper (Windows Script Host, free, built-in) — not built yet
[2026-09-23] Agent cron work runs via Windows Task Scheduler (native, free, no admin needed), decoupled from
             the on-demand dashboard — not a persistent background service
[2026-09-23] Dashboard auto-shuts-down after 60s with no heartbeat ping; safe because every store write is
             already synchronous to data/*.json — nothing in-memory to lose
[2026-09-23] Lists can source leads from a Sales Navigator search URL or a pasted/uploaded CSV export
[2026-09-23] No official LinkedIn API exists for any of this — corrected mid-conversation; automation is
             Playwright driving the user's own real session, chosen over a paid service (Unipile) for cost
[2026-09-23] HubSpot integration deferred indefinitely; dashboard is the system of record for now
[2026-09-23] Lightweight self-built email verifier (DNS MX + SMTP handshake) deferred to Phase 2
[2026-09-23] Decided sending must support two channels per list: plain LinkedIn connection request (current
             build) for LinkedIn-only contacts, and Sales Navigator InMail for long-form intros where the
             account has Sales Navigator — scoped, not built, next task for the following session

---

## → HANDOFF (session paused 2026-09-23, updated same day)

**Repo:** clean, everything committed and pushed to `main` on `gr8-balls-of-fire/linkedinOutReach` (public).
Dev server stopped — nothing left running.

**Start next session on "NEXT TASK — dual-channel sending" above, not the live test.** The user caught that
Agent 1 only ever sends a plain LinkedIn connection request, but the intent is: plain-LinkedIn contacts get a
connection request, Sales-Navigator-reachable contacts should get InMail (long-form intro). That's a real
behavior + data-model change (per-list `channel` field, a new `sendInmail()` automation function, Agent 2
needing to check a second inbox for InMail replies) — see that section for the full breakdown. Build this
**before** running the live 2-person test, since it changes what actually gets sent.

**After dual-channel sending is in**, resume the original plan: run through "How to actually test this" —
`npm run connect-linkedin`, add a list with the 2 test contacts, "Run Agent 1 now", then "Check for replies
now" once they reply. Ask the user for that output first if they say testing already happened — it determines
whether the next fix is DOM-selector repair (`lib/linkedin/actions.ts`, flagged as the likely failure point,
still untested against a live account) or something else.

**Still on the shelf, unchanged:** the Inno Setup installer + portable Node + hidden `.vbs` launcher (scoped,
not built), Agent 3 (LinkedIn → verified email), the self-built SMTP email verifier (needs a port-25
reachability check first), `search_url` list scraping (only `csv`-sourced leads are contacted today).

**Don't re-litigate these decisions** unless something concrete changed: free/self-hosted over paid services
throughout (Playwright over Unipile, Task Scheduler over a background service, Inno Setup over Electron/Tauri),
JSON files over a database, no LLM calls yet anywhere in the pipeline, HubSpot out of scope.
