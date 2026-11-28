"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, EyeOff, Flag, Link2, Loader2, MessageCircle, Pin, Send, ThumbsUp, Trash2, X } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  BODY_MAX,
  REACTIONS,
  REACTION_EMOJI,
  type EngageData,
  type PublicComment,
} from "@/lib/blog/engage/types";
import { postJson, useEngage } from "./engage-store";

// The discussion under an AI Times article (lib/blog/engage): one-tap
// reactions, a share row, and comments with one level of replies, "helpful"
// votes, reports, and in-place pinning and hiding for staff. Comments are
// plain text (React escapes them). The interface follows the site language;
// readers write in theirs.

const RECENT_ROOTS = 10;
const REPLIES_SHOWN = 3;

type Sort = "top" | "new";

function timeAgo(iso: string, locale: string): string {
  const s = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const a = Math.abs(s);
  if (a < 60) return rtf.format(0, "second");
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86_400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 86_400 * 30) return rtf.format(Math.round(s / 86_400), "day");
  return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export default function ArticleDiscussion({ title }: { title: string }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { slug, data, failed, load } = useEngage();
  const [sort, setSort] = useState<Sort>("top");
  const [allRoots, setAllRoots] = useState(false);
  const [flash, setFlash] = useState<{ tone: "ok" | "info" | "err"; text: string } | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const confirmTok = params?.get("confirm") ?? null;

  // A link to one comment (#comment-ID, from a reply email): bring it into
  // view once the comments have arrived.
  const hashDone = useRef(false);
  useEffect(() => {
    if (!data || hashDone.current) return;
    hashDone.current = true;
    const m = /^#comment-([0-9a-f-]{36})$/.exec(window.location.hash);
    if (m) {
      setAllRoots(true);
      setHighlight(m[1]);
      window.setTimeout(() => document.getElementById(`comment-${m[1]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [data]);

  const dropConfirmParam = () => {
    const q = new URLSearchParams(params?.toString() ?? "");
    q.delete("confirm");
    router.replace(`${pathname}${q.toString() ? `?${q}` : ""}#discussion`, { scroll: false });
  };

  async function confirmNow() {
    if (!confirmTok) return;
    const r = await postJson("/api/blog/engage/confirm", { t: confirmTok });
    const status = String(r.data.status ?? "");
    dropConfirmParam();
    if (status === "published") setFlash({ tone: "ok", text: t("pages.article.talk.confirm.done") });
    else if (status === "pending") setFlash({ tone: "info", text: t("pages.article.talk.sent.held") });
    else setFlash({ tone: "err", text: t("pages.article.talk.confirm.expired") });
    const d = await load();
    if (d && typeof r.data.id === "string") {
      setHighlight(r.data.id);
      window.setTimeout(() => document.getElementById(`comment-${r.data.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }

  const { roots, replies } = useMemo(() => {
    const list = data?.comments ?? [];
    const byParent = new Map<string, PublicComment[]>();
    for (const c of list) if (c.parentId) byParent.set(c.parentId, [...(byParent.get(c.parentId) ?? []), c]);
    const r = list.filter((c) => !c.parentId);
    const score = (c: PublicComment) => c.helpful * 3 + (byParent.get(c.id)?.length ?? 0) * 2;
    r.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "top" && score(a) !== score(b)) return score(b) - score(a);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return { roots: r, replies: byParent };
  }, [data, sort]);

  const shownRoots = allRoots ? roots : roots.slice(0, RECENT_ROOTS);
  const total = data?.total ?? 0;

  return (
    <section id="discussion" aria-labelledby="discussion-title" className="mt-8 scroll-mt-44 space-y-5" data-testid="discussion">
      {confirmTok && (
        <div role="status" className="rounded-2xl border border-[#F47C20]/40 bg-[#FEF0E3] p-4 sm:p-5" data-testid="confirm-banner">
          <p className="font-syne text-base font-bold text-[#0D1B2A]">{t("pages.article.talk.confirm.title")}</p>
          <p className="mt-1 font-dm text-sm text-[#7A3E0E]">{t("pages.article.talk.confirm.body")}</p>
          <button
            type="button"
            onClick={confirmNow}
            data-testid="confirm-publish"
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#F47C20] px-5 py-2.5 font-dm text-sm font-bold text-white hover:bg-[#d96b18]"
          >
            <Check size={16} /> {t("pages.article.talk.confirm.button")}
          </button>
        </div>
      )}
      {flash && (
        <p
          role="status"
          data-testid="discussion-flash"
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 font-dm text-sm ${
            flash.tone === "ok" ? "border-green-200 bg-green-50 text-green-800" : flash.tone === "info" ? "border-[#D2DCE8] bg-[#EBF0FA] text-[#1B3A6B]" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{flash.text}</span>
          <button type="button" onClick={() => setFlash(null)} aria-label={t("pages.article.talk.dismiss")} className="shrink-0 opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </p>
      )}

      <div className="rounded-3xl border border-[#D2DCE8] bg-white p-5 shadow-sm sm:p-7">
        <Reactions />
        <ShareRow title={title} />
      </div>

      <div className="rounded-3xl border border-[#D2DCE8] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="discussion-title" className="font-syne text-lg font-bold text-[#0D1B2A]">
            {t("pages.article.talk.title")}
            {total > 0 && (
              <span className="ml-2 font-dm text-sm font-medium text-[#7A8FA6]">
                · {total === 1 ? t("pages.article.talk.countOne") : t("pages.article.talk.countOther", { n: total.toLocaleString(locale) })}
              </span>
            )}
          </h2>
          {roots.length > 1 && (
            <div role="group" aria-label={t("pages.article.talk.sort.label")} className="inline-flex rounded-full border border-[#D2DCE8] bg-[#F4F7FB] p-0.5">
              {(["top", "new"] as Sort[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sort === s}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3 py-1 font-dm text-xs font-semibold ${sort === s ? "bg-white text-[#1B3A6B] shadow-sm" : "text-[#7A8FA6]"}`}
                >
                  {t(`pages.article.talk.sort.${s}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Composer slug={slug} data={data} onPosted={async (status, id) => {
            setFlash(
              status === "unconfirmed"
                ? { tone: "info", text: t("pages.article.talk.sent.confirm") }
                : status === "pending"
                  ? { tone: "info", text: t("pages.article.talk.sent.held") }
                  : { tone: "ok", text: t("pages.article.talk.sent.live") },
            );
            await load();
            if (id) setHighlight(id);
          }} onForget={load} />
        </div>

        {failed && !data && <p className="mt-5 font-dm text-sm text-[#7A8FA6]">{t("pages.article.talk.err.load")}</p>}
        {data && roots.length === 0 && (
          <p className="mt-6 rounded-2xl bg-[#F4F7FB] px-4 py-6 text-center font-dm text-sm text-[#7A8FA6]" data-testid="discussion-empty">
            {t("pages.article.talk.empty")}
          </p>
        )}
        <ul className="mt-6 space-y-5" data-testid="comment-list">
          {shownRoots.map((c) => (
            <li key={c.id}>
              <CommentItem
                c={c}
                data={data!}
                slug={slug}
                highlight={highlight}
                replies={replies.get(c.id) ?? []}
                reload={load}
                onFlash={setFlash}
                onPosted={(status, id) => {
                  if (status !== "published") setFlash({ tone: "info", text: t(status === "unconfirmed" ? "pages.article.talk.sent.confirm" : "pages.article.talk.sent.held") });
                  if (id) setHighlight(id);
                }}
              />
            </li>
          ))}
        </ul>
        {!allRoots && roots.length > RECENT_ROOTS && (
          <button
            type="button"
            onClick={() => setAllRoots(true)}
            className="mt-5 w-full rounded-full border border-[#D2DCE8] py-2.5 font-dm text-sm font-semibold text-[#1B3A6B] hover:border-[#2251A3]"
          >
            {t("pages.article.talk.showMore")} ({roots.length - RECENT_ROOTS})
          </button>
        )}
      </div>
    </section>
  );
}

function Reactions() {
  const t = useT();
  const locale = useLocale();
  const { data, react } = useEngage();
  const counts = data?.reactions.counts;
  const mine = data?.reactions.mine ?? null;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const pick = (k: (typeof REACTIONS)[number]) => void react(k);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-syne text-base font-bold text-[#0D1B2A]">{t("pages.article.talk.react.title")}</h2>
        {total > 0 && <span className="font-dm text-xs text-[#7A8FA6]">{total === 1 ? t("pages.article.talk.react.totalOne") : t("pages.article.talk.react.total", { n: total.toLocaleString(locale) })}</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={t("pages.article.talk.react.title")}>
        {REACTIONS.map((k) => {
          const on = mine === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              disabled={!data}
              onClick={() => pick(k)}
              data-testid={`react-${k}`}
              className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-2xl border px-2 py-2 font-dm text-[13px] font-semibold transition-colors sm:min-h-[48px] sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${
                on ? "border-[#F47C20] bg-[#FEF0E3] text-[#7A3E0E]" : "border-[#D2DCE8] bg-white text-[#3A4A5C] hover:border-[#2251A3]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-lg leading-none">{REACTION_EMOJI[k]}</span>
                {counts && counts[k] > 0 && <span className="rounded-full bg-[#F4F7FB] px-1.5 text-xs text-[#7A8FA6] sm:hidden">{counts[k]}</span>}
              </span>
              <span className="whitespace-nowrap leading-tight [overflow-wrap:normal]">{t(`pages.article.talk.react.${k}`)}</span>
              {counts && counts[k] > 0 && <span className="hidden rounded-full bg-[#F4F7FB] px-1.5 text-xs text-[#7A8FA6] sm:inline" data-testid={`react-count-${k}`}>{counts[k]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShareRow({ title }: { title: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  // The article's own address (without ?confirm= or a #comment anchor).
  useEffect(() => {
    const u = new URL(window.location.href);
    u.hash = "";
    u.searchParams.delete("confirm");
    setUrl(u.toString());
  }, []);
  const e = encodeURIComponent;
  const links = [
    { k: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${e(`${title} ${url}`)}`, cls: "bg-[#25D366] text-white" },
    { k: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`, cls: "bg-[#0A66C2] text-white" },
    { k: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${e(title)}&url=${e(url)}`, cls: "bg-[#0D1B2A] text-white" },
    { k: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`, cls: "bg-[#1877F2] text-white" },
  ];
  return (
    <div className="mt-6 border-t border-[#F4F7FB] pt-5">
      <p className="font-dm text-xs font-bold uppercase tracking-wide text-[#7A8FA6]">{t("pages.article.talk.share.title")}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {links.map((l) => (
          <a
            key={l.k}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            data-track={`article-share-${l.k}`}
            className={`inline-flex min-h-[40px] items-center rounded-full px-4 py-2 font-dm text-xs font-bold hover:opacity-90 ${l.cls}`}
          >
            {l.label}
          </a>
        ))}
        <button
          type="button"
          data-track="article-share-copy"
          onClick={() => {
            void navigator.clipboard?.writeText(url).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#D2DCE8] px-4 py-2 font-dm text-xs font-bold text-[#1B3A6B] hover:border-[#2251A3]"
        >
          {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? t("pages.article.talk.share.copied") : t("pages.article.talk.share.copy")}
        </button>
      </div>
    </div>
  );
}

function Composer({
  slug,
  data,
  parentId = null,
  autoFocus = false,
  onPosted,
  onCancel,
  onForget,
}: {
  slug: string;
  data: EngageData | null;
  parentId?: string | null;
  autoFocus?: boolean;
  onPosted: (status: string, id: string | null) => void | Promise<void>;
  onCancel?: () => void;
  onForget?: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [website, setWebsite] = useState("");
  const [open, setOpen] = useState(!!parentId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const started = useRef(Date.now());
  const viewer = data?.viewer ?? { kind: "anon" as const, name: null, canModerate: false };
  const anon = viewer.kind === "anon";
  const id = parentId ?? "root";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await postJson(`/api/blog/engage/post/${slug}/comments`, {
      body,
      parentId,
      locale,
      notify,
      newsletter,
      website,
      ts: started.current,
      ...(anon ? { name, email } : {}),
    });
    setBusy(false);
    if (!r.ok) {
      setError({ text: String(r.data.error ?? t("pages.article.talk.err.generic")), field: typeof r.data.field === "string" ? r.data.field : undefined });
      return;
    }
    setBody("");
    if (!parentId) setOpen(false);
    await onPosted(String(r.data.status ?? "published"), typeof r.data.id === "string" ? r.data.id : null);
  }

  async function forget() {
    await postJson("/api/blog/engage/forget", {});
    onForget?.();
  }

  const fieldCls = "w-full rounded-xl border border-[#D2DCE8] bg-white px-3.5 py-2.5 font-dm text-[15px] text-[#0D1B2A] placeholder:text-[#9AAABB] focus:border-[#2251A3] focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-3" data-testid={parentId ? "reply-form" : "comment-form"} noValidate>
      <label htmlFor={`c-body-${id}`} className="sr-only">{t("pages.article.talk.form.label")}</label>
      <textarea
        id={`c-body-${id}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setOpen(true)}
        autoFocus={autoFocus}
        maxLength={BODY_MAX}
        rows={open ? 4 : 2}
        placeholder={parentId ? t("pages.article.talk.form.replyPlaceholder") : t("pages.article.talk.form.placeholder")}
        aria-invalid={error?.field === "body" || undefined}
        className={`${fieldCls} resize-y`}
        data-testid="comment-body"
      />
      {/* Honeypot: hidden from people and screen readers. */}
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {open && (
        <>
          {body.length > BODY_MAX * 0.8 && (
            <p className="text-right font-dm text-xs text-[#7A8FA6]">{t("pages.article.talk.form.chars", { n: body.length, max: BODY_MAX })}</p>
          )}
          {anon ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`c-name-${id}`} className="mb-1 block font-dm text-xs font-semibold text-[#3A4A5C]">{t("pages.article.talk.form.name")}</label>
                <input id={`c-name-${id}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" aria-invalid={error?.field === "name" || undefined} className={fieldCls} data-testid="comment-name" />
              </div>
              <div>
                <label htmlFor={`c-email-${id}`} className="mb-1 block font-dm text-xs font-semibold text-[#3A4A5C]">{t("pages.article.talk.form.email")}</label>
                <input id={`c-email-${id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="email" inputMode="email" aria-invalid={error?.field === "email" || undefined} aria-describedby={`c-email-hint-${id}`} className={fieldCls} data-testid="comment-email" />
              </div>
              <p id={`c-email-hint-${id}`} className="font-dm text-xs text-[#7A8FA6] sm:col-span-2">{t("pages.article.talk.form.emailHint")}</p>
            </div>
          ) : (
            <p className="font-dm text-xs text-[#7A8FA6]" data-testid="comment-as">
              {t("pages.article.talk.form.as", { name: viewer.name ?? "" })}
              {viewer.kind === "verified" && (
                <>
                  {" · "}
                  <button type="button" onClick={forget} className="font-semibold text-[#2251A3] hover:underline">{t("pages.article.talk.form.notYou")}</button>
                </>
              )}
            </p>
          )}
          {viewer.kind !== "staff" && (
            <div className="flex flex-col gap-2 font-dm text-sm text-[#3A4A5C]">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-[#F47C20]" />
                {t("pages.article.talk.form.notify")}
              </label>
              {!parentId && (
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="h-4 w-4 accent-[#F47C20]" data-testid="comment-newsletter" />
                  {t("pages.article.talk.form.newsletter")}
                </label>
              )}
            </div>
          )}
          <p className="font-dm text-xs leading-relaxed text-[#7A8FA6]">{t("pages.article.talk.form.guidelines")}</p>
          {anon && !parentId && (
            <p className="font-dm text-xs text-[#7A8FA6]">
              <Link href={`/learn/login?next=${encodeURIComponent(`${pathname}#discussion`)}`} className="font-semibold text-[#2251A3] hover:underline">
                {t("pages.article.talk.form.signIn")}
              </Link>
            </p>
          )}
          {error && <p role="alert" className="font-dm text-sm text-red-700" data-testid="comment-error">{error.text}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={busy || body.trim().length < 2}
              data-testid="comment-submit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#1B3A6B] px-5 py-2.5 font-dm text-sm font-bold text-white hover:bg-[#2251A3] disabled:opacity-50"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {busy ? t("pages.article.talk.form.posting") : parentId ? t("pages.article.talk.form.submitReply") : t("pages.article.talk.form.submit")}
            </button>
            {(parentId || body) && (
              <button
                type="button"
                onClick={() => {
                  setBody("");
                  setError(null);
                  if (parentId) onCancel?.();
                  else setOpen(false);
                }}
                className="min-h-[44px] rounded-full px-4 font-dm text-sm font-semibold text-[#7A8FA6] hover:text-[#1B3A6B]"
              >
                {t("pages.article.talk.form.cancel")}
              </button>
            )}
          </div>
        </>
      )}
    </form>
  );
}

function CommentItem({
  c,
  data,
  slug,
  replies,
  highlight,
  reload,
  onFlash,
  onPosted,
  isReply = false,
}: {
  c: PublicComment;
  data: EngageData;
  slug: string;
  replies: PublicComment[];
  highlight: string | null;
  reload: () => Promise<unknown>;
  onFlash: (f: { tone: "ok" | "info" | "err"; text: string } | null) => void;
  onPosted: (status: string, id: string | null) => void;
  isReply?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [replying, setReplying] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [helpful, setHelpful] = useState({ n: c.helpful, on: c.voted });
  const [busy, setBusy] = useState(false);
  useEffect(() => setHelpful({ n: c.helpful, on: c.voted }), [c.helpful, c.voted]);

  if (c.status === "deleted") {
    return (
      <div id={`comment-${c.id}`}>
        <p className="rounded-xl bg-[#F4F7FB] px-4 py-3 font-dm text-sm italic text-[#7A8FA6]">{t("pages.article.talk.deleted")}</p>
        {renderReplies()}
      </div>
    );
  }

  async function vote() {
    if (busy) return;
    setBusy(true);
    setHelpful((h) => ({ n: h.n + (h.on ? -1 : 1), on: !h.on }));
    const r = await postJson(`/api/blog/engage/comment/${c.id}`, { action: "helpful" });
    setBusy(false);
    if (r.ok) setHelpful({ n: Number(r.data.helpful ?? 0), on: !!r.data.voted });
    else setHelpful({ n: c.helpful, on: c.voted });
  }

  async function report(reason: string) {
    setReporting(false);
    await postJson(`/api/blog/engage/comment/${c.id}`, { action: "report", reason });
    onFlash({ tone: "info", text: t("pages.article.talk.report.thanks") });
  }

  async function remove() {
    if (!window.confirm(t("pages.article.talk.delete.confirm"))) return;
    const r = await postJson(`/api/blog/engage/comment/${c.id}`, { action: "delete" });
    if (r.ok) await reload();
  }

  async function moderate(action: "pin" | "unpin" | "hide") {
    if (action === "hide" && !window.confirm(t("pages.article.talk.mod.confirmHide"))) return;
    const r = await postJson(`/api/admin/blog/comments/${c.id}`, { action });
    if (r.ok) await reload();
    else onFlash({ tone: "err", text: String(r.data.error ?? t("pages.article.talk.err.generic")) });
  }

  function renderReplies() {
    if (isReply || replies.length === 0) return null;
    const shown = showAll || replies.length <= REPLIES_SHOWN ? replies : replies.slice(0, REPLIES_SHOWN);
    return (
      <ul className="mt-4 space-y-4 border-l-2 border-[#EBF0FA] pl-4 sm:pl-6">
        {shown.map((r) => (
          <li key={r.id}>
            <CommentItem c={r} data={data} slug={slug} replies={[]} highlight={highlight} reload={reload} onFlash={onFlash} onPosted={onPosted} isReply />
          </li>
        ))}
        {!showAll && replies.length > REPLIES_SHOWN && (
          <li>
            <button type="button" onClick={() => setShowAll(true)} className="font-dm text-sm font-semibold text-[#2251A3] hover:underline">
              {t("pages.article.talk.showReplies", { n: replies.length - REPLIES_SHOWN })}
            </button>
          </li>
        )}
      </ul>
    );
  }

  const actionCls = "inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 font-dm text-xs font-semibold text-[#7A8FA6] hover:bg-[#F4F7FB] hover:text-[#1B3A6B]";
  const avatar = c.kind === "staff" ? "bg-[#F47C20]" : c.kind === "learner" ? "bg-[#2251A3]" : "bg-[#1B3A6B]";

  return (
    <article
      id={`comment-${c.id}`}
      data-testid="comment"
      data-id={c.id}
      className={`scroll-mt-44 rounded-2xl transition-colors ${highlight === c.id ? "bg-[#FEF0E3]/60 ring-2 ring-[#F47C20]/40 p-3 -m-3" : ""}`}
    >
      <div className="flex gap-3">
        <div aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatar}`}>
          {c.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-dm text-sm font-bold text-[#0D1B2A]" data-testid="comment-name-shown">{c.name}</span>
            {c.isAuthor && <span className="rounded-full bg-[#F47C20] px-2 py-0.5 font-dm text-[11px] font-bold text-white">{t("pages.article.talk.badge.author")}</span>}
            {c.kind === "staff" && <span className="rounded-full bg-[#1B3A6B] px-2 py-0.5 font-dm text-[11px] font-bold text-white">{t("pages.article.talk.badge.team")}</span>}
            {c.kind === "learner" && <span className="rounded-full bg-[#EBF0FA] px-2 py-0.5 font-dm text-[11px] font-bold text-[#2251A3]">{t("pages.article.talk.badge.learner")}</span>}
            {c.pinned && (
              <span className="inline-flex items-center gap-1 font-dm text-[11px] font-bold text-[#B8500A]">
                <Pin size={11} /> {t("pages.article.talk.badge.pinned")}
              </span>
            )}
            <time dateTime={c.createdAt} className="font-dm text-xs text-[#7A8FA6]">{timeAgo(c.createdAt, locale)}</time>
          </div>
          {c.status === "pending" && (
            <p className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 font-dm text-[11px] font-semibold text-amber-800" data-testid="comment-pending">{t("pages.article.talk.badge.pending")}</p>
          )}
          <p className="mt-1.5 whitespace-pre-line break-words font-dm text-[15px] leading-relaxed text-[#1E2D3D]" data-testid="comment-text">{c.body}</p>
          {c.status === "published" && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1 -ml-2.5">
              <button type="button" onClick={vote} aria-pressed={helpful.on} className={`${actionCls} ${helpful.on ? "text-[#F47C20]" : ""}`} data-testid="comment-helpful">
                <ThumbsUp size={14} className={helpful.on ? "fill-current" : ""} /> {t("pages.article.talk.helpful")}
                {helpful.n > 0 && <span data-testid="comment-helpful-count">· {helpful.n}</span>}
              </button>
              <button type="button" onClick={() => setReplying((r) => !r)} className={actionCls} data-testid="comment-reply">
                <MessageCircle size={14} /> {t("pages.article.talk.reply")}
              </button>
              {!c.mine && (
                <button type="button" onClick={() => setReporting((r) => !r)} aria-expanded={reporting} className={actionCls} data-testid="comment-report">
                  <Flag size={13} /> {t("pages.article.talk.report")}
                </button>
              )}
              {c.mine && (
                <button type="button" onClick={remove} className={actionCls} data-testid="comment-delete">
                  <Trash2 size={13} /> {t("pages.article.talk.delete")}
                </button>
              )}
              {data.viewer.canModerate && (
                <>
                  {!isReply && (
                    <button type="button" onClick={() => moderate(c.pinned ? "unpin" : "pin")} className={actionCls} data-testid="comment-pin">
                      <Pin size={13} /> {t(c.pinned ? "pages.article.talk.mod.unpin" : "pages.article.talk.mod.pin")}
                    </button>
                  )}
                  <button type="button" onClick={() => moderate("hide")} className={actionCls} data-testid="comment-hide">
                    <EyeOff size={13} /> {t("pages.article.talk.mod.hide")}
                  </button>
                </>
              )}
            </div>
          )}
          {c.mine && c.status === "pending" && (
            <button type="button" onClick={remove} className={`${actionCls} -ml-2.5 mt-1`} data-testid="comment-delete">
              <Trash2 size={13} /> {t("pages.article.talk.delete")}
            </button>
          )}
          {reporting && (
            <div role="group" aria-label={t("pages.article.talk.report.title")} className="mt-2 rounded-xl border border-[#D2DCE8] bg-[#F4F7FB] p-3" data-testid="report-menu">
              <p className="font-dm text-xs font-semibold text-[#3A4A5C]">{t("pages.article.talk.report.title")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["spam", "abuse", "offtopic", "other"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => report(r)} className="min-h-[36px] rounded-full border border-[#D2DCE8] bg-white px-3 font-dm text-xs font-semibold text-[#1B3A6B] hover:border-[#2251A3]" data-testid={`report-${r}`}>
                    {t(`pages.article.talk.report.${r}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {replying && (
            <div className="mt-3">
              <Composer
                slug={slug}
                data={data}
                parentId={c.parentId ?? c.id}
                autoFocus
                onCancel={() => setReplying(false)}
                onPosted={async (status, id) => {
                  setReplying(false);
                  await reload();
                  onPosted(status, id);
                }}
              />
            </div>
          )}
        </div>
      </div>
      {renderReplies()}
    </article>
  );
}
