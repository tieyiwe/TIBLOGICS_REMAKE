import Link from "next/link";
import { getT } from "@/lib/i18n/server";

// A portfolio that does not exist or is not public: same answer either way,
// so a private portfolio cannot be told apart from a wrong link.
export default async function PortfolioNotFound() {
  const t = await getT();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[var(--s2)] px-4 pb-16 pt-32 sm:pt-44">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
        <span aria-hidden="true" className="text-4xl">
          🔒
        </span>
        <h1 className="mt-4 text-xl font-black text-[var(--ink)]">{t("method.public.notFoundTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("method.public.notFoundBody")}</p>
        <Link href="/learning-box" className="mt-6 inline-block rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white">
          {t("learn.verify.explore")} →
        </Link>
      </div>
    </div>
  );
}
