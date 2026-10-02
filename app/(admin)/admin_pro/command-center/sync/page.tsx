"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Notice, PageHeader, Tabs } from "@/components/admin/ui";
import { CheckCircle, AlertCircle, Copy } from "lucide-react";

interface SyncChange {
  project: string;
  action: string;
  changes?: { before: Record<string, unknown>; after: Record<string, unknown> };
  error?: string;
}

interface SyncHistory {
  id: string;
  createdAt: string;
  projectName: string;
  action: string;
  source: string;
  chatSummary?: string;
}

const SNIPPET_TEMPLATE = `At the end of this conversation, generate a Command Center update
snippet for TIBLOGICS. Use this exact JSON format:

{
  "action": "update",
  "project": "[exact project name]",
  "status": "[CONCEPT/ACTIVE/PAUSED/COMPLETED if changed]",
  "progress": [0-100 number],
  "revenueEarned": [dollars if changed],
  "revenuePotential": [dollars if changed],
  "monthlyRecurring": [dollars if applicable],
  "addTasks": ["task 1", "task 2"],
  "completeTasks": ["completed task text"],
  "notes": "[key decisions or outcomes from this session]",
  "chatSummary": "[1-2 sentence summary of what was accomplished]"
}

Only include fields that changed. Output the JSON inside a code block.`;

export default function SyncPage() {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<SyncChange[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [history, setHistory] = useState<SyncHistory[]>([]);
  const [tab, setTab] = useState<"paste" | "history">("paste");
  const [snippetCopied, setSnippetCopied] = useState(false);

  // History used to load only after an apply; load it with the page.
  useEffect(() => {
    fetch("/api/admin/sync-history").then(r => r.json()).then(d => { if (Array.isArray(d)) setHistory(d); }).catch(() => {});
  }, []);

  function handleParse() {
    setParseError(null);
    setPreview(null);
    setApplied(false);
    try {
      const cleaned = input.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const updates = parsed.action === "batch" ? parsed.updates : [parsed];
      const previewItems: SyncChange[] = updates.map((u: Record<string, unknown>) => ({
        project: u.project as string,
        action: u.action as string,
        changes: { before: {}, after: { ...u } },
      }));
      setPreview(previewItems);
    } catch (e) {
      setParseError("Invalid JSON. Make sure to paste valid JSON (optionally inside ``` code fences).");
    }
  }

  async function handleApply() {
    if (!preview) return;
    setApplying(true);
    try {
      const cleaned = input.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const token = localStorage.getItem("cc_webhook_token") ?? "";
      const res = await fetch("/api/admin/cc-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...parsed, _source: "paste" }),
      });

      if (res.ok) {
        setApplied(true);
        setInput("");
        setPreview(null);
        // Reload history
        fetch("/api/admin/sync-history").then(r => r.json()).then(d => { if (Array.isArray(d)) setHistory(d); }).catch(() => {});
      } else {
        const err = await res.json();
        setParseError(err.error ?? "Apply failed. Check your webhook token in Settings.");
      }
    } catch {
      setParseError("Failed to apply changes.");
    }
    setApplying(false);
  }

  function copySnippet() {
    navigator.clipboard.writeText(SNIPPET_TEMPLATE);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Command Center sync"
        subtitle="Paste an update snippet from a Claude conversation to update a project."
        breadcrumb={[{ label: "Command Center", href: "/admin_pro/command-center" }, { label: "Sync" }]}
        tabs={<Tabs items={[{ id: "paste", label: "Paste and sync" }, { id: "history", label: "Sync history", count: history.length || null }]} active={tab} onChange={(t) => setTab(t as "paste" | "history")} ariaLabel="Sync sections" />}
      />

      {tab === "paste" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="sync-input" className="mb-2 block font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Update snippet (JSON)</label>
              <textarea
                id="sync-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
                placeholder={'{\n  "action": "update",\n  "project": "SSR International Airport",\n  "progress": 45,\n  "addTasks": ["Follow-up call done"],\n  "chatSummary": "Phase 1 scope confirmed with Chairman Raju."\n}'}
                className="w-full resize-none rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] p-4 font-mono text-[13px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
              />
            </div>

            {parseError && <Notice tone="danger">{parseError}</Notice>}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleParse} disabled={!input.trim()}>
                Preview changes
              </Button>
              {preview && !applied && (
                <Button variant="primary" onClick={handleApply} loading={applying}>
                  Apply changes
                </Button>
              )}
              {preview && (
                <Button variant="ghost" onClick={() => { setPreview(null); setParseError(null); }}>
                  Cancel
                </Button>
              )}
            </div>

            {applied && <Notice tone="success">Changes applied.</Notice>}
          </div>

          <div className="space-y-4">
            {preview && (
              <Card title="Preview">
                {preview.map((item, i) => (
                  <div key={i} className="border-b border-[var(--a-border)] py-2.5 last:border-0">
                    {item.error ? (
                      <div className="flex items-center gap-2 font-dm text-sm text-[var(--a-danger)]">
                        <AlertCircle size={14} aria-hidden /> {item.project}: {item.error}
                      </div>
                    ) : (
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <CheckCircle size={14} className="text-[var(--a-success)]" aria-hidden />
                          <span className="font-dm text-sm font-semibold text-[var(--a-ink)]">{item.project}</span>
                          <span className="font-dm text-xs capitalize text-[var(--a-ink-3)]">({item.action})</span>
                        </div>
                        {item.changes && Object.keys(item.changes.after).filter(k => !["action","project","_source"].includes(k)).map(k => (
                          <div key={k} className="pl-5 font-dm text-xs text-[var(--a-ink-3)]">
                            {k}: {JSON.stringify(item.changes!.after[k])}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )}

            <Card
              title="How to use"
              action={
                <Button size="sm" variant="ghost" icon={Copy} onClick={copySnippet}>
                  {snippetCopied ? "Copied" : "Copy prompt"}
                </Button>
              }
            >
              <p className="mb-3 font-dm text-[13px] text-[var(--a-ink-3)]">
                At the end of a Claude conversation about a project, paste this prompt to get a sync snippet:
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-[10px] bg-[var(--a-surface-2)] p-3 font-mono text-xs text-[var(--a-ink-2)]">{SNIPPET_TEMPLATE}</pre>
            </Card>
          </div>
        </div>
      )}

      {tab === "history" && (
        <Card padded={false}>
          {history.length === 0 ? (
            <p className="p-12 text-center font-dm text-sm text-[var(--a-ink-3)]">No sync history yet. Use Paste and sync to apply your first update.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-dm text-[13px]">
                <thead className="bg-[var(--a-surface-2)]">
                  <tr>
                    {["Date", "Project", "Action", "Source", "Summary"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((s) => (
                    <tr key={s.id} className="border-t border-[var(--a-border)] hover:bg-[#f8fafd]">
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--a-ink-3)]">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-semibold text-[var(--a-ink)]">{s.projectName}</td>
                      <td className="px-4 py-3"><Badge tone="neutral">{s.action}</Badge></td>
                      <td className="px-4 py-3 capitalize text-[var(--a-ink-3)]">{s.source}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-[var(--a-ink-3)]">{s.chatSummary ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
