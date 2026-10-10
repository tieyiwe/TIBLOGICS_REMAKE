import React from "react";
import TryBlock from "./TryBlock";
import Playground from "./Playground";
import dynamic from "next/dynamic";
import { GlossTerm } from "./glossary/GlossaryContext";
import { formsPattern, type GlossEntry } from "@/lib/learn/glossary/pattern";
import ExplainParagraph from "./ExplainParagraph";
import { MIN_EXPLAIN_CHARS, paraHash } from "@/lib/learn/explain/paragraphs";

// Loaded only by lessons that embed a Studio tool: StudioHost brings
// framer-motion and the tool registry, which most lessons never need.
const StudioEmbed = dynamic(() => import("./studio/StudioEmbed"), {
  loading: () => <div className="my-5 h-48 animate-pulse rounded-2xl bg-[var(--s2)]" />,
});

// Minimal markdown renderer for admin-authored lesson bodies.
// Returns React nodes rather than HTML strings — there is no
// dangerouslySetInnerHTML anywhere here, so authored content cannot inject
// markup or scripts even if an admin account is compromised.

type Inline = React.ReactNode;

/** Glossary terms to underline (first use of each per lesson), components/learn/glossary. */
interface Gloss {
  re: RegExp;
  idOf: Map<string, string>;
  seen: Set<string>;
}

function makeGloss(entries: GlossEntry[] | undefined): Gloss | undefined {
  if (!entries?.length) return undefined;
  const idOf = new Map<string, string>();
  for (const e of entries) for (const f of e.forms) if (!idOf.has(f.toLowerCase())) idOf.set(f.toLowerCase(), e.id);
  if (!idOf.size) return undefined;
  return { re: new RegExp(formsPattern([...idOf.keys()]), "giu"), idOf, seen: new Set() };
}

/** Plain text with the first use of each glossary term wrapped. */
function glossText(text: string, key: string, gl: Gloss | undefined): Inline[] {
  if (!gl || !text) return [text];
  const out: Inline[] = [];
  let last = 0;
  let n = 0;
  gl.re.lastIndex = 0;
  for (const m of text.matchAll(gl.re)) {
    const id = gl.idOf.get(m[0].toLowerCase());
    if (!id || gl.seen.has(id) || m.index === undefined) continue;
    gl.seen.add(id);
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<GlossTerm key={`${key}-g${n++}`} id={id}>{m[0]}</GlossTerm>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Bold, italic, inline code and links — applied in that order. */
function renderInline(text: string, keyPrefix: string, gl?: Gloss): Inline[] {
  const nodes: Inline[] = [];
  // `code` | **bold** | *italic* | [label](url)
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(...glossText(text.slice(last, m.index), `${keyPrefix}-t${i}`, gl));
    const token = m[0];
    const key = `${keyPrefix}-i${i++}`;

    if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-[var(--s2)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--ink)]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-bold text-[var(--ink)]">
          {glossText(token.slice(2, -2), `${key}-b`, gl)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        const [, label, href] = link;
        // Only http(s), mailto and same-site paths — blocks javascript: and
        // data: URLs. Protocol-relative "//evil.com" is rejected too: it
        // starts with "/" but navigates off-site. So is "/\evil.com", which
        // browsers normalise to "//evil.com".
        const h = href.trim();
        const safe =
          /^(https?:\/\/|mailto:)/i.test(h) || (h.startsWith("/") && !/^\/[/\\]/.test(h));
        nodes.push(
          safe ? (
            <a
              key={key}
              href={h}
              target={h.startsWith("/") ? undefined : "_blank"}
              rel={h.startsWith("/") ? undefined : "noopener noreferrer"}
              className="font-medium text-[var(--blue2)] underline underline-offset-2"
            >
              {label}
            </a>
          ) : (
            <span key={key}>{label}</span>
          ),
        );
      } else {
        nodes.push(token);
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(...glossText(text.slice(last), `${keyPrefix}-tz`, gl));
  return nodes;
}

/**
 * Fenced blocks. ```try, ```text and ```prompt become runnable prompts that
 * load into the lesson's practice pad; ```playground becomes a live code
 * editor with a preview. Anything else is shown as code.
 */
function codeBlock(block: { lang: string; lines: string[] }, key: string): React.ReactNode {
  const lang = block.lang.trim().toLowerCase();
  const text = block.lines.join("\n");
  // data-narrate-skip: "Listen" (components/a11y/LessonListen) does not read
  // code or interactive widgets aloud.
  if (lang === "try" || lang === "text" || lang === "prompt")
    return <div key={key} data-narrate-skip><TryBlock text={text} /></div>;
  if (lang === "playground") return <div key={key} data-narrate-skip><Playground code={text} /></div>;
  if (lang === "studio") return <div key={key} data-narrate-skip><StudioEmbed spec={text} /></div>;
  return (
    // Focusable so keyboard users can scroll long lines (WCAG 2.1.1).
    <pre key={key} tabIndex={0} data-narrate-skip className="mb-4 overflow-x-auto rounded-xl bg-[var(--ink)] p-4 text-[0.8125rem] leading-relaxed text-white">
      <code>{text}</code>
    </pre>
  );
}

export default function Markdown({
  source,
  glossary,
  explain,
}: {
  source: string;
  glossary?: GlossEntry[];
  /** Lessons only: "Explain simpler" on each paragraph (lib/learn/explain/paragraphs.ts counts them the same way). */
  explain?: { lessonId: string };
}) {
  const gl = makeGloss(glossary);
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];

  // The page title is the <h1>, so the body's top heading level becomes <h2>
  // whatever the author used (a lesson that starts at "##" must not jump
  // from h1 to h3: WCAG 1.3.1 heading order). Sizes still follow the authored level.
  let fenced = false;
  let topLevel = 6;
  for (const l of lines) {
    if (l.trim().startsWith("```")) fenced = !fenced;
    const hm = !fenced && /^(#{1,4})\s+/.exec(l.trimEnd());
    if (hm) topLevel = Math.min(topLevel, hm[1].length);
  }

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: { lang: string; lines: string[] } | null = null;
  let quote: string[] = [];
  let table: string[] = [];
  let k = 0;
  // Every <p>, in order: the index the explain route uses to find it again.
  let pi = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ");
    const key = `p${k++}`;
    const cls = "mb-4 text-[0.9375rem] leading-[1.75] text-[var(--ink2)]";
    const inline = renderInline(text, `p${k}`, gl);
    const index = pi++;
    blocks.push(
      explain && text.length >= MIN_EXPLAIN_CHARS ? (
        <ExplainParagraph key={key} lessonId={explain.lessonId} index={index} hash={paraHash(text)} className={cls}>
          {inline}
        </ExplainParagraph>
      ) : (
        <p key={key} className={cls}>
          {inline}
        </p>
      ),
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`l${k++}`}
        className={`mb-4 space-y-1.5 pl-5 text-[0.9375rem] leading-[1.75] text-[var(--ink2)] ${
          list.ordered ? "list-decimal" : "list-disc"
        }`}
      >
        {list.items.map((it, ii) => (
          <li key={ii}>{renderInline(it, `l${k}-${ii}`, gl)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  const flushQuote = () => {
    if (quote.length === 0) return;
    blocks.push(
      <blockquote
        key={`q${k++}`}
        className="mb-4 border-l-4 border-[var(--orange)] bg-[var(--s2)] py-3 pl-4 pr-3 text-[0.9375rem] italic leading-[1.75] text-[var(--ink2)]"
      >
        {renderInline(quote.join(" "), `q${k}`, gl)}
      </blockquote>,
    );
    quote = [];
  };

  // GitHub-style tables: a header row, a |---| separator, then body rows. The
  // new certificate tracks use them for templates and comparisons; without
  // this they rendered as one run-on paragraph of pipes.
  const cells = (row: string) =>
    row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const isSeparator = (row: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(row.trim());
  const flushTable = () => {
    if (table.length === 0) return;
    const rows = table;
    table = [];
    // Not a real table (no separator on line 2): keep the text as a paragraph.
    if (rows.length < 2 || !isSeparator(rows[1])) {
      paragraph.push(...rows.map((r) => r.trim()));
      flushParagraph();
      return;
    }
    const head = cells(rows[0]);
    const body = rows.slice(2).map(cells);
    const key = `t${k++}`;
    blocks.push(
      // Focusable so a wide table can be scrolled with the keyboard.
      <div key={key} tabIndex={0} className="mb-5 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full border-collapse text-left text-[0.875rem] leading-relaxed">
          <thead className="bg-[var(--s2)]">
            <tr>
              {head.map((c, ci) => (
                <th key={ci} scope="col" className="min-w-[8rem] border-b border-[var(--border)] px-3 py-2 font-bold text-[var(--ink)] [overflow-wrap:break-word] [word-break:normal]">
                  {renderInline(c, `${key}-h${ci}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri} className="align-top even:bg-[var(--s2)]/40">
                {head.map((_, ci) => (
                  <td key={ci} className="min-w-[8rem] border-t border-[var(--border)] px-3 py-2 text-[var(--ink2)] [overflow-wrap:break-word] [word-break:normal]">
                    {renderInline(r[ci] ?? "", `${key}-${ri}-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
  };

  const flushAll = () => {
    flushTable();
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Fenced code blocks take precedence over everything
    if (code) {
      if (line.trim().startsWith("```")) {
        blocks.push(codeBlock(code, `c${k++}`));
        code = null;
      } else {
        code.lines.push(raw);
      }
      continue;
    }
    if (line.trim().startsWith("```")) {
      flushAll();
      code = { lang: line.trim().slice(3), lines: [] };
      continue;
    }

    if (line.trim() === "") {
      flushAll();
      continue;
    }

    // Table rows
    if (line.trim().startsWith("|")) {
      flushParagraph();
      flushList();
      flushQuote();
      table.push(line);
      continue;
    }
    if (table.length) flushTable();

    // Headings
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushAll();
      const level = h[1].length;
      const cls =
        level === 1
          ? "mt-8 mb-3 text-2xl font-black text-[var(--ink)]"
          : level === 2
          ? "mt-7 mb-3 text-xl font-bold text-[var(--ink)]"
          : level === 3
          ? "mt-6 mb-2 text-base font-bold text-[var(--ink)]"
          : "mt-5 mb-2 text-sm font-bold uppercase tracking-wide text-[var(--ink3)]";
      const Tag = (`h${Math.min(level - topLevel + 2, 6)}`) as "h2" | "h3" | "h4" | "h5" | "h6";
      blocks.push(
        <Tag key={`h${k++}`} className={cls}>
          {renderInline(h[2], `h${k}`)}
        </Tag>,
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushAll();
      blocks.push(<hr key={`hr${k++}`} className="my-6 border-[var(--border)]" />);
      continue;
    }

    // Blockquote
    const q = /^>\s?(.*)$/.exec(line);
    if (q) {
      flushParagraph();
      flushList();
      quote.push(q[1]);
      continue;
    }

    // Lists
    const ul = /^[-*+]\s+(.*)$/.exec(line.trim());
    const ol = /^\d+[.)]\s+(.*)$/.exec(line.trim());
    if (ul || ol) {
      flushParagraph();
      flushQuote();
      const ordered = !!ol;
      const item = (ul?.[1] ?? ol?.[1]) as string;
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(item);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }

  // Close anything still open at EOF
  if (code) blocks.push(codeBlock(code, `c${k++}`));
  flushAll();

  return <div className="max-w-none">{blocks}</div>;
}
