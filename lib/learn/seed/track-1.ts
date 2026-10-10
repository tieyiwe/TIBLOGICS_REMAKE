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

No coding. No maths. No prior experience of any kind.

Skills this track builds also appear in AI fluency and AI literacy courses from AI labs and technology companies. This track is independent: it is not affiliated with any of them and is not official preparation for any certificate.`,
  level: "starter",
  status: "live",
  sortOrder: 1,
  accentColor: "#22A387",
  certificateName: "TIBLOGICS Certified AI Foundations",
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
                "A general-purpose robot that can act in the physical world",
                "A large language model such as ChatGPT or Claude",
                "Any software that automates a task, such as a macro",
                "A computer system that has become self-aware",
              ],
              correctIndex: 1,
              explanation:
                "In everyday use, \"AI\" almost always means a large language model, the technology behind ChatGPT, Claude, Gemini and Copilot. Robots, simple automation and self-aware machines are not what people mean at work.",
            },
            {
              question: "What is a large language model fundamentally doing when it answers you?",
              options: [
                "Looking the answer up in a large database of checked facts",
                "Predicting the next piece of text from patterns it learned",
                "Passing harder questions to a human reviewer behind the scenes",
                "Reasoning step by step from logical rules its makers wrote",
              ],
              correctIndex: 1,
              explanation:
                "It predicts the next piece of text, over and over. That is why it can be fluent and confident yet wrong: there is no fact database or rulebook behind it, and fluency is not accuracy.",
            },
            {
              question: "Why does the \"pattern completion\" idea matter for how you use these tools?",
              options: [
                "It means the tools are mainly suited to grammar and spelling",
                "Answers that sound right can still be wrong, so check them",
                "It means an answer is reliable once the wording is fluent",
                "It means the tools should be kept away from important work",
              ],
              correctIndex: 1,
              explanation:
                "Because the system optimises for what sounds right, plausibility and accuracy can come apart. That makes checking a skill worth learning, not a reason to avoid the tools or to trust fluent answers.",
            },
            {
              question: "Which statement about large language models is accurate?",
              options: [
                "They check each fact against a database before they answer",
                "They understand you in much the same way a person does",
                "Predicting text well requires something like understanding",
                "They can only repeat sentences they saw word for word",
              ],
              correctIndex: 2,
              explanation:
                "The mechanism is next-text prediction, but doing it well requires representing facts and following arguments. That is not consciousness, a fact lookup, or parroting memorised sentences.",
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
                "Engineers write rules that cover each kind of question",
                "It guesses the next text, is corrected, and settings are nudged",
                "It stores every document it reads so that it can quote it later",
                "It is shown correct answers and copies them into memory",
              ],
              correctIndex: 1,
              explanation:
                "Training is guess-and-correct repeated billions of times, with each wrong guess nudging internal settings. Nobody hand-writes the rules, and the model does not store documents to quote back.",
            },
            {
              question: "Why is a model typically weaker on your company's internal process than on general topics?",
              options: [
                "Internal processes are too complex for current models to follow",
                "Models are built to avoid discussing company-specific information",
                "Its training data is mostly public text without your documents",
                "It was trained mainly on academic text rather than workplace text",
              ],
              correctIndex: 2,
              explanation:
                "Models learn from broadly available public text. Private or internal material is thin or absent from it, which is why you often need to paste the context in yourself. Complexity is not the issue.",
            },
            {
              question: "What is a \"knowledge cutoff\"?",
              options: [
                "The daily limit on how many questions a free account can ask",
                "The date after which the model learned nothing new in training",
                "The point in a long chat where earlier messages are dropped",
                "A filter that blocks topics the provider has chosen to exclude",
              ],
              correctIndex: 1,
              explanation:
                "Training ends on a fixed date. Beyond it the model has no new knowledge unless it can search the web or you paste the information in. It is not a usage limit or a content filter.",
            },
            {
              question: "You ask an AI tool about an event from last week and get a confident, detailed answer. What is the sensible reaction?",
              options: [
                "Trust it, since that much specific detail is very hard to invent",
                "Check whether it searched, as it may be predicting the news",
                "Ask the same question again and trust it if it matches",
                "Treat all information about recent events as unusable",
              ],
              correctIndex: 1,
              explanation:
                "Detail and confidence are not evidence. If the event is past the cutoff and no search happened, the answer may be plausible invention, and asking again usually just produces another confident guess.",
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
                "Telling you last night's football score from memory",
                "Summarising a long report you paste into the chat",
                "Working out your exact tax bill from your payslips",
                "Deciding which member of staff should be let go",
              ],
              correctIndex: 1,
              explanation:
                "Transforming text you supply is the sweet spot because the information is right in front of it. Recent facts, precise arithmetic and accountable decisions about people are all poor fits.",
            },
            {
              question: "What is described as the most dangerous property of these systems?",
              options: [
                "They can be slow to respond when a question is complex",
                "They rarely signal doubt, so a guess sounds like a fact",
                "They refuse too many questions to be reliable at work",
                "They are overly cautious and hedge almost every single answer",
              ],
              correctIndex: 1,
              explanation:
                "A model sounds equally confident whether it knows or is guessing. Because you cannot read uncertainty from the writing, you have to check independently. Over-caution is not the problem; overconfidence is.",
            },
            {
              question: "Why are medical, legal and financial decisions a poor fit for AI tools?",
              options: [
                "The tools are legally barred from giving advice in these areas",
                "They need someone who can be held accountable; a model can't",
                "The technical vocabulary in these fields is too specialised",
                "These fields are mostly missing from the training data",
              ],
              correctIndex: 1,
              explanation:
                "The issue is accountability, not capability or vocabulary. These decisions need a responsible human; using AI to prepare for a conversation with a professional is fine.",
            },
            {
              question: "Why should you verify arithmetic from an AI tool even when it looks right?",
              options: [
                "Arithmetic is barely represented in the training data",
                "It predicts text rather than calculating, so numbers can be off",
                "The tools round figures automatically to keep answers short",
                "Numbers are often garbled when the answer is formatted",
              ],
              correctIndex: 1,
              explanation:
                "Text prediction can produce a number that looks right without being right. Many tools now call a real calculator behind the scenes, but confirm anything that matters rather than assume.",
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
                "They respond much faster than earlier AI systems did",
                "They converse and will attempt almost any task",
                "They are the first AI to learn from real-world data",
                "They are far more accurate than earlier everyday AI",
              ],
              correctIndex: 1,
              explanation:
                "Older everyday AI did one narrow job invisibly. A chatbot talks back in plain language and will attempt almost anything; that combination is what feels new, not speed or accuracy.",
            },
            {
              question: "What is the more useful question to ask, given you already use AI daily?",
              options: [
                "Should I start using AI now, or wait until it matures?",
                "How do I use the new kind well, and where should I be careful?",
                "How can I keep AI out of my work and personal life?",
                "Which AI company is winning, so I can back the right one?",
              ],
              correctIndex: 1,
              explanation:
                "Whether to use AI is already settled: you do, every day. The practical question is how to use the new general-purpose kind skilfully and where caution is warranted.",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "A colleague says \"we should use AI for this.\" What are they most likely referring to?",
          options: [
            "A robot that could carry out the task physically",
            "A large language model like ChatGPT or Claude",
            "An automated spreadsheet formula or macro",
            "A self-aware computer that makes decisions",
          ],
          correctIndex: 1,
          explanation: "In current workplace usage, \"AI\" nearly always means a large language model. Robots and spreadsheet automation exist but are not what people usually mean by the word today.",
        },
        {
          question: "What is the core mechanism behind a large language model's answers?",
          options: [
            "Looking up checked facts in a large database",
            "Repeatedly predicting the next piece of text",
            "Passing tricky questions to human experts",
            "Applying logical rules written by engineers",
          ],
          correctIndex: 1,
          explanation:
            "It predicts text one piece at a time. Apparent knowledge, reasoning and tone all emerge from doing that well; there is no fact database or hand-written rulebook behind it.",
        },
        {
          question: "Which task is the strongest fit for a current AI tool?",
          options: [
            "Rewriting a document you paste in, in a warmer tone",
            "Reporting yesterday's closing share price from memory",
            "Calculating this month's payroll to the penny",
            "Choosing the right diagnosis from a list of symptoms",
          ],
          correctIndex: 0,
          explanation:
            "Transforming text you provide is what these tools do best, because the information is already in front of them. Recent prices, exact payroll and diagnoses need live data, calculation or accountability.",
        },
        {
          question: "Why is a model unreliable on very recent events?",
          options: [
            "Recent events are usually too complex to summarise accurately",
            "Training stopped at a fixed date; later events are unknown",
            "Providers hold back recent news until it has been fact-checked",
            "Recent events are rarely written about online in any depth",
          ],
          correctIndex: 1,
          explanation:
            "The knowledge cutoff is a hard boundary. Past it, the model either searches or guesses, and a guess sounds just as confident. Providers are not deliberately withholding anything.",
        },
        {
          question: "What does it mean that a model \"doesn't know what it doesn't know\"?",
          options: [
            "It refuses to answer questions outside its training",
            "It gives guesses in the same confident tone as facts",
            "It adds a warning whenever it is unsure of an answer",
            "It can only answer questions it has seen before",
          ],
          correctIndex: 1,
          explanation:
            "There is no reliable difference in tone between a certain answer and an invented one, and warnings are rare. That is why verification has to come from outside the model.",
        },
        {
          question: "Why does training data explain a model's blind spots?",
          options: [
            "Because much of the training data is fiction and opinion",
            "Because rare, private or recent topics are thin in it",
            "Because the data is deleted once training has finished",
            "Because it was drawn from a small set of approved books",
          ],
          correctIndex: 1,
          explanation:
            "The model is strong where the data is thick and weak where it is thin. Your internal processes, niche topics and last week's news are barely present in public training text.",
        },
        {
          question: "Which is NOT a good reason to avoid AI for a task?",
          options: [
            "The task requires someone to be legally accountable",
            "The task needs precise figures you will rely on",
            "The task is rewriting an email to sound more polite",
            "The task depends on this week's news and there is no search",
          ],
          correctIndex: 2,
          explanation:
            "Rewriting an email is an ideal use because the text is supplied. Accountability, precise figures and news past the cutoff with no search are all genuine reasons for caution.",
        },
        {
          question: "You need to know a niche local regulation. What is the sensible approach?",
          options: [
            "Trust the answer if it quotes the regulation's exact wording",
            "Use it to frame questions, then check the official source",
            "Ask three times and go with the most common answer",
            "Avoid using AI for the whole topic, even to prepare",
          ],
          correctIndex: 1,
          explanation:
            "Niche regulation is exactly where invention is likely, and quoted wording can be invented too. Using AI to prepare, then checking the primary source, gives you the benefit without the risk.",
        },
        {
          question: "Which everyday technology is an example of AI already in use?",
          options: [
            "A digital clock that sets its own time",
            "Netflix suggesting what to watch next",
            "A PDF reader opening a scanned letter",
            "A thermostat that switches on at 7am",
          ],
          correctIndex: 1,
          explanation:
            "Recommendation systems learn from patterns in viewing behaviour. Clock syncing, PDF readers and timed thermostats follow fixed instructions, so no learning is involved.",
        },
        {
          question: "What best describes the relationship between fluency and accuracy in AI answers?",
          options: [
            "Fluent answers tend to be accurate, as errors show in the writing",
            "They are separate: a polished answer can be completely wrong",
            "Clumsy wording is the most reliable sign of a wrong answer",
            "Fluency shows the model has checked a source before answering",
          ],
          correctIndex: 1,
          explanation:
            "The system optimises for plausible text, so polish is not evidence of truth, and clumsiness is not evidence of error. That separation is the whole reason verification is a skill.",
        },
        {
          question: "A model gives you a statistic with a specific-sounding number and no source. What should you do?",
          options: [
            "Use it, as specific numbers are usually drawn from real data",
            "Treat it as unverified and find the primary source first",
            "Ask the model for its source and use it if it names one",
            "Discard it, as unsourced numbers are generally made up",
          ],
          correctIndex: 1,
          explanation:
            "Specific numbers are easy to generate and feel authoritative, and a named source can be invented too. Treat the figure as unverified until you have found the primary source yourself.",
        },
        {
          question: "What is the most accurate way to think about a current AI tool?",
          options: [
            "An expert that is right on most things it chooses to answer",
            "A fast, well-read assistant with no sense of its own limits",
            "A search engine with a friendlier, conversational interface",
            "A calculator for words that gives the same answer each time",
          ],
          correctIndex: 1,
          explanation:
            "It is capable and quick but gives no reliable signal about when it is out of its depth, so that judgement is the part you supply. It does not search by default and is not deterministic.",
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
                "The tool is not designed to write personal correspondence",
                "It gives no context, audience or constraints, so it gets filler",
                "The request should be phrased as a full, polite sentence",
                "It is too short for the tool to recognise it as a task",
              ],
              correctIndex: 1,
              explanation:
                "With nothing specific to work from, the model can only produce the average landlord email. Politeness or full sentences add nothing; the facts only you know are what make output useful.",
            },
            {
              question: "Which four elements make a request substantially more effective?",
              options: [
                "Keywords, tone, length, politeness",
                "Task, context, audience, constraints",
                "Grammar, spelling, punctuation, tone",
                "Question, source, deadline, format",
              ],
              correctIndex: 1,
              explanation:
                "Task (what you want), context (facts only you hold), audience (who reads it) and constraints (length, tone, format). Bland output usually means one of these is missing.",
            },
            {
              question: "What most distinguishes people who get great results from AI tools?",
              options: [
                "They have learned a set of reliable magic phrases",
                "They iterate, pushing back over several messages",
                "They use the most capable paid version of the tool",
                "They write one long, detailed prompt and accept the result",
              ],
              correctIndex: 1,
              explanation:
                "The first message is a starting point. The skill is in the follow-ups that correct, cut and redirect; one perfect prompt or a premium plan is no substitute for that conversation.",
            },
            {
              question: "Your draft comes back too stiff and formal. What is the most effective next step?",
              options: [
                "Start a new conversation with a clearer first prompt",
                "Accept the draft and fix the tone by hand yourself",
                "Reply saying exactly what is wrong and what you want",
                "Ask the same question again and pick the better version",
              ],
              correctIndex: 2,
              explanation:
                "Specific correction in the same conversation keeps all the context you already supplied. Starting over throws that away, and asking again unchanged usually reproduces the same tone.",
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

Try it: build a reply to an unhappy client from blocks, and watch the strength meter climb as you add real context, a reader and a format.

\`\`\`studio
prompt-builder:client-email
\`\`\`

## Long conversations drift

In a long chat, early instructions fade. If output starts drifting, restate the key constraint. It's not being difficult — earlier context genuinely carries less weight as the conversation grows.`,
          microCheck: [
            {
              question: "What is described as the highest-value habit when using AI tools?",
              options: [
                "Keeping prompts as short and simple as possible",
                "Pasting the actual material rather than describing it",
                "Asking for the answer in bullet points every time",
                "Starting a fresh conversation for each new question you ask",
              ],
              correctIndex: 1,
              explanation:
                "Models work far better with the real material in front of them than with your second-hand summary of it, which inevitably loses tone, detail and what was left unsaid.",
            },
            {
              question: "Why is it worth saying what you have already tried?",
              options: [
                "It helps the model decide how long its answer should be",
                "It saves rounds of obvious advice you have already ruled out",
                "It tells the model how experienced you are with the topic",
                "It stops the model repeating your own wording back to you",
              ],
              correctIndex: 1,
              explanation:
                "Without it, the model reaches for the most common suggestions first, which are exactly the ones you have already tried. One sentence of history saves several wasted rounds.",
            },
            {
              question: "What happens to your early instructions in a very long conversation?",
              options: [
                "They gain weight, as the model builds on them each turn",
                "They carry less weight, so output can drift from your brief",
                "They stay fixed and apply equally for the whole chat",
                "They are cleared automatically after a set number of messages",
              ],
              correctIndex: 1,
              explanation:
                "Earlier context fades as a conversation grows, so output can drift. Restating the key constraint is the fix; the instructions are neither locked in nor wiped at a fixed point.",
            },
            {
              question: "Which role instruction is genuinely useful?",
              options: [
                "\"You are a world-class expert in every subject\"",
                "\"You are an experienced NHS practice manager\"",
                "\"You are the most accurate AI ever created\"",
                "\"You are a genius who never makes mistakes\"",
              ],
              correctIndex: 1,
              explanation:
                "A specific, realistic role narrows vocabulary and assumptions towards a useful region. Superlatives such as genius or world-class give the model nothing concrete to steer by.",
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

Now practise spotting the difference: in each round, pick the stronger prompt, name what the weaker one is missing, then fix it.

\`\`\`studio
prompt-arena:rookie
\`\`\`

## Ask for the thinking, or don't

"Explain your reasoning" gets you the working — useful when you need to check the logic.
"Just the answer" gets you the conclusion — useful when you don't.

Both are legitimate. Choose deliberately rather than accepting the default.`,
          microCheck: [
            {
              question: "How do you stop an AI tool wrapping its answer in \"Certainly! Here's...\"?",
              options: [
                "It is built in and cannot be switched off",
                "Ask for the output only, with no preamble",
                "Write your request in a formal, businesslike tone",
                "Turn on the professional mode in the settings",
              ],
              correctIndex: 1,
              explanation:
                "Explicitly asking for output only removes the conversational wrapper. Format is a request like any other; a formal tone in your own prompt will not reliably remove it.",
            },
            {
              question: "Which length instruction is most likely to be followed accurately?",
              options: [
                "\"Keep it fairly short\"",
                "\"About one page long\"",
                "\"Under 100 words\"",
                "\"No more than a short read\"",
              ],
              correctIndex: 2,
              explanation:
                "Concrete word and sentence counts work well. A page has no reliable meaning to a model, and short or brief are subjective, so the model has to guess what you meant.",
            },
            {
              question: "What is the most effective way to communicate a style you want?",
              options: [
                "Describe it with several precise adjectives",
                "Paste an example and ask it to match the style",
                "Ask for a professional tone and a target length",
                "Write your own request in the style you want",
              ],
              correctIndex: 1,
              explanation:
                "One concrete sample carries more information than any description. Adjectives like professional mean different things to different readers, and your prompt's own style is only a weak hint.",
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

Practise catching an over-agreeable answer, then add critic moves to the prompt until the hidden problems in the plan show up.

\`\`\`studio
critic-mode:bakery
\`\`\`

## Know when to start fresh

Sometimes a conversation is poisoned — the model has locked onto a wrong framing and keeps returning to it. Starting a new chat with better framing beats fighting for six more messages.

Rough rule: if two specific corrections haven't fixed it, start over.

## Don't outsource the judgement

The most important habit: you are the one deciding whether the answer is good. The tool produces; you judge. If you're not qualified to judge the output, you're not in a position to use it for that task yet.`,
          microCheck: [
            {
              question: "What makes a correction effective?",
              options: [
                "Saying firmly that the answer is wrong and asking it to try again",
                "Naming exactly what is wrong and the basis to redo it on",
                "Asking whether it is sure, so it can reconsider",
                "Repeating the original request with more emphasis",
              ],
              correctIndex: 1,
              explanation:
                "Specific correction plus the right basis produces an actual fix. Vague criticism or pressure produces an apology and a reshuffle of the same answer.",
            },
            {
              question: "What is the \"apology loop\"?",
              options: [
                "The tool apologising and refusing the same request repeatedly",
                "Pressure making the model agree and drop a correct answer",
                "The model repeating the same wrong answer after each apology",
                "The tool adding an apology to the start of each reply",
              ],
              correctIndex: 1,
              explanation:
                "Trained agreeableness means pushing hard can flip a correct answer to a wrong one. Agreement under pressure is not evidence; asking for the evidence is a better test.",
            },
            {
              question: "When is it better to start a new conversation?",
              options: [
                "Whenever the first answer is not quite right",
                "When two specific corrections fail to fix the framing",
                "Never, as a new chat loses all the useful context",
                "After about ten messages, before your first instructions fade",
              ],
              correctIndex: 1,
              explanation:
                "A conversation can lock onto a bad framing. Two failed specific corrections is a reasonable signal to reframe from scratch; one imperfect answer is not, and there is no fixed message count.",
            },
            {
              question: "If you are not qualified to judge whether an answer is correct, what does that mean?",
              options: [
                "You should rely on the tool, as it knows more than you do",
                "You are not yet in a position to use AI for that task",
                "You should ask the tool to check its own answer first",
                "You should use a more advanced model for that task",
              ],
              correctIndex: 1,
              explanation:
                "The tool produces and you judge. Without the ability to judge there is no safety net, and asking the model to grade itself or switching to a stronger model does not provide one.",
            },
          ],
        },
      ],
      quiz: [
        {
          question: "Which request will produce the most useful first draft?",
          options: [
            "\"Please write me an excellent, professional complaint letter to my energy supplier about my bill. Make it firm, polite, persuasive and well structured, thank you.\"",
            "\"You are a world-class consumer rights lawyer. Write the strongest possible complaint letter to an energy company about a billing problem.\"",
            "\"Write a firm complaint to my energy supplier: they overcharged £240 over three months, two calls got nowhere, I want a refund within 14 days. Under 200 words.\"",
            "\"Write a complaint letter to my energy supplier. Use a formal tone, clear paragraphs and a strong closing line. Keep it concise and to the point.\"",
          ],
          correctIndex: 2,
          explanation:
            "Only one version gives the facts only you know: the amount, the history, the outcome you want and a length. Politeness, superlatives and roles give the model nothing specific to act on.",
        },
        {
          question: "What are the four elements of an effective request?",
          options: [
            "Task, context, audience, constraints",
            "Who, what, when, where and why",
            "Question, examples, sources, deadline",
            "Role, tone, keywords, length",
          ],
          correctIndex: 0,
          explanation: "Weak output usually traces back to one of task, context, audience or constraints being absent. The five Ws or a list of keywords do not cover who reads it or the limits you need.",
        },
        {
          question: "Why paste an actual email rather than describing it?",
          options: [
            "It is faster than typing out a description",
            "Models work far better with real material than a summary",
            "The tool cannot follow a description of an email accurately",
            "It lets the model check the email's facts for you",
          ],
          correctIndex: 1,
          explanation:
            "Your description necessarily loses detail: tone, specific phrasing, what was left unsaid. The real thing keeps all of it. Speed is a side benefit, not the reason.",
        },
        {
          question: "Your output drifts off-brief in a long conversation. What is happening?",
          options: [
            "The tool has a fault and needs restarting",
            "Earlier instructions carry less weight as the chat grows",
            "You have reached your usage limit for the day",
            "The model has quietly been switched to a cheaper, weaker version",
          ],
          correctIndex: 1,
          explanation: "This is expected behaviour, not a fault or a limit. Earlier context fades as a conversation lengthens, and restating the key constraint brings the output back.",
        },
        {
          question: "What does asking for \"the output only, no preamble\" achieve?",
          options: [
            "A faster reply, since less text is generated",
            "No conversational wrapper, so the text is usable as-is",
            "A more accurate answer, with fewer invented details or claims",
            "A shorter answer with the key points condensed",
          ],
          correctIndex: 1,
          explanation: "It strips wrappers like 'Certainly! Here's a revised version...' so you can paste the result directly. It changes the shape of the reply, not its accuracy.",
        },
        {
          question: "Which is the most reliable way to control length?",
          options: [
            "\"Keep it nice and brief\"",
            "\"Under 150 words\"",
            "\"About half a page\"",
            "\"Not too wordy, please\"",
          ],
          correctIndex: 1,
          explanation: "Concrete counts such as a word limit are respected reasonably well. Abstract sizes like brief or half a page leave the model guessing what you meant.",
        },
        {
          question: "The model gives a wrong answer. What is the strongest response?",
          options: [
            "\"That's completely wrong. Please check everything again and fix it.\"",
            "\"Point three is wrong: we're a charity, so that rule doesn't apply. Redo it on that basis.\"",
            "\"Are you sure about point three? Think again very carefully before you answer.\"",
            "\"Try again, but this time make absolutely sure every single point is correct and fits our situation.\"",
          ],
          correctIndex: 1,
          explanation:
            "Specific correction plus the correct basis produces a real fix. Vague criticism, pressure or a request to try harder produces apologies and reshuffles of the same answer.",
        },
        {
          question: "You say \"are you sure?\" about a correct answer and it changes its mind. What does this tell you?",
          options: [
            "The original answer was probably wrong after all",
            "Agreeableness can override correctness; it proves nothing",
            "The model has learned the right answer from your challenge",
            "Challenging an answer is a good way to test its accuracy",
          ],
          correctIndex: 1,
          explanation:
            "Capitulation under pressure says nothing about truth. Asking what the evidence is for a claim is a far better test than applying pressure.",
        },
        {
          question: "What is the most effective way to convey a desired writing style?",
          options: [
            "List several adjectives that describe it",
            "Paste an example and ask it to match",
            "Ask for a professional, polished tone",
            "Write your own request in that style",
          ],
          correctIndex: 1,
          explanation: "A single concrete sample beats any amount of abstract description. Adjectives and labels like professional mean different things to different readers.",
        },
        {
          question: "Roughly when should you abandon a conversation and start fresh?",
          options: [
            "After the first answer that is not quite right",
            "After two specific corrections fail to fix the framing",
            "Never; a fresh chat throws away all the useful context you gave",
            "After about ten messages, whatever the quality",
          ],
          correctIndex: 1,
          explanation:
            "Two failed specific corrections suggest the conversation has locked onto a bad framing that is easier to escape than to fight. One imperfect answer is normal and worth correcting.",
        },
        {
          question: "What does \"the tool produces, you judge\" mean in practice?",
          options: [
            "You should rewrite the output in your own words",
            "Responsibility for the output's quality stays with you",
            "The tool should be asked to grade its own work",
            "A second AI tool should always check what the first one produced",
          ],
          correctIndex: 1,
          explanation:
            "Judgement is the part you supply. If you cannot judge the output for a task, you are not yet ready to use AI for it; another model or a self-check does not take on that responsibility.",
        },
        {
          question: "Why is \"You are an experienced hospital ward manager\" more useful than \"You are a genius\"?",
          options: [
            "It is more polite, so the model tries harder",
            "A realistic role narrows vocabulary and assumptions",
            "It gives the model permission to draw on specialist medical data",
            "It prompts longer, more detailed responses",
          ],
          correctIndex: 1,
          explanation:
            "Specific roles steer the model towards a useful region of responses. Politeness and superlatives give it nothing to aim at, and a role does not unlock any hidden data.",
        },
      ],
    },
  ],

  // Modules 3-7, final exam and capstone are appended in track-1-part2.ts
  finalExam: undefined,
  capstone: undefined,
};
