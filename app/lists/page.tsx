"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardTitle, Toggle } from "@/components/ui";

type CsvLead = {
  name: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
};

type OutreachList = {
  id: string;
  name: string;
  sourceType: "search_url" | "csv";
  searchUrl?: string;
  leads?: CsvLead[];
  draftMessage: string;
  active: boolean;
  priority: number;
};

type FormState = {
  name: string;
  sourceType: "search_url" | "csv";
  searchUrl: string;
  csvText: string;
  draftMessage: string;
};

const EMPTY_FORM: FormState = { name: "", sourceType: "search_url", searchUrl: "", csvText: "", draftMessage: "" };

// Naive parser for a stub: assumes a header row with Name/Title/Company/LinkedIn URL columns.
// Doesn't handle quoted commas — fine for reviewing the UI, revisit before this touches real data.
function parseCsv(text: string): CsvLead[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const titleIdx = header.indexOf("title");
  const companyIdx = header.indexOf("company");
  const urlIdx = header.findIndex((h) => h.includes("linkedin"));
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        name: nameIdx >= 0 ? cols[nameIdx] : cols[0],
        title: titleIdx >= 0 ? cols[titleIdx] : undefined,
        company: companyIdx >= 0 ? cols[companyIdx] : undefined,
        linkedinUrl: urlIdx >= 0 ? cols[urlIdx] : undefined,
      };
    })
    .filter((l) => l.name);
}

export default function ListsPage() {
  const [lists, setLists] = useState<OutreachList[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setForm({
      name: list.name,
      sourceType: list.sourceType,
      searchUrl: list.searchUrl ?? "",
      csvText: "",
      draftMessage: list.draftMessage,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onCsvFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, csvText: String(reader.result ?? "") }));
    reader.readAsText(file);
  }

  const parsedLeads = form.sourceType === "csv" ? parseCsv(form.csvText) : [];

  async function saveList() {
    if (!form.name || !form.draftMessage) return;
    if (form.sourceType === "search_url" && !form.searchUrl) return;
    if (form.sourceType === "csv" && parsedLeads.length === 0) return;

    setSaving(true);
    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId ?? undefined,
        active: true,
        priority: lists.length + 1,
        name: form.name,
        draftMessage: form.draftMessage,
        sourceType: form.sourceType,
        ...(form.sourceType === "search_url" ? { searchUrl: form.searchUrl, leads: undefined } : {}),
        ...(form.sourceType === "csv" ? { leads: parsedLeads, searchUrl: undefined } : {}),
      }),
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
          Each list is either a Sales Navigator search or an imported CSV export, plus its own connection-request
          draft. All active lists share the single daily send cap set in Settings.
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
            <label className="block text-xs font-medium text-gray-500">Lead source</label>
            <div className="mt-1 inline-flex rounded-md border border-gray-200 p-1">
              {(["search_url", "csv"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, sourceType: type })}
                  className={`rounded px-3 py-1.5 text-xs font-medium ${
                    form.sourceType === type ? "bg-brand-500 text-white" : "text-gray-500"
                  }`}
                >
                  {type === "search_url" ? "Sales Navigator URL" : "CSV import"}
                </button>
              ))}
            </div>
          </div>

          {form.sourceType === "search_url" ? (
            <div>
              <label className="block text-xs font-medium text-gray-500">Sales Navigator search URL</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="https://www.linkedin.com/sales/search/people?..."
                value={form.searchUrl}
                onChange={(e) => setForm({ ...form, searchUrl: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-500">
                Upload or paste a Sales Navigator CSV export (columns: Name, Title, Company, LinkedIn URL)
              </label>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onCsvFilePicked} className="text-sm" />
              <textarea
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-mono"
                rows={4}
                placeholder={"Name,Title,Company,LinkedIn URL\nJordan Lee,CFO,Acme Inc,https://linkedin.com/in/jordanlee"}
                value={form.csvText}
                onChange={(e) => setForm({ ...form, csvText: e.target.value })}
              />
              <div className="text-xs text-gray-500">
                {parsedLeads.length > 0 ? `${parsedLeads.length} leads parsed` : "No leads parsed yet"}
              </div>
            </div>
          )}

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
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {list.sourceType === "search_url" ? "Search URL" : "CSV import"}
                    </span>
                  </div>
                  {list.sourceType === "search_url" ? (
                    <p className="mt-1 truncate text-xs text-gray-400">{list.searchUrl}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">{list.leads?.length ?? 0} leads imported</p>
                  )}
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
