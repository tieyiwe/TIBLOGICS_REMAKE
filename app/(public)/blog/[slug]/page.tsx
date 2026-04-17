"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, ArrowLeft, Share2, BookOpen, ExternalLink } from "lucide-react";

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

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
      <div className="pt-20 min-h-screen bg-[#F4F7FB]">
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
      <div className="pt-20 min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📭</p>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A] mb-2">Post not found</h1>
          <Link href="/blog" className="text-[#2251A3] font-dm text-sm hover:underline">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[#F4F7FB]">
      {/* Hero cover */}
      <div className={`${gradientClass(post.coverGradient)} w-full h-72 flex items-center justify-center`}>
        <span className="text-9xl">{post.coverEmoji}</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        {/* Back + share */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-[#7A8FA6] hover:text-[#1B3A6B] text-sm font-dm transition-colors"
          >
            <ArrowLeft size={15} /> Back to blog
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-[#7A8FA6] hover:text-[#1B3A6B] text-sm font-dm transition-colors"
          >
            <Share2 size={15} /> {copied ? "Copied!" : "Share"}
          </button>
        </div>

        {/* Article card */}
        <article className="bg-white border border-[#D2DCE8] rounded-3xl overflow-hidden shadow-sm">
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
              {post.title}
            </h1>

            <p className="font-dm text-[#3A4A5C] text-lg leading-relaxed mb-6 border-l-4 border-[#F47C20] pl-4">
              {post.excerpt}
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

            {/* Content */}
            <div
              className="prose-blog font-dm text-[#0D1B2A] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

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
                Talk to Echelon
              </Link>
            </div>
          </div>
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-syne font-bold text-lg text-[#0D1B2A] mb-5">More from this category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`${gradientClass(r.coverGradient)} h-24 flex items-center justify-center`}>
                    <span className="text-4xl group-hover:scale-110 transition-transform">{r.coverEmoji}</span>
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
              ))}
            </div>
          </div>
        )}
      </div>

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
      `}</style>
    </div>
  );
}
