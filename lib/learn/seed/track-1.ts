import type { SeedTrack } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// TRACK 1 — AI Foundations for Everyone (Starter)
// 7 modules · 27 lessons · 12 hours
// Written for someone who has never used an AI tool and is slightly
// suspicious of the whole thing. No jargon without a plain-English gloss.
// ═══════════════════════════════════════════════════════════════════════════

export const TRACK_1: SeedTrack = {
  slug: "ai-foundations",
  title: "AI Foundations for Everyone",
  tagline:
    "Understand what AI actually is, use it well, and know when not to trust it — starting from zero.",
  description: `Most AI courses assume you already know what a "model" is. This one doesn't.

We start with what the word "AI" actually means, why these tools behave the way they do, and what they genuinely can and cannot do. Then you'll use them — properly, with real tasks — and learn to judge what comes back rather than accepting it.

By the end you'll be able to hold your own in any conversation about AI at work, use these tools daily without embarrassing yourself, and spot the difference between something genuinely useful and something confidently wrong.

No coding. No maths. No prior experience of any kind.`,
  level: "starter",
  status: "live",
  sortOrder: 1,
  accentColor: "#22A387",
  certificateName: "TIBLOGICS Certified — AI Foundations",
  audience:
    "Anyone who uses a phone and email but has never seriously used an AI tool. Especially useful if you've been told you 'should be using AI' and don't know where to begin.",
  outcomes: [
    "Explain in plain language what AI is and how it produces answers",
    "Get genuinely useful results from AI tools instead of vague ones",
    "Spot a confident wrong answer and check it in under two minutes",
    "Know what is unsafe to paste into a chatbot, and why",
    "Recognise AI-generated images, audio and video",
    "Build a weekly routine that keeps your skills current without drowning in news",
  ],
  estimatedHours: 12,
  estimatedWeeksAt3Hrs: 4,

  modules: [
    // ═════════════════════════════════════════════════════════════════════
    {
      title: "What AI Actually Is",
      summary:
        "Strip away the marketing and the science fiction. What these systems are, how they came to be, and what they are genuinely doing when they answer you.",
      lessons: [
        {
          title: "The word \"AI\" and what it hides",
          objective: "Explain what people actually mean when they say \"AI\" in 2026.",
          durationMinutes: 25,
          isPreview: true,
          bodyMd: `## "AI" is a marketing word

"Artificial intelligence" covers everything from the spam filter in your inbox to a system that writes essays. Using one term for all of it is like calling both a bicycle and a cargo ship "transport" — technically true, useless in practice.

When someone says "AI" today, they almost always mean one specific thing: **a large language model**. ChatGPT, Claude, Gemini, Copilot — these are all large language models with different names on the box.

## What a large language model is

A large language model is a system that has read an enormous amount of text and learned the patterns in it. When you type something, it predicts what text should come next, one piece at a time.

That's it. That's genuinely the whole mechanism.

The surprising part is that predicting text well turns out to require something that looks a lot like understanding. To finish the sentence "The capital of France is..." you need to know a fact. To finish "The main flaw in this argument is..." you need to have followed the argument.

## Why this matters to you

Everything else in this course follows from this one idea. These systems are **pattern completion engines**, not fact databases. They don't look anything up unless specifically built to. They produce what *sounds* right based on everything they've read.

Most of the time, what sounds right *is* right. Sometimes it isn't. Module 3 is entirely about telling the difference.`,
          resources: [
            {
              title: "ChatGPT",
              url: "https://chat.openai.com",
              resourceType: "account_signup",
              isFree: true,
              isRequired: true,
              notes: "Free tier is fine for this whole course. You'll need an account from Module 2 onwards.",
            },
            {
              title: "Claude",
              url: "https://claude.ai",
              resourceType: "account_signup",
              isFree: true,
              isRequired: false,
              notes: "An alternative to ChatGPT. Worth having both so you can compare answers.",
            },
          ],
          microCheck: [
            {
              question: "When someone says \"AI\" in a work conversation today, what do they most likely mean?",
              options: [
                "A robot with physical arms and legs",
                "A large language model like ChatGPT or Claude",
                "Any computer program at all",
                "A system that has become self-aware",
              ],
              correctIndex: 1,
              explanation:
                "In everyday 2026 usage, \"AI\" almost always means a large language model — the technology behind ChatGPT, Claude, Gemini and Copilot. The other meanings exist but are not what people are talking about at work.",
            },
            {
              question: "What is a large language model fundamentally doing when it answers you?",
              options: [
                "Searching a database of verified facts",
                "Predicting what text should come next, based on patterns it learned",
                "Asking a human expert behind the scenes",
                "Running a logical proof to reach a conclusion",
              ],
              correctIndex: 1,
              explanation:
                "It predicts the next piece of text, repeatedly. This is why it can be fluent and confident while still being wrong — fluency and accuracy are different things.",
            },
            {
              question: "Why does the \"pattern completion\" idea matter for how you use these tools?",
              options: [
                "It means the tools are useless for real work",
                "It means answers that sound right may still be wrong, so they need checking",
                "It means the tools can only answer questions about language",
                "It means you should never use them for anything important",
              ],
              correctIndex: 1,
              explanation:
                "Because the system optimises for what sounds right, plausibility and accuracy can come apart. That is exactly why verification is a skill worth learning — not a reason to avoid the tools.",
            },
            {
              question: "Which statement about large language models is accurate?",
              options: [
                "They look up every fact in a database before answering",
                "They are conscious and understand you the way a person does",
                "Predicting text well happens to require something resembling understanding",
                "They can only repeat sentences they have seen word-for-word",
              ],
              correctIndex: 2,
              explanation:
                "The mechanism is next-text prediction, but doing that well requires representing facts and following arguments. They are not conscious, and they do not simply parrot memorised sentences.",
            },
          ],
        },
        {
          title: "How a model learns from examples",
          objective: "Describe training in plain language, without maths.",
          durationMinutes: 30,
          bodyMd: `## Learning by being wrong, repeatedly

Imagine teaching someone a language by showing them millions of sentences with the last word removed, and asking them to guess it. Every time they guess wrong, you nudge them slightly. Do this billions of times and they get very good at it.

That is training, in one paragraph.

The "nudging" is the only technical part. The system has billions of internal settings — think of them as dials. Each wrong guess adjusts some dials slightly in the direction that would have produced a better answer. Nobody sets these dials by hand. Nobody could; there are too many.

## Why "it learned from the internet" is roughly true

Training data is mostly text scraped from the public web, books, code repositories and reference works. This has three consequences you'll feel constantly:

**It knows a lot about common things.** Anything discussed extensively online, it handles well.

**It's weaker on rare things.** Your company's internal process, a niche local regulation, last week's news — thin or absent.

**It absorbed the internet's biases.** Not deliberately. It learned patterns from human writing, and human writing carries human assumptions. Module 3 covers this properly.

## The knowledge cutoff

Training stops at a fixed date. After that, the model knows nothing new unless it's given a search tool or you paste the information in yourself.

If you ask about something recent and get a confident answer, be suspicious. Check whether the tool actually searched, or just predicted what recent news probably looks like.`,
          microCheck: [
            {
              question: "In plain terms, how does a model learn during training?",
              options: [
                "Engineers write rules for every possible question",
                "It guesses the next piece of text, is corrected, and its internal settings are nudged — billions of times",
                "It memorises every document word-for-word",
                "It asks humans for the answer whenever it is unsure",
              ],
              correctIndex: 1,
              explanation:
                "Training is repeated guess-and-correct at enormous scale. Nobody hand-writes the rules, and nothing is memorised verbatim.",
            },
            {
              question: "Why is a model typically weaker on your company's internal process than on general topics?",
              options: [
                "Internal processes are too complicated for AI",
                "The model deliberately avoids company information",
                "Its training data is mostly public text, which rarely includes your internal documents",
                "It can only handle topics from before the year 2000",
              ],
              correctIndex: 2,
              explanation:
                "Models learn from broadly available text. Anything rare, private, or internal is thin or entirely absent from that data — which is why you often need to paste the context in yourself.",
            },
            {
              question: "What is a \"knowledge cutoff\"?",
              options: [
                "A limit on how many questions you can ask per day",
                "The date after which the model learned nothing new during training",
                "The maximum length of an answer",
                "A setting you can turn off in the preferences",
              ],
              correctIndex: 1,
              explanation:
                "Training ends on a fixed date. Beyond it, the model has no new knowledge unless it can search the web or you supply the information directly.",
            },
            {
              question: "You ask an AI tool about an event from last week and get a confident, detailed answer. What is the sensible reaction?",
              options: [
                "Trust it — the detail proves it is accurate",
                "Check whether the tool actually searched, since it may be predicting what such news would plausibly look like",
                "Assume all recent information is always wrong",
                "Ask the same question again to confirm",
              ],
              correctIndex: 1,
              explanation:
                "Confidence and detail are not evidence of accuracy. If the event postdates the cutoff and no search happened, the answer may be plausible invention. Asking again usually just produces another confident guess.",
            },
          ],
        },
        {
          title: "What today's AI can and can't do",
          objective: "Sort tasks into 'good fit' and 'bad fit' for current AI tools.",
          durationMinutes: 25,
          bodyMd: `## Genuinely good at

**Transforming text.** Summarising, rewriting, changing tone, translating, reformatting. This is the sweet spot — the information is already in front of it.

**Drafting from a blank page.** Not final work, but getting past the terror of an empty document.

**Explaining things at your level.** "Explain this like I've never heard of it" is one of the highest-value things you can ask.

**Structured thinking.** Listing considerations, pros and cons, questions you haven't thought of.

**Pattern work in language.** Extracting all the dates from a document, categorising feedback, spotting inconsistencies.

## Genuinely bad at

**Reliable facts about rare or recent things.** The less something appears in training data, the more likely the answer is confident invention.

**Arithmetic and precise counting.** They predict text, not calculate. Many now use a calculator tool behind the scenes — but verify anything that matters.

**Knowing what it doesn't know.** A model rarely says "I have no idea." It produces its best guess in the same confident tone as a certain fact. This is the single most dangerous property.

**Anything requiring genuine accountability.** Medical, legal and financial decisions need someone who can be held responsible. A model cannot be.

## The honest summary

Current AI is a very capable assistant with no judgement about its own limits. Treat it as a fast, well-read colleague who has never once said "I'm not sure."`,
          microCheck: [
            {
              question: "Which task best fits what current AI tools are genuinely good at?",
              options: [
                "Telling you last night's football score",
                "Summarising a long document you paste in",
                "Calculating your exact tax liability",
                "Deciding whether to fire an employee",
              ],
              correctIndex: 1,
              explanation:
                "Transforming text you supply is the sweet spot — the information is right there. Recent facts, precise arithmetic and accountable decisions are all poor fits.",
            },
            {
              question: "What is described as the most dangerous property of these systems?",
              options: [
                "They are slow to respond",
                "They rarely signal uncertainty — a guess sounds exactly like a fact",
                "They refuse to answer most questions",
                "They can only work in English",
              ],
              correctIndex: 1,
              explanation:
                "A model's tone is equally confident whether it knows or is guessing. Because you cannot read uncertainty from the writing, you have to check independently.",
            },
            {
              question: "Why are medical, legal and financial decisions a poor fit for AI tools?",
              options: [
                "The tools are legally banned from these topics",
                "They require someone who can be held accountable, and a model cannot be",
                "The vocabulary is too advanced",
                "These fields do not appear in training data",
              ],
              correctIndex: 1,
              explanation:
                "The issue is accountability, not capability. These decisions need a responsible human — using AI to help you prepare for a conversation with a professional is fine.",
            },
            {
              question: "Why should you verify arithmetic from an AI tool even when it looks right?",
              options: [
                "Arithmetic is not in the training data",
                "The underlying mechanism predicts text rather than calculating, so plausible-but-wrong numbers happen",
                "The tools round every number automatically",
                "Numbers are always displayed incorrectly",
              ],
              correctIndex: 1,
              explanation:
                "Text prediction can produce a number that looks right without being right. Many tools now call a real calculator, but you should confirm rather than assume.",
            },
          ],
        },
        {
          title: "Where AI already touches your day",
          objective: "Identify AI you already use without thinking about it.",
          durationMinutes: 20,
          bodyMd: `## You've been using AI for years

Before you ever opened a chatbot:

- **Spam filtering** — learned from billions of labelled emails
- **Predictive text** — a small language model on your phone
- **Maps routing** — traffic prediction from historical patterns
- **Photo search** — type "beach" and your phone finds beach photos
- **Recommendations** — Netflix, Spotify, YouTube, your shopping app
- **Fraud alerts** — pattern detection on your card transactions
- **Voice assistants** — speech recognition plus language understanding

None of this felt like "using AI" because it was invisible and it worked.

## Why chatbots feel different

Two reasons.

**It's a conversation.** You type in plain language and get plain language back. There's no interface to learn, which makes it feel like talking to something rather than using something.

**It's general.** Your spam filter does one job. A language model will attempt anything you ask — draft an email, explain a contract, plan a trip, write a poem. That breadth is genuinely new.

## The useful reframe

If AI has quietly improved your life for a decade, the question isn't "should I use AI?" You already do. The question is "how do I use this *new, general* kind well, and where should I be careful?"

That's the rest of this course.`,
          microCheck: [
            {
              question: "Which of these is an everyday example of AI you likely already use?",
              options: [
                "A pocket calculator",
                "Your email spam filter",
                "A paper map",
                "A word processor's page count",
              ],
              correctIndex: 1,
              explanation:
                "Spam filtering learns patterns from vast numbers of labelled emails. Calculators, paper maps and page counts follow fixed rules — no learning involved.",
            },
            {
              question: "What makes chatbots feel different from earlier everyday AI?",
              options: [
                "They are much faster",
                "They are conversational and general-purpose rather than invisible and single-purpose",
                "They are the first to use electricity",
                "They never make mistakes",
              ],
              correctIndex: 1,
              explanation:
                "Older AI did one narrow job invisibly. A chatbot talks back in plain language and will attempt almost anything — that combination is what feels new.",
            },
            {
              question: "What is the more useful question to ask, given you already use AI daily?",
              options: [
                "Should I use AI at all?",
                "How do I use this new general kind well, and where should I be careful?",
                "How do I remove all AI from my life?",
                "Which company invented AI first?",
              ],
              correctIndex: 1,
              explanation:
                "\"Should I use AI\" is already settled — you do. The practical question is how to use the new general-purpose kind skilfully and where caution is warranted.",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "A colleague says \"we should use AI for this.\" What are they most likely referring to?",
          options: [
            "A physical robot",
            "A large language model such as ChatGPT or Claude",
            "A self-aware computer",
            "A spreadsheet formula",
          ],
          correctIndex: 1,
          explanation: "In current workplace usage, \"AI\" nearly always means a large language model.",
        },
        {
          question: "What is the core mechanism behind a large language model's answers?",
          options: [
            "Looking up verified facts in a database",
            "Repeatedly predicting the next piece of text",
            "Consulting human experts in real time",
            "Applying hand-written logical rules",
          ],
          correctIndex: 1,
          explanation:
            "It predicts text one piece at a time. Everything else — apparent knowledge, reasoning, tone — emerges from doing that well.",
        },
        {
          question: "Which task is the strongest fit for a current AI tool?",
          options: [
            "Rewriting a document you paste in, in a warmer tone",
            "Reporting yesterday's share price",
            "Calculating payroll to the penny",
            "Deciding a medical diagnosis",
          ],
          correctIndex: 0,
          explanation:
            "Transforming text you provide is exactly what these tools do best — the information is already in front of them.",
        },
        {
          question: "Why is a model unreliable on very recent events?",
          options: [
            "Recent events are too complex",
            "Training stopped at a fixed date, so anything after it is unknown unless the tool searches",
            "It deliberately withholds recent information",
            "Recent events are never written about online",
          ],
          correctIndex: 1,
          explanation:
            "The knowledge cutoff is a hard boundary. Past it, the model either searches or guesses — and a guess still sounds confident.",
        },
        {
          question: "What does it mean that a model \"doesn't know what it doesn't know\"?",
          options: [
            "It refuses to answer unfamiliar questions",
            "It presents guesses in the same confident tone as established facts",
            "It always warns you before answering",
            "It can only answer questions it has seen before",
          ],
          correctIndex: 1,
          explanation:
            "There is no reliable tonal difference between a certain answer and an invented one. That is why external verification matters.",
        },
        {
          question: "Why does training data explain a model's blind spots?",
          options: [
            "Because training data is entirely fictional",
            "Because rare, private or very recent topics appear thinly or not at all in it",
            "Because the data is deleted after training",
            "Because only one book was used",
          ],
          correctIndex: 1,
          explanation:
            "The model is strong where the data is thick and weak where it is thin. Your internal processes are not on the public web.",
        },
        {
          question: "Which is NOT a good reason to avoid AI for a task?",
          options: [
            "The task requires legal accountability",
            "The task needs precise, verified figures",
            "The task involves rewriting an email more politely",
            "The task depends on this week's news with no search available",
          ],
          correctIndex: 2,
          explanation:
            "Rewriting an email is an ideal use. The other three are genuine reasons for caution.",
        },
        {
          question: "You need to know a niche local regulation. What is the sensible approach?",
          options: [
            "Trust the model's answer since it sounds authoritative",
            "Use the model to frame your questions, then verify against the official source",
            "Ask three times and take the most common answer",
            "Avoid the topic entirely",
          ],
          correctIndex: 1,
          explanation:
            "Niche regulation is exactly where invention is likely. Using AI to prepare, then checking the primary source, gets you the benefit without the risk.",
        },
        {
          question: "Which everyday technology is an example of AI already in use?",
          options: [
            "A digital clock",
            "Netflix recommendations",
            "A PDF reader",
            "A USB cable",
          ],
          correctIndex: 1,
          explanation:
            "Recommendation systems learn from behaviour patterns. Clocks, PDF readers and cables follow fixed instructions.",
        },
        {
          question: "What best describes the relationship between fluency and accuracy in AI answers?",
          options: [
            "Fluent answers are always accurate",
            "They are independent — an answer can be beautifully written and completely wrong",
            "Accurate answers are always badly written",
            "Fluency guarantees the model searched a source",
          ],
          correctIndex: 1,
          explanation:
            "The system optimises for plausible text. Polish is not evidence of truth, which is the whole reason verification is a skill.",
        },
        {
          question: "A model gives you a statistic with a specific-sounding number and no source. What should you do?",
          options: [
            "Use it — the specificity indicates reliability",
            "Treat it as unverified and find the primary source before relying on it",
            "Ask the model to make the number rounder",
            "Assume the number is deliberately false",
          ],
          correctIndex: 1,
          explanation:
            "Specific numbers are easy to generate and feel authoritative. Unsourced statistics need checking before they go anywhere that matters.",
        },
        {
          question: "What is the most accurate way to think about a current AI tool?",
          options: [
            "An infallible oracle",
            "A fast, well-read assistant with no sense of its own limits",
            "A search engine with a different interface",
            "A calculator for words",
          ],
          correctIndex: 1,
          explanation:
            "Capable and quick, but with no reliable signal about when it is out of its depth — which is the part you supply.",
        },
      ],
    },

    // ═════════════════════════════════════════════════════════════════════
    {
      title: "Talking to AI Tools",
      summary:
        "The practical skill of getting genuinely useful output. Context, specificity, format, and what to do when the answer is wrong.",
      lessons: [
        {
          title: "Your first real conversation",
          objective: "Run a full task through an AI tool and improve the result by iterating.",
          durationMinutes: 30,
          bodyMd: `## Stop treating it like a search engine

The most common beginner mistake is typing three words as if into Google.

**Search-engine habit:** \`email to landlord\`
**What actually works:** \`Write a firm but polite email to my landlord. The heating has been broken for 11 days. I've reported it twice by phone with no response. I want it fixed within a week and I want the reply in writing. Keep it under 150 words.\`

The second gets a usable draft. The first gets generic filler.

## The four things worth including

**Task** — what you want made.
**Context** — the facts only you know.
**Audience** — who reads it, and your relationship to them.
**Constraints** — length, tone, format, what to avoid.

You won't always need all four. But when output feels bland, one of them is usually missing.

## Iteration is the actual skill

Your first message is a starting point, not a specification. The real work is the second and third message:

- "Too formal. Make it sound like a person wrote it."
- "You invented a reference number. Remove it."
- "Good, but cut the last paragraph — it weakens the ask."

People who get great results aren't writing magic first prompts. They're having a conversation.

## Try it now

Pick a real task from your week. Give it all four elements. Then push back three times before you accept the result.`,
          resources: [
            {
              title: "ChatGPT",
              url: "https://chat.openai.com",
              resourceType: "tool",
              isFree: true,
              isRequired: true,
              notes: "Do this lesson's exercise in a real tool — reading about it doesn't build the habit.",
            },
          ],
          microCheck: [
            {
              question: "Why does \"email to landlord\" produce a poor result?",
              options: [
                "The tool cannot write emails",
                "It supplies no context, audience or constraints, so only generic filler is possible",
                "Landlord is not in the training data",
                "The request is too long",
              ],
              correctIndex: 1,
              explanation:
                "With nothing specific to work from, the model can only produce the average of every landlord email it has seen. The facts only you know are what make output useful.",
            },
            {
              question: "Which four elements make a request substantially more effective?",
              options: [
                "Speed, cost, length, colour",
                "Task, context, audience, constraints",
                "Grammar, spelling, punctuation, tone",
                "Question, answer, source, date",
              ],
              correctIndex: 1,
              explanation:
                "Task (what), context (the facts you hold), audience (who reads it), and constraints (length, tone, format). Bland output usually means one is missing.",
            },
            {
              question: "What most distinguishes people who get great results from AI tools?",
              options: [
                "They memorise magic phrases",
                "They iterate — pushing back and refining across several messages",
                "They pay for the most expensive plan",
                "They write extremely short requests",
              ],
              correctIndex: 1,
              explanation:
                "The first message is a starting point. The skill is in the follow-ups that correct, cut and redirect.",
            },
            {
              question: "Your draft comes back too stiff and formal. What is the most effective next step?",
              options: [
                "Start a brand new conversation from scratch",
                "Accept it and edit by hand",
                "Reply telling it exactly what is wrong and what you want instead",
                "Ask the same question again unchanged",
              ],
              correctIndex: 2,
              explanation:
                "Specific correction in the same conversation keeps all the context you already supplied. Starting over throws that away; asking again unchanged usually reproduces the same tone.",
            },
          ],
        },
        {
          title: "Context is everything",
          objective: "Supply the right background so answers are specific to your situation.",
          durationMinutes: 30,
          bodyMd: `## The model knows nothing about you

It doesn't know your job, your company, your constraints, or what you already tried. Every conversation starts blank.

This is why generic answers happen. Not because the tool is weak — because you asked a generic question.

## Paste the actual thing

The single highest-value habit in this entire course:

**Instead of** "how do I reply to a difficult client email?"
**Do this** — paste the actual email, then ask.

Instead of describing a document, paste it. Instead of summarising the problem, show it. The model is far better at working with material in front of it than with your description of material.

## Say what you already tried

"I've already suggested a refund and they refused" saves you three useless rounds. Without it, you'll get the obvious advice you've already exhausted.

## Give it a role when it helps

"You're an experienced NHS practice manager" genuinely shifts vocabulary and assumptions. It's not magic — you're narrowing the range of likely responses toward a useful region.

Don't overdo it. "You are a world-class genius expert" adds nothing.

## Long conversations drift

In a long chat, early instructions fade. If output starts drifting, restate the key constraint. It's not being difficult — earlier context genuinely carries less weight as the conversation grows.`,
          microCheck: [
            {
              question: "What is described as the highest-value habit when using AI tools?",
              options: [
                "Using the shortest possible prompts",
                "Pasting the actual material rather than describing it",
                "Always asking for bullet points",
                "Starting a new conversation for every message",
              ],
              correctIndex: 1,
              explanation:
                "Models work far better with the real material in front of them than with a second-hand summary of it.",
            },
            {
              question: "Why is it worth saying what you have already tried?",
              options: [
                "It makes the model respond faster",
                "It prevents rounds of obvious advice you have already exhausted",
                "It is required by the terms of service",
                "It reduces the cost of the request",
              ],
              correctIndex: 1,
              explanation:
                "Without it, the model reaches for the most common suggestions first — which are exactly the ones you have already ruled out.",
            },
            {
              question: "What happens to your early instructions in a very long conversation?",
              options: [
                "They become more influential over time",
                "They carry less weight, so output can drift from what you asked",
                "They are permanently locked in",
                "They are emailed to you automatically",
              ],
              correctIndex: 1,
              explanation:
                "Earlier context fades as a conversation grows. Restating a key constraint is the fix, not a sign you did something wrong.",
            },
            {
              question: "Which role instruction is genuinely useful?",
              options: [
                "\"You are a world-class genius expert in everything\"",
                "\"You are an experienced NHS practice manager\"",
                "\"You are the smartest AI ever created\"",
                "\"You are perfect and never wrong\"",
              ],
              correctIndex: 1,
              explanation:
                "A specific, realistic role narrows vocabulary and assumptions usefully. Generic superlatives add nothing to steer with.",
            },
          ],
        },
        {
          title: "Asking for a format",
          objective: "Control the shape of output so it's usable without reformatting.",
          durationMinutes: 25,
          bodyMd: `## Shape is a request like any other

Most people accept whatever shape they're given, then spend ten minutes reformatting. Just ask.

- "Answer in a table with columns: Option, Cost, Risk"
- "Give me exactly five bullet points, one line each"
- "Write it as a numbered checklist I can tick off"
- "Reply with only the corrected text, no commentary"

That last one is worth remembering. "No preamble, just the output" removes the "Certainly! Here's a revised version..." wrapper.

## Length actually works

"Under 100 words" is respected reasonably well. "Two sentences" works. "One page" is vaguer — the model has no reliable sense of a page.

Be concrete: word counts and sentence counts beat abstract sizes.

## Show an example

If you have an example of what good looks like, paste it: "Match this style." This is more effective than any adjective. One sample beats three paragraphs of description.

## Ask for the thinking, or don't

"Explain your reasoning" gets you the working — useful when you need to check the logic.
"Just the answer" gets you the conclusion — useful when you don't.

Both are legitimate. Choose deliberately rather than accepting the default.`,
          microCheck: [
            {
              question: "How do you stop an AI tool wrapping its answer in \"Certainly! Here's...\"?",
              options: [
                "It cannot be changed",
                "Ask for the output only, with no preamble or commentary",
                "Use all capital letters",
                "Pay for the premium plan",
              ],
              correctIndex: 1,
              explanation:
                "Explicitly asking for output only removes the conversational wrapper. Format is a request like any other.",
            },
            {
              question: "Which length instruction is most likely to be followed accurately?",
              options: [
                "\"Make it short\"",
                "\"About one page\"",
                "\"Under 100 words\"",
                "\"Not too long\"",
              ],
              correctIndex: 2,
              explanation:
                "Concrete word and sentence counts work well. \"A page\" has no reliable meaning to a model, and \"short\" is entirely subjective.",
            },
            {
              question: "What is the most effective way to communicate a style you want?",
              options: [
                "Describe it in several adjectives",
                "Paste an example and ask it to match the style",
                "Ask for 'professional' output",
                "Use formal language in your request",
              ],
              correctIndex: 1,
              explanation:
                "One concrete sample carries more information than any amount of description. Adjectives like 'professional' mean different things to different readers.",
            },
          ],
        },
        {
          title: "When the answer is wrong",
          objective: "Correct, redirect and recover instead of starting over.",
          durationMinutes: 30,
          bodyMd: `## Wrong answers are normal, not a failure

Something will be wrong at some point. That's expected. What matters is what you do next.

## Correct specifically

**Weak:** "That's wrong."
**Strong:** "The second point is wrong — we're a charity, not a limited company, so that filing requirement doesn't apply. Redo it on that basis."

Vague correction gets a vague apology and a slightly reshuffled version of the same answer. Specific correction gets an actual fix.

## Watch for the apology loop

Models are trained to be agreeable. Push hard enough and one will apologise and change a correct answer to a wrong one.

If you say "are you sure?" about something correct, you may get "You're right, I apologise" followed by a worse answer. Agreement is not evidence. If you're testing, ask "what's the evidence for that?" rather than applying pressure.

## Know when to start fresh

Sometimes a conversation is poisoned — the model has locked onto a wrong framing and keeps returning to it. Starting a new chat with better framing beats fighting for six more messages.

Rough rule: if two specific corrections haven't fixed it, start over.

## Don't outsource the judgement

The most important habit: you are the one deciding whether the answer is good. The tool produces; you judge. If you're not qualified to judge the output, you're not in a position to use it for that task yet.`,
          microCheck: [
            {
              question: "What makes a correction effective?",
              options: [
                "Saying \"that's wrong\" firmly",
                "Naming exactly what is wrong and giving the correct basis to redo it on",
                "Using capital letters",
                "Asking the same question again",
              ],
              correctIndex: 1,
              explanation:
                "Specific correction produces an actual fix. Vague criticism produces an apology and a reshuffle of the same answer.",
            },
            {
              question: "What is the \"apology loop\"?",
              options: [
                "The tool refusing to answer repeatedly",
                "Pressure causing the model to agree with you and abandon a correct answer",
                "A billing error",
                "The model repeating itself word-for-word",
              ],
              correctIndex: 1,
              explanation:
                "Trained agreeableness means pushing hard can flip a correct answer to a wrong one. Agreement under pressure is not evidence of anything.",
            },
            {
              question: "When is it better to start a new conversation?",
              options: [
                "After every single message",
                "When two specific corrections have failed to shift a wrong framing",
                "Never — always continue the same chat",
                "Only when the tool crashes",
              ],
              correctIndex: 1,
              explanation:
                "A conversation can lock onto a bad framing. Two failed specific corrections is a reasonable signal to reframe from scratch.",
            },
            {
              question: "If you are not qualified to judge whether an answer is correct, what does that mean?",
              options: [
                "You should trust the tool completely",
                "You are not yet in a position to use AI for that particular task",
                "You should ask the tool to confirm its own accuracy",
                "You should use a more expensive tool",
              ],
              correctIndex: 1,
              explanation:
                "The tool produces and you judge. Without the ability to judge, there is no safety net — and asking the model to grade itself provides none.",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "Which request will produce the most useful first draft?",
          options: [
            "\"complaint letter\"",
            "\"Write a complaint letter\"",
            "\"Write a firm complaint letter to my energy supplier. They overcharged £240 across three months, I've called twice with no resolution, and I want a refund within 14 days. Under 200 words.\"",
            "\"Please write me an excellent complaint letter, thank you\"",
          ],
          correctIndex: 2,
          explanation:
            "Task, context, audience and constraints are all present. Politeness and the word 'excellent' add nothing the model can act on.",
        },
        {
          question: "What are the four elements of an effective request?",
          options: [
            "Task, context, audience, constraints",
            "Who, what, when, where",
            "Question, answer, source, check",
            "Speed, cost, length, tone",
          ],
          correctIndex: 0,
          explanation: "Missing output quality usually traces back to one of these four being absent.",
        },
        {
          question: "Why paste an actual email rather than describing it?",
          options: [
            "It is faster to type",
            "Models work far better with real material than with a summary of it",
            "It is required by the tool",
            "Descriptions are always inaccurate",
          ],
          correctIndex: 1,
          explanation:
            "Your description necessarily loses detail — tone, specific phrasing, what was left unsaid. The real thing keeps all of it.",
        },
        {
          question: "Your output drifts off-brief in a long conversation. What is happening?",
          options: [
            "The tool is malfunctioning",
            "Earlier instructions carry less weight as the conversation grows",
            "You have exceeded your usage limit",
            "The model has forgotten how to write",
          ],
          correctIndex: 1,
          explanation: "This is expected behaviour. Restating the key constraint brings it back.",
        },
        {
          question: "What does asking for \"the output only, no preamble\" achieve?",
          options: [
            "A faster response",
            "Removal of the conversational wrapper so the text is usable as-is",
            "A more accurate answer",
            "A longer answer",
          ],
          correctIndex: 1,
          explanation: "It strips 'Certainly! Here's a revised version...' so you can paste the result directly.",
        },
        {
          question: "Which is the most reliable way to control length?",
          options: [
            "\"Keep it brief\"",
            "\"Under 150 words\"",
            "\"About a page\"",
            "\"Not too wordy\"",
          ],
          correctIndex: 1,
          explanation: "Concrete counts are respected reasonably well; abstract sizes are not.",
        },
        {
          question: "The model gives a wrong answer. What is the strongest response?",
          options: [
            "\"That's completely wrong.\"",
            "\"Point three is wrong — we're a charity, so that requirement doesn't apply. Redo on that basis.\"",
            "\"Try again.\"",
            "\"Are you sure?\"",
          ],
          correctIndex: 1,
          explanation:
            "Specific correction plus the correct basis produces a real fix. The others produce apologies and reshuffles.",
        },
        {
          question: "You say \"are you sure?\" about a correct answer and it changes its mind. What does this tell you?",
          options: [
            "The original answer was wrong",
            "Trained agreeableness can override correctness under pressure — the change is not evidence",
            "The tool has learned something new",
            "You should always challenge every answer",
          ],
          correctIndex: 1,
          explanation:
            "Capitulation under pressure says nothing about truth. Asking for the evidence is a better test than applying pressure.",
        },
        {
          question: "What is the most effective way to convey a desired writing style?",
          options: [
            "Use several adjectives",
            "Paste an example and ask it to match",
            "Ask for 'professional' tone",
            "Write your request in that style",
          ],
          correctIndex: 1,
          explanation: "A single concrete sample beats any amount of abstract description.",
        },
        {
          question: "Roughly when should you abandon a conversation and start fresh?",
          options: [
            "After the first imperfect answer",
            "After two specific corrections have failed to fix the framing",
            "Never",
            "After exactly ten messages",
          ],
          correctIndex: 1,
          explanation:
            "Two failed specific corrections suggests the conversation has locked onto a bad framing that is easier to escape than to fight.",
        },
        {
          question: "What does \"the tool produces, you judge\" mean in practice?",
          options: [
            "You should rewrite everything by hand",
            "Responsibility for whether the output is good remains with you",
            "The tool should grade its own work",
            "You need a second AI to check the first",
          ],
          correctIndex: 1,
          explanation:
            "Judgement is the part you supply. If you cannot judge the output for a task, you are not yet ready to use AI for it.",
        },
        {
          question: "Why is \"You are an experienced hospital ward manager\" more useful than \"You are a genius\"?",
          options: [
            "It is more polite",
            "A specific realistic role usefully narrows vocabulary and assumptions",
            "It makes responses longer",
            "It unlocks a hidden feature",
          ],
          correctIndex: 1,
          explanation:
            "Specific roles steer toward a useful region of responses. Generic superlatives give the model nothing to aim at.",
        },
      ],
    },
  ],

  // Modules 3-7, final exam and capstone are appended in track-1-part2.ts
  finalExam: undefined,
  capstone: undefined,
};
