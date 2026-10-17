"use client";

import { Lock } from "lucide-react";
import { Badge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { CAPABILITIES, FEATURES, FEATURE_GROUPS, levelOf, RANKS, type Access, type Level } from "@/lib/admin/permissions";

// The permission grid used by the member drawer, the invite form and the
// role editor: one row per feature (None / View / Manage) and a switch per
// sensitive capability. With `base` (the role's access) each row says where
// its level comes from: the role, an added override or a removed one.

const LABEL: Record<Level, string> = { none: "None", view: "View", manage: "Manage" };

export function AccessGrid({
  value,
  base,
  onChange,
  allowed,
  idPrefix,
}: {
  value: Access;
  base?: Access;
  onChange?: (next: Access) => void;
  /** Whether the viewer may pick this level ("blog:manage") or capability. */
  allowed?: (key: string) => boolean;
  idPrefix: string;
}) {
  const readOnly = !onChange;
  const setLevel = (key: string, l: Level) => {
    if (!onChange) return;
    const levels = { ...value.levels };
    if (l === "none") delete levels[key];
    else levels[key] = l;
    onChange({ ...value, levels });
  };
  const setCap = (key: string, on: boolean) => {
    if (!onChange) return;
    const caps = new Set(value.caps);
    if (on) caps.add(key);
    else caps.delete(key);
    onChange({ ...value, caps: [...caps].sort() });
  };

  return (
    <div className="space-y-5">
      {FEATURE_GROUPS.map((g) => {
        const rows = FEATURES.filter((f) => f.group === g);
        if (!rows.length) return null;
        return (
          <section key={g} aria-label={g}>
            <h4 className="mb-1.5 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">{g}</h4>
            <ul className="divide-y divide-[var(--a-border)] overflow-hidden rounded-[var(--a-radius-control)] border border-[var(--a-border)]">
              {rows.map((f) => {
                const cur = levelOf(value, f.key);
                const from = base ? levelOf(base, f.key) : null;
                const src = from === null || from === cur ? null : RANKS[cur] > RANKS[from] ? "added" : "removed";
                const opts: Level[] = f.viewOnly ? ["none", "view"] : ["none", "view", "manage"];
                return (
                  <li key={f.key} className="flex flex-col gap-2 bg-[var(--a-surface)] px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{f.label}</span>
                        {f.sensitive ? <Lock size={12} className="text-[var(--a-warn)]" aria-label="Sensitive" /> : null}
                        {src === "added" ? (
                          <Badge tone="success" title={`Role gives ${LABEL[from!]}`}>Added</Badge>
                        ) : src === "removed" ? (
                          <Badge tone="warn" title={`Role gives ${LABEL[from!]}`}>Removed</Badge>
                        ) : base && cur !== "none" ? (
                          <Badge tone="neutral">From role</Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 font-dm text-[12.5px] leading-snug text-[var(--a-ink-3)]">{f.description}</p>
                    </div>
                    <div role="radiogroup" aria-label={`${f.label} access`} className="inline-flex shrink-0 self-start rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-0.5 sm:self-center">
                      {opts.map((l) => {
                        const on = cur === l;
                        const ok = !readOnly && (l === "none" || !allowed || allowed(`${f.key}:${l}`));
                        return (
                          <button
                            key={l}
                            id={`${idPrefix}-${f.key}-${l}`}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={!ok && !on}
                            onClick={() => ok && setLevel(f.key, l)}
                            title={!ok && !readOnly && !on ? "You cannot give this level" : undefined}
                            className={cn(
                              "h-8 min-w-[58px] rounded-[8px] px-2.5 font-dm text-[12.5px] font-semibold transition-colors duration-150",
                              on
                                ? l === "none"
                                  ? "bg-[var(--a-surface)] text-[var(--a-ink)] shadow-[0_1px_2px_rgba(13,27,42,.08)] ring-1 ring-[var(--a-border)]"
                                  : l === "view"
                                    ? "bg-[var(--a-info-bg)] text-[var(--a-info)] ring-1 ring-[#C7D7F0]"
                                    : "bg-[var(--a-navy)] text-white"
                                : "text-[var(--a-ink-3)] hover:text-[var(--a-ink)] disabled:cursor-not-allowed disabled:opacity-40",
                              readOnly && "cursor-default",
                            )}
                          >
                            {LABEL[l]}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section aria-label="Sensitive capabilities">
        <h4 className="mb-1.5 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Sensitive capabilities</h4>
        <ul className="divide-y divide-[var(--a-border)] overflow-hidden rounded-[var(--a-radius-control)] border border-[var(--a-border)]">
          {CAPABILITIES.map((c) => {
            const on = value.caps.includes(c.key);
            const was = base ? base.caps.includes(c.key) : null;
            const src = was === null || was === on ? null : on ? "added" : "removed";
            const ok = !readOnly && (!allowed || allowed(c.key) || on);
            const id = `${idPrefix}-cap-${c.key}`;
            return (
              <li key={c.key} className="flex items-start gap-3 bg-[var(--a-surface)] px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <label htmlFor={id} className="font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">
                      {c.label}
                    </label>
                    {src === "added" ? <Badge tone="success">Added</Badge> : src === "removed" ? <Badge tone="warn">Removed</Badge> : base && on ? <Badge tone="neutral">From role</Badge> : null}
                  </div>
                  <p className="mt-0.5 font-dm text-[12.5px] leading-snug text-[var(--a-ink-3)]">{c.description}</p>
                </div>
                <button
                  id={id}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={!ok}
                  onClick={() => setCap(c.key, !on)}
                  className={cn(
                    "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
                    on ? "bg-[var(--a-navy)]" : "bg-[var(--a-border-strong)]",
                  )}
                >
                  <span className="sr-only">{on ? "On" : "Off"}</span>
                  <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-150", on ? "translate-x-[22px]" : "translate-x-0.5")} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** Overrides that turn `role` into `desired` (what the member drawer saves). */
export function overridesFor(role: Access, desired: Access): { grants: string[]; revokes: string[] } {
  const grants: string[] = [];
  const revokes: string[] = [];
  for (const f of FEATURES) {
    const r = levelOf(role, f.key);
    const d = levelOf(desired, f.key);
    if (r === d) continue;
    if (RANKS[d] > RANKS[r]) grants.push(`${f.key}:${d}`);
    else revokes.push(d === "none" ? f.key : `${f.key}:manage`);
  }
  for (const c of CAPABILITIES) {
    const r = role.caps.includes(c.key);
    const d = desired.caps.includes(c.key);
    if (r && !d) revokes.push(c.key);
    if (!r && d) grants.push(c.key);
  }
  return { grants: grants.sort(), revokes: revokes.sort() };
}
