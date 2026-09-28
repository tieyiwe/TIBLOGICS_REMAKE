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
  // __MODULE_5__
];
