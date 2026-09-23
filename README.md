# Spexsure Outreach

A local LinkedIn prospecting tool: sends a capped daily batch of personalized connection requests, then
checks for replies the next day and sorts them by intent.

## What it does

- Sends connection requests to a daily-capped list of prospects (default 20/day, 100/week)
- Uses a message template you write yourself — no AI-generated outreach copy
- Builds prospect lists from a Sales Navigator search URL or an imported CSV export
- Never contacts the same person twice
- Checks your LinkedIn inbox the next day for replies and tags each one — Meeting Request, Objection, Not
  Interested, or Other
- Runs entirely on your own machine using your own LinkedIn login — no third-party automation service, no data
  leaving your computer
- A dashboard to add/edit lists, set caps and schedule, watch today's send progress, and review the response
  digest

## How it works, in plain English

You give it one or more lists of people — either a Sales Navigator search link or a CSV of names and LinkedIn
profile URLs — along with a short connection-request message for each list. Every day, it works through those
lists and sends connection requests one at a time, waiting a few random minutes between each so it looks like
normal human use, and stops once it hits the daily cap shared across all your lists. It keeps a running log of
everyone it has ever contacted so nobody gets messaged twice, and a queue of requests still waiting to be
accepted.

The day after it sends requests, it opens your LinkedIn inbox and looks for replies from the people it
messaged. For each reply, it works out whether the person wants to schedule a meeting, is raising an objection,
isn't interested, or something else, and adds it to that day's digest so you can see at a glance who to follow
up with — without having to scroll back through LinkedIn yourself.

Both steps normally run on a schedule in the background, but you can also trigger either one on demand from the
dashboard to see the result immediately.

---

See [CLAUDE.md](CLAUDE.md) for full engineering context, current build status, and setup instructions.
