"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, Send, Loader2, X, Plus, Check, Search } from "lucide-react";
import { Button, EmptyState, PageHeader, Segmented, StatCard, useConfirm, useToast } from "@/components/admin/ui";

export interface Subscriber {
  id: string;
  email: string;
  firstName?: string | null;
  source: string;
  subscribedAt: string;
  active: boolean;
}

export interface Campaign {
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

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)]",
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

export default function NewsletterClient(initial: {
  subscribers: Subscriber[];
  campaigns: Campaign[];
  subscriberCount: number;
  articles: Article[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Seeded from the server render and re-seeded after router.refresh().
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initial.subscribers);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initial.campaigns);
  const [subscriberCount, setSubscriberCount] = useState(initial.subscriberCount);
  useEffect(() => {
    setSubscribers(initial.subscribers);
    setCampaigns(initial.campaigns);
    setSubscriberCount(initial.subscriberCount);
  }, [initial.subscribers, initial.campaigns, initial.subscriberCount]);
  const loading = false;
  const [sending, setSending] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"campaigns" | "subscribers" | "compose">("campaigns");
  const [subSearch, setSubSearch] = useState("");
  const confirmFn = useConfirm();
  const toast = useToast();

  // Compose state
  const articles = initial.articles;
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeIntro, setComposeIntro] = useState("");
  const [composing, setComposing] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");

  /** Re-render from the server. */
  const loadData = useCallback(async () => {
    startTransition(() => router.refresh());
  }, [router]);

  async function sendCampaign(campaignId: string) {
    const ok = await confirmFn({
      title: "Send this campaign?",
      body: `It goes to all ${subscriberCount} active subscriber${subscriberCount !== 1 ? "s" : ""} right away. Emails cannot be recalled.`,
      confirmLabel: "Send campaign",
      danger: false,
    });
    if (!ok) return;
    setSending(campaignId);
    const res = await fetch("/api/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    }).catch(() => null);
    if (res?.ok) toast.success("Campaign sent");
    else toast.error("Send failed", "Check the campaign and try again.");
    await loadData();
    setSending(null);
  }

  async function handleCompose(doSend: boolean) {
    if (!composeSubject.trim() || !composeIntro.trim() || selectedArticleIds.length === 0) {
      toast.error("Missing details", "Fill in a subject and intro text, and pick at least one article.");
      return;
    }
    if (
      doSend &&
      !(await confirmFn({
        title: `Send to ${subscriberCount} active subscriber${subscriberCount !== 1 ? "s" : ""}?`,
        body: "The newsletter is emailed immediately. Emails cannot be recalled.",
        confirmLabel: "Send now",
        danger: false,
      }))
    )
      return;
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
      if (!res.ok) { toast.error("Could not save the newsletter", data.error ?? "Please try again."); return; }
      toast.success(doSend ? "Newsletter sent" : "Draft saved");
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
      <PageHeader
        title="Newsletter"
        subtitle="Subscribers, campaigns and the AI Times digest."
        className="mb-0"
        actions={
          <>
            <Button href="/admin_pro/blog/news-agent" variant="secondary" icon={Mail}>
              Draft with Echelon
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setActiveTab("compose")}>
              Compose
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Subscribers" value={subscriberCount.toLocaleString()} icon={Users} tone="navy" />
        <StatCard label="Campaigns sent" value={campaigns.filter(c => c.status === "SENT").length} icon={Send} tone="success" />
        <StatCard label="Drafts" value={campaigns.filter(c => c.status === "DRAFT").length} icon={Mail} tone="orange" />
        <StatCard label="Total emails sent" value={campaigns.reduce((s, c) => s + c.recipientCount, 0).toLocaleString()} icon={Mail} />
      </div>

      {/* Tabs */}
      <Segmented
        ariaLabel="Newsletter view"
        value={activeTab}
        onChange={(v) => setActiveTab(v as typeof activeTab)}
        options={[
          { value: "campaigns", label: "Campaigns", count: campaigns.length },
          { value: "subscribers", label: "Subscribers", count: subscriberCount },
          { value: "compose", label: "Compose" },
        ]}
      />

      {/* Campaigns tab */}
      {activeTab === "campaigns" && (
        <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-[var(--a-ink-3)]" /></div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No campaigns yet"
              body="Pick a few AI Times articles, add a short intro, and send your first digest."
              action={
                <Button variant="primary" icon={Plus} onClick={() => setActiveTab("compose")}>
                  Compose your first newsletter
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--a-surface-2)] border-b border-[var(--a-border)]">
                    {["Campaign", "Status", "Recipients", "Date", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--a-border)]">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-[#f8fafd] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-dm text-sm font-medium text-[var(--a-ink)] line-clamp-1">{c.title}</p>
                        <p className="font-dm text-xs text-[var(--a-ink-3)]">{c.subject}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium font-dm px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-dm text-sm text-[var(--a-ink-3)]">{c.recipientCount}</td>
                      <td className="px-5 py-4 font-dm text-xs text-[var(--a-ink-3)]">{fmt(c.createdAt)}</td>
                      <td className="px-5 py-4">
                        {c.status === "DRAFT" && (
                          <button
                            onClick={() => sendCampaign(c.id)}
                            disabled={sending === c.id}
                            className="flex items-center gap-1.5 text-xs font-dm font-medium text-[var(--a-blue)] hover:text-[#1B3A6B] disabled:opacity-50"
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--a-ink-3)]" />
            <input
              value={subSearch}
              onChange={e => setSubSearch(e.target.value)}
              placeholder="Search subscribers…"
              className="w-full pl-9 pr-4 py-2 border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
            />
          </div>
          <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-[var(--a-ink-3)]" /></div>
            ) : filteredSubs.length === 0 ? (
              <EmptyState
                icon={Users}
                title={subSearch ? "No subscribers match" : "No subscribers yet"}
                body={subSearch ? "Try a different email or name." : "People who sign up on the site or AI Times appear here."}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--a-surface-2)] border-b border-[var(--a-border)]">
                      {["Name", "Email", "Source", "Subscribed", "Status"].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--a-border)]">
                    {filteredSubs.map(s => (
                      <tr key={s.id} className="hover:bg-[#f8fafd] transition-colors">
                        <td className="px-5 py-3 font-dm text-sm text-[var(--a-ink)]">{s.firstName ?? "—"}</td>
                        <td className="px-5 py-3 font-dm text-sm text-[var(--a-ink-2)]">{s.email}</td>
                        <td className="px-5 py-3 font-dm text-xs text-[var(--a-ink-3)]">
                          {SOURCE_LABELS[s.source] ?? s.source}
                        </td>
                        <td className="px-5 py-3 font-dm text-xs text-[var(--a-ink-3)]">{fmt(s.subscribedAt)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium font-dm px-2 py-0.5 rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-[var(--a-surface-2)] text-[var(--a-ink-3)]"}`}>
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
          <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-4">
            <h2 className="font-syne font-bold text-base text-[var(--a-ink)]">Compose Newsletter</h2>

            <div className="space-y-1.5">
              <label className="block text-sm font-dm font-medium text-[var(--a-ink-2)]">Subject line</label>
              <input
                type="text"
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                placeholder="e.g. This Week in AI — 5 Things You Need to Know"
                className="w-full px-4 py-2.5 border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-dm font-medium text-[var(--a-ink-2)]">Intro message</label>
              <textarea
                value={composeIntro}
                onChange={e => setComposeIntro(e.target.value)}
                rows={3}
                placeholder="A short personal message to your subscribers before the articles…"
                className="w-full px-4 py-2.5 border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)]"
              />
            </div>
          </div>

          {/* Article picker */}
          <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-syne font-bold text-base text-[var(--a-ink)]">
                Pick Articles
                {selectedArticleIds.length > 0 && (
                  <span className="ml-2 bg-[#2251A3] text-white text-xs font-dm px-2 py-0.5 rounded-full">
                    {selectedArticleIds.length} selected
                  </span>
                )}
              </h2>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--a-ink-3)]" />
                <input
                  value={articleSearch}
                  onChange={e => setArticleSearch(e.target.value)}
                  placeholder="Search articles…"
                  className="pl-8 pr-4 py-1.5 border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-xs font-dm focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 focus:border-[var(--a-blue)] w-44"
                />
              </div>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {filteredArticles.length === 0 ? (
                <p className="text-center py-6 text-sm font-dm text-[var(--a-ink-3)]">No articles found.</p>
              ) : filteredArticles.map(a => {
                const selected = selectedArticleIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleArticle(a.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-[var(--a-radius-control)] text-left transition-colors ${
                      selected ? "bg-[var(--a-info-bg)] border border-[#2251A3]/30" : "bg-[var(--a-surface-2)] hover:bg-[var(--a-info-bg)] border border-transparent"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center transition-colors ${
                      selected ? "bg-[#2251A3] border-[#2251A3]" : "border-[var(--a-border)]"
                    }`}>
                      {selected && <Check size={11} className="text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-dm text-sm font-medium text-[var(--a-ink)] line-clamp-1">{a.title}</p>
                      <p className="font-dm text-xs text-[var(--a-ink-3)] line-clamp-1 mt-0.5">{a.excerpt}</p>
                      <p className="font-dm text-xs text-[var(--a-blue)] mt-0.5">tiblogics.com/ai-times/{a.slug}</p>
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
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[var(--a-border)] rounded-[var(--a-radius-control)] text-sm font-dm font-medium text-[var(--a-ink-2)] hover:border-[var(--a-border-strong)] hover:text-[#1B3A6B] transition-colors disabled:opacity-50"
            >
              {composing ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Save as Draft
            </button>
            <button
              onClick={() => handleCompose(true)}
              disabled={composing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2251A3] hover:bg-[var(--a-navy)] text-white rounded-[var(--a-radius-control)] text-sm font-dm font-semibold transition-colors disabled:opacity-50"
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
