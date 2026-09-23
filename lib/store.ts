// File-backed store — data/*.json on disk, survives restarts and process kills.
// Same function signatures as the original in-memory stub, so route handlers
// in app/api/** and the agent scripts (scripts/agent1-outbound.mjs,
// scripts/agent2-digest.mjs) share this one seam.

import { ensureDataDir, listFiles, readJson, todayIso, writeJson } from "./data-file";

export type CsvLead = {
  name: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
};

export type OutreachList = {
  id: string;
  name: string;
  sourceType: "search_url" | "csv";
  searchUrl?: string;
  leads?: CsvLead[];
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
  linkedinUrl?: string;
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

const DEFAULT_LISTS: OutreachList[] = [
  {
    id: "list-1",
    name: "CFOs — Fintech",
    sourceType: "search_url",
    searchUrl: "https://www.linkedin.com/sales/search/people?query=cfo+fintech",
    draftMessage:
      "Hi {{firstName}}, saw your work leading finance at {{company}} — would love to connect and share something relevant to fintech ops teams.",
    active: true,
    priority: 1,
  },
  {
    id: "list-2",
    name: "VP Eng — Series B SaaS",
    sourceType: "search_url",
    searchUrl: "https://www.linkedin.com/sales/search/people?query=vp+engineering+series+b",
    draftMessage:
      "Hi {{firstName}}, noticed {{company}} is scaling fast — connecting with a few engineering leaders in this space.",
    active: true,
    priority: 2,
  },
];

const DEFAULT_SETTINGS: GlobalSettings = {
  dailyCap: 20,
  weeklyCap: 100,
  sendDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  sendStartTime: "09:00",
  delayMinMinutes: 3,
  delayMaxMinutes: 10,
  autoWithdrawDays: 14,
  pendingCapWarningAt: 500,
  linkedinConnected: false,
  hubspotConnected: false,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailEnabled: false,
  emailAddress: "",
  slackEnabled: false,
  slackChannel: "",
  digestTime: "17:00",
  instantAlertOnMeetingRequest: false,
};

function bootstrap() {
  ensureDataDir();
  ensureDataDir("run-log");
  ensureDataDir("digest");
  if (!listFiles(".").includes("lists.json")) writeJson("lists.json", DEFAULT_LISTS);
  if (!listFiles(".").includes("settings.json")) writeJson("settings.json", DEFAULT_SETTINGS);
  if (!listFiles(".").includes("notifications.json")) writeJson("notifications.json", DEFAULT_NOTIFICATIONS);
  if (!listFiles(".").includes("pending.json")) writeJson("pending.json", []);
  if (!listFiles(".").includes("contacted.json")) writeJson("contacted.json", []);
  if (!listFiles(".").includes("run-state.json")) writeJson("run-state.json", { paused: false });
}
bootstrap();

export function getLists(): OutreachList[] {
  return readJson("lists.json", DEFAULT_LISTS);
}

export function saveLists(lists: OutreachList[]) {
  writeJson("lists.json", lists);
}

export function setListActive(id: string, active: boolean) {
  const lists = getLists();
  const l = lists.find((x) => x.id === id);
  if (l) l.active = active;
  saveLists(lists);
  return l;
}

export function upsertList(input: Omit<OutreachList, "id"> & { id?: string }) {
  const lists = getLists();
  if (input.id) {
    const existing = lists.find((x) => x.id === input.id);
    if (existing) {
      Object.assign(existing, input);
      saveLists(lists);
      return existing;
    }
  }
  const created: OutreachList = {
    ...input,
    id: input.id ?? `list-${Date.now()}`,
  };
  lists.push(created);
  saveLists(lists);
  return created;
}

export function deleteList(id: string) {
  const lists = getLists().filter((x) => x.id !== id);
  saveLists(lists);
}

export function getSettings(): GlobalSettings {
  return readJson("settings.json", DEFAULT_SETTINGS);
}

export function updateSettings(patch: Partial<GlobalSettings>) {
  const settings = { ...getSettings(), ...patch };
  writeJson("settings.json", settings);
  return settings;
}

function runLogPath(date: string) {
  return `run-log/${date}.json`;
}

export function getRunLog(date: string): RunLogEntry[] {
  return readJson(runLogPath(date), []);
}

export function appendRunLogEntry(date: string, entry: RunLogEntry) {
  const log = getRunLog(date);
  log.push(entry);
  writeJson(runLogPath(date), log);
}

export function getTodayRun() {
  const date = todayIso();
  const log = getRunLog(date);
  const lists = getLists();
  const totalSent = log.filter((r) => r.status === "sent").length;
  const byList = lists.map((l) => ({
    listId: l.id,
    listName: l.name,
    sent: log.filter((r) => r.listId === l.id && r.status === "sent").length,
  }));
  const settings = getSettings();
  const runState = readJson("run-state.json", { paused: false });
  return { totalSent, dailyCap: settings.dailyCap, byList, log, paused: runState.paused };
}

export function setRunPaused(paused: boolean) {
  writeJson("run-state.json", { paused });
  return paused;
}

export function getPending(): PendingRequest[] {
  return readJson("pending.json", []);
}

export function savePending(pending: PendingRequest[]) {
  writeJson("pending.json", pending);
}

export function addPending(entry: PendingRequest) {
  const pending = getPending();
  pending.push(entry);
  savePending(pending);
}

export function withdrawPending(id: string) {
  savePending(getPending().filter((p) => p.id !== id));
}

export function getContactedUrls(): string[] {
  return readJson("contacted.json", []);
}

export function markContacted(linkedinUrl: string) {
  const contacted = getContactedUrls();
  if (!contacted.includes(linkedinUrl)) {
    contacted.push(linkedinUrl);
    writeJson("contacted.json", contacted);
  }
}

function digestPath(date: string) {
  return `digest/${date}.json`;
}

export function getDigestDates(): string[] {
  return listFiles("digest")
    .map((f) => f.replace(/\.json$/, ""))
    .sort()
    .reverse();
}

export function getDigest(date: string): DigestReply[] {
  return readJson(digestPath(date), []);
}

export function saveDigest(date: string, replies: DigestReply[]) {
  writeJson(digestPath(date), replies);
}

export function appendDigestReply(date: string, reply: DigestReply) {
  const replies = getDigest(date);
  replies.push(reply);
  saveDigest(date, replies);
}

export function setReplyTag(date: string, replyId: string, tag: IntentTag) {
  const replies = getDigest(date);
  const reply = replies.find((r) => r.id === replyId);
  if (reply) {
    reply.tag = tag;
    saveDigest(date, replies);
  }
  return reply;
}

export function setReplyFollowedUp(date: string, replyId: string, followedUp: boolean) {
  const replies = getDigest(date);
  const reply = replies.find((r) => r.id === replyId);
  if (reply) {
    reply.followedUp = followedUp;
    saveDigest(date, replies);
  }
  return reply;
}

export function getNotificationSettings(): NotificationSettings {
  return readJson("notifications.json", DEFAULT_NOTIFICATIONS);
}

export function updateNotificationSettings(patch: Partial<NotificationSettings>) {
  const settings = { ...getNotificationSettings(), ...patch };
  writeJson("notifications.json", settings);
  return settings;
}

export function getHealth() {
  const pending = getPending();
  const settings = getSettings();
  return {
    acceptanceRate7d: 0,
    acceptanceRate30d: 0,
    positiveReplyRate7d: 0,
    positiveReplyRate30d: 0,
    pendingCount: pending.length,
    pendingCapWarningAt: settings.pendingCapWarningAt,
    status: pending.length >= settings.pendingCapWarningAt * 0.9 ? ("yellow" as const) : ("green" as const),
  };
}
