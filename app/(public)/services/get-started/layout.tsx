import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pages.getStarted.meta.title"), description: t("pages.getStarted.hero.body") };
}

export default function GetStartedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
