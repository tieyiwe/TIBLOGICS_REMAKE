import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox, MessageSquareReply } from "lucide-react";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { learnerThreads } from "@/lib/learn/inbox/threads";
import { plainPreview } from "@/lib/learn/inbox/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("inbox.metaTitle") };
}

function when(d: Date, locale: string): string {
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(locale, { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export default async function InboxPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login?next=/learn/inbox");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const threads = await learnerThreads(student.id).catch((err) => {
    console.error("[learn/inbox]", err);
    return [];
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0D1B2A] text-white" aria-hidden>
          <Inbox size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-black text-[var(--ink)]">{t("inbox.title")}</h1>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("inbox.intro")}</p>
        </div>
      </header>

      {threads.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-white px-6 py-14 text-center">
          <Inbox size={28} className="mx-auto text-[var(--ink3)]" aria-hidden />
          <p className="mt-3 font-bold text-[var(--ink)]">{t("inbox.empty")}</p>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("inbox.emptyBody")}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          {threads.map((th) => {
            const unread = th.learnerUnread > 0;
            return (
              <li key={th.id}>
                <Link
                  href={`/learn/inbox/${th.id}`}
                  className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[var(--s2)] sm:px-5 ${unread ? "bg-[#FFF8F1]" : ""}`}
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-[var(--orange)]" : "bg-transparent"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`truncate text-[15px] ${unread ? "font-black text-[var(--ink)]" : "font-semibold text-[var(--ink)]"}`}>
                        {th.subject}
                        {unread && <span className="sr-only"> ({t("inbox.unread")})</span>}
                      </p>
                      <time dateTime={th.lastMessageAt.toISOString()} className="shrink-0 text-xs text-[var(--ink3)]">
                        {when(th.lastMessageAt, locale)}
                      </time>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-[var(--ink2)]">
                      {th.last?.sender === "learner" && <MessageSquareReply size={14} className="shrink-0 text-[var(--ink3)]" aria-label={t("inbox.you")} />}
                      <span className="truncate">{th.last ? plainPreview(th.last.body, 120) : ""}</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
