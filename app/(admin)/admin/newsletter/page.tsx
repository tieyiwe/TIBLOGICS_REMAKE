"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Send, Loader2, Trash2, Download } from "lucide-react";
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

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-[#FEF0E3] text-[#F47C20]",
  SENT: "bg-green-100 text-green-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  "ai-practices": "AI Best Practices",
  "ai-readiness": "AI Readiness",
  "ai-mistakes": "AI Mistakes to Avoid",
  "general": "General",
};

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"campaigns" | "subscribers">("campaigns");

  async function load() {
    try {
      const [campRes, subRes] = await Promise.all([
        fetch("/api/newsletter/campaigns"),
        fetch("/api/newsletter/campaigns"), // returns subscriberCount too
      ]);
      const campData = await campRes.json();
      setCampaigns(campData.campaigns ?? []);
      setSubscriberCount(campData.subscriberCount ?? 0);

      // Fetch subscribers separately if we add that endpoint
      // For now reuse the same data
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function sendCampaign(campaignId: string) {
    if (!confirm("Send this campaign to all active subscribers?")) return;
    setSending(campaignId);
    await fetch("/api/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    await load();
    setSending(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Newsletter</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Campaigns drafted and sent by Echelon</p>
        </div>
        <Link
          href="/admin/blog/news-agent"
          className="flex items-center gap-2 bg-[#1B3A6B] hover:bg-[#2251A3] text-white rounded-xl px-4 py-2 text-sm font-dm font-semibold transition-colors"
        >
          <Mail size={15} /> Draft with Echelon
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-dm text-sm text-[#7A8FA6]">Subscribers</p>
            <Users size={16} className="text-[#2251A3]" />
          </div>
          <p className="font-syne font-extrabold text-2xl text-[#0D1B2A]">{subscriberCount}</p>
        </div>
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-dm text-sm text-[#7A8FA6]">Campaigns Sent</p>
            <Send size={16} className="text-green-600" />
          </div>
          <p className="font-syne font-extrabold text-2xl text-[#0D1B2A]">
            {campaigns.filter(c => c.status === "SENT").length}
          </p>
        </div>
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-dm text-sm text-[#7A8FA6]">Drafts</p>
            <Mail size={16} className="text-[#F47C20]" />
          </div>
          <p className="font-syne font-extrabold text-2xl text-[#0D1B2A]">
            {campaigns.filter(c => c.status === "DRAFT").length}
          </p>
        </div>
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-dm text-sm text-[#7A8FA6]">Total Emails Sent</p>
            <Mail size={16} className="text-purple-500" />
          </div>
          <p className="font-syne font-extrabold text-2xl text-[#0D1B2A]">
            {campaigns.reduce((s, c) => s + c.recipientCount, 0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["campaigns", "subscribers"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-dm font-medium transition-colors ${activeTab === tab ? "bg-[#1B3A6B] text-white" : "bg-white border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#1B3A6B]"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "campaigns" && (
        <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-[#7A8FA6]" /></div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 px-6">
                <p className="font-dm text-sm text-[#7A8FA6] mb-3">No campaigns yet.</p>
                <Link href="/admin/blog/news-agent" className="text-xs text-[#2251A3] hover:underline font-dm">
                  Ask Echelon to draft your first newsletter →
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F4F7FB] border-b border-[#D2DCE8]">
                    {["Campaign", "Category", "Status", "Recipients", "Date", ""].map(h => (
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
                      <td className="px-5 py-4 font-dm text-xs text-[#3A4A5C]">{CATEGORY_LABELS[c.category] ?? c.category}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium font-dm px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{c.recipientCount}</td>
                      <td className="px-5 py-4 font-dm text-xs text-[#7A8FA6]">
                        {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        {c.status === "DRAFT" && (
                          <button
                            onClick={() => sendCampaign(c.id)}
                            disabled={sending === c.id}
                            className="flex items-center gap-1.5 text-xs font-dm font-medium text-[#2251A3] hover:text-[#1B3A6B] disabled:opacity-50"
                          >
                            {sending === c.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Send
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "subscribers" && (
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-8 text-center">
          <Users size={32} className="text-[#D2DCE8] mx-auto mb-3" />
          <p className="font-syne font-bold text-lg text-[#0D1B2A] mb-1">{subscriberCount} Active Subscribers</p>
          <p className="font-dm text-sm text-[#7A8FA6]">Subscriber list management coming soon. Use Echelon to export.</p>
        </div>
      )}
    </div>
  );
}
