import type { SeedCapstone, SeedFinalExam, SeedLab } from "../types";

// Becoming the AI-Forward Professional in Your Field: labs, final exam and
// capstone. The learner is an experienced professional in any field who finds
// AI intimidating. Every assessment tests what Modules 1-6 teach, on the
// learner's own work wherever possible. The task inventory from Module 4 and
// the adoption-as-a-system view from Module 5 run through the later labs and
// the capstone. All organisations, people and figures in scenarios are
// fictional and illustrative.

// ═══════════════════════════════════════════════════════════════════════════
// LABS (one per module)
// ═══════════════════════════════════════════════════════════════════════════

export const AI_FORWARD_LABS: SeedLab[] = [
  // ── Module 1 ──────────────────────────────────────────────────────────
  {
    slug: "ai-forward-lab-1-your-first-real-win",
    title: "Your first real win: from messy notes to a clear email",
    labType: "prompt",
    moduleNumber: 1,
    estimatedMinutes: 25,
    points: 50,
    passScore: 70,
    briefMd: `Module 1 suggested three first wins: an email, meeting notes and a first draft. This lab combines two of them. You have a set of rough meeting notes, typed quickly by someone in the room. Your job is to write a prompt that turns them into a clear summary email for the whole team, with an owner and a date against every action.

The notes are realistic, which means they are untidy. Two of the action items are ambiguous: it is not clear who owns them or when they are due. One detail was shared in confidence and must not go into an email to the wider team.

You are graded on your **prompt**, not on how polished one reply happens to be. A good prompt tells the assistant who it is writing as, who will read the email and what shape it should take; asks for owners and dates; tells it what to do with anything unclear instead of guessing; and keeps the confidential detail out. Run it, read the result as the recipient would, and improve it.`,
    scenarioMd: `**The situation (illustrative)**

You are the project lead at **Harbour Lane Events**, an imaginary company that runs conferences and corporate events. You chaired this morning's weekly planning meeting for a client conference. The notes below were typed by a colleague during the meeting. They are already loaded into the sandbox ahead of your prompt, inside \`<meeting_notes>\` tags, so your prompt can refer to them.

The summary email goes to the six people who attended, plus two colleagues who could not make it. The two absentees need enough context to act.

**The starter prompt someone wrote**

> summarise these notes into an email`,
    objectives: [
      {
        id: "setup",
        label: "Gives the assistant a role, an audience and a format",
        weight: 2,
        guidance:
          "Full credit when the prompt says who the email is from (the project lead), who reads it (attendees plus two absentees who need context), the purpose (a clear record of decisions and actions), and the format (for example a short opening line, decisions, an action table with owner and due date, open questions, and a length or tone limit). Part credit if one of role, audience or format is missing. Low credit for 'summarise these notes into an email' with minor additions.",
      },
      {
        id: "owners",
        label: "Asks for an owner and a date against every action",
        weight: 3,
        guidance:
          "Full credit when the prompt explicitly asks for every action item to be listed with a named owner and a due date, in a consistent structure such as a table or 'Action / Owner / Due' lines, and tells the assistant to use only names and dates that appear in the notes. Part credit for asking for 'next steps' or 'actions' without requiring an owner and a date for each. None if actions are not mentioned.",
      },
      {
        id: "ambiguity",
        label: "Handles ambiguity by flagging, not guessing",
        weight: 3,
        guidance:
          "Full credit for an explicit instruction such as 'If an owner or date is unclear, do not guess: mark it TBC and list it under Open questions for me to confirm', with the result showing the unowned supplier follow-up and the vague 'end of next week or so' date flagged rather than filled in. Part credit for a general 'be accurate'. None if the prompt lets the assistant invent owners or dates.",
      },
      {
        id: "confidential",
        label: "Keeps the confidential detail out of the email",
        weight: 3,
        guidance:
          "Full credit when the prompt tells the assistant to leave out anything marked confidential or personal, and specifically excludes Omar's medical leave (for example 'Do not mention anyone's leave or health; say only that the registration work is moving to Beth'), and the output contains no reference to it. Part credit for a general 'keep it professional' where the detail happens to be left out. None if the detail appears in the draft email.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "summarise these notes into an email",
      contextMd: `<meeting_notes>
Weekly planning, client conference (Northfield Growers' Association, fictional). Tues 6 Oct. Attended: Lena (lead), Omar, Beth, Chris, Priya, Dan. Apologies: Sam, Kasia.

- venue: Chris spoke to Riverside Hall. they can hold the main room but want the deposit by Fri 16th otherwise release it. Chris to get PO raised, Priya to approve.
- catering numbers. last yr 180ish, client now saying maybe 220?? Priya to confirm final numbers w/ client by the 20th.
- speakers: 4 of 6 confirmed. Beth chasing the other two. keynote still waiting on travel.
- someone needs to follow up with the AV supplier about the second screen + hybrid stream quote. (didn't agree who)
- badges and reg: Omar said, NOT FOR CIRCULATION, he's going on medical leave from the 19th for about 6 weeks, only his manager knows. So reg desk + badge printing moves to Beth. Lena to brief Beth this week.
- sponsor pack. Dan to send draft to Lena "end of next week or so"
- budget: under by a bit on print, over on AV. Priya to update tracker.
- next meeting same time next Tues.
</meeting_notes>`,
      sandboxSystem:
        "You are a general-purpose workplace assistant in a training sandbox. Follow the user's prompt as written. If the prompt is vague, produce the output that prompt literally warrants: do not add confidentiality filtering, flags for unclear items or structure the user did not ask for, because the learner is practising writing prompts that ask for these things and needs honest feedback about what a weak prompt produces. All organisations and people in this sandbox are fictional.",
    },
  },

  // ── Module 2 ──────────────────────────────────────────────────────────
  {
    slug: "ai-forward-lab-2-check-a-research-summary",
    title: "Check an AI research summary before you rely on it",
    labType: "critique",
    moduleNumber: 2,
    estimatedMinutes: 25,
    points: 55,
    passScore: 70,
    briefMd: `Module 2 introduced research tools that cite their sources, and the habit of checking what they say before you pass it on. Here is a research summary an AI assistant produced for a professional who asked a practical question about their own practice.

Parts of it are sound, sensible advice. Parts of it are not: a source that may not exist, a claim about what tools can do that could easily be out of date, a precise number with nothing behind it, a dangerous piece of advice about client data, and a conclusion drawn from far too little.

Select every statement that you would not pass on to a colleague as it stands. Leave the sound advice alone. Flagging everything is not judgement, and it is scored accordingly.`,
    scenarioMd: `**The question (illustrative)**

The practice manager of an imaginary six-person architecture practice asked a general AI assistant:

> "We want to start using AI to draft client letters and project update emails. What does the evidence say, and how should we get started?"

The answer below is what came back. Read it as if you were about to forward it to the partners.`,
    objectives: [
      {
        id: "recall",
        label: "Caught the genuine problems",
        weight: 3,
        guidance:
          "Credit for each planted flaw correctly selected: the unverifiable journal citation, the out-of-date claim about PDFs and spreadsheets stated as current fact, the unsourced hours-saved figure, the advice to upload a client file to a free public tool, and the conclusion drawn from a single letter.",
      },
      {
        id: "risk",
        label: "Caught the flaw with the highest real-world risk",
        weight: 2,
        guidance:
          "Extra credit for selecting the advice to upload a real client file to a free public chatbot. It is the only flaw that could cause harm before anyone checks anything: it risks client confidentiality and may breach the practice's obligations.",
      },
      {
        id: "precision",
        label: "Left sound advice alone",
        weight: 2,
        guidance:
          "Credit for not selecting statements that are good practice: reading every draft before it goes out, checking which tools the practice has approved, starting with low-risk routine correspondence, using custom instructions for house style, and opening cited sources to confirm they say what is claimed.",
      },
    ],
    config: {
      kind: "critique",
      answerMd: `### Getting started with AI for client correspondence

**What the evidence says.** AI assistants are now widely used to draft routine professional correspondence. A peer-reviewed study (Harrington & Cole, *Journal of Professional Practice Management*, 2023) found that practices using AI drafting halved their correspondence time within a month. On average, professionals who adopt AI drafting save 11.5 hours a week.

**What the tools can and cannot do.** Current AI assistants cannot read PDFs or spreadsheets, so you will always need to copy the relevant text into the chat by hand. They are good at structure and tone, but they can state things confidently that are wrong, so every draft needs reading by the person who signs it.

**How to get started.**

1. Check which AI tools your practice has approved, and what each one does with the data you type or upload.
2. Start with low-risk, routine correspondence, such as meeting confirmations and project update emails, before anything contractual.
3. Set up custom instructions with your house style: British spelling, how you sign off, and phrases you never use.
4. The quickest way to see results is to upload one of your real client files to a free public chatbot and ask it to draft the next letter.
5. When a research tool gives you a citation, open the source and confirm it says what the summary claims.

**Conclusion.** One of your partners already tried this on a single client letter and it came out perfect first time, which shows AI-drafted letters do not need a review step.`,
      flaws: [
        {
          id: "f1",
          quote: "A peer-reviewed study (Harrington & Cole, *Journal of Professional Practice Management*, 2023) found that practices using AI drafting halved their correspondence time within a month.",
          explanation:
            "A precise, official-looking citation that you have no reason to believe exists. Assistants can produce plausible authors, journals and years for sources that were never written. Search for it and open it before you repeat it; if you cannot find it, treat the claim as unsupported.",
          category: "fabrication",
        },
        {
          id: "f2",
          quote: "Current AI assistants cannot read PDFs or spreadsheets",
          explanation:
            "A time-sensitive claim about product features presented as settled fact. Many assistants can work with uploaded PDFs and spreadsheets, and features change often. Anything described as 'current' about a tool should be checked against the tool itself today.",
          category: "overconfidence",
        },
        {
          id: "f3",
          quote: "On average, professionals who adopt AI drafting save 11.5 hours a week.",
          explanation:
            "A confident, precise figure with no source at all. Time saved depends entirely on the work and the person, and the only number worth using is one you measure against your own baseline.",
          category: "fabrication",
        },
        {
          id: "f4",
          quote: "upload one of your real client files to a free public chatbot",
          explanation:
            "Dangerous advice. A real client file may contain confidential or personal information, and a free public tool may keep or use what you upload under terms your practice has not approved. It also contradicts point 1. Use approved tools, and remove or replace client details.",
          category: "privacy",
        },
        {
          id: "f5",
          quote: "which shows AI-drafted letters do not need a review step",
          explanation:
            "Overgeneralising from one example. One good letter says nothing about the next hundred, and the answer itself says assistants can state wrong things confidently. The person who signs the letter still reads it.",
          category: "logic",
        },
      ],
      candidates: [
        { id: "c1", text: "Citing a 2023 peer-reviewed study by Harrington & Cole on halved correspondence time", isFlaw: true, flawId: "f1" },
        { id: "c2", text: "Stating that an average professional saves 11.5 hours a week with AI drafting", isFlaw: true, flawId: "f3" },
        { id: "c3", text: "Stating as current fact that AI assistants cannot read PDFs or spreadsheets", isFlaw: true, flawId: "f2" },
        { id: "c4", text: "Saying every draft needs reading by the person who signs it", isFlaw: false },
        { id: "c5", text: "Advising the practice to check which tools are approved and what they do with data", isFlaw: false },
        { id: "c6", text: "Suggesting routine, low-risk correspondence as the place to start", isFlaw: false },
        { id: "c7", text: "Recommending custom instructions that capture the house style", isFlaw: false },
        { id: "c8", text: "Suggesting a real client file be uploaded to a free public chatbot", isFlaw: true, flawId: "f4" },
        { id: "c9", text: "Advising that cited sources be opened and checked against the claim", isFlaw: false },
        { id: "c10", text: "Concluding from one good letter that AI-drafted letters need no review", isFlaw: true, flawId: "f5" },
      ],
    },
  },

  // ── Module 3 ──────────────────────────────────────────────────────────
  {
    slug: "ai-forward-lab-3-reusable-prompt-template",
    title: "Build a reusable prompt template for a recurring task",
    labType: "prompt",
    moduleNumber: 3,
    estimatedMinutes: 35,
    points: 60,
    passScore: 70,
    briefMd: `Module 3 ended with a personal prompt library: the prompts you reuse every week, saved as templates so that a good result does not depend on remembering how you phrased it last time.

Pick one task **you** do at least weekly: a status update, a reply to a common type of enquiry, a meeting agenda, a report section, a summary for your manager. Build the template for it. It should have clear placeholders for the parts that change, a role, the context the assistant needs, the output format, and quality checks the assistant applies before it answers.

Then prove it is reusable: fill the placeholders with realistic (and non-confidential) details and run it at least twice with different inputs. You are graded on the template, not on a single good reply.`,
    scenarioMd: `**How to work**

1. Write your template in the editor. Mark every part that changes with square brackets, such as \`[RECIPIENT]\`, \`[KEY POINTS]\` or \`[DEADLINE]\`.
2. Add one line at the top saying what the template is for and when you use it, as you would in your prompt library.
3. To run it, paste a filled-in copy below the template, or fill the brackets directly. Use invented or anonymised details, never real client or colleague information.
4. Run it with at least two different sets of inputs. If the second result is worse, change the template, not just the inputs.

If you cannot think of a task, use this illustrative one and say so: *a weekly update email to your manager covering progress, blockers and what you need from them.*`,
    objectives: [
      {
        id: "placeholders",
        label: "Clear placeholders for everything that changes",
        weight: 2,
        guidance:
          "Full credit when every variable part is a clearly named placeholder in consistent brackets (for example [AUDIENCE], [KEY FACTS], [DEADLINE]), the fixed instructions are separate from the pasted material (delimiters or labelled sections), and a one-line header says what the template is for and when to use it. Part credit if placeholders exist but some variable details are hard-coded, or material and instructions are mixed.",
      },
      {
        id: "role-context",
        label: "Role and context the assistant needs",
        weight: 2,
        guidance:
          "Full credit for a role that fits the task (who the assistant writes as or acts as), the audience and what they need, and the standing context a stranger would need: the learner's field, the purpose of the output, and any house style. Part credit for a role with no audience or purpose. Low credit for 'You are a helpful assistant' alone.",
      },
      {
        id: "format",
        label: "A specified output format",
        weight: 2,
        guidance:
          "Full credit when the template fixes the shape of the output: sections or headings in order, length limit, tone, and how lists or tables should look, so two runs on different inputs come back in the same structure. Part credit for a length or tone limit with no structure. None if the format is left to the assistant.",
      },
      {
        id: "checks",
        label: "Built-in quality checks",
        weight: 3,
        guidance:
          "Full credit when the template tells the assistant to check its own output before answering against specific tests (for example 'use only facts from [KEY FACTS]; if something needed is missing, list it under Questions instead of guessing; flag any figure you calculated; stay under 200 words'), and includes at least one instruction on missing or uncertain information. Part credit for 'be accurate' or 'double check'. None if there are no checks.",
      },
      {
        id: "reuse",
        label: "Tested on different inputs and improved",
        weight: 1,
        guidance:
          "Full credit when the learner ran the template on at least two different sets of inputs and the final template shows a change made in response to what the runs revealed. Part credit for two runs with no change where one was needed. Low credit for a single run.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: `TEMPLATE: [WHAT THIS IS FOR AND WHEN I USE IT]

write an update for [PERSON] about [TOPIC]`,
      sandboxSystem:
        "You are a general-purpose workplace assistant in a training sandbox. The user is testing a reusable prompt template for a recurring task in their own job. Follow the template exactly as written with whatever values they supply. If a placeholder is left unfilled, treat it literally rather than inventing a value. Do not add structure, checks or caveats the template did not ask for, because the learner needs honest feedback about what their template produces. Treat any names or organisations as fictional.",
    },
  },

  // ── Module 4 ──────────────────────────────────────────────────────────
  {
    slug: "ai-forward-lab-4-task-inventory",
    title: "Inventory your week: automate, augment or keep human",
    labType: "workbench",
    moduleNumber: 4,
    estimatedMinutes: 40,
    points: 65,
    passScore: 70,
    briefMd: `Module 4 argued that the AI-forward professional does not start from the tools. They start from their own work. This lab is that inventory, done honestly for a real week.

List at least ten tasks from your actual job, sort each one into **automate** (AI can do it with a light check), **augment** (AI helps, you stay in charge) or **keep human** (judgement, relationships, accountability or confidentiality mean it stays with you), and give a reason for each. Then pick the three you will start with, check them for confidentiality, and decide how you will measure time saved against a real baseline.

This inventory is the starting point for the capstone, so make it about your work as it really is, not as a job description says it should be.`,
    scenarioMd: `Use a real week: look at your calendar, your sent email and your to-do list. Include the dull tasks and the ones you are proud of.

If you cannot use your own work, choose an illustrative role and say so, for example: *imagine a senior HR adviser in a mid-sized organisation who handles policy queries, drafts letters, prepares for difficult conversations, runs training and reports monthly figures.*

Do not paste real confidential details. Describe a task by its type ("reply to a grievance acknowledgement") rather than its content.`,
    objectives: [
      {
        id: "inventory",
        label: "A real and specific inventory of ten or more tasks",
        weight: 2,
        guidance:
          "Full credit for at least ten specific tasks from a real week (for example 'draft weekly project update to client', not 'communication'), each with a rough time per week and frequency. Part credit for ten tasks that are generic or look like a job description. Low credit for fewer than eight tasks.",
      },
      {
        id: "sorting",
        label: "Sensible sorting with reasons",
        weight: 3,
        guidance:
          "Full credit when every task is placed in automate, augment or keep human with a specific reason tied to risk, judgement, relationships, accountability or data sensitivity; tasks with high stakes or personal data are not placed in automate; and at least two tasks are kept human for stated reasons. Part credit if sorting is plausible but reasons are missing or generic ('AI is good at this'). Low credit if high-stakes decisions or confidential tasks are marked automate.",
      },
      {
        id: "priorities",
        label: "Three starting tasks chosen for good reasons",
        weight: 2,
        guidance:
          "Full credit when the top three are chosen for a stated mix of frequency, time taken, low risk and ease of checking, and each has a one-line description of how AI will be used. Part credit for three tasks with no reasoning, or choices that are high risk as a first step.",
      },
      {
        id: "confidentiality",
        label: "A confidentiality check on the starting tasks",
        weight: 2,
        guidance:
          "Full credit when, for each of the three tasks, the learner names what data is involved, whether it is confidential or personal, which approved tool it may go into (or that they must check), and what they will remove or anonymise. Part credit for a single general statement about being careful. None if confidentiality is not addressed.",
      },
      {
        id: "measure",
        label: "An honest way to measure time saved",
        weight: 2,
        guidance:
          "Full credit for a baseline taken before changing anything (timing the task several times, or a log for a week), the same measure after, a quality check alongside time (for example edits needed, errors caught, or a reviewer's view), and a note that checking and fixing time counts. Part credit for 'I'll see how much faster it feels'. None if measurement is missing.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "inventory",
          label: "Your task inventory",
          prompt:
            "List at least ten tasks from a real week. For each: the task, how often you do it, and roughly how long it takes each week. One line per task is fine.",
          placeholder:
            "1. Weekly status update to client | weekly | 45 min\n2. Prepare agenda for team meeting | weekly | 20 min\n...",
          minWords: 80,
        },
        {
          id: "sorting",
          label: "Automate, augment or keep human",
          prompt:
            "Place every task in one of the three groups and give a reason for each, based on risk, judgement, relationships, accountability or how sensitive the data is.",
          minWords: 120,
        },
        {
          id: "priorities",
          label: "Your top three to start with",
          prompt:
            "Which three tasks will you start with, and why these? For each, describe in a sentence or two how you will use AI and what you will still do yourself.",
          minWords: 60,
        },
        {
          id: "confidentiality",
          label: "Confidentiality check",
          prompt:
            "For each of your three tasks: what information is involved, is any of it confidential or personal, which approved tool may it go into (or who you need to ask), and what will you remove or anonymise?",
          minWords: 50,
        },
        {
          id: "measure",
          label: "How you will measure time saved",
          prompt:
            "How will you take a baseline before you change anything? What will you measure afterwards, including checking and fixing time? How will you check that quality has not dropped?",
          minWords: 50,
        },
      ],
    },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────
  {
    slug: "ai-forward-lab-5-pilot-and-pitch",
    title: "Plan a small pilot and pitch it to your manager",
    labType: "workbench",
    moduleNumber: 5,
    estimatedMinutes: 40,
    points: 70,
    passScore: 70,
    briefMd: `Module 5 treated adoption as a system: people respond to incentives, habits spread through loops, and a measure that becomes a target stops being a good measure (Goodhart's law). A small, well-run pilot is how you change a system without asking anyone to take a leap of faith.

Design a pilot for one workflow in your team, then write the one-page case you would give your manager. It needs a baseline, a success measure that includes quality and not only speed, the risks and the guardrails for them, and a review date. It also needs the systems view: which adoption loop you want the pilot to start, and which Goodhart trap you will avoid.

You are graded on whether your manager could say yes to it on Monday, and whether it would tell you something true by the review date.`,
    scenarioMd: `Base this on a workflow from your Lab 4 inventory if you can, ideally one that involves two to five colleagues.

If you cannot use your own team, use this illustrative case and say so: *imagine a small customer success team of four in a software company. Each writes a monthly account review for their clients, which takes most of a day per person and is often late. The manager is interested but worried about quality and about client data going into the wrong tool.*

Keep the pitch to what would fit on one page: roughly 250 to 400 words.`,
    objectives: [
      {
        id: "pilot",
        label: "A small, specific pilot with a baseline",
        weight: 3,
        guidance:
          "Full credit for one named workflow, who takes part (a small group), for how long (for example four to six weeks), what AI does and what people still do, and a baseline measured before the pilot starts (time and at least one quality measure), with a named review date. Part credit for a clear pilot with no baseline or no review date. Low credit for 'roll AI out to the team'.",
      },
      {
        id: "measures",
        label: "Success measures that include quality",
        weight: 2,
        guidance:
          "Full credit for two or three measures that include time AND quality (for example editing effort, errors caught at review, reviewer or client feedback), with a stated threshold for continue, change or stop decided in advance. Part credit for time saved only. None if success is undefined.",
      },
      {
        id: "risks",
        label: "Risks and guardrails",
        weight: 2,
        guidance:
          "Full credit for at least three specific risks (for example confidential data in an unapproved tool, errors reaching a client, uneven workload, anxious colleagues) each matched to a guardrail (approved tool only, human review before anything leaves the team, a named owner, opt-in participation). Part credit for risks with no guardrails or generic ones.",
      },
      {
        id: "systems",
        label: "The adoption loop and the Goodhart trap",
        weight: 3,
        guidance:
          "Full credit when the learner names a reinforcing loop the pilot is designed to start (for example visible wins, shared prompts, more people try, more wins shared) and what could stall it, AND names a specific Goodhart trap (such as counting prompts run or rewarding time saved alone, which invites rushed, unchecked work) and how the measures avoid it. Part credit for mentioning incentives or Goodhart's law without applying them to this pilot. None if the systems view is missing.",
      },
      {
        id: "pitch",
        label: "A pitch a manager could say yes to",
        weight: 2,
        guidance:
          "Full credit for a one-page case in plain language that states the problem, the proposal, the cost in time, the measures, the risks and guardrails, the review date and a clear ask. It invents no statistics and makes no promise of results before the pilot. Part credit if it is persuasive but vague on the ask or overclaims.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "pilot",
          label: "The pilot",
          prompt:
            "Which workflow, who takes part, for how long, what AI does and what people still do. What is your baseline, how will you take it before the pilot starts, and when is the review date?",
          minWords: 80,
        },
        {
          id: "measures",
          label: "How you will judge success",
          prompt:
            "Two or three measures, including at least one for quality. What result would mean continue, change or stop? Decide this now, before you see the results.",
          minWords: 50,
        },
        {
          id: "risks",
          label: "Risks and guardrails",
          prompt:
            "At least three risks, each with the guardrail that addresses it. Include data and confidentiality, quality, and the people side.",
          minWords: 60,
        },
        {
          id: "systems",
          label: "The adoption loop and the Goodhart trap",
          prompt:
            "Write the reinforcing loop you want the pilot to start (A -> B -> C -> back to A) and what might stall it. Then name one measure that would become a Goodhart trap if it were made a target, and how your design avoids it.",
          minWords: 60,
        },
        {
          id: "pitch",
          label: "Your one-page pitch",
          prompt:
            "Write the one-page case for your manager: the problem, the proposal, what it costs, how you will measure it, the risks and guardrails, the review date and exactly what you are asking for.",
          minWords: 200,
        },
      ],
    },
  },

  // ── Module 6 ──────────────────────────────────────────────────────────
  {
    slug: "ai-forward-lab-6-your-90-day-plan",
    title: "Your 90-day AI-forward plan",
    labType: "workbench",
    moduleNumber: 6,
    estimatedMinutes: 35,
    points: 60,
    passScore: 70,
    briefMd: `Module 6 was about turning a course into a career habit. Write the plan for your next 90 days: the skills you will build, the tools you will learn properly, the habits that will keep you practising, the portfolio pieces that will show what you can do, how you will help colleagues, and the ethical lines you will hold in your field.

A good plan is specific enough to check. "Get better at AI" is not a plan. "By day 30, three prompt templates in my library, each used at least four times, with before and after timings" is.

You are graded on whether the plan is concrete, realistic alongside your actual workload, and anchored in your field's standards.`,
    scenarioMd: `Split your 90 days into three blocks (days 1 to 30, 31 to 60, 61 to 90). For each block, say what you will do and what will exist at the end of it.

Keep it realistic. The daily practice from Module 1 was 15 minutes. A plan that needs two spare hours a day will not survive a busy month.`,
    objectives: [
      {
        id: "skills-tools",
        label: "Specific skills and tools, sequenced",
        weight: 2,
        guidance:
          "Full credit for named skills (for example structured prompting, checking cited research, working with spreadsheets) and named categories of tool from the organisation's approved list, sequenced across the three 30-day blocks with a clear 'done' state for each. Part credit for a list of skills with no sequence or no done state. Low credit for 'learn more AI'.",
      },
      {
        id: "habits",
        label: "Habits that survive a busy week",
        weight: 2,
        guidance:
          "Full credit for a small, specific daily or weekly routine (for example 15 minutes each morning on a real task, a Friday review of what saved time) with a trigger and a way to keep track, sized to the learner's real workload. Part credit for good intentions with no routine. Low credit for a plan needing time the learner plainly does not have.",
      },
      {
        id: "portfolio",
        label: "Portfolio pieces with evidence",
        weight: 2,
        guidance:
          "Full credit for two or three planned use cases written up with the problem, what they did, before and after measures (time and quality) and what they learned, with confidential details removed. Part credit for pieces with no measures. None if no portfolio is planned.",
      },
      {
        id: "colleagues",
        label: "How you will help colleagues",
        weight: 2,
        guidance:
          "Full credit for a specific action that helps others adopt safely (sharing prompt templates, a short show-and-tell, pairing with an anxious colleague, contributing to a usage guideline), with a named audience and timing, and sensitivity to colleagues who feel threatened. Part credit for 'share what I learn' with no specifics.",
      },
      {
        id: "ethics",
        label: "Ethical lines grounded in your field",
        weight: 2,
        guidance:
          "Full credit for at least three specific lines the learner will not cross, tied to their field's standards (for example client confidentiality, professional sign-off, disclosure of AI use, not using AI for decisions about people without review), plus what they will do when unsure. Part credit for general principles not linked to their field.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "skills-tools",
          label: "Skills and tools across 90 days",
          prompt:
            "Which skills and which tools (from your organisation's approved list) will you focus on in each 30-day block? What will be true at the end of each block?",
          minWords: 80,
        },
        {
          id: "habits",
          label: "Your practice habits",
          prompt:
            "What small daily or weekly routine will keep you practising and staying current? When will it happen, and how will you keep track?",
          minWords: 40,
        },
        {
          id: "portfolio",
          label: "Portfolio pieces",
          prompt:
            "Which two or three use cases will you write up, and what evidence (before and after, time and quality) will each include?",
          minWords: 50,
        },
        {
          id: "colleagues",
          label: "Helping colleagues",
          prompt:
            "Who will you help, how and when? How will you support colleagues who are anxious about AI rather than leaving them behind?",
          minWords: 40,
        },
        {
          id: "ethics",
          label: "Your ethical lines",
          prompt:
            "Name at least three lines you will hold in your field, why each matters, and what you will do when you are unsure whether something crosses one.",
          minWords: 50,
        },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// FINAL EXAM
// ═══════════════════════════════════════════════════════════════════════════

export const AI_FORWARD_FINAL_EXAM: SeedFinalExam = {
  title: "Becoming the AI-Forward Professional: Final Exam",
  timeLimitMinutes: 50,
  questionsServed: 35,
  passScore: 75,
  distinctionScore: 90,
  maxAttempts: 3,
  cooldownHours: 24,
  instructionsMd: `## Before you start

**35 questions. 50 minutes. 75% to pass.** Score 90% or above and your certificate is marked *with Distinction*.

Most questions are short workplace scenarios from a range of fields. They test judgement: what to try first, what to check, what must stay with a person, how to measure honestly and how to bring colleagues along. You do not need to know any particular product.

Questions are drawn at random from a larger bank covering all six modules, and the options are shuffled, so each attempt is different. Every answer is saved the moment you select it, and the clock runs on our server.

You have up to 3 attempts, with a 24-hour gap between them so that a retry is a studied one. Your result is broken down by module, so you will know what to revisit.`,
  questions: [
    // ── Module 1: Getting Past the Intimidation ───────────────────────────
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "Which of these tasks is a general AI assistant best suited to help with at work?",
      options: [
        "Turning rough bullet points into a clear first draft of an email",
        "Deciding on its own whether a colleague should be promoted",
        "Confirming today's exact figures in a system it cannot access",
        "Signing off a client report so that it can go out the same day",
      ],
      correctIndex: 0,
      explanation:
        "Drafting from your own notes plays to what assistants do well, with you checking the result. Decisions about people, facts it cannot see and professional sign-off stay with a person.",
    },
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "Why does Module 1 suggest a daily practice of about 15 minutes rather than one long session a month?",
      options: [
        "Short sessions keep usage low enough to stay inside free plans",
        "Small, regular use on real tasks builds skill and confidence fastest",
        "AI tools reset what they have learned about you after a few days",
        "Long sessions tend to produce lower quality answers from the tool",
      ],
      correctIndex: 1,
      explanation:
        "Confidence comes from repeated small wins on real work, which a short daily habit makes realistic. It is not about tool limits or the tool forgetting you.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A senior accountant says: 'I'm afraid I'll ask it something stupid and look foolish.' What is the most useful first step to suggest?",
      options: [
        "Wait until the firm runs formal training before trying anything",
        "Start on a public forum so others can correct the questions asked",
        "Try it privately on a low-stakes task, such as tidying an email",
        "Ask a junior colleague to do the prompting on their behalf for now",
      ],
      correctIndex: 2,
      explanation:
        "A private, low-stakes first win removes the audience the fear is about and builds evidence that they can do it. Waiting or delegating keeps the fear in place.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A project manager pastes a client's contract, including pricing and names, into a free personal AI account to summarise it. What is the main concern?",
      options: [
        "The summary will probably be too long to be useful to the client",
        "Confidential client data went into a tool the firm has not approved",
        "Free accounts cannot read contracts, so the summary will be wrong",
        "The client may notice that the summary style has changed slightly",
      ],
      correctIndex: 1,
      explanation:
        "The risk is where the data went: a personal, unapproved account may keep or use what is pasted. Summary length and style are minor; free tools can often read contracts, which is exactly the problem.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A teacher uses AI to draft a parents' newsletter. It includes a school trip date that nobody gave it. What does this show about AI at work?",
      options: [
        "The tool has access to the school calendar and should be trusted",
        "Newsletters are a task AI should never be used for in a school",
        "It can fill gaps with plausible details, so facts need checking",
        "The teacher should switch tools because this one is clearly broken",
      ],
      correctIndex: 2,
      explanation:
        "Assistants produce plausible text and will fill gaps with invented specifics. The fix is to supply the facts and check every date and name, not to abandon the task or the tool.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "Which of these is the best candidate for a professional's very first AI win?",
      options: [
        "Drafting the final wording of a disciplinary letter to an employee",
        "Choosing which supplier wins a large contract from three tenders",
        "Summarising their own notes from a routine internal team meeting",
        "Writing a legal opinion for a client who is waiting on the advice",
      ],
      correctIndex: 2,
      explanation:
        "A first win should be frequent, low risk and easy to check. Your own notes from a routine meeting fit; disciplinary letters, contract awards and legal opinions carry high stakes.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "A nurse manager worries that AI will replace her role. Which response is most honest and useful?",
      options: [
        "AI cannot affect clinical roles at all, so there is nothing to fear",
        "Some tasks will change, so learn which of yours AI helps and which not",
        "Her role will certainly disappear, so she should retrain immediately",
        "The best protection is to avoid AI so her own skills stay essential",
      ],
      correctIndex: 1,
      explanation:
        "Neither dismissal nor doom is honest. Looking at her own tasks shows where AI helps and where her judgement and care remain central, which is also the best protection for her role.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "An engineer tried AI once, got a wrong answer about a standard, and concluded 'it's useless for my field'. What is the flaw in this reasoning?",
      options: [
        "The engineer should have used a paid tool, which is never wrong",
        "One failure on one task says little about other uses, like drafting",
        "Standards questions are the task AI is most reliable at in any field",
        "The engineer is right, and should not try the tool again for now",
      ],
      correctIndex: 1,
      explanation:
        "A single failure on a factual lookup is a good lesson about checking facts, but it says little about drafting, summarising or structuring work. Paid tools also make mistakes.",
    },

    // ── Module 2: The Key AI Tools to Learn ───────────────────────────────
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "What are custom instructions in a general AI assistant for?",
      options: [
        "Standing details about you and your preferences applied to each chat",
        "A list of commands that let the assistant control your own computer",
        "Rules your IT team uses to block certain websites from the assistant",
        "A paid add-on that makes the assistant's answers factually correct",
      ],
      correctIndex: 0,
      explanation:
        "Custom instructions save you repeating your role, audience and style in every chat. They do not grant control of your computer or guarantee accuracy.",
    },
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "Why check an assistant's data settings before using it for work?",
      options: [
        "They decide how fast the assistant replies during busy periods",
        "They affect whether your chats may be kept or used for training",
        "They control which language the assistant uses in its answers",
        "They set how many images the assistant can create for you daily",
      ],
      correctIndex: 1,
      explanation:
        "Data settings govern what happens to what you type, such as retention and use for training. That matters for work content, alongside using tools your organisation has approved.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A consultant wants an AI note-taker to join a call with a new client. What should happen first?",
      options: [
        "Nothing, as note-takers are standard and clients expect them now",
        "Tell the client afterwards and offer to delete the notes if asked",
        "Ask the client for consent before the tool records or transcribes",
        "Turn off the video so that the note-taker records only the audio",
      ],
      correctIndex: 2,
      explanation:
        "Recording and transcribing people needs their knowledge and consent first, and your organisation's rules may add more. Telling them afterwards or recording audio only does not fix that.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A policy adviser needs a quick overview of recent guidance on a topic. Which tool feature matters most for this task?",
      options: [
        "The ability to generate a matching image for the final report",
        "Answers that cite sources you can open and check for yourself",
        "A writing style that sounds confident and authoritative throughout",
        "The longest possible answer so that nothing at all is left out",
      ],
      correctIndex: 1,
      explanation:
        "For research, citations you can open are what let you verify claims. Confidence and length are not evidence, and an image does nothing for accuracy.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A finance officer uploads a spreadsheet of monthly costs and asks the assistant for the total by department. What should she do with the answer?",
      options: [
        "Use it as is, since the assistant read the file directly this time",
        "Spot-check a couple of totals against the sheet before relying on it",
        "Ignore it, because AI tools are unable to do any arithmetic at all",
        "Ask the same question again and accept whichever answer repeats",
      ],
      correctIndex: 1,
      explanation:
        "Reading a file directly helps, but calculations can still go wrong. A quick check of a few totals against the source is proportionate; asking twice is not a check.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A team lead keeps re-explaining the same product background to the assistant each time. Which feature best solves this?",
      options: [
        "Starting a brand-new chat for every single question about it",
        "A project or workspace that keeps reference files and instructions",
        "Turning off the data settings so that the chat history is kept",
        "Typing the background faster using a keyboard shortcut instead",
      ],
      correctIndex: 1,
      explanation:
        "Projects or workspaces let you store background files and instructions once and reuse them across chats. Fresh chats lose context, and data settings are about privacy, not memory of your files.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question:
        "An office manager wants to automate: 'when a supplier invoice email arrives, have AI pay it'. What is the strongest objection?",
      options: [
        "Automation tools cannot read emails, so the idea will not work at all",
        "Paying money is irreversible, so a person should approve each payment",
        "Invoices are too short for AI to understand without extra context",
        "It will be cheaper to do this manually than to set it up in the tool",
      ],
      correctIndex: 1,
      explanation:
        "Simple automation is fine for low-risk steps like filing or logging, but payment is irreversible and a common target for fraud. A person approves before money moves.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question:
        "A marketing lead uses an AI tool to make slides and it includes a chart with neat figures she did not supply. What should she do?",
      options: [
        "Keep the chart, since the tool must have found the figures online",
        "Replace the chart with her own figures, or remove it entirely",
        "Add a footnote saying the chart was produced with the help of AI",
        "Change the colours to match the brand and then present it as is",
      ],
      correctIndex: 1,
      explanation:
        "Figures she did not supply have no known source and may be invented. A disclosure footnote does not make invented data acceptable; use real figures or none.",
    },

    // ── Module 3: Productivity Workflows That Actually Save Time ──────────
    {
      moduleNumber: 3,
      difficulty: 1,
      question: "What is a personal prompt library?",
      options: [
        "A saved set of reusable prompts for the tasks you do regularly",
        "A record of every chat you have ever had with any AI assistant",
        "A collection of online articles about how AI models are trained",
        "A list of prompts your employer has banned staff from ever using",
      ],
      correctIndex: 0,
      explanation:
        "A prompt library holds your best, reusable prompts as templates, so good results do not depend on memory. It is curated, not a full chat history.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "A solicitor wants AI to help with a meeting tomorrow. Which use saves most time while keeping her in control?",
      options: [
        "Letting AI attend the meeting and agree actions on her behalf",
        "Asking AI to draft an agenda and questions from her own notes",
        "Having AI write the minutes before the meeting has taken place",
        "Asking AI to predict which way the other side will decide next",
      ],
      correctIndex: 1,
      explanation:
        "Preparation from her own material is fast and easy to check. Agreeing actions, pre-writing minutes and predicting decisions hand over judgement or invent content.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "An AI note-taker produces meeting actions. Several list 'the team' as the owner. What is the best next step?",
      options: [
        "Send them as they are, since everyone in the team was present",
        "Assign a named owner and date to each before sharing the notes",
        "Delete those actions, because they were not important enough",
        "Ask the note-taker to rerun until it names someone at random",
      ],
      correctIndex: 1,
      explanation:
        "An action owned by 'the team' is owned by nobody. The person sharing the notes confirms a named owner and date, which is judgement the tool cannot supply.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "A manager asks AI to reply to a frustrated customer email. The draft is polite but promises a refund the policy does not allow. What went wrong?",
      options: [
        "The tone was wrong, and a firmer reply would have prevented it",
        "The prompt did not give the policy or say what may be offered",
        "The email was too long for the assistant to read it completely",
        "Customer emails are a task that AI tools are unable to handle",
      ],
      correctIndex: 1,
      explanation:
        "Without the policy and limits in the prompt, the assistant fills the gap with what sounds helpful. Supplying the rules, and reading before sending, prevents this.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "A researcher asks AI to 'write the report' from a folder of notes and gets something generic. What is the most effective change?",
      options: [
        "Ask for a longer report so that more of the notes are included",
        "Give audience, purpose and an outline, then draft section by section",
        "Switch to a different AI tool and paste in exactly the same prompt",
        "Add 'please be very accurate' to the end of the original request",
      ],
      correctIndex: 1,
      explanation:
        "Reports improve when you set the audience, purpose and structure and work in sections you can check. Length, politeness or switching tools do not fix a vague brief.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "A consultant says AI 'saves me an hour on every report', but his reviewer now spends longer correcting each one. What is the best reading?",
      options: [
        "The time has moved to review, so the real saving may be much smaller",
        "The reviewer is too cautious and should approve the reports faster",
        "The saving is real, because the consultant's own time is what counts",
        "The reports are fine, since the reviewer catches every problem anyway",
      ],
      correctIndex: 0,
      explanation:
        "A workflow saves time only if the whole thing gets faster. If correction effort moves downstream, the saving is overstated and the drafting prompt or checks need work.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "Two colleagues use the same saved prompt template for weekly updates, but one gets much better results. What is the most likely cause?",
      options: [
        "The tool prefers one of the two users and gives them better answers",
        "One fills the placeholders with fuller, clearer inputs than the other",
        "Templates only work well for the person who originally wrote them",
        "The better results come from running the template later in the day",
      ],
      correctIndex: 1,
      explanation:
        "A template fixes the structure, but output still depends on what goes into the placeholders. Good templates say what each placeholder needs, and ask for missing information to be flagged.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "An HR adviser wants to use AI to triage her inbox. Which approach saves time without creating new risk?",
      options: [
        "Let AI send replies automatically to anything it rates as routine",
        "Have AI sort and draft, while she reads and sends every reply herself",
        "Forward all personal cases to a free tool for faster summarising",
        "Let AI delete the emails it judges to be low priority each morning",
      ],
      correctIndex: 1,
      explanation:
        "Sorting and drafting take the effort out while she keeps control of what goes out. Auto-sending, auto-deleting or sending personal cases to an unapproved tool add risk for little gain.",
    },

    // ── Module 4: Your Field, AI-Forward ──────────────────────────────────
    {
      moduleNumber: 4,
      difficulty: 1,
      question: "In a task inventory, what does 'augment' mean?",
      options: [
        "AI does the task end to end and you never need to look at it",
        "AI helps with the task while you stay in charge of the result",
        "The task is removed from your role and passed to someone else",
        "The task is too sensitive for AI and must stay with you alone",
      ],
      correctIndex: 1,
      explanation:
        "Augment means AI assists and you keep judgement and accountability. Automate is AI doing it with a light check; keep human is for tasks that stay with a person.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "A social worker lists 'deciding whether a family needs further support'. Where does this belong in her inventory?",
      options: [
        "Automate, since AI can process the case notes more quickly",
        "Augment, with AI making the decision and her checking it after",
        "Keep human, as it is a judgement about people she is accountable for",
        "Automate, provided the tool is one the council has already approved",
      ],
      correctIndex: 2,
      explanation:
        "Decisions about vulnerable people rest on professional judgement and accountability. AI might help with admin around the case, but the decision itself stays human.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "A sales manager wants to know if AI saves time on proposals. What should he do before he starts using it?",
      options: [
        "Record how long proposals take now, so there is a baseline",
        "Ask colleagues to guess how much time AI will probably save",
        "Look up an average time saving figure for sales roles online",
        "Start straight away, then estimate the old time from memory",
      ],
      correctIndex: 0,
      explanation:
        "Without a baseline taken beforehand, any saving is a guess. Other people's averages and memory are poor substitutes for timing your own work.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "An architect measures time saved on drafting specifications with AI. Which measure is most honest?",
      options: [
        "The time the AI took to produce the first draft of the text",
        "Total time from start to approved spec, including all checking",
        "How much faster the work feels compared with last month's work",
        "The number of prompts she ran while working on each spec draft",
      ],
      correctIndex: 1,
      explanation:
        "Honest measurement counts the whole task, including checking and fixing, to an approved result. Generation time, feelings and prompt counts all overstate or miss the point.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "A pharmacist wants to use AI to draft patient information leaflets. What must stay with her?",
      options: [
        "Choosing the font and layout used for the printed leaflet itself",
        "Checking the clinical content and taking responsibility for it",
        "Deciding how many copies of the leaflet are printed each month",
        "Picking which AI tool produces the most readable wording overall",
      ],
      correctIndex: 1,
      explanation:
        "Professional accountability for clinical accuracy cannot be handed to a tool. AI can help with plain wording, but the pharmacist checks the content and owns it.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question:
        "A firm's approved AI tool is slower than a free one a colleague prefers. He uses the free one 'just for non-client work'. What is the main risk?",
      options: [
        "The free tool will produce lower quality drafts for non-client work",
        "The boundary blurs, and client details end up in an unapproved tool",
        "His manager may think he is less productive than his colleagues",
        "The approved tool will stop working if it is not used every day",
      ],
      correctIndex: 1,
      explanation:
        "Two tools with different rules invite mistakes: under pressure, client material slips into the unapproved one. Approved tools exist so the data question is settled once.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question:
        "An engineer's AI-assisted calculations report goes out with an error. Who is accountable?",
      options: [
        "The AI vendor, because their tool produced the wrong number first",
        "Nobody, as errors from AI tools are treated as system failures",
        "The engineer who signed off the report, as with any other method",
        "The IT team, because they approved the tool for use by engineers",
      ],
      correctIndex: 2,
      explanation:
        "Using AI does not move professional accountability. Whoever signs the work owns it, which is why checking is part of the task and not optional.",
    },

    // ── Module 5: Bringing Your Workplace Along ───────────────────────────
    {
      moduleNumber: 5,
      difficulty: 1,
      question: "What does Goodhart's law warn about?",
      options: [
        "A measure made into a target tends to stop being a good measure",
        "New tools take longer to adopt in larger organisations than small",
        "People adopt a tool faster when their manager uses it themselves",
        "Every pilot needs a baseline that is taken before any change begins",
      ],
      correctIndex: 0,
      explanation:
        "Goodhart's law: when a measure becomes a target, people optimise the number rather than the outcome. The other options may be sensible, but they are not Goodhart's law.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "A director sets a target: every employee must run 50 AI prompts a week. What is the most likely effect?",
      options: [
        "Staff will learn faster, because the target forces daily practice",
        "Usage will rise but many prompts will be trivial, just to hit it",
        "Quality of work will improve steadily as prompt numbers go up",
        "Nothing much, as targets rarely change what people do at work",
      ],
      correctIndex: 1,
      explanation:
        "This is Goodhart's law in action: people meet the count with low-value prompts. Measures tied to outcomes, such as time saved with quality held, are harder to game.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "Which is the strongest design for a first AI pilot in a team?",
      options: [
        "All staff, all tasks, starting on Monday with no end date set",
        "One workflow, a few volunteers, a baseline and a review date",
        "One enthusiast using any tool they like, with no measures kept",
        "A six-month trial where the results are reviewed only at the end",
      ],
      correctIndex: 1,
      explanation:
        "A small, bounded pilot with a baseline and a review date produces learning quickly and safely. Big launches and long, unreviewed trials hide what is and is not working.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "A colleague is anxious that using AI will make his skills look obsolete. What is the most helpful response?",
      options: [
        "Tell him that everyone else is already using it and he must catch up",
        "Pair with him on one of his own tasks, where his expertise shapes the use",
        "Reassure him that AI is a passing trend that will fade within a year",
        "Leave him to it, since adoption should always be left to individuals",
      ],
      correctIndex: 1,
      explanation:
        "Working alongside him on his own work shows that his expertise is what makes AI useful, and builds confidence. Pressure, false reassurance and neglect all make anxiety worse.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "What should a one-page case to your manager for an AI pilot include?",
      options: [
        "Industry statistics showing large savings at other organisations",
        "The problem, proposal, measures, risks, review date and a clear ask",
        "A detailed technical description of how the AI models are trained",
        "A promise of a specific percentage of time saved across the team",
      ],
      correctIndex: 1,
      explanation:
        "A manager needs to know what, why, how it will be judged, what could go wrong and what you are asking for. Borrowed statistics and promised results undermine trust.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "A team's shared prompt library grows fast after a champion shares wins weekly, then stalls when she changes role. What does this suggest?",
      options: [
        "The library was never useful, and the growth was only a novelty effect",
        "The loop depended on one person, so the sharing habit needs an owner",
        "Prompt libraries only work in teams that have a technical background",
        "The team should now replace the library with one bought from a vendor",
      ],
      correctIndex: 1,
      explanation:
        "The reinforcing loop (wins shared, more people try, more wins) ran through one person. Building the habit into the team, with an owner and a regular slot, keeps the loop going.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "A pilot's measure is 'time saved per report'. Reports get faster but more come back from clients with errors. What is the best fix?",
      options: [
        "Keep the measure as it is, since speed was the goal of the pilot",
        "Add a quality measure, such as errors found, alongside time saved",
        "Stop the pilot now, since AI has clearly failed in this workflow",
        "Tell staff to slow down without changing anything about the measure",
      ],
      correctIndex: 1,
      explanation:
        "Measuring speed alone invites rushed, unchecked work: a Goodhart trap. Pairing time with a quality measure rewards the outcome you actually want.",
    },

    // ── Module 6: Your AI-Forward Career ──────────────────────────────────
    {
      moduleNumber: 6,
      difficulty: 1,
      question: "What makes an AI use case convincing in a professional portfolio?",
      options: [
        "The problem, what you did, and before and after measures",
        "A list of every AI tool you have ever tried at any point",
        "Screenshots of long chats showing how much you used AI",
        "A statement that you are an early adopter of technology",
      ],
      correctIndex: 0,
      explanation:
        "Evidence persuades: a real problem, what you did and what changed in time and quality. Tool lists and chat screenshots show activity, not results.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "A professional wants to stay current on AI without being overwhelmed. Which approach is most sustainable?",
      options: [
        "Read every AI news story and try every new tool on its release day",
        "Follow a few trusted sources and test new features on real tasks",
        "Ignore all updates until the organisation formally announces them",
        "Rely on colleagues to explain any changes when they come up at work",
      ],
      correctIndex: 1,
      explanation:
        "A small number of reliable sources plus hands-on testing on your own work keeps you current at a sustainable pace. Chasing everything burns out; ignoring everything falls behind.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "A journalist uses AI to help draft background sections of articles. Which ethical line fits her field best?",
      options: [
        "Never check facts the AI provides, as editors will catch errors",
        "Verify every fact and follow the outlet's rules on disclosing AI use",
        "Use AI-generated quotes when a source is unavailable before deadline",
        "Avoid telling editors about AI use, so that the work is judged fairly",
      ],
      correctIndex: 1,
      explanation:
        "Journalism depends on verified facts and honesty with readers and editors. Invented quotes and hidden AI use cross clear lines in that field.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "Which goal in a 90-day AI plan is best written?",
      options: [
        "Become an expert in all AI tools by the end of the quarter",
        "By day 30, three templates in my library, each used four times",
        "Use AI a lot more than I do now across all of my daily tasks",
        "Read widely about AI whenever I have some spare time available",
      ],
      correctIndex: 1,
      explanation:
        "A good goal is specific, realistic and checkable by a date. 'Expert in all tools' is unrealistic, and 'use it more' or 'read widely' cannot be checked.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question:
        "A recruiter is asked to use AI to rank candidates and reject the lowest automatically. What is the most defensible position?",
      options: [
        "Agree, as long as the tool's vendor says the ranking is unbiased",
        "Use AI to help organise applications, with people making decisions",
        "Refuse to use AI anywhere in recruitment under any circumstances",
        "Agree, but only for roles where there are a very large number of CVs",
      ],
      correctIndex: 1,
      explanation:
        "Decisions about people carry fairness and legal risk and need human judgement. AI can help with admin, but automatic rejection hands over a decision that should stay with a person.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question:
        "A professional's 90-day plan includes: 'build two portfolio pieces from client projects'. What must she do before sharing them?",
      options: [
        "Nothing, as portfolio pieces are private to her and her manager",
        "Remove or anonymise client details and check what she may share",
        "Ask the AI tool to confirm that the case studies are accurate",
        "Include the full client files so the evidence is complete and clear",
      ],
      correctIndex: 1,
      explanation:
        "Client confidentiality does not end when the project does. Remove identifying details and check her organisation's rules before sharing anything outside it.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question:
        "Six months in, a manager notices she uses AI for almost all first drafts and her own drafting feels rusty. What is the wisest response?",
      options: [
        "Stop using AI entirely so that her skills can recover fully again",
        "Keep some drafting by hand where her judgement and voice matter most",
        "Ignore it, since drafting skills will not matter in the near future",
        "Use a second AI tool to check the first one's drafts instead of her",
      ],
      correctIndex: 1,
      explanation:
        "Deskilling is a real second-order effect. Deliberately keeping practice where her judgement matters protects her ability to check AI output, without giving up the gains.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CAPSTONE
// ═══════════════════════════════════════════════════════════════════════════

export const AI_FORWARD_CAPSTONE: SeedCapstone = {
  passThreshold: 70,
  briefMd: `## The brief

Spend **30 days** becoming AI-forward in your own job, and document it. This is the proof behind the certificate: not that you know about AI, but that you use it well in your field, measure what it does honestly, keep confidential information safe, and help the people around you do the same.

Choose work that is real and yours. Modest and real beats ambitious and hypothetical. You will be reviewed by a person who wants to see your judgement, not polished marketing.

## What to submit

One document of roughly **1,500 to 2,500 words**, plus attachments, covering these six parts in order.

**1. Your task inventory.** At least ten tasks from a real week, each sorted into automate, augment or keep human with a reason. Mark the tasks you chose to work on and explain why those, using frequency, time, risk and ease of checking.

**2. Three AI workflows in use.** For each: the task, the tool (from your organisation's approved list), what AI does, what you still do, and where you check. For each, report **before and after measures** for time and for quality. Take the baseline before you change anything. Count checking and fixing time. Report honestly, including a workflow that saved less than you hoped or none at all.

**3. Your prompt library.** At least **five** reusable templates, each with a one-line purpose, placeholders, role, context, output format and quality checks. Note which ones you changed after using them, and why.

**4. One colleague or team helped.** Either a small pilot (one workflow, a few people, a baseline, a success measure that includes quality, a review date) or a share-out (a short session, shared templates, pairing with a colleague). Describe it as a **system**: the adoption loop you tried to start, what helped or stalled it, the incentives at play, and the Goodhart trap you avoided in how you measured it. Include what the other people said, with their permission.

**5. Your confidentiality and quality checklist.** The checklist you now run before any AI-assisted work leaves your hands: what data may go into which tool, what you remove or anonymise, what you always verify (names, figures, dates, citations), who signs off, and when you disclose AI use. Show where it caught something, if it did.

**6. Reflection.** What changed in how you work and how you feel about AI. What you would do differently. Where you have drawn ethical lines in your field, and your next 90 days.

## What good looks like

A reviewer should be able to follow the thread from your inventory to your workflows, your measures and your checklist. Good submissions are specific, honest about what did not work, and careful with data: remove or replace any confidential or personal details, and describe them instead if needed. Do not quote statistics from elsewhere to make your case; your own before and after figures are the evidence.`,
  rubric: [
    {
      criterion: "Task inventory and judgement about where AI fits",
      weight: 15,
      description:
        "Is the inventory real and specific, with at least ten tasks sorted into automate, augment or keep human for sound reasons? Are high-stakes, people-affecting and confidential tasks handled with care, and are the chosen tasks justified?",
    },
    {
      criterion: "Workflows in use with honest before and after measures",
      weight: 25,
      description:
        "Are three workflows genuinely in use on real work? Is each measured against a baseline taken beforehand, for both time and quality, counting checking and fixing time? Are results reported honestly, including what did not improve?",
    },
    {
      criterion: "Prompt library",
      weight: 15,
      description:
        "Are there at least five reusable templates with placeholders, role, context, output format and built-in quality checks? Is there evidence they were used and improved in response to results?",
    },
    {
      criterion: "Adoption as a system",
      weight: 20,
      description:
        "Did the learner help at least one colleague or team through a pilot or share-out, and describe it as a system: the reinforcing loop they tried to start, what helped or stalled it, the incentives involved, and a Goodhart trap avoided in the measures? Were anxious colleagues supported rather than pressured?",
    },
    {
      criterion: "Confidentiality, quality and accountability",
      weight: 15,
      description:
        "Is there a practical checklist covering approved tools, data removal, verification of names, figures, dates and citations, sign-off and disclosure? Is professional accountability clearly kept with the learner, and is confidential data handled safely throughout the submission itself?",
    },
    {
      criterion: "Reflection and ethical lines",
      weight: 10,
      description:
        "Is the reflection honest and specific about what changed and what they would do differently? Are ethical lines tied to the standards of their field, with a credible next 90 days?",
    },
  ],
};
