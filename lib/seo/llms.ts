// /llms.txt and /llms-full.txt: plain-text summaries of the site for AI
// engines, following the llms.txt convention (https://llmstxt.org): an H1
// name, a blockquote summary, then sections of links with one-line
// descriptions. The full version adds the details an assistant needs to
// answer questions without visiting every page.
//
// Every fact comes from the code or the database: service copy from the
// dictionaries, prices from lib/learn/pricing.ts and lib/payments/provider.ts,
// tracks, products, events and articles from Prisma. Nothing is invented.

import prisma from "@/lib/prisma";
import { translatorFor } from "@/lib/i18n/server";
import { fmtPrice } from "@/lib/learn/format";
import { getCatalog } from "@/lib/learn/catalog";
import { getTeamPricing } from "@/lib/learn/team/settings";
import { toolkitPlans } from "@/lib/toolkit/config";
import { blueprintPrice, creditDays } from "@/lib/blueprint/config";
import { monitorPricing } from "@/lib/monitor/config";
import { LIBRARY_SIZE, LIBRARY_VERTICALS } from "@/lib/toolkit/library";
import { academyFaq, academySummary, type AcademySummary } from "./academy";
import { plain } from "./meta";
import { ORG, SITE_URL, absUrl } from "./site";

const t = translatorFor("en");
const money = (c: number) => fmtPrice(c, "en-US");
const LEVEL: Record<string, string> = { starter: "Beginner", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
const level = (a: string, b?: string | null) => (b && b !== a ? `${LEVEL[a] ?? a} to ${LEVEL[b] ?? b}` : LEVEL[a] ?? a);
const oneLine = (s: string | null | undefined, max = 240) => {
  const x = plain(s ?? "");
  return x.length > max ? `${x.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : x;
};

const SERVICES = ["agents", "automation", "strategy", "web", "mobile", "security", "data", "iot", "training"];

interface SiteData {
  academy: AcademySummary;
  comingSoon: Array<{ slug: string; title: string; tagline: string | null }>;
  products: Array<{ slug: string; name: string; tagline: string | null; description: string; price: number; currency: string; category: string }>;
  events: Array<{ slug: string; title: string; description: string; date: Date | null; price: number; currency: string; location: string }>;
  posts: Array<{ slug: string; title: string; excerpt: string; createdAt: Date; category: string }>;
  team: { seatPriceCents: number; minSeats: number } | null;
}

async function load(postLimit: number): Promise<SiteData> {
  const catalog = await getCatalog();
  const [academy, products, events, posts, team] = await Promise.all([
    academySummary(catalog),
    prisma.product
      .findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: { slug: true, name: true, tagline: true, description: true, price: true, currency: true, category: true },
      })
      .catch(() => []),
    prisma.event
      .findMany({
        where: { published: true },
        orderBy: { date: "asc" },
        select: { slug: true, title: true, description: true, date: true, price: true, currency: true, location: true },
      })
      .catch(() => []),
    prisma.blogPost
      .findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: postLimit,
        select: { slug: true, title: true, excerpt: true, createdAt: true, category: true },
      })
      .catch(() => []),
    getTeamPricing().catch(() => null),
  ]);
  return {
    academy,
    comingSoon: catalog.filter((c) => c.status === "coming_soon").map((c) => ({ slug: c.slug, title: c.title, tagline: c.tagline })),
    products,
    events,
    posts,
    team: team ? { seatPriceCents: team.seatPriceCents, minSeats: team.minSeats } : null,
  };
}

const SUMMARY =
  "TIBLOGICS is an AI implementation agency serving businesses in North America and Africa, including francophone Africa, in English and French. It builds AI agents, workflow automation and full-stack digital products, and runs ARFA (AI Readiness For All), an online AI academy whose courses end in verifiable certificates.";

function toolLines(): string[] {
  const tk = toolkitPlans();
  const bp = blueprintPrice();
  const mon = monitorPricing();
  return [
    `- [Website AI Scanner](${absUrl("/tools/scanner")}): free, no signup. ${t("tools.index.scanner.desc")}`,
    `- [AI Product Cost Calculator](${absUrl("/tools/calculator")}): free. ${t("tools.index.calculator.desc")}`,
    `- [Toolkit Live + Compliance Guard](${absUrl("/tools/toolkit-live")}): paid monthly subscription${tk.toolkit.amount ? ` (${money(tk.toolkit.amount)}/month)` : ""}. ${LIBRARY_SIZE} AI prompts for ${LIBRARY_VERTICALS.length} fields, filled in with your business details; Compliance Guard flags Fair Housing, financial-advertising and FTC risks.`,
    `- [Automation Blueprint](${absUrl("/tools/automation-blueprint")}): ${bp ? `${money(bp)} one time; ` : ""}a written plan for automating up to three repetitive processes, credited against the build if TIBLOGICS builds it within ${creditDays()} days.`,
    `- [Readiness Monitor](${absUrl("/tools/readiness-monitor")}): ${mon ? `${money(mon.amount)}/month; ` : ""}${t("tools.index.monitor.desc")}`,
  ];
}

function trackLine(c: AcademySummary["live"][number]): string {
  return `- [${c.title}](${absUrl(`/learning-box/${c.slug}`)}): ${level(c.level, c.levelEnd)}; about ${c.hours} hours; ${money(c.shownPriceCents)} one time (or all tracks by subscription); certificate: ${c.certificateName}. ${oneLine(c.tagline, 160)}`;
}

/** /llms.txt: the short index. */
export async function buildLlmsTxt(): Promise<string> {
  const d = await load(10);
  const a = d.academy;
  const out: string[] = [];
  out.push("# TIBLOGICS", "", `> ${SUMMARY}`, "");
  out.push(
    `Founder and CEO: ${ORG.founder.name}. Contact: ${ORG.email}. ${ORG.discoveryCall}: ${absUrl("/book")}. Services are delivered in English and French; the website is in English, French and Swahili.`,
    "",
  );

  out.push("## Services", "");
  for (const s of SERVICES) out.push(`- [${t(`pages.services.svc.${s}.name`)}](${absUrl(s === "training" ? "/learning-box" : "/services")}): ${t(`pages.services.svc.${s}.desc`)}`);
  out.push("");

  out.push("## ARFA AI Academy (online AI courses with certificates)", "");
  out.push(
    `- [ARFA catalog](${absUrl("/learning-box")}): ${a.live.length} self-paced certificate tracks in English and French${a.live.length ? `, ${money(a.minPriceCents)} to ${money(a.maxPriceCents)} per track one time, or ${money(a.monthlyCents)}/month for every track (cancel anytime)` : ""}.`,
  );
  for (const c of a.live) out.push(trackLine(c));
  out.push("");

  out.push("## Tools", "");
  out.push(...toolLines(), "");

  out.push("## Store", "");
  out.push(`- [Store](${absUrl("/store")}): industry AI toolkits and prompt packs, delivered as instant downloads.`);
  for (const p of d.products.slice(0, 12)) out.push(`- [${p.name}](${absUrl(`/store/${p.slug}`)}): ${money(p.price)}. ${oneLine(p.tagline ?? p.description, 160)}`);
  out.push("");

  out.push("## AI Times (articles)", "");
  out.push(`- [AI Times](${absUrl("/ai-times")}): articles on AI for business, in English, French and Swahili. RSS: ${absUrl("/ai-times/feed.xml")}`);
  for (const p of d.posts) out.push(`- [${p.title}](${absUrl(`/ai-times/${p.slug}`)}): ${oneLine(p.excerpt, 160)}`);
  out.push("");

  out.push("## Company", "");
  out.push(
    `- [Company facts at a glance](${absUrl("/about/facts")}): who, what, where, products and contacts in quotable sentences.`,
    `- [About](${absUrl("/about")}): mission, markets and operating principles.`,
    `- [Book a free discovery call](${absUrl("/book")}): 30 minutes, no obligation.`,
    `- [Contact](${absUrl("/contact")}): ${ORG.email}.`,
    `- [Events](${absUrl("/events")}): live AI trainings and workshops.`,
    `- [Startups & products](${absUrl("/products")}): ventures built by TIBLOGICS.`,
    "",
  );

  out.push("## Optional", "");
  out.push(
    `- [Full text for LLMs](${absUrl("/llms-full.txt")}): every track, FAQ and fact in one file.`,
    `- [Sitemap](${absUrl("/sitemap.xml")})`,
    `- [Privacy policy](${absUrl("/privacy")})`,
    `- [Terms of service](${absUrl("/terms")})`,
    `- [Accessibility](${absUrl("/accessibility")})`,
    "",
  );
  return out.join("\n");
}

/** /llms-full.txt: the long version, everything an assistant needs. */
export async function buildLlmsFullTxt(): Promise<string> {
  const d = await load(30);
  const a = d.academy;
  const out: string[] = [];
  const h = (s: string) => out.push("", `## ${s}`, "");

  out.push("# TIBLOGICS: full information for AI assistants", "", `> ${SUMMARY}`, "");
  out.push(`Source: ${SITE_URL}. Generated ${new Date().toISOString().slice(0, 10)} from the live site. Short version: ${absUrl("/llms.txt")}.`);

  h("Company facts");
  out.push(
    `- Name: TIBLOGICS (${SITE_URL})`,
    `- What it is: ${t("seo.facts.who.v")}`,
    `- Founder: ${t("seo.facts.founder.v")}`,
    `- Where it works: ${t("seo.facts.where.v")}`,
    `- Languages: ${t("seo.facts.lang.v")}`,
    `- How projects start: ${t("seo.facts.start.v")}`,
    `- General enquiries: ${ORG.email}`,
    `- Founder's email: ${ORG.founderEmail}`,
    `- ARFA AI Academy: ${ORG.academyEmail}`,
    `- Book a call: ${absUrl("/book")}`,
    `- Social profiles: ${ORG.sameAs.join(", ")}`,
  );

  h("Services");
  for (const s of SERVICES) out.push(`### ${t(`pages.services.svc.${s}.name`)}`, "", t(`pages.services.svc.${s}.desc`), "");
  out.push("### How an engagement runs", "");
  for (const n of [1, 2, 3, 4]) out.push(`${n}. ${t(`pages.services.step${n}.title`)}: ${t(`pages.services.step${n}.body`)}`);

  h("ARFA AI Academy");
  out.push(
    "ARFA stands for AI Readiness For All. It is the AI Academy of TIBLOGICS, at " + absUrl("/learning-box") + ".",
    "",
    `- Tracks open now: ${a.live.length}. Self-paced and online, in English and French.`,
    a.live.length ? `- One track: a one-time payment for lifetime access to that track, ${money(a.minPriceCents)} to ${money(a.maxPriceCents)} depending on its level.` : "",
    `- Every track: a subscription at ${money(a.monthlyCents)} a month, cancel anytime.`,
    d.team ? `- Teams: seats for companies, ${money(d.team.seatPriceCents)} per seat per month, ${d.team.minSeats} seats minimum.` : "",
    "- Assessment: three-question checks after lessons, a quiz per module (80% to pass, retakes allowed), a timed final exam, and a capstone project scored by a human reviewer against a published rubric.",
    "- Certificates: each track has its own certificate with a public verification page.",
    "- Learn anywhere: installs as an app; lessons can be downloaded for offline study.",
  );
  for (const c of a.live) {
    out.push(
      "",
      `### ${c.title}`,
      "",
      `URL: ${absUrl(`/learning-box/${c.slug}`)}`,
      `Level: ${level(c.level, c.levelEnd)}. Time: about ${c.hours} hours (${c.moduleCount} modules, ${c.lessonCount} lessons). Price: ${money(c.shownPriceCents)} one time, or included in the ${money(a.monthlyCents)}/month subscription. Certificate: ${c.certificateName}.`,
      c.tagline ? `Summary: ${plain(c.tagline)}` : "",
      c.audience ? `Who it is for: ${plain(c.audience)}` : "",
      `Description: ${plain(c.description)}`,
    );
    if (c.outcomes.length) {
      out.push("What you will be able to do:");
      for (const o of c.outcomes) out.push(`- ${plain(o)}`);
    }
  }
  if (d.comingSoon.length) {
    out.push("", "Coming soon:");
    for (const c of d.comingSoon) out.push(`- ${c.title} (${absUrl(`/learning-box/${c.slug}`)})${c.tagline ? `: ${plain(c.tagline)}` : ""}`);
  }

  h("Tools");
  out.push(...toolLines());

  if (d.products.length) {
    h("Store products");
    for (const p of d.products) out.push(`- ${p.name} (${absUrl(`/store/${p.slug}`)}): ${money(p.price)} ${p.currency}. ${oneLine(p.tagline ? `${p.tagline} ${p.description}` : p.description, 400)}`);
  }

  if (d.events.length) {
    h("Events");
    for (const e of d.events) {
      const when = e.date ? e.date.toISOString().slice(0, 10) : "date to be announced";
      out.push(`- ${e.title} (${absUrl(`/events/${e.slug}`)}): ${when}, ${e.location}, ${e.price ? money(e.price) : "free"}. ${oneLine(e.description, 300)}`);
    }
  }

  h("Frequently asked questions");
  const faqs = [
    ...[1, 2, 3, 4].map((n) => ({ q: t(`seo.home.faq.${n}.q`), a: t(`seo.home.faq.${n}.a`) })),
    ...academyFaq(t, a, money),
    { q: t("seo.services.faq.automation.q"), a: t("seo.services.faq.automation.a") },
    { q: t("seo.services.faq.training.q"), a: t("seo.services.faq.training.a") },
    { q: t("seo.tools.faq.free.q"), a: t("seo.tools.faq.free.a") },
    { q: t("seo.tools.faq.scanner.q"), a: t("seo.tools.faq.scanner.a") },
  ];
  for (const f of faqs) out.push(`Q: ${f.q}`, `A: ${f.a}`, "");

  if (d.posts.length) {
    h("Recent AI Times articles");
    for (const p of d.posts) out.push(`- ${p.title} (${absUrl(`/ai-times/${p.slug}`)}, ${p.createdAt.toISOString().slice(0, 10)}): ${oneLine(p.excerpt, 300)}`);
  }

  return out.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n") + "\n";
}
