"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  RefreshCw, Plus, Trash2, Eye, EyeOff, Star, Loader2,
  Zap, Bot, BarChart2, FileText, ImageIcon, Upload, X, ExternalLink,
} from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title: string;
  category: string;
  coverEmoji: string;
  coverImage: string | null;
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
  const [repairing, setRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<string | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, published: 0, aiGenerated: 0, totalViews: 0 });

  async function loadData() {
    try {
      const [postsRes, breakingRes, statusRes] = await Promise.all([
        fetch("/api/blog/posts?limit=1000"),
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
    try {
      await fetch("/api/blog/auto-refresh?force=true");
    } catch { /* ignore network errors */ }
    await loadData();
    setRefreshing(false);
  }

  async function repairThinPosts() {
    setRepairing(true);
    setRepairResult(null);
    try {
      const res = await fetch("/api/blog/repair-posts");
      const data = await res.json();
      setRepairResult(data.message ?? "Done");
      await loadData();
    } catch {
      setRepairResult("Repair failed — check logs");
    } finally {
      setRepairing(false);
    }
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

  async function toggleFeatured(id: string, current: boolean) {
    if (current) {
      // Unfeature this article
      await fetch(`/api/blog/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: false }),
      });
      setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, featured: false } : p)));
      return;
    }

    // Featuring: if already at limit, auto-bump the oldest featured out first
    const currentlyFeatured = posts.filter((p) => p.featured);
    if (currentlyFeatured.length >= 2) {
      const toBump = currentlyFeatured[0];
      await fetch(`/api/blog/posts/${toBump.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: false }),
      });
      setPosts((ps) => ps.map((p) => (p.id === toBump.id ? { ...p, featured: false } : p)));
    }

    await fetch(`/api/blog/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: true }),
    });
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, featured: true } : p)));
  }

  const [coverModalPost, setCoverModalPost] = useState<Post | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  function openCoverModal(post: Post) {
    setCoverModalPost(post);
    setCoverUrlInput(post.coverImage ?? "");
    setCoverError(null);
  }

  async function saveCoverImage(url: string) {
    if (!coverModalPost || !url.trim()) return;
    const id = coverModalPost.id;
    await fetch(`/api/blog/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverImage: url.trim() }),
    });
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, coverImage: url.trim() } : p)));
    setCoverModalPost(null);
  }

  async function uploadCoverFile(file: File) {
    setCoverUploading(true);
    setCoverError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/blog/upload-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setCoverError(data.error ?? "Upload failed");
        return;
      }
      setCoverUrlInput(data.url);
      await saveCoverImage(data.url);
    } catch {
      setCoverError("Upload failed — check your connection and try again.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function deletePost(id: string) {
    const post = posts.find((p) => p.id === id);
    const isManual = post && !post.aiGenerated;
    const warning = isManual
      ? `⚠️ "${post.title}" is a manually-written article. Deleting it is permanent and cannot be undone. Are you sure?`
      : "Delete this post?";
    if (!confirm(warning)) return;
    const headers: Record<string, string> = {};
    if (isManual) headers["x-confirm-delete"] = "manual-article";
    await fetch(`/api/blog/posts/${id}`, { method: "DELETE", headers });
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
            href="/admin_pro/blog/news-agent"
            className="flex items-center gap-2 bg-[#F47C20] hover:bg-[#d96b18] text-white rounded-xl px-4 py-2 text-sm font-dm font-semibold transition-colors"
          >
            <Bot size={15} /> News Agent
          </Link>
          <button
            onClick={repairThinPosts}
            disabled={repairing || refreshing}
            className="flex items-center gap-2 border border-[#F47C20] bg-white rounded-xl px-4 py-2 text-sm font-dm text-[#F47C20] hover:bg-orange-50 disabled:opacity-50 transition-colors"
            title="Find and regenerate incomplete articles"
          >
            <Loader2 size={14} className={repairing ? "animate-spin" : "hidden"} />
            <FileText size={14} className={repairing ? "hidden" : ""} />
            {repairing ? "Repairing…" : "Fix Incomplete"}
          </button>
          <button
            onClick={triggerRefresh}
            disabled={refreshing || repairing}
            className="flex items-center gap-2 border border-[#D2DCE8] bg-white rounded-xl px-4 py-2 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB] disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh Now"}
          </button>
        </div>
      </div>

      {repairResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-dm flex items-center justify-between">
          <span>{repairResult}</span>
          <button onClick={() => setRepairResult(null)} className="text-green-600 hover:text-green-800 ml-4">✕</button>
        </div>
      )}

      {featuredError && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl px-4 py-3 text-sm font-dm flex items-center justify-between">
          <span>⭐ {featuredError}</span>
          <button onClick={() => setFeaturedError(null)} className="text-orange-600 hover:text-orange-800 ml-4">✕</button>
        </div>
      )}

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
                href="/admin_pro/blog/news-agent"
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
                          href={`/ai-times/${p.slug}`}
                          target="_blank"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#EBF0FA] text-[#7A8FA6] hover:text-[#2251A3] transition-colors"
                          title="View post"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => openCoverModal(p)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            !p.coverImage || p.coverImage.startsWith("/")
                              ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                              : "text-[#7A8FA6] hover:bg-[#F4F7FB] hover:text-[#2251A3]"
                          }`}
                          title={
                            !p.coverImage || p.coverImage.startsWith("/")
                              ? "⚠️ Local cover — won't load in production. Click to fix."
                              : "Upload or edit cover image"
                          }
                        >
                          <ImageIcon size={14} />
                        </button>
                        {(() => {
                          const featuredCount = posts.filter((x) => x.featured).length;
                          return (
                            <button
                              onClick={() => toggleFeatured(p.id, p.featured)}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                                p.featured
                                  ? "bg-[#FEF0E3] text-[#F47C20] hover:bg-orange-100"
                                  : "hover:bg-[#FEF0E3] text-[#7A8FA6] hover:text-[#F47C20]"
                              }`}
                              title={p.featured ? "Unfeature" : featuredCount >= 2 ? "Feature this post (replaces oldest featured)" : "Feature this post"}
                            >
                              <Star size={14} className={p.featured ? "fill-current" : ""} />
                            </button>
                          );
                        })()}
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
                          title="Delete post"
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

      {/* Cover image upload / edit / view modal */}
      {coverModalPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => !coverUploading && setCoverModalPost(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-base text-[#0D1B2A] line-clamp-1">
                Cover image — {coverModalPost.title}
              </h3>
              <button
                onClick={() => !coverUploading && setCoverModalPost(null)}
                className="text-[#7A8FA6] hover:text-[#0D1B2A]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-[#F4F7FB] h-40 mb-4 flex items-center justify-center">
              {coverUrlInput ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrlInput} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{coverModalPost.coverEmoji}</span>
              )}
            </div>

            {coverError && (
              <p className="text-xs text-red-600 font-dm mb-3">{coverError}</p>
            )}

            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCoverFile(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => coverFileInputRef.current?.click()}
              disabled={coverUploading}
              className="w-full flex items-center justify-center gap-2 bg-[#1B3A6B] hover:bg-[#2251A3] text-white rounded-xl px-4 py-2.5 text-sm font-dm font-semibold transition-colors disabled:opacity-50 mb-3"
            >
              {coverUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {coverUploading ? "Uploading…" : "Upload a photo from your device"}
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-[#E8EFF8]" />
              <span className="text-xs text-[#7A8FA6] font-dm">or paste a URL</span>
              <div className="h-px flex-1 bg-[#E8EFF8]" />
            </div>

            <div className="flex gap-2 mb-4">
              <input
                value={coverUrlInput}
                onChange={(e) => setCoverUrlInput(e.target.value)}
                placeholder="https://…"
                className="flex-1 bg-white border border-[#D2DCE8] rounded-xl px-3 py-2 text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
              />
              <button
                onClick={() => saveCoverImage(coverUrlInput)}
                disabled={coverUploading || !coverUrlInput.trim()}
                className="bg-white border border-[#D2DCE8] rounded-xl px-4 py-2 text-sm font-dm text-[#0D1B2A] hover:bg-[#F4F7FB] disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>

            <Link
              href={`/ai-times/${coverModalPost.slug}`}
              target="_blank"
              className="flex items-center justify-center gap-1.5 text-sm font-dm text-[#2251A3] hover:underline"
            >
              <ExternalLink size={13} /> View this article in the blog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
