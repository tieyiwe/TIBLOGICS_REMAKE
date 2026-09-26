// The TIBLOGICS AI Prompt Pack product line.
//
// Same production pattern across the set: full PDF, branded cover and footer,
// clickable contents, category index, sidebar bookmarks, the three-part prompt
// format ("Use this when" / "The Prompt" / "Pro tip"), a bonus power-prompts
// section and a prompt-writing cheat sheet.
//
// Page counts below were read from the actual PDFs, not estimated.

export interface PromptPackSeed {
  slug: string;
  name: string;
  /** Shown as the card tagline and the detail-page subtitle. */
  tagline: string;
  shortDescription: string;
  description: string;
  tags: string[];
  fileKey: string;
  fileName: string;
  pages: number;
  prompts: number;
  coverImage: string;
  /** Order within the collection; lower shows first before rotation applies. */
  sortOrder: number;
}

/** Every pack in this line sells at the same point — low-ticket, traffic-driving. */
export const PROMPT_PACK_PRICE = 7900; // $79.00
export const PROMPT_PACK_CATEGORY = "AI Prompt Packs";
export const PROMPT_PACK_COLLECTION = "ai-prompt-packs";

export const PROMPT_PACK_COLLECTION_META = {
  slug: PROMPT_PACK_COLLECTION,
  name: "AI Prompt Packs",
  description:
    "Industry-specific prompt libraries. Copy, paste, adapt — built for the work you actually do.",
  featured: true,
  sortOrder: 1,
};

/** Shared closing section, so the set reads consistently. */
function format(pages: number, prompts: number): string {
  return `## What format it comes in

A single ${pages}-page PDF, downloadable the moment you buy. It has a clickable table of contents, a category index and PDF sidebar bookmarks, so you can jump to the prompt you need in a couple of seconds rather than scrolling.

Every one of the ${prompts} prompts follows the same three-part structure:

- **Use this when** — the specific situation it's for, so you're not guessing
- **The Prompt** — the full text, ready to paste into ChatGPT, Claude, Gemini or Copilot
- **Pro tip** — how to adapt it, and the mistake people usually make

It closes with a bonus set of power prompts and a prompt-writing cheat sheet, so once you've outgrown the pack you can write your own to the same standard.

Works with any major AI tool. No subscription, no login, no software to install — it's a PDF you own.

*Published by TIBLOGICS · [www.tiblogics.com](https://www.tiblogics.com)*`;
}

export const PROMPT_PACKS: PromptPackSeed[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "the-finance-professionals-ai-toolkit",
    name: "The Finance Professional's AI Toolkit",
    tagline: "100 Plug-and-Play Prompts to Save 10+ Hours a Week",
    shortDescription:
      "100 ready-to-use ChatGPT and Claude prompts built specifically for financial advisors, planners, and accountants: client emails, tax season workflows, proposals, and the difficult conversations nobody has a template for.",
    description: `Most prompt packs are written by people who have never sat across from a client explaining why their portfolio is down. This one is built around the work financial professionals actually do — including the parts nobody enjoys.

## What's inside

100 prompts across nine categories:

1. **Client Emails & Everyday Communication** — the messages you write weekly, written faster
2. **Client Onboarding & Meetings** — intake, agendas, follow-up summaries
3. **Marketing & Social Media Content** — visible without sounding like everyone else
4. **Prospecting, Referrals & Follow-Ups** — asking for referrals without the cringe
5. **Financial Planning & Advisory Work** — scenarios, explanations, plan summaries
6. **Tax Season & Accounting Workflows** — the six weeks where hours matter most
7. **Pricing, Proposals & Client Reports** — proposals that justify the fee
8. **Operations, SOPs & Admin** — the invisible work that eats the week
9. **Difficult Clients & Sticky Situations** — the ones you rehearse in the car

Plus **10 bonus power prompts** and a prompt-writing cheat sheet.

## The compliance note

This pack includes a section on fiduciary and advisory language that generic prompt packs don't address. AI will happily draft something that reads like advice when it shouldn't, or state a guarantee you cannot make. The guidance shows you what to strip before anything reaches a client — which is the difference between a useful tool and a compliance problem.

## Who it's for

Financial advisors, planners, accountants and bookkeepers — whether you're solo or part of a firm. No AI experience needed. If you can paste text into a chat box, you can use every prompt here.

## Why it saves time

The hours don't disappear into the complicated work. They disappear into the hundred small pieces of writing between the real work: the follow-up email, the meeting recap, the explanation you've written forty times. These prompts handle that layer, so your attention goes to the judgement your clients are actually paying for.

Tax season alone usually pays for it.

${format(46, 100)}`,
    tags: [
      "AI prompts for financial advisors",
      "ChatGPT prompts accounting",
      "financial planner templates",
      "tax season AI toolkit",
    ],
    fileKey: "the-finance-professionals-ai-toolkit.pdf",
    fileName: "The-Finance-Professionals-AI-Toolkit.pdf",
    pages: 46,
    prompts: 100,
    coverImage: "/shop/covers/the-finance-professionals-ai-toolkit.png",
    sortOrder: 1,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "the-nonprofit-ai-toolkit",
    name: "The Nonprofit AI Toolkit",
    tagline: "91 Plug-and-Play Prompts to Save 10+ Hours a Week",
    shortDescription:
      "91 ready-to-use prompts for nonprofit teams doing more with less: donor stewardship, grant proposals, board updates, and volunteer recruitment, all copy-paste ready for ChatGPT or Claude.",
    description: `Nonprofit teams are asked to do the communications work of an organisation three times their size. This pack is built for that reality — not for a marketing department that doesn't exist.

## What's inside

91 prompts across nine categories:

1. **Donor Communication & Stewardship** — thank-yous that sound like a person wrote them
2. **Grant Writing & Fundraising Proposals** — narrative sections, impact statements, budget justifications
3. **Social Media & Content Marketing** — consistent presence without a content team
4. **Email Campaigns & Newsletters** — appeals and updates that get opened
5. **Volunteer Recruitment & Management** — recruiting, onboarding, and keeping people
6. **Board & Stakeholder Communication** — updates that respect a board's time
7. **Program Design & Impact Reporting** — describing outcomes without overclaiming
8. **Event Planning & Promotion** — from save-the-date to the follow-up
9. **Difficult Conversations & Crisis Comms** — funding shortfalls, staff changes, hard news

Plus **10 bonus power prompts** and a prompt-writing cheat sheet.

## Who it's for

Executive directors, development and fundraising staff, program managers, and the person whose job description quietly includes "and communications". Built for small teams especially — if you're the one writing the appeal, the grant and the board update, this is for you.

## Why it saves time

Grant deadlines don't move, and neither does the board meeting. The writing gets done late at night because it has to. These prompts move the first draft off your plate, so your energy goes into the parts only you can do — the relationships, the program judgement, the actual asking.

One grant narrative drafted in twenty minutes instead of an afternoon is the whole cost of this recovered.

## An honest note on donors

Every donor communication in this pack still needs your specifics: the real story, the real number, the real name. AI drafts the structure. The warmth is yours, and donors can tell the difference.

${format(38, 91)}`,
    tags: [
      "nonprofit AI prompts",
      "grant writing ChatGPT prompts",
      "donor communication templates",
      "fundraising AI toolkit",
    ],
    fileKey: "the-nonprofit-ai-toolkit.pdf",
    fileName: "The-Nonprofit-AI-Toolkit.pdf",
    pages: 38,
    prompts: 91,
    coverImage: "/shop/covers/the-nonprofit-ai-toolkit.png",
    sortOrder: 2,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "the-restaurant-ai-toolkit",
    name: "The Restaurant AI Toolkit",
    tagline: "90 Plug-and-Play Prompts to Save 10+ Hours a Week",
    shortDescription:
      "90 ready-to-use prompts built for restaurant owners and managers: menu descriptions, review responses, staff SOPs, and promotions, so you spend less time writing and more time running the floor.",
    description: `Nobody opened a restaurant because they wanted to write social captions at midnight. This pack takes the writing off the end of your day.

## What's inside

90 prompts across ten categories:

1. **Guest Communication & Reservations** — confirmations, changes, special requests
2. **Reviews & Reputation Management** — replies to the good, the unfair and the genuinely bad
3. **Marketing & Social Media Content** — posting consistently without an agency
4. **Menu Development & Food Descriptions** — descriptions that sell the dish
5. **Advertising Copy & Promotions** — offers that fill a quiet Tuesday
6. **Staff Management, Training & SOPs** — onboarding, shift briefs, standards
7. **Operations, Vendors & Admin** — supplier emails, scheduling, the paperwork
8. **Financial Tasks: Pricing, Costing & Reporting** — menu costing and margin conversations
9. **Difficult Situations & Conflict** — complaints, refunds, staff issues
10. **Planning, Strategy & Events** — private hire, seasonal changes, expansion

Plus **bonus power prompts** and a prompt-writing cheat sheet.

## Who it's for

Independent restaurant owners, GMs, and whoever ends up handling the marketing. Written for operators, not marketers — plain language, no jargon.

## Why it saves time

A menu rewrite is a weekend. A month of social content is an evening you don't have. A careful reply to a one-star review takes three drafts and sits in your head all day.

These prompts turn each of those into minutes. The review-response category alone is worth it — responding well and quickly measurably affects your rating, and it's the task most likely to get put off.

## The bit that matters

Menu descriptions and review replies are the two places where writing directly moves revenue. Both are covered in depth here, with the pro tips that stop AI output sounding like a chain restaurant.

${format(41, 90)}`,
    tags: [
      "restaurant AI prompts",
      "menu description generator prompts",
      "restaurant marketing ChatGPT",
      "hospitality AI toolkit",
    ],
    fileKey: "the-restaurant-ai-toolkit.pdf",
    fileName: "The-Restaurant-AI-Toolkit.pdf",
    pages: 41,
    prompts: 90,
    coverImage: "/shop/covers/the-restaurant-ai-toolkit.png",
    sortOrder: 3,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "the-agency-ai-toolkit",
    name: "The Agency AI Toolkit",
    tagline: "100 Plug-and-Play Prompts to Save 10+ Hours a Week",
    shortDescription:
      "100 ready-to-use prompts for agencies: client reporting, new business pitches, ad copy, and the scope-creep conversations every account manager dreads, all built to save your team real hours every week.",
    description: `Agencies bill for time, which makes every unbillable hour expensive. This pack targets exactly those hours: the reporting, the recaps, the fourth round of ad copy variations.

## What's inside

100 prompts across ten categories:

1. **Client Communication & Account Management** — status updates, recaps, check-ins
2. **New Business & Pitching** — proposals, credentials, pitch narratives
3. **Ad Copy & Creative Production** — variations at volume, on brief
4. **Social Media & Content Marketing** — calendars, captions, campaign content
5. **Strategy & Campaign Planning** — briefs, positioning, channel plans
6. **Research & Competitive Analysis** — landscape scans and audience work
7. **Reporting & Performance Analysis** — turning numbers into a story clients act on
8. **Difficult Conversations & Objection Handling** — scope creep, late payment, underperformance
9. **Operations, SOPs & Admin** — the internal work nobody bills for
10. **Agency-Specific & Specialized Tasks** — the things only agencies deal with

Plus **bonus power prompts** and a prompt-writing cheat sheet.

## Who it's for

Advertising and marketing agencies, freelance strategists, and in-house teams that operate like an agency. Useful across the team — account managers, strategists, copywriters and the founder doing all three.

## Why it saves time

Monthly reporting is the clearest case. Most agencies spend days turning dashboards into something a client will read. The reporting prompts here handle the narrative layer, so your team edits rather than writes from nothing.

Then there's the scope-creep conversation. Every account manager has delayed that email for a week. There's a prompt for it — one that holds the line without damaging the relationship.

## On ad copy

The creative category is built for volume with variation that's actually different, not the same line reworded. The pro tips cover how to keep brand voice intact when you're generating at scale, which is where most agency AI use goes wrong.

${format(56, 100)}`,
    tags: [
      "marketing agency AI prompts",
      "ChatGPT prompts for agencies",
      "ad copy AI toolkit",
      "agency reporting templates",
    ],
    fileKey: "the-agency-ai-toolkit.pdf",
    fileName: "The-Agency-AI-Toolkit.pdf",
    pages: 56,
    prompts: 100,
    coverImage: "/shop/covers/the-agency-ai-toolkit.png",
    sortOrder: 4,
  },
];
