import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbNode, softwareAppNode } from "@/lib/seo/jsonld";

// The scanner page is a client component, so its metadata and structured
// data live here. Without this it inherited /tools' canonical.
export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return pageMetadata({
    path: "/tools/scanner",
    locale,
    title: t("seo.meta.scanner.title"),
    description: t("seo.meta.scanner.description"),
  });
}

export default async function ScannerLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <>
      <JsonLd
        data={[
          softwareAppNode({
            name: t("tools.index.scanner.name"),
            description: t("seo.meta.scanner.description"),
            path: "/tools/scanner",
            category: "WebApplication",
            free: true,
          }),
          breadcrumbNode([
            { name: t("seo.home"), path: "/" },
            { name: t("seo.tools"), path: "/tools" },
            { name: t("tools.index.scanner.name"), path: "/tools/scanner" },
          ]),
        ]}
      />
      {children}
    </>
  );
}
