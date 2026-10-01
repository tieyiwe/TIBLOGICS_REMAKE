// Formatting shared by the learner, communications and audit admin pages.
// Admin is English; times are shown in UTC so every operator sees the same.

export const dt = (d: Date | string | null | undefined) => {
  if (!d) return "Never";
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
};

export const day = (d: Date | string | null | undefined) => {
  if (!d) return "None";
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

export function ago(d: Date | string | null | undefined): string {
  if (!d) return "Never";
  const x = typeof d === "string" ? new Date(d) : d;
  const m = Math.round((Date.now() - x.getTime()) / 60_000);
  if (m < 0) {
    const f = -m;
    if (f < 60) return `in ${f} min`;
    if (f < 48 * 60) return `in ${Math.round(f / 60)} h`;
    return `in ${Math.round(f / 1440)} days`;
  }
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  if (m < 60 * 1440) return `${Math.round(m / 1440)} days ago`;
  return day(x);
}

export const money = (cents: number, cur: string) =>
  `${cur.toLowerCase() === "usd" ? "$" : cur.toUpperCase() + " "}${(cents / 100).toFixed(2)}`;

export const human = (s: string) => s.replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function initials(name: string): string {
  // Words that start with a letter ("Amina Diallo 2" gives "AD").
  const words = name.trim().split(/\s+/).filter(Boolean);
  const parts = words.filter((w) => /^\p{L}/u.test(w)).length ? words.filter((w) => /^\p{L}/u.test(w)) : words;
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "")).toUpperCase();
}

/** A stable soft colour per learner for the avatar. */
export function avatarHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}
