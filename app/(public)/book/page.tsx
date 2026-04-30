"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, Clock, DollarSign } from "lucide-react";

const SERVICES = [
  { id: "discovery", name: "Project Discovery Meeting", duration: "30 min", price: 0, badge: "Free", description: "Intro call to explore your project — zero commitment, zero cost.", color: "#F47C20" },
  { id: "strategy", name: "AI Strategy Session", duration: "60 min", price: 49700, badge: "Popular", description: "Deep-dive into your AI opportunities and build a custom action plan.", color: "#2251A3" },
  { id: "audit", name: "AI Readiness Audit", duration: "90 min + Deliverable", price: 89700, badge: null, description: "Full assessment of your tech stack and AI readiness with a written deliverable.", color: "#1B3A6B" },
  { id: "website", name: "Website AI Transformation", duration: "45 min", price: 24900, badge: "New", description: "Review your current website and design an AI-powered upgrade plan.", color: "#0F6E56" },
  { id: "cost", name: "AI Cost & Price Strategy for AI Product Builders", duration: "60 min", price: 29700, badge: null, description: "Calculate your AI costs and design a profitable pricing model.", color: "#7c3aed" },
  { id: "tech", name: "Other Consulting (Apps, SaaS, Special Features…)", duration: "60 min", price: 24900, badge: null, description: "Expert guidance on app development, SaaS products, special features, or any technical challenge.", color: "#3A4A5C" },
];

const ADD_ONS = [
  { id: "actionPlan", label: "Written action plan & follow-up notes", price: 7900 },
];

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];

function formatPrice(cents: number) {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function BookPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", company: "", goalNotes: "" });
  const [addOns, setAddOns] = useState({ actionPlan: false });
  const [submitting, setSubmitting] = useState(false);

  const bookingPanelRef = useRef<HTMLDivElement>(null);

  const addOnTotal = addOns.actionPlan ? 7900 : 0;
  const total = selectedService.price + addOnTotal;

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
          addOnActionPlan: addOns.actionPlan,
          addOnSlackAccess: false,
          totalAmount: total,
        }),
      });
      const { appointmentId, checkoutUrl } = await res.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        router.push(`/book/success?appointmentId=${appointmentId}`);
      }
    } catch {
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
          <p className="font-dm text-[#3A4A5C] mt-2">Choose your session and pick a time that works for you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Service Selector */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Choose Your Session</h2>
            {SERVICES.map((svc) => {
              const isSelected = selectedService.id === svc.id;
              return (
                <button
                  key={svc.id}
                  onClick={() => {
                    setSelectedService(svc); setStep(1); setSelectedDate(null); setSelectedSlot(null);
                    if (window.innerWidth < 1024) {
                      setTimeout(() => bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                    }
                  }}
                  className="relative text-left rounded-2xl p-4 transition-all duration-200 overflow-hidden w-full"
                  style={{
                    border: isSelected ? `2.5px solid ${svc.color}` : "1.5px solid #D2DCE8",
                    background: isSelected ? `${svc.color}0F` : "white",
                    boxShadow: isSelected ? `0 0 0 4px ${svc.color}18, 0 4px 16px ${svc.color}22` : undefined,
                    transform: isSelected ? "scale(1.01)" : undefined,
                  }}
                >
                  {/* Color bar — thicker when selected */}
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-l-2xl transition-all duration-200"
                    style={{ width: isSelected ? "5px" : "3px", backgroundColor: svc.color }}
                  />

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: svc.color }}
                    >
                      <Check size={11} strokeWidth={3} className="text-white" />
                    </div>
                  )}

                  <div className="pl-3">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="font-syne font-bold text-sm transition-colors duration-200"
                        style={{ color: isSelected ? svc.color : "#0D1B2A" }}
                      >
                        {svc.name}
                      </span>
                      {svc.badge && !isSelected && (
                        <span className="shrink-0 bg-[#FEF0E3] text-[#F47C20] text-xs font-bold px-2 py-0.5 rounded-full">{svc.badge}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-syne font-extrabold text-lg text-[#0D1B2A]">{formatPrice(svc.price)}</span>
                      <span className="font-dm text-xs text-[#7A8FA6] flex items-center gap-1"><Clock size={11} />{svc.duration}</span>
                    </div>
                    <p className="font-dm text-xs text-[#7A8FA6] mt-1 leading-relaxed">{svc.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Booking Panel */}
          <div ref={bookingPanelRef} className="lg:col-span-3 bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden shadow-sm">
            {/* Panel header */}
            <div className="bg-[#1B3A6B] p-5">
              <div className="font-syne font-bold text-white text-base">{selectedService.name}</div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-white/60 text-sm font-dm flex items-center gap-1"><Clock size={13} />{selectedService.duration}</span>
                <span className="text-[#F47C20] font-syne font-bold text-sm">{formatPrice(selectedService.price)}</span>
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
                            const selected = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                disabled={booked}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-3 rounded-lg text-sm font-dm font-medium transition-all ${
                                  selected ? "bg-[#1B3A6B] text-white" :
                                  booked ? "bg-[#F4F7FB] text-[#D2DCE8] cursor-not-allowed" :
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

                  {/* Add-ons */}
                  <div>
                    <p className="font-dm text-xs font-medium text-[#3A4A5C] mb-2">Add-ons (optional)</p>
                    <div className="space-y-2">
                      {ADD_ONS.map(ao => (
                        <label key={ao.id} className="flex items-center gap-3 p-3 border border-[#D2DCE8] rounded-xl cursor-pointer hover:bg-[#F4F7FB] transition-colors">
                          <input type="checkbox" className="accent-[#1B3A6B] w-4 h-4"
                            checked={addOns[ao.id as keyof typeof addOns]}
                            onChange={e => setAddOns(p => ({ ...p, [ao.id]: e.target.checked }))} />
                          <span className="font-dm text-sm text-[#0D1B2A] flex-1">{ao.label}</span>
                          <span className="font-syne font-bold text-sm text-[#F47C20]">+{formatPrice(ao.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D2DCE8]">
                    <span className="font-dm text-sm text-[#7A8FA6]">Total: <span className="font-syne font-bold text-[#0D1B2A]">{formatPrice(total)}</span></span>
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
                    {addOnTotal > 0 && (
                      <div className="flex justify-between text-sm font-dm">
                        <span className="text-[#7A8FA6]">Add-ons</span>
                        <span className="font-medium text-[#F47C20]">+{formatPrice(addOnTotal)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#D2DCE8] pt-2 flex justify-between">
                      <span className="font-syne font-bold text-[#0D1B2A]">Total</span>
                      <span className="font-syne font-extrabold text-2xl text-[#2251A3]">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center text-sm">← Back</button>
                    <button
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
                    >
                      {submitting ? "Processing..." : total > 0 ? "Pay & Confirm →" : "Confirm Booking →"}
                    </button>
                  </div>

                  {total > 0 && (
                    <p className="text-center text-xs text-[#7A8FA6] font-dm">
                      Secure payment via Stripe. You'll be redirected to complete payment.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
