"use client";
import { useState } from "react";
import { Plus, X, Eye, EyeOff, RefreshCw, Save } from "lucide-react";

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

  // Admin account
  const [displayName, setDisplayName] = useState("TIB Admin");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

      {/* ── Admin Account ── */}
      <section className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-6">
        <h2 className="font-syne font-bold text-base text-[#0D1B2A] border-b border-[#F4F7FB] pb-3">
          Admin Account
        </h2>

        <div>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full max-w-sm px-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
          />
        </div>

        <div className="space-y-3">
          <p className="font-dm text-sm font-medium text-[#0D1B2A]">Change Password</p>
          {[
            { label: "Current Password", value: currentPassword, setter: setCurrentPassword },
            { label: "New Password", value: newPassword, setter: setNewPassword },
            { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="font-dm text-xs text-[#7A8FA6] block mb-1">{label}</label>
              <input
                type="password"
                value={value}
                onChange={e => setter(e.target.value)}
                className="w-full max-w-sm px-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
              />
            </div>
          ))}
        </div>

        <button className="btn-primary flex items-center gap-2">
          <Save size={14} /> Save Account Changes
        </button>
      </section>
    </div>
  );
}
