# Learning Box authoring guide

Every lesson, question, lab and exam in the Learning Box follows this. Run the
validator before anything is seeded:

```
node --experimental-strip-types scripts/validate-learn-content.mts <your-file.ts>
```

It must report **0 errors**. Read every warning and either fix it or be able to
say why it is fine.

## Who the learner is

Someone who wants to be **genuinely proficient at using AI**, not someone
learning to build models. The certificate should mean they can do the work.
Three levels:

| Level | Track | The learner at the end |
|---|---|---|
| 1 · Basic | AI Foundations for Everyone | Uses AI tools safely and well for everyday tasks, and knows when not to. |
| 2 · Intermediate | AI Practitioner | Uses AI reliably for real work: repeatable prompts, their own documents and data, checking quality, automating a workflow with a human in the loop. |
| 3 · Expert | AI Systems Expert | Designs and leads AI use in an organisation: agents, evaluation, security, governance, cost, adoption. |

## Systems thinking is the thread, not a module

The founder is a systems thinker, and this is what makes these tracks different.
Every level teaches the learner to see the **whole system around the AI**, not
just the tool:

- **Basic** introduces it: parts, connections, purpose; feedback loops and
  knock-on effects; "before you automate, look around".
- **Intermediate** opens with it: map your own workflow as a system (inputs,
  steps, hand-offs, bottlenecks, feedback) *before* deciding where AI goes.
  Later modules refer back to that map.
- **Expert** opens with it at organisational scale: stocks and flows, delays,
  reinforcing and balancing loops, incentives and Goodhart's law, leverage
  points (Donella Meadows). Every later module applies it (e.g. an agent is a
  loop; evaluation is a feedback loop; adoption is a system with incentives).

Use real, well-established ideas and name them correctly: feedback loops
(reinforcing / balancing), stocks and flows, delays, bottlenecks (theory of
constraints), second-order effects, Goodhart's law, leverage points (Meadows),
the iceberg model (events, patterns, structures, mental models). Do not invent
frameworks and attribute them to real people.

## Facts: the rule that overrides everything else

This site has already had to retract articles that invented studies, companies
and results. Do not repeat that here.

- **No invented statistics, studies, surveys, quotes, companies or case
  studies.** No "a 2024 study found 47%". No "a mid-sized logistics firm cut
  costs by 30%".
- **Examples must be plainly illustrative**: "imagine a clinic that...", "a
  typical support inbox might...". Illustrative examples carry no invented
  figures presented as real.
- **Time-sensitive facts** (model names, prices, product features, regulation
  dates) go stale. Prefer the stable concept ("output tokens usually cost
  several times more than input tokens") over the specific. Where a specific
  helps, say "at the time of writing (September 2026)" and tell the learner to
  check the current figure.
- **Regulation**: describe the stable structure (e.g. the EU AI Act's
  risk-based tiers) and say the obligations apply in phases whose dates should
  be checked against the official timetable. Do not state application dates as
  settled.
- **Real incidents** may be used only as documented in
  `lib/blog/content/curated.ts`, which was checked against multiple outlets.
  Describe them no more strongly than that file does.

## Voice

- Plain, direct, practical. Short paragraphs. Second person.
- UK spelling, to match the existing course ("organisation", "summarise").
- **Avoid em dashes (—).** Use a full stop, comma, colon or brackets. The
  validator warns on more than three in a lesson.
- No hype, no filler, no sentence that restates the previous one.
- Explain jargon the first time it appears.

## Lessons

- 3–5 lessons per module; 15–35 minutes each (`durationMinutes`).
- `bodyMd` of **500–1,100 words**, Markdown, at least three `## ` sections.
- An `objective` that starts with a verb: "Map...", "Write...", "Decide...".
- **End with `## Try it now`**: a concrete task the learner does with a real
  AI tool or their own work, in minutes, with a clear "done" state.
- Show, don't just tell: before/after prompts, worked examples, small
  templates the learner can reuse.
- `resources` are optional; only link to real, stable pages you are confident
  exist (official docs, well-known tools). When unsure, omit.

## Questions (micro-checks, quizzes, exams)

Options are **shuffled per learner** when served, so position does not matter.
Length does, and so does wording.

- **Exactly 4 options.** One clearly correct; three plausible to someone who
  skimmed. Distractors are real misconceptions, not jokes.
- **The correct answer must not stand out by length.** Keep all four options
  similar in length and structure. The validator fails a bank where the right
  answer is the uniquely longest in more than 40% of questions, or averages
  outside 80–125% of the distractors' length. The easy way to comply: write
  the correct answer tight, then write distractors of the same shape and
  length.
- Do not make the correct answer the only one with a qualifier ("usually",
  "in most cases") or the only nuanced one. Give distractors nuance too.
- **Never** "all of the above", "none of the above", "both A and B"; they
  break when options are shuffled.
- `explanation`: 1–3 sentences (60+ characters) that teach: why the answer
  is right, and ideally why the tempting wrong answer is wrong.
- Test **understanding and judgement**, not recall of a phrase from the
  lesson. Prefer short scenarios: "A colleague does X. What is the risk?"
- Micro-check: **4–5** questions per lesson (3 are served).
- Module quiz: **10–12** questions per module (8 are served, 80% to pass).
- Final exam: see the exam section.

## Labs (done inside the platform)

Four lab types. Pick the one that best proves the skill.

- **workbench**: the learner does the work in structured fields on the page;
  it is graded against the objectives. Best for systems mapping, planning,
  designs, evaluations. 3–6 fields. Every objective needs `guidance` (40+
  characters) telling the grader exactly what earns credit.
- **prompt**: the learner writes a prompt, runs it against a real model in a
  sandbox (`sandboxSystem`, optional `contextMd`, `starterPrompt`, `maxRuns`),
  and is coached on the prompt.
- **critique**: an AI answer with problems planted in it. At least 4 flaws,
  each with a candidate; at least 3 clean candidates so flagging everything
  loses marks. Every flaw `quote` must appear verbatim in `answerMd`.
- **build**: self-attested work done in another tool. Use sparingly.

## Final exam

- Bank of **45** questions, `questionsServed: 35`, `passScore: 75`,
  `distinctionScore: 90`.
- Every question has `moduleNumber` (1-based) and `difficulty`
  (1 recall, 2 application, 3 analysis). At least 6 per module; roughly 20%
  difficulty 1, 50% difficulty 2, 30% difficulty 3.
- Same question rules as above. Scenario questions preferred.

## Capstone

- A real piece of work on the learner's own situation, reviewed by a person.
- `briefMd` 300+ words: what to produce, in what form, what "good" looks like.
- Rubric of 4–6 criteria, weights summing to exactly 100. One criterion must
  assess the systems view at that level.

## Interactive blocks inside lessons

Every lesson page has a built-in **AI practice pad** under the lesson, so the
learner can do the `## Try it now` task without leaving the platform. Make
lessons hands-on with two special fenced blocks (inside a TypeScript template
literal, write the fence as \`\`\`):

- ` ```try ` : a prompt the learner can run. It renders with a **Try it**
  button that loads it into the practice pad, where they can edit it and run
  it against a real model. Use `[BRACKETS]` for the parts they should change.
  Use it for every worked prompt example you want them to feel, not just read.
  Plain ` ```text ` blocks also get a "Try it" button.
- ` ```playground ` : a complete single-file HTML page (inline CSS and JS)
  shown in an editable code box with a live preview. For coding lessons: let
  the learner change a line and watch what happens. Keep it under about 60
  lines and self-contained (no external scripts or network calls).

## Code Studio labs (`labType: "code"`)

Built in the browser: an editor, a live preview, an AI pair programmer and
automated checks (see `CodeLabConfig` in lib/learn/labs/types.ts).

- `starterCode`: the file they start from. A skeleton to build on, or
  working-but-buggy code to fix.
- `checks`: 3-8 automated checks. Each `code` is the body of an async
  function `(doc, win)` run against the live preview; return `true` to pass,
  or a short string saying what is wrong. Select elements by id, and state the
  ids the learner must use in the brief. Simulate input with `el.value = ...`
  plus `el.dispatchEvent(new win.Event("input", { bubbles: true }))` or
  `el.click()`, then `await new Promise(r => setTimeout(r, 50))`.
- `fields`: 0-3 written parts (a spec, a test plan, a review of what the AI
  changed). Same shape as workbench fields.
- Objectives need `guidance` (40+ characters). One objective should be about
  **how** they worked with the AI (small steps, reviewing changes), not only
  the result.
- Provide a reference solution in the track's `solutions.ts` so the checks can
  be verified to pass on a correct build and fail on the starter code.
