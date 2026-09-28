import type { SeedModule } from "../types";

// AI for Small Business Owners: Grow Sales and Get Time Back
// (slug: ai-small-business), Modules 4-6.
// Audience: owners and managers of small businesses (1 to 50 people) with
// little time and no tech team. Illustrative examples only ("imagine...").
// No invented statistics, studies, quotes, companies or case studies.
// Tools and prices change: named tools are examples only. Tax, employment and
// legal matters vary by country: AI drafts, a qualified professional checks.

export const SMB_MODULES_4_TO_6: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 4
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Admin and Operations on Autopilot (With You in Control)",
    summary:
      "Write down how the business runs so it does not depend on you, tame the inbox, calendar and paperwork, connect your tools with simple automations that have human checkpoints and failure alerts, and use AI fairly and lawfully when you hire and onboard staff.",
    lessons: [
      {
        title: "Write SOPs and checklists so the business runs without you",
        objective: "Turn one task that only you know how to do into a written procedure and a one-page checklist, using AI to structure your own words and a colleague to test the result.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## You are the bottleneck

In most small businesses, the owner is the part of the system that everything flows through. Customers ask for you. Staff check with you. Suppliers wait for your answer. In systems terms you are the bottleneck: the one step that limits how much the whole business can do. The theory of constraints makes a simple point here. Time saved anywhere else is wasted if the bottleneck stays jammed.

Written standard operating procedures (SOPs: step-by-step instructions for a routine task) and checklists let work flow around you instead of through you. Most owners know this and never do it, because writing them feels like a week of work. AI changes that. You talk, it writes, you check.

Look back at the time audit from Module 1. Any task that comes up every week and that only you know how to do is a strong first candidate.

## Capture first, let AI tidy

The hard part of an SOP is not the writing. It is getting what is in your head onto a page. So do not start by asking AI to "write an SOP for opening the shop". It will give you a generic procedure that matches nobody's shop.

Start with your own words instead:

1. Do the task once while talking it through into a voice note, or jot rough bullets as you go. Include the odd details: "the back door sticks, lift the handle".
2. Turn the recording into text (many phones and AI tools can transcribe; check what yours offers).
3. Give the transcript to an AI tool and ask it to structure it.

\`\`\`try
Below is a rough description of how I do [TASK] in my [TYPE OF BUSINESS]. Turn it into a standard operating procedure for a new team member.

Format:
- Purpose (one sentence) and when this task is done
- What you need before starting
- Numbered steps, one action per step, in plain words
- Checks: how you know each important step was done right
- What to do if something goes wrong, and who to call

Rules: use only what is in my description. Where a step is unclear or missing, do not guess. List your questions for me at the end instead.

My description:
[PASTE YOUR NOTES OR TRANSCRIPT]
\`\`\`

That last rule matters. The questions the tool raises are often the steps you do on autopilot and forgot to mention.

## SOP or checklist?

An SOP teaches someone how to do a task. A checklist reminds someone who already knows how not to skip a step. You usually want both: the SOP for training, and a one-page checklist on the wall or in the shared drive for daily use.

Ask AI to produce the checklist from the finished SOP: "Turn this SOP into a checklist of no more than twelve items that fits on one page. Keep only the steps that are easy to forget or costly to get wrong." Short checklists get read. A forty-item list gets ticked without being read.

## A worked example

Imagine a small café where the owner is the only person who knows how to close up. Every evening she either stays late or gets a phone call. One night she records herself closing, and AI turns the transcript into an eleven-step SOP followed by four questions: which fridge temperatures are recorded and where, who takes the takings if the safe is full, what to do if the alarm code fails, and whether the till is counted before or after cleaning.

Two of those answers had never been written down anywhere. Answering them took five minutes. The checklist version goes on the wall by the back door, and the SOP goes into the folder new starters read in their first week.

## Test it with the person who will use it

A procedure is only finished when someone else can follow it without you. Give it to a team member, let them do the task with the SOP in hand, and stay out of the way. Every time they have to ask you something, that is a gap in the document. Add the answer.

This is a feedback loop: use it, spot the gap, update it. Put a date and an owner on each SOP, and a line at the bottom: "If this is wrong or out of date, tell [NAME]." An out-of-date SOP can be worse than none, because people trust it.

Two cautions. Anything touching health and safety, food hygiene, handling money or regulated work should be checked against the official guidance for your sector and country, not only against what AI wrote. And keep customer and staff personal details out of anything you paste in.

## Try it now

Pick one task from your time audit that only you can do and that comes up at least weekly.

1. Record or jot yourself doing it, in your own words.
2. Run the prompt above in the practice pad and answer the questions it lists.
3. Ask for a one-page checklist version.

You are done when you have a dated SOP and checklist, and you have named the person who will test it this week.`,
        microCheck: [
          {
            question: "You ask AI to \"write an SOP for closing the shop\" and give it no other detail. What is the main problem with the result?",
            options: [
              "It will be generic and miss the quirks of your own shop",
              "It will be far too short to be of any use to new staff",
              "It will refuse because SOPs are a regulated document",
              "It will copy a competitor's procedure word for word",
            ],
            correctIndex: 0,
            explanation:
              "Without your own description, the tool can only produce a typical procedure. The value of an SOP is in the specific steps and quirks that currently live only in your head.",
          },
          {
            question: "Why add the rule \"where a step is unclear, list questions instead of guessing\" to the SOP prompt?",
            options: [
              "It keeps the finished SOP shorter and quicker to print",
              "The questions reveal steps you do on autopilot and forgot",
              "AI tools cannot structure notes unless questions are allowed",
              "It stops the tool from storing your notes for its training",
            ],
            correctIndex: 1,
            explanation:
              "Guessing fills gaps with plausible but wrong steps. Asking for questions surfaces exactly the knowledge you take for granted, which is what a new person most needs.",
          },
          {
            question: "A team member follows your new SOP and has to ring you twice. What should you do?",
            options: [
              "Accept it, since some calls to the owner will always be needed",
              "Replace the SOP with a longer one generated from scratch",
              "Add both answers to the SOP, since each call marks a gap",
              "Retrain the team member, since the SOP was checked by AI",
            ],
            correctIndex: 2,
            explanation:
              "Each question is feedback showing where the document falls short. Updating it closes the loop, so the next person does not need to call you.",
          },
          {
            question: "What is the main difference between an SOP and a checklist?",
            options: [
              "An SOP is for managers; a checklist is only for new staff",
              "An SOP is legally required; a checklist is just optional",
              "An SOP is written by AI; a checklist is written by hand",
              "An SOP teaches a task; a checklist stops skipped steps",
            ],
            correctIndex: 3,
            explanation:
              "The SOP trains someone to do the task; the checklist supports someone who already knows it. Most routine tasks benefit from having both.",
          },
          {
            question: "Why is the owner often described as the bottleneck in a small business?",
            options: [
              "So much work waits on them that it limits the whole business",
              "They are usually the slowest person at most everyday tasks",
              "They spend too much on tools that the team does not use",
              "They avoid AI tools, which slows adoption across the team",
            ],
            correctIndex: 0,
            explanation:
              "A bottleneck is the step that limits the flow of the whole system. When decisions and know-how sit with one person, everything queues behind them, however fast they work.",
          },
        ],
      },
      {
        title: "Tame the inbox, calendar and paperwork",
        objective: "Create reply templates and written triage rules for your most common messages, and use AI to summarise documents in a way you can check.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Where the admin hours go

Most owners' admin falls into three piles. **Messages**: email, texts, social media inboxes. **Time**: booking, rescheduling and reminders. **Paperwork**: contracts, supplier terms, letters and forms. The same questions arrive again and again, and the same decisions get made again and again.

Repetition is where AI earns its keep. Not by answering for you, but by helping you write good answers once, sort messages by rules you decide once, and get through long documents faster while still checking what matters.

## Templates for the questions you answer every week

List the ten messages you write most often. Imagine a plumber: "What is your call-out charge?", "Can you come today?", "When will you arrive?", "Here is your quote", "Thanks, here is the invoice." Each deserves one good template, saved where you can reach it in two clicks. Most email tools support saved replies or templates; check what yours offers.

\`\`\`try
I run a [TYPE OF BUSINESS]. Here are the questions customers ask me most often, with how I usually answer:
[LIST 5 TO 10 QUESTIONS AND YOUR ROUGH ANSWERS]

For each one, write a short reply template in a friendly, plain tone like mine. Use [SQUARE BRACKETS] for the parts I fill in each time, such as name, date and price. Keep each under 90 words. Do not invent prices, policies or promises that are not in my answers.
\`\`\`

Use the voice notes you built in Module 2 so the templates sound like you. Then read each one as if you were the customer. Templates go out many times, so a mistake in one is repeated many times.

## Triage rules: decide once, not fifty times

Triage means sorting by urgency and type before acting. Write your rules down once, for example:

- **Urgent** (seen within the hour): a customer with a problem today, anything about safety, anything from your key customers.
- **New enquiry** (reply the same working day): the speed that wins work, as you saw in Module 3.
- **Suppliers and admin** (batched once a day).
- **Newsletters and sales pitches** (filtered into a folder, read weekly or not at all).

Many email tools can apply simple filters automatically, and some now offer AI sorting or suggested replies. Whatever you use, treat suggested replies as drafts you read before sending, and look through the "later" folder once a week for anything misfiled. A sorter that hides one angry customer can cost more than it saves you.

## Calendar: fewer back-and-forth emails

Booking links (a page where customers choose from times you have made available) cut out the "does Tuesday work?" emails. Set buffers between appointments and a daily limit, so the calendar protects your time instead of filling every gap.

Use AI to write the confirmation and reminder messages, including what the customer needs to prepare or bring. Then book yourself a test appointment to check the confirmation and reminder actually arrive. Setting up a reminder is not the same as knowing it sends.

## Paperwork: summaries you can check

Contracts, supplier terms, insurance policies and official letters are long and easy to put off. AI can help you find what matters, provided you ask for a summary you can verify.

\`\`\`try
Summarise this [DOCUMENT TYPE] for a small business owner. Give me:
1. What I am agreeing to or being asked to do, in plain words
2. Every date, deadline, fee, penalty and notice period, with the clause or page number
3. Anything unusual or one-sided I should ask about
4. Anything I might expect to see that this document does not mention
Quote the exact wording for everything in points 2 and 3.

[PASTE THE DOCUMENT, WITH NAMES AND ACCOUNT NUMBERS REMOVED]
\`\`\`

Asking for clause references and exact quotes lets you check each point against the real text in minutes. A summary can miss things, so point 4 matters: it prompts both of you to look for gaps.

Before pasting anything, apply the guardrails from Module 1: is this tool approved for business documents, and is the document confidential? For contracts, leases, employment matters and tax, AI helps you understand the document and prepare questions. A qualified professional should advise before you sign anything significant.

## Try it now

1. Run the template prompt for your five most common customer messages and save the results as templates in your email tool.
2. Write your triage rules in four lines and set up at least one filter.

You are done when the templates are saved, one filter is running, and you have used a template for a real reply today.`,
        microCheck: [
          {
            question: "Your email tool now sorts messages with AI. Which check matters most in the first few weeks?",
            options: [
              "Count how many emails it sorts each day to measure the savings",
              "Look through the low-priority folder for misfiled urgent mail",
              "Turn off all your other filters so the AI learns faster",
              "Reply to every sorted email the same day to train the sorter",
            ],
            correctIndex: 1,
            explanation:
              "The costly failure is an urgent message quietly hidden in the wrong folder. Checking the low-priority pile shows whether the sorter can be trusted.",
          },
          {
            question: "Why ask for clause references when AI summarises a supplier contract?",
            options: [
              "So you can check each key point against the actual wording",
              "Because summaries without references are not legally valid",
              "So the AI tool can store the contract for later questions",
              "Because references make the summary shorter to forward on",
            ],
            correctIndex: 0,
            explanation:
              "References turn the summary into a map of the document. You can check the points that matter in minutes instead of trusting the summary blind.",
          },
          {
            question: "An AI summary of a lease says the notice period is three months. What should you do before relying on it?",
            options: [
              "Trust it, since summaries of legal documents are very reliable",
              "Ask the same tool again and go with the more common answer",
              "Read the quoted clause, and take advice before signing anything",
              "Ignore it, since AI tools should never see legal documents",
            ],
            correctIndex: 2,
            explanation:
              "The summary is a starting point. Checking the actual clause catches errors, and a significant contract like a lease deserves professional advice before you commit.",
          },
          {
            question: "What is the main benefit of writing triage rules down once?",
            options: [
              "Customers can no longer contact you outside working hours",
              "You can delete every email that does not match your rules",
              "You never need to read the low-priority messages again",
              "You stop making the same sorting decision dozens of times",
            ],
            correctIndex: 3,
            explanation:
              "Deciding the rules once saves the mental effort of re-deciding every message. It does not remove the need to glance at the lower-priority piles.",
          },
          {
            question: "An AI-drafted reply template includes a call-out charge you never gave it. What went wrong?",
            options: [
              "It filled a gap with an invented figure, so check templates",
              "The tool was out of date and used last year's market prices",
              "Templates always need a price, so the tool had to add one",
              "The tool read your invoices without asking for your permission",
            ],
            correctIndex: 0,
            explanation:
              "AI tools fill gaps with plausible content. That is why the prompt forbids invented prices and why you read every template before it goes out many times.",
          },
        ],
      },
      {
        title: "Connect your tools with simple automations, safely",
        objective: "Design one simple automation linking your form, email, calendar or spreadsheet, with a human checkpoint, a failure alert and a named owner.",
        durationMinutes: 28,
        contentType: "article",
        bodyMd: `## An automation is a loop you cannot see

An automation is a rule of the form "when this happens, do that": a trigger followed by steps. No-code automation tools connect apps you already use without programming. Examples include Zapier and Make, and the built-in automation features in Microsoft 365 and Google Workspace. Features, limits and prices change often, so check what your plan includes today.

Seen as a system, an automation is a loop running without anyone watching. When it works, it is invisible. When it breaks, it usually breaks silently. Someone renames a form field, a password changes, a spreadsheet column moves, and enquiries go nowhere for weeks until someone asks why things have gone quiet. So every automation you build needs two extra parts beyond the steps: a **human checkpoint** and a **failure alert**.

## A worked example: enquiry to follow-up

Imagine a small garden design business. Today the owner copies web enquiries into a spreadsheet by hand, sometimes days late. The automated version:

1. **Trigger**: someone submits the website enquiry form.
2. A new row is added to the enquiries spreadsheet, with status "New".
3. The customer gets a short, fixed acknowledgement (the template from Module 3).
4. A task appears in the owner's calendar: "Call [NAME] about [SERVICE] by tomorrow."
5. **Human checkpoint**: the owner calls, then updates the status to "Quoted", "Booked" or "Not a fit".

Notice where AI fits. It helped write the acknowledgement and can walk you through setting up the steps. It is not writing personalised replies to customers unchecked.

\`\`\`try
I want to automate this process in my [TYPE OF BUSINESS]: [DESCRIBE THE STEPS YOU DO BY HAND TODAY].
The tools I already use are: [FORM TOOL, EMAIL, CALENDAR, SPREADSHEET].

1. Suggest the simplest automation: the trigger, then each step.
2. For each step, tell me how it could fail without anyone noticing.
3. Say where a person should check or approve before anything reaches a customer.
4. Suggest one alert that tells me when the automation has stopped working.
Do not recommend buying new tools unless my current ones cannot do this, and list any features I should confirm are on my plan.
\`\`\`

## Human checkpoints: where a person must look

Some steps are safe to run unattended; others need a person. A simple rule of thumb:

- **Fixed content** you wrote and approved (an acknowledgement, a booking confirmation) can usually go automatically.
- **New content** created by AI for a specific customer goes into a queue for approval, at least until you have watched it work well for a good while.
- **Money** (refunds, discounts, invoices, payments) always has a person approve it.
- **Deleting or overwriting data** always has a person approve it.

## Alerts: make failure loud

Three cheap ways to stop silent failure:

- **Error notifications.** Most automation tools can email you when a run fails. Turn this on and send it to an inbox someone actually reads.
- **A "too quiet" check.** If the enquiries sheet has had no new rows for several days, something may be wrong. Some tools can alert you; otherwise, put a weekly calendar reminder to look.
- **A monthly test.** Submit your own form with test details and check every step fires, end to end.

Then write a short note for each automation: what it does, where it lives, who owns it and how to switch it off. Without that note, the person who built it becomes the new bottleneck.

## Second-order effects

Automations change how customers experience you, not only how much time you save. Imagine an automated sequence that emails a customer every three days until they book. If it does not stop when they book by phone, they get chased for something they have already bought. That feels careless, and it can lose the customer you just won.

Before switching anything on, ask: what happens to the customer if this fires at the wrong time, fires twice, or goes to the wrong person? Build in a stop condition, such as "end the sequence when status changes to Booked".

## Try it now

Pick one hand-off you do by hand every week, such as copying enquiries into a sheet or sending booking confirmations.

1. Run the prompt above in the practice pad.
2. On one page, write the trigger, the steps, one human checkpoint, one failure alert and the owner.

You are done when that page exists. You do not have to build it today. If you do, test it with your own details before any customer's details go through it.`,
        microCheck: [
          {
            question: "An enquiry form automation sent nothing to your spreadsheet for three weeks and nobody noticed. What was missing?",
            options: [
              "A paid plan with a faster connection between the two apps",
              "A failure alert or regular check that makes a break visible",
              "An AI step to write more persuasive replies to enquiries",
              "A second form on the website in case the first one fills up",
            ],
            correctIndex: 1,
            explanation:
              "Automations tend to fail silently. An error notification, a too-quiet check or a monthly test turns a silent break into one you hear about within days.",
          },
          {
            question: "Which step most clearly needs a human checkpoint?",
            options: [
              "Adding a new form entry as a row in the enquiries sheet",
              "Creating a calendar reminder to call the customer tomorrow",
              "Sending a fixed acknowledgement you wrote and approved",
              "Sending an AI-written personalised reply to a customer",
            ],
            correctIndex: 3,
            explanation:
              "New content created for a specific customer can contain errors or promises you never made. Fixed, approved content and internal steps carry much less risk.",
          },
          {
            question: "Your follow-up sequence keeps emailing customers who already booked by phone. What is the best fix?",
            options: [
              "End the sequence automatically when the status becomes Booked",
              "Send the follow-ups less often, perhaps once a fortnight",
              "Add an apology line to every follow-up in case they booked",
              "Turn off all follow-ups, since automation annoys customers",
            ],
            correctIndex: 0,
            explanation:
              "The fault is a missing stop condition. Sending less often still chases the wrong people, and dropping follow-ups loses the benefit for customers who have not decided.",
          },
          {
            question: "Why write a short note saying what each automation does, who owns it and how to switch it off?",
            options: [
              "Automation tools will not run without written documentation",
              "Customers can read how their enquiry is being handled",
              "The person who built it does not become a new bottleneck",
              "The law requires a written record of every automated task",
            ],
            correctIndex: 2,
            explanation:
              "If only the builder understands an automation, every fault waits for them. A short note lets anyone on the team check or pause it.",
          },
          {
            question: "What is the purpose of submitting a test entry through your own form once a month?",
            options: [
              "To keep the automation account active so it is not closed",
              "To confirm every step still fires end to end as expected",
              "To train the AI so it writes better replies over time",
              "To make the business look busier in the sales figures",
            ],
            correctIndex: 1,
            explanation:
              "A test run checks the whole chain, including the steps that have no error message when they quietly stop working.",
          },
        ],
      },
      {
        title: "Hiring and staff: job ads, interviews and onboarding",
        objective: "Use AI to draft a fair job advert, a structured interview with a scoring guide and an onboarding plan, while keeping every decision about people with a person.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Where AI helps, and where it must not decide

Hiring is one of the most time-consuming jobs a small business owner does, and one of the most important to get right. AI can help a lot with the writing: job adverts, interview questions, scoring guides, onboarding plans and first drafts of staff documents.

What it must not do is decide. Choosing who to interview, hire, discipline or dismiss stays with a person. Employment law differs by country but commonly covers discrimination, the right to work, contracts, pay and how personal data is handled. The pattern for this lesson is the same as the rest of the course: **AI drafts, you decide, and a qualified adviser checks anything contractual.** That adviser might be an employment solicitor or an HR adviser, and official government guidance for employers is a good free starting point.

## Job adverts that attract the right people

A good advert is clear about the job, the pay and what matters. AI makes a solid first draft if you give it the facts.

\`\`\`try
Write a job advert for a [ROLE] at my [TYPE OF BUSINESS] in [TOWN OR AREA].
Use only these facts: hours [HOURS], pay [PAY], main duties [DUTIES], essential skills [ESSENTIALS], desirable skills [DESIRABLES], what it is like to work here [CULTURE].

Rules:
- Plain, friendly language, under 300 words.
- Keep essential and desirable requirements separate, and keep the essentials to what the job really needs.
- Avoid wording that could put off or exclude people for reasons unrelated to the job, for example age ("young, energetic team"), gender or nationality. Flag any wording in my facts that could be a problem.
- End with how to apply and the closing date.
\`\`\`

Then read it yourself. Phrases like "digital native", "recent graduate" or "strong native English" can exclude people who could do the job well, and may raise legal issues depending on where you are. AI can flag some of these, but you remain responsible for what you publish.

## Structured interviews and a fair scoring guide

A structured interview means every candidate gets the same questions, scored against the same guide. It is fairer, and it makes candidates much easier to compare than notes from free-flowing chats.

Ask AI to draft five or six questions linked to your essential requirements, each with a short guide: what a strong, adequate and weak answer looks like. Then edit them so they reflect your real work. Ask it too to check your list for anything that should not be there. Questions about family plans, health, religion, age or other personal matters unrelated to the job do not belong in an interview.

## The CV-screening trap

It is tempting to paste sixty applications into a chatbot and ask for the top five. Hold back, for three reasons:

- **Bias.** AI models can reflect patterns in the data they learned from, such as favouring certain kinds of names, schools or career paths. You may not see it happening.
- **Personal data.** CVs are personal data. Data protection laws (for example UK GDPR or the EU GDPR) apply to how you collect, store and share them, and pasting them into an unapproved tool may breach them.
- **Rules on automated decisions.** Some places restrict decisions about people made solely by automated means. The EU AI Act treats AI used to screen or rank job applicants as high-risk, with obligations that apply in phases, so check the official timetable if it applies to you.

A safer approach: use AI to help you write a clear checklist of essentials, then read the applications against it yourself. If you are offered a hiring tool with AI features, ask the supplier how it is tested for bias and take advice before relying on it.

## Onboarding: the first two weeks

New starters often learn by shadowing the owner, which puts the bottleneck right back. Your SOPs from lesson one change that. Ask AI to turn your list of SOPs into an onboarding plan: day one, week one and week two; who shows the new starter each task; which SOPs to read and when; and a short check-in at the end of each week.

AI can also draft a welcome pack or a first version of a staff handbook. Treat those as drafts: anything touching contracts, pay, leave or disciplinary rules should be checked by someone who knows employment law where you operate.

## Try it now

Even if you are not hiring right now, prepare for the next time.

1. Run the job advert prompt for a role you have filled before, and remove or rewrite any wording it flags.
2. Write five structured interview questions, each with a one-line guide to a strong answer.

You are done when you have a saved advert and question set you would be comfortable showing to a candidate.`,
        microCheck: [
          {
            question: "You have sixty applications for one role. What is the safest role for AI here?",
            options: [
              "Rank all sixty CVs and invite the top five straight to interview",
              "Reject any CV that lacks the exact keywords used in the advert",
              "Help write the essentials checklist that you then apply yourself",
              "Summarise each candidate's personal life so you know them better",
            ],
            correctIndex: 2,
            explanation:
              "AI screening risks hidden bias and data protection problems, and some places restrict automated decisions about people. Helping you define the criteria keeps the decision with you.",
          },
          {
            question: "Why ask every candidate the same questions and score them with the same guide?",
            options: [
              "It makes interviews fairer and answers easier to compare",
              "It lets an AI tool run the interviews while you are out",
              "It is the only way to avoid paying a recruitment agency",
              "It means you never need to take notes in the interview",
            ],
            correctIndex: 0,
            explanation:
              "A structured interview holds every candidate to the same standard, which reduces the effect of first impressions and makes the final comparison fairer.",
          },
          {
            question: "An AI-drafted advert asks for a \"young, energetic team player\". What should you do?",
            options: [
              "Keep it, since AI tools are trained to avoid unfair wording",
              "Keep it but add a line saying that all ages are welcome",
              "Delete the advert and hire by word of mouth to avoid the issue",
              "Remove the age wording and describe what the job demands",
            ],
            correctIndex: 3,
            explanation:
              "Age-related wording can deter good candidates and may breach discrimination rules. Describing the real demands of the job, such as being on your feet all day, is fairer and clearer.",
          },
          {
            question: "Who should check a staff contract or handbook that AI drafted?",
            options: [
              "The AI tool itself, by asking it to review its own draft",
              "A qualified adviser who knows employment law where you are",
              "The new employee, who can flag anything they dislike in it",
              "Nobody, provided the prompt told the tool to follow the law",
            ],
            correctIndex: 1,
            explanation:
              "Employment law varies by country and AI can be confidently wrong about it. A qualified adviser catches problems before they become disputes.",
          },
          {
            question: "Which interview question should come off your list?",
            options: [
              "Do you have children, or plan to in the next few years?",
              "Tell me about a time you handled an unhappy customer.",
              "How would you prioritise three jobs due on the same day?",
              "What would you check before locking up at the end of a day?",
            ],
            correctIndex: 0,
            explanation:
              "Questions about family plans are unrelated to the job and can lead to discrimination claims. The others test skills the role actually needs.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Imagine a florist whose automation copies website orders into a spreadsheet. A form update renamed a field and orders stopped arriving. What would have caught this within a day?",
        options: [
          "A failure alert sent to an inbox that someone checks daily",
          "Upgrading to a paid plan so the automation runs more often",
          "Asking AI to rewrite the order form to be more persuasive",
          "Turning off the automation and typing every order by hand",
        ],
        correctIndex: 0,
        explanation:
          "Automations fail silently unless you build in a way to hear about it. A paid plan runs the broken automation more often; typing by hand gives up the time saving entirely.",
      },
      {
        question: "A salon owner wants AI to reply to every booking query with a personalised message. What is the sensible starting point?",
        options: [
          "Replies go out automatically, and the owner reads them monthly",
          "AI drafts go into a queue that a person approves before sending",
          "Replies go out only at night when customers are less likely to read",
          "The salon waits until AI tools stop making any mistakes at all",
        ],
        correctIndex: 1,
        explanation:
          "New, AI-written content for a specific customer can contain errors or promises. An approval queue keeps the time saving while a person catches mistakes before customers see them.",
      },
      {
        question: "You record yourself doing the weekly stock order and AI turns it into an SOP. What best shows the SOP is finished?",
        options: [
          "It is long enough to cover every situation that could arise",
          "Another AI tool rates it as clear and professional to read",
          "A colleague does the order from it without needing to ask you",
          "You read it through and it matches how you remember doing it",
        ],
        correctIndex: 2,
        explanation:
          "The purpose of an SOP is that someone else can do the task without you. You reading it is a weak test, because you fill the gaps from memory without noticing.",
      },
      {
        question: "Your closing-up checklist has grown to 38 items and staff tick them without reading. What should you do?",
        options: [
          "Add a signature line to each item so staff take it seriously",
          "Replace it with a video so staff do not have to read anything",
          "Keep all 38 items and remind staff to read each one carefully",
          "Cut it to the steps that are easy to forget or costly to miss",
        ],
        correctIndex: 3,
        explanation:
          "Long checklists get ticked on autopilot. A short list of the steps that matter most gets read; the full detail belongs in the SOP used for training.",
      },
      {
        question: "An AI summary of a supplier contract mentions no cancellation fee. What is the right next step?",
        options: [
          "Search the contract yourself for cancellation terms before signing",
          "Take it as confirmed, since the summary would have listed a fee",
          "Ask AI to add a cancellation clause in your favour to the contract",
          "Sign quickly, since a missing fee means the supplier forgot one",
        ],
        correctIndex: 0,
        explanation:
          "Summaries can miss things, and a missing item is harder to spot than a wrong one. Checking the original text is quick and protects you from a costly surprise.",
      },
      {
        question: "An owner wants AI to shortlist job applicants from their CVs. Which concern matters most?",
        options: [
          "Cost, since AI shortlisting is dearer than using an agency",
          "Bias and personal data rules, so a person makes the decisions",
          "Speed, since AI takes longer than a person to read every CV",
          "Formatting, since AI cannot read CVs saved as PDF documents",
        ],
        correctIndex: 1,
        explanation:
          "Automated screening can carry hidden bias, CVs are personal data, and some places restrict automated decisions about people. The decision should stay with a person.",
      },
      {
        question: "Imagine a builder whose automation emails a follow-up every three days until a quote is accepted. Some customers complain. What is the most likely cause?",
        options: [
          "The emails were written by AI rather than by the owner in person",
          "Customers dislike receiving any email from a small business",
          "The sequence does not stop when customers reply or decide by phone",
          "The automation tool sends from an address that looks suspicious",
        ],
        correctIndex: 2,
        explanation:
          "A follow-up loop without a stop condition keeps chasing people who have already replied or decided. That second-order effect can undo the goodwill the follow-ups were meant to build.",
      },
      {
        question: "Your email tool's AI sorter puts messages into \"urgent\" and \"later\". Which routine keeps it safe?",
        options: [
          "Deleting everything in \"later\" at the end of each week",
          "Letting the sorter reply to \"later\" messages for you",
          "Checking \"urgent\" only, since that is where risk sits",
          "A weekly look through \"later\" for anything misfiled",
        ],
        correctIndex: 3,
        explanation:
          "The risk with a sorter is the urgent message it wrongly files as low priority. Only checking the \"later\" pile reveals those mistakes.",
      },
      {
        question: "Why does every automation need a named owner and a short note on how to switch it off?",
        options: [
          "So a fault can be fixed quickly without waiting for the builder",
          "So customers can complain directly to the person who built it",
          "So the automation tool can charge the right person's account",
          "So staff are discouraged from building automations of their own",
        ],
        correctIndex: 0,
        explanation:
          "Undocumented automations make their builder a new bottleneck. A named owner and a short note mean anyone can check, pause or fix it when something goes wrong.",
      },
      {
        question: "AI drafted an onboarding plan for a new starter from your SOPs. What makes it most useful?",
        options: [
          "It covers every policy in detail so nothing needs explaining",
          "It names who shows them each task and which SOPs to read when",
          "It lets the new starter learn alone without anyone's time",
          "It is long and formal so the business looks well organised",
        ],
        correctIndex: 1,
        explanation:
          "A good plan spreads the teaching across the team and sequences the SOPs, so the new starter does not depend on the owner for everything.",
      },
      {
        question: "Which message is best suited to a fixed template sent automatically, with no human check each time?",
        options: [
          "Responding to a complaint about a job that went wrong",
          "Offering a discount to a customer who says it is too dear",
          "Confirming an enquiry arrived and saying when you will reply",
          "Telling a job applicant why they were not chosen to interview",
        ],
        correctIndex: 2,
        explanation:
          "A fixed acknowledgement is the same for everyone and carries little risk. Complaints, discounts and feedback to applicants need judgement about the individual case.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 5
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Money: Pricing, Numbers and Decisions",
    summary:
      "Read your sales, costs and cash flow with AI without exposing sensitive data, check pricing and margin maths both ways, build simple forecasts and what-if scenarios, and handle supplier negotiations and late payers politely and firmly.",
    lessons: [
      {
        title: "Read your numbers with AI, safely",
        objective: "Use AI to explain an anonymised summary of your sales, costs and cash, and check its figures against your own spreadsheet formulas.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## Three numbers that tell the story

You do not need to be an accountant to understand your business, but you do need three things clear:

- **Sales** (also called revenue or turnover): money customers owe you for what you sold.
- **Costs**, split into **direct costs** (materials, stock, subcontractors: things you spend because you made a particular sale) and **overheads** (rent, insurance, software, wages: things you pay whatever you sell).
- **Cash**: the money actually in the bank, and when it moves in and out.

A profitable business can still run out of cash. In systems terms, your bank balance is a **stock** (an amount that builds up or drains), and money coming in and going out are **flows**. The gap between them is often a **delay**: you buy stock today, but your trade customers pay in sixty days. Profit says you are doing well; the bank balance says you cannot pay the rent this week. Both are true.

## Safety first: what you paste in

Financial data is sensitive. Before any figures go near an AI tool, apply the guardrails from Module 1:

- Use only tools your business has approved. Check whether your plan lets the provider use your data for training, and where it is stored.
- Anonymise. Replace customer and staff names with codes (Customer A, Staff 1). Remove bank account numbers, card details, tax reference numbers and addresses.
- Prefer monthly totals by category to raw transaction exports.
- Keep payroll and individual salaries out unless there is a clear reason and an approved tool.

Many accounting packages now include their own AI features. These can be a safer route, because the data stays in a system you already trust. Check what your provider offers and read its data terms.

## Ask it to explain, then check its maths

AI is good at spotting patterns, putting them in plain words and suggesting questions to ask. It is less reliable at doing arithmetic across many rows in its head, and it can state a wrong figure with total confidence. So ask it to show its working, and ask for spreadsheet formulas you can run yourself. Your spreadsheet stays the source of truth.

\`\`\`try
I run a [TYPE OF BUSINESS]. Below is an anonymised monthly summary for the last [NUMBER] months: sales, direct costs, overheads and closing bank balance.
[PASTE YOUR TABLE]

1. In plain words, what are the three most important things these numbers show?
2. Which months look unusual, and what questions should I ask about them?
3. Write the spreadsheet formulas I would use to calculate gross margin percentage and net profit for each month, so I can check your figures myself.
Do not guess at causes you cannot see in the data. Label anything that is an assumption.
\`\`\`

Gross margin, by the way, is sales minus direct costs, shown as a percentage of sales. It tells you how much of each sale is left to pay the overheads and you.

## A worked example

Imagine a small bike repair shop. Sales peak in spring, yet the bank balance is lowest in early summer, just when the owner feels busiest. She pastes an anonymised monthly summary into an approved tool. It points out that she buys most of her parts in March and pays upfront, while her two trade customers pay on sixty-day terms.

She checks this with the formulas the tool gave her, and the pattern holds. The tool suggests questions: could she order in two batches, or ask the trade customers for thirty-day terms? Those are her decisions to weigh, not the tool's. What the tool did was turn a vague worry into a specific question.

## Check before you believe

- Spot-check two or three figures by hand against your spreadsheet.
- Watch for totals that do not add up, months that have shifted, and mixed figures (some including sales tax, some not).
- If the tool says "sales fell by a fifth", recalculate it before repeating it to anyone.
- Tax rules vary by country and change. AI can explain concepts like VAT or allowances in general terms, but your accountant or bookkeeper confirms anything you file or pay.

## Try it now

1. Build an anonymised table of your last six to twelve months: sales, direct costs, overheads and closing bank balance.
2. Run the prompt above in the practice pad.
3. Check at least two of its figures with the formulas it gave you.

You are done when you have written down three questions about your numbers to answer yourself or take to your accountant.`,
        microCheck: [
          {
            question: "Your business made a profit last quarter, but the bank balance fell. What is the most likely explanation?",
            options: [
              "The profit figure must be wrong, since profit always reaches the bank",
              "Cash went out before it came in, such as stock bought ahead of slow payers",
              "The AI tool used the wrong currency when adding up the monthly totals",
              "Overheads are left out of profit, so only the bank shows the real result",
            ],
            correctIndex: 1,
            explanation:
              "Profit and cash differ because of timing. Paying suppliers upfront while customers pay later drains the bank even when every sale is profitable.",
          },
          {
            question: "Before pasting a sales export into an AI tool, what should you do?",
            options: [
              "Use an approved tool and replace names and account details with codes",
              "Nothing, since sales data is neither personal nor commercially sensitive",
              "Convert the file to PDF so the tool cannot read the individual rows",
              "Paste it into several free tools and compare their answers carefully",
            ],
            correctIndex: 0,
            explanation:
              "Sales data often contains personal and commercially sensitive details. An approved tool plus anonymisation keeps the benefit while limiting the risk.",
          },
          {
            question: "An AI tool says your gross margin rose from 38% to 45%. How should you check it?",
            options: [
              "Ask the same tool whether it is confident about the answer",
              "Accept it if the figure is roughly in line with your feeling",
              "Recalculate it with a spreadsheet formula on the original data",
              "Run the prompt again and take the average of the two results",
            ],
            correctIndex: 2,
            explanation:
              "AI can state wrong figures confidently, and asking it again does not verify anything. A formula on your own data is the real check.",
          },
          {
            question: "Why ask the AI tool for spreadsheet formulas rather than only for answers?",
            options: [
              "Formulas are always right, whereas AI answers are always wrong",
              "Spreadsheets cannot calculate margin without AI-written formulas",
              "It stops the tool from keeping your figures after the session",
              "Formulas let you verify the result in the file you already trust",
            ],
            correctIndex: 3,
            explanation:
              "Formulas move the calculation into your spreadsheet, where you can see and test it. That keeps your file, not the chatbot, as the source of truth.",
          },
          {
            question: "An AI tool suggests a way to reduce your sales tax bill. What should happen next?",
            options: [
              "Ask your accountant to confirm it before you change anything",
              "Apply it straight away, since tax rules are the same everywhere",
              "Ignore it, since AI tools are not allowed to discuss tax at all",
              "Apply it if one other website online says roughly the same thing",
            ],
            correctIndex: 0,
            explanation:
              "Tax rules vary by country and change over time, and a wrong filing is costly. AI can help you form the question; a qualified professional should answer it.",
          },
        ],
      },
      {
        title: "Price with confidence: costing, margin and offers",
        objective: "Calculate the true cost and margin of your main products or services, check the maths with AI and by hand, and design an offer that protects your margin.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## Know your cost before you set your price

Many small businesses set prices by looking at competitors and knocking a bit off. The trouble is that you do not know their costs, and they may not either. Start from your own.

The full cost of one unit or one job has three parts:

- **Direct costs**: materials, stock, packaging, subcontractors for that job.
- **A share of overheads**: rent, insurance, software, vehicles, spread across what you sell in a typical month.
- **Your time**: owners often leave this out, which quietly means working for nothing.

AI is useful here as a thinking partner. Ask it to list the costs a business like yours typically has, then compare against your own list to spot what you missed (annual insurance, equipment wearing out, card payment fees). The figures must come from your records, not from the tool.

## Margin and markup: the classic mix-up

These two words sound similar and cause expensive mistakes.

- **Markup** is profit as a percentage of **cost**.
- **Margin** is profit as a percentage of **price**.

Say an item costs you £60 and you sell it for £100. Profit is £40. The markup is 40 divided by 60, about 67%. The margin is 40 divided by 100, which is 40%.

If you want a 40% margin, the formula is: price equals cost divided by (1 minus the margin). So 60 divided by 0.6 gives £100. If instead you simply "add 40%" to the cost, you charge £84, and your margin is only 24 divided by 84, about 29%. Same words, very different result.

## AI checks your maths, you check AI's

Pricing is a good place to use AI as a second pair of eyes, as long as the checking goes both ways.

\`\`\`try
Check my pricing. For each product or service below I give the direct cost per unit, my share of overheads per unit, and my current price excluding sales tax.
[PASTE YOUR TABLE]

For each one:
1. Work out the profit per unit, the margin % and the markup %, showing your working.
2. Work out the price needed for a target margin of [TARGET]%.
3. Flag anything below that target.
Then give me the spreadsheet formulas so I can reproduce every figure myself.
\`\`\`

Now check it. Recalculate at least one item by hand or with the formulas. If the tool and your spreadsheet disagree, trust the spreadsheet and find out why.

## Discounts: what they really cost

Discounts cost more than they look. Take the item above: price £100, cost £60, profit £40. Give 10% off and the price is £90, but the cost is still £60, so profit falls to £30. You have given away a quarter of your profit, not a tenth. To earn the same total profit, you would need to sell about a third more items.

There is a second-order effect too. Frequent discounts teach customers to wait for the next offer, which is a reinforcing loop: sales dip between offers, so you run more offers, so customers wait longer.

## Bundles and tiers

Bundles and tiers can raise what each customer spends without cutting your price. Imagine a dog groomer offering three levels: a basic wash, a full groom, and a full groom with nail clipping and teeth cleaning. AI can help you name the tiers, describe them in your voice (Module 2), and suggest what to include. Then you check the margin on each tier with your own figures, because an attractive bundle that loses money on every sale is worse than no bundle.

When you do raise prices, tell regular customers early and explain why. The retention habits from Module 3 matter more here than any clever wording.

## What AI cannot know

AI does not know your local market, your competitors' current prices or what your customers value. A "typical price" it gives you may be out of date or simply made up. Check real competitors directly and ask your own customers. Rules on displaying prices and sales tax also vary by country, so check what applies to you.

## Try it now

1. Build a table for three to five of your main products or services: direct cost, overhead share and current price.
2. Run the pricing prompt in the practice pad.
3. Recalculate one item yourself.

You are done when you know which item is furthest below your target margin, and the price that would fix it.`,
        microCheck: [
          {
            question: "An item costs you £60 and you want a 40% margin. What price do you need to charge?",
            options: ["£84", "£96", "£100", "£150"],
            correctIndex: 2,
            explanation:
              "Price equals cost divided by (1 minus the margin): 60 divided by 0.6 is £100. Adding 40% to cost gives £84, only about a 29% margin, and dividing by 0.4 instead gives £150.",
          },
          {
            question: "You add 40% to a £60 cost and charge £84. What margin do you actually make?",
            options: ["About 29%", "Exactly 40%", "About 34%", "Exactly 24%"],
            correctIndex: 0,
            explanation:
              "Profit is £24 on a price of £84, which is about 29%. The 40% you added is the markup, which is based on cost, not price.",
          },
          {
            question: "An AI tool gives you a \"typical market price\" for your service. How should you treat it?",
            options: [
              "As reliable, since AI tools are trained on current price lists",
              "As a prompt to check real competitors and ask your customers",
              "As the price to charge, since matching the market avoids risk",
              "As useless, since AI should never be used for pricing work",
            ],
            correctIndex: 1,
            explanation:
              "AI's idea of a typical price may be out of date or invented, and it knows nothing about your local market. It can start the research but cannot replace it.",
          },
          {
            question: "You give 10% off an item that normally has a 40% margin. What happens to your profit on each sale?",
            options: [
              "It falls by a tenth, in line with the size of the discount",
              "It stays the same because you will sell more items overall",
              "It falls by almost half, from 40 to 22 per 100 of full price",
              "It falls by a quarter, from 40 to 30 per 100 of full price",
            ],
            correctIndex: 3,
            explanation:
              "The discount comes entirely out of profit because costs do not change. Ten off a £40 profit leaves £30, which is a quarter less.",
          },
          {
            question: "What is a second-order risk of running frequent discounts?",
            options: [
              "Customers learn to wait for the next offer before they buy",
              "Your costs rise because suppliers notice you are discounting",
              "AI tools stop recommending your business in their answers",
              "Staff take longer to serve customers who use discount codes",
            ],
            correctIndex: 0,
            explanation:
              "Regular discounts change customer behaviour. People delay buying until the next offer, which pushes you towards running even more offers.",
          },
        ],
      },
      {
        title: "Forecasts and what-if scenarios",
        objective: "Build a simple cash flow forecast with AI's help and test at least one what-if scenario, such as losing your biggest customer or costs rising.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## A forecast is a set of assumptions

Nobody can predict next year's sales. A forecast is not a prediction; it is a statement of the form "if these assumptions hold, this is what happens to our cash". Its value is that it makes your assumptions visible, so you can check them early and act before a problem arrives.

The simplest useful forecast for a small business is a monthly cash flow forecast:

- Opening bank balance
- plus money coming in that month
- minus money going out that month
- equals closing balance, which becomes next month's opening balance.

Three to six months ahead is enough to start. The key word is **cash**: record money in the month it actually arrives or leaves, not the month you made the sale.

## Build the base case with AI's help

AI is good at setting up the structure and at spotting costs you forgot. The numbers come from you.

\`\`\`try
Help me build a simple 6-month cash flow forecast in a spreadsheet for my [TYPE OF BUSINESS].
My assumptions: typical monthly sales [AMOUNT]; customers usually pay [WHEN]; regular monthly costs [LIST]; one-off costs coming up [LIST]; opening bank balance [AMOUNT].

1. Lay out the rows and columns I need.
2. Give me the formulas, recording money in and out in the month cash actually moves.
3. Put every assumption in its own input cell so I can change it later.
4. Tell me which of my assumptions look weakest, and which regular costs businesses like mine often forget.
\`\`\`

The third instruction is the important one. When each assumption lives in its own cell (sales per month, days to get paid, cost of materials), a scenario is just a matter of changing a cell and watching every month update.

## Scenarios: three what-ifs worth testing

**What if our biggest customer leaves?** Imagine an office cleaning firm where one contract brings in a large share of the sales. Remove that contract from month three. How many months until the balance drops below the level you are comfortable with? Which costs could you cut, and how quickly? Relying heavily on one customer is called concentration risk, and this scenario shows you how exposed you are.

**What if costs rise?** Increase your material or energy costs by, say, 15%. Which of your prices could you change, and how soon? Some contracts fix prices for months, so the squeeze can last longer than you expect.

**What if customers pay later?** Push payments back by thirty days without changing sales at all. Delays in a system often hurt more than people expect, because your costs do not wait. This is the pattern from the previous lessons: a profitable business running short of cash.

AI can help you think of scenarios and list early warning signs for each. Let the spreadsheet do the arithmetic.

## Decide your trigger points in advance

A forecast earns its keep when it leads to a decision before you are under pressure. Write down a few rules now, for example: "If the forecast shows the balance falling below [AMOUNT] within three months, I will [ACTION]." That action might be chasing overdue invoices harder, delaying a purchase or talking to your bank early.

In systems terms, you are designing a balancing loop: a signal that triggers a correction. Pair it with leading indicators, the numbers that move before cash does: enquiries per week, quotes accepted and average days to get paid.

## Where AI helps and where it misleads

AI helps with structure, forgotten costs (annual insurance, sales tax payments, equipment replacement) and challenging your assumptions. It misleads when it supplies growth rates it has no basis for, or produces figures with false precision, such as "sales will be £12,340 in March". A forecast that looks too neat deserves more suspicion, not less.

For big decisions based on a forecast, such as taking a loan, signing a lease or hiring, talk it through with your accountant or a business adviser.

## Try it now

1. Build the base case using the prompt in the practice pad and your own figures.
2. Run one scenario: your biggest customer leaves from month three.

You are done when you know which month your balance would fall below your comfort level, and you have written one action you would take if that started to happen.`,
        microCheck: [
          {
            question: "What is the main value of a simple cash flow forecast for a small business?",
            options: [
              "It predicts next year's sales accurately to the nearest pound",
              "It makes your assumptions visible so you spot trouble early",
              "It is required before a business can use AI for its finances",
              "It replaces the need for an accountant to look at your figures",
            ],
            correctIndex: 1,
            explanation:
              "No forecast predicts the future exactly. Its value is making assumptions explicit, so you notice early when reality starts to differ.",
          },
          {
            question: "Why put each forecast assumption in its own input cell?",
            options: [
              "So you can change one and see the effect on every month at once",
              "So the AI tool can read the whole spreadsheet without any formulas",
              "So the forecast looks more professional to the bank manager",
              "So nobody else can change the assumptions by mistake later on",
            ],
            correctIndex: 0,
            explanation:
              "Separate input cells turn scenarios into quick experiments. Assumptions buried inside formulas are hard to find and easy to forget.",
          },
          {
            question: "Imagine one client brings in a large share of your sales. Which scenario matters most to test?",
            options: [
              "That client doubling its orders, and how fast you could hire",
              "Every other client leaving while that one client stays loyal to you",
              "Sales tax rates falling, and how much cash that would free up",
              "That client leaving, and how many months of cash you have left",
            ],
            correctIndex: 3,
            explanation:
              "Heavy reliance on one customer is concentration risk. Testing their departure shows how long you would have to react and what you would need to cut.",
          },
          {
            question: "An AI tool says \"your sales will be £12,340 in March\". What is the problem?",
            options: [
              "It should have rounded to the nearest thousand to be accurate",
              "AI tools are not able to produce forecasts in pounds sterling",
              "It gives a guess with more precision than the data can support",
              "March is too far ahead for any forecast to be worth making",
            ],
            correctIndex: 2,
            explanation:
              "Precise-looking figures can make a guess feel like a fact. A forecast should show its assumptions, not hide them behind exact numbers.",
          },
          {
            question: "Customers start paying 30 days later than before, but sales do not change. What happens to cash?",
            options: [
              "It dips, because costs go out while money arrives later",
              "It rises, because the same sales now bring in more money",
              "It stays flat, because only total sales affect the cash",
              "It is unaffected, because profit has not changed at all",
            ],
            correctIndex: 0,
            explanation:
              "A payment delay shifts money in later while money out stays on time. The gap shows up as a cash dip even though profit is unchanged.",
          },
        ],
      },
      {
        title: "Supplier emails, negotiations and chasing invoices",
        objective: "Draft a polite, escalating set of invoice reminders and prepare for a supplier negotiation using AI as a drafting and practice partner.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## The messages you put off

Some emails sit in drafts for days: chasing a customer who has not paid, asking a supplier for better terms, raising a problem with a late delivery. They are awkward, so they wait. Meanwhile cash stays in someone else's bank and problems grow.

AI is well suited to these messages. It is good at the tone that is hard to find when you are frustrated: firm, polite and clear. You supply the facts, it drafts, and you check before anything is sent.

## Chasing invoices: a polite ladder

Late payment is often a matter of disorganisation rather than bad intent, so start friendly and step up gradually. A typical ladder:

1. **A friendly nudge**, the day after the due date.
2. **A second reminder**, a week later.
3. **A firmer message**, two weeks later, asking for a payment date.
4. **A final reminder**, stating the next step you have decided on.

Every message includes the invoice number, amount, due date and how to pay. Never threaten something you will not do. Legal steps such as charging late payment interest, using a debt recovery service or going to a small claims court vary by country. Some countries give businesses a legal right to charge interest on late payments from other businesses, but check the rules where you are, and take advice before mentioning it.

\`\`\`try
Write a set of four invoice reminder emails for my [TYPE OF BUSINESS], from friendly to firm.
Include these as placeholders: [CUSTOMER NAME], [INVOICE NUMBER], [AMOUNT], [DUE DATE], [HOW TO PAY].

Stage 1: a friendly nudge the day after the due date.
Stage 2: a week later.
Stage 3: two weeks later, firmer, asking for a payment date.
Stage 4: a final reminder saying I will [NEXT STEP I HAVE CHOSEN].

Rules: polite throughout, under 120 words each, no threats beyond the step I have given, no legal claims, and keep the relationship open.
\`\`\`

## Human checkpoint before every chase

Before any reminder goes out, check that the invoice really is unpaid. Payments cross in the post, and customers sometimes pay a different way. Check too whether the invoice is in dispute; chasing a customer who has raised a genuine complaint makes things worse.

Automated reminders are tempting, and many invoicing tools offer them. If you use them, make sure the sequence stops automatically when payment is recorded, exclude any invoice marked as disputed, and read the first few that go out. An automated "final reminder" to a customer who paid yesterday damages trust you took years to build.

## Preparing for a supplier negotiation

AI makes a good sparring partner before a negotiation. The important decisions are yours: what you want, what you can offer in return (paying faster, ordering more, committing for longer) and your walk-away point.

\`\`\`try
I want to negotiate with a supplier of [WHAT THEY SUPPLY]. Our situation: [ORDER SIZE, HOW LONG WE HAVE WORKED TOGETHER, WHAT HAS CHANGED].
What I want: [FOR EXAMPLE, A LOWER PRICE OR LONGER PAYMENT TERMS]. What I can offer: [WHAT YOU CAN GIVE]. My walk-away point: [YOUR LIMIT].

1. Help me plan: my strongest points, their likely concerns, and two or three trade-offs I could propose.
2. Draft a short, friendly email opening the conversation.
3. Then play the supplier's account manager and push back realistically, so I can practise my replies.
\`\`\`

The role-play is where the value is. Practising your replies to "we cannot go lower" is far easier with a tool than live on the phone. Keep confidential details out of the prompt, such as another supplier's quote given to you in confidence.

## Raising problems without burning bridges

When a delivery is late or wrong, a clear structure helps: the facts, the impact on you, what you need, and by when. If you have written an angry first draft, ask AI to "rewrite this so it is firm and factual, and remove anything emotional". Your supplier relationships are part of your business system. One furious email can quietly cost you priority the next time stock is short.

## Try it now

1. Pick one overdue invoice or one supplier message you have been putting off.
2. Draft it with the matching prompt in the practice pad, and check every fact against your records.
3. Save the four invoice reminders as templates.

You are done when the message is sent or scheduled and the reminder templates are saved.`,
        microCheck: [
          {
            question: "Before sending an AI-drafted payment reminder, what should you check first?",
            options: [
              "That the email is long enough to show you are serious",
              "That the invoice is still unpaid and not in any dispute",
              "That the AI tool has saved a copy for your future records",
              "That the reminder mentions legal action to speed things up",
            ],
            correctIndex: 1,
            explanation:
              "Chasing a customer who has paid, or who has a genuine complaint, damages the relationship. The check takes a minute and prevents the most common mistake.",
          },
          {
            question: "Your final reminder mentions charging interest on late payment. What should you do before sending it?",
            options: [
              "Send it, since interest can be charged on any late invoice",
              "Double the interest rate so the customer takes it seriously",
              "Check the rules where you operate, and take advice if unsure",
              "Remove the invoice number so the claim is harder to dispute",
            ],
            correctIndex: 2,
            explanation:
              "Rules on late payment interest differ by country and by type of customer. Threatening something you are not entitled to do undermines your position.",
          },
          {
            question: "You automate invoice reminders. Which safeguard matters most?",
            options: [
              "The sequence stops once payment is recorded or a dispute raised",
              "The reminders are sent from the owner's personal email address",
              "Each reminder is a little more forceful than the one before it",
              "The reminders go out at weekends, when customers are at home",
            ],
            correctIndex: 0,
            explanation:
              "Without a stop condition, the automation keeps chasing people who have paid or complained. That second-order effect costs goodwill and sometimes customers.",
          },
          {
            question: "How can AI help most when you prepare for a supplier negotiation?",
            options: [
              "Tell you the supplier's real minimum price from its records",
              "Negotiate for you by email without you reading any replies",
              "Guarantee a discount by writing the most persuasive email",
              "Play the supplier and push back so you can rehearse replies",
            ],
            correctIndex: 3,
            explanation:
              "AI cannot know the supplier's limits or guarantee an outcome, but it can give you realistic practice so you respond calmly on the day.",
          },
          {
            question: "You have written an angry email about a late delivery. What is the best use of AI?",
            options: [
              "Rewrite it as the facts, the impact and what you need by when",
              "Make it angrier so the supplier knows you mean business now",
              "Send it straight away before you have time to soften it at all",
              "Turn it into a public review so other customers are warned too",
            ],
            correctIndex: 0,
            explanation:
              "A firm, factual message gets the problem fixed and keeps the relationship intact. Anger feels satisfying but tends to make suppliers defensive.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Imagine a bakery owner who pastes a full bank export, including customer names and card details, into a free AI tool. What is the main problem?",
        options: [
          "Free tools cannot read bank exports, so the analysis will fail",
          "Sensitive data went to an unapproved tool without anonymising",
          "The export should have been printed and scanned in as an image",
          "Bank exports are too small for AI to find any useful patterns",
        ],
        correctIndex: 1,
        explanation:
          "Card details and customer names are sensitive personal data. Using an approved tool and replacing identifying details with codes should come before any analysis.",
      },
      {
        question: "An AI tool summarises twelve months of sales and says profit rose 18%. What should you do next?",
        options: [
          "Share the figure with your team today as confirmed good news",
          "Ask the tool to round the figure so it looks more believable",
          "Assume it is right because it matches what you hoped to see",
          "Recalculate the figure in your spreadsheet before acting on it",
        ],
        correctIndex: 3,
        explanation:
          "AI can state wrong figures confidently. A figure you are going to act on or share should be checked against your own data first.",
      },
      {
        question: "You want a 50% margin on an item that costs you £30. What should you charge?",
        options: ["£45", "£60", "£55", "£50"],
        correctIndex: 1,
        explanation:
          "Price equals cost divided by (1 minus the margin): 30 divided by 0.5 is £60. Adding 50% to the cost gives £45, which is only a 33% margin.",
      },
      {
        question: "Imagine a gift shop that offers 20% off everything for a month. Sales rise, but profit falls. What is the best explanation?",
        options: [
          "The discount cut profit per sale by more than extra sales added",
          "The AI tool that suggested the offer got the prices wrong",
          "Discounts always reduce profit however many extra items sell",
          "Customers bought fewer items each because the shop was busy",
        ],
        correctIndex: 0,
        explanation:
          "A discount comes straight out of profit per item. Unless volume rises enough to make up for it, total profit falls even as sales go up.",
      },
      {
        question: "Imagine a cleaning firm whose largest contract is a big share of its sales. What does a what-if scenario for losing it tell the owner?",
        options: [
          "The exact date the client is likely to end the contract",
          "Which competitor the client is most likely to switch to",
          "How long the cash lasts and what actions to plan ahead",
          "How much the contract is worth to the client in their terms",
        ],
        correctIndex: 2,
        explanation:
          "A scenario cannot predict what the client will do. It shows how exposed the business is and gives the owner time to plan a response.",
      },
      {
        question: "An AI-built forecast shows smooth growth every month with very precise figures. What should make you cautious?",
        options: [
          "Neat, precise figures can hide invented growth assumptions",
          "Forecasts built with AI are always too pessimistic to use",
          "Smooth growth means the spreadsheet formulas are broken",
          "Precise figures show the tool used your accounting system",
        ],
        correctIndex: 0,
        explanation:
          "Real businesses rarely grow smoothly. Neat numbers may come from a growth rate the tool made up; find the assumption and decide whether you believe it.",
      },
      {
        question: "Your accounting software offers built-in AI features. Why might they be a safer route than pasting figures into a general chatbot?",
        options: [
          "Built-in features cannot make mistakes because they use real data",
          "General chatbots are not allowed to process numbers of any kind",
          "Data may stay in a system you already trust, subject to its terms",
          "Built-in features remove any need for you to check the figures",
        ],
        correctIndex: 2,
        explanation:
          "Keeping data inside an approved system reduces how often it is copied elsewhere. You still read the data terms and still check any figure you act on.",
      },
      {
        question: "A customer paid an invoice yesterday but today received your automated \"final reminder\". What is the underlying fault?",
        options: [
          "The reminder was worded too politely to make a difference",
          "The sequence did not check payment status before sending",
          "Automated reminders should only go out in working hours",
          "The customer should have told you they were about to pay",
        ],
        correctIndex: 1,
        explanation:
          "An automated chase needs a stop condition tied to payment status. Without one, the loop keeps running after the goal has been met.",
      },
      {
        question: "Before a supplier negotiation, what should you decide yourself rather than leave to AI?",
        options: [
          "The wording of the opening email and its subject line",
          "Which likely objections the supplier might want to raise",
          "How to lay out the email in short, clear paragraphs",
          "Your walk-away point and what you can offer in return",
        ],
        correctIndex: 3,
        explanation:
          "Your limits and what you can give depend on your business and your judgement. AI can help with wording and rehearsal once you have decided them.",
      },
      {
        question: "An AI tool suggests you could reclaim more sales tax on some purchases. What is the right response?",
        options: [
          "Treat it as a question for your accountant before you act",
          "Update your next tax return, since the tool gave its reasons",
          "Ignore it, since AI tools know nothing useful about taxes",
          "Ask two more AI tools and follow the majority recommendation",
        ],
        correctIndex: 0,
        explanation:
          "Tax rules vary and change, and mistakes can bring penalties. AI can raise a good question, but a qualified professional should answer it.",
      },
      {
        question: "Your profit looks healthy, yet you struggle to pay bills each month. Which change to your forecast is most useful?",
        options: [
          "Record every sale in the month the order was first placed",
          "Record money in and out in the month cash actually moves",
          "Remove overheads so the monthly picture looks more stable",
          "Ask AI to project a higher growth rate for coming months",
        ],
        correctIndex: 1,
        explanation:
          "Cash problems come from timing. Recording money when it actually moves shows the gaps that a profit view hides.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 6
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Your 90-Day AI Plan for the Business",
    summary:
      "Choose your top three AI projects by impact and effort, bring your team with you through a short guideline, training and a shared prompt library, manage the risks you are responsible for, and measure results so you can decide what to keep, change or drop.",
    lessons: [
      {
        title: "Pick your top three AI projects",
        objective: "Score your candidate AI projects by impact and effort, and choose a balanced top three for the next 90 days, each with an owner, a measure and a first step.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Start from the problem, not the tool

By now you have more ideas than time: reply templates, review requests, SOPs, an enquiry automation, invoice reminders, a cash forecast. Trying to do them all at once is how AI projects fizzle out. This lesson turns a long list into three projects you will actually finish in 90 days.

Start from problems, not tools. Go back to your time audit and your picture of the business as a system from Module 1. Where does work pile up? Where do customers wait? Where do you lose money or sleep?

Write each candidate as a problem with an outcome:

- Weak: "Use a chatbot on the website."
- Strong: "Web enquiries wait up to three days for a reply, and we lose jobs. Goal: reply to every enquiry within one working day."

The strong version tells you what to measure and whether a chatbot is even the right answer. Here, a form automation and a reply template might do the job better.

## Score impact and effort

Give each candidate two rough scores from 1 to 5.

**Impact**: hours saved per week, money won or protected, a better experience for customers, lower risk.

**Effort**: set-up time, cost, how much you and the team must learn and change, and how much harm it could do if it goes wrong.

Then ask one systems question: **does this take load off the bottleneck?** A project that frees up the owner's time often has more impact than its hours suggest, because everything queued behind you starts to move. That is a leverage point: a small change in the right place that shifts the whole system.

\`\`\`try
Here are the AI projects I am considering for my [TYPE OF BUSINESS], with my rough notes on each:
[LIST YOUR PROJECTS]

For each one, suggest an impact score (1 to 5) and an effort score (1 to 5), with one line of reasoning, and flag:
- which ones reduce the load on me as the owner
- any risk to customers or to personal data
- anything that depends on another project being done first.
Then suggest a top three for the next 90 days, and tell me what else you would need to know to be more confident. Where my scores differ from yours, mine stand; just note why yours differ.
\`\`\`

The tool does not know your business better than you do. Use its scores to question your own, not to replace them.

## Choose a balanced three

A good 90-day plan usually mixes three kinds of project:

1. **A quick win**, done within two weeks. It builds confidence and frees a little time. Reply templates are a typical example.
2. **A bottleneck project**, the one that takes most load off you. It might be SOPs for the tasks only you can do, or an enquiry automation.
3. **A foundation**, which makes later projects easier: a shared prompt library, a tidy customer spreadsheet, a one-page AI guideline.

Avoid picking three big projects. Every new project needs your attention to start, which is exactly the resource that is scarce. Overloading the bottleneck to fix the bottleneck is a common second-order trap.

## Turn each project into a one-page plan

For each of your three, write:

- **Problem and outcome**, in one sentence each.
- **Measure and baseline**: the number you will track, and its value today (for example, "average reply time: three days").
- **Owner**: one named person, even in a team of two.
- **First step this week**, small enough to do in under an hour.
- **Checkpoints** at day 30, 60 and 90.
- **Stop rule**: what would make you drop it ("if it still takes longer than doing it by hand at day 30").

Imagine a hair salon owner whose three are: reply templates for booking questions (quick win), a written closing and opening checklist so she no longer has to be first in and last out (bottleneck), and a shared document of five prompts the team use (foundation). Each fits on a page, and each has a number she can check.

## Try it now

1. List six to ten candidate projects from this course, each written as a problem with an outcome.
2. Run the scoring prompt in the practice pad, then adjust the scores with your own judgement.
3. Choose your balanced three.

You are done when each of the three has an owner, a measure with a baseline, a first step and a date in your calendar for day 30.`,
        microCheck: [
          {
            question: "Which is the best-framed AI project for a 90-day plan?",
            options: [
              "Start using a chatbot on the website because others have one",
              "Reply to web enquiries within a day, down from three days now",
              "Try out as many AI tools as possible over the next few months",
              "Get the whole team excited about AI with a monthly session",
            ],
            correctIndex: 1,
            explanation:
              "A clear problem with a measurable outcome and a baseline tells you what to build and whether it worked. Tool-first projects have no way to judge success.",
          },
          {
            question: "Why choose a balanced three (quick win, bottleneck project, foundation) rather than three large projects?",
            options: [
              "Large projects are never worth doing in a small business",
              "Quick wins are the only projects AI can really help with",
              "It delivers early results without swamping your time",
              "It means the whole plan can be finished in two weeks",
            ],
            correctIndex: 2,
            explanation:
              "The owner's attention is the scarce resource. A balanced set gives early momentum while leaving enough capacity to finish the harder project.",
          },
          {
            question: "Two projects save the same hours, but one removes a task only the owner can do. Why favour it?",
            options: [
              "Freeing the bottleneck lets more work flow through the business",
              "Owner tasks are always the easiest ones for AI to take over",
              "It means the owner can stop checking any work from then on",
              "Staff tasks are too varied for any AI project to handle well",
            ],
            correctIndex: 0,
            explanation:
              "When the constraint is the owner's time, freeing it unblocks everything queued behind it. The same hours saved elsewhere do not move the whole system as much.",
          },
          {
            question: "Why record a baseline measure before starting each project?",
            options: [
              "Automation tools will not run until a baseline is entered",
              "It is needed to claim tax relief on the software you buy",
              "It lets AI predict the project's final outcome at the start",
              "Without it you cannot tell later whether anything improved",
            ],
            correctIndex: 3,
            explanation:
              "A result only means something compared with where you started. Memory is unreliable, so write the starting figure down before you change anything.",
          },
          {
            question: "An AI tool scores your projects differently from your own judgement. What should you do?",
            options: [
              "Follow its scores, since it has seen many more businesses",
              "Use your knowledge of the business and note why you differ",
              "Average the two sets of scores so neither view is ignored",
              "Drop any project where the two sets of scores disagree",
            ],
            correctIndex: 1,
            explanation:
              "The tool knows nothing specific about your customers, team or cash. Its scores are useful for questioning yours, but you make the call.",
          },
        ],
      },
      {
        title: "Bring your team with you",
        objective: "Write a one-page AI guideline for your team, plan a short hands-on training session, and start a shared prompt library with an owner and review dates.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Why people hesitate, and why you should listen

Even in a team of five, AI changes how people work, and people have fair questions. Will this replace me? Will I look foolish? Is this more work on top of my job? Can I trust what it writes?

Listen to those worries. Your team sees details of the work you do not, including where AI output would cause problems with real customers. They are your best early warning system.

There is also a systems reason to bring AI into the open. If AI use is banned, ignored or frowned on, people who find it useful tend to use personal accounts quietly, and business data goes with them. This is sometimes called shadow AI. The fix is not a stricter ban; it is an approved tool and clear, simple rules.

## A one-page AI guideline

You do not need a policy manual. You need one page that answers the questions people actually have:

- **Which tools** are approved, and which accounts to use (business, not personal).
- **What never goes in**: customer personal details beyond what the task needs, card or bank details, staff records, anything confidential.
- **What always needs a person to check** before it leaves the business: anything to customers with facts, prices or promises; anything legal, financial or about staff.
- **Who to ask** when unsure.
- **How to report a mistake**, without blame.

\`\`\`try
Draft a one-page AI guideline for the team at my [TYPE OF BUSINESS] ([NUMBER] people).
Approved tools: [LIST]. Tasks we use AI for: [LIST].

Include: what we use AI for, what information must never be put into AI tools, what a person must check before anything reaches a customer, who to ask when unsure, and how to report a mistake. Plain, friendly language, no jargon, under 400 words. Mark any points I should check with an adviser, such as data protection.
\`\`\`

Read it as a new starter would. If any line needs explaining, rewrite it. Then share it and ask the team what is missing.

## Training that fits a busy week

Long training days are hard to fit into a small business, and most of what they cover is forgotten. Short and practical works better:

- **Thirty minutes on one real task**, such as drafting a reply to an actual enquiry using the approved tool.
- **Show the checking**, not just the prompting. Include an example where AI got something wrong, so people see why the check matters.
- **Pair people up**: someone confident with someone nervous.
- **Repeat monthly** with a new task, rather than one big session.

## A shared prompt library

When one person finds a prompt that works, everyone should be able to use it. A shared prompt library is simply a document or folder of prompts that work for your business. Keep each entry consistent:

\`\`\`
Name: Quote follow-up (friendly)
Use when: a quote has had no reply after five working days
Prompt: [THE PROMPT, WITH [BRACKETS] FOR WHAT TO FILL IN]
Check before sending: price, dates, customer's name, any promises
Owner: [NAME]    Last checked: [DATE]
\`\`\`

The owner and "last checked" date matter. Prompts go stale when prices, services or policies change, and a stale prompt used by the whole team spreads the same mistake everywhere. Review the library every few months, keep it small, and remove anything nobody uses.

The library grows through a simple loop: someone improves a prompt, shares it, and others use and improve it further. That is a reinforcing loop working in your favour, but only if someone looks after it.

## Try it now

1. Draft your guideline with the prompt above in the practice pad, and edit it until it sounds like you.
2. Start the prompt library with three prompts from this course that you have already used.
3. Book a thirty-minute session with your team.

You are done when the guideline is shared with your team and the session is in the calendar.`,
        microCheck: [
          {
            question: "You ban AI at work without offering any approved tool. What is the likely second-order effect?",
            options: [
              "Everyone stops using AI and productivity stays exactly flat",
              "Some staff quietly use personal accounts with business data",
              "Staff start asking for more training on the approved tools",
              "Customers notice and choose to buy more from the business",
            ],
            correctIndex: 1,
            explanation:
              "People who find AI useful often keep using it out of sight. An approved tool and clear rules bring that use into the open, where data can be protected.",
          },
          {
            question: "What belongs in a one-page AI guideline for a small team?",
            options: [
              "Approved tools, data never to share and what must be checked",
              "A detailed history of AI and how language models are trained",
              "A list of staff who are allowed to use a computer at work",
              "The full terms of service of every AI tool on the market",
            ],
            correctIndex: 0,
            explanation:
              "The guideline answers the practical questions staff face every day. Background theory and legal small print belong elsewhere, if anywhere.",
          },
          {
            question: "What makes a short AI training session most effective?",
            options: [
              "A long slide deck covering every feature of the chosen tool",
              "Watching a demo of the most advanced features available",
              "Reading the guideline aloud and asking staff to sign it",
              "Doing a real task together, including checking the output",
            ],
            correctIndex: 3,
            explanation:
              "Hands-on practice with a real task sticks, and seeing the check in action shows why it matters. Feature tours and signatures change little about daily habits.",
          },
          {
            question: "Why give each shared prompt an owner and a \"last checked\" date?",
            options: [
              "So staff know who to blame when a prompt gives a bad answer",
              "So the library can later be sold as a product to other firms",
              "So outdated prompts are spotted and fixed rather than trusted",
              "So the AI tool knows which prompts it is allowed to answer",
            ],
            correctIndex: 2,
            explanation:
              "Prompts go stale when your prices or policies change. An owner and a review date keep one out-of-date prompt from spreading errors across the team.",
          },
          {
            question: "A team member admits an AI draft sent a customer the wrong price. What response helps most?",
            options: [
              "Fix it, thank them, and add a check so it does not happen again",
              "Ban that person from using AI until they have been retrained",
              "Keep it quiet so the rest of the team does not lose confidence",
              "Blame the tool and switch to a different AI product at once",
            ],
            correctIndex: 0,
            explanation:
              "Blame makes people hide mistakes, which means you stop hearing about them. Treating the error as feedback improves the system for everyone.",
          },
        ],
      },
      {
        title: "Risks, responsibilities and what never to automate",
        objective: "Review one AI use in your business for data protection, accuracy and customer trust risks, and write a short list of tasks your business will never fully automate.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## You are responsible, not the tool

When AI writes something wrong and it reaches a customer, the customer does not blame the software. They blame you. In many places the law takes a similar view: what your business tells customers, including through a website chatbot or an automated email, can be treated as your business's own statement. The details vary by country, but the practical rule is simple. If it goes out in your name, you own it.

That does not mean avoiding AI. It means matching the level of checking to the level of harm, and keeping certain decisions firmly with people.

## Data protection in plain terms

Personal data is any information about an identifiable person: names, emails, phone numbers, addresses, purchase history, notes about a customer. Data protection laws (for example UK GDPR, the EU GDPR and similar laws elsewhere) broadly expect you to collect only what you need, keep it secure, use it only for the purposes you told people about, and not keep it longer than necessary.

In practice, for AI tools:

- Use approved tools and business accounts, not personal ones.
- Check each tool's data terms: whether your data is used for training, where it is stored and how long it is kept.
- Share the minimum. Anonymise when the task does not need names.
- Take particular care with sensitive information such as health details, and keep it out of general-purpose tools unless you have taken advice.

If you are unsure, your national data protection regulator usually publishes guidance for small businesses. In the UK, for example, that is the Information Commissioner's Office (ICO).

## Accuracy: match the check to the harm

Think of each AI use in terms of how likely an error is and how much harm it would do. The high-harm areas for most small businesses are:

- Prices, quotes, discounts and anything that sounds like a promise
- Legal, tax and employment statements
- Health and safety, including allergens and anything medical
- Statements about a named person

Here a person checks every time. Lower-harm uses, such as a first draft of a social post, still get read, but a quick look may be enough.

## Customer trust

Trust is slow to build and quick to lose. A few rules protect it:

- **Do not pretend AI is a person.** If customers are chatting with a bot, make that clear.
- **Never create fake reviews**, with AI or otherwise. They mislead customers, and consumer protection rules in many countries prohibit them.
- **Always offer a route to a human.** A chatbot that cannot hand off loses the customers it cannot help. They do not wait; they go elsewhere. That lost sale never shows up in the chatbot's own statistics, which is why it is easy to miss.

## What never to automate

AI can help prepare almost anything. But some decisions should always be made, and some messages always sent, by a person:

- Decisions about people: hiring, discipline, dismissal, pay.
- Complaints, refunds and apologies that need judgement (AI can draft).
- Anything safety-critical, such as allergen information or safety advice.
- Legal or tax filings, and statements about your legal position.
- Messages to customers who are upset, bereaved or vulnerable.
- Payments leaving the business.

\`\`\`try
Here is one way my [TYPE OF BUSINESS] uses AI: [DESCRIBE WHAT THE AI DOES, WHAT DATA IT SEES, AND WHO SEES THE OUTPUT].

Act as a careful risk reviewer. List:
1. What could go wrong, from most to least harmful.
2. What personal or confidential data is involved, and what I should check in the tool's data terms.
3. Where a person must check or decide before anything reaches a customer or leaves the business.
4. How a customer could reach a person if this goes wrong.
5. Anything I should confirm with a qualified adviser.
Do not reassure me. Be specific.
\`\`\`

## Try it now

1. Pick the riskiest AI use you have now or plan to have, and run the review prompt in the practice pad.
2. Add at least one safeguard it suggests.
3. Write your business's "never automate" list on one page.

You are done when the list is shared with your team and one new safeguard is in place.`,
        microCheck: [
          {
            question: "Your website chatbot gives a customer the wrong returns policy. Who is responsible?",
            options: [
              "The chatbot supplier, since their model made the mistake",
              "The customer, since they should have read the full policy",
              "Your business, since the chatbot speaks on your behalf",
              "Nobody, since the answer came from an automated system",
            ],
            correctIndex: 2,
            explanation:
              "Customers, and often the law, treat what your chatbot says as your business speaking. That is why high-harm answers need careful checking and a route to a person.",
          },
          {
            question: "Which task should stay with a person, even if AI drafts it?",
            options: [
              "Deciding on a refund for an upset customer's complaint",
              "Sorting incoming emails into folders by their topic",
              "Formatting a price list so it fits on a single page",
              "Suggesting three subject lines for a newsletter",
            ],
            correctIndex: 0,
            explanation:
              "Refunds for complaints need judgement about the person and the situation, and the wrong call costs money and trust. The other tasks are low harm and easy to check.",
          },
          {
            question: "Why must a customer-facing chatbot offer a clear route to a person?",
            options: [
              "Chatbots stop working unless someone talks to a person weekly",
              "It lets the business avoid writing any answers for the bot",
              "It means the chatbot never needs to be checked or updated",
              "Customers it cannot help will otherwise leave and go elsewhere",
            ],
            correctIndex: 3,
            explanation:
              "A chatbot with no hand-off quietly loses the customers with unusual needs. Those lost sales rarely show up in the chatbot's own figures.",
          },
          {
            question: "A staff member suggests using AI to write a batch of five-star reviews. What is the right answer?",
            options: [
              "Yes, provided the reviews describe services you really offer",
              "No: fake reviews mislead customers and break consumer rules",
              "Yes, provided they are posted slowly over several months",
              "No, but only because AI writing is easy for sites to detect",
            ],
            correctIndex: 1,
            explanation:
              "Fake reviews deceive customers whoever writes them, and many countries' consumer rules prohibit them. The problem is the deception, not the tool.",
          },
          {
            question: "Before using a new AI tool with customer data, what should you check?",
            options: [
              "Its data terms: training use, storage location and retention",
              "Its popularity, since widely used tools are always compliant",
              "Its speed, since slower tools are more likely to leak data",
              "Its price, since paid tools never use your data for training",
            ],
            correctIndex: 0,
            explanation:
              "Data terms tell you what happens to customer information once it is in the tool. Popularity and price are not reliable signs of how data is handled.",
          },
        ],
      },
      {
        title: "Measure, then keep, change or drop",
        objective: "Measure one AI project against its baseline, including checking time and side effects, and make a written keep, change or drop decision.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Decide what counts before you start

In lesson one you gave each project a measure and a baseline. This lesson is about using them honestly, so that your 90-day plan ends in decisions rather than a vague feeling that things are "probably better".

Useful measures for a small business usually fall into five groups:

- **Time**: hours per week spent on the task.
- **Speed**: how long customers wait, such as reply time or time to send a quote.
- **Quality**: errors, complaints, work that has to be redone.
- **Money**: enquiries turned into sales, average order value, days to get paid.
- **People**: whether the team actually uses it, and whether it makes their work easier.

Pick one or two per project. More than that and you will stop tracking them.

## Measure simply and honestly

A shared spreadsheet with a row per week is enough: the date, the measure and a short note on anything unusual that week. Track for at least a few weeks before you judge, because small businesses have busy and quiet weeks anyway.

Count honestly. If AI drafts your quotes in ten minutes but you spend twenty minutes checking and fixing them, the saving is smaller than it looks. Include checking time in every time measure.

Watch out for Goodhart's law: when a measure becomes a target, it stops being a good measure. Imagine setting a target of "reply to every enquiry within one hour". Replies get faster, but they may also become rushed and unhelpful, and the number looks great while customers are less impressed. The fix is to pair measures: speed with quality, volume with complaints.

## Look for side effects

Every change to a system has effects beyond the one you intended. Some examples to look for:

- Automated follow-ups increase replies, but also unsubscribes and irritated customers.
- A chatbot reduces phone calls, but some of those calls were sales.
- Templates speed up replies, but customers start to notice that every answer sounds the same.

Numbers will not show all of this. Ask two or three customers and every member of staff what has changed for them. That conversation is part of your feedback loop.

\`\`\`try
Here are my results for the AI project [PROJECT NAME] over [NUMBER] weeks:
[PASTE YOUR BASELINE, WEEKLY FIGURES AND NOTES]
The goal was: [GOAL].

1. Summarise what changed, in plain words, and say whether the change looks meaningful or could be normal variation from week to week.
2. List side effects I should look for that these numbers would not show.
3. Suggest whether to keep, change or drop the project, and say what evidence would change your mind.
Do not overstate what a few weeks of small numbers can show.
\`\`\`

## Keep, change or drop

At each checkpoint, make one of three decisions and write down why.

**Keep** when the goal is met, the side effects are acceptable and the team uses it. Then make it part of how the business runs: write it into the relevant SOP, name an owner and set a date to review it again.

**Change** when it partly works. Adjust one thing (the prompt, the checkpoint, the stop condition), then run it for another thirty days. Changing several things at once means you will not know which one helped.

**Drop** when it has not improved things, or the costs and side effects outweigh the benefit. Dropping properly means cancelling subscriptions, switching automations off fully, and removing business data from tools you no longer use. A dropped project is a result, not a failure. The time you already spent is gone either way; do not let it keep a poor project alive.

## The next 90 days

When your three projects have reached a decision, go back to your list of candidates, score them again with what you have learned, and pick the next three. This is the loop that makes AI useful in a small business: pick, try, measure, decide, repeat. Each round, you get a little better at spotting what will work, and the business depends a little less on you.

## Try it now

1. For one of your three projects, confirm the measure and baseline, and set up a simple weekly tracking sheet.
2. Put a day-30 review in your calendar.
3. If you already have a few weeks of results, run the prompt above in the practice pad.

You are done when you have written a keep, change or drop decision with a reason, or a dated review at which you will make one.`,
        microCheck: [
          {
            question: "You target \"reply to every enquiry within one hour\" and replies become rushed. What idea explains this?",
            options: [
              "Theory of constraints: the slowest step limits the output",
              "Goodhart's law: a measure made a target stops measuring well",
              "Economies of scale: more volume lowers the cost per reply",
              "The Pareto rule: most results come from a few of the causes",
            ],
            correctIndex: 1,
            explanation:
              "Once people chase a number, they can hit it in ways that miss the point. Pairing speed with a quality measure keeps the number honest.",
          },
          {
            question: "When measuring the time an AI tool saves, what must you include?",
            options: [
              "Only the time the tool takes to generate each piece of work",
              "The time you would have spent if the task were done twice",
              "Only the hours saved by staff, not those saved by the owner",
              "The time spent checking and fixing what the tool produced",
            ],
            correctIndex: 3,
            explanation:
              "Checking and correcting is part of the real cost. Leaving it out makes a project look better than it is and can keep a poor one running.",
          },
          {
            question: "A project missed its goal after 60 days and costs a monthly fee. What does dropping it properly involve?",
            options: [
              "Cancelling the fee, switching off automations, removing data",
              "Keeping the subscription in case the tool improves next year",
              "Blaming the team for not using the tool enough to make it work",
              "Starting two similar projects to make up for the lost results",
            ],
            correctIndex: 0,
            explanation:
              "A half-dropped project keeps costing money and may leave business data in a tool nobody is watching. Closing it off cleanly is part of the decision.",
          },
          {
            question: "Automated follow-ups raised replies, but unsubscribes rose and a customer complained. What should you do?",
            options: [
              "Ignore it, since replies went up and that was the only goal",
              "Double the follow-ups, since replies rose when you sent more",
              "Treat it as a side effect to weigh, and adjust the sequence",
              "Drop email altogether and move all contact to phone calls",
            ],
            correctIndex: 2,
            explanation:
              "Side effects are part of the result. Adjusting timing, frequency or stop conditions may keep the benefit while reducing the harm.",
          },
          {
            question: "Why pair a speed measure with a quality measure?",
            options: [
              "Because speed can never be measured without quality as well",
              "So faster work does not quietly come at the cost of quality",
              "So there are more numbers to show the team each month",
              "Because AI tools report speed and quality automatically",
            ],
            correctIndex: 1,
            explanation:
              "A single measure invites gaming, whether deliberate or not. A paired quality measure shows whether the speed gain is real or just rushed work.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Imagine a café owner with ideas for eight AI projects and very little spare time. What is the best first step?",
        options: [
          "Start all eight at once to find out quickly which ones work",
          "Score each for impact and effort, then pick a balanced three",
          "Pick the three that use the newest and most talked-about tools",
          "Wait until a staff member has time to research every option",
        ],
        correctIndex: 1,
        explanation:
          "The owner's time is the constraint. Scoring and choosing three keeps the plan achievable, while starting everything at once usually means finishing nothing.",
      },
      {
        question: "An owner writes \"use AI in marketing\" as a project. What would improve it most?",
        options: [
          "State the problem, a measurable outcome and a baseline figure",
          "Add a list of the AI tools the business might want to try out",
          "Make it broader so it can include sales and operations too",
          "Give it a catchy name so the team is more excited about it",
        ],
        correctIndex: 0,
        explanation:
          "Without a problem, an outcome and a starting figure, there is no way to know what to do first or whether it worked.",
      },
      {
        question: "Staff at a shop have been quietly pasting customer emails into personal AI accounts. What is the best response?",
        options: [
          "Punish those involved so others know AI is not allowed",
          "Ignore it, since customer emails are not personal data",
          "Ask staff to delete their accounts and never mention AI",
          "Provide an approved tool and a short guideline on data use",
        ],
        correctIndex: 3,
        explanation:
          "Punishment drives the habit further out of sight. An approved tool and clear rules bring use into the open, where customer data can be protected.",
      },
      {
        question: "Which item belongs on a small business's \"never automate\" list?",
        options: [
          "Filing incoming invoices into a shared folder",
          "Deciding whether to dismiss a member of staff",
          "Sending a fixed \"we got your message\" reply",
          "Adding new enquiries to a tracking spreadsheet",
        ],
        correctIndex: 1,
        explanation:
          "Decisions about people carry legal risk and need human judgement. The other tasks are routine, low-harm and easy to check.",
      },
      {
        question: "Imagine a tradesperson whose website chatbot answers questions but cannot pass anyone to a person. What is the main risk?",
        options: [
          "The chatbot answers so many questions that it gets overloaded",
          "Customers prefer the chatbot and stop phoning altogether",
          "Customers with unusual needs give up and hire someone else",
          "The chatbot learns to take bookings without being set up",
        ],
        correctIndex: 2,
        explanation:
          "A chatbot without a hand-off loses the customers it cannot help, and those lost jobs never appear in its own statistics.",
      },
      {
        question: "A project \"saves six hours a week\", but staff spend five hours checking and fixing its output. What is the real saving?",
        options: [
          "About one hour a week, before counting any side effects",
          "Six hours a week, since checking is part of normal work",
          "Eleven hours a week, since both figures count as saved",
          "Nothing at all, since any checking cancels the benefit",
        ],
        correctIndex: 0,
        explanation:
          "Checking time is a real cost of the project. Leaving it out overstates the benefit and can keep a weak project running.",
      },
      {
        question: "A team prompt for quotes used an old price for months. What would most likely have prevented this?",
        options: [
          "A longer prompt that asks the AI to always be accurate",
          "Letting every staff member edit prompts whenever they like",
          "Replacing the prompt library with each person's own prompts",
          "An owner and a \"last checked\" date on every library prompt",
        ],
        correctIndex: 3,
        explanation:
          "Shared prompts go stale when prices or policies change. A named owner with regular review dates catches that before the whole team repeats the error.",
      },
      {
        question: "After 90 days, an AI project has clearly not helped, but the owner spent a lot of time on it. What is the sound decision?",
        options: [
          "Keep it running, since the setup time would otherwise be wasted",
          "Drop it and record what was learned, despite the time spent",
          "Hide the results so the team does not lose faith in AI projects",
          "Double the budget, since more investment will probably fix it",
        ],
        correctIndex: 1,
        explanation:
          "The time already spent is gone whatever you decide. Keeping a poor project alive because of it only adds to the cost.",
      },
      {
        question: "You set staff a target of \"number of AI prompts used per week\". What is the likely problem?",
        options: [
          "The number will be too low to be worth tracking each week",
          "AI tools will limit use once the weekly count gets too high",
          "People use AI to raise the count, not to do better work",
          "Staff will stop using AI at all because it is monitored",
        ],
        correctIndex: 2,
        explanation:
          "This is Goodhart's law: a count of prompts rewards activity rather than results. Measure the outcome the project was meant to improve instead.",
      },
      {
        question: "Before sharing customer details with a new AI tool, which question matters most?",
        options: [
          "Does its data use, storage and retention fit our obligations?",
          "Is it the most popular AI tool among other local businesses?",
          "Does it produce the longest and most detailed answers going?",
          "Can it be installed on every computer in the business today?",
        ],
        correctIndex: 0,
        explanation:
          "Data protection duties stay with your business whichever tool you use. How the tool handles data decides whether it is fit for customer details.",
      },
      {
        question: "The team is nervous about AI. Which approach to training is most likely to work?",
        options: [
          "One long session covering every feature of every tool on offer",
          "Short sessions on real tasks, pairing nervous and confident staff",
          "Sending a link to online videos and asking staff to watch them",
          "Making attendance optional and running it outside of work hours",
        ],
        correctIndex: 1,
        explanation:
          "Short, hands-on practice with real work builds confidence and habits. Long feature tours and optional videos rarely change how people work.",
      },
    ],
  },
];
