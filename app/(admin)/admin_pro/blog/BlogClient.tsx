"use client";

import ArticleTranslations from "./ArticleTranslations";
import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Plus, Trash2, Eye, EyeOff, Star, Loader2,
  Zap, Bot, BarChart2, FileText, ImageIcon,
} from "lucide-react";
import { Button, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";

export interface Post {
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

export interface BreakingNews {
  headline: string;
  source?: string;
  createdAt: string;
}

export interface RefreshStatus {
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

export default function BlogClient(initial: {
  posts: Post[];
  breaking: BreakingNews | null;
  refreshStatus: RefreshStatus | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Seeded from the server render; re-seeded whenever router.refresh()
  // delivers new props, so the page never shows a stale copy after a change.
  const [posts, setPosts] = useState<Post[]>(initial.posts);
  const [breaking, setBreaking] = useState<BreakingNews | null>(initial.breaking);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(initial.refreshStatus);
  useEffect(() => {
    setPosts(initial.posts);
    setBreaking(initial.breaking);
    setRefreshStatus(initial.refreshStatus);
  }, [initial.posts, initial.breaking, initial.refreshStatus]);
  const loading = false;
  const [refreshing, setRefreshing] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [fixingImages, setFixingImages] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [repairResult, setRepairResult] = useState<string | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const stats = useMemo(
    () => ({
      total: posts.length,
      published: posts.filter((p) => p.published).length,
      aiGenerated: posts.filter((p) => p.aiGenerated).length,
      totalViews: posts.reduce((s, p) => s + (p.viewCount ?? 0), 0),
    }),
    [posts],
  );

  /** Re-render from the server. */
  async function loadData() {
    startTransition(() => router.refresh());
  }

  async function triggerRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/blog/auto-refresh?force=true");
    } catch { /* ignore network errors */ }
    await loadData();
    setRefreshing(false);
  }

  async function fixCoverImages() {
    setFixingImages(true);
    setImageResult(null);
    try {
      const res = await fetch("/api/admin/blog/backfill-images", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      const parts: string[] = [];
      if (d.missingFixed) parts.push(`${d.missingFixed} missing cover${d.missingFixed === 1 ? "" : "s"} added`);
      if (d.duplicatesFixed) parts.push(`${d.duplicatesFixed} duplicate${d.duplicatesFixed === 1 ? "" : "s"} replaced`);
      let msg = parts.length ? parts.join(" · ") : "All articles already have a unique cover";
      if (d.poolExhausted) {
        msg += ` — WARNING: more articles (${d.totalPosts}) than images (${d.poolSize}), some had to repeat. Add more IDs to lib/blog-images.ts.`;
      }
      setImageResult(msg);
      await loadData();
    } catch (e) {
      setImageResult(e instanceof Error ? e.message : "Failed — check logs");
    } finally {
      setFixingImages(false);
    }
  }

  async function repairThinPosts() {
    setRepairing(true);
    setRepairResult(null);
    try {
      const res = await fetch("/api/blog/repair-posts", { method: "POST" });
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

  async function updateCoverImage(id: string, currentCover: string | null) {
    const isBroken = !currentCover || currentCover.startsWith("/");
    const msg = isBroken
      ? "Enter a new cover image URL (Unsplash recommended):\n⚠️ Current cover is a local file that won't load in production."
      : "Enter a new cover image URL:";
    const newUrl = window.prompt(msg, currentCover ?? "");
    if (!newUrl || newUrl === currentCover) return;
    await fetch(`/api/blog/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverImage: newUrl }),
    });
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, coverImage: newUrl } : p)));
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
      <ArticleTranslations />
      <PageHeader
        title="AI Times blog"
        subtitle="Content auto-refreshes every 48 hours from Hacker News and DEV.to."
        className="mb-0"
        actions={
          <>
            <Button
              onClick={repairThinPosts}
              disabled={repairing || refreshing}
              loading={repairing}
              icon={FileText}
              variant="secondary"
              title="Find and regenerate incomplete articles"
            >
              {repairing ? "Repairing" : "Fix incomplete"}
            </Button>
            <Button
              onClick={fixCoverImages}
              disabled={fixingImages || repairing || refreshing}
              loading={fixingImages}
              icon={ImageIcon}
              variant="secondary"
              title="Give every article a cover image, and make sure no two articles share one"
            >
              {fixingImages ? "Fixing" : "Fix cover images"}
            </Button>
            <Button
              onClick={triggerRefresh}
              disabled={refreshing || repairing || fixingImages}
              icon={RefreshCw}
              variant="secondary"
              className={refreshing ? "[&>svg]:animate-spin" : ""}
            >
              {refreshing ? "Refreshing" : "Refresh now"}
            </Button>
            <Button href="/admin_pro/blog/news-agent" icon={Bot} variant="primary">
              News Agent
            </Button>
          </>
        }
      />

      {imageResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-[var(--a-radius-control)] px-4 py-3 text-sm font-dm flex items-center justify-between">
          <span>🖼 {imageResult}</span>
          <button onClick={() => setImageResult(null)} className="text-blue-600 hover:text-blue-800 ml-4">✕</button>
        </div>
      )}

      {repairResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-[var(--a-radius-control)] px-4 py-3 text-sm font-dm flex items-center justify-between">
          <span>{repairResult}</span>
          <button onClick={() => setRepairResult(null)} className="text-green-600 hover:text-green-800 ml-4">✕</button>
        </div>
      )}

      {featuredError && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-[var(--a-radius-control)] px-4 py-3 text-sm font-dm flex items-center justify-between">
          <span>⭐ {featuredError}</span>
          <button onClick={() => setFeaturedError(null)} className="text-orange-600 hover:text-orange-800 ml-4">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total posts" value={stats.total} icon={FileText} />
        <StatCard label="Published" value={stats.published} icon={Eye} tone="success" hint={stats.total - stats.published > 0 ? `${stats.total - stats.published} unpublished` : undefined} />
        <StatCard label="AI generated" value={stats.aiGenerated} icon={Bot} />
        <StatCard label="Total views" value={stats.totalViews.toLocaleString("en-US")} icon={BarChart2} tone="orange" />
      </div>

      {/* Refresh status + Breaking news */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)] p-5">
          <h3 className="mb-3 flex items-center gap-2 font-dm text-[14px] font-semibold text-[var(--a-ink)]">
            <RefreshCw size={14} className="text-[var(--a-blue)]" /> Auto-Refresh Status
          </h3>
          {refreshStatus ? (
            <div className="space-y-2 font-dm text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--a-ink-3)]">Status</span>
                <span className={`font-medium ${refreshStatus.needsRefresh ? "text-[#F47C20]" : "text-green-600"}`}>
                  {refreshStatus.needsRefresh ? "Needs refresh" : "Up to date"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--a-ink-3)]">Last refresh</span>
                <span className="text-[var(--a-ink-2)]">
                  {refreshStatus.lastRefresh
                    ? new Date(refreshStatus.lastRefresh).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--a-ink-3)]">Next auto-refresh</span>
                <span className="text-[var(--a-ink-2)]">
                  {refreshStatus.nextRefresh
                    ? new Date(refreshStatus.nextRefresh).toLocaleString()
                    : "On next page load"}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-[var(--a-ink-3)]" />
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)] p-5">
          <h3 className="mb-3 flex items-center gap-2 font-dm text-[14px] font-semibold text-[var(--a-ink)]">
            <Zap size={14} className="text-red-500" /> Breaking News Banner
          </h3>
          {breaking ? (
            <div>
              <p className="font-dm text-sm text-[var(--a-ink)] font-medium line-clamp-2 mb-1">
                {breaking.headline}
              </p>
              <p className="font-dm text-xs text-[var(--a-ink-3)] mb-3">
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
              <p className="font-dm text-sm text-[var(--a-ink-3)] mb-3">No active breaking news</p>
              <Link
                href="/admin_pro/blog/news-agent"
                className="text-xs text-[var(--a-blue)] font-dm hover:underline"
              >
                Use News Agent to set one →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Posts table */}
      <div className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--a-border)] flex items-center justify-between">
          <h3 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">All posts</h3>
          <span className="text-xs font-dm text-[var(--a-ink-3)]">{posts.length} posts</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[var(--a-ink-3)]" />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No posts yet"
              body="Fetch the latest stories from AI news sources, or draft one with the News Agent."
              action={
                <Button onClick={triggerRefresh} variant="primary" icon={RefreshCw}>
                  Refresh now
                </Button>
              }
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--a-border)] bg-[var(--a-surface-2)]">
                  <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Post</th>
                  <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Category</th>
                  <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Views</th>
                  <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Status</th>
                  <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border)]">
                {posts.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-[#f8fafd]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.coverEmoji}</span>
                        <div>
                          <p className="font-dm text-sm font-medium text-[var(--a-ink)] line-clamp-1">
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
                      <span className="text-xs font-dm text-[var(--a-ink-2)]">
                        {CATEGORY_LABELS[p.category] ?? p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-dm text-sm text-[var(--a-ink-3)]">{p.viewCount}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium font-dm px-2 py-0.5 rounded-full ${p.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-dm text-xs text-[var(--a-ink-3)]">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/ai-times/${p.slug}`}
                          target="_blank"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--a-info-bg)] text-[var(--a-ink-3)] hover:text-[var(--a-blue)] transition-colors"
                          title="View post"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => updateCoverImage(p.id, p.coverImage)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            !p.coverImage || p.coverImage.startsWith("/")
                              ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                              : "text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-blue)]"
                          }`}
                          title={
                            !p.coverImage || p.coverImage.startsWith("/")
                              ? "⚠️ Local cover — won't load in production. Click to fix."
                              : "Edit cover image URL"
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
                                  : "hover:bg-[#FEF0E3] text-[var(--a-ink-3)] hover:text-[#F47C20]"
                              }`}
                              title={p.featured ? "Unfeature" : featuredCount >= 2 ? "Feature this post (replaces oldest featured)" : "Feature this post"}
                            >
                              <Star size={14} className={p.featured ? "fill-current" : ""} />
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => togglePublish(p.id, p.published)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--a-surface-2)] text-[var(--a-ink-3)] transition-colors"
                          title={p.published ? "Unpublish" : "Publish"}
                        >
                          {p.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => deletePost(p.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[var(--a-ink-3)] hover:text-red-500 transition-colors"
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
    </div>
  );
}
