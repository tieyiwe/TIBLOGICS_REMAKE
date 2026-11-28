import type { ReactNode } from "react";

/**
 * Renders a legal document whose structure lives in its message file.
 *
 * Keys look like "pages.privacy.doc.03.02.li": section 03, block 02, a list
 * item. The order of the keys in the English messages is the document order,
 * so the text and its structure are edited in one place and every language
 * shares the same layout.
 */
type BlockType = "h2" | "h3" | "p" | "li" | "liu" | "caps" | "small" | "contact";

export default function LegalDoc({
  keys,
  prefix,
  t,
  contact,
}: {
  keys: string[];
  prefix: string;
  t: (key: string) => string;
  contact: ReactNode;
}) {
  const sections = new Map<string, { type: BlockType; key: string }[]>();
  for (const key of keys) {
    if (!key.startsWith(prefix)) continue;
    const [sec, , type] = key.slice(prefix.length).split(".");
    if (!sections.has(sec)) sections.set(sec, []);
    sections.get(sec)!.push({ type: type as BlockType, key });
  }

  return (
    <>
      {[...sections.entries()].map(([sec, blocks]) => {
        const out: ReactNode[] = [];
        let list: { key: string; upper: boolean }[] = [];
        const flush = () => {
          if (!list.length) return;
          const upper = list[0].upper;
          out.push(
            <ul key={`ul-${list[0].key}`} className={`list-disc pl-6 mt-2 space-y-2${upper ? " uppercase text-sm" : ""}`}>
              {list.map((li) => (
                <li key={li.key} dangerouslySetInnerHTML={{ __html: t(li.key) }} />
              ))}
            </ul>,
          );
          list = [];
        };
        blocks.forEach((b, i) => {
          if (b.type === "li" || b.type === "liu") {
            list.push({ key: b.key, upper: b.type === "liu" });
            return;
          }
          flush();
          const first = i === 0;
          const html = { __html: t(b.key) };
          switch (b.type) {
            case "h2":
              out.push(<h2 key={b.key} className="font-syne font-bold text-xl text-[#0D1B2A] mb-4" dangerouslySetInnerHTML={html} />);
              break;
            case "h3":
              out.push(<h3 key={b.key} className={`font-semibold text-[#0D1B2A] mb-2${first || blocks[i - 1]?.type === "h2" ? "" : " mt-6"}`} dangerouslySetInnerHTML={html} />);
              break;
            case "caps":
              out.push(<p key={b.key} className="uppercase text-sm font-semibold text-[#0D1B2A] mb-3" dangerouslySetInnerHTML={html} />);
              break;
            case "small":
              out.push(<p key={b.key} className="mt-4 text-sm text-[#7A8FA6]" dangerouslySetInnerHTML={html} />);
              break;
            case "contact":
              out.push(
                <div key={b.key}>
                  <p dangerouslySetInnerHTML={html} />
                  {contact}
                </div>,
              );
              break;
            default: {
              const prev = blocks[i - 1]?.type;
              const tight = first || prev === "h2" || prev === "h3" || prev === "caps";
              out.push(<p key={b.key} className={tight ? "" : "mt-4"} dangerouslySetInnerHTML={html} />);
            }
          }
        });
        flush();
        return <section key={sec}>{out}</section>;
      })}
    </>
  );
}
