import type { SeedModule, SeedQuestion } from "./types";

// Level 1 · Basic, Module 9. The capstone habit of the Basic level: the AI
// Fluency Framework's four competencies (the "4Ds": Delegation, Description,
// Discernment, Diligence), developed by Professor Rick Dakan and Professor
// Joseph Feller with Anthropic. It pulls together context and formats
// (Module 2), checking claims (Module 3), privacy (Module 5) and systems
// thinking (Module 8).

export const TRACK_1_MODULE_9: SeedModule[] = [
  {
    title: "AI Fluency: Working With AI Well",
    summary:
      "Bring everything in this course together with the four competencies of AI fluency: deciding what to hand to AI, describing it clearly, judging what comes back, and owning what you do with it.",
    lessons: [
      // ─────────────────────────────────────────────────────────────────
      {
        title: "What AI fluency means (and why it is more than prompting)",
        objective:
          "Explain the four competencies of AI fluency and the three modes of working with AI, and place your own AI use against them.",
        durationMinutes: 15,
        contentType: "article",
        bodyMd: `## Knowing tricks is not the same as being fluent

By now you have learned a lot of separate skills. You can give an AI tool context and ask for a format (Module 2). You can check a claim before you trust it (Module 3). You know what not to paste into a chatbot (Module 5). You can look at the whole system around a task before automating it (Module 8).

This last module ties those skills into one habit. The name for that habit is **AI fluency**: being able to work with AI effectively, efficiently, ethically and safely, in whatever tool you happen to be using.

Fluency is a good word for it. Someone fluent in a language does not think about grammar rules while they talk. They just communicate well, notice when they have been misunderstood, and adjust. AI fluency is the same. It is not a list of clever prompts. It is a way of working that still makes sense when the tools change next year.

## Where the framework comes from

This module is built on the **AI Fluency Framework**, developed by Professor Rick Dakan and Professor Joseph Feller together with Anthropic, the company that makes the Claude models. Anthropic offers a free course on it if you want to go further after this module.

The framework describes four competencies, often called **the 4Ds**:

| Competency | The question it answers | Where you have met it already |
|---|---|---|
| **Delegation** | What should I hand to AI, what should I keep, and how? | "When not to use AI at all" in Module 3, and the pre-check in Module 8 |
| **Description** | How do I tell the AI clearly what I want? | Context and formats in Module 2 |
| **Discernment** | Is what came back any good, and how did it get there? | Hallucination and checking claims in Module 3 |
| **Diligence** | Am I using AI responsibly, and do I own the result? | Privacy in Module 5, workplace policies |

Notice that only one of the four, Description, is about writing prompts. The other three happen before you type and after the answer arrives. That is why fluency is more than prompting.

## Three ways of working with AI

The framework also describes three modes of working with AI. You will use all three, often in the same day.

- **Automation**: the AI does a task you have specified. "Turn these notes into a bulleted list." You define the job; the AI carries it out.
- **Augmentation**: you and the AI think and create together. You brainstorm, push back, refine and build on each other's ideas. The result is something neither of you would have produced alone.
- **Agency**: the AI acts on your behalf with some independence, such as a tool that can search, fill in forms or take several steps towards a goal without asking you at each one.

The mode matters because each one asks different things of you. Automation needs a clear specification and a check at the end. Augmentation needs you to stay actively involved and bring your own judgement. Agency needs the most care up front, because you are not watching every step.

## The 4Ds work as a loop

The four competencies are not a checklist you run once. They feed each other.

A weak result (Discernment) often means you described the task badly (Description), so you improve the prompt. Sometimes it means the task was never a good fit for AI (Delegation), so you take it back. And whatever you finally use, you take responsibility for it (Diligence). If you remember the balancing loops from Module 8, this is one: noticing the gap between what you got and what you needed, and correcting course.

Here is a prompt that asks an AI tool to help you see your own habits through the 4Ds.

\`\`\`try
I use AI for these tasks: [LIST TWO OR THREE THINGS YOU USE AI FOR].
For each one, ask me one short question about each of these four areas:
1. Delegation: should AI be doing this, and in which mode (doing it for me, thinking it through with me, or acting for me)?
2. Description: how clearly do I explain what I want?
3. Discernment: how do I check what comes back?
4. Diligence: who sees the result, and do I own it?
Ask the questions one task at a time and wait for my answers.
\`\`\`

## Try it now

Pick one thing you used AI for in the last week. Run the prompt above in the practice pad, or just answer these four questions yourself in a note:

1. **Delegation**: was this a good task to hand over, and which mode was it: automation, augmentation or agency?
2. **Description**: did you give enough context and ask for a format?
3. **Discernment**: how did you check the result?
4. **Diligence**: did anyone else see the output, and did they know AI helped?

You are done when you have one honest line for each of the four Ds and have circled the one you are weakest at. The rest of this module takes each D in turn.`,
        microCheck: [
          {
            question:
              "A colleague says \"AI fluency just means knowing good prompts.\" Using the framework, what is the best reply?",
            options: [
              "Prompting is one of four competencies; the others happen before and after it",
              "Prompting matters least, because modern tools understand vague requests well",
              "Prompting is all of it, but good prompts must also be long and detailed",
              "Prompting is the core, and the other three skills are only for experts",
            ],
            correctIndex: 0,
            explanation:
              "Description is the prompting competency, but Delegation, Discernment and Diligence cover choosing the task, judging the result and owning it. Good prompts alone do not make someone fluent.",
          },
          {
            question:
              "You and an AI tool bounce ideas back and forth to plan a community event, each building on the other's suggestions. Which mode is this?",
            options: [
              "Automation, because the AI is producing text that you asked for",
              "Augmentation, because you are thinking and creating it together",
              "Agency, because the AI is making suggestions without instructions",
              "Delegation, because you have handed the event planning over to AI",
            ],
            correctIndex: 1,
            explanation:
              "Working back and forth, with both sides shaping the result, is augmentation. Delegation is a competency, not a mode, and agency would mean the AI acting for you with some independence.",
          },
          {
            question: "Who developed the AI Fluency Framework used in this module?",
            options: [
              "A government standards body, as part of a national AI safety plan",
              "Professors Rick Dakan and Joseph Feller together with Anthropic",
              "A group of AI companies, as a shared industry certification scheme",
              "Anthropic alone, as the user guide for its Claude family of models",
            ],
            correctIndex: 1,
            explanation:
              "The framework was developed by Professor Rick Dakan and Professor Joseph Feller together with Anthropic, which offers a free course on it. It is a general framework, not a product manual.",
          },
          {
            question:
              "Why does agency usually need more care up front than automation?",
            options: [
              "Agency tools are always more expensive, so mistakes cost more money",
              "The AI takes several steps on its own, so you are not checking each one",
              "Agency is only used for creative work, where there is no right answer",
              "Automation tools check their own work, so they need no oversight at all",
            ],
            correctIndex: 1,
            explanation:
              "When the AI acts with some independence, errors can happen between the points where you look. Setting limits and checks before you start matters more than in a single, specified task.",
          },
          {
            question:
              "An AI draft comes back poor. You rewrite the prompt, then decide the task is better done yourself. What does this show about the 4Ds?",
            options: [
              "The 4Ds should be applied once, in order, and never revisited later",
              "They form a loop: judging the result can send you back to earlier Ds",
              "Discernment has failed, because a good result should come first time",
              "Delegation was right at first, so taking the task back was a mistake",
            ],
            correctIndex: 1,
            explanation:
              "Discernment feeds back into Description and Delegation. Noticing a gap and correcting course, even by taking a task back, is the competencies working as intended.",
          },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      {
        title: "Delegation: what to hand to AI, and what to keep",
        objective:
          "Decide for a real task whether to hand it to AI, keep it, or split it, and choose a suitable mode and tool.",
        durationMinutes: 17,
        contentType: "article",
        bodyMd: `## Delegation starts before you open the tool

**Delegation** is deciding what work to give to AI, what to keep for yourself, and how to set the AI up to do its part. It is the first D because every other one depends on it. A beautifully written prompt for a task that should never have gone to AI is still a mistake.

Good delegation is not "use AI for everything" or "use AI for nothing". It is the same judgement a sensible manager uses when handing work to a new team member: what are they good at, what do they not know, and what would go wrong if they got it wrong?

## Three questions to ask first

**1. Do I understand the goal well enough to hand it over?** You cannot delegate what you cannot describe. If you are not sure what a good result looks like, spend five minutes working that out first. Sometimes an AI tool can help with exactly this, as a thinking partner (augmentation), before you ask it to produce anything.

**2. What is AI good and bad at here?** From Module 1 and Module 3: AI tools are strong at drafting, rewording, summarising, structuring, brainstorming and explaining. They are weak at facts they were never given, recent events, precise figures and anything about your specific situation that you have not told them.

**3. What happens if it is wrong?** This is the pre-check from Module 8. A clumsy birthday message is easy to fix. A wrong figure in an invoice, advice about someone's health, or a decision about a person is not. The higher the cost of a mistake, the more you keep for yourself.

## Keep, split or hand over

Most real tasks are not all-or-nothing. They split into parts.

Take writing a monthly update for a volunteer group:

| Part of the task | Decision | Why |
|---|---|---|
| Deciding what actually matters this month | **Keep** | Only you know what happened and what the group cares about |
| Turning your rough notes into clear paragraphs | **Hand over** (automation) | Rewording is a strength, and you can check it quickly |
| Finding a friendlier way to announce a price rise | **Work together** (augmentation) | You want options and a back-and-forth, then your own judgement |
| Checking dates, names and figures | **Keep** | AI can introduce small errors; you hold the facts |
| Sending it to the mailing list | **Keep** | A human should press send on anything that goes to many people |

Splitting like this is the heart of delegation. You keep the judgement, the facts and the final say. You hand over the parts where AI saves time and you can easily check the result.

## Choosing the mode and the tool

Once you know which parts to hand over, choose how.

- **Automation** fits when you can specify the job exactly and check the output quickly: reformatting, summarising a document you have, drafting from clear notes.
- **Augmentation** fits when you do not yet know the answer and want to think: planning, weighing options, getting feedback on a draft.
- **Agency** fits only when the steps are low-risk, you can set clear limits, and you can review what was done. At the Basic level, treat agency with caution and keep a human check before anything irreversible, like sending, buying or deleting.

The tool matters too. From Module 7: a general chat assistant is fine for most writing and thinking. A tool connected to your email, files or calendar can do more, but also reaches more of your data, so check what it can see before you use it.

Here is a prompt that uses AI to help you split a task, without handing the decision over.

\`\`\`try
I need to do this task: [DESCRIBE THE TASK IN ONE OR TWO SENTENCES].
The result goes to: [WHO RECEIVES IT].
If it contains a mistake, the worst realistic outcome is: [WHAT COULD GO WRONG].

Break the task into its main parts. For each part, suggest whether I should keep it, hand it to AI to do, or work on it together with AI, and give a one-line reason. Flag any part where AI is likely to get facts wrong.
\`\`\`

Treat the answer as suggestions. You make the final call, because you know things about the task the AI does not.

## Try it now

Choose one task you do every week or every month. Run the prompt above in the practice pad with your real task (leave out any private details).

Then write your own version of the table: each part of the task, your decision (keep, hand over, or work together), and a short reason. You are done when every part has a decision, at least one part is marked **keep**, and you have named the mode you will use for the parts you hand over.`,
        microCheck: [
          {
            question:
              "A charity volunteer wants AI to decide which families get food parcels this week. What is the best delegation decision?",
            options: [
              "Keep the decision; AI could help format the list after it is made",
              "Hand it over fully, since AI will be fairer than a busy volunteer",
              "Hand it over, but ask the AI to explain each decision it makes",
              "Keep the decision, and avoid using AI for any charity work at all",
            ],
            correctIndex: 0,
            explanation:
              "Decisions about people carry a high cost if wrong and depend on facts the AI does not have. Keeping the decision while handing over a low-risk part, like formatting, is a sensible split.",
          },
          {
            question:
              "You are not yet sure what a good result looks like for a tricky report. What is the best first move?",
            options: [
              "Ask AI to write the full report and see whether you like it",
              "Use AI as a thinking partner to work out what good looks like",
              "Hand the report to a colleague since AI cannot help with this",
              "Write a very long prompt listing every possible requirement",
            ],
            correctIndex: 1,
            explanation:
              "You cannot delegate what you cannot describe. Augmentation, thinking it through with AI, helps you clarify the goal before you ask for any finished output.",
          },
          {
            question:
              "Which part of writing a club newsletter is the best fit for automation?",
            options: [
              "Deciding which club news matters most to members this month",
              "Turning your rough bullet notes into clear, friendly paragraphs",
              "Confirming the dates and times of next month's club fixtures",
              "Choosing whether to mention a disagreement between members",
            ],
            correctIndex: 1,
            explanation:
              "Rewording your own notes plays to AI's strengths and is quick to check. Choosing priorities, confirming facts and handling sensitive topics need your knowledge and judgement.",
          },
          {
            question:
              "An AI tool offers to act as an agent that reads your inbox and replies to messages on its own. What is the wisest approach at this stage?",
            options: [
              "Let it reply freely, since agents are designed to work unsupervised",
              "Limit it to drafts you review, and check what data it can reach",
              "Turn it down, since agents should never be used by anyone at all",
              "Let it reply only to people you do not know well, to save time",
            ],
            correctIndex: 1,
            explanation:
              "Agency needs limits and a human check before anything irreversible, like sending. Checking what the tool can see also protects your data, as Module 5 covered.",
          },
          {
            question: "What does good delegation usually look like for a real task?",
            options: [
              "Handing the whole task over so you save as much time as you can",
              "Splitting it, keeping judgement and facts, handing over the rest",
              "Keeping the whole task, since checking AI takes as long as doing it",
              "Handing over the hardest parts, because that is where AI helps most",
            ],
            correctIndex: 1,
            explanation:
              "Most tasks split into parts. You keep the judgement, facts and final say, and hand over the parts where AI saves time and the result is easy to check.",
          },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      {
        title: "Description: saying what you actually want",
        objective:
          "Write a request that describes the product, the process and the AI's behaviour, and improve a weak prompt using all three.",
        durationMinutes: 18,
        contentType: "article",
        bodyMd: `## Description is more than one good sentence

**Description** is communicating clearly with an AI tool. In Module 2 you learned that context is everything and that asking for a format changes what you get. The AI Fluency Framework adds a useful way to organise that: when you describe what you want, you can describe three different things.

- **The product**: what you want to end up with.
- **The process**: how you want the AI to go about it.
- **The performance**: how you want the AI to behave while it works with you.

Most weak prompts describe only a vague product. Most strong ones touch all three.

## The product: what you want to end up with

This is the part people usually start with, but often too briefly. A clear product description covers:

- **What it is**: an email, a list, a table, a short plan.
- **Who it is for**: your manager, a customer, a ten-year-old.
- **The format and length**: three bullet points, under 150 words, a two-column table.
- **The tone**: warm, formal, plain, upbeat.
- **What it must include or avoid**: the date and venue; no jargon.

Compare these two requests:

> Write something about the new opening hours.

> Write a short notice (under 80 words) for our café's front window and Facebook page announcing new opening hours from next Monday: 8am to 4pm, Tuesday to Sunday, closed Mondays. Friendly tone. Include a line thanking regulars.

The second one leaves the AI far less to guess, and guessing is where made-up details creep in.

## The process: how you want it done

Sometimes the way the AI works matters as much as the result. You can describe the process:

- "First list the main points you found, then write the summary."
- "Use only the information in the document I've pasted. If something isn't there, say so."
- "Give me three different options before choosing one."
- "Work through it step by step and show your reasoning."

Describing the process is especially useful for anything where accuracy matters. Telling the AI to stick to what you gave it, and to say when it does not know, directly reduces the risk of hallucination you met in Module 3.

## The performance: how the AI should behave with you

The third kind of description is about the AI's behaviour in the conversation. This is where augmentation really improves.

- "Ask me questions before you start if anything is unclear."
- "Be direct. Tell me if my plan has a weak spot."
- "Act as a patient tutor: don't give me the answer, give me hints."
- "Keep your replies short; I'm on my phone."

Many people never think to set this. They accept the tool's default manner, which is often agreeable, long-winded and eager to please. Asking for pushback or questions can turn a polite yes-machine into a genuinely useful thinking partner.

## Putting all three together

Here is one request that describes product, process and performance. Run it with your own details.

\`\`\`try
I need a short email to [WHO IT IS FOR] about [THE TOPIC].

Product: under [NUMBER] words, [TONE] tone, with a clear subject line. It must mention [KEY FACT 1] and [KEY FACT 2].

Process: use only the facts I have given you. If you need something I haven't told you, put it in [SQUARE BRACKETS] instead of guessing.

Behaviour: before you write anything, ask me up to three questions about anything unclear. Then write the email.
\`\`\`

Notice the instruction to use brackets rather than guess. That one line turns invented details into visible gaps you can fill yourself.

## Description is a conversation, not a single shot

You rarely get everything right in the first message, and that is fine. Fluent users treat the first reply as information. If it is too long, say so. If the tone is off, describe the tone you wanted, perhaps with an example. If it misunderstood, explain what you meant rather than repeating the same words louder.

A useful habit: when you correct the AI, ask yourself which of the three you under-described. A wrong format is a product problem. Invented facts are often a process problem. A reply that just agrees with everything is a performance problem.

## Try it now

Find a prompt you have used recently that gave you a disappointing answer. If you don't have one, use: "Help me plan my week."

1. Rewrite it with one line each for **product**, **process** and **performance**.
2. Run both versions in the practice pad.
3. Note the biggest difference in what came back.

You are done when you have a before prompt, an after prompt with all three parts, and one sentence on which part made the biggest difference.`,
        microCheck: [
          {
            question:
              "You add \"Use only the document I've pasted, and say if something isn't in it\" to a prompt. Which kind of description is this?",
            options: [
              "Product, because it sets out what the final summary should contain",
              "Process, because it tells the AI how to go about doing the task",
              "Performance, because it asks the AI to be polite about gaps it finds",
              "Delegation, because it decides which parts the AI is allowed to do",
            ],
            correctIndex: 1,
            explanation:
              "Telling the AI where to get its information and what to do when it is missing describes the process. It also cuts the risk of the AI filling gaps with invented details.",
          },
          {
            question:
              "An AI tool agrees with every idea in your business plan. Which change to your description would help most?",
            options: [
              "Ask for the reply in a table so the ideas are easier to compare",
              "Ask it to be direct and point out the weakest parts of the plan",
              "Ask for a much longer answer so it has room to include criticism",
              "Ask again in a new chat to get a fresh opinion on it",
            ],
            correctIndex: 1,
            explanation:
              "This is a performance problem: the tool's default manner is agreeable. Describing the behaviour you want, such as direct feedback, changes how it responds far more than format or length.",
          },
          {
            question:
              "Why is asking the AI to put missing facts in [square brackets] a useful habit?",
            options: [
              "It makes the output shorter because the AI leaves out whole sections",
              "It turns guesses into visible gaps that you can then fill correctly",
              "It forces the AI to search the internet for the missing information",
              "It stops the AI from asking you any questions before it gets started",
            ],
            correctIndex: 1,
            explanation:
              "Without this, an AI tool may invent plausible details to fill gaps. Brackets make the gaps obvious so you supply the real facts instead of missing a made-up one.",
          },
          {
            question:
              "Which request gives the clearest product description?",
            options: [
              "Write something good about our charity fun run for people to read",
              "A 100-word invite to our fun run for parents: date, venue, cost",
              "Tell me everything you know about organising a charity fun run",
              "Make our fun run sound exciting and professional for everyone",
            ],
            correctIndex: 1,
            explanation:
              "It names the type of output, the audience, the length and what must be included. The others leave the AI to guess at the format, the reader or the facts.",
          },
          {
            question:
              "The AI's reply invented a venue you never mentioned. Which part of your description was most likely too thin?",
            options: [
              "The product, because you did not say how long the reply should be",
              "The process, because you did not say to stick to the facts given",
              "The performance, because you did not ask it to be friendly enough",
              "The tone, because you did not say whether it should sound formal",
            ],
            correctIndex: 1,
            explanation:
              "Invented facts usually mean the AI was not told to use only what you supplied, or to flag what was missing. That is a process instruction, not a format or tone one.",
          },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      {
        title: "Discernment: judging the output and the process",
        objective:
          "Evaluate an AI result for accuracy, fit and reasoning, and decide whether to use it, fix it or start again.",
        durationMinutes: 18,
        contentType: "article",
        bodyMd: `## Discernment: the D that protects you

**Discernment** is evaluating what AI produces and how it got there. It is the competency that stops a confident, well-written, wrong answer from going any further than your screen.

In Module 3 you learned why AI tools sometimes make things up and how to check a claim in 90 seconds. Discernment builds on that. It asks you to judge three things, not one: the product, the process, and the AI's behaviour in the conversation.

## Judging the product

Start with what you got. Four quick questions cover most cases.

1. **Is it accurate?** Check names, numbers, dates, quotes and anything that sounds like a fact. These are exactly where AI tools slip. Use the 90-second check from Module 3 on anything that matters.
2. **Is it complete?** Did it answer the whole question, or quietly skip the hard part?
3. **Does it fit?** Is it right for the reader, the length, the tone and the purpose you described?
4. **Is it actually good?** Fluent writing can hide thin thinking. Would you be happy to put your name to it?

A useful trick is to read the output as the person who will receive it. A customer, your manager, a nervous parent. What would they notice first?

## Judging the process

Sometimes the answer looks fine but the route it took is shaky. Discernment includes looking at how the AI got there.

- **Where did the information come from?** Did it use the document you gave it, or general knowledge that might be out of date or wrong for your situation?
- **Does the reasoning hold up?** If it explains its steps, do they follow? A right-looking conclusion from a broken argument is luck, not reliability.
- **Did it make assumptions?** AI tools often fill gaps silently. Ask it to list the assumptions it made, then check them.

You can ask for the process directly:

\`\`\`try
Here is the answer you gave me: [PASTE THE AI'S ANSWER].
1. List every factual claim in it that I should check, with how confident you are in each one.
2. List any assumptions you made about my situation that I did not tell you.
3. Point out the weakest part of the answer and explain why.
\`\`\`

This does not replace your own checking. An AI tool can be wrong about its own confidence too. But it often surfaces claims and assumptions you would otherwise skim past, which tells you where to look.

## Judging the behaviour

The third thing to watch is how the AI behaved while working with you.

- **Did it just agree with you?** AI tools tend to go along with what you say. If you suggested an answer and it immediately agreed, be suspicious.
- **Did it change its answer when you pushed back?** If a firm "are you sure?" flips the answer, neither version deserves much trust until you check it elsewhere.
- **Did it admit uncertainty, or sound equally sure about everything?** Equal confidence on every point is a warning sign, not a comfort.

Noticing these patterns feeds straight back into Description. If the tool is too agreeable, ask it to challenge you next time.

## Use it, fix it, or start again

Discernment ends in a decision.

| What you found | What to do |
|---|---|
| Accurate, fits the purpose, only small wording issues | **Use it**, after your own light edit |
| Mostly right, but a fact is wrong or a section is thin | **Fix it**: correct the facts yourself, or give specific feedback and ask again |
| Wrong direction, wrong audience, or you cannot tell what is true | **Start again**, with a better description, or take the task back |

The more is at stake, the higher your bar. And remember the systems lesson from Module 8: an unchecked error does not stay put. It gets copied, quoted and built on. A few minutes of discernment at the start is the balancing loop that stops it.

## Try it now

Take one AI answer from the last week that you used or nearly used. Paste it into the practice pad with the prompt above.

Then do your own check:

1. Verify the two most important factual claims yourself, using a source you trust.
2. Write down one assumption the AI made about your situation.
3. Decide: use it, fix it, or start again.

You are done when you have checked two claims, named one assumption, and written your decision with a one-line reason.`,
        microCheck: [
          {
            question:
              "An AI summary of a report reads smoothly and sounds confident. What is the most important next step before you share it?",
            options: [
              "Share it straight away, since smooth writing usually means accuracy",
              "Check the key names, figures and dates against the original report",
              "Ask the AI to rewrite it in a more formal tone for the readers",
              "Run the same summary through a second AI tool to compare wording",
            ],
            correctIndex: 1,
            explanation:
              "Fluent writing says nothing about accuracy. Facts like names, numbers and dates are where AI tools slip, so checking them against the source is the heart of discernment.",
          },
          {
            question:
              "You ask \"Are you sure?\" and the AI immediately changes its answer. What should you conclude?",
            options: [
              "The second answer is correct, since the AI has now thought it through",
              "Neither answer is reliable until you check it with a trusted source",
              "The first answer is correct, since the AI only changed to please you",
              "The question was too hard, so you should stop using AI for this topic",
            ],
            correctIndex: 1,
            explanation:
              "An answer that flips under light pressure shows the tool was not reliably grounded. Checking elsewhere is the only way to know which version, if either, is right.",
          },
          {
            question:
              "Which of these is judging the process rather than the product?",
            options: [
              "Checking the email is the right length for its reader",
              "Asking which assumptions the AI made about your situation",
              "Reading the draft as the customer would to see how it lands",
              "Checking whether the tone matches the one you asked it to use",
            ],
            correctIndex: 1,
            explanation:
              "Assumptions are about how the AI reached its answer. Length, tone and how the reader will feel are all judgements about the finished product.",
          },
          {
            question:
              "An AI plan for a school trip is mostly good, but lists a museum opening time you cannot confirm. What should you do?",
            options: [
              "Use it as it is, since one small detail rarely matters",
              "Fix it: confirm the time with the museum and correct the plan",
              "Start again from scratch, since one error means the plan is useless",
              "Ask the AI to double-check the time and accept its second answer",
            ],
            correctIndex: 1,
            explanation:
              "The plan is mostly right, so fixing the specific fact is proportionate. Asking the AI again does not verify anything, and throwing away a good plan wastes useful work.",
          },
          {
            question:
              "You suggest an answer to the AI and it agrees with you at once. Why be cautious?",
            options: [
              "AI tools are programmed to disagree, so agreement means a fault",
              "AI tools tend to go along with users, so agreement proves little",
              "AI tools only agree when they have checked the answer online first",
              "AI tools cannot evaluate suggestions, so they always accept them",
            ],
            correctIndex: 1,
            explanation:
              "AI tools often lean towards agreeing with what you say. Quick agreement is not independent confirmation, so treat it as a prompt to check rather than as evidence.",
          },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      {
        title: "Diligence: owning what you publish",
        objective:
          "Set personal commitments for transparency, responsibility and ethical choices when you use AI, and apply them to real work.",
        durationMinutes: 17,
        contentType: "article",
        bodyMd: `## Diligence: you are still the author

**Diligence** is using AI responsibly. The AI Fluency Framework describes it in three parts: being **transparent** about your AI use, taking **responsibility** for what you produce, and making **ethical choices** about how and when you use AI.

The simplest way to hold all three in your head: **the AI helped, but you are the one who hands it over.** If you send the email, submit the report or post the picture, it is yours. "The AI wrote that" is not a defence anyone will accept, and it should not be one you accept from yourself.

## Transparency: being open about AI use

Being transparent means the people who rely on your work are not misled about how it was made. What that looks like depends on the situation.

- **At work**, follow your organisation's policy (Module 5). Many ask you to say when AI drafted something significant, or to avoid certain tools altogether.
- **In education**, rules differ by school, course and assignment. When in doubt, ask, and say what you used.
- **With customers or the public**, think about what they would reasonably expect. A reply that looks personal but was generated without anyone reading it can feel like a broken promise if they find out.
- **For everyday help**, like tidying the wording of your own email, most people would not expect a label. Transparency is about not misleading people, not stamping "AI" on every sentence.

A useful test: **if the reader found out exactly how this was made, would they feel misled?** If yes, say so up front.

Simple wording works: "I used an AI tool to help draft this and checked it myself." Or, in a team: "First draft by AI from my notes; figures checked against the finance sheet."

## Responsibility: checking before it leaves your hands

Taking responsibility means doing the discernment from the last lesson every time the stakes call for it, and fixing mistakes when they get through anyway.

It also means being honest about your own understanding. If you cannot explain what a piece of AI-assisted work says and why, you are not ready to put your name on it. That matters most for anything that affects other people: advice, decisions, numbers, anything about a named person.

Here is a prompt to help you prepare a short, honest note about how you used AI on a piece of work.

\`\`\`try
I used an AI tool to help with [WHAT THE WORK IS] for [WHO IT IS FOR].
The AI did: [WHAT THE AI DID, e.g. first draft from my notes].
I did: [WHAT YOU DID, e.g. chose the content, checked the figures, edited the tone].

Write two versions of a one-sentence note I could add to disclose this: one for a formal setting and one for a casual one. Keep both honest and plain, without overstating or downplaying the AI's part.
\`\`\`

## Ethical choices: what goes in, and what comes out

Diligence starts before you type, with what you put in. Everything from Module 5 applies: no passwords, no other people's personal details, nothing confidential that your organisation has not approved for that tool. Using someone else's information in an AI tool without thinking about it is a diligence failure, even if the output is perfect.

It continues with what you do with the output:

- **Do not pass off AI work as someone else's**, or create content that impersonates a real person.
- **Watch for bias** (Module 3). If an output is about people, check whether it treats groups fairly.
- **Think about who is affected.** From Module 8: who receives this, who acts on it, and who is harmed if it is wrong?
- **Sometimes the ethical choice is not to use AI.** A condolence message, a sensitive conversation or a decision about someone's job may deserve your own words and your own judgement.

## Diligence as a habit, not a checklist

Diligence is what makes the other three Ds trustworthy. Good delegation, clear description and careful discernment all count for little if you then share the result carelessly.

Three short commitments you can keep every day:

1. **Data**: I don't paste anything I wouldn't be comfortable seeing on a noticeboard, unless the tool is approved for it.
2. **Checking**: I check facts, figures and anything about people before it leaves my hands.
3. **Disclosure**: I tell people how AI helped whenever they would reasonably want to know.

## Try it now

Think of one piece of work you will produce with AI help in the next week.

1. Run the disclosure prompt above in the practice pad and pick the note that fits your setting.
2. Write your own version of the three commitments (data, checking, disclosure), adjusted to your work or home life.
3. Check them against any AI policy your workplace or school has.

You are done when you have three commitments in your own words and a disclosure note ready to use. Keep them somewhere you will see them. They are the habit that makes the rest of this course count.`,
        microCheck: [
          {
            question:
              "A colleague sends a client a report with an AI error in it and says \"the AI wrote that bit.\" What does diligence say?",
            options: [
              "The colleague is responsible, because they chose to send the report",
              "The AI company is responsible, because the error came from its tool",
              "Nobody is responsible, because AI errors are too hard to predict",
              "The client is responsible, because they should check reports too",
            ],
            correctIndex: 0,
            explanation:
              "Whoever hands the work over owns it. The AI helped, but the choice to send it unchecked was the colleague's, which is exactly what responsibility in diligence means.",
          },
          {
            question:
              "Which is the best test for whether to disclose that AI helped with a piece of work?",
            options: [
              "Disclose only if the AI wrote more than half of the final words",
              "Disclose if the reader would feel misled on learning how it was made",
              "Disclose only when the reader asks you directly if AI was used",
              "Disclose every time, even when AI only fixed a spelling mistake",
            ],
            correctIndex: 1,
            explanation:
              "Transparency is about not misleading people. A word-count rule misses context, waiting to be asked can mislead, and labelling tiny edits adds noise without protecting anyone.",
          },
          {
            question:
              "A manager pastes staff sickness records into a free chatbot to get a summary. The summary is accurate. Was this diligent?",
            options: [
              "Yes, because the summary was accurate and saved the manager time",
              "No, because sensitive personal data went into an unapproved tool",
              "Yes, because summarising records is a low-risk use of AI tools",
              "No, because AI summaries should never be used by any manager",
            ],
            correctIndex: 1,
            explanation:
              "Diligence covers what goes in, not just what comes out. Health information about named staff is sensitive, and putting it into an unapproved tool is a failure even if the output is perfect.",
          },
          {
            question:
              "When might the most ethical choice be not to use AI at all?",
            options: [
              "When the task is long and would take a person several hours",
              "When writing a condolence note that should be in your own words",
              "When the task needs a particular format such as a table or list",
              "When you want several different ideas to choose between quickly",
            ],
            correctIndex: 1,
            explanation:
              "Some messages matter because a person wrote them. Length, format and brainstorming are all reasonable uses of AI; deeply personal moments may deserve your own words.",
          },
          {
            question:
              "Why is diligence described as what makes the other three Ds trustworthy?",
            options: [
              "Because it is the only D that happens after the AI has replied",
              "Because careless sharing can undo good delegation and checking",
              "Because it replaces the need for discernment on low-risk tasks",
              "Because it is the D that decides which tool you should choose",
            ],
            correctIndex: 1,
            explanation:
              "You can choose the task well, describe it clearly and check it carefully, then still cause harm by sharing it carelessly or misleading people. Diligence closes that gap.",
          },
        ],
      },
    ],

    quiz: [
      {
        question:
          "A friend uses AI daily, writes excellent prompts, but never checks the answers and shares them widely. Which competencies are they missing?",
        options: [
          "Delegation and description, since their prompts are the real problem",
          "Discernment and diligence, since they neither check nor own results",
          "Description and discernment, since good prompts need checking too",
          "Delegation and diligence, since they choose the wrong tasks to share",
        ],
        correctIndex: 1,
        explanation:
          "Good prompts cover description. Not checking is a gap in discernment, and sharing unchecked output widely is a gap in diligence. Fluency needs all four.",
      },
      {
        question:
          "You ask AI to turn a spreadsheet of event bookings into a neat attendee list. Which mode is this, and what does it need?",
        options: [
          "Augmentation, so it needs a long back-and-forth about the design",
          "Automation, so it needs a clear specification and a check at the end",
          "Agency, so it needs limits because the AI is acting independently",
          "Augmentation, so it needs you to bring your own creative ideas to it",
        ],
        correctIndex: 1,
        explanation:
          "A clearly specified task the AI carries out is automation. It works best with an exact description of the output and a quick check that nothing was dropped or changed.",
      },
      {
        question:
          "A small business owner wants AI to set this year's prices for all their products. What is the best delegation decision?",
        options: [
          "Hand it over, since AI can compare prices faster than the owner can",
          "Keep the pricing decision, but use AI to explore options and costs",
          "Hand it over, as long as the AI explains how it chose each price",
          "Keep it entirely, since AI should never be used in any money matter",
        ],
        correctIndex: 1,
        explanation:
          "Pricing depends on costs and customers the AI does not know, and mistakes are costly. Keeping the decision while using AI as a thinking partner is a sensible split.",
      },
      {
        question:
          "Which prompt addition describes the AI's behaviour, rather than the product or the process?",
        options: [
          "\"Give me the answer as a table with three columns and a header.\"",
          "\"Challenge my assumptions and tell me if my plan has a weak spot.\"",
          "\"Use only the two documents I have pasted into this conversation.\"",
          "\"Keep it under 200 words and write it for a general audience.\"",
        ],
        correctIndex: 1,
        explanation:
          "Asking the AI to challenge you sets how it behaves in the conversation. Tables and word counts describe the product; sticking to pasted documents describes the process.",
      },
      {
        question:
          "An AI draft of a job advert keeps using a stiff, corporate tone. What is the most fluent response?",
        options: [
          "Accept it, since AI tools always write in their own fixed style",
          "Describe the tone you want and give a short example to match",
          "Start a new chat and paste the same request in again unchanged",
          "Write the whole advert yourself, since AI clearly cannot do it",
        ],
        correctIndex: 1,
        explanation:
          "A tone problem is a description gap. Describing the tone and showing an example gives the AI something concrete to aim for, which a repeated request does not.",
      },
      {
        question:
          "An AI answer about local council rules sounds confident and cites a regulation you have never heard of. What does discernment call for?",
        options: [
          "Trust it, since a named regulation shows the AI has checked its facts",
          "Look the regulation up on an official source before relying on it",
          "Ask the AI whether the regulation is real and accept what it says",
          "Ignore it, since AI tools cannot answer any questions about the law",
        ],
        correctIndex: 1,
        explanation:
          "A specific-sounding citation can be invented. Checking it on an official source is the only real verification; asking the same tool again does not confirm anything.",
      },
      {
        question:
          "A student uses AI to explain a topic, then writes their essay themselves. Their course says AI use must be declared. What does diligence require?",
        options: [
          "Nothing, since the essay words are entirely the student's own work",
          "A short, honest note saying how AI was used, as the course requires",
          "Removing everything learned from the AI so the essay is fully original",
          "Asking the AI to rewrite the essay so both uses are the same kind",
        ],
        correctIndex: 1,
        explanation:
          "The course has a disclosure rule, so transparency means following it. Saying plainly how AI helped respects the rule without overstating the AI's part.",
      },
      {
        question:
          "A team speeds up drafting with AI but stops checking drafts to save time. Errors start appearing in client documents. Which two ideas best explain this?",
        options: [
          "Weak description and a bottleneck in the drafting step of the work",
          "Missing discernment, and a lost balancing loop that caught errors",
          "Poor delegation and a reinforcing loop that makes drafts get longer",
          "Weak diligence and a delay caused by the clients reading slowly",
        ],
        correctIndex: 1,
        explanation:
          "Checking was the balancing loop from Module 8 that caught mistakes. Dropping it is a discernment failure, and the errors now travel downstream to clients.",
      },
      {
        question:
          "Someone gives an AI agent access to their email and lets it send replies without review. What is the main concern?",
        options: [
          "The replies may be longer than the person would normally write",
          "It can send wrong or unsuitable messages before anyone sees them",
          "The agent may be slower than writing the replies by hand would be",
          "It will stop working if the inbox has too many unread messages",
        ],
        correctIndex: 1,
        explanation:
          "Agency means acting with some independence. Sending is hard to undo, so without a review step, mistakes reach people before a human can catch them.",
      },
      {
        question:
          "A volunteer pastes a list of members' home addresses into an AI tool to sort them into delivery rounds. Which D does this most test?",
        options: [
          "Description, because the sorting instructions need to be very clear",
          "Diligence, because personal data is going into the AI tool itself",
          "Discernment, because the rounds must be checked for any mistakes",
          "Delegation, because sorting addresses is a task only people can do",
        ],
        correctIndex: 1,
        explanation:
          "Diligence covers what goes in. Home addresses are personal data, so the volunteer should check the tool is approved for it or remove identifying details first.",
      },
      {
        question:
          "An AI summary misses the one point your manager cares most about. You realise you never told the AI who the summary was for. What should you improve?",
        options: [
          "Discernment, by checking every summary line by line against the source",
          "Description, by saying who the reader is and what they care about",
          "Delegation, by never using AI to summarise anything for a manager",
          "Diligence, by telling your manager that AI wrote the summary for you",
        ],
        correctIndex: 1,
        explanation:
          "The AI could not prioritise what it was never told. Describing the reader and their priorities is part of describing the product, and fixes the cause rather than the symptom.",
      },
      {
        question:
          "Why are the 4Ds described as a loop rather than a one-off checklist?",
        options: [
          "Because you must repeat all four for every single message you send",
          "Because what you find when judging output sends you back to improve",
          "Because the order of the four changes depending on the tool you use",
          "Because each D must be signed off by a different person on the team",
        ],
        correctIndex: 1,
        explanation:
          "Discernment feeds back into description and delegation: a weak result tells you to describe better or take the task back. That correcting cycle is what makes it a loop.",
      },
    ],
  },
];

export const TRACK_1_MODULE_9_EXAM: SeedQuestion[] = [
  {
    question: "What are the four competencies of the AI Fluency Framework?",
    options: [
      "Delegation, Description, Discernment and Diligence",
      "Discovery, Design, Deployment and Documentation",
      "Drafting, Debugging, Decision-making and Delivering",
      "Data, Detail, Direction and Disclosure to readers",
    ],
    correctIndex: 0,
    explanation:
      "The framework's 4Ds are Delegation, Description, Discernment and Diligence: deciding what to hand over, communicating it, judging the result and using AI responsibly.",
    difficulty: 1,
    moduleNumber: 9,
  },
  {
    question:
      "Which of these best describes augmentation as a mode of working with AI?",
    options: [
      "The AI completes a task you have specified in full",
      "You and the AI think and create a result together",
      "The AI acts on your behalf across several steps",
      "You check the AI's work after it has been finished",
    ],
    correctIndex: 1,
    explanation:
      "Augmentation is collaborative thinking and creating. Carrying out a specified task is automation, and acting on your behalf with some independence is agency.",
    difficulty: 1,
    moduleNumber: 9,
  },
  {
    question:
      "A parent asks AI to write a note to their child's teacher and adds: \"Ask me questions first if anything is unclear.\" What is this line doing?",
    options: [
      "Describing the product, by setting the note's length and its format",
      "Describing the AI's behaviour in the conversation with the parent",
      "Delegating the whole decision about what the note should say",
      "Showing discernment, by checking the note before it is written",
    ],
    correctIndex: 1,
    explanation:
      "Asking the AI to question you first sets how it behaves while working with you. It says nothing about the note's format and does not hand over the decision.",
    difficulty: 2,
    moduleNumber: 9,
  },
  {
    question:
      "An AI draft of a customer refund email looks polished. Which check matters most before sending?",
    options: [
      "Whether the email sounds warm enough to keep the customer happy",
      "Whether the refund amount and policy details match your records",
      "Whether the email is short enough to read comfortably on a phone",
      "Whether a second AI tool would have written a nicer-sounding email",
    ],
    correctIndex: 1,
    explanation:
      "Amounts and policy details are facts with real consequences, and exactly where AI tools slip. Tone and length matter, but a wrong refund figure causes the real harm.",
    difficulty: 2,
    moduleNumber: 9,
  },
  {
    question:
      "A club secretary uses AI to draft the annual report, checks every figure, and adds \"Drafted with AI help and checked by the secretary.\" Which competency does the note mainly show?",
    options: [
      "Delegation, because it records which parts were handed to the AI",
      "Diligence, as it is transparent and takes ownership of the work",
      "Discernment, because the note proves the figures were all correct",
      "Description, because the note explains the prompt that was used",
    ],
    correctIndex: 1,
    explanation:
      "Being open about AI use and taking responsibility for checked work are both parts of diligence. The note itself does not prove accuracy; the checking does.",
    difficulty: 2,
    moduleNumber: 9,
  },
  {
    question:
      "A manager wants AI to screen job applications and reject weaker ones automatically, to save time. Which analysis best applies the 4Ds?",
    options: [
      "Good delegation, because screening is repetitive and AI works quickly",
      "Risky on several Ds: decisions about people, bias, and no human check",
      "Mainly a description issue, fixed by writing a more detailed prompt",
      "Mainly a diligence issue, fixed by telling applicants AI was involved",
    ],
    correctIndex: 1,
    explanation:
      "Rejecting people is high-stakes, so delegation is doubtful; bias needs discernment; and removing human review is a diligence failure. A better prompt or a disclosure alone does not fix it.",
    difficulty: 3,
    moduleNumber: 9,
  },
  {
    question:
      "Your team's AI-drafted newsletters keep containing small factual errors that readers point out. Each time, someone fixes the online copy. What is the most fluent response?",
    options: [
      "Keep fixing each error, since readers catching them shows the system works",
      "Change the process: give the AI the facts and add a named check before sending",
      "Stop the newsletter, since AI errors show it cannot be produced reliably",
      "Switch to a more advanced AI tool, which will make fewer of these factual mistakes",
    ],
    correctIndex: 1,
    explanation:
      "Repeated errors are a pattern, so fixing events is not enough. Better description (supplying facts) and built-in discernment (a named check) change the structure that produces the mistakes.",
    difficulty: 3,
    moduleNumber: 9,
  },
];
