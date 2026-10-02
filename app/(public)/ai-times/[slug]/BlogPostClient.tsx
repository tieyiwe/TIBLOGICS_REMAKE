"use client";

import InArticlePromo, { splitForPromo } from "@/components/public/InArticlePromo";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Clock, ArrowLeft, Share2, BookOpen, ExternalLink, Calendar, MessageCircle, X, TrendingUp, Flame, Languages, Loader2 } from "lucide-react";
import OpenTiboButton from "@/components/public/OpenTiboButton";
import { useLocale, useT } from "@/lib/i18n/client";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";

/**
 * English / Français / Kiswahili buttons at the top of an article. They switch
 * ONLY the article (via ?lang=, so a shared link keeps the language); menus
 * and the rest of the site stay in the visitor's own language. Translations
 * are made when the article is published, so the switch is instant.
 */
function ArticleLanguageBar({ pending, articleLocale }: { pending: boolean; articleLocale: Locale }) {
  const t = useT();
  const router = useRouter();
  const [switching, setSwitching] = useState<Locale | null>(null);

  useEffect(() => setSwitching(null), [articleLocale]);

  // Only if an article was never translated (rare): refresh until it is.
  useEffect(() => {
    if (!pending) return;
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      if (n > 20) return clearInterval(id);
      router.refresh();
    }, 6000);
    return () => clearInterval(id);
  }, [pending, router]);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label={t("common.language")}>
      <Languages size={15} className="text-[#7A8FA6]" aria-hidden="true" />
      {LOCALES.map((l) => {
        const active = l === articleLocale;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (active) return;
              setSwitching(l);
              const url = new URL(window.location.href);
              url.searchParams.set("lang", l);
              router.replace(url.pathname + url.search, { scroll: false });
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-dm text-xs font-semibold transition-colors ${
              active
                ? "border-[#1B3A6B] bg-[#1B3A6B] text-white"
                : "border-[#D2DCE8] bg-white text-[#3A4A5C] hover:border-[#2251A3] hover:text-[#2251A3]"
            }`}
          >
            {switching === l && <Loader2 size={12} className="animate-spin" />}
            {LOCALE_NAMES[l]}
          </button>
        );
      })}
      {pending && <Loader2 size={14} className="animate-spin text-[#F47C20]" aria-hidden="true" />}
    </div>
  );
}

export interface BlogPost {
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
  excerpt: string;
  coverEmoji: string;
  coverGradient: string;
  coverImage?: string;
  readingTime: number;
  viewCount: number;
  category: string;
  createdAt: string;
}

/** Dictionary key for the social-proof badge on the Next Up card, if any. */
function trendingLabel(viewCount: number): { key: string; icon: "flame" | "trending" } | null {
  if (viewCount >= 150) return { key: "pages.article.trending", icon: "flame" };
  if (viewCount >= 75)  return { key: "pages.article.popular",  icon: "trending" };
  if (viewCount >= 30)  return { key: "pages.article.manyReaders", icon: "trending" };
  return null;
}

const GRADIENT_MAP: Record<string, string> = {
  "from-red-600 to-orange-500": "bg-gradient-to-br from-red-600 to-orange-500",
  "from-[#1B3A6B] to-[#2251A3]": "bg-gradient-to-br from-[#1B3A6B] to-[#2251A3]",
  "from-purple-600 to-violet-500": "bg-gradient-to-br from-purple-600 to-violet-500",
  "from-teal-600 to-emerald-500": "bg-gradient-to-br from-teal-600 to-emerald-500",
  "from-[#F47C20] to-yellow-500": "bg-gradient-to-br from-[#F47C20] to-yellow-500",
  "from-slate-600 to-gray-500": "bg-gradient-to-br from-slate-600 to-gray-500",
  "from-indigo-700 to-cyan-500": "bg-gradient-to-br from-indigo-700 to-cyan-500",
};

function gradientClass(g: string): string {
  return GRADIENT_MAP[g] ?? "bg-gradient-to-br from-[#1B3A6B] to-[#2251A3]";
}

function RelatedCard({ post: r }: { post: RelatedPost }) {
  const t = useT();
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
          <Clock size={10} /> {t("pages.aiTimes.min", { n: r.readingTime })}
        </p>
      </div>
    </Link>
  );
}

type Translation = { title: string; excerpt: string; content: string };

export default function BlogPostPage({
  initialPost = null,
  translation = null,
  pending = false,
  relatedTitles = {},
  articleLocale,
}: {
  articleLocale: Locale;
  /**
   * The article from the server, so its full text is in the first HTML
   * (search and AI crawlers often do not run JavaScript). The client still
   * fetches it once, which counts the view and refreshes it.
   */
  initialPost?: BlogPost | null;
  /** The article in the visitor's language, from the server; null for English or while pending. */
  translation?: Translation | null;
  /** True while the translation is being made: English is shown with a notice. */
  pending?: boolean;
  /** Cached translated titles for related articles, by slug. */
  relatedTitles?: Record<string, string>;
}) {
  const t = useT();
  const locale = useLocale();
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(!initialPost);
  const [copied, setCopied] = useState(false);
  const [widgetVisible, setWidgetVisible] = useState(false);
  const [widgetDismissed, setWidgetDismissed] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [nextPost, setNextPost] = useState<RelatedPost | null>(null);
  const [nextImgFailed, setNextImgFailed] = useState(false);
  const [nextUpVisible, setNextUpVisible] = useState(false);
  const [nextUpDismissed, setNextUpDismissed] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [heroCoverFailed, setHeroCoverFailed] = useState(false);
  // Scroll to top on every article open — client-side navigation retains previous scroll position
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, []);

  // Also scroll to top once the post data arrives (content expansion can shift position)
  useEffect(() => {
    if (post) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [post?.id]);

  const display: Translation | null = translation ?? (post ? { title: post.title, excerpt: post.excerpt, content: post.content } : null);
  const relatedTitle = (r: RelatedPost) => relatedTitles[r.slug] ?? r.title;

  // Reading progress — measured against the article element so the bar reflects
  // how far through the actual content the reader is, not the whole page.
  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const scrolledThrough = window.innerHeight - top;
      const pct = Math.min(100, Math.max(0, (scrolledThrough / height) * 100));
      setReadProgress(pct);

      // Show "Next Up" card when 65 % through — more compelling than showing it at the end
      if (pct >= 65 && !nextUpDismissed) {
        setNextUpVisible(true);
        // Next article is the highest-retention action at this point; retire the booking widget
        setWidgetVisible(false);
        setWidgetDismissed(true);
      }

      // Booking widget — only while Next Up card is not yet visible
      if (!widgetDismissed && window.scrollY > 400 && pct < 65) setWidgetVisible(true);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [widgetDismissed, nextUpDismissed]);

  // Seed nextPost from the first related article that differs from the current one
  useEffect(() => {
    if (related.length > 0 && !nextPost) {
      setNextPost(related.find((r) => r.slug !== slug) ?? related[0]);
    }
  }, [related, slug]);

  // Dismiss booking CTA when Tibo chat opens or Tibo idle greeting appears
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
        // Keep the server's copy if the refresh fails.
        setPost((prev) => d.post ?? prev);
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
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A] mb-2">{t("pages.article.notFound")}</h1>
          <Link href="/ai-times" className="text-[#2251A3] font-dm text-sm hover:underline">
            {t("pages.article.backToBlog")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-44 pb-36 sm:pb-20 min-h-screen bg-[#F4F7FB]">
      {/* Sticky back bar — always visible while reading */}
      <div className="sticky top-20 sm:top-44 z-30 bg-white/95 backdrop-blur-sm border-b border-[#D2DCE8] shadow-sm">
        {/* Reading progress bar */}
        <div className="h-[3px] bg-[#E8EFF8] w-full">
          <div
            className="h-full bg-[#F47C20] transition-[width] duration-150 ease-out"
            style={{ width: `${readProgress}%` }}
          />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <Link
            href="/ai-times"
            className="inline-flex min-w-0 items-center gap-2 text-sm font-dm font-semibold text-[#1B3A6B] hover:text-[#F47C20] transition-colors"
          >
            <ArrowLeft size={15} className="shrink-0" /> <span className="truncate">{t("pages.article.back")}</span>
          </Link>
          {readProgress > 5 && post ? (
            <span className="hidden sm:flex items-center gap-1 text-xs font-dm text-[#7A8FA6]">
              <Clock size={11} />
              {t("pages.article.minLeft", { n: Math.max(1, Math.ceil(((100 - readProgress) / 100) * post.readingTime)) })}
            </span>
          ) : (
            <span className="hidden sm:block font-syne font-bold text-xs text-[#F47C20] tracking-wide uppercase">
              {t("pages.aiTimes.tagline")}
            </span>
          )}
          <button
            onClick={handleShare}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-dm text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors"
          >
            <Share2 size={13} /> {copied ? t("pages.article.copied") : t("pages.article.share")}
          </button>
        </div>
      </div>

      {/* Hero cover + Article card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
        {/* lang: the article's own language, which can differ from the site's
            (?lang= switches only the article). Screen readers and search
            engines read it with the right language. */}
        <article ref={articleRef} lang={translation ? articleLocale : "en"} className="bg-white border border-[#D2DCE8] rounded-3xl overflow-hidden shadow-sm">

          {/* Cover image — constrained to card width */}
          {post.coverImage && !heroCoverFailed ? (
            <div className="w-full h-72 relative overflow-hidden">
              <img
                src={heroImgFailed ? post.coverImage : post.coverImage.replace('-cover.', '-hero.')}
                alt={display?.title ?? post.title}
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

          <div className="p-5 sm:p-8 md:p-10">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className={`${post.category === "advanced-tech" ? "bg-indigo-50 text-indigo-700" : "bg-[#EBF0FA] text-[#2251A3]"} text-xs font-medium font-dm px-3 py-1 rounded-full`}>
                {t(`pages.aiTimes.label.${post.category}`).startsWith("pages.") ? post.category : t(`pages.aiTimes.label.${post.category}`)}
              </span>
              {post.aiGenerated && (
                <span className="bg-[#F4F7FB] text-[#7A8FA6] text-xs font-dm px-3 py-1 rounded-full">
                  {t("pages.aiTimes.aiCurated")}
                </span>
              )}
            </div>

            <ArticleLanguageBar pending={pending} articleLocale={articleLocale} />

            {pending && (
              <p role="status" className="mb-5 rounded-xl border border-[#F47C20]/30 bg-[#FEF0E3] px-4 py-3 font-dm text-sm text-[#7A3E0E]">
                {t("common.translationPending")}
              </p>
            )}

            <h1 className="font-syne font-extrabold text-2xl md:text-4xl text-[#0D1B2A] leading-tight mb-4 break-words">
              {display?.title ?? post.title}
            </h1>

            <p className="font-dm text-[#3A4A5C] text-lg leading-relaxed mb-6 border-l-4 border-[#F47C20] pl-4">
              {display?.excerpt ?? post.excerpt}
            </p>

            {/* Author + meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-6 border-b border-[#F4F7FB] mb-8 text-sm font-dm text-[#7A8FA6]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-xs font-bold">
                  {post.author.charAt(0)}
                </div>
                <span className="text-[#3A4A5C] font-medium">{post.author}</span>
              </div>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {t("pages.aiTimes.minRead", { n: post.readingTime })}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={13} /> {post.viewCount === 1 ? t("pages.article.readsOne") : t("pages.article.reads", { n: post.viewCount.toLocaleString(locale) })}
              </span>
              <span>
                {new Date(post.createdAt).toLocaleDateString(locale, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Content */}
            {(() => {
                // Promo sits mid-article, where readers still are. The
                // end-of-article CTA below only reaches the ones who finish.
                const [head, tail] = splitForPromo(display?.content ?? post.content);
                return (
                  <>
                    <div
                      className="prose-blog font-dm text-[#0D1B2A] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: head }}
                    />
                    {tail && (
                      <>
                        <InArticlePromo category={post.category} tags={post.tags} />
                        <div
                          className="prose-blog font-dm text-[#0D1B2A] leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: tail }}
                        />
                      </>
                    )}
                  </>
                );
              })()}

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
                {t("pages.article.source", { title: post.sourceTitle ?? t("pages.article.originalArticle") })}
              </a>
            )}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2251A3] p-5 sm:p-8 text-white">
            <h3 className="font-syne font-extrabold text-xl mb-2">
              {t("pages.article.cta.title")}
            </h3>
            <p className="font-dm text-white/70 text-sm mb-5">
              {t("pages.article.cta.body")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="bg-[#F47C20] hover:bg-[#d96b18] text-white font-dm font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                {t("pages.article.cta.book")}
              </Link>
              <OpenTiboButton
                className="border border-white/30 text-white hover:bg-white/10 font-dm font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                {t("pages.article.cta.tibo")}
              </OpenTiboButton>
            </div>
          </div>
        </article>

        {/* Newsletter signup */}
        <ArticleNewsletterSignup slug={slug} />

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-syne font-bold text-lg text-[#0D1B2A] mb-5">{t("pages.article.related")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <RelatedCard key={r.id} post={{ ...r, title: relatedTitle(r) }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Next Up card — slides in when reader is 65 % through the article ── */}
      {nextUpVisible && !nextUpDismissed && nextPost && (
        <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 w-72 animate-fade-in">
          <div className="bg-white border border-[#D2DCE8] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1.5 border-b border-[#F4F7FB]">
              <span className="text-[0.65rem] font-dm font-bold tracking-widest text-[#7A8FA6] uppercase">
                {t("pages.article.upNext")}
              </span>
              <button
                onClick={() => { setNextUpVisible(false); setNextUpDismissed(true); }}
                className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors"
                aria-label={t("pages.article.dismiss")}
              >
                <X size={13} />
              </button>
            </div>

            {/* Social proof badge */}
            {trendingLabel(nextPost.viewCount) && (
              <div className="px-4 pt-2 pb-0 flex items-center gap-1.5">
                {nextPost.viewCount >= 150
                  ? <Flame size={12} className="text-[#F47C20]" />
                  : <TrendingUp size={12} className="text-[#2251A3]" />}
                <span className={`text-[0.7rem] font-dm font-semibold ${nextPost.viewCount >= 150 ? "text-[#F47C20]" : "text-[#2251A3]"}`}>
                  {t(trendingLabel(nextPost.viewCount)!.key)}
                </span>
              </div>
            )}

            {/* Article preview */}
            <Link
              href={`/ai-times/${nextPost.slug}`}
              className="block px-4 pt-3 pb-4 group"
              onClick={() => { setNextUpVisible(false); setNextUpDismissed(true); }}
            >
              <div className="flex gap-3 items-start mb-3">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  {nextPost.coverImage && !nextImgFailed ? (
                    <img
                      src={nextPost.coverImage}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={() => setNextImgFailed(true)}
                    />
                  ) : (
                    <div className={`${gradientClass(nextPost.coverGradient)} w-full h-full flex items-center justify-center`}>
                      <span className="text-2xl">{nextPost.coverEmoji}</span>
                    </div>
                  )}
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-syne font-bold text-sm text-[#0D1B2A] group-hover:text-[#2251A3] line-clamp-3 leading-snug transition-colors">
                    {relatedTitle(nextPost)}
                  </p>
                  <p className="text-[0.7rem] text-[#7A8FA6] mt-1.5 flex items-center gap-1 font-dm">
                    <Clock size={9} /> {t("pages.aiTimes.minRead", { n: nextPost.readingTime })}
                  </p>
                </div>
              </div>
              {/* CTA button */}
              <div className="w-full bg-[#1B3A6B] group-hover:bg-[#2251A3] text-white text-xs font-dm font-semibold text-center py-2 rounded-xl transition-colors">
                {t("pages.article.readNext")}
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Floating booking CTA widget */}
      {widgetVisible && !widgetDismissed && (
        <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 max-w-xs w-[calc(100vw-2rem)] sm:w-full animate-fade-in">
          <div className="bg-[#1B3A6B] text-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between p-4 pb-2">
              <p className="font-syne font-bold text-sm leading-snug pr-2">
                {t("pages.article.widget.title")}
              </p>
              <button
                onClick={() => { setWidgetDismissed(true); setWidgetVisible(false); window.dispatchEvent(new CustomEvent("booking-cta:hidden")); }}
                className="text-white/50 hover:text-white flex-shrink-0 transition-colors"
                aria-label={t("pages.article.dismiss")}
              >
                <X size={15} />
              </button>
            </div>
            <p className="font-dm text-white/70 text-xs px-4 pb-3 leading-relaxed">
              {t("pages.article.widget.body")}
            </p>
            <div className="flex gap-2 px-4 pb-4">
              <Link
                href="/book"
                className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-[#d96b18] text-white font-dm font-semibold text-xs px-3 py-2 rounded-lg transition-colors flex-1 justify-center"
              >
                <Calendar size={12} className="shrink-0" /> {t("pages.article.widget.book")}
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-1.5 border border-white/25 hover:bg-white/10 text-white font-dm font-medium text-xs px-3 py-2 rounded-lg transition-colors flex-1 justify-center"
              >
                <MessageCircle size={12} className="shrink-0" /> {t("pages.article.widget.contact")}
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
  const t = useT();
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
        setMsg(data.message ?? t("pages.newsletter.subscribed"));
      } else {
        setStatus("error");
        setMsg(data.error ?? t("pages.newsletter.error"));
      }
    } catch {
      setStatus("error");
      setMsg(t("pages.newsletter.network"));
    }
  }

  return (
    <div className="mt-10 rounded-2xl overflow-hidden border border-[#D2DCE8]">
      <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2251A3] px-6 py-6 sm:px-8">
        <p className="font-syne font-extrabold text-white text-xl sm:text-2xl leading-tight mb-1">
          {t("pages.newsletter.articleTitle")}
        </p>
        <p className="font-dm text-white/75 text-sm leading-relaxed">
          {t("pages.newsletter.articleBody")}
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
              placeholder={t("pages.newsletter.firstName")}
              aria-label={t("pages.newsletter.firstName")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
            />
            <input
              type="email"
              placeholder={t("pages.newsletter.email")}
              aria-label={t("pages.newsletter.email")}
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
              {status === "loading" ? "…" : t("pages.newsletter.subscribeArrow")}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="text-red-500 text-xs font-dm mt-2">{msg}</p>
        )}
        <p className="text-[#7A8FA6] text-xs font-dm mt-2">{t("pages.newsletter.noSpam")}</p>
      </div>
    </div>
  );
}
