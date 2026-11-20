"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, SmilePlus } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import { REACTIONS, REACTION_EMOJI } from "@/lib/blog/engage/types";
import { goToCommentBox, useEngage } from "./engage-store";

// Reactions and comments within reach the whole time someone reads, not
// only under the article: buttons in the sticky reading bar, a short prompt
// half way through, and the comment count in the article's meta row. All
// read the same store as the discussion (./engage-store.tsx).

const total = (c: Record<string, number> | undefined) => (c ? Object.values(c).reduce((a, b) => a + b, 0) : 0);

/** The four reactions as a row of buttons. */
function ReactionRow({ onPicked, size = "md", testid }: { onPicked?: () => void; size?: "sm" | "md"; testid: string }) {
  const t = useT();
  const { data, react } = useEngage();
  const mine = data?.reactions.mine ?? null;
  const counts = data?.reactions.counts;
  return (
    <div role="group" aria-label={t("pages.article.talk.react.title")} className="flex items-stretch gap-1.5" data-testid={testid}>
      {REACTIONS.map((k) => {
        const on = mine === k;
        return (
          <button
            key={k}
            type="button"
            aria-pressed={on}
            aria-label={t(`pages.article.talk.react.${k}`)}
            title={t(`pages.article.talk.react.${k}`)}
            disabled={!data}
            onClick={() => {
              void react(k);
              onPicked?.();
            }}
            data-testid={`${testid}-${k}`}
            className={`flex flex-col items-center justify-center rounded-xl border font-dm font-semibold transition-colors ${
              size === "sm" ? "min-h-[48px] min-w-[48px] px-1.5 text-[10px]" : "min-h-[52px] min-w-[60px] px-2 text-[11px]"
            } ${on ? "border-[#F47C20] bg-[#FEF0E3] text-[#7A3E0E]" : "border-transparent bg-[#F4F7FB] text-[#3A4A5C] hover:border-[#2251A3]"}`}
          >
            <span aria-hidden="true" className={size === "sm" ? "text-xl leading-none" : "text-2xl leading-none"}>{REACTION_EMOJI[k]}</span>
            <span className="mt-0.5 tabular-nums">{counts && counts[k] > 0 ? counts[k] : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

/** React and Comment buttons for the sticky reading bar. */
export function StickyEngageButtons() {
  const t = useT();
  const locale = useLocale();
  const { data } = useEngage();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const mine = data?.reactions.mine ?? null;
  const reactions = total(data?.reactions.counts);
  const comments = data?.total ?? 0;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const btn = "inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 font-dm text-xs font-semibold transition-colors";
  return (
    <div className="flex shrink-0 items-center gap-1" data-testid="sticky-engage">
      <div ref={box} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={t("pages.article.talk.react.title")}
          onClick={() => setOpen((o) => !o)}
          data-testid="sticky-react"
          className={`${btn} ${mine ? "bg-[#FEF0E3] text-[#7A3E0E]" : "text-[#3A4A5C] hover:bg-[#F4F7FB]"}`}
        >
          {mine ? <span aria-hidden="true" className="text-base leading-none">{REACTION_EMOJI[mine]}</span> : <SmilePlus size={16} />}
          {reactions > 0 && <span className="tabular-nums">{reactions.toLocaleString(locale)}</span>}
        </button>
        {open && (
          <div className="absolute right-0 top-full z-40 mt-2 rounded-2xl border border-[#D2DCE8] bg-white p-2 shadow-xl" data-testid="sticky-react-menu">
            <p className="px-1 pb-1.5 font-dm text-xs font-bold text-[#0D1B2A]">{t("pages.article.talk.react.title")}</p>
            <ReactionRow size="sm" testid="sticky-reaction" onPicked={() => window.setTimeout(() => setOpen(false), 250)} />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={goToCommentBox}
        aria-label={comments ? (comments === 1 ? t("pages.article.talk.countOne") : t("pages.article.talk.countOther", { n: comments })) : t("pages.article.talk.jump")}
        data-testid="sticky-comment"
        className={`${btn} text-[#3A4A5C] hover:bg-[#F4F7FB]`}
      >
        <MessageCircle size={16} />
        <span className="tabular-nums">{comments > 0 ? comments.toLocaleString(locale) : <span className="hidden sm:inline">{t("pages.article.talk.jump")}</span>}</span>
      </button>
    </div>
  );
}

/** A short "what do you think so far?" strip half way through the article. */
export function MidArticlePrompt() {
  const t = useT();
  const locale = useLocale();
  const { data } = useEngage();
  const comments = data?.total ?? 0;
  return (
    <aside
      aria-label={t("pages.article.talk.mid.title")}
      className="not-prose my-8 flex flex-col gap-3 rounded-2xl border border-[#D2DCE8] bg-[#F9FBFD] p-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid="mid-prompt"
    >
      <div className="min-w-0">
        <p className="font-syne text-sm font-bold text-[#0D1B2A]">{t("pages.article.talk.mid.title")}</p>
        <button type="button" onClick={goToCommentBox} className="mt-1 inline-flex items-center gap-1.5 font-dm text-xs font-semibold text-[#2251A3] hover:underline" data-testid="mid-comment">
          <MessageCircle size={13} />
          {comments > 0
            ? t("pages.article.talk.mid.join", { count: comments === 1 ? t("pages.article.talk.countOne") : t("pages.article.talk.countOther", { n: comments.toLocaleString(locale) }) })
            : t("pages.article.talk.mid.first")}
        </button>
      </div>
      <ReactionRow testid="mid-reaction" />
    </aside>
  );
}

/** The comment count in the article's meta row, jumping to the comment box. */
export function CommentCountLink() {
  const t = useT();
  const locale = useLocale();
  const { data } = useEngage();
  const n = data?.total ?? 0;
  return (
    <a
      href="#discussion"
      onClick={(e) => {
        e.preventDefault();
        goToCommentBox();
      }}
      className="flex items-center gap-1 hover:text-[#2251A3]"
      data-testid="comment-jump"
    >
      <MessageCircle size={13} />
      {n ? (n === 1 ? t("pages.article.talk.countOne") : t("pages.article.talk.countOther", { n: n.toLocaleString(locale) })) : t("pages.article.talk.jump")}
    </a>
  );
}
