import type { SeedModule } from "../types";

// Becoming the AI-Forward Professional in Your Field (slug: ai-forward-professional)
// Modules 1-3. Audience: experienced professionals in any field who feel
// intimidated or behind on AI. The thread: "your judgement is the asset".
// Product names and features are examples only and are dated September 2026.

export const AI_FORWARD_MODULES_1_TO_3: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 1
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Getting Past the Intimidation",
    summary:
      "Understand what AI can and cannot do in professional work, face the common fears honestly, get three quick wins on real tasks, and set up a short daily habit that builds fluency without taking over your week.",
    lessons: [
      {
        title: "What AI can and cannot do in professional work",
        objective:
          "Distinguish the tasks where AI assistants help a professional from the tasks that still depend on your own judgement.",
        durationMinutes: 22,
        contentType: "article",
        isPreview: true,
        bodyMd: `## Start from what you already know

If you have spent years in healthcare administration, law, finance, teaching, social work, a trade, sales, HR or public service, you already know a great deal that no software knows. You know which rules actually get enforced, which clients need a phone call rather than an email, which figures in a report always look odd for a good reason, and which colleague to ask when something is unclear.

This course starts from that. You are not behind because you have not used AI much yet. You are an expert who has not yet picked up a new tool. That is a much easier gap to close than it feels.

## What these tools actually are

The AI tools most professionals use today are **large language models** (LLMs): software trained on very large amounts of text to predict what words should come next. In practice that means they are good at producing fluent language on almost any topic, very quickly.

Two things follow from how they work:

- They are strong at **language tasks**: drafting, rewording, summarising, structuring, explaining and translating.
- They do not "know" things the way you do. They produce text that sounds right. Most of the time it is right. Sometimes it is confidently wrong. A made-up but plausible answer is often called a **hallucination**.

## What AI does well at work

Think of an AI assistant as a quick, tireless junior colleague who has read widely but has never worked in your organisation. It is good at:

- **First drafts**: emails, letters, reports, policies, job adverts, lesson plans.
- **Rewriting**: making something shorter, clearer, warmer, more formal or easier to read.
- **Summarising**: turning long notes or documents into key points and actions.
- **Structuring**: turning a messy brain dump into an outline or checklist.
- **Explaining**: walking you through an unfamiliar topic in plain language.
- **Brainstorming**: suggesting options, questions or angles you might have missed.

## Where it falls short

It is weak, or simply wrong for the job, when the task depends on:

- **Facts it cannot check**: current figures, case details, recent rule changes, anything specific to your organisation.
- **Context it has not been given**: the history with this client, the politics of this team, the reason a process exists.
- **Accountability**: it cannot sign off, take responsibility or be answerable for a decision.
- **Ethical and human judgement**: whether to escalate a safeguarding concern, how to deliver bad news to a family, when a rule should bend.

## Why your expertise matters more, not less

Here is the part that is easy to miss. Because AI makes producing text cheap, the valuable part of your work shifts towards the things it cannot do: knowing what good looks like, spotting what is wrong, and deciding what to do.

A newcomer who asks an AI for a client letter gets something that reads well. You get something that reads well **and** you can see that it promises a timescale your team cannot meet, uses a term your sector avoids, and misses the one question the client will definitely ask. Your judgement is the asset. The tool just gives it more to work with.

## A simple division of labour

A useful rule of thumb for any task:

| AI can take on | You keep |
|---|---|
| The blank page and first draft | The decision about what to say |
| Rewording and restructuring | Checking facts, names, figures, dates |
| Listing options | Choosing between them |
| Summarising what was said | Deciding what matters and who needs it |

When you are unsure, ask: "If this output were wrong, would I notice?" If the honest answer is no, do not rely on it for that task yet.

## Try it now

Open the practice pad and run this prompt, changing the parts in brackets.

\`\`\`try
I work as [YOUR ROLE] in [YOUR SECTOR]. List ten tasks I do regularly that involve writing, summarising or organising information. For each one, say in one line whether an AI assistant could help with a first draft, and one thing I would still need to check myself.
\`\`\`

Read the list with a critical eye. You are done when you have marked at least two tasks you want to try with AI this week, and at least one where you disagree with the tool about what needs checking. That disagreement is your expertise at work.`,
        microCheck: [
          {
            question:
              "A finance manager asks an AI assistant for the current VAT threshold and gets a confident answer. What is the sensible next step?",
            options: [
              "Check the figure against an official source before using it",
              "Use it, since confident answers are usually the correct ones",
              "Ask the assistant again and use it if the answer matches",
              "Use it in internal notes only, where errors matter less",
            ],
            correctIndex: 0,
            explanation:
              "Current figures are exactly the kind of fact an assistant can get confidently wrong. Asking twice does not verify anything, because the same tool can repeat the same mistake.",
          },
          {
            question: "Which task is an AI assistant best suited to take on for an experienced professional?",
            options: [
              "Deciding whether a complaint should be escalated",
              "Turning rough bullet points into a first draft",
              "Confirming a client's history from memory",
              "Signing off a policy on behalf of the team",
            ],
            correctIndex: 1,
            explanation:
              "Drafting from notes is a language task, where these tools are strong. Escalation decisions, client history and sign-off all depend on judgement, context or accountability the tool does not have.",
          },
          {
            question: "Why does the lesson argue that professional expertise matters more once AI is in use?",
            options: [
              "Because AI tools are banned in most regulated professions",
              "Because experts type faster and so write better prompts",
              "Because judging and correcting output becomes the key skill",
              "Because AI only works properly with specialist vocabulary",
            ],
            correctIndex: 2,
            explanation:
              "When drafting becomes cheap, value moves to knowing what good looks like and spotting what is wrong. That is what years of experience give you, not typing speed or vocabulary.",
          },
          {
            question: "What is a 'hallucination' in the context of AI assistants?",
            options: [
              "A deliberate lie the tool tells to please the user",
              "A plausible answer that is made up and not true",
              "A reply that is correct but badly formatted",
              "A security fault that leaks previous chats",
            ],
            correctIndex: 1,
            explanation:
              "A hallucination is fluent, plausible output that is simply wrong or invented. It is not deliberate; the tool predicts likely text and sometimes that text is false.",
          },
          {
            question: "A useful question to ask before relying on AI output for a task is:",
            options: [
              "Would I notice if this output were wrong?",
              "Did the tool answer quickly and clearly?",
              "Is the output longer than I would write?",
              "Has a colleague used this tool before?",
            ],
            correctIndex: 0,
            explanation:
              "If you could not spot an error, you cannot safely rely on the output for that task. Speed, length and a colleague's use tell you nothing about whether this particular answer is right.",
          },
        ],
      },
      {
        title: "The fears, honestly",
        objective:
          "Name your own concerns about AI at work and choose a practical response to each one.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## It is normal to feel uneasy

Many capable professionals feel a knot in the stomach when AI comes up in a meeting. Some worry about their job. Some worry about looking foolish in front of younger colleagues. Some have heard stories about errors or leaks. These are reasonable concerns, and pretending they are not there does not make them go away.

This lesson takes five common fears one at a time: what is true about each, and what you can actually do.

## Fear 1: "AI will take my job"

**What is true:** AI will change many roles, and some tasks you do now will be done faster or differently. Nobody can honestly promise what your field will look like in ten years.

**What is also true:** most professional roles are bundles of many tasks, and a lot of them rely on trust, judgement, relationships and accountability. Those are hard to hand to software. The more likely change in the near term is that people who use AI well take on more, and more interesting, work than people who avoid it.

**What to do:** list the tasks in your week. Mark the ones that are mainly producing routine text. Those are where AI will help first, and where learning it now gives you time back for the parts of the job only you can do.

## Fear 2: "I will look foolish"

**What is true:** everyone starts as a beginner, including the colleague who seems to know it all. Early prompts are often clumsy. That is fine.

**What to do:** practise privately first, on low-stakes tasks. You do not need to show anyone your first attempts. When you do share, share the result and what you learned ("I tried this for meeting notes and it saved me twenty minutes, but I had to fix the action owners"). That is not foolish. That is leadership.

## Fear 3: "It will make mistakes and I will be blamed"

**What is true:** it will make mistakes. If you send unchecked AI output, the mistake is yours, just as it would be if you sent an unchecked draft from a junior colleague.

**What to do:** adopt one firm habit: **nothing goes out unchecked**. Check names, numbers, dates, promises and anything that sounds like a fact. Use AI for drafts, not final answers, until you know where it is reliable for your work.

## Fear 4: "I might leak confidential information"

**What is true:** this is the most serious risk for most professionals. Pasting client, patient, pupil, employee or case details into a tool your organisation has not approved can breach your policy, your professional code and data protection law.

**What to do:**

- Find out which AI tools your organisation has approved, and on what terms.
- **Never paste confidential or personal data into an unapproved tool.** When in doubt, leave it out.
- Practise with made-up or anonymised examples: "Client A", "a patient in their 60s", "a supplier in the north".
- If there is no policy yet, ask your manager or IT. You are probably not the only one wondering.

## Fear 5: "I do not have time to learn this"

**What is true:** you are busy, and courses that promise to transform your life in a weekend rarely deliver.

**What to do:** start with fifteen minutes a day on tasks you were going to do anyway. Lesson 4 in this module shows you how. The goal is not to find extra time; it is to make the time you already spend go further.

## A way to talk about it at work

If your team is uneasy too, you can open the conversation without hype:

> "I have been trying AI on a few routine tasks. It helps with first drafts and summaries, but it needs checking and we need to be careful with client data. Could we agree which tools we are allowed to use?"

That one sentence shows curiosity, care and good judgement. It is the tone this whole course aims for.

## Try it now

Run this prompt in the practice pad. Keep it general: do not include confidential details about your workplace.

\`\`\`try
I am an experienced [YOUR ROLE] and I feel [NERVOUS / SCEPTICAL / BEHIND] about using AI at work. My biggest worry is [YOUR WORRY]. Without hype, give me three practical, low-risk steps I could take this week to test whether AI is useful for my work, and one question I should ask my organisation first.
\`\`\`

You are done when you have written down your top concern, one step you will take this week, and the one question you will put to your manager or IT team.`,
        microCheck: [
          {
            question:
              "A social worker wants to test AI for summarising case notes but her council has not approved any AI tool. What should she do first?",
            options: [
              "Use a free tool but remove surnames from the notes",
              "First ask her manager or IT which tools are approved",
              "Use a personal account so the council is not involved",
              "Paste short extracts only, as they carry less risk",
            ],
            correctIndex: 1,
            explanation:
              "Case notes are highly sensitive, and removing surnames rarely makes them anonymous. Using a personal account or short extracts still moves confidential data into an unapproved tool.",
          },
          {
            question: "You used AI to draft a client letter and it contained a wrong date that you did not spot. Who is responsible?",
            options: [
              "The AI provider, as the tool produced the error",
              "Nobody, as AI errors are widely accepted now",
              "You, as the person who chose to send the letter",
              "Your IT team, as they allowed the tool to be used",
            ],
            correctIndex: 2,
            explanation:
              "Whoever sends the work owns it, just as with a draft from a junior colleague. That is why the habit of checking names, numbers, dates and promises matters so much.",
          },
          {
            question: "Which approach best addresses the fear of looking foolish while learning AI?",
            options: [
              "Wait until you are an expert before trying it",
              "Only use AI when a younger colleague is present",
              "Practise privately on low-stakes tasks first",
              "Avoid telling anyone that you use AI at all",
            ],
            correctIndex: 2,
            explanation:
              "Private practice on low-risk tasks lets you make clumsy early attempts without an audience. Hiding AI use altogether can be a problem where policy expects transparency.",
          },
          {
            question: "What is the most likely near-term effect of AI on most experienced professional roles?",
            options: [
              "Whole professions disappearing within a year or two",
              "Some tasks changing while judgement stays central",
              "No change at all for roles that need a licence",
              "Only junior staff being affected by AI tools",
            ],
            correctIndex: 1,
            explanation:
              "Roles are bundles of tasks. Routine text-heavy tasks change first, while trust, judgement and accountability remain with people. Nobody can promise no change, including in licensed roles.",
          },
        ],
      },
      {
        title: "Your first three wins in 30 minutes",
        objective:
          "Complete three real work tasks with an AI assistant: an email, a set of meeting notes and a first draft.",
        durationMinutes: 28,
        contentType: "article",
        bodyMd: `## Why start with quick wins

Confidence comes from doing, not reading. In this lesson you will use AI on three tasks almost every professional does: writing an email, tidying meeting notes and starting a document. Each takes about ten minutes. By the end you will have felt what the tool is good at and where you had to step in.

Use the practice pad under this lesson, or an AI tool your organisation has approved. **Do not paste confidential or personal information into any tool that is not approved.** For practice, change names and details, or invent a realistic example.

## The one prompt pattern you need

Good prompts give the assistant what a new colleague would need:

1. **Role and context**: who you are and the situation.
2. **Task**: exactly what you want produced.
3. **Details**: the facts, notes or points to include.
4. **Format and tone**: length, style, audience.

You do not need to memorise this. Just notice that each prompt below follows it.

## Win 1: an email you have been putting off

Most of us have an email we have been avoiding because it is awkward: declining a request, chasing a late reply, or explaining a delay.

\`\`\`try
I am a [YOUR ROLE]. Write a short, polite email to [WHO: e.g. a supplier / a parent / a colleague in another team] about [SITUATION]. The key points are: [POINT 1], [POINT 2], [POINT 3]. Tone: [warm but firm / friendly / formal]. Keep it under 150 words and end with a clear next step.
\`\`\`

**Check before you would send it:** Are the facts right? Does it promise anything you cannot deliver? Does it sound like you? Edit it until it does.

## Win 2: meeting notes into actions

Take the rough notes from a recent meeting (anonymised if needed) and let the assistant organise them.

\`\`\`try
Below are my rough notes from a meeting about [TOPIC]. Turn them into: (1) a three-line summary, (2) decisions made, (3) action items as a table with columns Action, Owner, Deadline. If an owner or deadline is not in the notes, write "Not stated" rather than guessing.

Notes:
[PASTE YOUR NOTES]
\`\`\`

The line about "Not stated" matters. Without it, assistants sometimes fill gaps with plausible guesses. **Check** that every action and owner matches what actually happened. You were in the room; the tool was not.

## Win 3: a first draft of something longer

Pick a document you need to write soon: a short report, a procedure, a proposal, a newsletter item, a lesson outline.

\`\`\`try
I need to write a [TYPE OF DOCUMENT] for [AUDIENCE] about [TOPIC]. The purpose is [PURPOSE]. Key points I want to cover: [POINTS]. First, suggest an outline with headings. Then write a first draft of the first two sections only, in plain English, about 300 words.
\`\`\`

Asking for an outline first gives you a chance to reorder or cut sections before the tool writes too much. Treat the draft as raw material. You will probably keep the structure and rewrite a good share of the wording.

## What to notice

After the three tasks, reflect for a minute:

- **Where did it save time?** Often the biggest saving is simply not starting from a blank page.
- **Where did you have to correct it?** Facts, tone, local knowledge and missing context are the usual suspects.
- **What would you add to the prompt next time?** Perhaps your audience, a word limit, or an example of your own style.

That third question is how you get better. Each correction you make by hand is a hint about what to put in the prompt next time.

## If the output is disappointing

It happens. Before giving up, try one follow-up message:

- "Make it shorter and less formal."
- "You have missed that [FACT]. Please revise."
- "Write it as if to someone who is upset and needs reassurance."

A conversation usually gets a better result than a single attempt. You are directing the work, not accepting whatever comes back first.

## Try it now

Complete all three wins above using real (or realistically invented, non-confidential) material from your own work.

You are done when you have one email you would be happy to send after your edits, one set of notes with an action table you have checked, and one outline plus two draft sections. Write one sentence for each noting what you had to fix. Keep those sentences; you will use them in Module 3.`,
        microCheck: [
          {
            question:
              "Why does the meeting notes prompt ask the assistant to write 'Not stated' for missing owners?",
            options: [
              "To stop it filling gaps with plausible guesses",
              "To make the table shorter and easier to read",
              "To prove to colleagues that AI was not involved",
              "To force the tool to ask follow-up questions",
            ],
            correctIndex: 0,
            explanation:
              "Assistants tend to fill gaps with likely-sounding content. Asking for 'Not stated' makes missing information visible so you can fill it from what really happened.",
          },
          {
            question: "An AI-drafted email reads well but promises a response 'within 24 hours'. Your team takes three days. What should you do?",
            options: [
              "Send it, since clients rarely hold you to timescales",
              "Edit the promise to match what your team can deliver",
              "Ask the assistant whether 24 hours is realistic",
              "Delete the timescale and send without any next step",
            ],
            correctIndex: 1,
            explanation:
              "You know your team's real capacity and the tool does not. Correcting the promise keeps the clear next step while making it honest. The assistant cannot judge your workload.",
          },
          {
            question: "What is the benefit of asking for an outline before a full draft?",
            options: [
              "Outlines use less of the tool's daily allowance",
              "It lets you shape the structure before much is written",
              "Assistants cannot write full drafts without one",
              "It means the final draft will not need checking",
            ],
            correctIndex: 1,
            explanation:
              "Reviewing the outline first lets you reorder, cut or add sections cheaply. Every draft still needs checking, and assistants can write drafts without outlines, just less usefully.",
          },
          {
            question: "Your first AI draft is flat and generic. What is the most useful next move?",
            options: [
              "Give up, as the tool is not suited to your field",
              "Start a brand new chat with exactly the same prompt",
              "Reply with specific feedback on what to change",
              "Accept it, since generic text is safer to send",
            ],
            correctIndex: 2,
            explanation:
              "A follow-up with specific direction (audience, tone, missing facts) usually improves the result. Repeating the same prompt tends to give a similar generic answer.",
          },
          {
            question: "You want to practise with a real complaint letter from a customer. Your tool is not approved. What is the right approach?",
            options: [
              "Paste it in, since complaints are not confidential",
              "Invent a realistic version with no real details",
              "Paste it but ask the tool to forget it afterwards",
              "Remove the customer's name and paste the rest",
            ],
            correctIndex: 1,
            explanation:
              "An invented example lets you practise safely. Asking a tool to forget does not control how data is stored, and removing a name often leaves enough detail to identify someone.",
          },
        ],
      },
      {
        title: "The 15-minute daily practice habit",
        objective:
          "Plan a 15-minute daily AI practice routine built around tasks you already do.",
        durationMinutes: 20,
        contentType: "article",
        bodyMd: `## Fluency comes from repetition, not courses

Think about how you became good at your job. It was not one training day. It was hundreds of small repetitions, each with a little feedback. AI fluency works the same way. A short, regular habit beats an occasional long session, because you build a feel for what the tool does well and what to watch for.

The aim of this lesson is a routine you can keep for a month: fifteen minutes a day, on real work, with a tiny bit of reflection.

## The shape of the fifteen minutes

**Minutes 1 to 2: pick one real task.** Something you were going to do today anyway. A reply, a summary, a checklist, a paragraph for a report. Choose low-stakes tasks at first.

**Minutes 3 to 10: do it with AI.** Write a prompt using the pattern from the last lesson (context, task, details, format). Review the output. Give at least one follow-up instruction to improve it.

**Minutes 11 to 13: check and finish.** Correct facts, tone and anything specific to your organisation. Decide whether you would use the result.

**Minutes 14 to 15: log it.** Write one line in a simple log.

## A practice log you can copy

Keep this in a notebook, a document or a spreadsheet:

| Date | Task | Saved time? (Y/N/some) | What I fixed | Prompt tweak for next time |
|---|---|---|---|---|
| | | | | |

After two weeks, read back through it. Patterns jump out: the tasks where AI reliably helps, the ones where it wastes your time, and the corrections you keep making. Those corrections become instructions you add to your prompts, which is the start of the prompt library you build in Module 3.

## A month of ideas

If you are stuck for a task, rotate through these:

- **Week 1: writing.** Draft replies, soften a blunt message, shorten a long email.
- **Week 2: summarising.** Summarise a report, a policy update or your own meeting notes.
- **Week 3: thinking.** Ask for questions you have not considered, counter-arguments, or a checklist for a process.
- **Week 4: learning.** Ask it to explain a term, a regulation or a technique from your field in plain English, then check the explanation against a trusted source.

Week 4 is a good test of your expertise. Ask it about something you know well. You will quickly see where it is accurate, where it is vague and where it is wrong, which tells you how much to trust it in areas you know less well.

## Keep it safe and sustainable

- **Same rule every day:** no confidential or personal data in tools your organisation has not approved.
- **Anchor it to an existing routine.** First thing after checking email, or straight after lunch. Habits stick better when attached to something you already do.
- **Do not chase every new tool.** One approved assistant, used daily, will teach you more than ten tried once.
- **Allow yourself a "no".** If a task goes worse with AI, note it and move on. Knowing where not to use it is part of fluency.

## A prompt to plan your month

\`\`\`try
I am a [YOUR ROLE] and I want to practise using AI for 15 minutes a day for four weeks. Here are tasks I do regularly: [LIST 5 TO 8 TASKS]. Build me a simple four-week plan with one low-risk task per working day, grouped by week into writing, summarising, thinking and learning. Keep each day to one line.
\`\`\`

Review the plan. Remove anything that would need confidential data in an unapproved tool, and swap in tasks that matter more to you.

## Try it now

Run the planning prompt above, edit the plan until it fits your real week, and put the first five sessions in your calendar as fifteen-minute appointments. Then set up your practice log.

You are done when the first five sessions are booked and your log has its first entry, from a task you do today.`,
        microCheck: [
          {
            question: "Why does the lesson recommend fifteen minutes a day rather than one long session a month?",
            options: [
              "Most AI tools limit how long a single session can last",
              "Short, regular practice builds a feel for the tool faster",
              "Longer sessions tend to use up more of the tool's working memory",
              "Managers are more likely to approve very short sessions",
            ],
            correctIndex: 1,
            explanation:
              "Fluency comes from many small repetitions with feedback, as with any professional skill. It is not about session limits or approval; it is about building judgement through regular use.",
          },
          {
            question: "After two weeks your log shows you keep correcting the same thing: the tool writes too formally. What should you do?",
            options: [
              "Switch to a different AI tool straight away",
              "Stop using AI for writing tasks altogether",
              "Add a tone instruction to your usual prompt",
              "Keep correcting it by hand each time you use it",
            ],
            correctIndex: 2,
            explanation:
              "A repeated correction is a signal to add an instruction to the prompt. That is how a log turns into better prompts and, later, a reusable prompt library.",
          },
          {
            question: "Why is asking the AI about a topic you know well a useful exercise?",
            options: [
              "It shows you how far to trust it in areas you know less",
              "It trains the tool to give better answers to everybody",
              "It is the quickest way to check your own knowledge",
              "It proves to your colleagues that you are the real expert",
            ],
            correctIndex: 0,
            explanation:
              "Testing it where you can judge the answer reveals its typical errors. Your chats do not generally retrain the model for everyone, and the point is calibration, not proving anything.",
          },
          {
            question: "Which task is the best choice for your first week of daily practice?",
            options: [
              "Drafting a disciplinary letter to a named employee",
              "Summarising a patient's full medical history",
              "Shortening a long internal email you wrote",
              "Approving a supplier contract on your behalf",
            ],
            correctIndex: 2,
            explanation:
              "Shortening your own internal email is low-risk and involves no sensitive data. The other tasks involve personal data, high stakes or decisions that must stay with you.",
          },
        ],
      },
    ],
    quiz: [
      {
        question:
          "A legal secretary is asked by a partner to 'use AI' to check whether a limitation period has expired on a matter. What is the best response?",
        options: [
          "Ask the AI and report its answer, noting that AI was used",
          "Use AI to draft questions, but check the law in a proper source",
          "Refuse outright, since AI must never be used in legal work at all",
          "Ask two different AI tools and go with the majority answer",
        ],
        correctIndex: 1,
        explanation:
          "Legal deadlines are facts with serious consequences and must be checked in authoritative sources. AI can help frame the questions, but agreement between tools is not verification.",
      },
      {
        question: "Which of these tasks plays to the strengths of a general AI assistant?",
        options: [
          "Choosing which job applicant should get the offer",
          "Rewriting a dense policy paragraph in plain English",
          "Confirming this morning's exchange rate for an invoice",
          "Recalling what a client said in last year's meeting",
        ],
        correctIndex: 1,
        explanation:
          "Rewriting for clarity is a language task. Hiring decisions need judgement and accountability, live figures need a reliable source, and the tool has no memory of your past meetings.",
      },
      {
        question:
          "A school business manager wants to try AI on a spreadsheet of pupil free-meal eligibility. The school has no AI policy yet. What should she do?",
        options: [
          "Use a free tool but only upload half of the rows",
          "Ask the head or IT to confirm an approved tool first",
          "Use the tool at home so it is outside school systems",
          "Rename the columns so the data looks less sensitive",
        ],
        correctIndex: 1,
        explanation:
          "Eligibility data about children is sensitive personal data. Partial uploads, home use and renaming columns all still move it into an unapproved tool. Confirm what is allowed first.",
      },
      {
        question: "A colleague says, 'If AI can write reports, experience does not matter any more.' What is the strongest reply?",
        options: [
          "Experience matters because AI cannot write in formal English",
          "Experience lets you see what the report gets wrong or leaves out",
          "Experience matters because AI tools are far too costly to use daily",
          "Experience only matters in fields where AI is not permitted",
        ],
        correctIndex: 1,
        explanation:
          "When drafting is cheap, the valuable skill is judging and correcting the draft. AI writes formal English well, and cost or permission is not the reason expertise matters.",
      },
      {
        question:
          "An HR adviser sends an AI-drafted letter that quotes the wrong notice period. The employee complains. What does this show?",
        options: [
          "AI tools are not yet suitable for any HR letters",
          "The sender owns the output and must check the facts",
          "The employee should have checked the contract first",
          "Letters drafted by AI should be clearly labelled as such",
        ],
        correctIndex: 1,
        explanation:
          "Whoever sends the work is responsible for it. AI can still help with HR drafts, but facts like notice periods must be checked against the contract and policy before anything goes out.",
      },
      {
        question: "You ask an assistant to turn meeting notes into actions. Which instruction best reduces the risk of invented owners?",
        options: [
          "Ask it to be accurate and to double-check its work",
          "Tell it to write 'Not stated' when owners are missing",
          "Ask it to assign each action to the most senior person",
          "Ask for the actions as a numbered list, not a table",
        ],
        correctIndex: 1,
        explanation:
          "Telling the tool what to do when information is missing stops it filling the gap with a guess. General requests to 'be accurate' do not change that tendency much.",
      },
      {
        question:
          "A sales manager is nervous about looking out of touch with AI in front of his team. Which first step fits the course's advice?",
        options: [
          "Announce a full AI rollout to show his confidence",
          "Practise privately, then share one honest result",
          "Leave AI to the younger members of the team",
          "Wait until the company buys an enterprise tool",
        ],
        correctIndex: 1,
        explanation:
          "Private practice builds confidence without an audience, and sharing a real result with its limits models good judgement. A big announcement before you have experience risks overpromising.",
      },
      {
        question: "Your practice log shows AI made one task slower three days running. What is the sensible conclusion?",
        options: [
          "You are using AI wrongly and should take a longer course",
          "Note it as a task where AI is not worth it for now",
          "Keep going, as it will speed up after about a month",
          "Report the tool to IT as faulty and stop using it",
        ],
        correctIndex: 1,
        explanation:
          "Knowing where not to use AI is part of fluency. A log exists to reveal these patterns. There is no guarantee a poor fit will improve with repetition alone.",
      },
      {
        question:
          "A housing officer wants to practise summarising tenancy complaints with AI. Which approach is safest while she is learning?",
        options: [
          "Use real complaints but remove the tenants' names",
          "Write an invented complaint with realistic details",
          "Use real complaints in her personal AI account",
          "Use real complaints but delete the chat afterwards",
        ],
        correctIndex: 1,
        explanation:
          "An invented complaint gives realistic practice with no personal data. Removing names often leaves identifying details, and deleting a chat or using a personal account does not make the use approved.",
      },
      {
        question: "Which daily habit is most likely to build lasting AI fluency?",
        options: [
          "Trying a different new AI tool every day",
          "Using one approved tool on real tasks daily",
          "Reading about AI news for fifteen minutes daily",
          "Saving prompts from social media each day",
        ],
        correctIndex: 1,
        explanation:
          "Regular use of one tool on your own work, with reflection, builds judgement fastest. Hopping between tools or reading about AI gives little hands-on feedback.",
      },
      {
        question: "An assistant gives a vague, generic draft of a funding bid section. What is the best next step?",
        options: [
          "Conclude that AI cannot handle funding bids",
          "Reply with the funder's criteria and your key facts",
          "Ask the same question again in a fresh chat",
          "Submit it, as funders often expect generic language",
        ],
        correctIndex: 1,
        explanation:
          "Generic output usually means missing context. Giving the funder's criteria and your specific facts in a follow-up gives the tool what it needs. Repeating the same prompt rarely helps.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 2
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "The Key AI Tools to Learn",
    summary:
      "Get to know the main categories of AI tool a professional needs: general assistants, AI built into the software you already use, research and analysis tools, and tools for visuals, presentations and simple automation. Learn how to set each up sensibly and safely.",
    lessons: [
      {
        title: "General assistants: your all-purpose AI colleague",
        objective:
          "Set up a general AI assistant with custom instructions, a project and sensible data settings.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## What a general assistant is

A **general assistant** is a chat tool where you type a request and get a reply: for example ChatGPT, Claude, Gemini or Microsoft Copilot. At the time of writing (September 2026) these tools can all draft and rewrite text, summarise documents you upload, answer questions, and often search the web. Their features and plans change often, so check the current details and, above all, **check your organisation's policy** on which one you may use for work.

If you only learn one AI tool well, make it the general assistant your organisation approves. It is the Swiss Army knife: not always the best tool for a job, but useful for almost everything.

## What to use it for

Good everyday uses for professionals:

- Drafting and redrafting emails, letters and documents.
- Summarising long material you are allowed to share with it.
- Thinking aloud: "What questions should I ask before this meeting?"
- Explaining something unfamiliar in plain English.
- Turning messy notes into structured lists, tables or checklists.
- Role-play: practising a difficult conversation or an interview.

Less good uses: looking up precise current facts without checking, calculations you cannot verify, and anything that needs data you are not permitted to share.

## Set it up once: custom instructions

Most assistants let you save **custom instructions** (sometimes called personalisation, preferences or a profile): background the tool reads before every conversation. This saves you repeating yourself and makes the answers fit your work far better.

A good set of instructions covers who you are, how you like answers and what to avoid. For example:

> I am a practice manager in a GP surgery in England. Write in UK English, plain and friendly, no jargon. Keep answers short unless I ask for detail. When you are unsure of a fact, say so. Never invent policy or legal requirements; tell me to check the official source.

Keep instructions about you and your preferences. **Do not put confidential information in them.**

\`\`\`try
Help me write custom instructions for an AI assistant. I am a [YOUR ROLE] in [YOUR SECTOR, COUNTRY]. I usually use AI for [TASKS]. My preferred style is [e.g. concise, UK English, warm but professional]. Draft instructions of no more than 120 words covering who I am, how I want answers, and what the assistant should do when it is unsure.
\`\`\`

## Projects: a folder with memory

Many assistants now offer **projects** (names vary: projects, spaces, notebooks, gems). A project groups related chats with shared instructions and reference files. For example, you might create a project for "Monthly board report" with your report template and style notes attached, so every chat inside it starts with that context.

Good candidates for a project:

- A recurring piece of work (a monthly report, a newsletter, a training course).
- A body of approved reference material (your organisation's public style guide or published policies).
- A long-running piece of work where you want the history kept together.

Only upload files you are permitted to share with that tool.

## Data settings: know where your words go

Before you use any assistant for work, find out:

- **Is it an approved work account or a personal one?** Business and enterprise plans typically come with stronger data protections and contractual terms than personal accounts. Your organisation will know which terms apply.
- **Is your content used to train the provider's models?** Many consumer tools have a setting for this. Check it and choose deliberately.
- **How long is chat history kept, and who can see it?** In a work account, administrators may have access.
- **What about memory?** Some assistants remember facts about you across chats. Review what it has stored and switch it off if that is not appropriate.

The simplest rule still holds: **never paste confidential, client or personal data into a tool your organisation has not approved**, whatever the settings say.

## Try it now

In your approved assistant (or the practice pad), use the prompt above to draft your custom instructions, edit them until they sound like you, and save them in the tool's settings. Then find the data or privacy settings and note what they say about training, history and memory.

You are done when your instructions are saved, and you can answer three questions in one line each: is this a work or personal account, is my content used for training, and is memory on or off?`,
        microCheck: [
          {
            question: "Which is the best thing to include in an assistant's custom instructions?",
            options: [
              "Your role, preferred style and what to do when unsure",
              "Your current client list so it has some useful background",
              "Your login details so it can reach your work systems",
              "A full copy of your employment contract for context",
            ],
            correctIndex: 0,
            explanation:
              "Custom instructions should describe you and your preferences. Client lists, credentials and contracts are confidential and should never be stored there.",
          },
          {
            question: "A trainer runs the same monthly induction course. How could a project help?",
            options: [
              "It would deliver the course to new starters for her",
              "It keeps her course template and notes in one place",
              "It stops the assistant from making any mistakes",
              "It lets her share the chats with every new starter",
            ],
            correctIndex: 1,
            explanation:
              "A project groups related chats with shared instructions and reference files, so each session starts with the right context. It does not remove the need to check the output.",
          },
          {
            question: "Why check whether your assistant account is a work or a personal one?",
            options: [
              "Personal accounts are always slower than work accounts",
              "Work accounts cannot be used to draft any emails at all",
              "Data protections and terms can differ between the two",
              "Personal accounts cannot save any custom instructions",
            ],
            correctIndex: 2,
            explanation:
              "Business plans often carry different data protections and contractual terms from personal ones. That affects what you may safely use the tool for at work.",
          },
          {
            question: "An assistant's memory feature has stored a colleague's health condition you mentioned. What should you do?",
            options: [
              "Leave it, as memory makes future answers better",
              "Delete that memory and review what else is stored",
              "Ask the assistant to keep it private in future",
              "Switch to a new chat so the memory is not used",
            ],
            correctIndex: 1,
            explanation:
              "Health information about a colleague is sensitive personal data. Remove it and review stored memories. Asking the tool to keep it private or opening a new chat does not delete it.",
          },
        ],
      },
      {
        title: "AI inside the tools you already use",
        objective:
          "Identify the AI features in your email, office, meeting and document tools and use them within policy.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## AI is arriving where you already work

You may not need a new app at all. Much of the AI most professionals will use is being added to software they already have: office suites, email, video meetings and document readers. At the time of writing (September 2026), examples include Microsoft 365 Copilot and Gemini in Google Workspace, AI companions in meeting platforms such as Teams, Zoom and Google Meet, and AI assistants in PDF readers such as Adobe Acrobat. Features, names and licensing change often. Check what your organisation has switched on and what its policy allows.

The big advantage of built-in AI is **context**. A tool inside your email or documents can often work with the file or thread in front of you, under the same security and permissions your organisation already manages.

## Office suites: documents, spreadsheets and slides

In word processors, look for features that:

- Draft a document from a short brief or from other files.
- Rewrite a selected paragraph (shorter, more formal, simpler).
- Summarise a long document or produce key points.

In spreadsheets, look for help writing formulas, explaining what an existing formula does, and suggesting charts or summaries. Always check a formula on a few rows you can work out by hand.

In presentation tools, features can turn a document into a draft slide deck. You will look at this more in Lesson 4.

## Email

Email tools increasingly offer to summarise long threads, suggest replies and help you draft. They can be a real time saver for busy inboxes. Two cautions:

- **Suggested replies sound plausible but can agree to things.** Read every line before sending.
- **Summaries can miss the one line that matters**, such as a changed deadline buried in a long thread. For anything important, read the original.

## Meetings: note-takers and consent

AI meeting assistants can transcribe a call, produce a summary and list action items. Used well, they free you to listen rather than scribble.

They also raise real issues. Before you switch one on:

- **Check policy.** Some organisations restrict transcription or recording, or allow it only for certain meeting types.
- **Tell people and get consent.** Participants should know a transcript or recording is being made. Depending on where you are, the law may require it. Many platforms show a notice, but saying it out loud is courteous and clear.
- **Think about the meeting type.** Grievance hearings, clinical or case discussions, legal advice and sensitive negotiations may not be appropriate to transcribe at all, or only under strict rules.
- **Check the output.** Transcripts mishear names and technical terms. Summaries can attribute a comment to the wrong person or turn a suggestion into a decision.
- **Beware uninvited bots.** Some third-party note-takers join meetings automatically from someone's calendar. If an unknown note-taker appears, it is fine to ask who it belongs to.

A short script helps:

> "I would like to use the AI note-taker to capture actions. Is everyone comfortable with that? I will check the notes before sharing."

## Document tools

AI in PDF readers and document systems can summarise a long report, answer questions about it and point you to the relevant pages. That is handy for long tenders, policy consultations or technical manuals. Treat answers as pointers: go to the cited page and read it yourself before relying on it.

## Getting the most from built-in AI

\`\`\`try
I have access to AI features in [YOUR EMAIL / OFFICE SUITE / MEETING TOOL]. My most time-consuming routine tasks are [LIST 3 TO 5]. For each task, suggest which kind of built-in AI feature might help (drafting, summarising, formulas, meeting notes), what I would need to check in the output, and any consent or confidentiality issue to consider.
\`\`\`

## Try it now

Find out which AI features are switched on in the tools you use every day. Look for an AI or assistant icon in your email, word processor and meeting app, or ask IT. Then use one built-in feature on a real, low-risk task: summarise a long internal document or thread you are allowed to process, or ask for help with a spreadsheet formula.

You are done when you have listed the AI features available to you, used one on a real task, and written down one thing you had to check or correct.`,
        microCheck: [
          {
            question:
              "A manager wants an AI note-taker in a disciplinary hearing to save time. What is the most appropriate response?",
            options: [
              "Use it, as long as the summary is checked later",
              "Check policy first, as this meeting type may be excluded",
              "Use it, but only share the summary with HR afterwards",
              "Turn it on quietly so the employee is not distracted",
            ],
            correctIndex: 1,
            explanation:
              "Disciplinary hearings are sensitive and often have specific rules on recording. Policy and consent come first; checking or restricting the summary afterwards does not fix a problem at the start.",
          },
          {
            question: "Why read the original email thread even when an AI summary is available?",
            options: [
              "Summaries are always longer than the original thread",
              "A summary can miss a single line that really matters",
              "Email summaries break data protection law in all cases",
              "The original thread is usually quicker to read in full",
            ],
            correctIndex: 1,
            explanation:
              "A summary compresses, and a changed deadline or condition can be lost. For anything important, the original is the record you rely on.",
          },
          {
            question: "An unfamiliar AI note-taker joins your client call. What is a reasonable step?",
            options: [
              "Ignore it, as note-takers are now standard practice",
              "End the call at once and report a security breach",
              "Ask who it belongs to before discussing anything",
              "Carry on but avoid speaking during the whole call",
            ],
            correctIndex: 2,
            explanation:
              "Some note-takers join automatically from a participant's calendar. Asking who it belongs to is proportionate and lets everyone agree whether it should stay.",
          },
          {
            question: "An AI feature writes a spreadsheet formula to total overtime. What should you do before relying on it?",
            options: [
              "Test it on a few rows you can work out by hand",
              "Trust it, as formulas are either right or wrong",
              "Ask the feature to confirm the formula is right",
              "Copy it into every sheet so errors are spotted",
            ],
            correctIndex: 0,
            explanation:
              "A formula can run without errors and still calculate the wrong thing. Checking a few rows by hand is quick and catches most mistakes; asking the tool to confirm itself is not a check.",
          },
          {
            question: "What is the main advantage of AI built into your existing work tools?",
            options: [
              "It never needs checking because it is licensed",
              "It works with your files under existing controls",
              "It is always more accurate than a chat assistant",
              "It can be used without any policy restrictions",
            ],
            correctIndex: 1,
            explanation:
              "Built-in AI can use the document or thread in front of you, within the security and permissions your organisation manages. It still needs checking and is still subject to policy.",
          },
        ],
      },
      {
        title: "Research and analysis tools",
        objective:
          "Use AI to research a question and analyse documents or data, then verify the sources behind the answer.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## From "search" to "answer with sources"

Traditional search gives you a list of links. AI research tools read sources for you and give an answer with **citations**: links to the pages they drew on. At the time of writing (September 2026), examples include Perplexity, the search modes in general assistants such as ChatGPT, Claude, Gemini and Copilot, and "deep research" features that spend several minutes reading many sources and produce a longer report. Check what your organisation allows and what the current features are.

These tools can save hours on background reading. They also create a new trap: an answer that **looks** well sourced but is not. Your job is to check.

## Asking good research questions

Specific questions get better answers. Compare:

- Weak: "Tell me about apprenticeships."
- Better: "What are the main funding rules for apprenticeship training for small employers in England? Use official government sources where possible, and flag anything that may have changed recently."

Helpful additions:

- **Say which sources you trust**: official, regulator, professional body, peer-reviewed.
- **Ask for dates**: "Give the publication date for each source."
- **Ask for uncertainty**: "Say where sources disagree or where you are unsure."

\`\`\`try
I am a [YOUR ROLE] researching [QUESTION]. Give me a short overview in plain English, based on official or professional sources where possible. For each key claim, name the source and its date. Finish with a list of what I should verify directly and any points where sources disagree.
\`\`\`

(The practice pad may not browse the web. If so, use it to shape your question, then run it in an approved research tool.)

## Checking sources: the four checks

For any claim you will rely on or pass on:

1. **Open the link.** Does the page exist and is it what the citation says it is?
2. **Find the claim.** Is the specific statement actually on that page? AI tools sometimes cite a real page for something it does not say.
3. **Check the date and jurisdiction.** Is it current? Is it about your country or sector?
4. **Prefer the primary source.** A regulator's guidance beats a blog summarising it. A statute beats a news article about it.

If a claim fails any check, do not use it. This takes a few minutes and is the difference between research and rumour.

## Working with PDFs and long documents

Most assistants let you upload a document, where your organisation permits, and ask questions about it. This is excellent for long reports, tenders, consultation papers and manuals.

Useful prompts:

- "Summarise this document in ten bullet points for a busy manager."
- "What does this document say about [TOPIC]? Quote the relevant passages and give page numbers."
- "List every deadline and obligation in this document in a table."

Asking for **quotes and page numbers** makes checking fast: you go straight to the page. If the quote is not there, you have caught an error.

## Working with spreadsheets and data

Many assistants can analyse spreadsheets: describing what is in the data, calculating totals, spotting trends and drawing charts. Some write and run small programs behind the scenes to do the maths, which is usually more reliable than a calculation done "in its head".

Good habits:

- **Only upload data you are permitted to share** with that tool. Remove personal data unless the tool is approved for it.
- **Describe the data**: what each column means and any quirks ("blank means not applicable").
- **Ask it to show its working**: which columns and filters it used.
- **Spot-check**: work out one or two figures yourself and compare.

## Try it now

Choose a real question from your work that you would normally spend half an hour researching. Use the prompt above in an approved research tool. Then apply the four checks to the three claims you would rely on most.

You are done when you have a short answer, a note of which claims passed all four checks, and at least one claim you corrected, replaced with a primary source or dropped.`,
        microCheck: [
          {
            question: "An AI research tool cites a government page for a funding rule. What is the most important check?",
            options: [
              "Confirm the page looks like an official website",
              "Open the page and find that exact rule stated there",
              "Ask the tool whether it is confident in the citation",
              "Check the tool cited at least three separate sources",
            ],
            correctIndex: 1,
            explanation:
              "Tools sometimes cite a real page for something it does not actually say. Finding the claim on the page is the key check; confidence and number of citations do not prove it.",
          },
          {
            question: "Why ask for quotes and page numbers when questioning a long PDF?",
            options: [
              "It makes the tool read the document more slowly",
              "It lets you go straight to the text to check it",
              "It stops the tool from summarising the document",
              "It is required before the tool will open a PDF",
            ],
            correctIndex: 1,
            explanation:
              "Quotes with page numbers make verification quick. If the quoted passage is not on that page, you have caught an error before relying on it.",
          },
          {
            question: "An AI tool summarises a blog post about a new regulation. Which source should you rely on?",
            options: [
              "The blog, as it is written in plainer English",
              "The AI summary, as it has combined the sources",
              "The regulation or regulator's official guidance",
              "Whichever source was published most recently",
            ],
            correctIndex: 2,
            explanation:
              "Primary sources are the authority. A blog or AI summary may simplify or misstate the rule, and newer is not always more accurate.",
          },
          {
            question: "Before uploading a staff absence spreadsheet for analysis, what should you do?",
            options: [
              "Check the tool is approved and remove personal data",
              "Sort the rows so the tool can read them more easily",
              "Convert it to a PDF so that it cannot be edited",
              "Upload it in several parts to reduce the risk",
            ],
            correctIndex: 0,
            explanation:
              "Absence data is personal and often includes health information. Approval and data minimisation come first; splitting the upload or changing the format does not reduce the risk.",
          },
        ],
      },
      {
        title: "Visuals, presentations and simple automation",
        objective:
          "Create a visual or draft presentation with AI and decide when a simple automation needs IT involvement.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Beyond words

Once you are comfortable with text, three more areas are worth knowing: images and diagrams, presentations, and simple automation that connects apps. You do not need to master them all. Know what is possible, try one, and know when to ask for help.

At the time of writing (September 2026), examples in each area are given below. Products change quickly: check current features and your organisation's policy before using any of them for work.

## Visuals and diagrams

AI image tools, for example those built into general assistants, Canva or Adobe Firefly, can create illustrations from a description. For professional use, they are handy for:

- A simple illustration for an internal newsletter or training slide.
- Icons or backgrounds for a presentation.
- Rough concept images to discuss an idea.

Be careful with:

- **Accuracy.** Generated images of equipment, anatomy, maps or charts can look convincing and be wrong. Do not use them where accuracy matters.
- **People and likeness.** Do not generate images of real people, colleagues or clients.
- **Rights and policy.** Check your organisation's position on AI images in external material.

For **diagrams** (process flows, org charts, timelines), a useful trick is to ask a general assistant to produce the structure as a list or table, then build it in a diagram tool you already use. Some assistants can also draw simple diagrams directly.

## Presentations

Presentation tools with AI, for example Copilot in PowerPoint, Gemini in Google Slides, or tools such as Canva and Gamma, can turn a brief or a document into a draft deck. The result is usually a reasonable starting structure with generic wording and images.

A reliable approach:

1. **Get the story right first.** Ask a general assistant for a slide-by-slide outline: title, key message and supporting points for each slide.
2. **Edit the outline** until it says what you mean. This is where your expertise goes in.
3. **Then generate the slides** from your edited outline, and fix the design and wording.

\`\`\`try
I am presenting to [AUDIENCE] about [TOPIC] for [LENGTH] minutes. My goal is for them to [DESIRED OUTCOME]. Draft a slide-by-slide outline with no more than [NUMBER] slides. For each slide give a title that states the key message, three short supporting points, and a suggestion for a simple visual. Flag any point where I need to add real figures.
\`\`\`

## Simple automation: connecting apps

Automation tools, for example Microsoft Power Automate, Zapier or Make, connect apps so that one event triggers another action. Many now let you describe what you want in plain English, and some include AI steps (such as "summarise this email" or "sort this request into a category").

Examples of simple, useful automations:

- When a form is submitted, add a row to a spreadsheet and send a confirmation email.
- Every Friday, send a reminder to the team to update the tracker.
- When a file lands in a shared folder, notify the channel.

## When to ask IT

Automation acts on your behalf without you watching each step. That is its power and its risk. Involve IT, or whoever manages your systems, when an automation:

- Touches **personal, client or financial data**.
- Connects a work system to an **outside or personal account**.
- **Sends messages externally** or changes records without a person checking.
- Needs you to grant broad access to your email, files or calendar.
- Would cause real trouble if it failed silently.

For your own simple, internal automations using approved tools, start small, test with dummy data, and keep a note of what it does so a colleague could switch it off if needed.

## Try it now

Pick one: (a) use the outline prompt above for a presentation you have coming up, edit the outline, and generate or build the first three slides; or (b) write down one repetitive task in your week as "When [THIS HAPPENS], then [DO THIS]", and decide whether you could build it yourself or should ask IT, using the list above.

You are done when you have either an edited outline with three draft slides, or a one-line automation idea with a clear decision on who should build it and why.`,
        microCheck: [
          {
            question: "A trainer wants an AI-generated image of the correct way to lift a heavy box for a safety course. What is the concern?",
            options: [
              "AI images cannot be used in any training material",
              "It may look convincing but show an unsafe technique",
              "Images take too long to generate for a short course",
              "Generated images are always too low in resolution",
            ],
            correctIndex: 1,
            explanation:
              "Where accuracy matters, generated images can be convincingly wrong. For safety technique, use a verified diagram or photo. The issue is accuracy, not a blanket ban or resolution.",
          },
          {
            question: "What is the most reliable order for building a presentation with AI?",
            options: [
              "Generate slides first, then work out the message",
              "Agree an outline, edit it, then generate slides",
              "Choose a design template, then ask for images",
              "Ask for fifty slides and delete the weaker ones",
            ],
            correctIndex: 1,
            explanation:
              "Getting the story right first puts your expertise in early. Generating slides before the message is clear gives generic decks that take longer to fix.",
          },
          {
            question: "Which automation should you raise with IT before building?",
            options: [
              "A weekly reminder to yourself to update a tracker",
              "Emailing customer data to an outside account nightly",
              "Adding a calendar note when you book annual leave",
              "Saving your own meeting notes into a named folder",
            ],
            correctIndex: 1,
            explanation:
              "It moves customer data outside the organisation automatically, which touches confidentiality, security and possibly law. The other examples are simple and internal.",
          },
          {
            question: "Why keep a note of what each of your automations does?",
            options: [
              "So a colleague could understand or switch it off",
              "Because automation tools stop working without one",
              "So the automation runs faster on the next attempt",
              "Because notes are needed to connect any new apps",
            ],
            correctIndex: 0,
            explanation:
              "Automations run unseen. A short note means someone else can understand, fix or stop it if it misbehaves or you are away.",
          },
        ],
      },
    ],
    quiz: [
      {
        question:
          "An accountant uses a personal AI account to summarise a client's draft accounts because the firm's tool is slower. What is the main problem?",
        options: [
          "Personal accounts give less accurate summaries",
          "Client data may leave the firm's approved terms",
          "Summaries of accounts are not useful to clients",
          "The firm's tool would produce a longer summary",
        ],
        correctIndex: 1,
        explanation:
          "Personal accounts usually sit outside the firm's contractual and data protections. Client financial data must stay in approved tools, whatever the convenience.",
      },
      {
        question: "Which custom instruction would most improve an assistant's usefulness for a UK nurse manager?",
        options: [
          "Always answer in as much detail as possible",
          "Use UK terms, be concise and flag uncertainty",
          "Remember the names of patients I mention to you",
          "Always agree with me to save time in discussion",
        ],
        correctIndex: 1,
        explanation:
          "Instructions on language, length and handling uncertainty make answers fit the role. Storing patient names is a data risk, and an assistant that always agrees is less useful.",
      },
      {
        question:
          "A team leader wants to use an AI note-taker for a weekly team meeting. Which step matters most at the start?",
        options: [
          "Tell attendees and confirm it is allowed by policy",
          "Choose the note-taker with the most features listed",
          "Ask the tool to summarise in bullet points, not prose",
          "Record the meeting separately as a backup copy",
        ],
        correctIndex: 0,
        explanation:
          "Consent and policy come before anything else with transcription. Features and format are secondary, and an extra recording adds to the data you are responsible for.",
      },
      {
        question: "An AI research tool gives an answer with five citations. What does that tell you?",
        options: [
          "The answer is accurate, since it is well sourced",
          "The answer needs checking against those sources",
          "The answer is out of date, since it used websites",
          "The answer should be ignored, since AI was used",
        ],
        correctIndex: 1,
        explanation:
          "Citations make checking possible but do not guarantee accuracy. Tools can cite a real page for a claim it does not make, so open the sources you rely on.",
      },
      {
        question:
          "A procurement officer needs every deadline from an 80-page tender pack. Which prompt makes checking easiest?",
        options: [
          "Summarise the tender pack in one short paragraph",
          "List every deadline with a quote and page number",
          "Tell me whether the deadlines look reasonable",
          "Rewrite the tender pack in plain English for me",
        ],
        correctIndex: 1,
        explanation:
          "Quotes and page numbers let you verify each deadline quickly. A short summary may drop deadlines, and asking whether they look reasonable does not extract them.",
      },
      {
        question: "An assistant analyses a sales spreadsheet and reports a total that looks high. What is the best next step?",
        options: [
          "Ask it which columns and filters it used, then spot-check",
          "Accept it, since AI tools calculate faster than people",
          "Run the same question again until the answer changes",
          "Delete the spreadsheet and start the analysis by hand",
        ],
        correctIndex: 0,
        explanation:
          "Asking for its working often reveals the issue, such as a duplicated column, and a spot-check confirms it. Re-running until the answer changes is not verification.",
      },
      {
        question:
          "A charity manager wants AI-generated photos of 'service users' for a fundraising leaflet. What is the main concern?",
        options: [
          "Generated images are too expensive for charities",
          "It may mislead donors and breach the charity's policy",
          "Leaflets cannot legally contain any illustrations",
          "Generated photos always look obviously artificial",
        ],
        correctIndex: 1,
        explanation:
          "Presenting generated people as real beneficiaries can mislead supporters and may conflict with the charity's policy and fundraising standards. Check the organisation's position first.",
      },
      {
        question: "Which automation is reasonable to build yourself with an approved tool?",
        options: [
          "Auto-replying to clients with case updates",
          "A Friday reminder to update the team tracker",
          "Copying payroll data to a personal cloud drive",
          "Letting an app send email from your account",
        ],
        correctIndex: 1,
        explanation:
          "A simple internal reminder carries little risk. Client messages, payroll data and broad email permissions all need IT involvement and a human check.",
      },
      {
        question:
          "A consultant uploads a client's internal strategy document to a general assistant's project to save time. The firm has approved a different tool. What is the issue?",
        options: [
          "Projects cannot hold documents of that length",
          "The document is in a tool the firm has not approved",
          "The assistant will summarise it less accurately",
          "Projects share their files with all other users",
        ],
        correctIndex: 1,
        explanation:
          "Confidential client material must stay in approved tools. The concern is where the data has gone and on what terms, not the tool's accuracy or file limits.",
      },
      {
        question: "Why is it useful to ask an assistant for a slide outline before generating a presentation?",
        options: [
          "Outlines are the only thing AI presentation tools accept",
          "It lets you fix the message before design takes over",
          "It guarantees the slides will need no further editing",
          "It stops the tool from adding any images to the slides",
        ],
        correctIndex: 1,
        explanation:
          "The message is where your expertise matters most. Editing an outline is quicker than rewriting generated slides, though the slides will still need work.",
      },
      {
        question:
          "An email assistant suggests a reply to a supplier: 'Yes, we can accept those revised terms.' You have not read the terms. What should you do?",
        options: [
          "Send it, as the assistant has read the whole thread",
          "Read the revised terms before replying in any way",
          "Ask the assistant to make the reply more polite",
          "Forward the suggestion to a colleague to send it",
        ],
        correctIndex: 1,
        explanation:
          "Suggested replies can commit you to things. You are accountable for what you agree, so read the terms first. Changing the tone or passing it on does not remove the risk.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 3
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Productivity Workflows That Actually Save Time",
    summary:
      "Turn AI into real time savings on the work that fills most professional weeks: email, meetings and documents. Finish by building a personal prompt library so the gains repeat every week instead of starting from scratch.",
    lessons: [
      {
        title: "Email and everyday communication",
        objective:
          "Draft, reply to, adjust the tone of and translate work messages with AI, checking each one before it is sent.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Where the time goes

For many professionals, email and messages take a large share of the day. Not because each one is hard, but because there are so many, and the awkward ones get put off. AI helps most with three things here: getting started, getting the tone right, and getting through volume.

It helps least with knowing what to say. That remains your call.

## Drafting from bullet points

The fastest workflow is simple: **you decide the content in bullet points, AI turns it into prose.** This keeps you in charge of what is said, while the tool handles the wording.

\`\`\`try
Turn these points into a clear, friendly email to [RECIPIENT AND THEIR ROLE]. Keep it under [NUMBER] words, use short paragraphs, and end with one clear request.

Points:
- [POINT 1]
- [POINT 2]
- [POINT 3]
\`\`\`

Compare this with asking "Write an email to the finance team about the budget." With no content from you, the tool will invent plausible details, and you will spend longer removing them than you saved.

## Replying to a difficult message

For a tricky incoming message, a two-step approach works well:

1. **Understand it.** Paste the message (only if your tool is approved for that content, or after removing identifying details) and ask: "What is this person actually asking for, and what are they worried about?"
2. **Reply to it.** Give your decision in a sentence or two and ask for a reply in the right tone.

Separating the two stops the tool deciding your position for you. For example: "I will agree to the extension to the 14th but not the extra scope. Draft a warm, firm reply."

## Adjusting tone

Tone is where AI earns its keep. You can ask it to make a message:

- **Warmer**: "Make this sound less abrupt without adding length."
- **Firmer**: "Make it clear this is a final deadline, politely."
- **Simpler**: "Rewrite for someone who reads English as a second language."
- **More neutral**: "Remove anything that could read as blame."

A useful habit before sending a message you wrote when annoyed:

\`\`\`try
Here is an email I wrote. Point out anything that could come across as defensive, blaming or unclear, then suggest a calmer version that keeps the same decisions. Do not add new commitments.

[PASTE YOUR DRAFT]
\`\`\`

The final line matters: tools sometimes add friendly offers ("happy to arrange a call this week") that you did not intend to make.

## Translations

AI translation is now good enough to help with many everyday messages, for example to a supplier abroad or a family who prefers another language. Use it with care:

- **For important or sensitive content** (clinical, legal, safeguarding, contractual), use your organisation's approved translation or interpreting service. A mistranslation there can cause real harm.
- **Ask for a back-translation**: translate the result back into English to check the meaning survived.
- **Keep it simple**: short sentences and plain words translate more reliably.
- If you can, have a fluent colleague glance at anything that matters.

## Never send unchecked

Every message that leaves your outbox carries your name. Before sending anything AI helped with, check:

- **Facts**: names, dates, figures, prices, reference numbers.
- **Commitments**: has it promised anything you did not decide?
- **Tone**: does it sound like you and fit the relationship?
- **Recipients**: especially with suggested replies, is it going to the right people?
- **Confidentiality**: did you paste anything into a tool that should not have gone there?

With practice, this takes under a minute. It is the minute that protects your reputation.

## Try it now

Pick three real messages from your week: one to write from scratch, one reply to something awkward, and one that needs a tone change. Use the bullet-point and tone prompts above, keeping to approved tools and anonymising where needed.

You are done when all three are ready to send, you have run the five checks on each, and you have noted roughly how long each took compared with doing it alone.`,
        microCheck: [
          {
            question:
              "Why is 'bullet points in, prose out' a better email workflow than 'write an email about the budget'?",
            options: [
              "It keeps you in charge of what the email says",
              "It makes the email longer and more detailed",
              "It means the email will not need any checking",
              "It stops the tool from changing your sentences",
            ],
            correctIndex: 0,
            explanation:
              "You decide the content and the tool handles the wording. A vague request invites the tool to invent details you then have to remove, and every draft still needs checking.",
          },
          {
            question:
              "A GP receptionist wants to send appointment information to a patient in another language. The content includes medication timing. What is best?",
            options: [
              "Use an AI tool and send the result straight away",
              "Use the practice's approved translation service",
              "Use AI and ask the patient to confirm they understand",
              "Send it in English, since translation is too risky",
            ],
            correctIndex: 1,
            explanation:
              "Medication timing is clinical information where a mistranslation could cause harm, so approved services are the right route. Refusing to translate at all fails the patient.",
          },
          {
            question: "Why add 'Do not add new commitments' to a tone-adjusting prompt?",
            options: [
              "Tools sometimes add friendly offers you did not intend",
              "It makes the tool write in a more formal style overall",
              "It is required by most email providers' AI features",
              "It stops the tool from correcting your spelling errors",
            ],
            correctIndex: 0,
            explanation:
              "Assistants often add helpful-sounding extras, such as offering a call or a discount. You would then be committed to something you never decided.",
          },
          {
            question: "What is a back-translation used for?",
            options: [
              "Checking the meaning survived the translation",
              "Making the translation sound more natural",
              "Saving a copy of the message in two languages",
              "Proving the message was sent in both languages",
            ],
            correctIndex: 0,
            explanation:
              "Translating the result back into English shows whether the meaning has shifted. It is a quick check, not a guarantee, which is why important content needs approved services.",
          },
          {
            question: "An AI-suggested reply looks perfect. Which check is most often forgotten?",
            options: [
              "Whether the reply uses enough paragraphs",
              "Whether it is going to the right recipients",
              "Whether the subject line is in title case",
              "Whether the reply has a formal sign-off",
            ],
            correctIndex: 1,
            explanation:
              "Suggested replies are quick to send, which makes it easy to overlook who is on the thread. Sending to the wrong people can be a confidentiality breach.",
          },
        ],
      },
      {
        title: "Meetings: prep, notes, actions and follow-ups",
        objective:
          "Use AI before, during and after a meeting to prepare, capture actions and send an accurate follow-up.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## A meeting is a small system

A meeting has inputs (papers, context, questions), a process (the discussion) and outputs (decisions and actions). Much of the waste sits either side of the meeting itself: people arriving unprepared, and actions that are never written down or followed up. AI can help at each stage, as long as you stay in charge of what was actually decided.

## Before: preparation

Good preparation takes minutes with AI.

\`\`\`try
I have a [TYPE OF MEETING] with [WHO] about [TOPIC] on [DAY]. My goal is [OUTCOME I WANT]. Here is the background: [BRIEF, NON-CONFIDENTIAL CONTEXT]. Help me prepare: (1) a short agenda with timings for [LENGTH] minutes, (2) the three questions I most need answered, (3) objections or concerns the others might raise and how I could respond.
\`\`\`

This is especially helpful for meetings you dread: a budget challenge, a performance conversation, a difficult client. The "objections" part lets you rehearse. You can even ask the assistant to play the other person so you can practise your opening.

If you are chairing, ask for a one-paragraph "purpose and decisions needed" note to send out beforehand. Meetings with a clear purpose tend to finish on time.

## During: capturing what happens

You have two options:

- **An AI note-taker**, where your organisation allows it and participants have agreed (see Module 2, Lesson 2 on consent).
- **Your own rough notes**, which you tidy with AI afterwards.

Either way, listen for three things and mark them clearly: **decisions** ("we agreed to..."), **actions** (who will do what, by when), and **open questions** (things not yet resolved). Transcripts capture words; you capture meaning.

## After: turning notes into actions

This is where AI saves the most time.

\`\`\`try
From these meeting notes, produce:
1. A summary in no more than five bullet points.
2. Decisions made (only things explicitly agreed).
3. Actions as a table: Action, Owner, Deadline. Use "Not stated" if owner or deadline is missing.
4. Open questions still to resolve.
Do not add anything that is not in the notes.

Notes:
[PASTE NOTES OR TRANSCRIPT]
\`\`\`

Then check carefully. The common errors are:

- **A suggestion recorded as a decision.** "Maybe we should..." becoming "It was agreed that...".
- **The wrong owner.** The person who raised an issue is not always the person who will fix it.
- **Invented deadlines.** Hence the "Not stated" instruction.
- **Missing nuance.** A strong reservation softened into agreement.

You were in the room. Correct anything that does not match your memory, and if unsure, ask the people involved.

## The follow-up email

A prompt, clear follow-up within a day is one of the most useful habits in professional life. With AI it takes minutes.

\`\`\`try
Using the checked summary and actions below, write a short follow-up email to the meeting attendees. Thank them briefly, list decisions and the action table, and ask anyone to reply by [DAY] if something is wrong or missing. Friendly, professional, under 200 words.

[PASTE YOUR CHECKED SUMMARY AND ACTIONS]
\`\`\`

The line inviting corrections is important. It turns your notes into a shared record and catches mistakes early, which is a simple feedback loop.

## Keeping it safe

- Meeting content is often confidential. Use only approved tools, and anonymise where needed.
- Some meetings (grievances, clinical case reviews, legal advice) may have strict rules on notes and recording. Follow them.
- Store notes and transcripts where your organisation's records policy says, not in a personal account.

## Try it now

Choose a meeting you have this week. Use the preparation prompt beforehand. Afterwards, use the notes prompt on your notes or an approved transcript, check the output against your memory, and send the follow-up.

You are done when you have sent a follow-up with a checked action table, and you have noted at least one correction you made to the AI's version.`,
        microCheck: [
          {
            question: "An AI summary says 'It was agreed to move the launch to June.' You remember it was only suggested. What should you do?",
            options: [
              "Leave it, since the summary is close enough overall",
              "Correct it to show the date was only a suggestion",
              "Delete the line so nobody is confused by the point",
              "Ask the tool to reconsider whether it was agreed",
            ],
            correctIndex: 1,
            explanation:
              "A suggestion recorded as a decision is one of the most common and consequential errors. You were in the room, so correct it; the tool cannot check what it did not hear clearly.",
          },
          {
            question: "Why ask attendees to reply if anything in the follow-up is wrong or missing?",
            options: [
              "It makes the follow-up email look more polite",
              "It turns your notes into a checked, shared record",
              "It shifts the responsibility onto the attendees",
              "It is a legal requirement for all meeting notes",
            ],
            correctIndex: 1,
            explanation:
              "Inviting corrections creates a feedback loop that catches errors early and builds agreement on what was decided. It is good practice, not a way of passing on responsibility.",
          },
          {
            question: "A manager is dreading a budget meeting. Which use of AI is most helpful beforehand?",
            options: [
              "Asking it to predict exactly what others will say",
              "Listing likely objections and rehearsing replies",
              "Writing the final decision before the meeting starts",
              "Sending the others an AI summary of their views",
            ],
            correctIndex: 1,
            explanation:
              "Anticipating objections and practising responses builds confidence. The tool cannot predict what people will actually say, and deciding the outcome in advance undermines the meeting.",
          },
          {
            question: "Where should a transcript of a work meeting be stored?",
            options: [
              "In your personal cloud account for easy access",
              "Where your organisation's records policy says",
              "In the AI tool's chat history for future use",
              "In an email to yourself so it is searchable",
            ],
            correctIndex: 1,
            explanation:
              "Meeting records are organisational information and often confidential. Personal accounts, chat histories and your own inbox may not meet retention and security requirements.",
          },
        ],
      },
      {
        title: "Documents and reports",
        objective:
          "Produce a document with AI from outline to edited draft, and summarise long material accurately.",
        durationMinutes: 28,
        contentType: "article",
        bodyMd: `## The document workflow

Reports, proposals, policies, procedures, case summaries, lesson plans: longer documents are where AI can save the most time, and where careless use shows most. A reliable workflow has four stages:

1. **Brief**: you decide purpose, audience and key points.
2. **Outline**: AI proposes a structure; you fix it.
3. **Draft**: AI drafts section by section from your material.
4. **Edit and check**: you make it accurate, specific and yours.

The stages matter because each one is a checkpoint. Errors caught at the outline stage cost seconds. Errors caught after a full draft cost much more.

## Stage 1 and 2: brief and outline

\`\`\`try
I need to write a [DOCUMENT TYPE] for [AUDIENCE]. Purpose: [WHAT IT MUST ACHIEVE]. Length: about [NUMBER] words. Key points and facts to include: [BULLETS]. Things to avoid: [e.g. jargon, promises on timescales]. Propose an outline with headings and one line on what each section will say. Do not write the document yet.
\`\`\`

Now spend five minutes on the outline. Reorder sections, cut what is not needed, add what only you know. Ask "What would my most demanding reader expect to see here?" This is where your expertise shapes the whole document.

## Stage 3: drafting section by section

Draft one or two sections at a time rather than the whole thing at once. Shorter drafts are easier to check and steer. Give the tool your own material for each section: notes, figures you have verified, extracts from approved documents.

Useful instructions:

- "Use only the facts I have given. Where you need a fact I have not provided, write [CHECK] instead."
- "Write in plain English for a non-specialist reader."
- "Match the style of this example paragraph: [PASTE A PARAGRAPH YOU WROTE]."

The [CHECK] marker is valuable: it shows you exactly where information is missing, instead of a plausible guess slipping through.

## Stage 4: editing and checking

AI is also an excellent editor of **your** writing:

- "Shorten this by a third without losing any facts."
- "Point out anything unclear or ambiguous to a reader outside my team."
- "Check this for consistency: do names, dates and figures match throughout?"

Then do your own final check:

- **Every fact, figure and reference** checked against the source.
- **No generic filler**: phrases that sound fine but say nothing.
- **Your organisation's context**: correct terms, policies and names.
- **Your voice**: would a colleague recognise it as yours?

If the document will be published or submitted formally, follow your organisation's rules on disclosing AI assistance.

## Summarising long material

Summarising a long report, consultation or set of papers is one of the most useful things AI does. Accuracy depends on how you ask.

\`\`\`try
Summarise the document below for [AUDIENCE] who needs to [DECISION OR ACTION]. Give: (1) the main point in two sentences, (2) the five most important findings or requirements, (3) anything that affects [MY TEAM / MY ORGANISATION], (4) anything unclear or contradictory in the document. Quote key passages with their section or page so I can check them.

[PASTE OR UPLOAD DOCUMENT, IF YOUR TOOL IS APPROVED FOR IT]
\`\`\`

Tell the tool **who the summary is for and what they need to decide**. A summary for a board and a summary for front-line staff should differ. And for anything you will act on, read the sections the summary points to. Summaries lose detail by design; make sure the detail that matters to you was not lost.

## A note on long documents

Very long documents, or many documents at once, can exceed what a tool handles well in one go. Signs include a summary that covers the start in detail and the end vaguely. If you see this, summarise in parts (section by section) and then combine the part summaries.

## Try it now

Pick a document you need to produce in the next fortnight. Work through all four stages: brief, outline (edited by you), two sections drafted with [CHECK] markers, and an editing pass. Separately, summarise one long document you are allowed to process using the summary prompt above.

You are done when you have an edited outline, two checked draft sections with every [CHECK] resolved, and a summary where you have verified at least three quoted passages.`,
        microCheck: [
          {
            question: "Why ask the tool to write [CHECK] where it lacks a fact?",
            options: [
              "It shows gaps instead of letting a guess slip in",
              "It makes the draft shorter and quicker to read",
              "It means the finished draft needs no other checks",
              "It helps the tool learn the facts for next time",
            ],
            correctIndex: 0,
            explanation:
              "Without an instruction, tools fill gaps with plausible content. The marker makes missing information visible, but the rest of the draft still needs checking.",
          },
          {
            question: "Why draft a report one or two sections at a time?",
            options: [
              "AI tools cannot write more than two sections at once",
              "Shorter drafts are easier to check and to steer",
              "It keeps the whole document under a word limit",
              "It stops colleagues noticing that AI was used",
            ],
            correctIndex: 1,
            explanation:
              "Smaller pieces give you more checkpoints and more control over direction. Tools can write longer drafts, but errors are harder to spot and fix in a large block.",
          },
          {
            question:
              "An AI summary of a 60-page consultation covers the first half in detail and the second half in two lines. What should you do?",
            options: [
              "Accept it, since the key points usually come first",
              "Summarise it in parts, then combine the summaries",
              "Ask for a shorter summary of the whole document",
              "Read only the second half yourself and skip the rest",
            ],
            correctIndex: 1,
            explanation:
              "Uneven coverage suggests the document was too long to handle well in one go. Summarising in parts gives each section proper attention; a shorter summary would lose even more.",
          },
          {
            question: "Why tell the tool who a summary is for?",
            options: [
              "Different readers need different points drawn out",
              "The tool needs a name to address the summary to",
              "It makes the summary accurate without any checking",
              "It lets the tool share the summary with that reader",
            ],
            correctIndex: 0,
            explanation:
              "A board and front-line staff need different things from the same document. Naming the audience and their decision focuses the summary, though it still needs checking.",
          },
          {
            question: "Where does your expertise have the most effect in the four-stage document workflow?",
            options: [
              "Choosing the font and layout at the very end",
              "Shaping the brief and the outline at the start",
              "Counting the words once the draft is complete",
              "Picking which AI tool writes the first draft",
            ],
            correctIndex: 1,
            explanation:
              "The brief and outline decide what the document says and how it is structured. Fixing them early is cheap and shapes everything that follows.",
          },
        ],
      },
      {
        title: "Building your personal prompt library",
        objective:
          "Build a personal library of at least five reusable prompt templates for your recurring tasks.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## Why a library

By now you have written quite a few prompts. Some worked well after a few tweaks. If you have to rediscover those tweaks every time, you lose much of the benefit. A **prompt library** is simply a place where you keep your best prompts as templates, ready to reuse.

It turns occasional wins into a reliable way of working. It also makes your expertise shareable: a good template captures what you know about doing a task well, in a form a colleague can use.

## What makes a good template

A good template has:

- **A clear name**: "Awkward email reply", "Meeting notes to actions", "Board paper outline".
- **Fixed parts**: the instructions that always apply, including the fixes you have learned (such as "Use 'Not stated' if owner is missing" or "Do not add new commitments").
- **Variable parts in [BRACKETS]**: the things that change each time.
- **A short note**: when to use it, which tool, and what to check afterwards.

Here is an example, built from lessons in this course:

\`\`\`try
NAME: Meeting notes to actions
USE FOR: any internal meeting; approved tools only
CHECK: decisions really agreed, owners correct, deadlines not invented

From these notes of a meeting about [TOPIC], produce:
1. A summary in no more than five bullet points.
2. Decisions made (only things explicitly agreed).
3. Actions as a table: Action, Owner, Deadline. Write "Not stated" if missing.
4. Open questions.
Do not add anything not in the notes. Use UK English.

Notes:
[PASTE NOTES]
\`\`\`

## Finding what to put in it

Look back at:

- **Your practice log** from Module 1: which tasks did AI help with repeatedly?
- **The corrections you noted** in Module 1, Lesson 3, and since: each one is an instruction to build in.
- **Your week**: what do you write, summarise or prepare at least once a fortnight?

Good starter templates for most professionals:

1. Email from bullet points.
2. Reply to a difficult message.
3. Tone check before sending.
4. Meeting preparation.
5. Meeting notes to actions and follow-up.
6. Document outline from a brief.
7. Summary of a long document for a named audience.
8. Explain a topic to a non-specialist.

Add one or two specific to your field: a case note structure, a lesson plan, a client update, a job advert, a site report.

## Let AI help you write the templates

\`\`\`try
I am a [YOUR ROLE]. I regularly do this task: [DESCRIBE THE TASK]. When I have used AI for it, I have had to fix these things: [LIST YOUR CORRECTIONS]. Write a reusable prompt template for this task with a name, a one-line "use for" note, a one-line "check" note, fixed instructions that prevent those problems, and [BRACKETS] for the parts that change.
\`\`\`

Then test it on a real task and refine it. A template is only proven once it has worked two or three times.

## Where to keep it

Keep it simple and somewhere you already work:

- A document or note with one heading per template.
- A spreadsheet with columns for name, template, use for, check, last updated.
- Saved prompts or project instructions in your approved assistant, if it offers them.

Do not store confidential examples inside templates. Keep the [BRACKETS] empty.

## Keep it alive and share it

A library is a small feedback loop: use a template, notice what you had to fix, update the template. Review it once a month and delete what you no longer use.

When a template works well, consider sharing it with your team. This is one of the most practical ways to help your workplace adopt AI well: not a big launch, but good, checked templates with the safety notes already built in. Ask your manager where shared templates should live, so they sit within your organisation's approved tools.

## Try it now

Create your prompt library with at least five templates: three from the starter list above and at least two specific to your role. Use the template-writing prompt to help. Test each one on a real (or realistic, non-confidential) task.

You are done when five templates are saved in one place, each has a name, a "use for" note, a "check" note and [BRACKETS], and each has worked at least once on a real task.`,
        microCheck: [
          {
            question: "Which element turns a one-off prompt into a reusable template?",
            options: [
              "Fixed instructions plus [BRACKETS] for what changes",
              "A longer prompt with as much detail as possible",
              "A copy of the last output pasted in as an example",
              "The name of the AI tool used when it first worked",
            ],
            correctIndex: 0,
            explanation:
              "Fixed instructions keep what you have learned; brackets mark what changes each time. Length or a pasted output does not make a prompt reusable on its own.",
          },
          {
            question: "You keep adding 'Use UK spelling' by hand after using a template. What should you do?",
            options: [
              "Keep doing it, as editing by hand is safer",
              "Add the instruction to the template itself",
              "Switch to a tool that defaults to UK English",
              "Stop using the template for that task",
            ],
            correctIndex: 1,
            explanation:
              "A repeated correction is a sign to build the instruction into the template. That is the feedback loop that makes a library improve over time.",
          },
          {
            question: "A colleague's template includes a real client's name and case details as an example. What is the issue?",
            options: [
              "Examples make templates too long to be useful",
              "Confidential details are stored and reshared",
              "Templates with examples do not work in AI tools",
              "The client's name will confuse the AI's output",
            ],
            correctIndex: 1,
            explanation:
              "Templates get reused and shared, so any confidential detail in them spreads with them. Keep brackets empty or use clearly invented examples.",
          },
          {
            question: "How does sharing tested templates help a workplace adopt AI well?",
            options: [
              "It spreads good practice, with the checks built in",
              "It means colleagues no longer need to check output",
              "It removes the need for an organisational AI policy",
              "It proves that AI can replace team training sessions",
            ],
            correctIndex: 0,
            explanation:
              "A good template carries both the know-how and the safety notes. It supports, but does not replace, checking, policy and training.",
          },
        ],
      },
    ],
    quiz: [
      {
        question:
          "A solicitor's assistant asks AI to 'write a reply to this client' with no further input. The draft offers a meeting next week. What went wrong?",
        options: [
          "The tool was not told to use a formal legal tone",
          "The assistant gave no content, so the tool invented it",
          "Legal replies should never be drafted with any AI tool at all",
          "The draft was too short to be useful to the client",
        ],
        correctIndex: 1,
        explanation:
          "Without your points, the tool fills in plausible content, including commitments. Give it the decisions and facts; it handles the wording.",
      },
      {
        question:
          "A teacher writes a sharp email to a parent while frustrated. Which AI step is most useful before sending?",
        options: [
          "Ask it to make the email longer and more detailed",
          "Ask it to flag anything that could read as blaming",
          "Ask it to add a formal legal disclaimer at the end",
          "Ask it to send the email at a less busy time of day",
        ],
        correctIndex: 1,
        explanation:
          "A tone check spots defensive or blaming phrasing while keeping your decisions. Length, disclaimers and timing do not address the underlying problem.",
      },
      {
        question:
          "A housing association officer needs to send a tenancy warning to a tenant who reads Polish. What is the right approach?",
        options: [
          "Use an AI translation and post it without review",
          "Use the approved translation or interpreting route",
          "Send it in English and suggest an online translator",
          "Use AI, then check it by translating it back once",
        ],
        correctIndex: 1,
        explanation:
          "A tenancy warning has legal consequences, so it needs an approved translation route. A back-translation is a useful check for everyday messages, not a substitute here.",
      },
      {
        question:
          "An AI meeting summary lists 'Priya: review the contract by Friday'. Priya raised the contract but nobody took the action. What should you do?",
        options: [
          "Keep it, since Priya is the most suitable person to do it",
          "Mark owner and deadline as not agreed and follow up",
          "Remove the action from the summary altogether",
          "Assign it to yourself to avoid any awkwardness",
        ],
        correctIndex: 1,
        explanation:
          "The tool assigned the owner and deadline from context, not from a decision. Showing it as unresolved and following up keeps the record honest and the action alive.",
      },
      {
        question: "What is the main benefit of sending a follow-up that invites corrections?",
        options: [
          "It creates a shared, checked record of decisions",
          "It saves you from having to check the notes first",
          "It makes the meeting count as formally minuted",
          "It shows the attendees that AI wrote the summary",
        ],
        correctIndex: 0,
        explanation:
          "Inviting corrections is a feedback loop that catches errors and builds agreement. You still check the notes first; the invitation is a second safeguard.",
      },
      {
        question:
          "A finance officer asks AI for a full 3,000-word annual report in one go. It reads well but contains several figures she never supplied. What would have prevented this?",
        options: [
          "Asking for a longer report with more sections",
          "Drafting in sections using only supplied facts",
          "Using a newer AI tool with a larger memory",
          "Asking the tool to double-check its own figures",
        ],
        correctIndex: 1,
        explanation:
          "Section-by-section drafting from verified facts, with [CHECK] where data is missing, stops invented figures. Asking the tool to check itself does not reliably catch them.",
      },
      {
        question: "Which prompt instruction most improves the accuracy of a summary you will act on?",
        options: [
          "Make the summary as short as you possibly can",
          "Quote key passages with section or page references",
          "Write the summary in a confident, positive tone",
          "Use bullet points instead of full sentences throughout",
        ],
        correctIndex: 1,
        explanation:
          "Quotes with references let you verify the summary against the source quickly. Shortness, tone and format do not make the content more accurate.",
      },
      {
        question:
          "An operations manager's summary of a long policy covers early sections well and later ones vaguely. What is the likely cause and fix?",
        options: [
          "The policy is badly written; ask for a rewrite",
          "The document is too long; summarise in parts",
          "The tool is faulty; report it to the IT helpdesk",
          "The prompt was too polite; make it more direct",
        ],
        correctIndex: 1,
        explanation:
          "Uneven coverage is a common sign that a document is too long to process well at once. Summarising section by section and combining the results fixes it.",
      },
      {
        question: "What is the best source for the first templates in your prompt library?",
        options: [
          "Popular prompts collected from social media",
          "Your recurring tasks and the fixes you logged",
          "A list of every feature your AI tool offers",
          "Prompts that produced the longest answers",
        ],
        correctIndex: 1,
        explanation:
          "Templates built from your own recurring work and repeated corrections fit your needs. Generic prompt collections rarely include the fixes that matter in your field.",
      },
      {
        question:
          "An HR manager wants to share her tested 'job advert' template with other managers. What is the most important step first?",
        options: [
          "Make the template as long and detailed as possible",
          "Ask where shared templates should live in approved tools",
          "Add a note that AI output never needs to be checked again",
          "Share it on social media so others can improve it",
        ],
        correctIndex: 1,
        explanation:
          "Shared templates should sit within the organisation's approved tools so colleagues use them safely. The template's 'check' note should remain, not be removed.",
      },
      {
        question:
          "After a month, a professional's prompt library has twenty templates, and she uses four. What should she do?",
        options: [
          "Keep all twenty in case they are needed one day",
          "Review them and remove the ones she does not use",
          "Add ten more so the library covers every task",
          "Merge them all into one very long master prompt",
        ],
        correctIndex: 1,
        explanation:
          "A library is a working tool. Regular review keeps it useful; unused templates add clutter, and one giant prompt would be harder to use and maintain.",
      },
      {
        question: "Which practice best reflects the course's principle that 'your judgement is the asset'?",
        options: [
          "Letting AI decide the content so you can edit style",
          "Deciding the content, then letting AI help with wording",
          "Avoiding AI for any task that involves your professional expertise",
          "Using AI output as final whenever it reads fluently",
        ],
        correctIndex: 1,
        explanation:
          "You keep the decisions about what to say and check the result; AI speeds up the wording. Avoiding AI entirely wastes the gain, and fluent output is not the same as correct output.",
      },
    ],
  },
];
