"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Copy, RefreshCw } from "lucide-react";

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
    <div className="bg-[#0F2240] min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-extrabold text-xl text-[#E8EFF8]">Command Center Sync</h1>
          <p className="text-[#7A9BBF] text-sm font-dm mt-0.5">Paste a Claude update snippet to sync project data</p>
        </div>
        <a href="/admin/command-center" className="text-[#7A9BBF] text-sm font-dm hover:text-[#E8EFF8]">← Overview</a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#162D4F] border border-[#1E3A60] rounded-xl p-1 w-fit">
        {(["paste","history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-dm font-medium transition-colors capitalize ${
              tab === t ? "bg-[#2251A3] text-white" : "text-[#7A9BBF] hover:text-[#E8EFF8]"
            }`}>
            {t === "paste" ? "Paste & Sync" : "Sync History"}
          </button>
        ))}
      </div>

      {tab === "paste" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: paste input */}
          <div className="space-y-4">
            <div>
              <label className="block text-[#7A9BBF] text-xs font-dm mb-2">Paste Claude update snippet below:</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
                placeholder={'{\n  "action": "update",\n  "project": "SSR International Airport",\n  "progress": 45,\n  "addTasks": ["Follow-up call done"],\n  "chatSummary": "Phase 1 scope confirmed with Chairman Raju."\n}'}
                className="w-full bg-[#0F2240] border border-[#1E3A60] rounded-xl p-4 text-[#E8EFF8] text-sm font-mono placeholder:text-[#4A6A8A] outline-none focus:border-[#2251A3] resize-none"
              />
            </div>

            {parseError && (
              <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm font-dm">{parseError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleParse} disabled={!input.trim()}
                className="bg-[#2251A3] hover:bg-[#1B3A6B] text-white px-4 py-2 rounded-lg text-sm font-dm font-medium transition-colors disabled:opacity-40">
                Parse & Preview
              </button>
              {preview && !applied && (
                <button onClick={handleApply} disabled={applying}
                  className="bg-[#F47C20] hover:bg-[#E05F00] text-white px-4 py-2 rounded-lg text-sm font-dm font-medium transition-colors disabled:opacity-60 flex items-center gap-2">
                  {applying && <RefreshCw size={14} className="animate-spin" />}
                  Apply Changes
                </button>
              )}
              {preview && (
                <button onClick={() => { setPreview(null); setParseError(null); }}
                  className="text-[#7A9BBF] hover:text-[#E8EFF8] px-4 py-2 text-sm font-dm transition-colors">
                  Cancel
                </button>
              )}
            </div>

            {applied && (
              <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 rounded-xl p-3">
                <CheckCircle size={15} className="text-green-400" />
                <p className="text-green-400 text-sm font-dm font-medium">Changes applied successfully!</p>
              </div>
            )}
          </div>

          {/* Right: preview + how-to */}
          <div className="space-y-4">
            {preview && (
              <div className="bg-[#162D4F] border border-[#1E3A60] rounded-xl p-4">
                <h3 className="font-syne font-bold text-[#E8EFF8] text-sm mb-3">Preview</h3>
                {preview.map((item, i) => (
                  <div key={i} className="border-b border-[#1E3A60] last:border-0 py-2.5">
                    {item.error ? (
                      <div className="flex items-center gap-2 text-red-400 text-sm font-dm">
                        <AlertCircle size={14} /> {item.project}: {item.error}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle size={14} className="text-green-400" />
                          <span className="font-dm text-sm text-[#E8EFF8] font-medium">{item.project}</span>
                          <span className="text-xs text-[#7A9BBF] font-dm capitalize">({item.action})</span>
                        </div>
                        {item.changes && Object.keys(item.changes.after).filter(k => !["action","project","_source"].includes(k)).map(k => (
                          <div key={k} className="text-xs text-[#7A9BBF] font-dm pl-5">
                            ✓ {k}: {JSON.stringify(item.changes!.after[k])}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* How to use */}
            <div className="bg-[#162D4F] border border-[#1E3A60] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-syne font-bold text-[#E8EFF8] text-sm">How to Use</h3>
                <button onClick={copySnippet}
                  className="flex items-center gap-1 text-xs text-[#7A9BBF] hover:text-[#E8EFF8] transition-colors font-dm">
                  <Copy size={12} /> {snippetCopied ? "Copied!" : "Copy prompt"}
                </button>
              </div>
              <p className="text-[#7A9BBF] text-xs font-dm mb-3">
                At the end of any Claude conversation about a project, paste this prompt to get a sync snippet:
              </p>
              <pre className="bg-[#0F2240] border border-[#1E3A60] rounded-lg p-3 text-[#E8EFF8] text-xs font-mono whitespace-pre-wrap overflow-x-auto">{SNIPPET_TEMPLATE}</pre>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="bg-[#162D4F] border border-[#1E3A60] rounded-2xl overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#7A9BBF] font-dm text-sm">No sync history yet. Use the Paste & Sync tab to apply your first update.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-[#1E3A60]">
                <tr>
                  {["Date", "Project", "Action", "Source", "Summary"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-dm text-[#7A9BBF]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.id} className="border-b border-[#1E3A60] last:border-0 hover:bg-[#1E3A60]/20">
                    <td className="px-4 py-3 text-xs font-dm text-[#7A9BBF]">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-dm text-[#E8EFF8]">{s.projectName}</td>
                    <td className="px-4 py-3"><span className="bg-[#1E3A60] text-[#7A9BBF] text-xs px-2 py-0.5 rounded-full font-dm capitalize">{s.action}</span></td>
                    <td className="px-4 py-3 text-xs font-dm text-[#7A9BBF] capitalize">{s.source}</td>
                    <td className="px-4 py-3 text-xs font-dm text-[#7A9BBF] max-w-xs truncate">{s.chatSummary ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
