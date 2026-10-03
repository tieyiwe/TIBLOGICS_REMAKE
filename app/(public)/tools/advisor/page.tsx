"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Crosshair, Shield, Zap, Send } from "lucide-react";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import { trackPageVisit, trackToolUse } from "@/lib/recommendations";
import { useT } from "@/lib/i18n/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProspectProfile {
  name: string;
  biz: string;
  industry: string;
  challenge: string;
  budget: string;
  solutions: string[];
}

function parseProspectProfile(text: string): { cleaned: string; profile: ProspectProfile | null } {
  if (!text.includes("PROSPECT_PROFILE|")) return { cleaned: text, profile: null };
  const lines = text.split("\n");
  const profileLine = lines.find((l) => l.startsWith("PROSPECT_PROFILE|"));
  const cleaned = lines
    .filter((l) => !l.startsWith("PROSPECT_PROFILE|"))
    .join("\n")
    .trim();
  if (!profileLine) return { cleaned: text, profile: null };
  const parts = profileLine.split("|");
  const get = (key: string) =>
    parts.find((p) => p.startsWith(key + ":"))?.slice(key.length + 1) ?? "";
  return {
    cleaned,
    profile: {
      name: get("name"),
      biz: get("biz"),
      industry: get("industry"),
      challenge: get("challenge"),
      budget: get("budget"),
      solutions: get("solutions")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
  };
}

export default function AdvisorPage() {
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      router.replace("/tools");
      return;
    }
    trackPageVisit("/tools/advisor");
    trackToolUse("advisor");
  }, [router]);

  // The greeting is in the visitor's language; the API tells the model to
  // carry on in it.
  const [messages, setMessages] = useState<Message[]>(() => [{ role: "assistant", content: t("tools.advisor.greeting") }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prospectProfile, setProspectProfile] = useState<ProspectProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/claude/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
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
          } catch { /* ignore incomplete chunks */ }
        }
      }

      const { cleaned, profile } = parseProspectProfile(full);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: cleaned };
        return updated;
      });
      if (profile) setProspectProfile(profile);
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: t("tools.advisor.connError") };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleBookCall() {
    if (!prospectProfile || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prospectProfile.name,
          business: prospectProfile.biz,
          industry: prospectProfile.industry,
          mainChallenge: prospectProfile.challenge,
          budget: prospectProfile.budget,
          suggestedSolutions: prospectProfile.solutions,
          source: "ECHELON_ADVISOR",
          conversationLog: messages,
        }),
      });
    } catch {
      // Non-blocking
    } finally {
      setSubmitting(false);
      router.push("/book");
    }
  }

  return (
    <div className="min-h-screen pt-32 sm:pt-44 pb-16 bg-[#F4F7FB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left info panel */}
          <div className="lg:col-span-2 bg-[#1B3A6B] rounded-2xl p-6 text-white flex flex-col gap-5">
            <div>
              <h1 className="font-syne font-extrabold text-3xl text-white">Echelon</h1>
              <p className="text-white/60 font-dm text-sm mt-0.5">{t("tools.advisor.subtitle")}</p>
            </div>

            <p className="font-dm text-sm text-white/80 leading-relaxed">
              {t("tools.advisor.intro")}
            </p>

            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} className="text-[#F47C20]" />
                </div>
                <div>
                  <p className="font-dm text-sm font-semibold text-white">{t("tools.advisor.f1.title")}</p>
                  <p className="font-dm text-xs text-white/50 mt-0.5">
                    {t("tools.advisor.f1.body")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Crosshair size={15} className="text-[#F47C20]" />
                </div>
                <div>
                  <p className="font-dm text-sm font-semibold text-white">{t("tools.advisor.f2.title")}</p>
                  <p className="font-dm text-xs text-white/50 mt-0.5">
                    {t("tools.advisor.f2.body")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield size={15} className="text-[#F47C20]" />
                </div>
                <div>
                  <p className="font-dm text-sm font-semibold text-white">{t("tools.advisor.f3.title")}</p>
                  <p className="font-dm text-xs text-white/50 mt-0.5">
                    {t("tools.advisor.f3.body")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap size={15} className="text-[#F47C20]" />
                </div>
                <div>
                  <p className="font-dm text-sm font-semibold text-white">{t("tools.advisor.f4.title")}</p>
                  <p className="font-dm text-xs text-white/50 mt-0.5">
                    {t("tools.advisor.f4.body")}
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-auto pt-4 border-t border-white/10">
              <p className="font-dm text-xs text-white/40 mb-1">{t("tools.advisor.questions")}</p>
              <a
                href="mailto:ai@tiblogics.com"
                className="font-dm text-sm font-semibold text-[#F47C20] hover:text-[#E05F00] transition-colors"
              >
                ai@tiblogics.com
              </a>
            </div>
          </div>

          {/* Right chat panel */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-white border border-[#D2DCE8] rounded-2xl flex flex-col overflow-hidden">
              {/* Chat header */}
              <div className="bg-[#1B3A6B] rounded-t-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F47C20] flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-syne font-bold text-white text-sm">Echelon</p>
                  <p className="font-dm text-xs text-white/50">{t("tools.advisor.header")}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-dm text-xs text-white/50">{t("tools.advisor.online")}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-[400px] max-h-[500px] overflow-y-auto p-4 flex flex-col gap-3" aria-live="polite">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={
                        msg.role === "user"
                          ? "chat-bubble-user self-end"
                          : "chat-bubble-ai self-start"
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="chat-bubble-ai self-start flex items-center gap-1 py-3">
                      <span
                        className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6] inline-block"
                        style={{ animationDelay: "0s" }}
                      />
                      <span
                        className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6] inline-block"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6] inline-block"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-[#D2DCE8] p-3 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={t("tools.advisor.placeholder")}
                  aria-label={t("tools.advisor.placeholder")}
                  disabled={loading}
                  className="input-base flex-1 min-w-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-[#F47C20] hover:bg-[#E05F00] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-2.5 transition-colors duration-200 shrink-0"
                  aria-label={t("tools.advisor.send")}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Prospect Profile Card */}
            {prospectProfile && (
              <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-green-500 text-lg font-bold" aria-hidden>✓</span>
                  <h2 className="font-syne font-bold text-[#0D1B2A] text-base">
                    {t("tools.advisor.profile")}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: t("tools.advisor.name"), value: prospectProfile.name || t("tools.advisor.unknown") },
                    { label: t("tools.advisor.business"), value: prospectProfile.biz || "-" },
                    { label: t("tools.advisor.industry"), value: prospectProfile.industry || "-" },
                    { label: t("tools.advisor.budget"), value: prospectProfile.budget || t("tools.advisor.notSpecified") },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="font-dm text-xs text-[#7A8FA6] uppercase tracking-wider mb-0.5">
                        {field.label}
                      </p>
                      <p className="font-dm text-sm font-medium text-[#0D1B2A] break-words">{field.value}</p>
                    </div>
                  ))}
                  {prospectProfile.challenge && (
                    <div className="col-span-2">
                      <p className="font-dm text-xs text-[#7A8FA6] uppercase tracking-wider mb-0.5">
                        {t("tools.advisor.challenge")}
                      </p>
                      <p className="font-dm text-sm text-[#3A4A5C]">{prospectProfile.challenge}</p>
                    </div>
                  )}
                </div>

                {prospectProfile.solutions.length > 0 && (
                  <div className="mb-4">
                    <p className="font-dm text-xs text-[#7A8FA6] uppercase tracking-wider mb-2">
                      {t("tools.advisor.solutions")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {prospectProfile.solutions.map((sol) => (
                        <span
                          key={sol}
                          className="bg-[#EBF0FA] text-[#2251A3] rounded-full px-3 py-1 text-sm font-dm font-medium"
                        >
                          {sol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBookCall}
                  disabled={submitting}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t("tools.advisor.sending") : t("tools.advisor.book")}
                </button>
              </div>
            )}
          </div>
        </div>
        <SmartRecommendations currentPage="/tools/advisor" compact />
      </div>
    </div>
  );
}
