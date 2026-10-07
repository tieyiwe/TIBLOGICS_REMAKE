import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtDate } from "@/lib/learn/format";
import { localTitles } from "@/lib/learn/team/titles";
import { previewOffer } from "@/lib/learn/scholarship/service";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import ScholarSeal from "@/components/learn/scholarship/ScholarSeal";
import { AcceptScholarshipButton, SignOutBack } from "@/components/learn/scholarship/ScholarshipActions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.scholar.claim.metaTitle"), robots: { index: false, follow: false } };
}

// The link in the congratulations email. Outside /learn so someone without an
// account can read it: they create an account with the awarded address (or
// sign in), come back here and accept. Once accepted it leads to /scholarship.
export default async function ScholarshipOfferPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [offer, student, t, locale] = await Promise.all([previewOffer(token), getStudent(), getT(), getLocale()]);
  const here = `/scholarship/${token}`;

  if (offer && student && offer.status === "claimed" && offer.studentId === student.id) redirect("/scholarship");

  const tracks = offer?.trackIds.length
    ? await localTitles(locale, offer.trackIds).then((x) => offer.trackIds.map((id) => x.map[id]).filter((v): v is string => !!v)).catch(() => [])
    : [];

  let body: React.ReactNode;
  if (!offer) body = <p className="text-sm text-[var(--ink2)]">{t("learn.scholar.claim.invalid")}</p>;
  else if (offer.status === "claimed") body = <p className="text-sm text-[var(--ink2)]">{t("learn.scholar.claim.taken")}</p>;
  else if (offer.expired) {
    body = <p className="text-sm text-[var(--ink2)]">{t("learn.scholar.claim.expired", { date: offer.expiresAt ? fmtDate(offer.expiresAt, locale, true) : "" })}</p>;
  } else if (!student) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink2)]">{t("learn.scholar.claim.signedOut", { email: offer.email })}</p>
        <Link
          href={`/learn/signup?next=${encodeURIComponent(here)}&email=${encodeURIComponent(offer.email)}`}
          className="block w-full rounded-full bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-5 py-3.5 text-center text-sm font-black text-[#131A1B] hover:brightness-105"
        >
          {t("learn.scholar.signup")}
        </Link>
        <Link href={`/learn/login?next=${encodeURIComponent(here)}`} className="block w-full rounded-full border border-[var(--border)] px-5 py-3 text-center text-sm font-semibold text-[var(--ink)]">
          {t("learn.scholar.signIn")}
        </Link>
      </div>
    );
  } else if (student.email.trim().toLowerCase() !== offer.email) {
    body = (
      <div>
        <p role="alert" className="break-words rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("learn.scholar.claim.wrongEmail", { email: offer.email, current: student.email })}
        </p>
        <SignOutBack to={here} />
      </div>
    );
  } else body = <AcceptScholarshipButton token={token} />;

  const first = offer?.name.trim().split(/\s+/)[0] ?? "";
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center" aria-label="ARFA">
          <ArfaWordmark size="md" academyLabel={t("learn.brand.academy")} />
        </Link>
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#1B2A5E] to-[#27407F] px-7 py-6 text-white">
            <div className="flex items-center gap-4">
              <ScholarSeal size={56} />
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#F9A738]">{t("learn.scholar.kicker")}</p>
                <p className="mt-1 text-lg font-black leading-tight">The Tilo Vision Scholarship</p>
              </div>
            </div>
          </div>
          <div className="p-7">
            <h1 className="break-words text-xl font-black text-[var(--ink)]">
              {offer ? t("learn.scholar.claim.title", { name: first }) : t("learn.scholar.claim.invalidTitle")}
            </h1>
            {offer && offer.status === "approved" && !offer.expired && (
              <>
                <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.scholar.claim.sub")}</p>
                {offer.partner && <p className="mt-1 text-sm font-bold text-[#B4530F]">{t(`learn.scholar.partner.${offer.partner.role}`, { partner: offer.partner.name })}</p>}
                <dl className="mt-4 divide-y divide-[var(--border)] rounded-xl border border-[#F4C9A0] bg-[#FFFBF6] px-4 text-sm">
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-[var(--ink3)]">{t("learn.scholar.award.coverage")}</dt>
                    <dd className="text-right font-bold text-[var(--ink)]">
                      {offer.coveragePct >= 100 ? t("learn.scholar.coverage.full") : t("learn.scholar.coverage.part", { pct: String(offer.coveragePct) })}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-[var(--ink3)]">{t("learn.scholar.award.tracks")}</dt>
                    <dd className="text-right font-bold text-[var(--ink)]">{t(offer.trackCount === 1 ? "learn.scholar.tracks.one" : "learn.scholar.tracks.other", { n: String(offer.trackCount) })}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-[var(--ink3)]">{t("learn.scholar.award.code")}</dt>
                    <dd className="font-mono text-xs font-bold text-[var(--ink)]">{offer.code}</dd>
                  </div>
                  {offer.expiresAt && (
                    <div className="flex justify-between gap-4 py-2.5">
                      <dt className="text-[var(--ink3)]">{t("learn.scholar.award.claimBy")}</dt>
                      <dd className="text-right font-bold text-[var(--ink)]">{fmtDate(offer.expiresAt, locale, true)}</dd>
                    </div>
                  )}
                </dl>
                {tracks.length > 0 && (
                  <ul className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-[var(--ink2)]">
                    {tracks.map((x) => <li key={x} className="break-words">{x}</li>)}
                  </ul>
                )}
              </>
            )}
            <div className="mt-5">{body}</div>
            {offer && offer.status === "approved" && !offer.expired && <p className="mt-4 text-xs leading-relaxed text-[var(--ink3)]">{t("learn.scholar.scope")}</p>}
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
