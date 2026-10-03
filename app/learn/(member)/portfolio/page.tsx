import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtNumber } from "@/lib/learn/format";
import { getPortfolioSettings, loadPortfolio } from "@/lib/learn/method/portfolio";
import PortfolioView from "@/components/learn/method/PortfolioView";
import PortfolioShare from "@/components/learn/method/PortfolioShare";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("method.portfolio.metaTitle") };
}

// The learner's own portfolio: everything, including private reflections,
// plus the sharing settings for the public page.
export default async function PortfolioPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  const [settings, data] = await Promise.all([
    getPortfolioSettings(student.id).catch((err) => {
      console.error("[portfolio] settings", err);
      return null;
    }),
    loadPortfolio(student.id, locale, { publicView: false, includeWork: true, hidden: [] }).catch((err) => {
      console.error("[portfolio] load", err);
      return null;
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black text-[var(--ink)]">{t("method.portfolio.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink2)]">{t("method.portfolio.intro")}</p>
        {data && (
          <p className="mt-2 text-sm font-bold text-[var(--orange2)]">
            {t("method.portfolio.xp", { n: fmtNumber(data.totalXp, locale) })}
          </p>
        )}
      </header>

      {settings && <PortfolioShare initial={settings} />}

      {data ? (
        <PortfolioView data={data} publicView={false} />
      ) : (
        <p role="status" className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--ink3)]">
          {t("method.portfolio.unavailable")}
        </p>
      )}
    </div>
  );
}
