// Outreach settings, all from the environment so they change without a deploy.
//
//   OUTREACH_DAILY_CAP         max cold emails in any rolling 24 hours (default 30)
//   OUTREACH_PER_RUN           max emails one sender run may send (default 3)
//   OUTREACH_GAP_MIN_SEC /     random pause between two sends in the same run
//   OUTREACH_GAP_MAX_SEC       (default 20 / 90 seconds)
//   OUTREACH_SEND_WINDOW       local sending hours "start-end", 24h (default 8-18)
//   OUTREACH_TZ                time zone for the window (default America/Toronto)
//   OUTREACH_JITTER_MIN        max random delay added to approved send times (default 20 / 120 min)
//   OUTREACH_PHYSICAL_ADDRESS  postal address printed in every email (REQUIRED:
//                              the sender refuses to run without it)
//   OUTREACH_FROM_NAME         display name (default "Tieyiwe Bassole, TIBLOGICS")
//   OUTREACH_REPLY_TO          where replies go (default the SMTP mailbox)
//   OUTREACH_SECRET            signs unsubscribe links (falls back to NEXTAUTH_SECRET)
//   GROWTH_ENRICH_TEST_HOSTS   dev/test only: hosts the enricher may fetch even
//                              though they are private (ignored in production)

function int(v: string | undefined, def: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || v === undefined || v === "") return def;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function outreachConfig() {
  const window = /^(\d{1,2})-(\d{1,2})$/.exec(process.env.OUTREACH_SEND_WINDOW ?? "8-18");
  const smtpUser = process.env.TITAN_SMTP_USER ?? "info@tiblogics.com";
  const gapMin = int(process.env.OUTREACH_GAP_MIN_SEC, 20, 0, 600);
  return {
    dailyCap: int(process.env.OUTREACH_DAILY_CAP, 30, 0, 1000),
    perRun: int(process.env.OUTREACH_PER_RUN, 3, 1, 50),
    gapMinSec: gapMin,
    gapMaxSec: Math.max(gapMin, int(process.env.OUTREACH_GAP_MAX_SEC, 90, 0, 900)),
    windowStart: window ? Math.min(24, Number(window[1])) : 8,
    windowEnd: window ? Math.min(24, Number(window[2])) : 18,
    timeZone: process.env.OUTREACH_TZ || "America/Toronto",
    physicalAddress: (process.env.OUTREACH_PHYSICAL_ADDRESS ?? "").trim(),
    fromName: process.env.OUTREACH_FROM_NAME || "Tieyiwe Bassole, TIBLOGICS",
    fromEmail: smtpUser,
    replyTo: process.env.OUTREACH_REPLY_TO || smtpUser,
  };
}

export type OutreachConfig = ReturnType<typeof outreachConfig>;

export function siteBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
}

/** Hour of day (0-23) in the configured zone. */
export function localHour(date: Date, timeZone: string): number {
  try {
    const h = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(date);
    return Number(h) % 24;
  } catch {
    return date.getUTCHours();
  }
}

export function inSendWindow(cfg: OutreachConfig, now = new Date()): boolean {
  if (cfg.windowStart === 0 && cfg.windowEnd >= 24) return true;
  const h = localHour(now, cfg.timeZone);
  return cfg.windowStart <= cfg.windowEnd
    ? h >= cfg.windowStart && h < cfg.windowEnd
    : h >= cfg.windowStart || h < cfg.windowEnd;
}

/** Problems that stop the sender; shown on the outreach page. */
export function configProblems(cfg = outreachConfig()): string[] {
  const out: string[] = [];
  if (!cfg.physicalAddress) out.push("OUTREACH_PHYSICAL_ADDRESS is not set. CASL and CAN-SPAM require a valid postal address in every commercial email, so nothing will send until it is.");
  if (!process.env.TITAN_SMTP_PASS) out.push("TITAN_SMTP_PASS is not set, so the SMTP server will refuse to send.");
  if (!process.env.OUTREACH_SECRET && !process.env.NEXTAUTH_SECRET) out.push("Neither OUTREACH_SECRET nor NEXTAUTH_SECRET is set, so unsubscribe links cannot be signed.");
  return out;
}
