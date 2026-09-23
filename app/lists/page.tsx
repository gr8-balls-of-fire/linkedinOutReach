"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, Toggle } from "@/components/ui";

type OutreachList = {
  id: string;
  name: string;
  searchUrl: string;
  draftMessage: string;
  active: boolean;
  priority: number;
};

const EMPTY_FORM = { name: "", searchUrl: "", draftMessage: "" };

export default function ListsPage() {
  const [lists, setLists] = useState<OutreachList[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function refresh() {
    fetch("/api/lists").then((r) => r.json()).then(setLists);
  }

  useEffect(refresh, []);

  async function toggleActive(id: string, active: boolean) {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, active } : l)));
    await fetch(`/api/lists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
  }

  async function deleteList(id: string) {
    setLists((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/lists/${id}`, { method: "DELETE" });
  }

  function startEdit(list: OutreachList) {
    setEditingId(list.id);
    setForm({ name: list.name, searchUrl: list.searchUrl, draftMessage: list.draftMessage });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function saveList() {
    if (!form.name || !form.searchUrl || !form.draftMessage) return;
    setSaving(true);
    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId ?? undefined, active: true, priority: lists.length + 1, ...form }),
    });
    setSaving(false);
    cancelEdit();
    refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Lists &amp; Drafts</h1>
        <p className="text-sm text-gray-500">
          Each list is a Sales Navigator search plus its own connection-request draft. All active lists share the
          single daily send cap set in Settings.
        </p>
      </div>

      <Card>
        <CardTitle subtitle="Merge tags: {{firstName}}, {{company}}, {{title}}">
          {editingId ? "Edit list" : "Add a new list"}
        </CardTitle>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500">List name</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. CFOs — Fintech"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Sales Navigator search URL</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="https://www.linkedin.com/sales/search/people?..."
              value={form.searchUrl}
              onChange={(e) => setForm({ ...form, searchUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Connection request draft</label>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              rows={3}
              placeholder="Hi {{firstName}}, ..."
              value={form.draftMessage}
              onChange={(e) => setForm({ ...form, draftMessage: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveList}
              disabled={saving}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              {editingId ? "Save changes" : "Add list"}
            </button>
            {editingId && (
              <button onClick={cancelEdit} className="rounded-md px-4 py-2 text-sm font-medium text-gray-500">
                Cancel
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {lists
          .sort((a, b) => a.priority - b.priority)
          .map((list) => (
            <Card key={list.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">Priority {list.priority}</span>
                    <h3 className="text-sm font-semibold text-gray-900">{list.name}</h3>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-400">{list.searchUrl}</p>
                  <p className="mt-2 text-sm text-gray-600">{list.draftMessage}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle checked={list.active} onChange={(active) => toggleActive(list.id, active)} label="Active" />
                  <button
                    onClick={() => startEdit(list)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteList(list.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
