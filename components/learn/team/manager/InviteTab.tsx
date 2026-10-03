"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";
import { parseInviteRows } from "@/lib/learn/team/config";
import { Pill, TrackPicker, call, cls, type DashCtx, type LinkView } from "./ui";

type PreviewStatus = "new" | "member" | "invited" | "full" | "invalid" | "duplicate";
interface PreviewRow {
  email: string;
  name: string | null;
  status: PreviewStatus;
}

const LANGS = ["en", "fr"] as const;

/**
 * Invite: paste addresses or a CSV (names optional), choose the role, tracks
 * to assign and a due date, preview who will be invited (duplicates, invalid
 * addresses and the seat limit flagged), then send. Plus the owner's
 * domain-restricted team join link.
 */
export default function InviteTab({ ctx, link }: { ctx: DashCtx; link: LinkView | null }) {
  const t = useT();
  const { report, busy, run, isOwner, locale } = ctx;
  const [text, setText] = useState("");
  const [role, setRole] = useState<"member" | "manager">("member");
  const [tracks, setTracks] = useState<string[]>([]);
  const [due, setDue] = useState("");
  const [lang, setLang] = useState<string>(LANGS.includes(locale as (typeof LANGS)[number]) ? locale : "en");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [fileNote, setFileNote] = useState("");

  const parsed = useMemo(() => parseInviteRows(text), [text]);
  const valid = parsed.filter((r) => !r.problem);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 200_000) return setFileNote(t("team.invite.fileTooBig"));
    const body = await f.text();
    setText((x) => (x.trim() ? `${x.trim()}\n${body}` : body));
    setFileNote(t("team.invite.fileLoaded", { name: f.name }));
    setPreview(null);
  };

  const body = () => ({
    invites: valid.map((r) => ({ email: r.email, name: r.name })),
    role,
    trackIds: tracks,
    dueAt: due || null,
    locale: lang,
  });

  const doPreview = () =>
    run(
      "preview",
      async () => {
        if (valid.length === 0) {
          setPreview(parsed.map((r) => ({ email: r.email, name: r.name, status: r.problem ?? "invalid" })));
          return;
        }
        const d = await call<{ results: PreviewRow[] }>("/api/learn/team/invites", "POST", { ...body(), preview: true });
        const server = new Map(d.results.map((r) => [r.email, r]));
        setPreview(
          parsed.map((r) => (r.problem ? { email: r.email, name: r.name, status: r.problem } : server.get(r.email) ?? { email: r.email, name: r.name, status: "invalid" })),
        );
      },
      { refresh: false },
    );

  const send = () =>
    run("invite", async () => {
      const d = await call<{ results: Array<{ email: string; ok: boolean; reason?: string }>; emailFailures: number }>("/api/learn/team/invites", "POST", body());
      const sent = d.results.filter((r) => r.ok).length;
      const notes = d.results.filter((r) => !r.ok).map((r) => `${r.email} (${t(`team.invite.reason.${r.reason}`)})`);
      const left = d.results.filter((r) => !r.ok && r.reason === "full").map((r) => r.email);
      setText(left.join("\n"));
      setPreview(null);
      return [t(sent === 1 ? "team.invite.sent.one" : "team.invite.sent.other", { n: sent }), ...notes, d.emailFailures ? t("team.invite.emailFailures", { n: d.emailFailures }) : ""]
        .filter(Boolean)
        .join(" · ");
    });

  const willInvite = preview?.filter((r) => r.status === "new").length ?? 0;
  const statusTone = (s: PreviewStatus) => (s === "new" ? "green" : s === "full" || s === "invalid" ? "red" : "amber");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className={cls.card} aria-labelledby="invite-title">
        <h2 id="invite-title" className={cls.h2}>{t("team.invite.title")}</h2>
        <p className={cls.hint}>{t("team.invite.body2")}</p>
        <p className="mt-2 text-xs font-semibold text-[var(--ink2)]">{t(ctx.free === 1 ? "team.dash.free.one" : "team.dash.free.other", { n: ctx.free })}</p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="invite-emails" className={cls.label}>{t("team.invite.label2")}</label>
            <textarea
              id="invite-emails"
              rows={5}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPreview(null);
              }}
              placeholder={"ana@company.com\nSam Lee, sam@company.com"}
              className={`${cls.input} font-mono`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--ink3)]">
              <label className={`${cls.btn} cursor-pointer`}>
                <input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
                {t("team.invite.upload")}
              </label>
              <span aria-live="polite">
                {fileNote ||
                  (parsed.length
                    ? t("team.invite.parsed", { n: valid.length, bad: parsed.length - valid.length })
                    : t("team.invite.formats"))}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="invite-role" className={cls.label}>{t("team.invite.role")}</label>
              <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as "member" | "manager")} className={cls.input}>
                <option value="member">{t("team.role.member")}</option>
                {isOwner && <option value="manager">{t("team.role.manager")}</option>}
              </select>
            </div>
            <div>
              <label htmlFor="invite-lang" className={cls.label}>{t("team.invite.lang")}</label>
              <select id="invite-lang" value={lang} onChange={(e) => setLang(e.target.value)} className={cls.input}>
                {LANGS.map((l) => (
                  <option key={l} value={l}>{t(`team.lang.${l}`)}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[var(--ink3)]">{t("team.invite.langHint")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <TrackPicker id="invite-tracks" tracks={report.tracks} titles={ctx.titles} value={tracks} onChange={setTracks} legend={t("team.invite.tracks")} />
            <div>
              <label htmlFor="invite-due" className={cls.label}>{t("team.assign.due")}</label>
              <input id="invite-due" type="date" value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} className={cls.input} disabled={tracks.length === 0} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={cls.btn} disabled={busy !== null || parsed.length === 0} onClick={() => void doPreview()}>
              {busy === "preview" ? t("team.busy") : t("team.invite.preview")}
            </button>
            <button type="button" className={cls.primary} disabled={busy !== null || valid.length === 0 || !ctx.team.entitled} onClick={() => void send()}>
              {busy === "invite"
                ? t("team.busy")
                : t(valid.length === 1 ? "team.invite.sendN.one" : "team.invite.sendN.other", { n: preview ? willInvite : valid.length })}
            </button>
          </div>
          {valid.length > ctx.free && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t("team.invite.overSeats", { n: valid.length, free: ctx.free })}{" "}
              {isOwner && (
                <button type="button" className="font-semibold underline" onClick={() => ctx.goTab("billing")}>{t("team.invite.addSeats")}</button>
              )}
            </p>
          )}
        </div>

        {preview && (
          <div className="mt-5">
            <h3 className="text-sm font-bold text-[var(--ink)]">{t("team.invite.previewTitle", { n: willInvite })}</h3>
            <ul className="mt-2 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
              {preview.map((r, i) => (
                <li key={`${r.email}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[var(--ink)]">{r.email}</span>
                    {r.name && <span className="block truncate text-xs text-[var(--ink3)]">{r.name}</span>}
                  </span>
                  <Pill tone={statusTone(r.status)}>{t(`team.invite.status.${r.status}`)}</Pill>
                </li>
              ))}
            </ul>
            {tracks.length > 0 && (
              <p className="mt-2 text-xs text-[var(--ink2)]">
                {t("team.invite.willAssign", { tracks: tracks.map((id) => ctx.titles[id]).join(", ") })}
                {due ? ` · ${t("team.assign.dueOn", { date: fmtDate(`${due}T12:00:00Z`, locale) })}` : ""}
              </p>
            )}
          </div>
        )}
      </section>

      <TeamLinkCard ctx={ctx} link={link} />
    </div>
  );
}

function TeamLinkCard({ ctx, link }: { ctx: DashCtx; link: LinkView | null }) {
  const t = useT();
  const { busy, run, isOwner, locale } = ctx;
  const [domain, setDomain] = useState(link?.domain ?? "");
  const [tracks, setTracks] = useState<string[]>(link?.trackIds ?? []);
  const [due, setDue] = useState(link?.dueAt?.slice(0, 10) ?? "");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(!link);

  const save = () =>
    run("link", async () => {
      await call("/api/learn/team/link", "POST", { domain, trackIds: tracks, dueAt: due || null });
      setEditing(false);
      return t(link ? "team.link.rotated" : "team.link.created");
    });
  const off = () => {
    if (!window.confirm(t("team.link.confirmOff"))) return;
    void run("link-off", async () => {
      await call("/api/learn/team/link", "DELETE");
      setEditing(true);
      return t("team.link.turnedOff");
    });
  };
  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className={cls.card} aria-labelledby="link-title">
      <h2 id="link-title" className={cls.h2}>{t("team.link.title")}</h2>
      <p className={cls.hint}>{t("team.link.body")}</p>

      {link && (
        <div className="mt-4 space-y-2">
          <label htmlFor="team-link-url" className={cls.label}>{t("team.link.url")}</label>
          <div className="flex gap-2">
            <input id="team-link-url" readOnly value={link.url} className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 text-xs" onFocus={(e) => e.target.select()} />
            <button type="button" className={cls.btn} onClick={() => void copy()}>{copied ? t("team.link.copied") : t("team.link.copy")}</button>
          </div>
          <p className="text-xs text-[var(--ink2)]">
            {t("team.link.onlyDomain", { domain: link.domain })}
            {link.trackIds.length ? ` · ${t("team.invite.willAssign", { tracks: link.trackIds.map((id) => ctx.titles[id] ?? "").filter(Boolean).join(", ") })}` : ""}
            {link.dueAt ? ` · ${t("team.assign.dueOn", { date: fmtDate(link.dueAt, locale) })}` : ""}
          </p>
        </div>
      )}

      {isOwner ? (
        editing ? (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="link-domain" className={cls.label}>{t("team.link.domain")}</label>
              <div className="mt-1.5 flex items-center rounded-lg border border-[var(--border)] bg-white">
                <span className="pl-3 text-sm text-[var(--ink3)]">@</span>
                <input id="link-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="company.com" className="h-10 min-w-0 flex-1 rounded-lg px-1 text-sm outline-none" autoComplete="off" />
              </div>
              <p className="mt-1 text-[11px] text-[var(--ink3)]">{t("team.link.domainHint")}</p>
            </div>
            <TrackPicker id="link-tracks" tracks={ctx.report.tracks} titles={ctx.titles} value={tracks} onChange={setTracks} legend={t("team.invite.tracks")} />
            <div>
              <label htmlFor="link-due" className={cls.label}>{t("team.assign.due")}</label>
              <input id="link-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className={cls.input} disabled={tracks.length === 0} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={cls.primary} disabled={busy !== null || !domain.trim() || !ctx.team.entitled} onClick={() => void save()}>
                {busy === "link" ? t("team.busy") : link ? t("team.link.saveRotate") : t("team.link.create")}
              </button>
              {link && <button type="button" className={cls.btn} onClick={() => setEditing(false)}>{t("team.link.cancel")}</button>}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={cls.btn} onClick={() => setEditing(true)}>{t("team.link.change")}</button>
            <button type="button" className={`${cls.btn} text-red-700`} disabled={busy !== null} onClick={off}>{t("team.link.off")}</button>
          </div>
        )
      ) : (
        !link && <p className="mt-3 text-xs text-[var(--ink3)]">{t("team.link.ownerOnly")}</p>
      )}

      <ul className="mt-5 space-y-1.5 rounded-xl bg-[var(--s2)] p-4 text-xs text-[var(--ink2)]">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex gap-2">
            <span aria-hidden="true" className="font-bold text-[var(--orange)]">✓</span>
            {t(`team.link.rule.${n}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}
