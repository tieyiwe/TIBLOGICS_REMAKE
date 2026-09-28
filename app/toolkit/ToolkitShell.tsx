"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n/client";

/** Header shared by the workspace and the plan picker. */
export default function ToolkitShell({ email, children }: { email: string; children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <header className="bg-[#0D1B2A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="font-syne font-extrabold text-white tracking-wide shrink-0">
            TIB<span className="text-[#F47C20]">LOGICS</span>
            <span className="font-dm font-medium text-white/60 text-sm ml-2 hidden sm:inline">Toolkit Live</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <LanguageSwitcher tone="dark" className="shrink-0" />
            <span className="font-dm text-xs text-white/60 truncate hidden sm:inline">{email}</span>
            <button onClick={() => signOut({ callbackUrl: "/tools/toolkit-live" })} className="font-dm text-sm text-white/80 hover:text-white shrink-0">
              {t("toolkit.shell.signOut")}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
