import type { Locale } from "./config";
import { dictionary } from "./messages";

// The slice of the dictionary that is sent to the browser.
//
// Every page used to embed the whole dictionary (7,400 keys, ~600 KB of JSON
// in every HTML response) for useT(). Now the root layout sends the "core"
// messages, and each area that needs more adds its namespaces with
// <ClientMessages area="..."> (components/i18n/ClientMessages.tsx), which
// merges into the parent provider. Server components keep using getT() with
// the full dictionary.
//
// Adding a client component that uses a namespace listed in AREAS below?
// Make sure its route is wrapped in that area (see the layouts listed there).

/** Read only on the server (emails, API errors, SEO, legal pages): never sent. */
const SERVER_ONLY = [
  "seo.", "comms.", "updates.", "accountStatus.",
  "learn.email.", "team.email.", "learn.scholar.email.", "learn.scholar.notice.", "learn.scholar.welcome.", "learn.scholar.remind.",
  "learn.scholar.letter.", "donate.email.", "learn.scholarApply.email.received.", "learn.scholarApply.email.declined.", "learn.scholarApply.meta.",
  "pages.terms.", "pages.privacy.", "pages.api.",
  // Sections rendered by server components only (getT).
  "pages.about.", "pages.products.", "a11y.page.", "site.footer.", "site.meta.",
  "home.booking.", "home.servicesGrid.", "home.banner.", "home.africa.", "home.productsGrid.",
  "home.services.", "home.products.", "home.meta.", "home.hero.", "home.cta.",
  "acquire.email.", "acquire.unsub.", "acquire.lp.", "acquire.asset.",
];

/**
 * Studio tool texts (~210 KB). Only the name and description travel with the
 * learn area; the rest is fetched by StudioHost when a tool is shown
 * (useLazyMessages("studio") → /api/i18n/messages), or sent up front on the
 * Studio tool page.
 */
const STUDIO_TOOLS = /^studio\.(automation-builder|loop-mapper|prompt-builder|task-sorter|spot-the-risk|wireframe-builder|prompt-arena|critic-mode|test-bench|security-doors|teach-the-machine|feed-simulator|fake-or-real|system-mapper|youth)\.(?!(name|desc)$)/;

export type MessageArea = "learn" | "member" | "tools" | "calculator" | "toolkit" | "studio" | "donate" | "pagesBook" | "pagesServices" | "pagesBlog" | "pagesEvents" | "pagesContact" | "pagesStore";

/**
 * Namespaces sent only inside an area:
 *  learn      Learning Box components shown publicly: learning-box, certificates,
 *             badges, p, join-team, and (with member) app/learn
 *  member     the member area: app/learn, join-team, admin lesson editor
 *  tools      app/(public)/tools, blueprint, monitor, toolkit
 *  calculator app/(public)/tools/calculator
 *  toolkit    app/toolkit
 *  studio     the full Studio tool texts (Studio tool page, lazy elsewhere)
 */
const AREAS: Record<MessageArea, string[]> = {
  // "support.": the "Need help?" panel, also on learning-box/join and join-team.
  learn: ["learn.", "badges.", "team.", "support."],
  member: [
    "labs.", "community.", "method.", "game.", "live.", "mastery.", "pwa.",
    "tutor.", "video.", "referrals.", "resume.", "inbox.", "drafts.", "changePassword.", "authStatus.",
    "unsubscribe.", "studio.",
  ],
  tools: ["tools."],
  calculator: ["calculator."],
  toolkit: ["toolkit.", "tools."],
  studio: ["studio."],
  // The scholarship donate box (ARFA, the scholarship page, Partners, About).
  donate: ["donate."],
  // Public page texts, sent only with their own section (app/(public)/<x>/layout.tsx)
  // instead of with every page of the site.
  pagesBook: ["pages.book.", "pages.bookSuccess."],
  pagesServices: ["pages.services.", "pages.getStarted."],
  pagesBlog: ["pages.aiTimes.", "pages.article.", "pages.newsletter.", "pages.promo."],
  pagesEvents: ["pages.events."],
  pagesContact: ["pages.contact."],
  pagesStore: ["pages.store."],
};

const AREA_PREFIXES = Object.values(AREAS).flat();

const starts = (k: string, list: string[]) => list.some((p) => k.startsWith(p));

function pick(locale: Locale, keep: (k: string) => boolean): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(dictionary(locale))) if (keep(k)) out[k] = v;
  return out;
}

const memo = new Map<string, Record<string, string>>();
function cached(key: string, build: () => Record<string, string>) {
  let hit = memo.get(key);
  if (!hit) memo.set(key, (hit = build()));
  return hit;
}

/** What every page gets (root layout). */
export function coreMessages(locale: Locale): Record<string, string> {
  return cached(`core:${locale}`, () => pick(locale, (k) => !starts(k, SERVER_ONLY) && !starts(k, AREA_PREFIXES)));
}

/** The extra messages one area adds on top of the core. */
export function areaMessages(locale: Locale, area: MessageArea): Record<string, string> {
  return cached(`${area}:${locale}`, () =>
    pick(locale, (k) => starts(k, AREAS[area]) && !starts(k, SERVER_ONLY) && (area === "studio" || !STUDIO_TOOLS.test(k))),
  );
}

export function isMessageArea(v: unknown): v is MessageArea {
  // Own keys only: `in` also accepts "constructor", "toString"... (a 500 from
  // /api/i18n/messages?area=constructor).
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(AREAS, v);
}
