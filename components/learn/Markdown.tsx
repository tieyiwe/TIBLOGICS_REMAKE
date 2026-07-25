import React from "react";

// Minimal markdown renderer for admin-authored lesson bodies.
// Returns React nodes rather than HTML strings — there is no
// dangerouslySetInnerHTML anywhere here, so authored content cannot inject
// markup or scripts even if an admin account is compromised.

type Inline = React.ReactNode;

/** Bold, italic, inline code and links — applied in that order. */
function renderInline(text: string, keyPrefix: string): Inline[] {
  const nodes: Inline[] = [];
  // `code` | **bold** | *italic* | [label](url)
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
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
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        const [, label, href] = link;
        // Only http(s), mailto and same-site paths — blocks javascript: URLs
        const safe = /^(https?:\/\/|mailto:|\/)/i.test(href.trim());
        nodes.push(
          safe ? (
            <a
              key={key}
              href={href.trim()}
              target={href.startsWith("/") ? undefined : "_blank"}
              rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
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
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: { lang: string; lines: string[] } | null = null;
  let quote: string[] = [];
  let k = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={`p${k++}`} className="mb-4 text-[15px] leading-[1.75] text-[var(--ink2)]">
        {renderInline(paragraph.join(" "), `p${k}`)}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`l${k++}`}
        className={`mb-4 space-y-1.5 pl-5 text-[15px] leading-[1.75] text-[var(--ink2)] ${
          list.ordered ? "list-decimal" : "list-disc"
        }`}
      >
        {list.items.map((it, ii) => (
          <li key={ii}>{renderInline(it, `l${k}-${ii}`)}</li>
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
        className="mb-4 border-l-4 border-[var(--orange)] bg-[var(--s2)] py-3 pl-4 pr-3 text-[15px] italic leading-[1.75] text-[var(--ink2)]"
      >
        {renderInline(quote.join(" "), `q${k}`)}
      </blockquote>,
    );
    quote = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Fenced code blocks take precedence over everything
    if (code) {
      if (line.trim().startsWith("```")) {
        blocks.push(
          <pre
            key={`c${k++}`}
            className="mb-4 overflow-x-auto rounded-xl bg-[var(--ink)] p-4 text-[13px] leading-relaxed text-white"
          >
            <code>{code.lines.join("\n")}</code>
          </pre>,
        );
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
      const Tag = (`h${Math.min(level + 1, 6)}`) as "h2" | "h3" | "h4" | "h5" | "h6";
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
  if (code) {
    blocks.push(
      <pre key={`c${k++}`} className="mb-4 overflow-x-auto rounded-xl bg-[var(--ink)] p-4 text-[13px] text-white">
        <code>{code.lines.join("\n")}</code>
      </pre>,
    );
  }
  flushAll();

  return <div className="max-w-none">{blocks}</div>;
}
