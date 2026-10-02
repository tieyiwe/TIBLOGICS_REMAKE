// Date helpers for tasks and milestones. Safe on client and server.
//
// Due dates are calendar days. They are stored as 12:00 UTC on that day so
// the day never shifts whatever the viewer's time zone, and compared as
// "YYYY-MM-DD" keys. "Today" always comes from the viewer (todayKey), so My
// work and the overdue flags match the person's own calendar.

export const DAY_MS = 86_400_000;

export function keyOf(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/** Local calendar day of this browser / process, as a key. */
export function localTodayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isDayKey(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(`${s}T12:00:00Z`));
}

/** The stored instant for a day key (12:00 UTC). */
export function dayToDate(key: string): Date {
  return new Date(`${key}T12:00:00.000Z`);
}

export function addDays(key: string, n: number): string {
  return new Date(Date.parse(`${key}T12:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

export function addMonths(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / DAY_MS);
}

/** 0 = Monday ... 6 = Sunday */
export function weekday(key: string): number {
  return (new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7;
}

export function startOfWeek(key: string): string {
  return addDays(key, -weekday(key));
}

const WEEKDAYS: Record<string, number> = {
  mon: 0, monday: 0, tue: 1, tues: 1, tuesday: 1, wed: 2, weds: 2, wednesday: 2, thu: 3, thur: 3, thurs: 3, thursday: 3,
  fri: 4, friday: 4, sat: 5, saturday: 5, sun: 6, sunday: 6,
};
const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function ymd(y: number, m: number, d: number): string | null {
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

/** A month/day without a year: this year, or next year when already past. */
function upcoming(today: string, m: number, d: number): string | null {
  const y = Number(today.slice(0, 4));
  const k = ymd(y, m, d);
  if (!k) return null;
  return k < today ? ymd(y + 1, m, d) : k;
}

/**
 * Natural-language due dates: today, tomorrow, fri, next fri, next week,
 * next month, in 3 days, in 2 weeks, eow, eom, oct 12, 12 oct, 10/12,
 * 2026-10-12, +3d. Null when the phrase is not a date.
 */
export function parseNaturalDate(input: string, today: string): string | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,]$/, "");
  if (!s) return null;
  if (isDayKey(s)) return s;
  if (s === "today" || s === "tod" || s === "now") return today;
  if (s === "tomorrow" || s === "tmr" || s === "tmrw" || s === "tom") return addDays(today, 1);
  if (s === "yesterday") return addDays(today, -1);
  if (s === "next week" || s === "nw") return addDays(startOfWeek(today), 7);
  if (s === "this week" || s === "eow" || s === "end of week") return addDays(startOfWeek(today), 4);
  if (s === "next month") return addMonths(`${today.slice(0, 7)}-01`, 1);
  if (s === "eom" || s === "end of month") {
    const first = addMonths(`${today.slice(0, 7)}-01`, 1);
    return addDays(first, -1);
  }
  let m = s.match(/^(?:in )?\+?(\d{1,3}) ?(d|day|days|w|wk|week|weeks|m|mo|month|months)(?: from now)?$/);
  if (m && (s.startsWith("in ") || s.startsWith("+") || /from now$/.test(s))) {
    const n = Number(m[1]);
    const u = m[2];
    if (u.startsWith("d")) return addDays(today, n);
    if (u.startsWith("w")) return addDays(today, n * 7);
    return addMonths(today, n);
  }
  m = s.match(/^(next |this )?([a-z]+)$/);
  if (m && m[2] in WEEKDAYS) {
    const target = WEEKDAYS[m[2]];
    // "next fri" is Friday of next week; "fri" / "this fri" the coming one (today counts).
    if (m[1] === "next ") return addDays(startOfWeek(today), 7 + target);
    return addDays(today, (target - weekday(today) + 7) % 7);
  }
  m = s.match(/^([a-z]+) (\d{1,2})(?:st|nd|rd|th)?(?:,? (\d{4}))?$/);
  if (m && m[1] in MONTHS) return m[3] ? ymd(Number(m[3]), MONTHS[m[1]], Number(m[2])) : upcoming(today, MONTHS[m[1]], Number(m[2]));
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)? ([a-z]+)(?:,? (\d{4}))?$/);
  if (m && m[2] in MONTHS) return m[3] ? ymd(Number(m[3]), MONTHS[m[2]], Number(m[1])) : upcoming(today, MONTHS[m[2]], Number(m[1]));
  m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : null;
    return y ? ymd(y, Number(m[1]), Number(m[2])) : upcoming(today, Number(m[1]), Number(m[2]));
  }
  return null;
}

export interface QuickAddResult {
  title: string;
  dueKey: string | null;
  priority: string | null;
  labels: string[];
  assigneeId: string | null;
}

const PRIORITY_WORDS: Record<string, string> = {
  "!urgent": "urgent", "!u": "urgent", "!1": "urgent", "!high": "high", "!h": "high", "!2": "high",
  "!medium": "medium", "!med": "medium", "!m": "medium", "!3": "medium", "!low": "low", "!l": "low", "!4": "low",
};

/**
 * "Send proposal to Maple fri !high #sales @jane" becomes a title plus a due
 * date, priority, labels and assignee. The date is read from the end of the
 * text (optionally after "due", "by" or "on"); anything not recognised stays
 * in the title.
 */
export function parseQuickAdd(text: string, today: string, staff: Array<{ id: string; name: string }> = []): QuickAddResult {
  let words = text.trim().split(/\s+/).filter(Boolean);
  let priority: string | null = null;
  const labels: string[] = [];
  let assigneeId: string | null = null;
  const keep: string[] = [];
  for (const w of words) {
    const lw = w.toLowerCase();
    if (lw in PRIORITY_WORDS) {
      priority = PRIORITY_WORDS[lw];
      continue;
    }
    if (/^#[\w-]{1,30}$/.test(w)) {
      labels.push(w.slice(1).toLowerCase());
      continue;
    }
    if (/^@[\w.-]{2,40}$/.test(w) && staff.length) {
      const handle = lw.slice(1);
      const hit =
        handle === "me"
          ? null
          : staff.find((s) => s.name.toLowerCase().split(/\s+/)[0] === handle) ??
            staff.find((s) => s.name.toLowerCase().replace(/\s+/g, "").startsWith(handle));
      if (hit) {
        assigneeId = hit.id;
        continue;
      }
    }
    keep.push(w);
  }
  words = keep;
  let dueKey: string | null = null;
  // Longest date phrase at the end wins (up to 4 words), e.g. "in 2 weeks".
  for (let n = Math.min(4, words.length - 1); n >= 1; n--) {
    const tail = words.slice(-n).join(" ");
    const hit = parseNaturalDate(tail, today);
    if (hit) {
      dueKey = hit;
      words = words.slice(0, -n);
      const last = words[words.length - 1]?.toLowerCase();
      if (last === "due" || last === "by" || last === "on") words = words.slice(0, -1);
      break;
    }
  }
  return { title: words.join(" ").trim(), dueKey, priority, labels, assigneeId };
}

export function fmtDay(key: string | null | undefined, opts: { withYear?: boolean } = {}): string {
  if (!key) return "";
  const d = new Date(`${key}T12:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(opts.withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** "Today", "Tomorrow", "Yesterday", "Fri", or "Oct 12". */
export function relativeDay(key: string | null | undefined, today: string): string {
  if (!key) return "";
  const n = diffDays(key, today);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  return fmtDay(key, { withYear: key.slice(0, 4) !== today.slice(0, 4) });
}

export function fmtMinutes(min: number): string {
  if (!min) return "0m";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** "1h 30m", "90m", "1.5h", "2h" to minutes; null when unreadable. */
export function parseDuration(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (!t) return null;
  if (/^\d+$/.test(t)) return Number(t);
  let m = t.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?$/);
  if (m) return Math.round(Number(m[1]) * 60);
  m = t.match(/^(\d+)\s*m(?:in(?:utes?)?)?$/);
  if (m) return Number(m[1]);
  m = t.match(/^(\d+)\s*h(?:ours?|rs?)?\s*(\d+)\s*m(?:in(?:utes?)?)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return null;
}
