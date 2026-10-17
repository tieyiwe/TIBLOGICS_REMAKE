import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import InstallGuide from "@/components/learn/pwa/InstallGuide";
import { getT } from "@/lib/i18n/server";
import { qrSvg } from "@/lib/learn/pwa/qr";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pwa.page.meta"), robots: { index: false } };
}

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

// "Install the ARFA app" (linked from the welcome emails, the install card,
// the nav and account settings). Open without signing in (proxy.ts), so the
// emailed link works on a phone that has never signed in; the installed app
// then opens /learn, which asks to sign in once. The QR code (drawn here, on
// the server) opens this page on a phone.
export default async function InstallPage() {
  const t = await getT();
  const url = `${SITE}/learn/install`;
  return (
    <div className="min-h-screen bg-[var(--s2)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/learn" aria-label={t("pwa.page.back")} className="shrink-0">
            <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
          </Link>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink2)] hover:text-[var(--ink)]">
          <ArrowLeft size={16} aria-hidden /> {t("pwa.page.back")}
        </Link>
        <InstallGuide
          qr={qrSvg(url, { px: 168, dark: "#1B3A6B", label: t("pwa.page.qr.alt") })}
          shortUrl={url.replace(/^https?:\/\//, "")}
        />
      </main>
    </div>
  );
}
