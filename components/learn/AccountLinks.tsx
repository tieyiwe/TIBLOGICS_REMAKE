"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useT } from "@/lib/i18n/client";

// Account settings and sign out, for pages a learner without a plan sees
// (the plans page has no member menu).
export default function AccountLinks() {
  const t = useT();
  return (
    <span className="flex items-center gap-3 text-xs font-semibold" data-testid="account-links">
      <Link href="/learn/account" className="text-[var(--ink2)] hover:text-[var(--ink)] hover:underline">
        {t("learn.nav.account")}
      </Link>
      <button type="button" onClick={() => signOut({ callbackUrl: "/learning-box" })} className="text-[var(--ink2)] hover:text-[var(--ink)] hover:underline">
        {t("learn.nav.signOut")}
      </button>
    </span>
  );
}
