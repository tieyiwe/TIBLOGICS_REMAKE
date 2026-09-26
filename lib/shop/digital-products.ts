// Seed catalogue of TIBLOGICS digital products.
//
// Each one is deliberately tied to something the business already teaches or
// consults on, so it is credible to sell and cross-sells the courses and
// consultations rather than competing with them.
//
// Prices are 0 and products are UNPUBLISHED on purpose — pricing is set in
// the admin before anything goes live. Publishing a £0 product by accident
// would give the work away.

export interface DigitalProductSeed {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  fileKey: string;
  fileName: string;
  fileFormat: string;
  /** Suggested price in cents — a starting point for the pricing decision. */
  suggestedPrice: number;
  featured?: boolean;
}

export const DIGITAL_PRODUCTS: DigitalProductSeed[] = [
  {
    slug: "ai-cost-pricing-model",
    name: "AI Cost & Pricing Model",
    tagline: "Work out what your AI actually costs to run — before your margin disappears.",
    description: `Most people building with AI price it like software and discover their unit costs too late.

This is the spreadsheet model we use in our AI Cost & Pricing consultations. Fill in eight inputs and it calculates your true cost per request, cost per customer per month, break-even point, and gross margin.

**What's inside**

- Cost per request, split by input and output tokens — the split most people get wrong, since output typically costs 3–5× input
- Cost per customer per month, including a retry/failure rate, because failed calls still bill
- The costs people forget: vector storage, infrastructure, monitoring, and support time priced at a loaded hourly rate
- Break-even calculation that tells you plainly when your price sits below your unit cost
- A stress test covering the three variables that usually break an AI pricing model

**Who it's for**

Anyone selling a product with AI inside it: SaaS founders, agencies packaging AI services, and product managers who need a defensible number for a pricing conversation.

**What it isn't**

It won't tell you what to charge. It tells you what you cannot charge less than, which is the part people skip.`,
    category: "Templates",
    tags: ["ai", "pricing", "finance", "saas", "unit economics"],
    fileKey: "ai-cost-model.csv",
    fileName: "TIBLOGICS-AI-Cost-Pricing-Model.csv",
    fileFormat: "CSV (Excel & Google Sheets)",
    suggestedPrice: 4900,
    featured: true,
  },
  {
    slug: "ai-readiness-scorecard",
    name: "AI Readiness Scorecard",
    tagline: "Twenty questions that tell you whether you're ready — or about to waste six months.",
    description: `Organisations rarely fail at AI because the technology doesn't work. They fail because their data was inaccessible, their processes were undocumented, or nobody had agreed what would make them stop.

This scorecard tests for exactly that, across five dimensions: data, process, people, governance and commercial readiness.

**What's inside**

- 20 scored questions, each with a description of what a full-marks answer actually looks like
- Scoring bands that tell you what to do next, not just where you rank
- A note on the single question that matters most — and why a low score there makes your total provisional

**Who it's for**

Operations leads, business owners and anyone who has been asked to "look into AI" and wants to answer with evidence rather than opinion.

**How to use it honestly**

Score it with someone who does the work daily, not only with the leadership team. Where those two scores disagree, the person doing the work is usually right.`,
    category: "Templates",
    tags: ["ai", "assessment", "strategy", "operations"],
    fileKey: "ai-readiness-scorecard.csv",
    fileName: "TIBLOGICS-AI-Readiness-Scorecard.csv",
    fileFormat: "CSV (Excel & Google Sheets)",
    suggestedPrice: 2900,
  },
  {
    slug: "ai-usage-policy-template",
    name: "AI Usage Policy Template",
    tagline: "A staff AI policy people will actually follow.",
    description: `Most AI policies fail the same way: they ban things staff will do anyway, so the behaviour continues and the risk simply moves out of sight.

This template is written to be adopted. It is deliberately permissive about ordinary use and specific about the handful of things that genuinely matter.

**What's inside**

- Scope, approved-tools table, and the three rules that cover most situations
- A precise list of what must never be entered into an AI tool, and the redaction habit that avoids most of it
- Where AI must not be the deciding factor — hiring, credit, safety, and anything where the human element is the point
- A verification standard built on consequence rather than confidence
- Disclosure guidance that distinguishes "normal use" from "should have been declared"
- An incident route designed so people report mistakes early instead of hiding them
- An adoption checklist, because an unadopted policy is worse than none

**Who it's for**

Any organisation whose staff are already using AI — which is most of them, whether or not anyone has said so.

**Format**

Markdown, so you can paste it straight into Notion, Confluence, Google Docs or Word and restyle it as your own.`,
    category: "Templates",
    tags: ["ai", "policy", "governance", "compliance", "hr"],
    fileKey: "ai-usage-policy.md",
    fileName: "TIBLOGICS-AI-Usage-Policy-Template.md",
    fileFormat: "Markdown (Word, Docs, Notion)",
    suggestedPrice: 3900,
    featured: true,
  },
  {
    slug: "business-prompt-library",
    name: "The Business Prompt Library",
    tagline: "60 prompts that hold up on real work, not demos.",
    description: `Prompt collections are usually long lists of things that work once. This is the set we actually reuse, organised by the job you're trying to do.

Every prompt follows the same structure — task, context, audience, constraints — which is the difference between a usable draft and generic filler.

**What's inside**

- **Writing & editing** — including the diagnose-don't-rewrite prompt that improves your writing instead of replacing it
- **Summarising & extraction** — including "what is NOT addressed that should be?", which is the one worth having for contracts
- **Thinking & planning** — argue-against-me, pre-mortem, and the questions you don't know to ask
- **Customer & sales** — objections, proposals, and follow-ups that aren't annoying
- **Operations** — SOPs, meeting actions, and explaining technical work upward
- **Learning** — the three-levels technique and the test-me prompt that makes things stick
- **Verification** — how to pressure-test output, and why "are you sure?" is the wrong question

**Who it's for**

Anyone using AI daily who gets good results occasionally and wants them reliably.

**The honest note**

The last page explains why six prompts proven on your own work beat any library you can download — including this one. It's there because it's true.`,
    category: "Templates",
    tags: ["ai", "prompts", "productivity", "operations"],
    fileKey: "business-prompt-library.md",
    fileName: "TIBLOGICS-Business-Prompt-Library.md",
    fileFormat: "Markdown (Notion, Docs, Obsidian)",
    suggestedPrice: 3400,
    featured: true,
  },
  {
    slug: "ai-pilot-playbook",
    name: "The 30-Day AI Pilot Playbook",
    tagline: "Run a pilot that produces evidence, not enthusiasm.",
    description: `Most AI pilots fail in one specific way: they "work", everyone is impressed, and nobody can say whether to roll it out.

This playbook is built to avoid that single failure mode. It's the structure we use when running pilots with clients.

**What's inside**

- The two questions to answer in writing before day one — including the kill criterion, agreed before anyone is emotionally invested
- Days 1–3: building a baseline the team recognises as true
- Days 4–7: scoping narrowly enough that a positive result is attributable
- Days 8–21: what to log daily, including the "corrections needed" column most people skip and which usually decides whether the pilot is real
- Days 22–26: measuring against the same baseline, honestly
- Days 27–30: a one-page write-up — circulated whatever the outcome
- The three ways pilots go wrong, and how to spot each early
- A one-page pilot scope template

**Who it's for**

Anyone about to spend real money finding out whether AI helps with a specific process.

**The core idea**

A pilot without an agreed stopping condition isn't a pilot. It's a procurement decision that has already been made.`,
    category: "Guides",
    tags: ["ai", "pilot", "operations", "strategy", "change management"],
    fileKey: "ai-pilot-playbook.md",
    fileName: "TIBLOGICS-30-Day-AI-Pilot-Playbook.md",
    fileFormat: "Markdown (Notion, Docs, PDF-ready)",
    suggestedPrice: 3900,
  },
  {
    slug: "ai-vendor-evaluation-kit",
    name: "AI Vendor Evaluation Kit",
    tagline: "The questions that decide whether a deal fails after you've signed it.",
    description: `Vendor demos are designed to be impressive. This scorecard is designed to find what the demo didn't cover.

Twenty-two weighted criteria across data handling, capability, lock-in, commercials, viability and support — with the exact question to put to the vendor on each line.

**What's inside**

- Weighted scoring, where the weights reflect how often that line is what actually goes wrong
- The specific question to ask for every criterion, phrased to make vagueness obvious
- Data-handling questions that separate "we don't train on your data by default" from "we don't train on your data"
- Lock-in questions covering export format, deletion on exit, and whether the underlying model is swappable
- Commercial questions that model the 3× volume case, where pricing surprises live
- Scoring bands, plus the rule that any weight-5 criterion scoring 0–1 is disqualifying on its own however good the total looks

**Who it's for**

Anyone about to sign with an AI vendor, and anyone who has been asked to justify a choice already made.

**Why the weighting matters**

A strong total can hide one fatal weakness. The kit tells you which five lines to check individually before you sign.`,
    category: "Templates",
    tags: ["ai", "procurement", "vendor", "due diligence", "risk"],
    fileKey: "ai-vendor-evaluation-kit.csv",
    fileName: "TIBLOGICS-AI-Vendor-Evaluation-Kit.csv",
    fileFormat: "CSV (Excel & Google Sheets)",
    suggestedPrice: 2900,
  },
];
