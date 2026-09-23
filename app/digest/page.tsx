"use client";

import { useEffect, useState } from "react";
import { Badge, Card, CardTitle } from "@/components/ui";

type IntentTag = "Meeting Request" | "Objection" | "Not Interested" | "Other";

type DigestReply = {
  id: string;
  sender: string;
  listName: string;
  snippet: string;
  tag: IntentTag;
  hubspotUrl: string;
  followedUp: boolean;
  timestamp: string;
};

const TAGS: IntentTag[] = ["Meeting Request", "Objection", "Not Interested", "Other"];

export default function DigestPage() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [replies, setReplies] = useState<DigestReply[]>([]);

  useEffect(() => {
    fetch("/api/digest")
      .then((r) => r.json())
      .then((data) => {
        setDates(data.dates);
        setSelectedDate(data.dates[0] ?? null);
      });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    fetch(`/api/digest?date=${selectedDate}`)
      .then((r) => r.json())
      .then(setReplies);
  }, [selectedDate]);

  async function updateTag(id: string, tag: IntentTag) {
    setReplies((prev) => prev.map((r) => (r.id === id ? { ...r, tag } : r)));
    await fetch(`/api/digest/${id}?date=${selectedDate}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
  }

  async function toggleFollowedUp(id: string, followedUp: boolean) {
    setReplies((prev) => prev.map((r) => (r.id === id ? { ...r, followedUp } : r)));
    await fetch(`/api/digest/${id}?date=${selectedDate}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followedUp }),
    });
  }

  const counts = TAGS.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = replies.filter((r) => r.tag === tag).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Response Digest</h1>
          <p className="text-sm text-gray-500">Agent 2 — inbound replies grouped by intent, one day after send</p>
        </div>
        <select
          className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={selectedDate ?? ""}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {TAGS.map((tag) => (
          <Card key={tag}>
            <div className="text-xs font-medium text-gray-500">{tag}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{counts[tag] ?? 0}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle subtitle={`${replies.length} replies on ${selectedDate ?? "—"}`}>Replies</CardTitle>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
              <th className="py-2">Sender</th>
              <th className="py-2">List</th>
              <th className="py-2">Message</th>
              <th className="py-2">Intent</th>
              <th className="py-2">HubSpot</th>
              <th className="py-2">Followed up</th>
            </tr>
          </thead>
          <tbody>
            {replies.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 align-top">
                <td className="py-3 font-medium text-gray-900">{r.sender}</td>
                <td className="py-3 text-gray-600">{r.listName}</td>
                <td className="max-w-xs py-3 text-gray-600">{r.snippet}</td>
                <td className="py-3">
                  <select
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                    value={r.tag}
                    onChange={(e) => updateTag(r.id, e.target.value as IntentTag)}
                  >
                    {TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1">
                    <Badge>{r.tag}</Badge>
                  </div>
                </td>
                <td className="py-3">
                  <a
                    href={r.hubspotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View contact
                  </a>
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={r.followedUp}
                    onChange={(e) => toggleFollowedUp(r.id, e.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
