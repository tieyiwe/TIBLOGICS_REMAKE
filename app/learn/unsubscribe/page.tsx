import type { Metadata } from "next";
import Link from "next/link";
import { MailX } from "lucide-react";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import { getT } from "@/lib/i18n/server";
import { readUnsubscribeToken } from "@/lib/learn/inbox/unsubscribe";
import UnsubscribeButton from "./UnsubscribeButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("unsubscribe.metaTitle"), robots: { index: false } };
}

// Opened from the link in ARFA news emails. A button confirms, so link
// scanners in mail filters cannot unsubscribe anyone by fetching the page.
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  const valid = !!readUnsubscribeToken(token);
  const t = await getT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link href="/learning-box" className="inline-block">
            <ArfaWordmark size="md" academyLabel={t("learn.brand.academy")} />
          </Link>
        </div>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--s2)] text-[var(--ink)]" aria-hidden>
            <MailX size={22} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-[var(--ink)]">{t("unsubscribe.title")}</h1>
          {valid ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("unsubscribe.body")}</p>
              <UnsubscribeButton token={token!} />
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("unsubscribe.invalid")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
