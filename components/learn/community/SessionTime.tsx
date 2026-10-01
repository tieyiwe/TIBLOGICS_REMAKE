"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";

// A live session's time in the cohort's own zone (stable on server and
// client), plus the reader's local time once the page is in the browser.
export default function SessionTime({ iso, timezone, withLocal = true }: { iso: string; timezone: string; withLocal?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const at = new Date(iso);
  let zone = timezone;
  let main: string;
  try {
    main = new Intl.DateTimeFormat(locale, { timeZone: timezone, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(at);
  } catch {
    zone = "UTC";
    main = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(at);
  }
  const [local, setLocal] = useState<string | null>(null);
  useEffect(() => {
    if (!withLocal) return;
    const mine = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (mine && mine !== zone) {
      setLocal(new Intl.DateTimeFormat(locale, { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(at));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, zone, locale, withLocal]);
  return (
    <span>
      <time dateTime={iso}>{main}</time> <span className="text-[var(--ink3)]">({zone.replace(/_/g, " ")})</span>
      {local && <span className="block text-xs text-[var(--ink3)]">{t("community.cohort.yourTime", { time: local })}</span>}
    </span>
  );
}
