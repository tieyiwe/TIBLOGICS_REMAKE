"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHeader, useConfirm } from "@/components/admin/ui";
import { Plus, X, Eye, EyeOff, RefreshCw, Save, CheckCircle, AlertCircle, Video, Calendar, Trash2, Users, Shield, Crown } from "lucide-react";

const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BUFFER_OPTIONS = ["15 min", "30 min", "45 min", "60 min"];
const NOTIFICATION_TOGGLES = [
  { id: "newBooking", label: "New booking confirmation" },
  { id: "cancellation", label: "Booking cancellation" },
  { id: "reminder24h", label: "24-hour appointment reminder" },
  { id: "newProspect", label: "New prospect from scanner" },
];

/**
 * Settings screen: local form state with no initial read. Team access moved
 * to /admin_pro/team (Team & Roles); this page links there.
 */
export default function SettingsClient() {
  const { data: session } = useSession();
  const isOwner = session?.user?.isOwner ?? false;

  // Booking settings
  const [timeSlots, setTimeSlots] = useState(["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"]);
  const [newSlot, setNewSlot] = useState("");
  const [workingDays, setWorkingDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [bufferTime, setBufferTime] = useState("30 min");

  // Notification settings
  const [notifEmail, setNotifEmail] = useState("ai@tiblogics.com");
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    newBooking: true,
    cancellation: true,
    reminder24h: true,
    newProspect: false,
  });

  // Command Center Sync
  const webhookUrl = "https://tiblogics.com/api/admin/cc-webhook";
  const [showToken, setShowToken] = useState(false);
  const [webhookToken, setWebhookToken] = useState("sk_cc_tiblogics_a7f3d92e1b4c8f0a6d5e2b9c");

  // Admin account / password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleChangePassword() {
    setPwStatus(null);
    if (newPassword.length < 8) {
      setPwStatus({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwStatus({ type: "success", msg: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwStatus({ type: "error", msg: data.error ?? "Failed to update password." });
      }
    } catch {
      setPwStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setPwLoading(false);
    }
  }

  function addSlot() {
    const trimmed = newSlot.trim();
    if (trimmed && !timeSlots.includes(trimmed)) {
      setTimeSlots(prev => [...prev, trimmed]);
      setNewSlot("");
    }
  }

  function removeSlot(slot: string) {
    setTimeSlots(prev => prev.filter(s => s !== slot));
  }

  function toggleDay(day: string) {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function toggleNotif(id: string) {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function regenerateToken() {
    const chars = "abcdef0123456789";
    const random = Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setWebhookToken(`sk_cc_tiblogics_${random}`);
    setShowToken(true);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <PageHeader title="Settings" subtitle="Booking, notifications and integrations. Team access is in Team & Roles." className="mb-0" />

      {/* ── Booking Settings ── */}
      <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[var(--a-ink)] border-b border-[var(--a-border)] pb-3">
          Booking Settings
        </h2>

        {/* Time slots */}
        <div>
          <label className="font-dm text-sm font-medium text-[var(--a-ink)] block mb-2">Available Time Slots</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {timeSlots.map(slot => (
              <span
                key={slot}
                className="flex items-center gap-1.5 bg-[var(--a-info-bg)] text-[var(--a-blue)] text-sm font-dm px-3 py-1 rounded-full"
              >
                {slot}
                <button onClick={() => removeSlot(slot)} className="hover:text-red-500 transition-colors">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 4:00 PM"
              value={newSlot}
              onChange={e => setNewSlot(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSlot()}
              className="flex-1 max-w-[180px] px-3 py-2 bg-white border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm text-[var(--a-ink)] placeholder-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
            />
            <button
              onClick={addSlot}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--a-info-bg)] text-[var(--a-blue)] text-sm font-dm rounded-[var(--a-radius-control)] hover:bg-[#2251A3] hover:text-white transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Working days */}
        <div>
          <label className="font-dm text-sm font-medium text-[var(--a-ink)] block mb-2">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {WORKING_DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 text-sm font-dm rounded-[var(--a-radius-control)] border transition-colors ${
                  workingDays.includes(day)
                    ? "bg-[var(--a-navy)] border-[#1B3A6B] text-white"
                    : "bg-white border-[var(--a-border)] text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Buffer time */}
        <div>
          <label className="font-dm text-sm font-medium text-[var(--a-ink)] block mb-2">Buffer Time Between Appointments</label>
          <select
            value={bufferTime}
            onChange={e => setBufferTime(e.target.value)}
            className="bg-white border border-[var(--a-border)] rounded-[var(--a-radius-control)] px-4 py-2.5 text-sm font-dm text-[var(--a-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
          >
            {BUFFER_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <button className="btn-primary flex items-center gap-2">
          <Save size={14} /> Save Booking Settings
        </button>
      </section>

      {/* ── Notification Settings ── */}
      <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[var(--a-ink)] border-b border-[var(--a-border)] pb-3">
          Notification Settings
        </h2>

        <div>
          <label className="font-dm text-sm font-medium text-[var(--a-ink)] block mb-1">Notification Email</label>
          <input
            type="email"
            value={notifEmail}
            onChange={e => setNotifEmail(e.target.value)}
            className="w-full max-w-sm px-4 py-2.5 bg-white border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm text-[var(--a-ink)] placeholder-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
          />
        </div>

        <div className="space-y-3">
          {NOTIFICATION_TOGGLES.map(n => (
            <div key={n.id} className="flex items-center justify-between">
              <span className="font-dm text-sm text-[var(--a-ink)]">{n.label}</span>
              <button
                onClick={() => toggleNotif(n.id)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  toggles[n.id] ? "bg-[#2251A3]" : "bg-[#D2DCE8]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    toggles[n.id] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <button className="btn-primary flex items-center gap-2">
          <Save size={14} /> Save Notification Settings
        </button>

        <WeeklyGrowthEmailToggle />
      </section>

      {/* ── Command Center Sync ── */}
      <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[var(--a-ink)] border-b border-[var(--a-border)] pb-3">
          Command Center Sync
        </h2>
        <p className="font-dm text-sm text-[var(--a-ink-3)]">
          Use these credentials to connect your Claude Code Command Center to this dashboard.
        </p>

        {/* Webhook URL */}
        <div>
          <label className="font-dm text-sm font-medium text-[var(--a-ink)] block mb-1">Webhook URL</label>
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="w-full px-4 py-2.5 bg-[var(--a-surface-2)] border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm text-[var(--a-ink)] cursor-text select-all focus:outline-none"
          />
        </div>

        {/* Webhook Token */}
        <div>
          <label className="font-dm text-sm font-medium text-[var(--a-ink)] block mb-1">Webhook Token</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? "text" : "password"}
                readOnly
                value={webhookToken}
                className="w-full px-4 py-2.5 bg-[var(--a-surface-2)] border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm text-[var(--a-ink)] pr-10 focus:outline-none select-all"
              />
              <button
                onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--a-ink-3)] hover:text-[var(--a-ink)]"
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              onClick={regenerateToken}
              className="flex items-center gap-1.5 px-4 py-2 border border-[var(--a-border)] bg-white rounded-[var(--a-radius-control)] text-sm font-dm text-[var(--a-ink)] hover:bg-[var(--a-surface-2)] transition-colors"
            >
              <RefreshCw size={13} /> Regenerate
            </button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div>
          <label className="font-dm text-sm font-medium text-[var(--a-ink)] block mb-2">Usage in Claude Code</label>
          <pre className="bg-[#0F2240] text-[#E8EFF8] text-xs font-mono rounded-[var(--a-radius-control)] p-4 overflow-x-auto leading-relaxed">
{`# In your CLAUDE.md or system prompt:
TIBLOGICS_WEBHOOK_URL="${webhookUrl}"
TIBLOGICS_WEBHOOK_TOKEN="<your-token>"

# Send event from Claude Code:
curl -X POST $TIBLOGICS_WEBHOOK_URL \\
  -H "Authorization: Bearer $TIBLOGICS_WEBHOOK_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"event": "task_complete", "message": "Build finished"}'`}
          </pre>
        </div>
      </section>

      {/* ── Meeting Integrations ── */}
      <MeetingIntegrations />

      {/* ── Team Access: moved to Team & Roles ── */}
      <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--a-radius-control)] bg-[var(--a-info-bg)] text-[var(--a-blue)]">
            <Shield size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-syne font-bold text-base text-[var(--a-ink)]">Team access</h2>
            <p className="font-dm text-sm text-[var(--a-ink-3)]">
              Invite staff, choose their role and what each person can open, and see their activity in Team &amp; Roles.
            </p>
          </div>
          <Link href="/admin_pro/team" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Users size={15} aria-hidden /> Open Team &amp; Roles
          </Link>
        </div>
      </section>

      {/* ── Admin Account ── */}
      <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[var(--a-ink)] border-b border-[var(--a-border)] pb-3">
          Admin Account
        </h2>

        <div className="bg-[var(--a-surface-2)] rounded-[var(--a-radius-control)] px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-dm text-[var(--a-ink-3)]">Admin email (locked)</span>
          <span className="text-sm font-dm font-semibold text-[#1B3A6B]">tieyiwebass@gmail.com</span>
          {isOwner && (
            <span className="flex items-center gap-1 text-xs font-dm font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 ml-auto">
              <Crown size={11} /> Owner
            </span>
          )}
        </div>

        <div className="space-y-3">
          <p className="font-dm text-sm font-semibold text-[var(--a-ink)]">Change Password</p>
          <p className="font-dm text-xs text-[var(--a-ink-3)] -mt-1">
            First time? Enter your current env-var password as the current password.
          </p>

          {[
            { label: "Current Password", value: currentPassword, setter: setCurrentPassword, id: "cp" },
            { label: "New Password (min 8 chars)", value: newPassword, setter: setNewPassword, id: "np" },
            { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, id: "cnp" },
          ].map(({ label, value, setter, id }) => (
            <div key={id}>
              <label htmlFor={id} className="font-dm text-xs text-[var(--a-ink-3)] block mb-1">{label}</label>
              <input
                id={id}
                type="password"
                value={value}
                onChange={e => setter(e.target.value)}
                className="w-full max-w-sm px-4 py-2.5 bg-white border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm text-[var(--a-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
              />
            </div>
          ))}
        </div>

        {pwStatus && (
          <div className={`flex items-center gap-2 text-sm font-dm rounded-[var(--a-radius-control)] px-4 py-3 ${
            pwStatus.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {pwStatus.type === "success"
              ? <CheckCircle size={15} />
              : <AlertCircle size={15} />}
            {pwStatus.msg}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={pwLoading}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pwLoading
            ? <><RefreshCw size={14} className="animate-spin" /> Updating…</>
            : <><Save size={14} /> Update Password</>}
        </button>
      </section>

      {/* ── Production Readiness ── */}
      {isOwner && <ClearDevDataSection />}
    </div>
  );
}

function ClearDevDataSection() {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; breakdown?: Record<string, number> } | null>(null);

  const confirmFn = useConfirm();
  async function handleClear() {
    if (!confirmed) return;
    const ok = await confirmFn({
      title: "Clear all dev and test data?",
      body: "Appointments, leads, prospects, analytics, agent sessions, scanner data and tool usage are permanently deleted. Projects, blog posts, collaborators and settings are kept.",
      confirmLabel: "Clear data",
      typeToConfirm: "CLEAR",
    });
    if (!ok) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/clear-dev-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "CLEAR_DEV_DATA" }),
      });
      const data = await res.json();
      setResult({ success: res.ok, message: data.message ?? data.error, breakdown: data.breakdown });
    } catch {
      setResult({ success: false, message: "Request failed." });
    } finally {
      setBusy(false);
      setConfirmed(false);
    }
  }

  return (
    <section className="bg-[var(--a-surface)] border border-red-200 rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-red-100 pb-3">
        <Trash2 size={16} className="text-red-500" />
        <h2 className="font-syne font-bold text-base text-red-600">Production readiness: clear dev data</h2>
      </div>

      <p className="font-dm text-sm text-[var(--a-ink-2)] leading-relaxed">
        Before going live, clear all test data created during development.
        This permanently deletes appointments, leads, prospects, analytics, agent sessions,
        scanner data, and tool usage logs. <strong>Projects, blog posts, collaborators, and settings are preserved.</strong>
      </p>

      <div className="bg-red-50 border border-red-100 rounded-[var(--a-radius-control)] px-4 py-3">
        <p className="font-dm text-xs text-red-700 font-semibold mb-1">This action cannot be undone.</p>
        <p className="font-dm text-xs text-red-700">Only use this once, right before launching production.</p>
      </div>

      {result && (
        <div className={`flex flex-col gap-1 px-4 py-3 rounded-[var(--a-radius-control)] text-sm font-dm border ${
          result.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
        }`}>
          <span className="font-semibold">{result.message}</span>
          {result.breakdown && (
            <div className="grid grid-cols-2 gap-x-4 mt-2 text-xs opacity-80">
              {Object.entries(result.breakdown).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k}>{k}: {v} deleted</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 accent-red-500"
          />
          <span className="font-dm text-sm text-[var(--a-ink-2)]">I understand this will permanently delete all dev/test data</span>
        </label>
      </div>

      <button
        onClick={handleClear}
        disabled={!confirmed || busy}
        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-dm font-semibold rounded-[var(--a-radius-control)] hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? <><RefreshCw size={14} className="animate-spin" /> Clearing…</> : <><Trash2 size={14} /> Clear Dev Data & Go Live</>}
      </button>
    </section>
  );
}

// ── Meeting Integrations Component ────────────────────────────────────────────

/** The owner's weekly growth email (lib/analytics/weekly-email.ts): on or off, saved at once. */
function WeeklyGrowthEmailToggle() {
  const [state, setState] = useState<{ enabled: boolean; recipient: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/admin/analytics/weekly-email")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setState({ enabled: !!j.enabled, recipient: String(j.recipient ?? "") }))
      .catch(() => {});
  }, []);
  if (!state) return null;
  async function flip() {
    if (!state) return;
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/admin/analytics/weekly-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !state.enabled }) }).catch(() => null);
    setBusy(false);
    if (r?.ok) setState({ ...state, enabled: !state.enabled });
    else setErr("Could not save.");
  }
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--a-border)] pt-4" data-testid="weekly-email-setting">
      <div>
        <p className="font-dm text-sm text-[var(--a-ink)]">Weekly growth email</p>
        <p className="font-dm text-xs text-[var(--a-ink-3)]">Mondays at 8:00, to {state.recipient}: KPIs, sources, funnel leaks, top pages and revenue.</p>
        {err && <p className="font-dm text-xs text-red-600">{err}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={state.enabled}
        aria-label="Weekly growth email"
        disabled={busy}
        onClick={flip}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${state.enabled ? "bg-[#2251A3]" : "bg-[#D2DCE8]"}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${state.enabled ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function MeetingIntegrations() {
  return (
    <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-6">
      <div className="border-b border-[var(--a-border)] pb-3">
        <h2 className="font-syne font-bold text-base text-[var(--a-ink)]">Meeting Integrations</h2>
        <p className="font-dm text-xs text-[var(--a-ink-3)] mt-0.5">
          Video meetings are powered by Jitsi Meet — no credentials or API keys needed.
        </p>
      </div>

      <div className="border border-green-200 bg-green-50/30 rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-5 flex items-start gap-4">
        <div className="w-9 h-9 bg-[#1D76BA]/10 rounded-[var(--a-radius-control)] flex items-center justify-center shrink-0">
          <Video size={18} className="text-[#1D76BA]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-dm text-sm font-semibold text-[var(--a-ink)]">Jitsi Meet</p>
            <span className="flex items-center gap-1 text-xs font-dm px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
              <CheckCircle size={11} /> Active
            </span>
          </div>
          <p className="font-dm text-xs text-[var(--a-ink-3)] mt-0.5">meet.jit.si — free, no account required</p>
          <p className="font-dm text-xs text-[var(--a-ink-2)] mt-3 leading-relaxed">
            When you confirm a booking, the system automatically generates a unique{" "}
            <span className="font-semibold text-[#1D76BA]">meet.jit.si</span> room link and sends it
            to the client in their confirmation email. No setup needed.
          </p>
        </div>
      </div>

      <div className="bg-[var(--a-info-bg)] border border-[#C7D7F0] rounded-[var(--a-radius-control)] px-4 py-3 space-y-1">
        <p className="font-dm text-xs font-semibold text-[var(--a-blue)]">How it works</p>
        <p className="font-dm text-xs text-[var(--a-blue)]/80 leading-relaxed">
          1. Client books → 2. Admin clicks "Confirm" → 3. System generates a Jitsi Meet room → 4. Client receives branded email with "Join on Jitsi Meet" button. No manual copy-paste.
        </p>
      </div>
    </section>
  );
}
