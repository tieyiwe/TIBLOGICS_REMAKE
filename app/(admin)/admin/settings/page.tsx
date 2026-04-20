"use client";
import { useState, useEffect } from "react";
import { Plus, X, Eye, EyeOff, RefreshCw, Save, CheckCircle, AlertCircle, Video, Calendar, Trash2 } from "lucide-react";

const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BUFFER_OPTIONS = ["15 min", "30 min", "45 min", "60 min"];
const NOTIFICATION_TOGGLES = [
  { id: "newBooking", label: "New booking confirmation" },
  { id: "cancellation", label: "Booking cancellation" },
  { id: "reminder24h", label: "24-hour appointment reminder" },
  { id: "newProspect", label: "New prospect from scanner" },
];

export default function SettingsPage() {
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

      {/* ── Admin Account ── */}
      <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[#0D1B2A] border-b border-[#F4F7FB] pb-3">
          Admin Account
        </h2>

        <div className="bg-[#F4F7FB] rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xs font-dm text-[#7A8FA6]">Admin email (locked)</span>
          <span className="text-sm font-dm font-semibold text-[#1B3A6B]">Tieyiwebass@gmail.com</span>
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
