import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";

// The newsletter's unsubscribe page (links in every newsletter email:
// lib/newsletter/unsubscribe.ts). One button; the result comes back as
// ?result=done|notfound|error.

export const metadata: Metadata = { title: "Unsubscribe | TIBLOGICS", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ email?: string; result?: string }> }) {
  const t = await getT();
  const { email = "", result } = await searchParams;
  const clean = email.trim().toLowerCase().slice(0, 320);
  return (
    <main className="min-h-[60vh] bg-[#F4F7FB] px-4 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-[#D2DCE8] bg-white p-8 text-center shadow-sm">
        <h1 className="font-syne text-2xl font-bold text-[#0D1B2A]">{t("pages.unsubscribe.title")}</h1>
        {result === "done" ? (
          <p className="mt-4 font-dm text-[#3A4A5C]" role="status">{t("pages.unsubscribe.done")}</p>
        ) : result === "notfound" ? (
          <p className="mt-4 font-dm text-[#3A4A5C]" role="status">{t("pages.api.news.notFound")}</p>
        ) : result === "error" ? (
          <p className="mt-4 font-dm text-[#B42318]" role="alert">{t("pages.unsubscribe.error")}</p>
        ) : clean ? (
          <form method="post" action="/api/newsletter/unsubscribe" className="mt-6">
            <p className="font-dm text-[#3A4A5C]">{t("pages.unsubscribe.confirm")}</p>
            <p className="mt-2 break-all font-dm font-semibold text-[#0D1B2A]">{clean}</p>
            <input type="hidden" name="email" value={clean} />
            <button type="submit" className="mt-6 rounded-xl bg-[#1B3A6B] px-6 py-3 font-dm text-sm font-semibold text-white hover:bg-[#2251A3]">
              {t("pages.unsubscribe.button")}
            </button>
          </form>
        ) : (
          <p className="mt-4 font-dm text-[#3A4A5C]">{t("pages.unsubscribe.noEmail")}</p>
        )}
        <Link href="/" className="mt-8 inline-block font-dm text-sm text-[#2251A3] hover:underline">{t("pages.unsubscribe.home")}</Link>
      </div>
    </main>
  );
}
