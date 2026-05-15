"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, ArrowLeft, Share2, BookOpen, ExternalLink, Calendar, MessageCircle, X } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  coverEmoji: string;
  coverGradient: string;
  coverImage?: string;
  author: string;
  readingTime: number;
  aiGenerated: boolean;
  sourceUrl?: string;
  sourceTitle?: string;
  viewCount: number;
  createdAt: string;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  coverEmoji: string;
  coverGradient: string;
  coverImage?: string;
  readingTime: number;
  createdAt: string;
}

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

const CATEGORY_LABELS: Record<string, string> = {
  "breaking": "⚡ Breaking News",
  "ai-business": "💼 AI for Business",
  "tips": "💡 Tips & Tricks",
  "tools": "🔧 Tools & Reviews",
  "case-studies": "📊 Case Studies",
  "industry": "🌐 Industry News",
};

function RelatedCard({ post: r }: { post: RelatedPost }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <Link
      href={`/ai-times/${r.slug}`}
      className="group bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="h-28 overflow-hidden relative">
        {r.coverImage && !imgFailed ? (
          <img
            src={r.coverImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={`${gradientClass(r.coverGradient)} w-full h-full flex items-center justify-center`}>
            <span className="text-4xl group-hover:scale-110 transition-transform">{r.coverEmoji}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-syne font-bold text-sm text-[#0D1B2A] group-hover:text-[#2251A3] line-clamp-2 leading-snug">
          {r.title}
        </p>
        <p className="font-dm text-xs text-[#7A8FA6] mt-1.5 flex items-center gap-1">
          <Clock size={10} /> {r.readingTime} min
        </p>
      </div>
    </Link>
  );
}

type Translation = { title: string; excerpt: string; content: string };

export default function BlogPostPage({
  preloadedTranslations = {},
}: {
  preloadedTranslations?: Record<string, Translation>;
}) {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const [widgetDismissed, setWidgetDismissed] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [heroCoverFailed, setHeroCoverFailed] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr" | "sw">("en");
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState<Record<string, { title: string; excerpt: string; content: string }>>(preloadedTranslations);

  // Load translations from localStorage cache on mount (instant for returning visitors)
  useEffect(() => {
    if (!slug) return;
    const cached: Record<string, { title: string; excerpt: string; content: string }> = {};
    const ttl = 24 * 60 * 60 * 1000; // 24h
    for (const lang of ["fr", "sw"] as const) {
      try {
        const raw = localStorage.getItem(`tx:${slug}:${lang}`);
        if (raw) {
          const { data, ts } = JSON.parse(raw);
          if (Date.now() - ts < ttl) cached[lang] = data;
          else localStorage.removeItem(`tx:${slug}:${lang}`);
        }
      } catch { /* ignore */ }
    }
    if (Object.keys(cached).length > 0) setTranslations(prev => ({ ...prev, ...cached }));
  }, [slug]);

  // Background pre-fetch: starts quickly, saves result to localStorage for next visit
  useEffect(() => {
    if (!post || !slug) return;
    const prefetch = async (lang: "fr" | "sw") => {
      if (preloadedTranslations[lang]) return; // already loaded server-side, no round-trip needed
      try {
        const res = await fetch("/api/blog/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, language: lang }),
        });
        if (res.ok) {
          const data = await res.json();
          setTranslations(prev => ({ ...prev, [lang]: data }));
          try { localStorage.setItem(`tx:${slug}:${lang}`, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
        }
      } catch { /* silent */ }
    };
    prefetch("fr");
    prefetch("sw");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  // When a cached translation arrives, clear the spinner if user already selected that language
  useEffect(() => {
    if (language !== "en" && translations[language]) setTranslating(false);
  }, [translations, language]);

  function handleTranslate(lang: "en" | "fr" | "sw") {
    setLanguage(lang);
    if (lang !== "en" && !translations[lang]) setTranslating(true);
    else setTranslating(false);
  }

  const display = language !== "en" && translations[language]
    ? translations[language]
    : post ? { title: post.title, excerpt: post.excerpt, content: post.content } : null;

  useEffect(() => {
    function onScroll() {
      if (!widgetDismissed && window.scrollY > 400) setWidgetVisible(true);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [widgetDismissed]);

  // Dismiss CTA when Tibo chat opens or Tibo idle greeting appears
  useEffect(() => {
    const dismiss = () => {
      setWidgetVisible(false);
      setWidgetDismissed(true);
      window.dispatchEvent(new CustomEvent("booking-cta:hidden"));
    };
    window.addEventListener("tibo:opened", dismiss);
    window.addEventListener("tibo:greeting-shown", dismiss);
    return () => {
      window.removeEventListener("tibo:opened", dismiss);
      window.removeEventListener("tibo:greeting-shown", dismiss);
    };
  }, []);

  // Notify Tibo when CTA becomes visible
  useEffect(() => {
    if (widgetVisible) window.dispatchEvent(new CustomEvent("booking-cta:shown"));
  }, [widgetVisible]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/posts/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setPost(d.post ?? null);
        // Fetch related posts
        if (d.post) {
          return fetch(`/api/blog/posts?category=${d.post.category}&limit=4`);
        }
      })
      .then((r) => r?.json())
      .then((d) => setRelated((d?.posts ?? []).filter((p: RelatedPost) => p.id !== post?.id).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function handleShare() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  if (loading) {
    return (
      <div className="pt-32 sm:pt-44 min-h-screen bg-[#F4F7FB]">
        <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse space-y-6">
          <div className="h-64 bg-[#D2DCE8] rounded-3xl" />
          <div className="h-8 bg-[#D2DCE8] rounded w-3/4" />
          <div className="space-y-3">
            <div className="h-4 bg-[#D2DCE8] rounded w-full" />
            <div className="h-4 bg-[#D2DCE8] rounded w-5/6" />
            <div className="h-4 bg-[#D2DCE8] rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-32 sm:pt-44 min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📭</p>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A] mb-2">Post not found</h1>
          <Link href="/ai-times" className="text-[#2251A3] font-dm text-sm hover:underline">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-44 pb-36 sm:pb-20 min-h-screen bg-[#F4F7FB]">
      {/* Sticky back bar — always visible while reading */}
      <div className="sticky top-20 sm:top-44 z-30 bg-white/95 backdrop-blur-sm border-b border-[#D2DCE8] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <Link
            href="/ai-times"
            className="inline-flex items-center gap-2 text-sm font-dm font-semibold text-[#1B3A6B] hover:text-[#F47C20] transition-colors"
          >
            <ArrowLeft size={15} /> Back to AI TIMES
          </Link>
          <span className="hidden sm:block font-syne font-bold text-xs text-[#F47C20] tracking-wide uppercase">
            The #1 AI Digestable Knowledge
          </span>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-dm text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors"
          >
            <Share2 size={13} /> {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      {/* Hero cover + Article card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
        <article className="bg-white border border-[#D2DCE8] rounded-3xl overflow-hidden shadow-sm">

          {/* Cover image — constrained to card width */}
          {post.coverImage && !heroCoverFailed ? (
            <div className="w-full h-72 relative overflow-hidden">
              <img
                src={heroImgFailed ? post.coverImage : post.coverImage.replace('-cover.', '-hero.')}
                alt={post.title}
                className="w-full h-full object-cover object-top"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                sizes="(max-width:768px) 100vw, 768px"
                onError={() => heroImgFailed ? setHeroCoverFailed(true) : setHeroImgFailed(true)}
              />
            </div>
          ) : (
            <div className={`${gradientClass(post.coverGradient)} w-full h-48 flex items-center justify-center`}>
              <span className="text-9xl">{post.coverEmoji}</span>
            </div>
          )}

          <div className="p-8 md:p-10">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="bg-[#EBF0FA] text-[#2251A3] text-xs font-medium font-dm px-3 py-1 rounded-full">
                {CATEGORY_LABELS[post.category] ?? post.category}
              </span>
              {post.aiGenerated && (
                <span className="bg-[#F4F7FB] text-[#7A8FA6] text-xs font-dm px-3 py-1 rounded-full">
                  AI Curated
                </span>
              )}
            </div>

            <h1 className="font-syne font-extrabold text-2xl md:text-4xl text-[#0D1B2A] leading-tight mb-4">
              {display?.title ?? post.title}
            </h1>

            <p className="font-dm text-[#3A4A5C] text-lg leading-relaxed mb-6 border-l-4 border-[#F47C20] pl-4">
              {display?.excerpt ?? post.excerpt}
            </p>

            {/* Author + meta row */}
            <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-[#F4F7FB] mb-8 text-sm font-dm text-[#7A8FA6]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-xs font-bold">
                  {post.author.charAt(0)}
                </div>
                <span className="text-[#3A4A5C] font-medium">{post.author}</span>
              </div>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {post.readingTime} min read
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={13} /> {post.viewCount} reads
              </span>
              <span>
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Language toggle */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-xs text-[#7A8FA6] font-medium">Translate:</span>
              {([["en","🇬🇧 English"],["fr","🇫🇷 Français"],["sw","🇰🇪 Swahili"]] as const).map(([lang, label]) => (
                <button key={lang}
                  onClick={() => handleTranslate(lang)}
                  onMouseEnter={() => {
                    if (lang !== "en" && !translations[lang] && post) {
                      fetch("/api/blog/translate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ slug, language: lang }),
                      }).then(r => r.ok ? r.json() : null).then(data => {
                        if (data) {
                          setTranslations(prev => ({ ...prev, [lang]: data }));
                          try { localStorage.setItem(`tx:${slug}:${lang}`, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
                        }
                      }).catch(() => {/* silent */});
                    }
                  }}
                  disabled={translating}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    language === lang ? "bg-[#2251A3] text-white border-[#2251A3]" : "bg-white text-[#3A4A5C] border-[#D2DCE8] hover:border-[#2251A3] hover:text-[#2251A3]"
                  } ${translating && lang !== language ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {translating && lang !== "en" && language === lang ? "Translating…" : label}
                </button>
              ))}
            </div>

            {/* Content */}
            {translating ? (
              <div className="space-y-3 animate-pulse py-2">
                {[100,90,95,85,100,80,92].map((w, i) => (
                  <div key={i} className="h-4 bg-[#D2DCE8] rounded" style={{ width: `${w}%` }} />
                ))}
                <div className="h-4 bg-[#D2DCE8] rounded w-1/2 mt-2" />
              </div>
            ) : (
              <div
                className="prose-blog font-dm text-[#0D1B2A] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: display?.content ?? post.content }}
              />
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[#F4F7FB]">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#F4F7FB] text-[#3A4A5C] text-xs font-dm px-3 py-1.5 rounded-full border border-[#D2DCE8]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source */}
            {post.sourceUrl && (
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 mt-4 text-xs font-dm text-[#7A8FA6] hover:text-[#2251A3] transition-colors"
              >
                <ExternalLink size={12} />
                Source: {post.sourceTitle ?? "Original article"}
              </a>
            )}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2251A3] p-8 text-white">
            <h3 className="font-syne font-extrabold text-xl mb-2">
              Ready to implement AI in your business?
            </h3>
            <p className="font-dm text-white/70 text-sm mb-5">
              Our team builds the AI systems you just read about. Start with a free 30-minute discovery meeting.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="bg-[#F47C20] hover:bg-[#d96b18] text-white font-dm font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Book Free Meeting →
              </Link>
              <Link
                href="/tools/advisor"
                className="border border-white/30 text-white hover:bg-white/10 font-dm font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Talk to Tibo
              </Link>
            </div>
          </div>
        </article>

        {/* Newsletter signup */}
        <ArticleNewsletterSignup slug={slug} />

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-syne font-bold text-lg text-[#0D1B2A] mb-5">More from this category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <RelatedCard key={r.id} post={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating CTA widget */}
      {widgetVisible && !widgetDismissed && (
        <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 max-w-xs w-[calc(100vw-2rem)] sm:w-full animate-fade-in">
          <div className="bg-[#1B3A6B] text-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between p-4 pb-2">
              <p className="font-syne font-bold text-sm leading-snug pr-2">
                Interested in AI for your business?
              </p>
              <button
                onClick={() => { setWidgetDismissed(true); setWidgetVisible(false); window.dispatchEvent(new CustomEvent("booking-cta:hidden")); }}
                className="text-white/50 hover:text-white flex-shrink-0 transition-colors"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
            <p className="font-dm text-white/70 text-xs px-4 pb-3 leading-relaxed">
              We build the AI systems you just read about. Let's talk about yours.
            </p>
            <div className="flex gap-2 px-4 pb-4">
              <Link
                href="/book"
                className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-[#d96b18] text-white font-dm font-semibold text-xs px-3 py-2 rounded-lg transition-colors flex-1 justify-center"
              >
                <Calendar size={12} /> Book a Consulting
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-1.5 border border-white/25 hover:bg-white/10 text-white font-dm font-medium text-xs px-3 py-2 rounded-lg transition-colors flex-1 justify-center"
              >
                <MessageCircle size={12} /> Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Prose styles */}
      <style>{`
        .prose-blog h2 {
          font-family: var(--font-syne), sans-serif;
          font-size: 1.375rem;
          font-weight: 700;
          color: #0D1B2A;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .prose-blog h3 {
          font-family: var(--font-syne), sans-serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #0D1B2A;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .prose-blog p {
          margin-bottom: 1rem;
          line-height: 1.75;
          color: #3A4A5C;
        }
        .prose-blog ul, .prose-blog ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .prose-blog li {
          margin-bottom: 0.375rem;
          color: #3A4A5C;
          line-height: 1.7;
        }
        .prose-blog ul li { list-style-type: disc; }
        .prose-blog ol li { list-style-type: decimal; }
        .prose-blog strong { color: #0D1B2A; font-weight: 600; }
        .prose-blog a { color: #2251A3; text-decoration: underline; }
        .prose-blog blockquote {
          border-left: 4px solid #F47C20;
          padding-left: 1rem;
          color: #7A8FA6;
          font-style: italic;
          margin: 1.5rem 0;
        }
        .prose-blog img { max-width: 100%; height: auto; }
        .prose-blog .tips-section {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f8fafc 100%);
          border-radius: 1rem;
          overflow: hidden;
          margin: 2rem 0;
        }
        .prose-blog .tips-header {
          font-family: var(--font-syne), sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0D1B2A;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid rgba(148,163,184,0.4);
        }
        .prose-blog .tips-list {
          list-style: none;
          padding: 1rem 1.25rem;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .prose-blog .tips-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          color: #3A4A5C;
          font-size: 0.875rem;
          line-height: 1.6;
          margin: 0;
        }
        .prose-blog .tip-num {
          flex-shrink: 0;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          background: #2251A3;
          color: #fff;
          font-size: 0.625rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.125rem;
        }
        @media (max-width: 640px) {
          .prose-blog div[style*="display:grid"],
          .prose-blog div[style*="display: grid"] {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .prose-blog div[style*="display:grid"] > *,
          .prose-blog div[style*="display: grid"] > * {
            width: 100% !important;
            min-width: 0 !important;
          }
          .prose-blog h2 { font-size: 1.2rem; }
          .prose-blog h3 { font-size: 1rem; }
          .prose-blog p { font-size: 0.9375rem; }
        }
      `}</style>
    </div>
  );
}

function ArticleNewsletterSignup({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName: firstName || undefined, source: `article:${slug}` }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMsg(data.message ?? "You're subscribed!");
      } else {
        setStatus("error");
        setMsg(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  }

  return (
    <div className="mt-10 rounded-2xl overflow-hidden border border-[#D2DCE8]">
      <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] px-6 py-6 sm:px-8">
        <p className="font-syne font-extrabold text-white text-xl sm:text-2xl leading-tight mb-1">
          Stay ahead in AI — without the noise.
        </p>
        <p className="font-dm text-white/75 text-sm leading-relaxed">
          Get the most digestible AI insights, tools, and developments straight to your inbox. In plain English. Free.
        </p>
      </div>
      <div className="bg-white px-6 py-5 sm:px-8">
        {status === "success" ? (
          <div className="flex items-center gap-2 text-green-700 font-dm text-sm font-medium py-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {msg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="First name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-[2] min-w-0 px-4 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex-shrink-0 bg-[#F47C20] hover:bg-[#d96b18] text-white font-dm font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {status === "loading" ? "…" : "Subscribe →"}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="text-red-500 text-xs font-dm mt-2">{msg}</p>
        )}
        <p className="text-[#7A8FA6] text-xs font-dm mt-2">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}
