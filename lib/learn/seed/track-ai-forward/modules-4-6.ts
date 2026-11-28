import type { SeedModule } from "../types";

// Becoming the AI-Forward Professional in Your Field: Modules 4-6.
// Illustrative examples only. No invented statistics, studies, quotes or companies.

export const AI_FORWARD_MODULES_4_TO_6: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 4
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Your Field, AI-Forward",
    summary:
      "Take stock of your own work, see how AI-forward professionals in different fields use it, measure what it really saves you, and stay on the right side of quality, confidentiality and accountability.",
    lessons: [
      {
        title: "The task inventory: automate, augment or keep human",
        objective: "Sort the recurring tasks in your own role into automate, augment or keep human, and pick one to start with.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Start with your work, not the tools

In Module 2 you met the main kinds of AI tool, and in Module 3 you used them on email, meetings and documents. Those were general wins. This module is about your field and your role specifically.

The most useful thing an experienced professional can do at this point is not to learn another tool. It is to look carefully at their own week and ask: which parts of this is AI actually good for? You already know your work better than any tool vendor or consultant ever will. That expertise is your advantage here, not a handicap.

The method is a **task inventory**: a plain list of what you actually do, sorted into three groups.

## Three groups, not two

Most conversations about AI at work are framed as "will it replace this or not?". That is too blunt. A better sort has three groups.

- **Automate.** Repetitive, rule-like tasks where the output is easy to check and a mistake is cheap to catch. Turning a meeting recording into a first-draft summary. Reformatting a list. Drafting a routine acknowledgement email. AI does the first pass almost entirely; you glance and send.
- **Augment.** Tasks where your judgement is the point, but AI can do part of the legwork. Researching a question before you form a view. Drafting a report you will heavily edit. Preparing for a difficult conversation by rehearsing it. You stay in charge; AI is the assistant.
- **Keep human.** Tasks where the value is you: your presence, your accountability or your relationship. Delivering bad news. Making a decision that affects someone's livelihood, health or liberty. Signing off work that carries your professional name. AI might help you prepare, but the task itself stays yours.

The middle group is usually the largest and the most valuable. People who only look for things to automate miss most of the benefit.

Warm up before you write your own list: sort the deck of real office tasks below, then compare your choices with the reasons given.

\`\`\`studio
task-sorter:office
\`\`\`

## How to build your inventory

Keep it simple. A table in a document or spreadsheet is enough.

1. **List what you do.** Look back over the last two weeks: your calendar, sent emails, documents you touched. Aim for fifteen to twenty-five tasks, described as verbs ("prepare monthly budget report", not "finance").
2. **Add two columns for each task:** roughly how often you do it, and roughly how long it takes. Estimates are fine at this stage.
3. **Add a risk column:** what happens if this goes wrong? Low (a colleague spots it and shrugs), medium (rework or embarrassment), high (harm to a client, patient, pupil or the organisation).
4. **Sort each task** into automate, augment or keep human.

A useful rule of thumb: a high-risk task is almost never in the automate group, however repetitive it looks. Risk moves a task towards the human end.

## Look at the whole system, not just the task

Before you pick a starting point, look around the task. Tasks are parts of a system: they have inputs from someone and outputs that go to someone. Speeding up one step can simply move the queue somewhere else.

Imagine a housing officer who uses AI to draft case notes twice as fast. If those notes then wait a week for a manager to review them, the officer's speed changes little for the tenant. The **bottleneck** (the slowest step that limits the whole flow, an idea from the theory of constraints) is the review, not the drafting. That does not mean the officer should not use AI. It means they should know where the real delay sits before they promise anyone faster results.

So for each promising task, ask: who receives this, and what happens to it next?

## Choosing your first target

Pick one task that scores well on three things: frequent, moderate or low risk, and in the automate or augment group. Frequency matters more than size. Saving ten minutes on something you do daily beats saving an hour on something you do twice a year.

You can use AI to help sort the list itself. It will not know your field as well as you, so treat its suggestions as a prompt for your own thinking.

\`\`\`try
I am a [YOUR ROLE] in [YOUR FIELD]. Here are tasks from my typical fortnight, with how often I do each and how long it takes:

[PASTE YOUR TASK LIST]

For each task, suggest whether it belongs in AUTOMATE, AUGMENT or KEEP HUMAN, with one sentence of reasoning. Flag any task where a mistake could harm a client or breach confidentiality, and put those no higher than AUGMENT. Then ask me two questions about my work that would help you sort the ones you are unsure of.
\`\`\`

Notice that the prompt contains no confidential details: only task descriptions. Keep it that way.

## Try it now

Build your inventory.

1. List at least fifteen tasks from the last two weeks, each with frequency, time and risk.
2. Sort each into automate, augment or keep human. Run the prompt above if you want a second opinion, then overrule it wherever your experience disagrees.
3. Circle one task to start with and write one sentence on who receives its output next.

You are done when you have a sorted list of fifteen or more tasks and one clearly chosen starting task.`,
        microCheck: [
          {
            question: "A task is repetitive and rule-like, but a mistake could harm a client. Where should it go?",
            options: [
              "Automate, because repetitive tasks are what AI handles best",
              "Augment at most, because the risk moves it towards the human",
              "Keep human, because AI should never touch client-facing work",
              "Leave it off the inventory, since risky tasks are out of scope",
            ],
            correctIndex: 1,
            explanation:
              "Risk moves a task towards the human end. Repetition alone does not make something safe to automate, but banning AI from all client work throws away useful help with preparation and drafting.",
          },
          {
            question: "Why does the inventory use three groups instead of simply 'AI can do it' or 'AI cannot'?",
            options: [
              "Because most value sits in tasks where AI assists your judgement",
              "Because three groups are easier to fit into a single spreadsheet",
              "Because managers expect exactly three categories in any analysis",
              "Because AI tools label their own suitability in three bands now",
            ],
            correctIndex: 0,
            explanation:
              "The augment group, where you stay in charge and AI does part of the legwork, is usually the largest and most valuable. A two-way sort hides it.",
          },
          {
            question: "You draft reports twice as fast with AI, but they still sit for a week awaiting sign-off. What does this show?",
            options: [
              "The drafting step was never worth improving in the first place",
              "The AI tool is too slow and should be replaced with a better one",
              "The bottleneck is the sign-off, so the overall flow barely changes",
              "The reports should skip sign-off now that AI has checked them",
            ],
            correctIndex: 2,
            explanation:
              "A system moves at the pace of its slowest step. Faster drafting still helps you, but the bottleneck is review, so promise faster results only once that is addressed.",
          },
          {
            question: "Which is the best first target from a task inventory?",
            options: [
              "A rare, high-stakes annual report that takes several days",
              "A daily, low-risk task in the augment or automate group",
              "The task you personally find most boring, whatever the risk",
              "The task your manager has mentioned most often this month",
            ],
            correctIndex: 1,
            explanation:
              "Frequency multiplies small savings, and low risk means early mistakes are cheap. Boredom and visibility are real motivations, but they do not make a task a safe or valuable first step.",
          },
        ],
      },
      {
        title: "Field playbooks: how AI-forward professionals work",
        objective: "Adapt a field playbook to your own role, naming the useful uses and the confidentiality or regulatory limits that apply.",
        durationMinutes: 28,
        contentType: "article",
        bodyMd: `## Same tools, different rules

The tools you met in Module 2 are the same in every field. What changes is the rules around them: who owns the information, what law or professional code applies, and what happens if something goes wrong.

Below are short playbooks for eight fields. Every example is **illustrative**: a picture of how a careful professional might work, not a report of any real organisation. Read your own field closely and skim the rest. Neighbouring fields often give you ideas.

One rule applies to all of them: only use tools your organisation has approved for the kind of information involved, and check what your own regulator or professional body says. Rules differ between countries and change over time.

## Health, law and finance

**Healthcare administration.** Imagine a practice manager who uses an approved assistant to draft rota changes, turn policy documents into plain-English staff briefings and summarise long supplier contracts. Uses that augment: drafting patient-facing letters from a template, which a clinician checks. **Caution:** health information is among the most sensitive data there is (under UK and EU GDPR it is "special category" data). Never paste identifiable patient details into a tool that is not approved for them, and never let AI make or imply a clinical judgement.

**Legal.** Imagine a solicitor who uses AI to produce a first summary of a long bundle, draft a chronology or suggest questions for a client meeting. **Caution:** client confidentiality and legal privilege come first. AI tools can produce confident references to cases or clauses that do not exist, so every citation is checked against the primary source before it goes anywhere. The professional signing the work is responsible for all of it.

**Finance.** Imagine an accountant who uses AI to explain a variance in plain language, draft a client email about a change in rules, or write a spreadsheet formula. **Caution:** AI is unreliable at arithmetic unless it is actually running a calculation, so figures are recomputed in the spreadsheet, not trusted from the chat. Client financial data stays in approved systems, and anything that looks like advice follows your firm's regulated process.

## Education, social work and the trades

**Education.** Imagine a secondary teacher who uses AI to produce three versions of a reading passage at different levels, draft a rubric or generate practice questions. **Caution:** do not paste pupils' names, grades or personal circumstances into an unapproved tool. Check your school's policy on AI in assessment, and remember that AI-generated questions can contain errors that pupils will then learn.

**Social work.** Imagine a social worker who uses an approved tool to structure notes after a visit, or to draft a letter in plainer language for a family. **Caution:** case information is highly sensitive and often concerns vulnerable people. The professional judgement about risk and safeguarding is never delegated. AI can help you write clearly about a decision; it does not make the decision.

**Trades.** Imagine an electrician who runs a small business and uses AI to draft quotes from site notes, write customer follow-ups and turn a voice memo into a job sheet. **Caution:** AI may state regulations or technical standards confidently and wrongly. Anything touching safety is checked against the current official standard, not the chatbot. Customer addresses and payment details stay out of general tools.

## Sales and HR

**Sales.** Imagine an account manager who uses AI to research a prospect's public information before a call, draft a tailored follow-up and summarise a long request for proposal. **Caution:** check what the customer contract says about sharing their information with third-party tools. Never let AI invent claims about your product's capabilities; every promise in a proposal must be one your organisation can keep.

**Human resources.** Imagine an HR adviser who uses AI to draft a job advert, turn a policy into a clear FAQ or prepare for a difficult conversation by rehearsing it. **Caution:** employee records are personal data. Using AI to screen, rank or assess people is a high-stakes use that many regulators treat with particular care (the EU AI Act, for example, puts many employment uses in its high-risk tier). Keep decisions about people with people, and check the current rules before any tool touches them.

Try a field deck: sort the healthcare admin tasks below, or switch to the teacher, social worker or sales deck to match your own field.

\`\`\`studio
task-sorter:healthcare
\`\`\`

## The pattern underneath

Look across all eight and the same shape appears:

- **Useful everywhere:** drafting, summarising, restructuring, explaining, preparing.
- **Checked everywhere:** facts, figures, citations and anything regulated.
- **Kept human everywhere:** decisions about people, professional sign-off and anything you are personally accountable for.

The playbook for your field is mostly the list of what goes in the second and third groups, and why.

\`\`\`try
I work as a [ROLE] in [FIELD] in [COUNTRY]. Draft a one-page personal AI playbook for me with three headings: "Good uses", "Always check", and "Never delegate". Give four to six items under each, specific to my kind of work. Then list the types of information I should never paste into a general AI tool in my role. Finally, list the questions I should ask my organisation or professional body to confirm the rules, because you may not know my current local regulations.
\`\`\`

## Try it now

Run the prompt above for your own role. Then edit the result against your experience: delete anything that does not fit, add anything it missed, and underline any rule you are not sure about.

You are done when you have a one-page playbook in your own words and at least one question to take to your manager, compliance team or professional body.`,
        microCheck: [
          {
            question: "An accountant asks an AI chat to total a column of client figures. What is the safest approach?",
            options: [
              "Trust the total, since arithmetic is the easiest task for AI",
              "Recompute the figures in the spreadsheet rather than the chat",
              "Ask the chat to double-check its own total before using it",
              "Round the figures first so the AI is less likely to make errors",
            ],
            correctIndex: 1,
            explanation:
              "Chat assistants can produce plausible but wrong arithmetic unless they actually run a calculation. The spreadsheet is the reliable tool; asking the model to recheck itself is not an independent check.",
          },
          {
            question: "Across every field playbook, which kind of task consistently stays with the human?",
            options: [
              "Drafting first versions of routine letters and emails",
              "Summarising long documents before a meeting or a call",
              "Decisions about people and work under your professional sign-off",
              "Restructuring notes into a clearer format for colleagues",
            ],
            correctIndex: 2,
            explanation:
              "Drafting, summarising and restructuring are useful in every field. Decisions about people and anything you are personally accountable for stay with you.",
          },
          {
            question: "A teacher wants AI to write personalised feedback and plans to paste in pupils' names and grades. What is the first question to ask?",
            options: [
              "Whether the school has approved this tool for pupil data",
              "Whether the feedback will sound warm enough to the pupils",
              "Whether the AI can produce the feedback in under a minute",
              "Whether other teachers in the department are doing it too",
            ],
            correctIndex: 0,
            explanation:
              "Pupil names and grades are personal data, so the tool must be approved for that data before anything is pasted. Tone, speed and what colleagues do all come after that.",
          },
          {
            question: "A tradesperson asks AI which wiring regulation applies to a job. How should they treat the answer?",
            options: [
              "As reliable, because regulations are published and well known",
              "As a starting point, checked against the current official standard",
              "As probably out of date, so the opposite of what it says is more likely",
              "As acceptable if the AI gives a regulation number with its answer",
            ],
            correctIndex: 1,
            explanation:
              "AI can state technical standards confidently and wrongly, and a regulation number can be invented too. For safety matters, the current official standard is the authority.",
          },
        ],
      },
      {
        title: "Measuring your own time savings honestly",
        objective: "Record a simple baseline and a before-and-after log that captures both time and quality for one task.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Why measure at all?

"AI saves me loads of time" is the most common claim you will hear, and it is often true. It is also often untested. People remember the drafting that took two minutes and forget the twenty minutes spent checking and fixing it.

You are going to measure for two reasons. First, for yourself: to know which uses are genuinely worth it and which only feel productive. Second, for later: in Module 5 you will make the case to your manager, and a small, honest log is far more persuasive than enthusiasm.

## Step 1: a baseline

A **baseline** is how the task goes without AI. Without it, any "after" number means nothing.

Take the task you chose in the first lesson. The next three or four times you do it the usual way, note:

- **Start and finish time**, including any interruptions you can subtract.
- **Quality**, on a simple scale you define in advance. For a report, it could be "number of corrections my manager asked for". For an email, "did I need a follow-up to clarify?".
- **A one-line note** on anything unusual ("unusually long case", "interrupted twice").

Three or four entries are enough to see a rough pattern. You are not running a scientific study; you are replacing a guess with a record.

## Step 2: the after log

Now do the same task with AI, several times, and log the same things. Crucially, the time includes **everything**:

- writing or finding the prompt,
- preparing and removing sensitive details from the input,
- reading and checking the output,
- fixing what was wrong.

A simple log looks like this:

\`\`\`
Task: [TASK]      Quality measure: [HOW YOU JUDGE IT]
Date | With AI? | Minutes (all-in) | Quality | Notes
[..] | No       | 40               | 2 fixes | long case
[..] | Yes      | 25               | 1 fix   | prompt from library
\`\`\`

The figures above are only an example layout. Use your own.

## Traps that inflate the numbers

**The checking time vanishes.** If you stop counting when the AI finishes, you are measuring the tool, not your work.

**Quality quietly drops.** Faster is not better if your manager now sends back more corrections or a client has to ask twice. That is why quality sits in the log next to time. A saving that costs quality is a trade-off, and you should see it clearly.

**The first week is unusual.** Early on you are learning, so it may be slower. Later, novelty wears off and you may check less carefully than you should. Log across a few weeks, not one afternoon.

**Rework shows up later.** A mistake caught downstream by a colleague costs time too, just not yours. That is a **delay** in the feedback: the cost appears after you have already counted the saving. Ask the person who receives your output whether anything has changed.

## What to do with the result

After a couple of weeks you will have one of three findings, and all of them are useful:

- **Clear saving, same or better quality.** Keep it, add the prompt to your library from Module 3, and move to the next task on your inventory.
- **Small or no saving.** Either the checking cost is too high for this task, or the prompt needs work. Try one improvement, then decide.
- **Faster but worse.** Rethink the task's group. It may belong in augment rather than automate, with more of you in the loop.

You can ask AI to help you read your log, but keep the judgement yours.

\`\`\`try
Here is my before-and-after log for [TASK]. Minutes are all-in, including checking and fixing:

[PASTE LOG]

Summarise the difference in time and in quality separately. Point out anything that makes the comparison unfair (fewer entries on one side, unusual cases, learning-curve effects). Do not round the result up: if the evidence is weak, say so. End with one question I should ask the person who receives this work.
\`\`\`

## Try it now

Set up your log today.

1. Write down the task and how you will judge quality, before you collect any numbers.
2. Record your first baseline entry the next time you do the task without AI.
3. Put a reminder in your calendar two weeks from now to review the log.

You are done when the log exists with its quality measure defined and at least one real entry in it.`,
        microCheck: [
          {
            question: "A colleague says AI cut a task from 40 minutes to 5. They timed only the generation step. What is missing?",
            options: [
              "The cost of the AI subscription spread across the month",
              "The time spent preparing input, checking and fixing output",
              "The time the AI took to load before it began responding",
              "The number of other colleagues who could use the same prompt",
            ],
            correctIndex: 1,
            explanation:
              "Honest time savings are all-in. Preparing input, checking and fixing are part of the work, and they are often where most of the AI-assisted time actually goes.",
          },
          {
            question: "Why does the log record quality as well as time?",
            options: [
              "So that you can present a larger number to your manager later",
              "Because quality is easier to measure precisely than time is",
              "Because a faster result that needs more corrections is a trade-off",
              "Because AI tools report a quality score that should be copied across",
            ],
            correctIndex: 2,
            explanation:
              "Speed that costs quality may not be a saving at all. Recording both side by side makes the trade-off visible rather than hiding it.",
          },
          {
            question: "Your output now gets sent back by the reviewer more often, but only weeks later. Which idea does this illustrate?",
            options: [
              "A delay in feedback, where costs appear after the saving is counted",
              "A reinforcing loop, where each use of AI makes the next one much faster",
              "A bottleneck, where the reviewer is slower than everyone else",
              "Goodhart's law, where the reviewer is gaming the quality measure",
            ],
            correctIndex: 0,
            explanation:
              "The rework arrives after a delay, so it is easy to miss when you tally the saving. That is why you ask the person who receives your work, not just yourself.",
          },
          {
            question: "Why take a baseline before starting to use AI on the task?",
            options: [
              "Because many AI tools require a baseline before they will work at all",
              "Because without it, an 'after' figure has nothing to compare with",
              "Because your manager must approve the baseline before any pilot",
              "Because the baseline sets the quality score the AI must meet",
            ],
            correctIndex: 1,
            explanation:
              "Without a record of how the task went before, any claimed saving is a guess. Three or four baseline entries replace memory with evidence.",
          },
        ],
      },
      {
        title: "Quality, confidentiality and accountability",
        objective: "Apply a personal checklist for checking output, choosing approved tools, deciding on disclosure and keeping sensitive information out.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Your name is still on it

Everything you have learned so far rests on one principle: **you remain accountable for work you put your name to**, whoever or whatever drafted it. No regulator, client or manager will accept "the AI wrote that" as a reason for an error. That is not a reason to avoid AI. It is the reason to use it with a few firm habits.

This lesson turns those habits into four questions you can ask before anything leaves your hands.

## 1. Is this tool approved for this information?

Organisations increasingly have a list of approved AI tools, sometimes with different rules for different kinds of data. An enterprise version of an assistant may be approved for internal documents, while a free consumer app is not approved for anything confidential. Terms of service differ on whether your input may be stored or used to improve the product, and those terms change, so check the current ones rather than relying on memory.

If your organisation has no list yet, ask. If the answer is "we have not decided", assume the cautious position until it does: general tools for general, non-sensitive work only.

## 2. What should never be pasted?

Unless a tool is specifically approved for it, keep these out:

- **Personal data** about clients, patients, pupils, staff or members of the public: names, addresses, dates of birth, identifiers, health or financial details.
- **Confidential business information:** unreleased results, pricing, contracts, legal advice, anything marked confidential or covered by a non-disclosure agreement.
- **Security details:** passwords, access codes, system configurations.
- **Anything a client or employer has asked you to keep private.**

The workaround is usually easy. Replace details with placeholders ("Client A", "[DATE]", "[AMOUNT]"), describe the situation in general terms, or use the tool on the structure of a document rather than its content.

\`\`\`try
I need help with a task but must not share confidential details. Here is my situation described with placeholders:

[DESCRIBE THE TASK USING PLACEHOLDERS SUCH AS CLIENT A, [DATE], [AMOUNT]]

Help me with the task using only these placeholders. If you need more information, ask me for it in general terms rather than asking for names, figures or identifying details.
\`\`\`

Practise the first two questions at speed: call each card below Safe or Risky and read the explanation for anything you miss.

\`\`\`studio
spot-the-risk:workplace
\`\`\`

## 3. Have I checked what matters?

You cannot check everything to the same depth, so check in proportion to risk. A useful order:

1. **Facts, figures, names and dates**: compare against the source.
2. **Citations and references**: open them. AI tools can invent sources that look entirely real.
3. **Anything regulated or technical**: check against the authoritative document, not the AI's summary of it.
4. **Tone and fit**: would you be comfortable if the recipient knew exactly how this was produced?

That last question leads to the fourth.

## 4. Should I say AI was involved?

**Disclosure** means telling people when AI played a meaningful part in something. Practice varies by field and is still settling, so follow your organisation's guidance first. Where there is none, a reasonable approach:

- **Usually no need to mention** AI help with spelling, rephrasing or tidying your own work, much as nobody mentions a spellchecker.
- **Consider mentioning** when AI substantially drafted content that others will rely on, such as a report or a summary of evidence.
- **Always follow the rules** where a court, regulator, publisher, school or client requires disclosure.

The test is trust. If the person receiving it would feel misled on finding out, disclose.

## A balancing loop worth knowing

Checking is a **balancing loop**: the more AI output you produce, the more review it needs, and review time pushes back against the saving. That is healthy. It stops errors getting out. The danger is when people respond to the review burden by quietly checking less. Then the loop breaks, errors rise, and trust in AI (yours and your organisation's) falls with them. If checking is eating the saving, change the task or the prompt, not the checking.

## Try it now

Write your own four-line checklist, one line per question above, in words specific to your role. For example, "Approved tool: only [NAME OF APPROVED TOOL] for anything with client details."

Then apply it to the last piece of AI-assisted work you produced. You are done when you have the checklist saved where you will see it and have noted at least one thing you would now do differently.`,
        microCheck: [
          {
            question: "Your organisation has not yet decided which AI tools are approved. What is the sensible default?",
            options: [
              "Use any tool freely until a formal policy says you cannot",
              "Stop using AI entirely until the organisation has a policy",
              "Use general tools only for non-sensitive work and ask for a ruling",
              "Use tools for sensitive work as long as you delete the chat later",
            ],
            correctIndex: 2,
            explanation:
              "The cautious position keeps you productive without exposing sensitive information. Deleting a chat afterwards does not undo what was sent, and stopping altogether is more than the situation needs.",
          },
          {
            question: "You want AI help with a letter about a client dispute. What is the best way to protect confidentiality?",
            options: [
              "Paste the full letter but ask the tool not to store it",
              "Replace names, dates and amounts with clear placeholders",
              "Paste it into a new chat so the history is not connected",
              "Paste only the first half of the letter to limit exposure",
            ],
            correctIndex: 1,
            explanation:
              "Placeholders keep the structure you need help with while removing identifying details. A request not to store input, or a fresh chat, does not control what the service does with the data.",
          },
          {
            question: "Colleagues are finding that checking AI drafts eats most of the time saved. Which response is healthiest?",
            options: [
              "Check fewer drafts, since most of them turn out to be correct",
              "Ask the AI to check its own drafts instead of a person doing it",
              "Change the task or prompt so the drafts need less correction",
              "Accept that errors will rise slightly as the price of speed",
            ],
            correctIndex: 2,
            explanation:
              "Review is a balancing loop that keeps errors in check. Weakening it lets errors and distrust grow; improving the input or choosing a better-suited task reduces the burden safely.",
          },
          {
            question: "When is disclosing AI involvement most clearly the right call?",
            options: [
              "When AI corrected a few spelling mistakes in your own email",
              "When AI substantially drafted a report that others will rely on",
              "When you used AI to suggest a subject line for an internal note",
              "When AI reformatted a list of your own notes into bullet points",
            ],
            correctIndex: 1,
            explanation:
              "Light editing help is like a spellchecker. When AI substantially shaped content people will rely on, the trust test points towards disclosure, and some fields require it.",
          },
          {
            question: "An AI summary cites a guidance document by title and section number. What should you do before relying on it?",
            options: [
              "Nothing, since a section number shows the source was consulted",
              "Ask the AI whether it is sure the section number is correct",
              "Open the document and confirm the section says what is claimed",
              "Search for the title online and accept it if the title exists",
            ],
            correctIndex: 2,
            explanation:
              "AI can invent or misquote sources that look real, and a real title can still be misrepresented. Only reading the source confirms the claim.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A recruiter plans to let AI rank applicants and send rejections automatically because the task is repetitive. What is the main problem?",
        options: [
          "It is a high-stakes decision about people that should stay human",
          "AI cannot read CVs that arrive in more than one file format",
          "Rejection emails are too short to be worth automating at all",
          "Ranking is fine, but the rejections should be sent by post",
        ],
        correctIndex: 0,
        explanation:
          "Repetition does not make a task safe to automate. Decisions about people are high-risk and often specially regulated, so AI can help prepare but should not decide.",
      },
      {
        question: "You are sorting your task inventory. Which of these belongs most naturally in the augment group?",
        options: [
          "Reformatting a list of dates into a standard layout for a form",
          "Drafting a complex report you will then edit and sign yourself",
          "Delivering difficult news to a client in a face-to-face meeting",
          "Sending a routine acknowledgement that an enquiry has arrived",
        ],
        correctIndex: 1,
        explanation:
          "Augment means your judgement is the point but AI does part of the legwork. Reformatting and acknowledgements are closer to automate; delivering bad news in person stays human.",
      },
      {
        question: "A legal assistant's AI draft cites three cases. Two check out. What should happen with the third?",
        options: [
          "Keep it, since two correct citations suggest the third is right",
          "Keep it but add a footnote saying it was suggested by AI",
          "Remove or replace it unless it is confirmed in the primary source",
          "Ask the AI to confirm the case exists and then keep it if it does",
        ],
        correctIndex: 2,
        explanation:
          "Every citation is checked individually against the primary source. The model confirming itself is not independent, and a footnote does not make an unchecked citation acceptable.",
      },
      {
        question: "Someone's log shows AI cut their task time by half, but they stopped recording quality. What can they honestly conclude?",
        options: [
          "That AI saves half the time on this task with no downside",
          "That the task is faster, with the effect on quality unknown",
          "That quality must have improved, as faster work is less rushed",
          "That the log is useless and the whole exercise should restart",
        ],
        correctIndex: 1,
        explanation:
          "Without quality data the speed gain may hide a trade-off. The time finding still stands; the claim just needs to stay within what was measured.",
      },
      {
        question: "Why should the time in an after log include preparing and checking, not just generating?",
        options: [
          "Because regulators require all AI use to be timed in full",
          "Because those steps are part of doing the task with AI",
          "Because generation time is too short to measure accurately",
          "Because managers only accept figures that include overheads",
        ],
        correctIndex: 1,
        explanation:
          "The saving you care about is in your work, not the tool's speed. Preparation, checking and fixing are the real cost of using AI and are often the largest part.",
      },
      {
        question: "A practice manager wants AI to draft patient letters. Which set-up fits the healthcare playbook?",
        options: [
          "Any assistant, with the patient's details pasted in for accuracy",
          "An approved tool and a template, with a clinician checking content",
          "A free app, provided the letters are deleted from it afterwards",
          "Any assistant, as long as the letter has no clinical content at all",
        ],
        correctIndex: 1,
        explanation:
          "Health information is highly sensitive, so only approved tools should touch it, and clinical content needs clinical review. Deleting afterwards does not undo the exposure.",
      },
      {
        question: "Which of these is safest to paste into a general, unapproved AI tool?",
        options: [
          "A client contract with the names left in for context",
          "A staff member's absence record, to draft a letter",
          "A description of a task using placeholders like 'Client A'",
          "Unreleased quarterly figures, to draft the announcement",
        ],
        correctIndex: 2,
        explanation:
          "Placeholders keep the shape of the task while removing identifying and confidential detail. The others contain personal or confidential business information.",
      },
      {
        question: "Checking AI output is described as a balancing loop. What happens if people respond to the burden by checking less?",
        options: [
          "Errors can rise and trust in AI falls, undoing the saving",
          "The loop becomes reinforcing and saves even more time",
          "Nothing changes, because AI quality improves on its own",
          "The review burden moves to the AI vendor automatically",
        ],
        correctIndex: 0,
        explanation:
          "Review is what keeps errors in check. Weakening it lets mistakes out, and each visible mistake erodes the trust that adoption depends on.",
      },
      {
        question: "A teacher uses AI to generate practice questions for pupils. What is the main quality risk to guard against?",
        options: [
          "The questions may be too varied for pupils to find useful",
          "The questions may contain errors that pupils then learn",
          "The questions may take too long for the tool to generate",
          "The questions may be too similar to past exam papers",
        ],
        correctIndex: 1,
        explanation:
          "AI-generated material can contain confident mistakes, and in teaching those mistakes get learned. Checking the questions and answers before use is essential.",
      },
      {
        question: "Your organisation says nothing about disclosing AI use. You used AI to write most of an evidence summary for a board. What is the best approach?",
        options: [
          "Say nothing, since no rule requires you to mention it",
          "Mention it, because readers will rely on the content",
          "Mention it only if a board member asks you directly",
          "Rewrite a few sentences so it is no longer AI-written",
        ],
        correctIndex: 1,
        explanation:
          "When AI substantially shaped content that others will rely on, the trust test favours disclosure. Waiting to be asked or cosmetic rewriting does not meet that test.",
      },
      {
        question: "Why does saving ten minutes on a daily task usually beat saving an hour on a twice-yearly one as a starting point?",
        options: [
          "Daily tasks are always lower risk than rare ones",
          "Frequent savings add up and give quicker feedback",
          "Rare tasks cannot be done with AI tools at present",
          "Managers only notice improvements to daily tasks",
        ],
        correctIndex: 1,
        explanation:
          "Frequency multiplies the saving and gives you many chances to learn and adjust. Daily tasks are not automatically lower risk, so risk still has to be judged separately.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 5
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Bringing Your Workplace Along",
    summary:
      "See adoption as a system of incentives, fears and feedback loops, run a small pilot with a baseline, make a clear case to your manager, and help anxious colleagues get started.",
    lessons: [
      {
        title: "Adoption is a system",
        objective: "Map the incentives, fears, feedback loops and bottlenecks that shape how your workplace adopts AI.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Why good tools still go unused

You have probably seen it before: a new system arrives with a launch email and a training session, and six months later most people are doing things the old way. Nobody refused. It just did not stick.

That is rarely about the tool. It is about the **system** the tool lands in: what people are rewarded for, what they are afraid of, who they learn from, and where the work actually gets stuck. If you want your workplace to adopt AI well, you need to see that system first. This lesson gives you a few real, well-established ideas to do it.

## Incentives: what are people actually rewarded for?

People act on the incentives they face, not the ones in the strategy document. Ask:

- If someone saves two hours with AI, what happens to those hours? If the answer is "more work of the same kind", enthusiasm fades quickly.
- If someone makes a visible mistake with AI, what happens? If it is treated as a disaster, people will stay away or hide their use.
- Are people measured on outcomes (a good report, a happy client) or on activity (hours logged, tickets closed)?

Be wary of rewarding **AI usage** itself. **Goodhart's law** says that when a measure becomes a target, it ceases to be a good measure. Set a target for "number of AI prompts per week" and you will get prompts, not better work. Reward the outcomes AI is meant to improve.

## Fears: the reasons nobody says out loud

In Module 1 you worked through your own fears. Your colleagues have them too, and they are reasonable: fear of looking foolish, of being replaced, of getting something wrong with sensitive data, of their hard-won expertise suddenly counting for less.

These fears act like a brake. They do not show up in meetings as objections. They show up as "I have not had time to try it yet". Take them seriously, because arguing someone out of a fear rarely works; showing them a safe, small success often does.

## Feedback loops: how adoption grows or stalls

A **feedback loop** is a chain where an effect comes back round to influence its own cause.

**A reinforcing loop (trust through visible wins).** Someone uses AI on a small task and it goes well. A colleague sees it and tries it. More people try; more small wins are visible; trust grows; more people try. This loop is how adoption actually spreads, and it can run in reverse: a visible failure reduces trust, fewer people try, fewer wins are seen.

**A balancing loop (review burden).** As more AI output is produced, more of it needs checking. If a few senior reviewers carry that load, they become overwhelmed and push back, which slows adoption. This is not a bad thing in itself; it is the system protecting quality. But you need to plan for it.

**Delays.** Benefits often arrive later than costs. The effort of learning is immediate; the time saved comes weeks later. Systems with delays tempt people to give up just before the pay-off. Tell people to expect it.

## Bottlenecks: where the real limit sits

The **theory of constraints** says every system has one step that limits its overall output: the bottleneck. Improving anything else barely helps. In AI adoption, common bottlenecks include approval of tools by IT or legal, a single manager who reviews everything, or simply the lack of any time set aside to learn. Find it before you invest energy elsewhere.

## Seeing people, not just loops

Everett Rogers' work on the **diffusion of innovations** describes how new practices spread through groups, from innovators and early adopters through the early and late majority to the most sceptical. You do not need the theory in detail. The practical point: the enthusiasts are not the people others copy. The respected, sensible colleague who tries it and says "this is actually useful" does more for adoption than any launch email.

\`\`\`try
Help me map AI adoption in my team as a system. Context: [DESCRIBE TEAM SIZE, WORK, CURRENT AI USE, ANY POLICY].

Ask me up to five questions first, one at a time. Then produce:
1. The main incentives that encourage or discourage use.
2. Likely unspoken fears.
3. One reinforcing loop and one balancing loop, each as a short chain of causes.
4. The most likely bottleneck, and what would tell me I have found the real one.
Keep it specific to what I tell you; do not invent facts about my organisation.
\`\`\`

## Try it now

Run the prompt above, answer its questions honestly, then sketch the result on one page: incentives, fears, one reinforcing loop, one balancing loop and your best guess at the bottleneck.

You are done when you can name the single thing in your workplace that most limits good AI use, and say why.`,
        microCheck: [
          {
            question: "A director sets a target of fifty AI prompts per person per week. What is the most likely result?",
            options: [
              "Better work, because more practice always improves the outcomes",
              "Lots of prompts, with little link to whether the work improves",
              "Resistance at first, followed by steady genuine improvement",
              "No change, because staff will not notice a target like this",
            ],
            correctIndex: 1,
            explanation:
              "This is Goodhart's law: once a measure becomes the target, people optimise the number rather than the goal. Reward the outcomes AI should improve instead.",
          },
          {
            question: "A colleague shares a quick AI win, two others try it, and they share their wins. What is this?",
            options: [
              "A balancing loop, because the whole team is settling on one method",
              "A bottleneck, because one person is controlling the spread",
              "A reinforcing loop, where visible wins build trust and more use",
              "A delay, because the benefits took time to be seen by others",
            ],
            correctIndex: 2,
            explanation:
              "Each win leads to more trying, which leads to more wins. That self-amplifying chain is a reinforcing loop, and it can run in reverse after a visible failure.",
          },
          {
            question: "Everyone in a team wants to use AI, but every tool request waits months for approval. Where should effort go first?",
            options: [
              "More training sessions, so people are ready when tools arrive",
              "A prompt library, so people have good prompts to start with",
              "The approval process, since it is the step limiting everything",
              "Individual targets, so people feel pressure to find a way round",
            ],
            correctIndex: 2,
            explanation:
              "The theory of constraints says improving anything other than the bottleneck barely changes the overall flow. Here that bottleneck is approval.",
          },
          {
            question: "Colleagues keep saying they 'have not had time to try it yet'. What is the most useful interpretation?",
            options: [
              "They are too busy and should be given fewer tasks to do",
              "It may mask an unspoken fear best met with a safe small win",
              "They are opposed to AI and are unlikely ever to change their view",
              "The tool must be poor, as good tools get used without effort",
            ],
            correctIndex: 1,
            explanation:
              "Fears rarely surface as objections; they surface as delay. Showing a safe, small success tends to work better than arguing someone out of a fear.",
          },
        ],
      },
      {
        title: "Starting a small pilot",
        objective: "Design a small pilot with one team, one workflow, a baseline, clear success criteria and a review date.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Small beats grand

When people get excited about AI, they tend to propose something big: "Let us roll it out across the department." Big launches are slow to approve, hard to measure and embarrassing when they stall.

A **pilot** is the opposite: a small, time-limited trial designed to answer one question. Does AI make this particular workflow better for this particular team? It is cheap to run, cheap to stop, and whatever the result, you learn something real.

It also feeds the reinforcing loop from the last lesson. A small, visible, honest success is exactly what builds trust.

## The five parts of a good pilot

**1. One team.** Choose three to eight people who do the same work and are willing. Include at least one respected sceptic if you can. A result that convinces a sceptic convinces others.

**2. One workflow.** Use your task inventory. Pick a frequent, low-to-moderate risk task where people agree the current way is tedious. "Drafting the weekly status update" is a good pilot. "Using AI for everything" is not.

**3. A baseline.** Before anyone changes anything, record how the workflow runs now, using the approach from Module 4: time all-in, and a quality measure agreed in advance. Two weeks of baseline is usually plenty.

**4. Success criteria written in advance.** Decide now what result would make you continue, change or stop. For example: "Continue if time drops noticeably and corrections do not rise." Writing this first protects you from fitting the story to the numbers afterwards.

**5. A review date.** Put it in the calendar before you start: often four to six weeks is enough. On that date the team meets and decides, using the criteria, whether to continue, adjust or stop.

## Guardrails before day one

A pilot is still real work, so settle the rules before anyone starts:

- **Which tool**, and confirmation that it is approved for the information involved.
- **What must not be pasted**, in plain words specific to this workflow.
- **Who checks output**, and how. Plan for the review burden (the balancing loop). If one person reviews everything, they will become the bottleneck.
- **What happens if something goes wrong.** A mistake during a pilot should be logged and learned from, not punished. Otherwise people hide problems and your results mean nothing.

## Watch for pilot traps

**The enthusiasm effect.** People in a new, visible trial often try harder whatever the tool does. Keep the pilot going long enough for novelty to fade before you judge.

**Measuring what is easy, not what matters.** Counting AI-generated drafts is easy. Whether the drafts were good is what matters. Keep quality in the log.

**Scope creep.** Halfway through, someone suggests adding another workflow. Say "good idea for the next pilot". Changing two things at once means you cannot tell which one caused the result.

## A pilot plan on one page

\`\`\`try
Help me write a one-page AI pilot plan. Details:
- Team: [WHO, HOW MANY]
- Workflow: [THE ONE TASK]
- Tool: [APPROVED TOOL]
- What must stay out of the tool: [SENSITIVE INFORMATION]
- Current baseline (if known): [TIME AND QUALITY]

Structure the plan as: purpose (one sentence), scope, guardrails, baseline method, success criteria (continue / adjust / stop), review date, and who does what. Keep it under 350 words. Where I have not given you information, leave a clearly marked gap rather than inventing it.
\`\`\`

## Try it now

Draft your pilot plan with the prompt above, then check it against the five parts: one team, one workflow, a baseline, criteria written in advance and a review date.

You are done when every part is filled in (or has a named gap you will close this week) and you have a date by which you will ask your team or manager whether you can start.`,
        microCheck: [
          {
            question: "Why should success criteria be written before the pilot starts?",
            options: [
              "Because most AI tools need the criteria entered before first use",
              "Because it stops you fitting the story to the numbers afterwards",
              "Because criteria written later are always set too generously",
              "Because a manager cannot approve a pilot that lacks exact figures",
            ],
            correctIndex: 1,
            explanation:
              "Criteria set in advance keep the evaluation honest. Written afterwards, they tend to describe whatever happened, which makes the pilot unable to fail.",
          },
          {
            question: "Three weeks into a pilot, a team member suggests adding a second workflow. What is the best response?",
            options: [
              "Add it now, as more workflows give more evidence for the case",
              "Add it, but only if the first workflow is already going well",
              "Note it for a later pilot so the results stay interpretable",
              "Stop the pilot and restart with both workflows from the start",
            ],
            correctIndex: 2,
            explanation:
              "Changing two things at once means you cannot tell which caused the result. Capturing the idea for the next pilot keeps goodwill without muddying this one.",
          },
          {
            question: "Why include a respected sceptic in the pilot team if you can?",
            options: [
              "A result that convinces a sceptic is more convincing to others",
              "Sceptics are faster at learning new tools than enthusiasts",
              "Pilots must include a sceptic to pass most approval processes",
              "A sceptic will make sure the pilot fails quickly if it is weak",
            ],
            correctIndex: 0,
            explanation:
              "Others copy respected, sensible colleagues more than enthusiasts. A sceptic's honest verdict carries weight in whichever direction it falls.",
          },
          {
            question: "In a pilot, one manager reviews every AI draft and falls behind. What has happened?",
            options: [
              "The tool is producing drafts that are too long to review",
              "The review step has become the bottleneck of the workflow",
              "The team is producing too few drafts to measure results",
              "The pilot has proved that AI adds no value to this work",
            ],
            correctIndex: 1,
            explanation:
              "The review burden is a balancing loop, and concentrating it in one person turns it into the constraint. Spreading or streamlining review is part of good pilot design.",
          },
        ],
      },
      {
        title: "Making the case to your manager",
        objective: "Write a one-page pitch that turns your pilot results into a clear, honest request your manager can act on.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## What your manager needs to hear

Your manager is not asking "is AI exciting?". They are asking questions like: Is this safe? What will it cost in time and money? What could go wrong, and would I be blamed? What exactly do you want from me?

A good pitch answers those questions in one page. It is short because your manager is busy, and honest because your credibility is the real asset. Overclaim once and every future request is discounted.

## The structure of a one-page pitch

1. **The ask, first.** One sentence: what you want them to approve. "I would like to extend the status-report pilot to the whole team for three months."
2. **The problem.** What was slow, error-prone or frustrating before, in your manager's terms.
3. **What you tried.** The pilot in two or three sentences: who, what workflow, which approved tool, how long.
4. **What happened.** Your baseline and after figures, time and quality side by side. Include what did not work.
5. **Risks and how they are handled.** Confidentiality, checking, disclosure. Show you have thought about these before they do.
6. **Cost.** Licences, time for training and set-up, any review burden.
7. **The next step and review point.** What happens next, and when you will report back.

Put the ask first. Managers who read only the first paragraph should still know what you want.

## Honesty makes it stronger

It is tempting to leave out the week the tool made things worse, or the one colleague who found it unhelpful. Do not. Including limitations does three things: it shows you measured properly, it answers objections before they are raised, and it makes your positive results believable.

A few other points:

- **Use your real numbers and say how many entries they rest on.** "Across our log of [N] reports" is stronger than a rounded percentage with no base.
- **Separate what you measured from what you expect.** "We saw X in the pilot. If it holds at team scale, we would expect roughly Y." Keep them visibly distinct.
- **Do not promise headcount savings.** They are rarely what happens, they frighten colleagues, and they turn your pilot into a threat. Talk about time freed for higher-value work, and name that work.

## Let AI draft it from your results

This is an excellent task for AI: you have the facts, and you need them arranged clearly for a specific reader. Give it your real log and notes; do not let it fill gaps.

\`\`\`try
Draft a one-page pitch to my manager based on the pilot results below. My manager cares most about [E.G. RISK, CLIENT SATISFACTION, COST, TEAM WORKLOAD].

Pilot details: [TEAM, WORKFLOW, TOOL, DURATION]
Baseline log summary: [TIME AND QUALITY BEFORE, NUMBER OF ENTRIES]
After log summary: [TIME AND QUALITY AFTER, NUMBER OF ENTRIES]
What did not work: [PROBLEMS, SCEPTICAL FEEDBACK]
Guardrails we used: [APPROVED TOOL, WHAT STAYED OUT, WHO CHECKED]
What I am asking for: [THE ASK]

Structure: the ask, the problem, what we tried, what happened (time and quality separately), risks and controls, cost, next step and review date. Under 400 words. Use only the figures I have given; if something is missing, write [NEEDED: ...] instead of estimating. Do not promise staff reductions.
\`\`\`

Then edit it in your own voice. Read it as your manager would, looking for the weakest sentence, and fix that one.

## Anticipate the conversation

Your manager will likely ask one or two questions the page does not answer. Prepare for these:

- "What happens if someone pastes confidential data by mistake?"
- "Who checks the output, and does that just move work to someone else?"
- "What would make you recommend stopping?"

If you do not know an answer, say so and offer to find out. That is more reassuring than improvising.

## Try it now

If you have run a pilot, draft your pitch with the prompt above. If not yet, draft it with the figures left as [NEEDED] gaps: it doubles as a plan for what your pilot must measure.

You are done when you have a one-page pitch with the ask in the first sentence, time and quality reported separately, at least one limitation included, and answers ready for the three questions above.`,
        microCheck: [
          {
            question: "Why should the ask appear in the first sentence of the pitch?",
            options: [
              "Because a busy reader may only read the opening paragraph",
              "Because managers are required to respond to the first line",
              "Because putting it last seems more polite and less pushy",
              "Because the ask matters less than the evidence that follows",
            ],
            correctIndex: 0,
            explanation:
              "Leading with the ask means even a skimming reader knows what you want. Evidence then supports a request they already understand.",
          },
          {
            question: "Your pilot had one week where the tool made things slower. What should the pitch do with it?",
            options: [
              "Leave it out, since it was a one-off and might only confuse the reader",
              "Include it briefly, as limitations make the other results credible",
              "Average it into the totals without mentioning it separately",
              "Blame it on the tool vendor so the team's work is not questioned",
            ],
            correctIndex: 1,
            explanation:
              "Reporting what did not work shows you measured properly and answers objections in advance. Hiding it risks your credibility if it surfaces later.",
          },
          {
            question: "Why avoid promising headcount savings in the pitch?",
            options: [
              "Because managers are not allowed to discuss staffing levels",
              "Because such savings are illegal under current employment law",
              "Because it frightens colleagues and turns the pilot into a threat",
              "Because AI tools cannot yet save enough time to affect staffing levels",
            ],
            correctIndex: 2,
            explanation:
              "Promised cuts undermine the trust that adoption depends on and are rarely what actually happens. Time freed for named, higher-value work is a more honest framing.",
          },
          {
            question: "An AI draft of your pitch includes a percentage saving you never measured. What should you do?",
            options: [
              "Keep it if it looks close to what you remember from the pilot run",
              "Remove it and use only figures from your log, marking any gaps",
              "Keep it but round it down so it is not an overclaim",
              "Ask the AI where it got the figure and keep it if it explains",
            ],
            correctIndex: 1,
            explanation:
              "An invented figure is still invented, however plausible or modest. Use only what you measured and mark missing data as a gap.",
          },
        ],
      },
      {
        title: "Helping colleagues who are anxious",
        objective: "Plan practical support for anxious colleagues using champions, lunch-and-learns, a shared prompt library and a short usage guideline.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Remember where you started

At the start of this course you may have felt behind, intimidated or quietly worried that your experience was about to count for less. Many of your colleagues feel exactly that now. Some are more senior than you, which can make it harder for them to admit.

Your job is not to convert anyone. It is to make trying AI feel safe, small and useful. The approaches in this lesson are ordinary and low-cost, and they work with the adoption system rather than against it.

## Lead with respect for expertise

The fastest way to lose an anxious colleague is to imply their way of working is out of date. The fastest way to help them is to show how AI can make their expertise go further.

- **Start from their pain, not your enthusiasm.** Ask what part of their week they would most like to get back.
- **Frame AI as the assistant, never the expert.** Their judgement checks the output. That is the point, not a weakness.
- **Be honest about limits.** Say plainly where AI gets things wrong. Colleagues trust people who admit limitations more than people who promise miracles.
- **Allow people to opt out of the spotlight.** Offer help one-to-one for those who would rather not experiment in front of others.

**Psychological safety**, a term associated with Amy Edmondson's research on teams, means people believe they will not be punished or humiliated for asking questions or making mistakes. Learning a new tool requires lots of small mistakes, so this matters more than any training content.

## Champions

A **champion** is a colleague who uses AI well and is willing to help others informally. Good champions are not necessarily the most enthusiastic. They are patient, trusted and honest about limitations.

A workable pattern: one champion per team, with a small amount of protected time (say, an hour a week) to answer questions and share what works. Without protected time, the champion becomes a bottleneck and eventually burns out.

## Lunch-and-learns

A **lunch-and-learn** is a short, informal session, often over lunch, where someone demonstrates one thing. Keep them:

- **Short**: twenty to thirty minutes.
- **Specific**: one real task from your workplace, not a tour of features.
- **Live**: do the task in front of people, including the checking. If the AI makes a mistake, even better; show how you caught it.
- **Hands-on**: finish with everyone trying the same prompt on their own work.

## A shared prompt library

In Module 3 you built a personal prompt library. A **shared** one does the same for a team: a simple document or folder of prompts that work for your common tasks, each with a note on what to check. It lowers the barrier for beginners (they start from something that works) and spreads good practice without anyone having to be taught.

Give each entry an owner and a "last checked" date, so the library does not fill up with prompts that no longer work.

## A short usage guideline

Anxious people often worry most about doing something wrong. A one-page guideline removes that worry by saying clearly what is fine. Keep it plain:

\`\`\`try
Draft a one-page AI usage guideline for my team of [NUMBER] people who work on [TYPE OF WORK]. Our approved tools are [TOOLS]. It must be friendly and plain, not legalistic, and cover:
1. What AI is good for in our work (four examples).
2. What must never be pasted in (specific to our information).
3. How to check output before it is used.
4. When to mention that AI was involved.
5. Who to ask for help, and that honest mistakes should be reported, not hidden.
Keep it under 350 words and mark any point that needs sign-off from [MANAGER OR COMPLIANCE] with [CONFIRM].
\`\`\`

Remember that a guideline is not your decision alone. Draft it, then take it to whoever owns policy.

## Try it now

Choose one colleague who seems hesitant. Plan a fifteen-minute, one-to-one session built around one task from their week that they find tedious. Write down: the task, the prompt you will start from, what they will need to check, and how you will make it safe for them to say "this did not help".

You are done when you have the plan written and a time proposed to them.`,
        microCheck: [
          {
            question: "An experienced colleague seems nervous about AI. Which opening is most likely to help?",
            options: [
              "Explaining how much faster everything is with the latest tools",
              "Asking which part of their week they would most like to get back",
              "Showing them a list of features the new assistant now offers",
              "Mentioning that most of the team has already started using it daily",
            ],
            correctIndex: 1,
            explanation:
              "Starting from their own pain point respects their expertise and makes the value concrete. Speed claims, feature tours and social pressure tend to raise anxiety.",
          },
          {
            question: "During a lunch-and-learn demo, the AI makes an error. What is the best response?",
            options: [
              "Move on quickly and re-run it until a better answer appears",
              "Show how you spotted and fixed it, as checking is part of the skill",
              "Explain that the tool normally does not make mistakes quite like that",
              "End the session early and reschedule once the tool is working",
            ],
            correctIndex: 1,
            explanation:
              "Showing the check in action is one of the most valuable things a demo can do. It builds realistic trust and models the habit you want people to adopt.",
          },
          {
            question: "Why give a team champion protected time rather than relying on goodwill?",
            options: [
              "Without it the champion becomes a bottleneck and may burn out",
              "Because champions are required by most AI tool licences",
              "Because protected time makes the role more senior and official",
              "So the champion can do everyone else's AI work on their behalf",
            ],
            correctIndex: 0,
            explanation:
              "Helping others takes real time. If it all lands on top of a full job, questions queue up behind one person and the champion eventually stops.",
          },
          {
            question: "What most helps a shared prompt library stay useful over time?",
            options: [
              "Adding as many prompts as possible so every task is covered",
              "An owner and a 'last checked' date on each prompt entry",
              "Restricting access to champions so the quality stays high",
              "Writing every prompt in the most detailed form possible",
            ],
            correctIndex: 1,
            explanation:
              "Prompts go stale as tools and tasks change. Ownership and a review date keep the library trustworthy; restricting access defeats its purpose.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A company rewards staff for the number of AI tools they have logged into. Six months on, work quality is unchanged. Which idea best explains this?",
        options: [
          "Goodhart's law: people optimised the measure, not the goal",
          "A delay: the benefits will arrive within the next quarter",
          "A bottleneck: the tools are waiting for approval from IT",
          "Diffusion: only the innovators have adopted the tools so far",
        ],
        correctIndex: 0,
        explanation:
          "Logins became the target, so people produced logins. Rewarding the outcomes AI should improve avoids turning the measure into the goal.",
      },
      {
        question: "After a colleague's AI-drafted email contains a visible error, several people stop using AI. What is happening?",
        options: [
          "A balancing loop that is correctly limiting the review burden",
          "A reinforcing loop running in reverse, as trust falls with use",
          "A bottleneck caused by the colleague who made the mistake",
          "Goodhart's law, because the email was measured on its speed",
        ],
        correctIndex: 1,
        explanation:
          "The same loop that spreads adoption through visible wins can run backwards after a visible failure. That is why checking and honest learning from mistakes matter so much.",
      },
      {
        question: "Which pilot proposal is best designed?",
        options: [
          "The whole department uses AI for all tasks for a year",
          "One team uses AI on one workflow with a baseline and review date",
          "Volunteers use any AI tool they like and report back informally",
          "Two teams each try three workflows and compare their impressions",
        ],
        correctIndex: 1,
        explanation:
          "Small scope, one workflow, a baseline and a fixed review date make the result interpretable. Broad or informal trials make it hard to learn anything specific.",
      },
      {
        question: "Why should a pilot run long enough for novelty to wear off before it is judged?",
        options: [
          "Because tools become more accurate the longer a team uses them",
          "Because people in a new trial often try harder whatever the tool",
          "Because approval processes require a minimum pilot length",
          "Because early results are always negative and need time to recover",
        ],
        correctIndex: 1,
        explanation:
          "Extra effort during a visible new trial can inflate early results. Running longer shows whether the benefit holds once it becomes routine.",
      },
      {
        question: "A pitch says: 'The pilot saved time, and at team scale we will save far more.' What should be improved?",
        options: [
          "Nothing, since a confident tone persuades managers best",
          "Separate measured results from projections and give numbers",
          "Remove the pilot result and keep only the projection",
          "Replace both with a general statement about AI benefits",
        ],
        correctIndex: 1,
        explanation:
          "Managers need to see what was measured and what is expected as distinct claims. Blurring them weakens credibility once someone asks where the figure came from.",
      },
      {
        question: "Your manager asks, 'Does checking AI output just move work to someone else?' What is the strongest reply?",
        options: [
          "Say checking is unnecessary because the tool is highly accurate",
          "Show who checked in the pilot and what that cost in time",
          "Say the question is out of scope for this particular pitch",
          "Promise that the AI vendor will handle checking in future",
        ],
        correctIndex: 1,
        explanation:
          "The review burden is real, so the honest answer is evidence of how it was handled and what it cost. Dismissing it or passing it to a vendor is not credible.",
      },
      {
        question: "In a team, who usually does most to spread a new practice?",
        options: [
          "The most enthusiastic early user who talks about it most",
          "A respected, sensible colleague who finds it useful",
          "The newest team member who is most familiar with tech",
          "An external trainer who delivers a one-off workshop",
        ],
        correctIndex: 1,
        explanation:
          "Diffusion of innovations work suggests most people take their cue from trusted peers rather than enthusiasts. A sensible colleague's endorsement carries more weight.",
      },
      {
        question: "Which lunch-and-learn plan is most likely to help anxious colleagues start?",
        options: [
          "An hour-long tour of every feature in the new assistant",
          "Twenty minutes on one real task, then everyone tries it",
          "A recorded video that people can watch in their own time",
          "A talk on the future of AI and its effect on the sector",
        ],
        correctIndex: 1,
        explanation:
          "Short, specific and hands-on sessions give people a first success on their own work. Feature tours and big-picture talks tend to increase anxiety rather than reduce it.",
      },
      {
        question: "A pilot participant pastes client data into an unapproved tool by mistake and reports it. What response best supports adoption?",
        options: [
          "Remove them from the pilot so others see the rule is serious",
          "Follow the data procedure and treat it as a lesson to share",
          "Keep it quiet so the pilot results are not affected by it",
          "Stop the pilot entirely until a new policy has been written",
        ],
        correctIndex: 1,
        explanation:
          "The incident must be handled properly, but punishing honest reporting teaches people to hide problems. Psychological safety keeps mistakes visible so the system can learn.",
      },
      {
        question: "What is the main purpose of a one-page AI usage guideline for a team?",
        options: [
          "To replace the organisation's formal data protection policy",
          "To make clear what is fine, so people feel safe to start",
          "To record which staff members are using AI and how often",
          "To list every AI tool available on the market this year",
        ],
        correctIndex: 1,
        explanation:
          "Anxious colleagues often worry most about doing something wrong. A plain guideline tells them what is allowed and what to avoid, and it sits alongside formal policy rather than replacing it.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 6
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Your AI-Forward Career",
    summary:
      "Build a portfolio of AI use cases and results, keep up to date without overwhelm, decide where you draw ethical lines in your field, and commit to a 90-day plan.",
    lessons: [
      {
        title: "Building a portfolio of AI use cases",
        objective: "Write two or three short case entries that show how you used AI, what you checked and what changed.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Why a portfolio?

"Comfortable with AI tools" on a CV or in an appraisal says almost nothing. Everyone will soon claim it. What stands out is evidence: a specific problem, how you approached it, what you checked and what changed.

A **portfolio** here is simply a small collection of short write-ups of your AI use cases. It serves you in appraisals, promotion conversations, job interviews and internal moves. It also sharpens your own thinking: writing up a use case forces you to be honest about what actually worked.

You already have the raw material. Your task inventory, your time log, your pilot and your pitch are all portfolio entries waiting to be written.

## What makes a good entry

Each entry should fit on half a page and follow a simple shape:

1. **Context.** Your role and the problem, in a sentence or two. No confidential detail.
2. **What you did.** The workflow, the kind of tool (approved, and for what), and how the AI fitted in.
3. **How you kept it safe and accurate.** What you checked, what stayed out of the tool, who reviewed.
4. **Result.** Time and quality, from your log, with how many entries it rests on. Include what did not work.
5. **What you learned.** One or two sentences: what you would do differently, or where you would not use AI again.

Sections 3 and 5 are what separate a professional from an enthusiast. Anyone can say they used AI. Showing judgement about where it went wrong and how you managed risk is far more impressive.

## An illustrative example

Here is a made-up entry, to show the shape:

\`\`\`
Context: Office manager at a small architecture practice. Weekly
project status emails to five clients took most of Friday afternoon.

What I did: Built a prompt in our approved assistant that turns my
bullet-point project notes into a client update in our house style.

Safety and accuracy: No fees or contract terms go into the prompt.
I check every date and milestone against the project tracker before
sending. Updates are signed by me, not presented as automated.

Result: Over [N] weeks of logging, time per update fell from [X] to
[Y] minutes all-in. Client follow-up questions stayed about the same.
One week it misstated a milestone; I caught it in checking.

Learned: It works well for routine updates. For projects in dispute
I now write the update myself.
\`\`\`

The bracketed figures are there because this example is invented. In yours, use your real numbers.

## Keep it honest and confidential

A portfolio is shown to other people, so two rules apply:

- **Nothing confidential.** Remove client names, identifying details and internal figures your employer would not want shared. Describe results in terms you are comfortable showing a future employer. If in doubt, ask.
- **No inflation.** Do not round up, and do not claim a team result as yours alone. Interviewers are increasingly good at probing AI claims; you want every sentence to survive a follow-up question.

## Let AI help you write it up

\`\`\`try
Help me turn this into a half-page portfolio entry with the headings Context, What I did, Safety and accuracy, Result, and Learned.

My notes: [PASTE NOTES FROM YOUR LOG, PILOT OR PITCH, WITH CONFIDENTIAL DETAILS REMOVED]

Use only the facts I give you. If a heading has no information, write [ADD] instead of inventing content. Keep my figures exactly as given. Write in the first person, in a plain professional tone, and do not exaggerate.
\`\`\`

## Try it now

Write two portfolio entries: one from your task inventory or time log, one from your pilot, pitch or another AI use you are proud of. Read each one as a sceptical interviewer and fix any sentence you could not defend.

You are done when you have two half-page entries, each with a safety-and-accuracy section and at least one honest limitation.`,
        microCheck: [
          {
            question: "Which portfolio entry would most impress a thoughtful interviewer?",
            options: [
              "One listing every AI tool you have ever tried at work",
              "One showing a result, what you checked and what failed",
              "One saying you are highly skilled at prompting AI tools",
              "One describing a large result with no figures attached",
            ],
            correctIndex: 1,
            explanation:
              "Evidence of judgement, including checking and honest limitations, is what separates a professional from an enthusiast. Tool lists and unsupported claims say little.",
          },
          {
            question: "Your pilot result belongs to a team of five. How should it appear in your portfolio?",
            options: [
              "As your own result, since you were the one who proposed the pilot",
              "As a team result, with your specific contribution made clear",
              "Left out entirely, since only individual work belongs there",
              "As your result, with the team mentioned in a small footnote",
            ],
            correctIndex: 1,
            explanation:
              "Claiming shared work as your own will not survive a follow-up question. Stating your role within a team result is both honest and still impressive.",
          },
          {
            question: "An AI tool writes up your entry and adds a result you did not give it. What should you do?",
            options: [
              "Keep it if it seems roughly consistent with your own experience",
              "Delete it and use only facts and figures from your own notes",
              "Keep it but soften the wording so it sounds less certain",
              "Ask the tool for a source and keep it if one is provided",
            ],
            correctIndex: 1,
            explanation:
              "A portfolio must survive scrutiny, and invented content cannot. Use only your own facts and mark gaps rather than letting the tool fill them.",
          },
          {
            question: "Why include a 'Learned' section, even when the use case went well?",
            options: [
              "Because it shows judgement about where AI does and does not fit",
              "Because employers require a reflection section in every entry",
              "Because it lets you add extra results that did not fit elsewhere",
              "Because it makes the entry long enough to look substantial",
            ],
            correctIndex: 0,
            explanation:
              "Knowing where not to use AI is a mark of expertise. The Learned section shows you think about limits, which is what experienced reviewers look for.",
          },
        ],
      },
      {
        title: "Staying current without overwhelm",
        objective: "Set up a monthly routine with a few trusted sources and a safe way to try new tools and features.",
        durationMinutes: 20,
        contentType: "article",
        bodyMd: `## You cannot follow everything, and you do not need to

AI news moves quickly. New models, features and products are announced constantly, often with big claims attached. Trying to keep up with all of it is the fastest route back to the feeling you started this course with: behind and overwhelmed.

The good news is that most announcements do not change how you work. What matters is noticing the few that do, and testing them calmly. That takes a small, regular routine, not constant attention.

## Choose a few trusted sources

Pick two to four sources and ignore the rest without guilt. Good choices tend to be:

- **Your own tools' official updates.** The release notes or "what's new" pages for the assistant and office suite your organisation actually uses. These tell you about features you can use tomorrow.
- **Your professional body or regulator.** Many now publish guidance on AI in their field. This is where the rules that apply to you will appear.
- **Your organisation's own channel**, if it has one: IT announcements, an AI working group, your champions.
- **One general source** you find clear and sober, rather than breathless. If a source mostly makes you anxious, drop it.

Be wary of sources whose business depends on excitement. A headline that says everything has changed rarely helps you decide what to do on Monday.

## A monthly routine

Set a recurring 45-minute slot, once a month. Use it for four things:

1. **Scan (15 minutes).** Skim your chosen sources. Note anything that touches a task on your inventory. Ignore everything else.
2. **Try one thing (15 minutes).** Pick at most one new feature or approach and try it on a real, non-sensitive task.
3. **Review (10 minutes).** Look at your prompt library and time log. Is anything no longer working? Has a tool changed its behaviour?
4. **Share (5 minutes).** Send one short, useful note to your team or champion: "This new feature helped with X; watch out for Y."

This routine is also a feedback loop. Small, regular experiments give you evidence, and the evidence tells you where to look next month.

\`\`\`try
Here is a list of recent announcements or updates I have come across: [PASTE HEADLINES OR NOTES].

My role is [ROLE] and my main AI tasks are [TASKS FROM YOUR INVENTORY]. For each item, tell me in one sentence whether it is likely to affect my work, and why. Rank the ones that might, and suggest one safe, non-sensitive test I could run this month for the top item. If you are unsure whether a feature is available to me, say so rather than guessing.
\`\`\`

## Experimenting safely

New features are exactly where risk hides. Before trying something new:

- **Check it is approved.** A new feature in an approved tool may still send data somewhere new (for example, a connection to other services). If unsure, ask.
- **Use dummy or public information** for the first test.
- **Compare against your baseline.** A new feature is only an improvement if it beats what you already do, including the checking time.
- **Watch for changed behaviour.** Tools are updated without warning. A prompt that worked last month may behave differently now. Your monthly review is when you catch that.

## Try it now

1. Write down your two to four trusted sources, with a link or location for each.
2. Put a recurring 45-minute monthly slot in your calendar, titled with the four steps.
3. Unsubscribe from or mute one source that mostly makes you anxious.

You are done when the sources are listed, the recurring slot exists, and one noisy source is gone.`,
        microCheck: [
          {
            question: "Which source is most likely to tell you about a rule that applies to your work?",
            options: [
              "A popular technology newsletter covering the whole industry",
              "Your professional body or regulator's published guidance",
              "A social media account that posts daily AI headlines",
              "A vendor's promotional webinar about its newest product",
            ],
            correctIndex: 1,
            explanation:
              "Rules and guidance for your field come from your regulator or professional body. General news and vendor marketing may mention them, but they are not the authority.",
          },
          {
            question: "Your approved assistant adds a feature that connects to your email and files. What should you do first?",
            options: [
              "Turn it on straight away, since the tool is already approved",
              "Check whether the new connection is approved before using it",
              "Wait a year until the feature has been thoroughly established",
              "Use it only for sensitive tasks, where it adds the most value",
            ],
            correctIndex: 1,
            explanation:
              "Approval of a tool does not automatically cover a new feature that moves data somewhere new. Checking first is quick; undoing exposure is not.",
          },
          {
            question: "A prompt that worked well for months starts giving worse results. What is the most likely explanation to check?",
            options: [
              "The tool has been updated and now behaves slightly differently",
              "You have used the prompt too many times and it has now worn out",
              "Your colleagues have been using the same prompt at once",
              "The task itself is no longer suitable for any AI assistance",
            ],
            correctIndex: 0,
            explanation:
              "Tools change without warning, which is why the monthly routine includes reviewing your prompt library. Prompts do not wear out through use.",
          },
          {
            question: "What is the main purpose of limiting yourself to two to four trusted sources?",
            options: [
              "To notice the few changes that matter without constant anxiety",
              "To make sure you never miss a single announcement in the industry",
              "Because professional bodies forbid following other sources",
              "Because most AI news sources publish identical information",
            ],
            correctIndex: 0,
            explanation:
              "Most announcements do not change how you work. A few calm, relevant sources help you catch what matters, while trying to follow everything leads straight back to overwhelm.",
          },
        ],
      },
      {
        title: "Ethics and judgement: where you draw lines",
        objective: "Decide and write down the lines you will hold on AI use in your field, and how you will handle pressure to cross them.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Rules are the floor, not the ceiling

Laws, regulations and workplace policies set the minimum. They cannot anticipate every situation, and they often lag behind what the tools can do. Between "clearly allowed" and "clearly forbidden" is a large grey area, and that is where your professional judgement matters most.

Experienced professionals are well placed here. You already hold ethical lines in your work that no rulebook fully spells out: what you would never say to a client, what you would never sign, when you would escalate. This lesson is about extending that judgement to AI, deliberately and in advance, rather than deciding under pressure.

## Questions that reveal the line

For any use of AI you are unsure about, ask:

- **Who could be harmed, and would they know?** Harm to someone who cannot see how a decision was made (a patient, a pupil, a tenant, a job applicant) deserves particular care.
- **Would I be comfortable explaining exactly how this was done?** To the person affected, to my manager, to my professional body. If not, why not?
- **Does this replace a judgement I am accountable for?** Drafting help is one thing. Letting a tool effectively decide something you will sign is another.
- **Is the data being used in a way people agreed to?** Information shared for one purpose should not quietly be used for another.
- **What happens at scale?** Something harmless once may not be harmless when a whole organisation does it every day. This is thinking about **second-order effects**: the consequences of the consequences.

## Illustrative grey areas

These are made-up situations to help you think. Your answers may differ by field and country.

**The flattering reference.** A manager asks AI to draft a reference for a departing employee and it produces glowing, specific praise the manager cannot actually vouch for. The draft is easy; the ethics are about whether every claim is true.

**The efficient assessment.** A tutor could mark essays faster by asking AI for a grade. The question is whether the learner is getting the tutor's judgement, which is what they were promised, or the tool's.

**The empathetic reply.** A support worker uses AI to write warm replies to distressed service users. Helpful for tone, perhaps. But would the person feel deceived to learn that the warmth was generated? Does it risk replacing real attention with a pleasant template?

**The quiet monitoring.** A team lead could use AI to analyse staff messages for "engagement". Technically possible and possibly permitted, but what does it do to trust, and would staff agree to it if asked?

Notice that none of these has an obvious legal answer. They are questions of honesty, consent, accountability and care.

## Writing your lines down

Lines decided in advance are much easier to hold. Under deadline pressure, or when a senior colleague suggests a shortcut, it helps to be able to say "I do not do that" rather than having to argue it out from scratch.

\`\`\`try
I work as a [ROLE] in [FIELD]. Help me think through where I should draw ethical lines on AI use. Ask me five questions, one at a time, about situations specific to my work where the right answer is unclear. After each of my answers, reflect back the principle I seem to be applying. At the end, summarise my principles as three to five short "I will" or "I will not" statements. Do not tell me what my lines should be; help me find my own.
\`\`\`

Good lines are specific. "I will act ethically" does nothing. "I will not submit AI-drafted content to a court or regulator without checking every citation myself" does.

## When someone asks you to cross one

It will happen, usually with good intentions and a deadline. A calm approach:

1. **Name the concern plainly**, without accusing anyone: "I am not comfortable sending this without checking the figures."
2. **Offer an alternative** that meets the underlying goal: "I can check the key figures in twenty minutes."
3. **Escalate if needed**, to a manager, compliance team or professional body. That is what they are there for.

## Try it now

Run the prompt above and answer honestly. Then edit the resulting statements until each one is specific enough that you would know, in the moment, whether you were keeping it.

You are done when you have three to five written lines, each specific to your work, and one sentence you could say to a colleague who asked you to cross one.`,
        microCheck: [
          {
            question: "Why decide your ethical lines in advance rather than case by case?",
            options: [
              "Because lines decided under pressure are harder to reason about",
              "Because regulators require every professional to file them",
              "Because AI tools will enforce any lines you write down for them",
              "Because deciding case by case is always less ethical than rules",
            ],
            correctIndex: 0,
            explanation:
              "Under deadline or social pressure, a line decided in advance is easier to hold. Case-by-case judgement still matters, but it works better with some fixed points.",
          },
          {
            question: "Which is the most useful personal line on AI use?",
            options: [
              "I will always use AI responsibly and with appropriate care",
              "I will check every citation myself before a filing is submitted",
              "I will try to follow good practice wherever it is reasonable",
              "I will act in line with the values of my profession at all times",
            ],
            correctIndex: 1,
            explanation:
              "A good line is specific enough that you would know in the moment whether you kept it. General commitments to responsibility or values are sincere but cannot guide action.",
          },
          {
            question: "A use of AI is harmless once, but you wonder about the whole organisation doing it daily. What are you considering?",
            options: [
              "A bottleneck in the organisation's approval process",
              "Second-order effects that appear only at larger scale",
              "Goodhart's law applied to a target for AI usage",
              "A delay between learning the tool and seeing any benefit",
            ],
            correctIndex: 1,
            explanation:
              "Second-order effects are the consequences of consequences, and they often only show at scale. Asking 'what if everyone did this?' is a simple way to see them.",
          },
          {
            question: "A colleague asks you to send an AI-drafted report without checking, because of a deadline. What is the best first step?",
            options: [
              "Refuse and report the colleague to compliance straight away",
              "Send it, since the deadline is their responsibility, not yours",
              "Name the concern and offer a quicker check of the key points",
              "Send it with a note saying it was not checked by anyone",
            ],
            correctIndex: 2,
            explanation:
              "Naming the concern calmly and offering an alternative usually meets the underlying goal. Escalation is there if needed, but it is rarely the right opening move.",
          },
        ],
      },
      {
        title: "Your 90-day AI-forward plan",
        objective: "Write a 90-day plan with goals for your own work, your team and your career, including measures and review points.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## From course to habit

You have covered a lot: getting past the intimidation, the key tools, workflows that save time, your own field, bringing your workplace along and your career. The risk now is familiar to anyone who has been on a good course. Enthusiasm peaks at the end and fades within weeks as normal work returns.

A written plan is how you beat that. Ninety days is long enough to build real habits and see results, short enough to stay concrete. This lesson helps you write one.

## Three strands

A good AI-forward plan has three strands, mirroring the last three modules:

- **Your own work.** Which tasks from your inventory you will move to AI assistance, and how you will measure the result.
- **Your workplace.** One contribution to how your team adopts AI: a pilot, a pitch, a lunch-and-learn, a shared prompt library, a usage guideline.
- **Your career.** Portfolio entries, your staying-current routine, your ethical lines written down.

You do not need everything in every strand. One or two solid commitments in each is plenty. Overloading the plan is the most common reason plans fail.

## Three phases of thirty days

**Days 1 to 30: foundations.**
- Confirm which tools are approved for which information.
- Keep your 15-minute daily habit from Module 1 going.
- Start one baseline log for your chosen task.
- Set up your monthly staying-current slot.

**Days 31 to 60: first results.**
- Move your chosen task to AI assistance and keep logging time and quality.
- Add a second task if the first is working.
- Draft a pilot plan, or offer one short session to a colleague.
- Write your first portfolio entry.

**Days 61 to 90: share and extend.**
- Review your log honestly and decide: continue, adjust or stop.
- Make your pitch, or share results with your team.
- Write your second portfolio entry and your ethical lines.
- Set the goals for your next 90 days.

## Measures and review points

Every commitment needs a way to know whether it happened. Keep measures simple and about outcomes, not activity. "Used AI every day" is activity, and invites Goodhart's law even when the only person gaming it is you. "Weekly report takes less time with no rise in corrections" is an outcome.

Put three review dates in your calendar now: day 30, day 60 and day 90. At each, ask three questions:

1. What did I actually do?
2. What changed, in time, quality or confidence?
3. What will I change about the plan?

Adjusting the plan is not failure. It is the feedback loop working. A plan that never changes probably is not being looked at.

## Watch for the usual traps

- **Too much at once.** Pick fewer things and do them properly.
- **No protected time.** If the plan relies on "when I have a spare moment", it will not happen. Book the time.
- **Measuring only speed.** Keep quality in view.
- **Going it alone.** Tell one person about your plan: a manager, a champion or a peer on this course. Being asked "how is it going?" at day 30 is a surprisingly strong motivator.

## Draft your plan

\`\`\`try
Help me write a 90-day AI-forward plan. About me:
- Role and field: [ROLE, FIELD]
- Tasks I have chosen from my inventory: [TASKS]
- Approved tools: [TOOLS]
- One thing I want to do for my team: [E.G. PILOT, SESSION, PROMPT LIBRARY]
- Career goal: [E.G. PROMOTION, NEW ROLE, STRONGER APPRAISAL]
- Time I can realistically give each week: [HOURS]

Structure it in three phases (days 1-30, 31-60, 61-90) across three strands (my work, my team, my career). Keep it to no more than two commitments per strand per phase. For each commitment give an outcome measure, not an activity count. Add review questions for days 30, 60 and 90. If my time budget cannot fit the plan, cut commitments and tell me which ones you cut.
\`\`\`

Then edit it ruthlessly. If anything makes you sigh when you read it, cut it or shrink it.

## Try it now

1. Draft your plan with the prompt above and edit it to fit your real week.
2. Put the day 30, 60 and 90 reviews in your calendar.
3. Tell one person about the plan and ask them to check in with you at day 30.

You are done when your plan fits on one page, has an outcome measure for every commitment, the three review dates are booked, and someone else knows about it.`,
        microCheck: [
          {
            question: "Which is the better measure for a 90-day plan commitment?",
            options: [
              "Log in to the AI assistant once every working day",
              "Weekly report takes less time with no rise in corrections",
              "Write at least twenty new prompts before the end of the month",
              "Spend a minimum of three hours a week using AI tools at work",
            ],
            correctIndex: 1,
            explanation:
              "Outcome measures track what AI is supposed to improve. Activity counts like logins, prompts or hours invite Goodhart's law, even when you are only measuring yourself.",
          },
          {
            question: "At your day-60 review you find one commitment has not worked. What does the course suggest?",
            options: [
              "Keep going unchanged, since changing the plan counts as failure",
              "Adjust or drop it, as that is the feedback loop doing its job",
              "Abandon the whole plan and start a new one from the beginning",
              "Double the time you spend on it so it catches up by day 90",
            ],
            correctIndex: 1,
            explanation:
              "Reviews exist so the plan can change based on evidence. Adjusting is the loop working; ignoring the evidence or scrapping everything both waste what you learned.",
          },
          {
            question: "What is the most common reason personal plans like this fail?",
            options: [
              "Choosing tasks that are too easy to show any real benefit",
              "Taking on too much, with no protected time set aside for it",
              "Using an approved tool instead of the newest one available",
              "Reviewing the plan too often during the ninety-day period",
            ],
            correctIndex: 1,
            explanation:
              "Overloaded plans that rely on spare moments quietly stop. A few commitments with booked time are far more likely to be kept.",
          },
          {
            question: "Why tell one other person about your 90-day plan?",
            options: [
              "So they can do some of the tasks in the plan on your behalf",
              "Because being asked how it is going helps keep you on track",
              "Because a plan is only valid once someone else has approved it",
              "So they can report your progress to your manager each month",
            ],
            correctIndex: 1,
            explanation:
              "A simple check-in from someone who knows your plan adds a light, supportive feedback loop. It is not about approval or reporting.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A candidate writes 'expert in AI tools' on their CV. What would make the claim far more convincing?",
        options: [
          "A longer list of the AI tools and products they have used",
          "A case showing the result, the checks made and what failed",
          "A certificate showing they completed a short AI course",
          "A statement that they use AI in almost every task they do",
        ],
        correctIndex: 1,
        explanation:
          "Specific evidence of results and judgement is what distinguishes real proficiency. Tool lists and usage claims are easy to make and say little.",
      },
      {
        question: "Your portfolio entry is based on client work. What must you do before showing it to a prospective employer?",
        options: [
          "Remove client names and details your employer would not share",
          "Add the client's logo so the entry looks more professional",
          "Get the AI tool to rewrite it so it is no longer your text",
          "Nothing, as long as the results are described accurately",
        ],
        correctIndex: 0,
        explanation:
          "Portfolios are shown to others, so confidentiality applies. Accurate results can still breach confidentiality if identifying detail is left in.",
      },
      {
        question: "A new assistant feature is announced that sounds useful. Following the monthly routine, what should you do?",
        options: [
          "Adopt it at once across all of your tasks to save time quickly",
          "Try it on one non-sensitive task and compare with your baseline",
          "Ignore it, as new features should be avoided for at least a year",
          "Wait until your colleagues have all tested it before looking",
        ],
        correctIndex: 1,
        explanation:
          "A small, safe test compared against what you already do tells you whether it is genuinely better. Adopting everywhere at once or ignoring it both skip the evidence.",
      },
      {
        question: "You follow a source that mostly leaves you anxious and rarely changes how you work. What should you do?",
        options: [
          "Read it more often so nothing important is ever missed",
          "Drop or mute it and rely on a few calmer trusted sources",
          "Share it with your team so everyone stays equally alert",
          "Keep it but only read the headlines rather than articles",
        ],
        correctIndex: 1,
        explanation:
          "The aim is to notice the few changes that matter without overwhelm. A source that adds anxiety but no useful action is costing you more than it gives.",
      },
      {
        question: "A tutor considers asking AI to grade essays to save time. Which question gets to the ethical heart of it?",
        options: [
          "Whether the AI will grade faster than a human can",
          "Whether learners get the judgement they were promised",
          "Whether other tutors in the department would do the same",
          "Whether the AI's grades are close to the class average",
        ],
        correctIndex: 1,
        explanation:
          "The issue is honesty and accountability: learners expect the tutor's judgement. Speed, peer behaviour and statistical similarity do not address that.",
      },
      {
        question: "Which approach best helps you hold an ethical line under deadline pressure?",
        options: [
          "Deciding the right answer freshly each time it comes up",
          "Having specific lines written down before the pressure arrives",
          "Following whatever a more senior colleague decides to do",
          "Relying on the AI tool to refuse anything that is unethical",
        ],
        correctIndex: 1,
        explanation:
          "Lines decided in advance are easier to hold. Seniority and tool guardrails do not replace your own accountability for your professional work.",
      },
      {
        question: "A team lead could analyse staff messages with AI to measure 'engagement'. What is the most important issue to weigh?",
        options: [
          "Whether the analysis will be ready before the next meeting",
          "Its effect on trust, and whether staff would consent to it",
          "Whether the AI tool can process messages in all languages",
          "Whether the results can be displayed in a clear dashboard",
        ],
        correctIndex: 1,
        explanation:
          "Something technically possible and even permitted can still damage trust and use data in ways people did not agree to. Consent and trust are the core questions.",
      },
      {
        question: "What is the main reason a 90-day plan has three strands: your work, your team and your career?",
        options: [
          "To make the plan look comprehensive to a manager",
          "To balance personal gains, team adoption and growth",
          "Because each strand must be approved by someone else",
          "Because AI tools organise plans into three by default",
        ],
        correctIndex: 1,
        explanation:
          "The strands mirror what an AI-forward professional does: improves their own work, helps their workplace, and builds a career on it. One or two commitments in each is enough.",
      },
      {
        question: "Your plan's only measure is 'use AI every day'. What is the risk?",
        options: [
          "It is too ambitious for most people to achieve in 90 days",
          "It tracks activity, so you can hit it without better work",
          "It is too hard to record without special tracking software",
          "It will make your manager expect daily reports on progress",
        ],
        correctIndex: 1,
        explanation:
          "This is Goodhart's law on a personal scale. Daily use can be achieved without any improvement, so measure outcomes like time and quality instead.",
      },
      {
        question: "A support worker uses AI to write warm replies to distressed service users. Which question matters most ethically?",
        options: [
          "Whether the replies are shorter than the ones they wrote before",
          "Whether users would feel deceived and real attention is replaced",
          "Whether the AI uses the correct spelling for the region",
          "Whether the tool can reply outside normal working hours",
        ],
        correctIndex: 1,
        explanation:
          "The concern is honesty and care for vulnerable people. A pleasant template can substitute for real attention in ways the person would object to if they knew.",
      },
    ],
  },
];
