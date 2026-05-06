"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PhoneCall,
  Send,
  Bell,
  ChevronDown,
  RefreshCw,
  Trash2,
  MessageSquare,
  X,
} from "lucide-react";

const AGENT = {
  name: "Rex",
  title: "Sales & Lead Management",
  avatar: "🎯",
  color: "#0F6E56",
  bg: "#E6F5F0",
};

type LeadStatus =
  | "NEW"
  | "TRANSFERRED"
  | "CONTACTED"
  | "HOT"
  | "WARM"
  | "COLD"
  | "UNINTERESTED"
  | "CONVERTED";

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
  notes?: string;
  status: LeadStatus;
  source: string;
  fromAgent: string;
  callStatus?: string;
  callSid?: string;
  contactedAt?: string;
  transferredAt?: string;
  createdAt: string;
}

interface AgentMsg {
  id: string;
  fromAgent: string;
  type: string;
  subject?: string;
  payload: { leadIds?: string[]; leads?: { companyName: string }[] };
  read: boolean;
  createdAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "New", color: "#2251A3", bg: "#EBF0FA" },
  TRANSFERRED: { label: "Inbox", color: "#F47C20", bg: "#FEF0E3" },
  CONTACTED: { label: "Contacted", color: "#0891b2", bg: "#E0F7FA" },
  HOT: { label: "Hot 🔥", color: "#e11d48", bg: "#FFF0F3" },
  WARM: { label: "Warm", color: "#ca8a04", bg: "#FEFCE8" },
  COLD: { label: "Cold", color: "#4B5563", bg: "#F3F4F6" },
  UNINTERESTED: { label: "Uninterested", color: "#7A8FA6", bg: "#F4F7FB" },
  CONVERTED: { label: "Converted ✓", color: "#0F6E56", bg: "#E6F5F0" },
};

const TRIAGE_OPTIONS: LeadStatus[] = [
  "CONTACTED",
  "HOT",
  "WARM",
  "COLD",
  "UNINTERESTED",
  "CONVERTED",
];

const FILTER_TABS = [
  { key: "inbox", label: "Inbox", statuses: ["TRANSFERRED"] },
  { key: "active", label: "Active", statuses: ["NEW", "CONTACTED"] },
  { key: "interested", label: "Interested", statuses: ["HOT", "WARM"] },
  { key: "cold", label: "Cold / Lost", statuses: ["COLD", "UNINTERESTED"] },
  { key: "won", label: "Won", statuses: ["CONVERTED"] },
  { key: "all", label: "All", statuses: [] as string[] },
];

const CHAT_STARTERS = [
  "Score this prospect: healthcare startup, 50 employees, wants an AI chatbot",
  "Draft a cold email to a SaaS company CEO about AI implementation",
  "Write a follow-up email for a discovery call lead",
  "Build a proposal outline for an AI Implementation project",
];

export default function RexPage() {
  const [tab, setTab] = useState<"leads" | "chat">("leads");

  // Lead board state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agentMsgs, setAgentMsgs] = useState<AgentMsg[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [filterTab, setFilterTab] = useState("inbox");
  const [callingId, setCallingId] = useState<string | null>(null);
  const [triageId, setTriageId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [showInbox, setShowInbox] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLeads();
    loadMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  async function loadLeads() {
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/admin/agents/leads?assignedTo=rex");
      if (res.ok) setLeads(await res.json());
    } finally {
      setLoadingLeads(false);
    }
  }

  async function loadMessages() {
    const res = await fetch("/api/admin/agents/messages?toAgent=rex&unread=true");
    if (res.ok) setAgentMsgs(await res.json());
  }

  async function markRead(id: string) {
    await fetch(`/api/admin/agents/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    setAgentMsgs((prev) => prev.filter((m) => m.id !== id));
  }

  async function callLead(lead: Lead) {
    if (!lead.phone) {
      alert("No phone number on file for this lead.");
      return;
    }
    if (
      !confirm(
        `Call ${lead.contactName ?? lead.companyName} at ${lead.phone}?\n\n${
          process.env.NEXT_PUBLIC_BLAND_ENABLED
            ? "A real call will be initiated via Bland.ai."
            : "Demo mode: call will be simulated."
        }`
      )
    )
      return;

    setCallingId(lead.id);
    try {
      const res = await fetch(`/api/admin/agents/leads/${lead.id}/call`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await loadLeads();
        if (data.simulated) {
          alert(
            "Demo: Call simulated and lead marked as Contacted.\n\nTo enable real calls, add BLAND_AI_API_KEY to your environment variables."
          );
        } else {
          alert(`Call initiated! Bland.ai Call ID: ${data.callId}`);
        }
      } else {
        alert(data.error ?? "Call failed. Please try again.");
      }
    } finally {
      setCallingId(null);
    }
  }

  async function triage(leadId: string, status: LeadStatus) {
    setTriageId(leadId);
    await fetch(`/api/admin/agents/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    setTriageId(null);
  }

  async function saveNotes(leadId: string) {
    setSavingNotes(leadId);
    const notes = localNotes[leadId] ?? "";
    await fetch(`/api/admin/agents/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, notes } : l)));
    setSavingNotes(null);
  }

  async function deleteLead(leadId: string) {
    if (!confirm("Permanently delete this lead?")) return;
    await fetch(`/api/admin/agents/leads/${leadId}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  }

  function filteredLeads() {
    const ft = FILTER_TABS.find((f) => f.key === filterTab);
    if (!ft || ft.statuses.length === 0) return leads;
    return leads.filter((l) => ft.statuses.includes(l.status));
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
        body: JSON.stringify({ messages: newMsgs, agent: "rex" }),
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

  const displayed = filteredLeads();
  const inboxCount = leads.filter((l) => l.status === "TRANSFERRED").length;
  const unreadMsgCount = agentMsgs.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/agents" className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
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
        {unreadMsgCount > 0 && (
          <button
            onClick={() => setShowInbox(!showInbox)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF0E3] border border-[#F47C20]/30 rounded-xl font-dm text-sm font-semibold text-[#F47C20] hover:bg-[#F47C20]/10 transition-colors"
          >
            <Bell size={14} />
            {unreadMsgCount} from Aria
          </button>
        )}
      </div>

      {/* Inbox panel from Aria */}
      {showInbox && agentMsgs.length > 0 && (
        <div className="bg-white border border-[#F47C20]/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-syne font-bold text-sm text-[#0D1B2A]">Messages from Aria</p>
            <button
              onClick={() => setShowInbox(false)}
              className="text-[#7A8FA6] hover:text-[#3A4A5C] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          {agentMsgs.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start justify-between gap-3 p-3 bg-[#FEF0E3]/50 rounded-xl"
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0">✍️</span>
                <div className="min-w-0">
                  <p className="font-dm text-sm font-semibold text-[#0D1B2A] truncate">
                    {msg.subject}
                  </p>
                  {msg.payload?.leads && (
                    <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">
                      {msg.payload.leads.map((l) => l.companyName).join(", ")}
                    </p>
                  )}
                  <p className="font-dm text-xs text-[#7A8FA6]">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => markRead(msg.id)}
                className="text-xs font-dm text-[#7A8FA6] hover:text-[#F47C20] transition-colors flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F4F7FB] p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("leads")}
          className={`px-4 py-2 rounded-lg font-dm text-sm font-medium transition-colors relative ${
            tab === "leads"
              ? "bg-white text-[#0D1B2A] shadow-sm"
              : "text-[#7A8FA6] hover:text-[#3A4A5C]"
          }`}
        >
          🗂️ Lead Board
          {inboxCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#F47C20] text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1">
              {inboxCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("chat")}
          className={`px-4 py-2 rounded-lg font-dm text-sm font-medium transition-colors ${
            tab === "chat"
              ? "bg-white text-[#0D1B2A] shadow-sm"
              : "text-[#7A8FA6] hover:text-[#3A4A5C]"
          }`}
        >
          💬 Chat with Rex
        </button>
      </div>

      {/* ── Lead Board Tab ── */}
      {tab === "leads" && (
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_TABS.map((ft) => {
                const cnt =
                  ft.statuses.length === 0
                    ? leads.length
                    : leads.filter((l) => ft.statuses.includes(l.status)).length;
                return (
                  <button
                    key={ft.key}
                    onClick={() => setFilterTab(ft.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-dm text-xs font-medium transition-colors ${
                      filterTab === ft.key
                        ? "bg-[#0F6E56] text-white"
                        : "bg-white border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#0F6E56]/40"
                    }`}
                  >
                    {ft.label}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        filterTab === ft.key
                          ? "bg-white/20 text-white"
                          : "bg-[#F4F7FB] text-[#7A8FA6]"
                      }`}
                    >
                      {cnt}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={loadLeads}
              disabled={loadingLeads}
              className="flex items-center gap-1.5 text-xs font-dm text-[#7A8FA6] hover:text-[#0F6E56] transition-colors"
            >
              <RefreshCw size={13} className={loadingLeads ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Empty state */}
          {displayed.length === 0 && (
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-10 text-center">
              <p className="text-2xl mb-2">🎯</p>
              <p className="font-syne font-bold text-[#0D1B2A] mb-1">No leads here yet</p>
              <p className="font-dm text-sm text-[#7A8FA6]">
                {filterTab === "inbox"
                  ? "Ask Aria to search for leads and transfer them here."
                  : "No leads match this filter."}
              </p>
            </div>
          )}

          {/* Lead cards */}
          {displayed.length > 0 && (
            <div className="space-y-3">
              {displayed.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      {/* Lead info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-syne font-bold text-base text-[#0D1B2A]">
                            {lead.companyName}
                          </p>
                          <span
                            className="text-xs font-dm font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: STATUS_CONFIG[lead.status]?.bg,
                              color: STATUS_CONFIG[lead.status]?.color,
                            }}
                          >
                            {STATUS_CONFIG[lead.status]?.label}
                          </span>
                          {lead.fromAgent === "aria" && (
                            <span className="text-xs font-dm text-[#F47C20] flex-shrink-0">
                              via Aria ✍️
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {lead.contactName && (
                            <span className="font-dm text-xs text-[#7A8FA6]">
                              👤 {lead.contactName}
                            </span>
                          )}
                          {lead.location && (
                            <span className="font-dm text-xs text-[#7A8FA6]">
                              📍 {lead.location}
                            </span>
                          )}
                          {lead.industry && (
                            <span className="font-dm text-xs text-[#7A8FA6]">
                              🏢 {lead.industry}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {lead.phone && (
                            <span className="font-dm text-xs text-[#3A4A5C] font-medium">
                              📞 {lead.phone}
                            </span>
                          )}
                          {lead.email && (
                            <span className="font-dm text-xs text-[#3A4A5C]">
                              ✉️ {lead.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {/* Call */}
                        <button
                          onClick={() => callLead(lead)}
                          disabled={callingId === lead.id || !lead.phone}
                          title={lead.phone ? `Call ${lead.phone}` : "No phone number"}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-dm text-xs font-semibold transition-all ${
                            callingId === lead.id
                              ? "bg-[#E6F5F0] text-[#0F6E56] opacity-70"
                              : lead.phone
                              ? "bg-[#0F6E56] text-white hover:bg-[#0d5f49]"
                              : "bg-[#F4F7FB] text-[#7A8FA6] cursor-not-allowed"
                          }`}
                        >
                          {callingId === lead.id ? (
                            <div className="w-3 h-3 border-2 border-[#0F6E56]/30 border-t-[#0F6E56] rounded-full animate-spin" />
                          ) : (
                            <PhoneCall size={12} />
                          )}
                          Call
                        </button>

                        {/* Triage */}
                        <div className="relative">
                          <select
                            value={lead.status}
                            onChange={(e) => triage(lead.id, e.target.value as LeadStatus)}
                            disabled={triageId === lead.id}
                            className="appearance-none bg-[#F4F7FB] border border-[#D2DCE8] rounded-xl font-dm text-xs text-[#3A4A5C] px-2.5 py-1.5 pr-7 outline-none hover:border-[#0F6E56]/40 transition-colors cursor-pointer"
                          >
                            <option value={lead.status} disabled>
                              Triage…
                            </option>
                            {TRIAGE_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_CONFIG[s]?.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={10}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A8FA6] pointer-events-none"
                          />
                        </div>

                        {/* Notes toggle */}
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === lead.id ? null : lead.id)
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            expandedId === lead.id
                              ? "bg-[#E6F5F0] text-[#0F6E56]"
                              : "hover:bg-[#F4F7FB] text-[#7A8FA6] hover:text-[#3A4A5C]"
                          }`}
                          title="Notes"
                        >
                          <MessageSquare size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[#7A8FA6] hover:text-red-500"
                          title="Delete lead"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {lead.description && (
                      <p className="font-dm text-xs text-[#7A8FA6] mt-2 leading-relaxed line-clamp-2">
                        {lead.description}
                      </p>
                    )}
                    {lead.callStatus && (
                      <p className="font-dm text-xs text-[#0891b2] mt-1.5">
                        📞 Call status:{" "}
                        <span className="font-semibold">{lead.callStatus}</span>
                        {lead.callSid && (
                          <span className="text-[#7A8FA6]"> · ID: {lead.callSid.slice(0, 16)}…</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Notes panel */}
                  {expandedId === lead.id && (
                    <div className="border-t border-[#D2DCE8] p-4 bg-[#F4F7FB]/40">
                      <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider">
                        Call Notes
                      </label>
                      <textarea
                        value={localNotes[lead.id] ?? lead.notes ?? ""}
                        onChange={(e) =>
                          setLocalNotes((prev) => ({ ...prev, [lead.id]: e.target.value }))
                        }
                        rows={3}
                        placeholder="Notes from the call, objections, next steps…"
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-[#D2DCE8] rounded-xl font-dm text-sm text-[#0D1B2A] placeholder:text-[#7A8FA6] outline-none focus:border-[#0F6E56] transition-colors resize-none"
                      />
                      <button
                        onClick={() => saveNotes(lead.id)}
                        disabled={savingNotes === lead.id}
                        className="mt-2 px-3 py-1.5 bg-[#0F6E56] text-white rounded-xl font-dm text-xs font-semibold hover:bg-[#0d5f49] transition-colors disabled:opacity-60"
                      >
                        {savingNotes === lead.id ? "Saving…" : "Save Notes"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
                  <p className="font-syne font-bold text-lg text-[#0D1B2A]">Chat with Rex</p>
                  <p className="font-dm text-sm text-[#7A8FA6] mt-1">
                    Sales &amp; Business Development
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
                        className="text-left text-sm font-dm px-4 py-2.5 bg-white border border-[#D2DCE8] rounded-xl hover:border-[#0F6E56] hover:bg-[#E6F5F0]/30 transition-colors text-[#3A4A5C]"
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
              placeholder="Ask Rex to score a prospect, draft outreach, build a proposal…"
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
