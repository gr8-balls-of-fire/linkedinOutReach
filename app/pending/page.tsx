"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui";

type PendingRequest = {
  id: string;
  name: string;
  listName: string;
  sentAt: string;
  ageDays: number;
};

export default function PendingPage() {
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [autoWithdrawDays, setAutoWithdrawDays] = useState(14);
  const [capWarningAt, setCapWarningAt] = useState(500);

  useEffect(() => {
    fetch("/api/pending").then((r) => r.json()).then(setPending);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setAutoWithdrawDays(s.autoWithdrawDays);
        setCapWarningAt(s.pendingCapWarningAt);
      });
  }, []);

  async function withdraw(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/pending/${id}`, { method: "DELETE" });
  }

  const nearCap = pending.length >= capWarningAt * 0.9;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Pending Requests</h1>
        <p className="text-sm text-gray-500">
          Sent but not yet accepted. Auto-withdrawn after {autoWithdrawDays} days to keep the queue under{" "}
          {capWarningAt}.
        </p>
      </div>

      {nearCap && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Approaching the {capWarningAt}-request pending ceiling — consider withdrawing stale requests sooner.
        </div>
      )}

      <Card>
        <CardTitle subtitle={`${pending.length} outstanding`}>Outstanding connection requests</CardTitle>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
              <th className="py-2">Name</th>
              <th className="py-2">List</th>
              <th className="py-2">Sent</th>
              <th className="py-2">Age</th>
              <th className="py-2">Auto-withdraw in</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {pending.map((p) => (
              <tr key={p.id} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-900">{p.name}</td>
                <td className="py-2 text-gray-600">{p.listName}</td>
                <td className="py-2 text-gray-500">{p.sentAt}</td>
                <td className="py-2 text-gray-500">{p.ageDays}d</td>
                <td className="py-2 text-gray-500">
                  {Math.max(autoWithdrawDays - p.ageDays, 0)}d
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => withdraw(p.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Withdraw now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
