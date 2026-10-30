import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox, LifeBuoy, MessageSquareReply } from "lucide-react";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { learnerThreads } from "@/lib/learn/inbox/threads";
import { plainPreview, renderMarkdownLite } from "@/lib/learn/inbox/markdown";
import { listNotifications, unreadNotifications } from "@/lib/learn/inbox/notifications";
import { learnerTicketStatus } from "@/lib/learn/support/tickets";
import OpenHelpButton from "@/components/learn/support/OpenHelpButton";
import NotificationsList from "./NotificationsList";

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

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 ring-amber-200",
  answered: "bg-green-50 text-green-800 ring-green-200",
  closed: "bg-[var(--s2)] text-[var(--ink3)] ring-[var(--border)]",
};

export default async function InboxPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login?next=/learn/inbox");
  const sp = await searchParams;
  const tab = sp.tab === "notifications" ? "notifications" : "messages";
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const [threads, support, notifUnread, notifications] = await Promise.all([
    learnerThreads(student.id).catch((err) => {
      console.error("[learn/inbox]", err);
      return [];
    }),
    learnerTicketStatus(student.id),
    unreadNotifications(student.id),
    tab === "notifications"
      ? listNotifications(student.id).catch((err) => {
          console.error("[learn/inbox] notifications", err);
          return [];
        })
      : Promise.resolve([]),
  ]);
  const msgUnread = threads.filter((th) => th.learnerUnread > 0).length;

  const tabCls = (on: boolean) =>
    `inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-bold transition-colors ${
      on ? "border-[var(--orange)] text-[var(--ink)]" : "border-transparent text-[var(--ink3)] hover:text-[var(--ink)]"
    }`;
  const count = (n: number) =>
    n > 0 ? <span className="rounded-full bg-[var(--orange)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{n}</span> : null;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0D1B2A] text-white" aria-hidden>
            <Inbox size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-black text-[var(--ink)]">{t("inbox.title")}</h1>
            <p className="mt-1 text-sm text-[var(--ink2)]">{t("inbox.intro")}</p>
          </div>
        </div>
        <OpenHelpButton className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--ink)] hover:border-[var(--ink3)]">
          <LifeBuoy size={16} aria-hidden /> {t("support.inbox.ask")}
        </OpenHelpButton>
      </header>

      <nav aria-label={t("inbox.tabs")} className="mt-6 flex gap-1 border-b border-[var(--border)]">
        <Link href="/learn/inbox" aria-current={tab === "messages" ? "page" : undefined} className={tabCls(tab === "messages")}>
          {t("inbox.tab.messages")} {count(msgUnread)}
        </Link>
        <Link
          href="/learn/inbox?tab=notifications"
          aria-current={tab === "notifications" ? "page" : undefined}
          className={tabCls(tab === "notifications")}
          data-testid="tab-notifications"
        >
          {t("inbox.tab.notifications")} {count(notifUnread)}
        </Link>
      </nav>

      {tab === "notifications" ? (
        <NotificationsList
          items={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            html: n.body ? renderMarkdownLite(n.body) : "",
            linkUrl: n.linkUrl,
            linkLabel: n.linkLabel,
            read: !!n.readAt,
            when: when(new Date(n.createdAt), locale),
            iso: new Date(n.createdAt).toISOString(),
          }))}
        />
      ) : threads.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-white px-6 py-14 text-center">
          <Inbox size={28} className="mx-auto text-[var(--ink3)]" aria-hidden />
          <p className="mt-3 font-bold text-[var(--ink)]">{t("inbox.empty")}</p>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("inbox.emptyBody")}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white" data-testid="inbox-threads">
          {threads.map((th) => {
            const unread = th.learnerUnread > 0;
            const st = support.get(th.id);
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
                      {st && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${STATUS_STYLE[st.status] ?? STATUS_STYLE.open}`} data-testid="support-status">
                          {t(`support.status.${st.status}`)}
                        </span>
                      )}
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
