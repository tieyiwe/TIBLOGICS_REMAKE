"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hey! I'm TIBS 👋 How can I help you today? Ask me anything about TIBLOGICS — services, products, pricing, or how AI can transform your business.",
};

export default function TIBSFloat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide on all admin pages
  if (pathname?.startsWith("/admin")) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      // Small delay so animation completes before focusing
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  async function handleSend() {
    const trimmed = input.trim();
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
      const aiText: string =
        res.ok && data.text
          ? data.text
          : "Sorry, I'm having trouble connecting right now. Please email ai@tiblogics.com for help.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiText },
      ]);

      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please email ai@tiblogics.com for help.",
        },
      ]);
      if (!isOpen) setHasUnread(true);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Inject typing dot keyframes once */}
      <style>{`
        @keyframes tibsBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .typing-dot { animation: tibsBounce 1.2s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="tibs-chat"
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-20 right-6 z-50 w-[340px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ transformOrigin: "bottom right" }}
          >
            {/* Header */}
            <div className="bg-[#1B3A6B] rounded-t-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #2251A3, #1B3A6B)",
                    border: "1.5px solid rgba(255,255,255,0.18)",
                  }}
                >
                  <span
                    className="text-white text-sm font-extrabold leading-none"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    T
                  </span>
                </div>
                <div>
                  <p
                    className="text-white text-base font-bold leading-tight"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    TIBS
                  </p>
                  <p className="text-white/60 text-xs leading-tight">
                    TIBLOGICS AI Assistant
                  </p>
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
            <div className="h-80 overflow-y-auto p-4 bg-white flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 text-sm leading-snug ${
                      msg.role === "user"
                        ? "bg-[#1B3A6B] text-white rounded-2xl rounded-tr-sm"
                        : "bg-[#F4F7FB] text-[#0D1B2A] rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#F4F7FB] rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                    <div className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
                    <div className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
                    <div className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-[#D2DCE8] p-3 bg-[#F4F7FB] rounded-b-2xl flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask TIBS anything…"
                disabled={loading}
                className="flex-1 bg-white border border-[#D2DCE8] rounded-xl px-3 py-2 text-sm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] disabled:opacity-50 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#F47C20" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#d96b18")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#F47C20")
                }
              >
                <Send size={15} className="text-white" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse ring — only when closed */}
        {!isOpen && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-30 pointer-events-none"
            style={{ background: "#1B3A6B" }}
          />
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Close TIBS chat" : "Open TIBS chat"}
          className="relative w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
          style={{
            background: isOpen
              ? "#F47C20"
              : "linear-gradient(135deg, #1B3A6B 0%, #2251A3 100%)",
            boxShadow: "0 4px 20px rgba(27,58,107,0.4)",
          }}
          onMouseEnter={(e) => {
            if (!isOpen)
              (e.currentTarget as HTMLButtonElement).style.background =
                "#F47C20";
          }}
          onMouseLeave={(e) => {
            if (!isOpen)
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, #1B3A6B 0%, #2251A3 100%)";
          }}
        >
          {isOpen ? (
            <X size={22} className="text-white" strokeWidth={2.5} />
          ) : (
            <span
              className="text-white text-xl font-extrabold leading-none select-none"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              T
            </span>
          )}

          {/* Unread badge */}
          {hasUnread && !isOpen && (
            <span
              className="absolute top-0 right-0 w-2 h-2 rounded-full border-2 border-white"
              style={{ background: "#F47C20" }}
            />
          )}
        </button>
      </div>
    </>
  );
}
