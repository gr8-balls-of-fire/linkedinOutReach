// In-memory stub "backend". Resets on dev server restart.
// Swap these functions for real Unipile/HubSpot-backed calls later —
// route handlers in app/api/** are the seam that stays stable.

export type OutreachList = {
  id: string;
  name: string;
  searchUrl: string;
  draftMessage: string;
  active: boolean;
  priority: number;
};

export type GlobalSettings = {
  dailyCap: number;
  weeklyCap: number;
  sendDays: string[];
  sendStartTime: string;
  delayMinMinutes: number;
  delayMaxMinutes: number;
  autoWithdrawDays: number;
  pendingCapWarningAt: number;
  linkedinConnected: boolean;
  hubspotConnected: boolean;
};

export type RunLogEntry = {
  id: string;
  name: string;
  title: string;
  listId: string;
  listName: string;
  timestamp: string;
  status: "sent" | "skipped-duplicate" | "failed";
  reason?: string;
};

export type PendingRequest = {
  id: string;
  name: string;
  listId: string;
  listName: string;
  sentAt: string;
  ageDays: number;
};

export type IntentTag = "Meeting Request" | "Objection" | "Not Interested" | "Other";

export type DigestReply = {
  id: string;
  sender: string;
  listId: string;
  listName: string;
  snippet: string;
  tag: IntentTag;
  hubspotUrl: string;
  followedUp: boolean;
  timestamp: string;
};

export type NotificationSettings = {
  emailEnabled: boolean;
  emailAddress: string;
  slackEnabled: boolean;
  slackChannel: string;
  digestTime: string;
  instantAlertOnMeetingRequest: boolean;
};

const lists: OutreachList[] = [
  {
    id: "list-1",
    name: "CFOs — Fintech",
    searchUrl: "https://www.linkedin.com/sales/search/people?query=cfo+fintech",
    draftMessage:
      "Hi {{firstName}}, saw your work leading finance at {{company}} — would love to connect and share something relevant to fintech ops teams.",
    active: true,
    priority: 1,
  },
  {
    id: "list-2",
    name: "VP Eng — Series B SaaS",
    searchUrl: "https://www.linkedin.com/sales/search/people?query=vp+engineering+series+b",
    draftMessage:
      "Hi {{firstName}}, noticed {{company}} is scaling fast — connecting with a few engineering leaders in this space.",
    active: true,
    priority: 2,
  },
  {
    id: "list-3",
    name: "Product Leaders — Healthcare",
    searchUrl: "https://www.linkedin.com/sales/search/people?query=product+lead+healthcare",
    draftMessage: "Hi {{firstName}}, would love to connect given your background in healthcare product.",
    active: false,
    priority: 3,
  },
];

const settings: GlobalSettings = {
  dailyCap: 20,
  weeklyCap: 100,
  sendDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  sendStartTime: "09:00",
  delayMinMinutes: 3,
  delayMaxMinutes: 10,
  autoWithdrawDays: 14,
  pendingCapWarningAt: 500,
  linkedinConnected: true,
  hubspotConnected: true,
};

const runLog: RunLogEntry[] = [
  { id: "r1", name: "Jordan Lee", title: "CFO", listId: "list-1", listName: "CFOs — Fintech", timestamp: "09:04 AM", status: "sent" },
  { id: "r2", name: "Priya Nair", title: "VP Engineering", listId: "list-2", listName: "VP Eng — Series B SaaS", timestamp: "09:11 AM", status: "sent" },
  { id: "r3", name: "Sam Whitfield", title: "CFO", listId: "list-1", listName: "CFOs — Fintech", timestamp: "09:19 AM", status: "skipped-duplicate", reason: "Already contacted 2026-08-30" },
  { id: "r4", name: "Devon Park", title: "VP Engineering", listId: "list-2", listName: "VP Eng — Series B SaaS", timestamp: "09:27 AM", status: "sent" },
  { id: "r5", name: "Alexis Romero", title: "CFO", listId: "list-1", listName: "CFOs — Fintech", timestamp: "09:35 AM", status: "failed", reason: "LinkedIn API timeout" },
];

const pending: PendingRequest[] = [
  { id: "p1", name: "Morgan Ito", listId: "list-1", listName: "CFOs — Fintech", sentAt: "2026-09-10", ageDays: 13 },
  { id: "p2", name: "Casey Nguyen", listId: "list-2", listName: "VP Eng — Series B SaaS", sentAt: "2026-09-08", ageDays: 15 },
  { id: "p3", name: "Riley Chen", listId: "list-1", listName: "CFOs — Fintech", sentAt: "2026-09-15", ageDays: 8 },
];

const digestByDate: Record<string, DigestReply[]> = {
  "2026-09-22": [
    {
      id: "d1",
      sender: "Jordan Lee",
      listId: "list-1",
      listName: "CFOs — Fintech",
      snippet: "Thanks for reaching out — happy to grab 15 min next week, does Tuesday work?",
      tag: "Meeting Request",
      hubspotUrl: "https://app.hubspot.com/contacts/0/contact/12345",
      followedUp: false,
      timestamp: "11:14 AM",
    },
    {
      id: "d2",
      sender: "Priya Nair",
      listId: "list-2",
      listName: "VP Eng — Series B SaaS",
      snippet: "Not the right time for us, budget's locked for this quarter.",
      tag: "Objection",
      hubspotUrl: "https://app.hubspot.com/contacts/0/contact/12346",
      followedUp: false,
      timestamp: "01:47 PM",
    },
    {
      id: "d3",
      sender: "Sam Whitfield",
      listId: "list-1",
      listName: "CFOs — Fintech",
      snippet: "Thanks, but not interested at the moment.",
      tag: "Not Interested",
      hubspotUrl: "https://app.hubspot.com/contacts/0/contact/12347",
      followedUp: true,
      timestamp: "03:02 PM",
    },
  ],
};

const notificationSettings: NotificationSettings = {
  emailEnabled: true,
  emailAddress: "pm@heuristicworks.com",
  slackEnabled: true,
  slackChannel: "#outreach-digest",
  digestTime: "17:00",
  instantAlertOnMeetingRequest: true,
};

export function getLists() {
  return lists;
}

export function setListActive(id: string, active: boolean) {
  const l = lists.find((x) => x.id === id);
  if (l) l.active = active;
  return l;
}

export function upsertList(input: Omit<OutreachList, "id"> & { id?: string }) {
  if (input.id) {
    const existing = lists.find((x) => x.id === input.id);
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
  }
  const created: OutreachList = {
    id: `list-${Date.now()}`,
    priority: lists.length + 1,
    ...input,
  };
  lists.push(created);
  return created;
}

export function deleteList(id: string) {
  const idx = lists.findIndex((x) => x.id === id);
  if (idx >= 0) lists.splice(idx, 1);
}

export function getSettings() {
  return settings;
}

export function updateSettings(patch: Partial<GlobalSettings>) {
  Object.assign(settings, patch);
  return settings;
}

export function getTodayRun() {
  const totalSent = runLog.filter((r) => r.status === "sent").length;
  const byList = lists.map((l) => ({
    listId: l.id,
    listName: l.name,
    sent: runLog.filter((r) => r.listId === l.id && r.status === "sent").length,
  }));
  return { totalSent, dailyCap: settings.dailyCap, byList, log: runLog, paused: runPaused };
}

let runPaused = false;
export function setRunPaused(paused: boolean) {
  runPaused = paused;
  return runPaused;
}

export function getPending() {
  return pending;
}

export function withdrawPending(id: string) {
  const idx = pending.findIndex((p) => p.id === id);
  if (idx >= 0) pending.splice(idx, 1);
}

export function getDigestDates() {
  return Object.keys(digestByDate).sort().reverse();
}

export function getDigest(date: string) {
  return digestByDate[date] ?? [];
}

export function setReplyTag(date: string, replyId: string, tag: IntentTag) {
  const reply = digestByDate[date]?.find((r) => r.id === replyId);
  if (reply) reply.tag = tag;
  return reply;
}

export function setReplyFollowedUp(date: string, replyId: string, followedUp: boolean) {
  const reply = digestByDate[date]?.find((r) => r.id === replyId);
  if (reply) reply.followedUp = followedUp;
  return reply;
}

export function getNotificationSettings() {
  return notificationSettings;
}

export function updateNotificationSettings(patch: Partial<NotificationSettings>) {
  Object.assign(notificationSettings, patch);
  return notificationSettings;
}

export function getHealth() {
  return {
    acceptanceRate7d: 0.24,
    acceptanceRate30d: 0.21,
    positiveReplyRate7d: 0.08,
    positiveReplyRate30d: 0.06,
    pendingCount: pending.length,
    pendingCapWarningAt: settings.pendingCapWarningAt,
    status: "green" as "green" | "yellow" | "red",
  };
}
