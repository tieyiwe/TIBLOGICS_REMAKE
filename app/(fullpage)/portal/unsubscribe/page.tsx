import type { Metadata } from "next";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import ClientMessages from "@/components/i18n/ClientMessages";
import { PortalUnsubscribe } from "@/components/learn/youth/PortalClient";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "ARFA · Weekly summary", robots: { index: false, follow: false }, referrer: "no-referrer" };

// A sponsor's "unsubscribe" link from the weekly summary (signed; one click).
export default async function PortalUnsubscribePage({ searchParams }: { searchParams: Promise<{ g?: string; s?: string }> }) {
  const sp = await searchParams;
  const t = await getT();
  return (
    <ClientMessages area="learn">
      <div className="min-h-screen bg-[var(--s2)] px-4 py-10">
        <section className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-6">
          <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
          <h1 className="mt-4 text-xl font-black text-[var(--ink)]">{t("learn.portal.unsubscribe.title")}</h1>
          <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.portal.unsubscribe.body")}</p>
          <PortalUnsubscribe g={String(sp.g ?? "").slice(0, 64)} s={String(sp.s ?? "").slice(0, 100)} />
        </section>
      </div>
    </ClientMessages>
  );
}
