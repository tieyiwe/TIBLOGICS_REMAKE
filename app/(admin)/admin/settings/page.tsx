"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, X, Eye, EyeOff, RefreshCw, Save, CheckCircle, AlertCircle, Video, Calendar, Trash2, Users, Mail, Shield, Activity, ChevronDown, ChevronUp, UserX, UserCheck, Crown, KeyRound } from "lucide-react";

const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BUFFER_OPTIONS = ["15 min", "30 min", "45 min", "60 min"];
const NOTIFICATION_TOGGLES = [
  { id: "newBooking", label: "New booking confirmation" },
  { id: "cancellation", label: "Booking cancellation" },
  { id: "reminder24h", label: "24-hour appointment reminder" },
  { id: "newProspect", label: "New prospect from scanner" },
];

export default function SettingsPage() {
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
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Settings</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Manage booking, notifications, and integrations</p>
      </div>

      {/* ── Booking Settings ── */}
      <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[#0D1B2A] border-b border-[#F4F7FB] pb-3">
          Booking Settings
        </h2>

        {/* Time slots */}
        <div>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-2">Available Time Slots</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {timeSlots.map(slot => (
              <span
                key={slot}
                className="flex items-center gap-1.5 bg-[#EBF0FA] text-[#2251A3] text-sm font-dm px-3 py-1 rounded-full"
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
              className="flex-1 max-w-[180px] px-3 py-2 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
            />
            <button
              onClick={addSlot}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#EBF0FA] text-[#2251A3] text-sm font-dm rounded-xl hover:bg-[#2251A3] hover:text-white transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Working days */}
        <div>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-2">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {WORKING_DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 text-sm font-dm rounded-xl border transition-colors ${
                  workingDays.includes(day)
                    ? "bg-[#1B3A6B] border-[#1B3A6B] text-white"
                    : "bg-white border-[#D2DCE8] text-[#7A8FA6] hover:bg-[#F4F7FB]"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Buffer time */}
        <div>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-2">Buffer Time Between Appointments</label>
          <select
            value={bufferTime}
            onChange={e => setBufferTime(e.target.value)}
            className="bg-white border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
          >
            {BUFFER_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <button className="btn-primary flex items-center gap-2">
          <Save size={14} /> Save Booking Settings
        </button>
      </section>

      {/* ── Notification Settings ── */}
      <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[#0D1B2A] border-b border-[#F4F7FB] pb-3">
          Notification Settings
        </h2>

        <div>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-1">Notification Email</label>
          <input
            type="email"
            value={notifEmail}
            onChange={e => setNotifEmail(e.target.value)}
            className="w-full max-w-sm px-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
          />
        </div>

        <div className="space-y-3">
          {NOTIFICATION_TOGGLES.map(n => (
            <div key={n.id} className="flex items-center justify-between">
              <span className="font-dm text-sm text-[#0D1B2A]">{n.label}</span>
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
      <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[#0D1B2A] border-b border-[#F4F7FB] pb-3">
          Command Center Sync
        </h2>
        <p className="font-dm text-sm text-[#7A8FA6]">
          Use these credentials to connect your Claude Code Command Center to this dashboard.
        </p>

        {/* Webhook URL */}
        <div>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-1">Webhook URL</label>
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="w-full px-4 py-2.5 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] cursor-text select-all focus:outline-none"
          />
        </div>

        {/* Webhook Token */}
        <div>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-1">Webhook Token</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? "text" : "password"}
                readOnly
                value={webhookToken}
                className="w-full px-4 py-2.5 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] pr-10 focus:outline-none select-all"
              />
              <button
                onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA6] hover:text-[#0D1B2A]"
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              onClick={regenerateToken}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#D2DCE8] bg-white rounded-xl text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB] transition-colors"
            >
              <RefreshCw size={13} /> Regenerate
            </button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-2">Usage in Claude Code</label>
          <pre className="bg-[#0F2240] text-[#E8EFF8] text-xs font-mono rounded-xl p-4 overflow-x-auto leading-relaxed">
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
      <TeamAccess />

      {/* ── Admin Account ── */}
      <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[#0D1B2A] border-b border-[#F4F7FB] pb-3">
          Admin Account
        </h2>

        <div className="bg-[#F4F7FB] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-dm text-[#7A8FA6]">Admin email (locked)</span>
          <span className="text-sm font-dm font-semibold text-[#1B3A6B]">tieyiwebass@gmail.com</span>
          {isOwner && (
            <span className="flex items-center gap-1 text-xs font-dm font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 ml-auto">
              <Crown size={11} /> Owner
            </span>
          )}
        </div>

        <div className="space-y-3">
          <p className="font-dm text-sm font-semibold text-[#0D1B2A]">Change Password</p>
          <p className="font-dm text-xs text-[#7A8FA6] -mt-1">
            First time? Enter your current env-var password as the current password.
          </p>

          {[
            { label: "Current Password", value: currentPassword, setter: setCurrentPassword, id: "cp" },
            { label: "New Password (min 8 chars)", value: newPassword, setter: setNewPassword, id: "np" },
            { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, id: "cnp" },
          ].map(({ label, value, setter, id }) => (
            <div key={id}>
              <label htmlFor={id} className="font-dm text-xs text-[#7A8FA6] block mb-1">{label}</label>
              <input
                id={id}
                type="password"
                value={value}
                onChange={e => setter(e.target.value)}
                className="w-full max-w-sm px-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
              />
            </div>
          ))}
        </div>

        {pwStatus && (
          <div className={`flex items-center gap-2 text-sm font-dm rounded-xl px-4 py-3 ${
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
    </div>
  );
}

// ── Meeting Integrations Component ────────────────────────────────────────────

function ProviderCard({
  icon,
  iconBg,
  iconColor,
  name,
  subtitle,
  connected,
  fields,
  values,
  onChange,
  onSave,
  onTest,
  onDisconnect,
  busy,
  feedback,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  name: string;
  subtitle: string;
  connected: boolean;
  fields: { id: string; label: string }[];
  values: Record<string, string>;
  onChange: (id: string, v: string) => void;
  onSave: () => void;
  onTest: () => void;
  onDisconnect: () => void;
  busy: string | null;
  feedback: { type: "ok" | "err"; msg: string } | null;
}) {
  const allFilled = fields.every((f) => values[f.id]?.trim());

  return (
    <div className={`border rounded-2xl p-5 space-y-4 transition-colors ${connected ? "border-green-200 bg-green-50/30" : "border-[#D2DCE8]"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{name}</p>
          <p className="font-dm text-xs text-[#7A8FA6]">{subtitle}</p>
        </div>
        {connected ? (
          <span className="ml-auto flex items-center gap-1 text-xs font-dm px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
            <CheckCircle size={11} /> Connected
          </span>
        ) : (
          <span className="ml-auto text-xs font-dm px-2.5 py-1 rounded-full bg-[#F4F7FB] text-[#7A8FA6] border border-[#E8EFF8]">
            Not connected
          </span>
        )}
      </div>

      {fields.map(({ id, label }) => (
        <div key={id}>
          <label htmlFor={id} className="font-dm text-xs text-[#7A8FA6] block mb-1">{label}</label>
          <input
            id={id}
            type="password"
            autoComplete="new-password"
            value={values[id] ?? ""}
            onChange={(e) => onChange(id, e.target.value)}
            placeholder={connected ? "••••••• (stored)" : `Enter ${label}`}
            className="w-full max-w-sm px-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
          />
        </div>
      ))}

      {feedback && (
        <div className={`flex items-center gap-2 text-sm font-dm rounded-xl px-4 py-3 border ${
          feedback.type === "ok"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {feedback.type === "ok" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onTest}
          disabled={!allFilled || busy === "test"}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-[#D2DCE8] bg-white text-sm font-dm text-[#0D1B2A] rounded-xl hover:bg-[#F4F7FB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy === "test" ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
          Test Connection
        </button>
        <button
          onClick={onSave}
          disabled={!allFilled || busy === "save"}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B3A6B] text-white text-sm font-dm font-semibold rounded-xl hover:bg-[#2251A3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy === "save" ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          Save Credentials
        </button>
        {connected && (
          <button
            onClick={onDisconnect}
            disabled={!!busy}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-500 text-sm font-dm rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={13} /> Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

function MeetingIntegrations() {
  const [status, setStatus] = useState<{ zoom: boolean; google: boolean }>({ zoom: false, google: false });
  const [zoomVals, setZoomVals] = useState<Record<string, string>>({ zoom_account_id: "", zoom_client_id: "", zoom_client_secret: "" });
  const [googleVals, setGoogleVals] = useState<Record<string, string>>({ google_client_id: "", google_client_secret: "", google_refresh_token: "" });
  const [zoomBusy, setZoomBusy] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState<string | null>(null);
  const [zoomFeedback, setZoomFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [googleFeedback, setGoogleFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/meeting-settings")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function handleZoom(action: "save" | "test") {
    setZoomBusy(action);
    setZoomFeedback(null);
    try {
      const res = await fetch("/api/admin/meeting-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "zoom",
          test: action === "test",
          zoom: {
            accountId: zoomVals.zoom_account_id,
            clientId: zoomVals.zoom_client_id,
            clientSecret: zoomVals.zoom_client_secret,
          },
        }),
      });
      const data = await res.json();
      if (action === "test") {
        setZoomFeedback({ type: data.success ? "ok" : "err", msg: data.message });
      } else {
        setZoomFeedback({ type: "ok", msg: "Credentials saved. Meetings will now be auto-created on Zoom." });
        setStatus((s) => ({ ...s, zoom: true }));
        setZoomVals({ zoom_account_id: "", zoom_client_id: "", zoom_client_secret: "" });
      }
    } catch {
      setZoomFeedback({ type: "err", msg: "Request failed. Try again." });
    } finally {
      setZoomBusy(null);
    }
  }

  async function handleGoogle(action: "save" | "test") {
    setGoogleBusy(action);
    setGoogleFeedback(null);
    try {
      const res = await fetch("/api/admin/meeting-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          test: action === "test",
          google: {
            clientId: googleVals.google_client_id,
            clientSecret: googleVals.google_client_secret,
            refreshToken: googleVals.google_refresh_token,
          },
        }),
      });
      const data = await res.json();
      if (action === "test") {
        setGoogleFeedback({ type: data.success ? "ok" : "err", msg: data.message });
      } else {
        setGoogleFeedback({ type: "ok", msg: "Credentials saved. Meetings will now be auto-created on Google Meet." });
        setStatus((s) => ({ ...s, google: true }));
        setGoogleVals({ google_client_id: "", google_client_secret: "", google_refresh_token: "" });
      }
    } catch {
      setGoogleFeedback({ type: "err", msg: "Request failed. Try again." });
    } finally {
      setGoogleBusy(null);
    }
  }

  async function disconnect(provider: "zoom" | "google") {
    await fetch("/api/admin/meeting-settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    setStatus((s) => ({ ...s, [provider]: false }));
    if (provider === "zoom") setZoomFeedback({ type: "ok", msg: "Zoom disconnected." });
    else setGoogleFeedback({ type: "ok", msg: "Google Meet disconnected." });
  }

  return (
    <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-6">
      <div className="border-b border-[#F4F7FB] pb-3">
        <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Meeting Integrations</h2>
        <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">
          When a booking is confirmed, the system auto-creates a meeting and sends the link to the client.
          Zoom takes priority; Google Meet is the fallback.
        </p>
      </div>

      <ProviderCard
        icon={<Video size={18} />}
        iconBg="bg-[#2D8CFF]/10"
        iconColor="text-[#2D8CFF]"
        name="Zoom"
        subtitle="Server-to-Server OAuth App (Marketplace → Build App)"
        connected={status.zoom}
        fields={[
          { id: "zoom_account_id", label: "Account ID" },
          { id: "zoom_client_id", label: "Client ID" },
          { id: "zoom_client_secret", label: "Client Secret" },
        ]}
        values={zoomVals}
        onChange={(id, v) => setZoomVals((prev) => ({ ...prev, [id]: v }))}
        onSave={() => handleZoom("save")}
        onTest={() => handleZoom("test")}
        onDisconnect={() => disconnect("zoom")}
        busy={zoomBusy}
        feedback={zoomFeedback}
      />

      <ProviderCard
        icon={<Calendar size={18} />}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        name="Google Meet"
        subtitle="Google Cloud Console → OAuth 2.0 → Calendar API"
        connected={status.google}
        fields={[
          { id: "google_client_id", label: "OAuth Client ID" },
          { id: "google_client_secret", label: "OAuth Client Secret" },
          { id: "google_refresh_token", label: "Refresh Token" },
        ]}
        values={googleVals}
        onChange={(id, v) => setGoogleVals((prev) => ({ ...prev, [id]: v }))}
        onSave={() => handleGoogle("save")}
        onTest={() => handleGoogle("test")}
        onDisconnect={() => disconnect("google")}
        busy={googleBusy}
        feedback={googleFeedback}
      />

      <div className="bg-[#EBF0FA] border border-[#C7D7F0] rounded-xl px-4 py-3 space-y-1">
        <p className="font-dm text-xs font-semibold text-[#2251A3]">How auto-meeting works</p>
        <p className="font-dm text-xs text-[#2251A3]/80 leading-relaxed">
          1. Client books → 2. Admin clicks "Confirm" (or free booking auto-confirms) → 3. System calls Zoom/Google API → 4. Meeting created → 5. Client receives branded email with "Join Meeting" button. No manual copy-paste.
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
];

const ROLE_PRESETS: Record<string, string[]> = {
  FULL:    ALL_PERMISSIONS.map(p => p.key),
  SUPPORT: ["appointments", "contacts", "service_requests"],
  EDITOR:  ["blog"],
  ANALYST: ["analytics", "revenue", "tools"],
  CUSTOM:  [],
};

const ROLE_COLORS: Record<string, string> = {
  FULL:    "bg-[#1B3A6B] text-white",
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

function TeamAccess() {
  const { data: session } = useSession();
  const isOwner = session?.user?.isOwner ?? false;

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CUSTOM");
  const [invitePerms, setInvitePerms] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        fetch("/api/admin/collaborators"),
        fetch("/api/admin/collaborators/activity?limit=50"),
      ]);
      if (cRes.ok) setCollaborators(await cRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } finally {
      setLoading(false);
    }
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
    if (!res.ok) { alert(data.error ?? "Failed to update admin status"); return; }
    load();
  }

  async function resetPassword(id: string, name: string) {
    setResetStatus(null);
    if (!confirm(`Send a password reset email to ${name}?`)) return;
    const res = await fetch(`/api/admin/collaborators/${id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setResetStatus({ id, msg: res.ok ? "Reset email sent." : (data.error ?? "Failed to send reset."), ok: res.ok });
  }

  async function deleteCollab(id: string) {
    if (!confirm("Permanently remove this collaborator? This cannot be undone.")) return;
    await fetch(`/api/admin/collaborators/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-6">
      <h2 className="font-syne font-bold text-base text-[#0D1B2A] border-b border-[#F4F7FB] pb-3 flex items-center gap-2">
        <Users size={16} className="text-[#2251A3]" /> Team Access & Collaborators
      </h2>

      {/* Invite Form */}
      <div className="bg-[#F4F7FB] rounded-xl p-5 space-y-4">
        <p className="font-dm text-sm font-semibold text-[#0D1B2A] flex items-center gap-2">
          <Mail size={14} /> Invite Collaborator
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-dm text-xs text-[#7A8FA6] block mb-1">Full Name</label>
            <input value={inviteName} onChange={e => setInviteName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-[#D2DCE8] bg-white rounded-xl px-3 py-2 text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]" />
          </div>
          <div>
            <label className="font-dm text-xs text-[#7A8FA6] block mb-1">Email Address</label>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              type="email" placeholder="jane@example.com"
              className="w-full border border-[#D2DCE8] bg-white rounded-xl px-3 py-2 text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]" />
          </div>
        </div>

        {/* Role presets */}
        <div>
          <label className="font-dm text-xs text-[#7A8FA6] block mb-2">Role Preset</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(ROLE_PRESETS).map(r => (
              <button key={r} onClick={() => applyPreset(r)}
                className={`px-3 py-1 rounded-full text-xs font-dm font-semibold border transition-all ${
                  inviteRole === r
                    ? "border-[#2251A3] bg-[#2251A3] text-white"
                    : "border-[#D2DCE8] bg-white text-[#3A4A5C] hover:bg-[#EBF0FA]"
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Permission checkboxes */}
        <div>
          <label className="font-dm text-xs text-[#7A8FA6] block mb-2 flex items-center gap-1">
            <Shield size={11} /> Permissions
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_PERMISSIONS.map(p => (
              <label key={p.key} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={invitePerms.includes(p.key)}
                  onChange={() => togglePerm(p.key)}
                  className="w-4 h-4 rounded border-[#D2DCE8] accent-[#2251A3]" />
                <span className="font-dm text-xs text-[#3A4A5C] group-hover:text-[#0D1B2A]">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {inviteStatus && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-dm ${
            inviteStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}>
            {inviteStatus.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {inviteStatus.msg}
          </div>
        )}
        {inviteLink && (
          <div className="bg-[#EBF0FA] border border-[#C7D7F0] rounded-xl px-4 py-3">
            <p className="font-dm text-xs text-[#2251A3] font-semibold mb-1">Invite link (share manually if email fails):</p>
            <p className="font-dm text-xs text-[#2251A3] break-all">{inviteLink}</p>
          </div>
        )}
        <button onClick={handleInvite} disabled={inviting}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 text-sm">
          {inviting ? <><RefreshCw size={13} className="animate-spin" /> Sending…</> : <><Plus size={13} /> Send Invitation</>}
        </button>
      </div>

      {/* Collaborator List */}
      <div>
        <p className="font-dm text-sm font-semibold text-[#0D1B2A] mb-3 flex items-center gap-2">
          <Users size={14} /> Active Collaborators ({collaborators.length})
        </p>
        {loading ? (
          <p className="font-dm text-sm text-[#7A8FA6]">Loading…</p>
        ) : collaborators.length === 0 ? (
          <div className="bg-[#F4F7FB] rounded-xl px-4 py-6 text-center">
            <p className="font-dm text-sm text-[#7A8FA6]">No collaborators yet. Invite someone above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collaborators.map(c => (
              <div key={c.id} className={`rounded-xl border transition-colors ${
                c.active ? "bg-white border-[#D2DCE8]" : "bg-[#F4F7FB] border-[#E8EFF8] opacity-60"
              }`}>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-dm text-sm font-semibold text-[#0D1B2A]">{c.name}</span>
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
                    <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{c.email}</p>
                    <p className="font-dm text-xs text-[#7A8FA6]">
                      {c.isAdmin ? "Full admin access (all permissions)" : `Permissions: ${c.permissions.length === 0 ? "None" : c.permissions.join(", ")}`}
                    </p>
                    {c.lastLoginAt && (
                      <p className="font-dm text-xs text-[#7A8FA6]">
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
                            : "hover:bg-[#F4F7FB] text-[#7A8FA6] hover:text-amber-600"
                        }`}
                      >
                        <Crown size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => resetPassword(c.id, c.name)}
                      title="Send password reset email"
                      className="p-1.5 rounded-lg hover:bg-[#F4F7FB] text-[#7A8FA6] hover:text-[#2251A3] transition-colors"
                    >
                      <KeyRound size={15} />
                    </button>
                    <button onClick={() => toggleActive(c)} title={c.active ? "Suspend" : "Reactivate"}
                      className="p-1.5 rounded-lg hover:bg-[#F4F7FB] text-[#7A8FA6] hover:text-[#0D1B2A] transition-colors">
                      {c.active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button onClick={() => deleteCollab(c.id)} title="Remove permanently"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#7A8FA6] hover:text-red-600 transition-colors">
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
          className="flex items-center gap-2 font-dm text-sm font-semibold text-[#0D1B2A] hover:text-[#2251A3] transition-colors">
          <Activity size={14} /> Collaborator Activity Log ({logs.length})
          {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showLogs && (
          <div className="mt-3 border border-[#E8EFF8] rounded-xl overflow-hidden">
            {logs.length === 0 ? (
              <p className="font-dm text-sm text-[#7A8FA6] px-4 py-4">No activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-[#F4F7FB] max-h-80 overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[#F4F7FB]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-dm text-xs font-semibold text-[#0D1B2A]">{log.collaborator.name}</span>
                        <span className="font-dm text-xs text-[#7A8FA6]">{log.collaborator.email}</span>
                        <span className="font-dm text-xs bg-[#EBF0FA] text-[#2251A3] px-2 py-0.5 rounded-full">{log.action}</span>
                        <span className="font-dm text-xs text-[#7A8FA6]">{log.resource}</span>
                      </div>
                      {log.details && (
                        <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{log.details}</p>
                      )}
                    </div>
                    <span className="font-dm text-xs text-[#7A8FA6] shrink-0">
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
