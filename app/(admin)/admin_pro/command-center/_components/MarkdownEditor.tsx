"use client";

import { useRef, useState } from "react";
import { Bold, Code2, Heading2, Link2, List, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { Segmented } from "@/components/admin/ui";
import { Markdown } from "./Markdown";
import { inputCls } from "./fields";

/** Textarea with a small formatting toolbar and a preview tab. */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minRows = 8,
  ariaLabel,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  ariaLabel: string;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");

  const apply = (kind: "h" | "b" | "check" | "list" | "link" | "code") => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = value.slice(s, e);
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    let next = value;
    let caret = e;
    const prefixLine = (p: string) => {
      next = value.slice(0, lineStart) + p + value.slice(lineStart);
      caret = e + p.length;
    };
    if (kind === "h") prefixLine("## ");
    else if (kind === "check") prefixLine("- [ ] ");
    else if (kind === "list") prefixLine("- ");
    else if (kind === "b") {
      next = `${value.slice(0, s)}**${sel || "bold"}**${value.slice(e)}`;
      caret = s + 2 + (sel || "bold").length;
    } else if (kind === "link") {
      const t = sel || "link text";
      next = `${value.slice(0, s)}[${t}](https://)${value.slice(e)}`;
      caret = s + t.length + 11;
    } else {
      next = sel.includes("\n") || !sel ? `${value.slice(0, s)}\n\`\`\`\n${sel}\n\`\`\`\n${value.slice(e)}` : `${value.slice(0, s)}\`${sel}\`${value.slice(e)}`;
      caret = s + (sel.includes("\n") || !sel ? 5 + sel.length : sel.length + 2);
    }
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  };

  // Enter on a list or checklist line continues the list.
  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key !== "Enter" || ev.shiftKey || ev.metaKey || ev.ctrlKey) return;
    const ta = ev.currentTarget;
    const s = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const line = value.slice(lineStart, s);
    const m = line.match(/^(\s*)([-*] \[[ xX]\] |[-*] |\d+\. )(.*)$/);
    if (!m) return;
    ev.preventDefault();
    if (!m[3].trim()) {
      onChange(value.slice(0, lineStart) + value.slice(s));
      requestAnimationFrame(() => ta.setSelectionRange(lineStart, lineStart));
      return;
    }
    const bullet = m[2].startsWith("- [") || m[2].startsWith("* [") ? "- [ ] " : /\d/.test(m[2]) ? `${parseInt(m[2]) + 1}. ` : m[2];
    const ins = `\n${m[1]}${bullet}`;
    onChange(value.slice(0, s) + ins + value.slice(ta.selectionEnd));
    requestAnimationFrame(() => ta.setSelectionRange(s + ins.length, s + ins.length));
  };

  const tools = [
    { k: "h" as const, icon: Heading2, label: "Heading" },
    { k: "b" as const, icon: Bold, label: "Bold" },
    { k: "list" as const, icon: List, label: "Bullet list" },
    { k: "check" as const, icon: ListChecks, label: "Checklist" },
    { k: "link" as const, icon: Link2, label: "Link" },
    { k: "code" as const, icon: Code2, label: "Code" },
  ];

  return (
    <div className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] focus-within:border-[var(--a-blue)] focus-within:ring-2 focus-within:ring-[var(--a-blue)]/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--a-border)] px-1.5 py-1">
        <Segmented
          size="sm"
          ariaLabel="Editor mode"
          value={mode}
          onChange={(v) => setMode(v as "write" | "preview")}
          options={[
            { value: "write", label: "Write" },
            { value: "preview", label: "Preview" },
          ]}
        />
        {mode === "write" ? (
          <div className="ml-auto flex items-center gap-0.5" role="toolbar" aria-label="Formatting">
            {tools.map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => apply(t.k)}
                title={t.label}
                aria-label={t.label}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]"
              >
                <t.icon size={15} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {mode === "write" ? (
        <textarea
          id={id}
          ref={ref}
          aria-label={ariaLabel}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={minRows}
          className={cn(inputCls, "block h-auto resize-y rounded-t-none border-0 py-2.5 font-mono text-[13px] leading-relaxed focus:ring-0")}
        />
      ) : (
        <div className="min-h-[120px] px-3 py-3">
          <Markdown source={value} />
        </div>
      )}
    </div>
  );
}
