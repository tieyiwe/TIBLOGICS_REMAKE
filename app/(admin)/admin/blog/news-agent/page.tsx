"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, Zap, RefreshCw, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { label: "Fetch latest AI news", icon: RefreshCw, msg: "Fetch the latest AI news from Hacker News and DEV.to. Show me what's trending." },
  { label: "What's hot on X/Twitter", icon: Zap, msg: "What AI topics are trending on X (Twitter) right now? What should I write about?" },
  { label: "Generate a tips post", icon: FileText, msg: "Generate a practical tips post: '5 Ways Small Businesses Can Use AI to Save 10 Hours a Week'" },
  { label: "Set breaking news", icon: Zap, msg: "Help me set breaking news. What's the biggest AI news today that deserves a breaking alert?" },
];

export default function NewsAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 I'm your Blog News Agent. I can fetch the latest AI news, generate blog posts, set breaking news alerts, and help you keep the TIBLOGICS blog fresh.\n\nTry one of the quick actions below or type a command.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function executeAction(action: { type: string; data: Record<string, unknown> }) {
    setActionFeedback("Executing action…");
    try {
      if (action.type === "FETCH_NEWS") {
        const res = await fetch("/api/blog/auto-refresh?force=true");
        const data = await res.json();
        setActionFeedback(`✅ Fetched news: ${data.postsAdded ?? 0} new posts added to blog`);
      } else if (action.type === "CREATE_POST" || action.type === "GENERATE_POST_FROM_TITLE") {
        const payload = action.type === "GENERATE_POST_FROM_TITLE"
          ? {
              title: action.data.title,
              excerpt: `${action.data.title} — an AI-generated post.`,
              content: `<p>${action.data.title}</p>`,
              category: "industry",
              tags: ["ai"],
              coverEmoji: "🤖",
              aiGenerated: true,
              sourceUrl: action.data.sourceUrl,
              sourceTitle: action.data.source,
            }
          : action.data;

        const res = await fetch("/api/blog/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, aiGenerated: true }),
        });
        if (res.ok) {
          const d = await res.json();
          setActionFeedback(`✅ Post created: "${d.post?.title}" — <a href="/blog/${d.post?.slug}" target="_blank" class="underline">View →</a>`);
        } else {
          setActionFeedback("❌ Failed to create post.");
        }
      } else if (action.type === "SET_BREAKING_NEWS") {
        const res = await fetch("/api/blog/breaking-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.data),
        });
        if (res.ok) {
          setActionFeedback(`✅ Breaking news set: "${action.data.headline}"`);
        } else {
          setActionFeedback("❌ Failed to set breaking news.");
        }
      } else if (action.type === "CLEAR_BREAKING_NEWS") {
        await fetch("/api/blog/breaking-news", { method: "DELETE" });
        setActionFeedback("✅ Breaking news cleared.");
      }
    } catch {
      setActionFeedback("❌ Action failed. Please try again.");
    }
    setTimeout(() => setActionFeedback(null), 8000);
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const updated: Message[] = [...messages, { role: "user", content }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/blog/news-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      const text2 = data.text ?? "I'm having trouble responding. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: text2 }]);
      if (data.action) {
        await executeAction(data.action);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-syne font-bold text-xl text-[#0D1B2A]">Blog News Agent</h1>
            <p className="font-dm text-xs text-[#7A8FA6]">
              Fetch news · Generate posts · Manage breaking alerts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-dm text-[#7A8FA6]">Connected</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4 flex-shrink-0">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            onClick={() => sendMessage(qa.msg)}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-[#D2DCE8] rounded-xl px-3 py-2.5 text-xs font-dm font-medium text-[#3A4A5C] hover:border-[#2251A3] hover:text-[#2251A3] hover:bg-[#EBF0FA] transition-all disabled:opacity-50 text-left"
          >
            <qa.icon size={13} className="flex-shrink-0" />
            {qa.label}
          </button>
        ))}
      </div>

      {/* Action feedback */}
      {actionFeedback && (
        <div
          className="bg-[#EBF0FA] border border-[#D2DCE8] rounded-xl px-4 py-2.5 text-sm font-dm text-[#1B3A6B] mb-3 flex-shrink-0"
          dangerouslySetInnerHTML={{ __html: actionFeedback }}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white border border-[#D2DCE8] rounded-2xl p-5 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Bot size={13} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-dm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#1B3A6B] text-white rounded-tr-sm"
                  : "bg-[#F4F7FB] text-[#0D1B2A] rounded-tl-sm border border-[#E8EFF8]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] flex items-center justify-center mr-2 mt-0.5">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-[#F4F7FB] rounded-2xl rounded-tl-sm px-4 py-3 border border-[#E8EFF8] flex items-center gap-1">
              <Loader2 size={14} className="animate-spin text-[#7A8FA6]" />
              <span className="text-xs text-[#7A8FA6] font-dm">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Tell the agent what to do… e.g. 'Fetch AI news and create 3 posts'"
          disabled={loading}
          className="flex-1 bg-white border border-[#D2DCE8] rounded-xl px-4 py-3 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl bg-[#1B3A6B] flex items-center justify-center hover:bg-[#2251A3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {loading ? (
            <Loader2 size={16} className="text-white animate-spin" />
          ) : (
            <Send size={16} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
