"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

// Parent & Sponsor Portal client pieces (/portal and its sign-in pages).
// Every rule is checked again on the server (app/api/portal/*).

const btn = "inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50";
const btn2 = "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] hover:bg-[var(--s2)] disabled:opacity-50";
const input = "mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";

async function post(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const data = res ? ((await res.json().catch(() => ({}))) as Record<string, unknown>) : {};
  return { ok: !!res?.ok, data };
}

function Status({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
      {msg.text}
    </p>
  );
}

export function PortalLogin() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await post("/api/portal/login", { email });
        setBusy(false);
        setMsg({ ok: r.ok, text: String(r.data.message ?? r.data.error ?? t("learn.parent.err.failed")) });
      }}
    >
      <label className="block text-sm font-semibold text-[var(--ink)]">
        {t("learn.portal.login.email")}
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} data-testid="portal-email" autoComplete="email" />
      </label>
      <Status msg={msg} />
      <button type="submit" disabled={busy} className={`${btn} w-full`} data-testid="portal-login-submit">
        {t("learn.portal.login.cta")}
      </button>
    </form>
  );
}

export function PortalLogout() {
  const t = useT();
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-xs font-semibold text-[var(--ink3)] underline"
      onClick={async () => {
        await post("/api/portal/logout", {});
        router.refresh();
      }}
    >
      {t("learn.portal.signOut")}
    </button>
  );
}

/** /portal/signin: one click uses the emailed link (scanners do not click). */
export function PortalSignin({ token }: { token: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="mt-4 space-y-3">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        disabled={busy}
        className={`${btn} w-full`}
        data-testid="portal-signin"
        onClick={async () => {
          setBusy(true);
          const r = await post("/api/portal/verify", { token });
          if (!r.ok) {
            setError(String(r.data.error ?? t("learn.parent.err.failed")));
            setBusy(false);
            return;
          }
          window.location.href = String(r.data.next ?? "/portal");
        }}
      >
        {t("learn.portal.signin.cta")}
      </button>
      <p className="text-center text-xs text-[var(--ink3)]">
        <Link href="/portal" className="underline">{t("learn.portal.signin.newLink")}</Link>
      </p>
    </div>
  );
}

export function PortalUnsubscribe({ g, s }: { g: string; s: string }) {
  const t = useT();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="mt-4 space-y-3">
      <Status msg={msg} />
      {!msg?.ok && (
        <button
          type="button"
          className={btn}
          data-testid="portal-unsubscribe"
          onClick={async () => {
            const r = await post("/api/portal/unsubscribe", { g, s });
            setMsg({ ok: r.ok, text: String(r.data.message ?? r.data.error ?? "") });
          }}
        >
          {t("learn.portal.unsubscribe.cta")}
        </button>
      )}
    </div>
  );
}

/** On a child's parent dashboard: open the portal with all the parent's children. */
export function FamilyPortalButton({ token }: { token: string }) {
  const t = useT();
  return (
    <button
      type="button"
      className={btn2}
      data-testid="parent-open-portal"
      onClick={async () => {
        const r = await post("/api/portal/from-token", { token });
        if (r.ok) window.location.href = "/portal";
      }}
    >
      {t("learn.portal.openFromParent")}
    </button>
  );
}

export function PortalChildActions(props: {
  studentId: string;
  firstName: string;
  role: "parent" | "sponsor";
  canEncourage: boolean;
  openEncourage: boolean;
  presets: Array<{ key: string; text: string }>;
  sponsors: Array<{ id: string; email: string; name: string | null }>;
  dashboardHref: string | null;
  weeklyOptOut: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(props.openEncourage && props.canEncourage);
  const [preset, setPreset] = useState<string>(props.presets[0]?.key ?? "1");
  const [own, setOwn] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sEmail, setSEmail] = useState("");
  const [sName, setSName] = useState("");
  const [weeklyOff, setWeeklyOff] = useState(props.weeklyOptOut);
  const id = props.studentId;

  async function run(url: string, body: unknown, refresh = false) {
    setBusy(true);
    setMsg(null);
    const r = await post(url, body);
    setBusy(false);
    setMsg({ ok: r.ok, text: String(r.data.message ?? r.data.error ?? t("learn.parent.err.failed")) });
    if (r.ok && refresh) router.refresh();
    return r.ok;
  }

  return (
    <div className="space-y-4 border-t border-[var(--border)] pt-4">
      <Status msg={msg} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {props.canEncourage && (
          <button type="button" className={btn} onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid={`portal-encourage-${id}`}>
            {t("learn.portal.encourage.button", { name: props.firstName })}
          </button>
        )}
        {props.dashboardHref && (
          <Link href={props.dashboardHref} className={btn2} data-testid={`portal-settings-${id}`}>
            {t("learn.portal.settings")}
          </Link>
        )}
      </div>

      {open && (
        <fieldset className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--s2)] p-4" data-testid={`portal-encourage-panel-${id}`}>
          <legend className="px-1 text-sm font-bold text-[var(--ink)]">{t("learn.portal.encourage.pick")}</legend>
          {props.presets.map((p) => (
            <label key={p.key} className="flex cursor-pointer items-start gap-2 text-sm text-[var(--ink)]">
              <input type="radio" name={`enc-${id}`} checked={!own && preset === p.key} onChange={() => { setPreset(p.key); setOwn(""); }} className="mt-1 h-4 w-4 shrink-0" />
              <span>{p.text}</span>
            </label>
          ))}
          <label className="block pt-2 text-sm font-semibold text-[var(--ink)]">
            {t("learn.portal.encourage.own")}
            <textarea value={own} onChange={(e) => setOwn(e.target.value.slice(0, 300))} maxLength={300} rows={3} className={input} data-testid={`portal-encourage-text-${id}`} />
            <span className="mt-1 block text-xs font-normal text-[var(--ink3)]">{t("learn.portal.encourage.ownHint", { n: 300 - own.length })}</span>
          </label>
          <button
            type="button"
            disabled={busy}
            className={btn}
            data-testid={`portal-encourage-send-${id}`}
            onClick={async () => {
              const ok = await run("/api/portal/encourage", own.trim() ? { studentId: id, text: own } : { studentId: id, preset });
              if (ok) setOwn("");
            }}
          >
            {t("learn.portal.encourage.send")}
          </button>
        </fieldset>
      )}

      {props.role === "parent" && (
        <div className="space-y-2" data-testid={`portal-sponsors-${id}`}>
          <h3 className="text-sm font-bold text-[var(--ink)]">{t("learn.portal.sponsor.title")}</h3>
          <p className="text-xs leading-relaxed text-[var(--ink3)]">{t("learn.portal.sponsor.hint", { name: props.firstName })}</p>
          {props.sponsors.length > 0 && (
            <ul className="divide-y divide-[var(--border)] text-sm">
              {props.sponsors.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0 break-all text-[var(--ink)]">{s.name ? `${s.name} · ` : ""}{s.email}</span>
                  <button type="button" className="text-xs font-bold text-red-700 underline" disabled={busy} onClick={() => run("/api/portal/sponsors", { action: "remove", studentId: id, guardianId: s.id }, true)}>
                    {t("learn.portal.sponsor.remove")}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {props.canEncourage ? (
            <form
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await run("/api/portal/sponsors", { action: "add", studentId: id, email: sEmail, ...(sName.trim() ? { name: sName } : {}) }, true)) {
                  setSEmail("");
                  setSName("");
                }
              }}
            >
              <label className="block text-xs font-semibold text-[var(--ink2)]">
                {t("learn.portal.sponsor.email")}
                <input type="email" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} className={input} data-testid={`portal-sponsor-email-${id}`} />
              </label>
              <label className="block text-xs font-semibold text-[var(--ink2)]">
                {t("learn.portal.sponsor.name")}
                <input value={sName} maxLength={40} onChange={(e) => setSName(e.target.value)} className={input} placeholder={t("learn.portal.sponsor.namePlaceholder")} />
              </label>
              <button type="submit" disabled={busy} className={btn2} data-testid={`portal-sponsor-add-${id}`}>
                {t("learn.portal.sponsor.add")}
              </button>
            </form>
          ) : null}
        </div>
      )}

      {props.role === "sponsor" && (
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={!weeklyOff}
            disabled={busy}
            className="mt-1 h-5 w-5 shrink-0"
            data-testid={`portal-weekly-${id}`}
            onChange={async (e) => {
              const off = !e.target.checked;
              setWeeklyOff(off);
              if (!(await run("/api/portal/weekly", { studentId: id, optOut: off }))) setWeeklyOff(!off);
            }}
          />
          <span className="text-sm text-[var(--ink)]">{t("learn.portal.weekly.label", { name: props.firstName })}</span>
        </label>
      )}
    </div>
  );
}
