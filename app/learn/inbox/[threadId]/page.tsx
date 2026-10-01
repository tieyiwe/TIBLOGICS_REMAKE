import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { learnerThread } from "@/lib/learn/inbox/threads";
import { renderMarkdownLite } from "@/lib/learn/inbox/markdown";
import ReplyForm from "./ReplyForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("inbox.metaTitle") };
}

export default async function InboxThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const student = await getStudent();
  const { threadId } = await params;
  if (!student) redirect(`/learn/login?next=/learn/inbox/${encodeURIComponent(threadId)}`);
  if (!/^[\w-]{1,64}$/.test(threadId)) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const data = await learnerThread(student.id, threadId);
  if (!data) notFound();
  const { thread, messages } = data;
  const fmt = (d: Date) => d.toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/learn/inbox" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--blue2)] hover:underline">
        <ArrowLeft size={16} aria-hidden /> {t("inbox.back")}
      </Link>
      <h1 className="mt-3 text-2xl font-black leading-tight text-[var(--ink)]">{thread.subject}</h1>

      <ol className="mt-6 space-y-4" aria-label={thread.subject}>
        {messages.map((m) => {
          const mine = m.sender === "learner";
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <article
                className={`w-full max-w-[92%] rounded-2xl border p-4 sm:max-w-[80%] sm:p-5 ${
                  mine ? "border-[#cfe0f7] bg-[#F1F6FD]" : "border-[var(--border)] bg-white"
                }`}
              >
                <header className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-[var(--ink)]">
                    {mine ? t("inbox.you") : m.authorName && m.authorName !== "ARFA team" ? `${m.authorName} · ${t("inbox.from")}` : t("inbox.from")}
                  </p>
                  <time dateTime={m.createdAt.toISOString()} className="text-xs text-[var(--ink3)]">
                    {fmt(m.createdAt)}
                  </time>
                </header>
                <div
                  className="prose-inbox mt-2 text-[15px] leading-relaxed text-[var(--ink2)] [&_a]:font-semibold [&_a]:text-[var(--blue2)] [&_a]:underline [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
                  // Safe: renderMarkdownLite escapes everything before adding its own tags.
                  dangerouslySetInnerHTML={{ __html: renderMarkdownLite(m.body) }}
                />
              </article>
            </li>
          );
        })}
      </ol>

      {thread.status === "closed" ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-4 text-sm text-[var(--ink2)]">{t("inbox.closed")}</p>
      ) : (
        <ReplyForm threadId={thread.id} />
      )}
    </div>
  );
}
