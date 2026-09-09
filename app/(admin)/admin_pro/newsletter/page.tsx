"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Mail, Send, Loader2, X, Plus, Check, Search } from "lucide-react";
import Link from "next/link";

interface Subscriber {
  id: string;
  email: string;
  firstName?: string | null;
  source: string;
  subscribedAt: string;
  active: boolean;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  category: string;
  status: string;
  sentAt?: string | null;
  recipientCount: number;
  sentBy: string;
  createdAt: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-[#FEF0E3] text-[#F47C20]",
  SENT: "bg-green-100 text-green-700",
};

const SOURCE_LABELS: Record<string, string> = {
  "blog": "AI Times",
  "blog_page": "AI Times",
  "homepage": "Homepage",
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"campaigns" | "subscribers" | "compose">("campaigns");
  const [subSearch, setSubSearch] = useState("");

  // Compose state
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeIntro, setComposeIntro] = useState("");
  const [composing, setComposing] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [campRes, subRes] = await Promise.all([
        fetch("/api/newsletter/campaigns"),
        fetch("/api/newsletter/subscribers?limit=100"),
      ]);
      const campData = await campRes.json();
      const subData = await subRes.json();
      setCampaigns(campData.campaigns ?? []);
      setSubscriberCount(campData.subscriberCount ?? 0);
      setSubscribers(subData.subscribers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Load articles when compose tab opened
  useEffect(() => {
    if (activeTab !== "compose" || articles.length > 0) return;
    fetch("/api/blog/posts?limit=50&published=true")
      .then(r => r.json())
      .then(d => setArticles(d.posts ?? []));
  }, [activeTab, articles.length]);

  async function sendCampaign(campaignId: string) {
    if (!confirm("Send this campaign to all active subscribers?")) return;
    setSending(campaignId);
    await fetch("/api/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    await loadData();
    setSending(null);
  }

  async function handleCompose(doSend: boolean) {
    if (!composeSubject.trim() || !composeIntro.trim() || selectedArticleIds.length === 0) {
      alert("Please fill in a subject, intro text, and select at least one article.");
      return;
    }
    if (doSend && !confirm(`Send to ${subscriberCount} active subscriber${subscriberCount !== 1 ? "s" : ""}?`)) return;
    setComposing(true);
    try {
      const res = await fetch("/api/newsletter/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleIds: selectedArticleIds,
          subject: composeSubject,
          introText: composeIntro,
          send: doSend,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed"); return; }
      // Reset and go to campaigns tab
      setComposeSubject("");
      setComposeIntro("");
      setSelectedArticleIds([]);
      setActiveTab("campaigns");
      await loadData();
    } finally {
      setComposing(false);
    }
  }

  function toggleArticle(id: string) {
    setSelectedArticleIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  const filteredSubs = subscribers.filter(s =>
    !subSearch || s.email.includes(subSearch) || (s.firstName ?? "").toLowerCase().includes(subSearch.toLowerCase())
  );
  const filteredArticles = articles.filter(a =>
    !articleSearch || a.title.toLowerCase().includes(articleSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Newsletter</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Manage subscribers and campaigns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("compose")}
            className="flex items-center gap-2 bg-[#F47C20] hover:bg-[#d96b18] text-white rounded-xl px-4 py-2 text-sm font-dm font-semibold transition-colors"
          >
            <Plus size={14} /> Compose
          </button>
          <Link
            href="/admin_pro/blog/news-agent"
            className="flex items-center gap-2 bg-[#1B3A6B] hover:bg-[#2251A3] text-white rounded-xl px-4 py-2 text-sm font-dm font-semibold transition-colors"
          >
            <Mail size={15} /> Draft with Echelon
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Subscribers", value: subscriberCount, icon: <Users size={16} className="text-[#2251A3]" /> },
          { label: "Campaigns Sent", value: campaigns.filter(c => c.status === "SENT").length, icon: <Send size={16} className="text-green-600" /> },
          { label: "Drafts", value: campaigns.filter(c => c.status === "DRAFT").length, icon: <Mail size={16} className="text-[#F47C20]" /> },
          { label: "Total Emails Sent", value: campaigns.reduce((s, c) => s + c.recipientCount, 0), icon: <Mail size={16} className="text-purple-500" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-dm text-sm text-[#7A8FA6]">{stat.label}</p>
              {stat.icon}
            </div>
            <p className="font-syne font-extrabold text-2xl text-[#0D1B2A]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["campaigns", "subscribers", "compose"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-dm font-medium transition-colors capitalize ${
              activeTab === tab ? "bg-[#1B3A6B] text-white" : "bg-white border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#1B3A6B]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Campaigns tab */}
      {activeTab === "campaigns" && (
        <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-[#7A8FA6]" /></div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="font-dm text-sm text-[#7A8FA6] mb-3">No campaigns yet.</p>
              <button onClick={() => setActiveTab("compose")} className="text-xs text-[#2251A3] hover:underline font-dm">
                Compose your first newsletter →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F4F7FB] border-b border-[#D2DCE8]">
                    {["Campaign", "Status", "Recipients", "Date", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F7FB]">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-[#F4F7FB]/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-dm text-sm font-medium text-[#0D1B2A] line-clamp-1">{c.title}</p>
                        <p className="font-dm text-xs text-[#7A8FA6]">{c.subject}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium font-dm px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{c.recipientCount}</td>
                      <td className="px-5 py-4 font-dm text-xs text-[#7A8FA6]">{fmt(c.createdAt)}</td>
                      <td className="px-5 py-4">
                        {c.status === "DRAFT" && (
                          <button
                            onClick={() => sendCampaign(c.id)}
                            disabled={sending === c.id}
                            className="flex items-center gap-1.5 text-xs font-dm font-medium text-[#2251A3] hover:text-[#1B3A6B] disabled:opacity-50"
                          >
                            {sending === c.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subscribers tab */}
      {activeTab === "subscribers" && (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
            <input
              value={subSearch}
              onChange={e => setSubSearch(e.target.value)}
              placeholder="Search subscribers…"
              className="w-full pl-9 pr-4 py-2 border border-[#D2DCE8] rounded-xl text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
            />
          </div>
          <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-[#7A8FA6]" /></div>
            ) : filteredSubs.length === 0 ? (
              <div className="text-center py-12">
                <Users size={28} className="text-[#D2DCE8] mx-auto mb-3" />
                <p className="font-dm text-sm text-[#7A8FA6]">{subSearch ? "No subscribers match your search." : "No subscribers yet."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F4F7FB] border-b border-[#D2DCE8]">
                      {["Name", "Email", "Source", "Subscribed", "Status"].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F7FB]">
                    {filteredSubs.map(s => (
                      <tr key={s.id} className="hover:bg-[#F4F7FB]/50 transition-colors">
                        <td className="px-5 py-3 font-dm text-sm text-[#0D1B2A]">{s.firstName ?? "—"}</td>
                        <td className="px-5 py-3 font-dm text-sm text-[#3A4A5C]">{s.email}</td>
                        <td className="px-5 py-3 font-dm text-xs text-[#7A8FA6]">
                          {SOURCE_LABELS[s.source] ?? s.source}
                        </td>
                        <td className="px-5 py-3 font-dm text-xs text-[#7A8FA6]">{fmt(s.subscribedAt)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium font-dm px-2 py-0.5 rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-[#F4F7FB] text-[#7A8FA6]"}`}>
                            {s.active ? "Active" : "Unsubscribed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose tab */}
      {activeTab === "compose" && (
        <div className="space-y-5">
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-4">
            <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Compose Newsletter</h2>

            <div className="space-y-1.5">
              <label className="block text-sm font-dm font-medium text-[#3A4A5C]">Subject line</label>
              <input
                type="text"
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                placeholder="e.g. This Week in AI — 5 Things You Need to Know"
                className="w-full px-4 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-dm font-medium text-[#3A4A5C]">Intro message</label>
              <textarea
                value={composeIntro}
                onChange={e => setComposeIntro(e.target.value)}
                rows={3}
                placeholder="A short personal message to your subscribers before the articles…"
                className="w-full px-4 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm resize-none focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
              />
            </div>
          </div>

          {/* Article picker */}
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-syne font-bold text-base text-[#0D1B2A]">
                Pick Articles
                {selectedArticleIds.length > 0 && (
                  <span className="ml-2 bg-[#2251A3] text-white text-xs font-dm px-2 py-0.5 rounded-full">
                    {selectedArticleIds.length} selected
                  </span>
                )}
              </h2>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
                <input
                  value={articleSearch}
                  onChange={e => setArticleSearch(e.target.value)}
                  placeholder="Search articles…"
                  className="pl-8 pr-4 py-1.5 border border-[#D2DCE8] rounded-xl text-xs font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] w-44"
                />
              </div>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {filteredArticles.length === 0 ? (
                <p className="text-center py-6 text-sm font-dm text-[#7A8FA6]">No articles found.</p>
              ) : filteredArticles.map(a => {
                const selected = selectedArticleIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleArticle(a.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      selected ? "bg-[#EBF0FA] border border-[#2251A3]/30" : "bg-[#F4F7FB] hover:bg-[#EBF0FA] border border-transparent"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center transition-colors ${
                      selected ? "bg-[#2251A3] border-[#2251A3]" : "border-[#D2DCE8]"
                    }`}>
                      {selected && <Check size={11} className="text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-dm text-sm font-medium text-[#0D1B2A] line-clamp-1">{a.title}</p>
                      <p className="font-dm text-xs text-[#7A8FA6] line-clamp-1 mt-0.5">{a.excerpt}</p>
                      <p className="font-dm text-xs text-[#2251A3] mt-0.5">tiblogics.com/ai-times/{a.slug}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleCompose(false)}
              disabled={composing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm font-medium text-[#3A4A5C] hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-colors disabled:opacity-50"
            >
              {composing ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Save as Draft
            </button>
            <button
              onClick={() => handleCompose(true)}
              disabled={composing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2251A3] hover:bg-[#1B3A6B] text-white rounded-xl text-sm font-dm font-semibold transition-colors disabled:opacity-50"
            >
              {composing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send to {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
