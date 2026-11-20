"use client";

import { Fragment, type ReactNode } from "react";
import { ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_MARK } from "@/lib/admin/command-center/constants";

// Markdown-lite for notes, descriptions and updates: headings, lists,
// checklists, links, quotes, rules, inline and fenced code. Rendered to React
// elements (never innerHTML), and only http(s)/mailto links are clickable.

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s)]+)|(\*[^*\s][^*]*\*)|(_[^_\s][^_]*_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    const t = m[0];
    if (m[1]) out.push(<code key={k} className="rounded bg-[var(--a-surface-2)] px-1 py-0.5 font-mono text-[12.5px] text-[var(--a-ink)]">{t.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k} className="font-semibold text-[var(--a-ink)]">{t.slice(2, -2)}</strong>);
    else if (m[3]) {
      const mm = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!;
      out.push(
        SAFE_URL.test(mm[2]) ? (
          <a key={k} href={mm[2]} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--a-blue)] underline underline-offset-2 hover:no-underline">
            {mm[1]}
          </a>
        ) : (
          mm[1]
        ),
      );
    } else if (m[4]) {
      out.push(
        <a key={k} href={t} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-[var(--a-blue)] underline underline-offset-2 hover:no-underline">
          {t}
        </a>,
      );
    } else out.push(<em key={k}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "h"; level: number; text: string }
  | { kind: "p"; lines: string[] }
  | { kind: "ul" | "ol"; items: Array<{ text: string; line: number; check: null | boolean }> }
  | { kind: "code"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "hr" };

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) buf.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", text: buf.join("\n") });
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({ kind: "h", level: h[1].length, text: h[2] });
      i++;
      continue;
    }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }
    const li = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      const ordered = /\d/.test(li[1]);
      const items: Array<{ text: string; line: number; check: null | boolean }> = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([-*]|\d+\.)\s+(.*)$/);
        if (!m || /\d/.test(m[1]) !== ordered) break;
        const c = m[2].match(/^\[( |x|X)\]\s*(.*)$/);
        items.push({ text: c ? c[2] : m[2], line: i, check: c ? c[1].toLowerCase() === "x" : null });
        i++;
      }
      blocks.push({ kind: ordered ? "ol" : "ul", items });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|\s*([-*]|\d+\.)\s|\s*>)/.test(lines[i])) buf.push(lines[i++]);
    blocks.push({ kind: "p", lines: buf });
  }
  return blocks;
}

export function Markdown({
  source,
  className,
  onToggle,
  onActionItem,
  busyLine,
}: {
  source: string;
  className?: string;
  /** Tick or untick a checklist line. */
  onToggle?: (line: number) => void;
  /** Turn an open checklist line into a task. */
  onActionItem?: (line: number) => void;
  busyLine?: number | null;
}) {
  const blocks = parse(source || "");
  if (!blocks.length) return <p className={cn("font-dm text-[13.5px] italic text-[var(--a-ink-3)]", className)}>Nothing written yet.</p>;
  return (
    <div className={cn("space-y-2.5 font-dm text-[14px] leading-relaxed text-[var(--a-ink-2)]", className)}>
      {blocks.map((b, bi) => {
        const k = `b${bi}`;
        switch (b.kind) {
          case "h":
            return b.level === 1 ? (
              <h2 key={k} className="pt-1 font-syne text-[19px] font-bold text-[var(--a-ink)]">{inline(b.text, k)}</h2>
            ) : b.level === 2 ? (
              <h3 key={k} className="pt-1 font-syne text-[16px] font-bold text-[var(--a-ink)]">{inline(b.text, k)}</h3>
            ) : (
              <h4 key={k} className="pt-0.5 font-dm text-[14px] font-bold text-[var(--a-ink)]">{inline(b.text, k)}</h4>
            );
          case "hr":
            return <hr key={k} className="border-[var(--a-border)]" />;
          case "code":
            return (
              <pre key={k} className="a-scroll-thin overflow-x-auto rounded-[10px] bg-[var(--a-navy-deep)] p-3 font-mono text-[12.5px] leading-relaxed text-[#E8EFF8]">
                <code>{b.text}</code>
              </pre>
            );
          case "quote":
            return (
              <blockquote key={k} className="border-l-[3px] border-[var(--a-border-strong)] pl-3 text-[var(--a-ink-3)]">
                {inline(b.text, k)}
              </blockquote>
            );
          case "p":
            return (
              <p key={k}>
                {b.lines.map((l, li) => (
                  <Fragment key={li}>
                    {li > 0 ? <br /> : null}
                    {inline(l, `${k}-${li}`)}
                  </Fragment>
                ))}
              </p>
            );
          case "ul":
          case "ol": {
            const List = b.kind === "ol" ? "ol" : "ul";
            const isChecklist = b.items.some((it) => it.check !== null);
            return (
              <List key={k} className={cn("space-y-1", isChecklist ? "pl-0.5" : b.kind === "ol" ? "list-decimal pl-5" : "list-disc pl-5")}>
                {b.items.map((it) => {
                  const marked = it.text.includes(TASK_MARK);
                  const text = marked ? it.text.replace(TASK_MARK, "").trim() : it.text;
                  return (
                    <li key={it.line} className={cn(it.check !== null && "group flex list-none items-start gap-2")}>
                      {it.check !== null ? (
                        <>
                          <input
                            type="checkbox"
                            checked={it.check}
                            disabled={!onToggle}
                            onChange={() => onToggle?.(it.line)}
                            aria-label={text}
                            className="mt-[5px] h-4 w-4 shrink-0 accent-[var(--a-blue)]"
                          />
                          <span className={cn("min-w-0 flex-1", it.check && "text-[var(--a-ink-3)] line-through")}>
                            {inline(text, `${k}-${it.line}`)}
                            {marked ? (
                              <span className="ml-2 inline-flex items-center rounded bg-[var(--a-info-bg)] px-1.5 font-dm text-[11px] font-semibold text-[var(--a-info)]">Task</span>
                            ) : null}
                          </span>
                          {onActionItem && !it.check && !marked && text.trim() ? (
                            <button
                              type="button"
                              onClick={() => onActionItem(it.line)}
                              disabled={busyLine === it.line}
                              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-[var(--a-border)] bg-[var(--a-surface)] px-2 font-dm text-[12px] font-semibold text-[var(--a-ink-2)] opacity-100 transition-opacity hover:border-[var(--a-border-strong)] hover:text-[var(--a-ink)] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                              aria-label={`Make a task: ${text}`}
                            >
                              <ListPlus size={13} aria-hidden /> Make task
                            </button>
                          ) : null}
                        </>
                      ) : (
                        inline(it.text, `${k}-${it.line}`)
                      )}
                    </li>
                  );
                })}
              </List>
            );
          }
        }
      })}
    </div>
  );
}

/** Flip "- [ ]" and "- [x]" on one line. */
export function toggleChecklistLine(md: string, line: number): string {
  const lines = md.split("\n");
  const l = lines[line];
  if (l === undefined) return md;
  lines[line] = /\[ \]/.test(l) ? l.replace("[ ]", "[x]") : l.replace(/\[(x|X)\]/, "[ ]");
  return lines.join("\n");
}
