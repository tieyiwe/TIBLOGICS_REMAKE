"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, ChevronLeft, Loader2 } from "lucide-react";

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
const ALL_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hey! I'm Tibo 👋 How can I help you today? Ask me anything about TIBLOGICS — services, products, pricing, or how AI can transform your business.",
};

function getAvailableDates(blockedSet: Set<string>): Array<{ value: string; label: string }> {
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
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
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
  timeSlot: string;
  onBack: () => void;
  onSubmit: (data: { firstName: string; lastName: string; email: string; phone: string }) => void;
}) {
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
        <button onClick={onBack} className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
          <ChevronLeft size={15} />
        </button>
        <p className="text-xs font-semibold text-[#3A4A5C] uppercase tracking-wide">
          {dateLabel} · {timeSlot} EST
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={form.firstName} onChange={set("firstName")} placeholder="First name" className={fieldCls} />
        <input value={form.lastName} onChange={set("lastName")} placeholder="Last name" className={fieldCls} />
      </div>
      <input value={form.email} onChange={set("email")} placeholder="Email address" type="email" className={fieldCls} />
      <input value={form.phone} onChange={set("phone")} placeholder="Phone number" type="tel" className={fieldCls} />
      <button
        onClick={() => valid && onSubmit(form)}
        disabled={!valid}
        className="w-full bg-[#1B3A6B] text-white rounded-xl py-2.5 text-sm font-semibold font-dm disabled:opacity-40 hover:bg-[#2251A3] transition-colors mt-1"
      >
        Confirm Meeting
      </button>
    </div>
  );
}

export default function EchelonFloat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [bookingStep, setBookingStep] = useState<BookingStep>(null);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [availableSlots, setAvailableSlots] = useState<string[]>(ALL_SLOTS);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = pathname?.startsWith("/admin");
  const [blockedDateSet, setBlockedDateSet] = useState<Set<string>>(new Set());

  // Scroll messages into view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, bookingStep]);

  // Auto-open after 3 seconds (once per session)
  useEffect(() => {
    if (isAdmin) return;
    if (sessionStorage.getItem("tibo_auto_opened")) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem("tibo_auto_opened", "1");
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAdmin]);

  // Pre-load blocked dates for the next 30 days
  useEffect(() => {
    fetch("/api/appointments/blocked-dates")
      .then(r => r.json())
      .then(d => {
        const set = new Set<string>();
        (d.blocked ?? []).forEach((b: { date: string }) => {
          set.add(b.date.split("T")[0]);
        });
        setBlockedDateSet(set);
      })
      .catch(() => {});
  }, []);

  // Listen for tibo:open event (dispatched by "Talk to Tibo" nav button)
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("tibo:open", handler);
    return () => window.removeEventListener("tibo:open", handler);
  }, []);

  // Auto-engage after website scan completes
  useEffect(() => {
    function handleScanComplete(e: Event) {
      const { url, overallScore, criticals, aiScore } = (e as CustomEvent).detail as {
        url: string; overallScore: number; criticals: number; aiScore: number;
      };
      setTimeout(() => {
        setMessages([
          INITIAL_MESSAGE,
          {
            role: "assistant",
            content: `I can see you just scanned **${url}** — overall score **${overallScore}/100**, **${criticals} critical issue${criticals !== 1 ? "s" : ""}**, and an AI readiness score of **${aiScore}/100**.\n\nThere are clear opportunities here. Would you like me to set up a meeting with our team to walk through the findings and build a fix plan together?`,
          },
        ]);
        setBookingStep("prompt");
        setIsOpen(true);
        setHasUnread(false);
      }, 3500);
    }
    window.addEventListener("tibo:scan-complete", handleScanComplete);
    return () => window.removeEventListener("tibo:scan-complete", handleScanComplete);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
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

    try {
      const res = await fetch("/api/claude/float", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      const raw: string =
        res.ok && data.text
          ? data.text
          : "Sorry, I'm having trouble connecting right now. Please email info@tiblogics.com for help.";

      const hasBooking = raw.includes(BOOKING_MARKER);
      const clean = raw.replace(BOOKING_MARKER, "").trim();
      setMessages((prev) => [...prev, { role: "assistant", content: clean }]);
      if (hasBooking) setBookingStep("prompt");
      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please email info@tiblogics.com for help." },
      ]);
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
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "PROJECT_DISCOVERY_MEETING",
          serviceDuration: 20,
          servicePrice: 0,
          totalAmount: 0,
          date: bookingData.date,
          timeSlot: bookingData.timeSlot,
          timezone: "America/New_York",
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          notes: JSON.stringify({ phone: form.phone, source: "echelon_chat" }),
        }),
      });
      setBookingStep("done");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `You're all set, ${form.firstName}! 🎉\n\nYour **20-min Discovery Meeting** is confirmed for **${bookingData.dateLabel}** at **${bookingData.timeSlot} EST**. A confirmation is on its way to **${form.email}**.\n\nA member of our team will reach out beforehand to make sure we're fully prepared for your call. We're looking forward to it!`,
        },
      ]);
    } catch {
      setBookingStep("form");
    }
  }

  function declineBooking() {
    setBookingStep(null);
    handleSend("No thanks, I'll keep exploring for now.");
  }

  function renderBookingUI() {
    if (bookingStep === "prompt") {
      return (
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <button
            onClick={() => setBookingStep("date")}
            className="flex-1 bg-[#1B3A6B] text-white rounded-xl py-2.5 text-sm font-semibold font-dm hover:bg-[#2251A3] transition-colors"
          >
            Yes, let&apos;s do it!
          </button>
          <button
            onClick={declineBooking}
            className="flex-1 border border-[#D2DCE8] text-[#3A4A5C] rounded-xl py-2.5 text-sm font-medium font-dm hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-colors"
          >
            Not right now
          </button>
        </div>
      );
    }
    if (bookingStep === "date") {
      const dates = getAvailableDates(blockedDateSet);
      return (
        <div className="px-4 pb-4 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setBookingStep("prompt")} className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
              <ChevronLeft size={15} />
            </button>
            <p className="text-xs font-semibold text-[#3A4A5C] uppercase tracking-wide">Pick a date</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {dates.map((d) => (
              <button
                key={d.value}
                onClick={() => handleDateSelect(d.value, d.label)}
                className="border border-[#D2DCE8] rounded-xl py-2 px-2.5 text-xs font-medium font-dm text-[#3A4A5C] hover:border-[#1B3A6B] hover:text-[#1B3A6B] hover:bg-[#EBF0FA] transition-colors text-left"
              >
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
            <button onClick={() => setBookingStep("date")} className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
              <ChevronLeft size={15} />
            </button>
            <p className="text-xs font-semibold text-[#3A4A5C] uppercase tracking-wide truncate">
              {bookingData.dateLabel} — Pick a time (EST)
            </p>
          </div>
          {slotsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-[#7A8FA6]" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-xs text-[#7A8FA6] font-dm">No slots available — pick another date.</p>
              <button onClick={() => setBookingStep("date")} className="mt-2 text-xs text-[#2251A3] font-medium hover:underline">
                ← Choose different date
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => { setBookingData((d) => ({ ...d, timeSlot: slot })); setBookingStep("form"); }}
                  className="border border-[#D2DCE8] rounded-xl py-2 text-xs font-medium font-dm text-[#3A4A5C] hover:border-[#1B3A6B] hover:text-[#1B3A6B] hover:bg-[#EBF0FA] transition-colors"
                >
                  {slot}
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
          timeSlot={bookingData.timeSlot!}
          onBack={() => setBookingStep("time")}
          onSubmit={handleBookingSubmit}
        />
      );
    }
    if (bookingStep === "submitting") {
      return (
        <div className="px-4 pb-4 pt-3 flex items-center gap-2 text-sm font-dm text-[#7A8FA6]">
          <Loader2 size={15} className="animate-spin" /> Booking your meeting…
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
      `}</style>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              key="echelon-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="echelon-chat"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className={[
                "fixed z-50 flex flex-col bg-white border border-[#D2DCE8] shadow-2xl overflow-hidden",
                // Mobile: centered modal with margin from edges
                "inset-x-4 bottom-4 top-auto rounded-2xl",
                "sm:inset-auto sm:bottom-20 sm:right-6 sm:w-[360px] sm:rounded-2xl",
              ].join(" ")}
              style={{
                maxHeight: "min(82vh, 600px)",
                // Desktop origin for spring animation
                transformOrigin: "bottom right",
              }}
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
                      <p className="text-white/60 text-xs leading-tight">TIBLOGICS AI Assistant</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Close chat"
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
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br/>"),
                      }}
                    />
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#E8EFF8] rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm flex items-center gap-1">
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
                    placeholder="Ask Tibo anything…"
                    disabled={loading}
                    className="flex-1 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl px-3 py-2 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] disabled:opacity-50 transition-colors"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#F47C20] hover:bg-[#d96b18] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={15} className="text-white" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating trigger button — desktop only; mobile uses MobileBottomNav */}
      <div className="hidden sm:block fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-30 pointer-events-none"
            style={{ background: "#1B3A6B" }}
          />
        )}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Close Tibo chat" : "Talk to Tibo"}
          className="relative w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
          style={{
            background: isOpen ? "#F47C20" : "linear-gradient(135deg, #1B3A6B 0%, #2251A3 100%)",
            boxShadow: "0 4px 20px rgba(27,58,107,0.4)",
          }}
        >
          {isOpen ? (
            <X size={22} className="text-white" strokeWidth={2.5} />
          ) : (
            <img src="/tibo-avatar.svg" alt="Tibo" className="w-full h-full rounded-full object-cover" />
          )}
          {hasUnread && !isOpen && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#F47C20]" />
          )}
        </button>
      </div>
    </>
  );
}
