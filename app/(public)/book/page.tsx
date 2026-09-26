"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

// Consultations are free. This list is what the visitor wants to TALK ABOUT,
// not something they buy — price stays 0 so no payment step is ever reached
// The checkoutUrl branch in submit() is left in place as a safety net in
// case a paid service is reintroduced later.
const SERVICES = [
  { id: "discovery", name: "Project Discovery", duration: "30 min", price: 0, badge: "Start here", description: "Not sure where to begin? An intro call to explore your project — zero commitment.", color: "#F47C20" },
  { id: "strategy", name: "AI Strategy", duration: "45 min", price: 0, badge: "Popular", description: "Talk through where AI could genuinely help your business, and where it wouldn't.", color: "#2251A3" },
  { id: "audit", name: "AI Readiness", duration: "45 min", price: 0, badge: null, description: "Look at your current tech and processes, and what adopting AI would actually take.", color: "#1B3A6B" },
  { id: "website", name: "Website & AI", duration: "45 min", price: 0, badge: null, description: "Review your current website and discuss an AI-powered upgrade.", color: "#0F6E56" },
  { id: "cost", name: "AI Cost & Pricing", duration: "45 min", price: 0, badge: null, description: "For AI product builders: what your AI actually costs to run, and how to price it.", color: "#7c3aed" },
  { id: "tech", name: "Something Else", duration: "45 min", price: 0, badge: null, description: "Apps, SaaS, a specific feature, or any other technical question.", color: "#3A4A5C" },
];

// Project Discovery is the default: most visitors do not yet know which
// specific conversation they need, and making them choose is friction. The
// rest stay one click away for people who do know.
const PRIMARY_TOPIC = SERVICES[0];
const OTHER_TOPICS = SERVICES.slice(1);

const ADD_ONS: { id: string; label: string; price: number }[] = [];

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function parseSlotMinutes(slot: string): number {
  const [time, period] = slot.split(" ");
  const [h, m] = time.split(":").map(Number);
  return ((h % 12) + (period === "PM" ? 12 : 0)) * 60 + m;
}

function isPastSlot(date: Date, slot: string): boolean {
  const now = new Date();
  const todayET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const selectedET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  if (todayET !== selectedET) return false;

  const etParts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: false }).formatToParts(now);
  const etHour = Number(etParts.find(p => p.type === "hour")?.value ?? 0);
  const etMin = Number(etParts.find(p => p.type === "minute")?.value ?? 0);
  const nowMinutes = etHour * 60 + etMin;

  return parseSlotMinutes(slot) <= nowMinutes + 30; // block slots within 30 min of now
}

export default function BookPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState(PRIMARY_TOPIC);
  // Kept open once a specific topic is chosen, so the choice stays visible.
  const [moreOpenState, setMoreOpen] = useState(false);
  const moreOpen = moreOpenState || selectedService.id !== PRIMARY_TOPIC.id;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", goalNotes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const bookingPanelRef = useRef<HTMLDivElement>(null);

  function selectTopic(svc: (typeof SERVICES)[number]) {
    setSelectedService(svc);
    setStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
    if (window.innerWidth < 1024) {
      setTimeout(() => bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  // Plain function, not a component — called directly so React keeps the same
  // elements across renders instead of remounting them.
  function renderTopic(svc: (typeof SERVICES)[number], primary: boolean) {
    const isSelected = selectedService.id === svc.id;
    return (
      <button
        key={svc.id}
        onClick={() => selectTopic(svc)}
        aria-pressed={isSelected}
        className={`relative w-full overflow-hidden text-left transition-all duration-200 ${
          primary ? "rounded-2xl p-5" : "rounded-xl p-3.5"
        }`}
        style={{
          border: isSelected ? `2.5px solid ${svc.color}` : "1.5px solid #D2DCE8",
          background: isSelected ? `${svc.color}0F` : "white",
          boxShadow: isSelected ? `0 0 0 4px ${svc.color}18, 0 4px 16px ${svc.color}22` : undefined,
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 transition-all duration-200"
          style={{ width: isSelected ? "5px" : "3px", backgroundColor: svc.color }}
        />

        {isSelected && (
          <div
            className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: svc.color }}
          >
            <Check size={11} strokeWidth={3} className="text-white" />
          </div>
        )}

        <div className="pl-3">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`font-syne font-bold transition-colors duration-200 ${primary ? "text-base" : "text-sm"}`}
              style={{ color: isSelected ? svc.color : "#0D1B2A" }}
            >
              {svc.name}
            </span>
            {svc.badge && !isSelected && (
              <span className="shrink-0 rounded-full bg-[#FEF0E3] px-2 py-0.5 text-xs font-bold text-[#F47C20]">
                {svc.badge}
              </span>
            )}
          </div>
          <p className={`font-dm leading-relaxed text-[#7A8FA6] ${primary ? "mt-1.5 text-sm" : "mt-1 text-xs"}`}>
            {svc.description}
          </p>
        </div>
      </button>
    );
  }


  async function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedSlot(null);
    const dateStr = date.toISOString().split("T")[0];
    try {
      const r = await fetch(`/api/appointments/available?date=${dateStr}`);
      const data = await r.json();
      setBookedSlots(data.bookedSlots ?? []);
      setIsBlocked(data.isBlocked ?? false);
    } catch {
      setBookedSlots([]);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: selectedService.name,
          serviceDuration: selectedService.duration,
          servicePrice: selectedService.price,
          date: selectedDate,
          timeSlot: selectedSlot,
          timezone: "America/New_York",
          ...formData,
          addOnRecording: false,
          addOnActionPlan: false,
          addOnSlackAccess: false,
          totalAmount: 0,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body?.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      const { appointmentId, checkoutUrl } = await res.json();
      if (!appointmentId && !checkoutUrl) {
        setSubmitError("Booking could not be confirmed. Please try again.");
        setSubmitting(false);
        return;
      }
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        router.push(`/book/success?appointmentId=${appointmentId}${selectedService.price === 0 ? "&free=true" : ""}`);
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function isSelectable(day: number) {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay();
    return d >= today && dow !== 0 && dow !== 6;
  }

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-tag">Book a Consulting</span>
          <h1 className="font-syne font-extrabold text-4xl text-[#0D1B2A] mt-2">Book a Consulting</h1>
          <p className="font-dm text-[#3A4A5C] mt-2">Free, no obligation. Pick what you'd like to discuss and a time that suits you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: topic selector.
              Project Discovery is the default and sits on its own as the
              obvious starting point. The precise topics are one click away for
              visitors who already know what they want, rather than six
              equal-weight cards asking everyone to decide up front. */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h2 className="font-syne font-bold text-base text-[#0D1B2A]">What would you like to discuss?</h2>

            {renderTopic(PRIMARY_TOPIC, true)}

            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className="flex items-center justify-between gap-2 rounded-xl border border-[#D2DCE8] bg-white px-4 py-3 text-left transition-colors hover:border-[#B9C7D8]"
            >
              <span className="font-dm text-sm text-[#3A4A5C]">
                Know what you need? <span className="font-semibold text-[#1B3A6B]">Pick a specific topic</span>
              </span>
              <ChevronDown
                size={16}
                className="shrink-0 text-[#7A8FA6] transition-transform duration-200"
                style={{ transform: moreOpen ? "rotate(180deg)" : undefined }}
              />
            </button>

            {moreOpen && (
              <div className="flex flex-col gap-2">
                {OTHER_TOPICS.map((svc) => renderTopic(svc, false))}
              </div>
            )}
          </div>

          {/* Right: Booking Panel */}
          <div ref={bookingPanelRef} className="lg:col-span-3 bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden shadow-sm">
            {/* Panel header */}
            <div className="bg-[#1B3A6B] p-5">
              <div className="font-syne font-bold text-white text-base">{selectedService.name}</div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[#F47C20] font-syne font-bold text-sm">Free</span>
              </div>
            </div>

            {/* Step tabs */}
            <div className="flex border-b border-[#D2DCE8]">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => step > s && setStep(s as 1 | 2 | 3)}
                  className={`flex-1 py-3 text-xs font-dm font-medium transition-colors ${
                    step === s ? "text-[#F47C20] border-b-2 border-[#F47C20]" :
                    step > s ? "text-[#2251A3] cursor-pointer" : "text-[#7A8FA6]"
                  }`}
                >
                  {s === 1 ? "1 Date & Time" : s === 2 ? "2 Your Details" : "3 Confirm"}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* STEP 1: Calendar + Time Slots */}
              {step === 1 && (
                <div>
                  {/* Calendar */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1 hover:bg-[#F4F7FB] rounded-lg">
                        <ChevronLeft size={18} className="text-[#3A4A5C]" />
                      </button>
                      <span className="font-syne font-bold text-sm text-[#0D1B2A]">{MONTHS[month]} {year}</span>
                      <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1 hover:bg-[#F4F7FB] rounded-lg">
                        <ChevronRight size={18} className="text-[#3A4A5C]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                      {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                        <div key={d} className="text-center text-[#7A8FA6] text-xs font-dm font-medium py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const d = new Date(year, month, day);
                        const selectable = isSelectable(day);
                        const isToday = isSameDay(d, new Date());
                        const isSelected = selectedDate && isSameDay(d, selectedDate);
                        return (
                          <button
                            key={day}
                            disabled={!selectable}
                            onClick={() => handleDateSelect(d)}
                            className={`aspect-square flex items-center justify-center text-sm font-dm rounded-lg transition-all ${
                              isSelected ? "bg-[#1B3A6B] text-white font-semibold" :
                              isToday && selectable ? "border-2 border-[#F47C20] text-[#0D1B2A] hover:bg-[#EBF0FA]" :
                              selectable ? "text-[#0D1B2A] hover:bg-[#EBF0FA] cursor-pointer" :
                              "text-[#D2DCE8] cursor-not-allowed"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <p className="font-dm text-xs text-[#7A8FA6] mb-2">Available times (ET):</p>
                      {isBlocked ? (
                        <p className="text-sm text-[#7A8FA6] font-dm">This date is unavailable. Please select another day.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {TIME_SLOTS.map(slot => {
                            const booked = bookedSlots.includes(slot);
                            const past = isPastSlot(selectedDate!, slot);
                            const unavailable = booked || past;
                            const selected = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                disabled={unavailable}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-3 rounded-lg text-sm font-dm font-medium transition-all ${
                                  selected ? "bg-[#1B3A6B] text-white" :
                                  unavailable ? "bg-[#F4F7FB] text-[#D2DCE8] cursor-not-allowed" :
                                  "border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3] hover:bg-[#EBF0FA]"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5">
                    <button
                      disabled={!selectedDate || !selectedSlot}
                      onClick={() => setStep(2)}
                      className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next: Your Details →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Details form */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">First Name *</label>
                      <input className="input-base w-full text-sm" value={formData.firstName}
                        onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} placeholder="Jane" />
                    </div>
                    <div>
                      <label className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">Last Name *</label>
                      <input className="input-base w-full text-sm" value={formData.lastName}
                        onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} placeholder="Smith" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">Email *</label>
                    <input type="email" className="input-base w-full text-sm" value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">Phone Number</label>
                    <input type="tel" className="input-base w-full text-sm" value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000 (optional)" />
                  </div>
                  <div>
                    <label className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">Company / Business</label>
                    <input className="input-base w-full text-sm" value={formData.company}
                      onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} placeholder="Acme Inc. (optional)" />
                  </div>
                  <div>
                    <label className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">What would you like to focus on?</label>
                    <textarea rows={3} className="input-base w-full text-sm resize-none" value={formData.goalNotes}
                      onChange={e => setFormData(p => ({ ...p, goalNotes: e.target.value }))}
                      placeholder="Share your main goals or challenges for this session..." />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center text-sm">← Back</button>
                    <button
                      disabled={!formData.firstName || !formData.email}
                      onClick={() => setStep(3)}
                      className="btn-primary flex-1 justify-center text-sm disabled:opacity-40"
                    >
                      Next: Review →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Pay */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-[#F4F7FB] rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between text-sm font-dm">
                      <span className="text-[#7A8FA6]">Service</span>
                      <span className="font-medium text-[#0D1B2A]">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between text-sm font-dm">
                      <span className="text-[#7A8FA6]">Date & Time</span>
                      <span className="font-medium text-[#0D1B2A]">
                        {selectedDate?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {selectedSlot} ET
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-dm">
                      <span className="text-[#7A8FA6]">Name</span>
                      <span className="font-medium text-[#0D1B2A]">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm font-dm">
                      <span className="text-[#7A8FA6]">Email</span>
                      <span className="font-medium text-[#0D1B2A]">{formData.email}</span>
                    </div>
                    {formData.phone && (
                      <div className="flex justify-between text-sm font-dm">
                        <span className="text-[#7A8FA6]">Phone</span>
                        <span className="font-medium text-[#0D1B2A]">{formData.phone}</span>
                      </div>
                    )}
                    <div className="border-t border-[#D2DCE8] pt-2 flex justify-between items-center">
                      <span className="font-syne font-bold text-[#0D1B2A]">Cost</span>
                      <span className="font-syne font-extrabold text-xl text-[#0F6E56]">Free</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center text-sm">← Back</button>
                    <button
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
                    >
                      {submitting ? "Processing..." : "Confirm Booking →"}
                    </button>
                  </div>

                  {submitError && (
                    <p className="text-center text-sm text-red-500 font-dm">{submitError}</p>
                  )}

                  <p className="text-center text-xs text-[#7A8FA6] font-dm">
                    No payment required — you'll get a confirmation email with the meeting link.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
