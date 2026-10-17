"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Send, ChevronLeft, Loader2 } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";

type Message = { role: "user" | "assistant"; content: string };

type BookingStep =
  | null
  | "prompt"
  | "date"
  | "time"
  | "form"
  | "submitting"
  | "done";

interface BookingData {
  date: string;
  dateLabel: string;
  timeSlot: string;
}

const BOOKING_MARKER = "[BOOK_APPOINTMENT]";
// These strings are what the appointments API stores and checks; only their
// display is localized (see slotLabel).
const ALL_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];

type TFn = ReturnType<typeof useT>;

function welcome(t: TFn): Message {
  return { role: "assistant", content: t("site.chat.welcome") };
}

/** "2:00 PM" shown the way the visitor's language writes times (14:00, 14 h 00…). */
function slotLabel(slot: string, locale: Locale): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(slot.trim());
  if (!m) return slot;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  const d = new Date(2000, 0, 1, h, Number(m[2]));
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

function getAvailableDates(blockedSet: Set<string>, locale: Locale): Array<{ value: string; label: string }> {
  const dates: Array<{ value: string; label: string }> = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  let checked = 0;
  while (dates.length < 14 && checked < 60) {
    checked++;
    const day = d.getDay();
    const iso = d.toISOString().split("T")[0];
    if (day !== 0 && day !== 6 && !blockedSet.has(iso)) {
      dates.push({
        value: iso,
        label: d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function BookingForm({
  dateLabel,
  timeSlot,
  onBack,
  onSubmit,
}: {
  dateLabel: string;
  /** Already localized for display. */
  timeSlot: string;
  onBack: () => void;
  onSubmit: (data: { firstName: string; lastName: string; email: string; phone: string }) => void;
}) {
  const t = useT();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid =
    form.firstName.trim() && form.lastName.trim() && form.email.includes("@") && form.phone.trim();
  const fieldCls =
    "w-full bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-3 py-2 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:border-[#2251A3] focus:ring-1 focus:ring-[#2251A3]/20";

  return (
    <div className="px-4 pb-4 pt-3 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onBack} aria-label={t("site.chat.book.back")} className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
          <ChevronLeft size={15} />
        </button>
        <p className="text-xs font-semibold text-[#3A4A5C] uppercase tracking-wide">
          {t("site.chat.book.slot", { date: dateLabel, time: timeSlot })}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={form.firstName} onChange={set("firstName")} placeholder={t("site.chat.book.firstName")} aria-label={t("site.chat.book.firstName")} autoComplete="given-name" className={fieldCls} />
        <input value={form.lastName} onChange={set("lastName")} placeholder={t("site.chat.book.lastName")} aria-label={t("site.chat.book.lastName")} autoComplete="family-name" className={fieldCls} />
      </div>
      <input value={form.email} onChange={set("email")} placeholder={t("site.chat.book.email")} aria-label={t("site.chat.book.email")} type="email" autoComplete="email" className={fieldCls} />
      <input value={form.phone} onChange={set("phone")} placeholder={t("site.chat.book.phone")} aria-label={t("site.chat.book.phone")} type="tel" autoComplete="tel" className={fieldCls} />
      <button
        onClick={() => valid && onSubmit(form)}
        disabled={!valid}
        className="w-full bg-[#1B3A6B] text-white rounded-xl py-2.5 text-sm font-semibold font-dm disabled:opacity-40 hover:bg-[#2251A3] transition-colors mt-1"
      >
        {t("site.chat.book.confirm")}
      </button>
    </div>
  );
}

export default function EchelonFloat() {
  const pathname = usePathname();
  const t = useT();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [welcome(t)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  const [bookingStep, setBookingStep] = useState<BookingStep>(null);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [availableSlots, setAvailableSlots] = useState<string[]>(ALL_SLOTS);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = pathname?.startsWith("/admin_pro");
  const [blockedDateSet, setBlockedDateSet] = useState<Set<string>>(new Set());
  const ctaVisibleRef = useRef(false);
  const isOpenRef = useRef(false);
  const sessionIdRef = useRef<string>("");
  // The open chat is a modal dialog: focus stays inside, Escape closes it and
  // focus returns to the button that opened it.
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Generate or restore a persistent session ID for this browser session
  useEffect(() => {
    if (isAdmin) return;
    try {
      let sid = sessionStorage.getItem("tibo_session_id");
      if (!sid) {
        sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem("tibo_session_id", sid);
      }
      sessionIdRef.current = sid;
    } catch { sessionIdRef.current = `${Date.now()}`; }
  }, [isAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, bookingStep]);

  // Switching language re-renders with a new dictionary. If the conversation
  // has not started, swap the greeting so it matches; a conversation in
  // progress is left as it is.
  useEffect(() => {
    setMessages((prev) => (prev.length === 1 && prev[0].role === "assistant" ? [welcome(t)] : prev));
  }, [t]);

  // Initial greeting bubble after 8s (once per session)
  useEffect(() => {
    if (isAdmin) return;
    try {
      if (sessionStorage.getItem("tibo_greeted")) return;
    } catch { return; }
    const timer = setTimeout(() => {
      setShowGreeting(true);
      try { sessionStorage.setItem("tibo_greeted", "1"); } catch {}
    }, 8000);
    return () => clearTimeout(timer);
  }, [isAdmin]);

  // Withdraw the greeting on its own. It is positioned over the primary CTA on
  // several pages, so leaving it up until someone finds a 12px close button
  // meant it blocked the main action indefinitely for anyone who ignored it.
  useEffect(() => {
    if (!showGreeting) return;
    const t = setTimeout(() => setShowGreeting(false), 8_000);
    return () => clearTimeout(t);
  }, [showGreeting]);

  // Keep isOpenRef current so idle-timer closure doesn't see stale value
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // Idle re-engagement: show greeting after 45s, but only if chat is closed AND blog CTA is not on screen
  useEffect(() => {
    if (isAdmin || isOpen) return;
    // Respect an explicit dismissal. This timer used to ignore it, so closing
    // the greeting bought 45 seconds before it reappeared — on every page, for
    // the whole session.
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("tibo_dismissed")) return;
    const timer = setTimeout(() => {
      if (!isOpenRef.current && !ctaVisibleRef.current) {
        setShowGreeting(true);
        window.dispatchEvent(new CustomEvent("tibo:greeting-shown"));
      }
    }, 45_000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isAdmin]);

  // Pre-load blocked dates
  useEffect(() => {
    fetch("/api/appointments/blocked-dates")
      .then(r => r.json())
      .then(d => {
        const s = new Set<string>();
        (d.blocked ?? []).forEach((b: { date: string }) => s.add(b.date.split("T")[0]));
        setBlockedDateSet(s);
      })
      .catch(() => {});
  }, []);

  // Listen for tibo:open event
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("tibo:open", handler);
    return () => window.removeEventListener("tibo:open", handler);
  }, []);

  // Track blog CTA visibility: hide greeting when it appears, allow it again when CTA is dismissed
  useEffect(() => {
    const onShown = () => { ctaVisibleRef.current = true; setShowGreeting(false); };
    const onHidden = () => { ctaVisibleRef.current = false; };
    window.addEventListener("booking-cta:shown", onShown);
    window.addEventListener("booking-cta:hidden", onHidden);
    return () => {
      window.removeEventListener("booking-cta:shown", onShown);
      window.removeEventListener("booking-cta:hidden", onHidden);
    };
  }, []);

  // Auto-engage after website scan
  useEffect(() => {
    function handleScanComplete(e: Event) {
      const { url, overallScore, criticals, aiScore } = (e as CustomEvent).detail as {
        url: string; overallScore: number; criticals: number; aiScore: number;
      };
      setTimeout(() => {
        const nf = new Intl.NumberFormat(locale);
        const issues = t(criticals === 1 ? "site.chat.scanIssues.one" : "site.chat.scanIssues.other", { n: nf.format(criticals) });
        setMessages([
          welcome(t),
          {
            role: "assistant",
            content: t("site.chat.scan", { url, overall: nf.format(overallScore), issues, ai: nf.format(aiScore) }),
          },
        ]);
        setBookingStep("prompt");
        setIsOpen(true);
        setHasUnread(false);
      }, 3500);
    }
    window.addEventListener("tibo:scan-complete", handleScanComplete);
    return () => window.removeEventListener("tibo:scan-complete", handleScanComplete);
  }, [t, locale]);

  // The listeners above are attached: EchelonFloatClient may now replay an
  // event that arrived before this component had loaded.
  useEffect(() => {
    document.documentElement.setAttribute("data-echelon-ready", "");
    return () => document.documentElement.removeAttribute("data-echelon-ready");
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setShowGreeting(false);
      setTimeout(() => inputRef.current?.focus(), 150);
      window.dispatchEvent(new CustomEvent("tibo:opened"));
    }
  }, [isOpen]);

  if (isAdmin) return null;

  async function handleSend(overrideText?: string) {
    const trimmed = overrideText ?? input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/claude/float", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Bad response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              full += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: full };
                return updated;
              });
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch { /* ignore parse errors on incomplete chunks */ }
        }
      }

      // A stream that only carried an error event used to leave an empty
      // bubble; show the (localized) connection message instead.
      if (!full.trim()) throw new Error("Empty reply");
      const hasBooking = full.includes(BOOKING_MARKER);
      const clean = full.replace(BOOKING_MARKER, "").trim();
      const finalMessages = (() => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: clean };
          // Save to backend (fire-and-forget) so expert can see conversation
          if (sessionIdRef.current) {
            fetch("/api/sessions/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId: sessionIdRef.current, messages: updated }),
            }).catch(() => {});
          }
          return updated;
        });
        return null;
      })();
      void finalMessages;
      if (hasBooking) setBookingStep("prompt");
      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: t("site.chat.error") };
        return updated;
      });
      if (!isOpen) setHasUnread(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDateSelect(date: string, dateLabel: string) {
    setBookingData((d) => ({ ...d, date, dateLabel }));
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/appointments/available?date=${date}`);
      const data = await res.json();
      const booked: string[] = data.bookedSlots ?? [];
      setAvailableSlots(ALL_SLOTS.filter((s) => !booked.includes(s)));
    } catch {
      setAvailableSlots(ALL_SLOTS);
    } finally {
      setSlotsLoading(false);
      setBookingStep("time");
    }
  }

  async function handleBookingSubmit(form: { firstName: string; lastName: string; email: string; phone: string }) {
    setBookingStep("submitting");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "PROJECT_DISCOVERY_MEETING",
          serviceDuration: "20 min",
          servicePrice: 0,
          totalAmount: 0,
          date: bookingData.date,
          timeSlot: bookingData.timeSlot,
          timezone: "America/New_York",
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          goalNotes: "Booked via TIBS chat assistant",
          sessionId: sessionIdRef.current || undefined,
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setBookingStep("done");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("site.chat.book.done", {
            name: form.firstName,
            date: bookingData.dateLabel ?? "",
            time: bookingData.timeSlot ? slotLabel(bookingData.timeSlot, locale) : "",
            email: form.email,
          }),
        },
      ]);
    } catch {
      setBookingStep("form");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("site.chat.book.failed"),
        },
      ]);
    }
  }

  function declineBooking() {
    setBookingStep(null);
    handleSend(t("site.chat.book.decline"));
  }

  function renderBookingUI() {
    if (bookingStep === "prompt") {
      return (
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <button onClick={() => setBookingStep("date")}
            className="flex-1 bg-[#1B3A6B] text-white rounded-xl px-2 py-2.5 text-sm leading-tight font-semibold font-dm hover:bg-[#2251A3] transition-colors">
            {t("site.chat.book.yes")}
          </button>
          <button onClick={declineBooking}
            className="flex-1 border border-[#D2DCE8] text-[#3A4A5C] rounded-xl px-2 py-2.5 text-sm leading-tight font-medium font-dm hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-colors">
            {t("site.chat.book.no")}
          </button>
        </div>
      );
    }
    if (bookingStep === "date") {
      const dates = getAvailableDates(blockedDateSet, locale);
      return (
        <div className="px-4 pb-4 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setBookingStep("prompt")} aria-label={t("site.chat.book.back")} className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
              <ChevronLeft size={15} />
            </button>
            <p className="text-xs font-semibold text-[#3A4A5C] uppercase tracking-wide">{t("site.chat.book.pickDate")}</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
            {dates.map((d) => (
              <button key={d.value} onClick={() => handleDateSelect(d.value, d.label)}
                className="border border-[#D2DCE8] rounded-xl py-2 px-2.5 text-xs font-medium font-dm text-[#3A4A5C] hover:border-[#1B3A6B] hover:text-[#1B3A6B] hover:bg-[#EBF0FA] transition-colors text-left">
                {d.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (bookingStep === "time") {
      return (
        <div className="px-4 pb-4 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setBookingStep("date")} aria-label={t("site.chat.book.back")} className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
              <ChevronLeft size={15} />
            </button>
            <p className="text-xs font-semibold text-[#3A4A5C] uppercase tracking-wide truncate">
              {t("site.chat.book.pickTime", { date: bookingData.dateLabel ?? "" })}
            </p>
          </div>
          {slotsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-[#7A8FA6]" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-xs text-[#7A8FA6] font-dm">{t("site.chat.book.noSlots")}</p>
              <button onClick={() => setBookingStep("date")} className="mt-2 text-xs text-[#2251A3] font-medium hover:underline">
                {t("site.chat.book.otherDate")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {availableSlots.map((slot) => (
                <button key={slot}
                  onClick={() => { setBookingData((d) => ({ ...d, timeSlot: slot })); setBookingStep("form"); }}
                  className="border border-[#D2DCE8] rounded-xl py-2 text-xs font-medium font-dm text-[#3A4A5C] hover:border-[#1B3A6B] hover:text-[#1B3A6B] hover:bg-[#EBF0FA] transition-colors">
                  {slotLabel(slot, locale)}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (bookingStep === "form") {
      return (
        <BookingForm
          dateLabel={bookingData.dateLabel!}
          timeSlot={slotLabel(bookingData.timeSlot!, locale)}
          onBack={() => setBookingStep("time")}
          onSubmit={handleBookingSubmit}
        />
      );
    }
    if (bookingStep === "submitting") {
      return (
        <div className="px-4 pb-4 pt-3 flex items-center gap-2 text-sm font-dm text-[#7A8FA6]">
          <Loader2 size={15} className="animate-spin" aria-hidden="true" /> {t("site.chat.book.submitting")}
        </div>
      );
    }
    return null;
  }

  const showInput = bookingStep === null || bookingStep === "done";

  return (
    <>
      <style>{`
        @keyframes echelonBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .typing-dot { animation: echelonBounce 1.2s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes tiboFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tibo-fade-in { animation: tiboFadeIn 0.25s ease both; }
      `}</style>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat window — CSS transition, no framer-motion */}
      {isOpen && (
        <div
          ref={dialogRef}
          className="tibo-fade-in fixed z-50 flex flex-col bg-white border border-[#D2DCE8] shadow-2xl overflow-hidden rounded-2xl inset-x-3 bottom-[80px] top-auto sm:inset-auto sm:bottom-20 sm:right-6 sm:w-[360px]"
          style={{ maxHeight: "min(72dvh, 600px)" }}
          data-chat-widget="echelon"
          data-ai-agent="true"
          aria-label={t("site.chat.dialog")}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="bg-[#1B3A6B] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src="/tibo-avatar.svg"
                alt="Tibo"
                className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                style={{ border: "1.5px solid rgba(255,255,255,0.22)" }}
              />
              <div>
                <p className="text-white text-base font-bold leading-tight" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                  Tibo
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  <p className="text-white/60 text-xs leading-tight">{t("site.chat.subtitle")}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label={t("site.chat.close")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFD] flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2.5 text-sm leading-relaxed font-dm rounded-2xl ${
                    msg.role === "user"
                      ? "bg-[#1B3A6B] text-white rounded-tr-sm"
                      : "bg-white border border-[#E8EFF8] text-[#0D1B2A] rounded-tl-sm shadow-sm"
                  }`}
                  dangerouslySetInnerHTML={{
                    // Escape first: the text is typed by the visitor or written by
                    // the model, and only **bold** and line breaks are markup.
                    __html: msg.content
                      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div role="status" aria-label={t("site.chat.typing")} className="bg-white border border-[#E8EFF8] rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm flex items-center gap-1">
                  <div className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Booking UI */}
          {bookingStep && bookingStep !== "done" && (
            <div className="border-t border-[#E8EFF8] bg-white flex-shrink-0">
              {renderBookingUI()}
            </div>
          )}

          {/* Input */}
          {showInput && (
            <div className="border-t border-[#D2DCE8] p-3 bg-white flex items-center gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                onFocus={() => {
                  setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
                }}
                placeholder={t("site.chat.placeholder")}
                aria-label={t("site.chat.placeholder")}
                disabled={loading}
                className="flex-1 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-3 py-2 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] disabled:opacity-50 transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                aria-label={t("site.chat.send")}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#F47C20] hover:bg-[#d96b18] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={15} className="text-white" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Greeting bubble */}
      {showGreeting && !isOpen && (

        <div
          className="fixed bottom-[148px] sm:bottom-24 right-4 sm:right-6 z-50 tibo-fade-in cursor-pointer"
          onClick={() => { setShowGreeting(false); setIsOpen(true); }}
          role="button"
          aria-label={t("site.chat.greeting.open")}
        >
          <div className="relative bg-white border border-[#D2DCE8] rounded-2xl shadow-xl px-4 py-3 max-w-[220px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGreeting(false);
                try { sessionStorage.setItem("tibo_dismissed", "1"); } catch { /* private mode */ }
              }}
              className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center text-[#B0BEC5] hover:text-[#3A4A5C] transition-colors"
              aria-label={t("site.chat.greeting.dismiss")}
            >
              <X size={12} />
            </button>
            <p className="font-syne font-bold text-xs text-[#0D1B2A] mb-1 pr-6">{t("site.chat.greeting.title")}</p>
            <p className="font-dm text-xs text-[#3A4A5C] leading-relaxed pr-3">
              {t("site.chat.greeting.body")}
            </p>
            <div className="absolute -bottom-2 right-7 w-3 h-3 bg-white border-r border-b border-[#D2DCE8] rotate-45" />
          </div>
        </div>
      )}

      {/* Floating trigger button — desktop only (mobile uses MobileBottomNav Tibo tab) */}
      <aside className="hidden sm:block fixed bottom-6 right-6 z-[55]" data-chat-widget="echelon-trigger" aria-label={t("site.chat.launcher")}>
        {!isOpen && (
          <span
            className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-30 pointer-events-none"
            style={{ background: "#1B3A6B" }}
          />
        )}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? t("site.chat.closeTibo") : t("site.chat.talk")}
          className="relative w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
          style={{
            background: isOpen ? "#F47C20" : "linear-gradient(135deg, #1B3A6B 0%, #2251A3 100%)",
            boxShadow: "0 4px 20px rgba(27,58,107,0.4)",
          }}
        >
          {isOpen ? (
            <X size={22} className="text-white" strokeWidth={2.5} />
          ) : (
            <Image src="/tibo-avatar.svg" alt="Tibo" width={56} height={56} className="w-full h-full rounded-full object-cover" />
          )}
          {hasUnread && !isOpen && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#F47C20]" />
          )}
        </button>
      </aside>
    </>
  );
}
