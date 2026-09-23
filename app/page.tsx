"use client";

import { useEffect, useState } from "react";
import { Badge, Card, CardTitle, ProgressBar } from "@/components/ui";

type RunLogEntry = {
  id: string;
  name: string;
  title: string;
  listName: string;
  timestamp: string;
  status: "sent" | "skipped-duplicate" | "failed";
  reason?: string;
};

type TodayRun = {
  totalSent: number;
  dailyCap: number;
  byList: { listId: string; listName: string; sent: number }[];
  log: RunLogEntry[];
  paused: boolean;
};

type Health = {
  acceptanceRate7d: number;
  acceptanceRate30d: number;
  positiveReplyRate7d: number;
  positiveReplyRate30d: number;
  pendingCount: number;
  pendingCapWarningAt: number;
  status: "green" | "yellow" | "red";
};

export default function DashboardPage() {
  const [run, setRun] = useState<TodayRun | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [pausing, setPausing] = useState(false);

  useEffect(() => {
    fetch("/api/run/today").then((r) => r.json()).then(setRun);
    fetch("/api/health").then((r) => r.json()).then(setHealth);
  }, []);

  async function togglePause() {
    if (!run) return;
    setPausing(true);
    const res = await fetch("/api/run/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !run.paused }),
    });
    const data = await res.json();
    setRun({ ...run, paused: data.paused });
    setPausing(false);
  }

  if (!run || !health) {
    return <div className="text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Today's Run</h1>
          <p className="text-sm text-gray-500">Agent 1 — outbound connection requests across all active lists</p>
        </div>
        <button
          onClick={togglePause}
          disabled={pausing}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            run.paused
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-red-50 text-red-700 hover:bg-red-100"
          }`}
        >
          {run.paused ? "Resume sending" : "Pause sending"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardTitle subtitle="Shared cap across all active lists">Send progress</CardTitle>
          <ProgressBar value={run.totalSent} max={run.dailyCap} />
          <div className="mt-4 space-y-2">
            {run.byList.map((l) => (
              <div key={l.listId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{l.listName}</span>
                <span className="font-medium text-gray-900">{l.sent} sent</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Account health</CardTitle>
          <div className="flex items-center gap-2">
            <Badge>{health.status}</Badge>
            <span className="text-xs text-gray-500">vs LinkedIn caps</span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Acceptance rate (7d)</dt>
              <dd className="font-medium">{Math.round(health.acceptanceRate7d * 100)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Positive reply rate (7d)</dt>
              <dd className="font-medium">{Math.round(health.positiveReplyRate7d * 100)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Pending requests</dt>
              <dd className="font-medium">
                {health.pendingCount} / {health.pendingCapWarningAt}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <CardTitle subtitle="Live log of today's dispatch attempts">Activity</CardTitle>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
              <th className="py-2">Name</th>
              <th className="py-2">Title</th>
              <th className="py-2">List</th>
              <th className="py-2">Time</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {run.log.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-900">{entry.name}</td>
                <td className="py-2 text-gray-600">{entry.title}</td>
                <td className="py-2 text-gray-600">{entry.listName}</td>
                <td className="py-2 text-gray-500">{entry.timestamp}</td>
                <td className="py-2">
                  <Badge>{entry.status}</Badge>
                  {entry.reason && <span className="ml-2 text-xs text-gray-400">{entry.reason}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
