"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader, useConfirm, useToast } from "@/components/admin/ui";
import { Plus, X, Eye, EyeOff, RefreshCw, Save, CheckCircle, AlertCircle, Video, Calendar, Trash2, Users, Mail, Shield, Activity, ChevronDown, ChevronUp, UserX, UserCheck, Crown, KeyRound } from "lucide-react";

const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BUFFER_OPTIONS = ["15 min", "30 min", "45 min", "60 min"];
const NOTIFICATION_TOGGLES = [
  { id: "newBooking", label: "New booking confirmation" },
  { id: "cancellation", label: "Booking cancellation" },
  { id: "reminder24h", label: "24-hour appointment reminder" },
  { id: "newProspect", label: "New prospect from scanner" },
];

/**
 * Settings screen. Almost all of it is local form state with no initial read —
 * the one exception is the team roster, which page.tsx now reads from Prisma on
 * the server and hands down through `collaborators` / `activityLogs`.
 */
export default function SettingsClient({
  collaborators,
  activityLogs,
}: {
  collaborators: Collaborator[];
  activityLogs: ActivityLog[];
}) {
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
      <PageHeader title="Settings" subtitle="Booking, notifications, integrations and team access." className="mb-0" />

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

      {/* ── Team Access ── */}
      <TeamAccess collaborators={collaborators} logs={activityLogs} />

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

// ── Team Access Component ─────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  { key: "appointments",     label: "Appointments" },
  { key: "contacts",         label: "Contacts" },
  { key: "prospects",        label: "Prospects" },
  { key: "blog",             label: "Blog & Newsletter" },
  { key: "analytics",        label: "Analytics" },
  { key: "service_requests", label: "Service Requests" },
  { key: "scanner_leads",    label: "Scanner Leads" },
  { key: "revenue",          label: "Revenue" },
  { key: "tools",            label: "Tool Analytics" },
  { key: "agents",           label: "AI Agents" },
  { key: "command_center",   label: "Command Center" },
  // Lead workspace + drafting outreach. Approving/sending stays admin-only.
  { key: "growth",           label: "Growth: leads & outreach" },
  // ARFA admin pages (tracks, cohorts, live, events) and read-only learner records.
  { key: "events",           label: "ARFA · AI Academy & Events" },
  { key: "learners",         label: "Learners (read only)" },
];

const ROLE_PRESETS: Record<string, string[]> = {
  FULL:    ALL_PERMISSIONS.map(p => p.key),
  SUPPORT: ["appointments", "contacts", "service_requests"],
  EDITOR:  ["blog"],
  ANALYST: ["analytics", "revenue", "tools"],
  CUSTOM:  [],
};

const ROLE_COLORS: Record<string, string> = {
  FULL:    "bg-[var(--a-navy)] text-white",
  SUPPORT: "bg-blue-100 text-blue-700",
  EDITOR:  "bg-purple-100 text-purple-700",
  ANALYST: "bg-teal-100 text-teal-700",
  CUSTOM:  "bg-gray-100 text-gray-600",
};

type Collaborator = {
  id: string; name: string; email: string; role: string;
  permissions: string[]; isAdmin: boolean; active: boolean; lastLoginAt: string | null;
  inviteToken: string | null; createdAt: string;
};

type ActivityLog = {
  id: string; action: string; resource: string; details: string | null;
  ip: string | null; createdAt: string;
  collaborator: { name: string; email: string; role: string };
};

/**
 * The roster and the activity feed are props read from Prisma by page.tsx, not
 * state: nothing here edits them locally. `load()` therefore asks the server to
 * re-run that read instead of re-fetching /api/admin/collaborators, and the
 * invite/suspend/delete calls it follows are untouched.
 */
function TeamAccess({
  collaborators,
  logs,
}: {
  collaborators: Collaborator[];
  logs: ActivityLog[];
}) {
  const { data: session } = useSession();
  const isOwner = session?.user?.isOwner ?? false;
  const router = useRouter();
  const confirmFn = useConfirm();
  const toast = useToast();

  const [showLogs, setShowLogs] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CUSTOM");
  const [invitePerms, setInvitePerms] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  // Re-read the roster after a mutation by re-running the server component.
  function load() {
    router.refresh();
  }

  function applyPreset(role: string) {
    setInviteRole(role);
    setInvitePerms(ROLE_PRESETS[role] ?? []);
  }

  function togglePerm(key: string) {
    setInvitePerms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  }

  async function handleInvite() {
    setInviteStatus(null);
    setInviteLink(null);
    if (!inviteName.trim()) { setInviteStatus({ type: "error", msg: "Name is required" }); return; }
    if (!inviteEmail.trim()) { setInviteStatus({ type: "error", msg: "Email is required" }); return; }
    setInviting(true);
    try {
      const res = await fetch("/api/admin/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole, permissions: invitePerms }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteStatus({ type: "success", msg: `Invitation sent to ${inviteEmail}` });
        setInviteLink(data.inviteUrl);
        setInviteName(""); setInviteEmail(""); setInviteRole("CUSTOM"); setInvitePerms([]);
        load();
      } else {
        setInviteStatus({ type: "error", msg: data.error ?? "Failed to invite" });
      }
    } finally {
      setInviting(false);
    }
  }

  async function toggleActive(collab: Collaborator) {
    await fetch(`/api/admin/collaborators/${collab.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !collab.active }),
    });
    load();
  }

  async function grantAdmin(id: string, grant: boolean) {
    const res = await fetch(`/api/admin/collaborators/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: grant }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error("Could not update admin status", data.error ?? undefined); return; }
    toast.success(grant ? "Admin access granted" : "Admin access removed");
    load();
  }

  async function resetPassword(id: string, name: string) {
    setResetStatus(null);
    if (!(await confirmFn({ title: `Send a password reset email to ${name}?`, confirmLabel: "Send reset email", danger: false }))) return;
    const res = await fetch(`/api/admin/collaborators/${id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setResetStatus({ id, msg: res.ok ? "Reset email sent." : (data.error ?? "Failed to send reset."), ok: res.ok });
  }

  async function deleteCollab(id: string) {
    if (!(await confirmFn({ title: "Remove this collaborator?", body: "They lose access immediately. This cannot be undone.", confirmLabel: "Remove" }))) return;
    const res = await fetch(`/api/admin/collaborators/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Collaborator removed");
    else toast.error("Could not remove the collaborator");
    load();
  }

  return (
    <section className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-6">
      <h2 className="font-syne font-bold text-base text-[var(--a-ink)] border-b border-[var(--a-border)] pb-3 flex items-center gap-2">
        <Users size={16} className="text-[var(--a-blue)]" /> Team Access & Collaborators
      </h2>

      {/* Invite Form */}
      <div className="bg-[var(--a-surface-2)] rounded-[var(--a-radius-control)] p-5 space-y-4">
        <p className="font-dm text-sm font-semibold text-[var(--a-ink)] flex items-center gap-2">
          <Mail size={14} /> Invite Collaborator
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-dm text-xs text-[var(--a-ink-3)] block mb-1">Full Name</label>
            <input value={inviteName} onChange={e => setInviteName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-[var(--a-border)] bg-white rounded-[var(--a-radius-control)] px-3 py-2 text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]" />
          </div>
          <div>
            <label className="font-dm text-xs text-[var(--a-ink-3)] block mb-1">Email Address</label>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              type="email" placeholder="jane@example.com"
              className="w-full border border-[var(--a-border)] bg-white rounded-[var(--a-radius-control)] px-3 py-2 text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]" />
          </div>
        </div>

        {/* Role presets */}
        <div>
          <label className="font-dm text-xs text-[var(--a-ink-3)] block mb-2">Role Preset</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(ROLE_PRESETS).map(r => (
              <button key={r} onClick={() => applyPreset(r)}
                className={`px-3 py-1 rounded-full text-xs font-dm font-semibold border transition-all ${
                  inviteRole === r
                    ? "border-[#2251A3] bg-[#2251A3] text-white"
                    : "border-[var(--a-border)] bg-white text-[var(--a-ink-2)] hover:bg-[var(--a-info-bg)]"
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Permission checkboxes */}
        <div>
          <label className="font-dm text-xs text-[var(--a-ink-3)] block mb-2 flex items-center gap-1">
            <Shield size={11} /> Permissions
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_PERMISSIONS.map(p => (
              <label key={p.key} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={invitePerms.includes(p.key)}
                  onChange={() => togglePerm(p.key)}
                  className="w-4 h-4 rounded border-[var(--a-border)] accent-[#2251A3]" />
                <span className="font-dm text-xs text-[var(--a-ink-2)] group-hover:text-[var(--a-ink)]">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {inviteStatus && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-[var(--a-radius-control)] font-dm ${
            inviteStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}>
            {inviteStatus.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {inviteStatus.msg}
          </div>
        )}
        {inviteLink && (
          <div className="bg-[var(--a-info-bg)] border border-[#C7D7F0] rounded-[var(--a-radius-control)] px-4 py-3">
            <p className="font-dm text-xs text-[var(--a-blue)] font-semibold mb-1">Invite link (share manually if email fails):</p>
            <p className="font-dm text-xs text-[var(--a-blue)] break-all">{inviteLink}</p>
          </div>
        )}
        <button onClick={handleInvite} disabled={inviting}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 text-sm">
          {inviting ? <><RefreshCw size={13} className="animate-spin" /> Sending…</> : <><Plus size={13} /> Send Invitation</>}
        </button>
      </div>

      {/* Collaborator List */}
      <div>
        <p className="font-dm text-sm font-semibold text-[var(--a-ink)] mb-3 flex items-center gap-2">
          <Users size={14} /> Active Collaborators ({collaborators.length})
        </p>
        {/* Server-rendered, so there is no loading placeholder to show. */}
        {collaborators.length === 0 ? (
          <div className="bg-[var(--a-surface-2)] rounded-[var(--a-radius-control)] px-4 py-6 text-center">
            <p className="font-dm text-sm text-[var(--a-ink-3)]">No collaborators yet. Invite someone above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collaborators.map(c => (
              <div key={c.id} className={`rounded-[var(--a-radius-control)] border transition-colors ${
                c.active ? "bg-white border-[var(--a-border)]" : "bg-[var(--a-surface-2)] border-[var(--a-border)] opacity-60"
              }`}>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-dm text-sm font-semibold text-[var(--a-ink)]">{c.name}</span>
                      <span className={`text-xs font-dm font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[c.role] ?? ROLE_COLORS.CUSTOM}`}>
                        {c.role}
                      </span>
                      {c.isAdmin && (
                        <span className="flex items-center gap-1 text-xs font-dm font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          <Crown size={10} /> Admin
                        </span>
                      )}
                      {c.inviteToken && (
                        <span className="text-xs font-dm bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                      )}
                      {!c.active && (
                        <span className="text-xs font-dm bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspended</span>
                      )}
                    </div>
                    <p className="font-dm text-xs text-[var(--a-ink-3)] mt-0.5">{c.email}</p>
                    <p className="font-dm text-xs text-[var(--a-ink-3)]">
                      {c.isAdmin ? "Full admin access (all permissions)" : `Permissions: ${c.permissions.length === 0 ? "None" : c.permissions.join(", ")}`}
                    </p>
                    {c.lastLoginAt && (
                      <p className="font-dm text-xs text-[var(--a-ink-3)]">
                        Last login: {new Date(c.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                    {resetStatus?.id === c.id && (
                      <p className={`text-xs font-dm mt-1 ${resetStatus.ok ? "text-green-600" : "text-red-500"}`}>{resetStatus.msg}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isOwner && (
                      <button
                        onClick={() => grantAdmin(c.id, !c.isAdmin)}
                        title={c.isAdmin ? "Revoke admin access" : "Grant admin access"}
                        className={`p-1.5 rounded-lg transition-colors text-xs font-dm ${
                          c.isAdmin
                            ? "hover:bg-amber-50 text-amber-500 hover:text-amber-700"
                            : "hover:bg-[var(--a-surface-2)] text-[var(--a-ink-3)] hover:text-amber-600"
                        }`}
                      >
                        <Crown size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => resetPassword(c.id, c.name)}
                      title="Send password reset email"
                      className="p-1.5 rounded-lg hover:bg-[var(--a-surface-2)] text-[var(--a-ink-3)] hover:text-[var(--a-blue)] transition-colors"
                    >
                      <KeyRound size={15} />
                    </button>
                    <button onClick={() => toggleActive(c)} title={c.active ? "Suspend" : "Reactivate"}
                      className="p-1.5 rounded-lg hover:bg-[var(--a-surface-2)] text-[var(--a-ink-3)] hover:text-[var(--a-ink)] transition-colors">
                      {c.active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button onClick={() => deleteCollab(c.id)} title="Remove permanently"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--a-ink-3)] hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Logs */}
      <div>
        <button onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-2 font-dm text-sm font-semibold text-[var(--a-ink)] hover:text-[var(--a-blue)] transition-colors">
          <Activity size={14} /> Collaborator Activity Log ({logs.length})
          {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showLogs && (
          <div className="mt-3 border border-[var(--a-border)] rounded-[var(--a-radius-control)] overflow-hidden">
            {logs.length === 0 ? (
              <p className="font-dm text-sm text-[var(--a-ink-3)] px-4 py-4">No activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-[var(--a-border)] max-h-80 overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[var(--a-surface-2)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-dm text-xs font-semibold text-[var(--a-ink)]">{log.collaborator.name}</span>
                        <span className="font-dm text-xs text-[var(--a-ink-3)]">{log.collaborator.email}</span>
                        <span className="font-dm text-xs bg-[var(--a-info-bg)] text-[var(--a-blue)] px-2 py-0.5 rounded-full">{log.action}</span>
                        <span className="font-dm text-xs text-[var(--a-ink-3)]">{log.resource}</span>
                      </div>
                      {log.details && (
                        <p className="font-dm text-xs text-[var(--a-ink-3)] mt-0.5">{log.details}</p>
                      )}
                    </div>
                    <span className="font-dm text-xs text-[var(--a-ink-3)] shrink-0">
                      {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" "}{new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
