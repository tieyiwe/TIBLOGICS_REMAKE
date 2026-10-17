"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BellRing, CheckCheck, ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export interface NotificationView {
  id: string;
  title: string;
  /** Already rendered by renderMarkdownLite on the server (escaped first). */
  html: string;
  linkUrl: string | null;
  linkLabel: string | null;
  read: boolean;
  when: string;
  iso: string;
}

async function post(body: object) {
  const res = await fetch("/api/learn/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // A link click navigates away right after: let the request finish.
    keepalive: true,
  });
  if (!res.ok) throw new Error("failed");
}

export default function NotificationsList({ items }: { items: NotificationView[] }) {
  const t = useT();
  const router = useRouter();
  const [read, setRead] = useState<Set<string>>(() => new Set(items.filter((i) => i.read).map((i) => i.id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unread = items.filter((i) => !read.has(i.id)).length;

  async function markOne(id: string) {
    if (read.has(id)) return;
    setRead((s) => new Set(s).add(id));
    await post({ action: "read", id }).catch(() => {});
  }

  async function markAll() {
    setBusy(true);
    setError(null);
    try {
      await post({ action: "readAll" });
      setRead(new Set(items.map((i) => i.id)));
      router.refresh();
    } catch {
      setError(t("inbox.error"));
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white px-6 py-14 text-center">
        <BellRing size={28} className="mx-auto text-[var(--ink3)]" aria-hidden />
        <p className="mt-3 font-bold text-[var(--ink)]">{t("inbox.notif.empty")}</p>
        <p className="mt-1 text-sm text-[var(--ink2)]">{t("inbox.notif.emptyBody")}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--ink2)]" aria-live="polite">
          {unread > 0 ? t("inbox.notif.unreadCount", { n: unread }) : t("inbox.notif.allRead")}
        </p>
        <button
          type="button"
          onClick={markAll}
          disabled={busy || unread === 0}
          data-testid="notif-read-all"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)] disabled:opacity-50"
        >
          <CheckCheck size={16} aria-hidden /> {t("inbox.notif.markAll")}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <ul className="mt-3 space-y-3" data-testid="notif-list">
        {items.map((n) => {
          const isRead = read.has(n.id);
          const external = !!n.linkUrl && !n.linkUrl.startsWith("/");
          return (
            <li key={n.id}>
              <article
                className={`rounded-2xl border p-4 sm:p-5 ${isRead ? "border-[var(--border)] bg-white" : "border-[#F9C99A] bg-[#FFF8F1]"}`}
                data-unread={isRead ? undefined : "true"}
              >
                <header className="flex items-start justify-between gap-3">
                  <h2 className={`flex items-start gap-2 text-[15px] leading-snug text-[var(--ink)] ${isRead ? "font-semibold" : "font-black"}`}>
                    <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${isRead ? "bg-transparent" : "bg-[var(--orange)]"}`} />
                    <span>
                      {n.title}
                      {!isRead && <span className="sr-only"> ({t("inbox.unread")})</span>}
                    </span>
                  </h2>
                  <time dateTime={n.iso} className="shrink-0 text-xs text-[var(--ink3)]">{n.when}</time>
                </header>
                {n.html && (
                  <div
                    className="mt-2 pl-[18px] text-sm leading-relaxed text-[var(--ink2)] [&_a]:font-semibold [&_a]:text-[var(--blue2)] [&_a]:underline [&_p+p]:mt-2 [&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5"
                    // Safe: rendered by renderMarkdownLite (escapes everything first).
                    dangerouslySetInnerHTML={{ __html: n.html }}
                  />
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 pl-[18px]">
                  {n.linkUrl && (
                    <a
                      href={n.linkUrl}
                      onClick={() => void markOne(n.id)}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 text-sm font-bold text-white hover:opacity-90"
                    >
                      {n.linkLabel || t("inbox.notif.open")}
                      {external && <ExternalLink size={14} aria-hidden />}
                    </a>
                  )}
                  {!isRead && (
                    <button
                      type="button"
                      onClick={() => void markOne(n.id).then(() => router.refresh())}
                      className="min-h-10 rounded-full px-3 text-sm font-semibold text-[var(--blue2)] hover:underline"
                    >
                      {t("inbox.markRead")}
                    </button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
