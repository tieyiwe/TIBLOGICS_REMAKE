"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw, Plus, Trash2, Eye, EyeOff, Star, Loader2,
  Zap, Bot, BarChart2, FileText,
} from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title: string;
  category: string;
  coverEmoji: string;
  featured: boolean;
  published: boolean;
  aiGenerated: boolean;
  viewCount: number;
  createdAt: string;
}

interface BreakingNews {
  headline: string;
  source?: string;
  createdAt: string;
}

interface RefreshStatus {
  needsRefresh: boolean;
  lastRefresh: string | null;
  nextRefresh: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  "breaking": "⚡ Breaking",
  "ai-business": "💼 Business",
  "tips": "💡 Tips",
  "tools": "🔧 Tools",
  "case-studies": "📊 Case Study",
  "industry": "🌐 Industry",
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [breaking, setBreaking] = useState<BreakingNews | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, published: 0, aiGenerated: 0, totalViews: 0 });

  async function loadData() {
    try {
      const [postsRes, breakingRes, statusRes] = await Promise.all([
        fetch("/api/blog/posts?limit=50"),
        fetch("/api/blog/breaking-news"),
        fetch("/api/blog/auto-refresh?check=true"),
      ]);
      const [pd, bd, sd] = await Promise.all([
        postsRes.json(),
        breakingRes.json(),
        statusRes.json(),
      ]);
      const allPosts: Post[] = pd.posts ?? [];
      setPosts(allPosts);
      setBreaking(bd.news);
      setRefreshStatus(sd);
      setStats({
        total: allPosts.length,
        published: allPosts.filter((p) => p.published).length,
        aiGenerated: allPosts.filter((p) => p.aiGenerated).length,
        totalViews: allPosts.reduce((s, p) => s + (p.viewCount ?? 0), 0),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function triggerRefresh() {
    setRefreshing(true);
    await fetch("/api/blog/auto-refresh?force=true");
    await loadData();
    setRefreshing(false);
  }

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/blog/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    setPosts((ps) =>
      ps.map((p) => (p.id === id ? { ...p, published: !current } : p))
    );
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/blog/posts/${id}`, { method: "DELETE" });
    setPosts((ps) => ps.filter((p) => p.id !== id));
  }

  async function clearBreaking() {
    await fetch("/api/blog/breaking-news", { method: "DELETE" });
    setBreaking(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Blog Manager</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
            Content auto-refreshes every 48 hours from Hacker News & DEV.to
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/blog/news-agent"
            className="flex items-center gap-2 bg-[#F47C20] hover:bg-[#d96b18] text-white rounded-xl px-4 py-2 text-sm font-dm font-semibold transition-colors"
          >
            <Bot size={15} /> News Agent
          </Link>
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 border border-[#D2DCE8] bg-white rounded-xl px-4 py-2 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB] disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh Now"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Posts", value: stats.total, icon: FileText, color: "#2251A3" },
          { label: "Published", value: stats.published, icon: Eye, color: "#0F6E56" },
          { label: "AI Generated", value: stats.aiGenerated, icon: Bot, color: "#7c3aed" },
          { label: "Total Views", value: stats.totalViews, icon: BarChart2, color: "#F47C20" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-dm text-sm text-[#7A8FA6]">{s.label}</p>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p className="font-syne font-extrabold text-2xl text-[#0D1B2A]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Refresh status + Breaking news */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <h3 className="font-syne font-bold text-sm text-[#0D1B2A] mb-3 flex items-center gap-2">
            <RefreshCw size={14} className="text-[#2251A3]" /> Auto-Refresh Status
          </h3>
          {refreshStatus ? (
            <div className="space-y-2 font-dm text-sm">
              <div className="flex justify-between">
                <span className="text-[#7A8FA6]">Status</span>
                <span className={`font-medium ${refreshStatus.needsRefresh ? "text-[#F47C20]" : "text-green-600"}`}>
                  {refreshStatus.needsRefresh ? "Needs refresh" : "Up to date"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8FA6]">Last refresh</span>
                <span className="text-[#3A4A5C]">
                  {refreshStatus.lastRefresh
                    ? new Date(refreshStatus.lastRefresh).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8FA6]">Next auto-refresh</span>
                <span className="text-[#3A4A5C]">
                  {refreshStatus.nextRefresh
                    ? new Date(refreshStatus.nextRefresh).toLocaleString()
                    : "On next page load"}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-[#7A8FA6]" />
            </div>
          )}
        </div>

        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
          <h3 className="font-syne font-bold text-sm text-[#0D1B2A] mb-3 flex items-center gap-2">
            <Zap size={14} className="text-red-500" /> Breaking News Banner
          </h3>
          {breaking ? (
            <div>
              <p className="font-dm text-sm text-[#0D1B2A] font-medium line-clamp-2 mb-1">
                {breaking.headline}
              </p>
              <p className="font-dm text-xs text-[#7A8FA6] mb-3">
                {breaking.source} · {new Date(breaking.createdAt).toLocaleString()}
              </p>
              <button
                onClick={clearBreaking}
                className="text-xs text-red-500 font-dm hover:underline"
              >
                Clear breaking news
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="font-dm text-sm text-[#7A8FA6] mb-3">No active breaking news</p>
              <Link
                href="/admin/blog/news-agent"
                className="text-xs text-[#2251A3] font-dm hover:underline"
              >
                Use News Agent to set one →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Posts table */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2DCE8] flex items-center justify-between">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A]">All Posts</h3>
          <span className="text-xs font-dm text-[#7A8FA6]">{posts.length} posts</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[#7A8FA6]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-dm text-sm text-[#7A8FA6]">
                No posts yet. Click &quot;Refresh Now&quot; to fetch from AI news sources.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#F4F7FB] border-b border-[#D2DCE8]">
                  <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Post</th>
                  <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Views</th>
                  <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FB]">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F4F7FB]/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.coverEmoji}</span>
                        <div>
                          <p className="font-dm text-sm font-medium text-[#0D1B2A] line-clamp-1">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.aiGenerated && (
                              <span className="text-xs text-purple-500 font-dm">AI</span>
                            )}
                            {p.featured && (
                              <span className="flex items-center gap-0.5 text-xs text-[#F47C20] font-dm">
                                <Star size={10} /> Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-dm text-[#3A4A5C]">
                        {CATEGORY_LABELS[p.category] ?? p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-dm text-sm text-[#7A8FA6]">{p.viewCount}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium font-dm px-2 py-0.5 rounded-full ${p.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-dm text-xs text-[#7A8FA6]">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#EBF0FA] text-[#7A8FA6] hover:text-[#2251A3] transition-colors"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => togglePublish(p.id, p.published)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F4F7FB] text-[#7A8FA6] transition-colors"
                          title={p.published ? "Unpublish" : "Publish"}
                        >
                          {p.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => deletePost(p.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#7A8FA6] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
