import type { LiveSession } from "./shared";

// An iCalendar file with one event per live session. Times are UTC, so every
// calendar app shows them in the reader's own zone.

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** RFC 5545 text escaping, then folding at 74 octets-ish (by characters). */
function text(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function cohortIcs(c: {
  id: string;
  name: string;
  trackTitle: string;
  meetingUrl: string | null;
  pageUrl: string;
  sessions: LiveSession[];
  summary: (week: number) => string;
}): string {
  const now = stamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TIBLOGICS//Learn cohorts//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${text(`${c.name} (${c.trackTitle})`)}`,
  ];
  for (const s of c.sessions) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${c.id}-w${s.week}@tiblogics.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(s.start)}`,
      `DTEND:${stamp(s.end)}`,
      `SUMMARY:${text(`${c.summary(s.week)} · ${c.name}`)}`,
      `DESCRIPTION:${text([c.trackTitle, c.meetingUrl ?? "", c.pageUrl].filter(Boolean).join("\n"))}`,
      ...(c.meetingUrl ? [`LOCATION:${text(c.meetingUrl)}`, `URL:${text(c.meetingUrl)}`] : [`URL:${text(c.pageUrl)}`]),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** One event (a live expert session). The meeting link is not in it. */
export function singleEventIcs(e: {
  uid: string;
  calName: string;
  summary: string;
  description: string;
  pageUrl: string;
  start: Date;
  end: Date;
  cancelled?: boolean;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TIBLOGICS//Learn live sessions//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${text(e.calName)}`,
    "BEGIN:VEVENT",
    `UID:${e.uid}@tiblogics.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${text(e.summary)}`,
    `DESCRIPTION:${text(e.description)}`,
    `LOCATION:${text(e.pageUrl)}`,
    `URL:${text(e.pageUrl)}`,
    `STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
