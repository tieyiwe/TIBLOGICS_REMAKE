"use client";
import { useState, useEffect, useRef } from "react";
import {
  MoreVertical, Download, Search, Loader2, X, CheckCircle,
  Video, Trash2, Ban, CheckCheck, Clock, AlertCircle, ExternalLink, Send, CalendarClock,
  Brain, Mic, MicOff, RefreshCw, Sparkles, MessageSquare, CalendarDays, Settings2,
} from "lucide-react";
import { Button, DataTable, EmptyState, PageHeader, SearchInput, Segmented, Toolbar } from "@/components/admin/ui";

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  timezone: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string | null;
  goalNotes?: string | null;
  serviceType: string;
  serviceDuration: string;
  servicePrice: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  zoomLink?: string | null;
  notes?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  addOnRecording: boolean;
  addOnActionPlan: boolean;
  addOnSlackAccess: boolean;
  createdAt: string;
}

function fmt(t: string) {
  return t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function fmtMoney(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(0)}`;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-[var(--a-warn-bg)] text-[var(--a-warn)] ring-[#f7dcb5]",
  CONFIRMED: "bg-[var(--a-info-bg)] text-[var(--a-info)] ring-[#d3def3]",
  COMPLETED: "bg-[var(--a-success-bg)] text-[var(--a-success)] ring-[#c8ead6]",
  CANCELLED: "bg-[var(--a-surface-2)] text-[var(--a-ink-3)] ring-[var(--a-border)]",
  NO_SHOW:   "bg-[var(--a-danger-bg)] text-[var(--a-danger)] ring-[#f6cccc]",
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`${cls} inline-flex rounded-full px-2 py-0.5 font-dm text-[12px] font-semibold leading-5 ring-1 ring-inset`}>
      {label.charAt(0) + label.slice(1).toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

function ActionMenu({
  appt, onSelect,
}: {
  appt: Appointment;
  onSelect: (appt: Appointment) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--a-surface-2)] text-[var(--a-ink-3)]"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-white border border-[var(--a-border)] rounded-[var(--a-radius-control)] shadow-lg z-20 min-w-[160px] py-1">
          <button
            className="w-full text-left px-4 py-2.5 text-sm font-dm text-[var(--a-ink)] hover:bg-[var(--a-surface-2)] flex items-center gap-2"
            onClick={() => { onSelect(appt); setOpen(false); }}
          >
            <ExternalLink size={13} className="text-[var(--a-ink-3)]" /> View Details
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  appt,
  onClose,
  onUpdated,
}: {
  appt: Appointment;
  onClose: () => void;
  onUpdated: (updated: Appointment) => void;
}) {
  const [meetingLink, setMeetingLink] = useState(appt.zoomLink ?? "");
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState("");
  const [suggestedTimeSlot, setSuggestedTimeSlot] = useState("");
  const [rescheduleMessage, setRescheduleMessage] = useState("");

  // Session Intelligence state
  const [detailTab, setDetailTab] = useState<"details" | "intel">("details");
  const [brief, setBrief] = useState<{ text: string; generatedAt: string; hasChatHistory: boolean; chatMessageCount: number } | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState<{ text: string; transcript: string; analyzedAt: string; wordCount: number } | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Load cached brief on mount
  useEffect(() => {
    fetch(`/api/admin/appointments/${appt.id}/brief`)
      .then((r) => r.json())
      .then((d) => { if (d.brief) setBrief(d.brief); })
      .catch(() => {});
    fetch(`/api/admin/appointments/${appt.id}/voice`)
      .then((r) => r.json())
      .then((d) => { if (d.analysis) setVoiceAnalysis(d.analysis); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appt.id]);

  async function handleGenerateBrief() {
    setBriefLoading(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appt.id}/brief`, { method: "POST" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setBrief(d.brief);
    } catch {
      showToast("err", "Failed to generate brief.");
    } finally {
      setBriefLoading(false);
    }
  }

  async function handleAnalyzeVoice() {
    if (!transcript.trim() || transcript.trim().split(/\s+/).length < 5) {
      showToast("err", "Transcript too short — add more content first.");
      return;
    }
    setVoiceLoading(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appt.id}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setVoiceAnalysis(d.analysis);
    } catch {
      showToast("err", "Analysis failed.");
    } finally {
      setVoiceLoading(false);
    }
  }

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      showToast("err", "Voice recording not supported in this browser. Use Chrome.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = transcript;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(finalText + interim);
    };
    rec.onerror = () => { setIsRecording(false); };
    rec.onend = () => { setIsRecording(false); setTranscript(finalText); };
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  }

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function patch(body: object) {
    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  }

  async function handleConfirm() {
    setBusy("confirm");
    try {
      const res = await fetch(`/api/admin/appointments/${appt.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingLink: meetingLink.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onUpdated({ ...appt, ...updated, zoomLink: meetingLink.trim() || null, status: "CONFIRMED", confirmedAt: new Date().toISOString() });
      showToast("ok", "Appointment confirmed. Confirmation email sent to client.");
    } catch {
      showToast("err", "Failed to confirm appointment.");
    } finally {
      setBusy(null);
    }
  }

  async function handleComplete() {
    setBusy("complete");
    try {
      const res = await patch({ status: "COMPLETED" });
      if (!res.ok) throw new Error();
      onUpdated({ ...appt, status: "COMPLETED" });
      showToast("ok", "Marked as completed.");
    } catch {
      showToast("err", "Failed to update.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    setBusy("cancel");
    try {
      const res = await patch({ status: "CANCELLED", cancelReason: cancelReason || "Cancelled by admin" });
      if (!res.ok) throw new Error();
      onUpdated({ ...appt, status: "CANCELLED", cancelReason: cancelReason || "Cancelled by admin" });
      showToast("ok", "Appointment cancelled.");
    } catch {
      showToast("err", "Failed to cancel.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveMeetingLink() {
    setBusy("link");
    try {
      const res = await patch({ zoomLink: meetingLink.trim() || null });
      if (!res.ok) throw new Error();
      onUpdated({ ...appt, zoomLink: meetingLink.trim() || null });
      showToast("ok", "Meeting link saved.");
    } catch {
      showToast("err", "Failed to save link.");
    } finally {
      setBusy(null);
    }
  }

  async function handleResendEmail() {
    setBusy("resend");
    try {
      const res = await fetch(`/api/admin/appointments/${appt.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingLink: appt.zoomLink, resendOnly: true }),
      });
      if (!res.ok) throw new Error();
      showToast("ok", "Confirmation email resent to client.");
    } catch {
      showToast("err", "Failed to resend email.");
    } finally {
      setBusy(null);
    }
  }

  async function handleReschedule() {
    if (!suggestedDate || !suggestedTimeSlot) {
      showToast("err", "Please enter both a date and time slot.");
      return;
    }
    setBusy("reschedule");
    try {
      const res = await fetch(`/api/admin/appointments/${appt.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestedDate, suggestedTimeSlot, message: rescheduleMessage.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      showToast("ok", "New time suggestion sent to client.");
      setShowReschedule(false);
      setSuggestedDate(""); setSuggestedTimeSlot(""); setRescheduleMessage("");
    } catch {
      showToast("err", "Failed to send reschedule notice.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete this appointment for ${appt.firstName} ${appt.lastName}? This cannot be undone.`)) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onUpdated({ ...appt, status: "_DELETED" });
      onClose();
    } catch {
      showToast("err", "Failed to delete.");
    } finally {
      setBusy(null);
    }
  }

  const currentAppt = appt;
  const isActive = !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(currentAppt.status);

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--a-border)] sticky top-0 bg-white z-10">
          <div>
            <p className="font-syne font-bold text-base text-[var(--a-ink)]">{appt.firstName} {appt.lastName}</p>
            <p className="font-dm text-xs text-[var(--a-ink-3)]">{appt.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge label={appt.status} cls={STATUS_COLOR[appt.status] ?? "bg-gray-100 text-gray-500"} />
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--a-surface-2)] text-[var(--a-ink-3)]">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-[var(--a-radius-control)] text-sm font-dm border ${
            toast.type === "ok"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            {toast.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {toast.msg}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-[var(--a-border)] px-6 sticky top-[73px] bg-white z-10">
          {([["details", "Details"], ["intel", "Session Intel"]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-4 py-3 text-sm font-dm font-medium border-b-2 transition-colors ${
                detailTab === tab
                  ? "border-[#1B3A6B] text-[#1B3A6B]"
                  : "border-transparent text-[var(--a-ink-3)] hover:text-[var(--a-ink)]"
              }`}
            >
              {tab === "intel" && <Brain size={13} className="inline mr-1.5 mb-0.5" />}
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">

          {/* ── SESSION INTELLIGENCE TAB ── */}
          {detailTab === "intel" && (
            <div className="space-y-5">

              {/* AI Client Brief */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-dm text-sm font-semibold text-[var(--a-ink)] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#F47C20]" /> Pre-Session AI Brief
                  </p>
                  <button
                    onClick={handleGenerateBrief}
                    disabled={briefLoading}
                    className="flex items-center gap-1.5 text-xs font-dm text-[var(--a-blue)] hover:underline disabled:opacity-50"
                  >
                    {briefLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {brief ? "Regenerate" : "Generate Brief"}
                  </button>
                </div>
                {!brief && !briefLoading && (
                  <div className="bg-[var(--a-surface-2)] rounded-[var(--a-radius-control)] p-4 text-center">
                    <Brain size={24} className="text-[#B0BEC5] mx-auto mb-2" />
                    <p className="font-dm text-sm text-[var(--a-ink-3)]">Generate an AI brief to get client insights, recommended approach, and opening questions before the session.</p>
                    <button
                      onClick={handleGenerateBrief}
                      className="mt-3 px-4 py-2 bg-[var(--a-navy)] text-white text-sm font-dm font-semibold rounded-[var(--a-radius-control)] hover:bg-[#2251A3] transition-colors"
                    >
                      Generate Now
                    </button>
                  </div>
                )}
                {briefLoading && (
                  <div className="bg-[var(--a-surface-2)] rounded-[var(--a-radius-control)] p-6 flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[var(--a-blue)]" />
                    <span className="font-dm text-sm text-[var(--a-ink-3)]">Analyzing client data…</span>
                  </div>
                )}
                {brief && !briefLoading && (
                  <div className="bg-[var(--a-surface-2)] rounded-[var(--a-radius-control)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {brief.hasChatHistory && (
                        <span className="flex items-center gap-1 text-xs font-dm text-[var(--a-blue)] bg-[var(--a-info-bg)] px-2 py-0.5 rounded-full">
                          <MessageSquare size={10} /> {brief.chatMessageCount} chat msgs
                        </span>
                      )}
                      <span className="text-xs font-dm text-[#B0BEC5]">
                        Generated {new Date(brief.generatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-dm text-sm text-[var(--a-ink-2)] whitespace-pre-wrap leading-relaxed">
                      {brief.text}
                    </div>
                  </div>
                )}
              </section>

              {/* Divider */}
              <div className="border-t border-[var(--a-border)]" />

              {/* Voice & Session Analysis */}
              <section>
                <p className="font-dm text-sm font-semibold text-[var(--a-ink)] flex items-center gap-1.5 mb-1">
                  <Mic size={14} className="text-[#F47C20]" /> Voice & Session Analysis
                </p>
                <p className="font-dm text-xs text-[var(--a-ink-3)] mb-3">
                  Record live or paste a transcript from the session. AI will detect mood, key issues, urgency, and recommended follow-ups.
                </p>

                {/* Voice recording controls */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={toggleRecording}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-dm font-semibold rounded-[var(--a-radius-control)] transition-colors ${
                      isRecording
                        ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                        : "bg-[var(--a-info-bg)] text-[var(--a-blue)] hover:bg-[#2251A3] hover:text-white"
                    }`}
                  >
                    {isRecording ? <><MicOff size={13} /> Stop Recording</> : <><Mic size={13} /> Record Voice</>}
                  </button>
                  {transcript && (
                    <button onClick={() => setTranscript("")} className="text-xs text-[var(--a-ink-3)] hover:text-red-500 font-dm">Clear</button>
                  )}
                </div>

                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Transcript appears here as you speak, or paste it manually…"
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm font-dm border border-[var(--a-border)] rounded-[var(--a-radius-control)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] bg-white resize-none"
                />
                <p className="font-dm text-xs text-[#B0BEC5] mt-1 mb-3">
                  {transcript.trim().split(/\s+/).filter(Boolean).length} words
                </p>

                <button
                  onClick={handleAnalyzeVoice}
                  disabled={voiceLoading || transcript.trim().split(/\s+/).length < 5}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--a-orange-text)] text-white text-sm font-dm font-semibold rounded-[var(--a-radius-control)] hover:bg-[#d96a15] transition-colors disabled:opacity-50"
                >
                  {voiceLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                  Analyze Session
                </button>

                {voiceAnalysis && !voiceLoading && (
                  <div className="mt-4 bg-[var(--a-surface-2)] rounded-[var(--a-radius-control)] p-4">
                    <p className="font-dm text-xs text-[#B0BEC5] mb-3">
                      Analyzed {new Date(voiceAnalysis.analyzedAt).toLocaleString()} · {voiceAnalysis.wordCount} words
                    </p>
                    <div className="font-dm text-sm text-[var(--a-ink-2)] whitespace-pre-wrap leading-relaxed">
                      {voiceAnalysis.text}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── DETAILS TAB ── */}
          {detailTab === "details" && <>
          {/* Meeting Details */}
          <section className="bg-[var(--a-surface-2)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-4 space-y-2">
            <p className="font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em] mb-3">Meeting Details</p>
            <Row label="Service" value={fmt(appt.serviceType)} />
            <Row label="Duration" value={appt.serviceDuration} />
            <Row label="Date" value={fmtDate(appt.date)} />
            <Row label="Time" value={`${appt.timeSlot} (${appt.timezone})`} />
            <Row label="Amount" value={fmtMoney(appt.totalAmount)} />
            {appt.company && <Row label="Company" value={appt.company} />}
            {appt.goalNotes && <Row label="Goals" value={appt.goalNotes} />}
            {(appt.addOnRecording || appt.addOnActionPlan || appt.addOnSlackAccess) && (
              <Row label="Add-ons" value={[
                appt.addOnRecording && "Recording",
                appt.addOnActionPlan && "Action Plan",
                appt.addOnSlackAccess && "Slack Access",
              ].filter(Boolean).join(", ")} />
            )}
          </section>

          {/* Meeting Link */}
          <section>
            <p className="font-dm text-sm font-semibold text-[var(--a-ink)] mb-2 flex items-center gap-1.5">
              <Video size={14} className="text-[var(--a-blue)]" /> Meeting Link
            </p>
            <p className="font-dm text-xs text-[var(--a-ink-3)] mb-2">
              Paste a Jitsi Meet link or leave blank to auto-generate one. This will be included in the confirmation email.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.jit.si/tiblogics-..."
                className="flex-1 px-3 py-2.5 text-sm font-dm border border-[var(--a-border)] rounded-[var(--a-radius-control)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] bg-white"
              />
              <button
                onClick={handleSaveMeetingLink}
                disabled={busy === "link"}
                className="px-3 py-2.5 bg-[var(--a-info-bg)] text-[var(--a-blue)] text-sm font-dm rounded-[var(--a-radius-control)] hover:bg-[#2251A3] hover:text-white transition-colors disabled:opacity-50"
              >
                {busy === "link" ? <Loader2 size={14} className="animate-spin" /> : "Save"}
              </button>
            </div>
            {appt.zoomLink && (
              <a
                href={appt.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-[var(--a-blue)] font-dm hover:underline"
              >
                <ExternalLink size={11} /> Open link
              </a>
            )}
          </section>

          {/* Reschedule note (if a new time was suggested) */}
          {appt.notes && appt.notes.startsWith("[Reschedule suggested]") && (
            <section className="bg-[#FEF0E3] border border-orange-100 rounded-[var(--a-radius-control)] p-4">
              <p className="font-dm text-xs font-semibold text-[#F47C20] uppercase mb-1 flex items-center gap-1.5">
                <CalendarClock size={12} /> Reschedule Suggested
              </p>
              <p className="font-dm text-sm text-[var(--a-ink-2)]">{appt.notes.replace("[Reschedule suggested] ", "")}</p>
            </section>
          )}

          {/* Cancel reason (if cancelled) */}
          {appt.status === "CANCELLED" && appt.cancelReason && (
            <section className="bg-red-50 border border-red-100 rounded-[var(--a-radius-control)] p-4">
              <p className="font-dm text-xs font-semibold text-red-400 uppercase mb-1">Cancellation Reason</p>
              <p className="font-dm text-sm text-red-700">{appt.cancelReason}</p>
            </section>
          )}

          {/* Actions */}
          <section className="space-y-3">
            <p className="font-dm text-sm font-semibold text-[var(--a-ink)]">Actions</p>

            {/* Confirm */}
            {appt.status === "PENDING" && (
              <button
                onClick={handleConfirm}
                disabled={!!busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--a-navy)] text-white text-sm font-dm font-semibold rounded-[var(--a-radius-control)] hover:bg-[#2251A3] transition-colors disabled:opacity-60"
              >
                {busy === "confirm" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Confirm & Send Meeting Email
              </button>
            )}

            {/* Resend email */}
            {appt.status === "CONFIRMED" && (
              <button
                onClick={handleResendEmail}
                disabled={!!busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--a-info-bg)] text-[var(--a-blue)] text-sm font-dm font-semibold rounded-[var(--a-radius-control)] hover:bg-[#2251A3] hover:text-white transition-colors disabled:opacity-60"
              >
                {busy === "resend" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Resend Confirmation Email
              </button>
            )}

            {/* Suggest new time */}
            {["PENDING", "CONFIRMED"].includes(appt.status) && (
              <div className="border border-[var(--a-border)] rounded-[var(--a-radius-control)] overflow-hidden">
                <button
                  onClick={() => setShowReschedule((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-dm font-semibold text-[var(--a-ink)] hover:bg-[var(--a-surface-2)] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CalendarClock size={14} className="text-[#F47C20]" />
                    Suggest a New Time
                  </span>
                  <span className="text-[var(--a-ink-3)] text-xs">{showReschedule ? "▲" : "▼"}</span>
                </button>
                {showReschedule && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[var(--a-border)] pt-3">
                    <p className="font-dm text-xs text-[var(--a-ink-3)]">
                      An email will be sent to <strong>{appt.email}</strong> with the proposed new time.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-dm text-xs text-[var(--a-ink-3)] mb-1">New Date</label>
                        <input
                          type="date"
                          value={suggestedDate}
                          onChange={(e) => setSuggestedDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-dm border border-[var(--a-border)] rounded-[var(--a-radius-control)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-dm text-xs text-[var(--a-ink-3)] mb-1">New Time</label>
                        <select
                          value={suggestedTimeSlot}
                          onChange={(e) => setSuggestedTimeSlot(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-dm border border-[var(--a-border)] rounded-[var(--a-radius-control)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] bg-white"
                        >
                          <option value="">Select time</option>
                          {["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
                            "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
                            "4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <textarea
                      value={rescheduleMessage}
                      onChange={(e) => setRescheduleMessage(e.target.value)}
                      placeholder="Optional note to client (e.g. 'Apologies for the change — looking forward to speaking with you!')"
                      rows={2}
                      className="w-full px-3 py-2 text-sm font-dm border border-[var(--a-border)] rounded-[var(--a-radius-control)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] bg-white resize-none"
                    />
                    <button
                      onClick={handleReschedule}
                      disabled={!!busy}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--a-orange-text)] text-white text-sm font-dm font-semibold rounded-[var(--a-radius-control)] hover:bg-[#d96a15] transition-colors disabled:opacity-60"
                    >
                      {busy === "reschedule" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Send Time Suggestion to Client
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Complete */}
            {["CONFIRMED", "PENDING"].includes(appt.status) && (
              <button
                onClick={handleComplete}
                disabled={!!busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-dm font-semibold rounded-[var(--a-radius-control)] hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {busy === "complete" ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                Mark as Completed
              </button>
            )}

            {/* Cancel */}
            {isActive && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason (optional)"
                  className="w-full px-3 py-2.5 text-sm font-dm border border-[var(--a-border)] rounded-[var(--a-radius-control)] focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 bg-white"
                />
                <button
                  onClick={handleCancel}
                  disabled={!!busy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-500 text-sm font-dm font-semibold rounded-[var(--a-radius-control)] hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  {busy === "cancel" ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                  Cancel Appointment
                </button>
              </div>
            )}

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={!!busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 text-sm font-dm rounded-[var(--a-radius-control)] hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete Record
            </button>
          </section>

          <p className="font-dm text-xs text-[#B0BEC5] pb-4">Booked on {fmtDate(appt.createdAt)}</p>
          </>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-dm text-xs text-[var(--a-ink-3)] shrink-0">{label}</span>
      <span className="font-dm text-sm text-[var(--a-ink)] text-right">{value}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

/**
 * Bookings table. `initialAppointments` is read from Prisma by the server
 * component in page.tsx, replacing the useEffect fetch of /api/appointments
 * that used to leave this page empty until the round trip finished.
 *
 * It is still held in state, because every row edit updates it optimistically
 * through `handleUpdated` — the mutations themselves continue to go through the
 * /api/appointments* and /api/admin/appointments/* routes unchanged.
 */
export default function AppointmentsClient({
  initialAppointments,
}: {
  initialAppointments: Appointment[];
}) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Appointment | null>(null);

  // A server re-render (router.refresh, or navigating back to this page) hands
  // down a new list; adopt it so the table does not keep showing a stale one.
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  function handleUpdated(updated: Appointment) {
    if (updated.status === "_DELETED") {
      setAppointments((prev) => prev.filter((a) => a.id !== updated.id));
      setSelected(null);
      return;
    }
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    setSelected((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
  }

  const filtered = appointments.filter((a) => {
    const name = `${a.firstName} ${a.lastName}`.toLowerCase();
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function exportCSV() {
    const rows = [
      ["Date", "Time", "Name", "Email", "Company", "Service", "Duration", "Amount", "Status", "Payment", "Meeting Link"],
      ...filtered.map((a) => [
        fmtDate(a.date), a.timeSlot,
        `${a.firstName} ${a.lastName}`, a.email, a.company ?? "",
        fmt(a.serviceType), a.serviceDuration,
        fmtMoney(a.totalAmount), a.status, a.paymentStatus ?? "",
        a.zoomLink ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "appointments.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const counts = {
    PENDING: appointments.filter((a) => a.status === "PENDING").length,
    CONFIRMED: appointments.filter((a) => a.status === "CONFIRMED").length,
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6">
      {selected && (
        <DetailPanel appt={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}

      <PageHeader
        title="Appointments"
        subtitle="Manage client bookings, confirm meetings, and send links"
        actions={
          <>
            <Button href="/admin_pro/appointments/availability" variant="secondary" icon={Settings2}>
              Availability
            </Button>
            <Button onClick={exportCSV} variant="secondary" icon={Download}>
              Export CSV
            </Button>
          </>
        }
        className="mb-0"
      />

      <Toolbar
        className="mb-0"
        end={
          <Segmented
            ariaLabel="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase(),
              count: s === "ALL" ? appointments.length : s === "CANCELLED" ? appointments.filter((a) => a.status === "CANCELLED").length : counts[s],
            }))}
          />
        }
      >
        <SearchInput
          label="Search appointments"
          placeholder="Search by name, email or service"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Toolbar>

      {/* Table: server-rendered list, so the first paint is rows or the empty state. */}
      <DataTable
        caption="Appointments"
        rows={filtered}
        rowKey={(a) => a.id}
        onRowClick={(a) => setSelected(a)}
        empty={
          <EmptyState
            icon={CalendarDays}
            title={appointments.length === 0 ? "No appointments yet" : "No appointments match your filters"}
            body={appointments.length === 0 ? "Bookings made on the website appear here." : "Try a different status or search."}
            action={
              appointments.length === 0 ? (
                <Button href="/admin_pro/appointments/availability" variant="primary">
                  Set availability
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter("ALL"); }}>
                  Clear filters
                </Button>
              )
            }
          />
        }
        columns={[
          {
            key: "client",
            header: "Client",
            primary: true,
            render: (a) => (
              <div className="min-w-0">
                <p className="font-dm text-sm font-semibold text-[var(--a-ink)]">{a.firstName} {a.lastName}</p>
                <p className="font-dm text-xs text-[var(--a-ink-3)] break-all">{a.email}</p>
              </div>
            ),
          },
          {
            key: "date",
            header: "Date & time",
            render: (a) => (
              <div>
                <p className="font-dm text-sm text-[var(--a-ink)] tabular-nums">{fmtDate(a.date)}</p>
                <p className="font-dm text-xs text-[var(--a-ink-3)]">{a.timeSlot}</p>
              </div>
            ),
          },
          {
            key: "service",
            header: "Service",
            render: (a) => (
              <div>
                <p className="font-dm text-sm text-[var(--a-ink)]">{fmt(a.serviceType)}</p>
                <p className="font-dm text-xs text-[var(--a-ink-3)]">{a.serviceDuration}</p>
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            align: "right",
            render: (a) => <span className="font-semibold text-[var(--a-ink)] tabular-nums">{fmtMoney(a.totalAmount)}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (a) => <Badge label={a.status} cls={STATUS_COLOR[a.status] ?? "bg-gray-100 text-gray-500"} />,
          },
          {
            key: "meeting",
            header: "Meeting",
            render: (a) =>
              a.zoomLink ? (
                <a
                  href={a.zoomLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 font-dm text-xs font-semibold text-[var(--a-blue)] hover:underline"
                >
                  <Video size={12} /> Join
                </a>
              ) : (
                <span className="font-dm text-xs text-[var(--a-ink-3)]">None</span>
              ),
          },
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            hideOnMobile: true,
            render: (a) => (
              <div onClick={(e) => e.stopPropagation()}>
                <ActionMenu appt={a} onSelect={setSelected} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
