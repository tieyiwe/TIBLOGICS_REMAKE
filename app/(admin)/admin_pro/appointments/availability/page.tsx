"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Check, AlertCircle } from "lucide-react";

const ALL_DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const ALL_SLOTS = [
  "9:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
];

interface BlockedDate {
  id: string;
  date: string;
  reason?: string | null;
}

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-dm px-3 py-2 rounded-[var(--a-radius-control)] mt-2 ${type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
      {type === "ok" ? <Check size={14} /> : <AlertCircle size={14} />}
      {msg}
    </div>
  );
}

export default function AvailabilityPage() {
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [slots, setSlots] = useState<string[]>(["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"]);
  const [scheduleToast, setScheduleToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [blockToast, setBlockToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [addingBlock, setAddingBlock] = useState(false);

  // Load current settings
  useEffect(() => {
    fetch("/api/appointments/blocked-dates")
      .then(r => r.json())
      .then(d => {
        if (d.blocked) setBlocked(d.blocked);
      });
  }, []);

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b));
  }
  function toggleSlot(s: string) {
    setSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function saveSchedule() {
    setSavingSchedule(true);
    setScheduleToast(null);
    try {
      const res = await fetch("/api/appointments/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, slots }),
      });
      setScheduleToast(res.ok ? { msg: "Schedule saved!", type: "ok" } : { msg: "Failed to save", type: "err" });
    } catch {
      setScheduleToast({ msg: "Failed to save", type: "err" });
    } finally {
      setSavingSchedule(false);
      setTimeout(() => setScheduleToast(null), 3000);
    }
  }

  async function blockDate() {
    if (!newDate) return;
    setAddingBlock(true);
    setBlockToast(null);
    try {
      const res = await fetch("/api/appointments/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, reason: newReason }),
      });
      const data = await res.json();
      if (res.ok && data.blocked) {
        setBlocked(prev => [...prev, data.blocked].sort((a, b) => a.date.localeCompare(b.date)));
        setNewDate("");
        setNewReason("");
        setBlockToast({ msg: "Date blocked.", type: "ok" });
      } else {
        setBlockToast({ msg: "Failed to block date", type: "err" });
      }
    } catch {
      setBlockToast({ msg: "Failed to block date", type: "err" });
    } finally {
      setAddingBlock(false);
      setTimeout(() => setBlockToast(null), 3000);
    }
  }

  async function unblockDate(id: string) {
    await fetch("/api/appointments/blocked-dates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBlocked(prev => prev.filter(b => b.id !== id));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin_pro/appointments" className="text-[var(--a-ink-3)] hover:text-[#1B3A6B] transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="font-syne font-bold text-[24px] leading-tight sm:text-[26px] text-[var(--a-ink)]">Availability Management</h1>
          <p className="font-dm text-sm text-[var(--a-ink-3)] mt-0.5">Control which days and times are open for booking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Schedule */}
        <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-5">
          <div>
            <span className="section-tag">Working Schedule</span>
            <h2 className="font-syne font-bold text-lg text-[var(--a-ink)] mt-1">Available days &amp; times</h2>
          </div>

          {/* Days */}
          <div>
            <p className="font-dm text-sm font-semibold text-[var(--a-ink-2)] mb-2">Working days</p>
            <div className="flex gap-2 flex-wrap">
              {ALL_DAYS.map(d => (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={`w-12 py-1.5 rounded-[var(--a-radius-control)] text-xs font-dm font-semibold border transition-colors ${
                    days.includes(d.value)
                      ? "bg-[var(--a-navy)] text-white border-[#1B3A6B]"
                      : "bg-white text-[var(--a-ink-2)] border-[var(--a-border)] hover:border-[#2251A3]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <p className="font-dm text-sm font-semibold text-[var(--a-ink-2)] mb-2">Available time slots (EST)</p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_SLOTS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSlot(s)}
                  className={`py-2 rounded-[var(--a-radius-control)] text-xs font-dm font-medium border transition-colors ${
                    slots.includes(s)
                      ? "bg-[var(--a-orange-text)] text-white border-[#F47C20]"
                      : "bg-white text-[var(--a-ink-2)] border-[var(--a-border)] hover:border-[#F47C20]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveSchedule}
            disabled={savingSchedule}
            className="w-full bg-[var(--a-navy)] hover:bg-[var(--a-blue)] text-white font-dm font-semibold text-sm py-2.5 rounded-[var(--a-radius-control)] transition-colors disabled:opacity-50"
          >
            {savingSchedule ? "Saving…" : "Save Schedule"}
          </button>
          {scheduleToast && <Toast msg={scheduleToast.msg} type={scheduleToast.type} />}
        </div>

        {/* Blocked Dates */}
        <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-5">
          <div>
            <span className="section-tag">Blocked Dates</span>
            <h2 className="font-syne font-bold text-lg text-[var(--a-ink)] mt-1">Days unavailable for booking</h2>
          </div>

          {/* Add new block */}
          <div className="space-y-2">
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-[var(--a-border)] rounded-[var(--a-radius-control)] px-3 py-2 text-sm font-dm text-[var(--a-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
            />
            <input
              type="text"
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
              placeholder="Reason (optional) — e.g. Holiday, Out of office"
              className="w-full border border-[var(--a-border)] rounded-[var(--a-radius-control)] px-3 py-2 text-sm font-dm text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
            />
            <button
              onClick={blockDate}
              disabled={!newDate || addingBlock}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-dm font-semibold text-sm py-2.5 rounded-[var(--a-radius-control)] border border-red-100 transition-colors disabled:opacity-40"
            >
              <Plus size={15} /> Block This Date
            </button>
            {blockToast && <Toast msg={blockToast.msg} type={blockToast.type} />}
          </div>

          {/* Blocked list */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {blocked.length === 0 ? (
              <p className="font-dm text-sm text-[var(--a-ink-3)] text-center py-4">No dates blocked.</p>
            ) : blocked.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-[var(--a-radius-control)] px-3 py-2.5">
                <div>
                  <p className="font-dm text-sm font-medium text-[var(--a-ink)]">{formatDate(b.date)}</p>
                  {b.reason && <p className="font-dm text-xs text-[var(--a-ink-3)] mt-0.5">{b.reason}</p>}
                </div>
                <button
                  onClick={() => unblockDate(b.id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                  title="Remove block"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
