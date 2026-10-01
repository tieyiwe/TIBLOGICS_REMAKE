// Shape of a product marketing kit (GrowthKit.content). Client-safe.
import { isPlatform, type Platform } from "./platforms";

export interface KitPost {
  platform: Platform;
  text: string;
  hashtags: string[];
}
export interface KitEmail {
  subject: string;
  preview: string;
  body: string;
  cta: string;
}
export type AdNetwork = "meta" | "google" | "linkedin";
export interface KitAd {
  network: AdNetwork;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
}
export interface KitCalendarEntry {
  day: number; // 1..14
  channel: Platform | "email";
  ref: number; // index into posts or emails
  note: string;
}
export interface KitContent {
  positioning: string;
  pains: string[];
  benefits: string[];
  hero: { headline: string; subheadline: string; bullets: string[]; cta: string };
  posts: KitPost[];
  emails: KitEmail[];
  ads: KitAd[];
  video: { title: string; hook: string; script: string; onScreenText: string[]; cta: string; durationSeconds: number };
  calendar: KitCalendarEntry[];
  /** NewsletterCampaign ids created from the emails (set by "Send to newsletter"). */
  newsletterCampaignIds?: string[];
}

const s = (v: unknown, max = 4000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const strs = (v: unknown, n: number, max = 400) => arr(v).map((x) => s(x, max)).filter(Boolean).slice(0, n);
const NETWORKS: AdNetwork[] = ["meta", "google", "linkedin"];

export function cleanHashtag(h: string): string {
  return h.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 40);
}

/** Accepts model output or an edited kit from the browser; returns a clean kit. */
export function normalizeKit(raw: unknown): KitContent {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const hero = (r.hero && typeof r.hero === "object" ? r.hero : {}) as Record<string, unknown>;
  const video = (r.video && typeof r.video === "object" ? r.video : {}) as Record<string, unknown>;
  const posts = arr(r.posts)
    .map((p) => {
      const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
      const platform = o.platform === "twitter" ? "x" : o.platform;
      if (!isPlatform(platform)) return null;
      return {
        platform,
        text: s(o.text, 3000),
        hashtags: strs(o.hashtags, 15, 60).map(cleanHashtag).filter(Boolean),
      };
    })
    .filter((p): p is KitPost => !!p && !!p.text)
    .slice(0, 20);
  const emails = arr(r.emails)
    .map((e) => {
      const o = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
      return { subject: s(o.subject, 200), preview: s(o.preview, 200), body: s(o.body, 6000), cta: s(o.cta, 120) };
    })
    .filter((e) => e.subject && e.body)
    .slice(0, 5);
  const ads = arr(r.ads)
    .map((a) => {
      const o = (a && typeof a === "object" ? a : {}) as Record<string, unknown>;
      const network = NETWORKS.includes(o.network as AdNetwork) ? (o.network as AdNetwork) : null;
      if (!network) return null;
      return { network, headline: s(o.headline, 200), primaryText: s(o.primaryText, 1000), description: s(o.description, 300), cta: s(o.cta, 60) };
    })
    .filter((a): a is KitAd => !!a)
    .slice(0, 6);
  const calendar = arr(r.calendar)
    .map((c) => {
      const o = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
      const channel = o.channel === "twitter" ? "x" : o.channel;
      const day = Math.round(Number(o.day));
      const ref = Math.round(Number(o.ref));
      if (!(channel === "email" || isPlatform(channel)) || !(day >= 1 && day <= 14) || !(ref >= 0 && ref < 20)) return null;
      return { day, channel: channel as Platform | "email", ref, note: s(o.note, 300) };
    })
    .filter((c): c is KitCalendarEntry => !!c)
    .slice(0, 40)
    .sort((a, b) => a.day - b.day);
  const dur = Math.round(Number(video.durationSeconds));
  return {
    positioning: s(r.positioning, 400),
    pains: strs(r.pains, 8),
    benefits: strs(r.benefits, 8),
    hero: { headline: s(hero.headline, 200), subheadline: s(hero.subheadline, 400), bullets: strs(hero.bullets, 6, 200), cta: s(hero.cta, 60) },
    posts,
    emails,
    ads,
    video: {
      title: s(video.title, 200),
      hook: s(video.hook, 300),
      script: s(video.script, 4000),
      onScreenText: strs(video.onScreenText, 10, 120),
      cta: s(video.cta, 120),
      durationSeconds: dur >= 15 && dur <= 90 ? dur : 45,
    },
    calendar,
    newsletterCampaignIds: strs(r.newsletterCampaignIds, 5, 40),
  };
}
