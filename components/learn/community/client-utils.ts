"use client";

// Small helpers shared by the community client components.

export async function api<T = Record<string, unknown>>(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** "3 hours ago" in the reader's language. */
export function timeAgo(iso: string, locale: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink3)]";
export const primaryBtn =
  "inline-flex min-h-[40px] items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50";
export const ghostBtn =
  "inline-flex min-h-[36px] items-center rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-50";
export const linkBtn = "text-xs font-semibold text-[var(--ink3)] underline-offset-2 hover:text-[var(--ink)] hover:underline disabled:opacity-50";
