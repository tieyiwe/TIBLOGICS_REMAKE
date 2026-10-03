"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Saves utm_* parameters from the landing URL into a 30-day first-party
// cookie (tib_utm), read later at sign-up, checkout and booking to attribute
// the conversion (lib/growth/attribution.ts). Holds the campaign only, never
// anything personal. Tracked links (/go/[code]) set the same cookie on the
// server with their link code; landing with the same campaign keeps it.

const COOKIE = "tib_utm";
const MAX_AGE = 30 * 86_400;
const clean = (v: string | null) => {
  const s = (v ?? "").trim().slice(0, 100).replace(/[^A-Za-z0-9._\-+~ ]/g, "");
  return s ? s.toLowerCase() : null;
};

function readCookie(): Record<string, unknown> | null {
  try {
    const m = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
    return m ? JSON.parse(decodeURIComponent(m.slice(COOKIE.length + 1))) : null;
  } catch {
    return null;
  }
}

export default function UtmCapture() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const s = clean(q.get("utm_source"));
      const c = clean(q.get("utm_campaign"));
      if (!s && !c) return;
      const m = clean(q.get("utm_medium"));
      const prev = readCookie();
      if (prev && prev.s === s && prev.c === c && prev.m === m) return;
      const value = JSON.stringify({ s, m, c, n: clean(q.get("utm_content")), l: null, t: Date.now() });
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${COOKIE}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    } catch {
      /* cookies blocked: nothing to attribute */
    }
  }, [pathname]);
  return null;
}
