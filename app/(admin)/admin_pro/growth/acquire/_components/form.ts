// Field styles for the acquisition editors (admin tokens, 36px+ targets).

export const inputCls =
  "block w-full min-h-9 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 py-2 font-dm text-[13.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";

export const textareaCls = `${inputCls} leading-relaxed`;

export const labelCls = "mb-1 block font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]";

export const hintCls = "mt-1 font-dm text-[12px] text-[var(--a-ink-3)]";

export const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "sw", label: "Swahili" },
];

export async function api<T = Record<string, unknown>>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
