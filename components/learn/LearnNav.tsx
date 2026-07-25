"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { POINTS_PER_LEVEL } from "@/lib/learn/points";

const LINKS = [
  { href: "/learn", label: "Dashboard" },
  { href: "/learn/tracks", label: "My tracks" },
  { href: "/learn/certificates", label: "Certificates" },
  { href: "/learn/account", label: "Account" },
];

export default function LearnNav({
  studentName,
  points,
  level,
}: {
  studentName: string;
  points: number;
  level: { name: string; progress: number; pointsToNext: number; next: number | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/learn" className="shrink-0 text-base font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
          <span className="ml-1 text-xs font-semibold text-[var(--ink3)]">Learn</span>
        </Link>

        <nav aria-label="Member" className="ml-4 hidden gap-1 sm:flex">
          {LINKS.map((l) => {
            const active = l.href === "/learn" ? pathname === "/learn" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--s2)] text-[var(--ink)]"
                    : "text-[var(--ink3)] hover:text-[var(--ink)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Points + level */}
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-[var(--ink)]">
              {points.toLocaleString()} pts · {level.name}
            </p>
            <div
              className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-[var(--s3)]"
              role="progressbar"
              aria-valuenow={Math.round(level.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress to next level: ${level.next == null ? "max level reached" : `${level.pointsToNext} points to go`}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738]"
                style={{ width: `${Math.round(level.progress * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-white"
          >
            {studentName.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {open && (
        <div role="menu" className="border-t border-[var(--border)] bg-white px-4 py-3 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ink2)]"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute right-4 top-full mt-1 hidden w-52 rounded-xl border border-[var(--border)] bg-white p-2 shadow-lg sm:block">
          <p className="px-3 py-2 text-xs text-[var(--ink3)]">
            Signed in as
            <br />
            <strong className="text-[var(--ink)]">{studentName}</strong>
          </p>
          <p className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--ink3)]">
            {level.next == null
              ? "Top level reached 🎉"
              : `${level.pointsToNext} pts to the next level (${POINTS_PER_LEVEL} per level)`}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
