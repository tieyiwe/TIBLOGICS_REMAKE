// Shapes of lead magnets and campaign landing pages, plus normalisers that
// accept model output or an edited copy from the browser. Client-safe: no
// server imports.

export const MAGNET_TYPES = ["checklist", "guide", "quiz", "templates"] as const;
export type MagnetType = (typeof MAGNET_TYPES)[number];
export const MAGNET_TYPE_LABEL: Record<MagnetType, string> = {
  checklist: "Checklist",
  guide: "Mini guide",
  quiz: "Quiz / scorecard",
  templates: "Template pack",
};
export const MAGNET_TYPE_HINT: Record<MagnetType, string> = {
  checklist: "A printable checklist people tick off. Web page plus Save as PDF.",
  guide: "A short how-to guide with takeaways. Web page plus Save as PDF.",
  quiz: "A 5 to 8 question scorecard with an instant, personalised result.",
  templates: "A pack of links to the free tools and resources, with how to use each.",
};

export const LANGS = ["en", "fr", "sw"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);

export interface ChecklistSection { heading: string; items: { text: string; note: string }[] }
export interface GuideSection { heading: string; body: string }
export interface QuizOption { label: string; points: number; tip: string }
export interface QuizQuestion { text: string; options: QuizOption[] }
export interface QuizBand { min: number; title: string; body: string }
export interface TemplateItem { title: string; description: string; href: string; label: string }

export interface MagnetContent {
  headline: string;
  subheadline: string;
  /** "What you get" bullets on the sign-up page. */
  bullets: string[];
  /** The form's button text. */
  ctaLabel: string;
  intro: string;
  outro: string;
  checklist: ChecklistSection[];
  guide: GuideSection[];
  takeaways: string[];
  questions: QuizQuestion[];
  bands: QuizBand[];
  templates: TemplateItem[];
  /** Why the recommended product fits, shown under the asset and in the email. */
  productPitch: string;
  productCta: string;
  emailSubject: string;
  emailBody: string;
}

const s = (v: unknown, max = 2000) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const strs = (v: unknown, n: number, max = 300) => arr(v).map((x) => s(x, max)).filter(Boolean).slice(0, n);

/** Internal paths only ("/tools/scanner"), or https URLs (checked again on the server). */
export function safeHref(v: unknown): string {
  const h = s(v, 500);
  if (!h) return "";
  if (h.startsWith("/") && !h.startsWith("//") && !/[\s\\]/.test(h)) return h;
  if (/^https:\/\/[^\s\\]+$/i.test(h)) return h;
  return "";
}

export function normalizeMagnet(raw: unknown): MagnetContent {
  const r = obj(raw);
  const questions = arr(r.questions)
    .map((q) => {
      const o = obj(q);
      const options = arr(o.options)
        .map((x) => {
          const p = obj(x);
          const pts = Math.round(Number(p.points));
          return { label: s(p.label, 200), points: pts >= 0 && pts <= 3 ? pts : 0, tip: s(p.tip, 400) };
        })
        .filter((x) => x.label)
        .slice(0, 5);
      return { text: s(o.text, 300), options };
    })
    .filter((q) => q.text && q.options.length >= 2)
    .slice(0, 12);
  const bands = arr(r.bands)
    .map((b) => {
      const o = obj(b);
      const min = Math.round(Number(o.min));
      return { min: min >= 0 && min <= 100 ? min : 0, title: s(o.title, 120), body: s(o.body, 1500) };
    })
    .filter((b) => b.title)
    .slice(0, 5)
    .sort((a, b) => a.min - b.min);
  if (bands.length && bands[0].min !== 0) bands[0].min = 0;
  return {
    headline: s(r.headline, 160),
    subheadline: s(r.subheadline, 400),
    bullets: strs(r.bullets, 6, 200),
    ctaLabel: s(r.ctaLabel, 60),
    intro: s(r.intro, 1500),
    outro: s(r.outro, 1500),
    checklist: arr(r.checklist)
      .map((c) => {
        const o = obj(c);
        return {
          heading: s(o.heading, 160),
          items: arr(o.items)
            .map((i) => {
              const it = obj(i);
              return { text: s(it.text, 300), note: s(it.note, 400) };
            })
            .filter((i) => i.text)
            .slice(0, 15),
        };
      })
      .filter((c) => c.heading && c.items.length)
      .slice(0, 8),
    guide: arr(r.guide)
      .map((g) => {
        const o = obj(g);
        return { heading: s(o.heading, 160), body: s(o.body, 4000) };
      })
      .filter((g) => g.heading && g.body)
      .slice(0, 10),
    takeaways: strs(r.takeaways, 8, 300),
    questions,
    bands,
    templates: arr(r.templates)
      .map((t) => {
        const o = obj(t);
        return { title: s(o.title, 160), description: s(o.description, 600), href: safeHref(o.href), label: s(o.label, 60) };
      })
      .filter((t) => t.title && t.href)
      .slice(0, 10),
    productPitch: s(r.productPitch, 600),
    productCta: s(r.productCta, 60),
    emailSubject: s(r.emailSubject, 160),
    emailBody: s(r.emailBody, 3000),
  };
}

/** Problems that block publishing (the editor shows them). */
export function magnetProblems(type: MagnetType, c: MagnetContent): string[] {
  const p: string[] = [];
  if (!c.headline) p.push("Add a headline.");
  if (!c.emailSubject) p.push("Add an email subject.");
  if (type === "checklist" && !c.checklist.length) p.push("Add at least one checklist section.");
  if (type === "guide" && !c.guide.length) p.push("Add at least one guide section.");
  if (type === "quiz") {
    if (c.questions.length < 3) p.push("A quiz needs at least 3 questions.");
    if (c.bands.length < 2) p.push("A quiz needs at least 2 result bands.");
  }
  if (type === "templates" && !c.templates.length) p.push("Add at least one template or tool.");
  return p;
}

// ── Quiz scoring (shared by the browser and the capture API) ────────────────

export interface QuizResult {
  score: number;
  band: QuizBand | null;
  /** Tips from the answers that scored lowest, most important first. */
  tips: string[];
}

export function scoreQuiz(c: Pick<MagnetContent, "questions" | "bands">, answers: number[]): QuizResult | null {
  if (!c.questions.length || answers.length !== c.questions.length) return null;
  let got = 0;
  let max = 0;
  const weak: { gap: number; tip: string }[] = [];
  for (let i = 0; i < c.questions.length; i++) {
    const q = c.questions[i];
    const a = answers[i];
    if (!Number.isInteger(a) || a < 0 || a >= q.options.length) return null;
    const best = Math.max(...q.options.map((o) => o.points));
    max += best;
    got += q.options[a].points;
    const gap = best - q.options[a].points;
    if (gap > 0 && q.options[a].tip) weak.push({ gap, tip: q.options[a].tip });
  }
  const score = max ? Math.round((got / max) * 100) : 0;
  let band: QuizBand | null = null;
  for (const b of c.bands) if (score >= b.min) band = b;
  return { score, band, tips: weak.sort((a, b) => b.gap - a.gap).slice(0, 3).map((w) => w.tip) };
}

// ── Landing pages ───────────────────────────────────────────────────────────

export const SECTION_TYPES = ["hero", "pains", "benefits", "proof", "product", "faq", "cta", "form"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];
export const SECTION_LABEL: Record<SectionType, string> = {
  hero: "Hero",
  pains: "Pains",
  benefits: "Benefits",
  proof: "Proof points",
  product: "Product facts",
  faq: "FAQ",
  cta: "Call to action",
  form: "Lead form",
};

export interface PageSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  title: string;
  body: string;
  items: string[];
  faq: { q: string; a: string }[];
  /** Hero / CTA button text. */
  ctaLabel: string;
}

export const CTA_KINDS = ["buy", "track", "booking", "newsletter", "custom"] as const;
export type CtaKind = (typeof CTA_KINDS)[number];
export const CTA_LABEL: Record<CtaKind, string> = {
  buy: "Buy the product",
  track: "Start an ARFA · AI Academy track",
  booking: "Book a call",
  newsletter: "Join the newsletter (lead form)",
  custom: "Custom link",
};

export interface PageContent {
  sections: PageSection[];
  cta: { kind: CtaKind; href: string };
  /** Short text for the share card (og:description) and the OG image. */
  description: string;
  /** Lead form: also ask for the business name and WhatsApp. */
  askBusiness: boolean;
  askWhatsapp: boolean;
}

const sectionId = (i: number) => `s${i}${Math.random().toString(36).slice(2, 6)}`;

export function blankSection(type: SectionType, i = 0): PageSection {
  return { id: sectionId(i), type, enabled: true, title: "", body: "", items: [], faq: [], ctaLabel: "" };
}

export function normalizePage(raw: unknown): PageContent {
  const r = obj(raw);
  const seen = new Set<string>();
  const sections = arr(r.sections)
    .map((x, i): PageSection | null => {
      const o = obj(x);
      const type = (SECTION_TYPES as readonly string[]).includes(o.type as string) ? (o.type as SectionType) : null;
      if (!type) return null;
      let id = s(o.id, 24).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!id || seen.has(id)) id = sectionId(i);
      seen.add(id);
      return {
        id,
        type,
        enabled: o.enabled !== false,
        title: s(o.title, 200),
        body: s(o.body, 2000),
        items: strs(o.items, 10, 400),
        faq: arr(o.faq)
          .map((f) => {
            const q = obj(f);
            return { q: s(q.q, 300), a: s(q.a, 1500) };
          })
          .filter((f) => f.q && f.a)
          .slice(0, 10),
        ctaLabel: s(o.ctaLabel, 60),
      };
    })
    .filter((x): x is PageSection => !!x)
    .slice(0, 16);
  const cta = obj(r.cta);
  const kind = (CTA_KINDS as readonly string[]).includes(cta.kind as string) ? (cta.kind as CtaKind) : "newsletter";
  return {
    sections,
    cta: { kind, href: safeHref(cta.href) },
    description: s(r.description, 300),
    askBusiness: r.askBusiness !== false,
    askWhatsapp: r.askWhatsapp === true,
  };
}

export function pageProblems(c: PageContent): string[] {
  const p: string[] = [];
  const on = c.sections.filter((x) => x.enabled);
  if (!on.some((x) => x.type === "hero" && x.title)) p.push("Add a hero with a headline.");
  if (c.cta.kind !== "newsletter" && !c.cta.href) p.push("The call to action has no destination.");
  if (c.cta.kind === "newsletter" && !on.some((x) => x.type === "form")) p.push("The newsletter call to action needs a lead form section.");
  return p;
}

export function slugify(v: string, max = 48): string {
  return v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
