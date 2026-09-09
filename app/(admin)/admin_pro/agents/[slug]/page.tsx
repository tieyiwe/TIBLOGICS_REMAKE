"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { Send, Trash2, Copy, Check } from "lucide-react";

const AGENTS: Record<string, { name: string; title: string; avatar: string; color: string; bg: string; placeholder: string }> = {
  aria: {
    name: "Aria",
    title: "Marketing & Content Specialist",
    avatar: "✍️",
    color: "#F47C20",
    bg: "#FEF0E3",
    placeholder: "Ask Aria to write a LinkedIn post, draft a blog intro, create a content calendar…",
  },
  rex: {
    name: "Rex",
    title: "Sales & Business Development",
    avatar: "🎯",
    color: "#0F6E56",
    bg: "#E6F5F0",
    placeholder: "Ask Rex to score a prospect, draft an outreach email, build a proposal…",
  },
  nova: {
    name: "Nova",
    title: "Operations & Analytics",
    avatar: "📊",
    color: "#7c3aed",
    bg: "#F3EEFF",
    placeholder: "Ask Nova to analyze metrics, generate a report, forecast revenue…",
  },
};

const STARTERS: Record<string, string[]> = {
  aria: [
    "Write a LinkedIn post about AI implementation ROI",
    "Create a Twitter/X thread about workflow automation",
    "Draft an Instagram caption for a new client win",
    "Write a blog intro about AI for small businesses",
    "Generate a 2-week content calendar for TIBLOGICS",
  ],
  rex: [
    "Score this prospect: healthcare startup, 50 employees, wants AI chatbot",
    "Draft a cold email to a SaaS company CEO",
    "Write a follow-up email for a discovery call lead",
    "Build a proposal outline for an AI Implementation project",
    "Suggest upsell opportunities for a web dev client",
  ],
  nova: [
    "Analyze this month's appointment booking rate",
    "What KPIs should TIBLOGICS track for growth?",
    "Generate a weekly operations report template",
    "Suggest 3 process improvements for our sales pipeline",
    "How should we price our AI Academy for scaling?",
  ],
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 font-dm text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-bold text-[#0D1B2A]">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("## ")) {
          return <p key={i} className="font-syne font-bold text-base text-[#0D1B2A] mt-2">{line.slice(3)}</p>;
        }
        if (line.startsWith("# ")) {
          return <p key={i} className="font-syne font-extrabold text-lg text-[#0D1B2A] mt-2">{line.slice(2)}</p>;
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <p key={i} className="pl-3 before:content-['•'] before:mr-2 before:text-current">{line.slice(2)}</p>;
        }
        if (/^\d+\./.test(line)) {
          return <p key={i} className="pl-3">{line}</p>;
        }
        if (line === "") return <div key={i} className="h-1" />;
        // Bold inline: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function AgentChatPage() {
  const { slug } = useParams<{ slug: string }>();
  const agent = AGENTS[slug];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!agent) {
    notFound();
  }

  async function sendMessage(text?: string) {
    const userText = text ?? input.trim();
    if (!userText || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/claude/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, agent: slug }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.text ?? "I encountered an issue. Please try again." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function copyMessage(idx: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const starters = STARTERS[slug] ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Agent header */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: agent.bg }}
          >
            {agent.avatar}
          </div>
          <div>
            <p className="font-syne font-bold text-base text-[#0D1B2A]">{agent.name}</p>
            <p className="font-dm text-xs font-medium" style={{ color: agent.color }}>{agent.title}</p>
          </div>
          <span className="ml-2 w-2 h-2 rounded-full bg-green-500 inline-block" title="Online" />
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-[#7A8FA6] hover:text-red-500 transition-colors font-dm"
          >
            <Trash2 size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.length === 0 ? (
          <div className="space-y-5 py-4">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                style={{ backgroundColor: agent.bg }}
              >
                {agent.avatar}
              </div>
              <p className="font-syne font-bold text-lg text-[#0D1B2A]">Chat with {agent.name}</p>
              <p className="font-dm text-sm text-[#7A8FA6] mt-1">{agent.title}</p>
            </div>
            <div>
              <p className="font-dm text-xs text-[#7A8FA6] uppercase tracking-wider font-semibold mb-2 text-center">
                Try asking
              </p>
              <div className="flex flex-col gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-sm font-dm px-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-colors text-[#3A4A5C]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                  style={{ backgroundColor: agent.bg }}
                >
                  {agent.avatar}
                </div>
              )}
              <div className={`group relative max-w-[80%] ${msg.role === "user" ? "max-w-[70%]" : ""}`}>
                {msg.role === "user" ? (
                  <div className="bg-[#1B3A6B] text-white rounded-2xl rounded-tr-sm px-4 py-3 font-dm text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-white border border-[#D2DCE8] rounded-2xl rounded-tl-sm px-4 py-3">
                    <MarkdownText text={msg.content} />
                  </div>
                )}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => copyMessage(idx, msg.content)}
                    className="absolute -bottom-5 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[#7A8FA6] hover:text-[#1B3A6B] text-xs font-dm"
                  >
                    {copied === idx ? <Check size={12} /> : <Copy size={12} />}
                    {copied === idx ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: agent.bg }}
            >
              {agent.avatar}
            </div>
            <div className="bg-white border border-[#D2DCE8] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
                <span className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
                <span className="typing-dot w-2 h-2 rounded-full bg-[#7A8FA6]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={agent.placeholder}
          className="flex-1 resize-none outline-none font-dm text-sm text-[#0D1B2A] placeholder:text-[#7A8FA6] max-h-32 overflow-y-auto bg-transparent"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
          style={{ backgroundColor: agent.color }}
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}
