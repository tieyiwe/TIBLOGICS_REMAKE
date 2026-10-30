import type { Metadata } from "next";
import Link from "next/link";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "ARFA · Thank you", robots: { index: false, follow: false } };

// After a sponsor pays (app/api/learn/youth/sponsor/confirm). No personal
// data here: the details are in the sponsor's confirmation email.
export default async function SponsorThanksPage({ searchParams }: { searchParams: Promise<{ waiting?: string; pending?: string; unknown?: string }> }) {
  const { waiting, pending, unknown } = await searchParams;
  // pending: paid by a delayed method, not settled yet. unknown: the payment
  // could not be confirmed (no session, an error). Never claim success then.
  const state = pending === "1" ? "pending" : unknown === "1" ? "unknown" : "done";
  const t = await getT();
  return (
    <div className="min-h-screen bg-[var(--s2)] px-4 py-10">
      <section className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="sponsor-thanks">
        <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
        <p aria-hidden="true" className="mt-4 text-4xl">{state === "done" ? "🎉" : "⏳"}</p>
        <h1 className="mt-2 text-xl font-black text-[var(--ink)]">
          {t(state === "pending" ? "learn.youth.sponsor.thanks.pendingTitle" : state === "unknown" ? "learn.youth.sponsor.thanks.unknownTitle" : "learn.youth.sponsor.thanks.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">
          {t(
            state === "pending"
              ? "learn.youth.sponsor.thanks.pending"
              : state === "unknown"
                ? "learn.youth.sponsor.thanks.unknown"
                : waiting === "1"
                  ? "learn.youth.sponsor.thanks.waiting"
                  : "learn.youth.sponsor.thanks.body",
          )}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link href="/portal" className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white">{t("learn.youth.sponsor.thanks.portal")}</Link>
          <Link href="/sponsor-youth" className="text-center text-sm font-semibold text-[var(--blue2)] underline">{t("learn.youth.sponsor.thanks.another")}</Link>
        </div>
      </section>
    </div>
  );
}
