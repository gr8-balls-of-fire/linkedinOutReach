// Run with: npm run agent2  (also what Task Scheduler will call daily, a day
// after agent1 dispatches). Reads the LinkedIn inbox, matches senders against
// people we've sent requests to, tags intent, writes today's digest file.

import { chromium } from "playwright";
import { appendDigestReply, getPending, savePending, type DigestReply } from "../lib/store";
import { hasSession, sessionPath } from "../lib/linkedin/session";
import { readRecentInboxMessages } from "../lib/linkedin/actions";
import { classifyIntent } from "../lib/intent";
import { todayIso } from "../lib/data-file";

function namesMatch(pendingName: string, inboxName: string): boolean {
  const a = pendingName.toLowerCase().trim();
  const b = inboxName.toLowerCase().trim();
  return a === b || b.includes(a) || a.includes(b);
}

async function main() {
  if (!hasSession()) {
    console.error("No LinkedIn session found. Run `npm run connect-linkedin` first and log in.");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: sessionPath() });
  const page = await context.newPage();

  const messages = await readRecentInboxMessages(page);
  await browser.close();

  const pending = getPending();
  const today = todayIso();
  let matchedCount = 0;

  for (const msg of messages) {
    const match = pending.find((p) => namesMatch(p.name, msg.senderName));
    if (!match || !msg.snippet) continue;

    const reply: DigestReply = {
      id: `${today}-${Math.random().toString(36).slice(2, 8)}`,
      sender: msg.senderName,
      listId: match.listId,
      listName: match.listName,
      snippet: msg.snippet,
      tag: classifyIntent(msg.snippet),
      hubspotUrl: "",
      followedUp: false,
      timestamp: msg.timestampLabel || new Date().toLocaleTimeString(),
    };
    appendDigestReply(today, reply);
    matchedCount++;
    console.log(`Matched reply from ${msg.senderName} -> tagged "${reply.tag}"`);
  }

  const stillPending = pending.filter((p) => !messages.some((m) => namesMatch(p.name, m.senderName)));
  savePending(stillPending);

  console.log(`Done. ${matchedCount} reply/replies matched and added to today's digest (${today}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
