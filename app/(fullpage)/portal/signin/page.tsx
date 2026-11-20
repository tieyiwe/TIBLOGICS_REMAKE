import type { Metadata } from "next";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import ClientMessages from "@/components/i18n/ClientMessages";
import { PortalSignin } from "@/components/learn/youth/PortalClient";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "ARFA · Sign in", robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };

// Landing page of an emailed portal sign-in link: one click uses it (the
// link itself changes nothing, so mail scanners cannot use it up).
export default async function PortalSigninPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const t = await getT();
  return (
    <ClientMessages area="learn">
      <div className="min-h-screen bg-[var(--s2)] px-4 py-10">
        <section className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="portal-signin-page">
          <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
          <h1 className="mt-4 text-xl font-black text-[var(--ink)]">{t("learn.portal.signin.title")}</h1>
          <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.portal.signin.body")}</p>
          <PortalSignin token={typeof token === "string" ? token.slice(0, 100) : ""} />
        </section>
      </div>
    </ClientMessages>
  );
}
