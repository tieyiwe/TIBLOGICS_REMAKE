"use client";

import { useState, type ReactNode } from "react";
import {
  BarChart2, Bookmark, Globe, Heart, MessageCircle, MessageSquare, MoreHorizontal, Repeat2, Send, Share2, ThumbsUp,
} from "lucide-react";

// Platform-accurate previews for the kit editor and the post drawer. They
// are approximations of each network's current layout (fonts, truncation,
// chrome), sized to sit next to the editor.

export function CharRing({ value, max, size = 30 }: { value: number; max: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / Math.max(1, max));
  const over = value > max;
  const near = !over && value > max * 0.9;
  const color = over ? "var(--a-danger)" : near ? "var(--a-warn)" : "var(--a-success)";
  const left = max - value;
  return (
    <span className="inline-flex items-center gap-1.5" title={`${value} of ${max} characters`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value} of ${max} characters${over ? ", over the limit" : ""}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--a-surface-2)" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {(near || over) && (
          <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.32} fontWeight={700} fill={color}>
            {Math.abs(left) > 999 ? "!" : left}
          </text>
        )}
      </svg>
      <span className={`font-dm text-[11.5px] tabular-nums ${over ? "font-semibold text-[var(--a-danger)]" : "text-[var(--a-ink-3)]"}`}>
        {value.toLocaleString("en-US")}/{max.toLocaleString("en-US")}
      </span>
    </span>
  );
}

/** Text with links and hashtags coloured like the network does. */
function Rich({ text, link = "#0A66C2" }: { text: string; link?: string }) {
  const parts = text.split(/(https?:\/\/\S+|#[\p{L}\p{N}_]+)/u);
  return (
    <>
      {parts.map((p, i) =>
        /^(https?:\/\/|#)/.test(p) ? (
          <span key={i} style={{ color: link }} className="font-semibold">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Avatar({ size = 40, round = true }: { size?: number; round?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-[#0D1B2A] font-dm font-bold text-white ${round ? "rounded-full" : "rounded-md"}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      T<span className="text-[#F47C20]">.</span>
    </span>
  );
}

function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-xl border border-[#DCE3EC] bg-white text-left shadow-[0_1px_3px_rgba(13,27,42,.08)] ${className}`}>{children}</div>;
}

function Placeholder({ text, ratio = "1 / 1" }: { text: string; ratio?: string }) {
  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-[#0D1B2A] via-[#132C52] to-[#1B3A6B] p-6" style={{ aspectRatio: ratio }}>
      <p className="line-clamp-4 text-center font-dm text-[15px] font-bold leading-snug text-white">{text || "Your image card"}</p>
    </div>
  );
}

function Img({ src, alt, ratio }: { src?: string | null; alt: string; ratio?: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="block w-full bg-[#F1F4F9] object-cover" style={ratio ? { aspectRatio: ratio } : undefined} loading="lazy" />;
}

function useMore(text: string, limit: number) {
  const [open, setOpen] = useState(false);
  const cut = !open && text.length > limit;
  return { shown: cut ? text.slice(0, limit).replace(/\s+\S*$/, "") : text, cut, more: () => setOpen(true) };
}

export function LinkedInPreview({ text, image }: { text: string; image?: string | null }) {
  const m = useMore(text, 210);
  return (
    <Shell>
      <div className="flex items-start gap-2 px-3 pt-3">
        <Avatar size={44} round={false} />
        <div className="min-w-0 flex-1 font-[system-ui] leading-tight">
          <p className="text-[14px] font-semibold text-[rgba(0,0,0,.9)]">TIBLOGICS</p>
          <p className="text-[12px] text-[rgba(0,0,0,.6)]">AI-first. Tech-complete.</p>
          <p className="flex items-center gap-1 text-[12px] text-[rgba(0,0,0,.6)]">Now · <Globe size={11} aria-hidden /></p>
        </div>
        <MoreHorizontal size={18} className="text-[rgba(0,0,0,.6)]" aria-hidden />
      </div>
      <div className="whitespace-pre-wrap break-words px-3 pb-2 pt-2 font-[system-ui] text-[14px] leading-[1.42] text-[rgba(0,0,0,.9)]">
        <Rich text={m.shown} />
        {m.cut && (
          <button type="button" onClick={m.more} className="text-[rgba(0,0,0,.6)] hover:text-[#0A66C2] hover:underline">
            …see more
          </button>
        )}
      </div>
      <Img src={image} alt="Post image" />
      <div className="mx-3 flex items-center justify-between border-t border-[#E8E8E8] py-1 font-[system-ui] text-[13px] font-semibold text-[rgba(0,0,0,.6)]">
        {[[ThumbsUp, "Like"], [MessageSquare, "Comment"], [Repeat2, "Repost"], [Send, "Send"]].map(([I, l]) => {
          const Icon = I as typeof ThumbsUp;
          return (
            <span key={l as string} className="flex items-center gap-1 rounded px-2 py-2">
              <Icon size={16} aria-hidden /> <span className="hidden sm:inline">{l as string}</span>
            </span>
          );
        })}
      </div>
    </Shell>
  );
}

export function XPreview({ text, image }: { text: string; image?: string | null }) {
  return (
    <Shell className="px-3 py-3">
      <div className="flex gap-2.5">
        <Avatar size={40} />
        <div className="min-w-0 flex-1 font-[system-ui]">
          <p className="flex flex-wrap items-center gap-1 text-[15px] leading-5">
            <span className="font-bold text-[#0F1419]">TIBLOGICS</span>
            <span className="text-[#536471]">@tiblogics · now</span>
          </p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-5 text-[#0F1419]">
            <Rich text={text} link="#1D9BF0" />
          </p>
          {image && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-[#CFD9DE]">
              <Img src={image} alt="Post image" ratio="16 / 9" />
            </div>
          )}
          <div className="mt-2 flex max-w-[360px] justify-between text-[#536471]">
            {[MessageCircle, Repeat2, Heart, BarChart2, Bookmark].map((I, i) => (
              <I key={i} size={17} aria-hidden />
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function InstagramPreview({ text, image }: { text: string; image?: string | null }) {
  const m = useMore(text, 125);
  return (
    <Shell>
      <div className="flex items-center gap-2 px-3 py-2.5 font-[system-ui]">
        <span className="rounded-full bg-gradient-to-tr from-[#F9CE34] via-[#EE2A7B] to-[#6228D7] p-[2px]">
          <span className="block rounded-full bg-white p-[2px]">
            <Avatar size={28} />
          </span>
        </span>
        <span className="text-[14px] font-semibold text-[#262626]">tiblogics</span>
        <MoreHorizontal size={18} className="ml-auto text-[#262626]" aria-hidden />
      </div>
      {image ? <Img src={image} alt="Post image" /> : <Placeholder text={text.split("\n")[0]} />}
      <div className="flex items-center gap-3.5 px-3 pt-2.5 text-[#262626]">
        <Heart size={22} aria-hidden /> <MessageCircle size={22} aria-hidden /> <Send size={22} aria-hidden />
        <Bookmark size={22} className="ml-auto" aria-hidden />
      </div>
      <p className="whitespace-pre-wrap break-words px-3 pb-3 pt-1.5 font-[system-ui] text-[14px] leading-[18px] text-[#262626]">
        <span className="mr-1 font-semibold">tiblogics</span>
        <Rich text={m.shown} link="#00376B" />
        {m.cut && (
          <button type="button" onClick={m.more} className="text-[#737373]">
            … more
          </button>
        )}
      </p>
    </Shell>
  );
}

export function FacebookPreview({ text, image, linkUrl }: { text: string; image?: string | null; linkUrl?: string | null }) {
  const m = useMore(text, 300);
  let host = "tiblogics.com";
  try {
    if (linkUrl) host = new URL(linkUrl).host.toUpperCase();
  } catch { /* default */ }
  return (
    <Shell>
      <div className="flex items-center gap-2 px-3 pt-3 font-[system-ui]">
        <Avatar size={40} />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold text-[#050505]">TIBLOGICS</p>
          <p className="flex items-center gap-1 text-[13px] text-[#65676B]">Just now · <Globe size={11} aria-hidden /></p>
        </div>
        <MoreHorizontal size={20} className="ml-auto text-[#65676B]" aria-hidden />
      </div>
      <p className="whitespace-pre-wrap break-words px-3 py-2 font-[system-ui] text-[15px] leading-5 text-[#050505]">
        <Rich text={m.shown} link="#385898" />
        {m.cut && (
          <button type="button" onClick={m.more} className="font-semibold text-[#65676B] hover:underline">
            … See more
          </button>
        )}
      </p>
      {image ? (
        <Img src={image} alt="Post image" />
      ) : linkUrl ? (
        <div className="border-y border-[#DADDE1] bg-[#F0F2F5] px-3 py-2.5 font-[system-ui]">
          <p className="text-[12px] text-[#65676B]">{host}</p>
          <p className="text-[15px] font-semibold text-[#050505]">TIBLOGICS</p>
        </div>
      ) : null}
      <div className="mx-3 flex justify-around border-t border-[#CED0D4] py-1.5 font-[system-ui] text-[14px] font-semibold text-[#65676B]">
        <span className="flex items-center gap-1.5"><ThumbsUp size={17} aria-hidden /> Like</span>
        <span className="flex items-center gap-1.5"><MessageCircle size={17} aria-hidden /> Comment</span>
        <span className="flex items-center gap-1.5"><Share2 size={17} aria-hidden /> Share</span>
      </div>
    </Shell>
  );
}

export function WhatsAppStatusPreview({ text, image }: { text: string; image?: string | null }) {
  return (
    <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-[26px] border-[6px] border-[#111B21] bg-[#111B21] shadow-[0_8px_24px_rgba(13,27,42,.25)]">
      <div className="relative flex flex-col" style={{ aspectRatio: "9 / 16" }}>
        <div className="flex gap-1 px-2 pt-2">
          <span className="h-[3px] flex-1 rounded bg-white/90" />
          <span className="h-[3px] flex-1 rounded bg-white/35" />
        </div>
        <div className="flex items-center gap-2 px-2.5 py-2 font-[system-ui]">
          <Avatar size={28} />
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-white">My status</p>
            <p className="text-[11px] text-white/70">Just now</p>
          </div>
        </div>
        {image ? (
          <div className="flex flex-1 items-center">
            <Img src={image} alt="Status image" />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-[#1F7A5A] px-4">
            <p className="whitespace-pre-wrap break-words text-center font-[system-ui] text-[15px] font-medium leading-snug text-white">
              <Rich text={text} link="#C7F5E3" />
            </p>
          </div>
        )}
        {image && text && <p className="line-clamp-3 bg-black/60 px-3 py-2 text-center font-[system-ui] text-[12px] text-white">{text}</p>}
        <p className="py-2 text-center font-[system-ui] text-[12px] text-white/80">Reply</p>
      </div>
    </div>
  );
}

export function PostPreview({ platform, text, image, linkUrl }: { platform: string; text: string; image?: string | null; linkUrl?: string | null }) {
  if (platform === "x") return <XPreview text={text} image={image} />;
  if (platform === "instagram") return <InstagramPreview text={text} image={image} />;
  if (platform === "facebook") return <FacebookPreview text={text} image={image} linkUrl={linkUrl} />;
  if (platform === "whatsapp") return <WhatsAppStatusPreview text={text} image={image} />;
  return <LinkedInPreview text={text} image={image} />;
}

export function EmailPreview({ subject, preview, body, cta, fromName = "TIBLOGICS" }: { subject: string; preview: string; body: string; cta: string; fromName?: string }) {
  return (
    <div className="space-y-2">
      <Shell className="flex items-start gap-3 px-3 py-2.5">
        <Avatar size={32} />
        <div className="min-w-0 flex-1 font-[system-ui]">
          <p className="flex items-center justify-between gap-2 text-[13px] font-bold text-[#202124]">
            {fromName} <span className="text-[11px] font-normal text-[#5F6368]">9:41 AM</span>
          </p>
          <p className="truncate text-[13px] font-semibold text-[#202124]">{subject || "Subject line"}</p>
          <p className="truncate text-[13px] text-[#5F6368]">{preview || body.slice(0, 90)}</p>
        </div>
      </Shell>
      <Shell className="px-5 py-4">
        <p className="mb-3 font-[system-ui] text-[17px] font-semibold text-[#202124]">{subject || "Subject line"}</p>
        <div className="space-y-3 font-[Arial,Helvetica,sans-serif] text-[14px] leading-[1.6] text-[#0D1B2A]">
          {body.split(/\n{2,}/).filter(Boolean).map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">{p}</p>
          ))}
        </div>
        <span className="mt-4 inline-block rounded-lg bg-[#F47C20] px-5 py-2.5 font-[Arial,Helvetica,sans-serif] text-[14px] font-semibold text-white">{cta || "Learn more"}</span>
        <p className="mt-5 border-t border-[#E5EAF2] pt-2 font-[Arial] text-[11px] text-[#7A8FA6]">You get this because you subscribed to TIBLOGICS news. Unsubscribe.</p>
      </Shell>
    </div>
  );
}

export function GoogleAdPreview({ headline, headline2, description }: { headline: string; headline2: string; description: string }) {
  return (
    <Shell className="px-4 py-3 font-[Arial,sans-serif]">
      <p className="text-[12px] font-bold text-[#202124]">Sponsored</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F1F3F4] text-[11px] font-bold text-[#0D1B2A]">T</span>
        <div className="leading-tight">
          <p className="text-[14px] text-[#202124]">TIBLOGICS</p>
          <p className="text-[12px] text-[#4D5156]">https://tiblogics.com</p>
        </div>
      </div>
      <p className="mt-1.5 text-[20px] leading-[1.3] text-[#1A0DAB]">
        {headline || "Headline 1"}
        {headline2 ? ` | ${headline2}` : ""}
      </p>
      <p className="mt-0.5 text-[14px] leading-[1.58] text-[#4D5156]">{description || "Description"}</p>
    </Shell>
  );
}

export function MetaAdPreview({ primaryText, headline, description, cta, image }: { primaryText: string; headline: string; description: string; cta: string; image?: string | null }) {
  return (
    <Shell>
      <div className="flex items-center gap-2 px-3 pt-3 font-[system-ui]">
        <Avatar size={36} />
        <div className="leading-tight">
          <p className="text-[14px] font-semibold text-[#050505]">TIBLOGICS</p>
          <p className="text-[12px] text-[#65676B]">Sponsored · <Globe size={10} className="inline" aria-hidden /></p>
        </div>
      </div>
      <p className="whitespace-pre-wrap px-3 py-2 font-[system-ui] text-[14px] leading-5 text-[#050505]">{primaryText}</p>
      {image ? <Img src={image} alt="Ad image" /> : <Placeholder text={headline} ratio="1.91 / 1" />}
      <div className="flex items-center gap-3 bg-[#F0F2F5] px-3 py-2.5 font-[system-ui]">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[12px] uppercase text-[#65676B]">tiblogics.com</p>
          <p className="truncate text-[15px] font-semibold text-[#050505]">{headline}</p>
          {description && <p className="truncate text-[13px] text-[#65676B]">{description}</p>}
        </div>
        <span className="shrink-0 rounded-md bg-[#E4E6EB] px-3 py-1.5 text-[14px] font-semibold text-[#050505]">{cta || "Learn more"}</span>
      </div>
    </Shell>
  );
}

export function LinkedInAdPreview({ primaryText, headline, cta, image }: { primaryText: string; headline: string; cta: string; image?: string | null }) {
  return (
    <Shell>
      <div className="flex items-center gap-2 px-3 pt-3 font-[system-ui]">
        <Avatar size={40} round={false} />
        <div className="leading-tight">
          <p className="text-[14px] font-semibold text-[rgba(0,0,0,.9)]">TIBLOGICS</p>
          <p className="text-[12px] text-[rgba(0,0,0,.6)]">Promoted</p>
        </div>
      </div>
      <p className="whitespace-pre-wrap px-3 py-2 font-[system-ui] text-[14px] leading-5 text-[rgba(0,0,0,.9)]">{primaryText}</p>
      {image ? <Img src={image} alt="Ad image" /> : <Placeholder text={headline} ratio="1.91 / 1" />}
      <div className="flex items-center gap-3 bg-[#EEF3F8] px-3 py-2.5 font-[system-ui]">
        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[rgba(0,0,0,.9)]">{headline}</p>
        <span className="shrink-0 rounded-full border border-[#0A66C2] px-3 py-1 text-[14px] font-semibold text-[#0A66C2]">{cta || "Learn more"}</span>
      </div>
    </Shell>
  );
}

export function LandingPreview({ headline, subheadline, bullets, cta }: { headline: string; subheadline: string; bullets: string[]; cta: string }) {
  return (
    <Shell>
      <div className="flex items-center gap-1.5 border-b border-[#E3E9F1] bg-[#F1F4F9] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" /><span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
        <span className="ml-2 flex-1 truncate rounded-md bg-white px-2 py-0.5 font-dm text-[11px] text-[#5A6E84]">tiblogics.com</span>
      </div>
      <div className="bg-gradient-to-br from-[#0D1B2A] via-[#132C52] to-[#1B3A6B] px-6 py-8">
        <p className="font-dm text-[11px] font-bold uppercase tracking-[.18em] text-[#F47C20]">TIBLOGICS</p>
        <h3 className="mt-2 font-syne text-[26px] font-bold leading-tight text-white">{headline || "Your headline"}</h3>
        <p className="mt-2 font-dm text-[14px] leading-relaxed text-white/80">{subheadline}</p>
        <ul className="mt-3 space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 font-dm text-[13px] text-white/90">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47C20]" />
              {b}
            </li>
          ))}
        </ul>
        <span className="mt-5 inline-block rounded-lg bg-[#F47C20] px-5 py-2.5 font-dm text-[14px] font-bold text-white">{cta || "Get started"}</span>
      </div>
    </Shell>
  );
}

export function VideoPreview({ hook, onScreenText, cta, durationSeconds }: { hook: string; onScreenText: string[]; cta: string; durationSeconds: number }) {
  return (
    <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-[26px] border-[6px] border-[#111B21] bg-gradient-to-b from-[#1B3A6B] to-[#0D1B2A] shadow-[0_8px_24px_rgba(13,27,42,.25)]">
      <div className="relative flex flex-col justify-between p-4" style={{ aspectRatio: "9 / 16" }}>
        <p className="font-dm text-[11px] text-white/70">Reel · {durationSeconds}s</p>
        <div className="space-y-2">
          <p className="rounded-lg bg-white px-2.5 py-1.5 text-center font-dm text-[15px] font-extrabold leading-snug text-[#0D1B2A]">{hook || "Your hook"}</p>
          {onScreenText.slice(0, 3).map((t, i) => (
            <p key={i} className="mx-auto w-fit rounded bg-[#F47C20] px-2 py-0.5 text-center font-dm text-[12px] font-bold text-white">{t}</p>
          ))}
        </div>
        <p className="text-center font-dm text-[12px] font-semibold text-white">{cta}</p>
      </div>
    </div>
  );
}
