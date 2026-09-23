"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, Toggle } from "@/components/ui";

type GlobalSettings = {
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

type NotificationSettings = {
  emailEnabled: boolean;
  emailAddress: string;
  slackEnabled: boolean;
  slackChannel: string;
  digestTime: string;
  instantAlertOnMeetingRequest: boolean;
};

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [linkedin, setLinkedin] = useState<{ connected: boolean; savedAt: string | null }>({
    connected: false,
    savedAt: null,
  });
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  function refreshLinkedinStatus() {
    fetch("/api/linkedin/status").then((r) => r.json()).then(setLinkedin);
  }

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
    fetch("/api/notifications").then((r) => r.json()).then(setNotifications);
    refreshLinkedinStatus();
  }, []);

  async function connectLinkedin() {
    setConnecting(true);
    setConnectMessage(null);
    const res = await fetch("/api/linkedin/connect", { method: "POST" });
    const data = await res.json();
    setConnectMessage(data.message);
    setConnecting(false);
    // Login happens in a separate visible window; poll status a couple times
    // rather than assuming completion.
    const poll = setInterval(refreshLinkedinStatus, 5000);
    setTimeout(() => clearInterval(poll), 5 * 60 * 1000);
  }

  async function saveSettings(patch: Partial<GlobalSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    flashSaved();
  }

  async function saveNotifications(patch: Partial<NotificationSettings>) {
    if (!notifications) return;
    const next = { ...notifications, ...patch };
    setNotifications(next);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    flashSaved();
  }

  function flashSaved() {
    setSavedAt(new Date().toLocaleTimeString());
  }

  function toggleDay(day: string) {
    if (!settings) return;
    const has = settings.sendDays.includes(day);
    const sendDays = has ? settings.sendDays.filter((d) => d !== day) : [...settings.sendDays, day];
    saveSettings({ sendDays });
  }

  if (!settings || !notifications) {
    return <div className="text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Global caps, schedule, connections, and digest delivery.</p>
        </div>
        {savedAt && <span className="text-xs text-gray-400">Saved {savedAt}</span>}
      </div>

      <Card>
        <CardTitle subtitle="Applies across all active lists combined">Platform safety caps</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Daily send cap</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={settings.dailyCap}
              onChange={(e) => saveSettings({ dailyCap: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Rolling 7-day cap</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={settings.weeklyCap}
              onChange={(e) => saveSettings({ weeklyCap: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Delay between sends — min (minutes)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={settings.delayMinMinutes}
              onChange={(e) => saveSettings({ delayMinMinutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Delay between sends — max (minutes)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={settings.delayMaxMinutes}
              onChange={(e) => saveSettings({ delayMaxMinutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Auto-withdraw after (days)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={settings.autoWithdrawDays}
              onChange={(e) => saveSettings({ autoWithdrawDays: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Pending queue warning at</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={settings.pendingCapWarningAt}
              onChange={(e) => saveSettings({ pendingCapWarningAt: Number(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Send window</CardTitle>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => {
            const active = settings.sendDays.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="mt-4 w-40">
          <label className="block text-xs font-medium text-gray-500">Start time</label>
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={settings.sendStartTime}
            onChange={(e) => saveSettings({ sendStartTime: e.target.value })}
          />
        </div>
      </Card>

      <Card>
        <CardTitle subtitle="Agent 1 and Agent 2 both reuse this saved browser session">Connections</CardTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">LinkedIn</div>
              <div className="text-xs text-gray-500">
                {linkedin.connected
                  ? `Session saved ${linkedin.savedAt ? new Date(linkedin.savedAt).toLocaleString() : ""}`
                  : "Opens a real browser window for you to log into LinkedIn normally"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  linkedin.connected ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {linkedin.connected ? "Connected" : "Not connected"}
              </span>
              <button
                onClick={connectLinkedin}
                disabled={connecting}
                className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
              >
                {linkedin.connected ? "Reconnect" : "Connect LinkedIn"}
              </button>
            </div>
          </div>
          {connectMessage && <p className="text-xs text-gray-500">{connectMessage}</p>}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">HubSpot</div>
              <div className="text-xs text-gray-500">Deferred — replies are tracked in the dashboard for now</div>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              Not configured
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle subtitle="Agent 2 sends its daily digest here">Digest delivery</CardTitle>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Email digest</div>
              <input
                className="mt-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                value={notifications.emailAddress}
                onChange={(e) => saveNotifications({ emailAddress: e.target.value })}
              />
            </div>
            <Toggle
              checked={notifications.emailEnabled}
              onChange={(emailEnabled) => saveNotifications({ emailEnabled })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Slack digest</div>
              <input
                className="mt-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                value={notifications.slackChannel}
                onChange={(e) => saveNotifications({ slackChannel: e.target.value })}
              />
            </div>
            <Toggle
              checked={notifications.slackEnabled}
              onChange={(slackEnabled) => saveNotifications({ slackEnabled })}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500">Digest send time</label>
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={notifications.digestTime}
              onChange={(e) => saveNotifications({ digestTime: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Instant alert on "Meeting Request"</div>
              <div className="text-xs text-gray-500">Bypasses the daily digest for high-priority replies</div>
            </div>
            <Toggle
              checked={notifications.instantAlertOnMeetingRequest}
              onChange={(instantAlertOnMeetingRequest) => saveNotifications({ instantAlertOnMeetingRequest })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
