// Client-safe: label lookup with {var} substitution (twin of lib/i18n/config format()).

export type Labels = Record<string, string>;

export function fmt(labels: Labels, key: string, vars?: Record<string, string | number>): string {
  const s = labels[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}
