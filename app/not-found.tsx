import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import { getT } from "@/lib/i18n/server";

// Site-wide 404 in the visitor's language. It renders inside the root layout
// only, so it brings the public header and footer with it.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("site.notFound.meta"), robots: { index: false } };
}

export default async function NotFound() {
  const t = await getT();
  return (
    <>
      <Nav />
      <main className="min-h-[70vh] bg-white px-4 pt-36 pb-20 sm:pt-48">
        <div className="mx-auto max-w-xl text-center">
          <p className="section-tag">{t("site.notFound.code")}</p>
          <h1 className="mt-3 font-syne text-3xl font-extrabold text-[#0D1B2A] sm:text-4xl">
            {t("site.notFound.title")}
          </h1>
          <p className="mt-4 font-dm text-lg leading-relaxed text-[#3A4A5C]">
            {t("site.notFound.body")}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/" className="btn-primary justify-center">
              {t("site.notFound.home")} <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/services" className="btn-secondary justify-center">
              {t("site.notFound.services")}
            </Link>
          </div>
          <Link href="/book" className="btn-ghost mt-6 text-sm">
            {t("site.notFound.book")} →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
