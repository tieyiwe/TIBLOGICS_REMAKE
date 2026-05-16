"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Clock, Zap, RefreshCw, Send } from "lucide-react";
import { trackPageVisit } from "@/lib/recommendations";
import SmartRecommendations from "@/components/public/SmartRecommendations";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage?: string;
  coverEmoji: string;
  coverGradient: string;
  author: string;
  readingTime: number;
  featured: boolean;
  aiGenerated: boolean;
  createdAt: string;
}

interface BreakingNews {
  id: string;
  headline: string;
  summary: string;
  sourceUrl?: string;
  source?: string;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "breaking", label: "⚡ Breaking" },
  { id: "ai-business", label: "💼 AI for Business" },
  { id: "tips", label: "💡 Tips & Tricks" },
  { id: "tools", label: "🔧 Tools" },
  { id: "case-studies", label: "📊 Case Studies" },
  { id: "industry", label: "🌐 Industry" },
];

const GRADIENT_MAP: Record<string, string> = {
  "from-red-600 to-orange-500": "bg-gradient-to-br from-red-600 to-orange-500",
  "from-[#1B3A6B] to-[#2251A3]": "bg-gradient-to-br from-[#1B3A6B] to-[#2251A3]",
  "from-purple-600 to-violet-500": "bg-gradient-to-br from-purple-600 to-violet-500",
  "from-teal-600 to-emerald-500": "bg-gradient-to-br from-teal-600 to-emerald-500",
  "from-[#F47C20] to-yellow-500": "bg-gradient-to-br from-[#F47C20] to-yellow-500",
  "from-slate-600 to-gray-500": "bg-gradient-to-br from-slate-600 to-gray-500",
};

function gradientClass(g: string): string {
  return GRADIENT_MAP[g] ?? "bg-gradient-to-br from-[#1B3A6B] to-[#2251A3]";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [breaking, setBreaking] = useState<BreakingNews | null>(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredImgFailed, setFeaturedImgFailed] = useState(false);
  const [featured2ImgFailed, setFeatured2ImgFailed] = useState(false);
  const [showOlder, setShowOlder] = useState(false);

  useEffect(() => {
    trackPageVisit("/ai-times");
  }, []);

  const fetchPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`/api/blog/posts?${params}`, { signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      // timeout or network error — leave posts as-is
    } finally {
      clearTimeout(timer);
      if (!silent) setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetch("/api/blog/breaking-news")
      .then((r) => r.json())
      .then((d) => setBreaking(d.news));
  }, []);

  // Auto-refresh check on page load
  useEffect(() => {
    async function checkAndRefresh() {
      try {
        const checkRes = await fetch("/api/blog/auto-refresh?check=true");
        const checkData = await checkRes.json();
        const currentPosts = await fetch("/api/blog/posts?limit=1").then(r => r.json());
        const isEmpty = (currentPosts.total ?? 0) === 0;

        if (checkData.needsRefresh || isEmpty) {
          setRefreshing(true);
          try {
            const url = isEmpty
              ? "/api/blog/auto-refresh?force=true"
              : "/api/blog/auto-refresh";
            await fetch(url);
          } finally {
            await fetchPosts(true);
            setRefreshing(false);
          }
        }
      } catch {
        setRefreshing(false);
      }
    }
    checkAndRefresh();
  }, [fetchPosts]);

  const showFeatured = category === "all" && !search;
  const featuredPosts = showFeatured
    ? (() => {
        const marked = posts.filter((p) => p.featured);
        // Slot 1 = newest article always, slot 2 = the other marked one (rotating)
        const newest = posts[0];
        const rotating = marked.find((p) => p.id !== newest?.id) ?? posts[1];
        const result = newest ? [newest, rotating].filter(Boolean) : posts.slice(0, 2);
        return result.slice(0, 2);
      })()
    : [];
  const featuredIds = new Set(featuredPosts.map((p) => p.id));
  const grid = posts.filter((p) => !featuredIds.has(p.id));
  const INITIAL_COUNT = 9;
  const visibleGrid = showOlder ? grid : grid.slice(0, INITIAL_COUNT);
  const hiddenCount = Math.max(0, grid.length - INITIAL_COUNT);

  return (
    <div className="pt-32 sm:pt-44 pb-36 sm:pb-20 min-h-screen bg-[#F4F7FB]">
      {/* Breaking news ticker */}
      {breaking && (
        <div className="bg-red-600 text-white py-2.5 px-4 flex items-center gap-3">
          <span className="flex-shrink-0 bg-white text-red-600 text-xs font-extrabold font-syne px-2 py-0.5 rounded flex items-center gap-1">
            <Zap size={11} /> BREAKING
          </span>
          <p className="text-sm font-dm font-medium truncate flex-1">{breaking.headline}</p>
          {breaking.sourceUrl && (
            <a
              href={breaking.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-white/80 text-xs underline hover:text-white"
            >
              Source →
            </a>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center py-12">
          <span className="section-tag">TIBLOGICS</span>
          <h1
            className="text-5xl md:text-7xl text-[#0D1B2A] mt-3 tracking-widest font-bold"
            style={{ fontFamily: "var(--font-masthead)" }}
          >
            AI TIMES
          </h1>
          <p className="font-syne font-bold text-[#F47C20] text-xl md:text-2xl mt-2 tracking-wide">
            The #1 AI Digestable Knowledge
          </p>
          <p className="font-dm text-[#3A4A5C] text-base mt-2 max-w-xl mx-auto">
            Practical AI knowledge for businesses, builders, and curious minds.
          </p>
          {refreshing && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-[#7A8FA6] mt-2 font-dm">
              <RefreshCw size={12} className="animate-spin" /> Refreshing content with latest AI news…
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#D2DCE8] rounded-2xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] shadow-sm"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-dm font-medium transition-all duration-200 ${
                category === cat.id
                  ? "bg-[#1B3A6B] text-white shadow-sm"
                  : "bg-[#EBF0FA] border border-[#D2DCE8] text-[#3A4A5C] hover:bg-[#1B3A6B] hover:border-[#1B3A6B] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#D2DCE8] animate-pulse">
                <div className="h-44 bg-[#E8EFF8]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-[#E8EFF8] rounded w-1/3" />
                  <div className="h-5 bg-[#E8EFF8] rounded w-4/5" />
                  <div className="h-3 bg-[#E8EFF8] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📰</p>
            <h3 className="font-syne font-bold text-xl text-[#0D1B2A] mb-2">No posts yet</h3>
            <p className="font-dm text-[#7A8FA6] text-sm max-w-xs mx-auto">
              Content will auto-populate when the blog refreshes. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Featured posts — 2 rotating articles */}
            {featuredPosts.length > 0 && showFeatured && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                {featuredPosts.map((fp, idx) => {
                  const imgFailed = idx === 0 ? featuredImgFailed : featured2ImgFailed;
                  const setImgFailed = idx === 0 ? setFeaturedImgFailed : setFeatured2ImgFailed;
                  return (
                    <Link key={fp.id} href={`/ai-times/${fp.slug}`} className="group block">
                      <div className="bg-white border border-[#D2DCE8] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
                        <div className="h-52 flex-shrink-0 overflow-hidden relative">
                          {fp.coverImage && !imgFailed ? (
                            <img src={fp.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="eager" fetchPriority="high" decoding="sync" onError={() => setImgFailed(true)} />
                          ) : (
                            <div className={`${gradientClass(fp.coverGradient)} w-full h-full flex items-center justify-center`}>
                              <span className="text-7xl">{fp.coverEmoji}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-6 flex flex-col flex-1 justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="bg-[#F47C20] text-white text-xs font-extrabold font-syne px-2.5 py-1 rounded-full uppercase tracking-wide">
                                Featured
                              </span>
                              <CategoryBadge category={fp.category} />
                            </div>
                            <h2 className="font-syne font-extrabold text-xl text-[#0D1B2A] mb-2 group-hover:text-[#2251A3] transition-colors leading-tight line-clamp-2">
                              {fp.title}
                            </h2>
                            <p className="font-dm text-[#3A4A5C] text-sm leading-relaxed line-clamp-2">
                              {fp.excerpt}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-dm text-[#7A8FA6] mt-4">
                            <span className="flex items-center gap-1"><Clock size={12} /> {fp.readingTime} min read</span>
                            <span>·</span>
                            <span>{timeAgo(fp.createdAt)}</span>
                            {fp.aiGenerated && <><span>·</span><span className="text-[#2251A3]">AI Curated</span></>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Tips spotlight */}
            {showFeatured && (
              <TipsSpotlight posts={posts.filter((p) => p.category === "tips").slice(0, 3)} />
            )}

            {/* Post grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleGrid.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Load more older articles */}
            {!showOlder && hiddenCount > 0 && (
              <div className="mt-10 text-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-[#D2DCE8]" />
                  <span className="font-dm text-sm text-[#7A8FA6]">{hiddenCount} more article{hiddenCount !== 1 ? "s" : ""}</span>
                  <div className="flex-1 h-px bg-[#D2DCE8]" />
                </div>
                <button
                  onClick={() => setShowOlder(true)}
                  className="inline-flex items-center gap-2 bg-white border border-[#D2DCE8] hover:border-[#2251A3] hover:text-[#2251A3] text-[#3A4A5C] font-dm font-medium text-sm px-8 py-3 rounded-2xl shadow-sm transition-all duration-200"
                >
                  Load More Articles ↓
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Newsletter signup */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <NewsletterSignup />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <SmartRecommendations currentPage="/ai-times" compact />
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    "breaking": "⚡ Breaking",
    "ai-business": "💼 AI for Business",
    "tips": "💡 Tips",
    "tools": "🔧 Tools",
    "case-studies": "📊 Case Study",
    "industry": "🌐 Industry",
  };
  return (
    <span className="bg-[#EBF0FA] text-[#2251A3] text-xs font-medium font-dm px-2.5 py-1 rounded-full">
      {labels[category] ?? category}
    </span>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <Link href={`/ai-times/${post.slug}`} className="group">
      <article className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
        <div className="h-44 overflow-hidden relative">
          {post.coverImage && !imgFailed ? (
            <img
              src={post.coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className={`${gradientClass(post.coverGradient)} w-full h-full flex items-center justify-center`}>
              <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                {post.coverEmoji}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <CategoryBadge category={post.category} />
          <h3 className="font-syne font-bold text-base text-[#0D1B2A] mt-3 mb-2 group-hover:text-[#2251A3] transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>
          <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed line-clamp-3 flex-1">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs font-dm text-[#7A8FA6]">
            <Clock size={11} />
            <span>{post.readingTime} min</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName: firstName || undefined, source: "blog_page" }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] rounded-3xl p-10 text-center">
      <span className="inline-block bg-[#F47C20]/20 text-[#F47C20] text-xs font-dm font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
        Free Newsletter
      </span>
      <h2 className="font-syne font-extrabold text-2xl md:text-3xl text-white mb-3">
        AI insights delivered to your inbox.
      </h2>
      <p className="font-dm text-white/70 text-base max-w-lg mx-auto mb-7">
        Weekly tips on AI best practices, readiness strategies, and mistakes to avoid — curated for small businesses by Echelon.
      </p>
      {status === "success" ? (
        <div className="inline-flex items-center gap-2 bg-white/10 text-white font-dm text-sm px-6 py-3 rounded-2xl">
          You&rsquo;re subscribed! Welcome aboard.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="text"
            placeholder="First name (optional)"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-dm text-sm focus:outline-none focus:border-white/50"
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-[2] px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-dm text-sm focus:outline-none focus:border-white/50"
          />
          <button type="submit" disabled={status === "loading"}
            className="flex items-center justify-center gap-2 bg-[#F47C20] hover:bg-[#D85A30] text-white font-dm font-semibold px-5 py-3 rounded-xl transition-colors disabled:opacity-70 flex-shrink-0"
          >
            {status === "loading" ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <><Send size={14} /> Subscribe</>
            )}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="text-red-300 text-xs font-dm mt-3">Something went wrong. Please try again.</p>
      )}
      <p className="text-white/40 text-xs font-dm mt-4">No spam. Unsubscribe anytime.</p>
    </div>
  );
}

function TipsSpotlight({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💡</span>
        <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">Tips & Tricks Spotlight</h2>
        <Link href="#" onClick={() => {}} className="ml-auto text-xs text-[#2251A3] font-dm hover:underline">
          View all tips →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((p) => (
          <Link key={p.id} href={`/ai-times/${p.slug}`} className="group bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-5 hover:shadow-md transition-all duration-200">
            <p className="font-syne font-bold text-sm text-[#0D1B2A] group-hover:text-purple-700 line-clamp-2 mb-2">
              {p.title}
            </p>
            <p className="font-dm text-xs text-[#7A8FA6] line-clamp-2">{p.excerpt}</p>
            <p className="text-xs text-purple-500 font-dm mt-3">{p.readingTime} min read →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
