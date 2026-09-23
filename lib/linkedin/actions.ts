import type { Page } from "playwright";

// LinkedIn's DOM changes without notice and isn't a stable contract — these
// selectors are best-effort, favoring aria-label/role (accessibility attrs
// tend to outlive CSS class churn) over class names. Expect to need repairs.

export type SendResult = "sent" | "already-connected" | "pending-already" | "failed";

export async function sendConnectionRequest(page: Page, profileUrl: string, note: string): Promise<SendResult> {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const connectButton = page.getByRole("button", { name: /^connect$/i }).first();
  if (!(await connectButton.isVisible().catch(() => false))) {
    const moreButton = page.getByRole("button", { name: /^more$/i }).first();
    if (await moreButton.isVisible().catch(() => false)) {
      await moreButton.click();
      const connectMenuItem = page.getByRole("button", { name: /^connect$/i }).first();
      if (await connectMenuItem.isVisible().catch(() => false)) {
        await connectMenuItem.click();
      } else {
        const alreadyPending = await page.getByText(/pending/i).first().isVisible().catch(() => false);
        return alreadyPending ? "pending-already" : "already-connected";
      }
    } else {
      return "already-connected";
    }
  } else {
    await connectButton.click();
  }

  await page.waitForTimeout(1000);
  const addNoteButton = page.getByRole("button", { name: /add a note/i }).first();
  if (await addNoteButton.isVisible().catch(() => false)) {
    await addNoteButton.click();
    const textarea = page.locator("textarea");
    await textarea.fill(note.slice(0, 300));
  }

  const sendButton = page.getByRole("button", { name: /^send( invitation)?$/i }).first();
  if (await sendButton.isVisible().catch(() => false)) {
    await sendButton.click();
    return "sent";
  }
  return "failed";
}

export type InboxMessage = {
  senderName: string;
  snippet: string;
  timestampLabel: string;
};

export async function readRecentInboxMessages(page: Page, maxThreads = 30): Promise<InboxMessage[]> {
  await page.goto("https://www.linkedin.com/messaging/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const threads = page.locator('li[class*="conversation-list"]');
  const count = Math.min(await threads.count(), maxThreads);
  const messages: InboxMessage[] = [];

  for (let i = 0; i < count; i++) {
    const thread = threads.nth(i);
    const senderName = (await thread.locator('[class*="participant-name"]').first().innerText().catch(() => "")).trim();
    const snippet = (await thread.locator('[class*="snippet"]').first().innerText().catch(() => "")).trim();
    const timestampLabel = (await thread.locator("time").first().innerText().catch(() => "")).trim();
    if (senderName) messages.push({ senderName, snippet, timestampLabel });
  }
  return messages;
}
