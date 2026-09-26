import type { SeedLab } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// Labs for Track 1 — AI Foundations for Everyone
// One per module. Types are chosen to match what each module teaches:
// prompting modules get prompt labs, the judgement module gets a critique
// lab, and the applied modules get build labs.
// moduleNumber is 1-based and maps to the track's module order.
// ═══════════════════════════════════════════════════════════════════════════

export const TRACK_1_LABS: SeedLab[] = [
  // ── Module 1 ──────────────────────────────────────────────────────────
  {
    slug: "ai-foundations-lab-1-probe-the-edges",
    title: "Find where the model runs out",
    labType: "prompt",
    moduleNumber: 1,
    estimatedMinutes: 20,
    points: 40,
    passScore: 70,
    briefMd: `Module 1 claimed these systems are strong on common topics and weak on rare, recent or private ones. Don't take our word for it — go and find the edge yourself.

Write a **single prompt** that deliberately probes one of those weak spots, in a way that would expose the model guessing rather than knowing.

A good probe is specific enough that you could verify the answer afterwards. "Tell me about history" proves nothing. "What was the closing share price of a specific company on a specific recent date" is checkable.`,
    scenarioMd: `You have one prompt and up to six sandbox runs to refine it.

Aim at one of these:
- Something very recent (past the training cutoff)
- Something genuinely niche — a small local organisation, an obscure regulation
- Something private that couldn't be in public training data
- A question containing a false premise, to see whether it gets challenged`,
    objectives: [
      {
        id: "targets-weakness",
        label: "Targets a genuine model weakness",
        weight: 3,
        guidance:
          "The prompt should deliberately aim at recency, niche coverage, private information, or a false premise — not just be a hard question.",
      },
      {
        id: "verifiable",
        label: "Asks for something you could actually check",
        weight: 2,
        guidance:
          "A specific, checkable claim is requested — a name, date, figure or fact — rather than an open-ended opinion that could never be falsified.",
      },
      {
        id: "specific",
        label: "Specific rather than vague",
        weight: 2,
        guidance: "Concrete entities, dates or details are named. Not a broad topic request.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "",
      sandboxSystem:
        "You are a general-purpose assistant. Answer the user's question as you normally would. Do not add disclaimers about your knowledge cutoff unless they are genuinely relevant to the specific question asked.",
    },
  },

  // ── Module 2 ──────────────────────────────────────────────────────────
  {
    slug: "ai-foundations-lab-2-four-elements",
    title: "Rescue a terrible prompt",
    labType: "prompt",
    moduleNumber: 2,
    estimatedMinutes: 25,
    points: 50,
    passScore: 70,
    briefMd: `Module 2 gave you four elements: **task, context, audience, constraints**. Here's a real situation and a useless prompt. Rewrite it properly.

You're graded on the prompt, not on how good the model's reply happens to be. Run it, read what comes back, and refine — that iteration is the skill being tested.`,
    scenarioMd: `**The situation**

You manage a small dental practice. A patient, Mrs Okafor, has left a one-star public review saying she waited 50 minutes past her appointment time and that reception was dismissive. Both things are true — you were short-staffed that day.

You want to reply publicly. You need to acknowledge it genuinely without admitting anything that creates liability, and you'd like her to come back.

**The useless prompt someone wrote**

> reply to bad review

Rewrite it.`,
    objectives: [
      {
        id: "task",
        label: "States the task clearly",
        weight: 2,
        guidance: "It is unambiguous what artefact is wanted — a public reply to a specific review.",
      },
      {
        id: "context",
        label: "Includes the context only you know",
        weight: 3,
        guidance:
          "The specifics from the scenario are supplied: the 50-minute wait, the dismissive reception, that both are true, and the short-staffing.",
      },
      {
        id: "audience",
        label: "Identifies the audience",
        weight: 2,
        guidance:
          "Names who reads this — Mrs Okafor and, importantly, future patients reading the review publicly.",
      },
      {
        id: "constraints",
        label: "Sets constraints",
        weight: 3,
        guidance:
          "Length, tone, and what to avoid. Credit strongly if it states the liability constraint — acknowledge without admitting fault.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 8,
      starterPrompt: "reply to bad review",
      sandboxSystem:
        "You are a helpful writing assistant. Follow the user's instructions precisely. If their request is vague, produce the generic output that request actually warrants — do not silently improve on a poor prompt, because the user is learning to write better prompts and needs honest feedback about what their prompt produces.",
    },
  },

  // ── Module 3 ──────────────────────────────────────────────────────────
  {
    slug: "ai-foundations-lab-3-spot-the-problems",
    title: "Audit an AI answer",
    labType: "critique",
    moduleNumber: 3,
    estimatedMinutes: 25,
    points: 60,
    passScore: 70,
    briefMd: `Below is an answer produced by an AI tool. It reads well and sounds authoritative. Several parts of it are genuinely wrong.

Your job is to find them — **and to leave alone the parts that are actually fine.** Flagging everything is not the same as having judgement, and it's scored accordingly.`,
    objectives: [
      { id: "recall", label: "Caught the genuine problems", weight: 3 },
      { id: "precision", label: "Didn't flag correct statements", weight: 2 },
    ],
    config: {
      kind: "critique",
      answerMd: `**Q: I run a small bakery. Is it worth using AI for my business?**

Absolutely — AI adoption is essentially mandatory for small businesses in 2026.

According to a 2024 Harvard Business Review study, small businesses that adopted AI tools saw an average revenue increase of 47% within the first six months. Bakeries in particular benefit, as demand forecasting is a well-suited problem for machine learning.

Here's what I'd recommend:

1. **Demand forecasting.** Upload your last two years of sales data to ChatGPT and ask it to predict next month's demand. It can process this instantly and give you precise daily production numbers.

2. **Customer service.** Set up an AI chatbot to handle enquiries. You can paste your full customer list into the tool so it has context on your regulars, including their contact details and order history.

3. **Marketing copy.** AI is genuinely good at drafting social posts and menu descriptions. You'll still want to edit these yourself before publishing.

4. **Recipe development.** Ask the AI to calculate exact ingredient scaling for larger batches — it handles the arithmetic reliably.

One caution: AI tools can occasionally produce inaccurate information, so it's worth checking anything important against another source.

Overall, any bakery not using AI within the next year will struggle to remain competitive.`,
      flaws: [
        {
          id: "f1",
          quote: "AI adoption is essentially mandatory for small businesses in 2026",
          explanation:
            "Overconfident and unsupported. Plenty of small businesses run profitably with no AI at all. Framing adoption as mandatory is marketing language, not analysis.",
          category: "overconfidence",
        },
        {
          id: "f2",
          quote: "a 2024 Harvard Business Review study… average revenue increase of 47%",
          explanation:
            "A fabricated citation with a suspiciously precise figure. This is the classic hallucination pattern: a real-sounding publication, a plausible year, and a specific number that would be very hard to disprove casually. Always check a citation before repeating it.",
          category: "fabrication",
        },
        {
          id: "f3",
          quote: "paste your full customer list into the tool… including their contact details and order history",
          explanation:
            "A serious privacy failure. Customer personal data should never go into a consumer AI tool, and in the UK/EU this could constitute a reportable data breach under GDPR. The advice is actively dangerous.",
          category: "privacy",
        },
        {
          id: "f4",
          quote: "give you precise daily production numbers",
          explanation:
            "Overstates capability. A general chatbot is not a forecasting system, and 'precise' is exactly the wrong word for a tool that predicts text. Treating its numbers as production targets would waste real money.",
          category: "overconfidence",
        },
        {
          id: "f5",
          quote: "it handles the arithmetic reliably",
          explanation:
            "Directly contradicts how these systems work. Arithmetic is a known weak spot — they predict text rather than calculate. Doubly wrong given the answer's own later caution about accuracy.",
          category: "logic",
        },
        {
          id: "f6",
          quote: "any bakery not using AI within the next year will struggle to remain competitive",
          explanation:
            "Unfounded scare-forecasting. No evidence supports this, and it's the kind of claim that pressures small businesses into spending money they don't need to.",
          category: "overconfidence",
        },
      ],
      candidates: [
        { id: "c1", text: "Claiming AI adoption is \"essentially mandatory\" for small businesses", isFlaw: true, flawId: "f1" },
        { id: "c2", text: "Citing a 2024 Harvard Business Review study showing a 47% revenue increase", isFlaw: true, flawId: "f2" },
        { id: "c3", text: "Suggesting demand forecasting is a reasonable use case for a bakery", isFlaw: false },
        { id: "c4", text: "Advising the user to paste their full customer list, with contact details, into the tool", isFlaw: true, flawId: "f3" },
        { id: "c5", text: "Saying it can give \"precise daily production numbers\"", isFlaw: true, flawId: "f4" },
        { id: "c6", text: "Saying AI is good at drafting social posts and menu descriptions", isFlaw: false },
        { id: "c7", text: "Advising the user to edit marketing copy themselves before publishing", isFlaw: false },
        { id: "c8", text: "Claiming it handles ingredient-scaling arithmetic reliably", isFlaw: true, flawId: "f5" },
        { id: "c9", text: "Noting that AI tools can occasionally produce inaccurate information", isFlaw: false },
        { id: "c10", text: "Predicting that bakeries not using AI within a year will struggle to compete", isFlaw: true, flawId: "f6" },
      ],
    },
  },

  // ── Module 4 ──────────────────────────────────────────────────────────
  {
    slug: "ai-foundations-lab-4-real-task",
    title: "Do one real task with AI",
    labType: "build",
    moduleNumber: 4,
    estimatedMinutes: 35,
    points: 60,
    passScore: 70,
    briefMd: `Enough theory. Take something genuinely on your plate this week and do it with AI assistance — properly, using what Module 4 covered.

This lab is self-attested. We can't see inside another tool and we're not going to pretend we can. What we're recording is that you did the work; the value is entirely yours to claim or waste.`,
    scenarioMd: `Pick **one** real task:

- Edit something you've written (use it as an editor, not a ghostwriter)
- Summarise a long document or email thread you actually need to understand
- Pressure-test a plan or decision you're weighing
- Learn something you've been meaning to understand

Then work through the steps below.`,
    objectives: [
      { id: "steps", label: "Completed every step", weight: 3 },
      { id: "artifact", label: "Shared what you produced", weight: 2 },
      { id: "reflection", label: "Explained what actually happened", weight: 3 },
    ],
    config: {
      kind: "build",
      requireArtifact: true,
      artifactLabel: "Link to your conversation, document, or a screenshot",
      steps: [
        { id: "s1", label: "Chose a real task that fits AI's strengths", detail: "Not a toy example — something you actually needed done." },
        { id: "s2", label: "Gave it task, context, audience and constraints", detail: "All four, from Module 2." },
        { id: "s3", label: "Pasted the actual material rather than describing it" },
        { id: "s4", label: "Pushed back at least twice to refine the output", detail: "Specific corrections, not \"try again\"." },
        { id: "s5", label: "Checked at least one claim it made", detail: "Apply the consequence test — what needed checking, and what didn't?" },
        { id: "s6", label: "Edited the final output yourself before using it" },
      ],
    },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────
  {
    slug: "ai-foundations-lab-5-redaction-drill",
    title: "Redact before you paste",
    labType: "prompt",
    moduleNumber: 5,
    estimatedMinutes: 20,
    points: 50,
    passScore: 70,
    briefMd: `Module 5 covered what should never go into a chatbot, and the redaction habit: replace names with roles, fuzz figures, strip identifiers.

Here's a message stuffed with things that shouldn't be pasted anywhere. **Rewrite it as a prompt you could safely submit** — one that still gets you a genuinely useful answer.

The test is whether you can keep the substance while removing the exposure. Stripping so much that the request becomes useless is a fail; leaving personal data in is a worse one.`,
    scenarioMd: `**What you'd like help with:** drafting a firm but fair response to this complaint.

**The raw material — do NOT paste this as-is:**

> From: j.okonkwo@meridian-health.co.uk
> Re: Account MH-4471-B, patient Grace Adeyemi (NHS no. 485 777 3456, DOB 14/03/1978)
>
> We were invoiced £14,320 on 3 March for the Meridian Health contract. Our finance director, Sarah Whitfield (sarah.whitfield@meridian-health.co.uk, 07700 900412), has flagged that this exceeds the agreed cap of £12,000 in clause 7.2 of our contract signed 11 January.
>
> Grace's treatment records were also shared with your team without a signed data-sharing agreement in place, which our legal counsel considers a breach.
>
> We expect a response within 5 working days or we will escalate.`,
    objectives: [
      {
        id: "removes-pii",
        label: "Removed the personal and identifying data",
        weight: 4,
        guidance:
          "Names, email addresses, phone numbers, the NHS number, date of birth and the account reference must all be gone or replaced with generic placeholders. Award 0 if the NHS number or DOB survives — that is the most serious item here.",
      },
      {
        id: "keeps-substance",
        label: "Kept enough substance to get a useful answer",
        weight: 3,
        guidance:
          "The core facts survive: an invoice exceeding a contractual cap, a disputed data-sharing arrangement, and a deadline. A prompt stripped down to 'help me reply to a complaint' has lost too much.",
      },
      {
        id: "clear-ask",
        label: "Makes a clear, well-shaped request",
        weight: 2,
        guidance: "States what is wanted, for whom, and with what tone or constraints.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "",
      sandboxSystem:
        "You are a helpful business writing assistant. Respond to the user's request. If the user has included personal data such as names, email addresses, phone numbers, health identifiers or dates of birth, begin your response with a clear warning that this information should not have been shared with an AI tool, and name specifically which items you spotted. Then answer their underlying question.",
      contextMd: undefined,
    },
  },

  // ── Module 6 ──────────────────────────────────────────────────────────
  {
    slug: "ai-foundations-lab-6-source-check",
    title: "Verify something you can't see",
    labType: "build",
    moduleNumber: 6,
    estimatedMinutes: 25,
    points: 50,
    passScore: 70,
    briefMd: `Module 6 argued that spotting fakes by looking at pixels is a losing game, and that **source reasoning** is what actually holds up.

Practise it. Find a piece of media online — an image, a video, a dramatic claim — that you are genuinely unsure about, and work the source questions rather than squinting at the picture.

"I couldn't determine this" is a perfectly good outcome and scores full marks if your reasoning is sound. Certainty isn't the goal; honest method is.`,
    scenarioMd: `Find something real. A forwarded message, a striking clip on social media, a screenshot with no obvious origin. Something you'd genuinely have to think about.

Then work through the checks below and write up what you found.`,
    objectives: [
      { id: "steps", label: "Worked through the source checks", weight: 3 },
      { id: "artifact", label: "Shared the item you examined", weight: 2 },
      { id: "reflection", label: "Reasoned from provenance, not pixels", weight: 3 },
    ],
    config: {
      kind: "build",
      requireArtifact: true,
      artifactLabel: "Link to the item you examined (or a description if you can't link it)",
      steps: [
        { id: "s1", label: "Identified where it came from", detail: "Original account, publication, or forwarded with no traceable origin?" },
        { id: "s2", label: "Checked whether anyone else independently reported it" },
        { id: "s3", label: "Ran a reverse image or text search", detail: "Older versions? Different context? A stock original?" },
        { id: "s4", label: "Assessed whether it's doing emotional work", detail: "Is it engineered to produce outrage, fear or vindication?" },
        { id: "s5", label: "Reached a conclusion — including \"I don't know\"" },
      ],
    },
  },

  // ── Module 7 ──────────────────────────────────────────────────────────
  {
    slug: "ai-foundations-lab-7-your-routine",
    title: "Build your weekly routine",
    labType: "build",
    moduleNumber: 7,
    estimatedMinutes: 25,
    points: 50,
    passScore: 70,
    briefMd: `The last lab, and the most useful one long-term.

Module 7 argued that habits beat intentions, and that three recurring tasks beat a vague resolution to "use AI more". Set yours up now, while the material is fresh.

Then start your prompt library — five or six prompts that reliably work on *your* actual work is worth more than any prompt collection you'll find online.`,
    scenarioMd: `You're building two things:

1. **A weekly routine** — three specific recurring tasks you'll do with AI
2. **A small prompt library** — the prompts that made those tasks work

Keep both somewhere you'll actually look: a note file, a doc, wherever you already work.`,
    objectives: [
      { id: "steps", label: "Set up the routine and library", weight: 3 },
      { id: "artifact", label: "Shared your prompt library", weight: 2 },
      { id: "reflection", label: "Chose tasks honestly", weight: 3 },
    ],
    config: {
      kind: "build",
      requireArtifact: true,
      artifactLabel: "Link to your prompt library or routine document",
      steps: [
        { id: "s1", label: "Picked three recurring weekly tasks", detail: "Real things you already do, that fit AI's strengths." },
        { id: "s2", label: "Ran each one with AI at least once" },
        { id: "s3", label: "Saved the prompts that worked", detail: "Exact wording, not a summary." },
        { id: "s4", label: "Chose two or three sources to follow", detail: "People who explain, not people who hype." },
        { id: "s5", label: "Set a reminder to review this in a month", detail: "The honest question: did this save time, or just feel modern?" },
      ],
    },
  },
];
