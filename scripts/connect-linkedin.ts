// Run with: npm run connect-linkedin
// Opens a real, visible Chromium window. Log into LinkedIn normally in it —
// nothing you type here is seen by anything but LinkedIn. Once you land on
// your feed, this script detects it and saves the session to
// data/linkedin-session.json so agent1/agent2 can reuse it headlessly.

import { chromium } from "playwright";
import { sessionPath } from "../lib/linkedin/session";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.linkedin.com/login");
  console.log("Browser opened. Log into LinkedIn in that window now.");
  console.log("Waiting up to 5 minutes for login to complete...");

  const deadline = Date.now() + 5 * 60 * 1000;
  let loggedIn = false;
  while (Date.now() < deadline) {
    const url = page.url();
    if (/linkedin\.com\/feed/.test(url)) {
      loggedIn = true;
      break;
    }
    await page.waitForTimeout(2000);
  }

  if (!loggedIn) {
    console.error("Timed out waiting for login. Nothing was saved. Run again when ready.");
    await browser.close();
    process.exit(1);
  }

  await context.storageState({ path: sessionPath() });
  console.log(`Session saved to ${sessionPath()}`);
  await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
