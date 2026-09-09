import type { SeedModule, SeedCapstone, SeedFinalExam } from "./types";

// Modules 3-7 of Track 1, plus the final exam and capstone.
// Split from track-1.ts purely for file size; the runner recombines them.

export const TRACK_1_MODULES_3_TO_7: SeedModule[] = [
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "Judging What Comes Back",
    summary:
      "The skill that separates competent AI users from dangerous ones: knowing when to trust the answer and how to check it fast.",
    lessons: [
      {
        title: "Hallucination, plainly explained",
        objective: "Explain why AI invents things and predict when it is most likely to.",
        durationMinutes: 30,
        bodyMd: `## It isn't lying

Lying requires knowing the truth and choosing otherwise. A model has no such state. It produces the most plausible continuation — and when it has no good information, the most plausible continuation is a well-formed invention.

The industry calls this "hallucination". A better description is **confident invention**.

## What it looks like

- A citation to a paper that doesn't exist, with a real-sounding journal and plausible authors
- A statistic with a specific number and no source
- A quote attributed to a real person who never said it
- A feature in a product that isn't there
- A legal clause that sounds right for that kind of contract

Notice the pattern: these are all *shaped* correctly. That's exactly the problem. The model is excellent at form and indifferent to whether the content corresponds to reality.

## When it's most likely

Risk climbs sharply when you ask about:

- **Specific citations, sources or references** — the highest-risk category
- **Recent events** past the training cutoff
- **Niche topics** with thin coverage
- **Precise numbers** — dates, statistics, prices, measurements
- **Anything about a specific named small entity** — a local business, a minor regulation
- **Questions with a false premise** — ask about a book that doesn't exist and you may get a summary of it

## The habit

Before relying on any specific claim, ask yourself: *would I be embarrassed if this turned out to be invented?* If yes, check it. That's the whole discipline.`,
        microCheck: [
          {
            question: "Why is \"lying\" the wrong word for AI hallucination?",
            options: [
              "Because it is always accidental in a legal sense",
              "Because lying requires knowing the truth and choosing otherwise, which a model does not do",
              "Because the model always apologises afterwards",
              "Because hallucinations are always harmless",
            ],
            correctIndex: 1,
            explanation:
              "The model has no internal state of 'knowing the truth and saying otherwise'. It produces the most plausible continuation — which, absent good information, is a well-formed invention.",
          },
          {
            question: "Which request carries the HIGHEST risk of confident invention?",
            options: [
              "\"Rewrite this paragraph more concisely\"",
              "\"Give me three academic citations supporting this claim\"",
              "\"Summarise the text I just pasted\"",
              "\"Explain photosynthesis simply\"",
            ],
            correctIndex: 1,
            explanation:
              "Citations are the highest-risk category — correctly shaped, easy to generate, and completely fabricable. The others work from supplied text or very well-covered knowledge.",
          },
          {
            question: "What is the practical test for whether to verify a claim?",
            options: [
              "Whether the answer was long",
              "Whether you would be embarrassed if it turned out to be invented",
              "Whether the tool sounded confident",
              "Whether you have used the tool before",
            ],
            correctIndex: 1,
            explanation:
              "Confidence carries no information, so it cannot be your signal. Consequence is the useful filter: if being wrong would matter, check.",
          },
          {
            question: "You ask about a book that does not exist and get a detailed summary. What happened?",
            options: [
              "The book must exist somewhere",
              "The false premise in your question was accepted, and a plausible summary was generated",
              "The tool is broken",
              "The summary is of a different real book",
            ],
            correctIndex: 1,
            explanation:
              "Questions carrying a false premise are a classic trigger. The model completes the pattern your question set up rather than challenging it.",
          },
        ],
      },
      {
        title: "Checking a claim in 90 seconds",
        objective: "Verify an AI claim quickly enough that you actually do it.",
        durationMinutes: 25,
        bodyMd: `## Verification has to be fast or it won't happen

A ten-minute check gets skipped. Here's what fits in 90 seconds.

## The three moves

**1. Search the exact claim.** Copy the specific sentence into a search engine. Real facts have corroboration. Invented ones return nothing, or only your own text.

**2. Go to the primary source.** If the model cites a study, find the study. If it quotes a policy, open the policy. Two clicks usually settles it.

**3. Ask a different model.** Independent tools rarely invent the *same* detail. Agreement is weak evidence of truth; disagreement is strong evidence something is wrong.

## What not to do

**Don't ask the same model to check itself.** "Are you sure?" tests agreeableness, not accuracy.

**Don't treat detail as evidence.** Specificity is easy to generate.

**Don't accept a plausible-looking link without opening it.** URLs get invented too.

## Triage: what actually needs checking

Not everything. Check:

- Anything you'll repeat publicly or put your name to
- Anything with a number in it that matters
- Any citation, source or quote
- Anything where being wrong costs money, safety or reputation

Skip checking when the model is transforming text you supplied — summarising, rewriting, reformatting. It can only work with what's there, so the invention risk is much lower.`,
        resources: [
          {
            title: "Google Scholar",
            url: "https://scholar.google.com",
            resourceType: "tool",
            isFree: true,
            isRequired: false,
            notes: "The fastest way to check whether a cited paper actually exists.",
          },
        ],
        microCheck: [
          {
            question: "Which is a genuine verification move?",
            options: [
              "Asking the same model \"are you sure?\"",
              "Searching the exact claim to see if it has independent corroboration",
              "Checking the answer is well written",
              "Asking the model to rate its own confidence",
            ],
            correctIndex: 1,
            explanation:
              "Independent corroboration is real evidence. Self-checks test agreeableness, and writing quality is unrelated to accuracy.",
          },
          {
            question: "Why does asking a DIFFERENT model help?",
            options: [
              "The second model is always more accurate",
              "Independent tools rarely invent the same specific detail, so disagreement is a strong warning",
              "It doubles the speed",
              "It is required for accuracy",
            ],
            correctIndex: 1,
            explanation:
              "Two systems converging on an identical fabricated detail is unlikely. Disagreement is a strong signal; agreement is only weak support.",
          },
          {
            question: "Which task has the LOWEST need for fact-checking?",
            options: [
              "A statistic about your industry",
              "Rewriting a paragraph you pasted in, more concisely",
              "A citation to a research paper",
              "The date a law came into force",
            ],
            correctIndex: 1,
            explanation:
              "Transforming supplied text carries much lower invention risk — the model can only work with what is in front of it.",
          },
        ],
      },
      {
        title: "Bias in, bias out",
        objective: "Recognise how training data bias surfaces in everyday output.",
        durationMinutes: 30,
        bodyMd: `## Where bias comes from

A model learns patterns from human writing. Human writing carries human assumptions. The model absorbs both, without any way to separate "how people write" from "how things should be".

No malice is required. This is a straightforward consequence of learning from us.

## What it looks like in practice

**Default demographics.** Ask for "a nurse" and "a surgeon" and notice which pronouns appear unprompted.

**Cultural default.** Ask about "typical breakfast" or "normal working hours" and you'll usually get a Western, often American, answer presented as neutral.

**Language quality gap.** Output in English is generally stronger than in less-represented languages, because there was more English in training.

**Whose expertise counts.** Ask for "leading thinkers" in a field and see whose names appear.

**Flattening.** Ask about a country or culture and you get the most-written-about version, which may be a tourist's view rather than a resident's.

## What to do about it

**Name the specifics you want.** "Written for a Nigerian small business owner" beats hoping.

**Notice the unprompted defaults.** When it fills in a gap you didn't specify, that's a default worth examining.

**Be careful in consequential contexts.** Hiring, lending, assessment. If AI touches any decision about a person, bias stops being an intellectual curiosity.

**Don't over-correct into uselessness.** The tools are useful. Knowing where they lean makes them more useful, not less.`,
        microCheck: [
          {
            question: "Where does AI bias primarily come from?",
            options: [
              "Deliberate choices by engineers",
              "Patterns learned from human writing, which carries human assumptions",
              "Random errors in the software",
              "Government regulation",
            ],
            correctIndex: 1,
            explanation:
              "No malice is needed. Learning from human text means absorbing what humans assume, with no way to separate description from endorsement.",
          },
          {
            question: "You ask for advice on 'normal working hours' and get a Western answer with no caveat. What is this?",
            options: [
              "A factual error",
              "A cultural default presented as neutral",
              "A deliberate insult",
              "A software bug",
            ],
            correctIndex: 1,
            explanation:
              "Because Western sources dominate the training data, their conventions get treated as the unmarked default rather than one option among many.",
          },
          {
            question: "In which context does bias matter most?",
            options: [
              "Drafting a birthday message",
              "Any decision about a person — hiring, lending, assessment",
              "Summarising a document",
              "Reformatting a table",
            ],
            correctIndex: 1,
            explanation:
              "When output influences a decision about someone's life or livelihood, bias stops being academic and becomes a fairness and legal problem.",
          },
          {
            question: "What is the recommended response to knowing about bias?",
            options: [
              "Stop using AI tools entirely",
              "Name the specifics you want, notice unprompted defaults, and be careful in consequential contexts",
              "Assume all output is worthless",
              "Only use AI in English",
            ],
            correctIndex: 1,
            explanation:
              "Awareness makes the tools more useful, not less. Specifying what you actually want beats hoping the default matches your situation.",
          },
        ],
      },
      {
        title: "When not to use AI at all",
        objective: "Identify tasks where AI is the wrong tool regardless of skill.",
        durationMinutes: 25,
        bodyMd: `## A short, important list

**When you can't judge the output.** If you couldn't tell a good answer from a bad one, you have no safety net.

**When accountability is required.** Medical, legal, financial and safety decisions need a responsible human. Using AI to prepare for a conversation with a professional is fine; using it *instead* of one is not.

**When the input is confidential and the tool isn't approved.** Covered properly in Module 5.

**When the human element is the point.** A condolence message. An apology. Praise for a colleague. The value is that *you* wrote it. AI-assisted sympathy is worse than clumsy sincerity.

**When it's genuinely faster by hand.** A two-line email doesn't need a tool.

**When you're using it to avoid thinking you should do.** If a task is how you develop judgement in your field, outsourcing it costs you the skill. Students feel this most sharply, but it applies to everyone.

## The test worth remembering

*If this output is wrong and I don't notice, what happens?*

Nothing much → use AI freely.
Something serious → use AI with verification.
Something irreversible → get a human expert.`,
        microCheck: [
          {
            question: "Why avoid AI when you cannot judge the output quality?",
            options: [
              "The tool refuses unfamiliar topics",
              "You have no way to catch a wrong answer, so there is no safety net",
              "It costs more",
              "The output will be shorter",
            ],
            correctIndex: 1,
            explanation:
              "Your judgement is the check on the system. Without it, errors pass through unnoticed.",
          },
          {
            question: "Why is a condolence message a poor use of AI?",
            options: [
              "The tool cannot write about sad topics",
              "The value lies in you having written it — outsourcing defeats the purpose",
              "It would be too long",
              "It is technically impossible",
            ],
            correctIndex: 1,
            explanation:
              "Where the human element IS the point, delegating it removes the thing that gave it meaning. Clumsy sincerity beats polished outsourcing.",
          },
          {
            question: "What is the test for how much care a task needs?",
            options: [
              "How long the answer is",
              "\"If this is wrong and I don't notice, what happens?\"",
              "How confident the tool sounds",
              "How much the tool costs",
            ],
            correctIndex: 1,
            explanation:
              "Consequence determines the level of verification: nothing much means use freely, serious means verify, irreversible means get a human expert.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Why is \"confident invention\" a better description than \"lying\"?",
        options: [
          "It sounds more professional",
          "Lying requires knowing the truth and choosing otherwise; the model produces the most plausible continuation",
          "Inventions are always harmless",
          "The model always admits it afterwards",
        ],
        correctIndex: 1,
        explanation: "There is no internal 'truth' being concealed — only plausible text being generated.",
      },
      {
        question: "Which carries the highest risk of fabrication?",
        options: [
          "Summarising a document you pasted",
          "A list of academic citations",
          "Rewriting your paragraph",
          "Explaining a very common concept",
        ],
        correctIndex: 1,
        explanation: "Citations are correctly shaped, easy to generate, and entirely fabricable.",
      },
      {
        question: "What does asking \"are you sure?\" actually test?",
        options: [
          "Accuracy",
          "Agreeableness — it may flip a correct answer to a wrong one",
          "Processing speed",
          "The knowledge cutoff",
        ],
        correctIndex: 1,
        explanation: "Trained agreeableness means capitulation under pressure tells you nothing about truth.",
      },
      {
        question: "Which is a genuine 90-second verification move?",
        options: [
          "Checking the grammar",
          "Searching the exact claim for independent corroboration",
          "Asking the model to rate its confidence",
          "Reading the answer twice",
        ],
        correctIndex: 1,
        explanation: "Independent corroboration is real evidence; self-assessment is not.",
      },
      {
        question: "Why does checking with a different model help?",
        options: [
          "The other model is always right",
          "Independent systems rarely invent the same specific detail",
          "It is faster",
          "It is free",
        ],
        correctIndex: 1,
        explanation: "Convergence on an identical fabrication is unlikely, so disagreement is a strong warning signal.",
      },
      {
        question: "Where does bias in AI output come from?",
        options: [
          "Deliberate engineering decisions",
          "Patterns in human writing, absorbed during training",
          "Random software faults",
          "The user's own prompts only",
        ],
        correctIndex: 1,
        explanation: "Learning from human text means inheriting human assumptions, without malice.",
      },
      {
        question: "In which situation does AI bias matter most?",
        options: [
          "Formatting a spreadsheet",
          "Screening job candidates",
          "Rewriting a paragraph",
          "Generating a poem",
        ],
        correctIndex: 1,
        explanation: "Decisions about people turn bias from an intellectual point into a fairness and legal problem.",
      },
      {
        question: "Which task is a poor fit for AI because the human element is the point?",
        options: [
          "Drafting a project plan",
          "Writing a condolence message to a grieving colleague",
          "Summarising meeting notes",
          "Reformatting a report",
        ],
        correctIndex: 1,
        explanation: "The value of sympathy is that you wrote it. Outsourcing removes exactly what made it meaningful.",
      },
      {
        question: "Which task needs the LEAST verification?",
        options: [
          "A statistic you will present to your board",
          "Condensing a document you pasted in",
          "A citation for a report",
          "The date a regulation took effect",
        ],
        correctIndex: 1,
        explanation: "Transforming supplied text has much lower invention risk than generating facts.",
      },
      {
        question: "What is the consequence test?",
        options: [
          "How much the tool costs",
          "\"If this is wrong and I don't notice, what happens?\"",
          "How long the answer is",
          "Whether the tool sounded confident",
        ],
        correctIndex: 1,
        explanation: "Consequence, not confidence, should set how much checking you do.",
      },
      {
        question: "You get a URL in an answer that looks plausible. What should you do?",
        options: [
          "Cite it — the format proves it is real",
          "Open it, because URLs get invented too",
          "Assume it is broken",
          "Ask the model to confirm it",
        ],
        correctIndex: 1,
        explanation: "A well-formed URL is trivially generated. Opening it takes seconds and settles the question.",
      },
      {
        question: "Why is outsourcing a skill-building task to AI a risk?",
        options: [
          "It breaks the terms of service",
          "The task is how you develop judgement in your field, so you lose the skill",
          "The output is always worse",
          "It uses too much electricity",
        ],
        correctIndex: 1,
        explanation:
          "If struggling with a task is how expertise forms, delegating it costs you the expertise — which you then need in order to judge AI output.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "AI for Everyday Work",
    summary: "Concrete, repeatable uses that save real time in a normal working week.",
    lessons: [
      {
        title: "Writing and editing",
        objective: "Use AI as an editor rather than a ghostwriter.",
        durationMinutes: 30,
        bodyMd: `## Editing beats generating

The best writing use of AI isn't "write this for me" — it's "here's my draft, make it better." You keep your thinking and your voice; the tool handles polish.

## High-value editing requests

- "Cut this by 30% without losing meaning"
- "Rewrite so a non-technical reader follows it"
- "What's unclear here? Don't rewrite — just point it out."
- "Is the ask obvious? A busy reader should spot it in five seconds."
- "Make the tone warmer without making it soft"

That third one is underused. Asking for *diagnosis* rather than a rewrite keeps you in control and teaches you something.

## Beating the blank page

When you genuinely can't start: "Give me three different opening paragraphs, each taking a different angle." You'll usually reject all three and know what you actually want. That's a win — it cost thirty seconds.

## Keeping your voice

Generated text has a recognisable flavour: over-balanced, fond of "moreover", every point given equal weight. Readers notice.

Antidotes: paste your own writing and ask it to match. Always edit the output. Cut the last paragraph — models habitually add an unnecessary summary.

## Where the line is

Using AI to sharpen your thinking: good. Publishing text you haven't read carefully under your own name: not good. If you wouldn't defend every sentence in a meeting, don't send it.`,
        microCheck: [
          {
            question: "What is described as the best writing use of AI?",
            options: [
              "Generating finished articles",
              "Editing and improving your own draft",
              "Writing your emails entirely",
              "Replacing your writing voice",
            ],
            correctIndex: 1,
            explanation:
              "Editing keeps your thinking and voice while using the tool for polish — a much better division of labour than ghostwriting.",
          },
          {
            question: "Why ask \"what's unclear here?\" rather than \"rewrite this\"?",
            options: [
              "It produces a longer answer",
              "Diagnosis keeps you in control and teaches you something about your writing",
              "It is faster",
              "Rewriting is not supported",
            ],
            correctIndex: 1,
            explanation:
              "A diagnosis you act on yourself preserves your voice and builds your skill. A rewrite hands both over.",
          },
          {
            question: "Which is a reliable tell of unedited AI text?",
            options: [
              "Short sentences",
              "Over-balanced structure with every point given equal weight",
              "Use of the first person",
              "Spelling errors",
            ],
            correctIndex: 1,
            explanation:
              "Models default to even-handed structure and habitually append an unnecessary summary. Readers pick up on it.",
          },
        ],
      },
      {
        title: "Summarising and extracting",
        objective: "Pull the signal out of long documents reliably.",
        durationMinutes: 30,
        bodyMd: `## The most reliable AI task there is

Summarising is low-risk: the source is in front of the model, so invention is far less likely than when generating facts from nothing.

## Ask for the summary you actually need

"Summarise this" gives you a generic condensation. Better:

- "What are the three decisions I need to make?"
- "What does this ask of me, and by when?"
- "What's the strongest argument against the position here?"
- "Extract every date and deadline as a list"
- "What's NOT addressed that should be?"

That last one is excellent for contracts and proposals — absence is hard to spot by reading.

## Extraction is underrated

Pull structured data out of unstructured text: every action item with its owner, all figures with their context, all questions asked. Then ask for it as a table.

## Long documents

Very long documents may exceed what a tool can hold at once. Options: use a tool with a large context window, split the document and summarise in parts, or summarise each section then summarise the summaries.

Warning: summaries of summaries lose nuance fast. For anything important, work from the original.

## Verify differently

You're not fact-checking the world — you're checking fidelity to the source. Spot-check two or three claims against the original. If the summary says something that isn't in the document, that's your signal to distrust the whole thing.`,
        microCheck: [
          {
            question: "Why is summarising relatively low-risk?",
            options: [
              "Summaries are always short",
              "The source is in front of the model, so invention is much less likely than generating facts",
              "The tool double-checks automatically",
              "Summaries are never wrong",
            ],
            correctIndex: 1,
            explanation:
              "Working from supplied material constrains the output. It is still worth spot-checking fidelity, but the risk profile is far better.",
          },
          {
            question: "Which request is especially valuable for a contract?",
            options: [
              "\"Summarise this\"",
              "\"What's NOT addressed that should be?\"",
              "\"Make this shorter\"",
              "\"Is this a good contract?\"",
            ],
            correctIndex: 1,
            explanation:
              "Absence is very hard to notice by reading. Asking what is missing surfaces gaps that a straight summary never would.",
          },
          {
            question: "How should you verify a summary?",
            options: [
              "Ask the model if it is accurate",
              "Spot-check two or three claims against the original document",
              "Check the grammar",
              "Compare it to a different document",
            ],
            correctIndex: 1,
            explanation:
              "You are checking fidelity to the source, not facts about the world. Anything in the summary that is not in the document discredits the whole thing.",
          },
        ],
      },
      {
        title: "Planning and thinking out loud",
        objective: "Use AI to widen your thinking rather than replace it.",
        durationMinutes: 25,
        bodyMd: `## A thinking partner that never gets bored

You can ask the same question five different ways at midnight. This is genuinely useful.

## Requests that widen thinking

- "What am I not considering?"
- "Argue the opposite position as strongly as you can"
- "What would go wrong with this plan?"
- "What questions should I be asking that I haven't?"
- "Who does this affect that I haven't mentioned?"

The counter-argument request is the most valuable in this course. It's genuinely hard to argue against your own idea — and a model has no ego invested in yours.

## Structured planning

"Break this into steps with dependencies." "What needs to happen before X?" "Give me a rough timeline and flag the risky assumptions."

You'll rarely accept the plan wholesale. But it surfaces the thing you'd have forgotten, which is worth the five minutes.

## The trap

Because it's articulate and agreeable, a model can make a mediocre plan sound excellent. It has no stake in your outcome and no knowledge of your organisation's politics, history or capacity.

Use it to *generate* considerations. Keep the deciding for yourself.

## A useful pattern

State your plan. Ask for the three strongest objections. Answer them yourself. If you can't answer one, that's the weak point — and you found it before someone else did.`,
        microCheck: [
          {
            question: "Which request is described as the most valuable for widening thinking?",
            options: [
              "\"Make this sound better\"",
              "\"Argue the opposite position as strongly as you can\"",
              "\"Summarise my plan\"",
              "\"Is this a good idea?\"",
            ],
            correctIndex: 1,
            explanation:
              "Arguing against your own idea is genuinely hard. A model has no ego invested in your plan, which makes it a useful adversary.",
          },
          {
            question: "What is the trap when using AI for planning?",
            options: [
              "It produces plans too slowly",
              "Being articulate and agreeable, it can make a mediocre plan sound excellent",
              "It refuses to make plans",
              "Plans are always too detailed",
            ],
            correctIndex: 1,
            explanation:
              "Fluency plus agreeableness is a dangerous combination for judgement. It knows nothing of your organisation's politics, history or capacity.",
          },
          {
            question: "What is the recommended pattern for pressure-testing a plan?",
            options: [
              "Ask the model to approve it",
              "State the plan, ask for the three strongest objections, then answer them yourself",
              "Ask for a longer plan",
              "Ask five different models",
            ],
            correctIndex: 1,
            explanation:
              "An objection you cannot answer is your weak point — and it is far better to find it yourself than to have someone else find it for you.",
          },
        ],
      },
      {
        title: "Learning something new with AI",
        objective: "Use AI as a patient tutor without letting it do your thinking.",
        durationMinutes: 25,
        bodyMd: `## The best tutor property: infinite patience

You can ask the same question six times, admit you didn't understand, and ask again. No judgement. For anyone who found school intimidating, this alone is transformative.

## Requests that work

- "Explain this like I've never heard of it"
- "Now explain it again, assuming I understood that"
- "Give me an analogy from cooking"
- "What's the most common misunderstanding here?"
- "Test me on this — ask questions and tell me where I'm wrong"

That last one is the highest-value learning request in this course. Being tested is how knowledge sticks. Passive reading feels like learning and mostly isn't.

## The ladder technique

Ask for an explanation at three levels: to a ten-year-old, to a smart adult outside the field, to a practitioner. Reading all three shows you the shape of the concept and where the simplifications break.

## The danger

An explanation you understood is not knowledge you have. Understanding while reading feels identical to knowing — and isn't.

The fix: after any explanation, close it and explain it aloud in your own words. If you can't, you didn't learn it. That gap is invisible unless you test for it.

## Verify what you learn

For anything that matters, cross-check against a real source. A confident wrong explanation is worse than no explanation, because you'll build on it.`,
        microCheck: [
          {
            question: "What is described as the highest-value learning request?",
            options: [
              "\"Summarise this topic\"",
              "\"Test me on this — ask questions and tell me where I'm wrong\"",
              "\"Give me a reading list\"",
              "\"Explain this in detail\"",
            ],
            correctIndex: 1,
            explanation:
              "Retrieval is what makes knowledge stick. Passive reading feels like learning while mostly not being learning.",
          },
          {
            question: "Why is \"I understood the explanation\" not the same as \"I learned it\"?",
            options: [
              "Explanations are always wrong",
              "Understanding while reading feels identical to knowing, but the gap is invisible unless you test",
              "You need to read it three times",
              "Only written notes count as learning",
            ],
            correctIndex: 1,
            explanation:
              "The felt sense of comprehension is not evidence of retention. Explaining it aloud without looking is the test that exposes the difference.",
          },
          {
            question: "What is the \"ladder technique\"?",
            options: [
              "Reading the same text three times",
              "Asking for an explanation at three levels: child, smart outsider, practitioner",
              "Taking notes in three colours",
              "Studying for three hours",
            ],
            correctIndex: 1,
            explanation:
              "Comparing the three levels reveals the shape of the concept and shows exactly where the simplifications break down.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "What is the best primary writing use of AI?",
        options: ["Ghostwriting finished pieces", "Editing your own draft", "Replacing your voice", "Writing all your emails"],
        correctIndex: 1,
        explanation: "Editing keeps your thinking and voice while using the tool for polish.",
      },
      {
        question: "Why ask \"what's unclear here?\" instead of \"rewrite this\"?",
        options: [
          "It is faster",
          "Diagnosis keeps you in control and improves your own writing",
          "Rewriting costs more",
          "It produces shorter output",
        ],
        correctIndex: 1,
        explanation: "You act on the diagnosis yourself, preserving voice and building skill.",
      },
      {
        question: "Why is summarising lower-risk than generating facts?",
        options: [
          "Summaries are shorter",
          "The source material is supplied, which constrains invention",
          "The tool verifies automatically",
          "Summaries are never important",
        ],
        correctIndex: 1,
        explanation: "Working from material in front of it is a far better risk profile than generating from nothing.",
      },
      {
        question: "Which question is most valuable when reviewing a contract with AI?",
        options: ["\"Summarise this\"", "\"What's NOT addressed that should be?\"", "\"Shorten this\"", "\"Is this good?\""],
        correctIndex: 1,
        explanation: "Absence is very hard to spot by reading; asking about gaps surfaces what a summary hides.",
      },
      {
        question: "How should a summary be verified?",
        options: [
          "Ask the model if it is accurate",
          "Spot-check claims against the original document",
          "Check the spelling",
          "Read it twice",
        ],
        correctIndex: 1,
        explanation: "You are testing fidelity to the source, which only the source can settle.",
      },
      {
        question: "What is the most valuable thinking request?",
        options: [
          "\"Make this sound professional\"",
          "\"Argue the opposite position as strongly as you can\"",
          "\"Summarise my notes\"",
          "\"Tell me I'm right\"",
        ],
        correctIndex: 1,
        explanation: "A model has no ego invested in your idea, which makes it a genuinely useful adversary.",
      },
      {
        question: "What is the danger of using AI for planning?",
        options: [
          "Plans take too long",
          "Fluency and agreeableness can make a mediocre plan sound excellent",
          "It refuses to plan",
          "Plans are always too short",
        ],
        correctIndex: 1,
        explanation: "It has no stake in your outcome and no knowledge of your organisation's real constraints.",
      },
      {
        question: "Which is the highest-value learning request?",
        options: ["\"Explain this\"", "\"Test me and tell me where I'm wrong\"", "\"Summarise this\"", "\"Give me a reading list\""],
        correctIndex: 1,
        explanation: "Retrieval practice is what makes knowledge stick; passive reading largely does not.",
      },
      {
        question: "Why is \"I understood it\" not the same as \"I know it\"?",
        options: [
          "Understanding is always false",
          "Comprehension while reading feels identical to retention, and the gap is invisible unless tested",
          "You must write it down",
          "It takes three readings",
        ],
        correctIndex: 1,
        explanation: "Explaining it aloud without looking is the test that reveals the difference.",
      },
      {
        question: "What is a reliable tell of unedited AI writing?",
        options: [
          "Short sentences",
          "Over-balanced structure and an unnecessary closing summary",
          "First-person voice",
          "Typos",
        ],
        correctIndex: 1,
        explanation: "Models default to even-handedness and habitually append a summary nobody asked for.",
      },
      {
        question: "You need to summarise a document too long for the tool. What is the risk of summarising the summaries?",
        options: [
          "It takes longer",
          "Nuance is lost quickly, so important work should return to the original",
          "It is not possible",
          "The summary will be too short",
        ],
        correctIndex: 1,
        explanation: "Each layer of compression discards detail. For anything consequential, work from the source.",
      },
      {
        question: "Where is the line on publishing AI-assisted writing?",
        options: [
          "Never publish anything AI touched",
          "Don't publish under your name anything you wouldn't defend sentence by sentence",
          "Always disclose the exact prompts",
          "Only publish if it is fully rewritten",
        ],
        correctIndex: 1,
        explanation:
          "The standard is ownership: if you would not defend every sentence in a meeting, it should not go out with your name on it.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "Your Data and Your Privacy",
    summary:
      "What actually happens to what you type, what should never go in, and how to work with AI safely at your job.",
    lessons: [
      {
        title: "What happens to what you type",
        objective: "Explain where your input goes and who might see it.",
        durationMinutes: 25,
        bodyMd: `## The basic journey

You type. It travels over the internet to the provider's servers. It's processed. A response comes back. Your text is stored — usually for a period, sometimes indefinitely.

Three things follow.

**It leaves your device.** Whatever you type is on someone else's computer. That's not sinister, it's just true, and it's the right mental model.

**It may be retained.** Most providers keep conversations. Some let you delete or disable history. Some keep data for a fixed period regardless, for abuse monitoring.

**It may train future models — or may not.** This is the setting people most often get wrong. Consumer free tiers often use your conversations for training by default. Business and enterprise tiers usually don't. It's frequently a toggle you can turn off.

## Consumer vs business accounts

The distinction matters more than the brand:

**Consumer / free:** typically trains on your data by default, fewer guarantees, may be human-reviewed for safety.
**Business / enterprise:** typically no training on your data, contractual data handling, admin controls, sometimes regional data residency.

If you're using AI for work, the account type is the question — not which company's logo is on it.

## What to actually do

Find the data controls in the tool you use. Turn off training if you can. Know your retention period. If it's for work, ask whether your organisation has an approved account.

Five minutes, once. Then you know rather than hope.`,
        microCheck: [
          {
            question: "What is the correct mental model for text you type into an AI tool?",
            options: [
              "It stays on your device",
              "It travels to the provider's servers and is usually stored",
              "It is deleted immediately",
              "It is encrypted so nobody can ever read it",
            ],
            correctIndex: 1,
            explanation:
              "Your input goes to someone else's computer and is typically retained. That is the baseline assumption to work from.",
          },
          {
            question: "What is the main practical difference between consumer and business AI accounts?",
            options: [
              "Business accounts are faster",
              "Consumer tiers often train on your data by default; business tiers typically do not",
              "Business accounts have better spelling",
              "There is no real difference",
            ],
            correctIndex: 1,
            explanation:
              "Data handling is the substantive difference — training defaults, contractual terms and admin controls — not speed or quality.",
          },
          {
            question: "What is the recommended five-minute action?",
            options: [
              "Delete all your accounts",
              "Find the data controls, turn off training if possible, and learn your retention period",
              "Only use AI on paper",
              "Change your password monthly",
            ],
            correctIndex: 1,
            explanation:
              "A one-time check replaces hoping with knowing. Most tools expose these controls in settings.",
          },
        ],
      },
      {
        title: "What never to paste into a chatbot",
        objective: "Apply a clear rule for what is unsafe to submit.",
        durationMinutes: 25,
        bodyMd: `## The rule

**Don't paste anything you wouldn't be comfortable appearing in a screenshot in a news story.**

Blunt, but it works, and you can apply it in two seconds.

## The specific list

**Never, in a consumer tool:**
- Passwords, API keys, access tokens
- Full card numbers, bank details
- National insurance / social security numbers
- Medical records — yours or anyone's
- Customer personal data
- Anything under NDA or legal privilege
- Unreleased financial results
- Source code your employer considers proprietary

**Think carefully about:**
- Colleagues' names alongside performance comments
- Client names with commercial details
- Anything identifying a specific person in a sensitive context

## The redaction habit

You usually don't need the sensitive parts. Replace names with roles: "Client A", "the finance director". Round or fuzz figures. Strip identifiers.

The model doesn't need to know your client is *Acme Ltd* to help you draft a response to them.

## Other people's data deserves more care than your own

Your own data is your risk to take. Your colleague's medical situation and your customer's address are not yours to hand over. Depending on where you are, this can also be a legal matter — under GDPR, pasting customer data into a non-approved tool can be a reportable breach.

## If you already did

Delete the conversation. Check whether training was on. If it involved others' personal data at work, tell whoever handles data protection — early and awkward beats late and serious.`,
        microCheck: [
          {
            question: "What is the simple rule for deciding what not to paste?",
            options: [
              "Nothing longer than a paragraph",
              "Nothing you would be uncomfortable seeing in a screenshot in a news story",
              "Nothing containing numbers",
              "Nothing written by someone else",
            ],
            correctIndex: 1,
            explanation:
              "It is a blunt test you can apply in two seconds, and it captures most of what actually matters.",
          },
          {
            question: "What is the redaction habit?",
            options: [
              "Deleting the conversation afterwards",
              "Replacing names with roles and fuzzing figures before pasting",
              "Using a different tool",
              "Typing in a different language",
            ],
            correctIndex: 1,
            explanation:
              "You rarely need the sensitive specifics. \"The finance director\" works as well as a real name for drafting purposes.",
          },
          {
            question: "Why does other people's data deserve more care than your own?",
            options: [
              "It is more valuable commercially",
              "It is not yours to risk, and may carry legal obligations such as GDPR",
              "It is harder to type",
              "The tools handle it differently",
            ],
            correctIndex: 1,
            explanation:
              "Your own data is your risk to take. Someone else's is not — and pasting customer data into a non-approved tool can be a reportable breach.",
          },
          {
            question: "You realise you pasted customer data into a consumer chatbot at work. What should you do?",
            options: [
              "Say nothing and hope",
              "Delete the conversation, check training settings, and tell whoever handles data protection",
              "Delete your account",
              "Paste it again correctly",
            ],
            correctIndex: 1,
            explanation:
              "Early and awkward beats late and serious. Deletion alone does not discharge a potential reporting obligation.",
          },
        ],
      },
      {
        title: "Reading a privacy setting",
        objective: "Locate and configure the settings that actually matter.",
        durationMinutes: 25,
        bodyMd: `## Three settings worth finding

**1. Training on your data.** Often called "improve the model for everyone" or similar. Turning it off means your conversations aren't used to train future versions. This is the highest-value toggle.

**2. Chat history and retention.** Controls whether conversations are saved and for how long. Note: disabling history sometimes still means a shorter retention period for safety monitoring rather than true zero storage.

**3. Connected tools and memory.** Newer features let a tool remember across conversations or connect to your email, files or calendar. These are genuinely useful and genuinely expand what's exposed. Turn them on deliberately, not by accident.

## How to read a policy without reading it all

Use ctrl-F on the privacy policy for: "train", "retain", "third part", "delete", "human review". Those five searches get you most of what matters in about three minutes.

Or paste the policy into a *different* AI tool and ask: "What does this say about training on user data, retention period, and human review?" Verify anything surprising against the text.

## Regional differences

If you're in the UK or EU, GDPR gives you rights to access and deletion. Providers generally offer these in account settings. Other regions vary considerably.

## Do this now

Open the tool you use most. Find the data controls. Set them deliberately. It's a one-time task and you'll never wonder again.`,
        resources: [
          {
            title: "OpenAI privacy controls",
            url: "https://platform.openai.com/docs/models/how-we-use-your-data",
            resourceType: "article",
            isFree: true,
            isRequired: false,
            notes: "Practise the ctrl-F technique on a real policy.",
          },
        ],
        microCheck: [
          {
            question: "Which is described as the highest-value privacy toggle?",
            options: [
              "Dark mode",
              "Whether your conversations are used to train future models",
              "Notification settings",
              "Font size",
            ],
            correctIndex: 1,
            explanation:
              "Training on your data is the setting with the most lasting consequences, and it is frequently on by default in consumer tiers.",
          },
          {
            question: "What is the quick way to read a privacy policy?",
            options: [
              "Read every word carefully",
              "Ctrl-F for \"train\", \"retain\", \"third part\", \"delete\" and \"human review\"",
              "Skip it entirely",
              "Read only the first paragraph",
            ],
            correctIndex: 1,
            explanation:
              "Five targeted searches surface most of what matters in about three minutes — far more likely to actually happen than a full read.",
          },
          {
            question: "Why should connected tools and memory features be enabled deliberately?",
            options: [
              "They slow the tool down",
              "They are genuinely useful but expand what is exposed, so the trade-off should be a choice",
              "They are always unsafe",
              "They cost extra",
            ],
            correctIndex: 1,
            explanation:
              "Connecting email, files or calendar is a real capability gain and a real increase in exposure. Both are fine — drifting into it unaware is not.",
          },
        ],
      },
      {
        title: "AI at work: policies and common sense",
        objective: "Use AI at work without creating a problem for yourself or your employer.",
        durationMinutes: 25,
        bodyMd: `## Find out if there's a policy

Many organisations now have one. Many people have never read it. Ask your manager or IT: is there an approved tool, and what may I put into it?

Two minutes of asking beats a difficult conversation later.

## If there's no policy

You're making the judgement yourself. Sensible defaults:

- Use an approved or business account if one exists
- Never paste customer or employee personal data into a consumer tool
- Never paste anything under NDA or legal privilege
- Redact by default — roles instead of names
- Assume anything you type could be read by someone else

## Be open about using it

Hiding AI use tends to go badly. Not because using it is wrong, but because concealment implies you thought it was.

Reasonable: "I drafted this with AI and edited it." Or simply doing the work well and owning the output.

Unreasonable: passing off unreviewed AI output as considered work, then being surprised when an error surfaces.

## You own the output

This is the whole thing. If you send it, it's yours. "The AI said so" has never once been an acceptable explanation for an error, and it never will be.

Read what you send. Check anything that matters. Put your name to it deliberately.

## The pragmatic summary

Use it openly, use an approved account if there is one, redact by default, and own what you produce. That covers most situations most of the time.`,
        microCheck: [
          {
            question: "What is the first thing to do about AI at work?",
            options: [
              "Start using it immediately",
              "Find out whether there is a policy and an approved tool",
              "Avoid it entirely",
              "Ask a colleague what they use",
            ],
            correctIndex: 1,
            explanation:
              "Two minutes of asking beats a difficult conversation later. Many organisations have a policy that most staff have never read.",
          },
          {
            question: "Why is concealing AI use a bad idea?",
            options: [
              "It is illegal everywhere",
              "Concealment implies you thought it was wrong, which creates the problem",
              "The tools report you automatically",
              "It slows your work down",
            ],
            correctIndex: 1,
            explanation:
              "Using AI is generally fine; hiding it signals otherwise and turns a non-issue into a credibility problem.",
          },
          {
            question: "What does \"you own the output\" mean?",
            options: [
              "You hold the copyright",
              "If you send it, you are responsible for it — \"the AI said so\" is never an explanation",
              "You must save a copy",
              "You can sell the output",
            ],
            correctIndex: 1,
            explanation:
              "Responsibility does not transfer to the tool. Read what you send, check what matters, and put your name to it deliberately.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "What happens to text you type into a typical AI tool?",
        options: [
          "It stays on your device",
          "It goes to the provider's servers and is usually stored for some period",
          "It is deleted the moment you close the tab",
          "It is only seen by a machine, never a human",
        ],
        correctIndex: 1,
        explanation: "It leaves your device and is typically retained — sometimes with human review for safety.",
      },
      {
        question: "What is the key difference between consumer and business AI accounts?",
        options: [
          "Response speed",
          "Data handling — training defaults, contractual terms and admin controls",
          "The quality of answers",
          "The number of languages supported",
        ],
        correctIndex: 1,
        explanation: "For work use, the account type matters more than which company's logo is on it.",
      },
      {
        question: "Which is the simplest test for what not to paste?",
        options: [
          "Anything over 500 words",
          "Anything you would not want to see screenshotted in a news story",
          "Anything containing numbers",
          "Anything written by a colleague",
        ],
        correctIndex: 1,
        explanation: "Blunt, fast, and it captures most of what genuinely matters.",
      },
      {
        question: "Which should NEVER go into a consumer AI tool?",
        options: [
          "A draft blog post",
          "A customer's full name, address and account details",
          "A public press release",
          "Your own to-do list",
        ],
        correctIndex: 1,
        explanation: "Customer personal data in a non-approved tool can be a reportable breach under GDPR.",
      },
      {
        question: "What is the redaction habit?",
        options: [
          "Deleting conversations weekly",
          "Replacing names with roles and fuzzing figures before pasting",
          "Using incognito mode",
          "Writing in shorthand",
        ],
        correctIndex: 1,
        explanation: "The model rarely needs the real specifics to help with the task.",
      },
      {
        question: "Why does other people's data deserve extra care?",
        options: [
          "It is harder to redact",
          "It is not your risk to take, and may carry legal obligations",
          "It is usually longer",
          "The tools charge more for it",
        ],
        correctIndex: 1,
        explanation: "Your own data is your call. Someone else's is not.",
      },
      {
        question: "Which privacy setting has the most lasting consequences?",
        options: [
          "Notification preferences",
          "Whether your conversations train future models",
          "Interface theme",
          "Default language",
        ],
        correctIndex: 1,
        explanation: "It is often on by default in consumer tiers and is the highest-value toggle to find.",
      },
      {
        question: "What is the fast way to assess a privacy policy?",
        options: [
          "Read it end to end",
          "Ctrl-F for train, retain, third part, delete, human review",
          "Skip it",
          "Ask the same AI tool if it is safe",
        ],
        correctIndex: 1,
        explanation: "Five targeted searches cover most of what matters in a few minutes.",
      },
      {
        question: "You discover you pasted confidential client data into a consumer chatbot. What is the right response?",
        options: [
          "Say nothing",
          "Delete the conversation, check training settings, and inform whoever handles data protection",
          "Delete your account and move on",
          "Ask the tool to forget it",
        ],
        correctIndex: 1,
        explanation: "Deletion alone may not discharge a reporting obligation. Early disclosure is the safer path.",
      },
      {
        question: "Why is hiding your AI use at work risky?",
        options: [
          "It is against the law",
          "Concealment signals you believed it was wrong, creating a credibility problem",
          "The tools notify your employer",
          "It makes work slower",
        ],
        correctIndex: 1,
        explanation: "Using AI is usually fine; hiding it is what turns it into an issue.",
      },
      {
        question: "What does ownership of AI-assisted output mean in practice?",
        options: [
          "You hold the copyright",
          "You are responsible for what you send — \"the AI said so\" is not a defence",
          "You must credit the tool",
          "You should archive every conversation",
        ],
        correctIndex: 1,
        explanation: "Responsibility never transfers to the tool.",
      },
      {
        question: "There is no AI policy at your workplace. What is a sensible default?",
        options: [
          "Assume everything is permitted",
          "Redact by default, avoid personal data in consumer tools, and assume anything typed could be read",
          "Avoid AI entirely",
          "Use only your personal account",
        ],
        correctIndex: 1,
        explanation:
          "Absent a policy you are making the judgement, so make it conservatively and deliberately.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "Images, Audio and Video",
    summary:
      "Generative AI beyond text — how it works, how to use it, and how to spot it being used on you.",
    lessons: [
      {
        title: "How image generation works",
        objective: "Explain image generation in plain terms and set realistic expectations.",
        durationMinutes: 25,
        bodyMd: `## Starting from noise

Image models work almost backwards from what you'd expect. They start with random visual static and repeatedly remove noise, steered by your description, until an image emerges.

They learned this by taking millions of captioned images, progressively adding noise, and learning to reverse the process. Do that enough and you can generate from pure noise, guided by text.

## What this explains

**Why it's fast but not precise.** You're steering a process, not drawing. "Move that slightly left" isn't how it works.

**Why text in images is often mangled.** Letters are visual patterns to the model, not language. This is improving but remains a weak spot.

**Why hands were notoriously bad.** Hands are complex, highly variable, and appear in countless configurations. Much better now, still worth checking.

**Why style transfer works so well.** Style is exactly the kind of pattern these systems capture beautifully.

## Setting expectations

Good for: illustrations, concepts, mood boards, backgrounds, social images, visualising an idea before commissioning real work.

Poor for: precise diagrams, anything needing accurate text, exact brand consistency, factual illustration where detail must be correct.

## The rights question, briefly

These models trained on images including copyrighted work, and the legal position is still being settled in several jurisdictions. Providers offer differing indemnities.

For personal and internal use, generally fine. For commercial use — especially anything public-facing — check your provider's terms and your organisation's position. This is genuinely unsettled, and anyone telling you it's simple is overselling.`,
        resources: [
          {
            title: "ChatGPT (image generation)",
            url: "https://chat.openai.com",
            resourceType: "tool",
            isFree: false,
            isRequired: false,
            notes: "Image generation is usually a paid feature. Free alternatives exist but change often.",
          },
        ],
        microCheck: [
          {
            question: "How do image generation models produce an image?",
            options: [
              "By copying and pasting parts of training images",
              "By starting from random noise and repeatedly removing it, steered by your description",
              "By drawing shapes in order",
              "By searching an image database",
            ],
            correctIndex: 1,
            explanation:
              "They learned to reverse a noise-adding process. Generation runs that reversal from pure static, guided by your text.",
          },
          {
            question: "Why is text inside generated images often mangled?",
            options: [
              "The model cannot read",
              "Letters are treated as visual patterns rather than language",
              "Text is deliberately blurred",
              "Fonts are copyrighted",
            ],
            correctIndex: 1,
            explanation:
              "The model reproduces letter-shaped patterns without a linguistic representation of spelling. It is improving but remains a weak spot.",
          },
          {
            question: "What is the honest position on commercial use of AI images?",
            options: [
              "Always completely safe",
              "Genuinely unsettled — check your provider's terms and your organisation's position",
              "Always illegal",
              "Only legal in the EU",
            ],
            correctIndex: 1,
            explanation:
              "The legal position is still being decided in several jurisdictions and provider indemnities differ. Anyone claiming it is simple is overselling.",
          },
        ],
      },
      {
        title: "Making your first images",
        objective: "Write image prompts that produce usable results.",
        durationMinutes: 30,
        bodyMd: `## The anatomy of an image prompt

Image prompts work differently from chat. Think description, not instruction.

**Subject** — what's in it
**Setting** — where
**Style** — photograph, watercolour, 3D render, line drawing
**Lighting** — soft morning light, harsh shadows, backlit
**Composition** — close-up, wide shot, overhead
**Mood** — calm, energetic, austere

**Weak:** \`a coffee shop\`
**Strong:** \`A small independent coffee shop interior, early morning, warm light through a large front window, wooden tables, one person reading, shot on 35mm film, shallow depth of field, calm and unhurried\`

## Say what you want, not what you don't

Most models handle "a street with no cars" poorly — mentioning cars makes cars more likely. Describe the empty street instead: "a quiet pedestrianised street, early morning, deserted."

## Iterate on one variable

Change one thing at a time. Same prompt, different lighting. Same prompt, different style. Changing everything at once teaches you nothing about what did the work.

## Style references

Naming a medium, era or technique works well: "1970s travel poster", "technical pen illustration", "Kodachrome". Naming a living artist is legally and ethically murkier — describing the visual qualities you want is the better habit.

## Try it

Generate four versions of one idea, changing only the style each time. You'll learn more in ten minutes than from any amount of reading.`,
        microCheck: [
          {
            question: "How should an image prompt be structured?",
            options: [
              "As a short command",
              "As a description covering subject, setting, style, lighting, composition and mood",
              "As a question",
              "As a single keyword",
            ],
            correctIndex: 1,
            explanation:
              "Image models respond to description rather than instruction. The more of those dimensions you specify, the closer the result.",
          },
          {
            question: "Why does \"a street with no cars\" often still produce cars?",
            options: [
              "The model prefers cars",
              "Mentioning cars makes them more likely — describe what you DO want instead",
              "Streets always contain cars",
              "The prompt is too short",
            ],
            correctIndex: 1,
            explanation:
              "Negation is handled poorly. \"A quiet pedestrianised street, deserted\" works far better than naming what to exclude.",
          },
          {
            question: "What is the best way to learn what affects your results?",
            options: [
              "Change everything at once",
              "Change one variable at a time and compare",
              "Use the longest possible prompt",
              "Use the same prompt repeatedly",
            ],
            correctIndex: 1,
            explanation:
              "Isolating one variable tells you what actually did the work. Changing everything teaches you nothing transferable.",
          },
        ],
      },
      {
        title: "Voice, music and video",
        objective: "Understand the current state of generated audio and video.",
        durationMinutes: 25,
        bodyMd: `## Voice: the most mature

Text-to-speech is now genuinely good — natural intonation, multiple languages, controllable pace and emotion. Useful for accessibility, drafts, narration and prototyping.

Voice *cloning* needs only a short sample. This is the most immediately misusable AI capability in general circulation. Consent isn't a nicety here; cloning someone's voice without permission ranges from unethical to illegal depending on where you are and what you do with it.

## Music: capable, contested

Generate backing tracks, jingles, mood pieces from a text description. Quality is genuinely usable for background purposes.

The rights position is contested — models trained on recorded music, and the industry is actively litigating. For personal projects, fine. For anything commercial, check terms carefully.

## Video: improving fast, still limited

Text-to-video produces short clips of increasing quality. Real constraints remain: length is short, fine control is limited, consistency across shots is hard, and physics can go strange.

Useful for: b-roll, concepts, social clips, pitching an idea.
Not yet a replacement for: anything needing precise direction or continuity.

This is the fastest-moving area in the field. Anything specific said about capability here has a short shelf life — which is itself the most useful thing to know.

## The through-line

Every one of these makes it cheaper to produce convincing media. That's a genuine creative gain and a genuine trust problem. The next lesson is about the trust problem.`,
        microCheck: [
          {
            question: "Which generated-media capability is described as most immediately misusable?",
            options: ["Music generation", "Voice cloning from a short sample", "Image upscaling", "Subtitle generation"],
            correctIndex: 1,
            explanation:
              "Cloning a voice needs very little audio and enables convincing impersonation — which is why consent is a legal matter, not a courtesy.",
          },
          {
            question: "What is the main current limitation of text-to-video?",
            options: [
              "It only works in black and white",
              "Short clips, limited fine control, and difficulty keeping consistency across shots",
              "It requires professional equipment",
              "It cannot generate people",
            ],
            correctIndex: 1,
            explanation:
              "Length, control and continuity are the real constraints. It is useful for b-roll and concepts, not for precisely directed sequences.",
          },
          {
            question: "What is the most durable thing to know about generated video capability?",
            options: [
              "It will never improve",
              "It is the fastest-moving area, so specific capability claims date quickly",
              "It is identical to image generation",
              "It is banned in most countries",
            ],
            correctIndex: 1,
            explanation:
              "Specifics go stale fast here. Knowing that the ground shifts is more useful than memorising today's limits.",
          },
        ],
      },
      {
        title: "Deepfakes and spotting fakes",
        objective: "Assess whether media is genuine using source-based reasoning.",
        durationMinutes: 30,
        bodyMd: `## Visual tells are a losing game

You may have been taught to look for six-fingered hands, garbled text, weird ears. These worked in 2023. They work less each year.

Learn them, but don't rely on them. Anything based on current-generation flaws expires.

## What actually works: source reasoning

**Where did this come from?** A screenshot forwarded through three chats has no provenance. A video on a news organisation's own site does.

**Who else is reporting it?** Genuinely significant events get covered independently. A dramatic clip that exists on exactly one account is a warning sign.

**Does it exist elsewhere?** Reverse image search. Older versions, different contexts, or a stock photo original settle most questions in seconds.

**Is it doing emotional work?** Fabricated media is usually designed to produce outrage, fear or vindication. Strong emotional pull is a reason to slow down.

**Does the source have a track record?** Provenance beats pixel-inspection almost every time.

## The bigger risk

The most damaging effect isn't people believing fakes. It's people disbelieving *real* things — "that's probably AI" as a way to dismiss genuine evidence.

That's called the liar's dividend, and it's already happening. Reflexive scepticism is as much a failure mode as credulity.

## What to actually do

Slow down before sharing. Check the source, not the pixels. Accept that you can't always tell, and that "I don't know" is a legitimate position.

Being unsure and saying so is more honest than confident wrongness in either direction.`,
        microCheck: [
          {
            question: "Why are visual tells like extra fingers unreliable for spotting fakes?",
            options: [
              "They were never real indicators",
              "They are artefacts of current-generation flaws and expire as models improve",
              "Only experts can see them",
              "They only appear in video",
            ],
            correctIndex: 1,
            explanation:
              "Anything based on today's specific defects has a short shelf life. Source reasoning does not expire.",
          },
          {
            question: "What is the most reliable approach to assessing suspicious media?",
            options: [
              "Zoom in on the pixels",
              "Ask where it came from, who else reports it, and whether it exists elsewhere",
              "Check if it looks professional",
              "Ask an AI tool if it is fake",
            ],
            correctIndex: 1,
            explanation:
              "Provenance beats pixel-inspection almost every time, and it stays valid as generation quality improves.",
          },
          {
            question: "What is the \"liar's dividend\"?",
            options: [
              "Money made from selling fake media",
              "People dismissing genuine evidence as \"probably AI\"",
              "The cost of detection tools",
              "A type of deepfake",
            ],
            correctIndex: 1,
            explanation:
              "The ability to dismiss real evidence as fabricated may be more damaging than fakes themselves — reflexive scepticism is its own failure mode.",
          },
          {
            question: "What is a legitimate conclusion when you cannot determine authenticity?",
            options: [
              "Assume it is fake",
              "Assume it is real",
              "\"I don't know\" — and not sharing it",
              "Share it with a warning",
            ],
            correctIndex: 2,
            explanation:
              "Honest uncertainty beats confident wrongness in either direction, and not amplifying unverified media is the responsible default.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "How do image generation models create images?",
        options: [
          "By collaging training images",
          "By removing noise from random static, steered by your description",
          "By searching a photo library",
          "By drawing shapes sequentially",
        ],
        correctIndex: 1,
        explanation: "They learned to reverse a noise-adding process, then run it from pure static.",
      },
      {
        question: "Why is text in generated images often wrong?",
        options: [
          "Fonts are copyrighted",
          "Letters are visual patterns to the model, not language",
          "Text is blurred deliberately",
          "The resolution is too low",
        ],
        correctIndex: 1,
        explanation: "There is no linguistic representation of spelling behind the letter shapes.",
      },
      {
        question: "Which produces a better image result?",
        options: [
          "\"a coffee shop\"",
          "\"A small independent coffee shop, early morning light through a large window, wooden tables, shot on 35mm film, calm mood\"",
          "\"make me a nice coffee shop picture please\"",
          "\"coffee\"",
        ],
        correctIndex: 1,
        explanation: "Subject, setting, style, lighting and mood all give the model something to work with.",
      },
      {
        question: "Why does \"a room with no clutter\" often produce clutter?",
        options: [
          "Rooms are always cluttered",
          "Negation is handled poorly — naming a thing makes it more likely",
          "The prompt is too short",
          "The model dislikes empty rooms",
        ],
        correctIndex: 1,
        explanation: "Describe what you want present rather than what you want absent.",
      },
      {
        question: "Which capability is most immediately open to misuse?",
        options: ["Image upscaling", "Voice cloning from a short sample", "Music generation", "Auto-captioning"],
        correctIndex: 1,
        explanation: "Very little audio is needed to produce convincing impersonation.",
      },
      {
        question: "What limits text-to-video today?",
        options: [
          "It cannot render colour",
          "Short clips, limited control, and poor consistency across shots",
          "It needs a film studio",
          "It only works with animation",
        ],
        correctIndex: 1,
        explanation: "Useful for b-roll and concepts; not for precisely directed, continuous sequences.",
      },
      {
        question: "Why should you not rely on spotting extra fingers to detect fakes?",
        options: [
          "It never worked",
          "Such artefacts reflect current-generation flaws and disappear as models improve",
          "Only video has these flaws",
          "It requires special software",
        ],
        correctIndex: 1,
        explanation: "Detection based on today's defects expires; source reasoning does not.",
      },
      {
        question: "What is the strongest signal that a dramatic clip may be fabricated?",
        options: [
          "It is in high resolution",
          "It exists on exactly one account with no independent coverage",
          "It is longer than a minute",
          "It has background music",
        ],
        correctIndex: 1,
        explanation: "Genuinely significant events attract independent reporting.",
      },
      {
        question: "What is the liar's dividend?",
        options: [
          "Profit from selling deepfakes",
          "Dismissing genuine evidence as \"probably AI\"",
          "The cost of verification",
          "A watermarking standard",
        ],
        correctIndex: 1,
        explanation: "Reflexive disbelief of real evidence may do more damage than fakes themselves.",
      },
      {
        question: "What is the honest legal position on commercial use of AI-generated images?",
        options: [
          "Entirely settled and safe",
          "Genuinely unsettled — check provider terms and your organisation's position",
          "Illegal everywhere",
          "Only an issue for video",
        ],
        correctIndex: 1,
        explanation: "Litigation is ongoing in multiple jurisdictions and indemnities differ by provider.",
      },
      {
        question: "What is a legitimate response when you cannot verify a video?",
        options: [
          "Share it labelled as real",
          "Say you don't know, and don't amplify it",
          "Assume it is definitely fake",
          "Ask an AI whether it is fake",
        ],
        correctIndex: 1,
        explanation: "Honest uncertainty plus not amplifying is the responsible default.",
      },
      {
        question: "Which use case suits AI image generation well?",
        options: [
          "A precise technical diagram with labels",
          "A mood board for a concept",
          "An exact brand logo reproduction",
          "A factual medical illustration",
        ],
        correctIndex: 1,
        explanation: "Mood, concept and style are strengths; precision, accurate text and exactness are not.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "Building an AI Habit",
    summary:
      "Turning what you've learned into a sustainable practice — and keeping current without drowning in noise.",
    lessons: [
      {
        title: "Choosing your tools",
        objective: "Select a small toolset deliberately instead of chasing every new release.",
        durationMinutes: 25,
        bodyMd: `## You need fewer tools than you think

One good general assistant covers the overwhelming majority of everyday use. Everything else is specialisation you may never need.

Resist collecting tools. Ten half-learned tools are worth less than one you know deeply.

## How to choose

**Does it fit where you already work?** A tool inside your existing email or documents beats a better tool you have to remember to open.

**Is the data handling acceptable?** For work, this may decide it outright.

**Can you tell when it's wrong?** If you can't evaluate the output, a more capable tool is more dangerous, not less.

**Is it free or does it need to be paid?** Free tiers are genuinely capable now. Pay when you hit a real limit repeatedly, not in anticipation.

## A reasonable starting kit

- **One general assistant** — ChatGPT, Claude or Gemini. Learn it properly.
- **One alternative** for cross-checking important answers.
- **Whatever is already built into your work software** — often the highest-value option because there's no friction.

That's enough for most people indefinitely.

## Switching costs are real

Learning a tool's quirks takes weeks. Switching resets that. A new release being 5% better rarely justifies it — switch when something is genuinely, obviously better for how you work, not on announcement.`,
        microCheck: [
          {
            question: "What is the recommended approach to tool selection?",
            options: [
              "Collect as many as possible",
              "Learn one general assistant properly, plus one alternative for cross-checking",
              "Only use paid tools",
              "Change tools monthly",
            ],
            correctIndex: 1,
            explanation:
              "Depth beats breadth. Ten half-learned tools are worth less than one you know well.",
          },
          {
            question: "Why does a tool built into software you already use have an advantage?",
            options: [
              "It is always more capable",
              "There is no friction — you don't have to remember to open it",
              "It is always cheaper",
              "It has better privacy",
            ],
            correctIndex: 1,
            explanation:
              "Friction determines whether you actually use something. A slightly weaker tool you use beats a better one you forget.",
          },
          {
            question: "When is it worth switching tools?",
            options: [
              "Whenever a new version is announced",
              "When something is genuinely and obviously better for how you work",
              "Every six months",
              "When a competitor is 5% better on a benchmark",
            ],
            correctIndex: 1,
            explanation:
              "Switching resets weeks of learned quirks. Marginal benchmark gains rarely justify that cost.",
          },
        ],
      },
      {
        title: "A weekly AI routine",
        objective: "Build a sustainable habit that produces real time savings.",
        durationMinutes: 25,
        bodyMd: `## Habits beat intentions

"I should use AI more" produces nothing. A specific trigger tied to a specific task produces a habit.

## Start with three recurring tasks

Pick three things you do every week that fit AI's strengths:

- Drafting a recurring report or update
- Summarising a long email thread or document
- Preparing for a meeting — likely questions, counter-arguments
- Turning messy notes into structured actions
- Rewriting something for a different audience

Three is enough. Do those three with AI every week for a month.

## Keep what works

Some will save real time. Some won't. After a month you'll know which — and that's genuinely useful information about your own work, not just about AI.

Drop the ones that didn't help. No obligation to use a tool for something it isn't good at.

## Build a small prompt library

When something works well, save it. A note file with five or six prompts that reliably work for your recurring tasks is worth more than any prompt-engineering course.

## The honest measure

Ask monthly: *has this actually saved me time, or does it just feel modern?*

Sometimes the honest answer is that a task was faster by hand. Noticing that is a sign of competence, not failure.`,
        microCheck: [
          {
            question: "Why does \"I should use AI more\" fail as an approach?",
            options: [
              "It is too ambitious",
              "Habits need a specific trigger tied to a specific task, not a vague intention",
              "AI tools require scheduling",
              "It costs too much",
            ],
            correctIndex: 1,
            explanation:
              "Vague intentions do not become behaviour. Three named recurring tasks do.",
          },
          {
            question: "What is a small prompt library?",
            options: [
              "A paid subscription service",
              "A note file of five or six prompts that reliably work for your recurring tasks",
              "A public database of prompts",
              "A browser extension",
            ],
            correctIndex: 1,
            explanation:
              "A handful of prompts proven on your own work is worth more than any generic prompt collection.",
          },
          {
            question: "What is the honest monthly question to ask?",
            options: [
              "Which new tools launched?",
              "Has this actually saved me time, or does it just feel modern?",
              "How many prompts did I write?",
              "Am I using the most advanced model?",
            ],
            correctIndex: 1,
            explanation:
              "Concluding that a task was faster by hand is a sign of competence, not failure.",
          },
        ],
      },
      {
        title: "Keeping up without drowning",
        objective: "Stay current sustainably and judge new claims sceptically.",
        durationMinutes: 25,
        bodyMd: `## You cannot keep up, and you don't need to

The field produces more news per week than anyone can absorb. Trying to follow all of it is a full-time job that produces anxiety rather than competence.

The good news: fundamentals move slowly. Everything in this course will still be broadly true in two years. What changes is which tool is briefly best — and that rarely matters for everyday work.

## A sustainable approach

**Check in monthly, not daily.** Nothing meaningful is missed in three weeks.

**Follow two or three sources, not twenty.** Prefer people who explain over people who hype.

**Ignore benchmark announcements.** "Model X beats Model Y by 3%" almost never changes what you should do on Monday.

**Wait a fortnight after a major release.** The initial coverage is marketing. The honest assessment arrives once people have used it on real work.

## Judging a claim

When you see "AI can now do X":

- Who's making the claim, and what do they gain?
- Is there a demo you can try, or only a video?
- What's the failure rate, and on what kind of task?
- Was it tested on realistic work or a curated example?

Cherry-picked demos are the norm. Ask what wasn't shown.

## Where you are now

You understand what these systems are, how to get good results, how to check them, what not to feed them, and where they don't belong.

That foundation outlasts any specific tool. The capstone is where you show you can apply it.`,
        microCheck: [
          {
            question: "Why is trying to follow all AI news counterproductive?",
            options: [
              "The news is always false",
              "It is a full-time job producing anxiety rather than competence, while fundamentals move slowly",
              "It requires paid subscriptions",
              "The news is too technical",
            ],
            correctIndex: 1,
            explanation:
              "Fundamentals are stable; what churns is which tool is briefly best, which rarely changes everyday practice.",
          },
          {
            question: "Why wait a fortnight after a major release before judging it?",
            options: [
              "The tool is unstable at first",
              "Initial coverage is marketing; honest assessment arrives once people use it on real work",
              "Prices drop after two weeks",
              "Reviews are embargoed",
            ],
            correctIndex: 1,
            explanation:
              "Launch coverage is promotional by nature. Practitioners reporting real-world results take a little time to appear.",
          },
          {
            question: "What should you ask about an impressive AI demo?",
            options: [
              "How long it took to make",
              "What wasn't shown, and what the failure rate is on realistic tasks",
              "Which company produced it",
              "How many people watched it",
            ],
            correctIndex: 1,
            explanation:
              "Cherry-picked demos are standard. The interesting information is always in what was left out.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "What is the recommended starting toolkit?",
        options: [
          "Ten specialised tools",
          "One general assistant learned properly, plus one alternative for cross-checking",
          "Only paid enterprise tools",
          "Whichever tool launched most recently",
        ],
        correctIndex: 1,
        explanation: "Depth beats breadth; one well-known tool outperforms ten half-learned ones.",
      },
      {
        question: "Why does a tool built into your existing software have an edge?",
        options: [
          "It is always more capable",
          "Zero friction — you don't have to remember to open it",
          "It is always free",
          "It has stronger privacy by default",
        ],
        correctIndex: 1,
        explanation: "Friction determines actual use more than raw capability does.",
      },
      {
        question: "When is switching tools justified?",
        options: [
          "On every new release",
          "When something is genuinely and obviously better for your actual work",
          "Every quarter",
          "When a benchmark improves slightly",
        ],
        correctIndex: 1,
        explanation: "Switching resets weeks of learned quirks, so the gain must be real.",
      },
      {
        question: "How should you build an AI habit?",
        options: [
          "Resolve to use AI more",
          "Pick three recurring weekly tasks and do them with AI for a month",
          "Use AI for everything immediately",
          "Read about AI daily",
        ],
        correctIndex: 1,
        explanation: "Specific triggers on specific recurring tasks are what turn into habits.",
      },
      {
        question: "What should you do with tasks where AI didn't help?",
        options: [
          "Keep trying indefinitely",
          "Drop them — there is no obligation to use a tool for something it isn't good at",
          "Switch to a paid tool",
          "Blame the prompt",
        ],
        correctIndex: 1,
        explanation: "Recognising a poor fit is competence, not failure.",
      },
      {
        question: "What is the value of a small prompt library?",
        options: [
          "It impresses colleagues",
          "A few prompts proven on your own recurring work beat any generic collection",
          "It is required by most tools",
          "It reduces subscription cost",
        ],
        correctIndex: 1,
        explanation: "Prompts validated against your actual tasks are the ones that keep paying off.",
      },
      {
        question: "How often is it sufficient to check AI news?",
        options: ["Hourly", "Daily", "Monthly", "Yearly"],
        correctIndex: 2,
        explanation: "Fundamentals move slowly; a monthly check-in misses nothing that changes your practice.",
      },
      {
        question: "Why wait before judging a major new release?",
        options: [
          "Prices fall",
          "Early coverage is marketing; honest assessments come once people use it on real work",
          "The tool is broken at launch",
          "Reviews are embargoed",
        ],
        correctIndex: 1,
        explanation: "Practitioner reports lag launch hype by a couple of weeks.",
      },
      {
        question: "What is the key question about an impressive demo?",
        options: [
          "Who filmed it",
          "What wasn't shown and what the realistic failure rate is",
          "How long it is",
          "Which model version was used",
        ],
        correctIndex: 1,
        explanation: "Demos are curated by default; the omissions carry the information.",
      },
      {
        question: "Why do benchmark announcements rarely matter for everyday work?",
        options: [
          "Benchmarks are always faked",
          "A few percent on a benchmark almost never changes what you should do on Monday",
          "Benchmarks are secret",
          "They only apply to coding",
        ],
        correctIndex: 1,
        explanation: "Benchmark deltas seldom translate into a different practical decision.",
      },
      {
        question: "What is the most durable thing you take from this course?",
        options: [
          "Knowing which tool is currently best",
          "Understanding what these systems are, how to get good results, and how to check them",
          "A list of prompts",
          "Knowledge of current model names",
        ],
        correctIndex: 1,
        explanation: "Tool-specific knowledge expires; the conceptual foundation does not.",
      },
      {
        question: "Which best describes a sustainable relationship with AI news?",
        options: [
          "Follow twenty sources daily",
          "Follow two or three explainers, check monthly, ignore benchmark noise",
          "Ignore all news permanently",
          "Only read vendor announcements",
        ],
        correctIndex: 1,
        explanation: "A small number of explanatory sources checked periodically keeps you current without the anxiety.",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
export const TRACK_1_CAPSTONE: SeedCapstone = {
  passThreshold: 70,
  briefMd: `## The brief

Choose **one real task from your own life or work** and document how you used AI to do it — including where the AI got it wrong.

This is deliberately not a test of whether AI can do something impressive. It's a test of whether *you* can use it competently and judge its output honestly. A submission where everything worked perfectly is usually a submission where the author didn't check carefully enough.

## What to submit

A written piece of roughly **800–1,500 words** covering:

### 1. The task
What you set out to do, and why it was a reasonable fit for an AI tool. Be specific — "wrote an email" is thin; "drafted a response to a customer complaint about a delayed order, where I needed to be apologetic without admitting liability" is a real task.

### 2. Your process
Show the actual prompts you used. Include your first attempt even if it was poor, and show how you refined it. We want to see the iteration, not just the polished final prompt.

### 3. At least one thing the AI got wrong
This section is required. Document something the tool produced that was inaccurate, inappropriate, biased, or simply unhelpful — and explain how you noticed. If you genuinely found nothing wrong, explain what you checked and how, so a reviewer can judge whether the checking was adequate.

### 4. Your verification
What did you check, and how? Which claims did you decide needed checking, and which did you accept without checking? Explain your reasoning for both.

### 5. Data and privacy
What did you put into the tool? What did you deliberately keep out, or redact? If the task involved no sensitive data at all, say so and explain how you determined that.

### 6. Honest assessment
Did this actually save you time or improve the result? Would you use AI for this task again? "No, it was slower than doing it myself" is a perfectly good answer if it's true and well argued.

## Format

Submit as a link to a shared document (Google Docs, Notion, a PDF — anything publicly viewable) or paste directly into the submission box. Screenshots of your conversations are welcome and often strengthen a submission.

## What we're looking for

Honesty over polish. A submission that says "I initially accepted a statistic that turned out to be invented, and here's how I caught it on re-reading" demonstrates far more competence than one claiming flawless results.

Reviewers read for evidence of judgement — that you know what these tools are for, where they fail, and when to override them.`,
  rubric: [
    {
      criterion: "Task selection and fit",
      weight: 15,
      description:
        "Is the chosen task real, specific, and a sensible use of AI? Does the learner explain why it was a reasonable fit rather than reaching for AI reflexively?",
    },
    {
      criterion: "Process and iteration",
      weight: 20,
      description:
        "Are actual prompts shown, including early weak attempts? Is there clear evidence of refining the request rather than accepting the first output?",
    },
    {
      criterion: "Critical evaluation",
      weight: 25,
      description:
        "Does the learner identify something the AI got wrong, and explain how they noticed? If nothing was wrong, is the checking described rigorous enough to justify that conclusion? This is the heaviest criterion because it is the core skill of the track.",
    },
    {
      criterion: "Verification reasoning",
      weight: 20,
      description:
        "Is there a coherent account of what was checked and what was not, with reasoning for both? Does the learner apply the consequence test rather than checking everything or nothing?",
    },
    {
      criterion: "Data and privacy judgement",
      weight: 10,
      description:
        "Does the learner show awareness of what they submitted, what they withheld or redacted, and why? Is the reasoning sound for their context?",
    },
    {
      criterion: "Honest assessment",
      weight: 10,
      description:
        "Is the conclusion genuinely reflective rather than promotional? A well-argued negative conclusion scores fully here.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
export const TRACK_1_FINAL_EXAM: SeedFinalExam = {
  title: "AI Foundations — Final Exam",
  timeLimitMinutes: 60,
  questionsServed: 30,
  passScore: 75,
  distinctionScore: 90,
  maxAttempts: 3,
  cooldownHours: 24,
  instructionsMd: `## Before you start

**30 questions. 60 minutes. 75% to pass.** Score 90% or above and your certificate is marked *with Distinction*.

The clock runs on our server and starts the moment you begin. Closing this tab, losing your connection, or switching devices will not pause it — but every answer is saved the instant you select it, so nothing you've done is ever lost.

If the time runs out, we score the answers you've saved. You will never receive a zero because of a technical failure.

Questions are drawn at random from a larger bank, so each attempt is different. You have up to 3 attempts with a 24-hour gap between them — the gap exists so a retry is a studied one.

Your result will break down by module, so you'll know exactly what to revisit if you don't pass.

Good luck.`,
  questions: [
    // Module 1
    { moduleNumber: 1, difficulty: 1, question: "When someone says \"AI\" in a workplace conversation in 2026, what do they most likely mean?", options: ["A humanoid robot", "A large language model such as ChatGPT or Claude", "Any computer program", "A self-aware machine"], correctIndex: 1, explanation: "In current usage, \"AI\" nearly always refers to large language models." },
    { moduleNumber: 1, difficulty: 2, question: "What is the fundamental mechanism behind a large language model's output?", options: ["Retrieving facts from a verified database", "Repeatedly predicting the next piece of text", "Executing hand-written logical rules", "Querying human experts in real time"], correctIndex: 1, explanation: "Everything else — apparent knowledge, reasoning, tone — emerges from doing next-text prediction well." },
    { moduleNumber: 1, difficulty: 2, question: "Why is a model typically weak on your organisation's internal procedures?", options: ["Internal procedures are too complex", "Such material is private and therefore thin or absent in training data", "The model refuses company topics", "Procedures change too often"], correctIndex: 1, explanation: "Models are strong where training data is thick and weak where it is thin. Internal documents are not on the public web." },
    { moduleNumber: 1, difficulty: 3, question: "A model gives a detailed answer about an event that occurred after its knowledge cutoff, with no indication it searched. What is the best interpretation?", options: ["The cutoff must be wrong", "It is likely generating a plausible reconstruction rather than reporting fact", "The answer is definitely accurate because it is detailed", "The model has been updated silently"], correctIndex: 1, explanation: "Past the cutoff and without search, detail is a product of fluency, not knowledge." },
    { moduleNumber: 1, difficulty: 2, question: "Which task best suits current AI tools?", options: ["Reporting yesterday's currency rates from memory", "Rewriting a document you paste in for a different audience", "Calculating payroll to the penny", "Making a final hiring decision"], correctIndex: 1, explanation: "Transforming supplied text is the sweet spot." },
    { moduleNumber: 1, difficulty: 3, question: "Why is \"it doesn't know what it doesn't know\" described as the most dangerous property?", options: ["It makes the model slow", "Guesses and facts are delivered in identical confident tones, so you cannot read reliability from the output", "It causes the model to refuse questions", "It limits answer length"], correctIndex: 1, explanation: "Because tone carries no signal about reliability, the check has to come from outside the model." },

    // Module 2
    { moduleNumber: 2, difficulty: 1, question: "Which four elements make a request substantially more effective?", options: ["Task, context, audience, constraints", "Who, what, when, where", "Speed, cost, tone, length", "Subject, verb, object, adjective"], correctIndex: 0, explanation: "Bland output usually traces to one of these four being missing." },
    { moduleNumber: 2, difficulty: 2, question: "Why paste an actual document rather than describing it?", options: ["It is quicker to type", "Models work far better with real material than with a lossy summary of it", "Descriptions violate the terms of service", "It uses fewer resources"], correctIndex: 1, explanation: "Your description necessarily discards detail the model could have used." },
    { moduleNumber: 2, difficulty: 2, question: "Output starts drifting off-brief in a long conversation. What is the correct interpretation?", options: ["The tool is faulty", "Earlier instructions carry less weight as the conversation grows; restate the constraint", "You have hit a usage limit", "The model has been switched"], correctIndex: 1, explanation: "This is expected behaviour, and restating the key constraint fixes it." },
    { moduleNumber: 2, difficulty: 3, question: "You challenge a correct answer with \"are you sure?\" and the model reverses itself. What should you conclude?", options: ["The original answer was wrong", "Trained agreeableness can override correctness — the reversal is not evidence about truth", "The model has learned from you", "You should always challenge answers"], correctIndex: 1, explanation: "Capitulation under pressure tests agreeableness, not accuracy. Ask for evidence instead." },
    { moduleNumber: 2, difficulty: 2, question: "Which length instruction is followed most reliably?", options: ["\"Keep it brief\"", "\"Under 150 words\"", "\"About a page\"", "\"Not too long\""], correctIndex: 1, explanation: "Concrete counts work; abstract sizes do not." },
    { moduleNumber: 2, difficulty: 2, question: "What is the most effective way to communicate a desired writing style?", options: ["List several adjectives", "Paste an example and ask it to match", "Request 'professional' tone", "Write your request in that style"], correctIndex: 1, explanation: "One concrete sample carries more information than any amount of description." },

    // Module 3
    { moduleNumber: 3, difficulty: 2, question: "Why is \"confident invention\" more accurate than \"lying\" for AI hallucination?", options: ["It sounds more professional", "Lying requires knowing the truth and choosing otherwise; the model simply produces plausible text", "Inventions are always harmless", "The model apologises afterwards"], correctIndex: 1, explanation: "There is no concealed truth — only plausible continuation." },
    { moduleNumber: 3, difficulty: 2, question: "Which request carries the highest fabrication risk?", options: ["Summarising text you pasted", "Producing academic citations to support a claim", "Rewriting your paragraph", "Explaining a widely-covered concept"], correctIndex: 1, explanation: "Citations are correctly shaped, trivially generated, and entirely fabricable." },
    { moduleNumber: 3, difficulty: 3, question: "You ask for a summary of a book that does not exist and receive a detailed one. What has happened?", options: ["The book exists somewhere", "The false premise was accepted and a plausible summary generated", "The tool malfunctioned", "It summarised a similar real book"], correctIndex: 1, explanation: "False-premise questions are a classic trigger; the model completes the pattern rather than challenging it." },
    { moduleNumber: 3, difficulty: 2, question: "Which is a genuine verification move?", options: ["Asking the same model whether it is sure", "Searching the exact claim for independent corroboration", "Checking the answer reads well", "Asking the model to rate its own confidence"], correctIndex: 1, explanation: "Only independent evidence counts; self-assessment does not." },
    { moduleNumber: 3, difficulty: 3, question: "Why does cross-checking with a different model provide real signal?", options: ["The second model is more accurate", "Independent systems rarely invent the same specific detail, so disagreement is a strong warning", "It is faster than searching", "It is free"], correctIndex: 1, explanation: "Convergence on an identical fabrication is unlikely; divergence is informative." },
    { moduleNumber: 3, difficulty: 2, question: "Where does bias in AI output originate?", options: ["Deliberate engineering choices", "Patterns in human writing absorbed during training", "Random software faults", "User prompts alone"], correctIndex: 1, explanation: "No malice is required — learning from human text means inheriting human assumptions." },
    { moduleNumber: 3, difficulty: 3, question: "In which context does AI bias matter most?", options: ["Reformatting a spreadsheet", "Screening job applicants", "Summarising a report", "Generating a poem"], correctIndex: 1, explanation: "Decisions about people turn bias into a fairness and legal problem." },
    { moduleNumber: 3, difficulty: 3, question: "What is the consequence test for deciding how much to verify?", options: ["How long the answer is", "\"If this is wrong and I don't notice, what happens?\"", "How confident the tool sounded", "How much the tool costs"], correctIndex: 1, explanation: "Consequence, not confidence, should set the level of checking." },
    { moduleNumber: 3, difficulty: 2, question: "Which task is a poor fit because the human element is the point?", options: ["Drafting a project plan", "Writing a condolence message", "Summarising meeting notes", "Reformatting a report"], correctIndex: 1, explanation: "The value of sympathy lies in you having written it." },

    // Module 4
    { moduleNumber: 4, difficulty: 2, question: "What is the strongest primary writing use of AI?", options: ["Ghostwriting finished pieces", "Editing and improving your own draft", "Replacing your voice entirely", "Writing all correspondence"], correctIndex: 1, explanation: "Editing preserves your thinking and voice while using the tool for polish." },
    { moduleNumber: 4, difficulty: 3, question: "Why ask \"what's unclear here?\" rather than \"rewrite this\"?", options: ["It is faster", "Diagnosis keeps you in control and develops your own writing", "Rewriting is unsupported", "It produces shorter output"], correctIndex: 1, explanation: "You act on the diagnosis yourself, preserving voice and building skill." },
    { moduleNumber: 4, difficulty: 2, question: "Why is summarising lower-risk than generating facts?", options: ["Summaries are shorter", "The source is supplied, which constrains invention", "The tool verifies summaries automatically", "Summaries are never important"], correctIndex: 1, explanation: "Working from material in front of it is a far better risk profile." },
    { moduleNumber: 4, difficulty: 3, question: "Which question is especially valuable when reviewing a contract?", options: ["\"Summarise this\"", "\"What's NOT addressed that should be?\"", "\"Make this shorter\"", "\"Is this a good contract?\""], correctIndex: 1, explanation: "Absence is very hard to spot by reading; a summary hides gaps rather than revealing them." },
    { moduleNumber: 4, difficulty: 2, question: "What is the highest-value learning request?", options: ["\"Explain this topic\"", "\"Test me and tell me where I'm wrong\"", "\"Summarise this\"", "\"Give me a reading list\""], correctIndex: 1, explanation: "Retrieval practice is what makes knowledge stick." },

    // Module 5
    { moduleNumber: 5, difficulty: 1, question: "What is the correct mental model for text you type into an AI tool?", options: ["It stays on your device", "It travels to the provider's servers and is usually stored", "It is deleted immediately", "It is unreadable by anyone"], correctIndex: 1, explanation: "Your input goes to someone else's computer and is typically retained." },
    { moduleNumber: 5, difficulty: 2, question: "What is the substantive difference between consumer and business AI accounts?", options: ["Response speed", "Data handling — training defaults, contractual terms and admin controls", "Answer quality", "Language support"], correctIndex: 1, explanation: "For work, account type matters more than which company's logo is on it." },
    { moduleNumber: 5, difficulty: 3, question: "Why does other people's data warrant more care than your own?", options: ["It is commercially valuable", "It is not your risk to take, and may carry legal obligations such as GDPR", "It is harder to redact", "Tools charge more for it"], correctIndex: 1, explanation: "Pasting customer data into a non-approved tool can be a reportable breach." },
    { moduleNumber: 5, difficulty: 2, question: "What does \"you own the output\" mean in practice?", options: ["You hold the copyright", "You are responsible for what you send — \"the AI said so\" is not a defence", "You must archive it", "You may sell it"], correctIndex: 1, explanation: "Responsibility never transfers to the tool." },

    // Module 6
    { moduleNumber: 6, difficulty: 2, question: "How do image generation models produce an image?", options: ["By collaging training images", "By removing noise from random static, steered by your description", "By searching a photo database", "By drawing shapes in sequence"], correctIndex: 1, explanation: "They learned to reverse a noise-adding process and run it from pure static." },
    { moduleNumber: 6, difficulty: 2, question: "Why does \"a street with no cars\" often still produce cars?", options: ["Streets always have cars", "Negation is handled poorly — naming a thing makes it more likely", "The prompt is too short", "The model prefers vehicles"], correctIndex: 1, explanation: "Describe what you want present, not what you want absent." },
    { moduleNumber: 6, difficulty: 3, question: "Why are visual tells such as extra fingers unreliable for detecting fakes?", options: ["They were never real indicators", "They reflect current-generation flaws and disappear as models improve", "Only experts can see them", "They appear only in video"], correctIndex: 1, explanation: "Detection based on today's defects expires; source reasoning does not." },
    { moduleNumber: 6, difficulty: 3, question: "What is the \"liar's dividend\"?", options: ["Profit from selling deepfakes", "People dismissing genuine evidence as \"probably AI\"", "The cost of detection tools", "A watermarking standard"], correctIndex: 1, explanation: "Reflexive disbelief of real evidence may do more damage than fakes themselves." },
    { moduleNumber: 6, difficulty: 2, question: "What is the most reliable approach to assessing suspicious media?", options: ["Zoom in on pixels", "Ask where it came from, who else reports it, and whether it exists elsewhere", "Check whether it looks professional", "Ask an AI tool whether it is fake"], correctIndex: 1, explanation: "Provenance beats pixel-inspection and stays valid as generation improves." },

    // Module 7
    { moduleNumber: 7, difficulty: 2, question: "What is the recommended approach to choosing AI tools?", options: ["Collect as many as possible", "Learn one general assistant properly plus one alternative for cross-checking", "Only use paid tools", "Switch monthly"], correctIndex: 1, explanation: "Depth beats breadth; ten half-learned tools underperform one you know well." },
    { moduleNumber: 7, difficulty: 2, question: "How should you build a sustainable AI habit?", options: ["Resolve to use AI more", "Pick three recurring weekly tasks and do them with AI for a month", "Use AI for everything at once", "Read AI news daily"], correctIndex: 1, explanation: "Specific triggers on specific recurring tasks become habits; vague intentions do not." },
    { moduleNumber: 7, difficulty: 3, question: "Why wait roughly a fortnight before judging a major new release?", options: ["Prices drop", "Initial coverage is marketing; honest assessment arrives once people use it on real work", "The tool is unstable at launch", "Reviews are embargoed"], correctIndex: 1, explanation: "Practitioner reports lag launch hype." },
    { moduleNumber: 7, difficulty: 3, question: "What is the key question to ask about an impressive AI demo?", options: ["Who produced it", "What wasn't shown, and the realistic failure rate", "How long it took", "Which model version it used"], correctIndex: 1, explanation: "Demos are curated by default; the omissions carry the information." },
    { moduleNumber: 7, difficulty: 2, question: "What should you do with a task where AI consistently didn't help?", options: ["Keep trying indefinitely", "Drop it — there is no obligation to use a tool for something it isn't good at", "Buy a better tool", "Blame your prompting"], correctIndex: 1, explanation: "Recognising a poor fit is a sign of competence." },
  ],
};
