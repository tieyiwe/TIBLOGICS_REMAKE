"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import {
  CONSULTATION_TOPICS as SERVICES,
  PRIMARY_TOPIC,
  OTHER_TOPICS,
  DEFAULT_AVAIL_DAYS,
  DEFAULT_AVAIL_SLOTS,
} from "@/lib/booking/services";
import { useLocale, useT } from "@/lib/i18n/client";

// Consultations are free. SERVICES is what the visitor wants to TALK ABOUT,
// not something they buy — price stays 0 so no payment step is ever reached.
// The checkoutUrl branch in submit() is left in place as a safety net in
// case a paid service is reintroduced later. The list lives in lib/booking so
// the API can validate against exactly what this form offers.

/**
 * Calendar date as YYYY-MM-DD from the *displayed* day, not via toISOString().
 *
 * `new Date(y, m, d).toISOString()` converts to UTC first, so for a visitor
 * east of UTC it yields the previous day — they would see another day's booked
 * slots and book a date one off from the one they clicked.
 */
function toDateKey(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

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

/** "2:00 PM" as the visitor's locale writes a time of day. */
function slotLabel(slot: string, locale: string): string {
  const mins = parseSlotMinutes(slot);
  if (Number.isNaN(mins)) return slot;
  const d = new Date(2000, 0, 1, Math.floor(mins / 60), mins % 60);
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

export default function BookPage() {
  const t = useT();
  const locale = useLocale();
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
  // The days and times admin actually offers. This form used to hard-code a
  // slot list, so anything set in admin_pro/appointments/availability had no
  // effect on what visitors could pick — and the server now rejects slots
  // outside it, which would have turned that mismatch into a failed booking.
  const [availDays, setAvailDays] = useState<number[]>(DEFAULT_AVAIL_DAYS);
  const [availSlots, setAvailSlots] = useState<string[]>(DEFAULT_AVAIL_SLOTS);
  const [blockedKeys, setBlockedKeys] = useState<string[]>([]);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", goalNotes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const topicName = (svc: { id: string }) => t(`pages.book.topic.${svc.id}.name`);

  const bookingPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          fetch("/api/appointments/availability").then((r) => r.json()),
          fetch("/api/appointments/blocked-dates").then((r) => r.json()).catch(() => ({ blocked: [] })),
        ]);
        if (cancelled) return;
        if (Array.isArray(a?.days) && a.days.length) setAvailDays(a.days);
        if (Array.isArray(a?.slots) && a.slots.length) setAvailSlots(a.slots);
        if (Array.isArray(b?.blocked)) {
          setBlockedKeys(
            b.blocked
              .map((x: { date?: string }) => (typeof x?.date === "string" ? x.date.slice(0, 10) : null))
              .filter(Boolean) as string[],
          );
        }
      } catch {
        // Defaults already match the server's fallback, so the form still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

        <div className="pl-3 pr-6">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`font-syne font-bold transition-colors duration-200 ${primary ? "text-base" : "text-sm"}`}
              style={{ color: isSelected ? svc.color : "#0D1B2A" }}
            >
              {topicName(svc)}
            </span>
            {svc.badge && !isSelected && (
              <span className="shrink-0 rounded-full bg-[#FEF0E3] px-2 py-0.5 text-xs font-bold text-[#F47C20]">
                {t(`pages.book.topic.${svc.id}.badge`)}
              </span>
            )}
          </div>
          <p className={`font-dm leading-relaxed text-[#7A8FA6] ${primary ? "mt-1.5 text-sm" : "mt-1 text-xs"}`}>
            {t(`pages.book.topic.${svc.id}.description`)}
          </p>
        </div>
      </button>
    );
  }


  async function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedSlot(null);
    const dateStr = toDateKey(date);
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
        // Duration, price and total are derived server-side from serviceType,
        // so they are deliberately not sent. The date goes as a plain calendar
        // day: an ISO timestamp is a different day either side of midnight UTC.
        body: JSON.stringify({
          serviceType: selectedService.name,
          date: selectedDate ? toDateKey(selectedDate) : null,
          timeSlot: selectedSlot,
          ...formData,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body?.error || t("pages.book.err.generic"));
        setSubmitting(false);
        return;
      }
      const { appointmentId, checkoutUrl } = await res.json();
      if (!appointmentId && !checkoutUrl) {
        setSubmitError(t("pages.book.err.notConfirmed"));
        setSubmitting(false);
        return;
      }
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        router.push(`/book/success?appointmentId=${appointmentId}${selectedService.price === 0 ? "&free=true" : ""}`);
      }
    } catch {
      setSubmitError(t("pages.book.err.network"));
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
    if (d < today) return false;
    if (!availDays.includes(d.getDay())) return false;
    return !blockedKeys.includes(toDateKey(d));
  }

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-tag">{t("pages.book.tag")}</span>
          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#0D1B2A] mt-2">{t("pages.book.title")}</h1>
          <p className="font-dm text-[#3A4A5C] mt-2">{t("pages.book.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: topic selector.
              Project Discovery is the default and sits on its own as the
              obvious starting point. The precise topics are one click away for
              visitors who already know what they want, rather than six
              equal-weight cards asking everyone to decide up front. */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h2 className="font-syne font-bold text-base text-[#0D1B2A]">{t("pages.book.discussTitle")}</h2>

            {renderTopic(PRIMARY_TOPIC, true)}

            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className="flex items-center justify-between gap-2 rounded-xl border border-[#D2DCE8] bg-white px-4 py-3 text-left transition-colors hover:border-[#B9C7D8]"
            >
              <span className="font-dm text-sm text-[#3A4A5C]" dangerouslySetInnerHTML={{ __html: t("pages.book.moreToggle") }} />
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
              <div className="font-syne font-bold text-white text-base">{topicName(selectedService)}</div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[#F47C20] font-syne font-bold text-sm">{t("pages.book.free")}</span>
              </div>
            </div>

            {/* Step tabs */}
            <div className="flex border-b border-[#D2DCE8]">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => step > s && setStep(s as 1 | 2 | 3)}
                  className={`flex-1 px-1 py-3 text-xs font-dm font-medium leading-tight transition-colors ${
                    step === s ? "text-[#F47C20] border-b-2 border-[#F47C20]" :
                    step > s ? "text-[#2251A3] cursor-pointer" : "text-[#7A8FA6]"
                  }`}
                >
                  {t(`pages.book.step${s}`)}
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
                      <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} aria-label={t("pages.book.prevMonth")} className="p-1 hover:bg-[#F4F7FB] rounded-lg">
                        <ChevronLeft size={18} className="text-[#3A4A5C]" />
                      </button>
                      <span className="font-syne font-bold text-sm text-[#0D1B2A] capitalize">
                        {new Date(year, month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" })}
                      </span>
                      <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} aria-label={t("pages.book.nextMonth")} className="p-1 hover:bg-[#F4F7FB] rounded-lg">
                        <ChevronRight size={18} className="text-[#3A4A5C]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                      {[0, 1, 2, 3, 4, 5, 6].map(d => (
                        <div key={d} className="text-center text-[#7A8FA6] text-xs font-dm font-medium py-1">{t(`pages.book.wd.${d}`)}</div>
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
                      <p className="font-dm text-xs text-[#7A8FA6] mb-2">{t("pages.book.availableTimes")}</p>
                      {isBlocked ? (
                        <p className="text-sm text-[#7A8FA6] font-dm">{t("pages.book.dateBlocked")}</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availSlots.map(slot => {
                            const booked = bookedSlots.includes(slot);
                            const past = isPastSlot(selectedDate!, slot);
                            const unavailable = booked || past;
                            const selected = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                disabled={unavailable}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-1 sm:px-3 rounded-lg text-sm font-dm font-medium transition-all ${
                                  selected ? "bg-[#1B3A6B] text-white" :
                                  unavailable ? "bg-[#F4F7FB] text-[#D2DCE8] cursor-not-allowed" :
                                  "border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3] hover:bg-[#EBF0FA]"
                                }`}
                              >
                                {slotLabel(slot, locale)}
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
                      {t("pages.book.nextDetails")}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Details form */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="bk-first" className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">{t("pages.book.firstName")}</label>
                      <input id="bk-first" className="input-base w-full text-sm" value={formData.firstName}
                        onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} placeholder={t("pages.book.firstNamePh")} />
                    </div>
                    <div>
                      <label htmlFor="bk-last" className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">{t("pages.book.lastName")}</label>
                      <input id="bk-last" className="input-base w-full text-sm" value={formData.lastName}
                        onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} placeholder={t("pages.book.lastNamePh")} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bk-email" className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">{t("pages.book.email")}</label>
                    <input id="bk-email" type="email" className="input-base w-full text-sm" value={formData.email}
                      aria-invalid={!!formData.email && !emailOk}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder={t("pages.book.emailPh")} />
                    {formData.email.trim() !== "" && !emailOk && (
                      <p className="text-xs text-red-500 font-dm mt-1">{t("pages.book.emailInvalid")}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="bk-phone" className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">{t("pages.book.phone")}</label>
                    <input id="bk-phone" type="tel" className="input-base w-full text-sm" value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder={t("pages.book.phonePh")} />
                  </div>
                  <div>
                    <label htmlFor="bk-company" className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">{t("pages.book.company")}</label>
                    <input id="bk-company" className="input-base w-full text-sm" value={formData.company}
                      onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} placeholder={t("pages.book.companyPh")} />
                  </div>
                  <div>
                    <label htmlFor="bk-focus" className="block text-xs font-dm font-medium text-[#3A4A5C] mb-1">{t("pages.book.focus")}</label>
                    <textarea id="bk-focus" rows={3} className="input-base w-full text-sm resize-none" value={formData.goalNotes}
                      onChange={e => setFormData(p => ({ ...p, goalNotes: e.target.value }))}
                      placeholder={t("pages.book.focusPh")} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center text-sm">{t("pages.book.back")}</button>
                    <button
                      disabled={!formData.firstName.trim() || !formData.lastName.trim() || !emailOk}
                      onClick={() => setStep(3)}
                      className="btn-primary flex-1 justify-center text-sm disabled:opacity-40"
                    >
                      {t("pages.book.nextReview")}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Pay */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-[#F4F7FB] rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between gap-3 text-sm font-dm">
                      <span className="text-[#7A8FA6]">{t("pages.book.review.service")}</span>
                      <span className="font-medium text-[#0D1B2A] text-right">{topicName(selectedService)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm font-dm">
                      <span className="text-[#7A8FA6] shrink-0">{t("pages.book.review.dateTime")}</span>
                      <span className="font-medium text-[#0D1B2A] text-right">
                        {selectedDate?.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })} · {selectedSlot ? slotLabel(selectedSlot, locale) : ""} {t("pages.book.review.et")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm font-dm">
                      <span className="text-[#7A8FA6]">{t("pages.book.review.name")}</span>
                      <span className="font-medium text-[#0D1B2A]">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm font-dm">
                      <span className="text-[#7A8FA6]">{t("pages.book.review.email")}</span>
                      <span className="font-medium text-[#0D1B2A] min-w-0 break-all text-right">{formData.email}</span>
                    </div>
                    {formData.phone && (
                      <div className="flex justify-between gap-3 text-sm font-dm">
                        <span className="text-[#7A8FA6]">{t("pages.book.review.phone")}</span>
                        <span className="font-medium text-[#0D1B2A]">{formData.phone}</span>
                      </div>
                    )}
                    <div className="border-t border-[#D2DCE8] pt-2 flex justify-between items-center">
                      <span className="font-syne font-bold text-[#0D1B2A]">{t("pages.book.review.cost")}</span>
                      <span className="font-syne font-extrabold text-xl text-[#0F6E56]">{t("pages.book.free")}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center text-sm">{t("pages.book.back")}</button>
                    <button
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
                    >
                      {submitting ? t("pages.book.processing") : t("pages.book.confirm")}
                    </button>
                  </div>

                  {submitError && (
                    <p className="text-center text-sm text-red-500 font-dm">{submitError}</p>
                  )}

                  <p className="text-center text-xs text-[#7A8FA6] font-dm">
                    {t("pages.book.noPayment")}
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
