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
              "A model cannot be held legally responsible for what it says",
              "Lying means knowing the truth and choosing otherwise",
              "The model usually corrects itself once it is challenged",
              "Hallucinations are rare enough to be treated as harmless slips",
            ],
            correctIndex: 1,
            explanation:
              "The model has no internal state of knowing the truth and saying otherwise. It produces the most plausible continuation, which, without good information, is a well-formed invention.",
          },
          {
            question: "Which request carries the HIGHEST risk of confident invention?",
            options: [
              "\"Rewrite this paragraph so it is more concise\"",
              "\"Give me three academic citations for this claim\"",
              "\"Summarise the report I just pasted in, briefly\"",
              "\"Explain photosynthesis simply, for a ten-year-old\"",
            ],
            correctIndex: 1,
            explanation:
              "Citations are the highest-risk category: correctly shaped, easy to generate and entirely fabricable. The other requests work from supplied text or very well-covered knowledge.",
          },
          {
            question: "What is the practical test for whether to verify a claim?",
            options: [
              "Whether the answer is long, detailed and specific",
              "Whether you'd be embarrassed if it proved invented",
              "Whether the tool hedged or sounded unsure of itself",
              "Whether the tool has been right on this topic before",
            ],
            correctIndex: 1,
            explanation:
              "Confidence and hedging carry little information, so they cannot be your signal. Consequence is the useful filter: if being wrong would embarrass or harm you, check.",
          },
          {
            question: "You ask about a book that does not exist and get a detailed summary. What happened?",
            options: [
              "The book probably exists but is too obscure for you to find",
              "It accepted the false premise and generated a plausible summary",
              "The tool has a fault that corrupted its search results",
              "It mixed the title up with a similar real book and summarised that",
            ],
            correctIndex: 1,
            explanation:
              "Questions carrying a false premise are a classic trigger. The model completes the pattern your question set up rather than challenging it, so the summary is invented from scratch.",
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
              "Asking the same model whether it is really sure",
              "Searching the exact claim for independent corroboration",
              "Checking the answer is clear, specific and well written",
              "Asking the model to rate its confidence out of ten",
            ],
            correctIndex: 1,
            explanation:
              "Independent corroboration is real evidence. Asking the same model tests its agreeableness, self-rated confidence is more generated text, and good writing is unrelated to accuracy.",
          },
          {
            question: "Why does asking a DIFFERENT model help?",
            options: [
              "A second model can spot the first one's mistakes and fix them",
              "Two tools rarely invent the same detail; disagreement warns you",
              "Agreement between two separate models confirms a claim is true",
              "Newer models are trained on more data, so they catch old errors",
            ],
            correctIndex: 1,
            explanation:
              "Two independent systems are unlikely to invent the identical detail. Disagreement is a strong warning sign, but agreement is only weak support, not proof.",
          },
          {
            question: "Which task has the LOWEST need for fact-checking?",
            options: [
              "A statistic about your industry for a slide deck",
              "Rewriting a paragraph you pasted in, more concisely",
              "A citation to a research paper for a client report",
              "The date a particular law came into force",
            ],
            correctIndex: 1,
            explanation:
              "Transforming supplied text carries much lower invention risk because the model works with what is in front of it. Statistics, citations and dates are generated facts that need checking.",
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
              "Deliberate choices made by the engineers who built it",
              "Patterns learned from human writing and its assumptions",
              "Random errors introduced each time the software is updated",
              "Safety rules added by providers to satisfy regulators",
            ],
            correctIndex: 1,
            explanation:
              "No malice is needed. Learning from human text means absorbing what humans assume, with no way to separate describing a view from endorsing it.",
          },
          {
            question: "You ask for advice on 'normal working hours' and get a Western answer with no caveat. What is this?",
            options: [
              "A factual error caused by out-of-date training data",
              "A cultural default presented as if it were neutral",
              "A deliberate choice by the provider to favour the West",
              "A software bug that ignored your location settings",
            ],
            correctIndex: 1,
            explanation:
              "Because Western sources dominate the training data, their conventions get treated as the unmarked default rather than one option among many. It is neither a bug nor deliberate policy.",
          },
          {
            question: "In which context does bias matter most?",
            options: [
              "Drafting a birthday message for a colleague",
              "Any decision about a person, such as hiring",
              "Summarising a long document for your manager",
              "Reformatting a table of quarterly sales figures",
            ],
            correctIndex: 1,
            explanation:
              "When output influences a decision about someone's life or livelihood, such as hiring, lending or assessment, bias stops being academic and becomes a fairness and legal problem.",
          },
          {
            question: "What is the recommended response to knowing about bias?",
            options: [
              "Avoid AI tools altogether for any task that involves people",
              "Specify what you want and watch for defaults in key decisions",
              "Tell the model to be unbiased at the start of every chat",
              "Trust output once it reads as balanced and even-handed",
            ],
            correctIndex: 1,
            explanation:
              "Awareness makes the tools more useful, not less. Name the specifics you want, notice unprompted defaults and take care in consequential contexts; an instruction to be unbiased does not remove learned patterns.",
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

Try sorting real tasks: decide below which ones to automate, which to do with AI's help and which to keep human.

\`\`\`studio
task-sorter:office
\`\`\`

## The test worth remembering

*If this output is wrong and I don't notice, what happens?*

Nothing much → use AI freely.
Something serious → use AI with verification.
Something irreversible → get a human expert.`,
        microCheck: [
          {
            question: "Why avoid AI when you cannot judge the output quality?",
            options: [
              "The tool gives weaker answers on topics you don't know",
              "You would have no way to catch a wrong answer",
              "You cannot write a clear enough prompt without expertise",
              "The tool needs your feedback to improve its answers",
            ],
            correctIndex: 1,
            explanation:
              "Your judgement is the check on the system. Without it, errors pass through unnoticed; the problem is not the prompt or the tool's quality but the missing safety net.",
          },
          {
            question: "Why is a condolence message a poor use of AI?",
            options: [
              "The tool tends to sound cold when writing about grief",
              "The value is that you wrote it; outsourcing defeats that",
              "Most tools refuse to write about death or bereavement",
              "The message could accidentally include private details",
            ],
            correctIndex: 1,
            explanation:
              "Where the human element is the point, delegating it removes the thing that gave it meaning. Clumsy sincerity beats polished outsourcing; the tool's fluency is not the issue.",
          },
          {
            question: "What is the test for how much care a task needs?",
            options: [
              "How long and detailed the answer turned out to be",
              "\"If this is wrong and I don't notice, what happens?\"",
              "\"How confident did the tool sound when it answered?\"",
              "How familiar the topic already is to you",
            ],
            correctIndex: 1,
            explanation:
              "Consequence sets the level of verification: nothing much means use freely, serious means verify, irreversible means involve a human expert. Tone and length tell you nothing.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Why is \"confident invention\" a better description than \"lying\"?",
        options: [
          "It is less alarming to people who are new to AI tools",
          "Lying needs a known truth; models just continue plausibly",
          "Invented details are usually minor, so it is less serious",
          "The model will admit its inventions if you ask it directly",
        ],
        correctIndex: 1,
        explanation: "There is no internal truth being concealed, only plausible text being generated. Models also cannot reliably tell you afterwards which parts they invented.",
      },
      {
        question: "Which carries the highest risk of fabrication?",
        options: [
          "Summarising a document you pasted in",
          "Listing academic citations on a topic",
          "Rewriting a paragraph of your own work",
          "Explaining a very widely covered concept",
        ],
        correctIndex: 1,
        explanation: "Citations are correctly shaped, easy to generate and entirely fabricable. Summaries and rewrites work from supplied text, and very common concepts are well covered in training data.",
      },
      {
        question: "What does asking \"are you sure?\" actually test?",
        options: [
          "Accuracy, because a correct answer will hold firm",
          "Agreeableness; it may flip a correct answer",
          "Consistency, because a wrong answer tends to change",
          "The model's real confidence in its answer",
        ],
        correctIndex: 1,
        explanation: "Trained agreeableness means capitulation under pressure tells you nothing about truth. A correct answer can flip and a wrong one can hold, so ask for evidence instead.",
      },
      {
        question: "Which is a genuine 90-second verification move?",
        options: [
          "Checking the answer's grammar and internal logic",
          "Searching the exact claim for independent corroboration",
          "Asking the model to rate its own confidence in the claim",
          "Rereading the answer slowly for signs of doubt",
        ],
        correctIndex: 1,
        explanation: "Independent corroboration is real evidence; self-assessment and close rereading are not. An invented claim can be grammatical, logical and free of any hedging.",
      },
      {
        question: "Why does checking with a different model help?",
        options: [
          "The other model will usually be the more accurate one",
          "Independent systems rarely invent the same specific detail",
          "Agreement between two models proves the claim is accurate",
          "It cancels out the bias that each single model carries",
        ],
        correctIndex: 1,
        explanation: "Convergence on an identical fabrication is unlikely, so disagreement is a strong warning. Agreement is only weak support, and neither model is reliably the better one.",
      },
      {
        question: "Where does bias in AI output come from?",
        options: [
          "Deliberate decisions made by engineers",
          "Patterns in human writing, absorbed in training",
          "Random faults introduced during software updates",
          "Only the wording of the user's own prompts",
        ],
        correctIndex: 1,
        explanation: "Learning from human text means inheriting human assumptions, without anyone intending it. Your prompt can surface or steer bias, but it is not the origin.",
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
          "Drafting a project plan for a new team",
          "Writing condolences to a grieving colleague",
          "Summarising notes from a difficult meeting",
          "Reformatting an annual report for the board",
        ],
        correctIndex: 1,
        explanation: "The value of sympathy is that you wrote it; outsourcing removes exactly what made it meaningful. A difficult meeting's notes are still a transformation task the tool can help with.",
      },
      {
        question: "Which task needs the LEAST verification?",
        options: [
          "A statistic you will present to your board",
          "Condensing a document you pasted in",
          "A citation for a report going to a client",
          "The date a regulation took effect",
        ],
        correctIndex: 1,
        explanation: "Transforming supplied text has much lower invention risk than generating facts. Statistics, citations and dates are exactly the details models produce confidently and sometimes invent.",
      },
      {
        question: "What is the consequence test?",
        options: [
          "How much the answer would cost to check properly",
          "\"If this is wrong and I don't notice, what happens?\"",
          "How long and detailed the answer is",
          "\"Did the tool sound confident when it answered this?\"",
        ],
        correctIndex: 1,
        explanation: "Consequence, not confidence, should set how much checking you do. A low-stakes error can pass; a serious or irreversible one needs verification or an expert.",
      },
      {
        question: "You get a URL in an answer that looks plausible. What should you do?",
        options: [
          "Cite it, since a working-looking link is hard to fake",
          "Open it yourself, because URLs get invented too",
          "Assume it is broken and search for the topic instead",
          "Ask the model to confirm the link is genuine",
        ],
        correctIndex: 1,
        explanation: "A well-formed URL is trivially generated, and the model confirming it proves nothing. Opening it takes seconds and settles the question.",
      },
      {
        question: "Why is outsourcing a skill-building task to AI a risk?",
        options: [
          "It usually breaks the tool's terms of service",
          "Doing the task is how you build judgement, so you lose it",
          "The AI output is generally weaker than a beginner's work",
          "Your employer can usually tell and may mark you down for it",
        ],
        correctIndex: 1,
        explanation:
          "If struggling with a task is how expertise forms, delegating it costs you the expertise, which is exactly what you need later to judge AI output in your field.",
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
              "Generating finished articles you can then publish",
              "Editing and improving your own draft",
              "Drafting your routine emails from start to finish",
              "Matching your voice so it can write in your place",
            ],
            correctIndex: 1,
            explanation:
              "Editing keeps your thinking and voice while using the tool for polish, a far better division of labour than ghostwriting finished pieces or emails for you.",
          },
          {
            question: "Why ask \"what's unclear here?\" rather than \"rewrite this\"?",
            options: [
              "It produces a longer and more thorough answer",
              "Diagnosis keeps you in control and teaches you",
              "It stops the tool changing any of your facts",
              "The tool gives better rewrites when asked this way",
            ],
            correctIndex: 1,
            explanation:
              "A diagnosis you act on yourself preserves your voice and builds your skill. A rewrite hands both over. Protecting facts is a side benefit, not the main reason.",
          },
          {
            question: "Which is a reliable tell of unedited AI text?",
            options: [
              "Short, simple sentences throughout the text",
              "Over-balanced structure, every point equal",
              "Frequent use of the first person, I and we",
              "Occasional spelling and typing errors",
            ],
            correctIndex: 1,
            explanation:
              "Models default to even-handed structure, giving every point equal weight, and habitually append an unnecessary summary. Readers pick up on it. Typos are more a sign of human writing.",
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
              "Summaries are short, so there is little room for error",
              "The source is in front of it, so invention is less likely",
              "The tool automatically checks summaries against the source text",
              "Summaries are rarely used for anything important",
            ],
            correctIndex: 1,
            explanation:
              "Working from supplied material constrains the output. It is still worth spot-checking fidelity, but the risk profile is far better than generating facts. No automatic check happens.",
          },
          {
            question: "Which request is especially valuable for a contract?",
            options: [
              "\"Summarise the key terms of this\"",
              "\"What's NOT addressed that should be?\"",
              "\"Rewrite this in plain English for me\"",
              "\"Is this a good, fair contract for me?\"",
            ],
            correctIndex: 1,
            explanation:
              "Absence is very hard to notice by reading. Asking what is missing surfaces gaps that a summary or plain-English version would never show, and 'is it fair' invites a vague verdict.",
          },
          {
            question: "How should you verify a summary?",
            options: [
              "Ask the model whether its summary is accurate",
              "Spot-check two or three claims against the original",
              "Compare it with a summary made by a second tool",
              "Check it reads clearly and covers every section",
            ],
            correctIndex: 1,
            explanation:
              "You are checking fidelity to the source, which only the source can settle. Anything in the summary that is not in the document discredits the whole thing; a second summary can share the gap.",
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
              "\"Make this plan sound much more convincing\"",
              "\"Argue against this as hard as you can\"",
              "\"Summarise my plan and list its strengths\"",
              "\"Is this a good idea? Be completely honest\"",
            ],
            correctIndex: 1,
            explanation:
              "Arguing against your own idea is genuinely hard. A model has no ego invested in your plan, which makes it a useful adversary; asking whether it is good mostly invites agreement.",
          },
          {
            question: "What is the trap when using AI for planning?",
            options: [
              "It tends to produce plans too cautious to be useful",
              "Being fluent and agreeable, it makes weak plans sound good",
              "It lacks the structure needed to produce a complete plan",
              "It pushes you towards overly detailed, rigid plans that break",
            ],
            correctIndex: 1,
            explanation:
              "Fluency plus agreeableness is a dangerous combination for judgement. It knows nothing of your organisation's politics, history or capacity, yet can make a mediocre plan sound excellent.",
          },
          {
            question: "What is the recommended pattern for pressure-testing a plan?",
            options: [
              "Ask the model to score the plan out of ten",
              "Ask for the three strongest objections, then answer them",
              "Ask it to rewrite the plan in much more detail",
              "Ask several different models whether they approve of it",
            ],
            correctIndex: 1,
            explanation:
              "An objection you cannot answer is your weak point, and it is far better to find it yourself than to have someone else find it. Scores and approvals invite agreeable answers.",
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
              "\"Summarise this topic in five key points\"",
              "\"Test me and tell me where I'm wrong\"",
              "\"Give me a reading list, easiest first\"",
              "\"Explain this in detail with examples\"",
            ],
            correctIndex: 1,
            explanation:
              "Retrieval is what makes knowledge stick. Passive reading and detailed explanations feel like learning while mostly not being learning.",
          },
          {
            question: "Why is \"I understood the explanation\" not the same as \"I learned it\"?",
            options: [
              "Explanations from AI are often subtly inaccurate",
              "Following it feels like knowing it, until you're tested",
              "You need to read an explanation at least three times",
              "Only notes you write out by hand count as real learning",
            ],
            correctIndex: 1,
            explanation:
              "The felt sense of comprehension is not evidence of retention. Explaining it aloud without looking is the test that exposes the gap between following and knowing.",
          },
          {
            question: "What is the \"ladder technique\"?",
            options: [
              "Reading the same explanation three times over",
              "Asking for it at three levels, child to practitioner",
              "Taking notes, then a summary, then a one-line recap",
              "Asking three different tools and comparing their answers",
            ],
            correctIndex: 1,
            explanation:
              "The ladder asks for explanations for a child, a smart outsider and a practitioner. Comparing them reveals the shape of the concept and exactly where simplifications break down.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "What is the best primary writing use of AI?",
        options: [
          "Ghostwriting finished pieces for you",
          "Editing and tightening your own draft",
          "Writing in your voice so you need not",
          "Drafting all your routine emails for you",
        ],
        correctIndex: 1,
        explanation: "Editing keeps your thinking and voice while using the tool for polish. Ghostwriting and blanket drafting hand over the thinking you are responsible for.",
      },
      {
        question: "Why ask \"what's unclear here?\" instead of \"rewrite this\"?",
        options: [
          "It is quicker than reading a full rewrite",
          "Diagnosis keeps you in control of your writing",
          "Rewrites use up more of your usage allowance",
          "It produces shorter and more focused output",
        ],
        correctIndex: 1,
        explanation: "You act on the diagnosis yourself, preserving your voice and building skill. Speed and length are not the point; control and learning are.",
      },
      {
        question: "Why is summarising lower-risk than generating facts?",
        options: [
          "Summaries are shorter, so errors are rare",
          "The supplied source constrains invention",
          "The tool verifies its summaries automatically",
          "Summaries are seldom used for decisions",
        ],
        correctIndex: 1,
        explanation: "Working from material in front of it is a far better risk profile than generating from nothing. It still needs spot-checking, as no automatic verification takes place.",
      },
      {
        question: "Which question is most valuable when reviewing a contract with AI?",
        options: [
          "\"Summarise the main terms for me\"",
          "\"What's NOT addressed that should be?\"",
          "\"Shorten this into a one-page version\"",
          "\"Is this a good deal for my business?\"",
        ],
        correctIndex: 1,
        explanation: "Absence is very hard to spot by reading. Asking about gaps surfaces what a summary or shortened version hides, and a verdict on the deal is vague.",
      },
      {
        question: "How should a summary be verified?",
        options: [
          "Ask the model if the summary is accurate",
          "Spot-check claims against the original",
          "Check it for spelling, grammar and clarity",
          "Read it twice, looking for contradictions",
        ],
        correctIndex: 1,
        explanation: "You are testing fidelity to the source, which only the source can settle. A self-check or careful reread cannot reveal a claim that was added or dropped.",
      },
      {
        question: "What is the most valuable thinking request?",
        options: [
          "\"Make this sound more convincing and professional\"",
          "\"Argue the other side as hard as you can\"",
          "\"Summarise my notes into key points\"",
          "\"Tell me honestly if this is a good idea\"",
        ],
        correctIndex: 1,
        explanation: "A model has no ego invested in your idea, which makes it a genuinely useful adversary. Asking whether it is a good idea mostly invites agreement.",
      },
      {
        question: "What is the danger of using AI for planning?",
        options: [
          "It takes too long to produce a usable plan",
          "Fluency and agreeableness make weak plans sound good",
          "It refuses to plan anything involving budgets",
          "It over-plans, producing far more detail than you can use",
        ],
        correctIndex: 1,
        explanation: "It has no stake in your outcome and no knowledge of your organisation's real constraints, yet it writes fluently and agrees readily. That combination can make a mediocre plan sound excellent.",
      },
      {
        question: "Which is the highest-value learning request?",
        options: [
          "\"Explain this clearly with examples\"",
          "\"Test me and tell me where I'm wrong\"",
          "\"Summarise this in five bullet points\"",
          "\"Give me a reading list for beginners\"",
        ],
        correctIndex: 1,
        explanation: "Retrieval practice is what makes knowledge stick; passive reading and explanations largely do not, however clear they feel at the time.",
      },
      {
        question: "Why is \"I understood it\" not the same as \"I know it\"?",
        options: [
          "AI explanations are often subtly wrong",
          "Following it feels like knowing, until tested",
          "Knowledge only counts once it is written down",
          "It takes three readings to retain anything",
        ],
        correctIndex: 1,
        explanation: "Comprehension while reading feels identical to retention, and the gap is invisible until you test yourself. Explaining it aloud without looking reveals the difference.",
      },
      {
        question: "What is a reliable tell of unedited AI writing?",
        options: [
          "Very short sentences and simple words",
          "Even-weighted points and a needless summary",
          "A chatty, informal first-person voice",
          "Typos and inconsistent British and US spelling",
        ],
        correctIndex: 1,
        explanation: "Models default to even-handedness, giving every point equal weight, and habitually append a summary nobody asked for. Typos and a chatty voice are more typical of human drafts.",
      },
      {
        question: "You need to summarise a document too long for the tool. What is the risk of summarising the summaries?",
        options: [
          "It takes far longer than summarising in one pass",
          "Nuance drops fast; use the original for important work",
          "The tool refuses to summarise its own earlier output",
          "The final version usually ends up too long to be useful",
        ],
        correctIndex: 1,
        explanation: "Each layer of compression discards detail, so nuance disappears quickly. For anything consequential, work from the original source rather than a summary of summaries.",
      },
      {
        question: "Where is the line on publishing AI-assisted writing?",
        options: [
          "Never publish anything an AI tool has touched",
          "Only what you would defend sentence by sentence",
          "Only if you disclose the exact prompts you used",
          "Only once you have rewritten every sentence",
        ],
        correctIndex: 1,
        explanation:
          "The standard is ownership: if you would not defend every sentence in a meeting, it should not go out under your name. A blanket ban or full rewrite is not required.",
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
              "It is processed on your own device and never leaves it",
              "It goes to the provider's servers and is usually stored",
              "It is used to answer you and then deleted straight away",
              "It is encrypted in a way that stops anyone at all reading it",
            ],
            correctIndex: 1,
            explanation:
              "Your input goes to someone else's computer and is typically retained, sometimes with human review. Encryption in transit does not mean the provider cannot read it.",
          },
          {
            question: "What is the main practical difference between consumer and business AI accounts?",
            options: [
              "Business accounts get faster, priority replies at busy times",
              "Consumer tiers often train on your data; business tiers rarely do",
              "Business accounts use a larger model that gives better answers",
              "Business accounts keep no record of any conversation at all",
            ],
            correctIndex: 1,
            explanation:
              "Data handling is the substantive difference: training defaults, contractual terms and admin controls. Business tiers still retain data for a period; speed and quality are not the point.",
          },
          {
            question: "What is the recommended five-minute action?",
            options: [
              "Clear your chat history and delete old conversations",
              "Find the data controls, turn off training, check retention",
              "Upgrade to a paid plan, which switches off all data collection",
              "Change your password and switch on two-factor login",
            ],
            correctIndex: 1,
            explanation:
              "A one-time check of the data controls replaces hoping with knowing: turn off training if you can and learn how long data is kept. Paying does not automatically change training settings.",
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

Test yourself: decide below whether each message is safe to paste into a chatbot, and name the risk when it is not.

\`\`\`studio
spot-the-risk:privacy
\`\`\`

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
              "Nothing longer than a couple of paragraphs of text",
              "Nothing you'd hate to see screenshotted in the news",
              "Nothing that contains names or numbers of any kind",
              "Nothing written by someone other than yourself",
            ],
            correctIndex: 1,
            explanation:
              "It is a blunt test you can apply in two seconds, and it captures most of what actually matters. Length and authorship are not the issue; sensitivity is.",
          },
          {
            question: "What is the redaction habit?",
            options: [
              "Deleting each conversation as soon as you have finished",
              "Replacing names with roles and fuzzing figures first",
              "Using a private or incognito browser window",
              "Asking the tool not to store what you paste in",
            ],
            correctIndex: 1,
            explanation:
              "You rarely need the sensitive specifics: 'the finance director' works as well as a real name for drafting. Deleting afterwards or going incognito does not stop the data being sent.",
          },
          {
            question: "Why does other people's data deserve more care than your own?",
            options: [
              "It is worth more to the provider as training data",
              "It isn't yours to risk and may fall under laws like GDPR",
              "Tools flag third-party data and may suspend your account for it",
              "It is harder to anonymise than your own information",
            ],
            correctIndex: 1,
            explanation:
              "Your own data is your risk to take. Someone else's is not, and pasting customer data into a non-approved tool can be a reportable breach under laws such as GDPR.",
          },
          {
            question: "You realise you pasted customer data into a consumer chatbot at work. What should you do?",
            options: [
              "Delete the chat and say nothing, as the risk has now gone",
              "Delete the chat, check training settings, tell data protection",
              "Close your whole account so the provider must erase everything",
              "Ask the chatbot to forget the data and carry on working",
            ],
            correctIndex: 1,
            explanation:
              "Early and awkward beats late and serious. Deleting the chat or the account alone does not discharge a potential reporting obligation, and a chatbot cannot promise to forget.",
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
              "Whether chat history is shown in the sidebar",
              "Whether your chats train future models",
              "Whether the tool can access your location",
              "Whether replies are read aloud to you",
            ],
            correctIndex: 1,
            explanation:
              "Training on your data is the setting with the most lasting consequences, and it is frequently on by default in consumer tiers. Display and accessibility options have no such effect.",
          },
          {
            question: "What is the quick way to read a privacy policy?",
            options: [
              "Read it in full, as the key clauses are spread throughout",
              "Search it for train, retain, third part, delete, human review",
              "Read the summary box at the top, which covers the key points",
              "Ask the AI tool itself to summarise its own policy for you",
            ],
            correctIndex: 1,
            explanation:
              "Five targeted searches surface most of what matters in about three minutes, which is far more likely to happen than a full read. The tool's own summary of itself is not independent.",
          },
          {
            question: "Why should connected tools and memory features be enabled deliberately?",
            options: [
              "They slow the tool down and make answers less focused",
              "Useful, but they widen what is exposed, so choose knowingly",
              "They are unsafe and should stay switched off at work",
              "They are part of paid plans and can add unexpected costs to bills",
            ],
            correctIndex: 1,
            explanation:
              "Connecting email, files or calendar is a real capability gain and a real increase in exposure. Both are fine as a deliberate choice; drifting into it unaware is not.",
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
              "Start with low-risk tasks and see how it goes",
              "Find out if there's a policy and an approved tool",
              "Avoid it until your manager raises the subject",
              "Ask colleagues which tools they use and follow them",
            ],
            correctIndex: 1,
            explanation:
              "Two minutes of asking beats a difficult conversation later. Many organisations have a policy most staff have never read, and colleagues may be using unapproved tools.",
          },
          {
            question: "Why is concealing AI use a bad idea?",
            options: [
              "Using AI without permission is illegal in most places",
              "Hiding it implies you thought it was wrong to use",
              "Most tools report heavy use to your employer anyway",
              "Colleagues will assume all of your work is AI-written",
            ],
            correctIndex: 1,
            explanation:
              "Using AI is generally fine; hiding it signals otherwise and turns a non-issue into a credibility problem. It is not generally illegal, and tools do not report you.",
          },
          {
            question: "What does \"you own the output\" mean?",
            options: [
              "You hold the copyright in what the tool produces",
              "If you send it, you are responsible for what it says",
              "You must keep a copy of both the prompt and the output",
              "You are free to reuse or sell whatever it produces",
            ],
            correctIndex: 1,
            explanation:
              "Responsibility does not transfer to the tool; 'the AI said so' is never an explanation. Read what you send, check what matters, and put your name to it deliberately. Copyright is a separate question.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "What happens to text you type into a typical AI tool?",
        options: [
          "It is processed on your device and stays there",
          "It goes to the provider and is usually stored",
          "It is deleted as soon as you close the tab",
          "Only machines see it; people never review it",
        ],
        correctIndex: 1,
        explanation: "It leaves your device and is typically retained for a period, sometimes with human review for safety. Closing the tab does not delete it from the provider's side.",
      },
      {
        question: "What is the key difference between consumer and business AI accounts?",
        options: [
          "Response speed at busy times",
          "How your data is handled and protected",
          "The quality and accuracy of the answers",
          "How many languages the tool supports",
        ],
        correctIndex: 1,
        explanation: "Data handling is the real difference: training defaults, contractual terms and admin controls. For work use, account type matters more than which company's logo is on it.",
      },
      {
        question: "Which is the simplest test for what not to paste?",
        options: [
          "Anything more than about 500 words long",
          "Anything you'd hate to see screenshotted in the news",
          "Anything that includes financial figures or dates",
          "Anything a colleague wrote rather than you yourself",
        ],
        correctIndex: 1,
        explanation: "Blunt, fast, and it captures most of what genuinely matters. Length, figures and authorship are poor proxies for how sensitive something actually is.",
      },
      {
        question: "Which should NEVER go into a consumer AI tool?",
        options: [
          "A draft blog post you plan to publish",
          "A customer's name, address and account details",
          "A press release that is already public",
          "Your own personal to-do list for the coming week",
        ],
        correctIndex: 1,
        explanation: "Customer personal data in a non-approved tool can be a reportable breach under GDPR. Public material or your own low-sensitivity notes carry no comparable risk.",
      },
      {
        question: "What is the redaction habit?",
        options: [
          "Deleting your conversations every week",
          "Swapping names for roles and fuzzing figures",
          "Using incognito mode whenever you paste data",
          "Writing sensitive details in shorthand",
        ],
        correctIndex: 1,
        explanation: "The model rarely needs the real specifics to help, so remove them before pasting. Incognito mode and deleting later still send the original data to the provider.",
      },
      {
        question: "Why does other people's data deserve extra care?",
        options: [
          "It is harder to redact properly",
          "It isn't yours to risk; laws may apply",
          "It is usually longer and more detailed",
          "Providers charge more to process it",
        ],
        correctIndex: 1,
        explanation: "Your own data is your call. Someone else's is not, and it may carry legal obligations such as GDPR that make careless pasting a reportable breach.",
      },
      {
        question: "Which privacy setting has the most lasting consequences?",
        options: [
          "Notification and email preferences",
          "Whether your chats train future models",
          "Whether chat history is saved in the sidebar",
          "Default language for replies",
        ],
        correctIndex: 1,
        explanation: "Training is often on by default in consumer tiers and affects future models, so it is the highest-value toggle to find. Sidebar history is a display choice, not the same thing.",
      },
      {
        question: "What is the fast way to assess a privacy policy?",
        options: [
          "Read it end to end, noting anything that sounds unusual",
          "Ctrl-F for train, retain, third part, delete, human review",
          "Skip it, since the key terms are the same for every tool",
          "Ask the same AI tool to tell you whether its policy is safe",
        ],
        correctIndex: 1,
        explanation: "Five targeted searches cover most of what matters in a few minutes. Policies differ between tools, and the tool describing its own policy is not an independent check.",
      },
      {
        question: "You discover you pasted confidential client data into a consumer chatbot. What is the right response?",
        options: [
          "Say nothing, since the provider deletes chats in time anyway",
          "Delete it, check training settings, inform data protection",
          "Delete your account, which forces the provider to erase it",
          "Ask the tool to forget it, then carry on with the task",
        ],
        correctIndex: 1,
        explanation: "Deletion alone may not discharge a reporting obligation, and the tool cannot promise to forget. Early disclosure to whoever handles data protection is the safer path.",
      },
      {
        question: "Why is hiding your AI use at work risky?",
        options: [
          "Using AI at work is against the law",
          "Concealment signals you thought it was wrong",
          "Most AI tools notify your employer of heavy use",
          "It makes your work noticeably slower",
        ],
        correctIndex: 1,
        explanation: "Using AI is usually fine; hiding it is what turns it into an issue, because concealment suggests you believed it was wrong and damages trust.",
      },
      {
        question: "What does ownership of AI-assisted output mean in practice?",
        options: [
          "You hold the copyright in the output",
          "You're responsible for what you send",
          "You must credit the tool on anything you send",
          "You should archive every conversation",
        ],
        correctIndex: 1,
        explanation: "Responsibility never transfers to the tool: 'the AI said so' is not a defence. Crediting or archiving may be good practice, but they do not shift accountability.",
      },
      {
        question: "There is no AI policy at your workplace. What is a sensible default?",
        options: [
          "Assume anything not explicitly banned is permitted for now",
          "Redact by default and keep personal data out of consumer tools",
          "Avoid AI entirely at work until a formal policy is written",
          "Use your personal account so work data rules do not apply",
        ],
        correctIndex: 1,
        explanation:
          "Absent a policy you are making the judgement, so make it conservatively: redact by default, keep personal data out of consumer tools and assume anything typed could be read.",
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
              "By stitching together parts of real training images",
              "By removing noise from random static, steered by text",
              "By drawing outlines first, then colouring them in",
              "By finding the closest match in a large image database",
            ],
            correctIndex: 1,
            explanation:
              "They learned to reverse a noise-adding process. Generation runs that reversal from pure static, guided by your text; nothing is collaged or retrieved from a database.",
          },
          {
            question: "Why is text inside generated images often mangled?",
            options: [
              "Text is blurred on purpose to prevent forgery",
              "Letters are treated as shapes, not as language",
              "The image resolution is too low for small type",
              "Fonts are copyrighted, so models avoid copying them",
            ],
            correctIndex: 1,
            explanation:
              "The model reproduces letter-shaped patterns without a linguistic representation of spelling. It is improving but remains a weak spot, and it is not about resolution or fonts.",
          },
          {
            question: "What is the honest position on commercial use of AI images?",
            options: [
              "Safe, because the images are newly generated",
              "Unsettled: check provider terms and your organisation",
              "Illegal unless every training image was licensed",
              "Only safe if you paid for the tool that generated it",
            ],
            correctIndex: 1,
            explanation:
              "The legal position is still being decided in several jurisdictions and provider indemnities differ. Anyone claiming it is simply safe or simply illegal is overselling.",
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
              "As a short, direct command naming the main subject",
              "As a description of subject, setting, style, light and mood",
              "As a question asking what the image could look like",
              "As a list of single keywords separated by commas, most important first",
            ],
            correctIndex: 1,
            explanation:
              "Image models respond to description rather than instruction. The more of subject, setting, style, lighting, composition and mood you specify, the closer the result.",
          },
          {
            question: "Why does \"a street with no cars\" often still produce cars?",
            options: [
              "Models always add typical objects to fill empty space",
              "Naming cars makes them likelier; describe what you want",
              "The prompt needs a style keyword before it is followed",
              "The prompt is too short for the model to follow it",
            ],
            correctIndex: 1,
            explanation:
              "Negation is handled poorly: naming a thing makes it more likely to appear. 'A quiet pedestrianised street, deserted' works far better than listing what to exclude.",
          },
          {
            question: "What is the best way to learn what affects your results?",
            options: [
              "Change several things at once to save time",
              "Change one variable at a time and compare",
              "Keep adding detail until the prompt is long",
              "Rerun the same prompt until one looks right",
            ],
            correctIndex: 1,
            explanation:
              "Isolating one variable tells you what actually did the work. Changing everything at once, or rerolling the same prompt, teaches you nothing you can transfer.",
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
            options: [
              "Music generation in a famous artist's style",
              "Voice cloning from a short audio sample",
              "Upscaling old photos to a higher resolution",
              "Automatic subtitles for recorded video",
            ],
            correctIndex: 1,
            explanation:
              "Cloning a voice needs very little audio and enables convincing impersonation, which is why consent is a legal matter, not a courtesy. Style imitation raises issues, but not the same direct fraud risk.",
          },
          {
            question: "What is the main current limitation of text-to-video?",
            options: [
              "It cannot yet produce realistic colour, light or texture",
              "Short clips, limited control, poor consistency across shots",
              "It needs real camera footage as a starting point",
              "It cannot generate realistic human faces or figures",
            ],
            correctIndex: 1,
            explanation:
              "Length, control and continuity are the real constraints. It is useful for b-roll and concepts, not for precisely directed sequences; realism of individual frames is already high.",
          },
          {
            question: "What is the most durable thing to know about generated video capability?",
            options: [
              "It has plateaued, so today's limits will hold for years",
              "It moves fastest, so specific capability claims date quickly",
              "It works the same way as image generation in all respects",
              "It is heavily restricted, so few people will ever get to use it",
            ],
            correctIndex: 1,
            explanation:
              "Specifics go stale fast in generated video. Knowing that the ground shifts is more useful than memorising today's limits, which may be gone within months.",
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

Practise on examples: call each message or video below Safe or Risky, then read why.

\`\`\`studio
spot-the-risk:scams
\`\`\`

## What to actually do

Slow down before sharing. Check the source, not the pixels. Accept that you can't always tell, and that "I don't know" is a legitimate position.

Being unsure and saying so is more honest than confident wrongness in either direction.`,
        microCheck: [
          {
            question: "Why are visual tells like extra fingers unreliable for spotting fakes?",
            options: [
              "They were never a meaningful sign of a fake",
              "They are current flaws that fade as models improve",
              "They can only be seen with specialist software",
              "They show up in video but rarely in still images",
            ],
            correctIndex: 1,
            explanation:
              "Anything based on today's specific defects has a short shelf life. They did work for a time, but source reasoning is what does not expire.",
          },
          {
            question: "What is the most reliable approach to assessing suspicious media?",
            options: [
              "Zoom in on the pixels for blurring or warping",
              "Ask where it came from and who else reports it",
              "Run it through an AI tool that detects fakes",
              "Check the lighting and shadows are consistent throughout",
            ],
            correctIndex: 1,
            explanation:
              "Provenance beats pixel inspection almost every time, and it stays valid as generation quality improves. Detection tools and visual checks are unreliable and date quickly.",
          },
          {
            question: "What is the \"liar's dividend\"?",
            options: [
              "The profit made from selling fakes",
              "Dismissing genuine evidence as \"probably AI\"",
              "The advantage fakers get before detection catches up",
              "A deepfake that gains trust by admitting a small lie",
            ],
            correctIndex: 1,
            explanation:
              "The ability to dismiss real evidence as fabricated may be more damaging than fakes themselves. Reflexive scepticism is its own failure mode.",
          },
          {
            question: "What is a legitimate conclusion when you cannot determine authenticity?",
            options: [
              "Assume it is fake, as that is the safer default",
              "Assume it is real unless there is clear evidence",
              "Say \"I don't know\", and don't share it",
              "Share it, with a note that it may be fake",
            ],
            correctIndex: 2,
            explanation:
              "Honest uncertainty beats confident wrongness in either direction, and not amplifying unverified media is the responsible default. A warning label still spreads it.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "How do image generation models create images?",
        options: [
          "By collaging pieces of training images",
          "By de-noising static, guided by your text",
          "By searching a library for close matches",
          "By drawing shapes one layer at a time",
        ],
        correctIndex: 1,
        explanation: "They learned to reverse a noise-adding process, then run it from pure static, steered by your description. No training images are cut and pasted.",
      },
      {
        question: "Why is text in generated images often wrong?",
        options: [
          "Fonts are copyrighted and so avoided",
          "Letters are shapes to it, not language",
          "Text is deliberately blurred for safety",
          "The resolution is too low for lettering",
        ],
        correctIndex: 1,
        explanation: "There is no linguistic representation of spelling behind the letter shapes, so the model draws letter-like forms. Higher resolution does not fix it.",
      },
      {
        question: "Which produces a better image result?",
        options: [
          "\"A really nice, beautiful, high-quality coffee shop picture, please make it look amazing and professional\"",
          "\"A small independent coffee shop, early morning light through a big window, wooden tables, 35mm film, calm mood\"",
          "\"Coffee shop. Do not include people, cars, clutter or signs. No dark colours. Not too busy. Nothing unrealistic.\"",
          "\"Create an image of a coffee shop that would be suitable for use on our company website's homepage\"",
        ],
        correctIndex: 1,
        explanation: "Subject, setting, style, lighting and mood all give the model something to work with. Superlatives add nothing, and a list of negatives tends to bring those things in.",
      },
      {
        question: "Why does \"a room with no clutter\" often produce clutter?",
        options: [
          "The model fills empty space by default",
          "Naming a thing makes it more likely",
          "The prompt is too short to be followed",
          "Rooms without clutter look unrealistic to it",
        ],
        correctIndex: 1,
        explanation: "Negation is handled poorly, so naming clutter makes clutter more likely. Describe what you want present, such as a minimal, tidy room, rather than what you want absent.",
      },
      {
        question: "Which capability is most immediately open to misuse?",
        options: [
          "Upscaling low-resolution images",
          "Voice cloning from a short sample",
          "Generating music in a given style",
          "Auto-captioning recorded speech",
        ],
        correctIndex: 1,
        explanation: "Very little audio is needed to produce convincing impersonation of a real person, which enables fraud directly. The other capabilities carry far less immediate misuse risk.",
      },
      {
        question: "What limits text-to-video today?",
        options: [
          "It still cannot render realistic colour",
          "Short clips, limited control, poor continuity",
          "It needs a film studio's camera equipment",
          "It only works for cartoon-style animation",
        ],
        correctIndex: 1,
        explanation: "Useful for b-roll and concepts; not for precisely directed, continuous sequences. Realistic colour and live-action styles are already possible.",
      },
      {
        question: "Why should you not rely on spotting extra fingers to detect fakes?",
        options: [
          "It never reliably identified fakes",
          "Those flaws fade as the models improve",
          "Only video fakes show these flaws",
          "It needs specialist detection software",
        ],
        correctIndex: 1,
        explanation: "Detection based on today's defects expires as models improve; source reasoning does not. Checking hands did help for a while, which is why it is tempting.",
      },
      {
        question: "What is the strongest signal that a dramatic clip may be fabricated?",
        options: [
          "It is in unusually high resolution for a phone",
          "It exists on one account with no other coverage",
          "The audio is slightly out of sync with the lips",
          "It has dramatic background music added to it",
        ],
        correctIndex: 1,
        explanation: "Genuinely significant events attract independent reporting. A clip that exists only on one account is a provenance red flag; quality, sync and music are unreliable signals.",
      },
      {
        question: "What is the liar's dividend?",
        options: [
          "Profit made from selling deepfakes",
          "Dismissing real evidence as \"probably AI\"",
          "The cost of verifying media properly",
          "Trust gained by admitting to a small fake",
        ],
        correctIndex: 1,
        explanation: "Reflexive disbelief of real evidence may do more damage than fakes themselves. It is the benefit a wrongdoer gets when genuine evidence can be waved away.",
      },
      {
        question: "What is the honest legal position on commercial use of AI-generated images?",
        options: [
          "Settled: generated images are free to use",
          "Unsettled: check provider terms and your organisation",
          "Illegal unless every source image was licensed",
          "Only a real concern for video, not for still images",
        ],
        correctIndex: 1,
        explanation: "Litigation is ongoing in multiple jurisdictions and indemnities differ by provider. Neither 'free to use' nor 'illegal' reflects the current position.",
      },
      {
        question: "What is a legitimate response when you cannot verify a video?",
        options: [
          "Share it, labelled as unverified",
          "Say you don't know, and don't amplify it",
          "Treat it as fake until proven otherwise",
          "Ask an AI tool whether it is a fake",
        ],
        correctIndex: 1,
        explanation: "Honest uncertainty plus not amplifying is the responsible default. A label still spreads it, assuming fake feeds the liar's dividend, and AI detectors are unreliable.",
      },
      {
        question: "Which use case suits AI image generation well?",
        options: [
          "A precise technical diagram with labels",
          "A mood board to explore a new concept",
          "An exact copy of your brand logo",
          "An accurate medical illustration",
        ],
        correctIndex: 1,
        explanation: "Mood, concept and style are strengths; precision, accurate text and exact reproduction are not. Labels and logos expose the weakness with lettering and exactness.",
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
              "Try many tools, keeping whichever is newest",
              "Learn one assistant well, plus one for cross-checks",
              "Use a specialist tool for each separate task you have",
              "Pick the tool that tops the latest benchmark",
            ],
            correctIndex: 1,
            explanation:
              "Depth beats breadth. Ten half-learned tools are worth less than one you know well, and a second tool gives you a way to cross-check important answers.",
          },
          {
            question: "Why does a tool built into software you already use have an advantage?",
            options: [
              "It is always the more capable model",
              "No friction: you don't have to remember to open it",
              "It is always cheaper than a separate subscription",
              "It is private because the data stays inside the software",
            ],
            correctIndex: 1,
            explanation:
              "Friction determines whether you actually use something. A slightly weaker tool you use beats a better one you forget; built-in tools are not automatically cheaper or more private.",
          },
          {
            question: "When is it worth switching tools?",
            options: [
              "Whenever a major new version is announced",
              "When something is clearly better for how you work",
              "Every six months, to avoid falling behind the field",
              "When a rival scores higher on a benchmark",
            ],
            correctIndex: 1,
            explanation:
              "Switching resets weeks of learned quirks. Marginal benchmark gains and routine announcements rarely justify that cost; a clear gain for your actual work does.",
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
              "It is too ambitious to keep up for long",
              "Habits need a set trigger and task, not a vague aim",
              "It spreads your effort across too many different tools",
              "It needs a paid plan to be practical",
            ],
            correctIndex: 1,
            explanation:
              "Vague intentions do not become behaviour. A specific trigger tied to a specific recurring task, such as three named weekly tasks, does.",
          },
          {
            question: "What is a small prompt library?",
            options: [
              "A paid service that sells expert-written prompts",
              "A note of five or six prompts proven on your tasks",
              "A shared online database of the most popular prompts",
              "A browser extension that suggests prompts as you type",
            ],
            correctIndex: 1,
            explanation:
              "A handful of prompts proven on your own recurring work is worth more than any generic collection, however large or well-rated.",
          },
          {
            question: "What is the honest monthly question to ask?",
            options: [
              "Which new tools launched that I should try?",
              "Has this saved me time, or does it just feel modern?",
              "How many tasks did I use AI for this month?",
              "Am I using the most advanced model that is available?",
            ],
            correctIndex: 1,
            explanation:
              "Concluding that a task was faster by hand is a sign of competence, not failure. Counting uses or chasing new models measures activity, not value.",
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
              "Most AI news turns out to be exaggerated or false",
              "It breeds anxiety, not skill, and basics change slowly",
              "Most useful coverage sits behind paid subscriptions",
              "The news is too technical for anyone but specialists to follow",
            ],
            correctIndex: 1,
            explanation:
              "Fundamentals are stable; what churns is which tool is briefly best, which rarely changes everyday practice. Following everything is a full-time job that produces anxiety rather than competence.",
          },
          {
            question: "Why wait a fortnight after a major release before judging it?",
            options: [
              "Early versions are unstable until the first patch",
              "Launch coverage is marketing; real-world verdicts take time",
              "Prices usually drop a couple of weeks after launch",
              "Independent reviews are embargoed for two weeks",
            ],
            correctIndex: 1,
            explanation:
              "Launch coverage is promotional by nature. Practitioners reporting results on real work take a little time to appear, and those are the assessments worth waiting for.",
          },
          {
            question: "What should you ask about an impressive AI demo?",
            options: [
              "How long the demo took to prepare and film",
              "What wasn't shown, and the real failure rate",
              "Which company or research lab produced it",
              "How many people have watched, liked or shared it",
            ],
            correctIndex: 1,
            explanation:
              "Cherry-picked demos are standard. The interesting information is in what was left out and how often it fails on realistic tasks, not who made it or how popular it is.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "What is the recommended starting toolkit?",
        options: [
          "Ten specialised tools, one for each task",
          "One assistant learned well, plus one to cross-check",
          "Only paid enterprise tools, for the extra quality they bring",
          "Whichever tool has launched most recently",
        ],
        correctIndex: 1,
        explanation: "Depth beats breadth; one well-known tool outperforms ten half-learned ones, and a second gives you a cross-check. Price and novelty are poor guides.",
      },
      {
        question: "Why does a tool built into your existing software have an edge?",
        options: [
          "It is always the most capable option",
          "Zero friction: no need to remember to open it",
          "It is always free with the software you already own",
          "It has stronger privacy by default",
        ],
        correctIndex: 1,
        explanation: "Friction determines actual use more than raw capability does. Built-in tools are not automatically more capable, free or private.",
      },
      {
        question: "When is switching tools justified?",
        options: [
          "On every major new release from a provider",
          "When it is clearly better for your work",
          "Every quarter, to keep your skills current",
          "When its benchmark score beats your tool's",
        ],
        correctIndex: 1,
        explanation: "Switching resets weeks of learned quirks, so the gain must be real and relevant to your work. Release cycles and benchmark scores are not reasons in themselves.",
      },
      {
        question: "How should you build an AI habit?",
        options: [
          "Resolve to use AI more each day",
          "Use it for three recurring tasks for a month",
          "Use AI for everything straight away",
          "Read about new AI tools and releases every single day",
        ],
        correctIndex: 1,
        explanation: "Specific triggers on specific recurring tasks are what turn into habits. Good intentions, doing everything at once or reading about it do not build practice.",
      },
      {
        question: "What should you do with tasks where AI didn't help?",
        options: [
          "Keep trying until you find a prompt that works",
          "Drop them; you needn't use AI where it doesn't help",
          "Switch to a paid tool, which will handle them better",
          "Assume the prompt was at fault and rewrite it",
        ],
        correctIndex: 1,
        explanation: "Recognising a poor fit is competence, not failure. There is no obligation to use a tool for something it is not good at, and endless prompt-tweaking wastes the time AI was meant to save.",
      },
      {
        question: "What is the value of a small prompt library?",
        options: [
          "It shows colleagues you use AI effectively",
          "Prompts proven on your work beat generic lists",
          "It is needed to unlock most tools' features",
          "It lowers what you pay for your subscription",
        ],
        correctIndex: 1,
        explanation: "Prompts validated against your actual recurring tasks are the ones that keep paying off. A generic collection has not been tested on your work.",
      },
      {
        question: "How often is it sufficient to check AI news?",
        options: [
          "Every hour or so",
          "Once a day",
          "About once a month",
          "Once or twice a year",
        ],
        correctIndex: 2,
        explanation: "Fundamentals move slowly; a monthly check-in misses nothing that changes your practice. Daily checking breeds anxiety, while yearly risks missing a genuinely useful shift.",
      },
      {
        question: "Why wait before judging a major new release?",
        options: [
          "Prices usually fall soon after launch",
          "Launch coverage is hype; real-use verdicts take weeks",
          "Tools are often broken at launch",
          "Honest reviews are embargoed at first for weeks",
        ],
        correctIndex: 1,
        explanation: "Practitioner reports on real work lag launch hype by a couple of weeks. That wait, not price or stability, is why early judgements are unreliable.",
      },
      {
        question: "What is the key question about an impressive demo?",
        options: [
          "Who filmed it, and on what equipment",
          "What wasn't shown, and the real failure rate",
          "How long the demo runs from start to end",
          "Which model version and settings were used to make it",
        ],
        correctIndex: 1,
        explanation: "Demos are curated by default, so the omissions carry the information. How often it fails on realistic tasks matters far more than who made it or which version ran.",
      },
      {
        question: "Why do benchmark announcements rarely matter for everyday work?",
        options: [
          "Benchmark results are usually faked",
          "A few points rarely change what you do",
          "Benchmarks are kept secret by the labs",
          "They only measure coding ability",
        ],
        correctIndex: 1,
        explanation: "Benchmark deltas seldom translate into a different practical decision. A few percent on a test almost never changes what you should do on Monday.",
      },
      {
        question: "What is the most durable thing you take from this course?",
        options: [
          "Knowing which tool is currently the strongest overall",
          "Understanding the systems, using them well, checking them",
          "A tested set of prompts covering all of your common tasks",
          "Familiarity with today's leading model names",
        ],
        correctIndex: 1,
        explanation: "Tool names, rankings and prompt lists expire; the conceptual foundation of what these systems are, how to get good results and how to check them does not.",
      },
      {
        question: "Which best describes a sustainable relationship with AI news?",
        options: [
          "Follow twenty sources daily to stay ahead",
          "Two or three explainers, monthly, no benchmark noise",
          "Ignore all AI news permanently to avoid the hype",
          "Read only the official product announcements from vendors",
        ],
        correctIndex: 1,
        explanation: "A small number of explanatory sources checked periodically keeps you current without the anxiety. Ignoring everything risks missing real shifts; vendor posts are marketing.",
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
    { moduleNumber: 1, difficulty: 1, question: "When someone says \"AI\" in a workplace conversation in 2026, what do they most likely mean?", options: [
      "A humanoid robot for physical tasks",
      "A large language model like ChatGPT",
      "Any software that automates a task",
      "A machine that has become self-aware",
    ], correctIndex: 1, explanation: "In current usage, 'AI' nearly always refers to large language models such as ChatGPT or Claude. Robots and general automation are not what people usually mean." },
    { moduleNumber: 1, difficulty: 2, question: "What is the fundamental mechanism behind a large language model's output?", options: [
      "Retrieving facts from a verified database",
      "Repeatedly predicting the next piece of text",
      "Executing logical rules written by engineers",
      "Querying human experts behind the scenes",
    ], correctIndex: 1, explanation: "Everything else, including apparent knowledge, reasoning and tone, emerges from doing next-text prediction well. There is no fact database or rulebook being consulted." },
    { moduleNumber: 1, difficulty: 2, question: "Why is a model typically weak on your organisation's internal procedures?", options: [
      "Internal procedures are too complex to learn",
      "Private material is thin or absent in its training",
      "Models are designed to avoid company topics",
      "Procedures change too often for it to keep up with",
    ], correctIndex: 1, explanation: "Models are strong where training data is thick and weak where it is thin. Internal documents are not on the public web, so you need to supply them yourself." },
    { moduleNumber: 1, difficulty: 3, question: "A model gives a detailed answer about an event that occurred after its knowledge cutoff, with no indication it searched. What is the best interpretation?", options: [
      "The published cutoff date must be wrong",
      "It is likely a plausible reconstruction, not fact",
      "The level of detail suggests it is probably accurate",
      "The model has been quietly updated since",
    ], correctIndex: 1, explanation: "Past the cutoff and without search, detail is a product of fluency, not knowledge. A silent update is possible, but you should not assume it; check instead." },
    { moduleNumber: 1, difficulty: 2, question: "Which task best suits current AI tools?", options: [
      "Reporting yesterday's exchange rates from memory",
      "Rewriting a pasted document for a new audience",
      "Calculating this month's payroll to the penny",
      "Making the final decision on a job applicant",
    ], correctIndex: 1, explanation: "Transforming supplied text is the sweet spot. Recent data, exact arithmetic and accountable decisions about people are all poor fits." },
    { moduleNumber: 1, difficulty: 3, question: "Why is \"it doesn't know what it doesn't know\" described as the most dangerous property?", options: [
      "It makes the model slow on unfamiliar topics",
      "Guesses and facts sound equally confident",
      "It causes the model to refuse hard questions",
      "It hedges every answer, making it vague",
    ], correctIndex: 1, explanation: "Because tone carries no signal about reliability, you cannot read accuracy from the output, and the check has to come from outside the model." },

    // Module 2
    { moduleNumber: 2, difficulty: 1, question: "Which four elements make a request substantially more effective?", options: [
      "Task, context, audience, constraints",
      "Who, what, when, where and why",
      "Role, tone, keywords and length",
      "Question, examples, sources, deadline",
    ], correctIndex: 0, explanation: "Bland output usually traces to one of task, context, audience or constraints being missing. Tone and length are constraints; keywords alone do not tell the model who reads it." },
    { moduleNumber: 2, difficulty: 2, question: "Why paste an actual document rather than describing it?", options: [
      "It is quicker than typing a description",
      "Real material beats a lossy summary of it",
      "Describing documents breaks the terms",
      "It uses less of your usage allowance",
    ], correctIndex: 1, explanation: "Your description necessarily discards detail the model could have used. Speed may be a bonus, but the real gain is in the quality of the answer." },
    { moduleNumber: 2, difficulty: 2, question: "Output starts drifting off-brief in a long conversation. What is the correct interpretation?", options: [
      "The tool is faulty and should be restarted",
      "Early instructions fade; restate the constraint",
      "You have hit a usage limit for the session",
      "The provider has switched you to a cheaper model",
    ], correctIndex: 1, explanation: "This is expected behaviour: earlier instructions carry less weight as a conversation grows, and restating the key constraint fixes it." },
    { moduleNumber: 2, difficulty: 3, question: "You challenge a correct answer with \"are you sure?\" and the model reverses itself. What should you conclude?", options: [
      "The original answer was most likely wrong",
      "Agreeableness overrode correctness; it proves nothing",
      "The model has learned the truth from you",
      "Challenging answers is a reliable test of accuracy",
    ], correctIndex: 1, explanation: "Capitulation under pressure tests agreeableness, not accuracy. Ask what the evidence is instead of pushing for a different answer." },
    { moduleNumber: 2, difficulty: 2, question: "Which length instruction is followed most reliably?", options: [
      "\"Keep it nice and brief\"",
      "\"Under 150 words\"",
      "\"About half a page\"",
      "\"Not too long, please\"",
    ], correctIndex: 1, explanation: "Concrete counts work because the model can act on them; abstract sizes like brief or half a page leave it guessing." },
    { moduleNumber: 2, difficulty: 2, question: "What is the most effective way to communicate a desired writing style?", options: [
      "List several adjectives for the style",
      "Paste an example and ask it to match",
      "Ask for a polished, professional tone",
      "Write your own request in that style",
    ], correctIndex: 1, explanation: "One concrete sample carries more information than any amount of description. 'Professional' means different things to different readers." },

    // Module 3
    { moduleNumber: 3, difficulty: 2, question: "Why is \"confident invention\" more accurate than \"lying\" for AI hallucination?", options: [
      "It sounds calmer and more professional to users",
      "It produces plausible text; it doesn't know the truth",
      "Its inventions are usually minor and mostly harmless",
      "The model will admit its inventions if you ask it",
    ], correctIndex: 1, explanation: "There is no concealed truth, only plausible continuation. Lying requires knowing the truth and choosing otherwise, which a model does not do." },
    { moduleNumber: 3, difficulty: 2, question: "Which request carries the highest fabrication risk?", options: [
      "Summarising text you pasted in",
      "Producing academic citations for a claim",
      "Rewriting a paragraph of your own",
      "Explaining a widely covered concept",
    ], correctIndex: 1, explanation: "Citations are correctly shaped, trivially generated and entirely fabricable. The other tasks work from supplied text or very well-covered knowledge." },
    { moduleNumber: 3, difficulty: 3, question: "You ask for a summary of a book that does not exist and receive a detailed one. What has happened?", options: [
      "The book exists but is hard to find",
      "It accepted the false premise and invented one",
      "The tool malfunctioned during the search",
      "It summarised a similar real book instead of it",
    ], correctIndex: 1, explanation: "False-premise questions are a classic trigger; the model completes the pattern your question sets up rather than challenging it." },
    { moduleNumber: 3, difficulty: 2, question: "Which is a genuine verification move?", options: [
      "Asking the same model whether it is sure",
      "Searching the claim for independent sources",
      "Checking that the answer reads well",
      "Asking the model to rate its own confidence",
    ], correctIndex: 1, explanation: "Only independent evidence counts. Self-assessment and agreeableness tests are more generated text, and reading well says nothing about accuracy." },
    { moduleNumber: 3, difficulty: 3, question: "Why does cross-checking with a different model provide real signal?", options: [
      "The second model is usually more accurate",
      "Two models rarely invent the same detail",
      "Agreement between them proves it is true",
      "It is faster than searching for the claim",
    ], correctIndex: 1, explanation: "Convergence on an identical fabrication is unlikely, so divergence is a strong warning. Agreement is weaker support and never proof." },
    { moduleNumber: 3, difficulty: 2, question: "Where does bias in AI output originate?", options: [
      "Deliberate choices by the engineers",
      "Patterns in human writing it learned",
      "Random faults introduced during updates",
      "Only the user's own prompts",
    ], correctIndex: 1, explanation: "No malice is required: learning from human text means inheriting human assumptions. Prompts can steer output but are not where bias originates." },
    { moduleNumber: 3, difficulty: 3, question: "In which context does AI bias matter most?", options: ["Reformatting a spreadsheet", "Screening job applicants", "Summarising a report", "Generating a poem"], correctIndex: 1, explanation: "Decisions about people turn bias into a fairness and legal problem." },
    { moduleNumber: 3, difficulty: 3, question: "What is the consequence test for deciding how much to verify?", options: [
      "How long and detailed the answer is",
      "\"If this is wrong and I don't notice, what happens?\"",
      "\"How confident did the tool sound when it said this?\"",
      "How much it would cost to check the claim with an expert",
    ], correctIndex: 1, explanation: "Consequence, not confidence, should set the level of checking. If an unnoticed error would be serious, verify; if it would be trivial, use the answer freely." },
    { moduleNumber: 3, difficulty: 2, question: "Which task is a poor fit because the human element is the point?", options: [
      "Drafting a project plan for a team",
      "Writing a condolence message",
      "Summarising meeting notes",
      "Reformatting a report",
    ], correctIndex: 1, explanation: "The value of sympathy lies in you having written it. Planning, summarising and reformatting are tasks where the output, not the authorship, is what matters." },

    // Module 4
    { moduleNumber: 4, difficulty: 2, question: "What is the strongest primary writing use of AI?", options: [
      "Ghostwriting finished pieces",
      "Editing your own draft",
      "Replacing your voice entirely",
      "Writing all correspondence",
    ], correctIndex: 1, explanation: "Editing preserves your thinking and voice while using the tool for polish. Ghostwriting hands over the thinking you are responsible for." },
    { moduleNumber: 4, difficulty: 3, question: "Why ask \"what's unclear here?\" rather than \"rewrite this\"?", options: [
      "It is faster than a rewrite",
      "Diagnosis keeps you in control",
      "Rewriting is not supported well",
      "It produces shorter output",
    ], correctIndex: 1, explanation: "You act on the diagnosis yourself, preserving your voice and building skill. A rewrite replaces your judgement with the model's." },
    { moduleNumber: 4, difficulty: 2, question: "Why is summarising lower-risk than generating facts?", options: [
      "Summaries are shorter, so safer",
      "The source constrains invention",
      "The tool verifies summaries",
      "Summaries are never important",
    ], correctIndex: 1, explanation: "Working from material in front of it is a far better risk profile than generating facts. Summaries still need spot-checking, as nothing verifies them automatically." },
    { moduleNumber: 4, difficulty: 3, question: "Which question is especially valuable when reviewing a contract?", options: [
      "\"Summarise the key terms and risks\"",
      "\"What's NOT addressed that should be?\"",
      "\"Rewrite this so it is shorter and clearer\"",
      "\"Is this a good contract for me?\"",
    ], correctIndex: 1, explanation: "Absence is very hard to spot by reading; a summary hides gaps rather than revealing them. Asking what is missing surfaces them directly." },
    { moduleNumber: 4, difficulty: 2, question: "What is the highest-value learning request?", options: [
      "\"Explain this topic clearly, with examples\"",
      "\"Test me and tell me where I'm wrong\"",
      "\"Summarise this in five key points\"",
      "\"Give me a reading list on it\"",
    ], correctIndex: 1, explanation: "Retrieval practice is what makes knowledge stick. Clear explanations and summaries feel like learning but are mostly passive." },

    // Module 5
    { moduleNumber: 5, difficulty: 1, question: "What is the correct mental model for text you type into an AI tool?", options: [
      "It is processed locally and stays on your device",
      "It goes to the provider and is usually stored",
      "It is deleted as soon as the reply is sent",
      "It is encrypted so nobody can read it",
    ], correctIndex: 1, explanation: "Your input goes to someone else's computer and is typically retained, sometimes with human review. It is neither local, instantly deleted nor unreadable to the provider." },
    { moduleNumber: 5, difficulty: 2, question: "What is the substantive difference between consumer and business AI accounts?", options: [
      "How quickly responses arrive",
      "How your data is handled and used",
      "The quality of the answers given",
      "The number of languages supported",
    ], correctIndex: 1, explanation: "Data handling is the substantive difference: training defaults, contractual terms and admin controls. For work, account type matters more than which company's logo is on it." },
    { moduleNumber: 5, difficulty: 3, question: "Why does other people's data warrant more care than your own?", options: [
      "It is worth more to providers as training data",
      "It isn't your risk, and laws like GDPR may apply",
      "It is harder to redact than your own details",
      "Tools are more likely to leak third-party data",
    ], correctIndex: 1, explanation: "Your own data is your risk to take; someone else's is not. Pasting customer data into a non-approved tool can be a reportable breach under GDPR." },
    { moduleNumber: 5, difficulty: 2, question: "What does \"you own the output\" mean in practice?", options: [
      "You hold the copyright in anything it produced",
      "You are responsible for whatever you send",
      "You must archive the output and your prompts",
      "You are free to sell or reuse it as you wish",
    ], correctIndex: 1, explanation: "Responsibility never transfers to the tool: 'the AI said so' is not a defence. Copyright and archiving are separate questions." },

    // Module 6
    { moduleNumber: 6, difficulty: 2, question: "How do image generation models produce an image?", options: [
      "By collaging parts of training images",
      "By de-noising static, steered by your text",
      "By retrieving the closest photo in a database",
      "By drawing outlines, then filling in colour",
    ], correctIndex: 1, explanation: "They learned to reverse a noise-adding process and run it from pure static, guided by your description. Nothing is collaged or retrieved." },
    { moduleNumber: 6, difficulty: 2, question: "Why does \"a street with no cars\" often still produce cars?", options: [
      "Negative prompts only work in paid tools",
      "Naming a thing makes it more likely to appear",
      "The prompt is too short to be followed",
      "The model adds cars to make streets realistic",
    ], correctIndex: 1, explanation: "Negation is handled poorly, so mentioning cars pulls them in. Describe what you want present, such as a deserted pedestrianised street, not what you want absent." },
    { moduleNumber: 6, difficulty: 3, question: "Why are visual tells such as extra fingers unreliable for detecting fakes?", options: [
      "They were never real indicators of fakes",
      "They are current flaws that fade as models improve",
      "Only trained experts can reliably spot them",
      "They appear in video fakes but not in still images",
    ], correctIndex: 1, explanation: "Detection based on today's defects expires as models improve; source reasoning does not. The tells were real for a while, which is why they are tempting." },
    { moduleNumber: 6, difficulty: 3, question: "What is the \"liar's dividend\"?", options: [
      "Profit from selling convincing deepfakes",
      "Dismissing genuine evidence as \"probably AI\"",
      "The cost of paying for detection tools",
      "A standard for watermarking AI-generated images",
    ], correctIndex: 1, explanation: "Reflexive disbelief of real evidence may do more damage than fakes themselves, because it lets people wave away anything inconvenient." },
    { moduleNumber: 6, difficulty: 2, question: "What is the most reliable approach to assessing suspicious media?", options: [
      "Zoom in on the pixels for artefacts",
      "Check its source and who else reports it",
      "Judge whether it looks professionally made",
      "Ask an AI tool whether it is a fake",
    ], correctIndex: 1, explanation: "Provenance beats pixel inspection and stays valid as generation improves. Visual artefacts fade, and AI detectors are unreliable." },

    // Module 7
    { moduleNumber: 7, difficulty: 2, question: "What is the recommended approach to choosing AI tools?", options: [
      "Collect as many tools as you can and compare them",
      "Learn one well, plus one alternative to cross-check",
      "Use only paid enterprise tools for the quality",
      "Switch tools monthly to stay current with releases",
    ], correctIndex: 1, explanation: "Depth beats breadth; ten half-learned tools underperform one you know well. The alternative is there for cross-checking important answers." },
    { moduleNumber: 7, difficulty: 2, question: "How should you build a sustainable AI habit?", options: [
      "Resolve firmly to use AI more often",
      "Do three recurring weekly tasks with AI for a month",
      "Use AI for everything, starting at once",
      "Read AI news every day to stay motivated and informed",
    ], correctIndex: 1, explanation: "Specific triggers on specific recurring tasks become habits; vague intentions and reading about AI do not change what you actually do." },
    { moduleNumber: 7, difficulty: 3, question: "Why wait roughly a fortnight before judging a major new release?", options: [
      "Prices usually drop after the launch",
      "Launch coverage is marketing; real-use reports come later",
      "The tool is unstable in its first weeks",
      "Independent reviews are embargoed at first for a fortnight",
    ], correctIndex: 1, explanation: "Practitioner reports on real work lag launch hype by a couple of weeks, and they are the honest assessment worth waiting for." },
    { moduleNumber: 7, difficulty: 3, question: "What is the key question to ask about an impressive AI demo?", options: [
      "Who produced it, and for what audience",
      "What wasn't shown, and the failure rate",
      "How long the demo took to prepare",
      "Which model version was used to make it",
    ], correctIndex: 1, explanation: "Demos are curated by default, so the omissions carry the information. A realistic failure rate matters more than who made it or which version ran." },
    { moduleNumber: 7, difficulty: 2, question: "What should you do with a task where AI consistently didn't help?", options: [
      "Keep trying until a prompt finally works",
      "Drop it; you needn't use AI where it doesn't help",
      "Buy a more advanced tool that can do it properly",
      "Assume the problem is your prompting",
    ], correctIndex: 1, explanation: "Recognising a poor fit is a sign of competence. There is no obligation to use a tool for something it is not good at." },
  ],
};
