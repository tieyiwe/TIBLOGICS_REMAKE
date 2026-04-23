"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Send,
  MapPin,
  Users,
  Phone,
  Mail,
  Globe,
  CheckSquare,
  Square,
} from "lucide-react";

const AGENT = {
  name: "Aria",
  title: "Marketing & Lead Generation",
  avatar: "✍️",
  color: "#F47C20",
  bg: "#FEF0E3",
};

interface Lead {
  id: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  industry?: string;
  description?: string;
  status: string;
  source: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CHAT_STARTERS = [
  "Write a LinkedIn post about AI implementation ROI",
  "Create a Twitter/X thread about workflow automation",
  "Draft an email campaign for our AI services",
  "Generate a 2-week content calendar for TIBLOGICS",
];

export default function AriaPage() {
  const [tab, setTab] = useState<"search" | "chat">("search");

  // Lead search state
  const [instructions, setInstructions] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [count, setCount] = useState(8);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [transferring, setTransferring] = useState(false);
  const [transferDone, setTransferDone] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  async function searchLeads() {
    if (!location.trim()) {
      alert("Please enter a location.");
      return;
    }
    setSearching(true);
    setResults([]);
    setSelectedIds(new Set());
    setTransferDone(false);
    try {
      const res = await fetch("/api/admin/agents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: instructions.trim(),
          location: location.trim(),
          industry: industry.trim(),
          count,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.leads);
      } else {
        alert(data.error ?? "Search failed. Please try again.");
      }
    } catch {
      alert("Search failed. Please check your connection.");
    } finally {
      setSearching(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function toggleAll() {
    const selectable = results.filter((l) => l.status !== "TRANSFERRED");
    if (selectedIds.size === selectable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectable.map((l) => l.id)));
    }
  }

  async function transferToRex() {
    if (selectedIds.size === 0) return;
    setTransferring(true);
    try {
      const res = await fetch("/api/admin/agents/leads/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setTransferDone(true);
        const transferred = new Set(selectedIds);
        setSelectedIds(new Set());
        setResults((prev) =>
          prev.map((l) =>
            transferred.has(l.id) ? { ...l, status: "TRANSFERRED" } : l
          )
        );
      } else {
        alert("Transfer failed. Please try again.");
      }
    } catch {
      alert("Transfer failed.");
    } finally {
      setTransferring(false);
    }
  }

  async function sendChat(text?: string) {
    const userText = text ?? input.trim();
    if (!userText || chatLoading) return;
    const newMsgs: ChatMessage[] = [...chatMessages, { role: "user", content: userText }];
    setChatMessages(newMsgs);
    setInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/claude/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, agent: "aria" }),
      });
      const data = await res.json();
      setChatMessages([
        ...newMsgs,
        { role: "assistant", content: data.text ?? "Something went wrong. Try again." },
      ]);
    } catch {
      setChatMessages([...newMsgs, { role: "assistant", content: "Connection error. Try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const selectable = results.filter((l) => l.status !== "TRANSFERRED");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/agents"
          className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: AGENT.bg }}
          >
            {AGENT.avatar}
          </div>
          <div>
            <p className="font-syne font-bold text-base text-[#0D1B2A]">{AGENT.name}</p>
            <p className="font-dm text-xs font-medium" style={{ color: AGENT.color }}>
              {AGENT.title}
            </p>
          </div>
          <span className="ml-1 w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F4F7FB] p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("search")}
          className={`px-4 py-2 rounded-lg font-dm text-sm font-medium transition-colors ${
            tab === "search"
              ? "bg-white text-[#0D1B2A] shadow-sm"
              : "text-[#7A8FA6] hover:text-[#3A4A5C]"
          }`}
        >
          🔍 Lead Search
        </button>
        <button
          onClick={() => setTab("chat")}
          className={`px-4 py-2 rounded-lg font-dm text-sm font-medium transition-colors ${
            tab === "chat"
              ? "bg-white text-[#0D1B2A] shadow-sm"
              : "text-[#7A8FA6] hover:text-[#3A4A5C]"
          }`}
        >
          💬 Chat with Aria
        </button>
      </div>

      {/* ── Lead Search Tab ── */}
      {tab === "search" && (
        <div className="space-y-4">
          {/* Search form */}
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 space-y-4">
            <div>
              <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider">
                Search Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="e.g. Find coffee shops and restaurants that likely haven't invested in AI or automation yet and could benefit from a digital upgrade…"
                className="w-full mt-1.5 px-3 py-2 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl font-dm text-sm text-[#0D1B2A] placeholder:text-[#7A8FA6] outline-none focus:border-[#F47C20] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider">
                  Location *
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Miami, FL"
                  onKeyDown={(e) => e.key === "Enter" && searchLeads()}
                  className="w-full mt-1.5 px-3 py-2 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl font-dm text-sm text-[#0D1B2A] placeholder:text-[#7A8FA6] outline-none focus:border-[#F47C20] transition-colors"
                />
              </div>
              <div>
                <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider">
                  Industry / Niche
                </label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Restaurants, Healthcare…"
                  className="w-full mt-1.5 px-3 py-2 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl font-dm text-sm text-[#0D1B2A] placeholder:text-[#7A8FA6] outline-none focus:border-[#F47C20] transition-colors"
                />
              </div>
              <div>
                <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider">
                  Lead Count
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full mt-1.5 px-3 py-2 bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl font-dm text-sm text-[#0D1B2A] outline-none focus:border-[#F47C20] transition-colors"
                >
                  {[5, 8, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} leads
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={searchLeads}
                disabled={searching || !location.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-dm text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: AGENT.color }}
              >
                {searching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search size={15} />
                    Search Leads
                  </>
                )}
              </button>
              {!process.env.NEXT_PUBLIC_GOOGLE_PLACES_ENABLED && (
                <p className="font-dm text-xs text-[#7A8FA6]">
                  AI-generated leads (set{" "}
                  <span className="font-mono">GOOGLE_PLACES_API_KEY</span> for real data)
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAll}
                    className="flex items-center gap-1.5 font-dm text-sm text-[#3A4A5C] hover:text-[#0D1B2A] transition-colors"
                  >
                    {selectedIds.size === selectable.length && selectable.length > 0 ? (
                      <CheckSquare size={16} style={{ color: AGENT.color }} />
                    ) : (
                      <Square size={16} />
                    )}
                    {selectedIds.size === selectable.length && selectable.length > 0
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <span className="font-dm text-sm text-[#7A8FA6]">{results.length} leads found</span>
                  {selectedIds.size > 0 && (
                    <span
                      className="font-dm text-sm font-semibold"
                      style={{ color: AGENT.color }}
                    >
                      {selectedIds.size} selected
                    </span>
                  )}
                </div>
                {selectedIds.size > 0 && (
                  <button
                    onClick={transferToRex}
                    disabled={transferring}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F6E56] text-white rounded-xl font-dm text-sm font-semibold hover:bg-[#0d5f49] transition-colors disabled:opacity-50"
                  >
                    {transferring ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Transferring…
                      </>
                    ) : (
                      <>🎯 Transfer {selectedIds.size} to Rex</>
                    )}
                  </button>
                )}
              </div>

              {transferDone && (
                <div className="bg-[#E6F5F0] border border-[#0F6E56]/30 rounded-xl p-3 font-dm text-sm text-[#0F6E56]">
                  ✓ Leads sent to Rex. He&apos;ll pick them up on his Lead Board.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((lead) => {
                  const transferred = lead.status === "TRANSFERRED";
                  const selected = selectedIds.has(lead.id);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => !transferred && toggleSelect(lead.id)}
                      className={`bg-white border rounded-xl p-4 transition-all ${
                        transferred
                          ? "border-[#0F6E56]/30 bg-[#E6F5F0]/20 opacity-60 cursor-default"
                          : selected
                          ? "border-[#F47C20] ring-1 ring-[#F47C20]/20 shadow-sm cursor-pointer"
                          : "border-[#D2DCE8] hover:border-[#F47C20]/40 hover:shadow-sm cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex-shrink-0">
                            {transferred ? (
                              <CheckSquare size={15} className="text-[#0F6E56]" />
                            ) : selected ? (
                              <CheckSquare size={15} style={{ color: AGENT.color }} />
                            ) : (
                              <Square size={15} className="text-[#D2DCE8]" />
                            )}
                          </div>
                          <div>
                            <p className="font-syne font-bold text-sm text-[#0D1B2A]">
                              {lead.companyName}
                            </p>
                            {lead.location && (
                              <p className="font-dm text-xs text-[#7A8FA6] flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {lead.location}
                              </p>
                            )}
                          </div>
                        </div>
                        {transferred && (
                          <span className="text-xs font-dm font-semibold text-[#0F6E56] bg-[#E6F5F0] px-2 py-0.5 rounded-full flex-shrink-0">
                            Sent to Rex
                          </span>
                        )}
                      </div>

                      {lead.description && (
                        <p className="font-dm text-xs text-[#3A4A5C] leading-relaxed mb-2 line-clamp-2">
                          {lead.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {lead.contactName && (
                          <span className="font-dm text-xs text-[#7A8FA6] flex items-center gap-1">
                            <Users size={10} /> {lead.contactName}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="font-dm text-xs text-[#7A8FA6] flex items-center gap-1">
                            <Phone size={10} /> {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="font-dm text-xs text-[#7A8FA6] flex items-center gap-1">
                            <Mail size={10} /> {lead.email}
                          </span>
                        )}
                        {lead.website && (
                          <span className="font-dm text-xs text-[#7A8FA6] flex items-center gap-1">
                            <Globe size={10} /> {lead.website}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Chat Tab ── */}
      {tab === "chat" && (
        <div className="flex flex-col h-[calc(100vh-14rem)] max-h-[600px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {chatMessages.length === 0 ? (
              <div className="space-y-5 py-4">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                    style={{ backgroundColor: AGENT.bg }}
                  >
                    {AGENT.avatar}
                  </div>
                  <p className="font-syne font-bold text-lg text-[#0D1B2A]">Chat with Aria</p>
                  <p className="font-dm text-sm text-[#7A8FA6] mt-1">
                    Marketing &amp; Content Specialist
                  </p>
                </div>
                <div>
                  <p className="font-dm text-xs text-[#7A8FA6] uppercase tracking-wider font-semibold mb-2 text-center">
                    Try asking
                  </p>
                  <div className="flex flex-col gap-2">
                    {CHAT_STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendChat(s)}
                        className="text-left text-sm font-dm px-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl hover:border-[#F47C20] hover:bg-[#FEF0E3]/30 transition-colors text-[#3A4A5C]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                      style={{ backgroundColor: AGENT.bg }}
                    >
                      {AGENT.avatar}
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "max-w-[70%]" : ""}`}>
                    {msg.role === "user" ? (
                      <div className="bg-[#1B3A6B] text-white rounded-2xl rounded-tr-sm px-4 py-3 font-dm text-sm">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="bg-white border border-[#D2DCE8] rounded-2xl rounded-tl-sm px-4 py-3 font-dm text-sm text-[#3A4A5C] whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex items-start gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: AGENT.bg }}
                >
                  {AGENT.avatar}
                </div>
                <div className="bg-white border border-[#D2DCE8] rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#7A8FA6] animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-[#7A8FA6] animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-[#7A8FA6] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-3 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChat();
                }
              }}
              rows={1}
              placeholder="Ask Aria to write a post, draft an email, create a content calendar…"
              className="flex-1 resize-none outline-none font-dm text-sm text-[#0D1B2A] placeholder:text-[#7A8FA6] max-h-32 overflow-y-auto bg-transparent"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={() => sendChat()}
              disabled={!input.trim() || chatLoading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
              style={{ backgroundColor: AGENT.color }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
