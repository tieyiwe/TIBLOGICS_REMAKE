import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { loadVerifiedBadge, type BadgeVerification } from "@/lib/learn/skill-badges/engine";
import { badgeUrl, readCredential } from "@/lib/learn/skill-badges/credential";
import BadgeShareActions from "@/components/learn/badges/BadgeShareActions";
import { fmtDate } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";

// Public verification page for a skill badge. No sign-in. The signature is
// checked server-side on every view (lib/learn/skill-badges/engine.ts), and
// what is shown comes from the signed credential itself, so an altered badge
// shows as not valid. Indexable so it can be shared, unless private.
export const dynamic = "force-dynamic";

const load = cache((id: string) => loadVerifiedBadge(id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [b, t] = await Promise.all([load(id), getT()]);
  if (!b) return { title: t("badges.verify.notFoundMeta"), robots: { index: false } };
  if (!b.award.isPublic) return { title: t("badges.verify.privateMeta"), robots: { index: false } };
  const v = readCredential(b.credential);
  const vars = { badge: v.achievementName || b.award.name, name: v.displayName ?? "" };
  return {
    title: t("badges.verify.metaTitle", vars),
    description: t("badges.verify.metaDescription", vars),
    robots: b.status === "verified" ? undefined : { index: false },
    alternates: { canonical: `/badges/${id}` },
    openGraph: { type: "website", title: t("badges.verify.metaTitle", vars), description: t("badges.verify.metaDescription", vars), url: `/badges/${id}` },
    twitter: { card: "summary_large_image" },
  };
}

const BANNER: Record<BadgeVerification, { cls: string; icon: string }> = {
  verified: { cls: "border-green-200 bg-green-50 text-green-800", icon: "✓" },
  unsigned: { cls: "border-amber-200 bg-amber-50 text-amber-900", icon: "!" },
  invalid: { cls: "border-red-300 bg-red-50 text-red-800", icon: "✕" },
  unknown_key: { cls: "border-amber-200 bg-amber-50 text-amber-900", icon: "?" },
  revoked: { cls: "border-red-300 bg-red-50 text-red-800", icon: "⚠" },
};

function Notice({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[var(--s2)] px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
        <span aria-hidden="true" className="text-4xl">{icon}</span>
        <h1 className="mt-4 text-xl font-black text-[var(--ink)]">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{body}</p>
      </div>
    </div>
  );
}

export default async function VerifyBadgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [b, t, locale] = await Promise.all([load(id), getT(), getLocale()]);

  if (!b) return <Notice icon="🔍" title={t("badges.verify.notFound")} body={t("badges.verify.notFoundBody")} />;
  if (!b.award.isPublic) return <Notice icon="🔒" title={t("badges.verify.private")} body={t("badges.verify.privateBody")} />;

  const v = readCredential(b.credential);
  const banner = BANNER[b.status];
  const issued = v.issuanceDate ? fmtDate(v.issuanceDate, locale, true) : "";
  const name = v.achievementName || b.award.name;
  const familyLabel = t(`badges.family.${b.award.family}`);
  const url = badgeUrl(id);
  const checkedAt = new Date().toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";

  return (
    <div className="bg-[var(--s2)] px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div role="status" className={`rounded-xl border px-4 py-3 text-sm font-bold ${banner.cls}`} data-badge-status={b.status}>
          <span aria-hidden="true" className="mr-1.5">{banner.icon}</span>
          {t(`badges.verify.status.${b.status}`)}
          {b.status === "revoked" && <span className="mt-1 block text-xs font-medium">{t("badges.verify.revokedBody")}</span>}
        </div>

        <article className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <div className="h-2 bg-gradient-to-r from-[#1B3A6B] to-[#F47C20]" />
          <div className="grid gap-6 p-6 sm:grid-cols-[200px_1fr] sm:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/badges/${id}/image`}
              alt={name}
              width={200}
              height={200}
              className={`mx-auto h-[200px] w-[200px] ${b.status === "revoked" || b.status === "invalid" ? "opacity-50 grayscale" : ""}`}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F47C20]">{familyLabel}</p>
              <h1 className="mt-1 text-2xl font-black text-[#1B3A6B] sm:text-3xl">{name}</h1>
              {v.description && <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{v.description}</p>}
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--ink3)]">{t("badges.verify.earnedBy")}</dt>
                  <dd className="mt-0.5 font-bold text-[var(--ink)]">{v.displayName ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--ink3)]">{t("badges.verify.issued")}</dt>
                  <dd className="mt-0.5 font-bold text-[var(--ink)]">{issued}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--ink3)]">{t("badges.verify.issuer")}</dt>
                  <dd className="mt-0.5 font-bold text-[var(--ink)]">
                    AR<span className="text-[#F47C20]">FA</span>, {t("badges.verify.issuerName")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--ink3)]">{t("badges.verify.credentialId")}</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs text-[var(--ink)]">{id}</dd>
                </div>
              </dl>
            </div>
          </div>
        </article>

        {b.status !== "revoked" && b.status !== "invalid" && (
          <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="mb-3 text-sm font-bold text-[var(--ink)]">{t("badges.verify.share")}</h2>
            <BadgeShareActions awardId={id} name={name} issuedAt={v.issuanceDate ?? b.award.issuedAt.toISOString()} url={url} canDownload />
          </section>
        )}

        <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("badges.verify.criteria")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{v.criteria}</p>

          {v.evidence.length > 0 && (
            <>
              <h2 className="mt-6 text-sm font-bold text-[var(--ink)]">{t("badges.verify.evidence")}</h2>
              <p className="mt-1 text-xs text-[var(--ink3)]">{t("badges.verify.evidenceNote")}</p>
              <ul className="mt-3 space-y-2">
                {v.evidence.map((e, i) => (
                  <li key={i} className="rounded-lg bg-[var(--s2)] px-3 py-2 text-sm">
                    <span className="font-semibold text-[var(--ink)]">✓ {e.name}</span>
                    <span className="block text-xs text-[var(--ink2)]">{e.description}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {v.alignments.length > 0 && (
            <>
              <h2 className="mt-6 text-sm font-bold text-[var(--ink)]">{t("badges.verify.alignment")}</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {v.alignments.map((a, i) => (
                  <li key={i}>
                    <a href={a.targetUrl} className="inline-block rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[#1B3A6B] hover:border-[#1B3A6B]">
                      {a.targetName}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t("badges.verify.how")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("badges.verify.howBody")}</p>
          <ul className="mt-3 space-y-1 text-xs text-[var(--ink3)]">
            <li data-signature={b.signatureValid ? "valid" : "invalid"}>
              {b.signatureValid ? `✓ ${t("badges.verify.signatureOk")}` : `✕ ${t("badges.verify.signatureBad")}`}
              {b.reason ? ` (${b.reason})` : ""}
            </li>
            <li>{t("badges.verify.checkedAt", { date: checkedAt })}</li>
            <li>
              <a href="/.well-known/did.json" className="font-semibold text-[#1B3A6B] underline">
                {t("badges.verify.didDoc")}
              </a>
            </li>
          </ul>
        </section>

        <p className="mt-8 text-center text-sm text-[var(--ink3)]">
          <Link href="/learning-box" className="font-semibold text-[var(--blue2)] underline">
            {t("badges.verify.explore")} →
          </Link>
        </p>
      </div>
    </div>
  );
}
