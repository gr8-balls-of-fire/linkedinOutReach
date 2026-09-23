// Run with: npm run agent1  (also what Task Scheduler will call daily)
// Sends connection requests, respecting the shared daily/weekly cap, skipping
// already-contacted profiles, logging every attempt to data/run-log/<date>.json.

import { chromium } from "playwright";
import {
  appendRunLogEntry,
  getContactedUrls,
  getLists,
  getRunLog,
  getSettings,
  markContacted,
  addPending,
  type RunLogEntry,
} from "../lib/store";
import { hasSession, sessionPath } from "../lib/linkedin/session";
import { sendConnectionRequest } from "../lib/linkedin/actions";
import { renderTemplate, firstNameOf } from "../lib/merge-tags";
import { todayIso } from "../lib/data-file";
import { readJson } from "../lib/data-file";

function last7DaysSentCount(): number {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    total += getRunLog(iso).filter((r) => r.status === "sent").length;
  }
  return total;
}

async function main() {
  const runState = readJson("run-state.json", { paused: false });
  if (runState.paused) {
    console.log("Run is paused from the dashboard. Skipping today's send.");
    return;
  }

  if (!hasSession()) {
    console.error("No LinkedIn session found. Run `npm run connect-linkedin` first and log in.");
    process.exit(1);
  }

  const settings = getSettings();
  const today = todayIso();
  const sentToday = getRunLog(today).filter((r) => r.status === "sent").length;
  const sentThisWeek = last7DaysSentCount();
  const remainingToday = settings.dailyCap - sentToday;
  const remainingWeek = settings.weeklyCap - sentThisWeek;
  const budget = Math.min(remainingToday, remainingWeek);

  if (budget <= 0) {
    console.log(`Cap already reached today (sentToday=${sentToday}, sentThisWeek=${sentThisWeek}). Nothing to send.`);
    return;
  }
  console.log(`Send budget for this run: ${budget}`);

  const lists = getLists()
    .filter((l) => l.active)
    .sort((a, b) => a.priority - b.priority);

  const contacted = new Set(getContactedUrls());
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: sessionPath() });
  const page = await context.newPage();

  let sentCount = 0;

  outer: for (const list of lists) {
    if (list.sourceType !== "csv") {
      console.log(`Skipping "${list.name}" — search-URL scraping isn't wired up yet, only CSV/manual leads are.`);
      continue;
    }
    for (const lead of list.leads ?? []) {
      if (sentCount >= budget) break outer;
      if (!lead.linkedinUrl) continue;

      const logBase = {
        id: `${today}-${Math.random().toString(36).slice(2, 8)}`,
        name: lead.name,
        title: lead.title ?? "",
        listId: list.id,
        listName: list.name,
        timestamp: new Date().toLocaleTimeString(),
      };

      if (contacted.has(lead.linkedinUrl)) {
        appendRunLogEntry(today, { ...logBase, status: "skipped-duplicate", reason: "Already contacted previously" });
        continue;
      }

      const note = renderTemplate(list.draftMessage, {
        firstName: firstNameOf(lead.name),
        company: lead.company,
        title: lead.title,
      });

      try {
        const result = await sendConnectionRequest(page, lead.linkedinUrl, note);
        if (result === "sent") {
          appendRunLogEntry(today, { ...logBase, status: "sent" });
          markContacted(lead.linkedinUrl);
          addPending({
            id: `${today}-${Math.random().toString(36).slice(2, 8)}`,
            name: lead.name,
            linkedinUrl: lead.linkedinUrl,
            listId: list.id,
            listName: list.name,
            sentAt: today,
            ageDays: 0,
          });
          sentCount++;
          console.log(`Sent to ${lead.name}`);
        } else {
          appendRunLogEntry(today, { ...logBase, status: "skipped-duplicate", reason: result });
          console.log(`Skipped ${lead.name}: ${result}`);
        }
      } catch (err) {
        appendRunLogEntry(today, { ...logBase, status: "failed", reason: String(err) });
        console.error(`Failed for ${lead.name}:`, err);
      }

      if (sentCount < budget) {
        const delayMinutes = settings.delayMinMinutes + Math.random() * (settings.delayMaxMinutes - settings.delayMinMinutes);
        console.log(`Waiting ${delayMinutes.toFixed(1)} minutes before next send...`);
        await page.waitForTimeout(delayMinutes * 60 * 1000);
      }
    }
  }

  await browser.close();
  console.log(`Done. Sent ${sentCount} connection request(s) this run.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
