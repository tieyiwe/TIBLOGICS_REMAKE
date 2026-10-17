import type { SeedCapstone, SeedFinalExam, SeedLab } from "../types";

// AI for Small Business Owners: Grow Sales and Get Time Back.
// Labs, final exam and capstone. Every assessment tests what Modules 1-6
// teach, in their terms. The customer-journey map from Module 1 is the thread:
// later labs and the capstone build on it. All businesses, people and figures
// in scenarios are fictional and illustrative.

// ═══════════════════════════════════════════════════════════════════════════
// LABS (one per module)
// ═══════════════════════════════════════════════════════════════════════════

export const SMB_LABS: SeedLab[] = [
  // ── Module 1 ──────────────────────────────────────────────────────────
  {
    slug: "ai-small-business-lab-1-map-your-business",
    title: "Map your business as a system and audit your time",
    labType: "workbench",
    moduleNumber: 1,
    estimatedMinutes: 35,
    points: 60,
    passScore: 70,
    briefMd: `Before you buy a tool or write a prompt, look at your business as a **system**: how a stranger becomes a customer, then a repeat customer, and where things wait along the way. Then look at where your own week actually goes.

You will map the stages of your customer journey, find the step that holds everything else back (the bottleneck), spot a loop that feeds on itself, and decide which of your tasks AI could take on and which you should keep.

You are assessed on how honestly you see your own business, not on how impressive it sounds. A plain map of what really happens on a busy Tuesday beats a tidy map of how it ought to work. Later labs and the capstone build on this map, so make it real.`,
    scenarioMd: `Work through the four fields in order. Use your own business, real stages and your best estimate of real times.

If you do not run a business yet, use this illustrative case and say so: *imagine a two-person dog-grooming salon*. Enquiries arrive by phone, Instagram messages and the website form. The owner answers them between appointments, often the same evening. New clients get a price by message, book a slot, come in, pay, and are sometimes asked for a review. Rebooking reminders are sent when the owner remembers.

For the time audit, think about last week: what you did, roughly how long each thing took, and which tasks drained you.`,
    objectives: [
      {
        id: "journey",
        label: "Maps the real customer journey with stages and waits",
        weight: 3,
        guidance:
          "Full credit for five to eight stages from first hearing about the business to repeat purchase or referral, each with where it happens (channel or place), who handles it, and an estimate of how long customers or enquiries wait at that stage. Part credit if the stages are there but waits or owners are missing. Low credit for a generic funnel (awareness, interest, purchase) with nothing specific to this business.",
      },
      {
        id: "bottleneck",
        label: "Identifies the bottleneck from evidence",
        weight: 3,
        guidance:
          "Full credit when one stage is named as the bottleneck and justified from the map (enquiries pile up there, customers drop out there, it depends on one person's free time), AND the learner says what would happen if an earlier stage got faster (for example more enquiries waiting for the same owner). Part credit for naming the most disliked task without evidence of waiting. None for 'everything is slow' or 'not enough customers'.",
      },
      {
        id: "loop",
        label: "Describes a genuine reinforcing loop",
        weight: 2,
        guidance:
          "Full credit for a loop written with arrows that returns to its start (for example happy customers -> reviews -> more enquiries -> more customers), correctly called reinforcing, plus a sentence on how it could run in reverse (slow replies -> poor reviews -> fewer enquiries) or what limits it. Part credit for a one-way chain called a loop. None for a single cause and effect.",
      },
      {
        id: "audit",
        label: "Makes sound choices from the time audit",
        weight: 3,
        guidance:
          "Full credit for five specific tasks to hand to AI (drafting, summarising, first replies, posts, admin), each with a rough weekly time and a note of who checks the output, AND two tasks the owner keeps with a reason based on judgement, relationships or risk (pricing decisions, complaints, hiring decisions, key clients). Extra evidence: at least one AI task targets the bottleneck. Part credit for generic tasks with no times, or keep-tasks with no reason.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "journey",
          label: "Your customer journey, stage by stage",
          prompt:
            "List five to eight stages, from how people first hear about you to buying again or recommending you. For each: where it happens (phone, Instagram, shop counter, email), who handles it, and roughly how long a customer or enquiry waits at that stage.",
          placeholder:
            "1. Finds us on Google or Instagram | nobody handles it | no wait\n2. Sends an enquiry by message | me | waits until evening, often 6 to 10 hours...",
          minWords: 80,
        },
        {
          id: "bottleneck",
          label: "Where enquiries wait, and the bottleneck",
          prompt:
            "Which single stage holds the whole business back? What on your map shows it (where enquiries or jobs pile up, where customers give up)? Then complete: 'If stage ___ got twice as fast, the next pile-up would be at stage ___.'",
          minWords: 50,
        },
        {
          id: "loop",
          label: "A reinforcing loop in your business",
          prompt:
            "Write one reinforcing loop with arrows (A -> B -> C -> back to A). Say how it helps you when it runs one way and how it could hurt you if it ran in reverse.",
          minWords: 40,
        },
        {
          id: "audit",
          label: "Your time audit: five to hand over, two to keep",
          prompt:
            "From last week, list five tasks you could hand to AI, with roughly how long each takes you per week and who will check the output. Then list two tasks you will keep yourself, and why they need you.",
          minWords: 80,
        },
      ],
    },
  },

  // ── Module 2 ──────────────────────────────────────────────────────────
  {
    slug: "ai-small-business-lab-2-brand-voice-week-of-posts",
    title: "Build your brand-voice prompt and a week of posts",
    labType: "prompt",
    moduleNumber: 2,
    estimatedMinutes: 35,
    points: 60,
    passScore: 70,
    briefMd: `Generic prompts give generic posts: the same cheerful, emoji-heavy text every other business is posting. Module 2 showed you how to fix that with a **brand-voice prompt**: who you are, who your customers are, how you actually talk, and what you will and will not claim.

Build that prompt for your own business (or the illustrative one below), then use it to generate **a week of social posts** promoting one real offer. Run it, read what comes back, and tighten the prompt.

You are graded on the prompt, not on how clever one post happens to be. A good prompt would still work next month when someone else in the business runs it for a different offer.`,
    scenarioMd: `**Use your own business if you can.** Pick one real offer you are running or planning in the next month.

If you prefer, use this illustrative case and say so: *imagine a family-run bakery in a market town*. It sells sourdough, pastries and celebration cakes. Most customers are local families and people on their way to work. The owner writes in a warm, plain, slightly dry way and never uses exclamation marks in threes. The offer: from next Monday, anyone who brings their own container gets 20p off a loaf, to cut packaging waste.

Your prompt should produce five to seven posts for one week, each with a suggested day and platform.

**The starter prompt someone wrote**

> write some social media posts for my business`,
    objectives: [
      {
        id: "specifics",
        label: "Business and customer specifics",
        weight: 3,
        guidance:
          "Full credit when the prompt names what the business sells, where it is, who the typical customers are and what they care about (for example busy parents, commuters, local event planners), and gives the exact offer with its real terms (price, dates, conditions). Part credit if the business is described but the customer or offer terms are vague. Low credit for 'a bakery' with nothing else.",
      },
      {
        id: "voice",
        label: "Voice described with examples",
        weight: 3,
        guidance:
          "Full credit for a voice described in concrete terms (words and phrases used and avoided, sentence length, use of emojis and exclamation marks, humour or not) plus at least one or two short examples of the owner's real writing, with an instruction to match the style but not copy the wording. Part credit for adjectives only ('friendly, fun'). None if voice is not mentioned.",
      },
      {
        id: "honesty",
        label: "Honest claims only",
        weight: 3,
        guidance:
          "Full credit when the prompt explicitly forbids invented reviews, testimonials, statistics, awards and 'best in town' style claims, limits facts to what the prompt supplies, and tells the model to mark anything it would need to check (for example '[check: opening time]') instead of guessing. Part credit for a general 'be honest'. None if the prompt invites unsupported claims.",
      },
      {
        id: "cta",
        label: "A clear call to action and a usable format",
        weight: 2,
        guidance:
          "Full credit when every post must end with one specific next step (visit, book, order, reply with a word) that matches the offer, and the output is structured for use: day, platform, post text, and optionally an image idea, within a length limit. Part credit for a call to action requested without saying what it is, or posts with no structure.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "write some social media posts for my business",
      sandboxSystem:
        "You are a marketing assistant for small businesses in a training sandbox. Follow the user's prompt as written. If the prompt is vague, produce the generic output that prompt actually warrants: do not silently add brand details, honesty rules or structure the user did not ask for, because the learner is practising writing prompts and needs honest feedback about what their prompt produces. Never invent reviews, awards or statistics unless the prompt explicitly asks you to, and if it does, say that you cannot present invented claims as real. All businesses in this sandbox are fictional unless the learner describes their own.",
    },
  },

  // ── Module 3 ──────────────────────────────────────────────────────────
  {
    slug: "ai-small-business-lab-3-critique-a-review-reply",
    title: "Critique an AI reply to an angry review",
    labType: "critique",
    moduleNumber: 3,
    estimatedMinutes: 25,
    points: 60,
    passScore: 70,
    briefMd: `An owner asked an AI tool to draft two things after a one-star review: a **public reply** on the review site and a **follow-up email** to the customer. The drafts read smoothly, and the owner is tempted to send them as they are.

Read the review and the business facts in the scenario, then read the drafts line by line. Select every statement that would damage the business, break the customer's trust, mislead the public or cross an ethical line, as Module 3 taught: keep details private, do not invent policies, never trade favours for reviews, and do not blame individuals in public.

Some statements are exactly what a good reply should say. Leave those alone. Flagging everything is not judgement, and it is scored accordingly.`,
    scenarioMd: `**The business (fictional).** The Copper Pan is an imaginary family-run bistro with twelve tables. The owner is Maria.

**The facts Maria knows.** Last Saturday two staff called in sick, the kitchen fell behind, and some mains took well over an hour. There is no refund guarantee or satisfaction policy. Maria does not know why the customer felt unwell, and no one else has reported feeling ill. Her plan is to apologise for the wait, look into it, and talk to the customer privately.

**The review (one star).**

> Waited over an hour for our mains on Saturday, and when they came they were lukewarm. I felt unwell the next day. Staff looked completely overwhelmed. Won't be back.

Everything in the drafts below, including all names and details, is fictional.`,
    objectives: [
      {
        id: "recall",
        label: "Caught the planted problems",
        weight: 3,
        guidance:
          "Credit for each planted flaw correctly selected: the unnecessary admission of liability for illness, the order and phone details revealed in public, the invented guarantee, the discount offered for changing the review, the staff member blamed by name, and the unsupported 'thousands of happy customers' claim.",
      },
      {
        id: "subtle",
        label: "Caught the problems that sound helpful",
        weight: 2,
        guidance:
          "Extra credit for the flaws that read as good service: the invented 48-hour guarantee (sounds generous but is not a real policy), the voucher conditional on updating the review (sounds like a goodwill gesture but is buying a review), and the order details (sound attentive but expose the customer publicly).",
      },
      {
        id: "precision",
        label: "Left good statements alone",
        weight: 2,
        guidance:
          "Credit for not selecting the statements that are right: thanking the customer, apologising for the wait, explaining the kitchen fell behind without blaming anyone, inviting private contact, and saying Maria is looking into Saturday's timings.",
      },
    ],
    config: {
      kind: "critique",
      answerMd: `### Draft 1: public reply to the review

Thank you for taking the time to tell us about your visit. I'm sorry you waited so long for your mains on Saturday; that is not the evening we want anyone to have with us.

We can see your booking for 8pm under the mobile number ending 4471: two steak frites, the sea bass and a bottle of Rioja, paid with a gift voucher.

We accept full responsibility for you feeling unwell afterwards, and our food was clearly the cause. The kitchen fell behind that night and we let you down on timing.

Our new waiter, Tom, was clearly not up to the job that night, and we have spoken to him.

As a small bistro trusted by thousands of happy customers, we take every review seriously. Under our 48-hour satisfaction guarantee, you are entitled to a full refund.

I would really like to hear more about what happened. Please call or email me directly so we can talk it through properly.

Maria, owner

---

### Draft 2: follow-up email to the customer

Subject: Your visit to The Copper Pan

Dear customer,

Thank you again for your honest feedback. I'm looking into Saturday's kitchen timings so that a busy night does not mean an hour's wait again.

As a thank-you, we'd love to offer you 30% off your next meal. We'll send the voucher as soon as you've updated your review to four or five stars.

If you would prefer to talk it through, just reply to this email or call me on the restaurant number, and I will make time.

Warm wishes,
Maria`,
      flaws: [
        {
          id: "f1",
          quote: "We accept full responsibility for you feeling unwell afterwards, and our food was clearly the cause.",
          explanation:
            "Maria does not know why the customer felt unwell, and no one else reported illness. Admitting liability in public is unnecessary and could have legal and insurance consequences. A good reply takes the concern seriously and asks the customer to get in touch privately so it can be looked into.",
          category: "overconfidence",
        },
        {
          id: "f2",
          quote: "We can see your booking for 8pm under the mobile number ending 4471: two steak frites, the sea bass and a bottle of Rioja, paid with a gift voucher.",
          explanation:
            "This reveals a customer's booking, phone details, order and payment method in public. Even partial details can identify someone and break their trust, and may break data protection rules. Customer details belong in a private conversation, never in a public reply.",
          category: "privacy",
        },
        {
          id: "f3",
          quote: "Under our 48-hour satisfaction guarantee, you are entitled to a full refund.",
          explanation:
            "The Copper Pan has no such guarantee. The AI invented a policy that sounds generous, and publishing it creates a public promise the business has never made, which other customers may now expect too. Only state policies that really exist.",
          category: "fabrication",
        },
        {
          id: "f4",
          quote: "We'll send the voucher as soon as you've updated your review to four or five stars.",
          explanation:
            "Offering a discount in exchange for changing a review is buying a review. It misleads other customers, breaks review platforms' rules and can breach consumer protection law. A goodwill gesture must not depend on what the customer writes.",
          category: "bias",
        },
        {
          id: "f5",
          quote: "Our new waiter, Tom, was clearly not up to the job that night, and we have spoken to him.",
          explanation:
            "Blaming a named staff member in public is unfair to him, does not match the facts (two staff were off sick and the kitchen fell behind) and makes the business look worse. Responsibility belongs to the business; staff matters are handled privately.",
          category: "logic",
        },
        {
          id: "f6",
          quote: "trusted by thousands of happy customers",
          explanation:
            "An unsupported claim. Nobody has counted thousands of happy customers of a twelve-table bistro, and boasting in reply to a complaint reads as dismissive. Marketing claims in replies must be ones the business can back up, and here none is needed.",
          category: "fabrication",
        },
      ],
      candidates: [
        { id: "c1", text: "Thanking the customer for taking the time to describe their visit", isFlaw: false },
        { id: "c2", text: "Apologising for the long wait for mains on Saturday", isFlaw: false },
        { id: "c3", text: "Listing the customer's booking time, phone digits, order and payment in the public reply", isFlaw: true, flawId: "f2" },
        { id: "c4", text: "Stating that the bistro's food was clearly the cause of the customer feeling unwell", isFlaw: true, flawId: "f1" },
        { id: "c5", text: "Explaining that the kitchen fell behind that night", isFlaw: false },
        { id: "c6", text: "Saying the new waiter, Tom, was not up to the job", isFlaw: true, flawId: "f5" },
        { id: "c7", text: "Describing the bistro as trusted by thousands of happy customers", isFlaw: true, flawId: "f6" },
        { id: "c8", text: "Offering a full refund under a 48-hour satisfaction guarantee", isFlaw: true, flawId: "f3" },
        { id: "c9", text: "Inviting the customer to call or email Maria directly to talk it through", isFlaw: false },
        { id: "c10", text: "Saying Maria is looking into Saturday's kitchen timings", isFlaw: false },
        { id: "c11", text: "Sending the 30% voucher once the review is updated to four or five stars", isFlaw: true, flawId: "f4" },
      ],
    },
  },

  // ── Module 4 ──────────────────────────────────────────────────────────
  {
    slug: "ai-small-business-lab-4-design-an-automation",
    title: "Design an automation with you in control",
    labType: "workbench",
    moduleNumber: 4,
    estimatedMinutes: 35,
    points: 60,
    passScore: 70,
    briefMd: `Pick one repetitive job in your business and design a simple no-code automation for it, the kind you could build in a tool that connects your forms, email, calendar and spreadsheets. Examples: turning website enquiries into a tracker row plus a drafted reply; chasing unpaid invoices; sending rebooking reminders; filing supplier invoices.

The point of Module 4 is **automation with you in control**. So your design must show exactly where AI is used, where a person checks before anything important happens, what happens when it breaks, and what customer or business data it touches.

You are assessed on whether someone else in your business could build and run it safely from your design. You do not need to build it yet.`,
    scenarioMd: `Choose a job that happens at least weekly. Use your customer-journey map from Lab 1: an automation at or just before your bottleneck is usually worth more than one elsewhere.

If you have no suitable job, use this illustrative case and say so: *imagine a small cleaning company whose website form collects quote requests*. Today the owner copies each request into a spreadsheet by hand and replies when she gets to it, sometimes two days later.

Plain language is fine. You do not need to name a specific automation product.`,
    objectives: [
      {
        id: "design",
        label: "A clear trigger and steps",
        weight: 2,
        guidance:
          "Full credit for one specific trigger (a form is submitted, an invoice is 14 days overdue, a booking is made) and three to eight numbered steps, each saying what happens and in which tool or place, clear enough that someone else could build it. Part credit if steps are vague ('it sorts things out') or the trigger is unclear.",
      },
      {
        id: "checkpoint",
        label: "AI use and a real human checkpoint",
        weight: 3,
        guidance:
          "Full credit when the design says exactly which step uses AI and for what (drafting, sorting, summarising), and places a human checkpoint before anything that reaches a customer, commits money or is hard to undo, naming who checks, what they check for, and what they do if it is wrong. Part credit for 'a human reviews it' with no position, owner or criteria. None if AI output goes straight to customers with nothing checked.",
      },
      {
        id: "failure",
        label: "Failure detection and alerts",
        weight: 3,
        guidance:
          "Full credit for at least two named ways it could fail (a form field changes, a step errors, the AI returns something odd, nothing arrives when it should), an alert that reaches a named person when it does, including a 'silence' alert for when expected items stop, and a manual fallback so customers are not left waiting. Part credit for 'I will check it now and then'.",
      },
      {
        id: "data",
        label: "Data it touches, and a test plan",
        weight: 2,
        guidance:
          "Full credit when the learner lists the personal and business data each step touches, which tools receive it, what is left out or minimised, and a test plan with a few realistic and awkward test cases (missing details, a complaint instead of an enquiry, duplicate submissions) run before going live, plus a date to review it after launch. Part credit for data or testing covered but not both.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "trigger",
          label: "The job, the trigger and the steps",
          prompt:
            "Name the job and how often it happens. What single event starts the automation? List the steps in order, saying what happens and in which tool or place.",
          placeholder:
            "Trigger: a quote request is submitted on the website form.\n1. The details are added as a new row in the quotes spreadsheet...\n2. ...",
          minWords: 60,
        },
        {
          id: "checkpoint",
          label: "Where AI is used, and the human checkpoint",
          prompt:
            "Which step uses AI, and exactly what does it do? Where does a person check before anything goes to a customer, commits money or cannot be undone? Who checks, what are they looking for, and what do they do if it is wrong?",
          minWords: 60,
        },
        {
          id: "failure",
          label: "When it fails",
          prompt:
            "Name at least two ways it could go wrong, including 'nothing happens'. How will you find out (the alert, who receives it, how quickly)? What is the manual fallback so no customer is left waiting?",
          minWords: 50,
        },
        {
          id: "data",
          label: "The data it touches",
          prompt:
            "List the customer and business data each step handles and which tools receive it. What will you leave out or remove because the automation does not need it?",
          minWords: 40,
        },
        {
          id: "test",
          label: "How you will test it",
          prompt:
            "Describe four or five test cases you will run before going live, including at least two awkward ones, and what the right result is for each. When will you review it after launch, and what will you look at?",
          minWords: 50,
        },
      ],
    },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────
  {
    slug: "ai-small-business-lab-5-margins-and-pricing",
    title: "Find the margin problem and propose a price change",
    labType: "prompt",
    moduleNumber: 5,
    estimatedMinutes: 30,
    points: 60,
    passScore: 70,
    briefMd: `AI can be a useful second pair of eyes on your numbers, but only if your prompt makes it careful. Left alone, it will happily give a confident answer built on a sum it got wrong or an assumption it never mentioned.

The sandbox holds six months of anonymised figures for an imaginary café. Write a prompt that asks the AI to find where the margin went wrong, explain why, and propose a sensible pricing change, **showing its working** and **flagging every assumption** so you can check it.

You are graded on the prompt. Run it, check at least one of the AI's calculations yourself, and tighten the prompt if the answer skipped steps, invented figures or presented a guess as a fact.`,
    scenarioMd: `**The business (fictional).** Imagine a small independent café, open six days a week, selling coffee, cakes and lunches. The owner has exported six months of figures from her spreadsheet and removed anything identifying customers or staff. The table is already loaded into the sandbox ahead of your prompt.

**What the owner knows.** Her prices have not changed since January. A supplier letter in March said coffee bean and milk prices would rise from April. She wants to know how much this has hurt her margin, and what a fair price change would look like without losing regulars.

**Your prompt should ask for:** the gross margin each month (sales minus food and drink costs, as a share of sales); which month changed and by how much; the effect on profit after all costs; two or three pricing options with the trade-offs of each; the working for every figure; and a list of assumptions and anything the AI would need to know to be surer.

**The starter prompt someone wrote**

> how is my cafe doing and what should I charge`,
    objectives: [
      {
        id: "context",
        label: "Gives the task, the context and the goal",
        weight: 2,
        guidance:
          "Full credit when the prompt says who the analysis is for (a café owner deciding on prices), refers to the table as the only source of figures, includes what the owner knows (prices unchanged since January, supplier rise from April), and states the decision to be made. Part credit if the table is referenced but the goal or known facts are missing.",
      },
      {
        id: "working",
        label: "Asks for the working to be shown",
        weight: 3,
        guidance:
          "Full credit for an explicit instruction to show each calculation step by step (for example the gross margin formula applied to each month), to use only the figures in the table, and to present results in a small table the owner can check. Extra evidence: the learner reports recalculating at least one figure. Part credit for 'be accurate' or 'double-check'. None if the prompt only asks for a conclusion.",
      },
      {
        id: "assumptions",
        label: "Asks for assumptions and uncertainty to be flagged",
        weight: 3,
        guidance:
          "Full credit when the prompt tells the model to list every assumption separately (for example that customer numbers will not fall after a price rise, or that the cost increase is permanent), to mark estimates as estimates, and to say what extra information would change the answer. Part credit for asking about assumptions in passing. None if assumptions are not mentioned.",
      },
      {
        id: "options",
        label: "Asks for pricing options with trade-offs",
        weight: 2,
        guidance:
          "Full credit when the prompt asks for two or three options (such as a small rise on coffee only, a rise across the menu, or a change in portion or product mix), each with its estimated effect on margin, the assumption it rests on and the risk to regular customers, and leaves the decision with the owner. Part credit for asking for 'the best price' only.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "how is my cafe doing and what should I charge",
      contextMd: `<cafe_figures>
FICTIONAL CAFÉ: SIX MONTHS OF FIGURES (anonymised, for training use only)

| Month | Customers | Sales (£) | Food and drink costs (£) | Staff costs (£) | Rent and energy (£) | Other costs (£) |
|---|---|---|---|---|---|---|
| January | 2,400 | 16,800 | 5,040 | 6,200 | 2,600 | 900 |
| February | 2,300 | 16,330 | 4,950 | 6,100 | 2,600 | 900 |
| March | 2,600 | 18,460 | 5,560 | 6,400 | 2,650 | 950 |
| April | 2,650 | 18,815 | 6,960 | 6,400 | 2,650 | 950 |
| May | 2,800 | 19,880 | 7,380 | 6,600 | 2,650 | 1,000 |
| June | 2,750 | 19,525 | 7,250 | 6,600 | 2,700 | 1,000 |

Notes from the owner:
- Menu prices have not changed since January.
- A supplier letter in March said coffee bean and milk prices would rise from April.
- Coffee and other hot drinks are roughly half of sales (owner's estimate, not measured).
</cafe_figures>`,
      sandboxSystem:
        "You are a careful business analyst helping a small business owner in a training sandbox. Follow the user's prompt as written. If the prompt is vague, give the kind of short, general answer that prompt actually warrants: do not add step-by-step working, assumption lists or options the user did not ask for, because the learner is practising writing prompts and needs honest feedback about what their prompt produces. Use only figures supplied in the conversation; never invent industry benchmarks or statistics. The café and its figures are fictional.",
    },
  },

  // ── Module 6 ──────────────────────────────────────────────────────────
  {
    slug: "ai-small-business-lab-6-your-90-day-plan",
    title: "Your 90-day AI plan",
    labType: "workbench",
    moduleNumber: 6,
    estimatedMinutes: 40,
    points: 70,
    passScore: 70,
    briefMd: `Turn everything from this track into a plan you will actually follow for the next 90 days. Not a wish list: **three projects**, chosen because they pay off, with a named owner, a measure, a first step you will take this week, and a clear view of what could go wrong.

Start from your customer-journey map and time audit from Lab 1. The best plans put at least one project at or near the bottleneck, and decide what the time they free up will be used for.

You are assessed on whether the plan is focused, owned and measurable, and on whether you have thought about risk and about the people who will live with the changes.`,
    scenarioMd: `Keep it to three projects even if you have ten ideas. Write the others down somewhere else.

If you do not run a business, use the illustrative dog-grooming salon from Lab 1 and say so.

Score each project on **impact** (how much it helps customers, sales or your time, 1 to 5) and **effort** (time, money and disruption to set up, 1 to 5). High impact and low effort go first.`,
    objectives: [
      {
        id: "choice",
        label: "Three well-chosen, scored projects",
        weight: 3,
        guidance:
          "Full credit for exactly three specific projects (not 'use AI for marketing'), each scored for impact and effort with a one-line reason for each score, chosen for high impact relative to effort, with at least one tied to the bottleneck or reinforcing loop from the Lab 1 map. Part credit for three projects scored without reasons, or with no link to the map. Low credit for more than three or for vague projects.",
      },
      {
        id: "ownership",
        label: "Owners, measures and first steps",
        weight: 3,
        guidance:
          "Full credit when each project has a named owner (a person, not 'the team'), one measure with a baseline and a target (for example median enquiry reply time from about a day to under two hours), a review date, and a concrete first step that can be done this week. Part credit if measures are activity counts ('number of AI posts') or first steps are vague ('look into tools').",
      },
      {
        id: "risk",
        label: "Risks and guardrails",
        weight: 2,
        guidance:
          "Full credit for one specific risk per project (wrong information to customers, customer data in the wrong tool, a fake-sounding claim, an automation failing silently, staff pushback) paired with a guardrail that addresses it (a check before sending, an approved-tools rule, an alert, a named reviewer). Part credit for generic risks ('AI can be wrong') or risks without guardrails.",
      },
      {
        id: "people",
        label: "People, and what you will stop doing",
        weight: 2,
        guidance:
          "Full credit when the plan says how the team will be told and involved (what changes for them, training, who to ask), AND names at least one specific task or habit the owner will stop doing, with where the freed time will go. Part credit for one without the other. None if people and freed time are not mentioned.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "projects",
          label: "Your three projects, scored",
          prompt:
            "Name three specific AI projects. For each, give an impact score and an effort score (1 to 5) with a one-line reason for each score, and say how it connects to your customer-journey map or bottleneck.",
          placeholder:
            "1. AI-drafted first replies to enquiries, checked by me before sending | Impact 5: enquiries wait up to a day at present, and this is our bottleneck | Effort 2: ...",
          minWords: 80,
        },
        {
          id: "ownership",
          label: "Owner, measure and first step for each",
          prompt:
            "For each project: who owns it, the one measure you will track (with today's figure and your target), when you will review it, and the first step you will take this week.",
          minWords: 70,
        },
        {
          id: "risks",
          label: "The risk and the guardrail",
          prompt:
            "For each project, name the most likely thing to go wrong and the guardrail you will put in place to prevent or catch it.",
          minWords: 50,
        },
        {
          id: "people",
          label: "Bringing the team along",
          prompt:
            "How will you tell your staff (or anyone who helps you) about these changes? What changes for them, how will they learn it, and who do they ask when unsure?",
          minWords: 40,
        },
        {
          id: "stop",
          label: "What you will stop doing",
          prompt:
            "Name at least one task or habit you will stop doing once these projects are running, and what you will do with the time instead.",
          minWords: 30,
        },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// FINAL EXAM
// ═══════════════════════════════════════════════════════════════════════════

export const SMB_FINAL_EXAM: SeedFinalExam = {
  title: "AI for Small Business Owners: Final Exam",
  timeLimitMinutes: 50,
  questionsServed: 35,
  passScore: 75,
  distinctionScore: 90,
  maxAttempts: 3,
  cooldownHours: 24,
  instructionsMd: `## Before you start

**35 questions. 50 minutes. 75% to pass.** Score 90% or above and your certificate is marked *with Distinction*.

Most questions are short scenarios from small businesses like yours: a café, a salon, a trades business, a shop. They test judgement: where the business is held up, what a prompt is missing, what must be checked before it reaches a customer, and when the owner should decide. Remembering a phrase from a lesson will not be enough.

Questions are drawn at random from a larger bank covering all six modules, and the options are shuffled, so each attempt is different. Every answer is saved the moment you select it, and the clock runs on our server.

You have up to 3 attempts, with a 24-hour gap between them so that a retry is a studied one. Your result is broken down by module, so you will know what to revisit.`,
  questions: [
    // ── Module 1: Where AI Pays Off in a Small Business ───────────────────
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "In systems terms, what is the bottleneck in a small business?",
      options: [
        "The step that involves the most staff, whatever its pace",
        "The step that limits how much work the whole business gets through",
        "The task the owner finds most tedious and would rather hand off",
        "The most expensive tool or supplier that the business relies on daily",
      ],
      correctIndex: 1,
      explanation:
        "The bottleneck is the step whose capacity sets the pace for everything else. A disliked or costly task may not be holding anything up, so speeding it up changes little.",
    },
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "Which of these describes a reinforcing feedback loop in a small business?",
      options: [
        "Rising demand lengthens wait times, which puts some customers off",
        "A price rise reduces orders until the owner lowers prices again",
        "More happy customers leave reviews, which bring in more customers",
        "A busy December is followed by a quiet January every single year",
      ],
      correctIndex: 2,
      explanation:
        "In a reinforcing loop each round strengthens the next: customers bring reviews, reviews bring customers. Longer waits putting people off, or prices settling back, are balancing loops, and a seasonal pattern is not a loop at all.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A salon owner's time audit shows 6 hours a week on booking messages, 4 on social posts, 3 on colour consultations and 2 on stock orders. Which task should she keep for herself?",
      options: [
        "Booking messages, because they take up the most hours each week",
        "Social posts, because the brand voice can only ever come from her",
        "Stock orders, because mistakes with stock are costly to put right",
        "Colour consultations, because clients value her judgement there",
      ],
      correctIndex: 3,
      explanation:
        "Keep the tasks where your judgement and relationships are the product. Booking messages and posts are good candidates for AI drafts that she checks, and stock orders can be prepared by AI and approved.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A café starts using AI to answer online booking enquiries within minutes, but bookings do not rise. The owner still confirms tables only in the evening. What does this show?",
      options: [
        "The wait has moved to the owner's confirmation, the real constraint",
        "The AI replies need a friendlier tone to convert more enquiries",
        "Customers do not value fast replies, so the tool should be dropped",
        "The café needs a larger AI tool that can handle bookings as well",
      ],
      correctIndex: 0,
      explanation:
        "Faster replies did not change the step that sets the pace: the evening confirmation. Customers still wait there, so the fix is to speed up or share that step, not to polish the reply.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "An owner with a tight budget wants to try AI for drafting customer emails. What is the most sensible first step?",
      options: [
        "Buy an annual plan for the tool with the longest list of features",
        "Wait until a single system for every task can be afforded at once",
        "Trial a free or low-cost tier on one real task for a couple of weeks",
        "Sign up to several paid tools at once and keep whichever one feels best",
      ],
      correctIndex: 2,
      explanation:
        "A short trial on one real, frequent task shows whether it saves time before money is committed. Long contracts, waiting for a perfect system or paying for several tools at once all spend money ahead of evidence.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A staff member pastes the customer list, with names, phone numbers and purchase history, into a free AI chatbot to write a newsletter. What is the main problem?",
      options: [
        "The AI may misspell some names, so each one needs checking by hand",
        "Customer personal data went into a tool nobody had checked first",
        "Free tools are slower, so the newsletter will take longer to write",
        "The tone may not match the brand unless examples are given as well",
      ],
      correctIndex: 1,
      explanation:
        "Personal data went into a tool whose terms and storage nobody had checked, and the newsletter did not need it. The guardrail is to use approved tools and leave out customer details the task does not require.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "A plumber wants AI to bring in more leads. His time audit shows quotes take five days to go out because he writes them at weekends. What should he do first?",
      options: [
        "Run AI-written ads, since more leads will lift sales straight away",
        "Hire a salesperson to call new leads while quotes wait as before",
        "Add a website chatbot so that enquiries get answered overnight",
        "Use AI to draft quotes faster, since leads already wait at that step",
      ],
      correctIndex: 3,
      explanation:
        "Quotes are the bottleneck: leads already pile up there. More leads, calls or chat replies add to that queue, while faster quote drafting (checked by him) moves customers through it.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "A shop automatically asks every customer for a review the day after purchase, including customers whose orders are running late. What knock-on effect is most likely?",
      options: [
        "Unhappy customers are prompted to post reviews at the worst moment",
        "Review numbers stay flat because automated requests are ignored",
        "Staff spend more time answering reviews than they did before",
        "The shop drops in search results for sending too many requests",
      ],
      correctIndex: 0,
      explanation:
        "The automation ignores the state of the order, so it invites frustrated customers to review while they are frustrated. That feeds the review loop in reverse. Checking for delays before asking fixes it.",
    },

    // ── Module 2: Marketing That Sounds Like You ──────────────────────────
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "Which of these makes a brand-voice prompt work best?",
      options: [
        "One word such as 'friendly', so the AI has room to be creative",
        "The names of big national brands whose adverts you would like to copy",
        "Words you use and avoid, plus short examples of your real writing",
        "Your full company history, so the AI knows every past detail",
      ],
      correctIndex: 2,
      explanation:
        "Concrete guidance and real examples let the model match how you actually sound. A single adjective produces generic text, copying big brands loses your voice, and a long history adds noise rather than style.",
    },
    {
      moduleNumber: 2,
      difficulty: 1,
      question:
        "Why do accurate opening hours, services and photos on a Google Business Profile matter for a local business?",
      options: [
        "They replace the need for a website or any other marketing at all",
        "They help nearby customers find you and trust what they see",
        "They guarantee a top place in local search for any search term",
        "They let AI tools write your reviews and replies automatically",
      ],
      correctIndex: 1,
      explanation:
        "An accurate, complete profile helps local customers find you and avoids wasted trips or calls. No profile guarantees a ranking, and it complements rather than replaces your other marketing.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A florist types 'write a Mother's Day post' and gets bland, generic text. What is the best improvement?",
      options: [
        "Add the offer, the customer, voice notes and a clear next step",
        "Ask for ten versions and post the one that feels least generic",
        "Tell the AI it is a world-class copywriter with many awards",
        "Ask for more emojis and hashtags so the post stands out more",
      ],
      correctIndex: 0,
      explanation:
        "The output is generic because the prompt is. The specific offer, who it is for, how the florist sounds and what to do next give the model something real to work with; a grand role or more emojis do not.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "An owner generates 30 posts in one go and schedules them all for the month without reading them. What is the main risk?",
      options: [
        "The posts will be too similar for the platform to publish them",
        "Scheduling tools cannot publish content that AI has written",
        "Wrong dates, errors or invented claims go out with no one seeing",
        "Followers will leave if more than one post appears in a week",
      ],
      correctIndex: 2,
      explanation:
        "Scheduling unread content removes the check before publishing. A wrong date, a price that has changed or a made-up claim goes out in your name. Batch drafting is fine; batch publishing unchecked is not.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "An AI-drafted advert for a bakery says 'Voted best bakery in town'. The bakery has never won or been voted anything. What should the owner do?",
      options: [
        "Keep it, since customers expect some exaggeration in adverts",
        "Soften it to 'maybe the best bakery in town' so it is not a lie",
        "Keep it only on social media, where the rules are looser",
        "Remove it, since it is a claim the business cannot back up",
      ],
      correctIndex: 3,
      explanation:
        "A claim of an award or vote that never happened misleads customers and can breach advertising rules on any channel. Replace it with something true and specific, such as how the bread is made.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "A dental practice wants AI to help write the FAQ page on its website. What is the right process?",
      options: [
        "Let the AI guess the common questions and publish them straight away",
        "Base answers on questions patients really ask, then check each fact",
        "Copy a larger practice's FAQs and ask the AI to reword each of them",
        "Keep the answers vague so the page never needs updating later on",
      ],
      correctIndex: 1,
      explanation:
        "Real questions from the phone and inbox make FAQs useful, and checking every fact prevents wrong prices or policies going public. Guessed, copied or vague answers help neither patients nor search.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question:
        "A gym tests two subject lines: version A goes to current members on Monday, version B to former members on Saturday. B gets more opens. What can the owner conclude?",
      options: [
        "Version B is better and should be used for all future emails",
        "Version A is better, since members are more valuable to the gym",
        "Nothing reliable, since the day and audience differed as well",
        "The two are equal, since opens never depend on subject lines",
      ],
      correctIndex: 2,
      explanation:
        "The day and the audience changed along with the subject line, so any of the three could explain the difference. Test one change at a time on comparable groups.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question:
        "An owner's AI-written posts get plenty of likes but almost no enquiries. Which change is most likely to help?",
      options: [
        "Post twice as often, since more likes will turn into sales later",
        "Switch to a different AI tool that writes more engaging content",
        "Drop calls to action, since they make the posts feel too salesy",
        "Tie each post to a real offer with a clear, trackable next step",
      ],
      correctIndex: 3,
      explanation:
        "Likes are an easy measure that may not lead anywhere. Posts built around a real offer, with one specific next step you can count, connect marketing to enquiries and show what is working.",
    },

    // ── Module 3: Winning and Keeping Customers ───────────────────────────
    {
      moduleNumber: 3,
      difficulty: 1,
      question: "A shop adds an AI chat assistant to its website. Which feature matters most?",
      options: [
        "A human name and photo so visitors think they are talking to staff",
        "Permission to promise refunds so that customers are not kept waiting",
        "A clear handoff to a person for anything it cannot answer well",
        "The ability to answer any question, even beyond the shop's details",
      ],
      correctIndex: 2,
      explanation:
        "A clear route to a person catches the questions the assistant should not handle. Pretending to be a person, making promises on the business's behalf or answering beyond what it knows all create risk.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "A builder usually takes three days to reply to new enquiries, and many go elsewhere. What is the best use of AI here?",
      options: [
        "Draft a quick first reply for him to check, with clear next steps",
        "Send AI replies with fixed prices so nobody has to wait at all",
        "Rank enquiries by value and quietly ignore the lower-value ones",
        "Reply only to the enquiries that arrive with photos of the job",
      ],
      correctIndex: 0,
      explanation:
        "A fast, checked first reply that says what happens next keeps the customer interested without committing to prices the builder has not worked out. Ignoring enquiries or quoting blind costs trust and money.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "A decorator's quotes often go unanswered. What is a sensible AI-assisted follow-up?",
      options: [
        "Daily reminders until the customer finally replies with a decision",
        "A message warning that the price will rise sharply if they wait",
        "A short, polite check-in a week later that refers to their job",
        "A general newsletter sent to everyone who has received a quote",
      ],
      correctIndex: 2,
      explanation:
        "One timely, personal follow-up that mentions their job is helpful rather than pushy. Daily chasing and pressure tactics put people off, and a newsletter does not answer the question they are weighing up.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "Which is the right way for a small business to ask for online reviews?",
      options: [
        "Ask only the customers you expect to leave five stars for a review",
        "Offer a discount to customers in return for a five-star review",
        "Have staff post reviews from their own accounts to get started",
        "Ask every customer after the job, with a simple link to the page",
      ],
      correctIndex: 3,
      explanation:
        "Asking everyone, at a sensible moment, with an easy link gives an honest picture. Picking only happy customers, paying for good reviews or writing your own are misleading, and can break platform rules and consumer law.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "You use AI to draft a reply to a critical public review. What should the reply do?",
      options: [
        "Acknowledge the issue briefly, keep details private, offer contact",
        "Explain at length why the customer is wrong, using their order data",
        "Say nothing, since replying only draws more attention to the review",
        "Go up at once unedited, so the reply looks fast and keen to help",
      ],
      correctIndex: 0,
      explanation:
        "A short, calm reply that takes the concern seriously and moves the conversation to a private channel reassures future customers. Arguing with personal details, silence or unchecked AI text all make things worse.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "A salon wants to win back clients who have not booked for six months. The AI drafts one email for all of them. What is the better approach?",
      options: [
        "Send the same email every week until each lapsed client rebooks",
        "Group by what they booked and when, then tailor the message",
        "Offer the biggest discount the salon can afford to everyone",
        "Buy a list of local contacts and add them to the same email",
      ],
      correctIndex: 1,
      explanation:
        "A client who came for colour every eight weeks needs a different message from a one-off visitor. Grouping lets AI draft relevant messages. Repeated emails, blanket discounts and bought lists waste money and goodwill.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "An AI draft reply to a complaint promises 'a full refund within 24 hours'. The shop's policy is a refund when the item is returned within 14 days. What is wrong?",
      options: [
        "It is too short and should set out all of the refund rules in full",
        "It should have offered a voucher instead of any kind of refund",
        "It is fine, as long as the customer is happy with what it says",
        "It commits the shop to a promise that is not its actual policy",
      ],
      correctIndex: 3,
      explanation:
        "Once sent, the promise is the shop's, and it contradicts the real policy. Check every promise, price and deadline in an AI draft against what the business actually does before sending.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "A website chat assistant handles most questions, but customers who get stuck tend to leave without buying. What is the best fix, thinking in systems?",
      options: [
        "Use the stuck conversations to fill gaps and improve the handoff",
        "Make the assistant's replies longer so each covers more topics",
        "Remove the chat entirely, since some customers will always leave",
        "Hide the contact form so that customers must use the chat instead",
      ],
      correctIndex: 0,
      explanation:
        "The stuck conversations are feedback: they show which answers are missing and where a person should step in. Closing that loop improves the system; longer replies or blocking other routes hide the problem.",
    },

    // ── Module 4: Admin and Operations on Autopilot ───────────────────────
    {
      moduleNumber: 4,
      difficulty: 1,
      question: "What is a human checkpoint in an automation?",
      options: [
        "A log that records every step after the automation has finished",
        "A test run of the automation done once before it goes live",
        "A point where a person reviews or approves before it carries on",
        "An extra AI step that checks the output of the first AI step",
      ],
      correctIndex: 2,
      explanation:
        "A checkpoint is where a person looks and decides before the automation continues, usually before anything reaches a customer or commits money. Logs, one-off tests and AI checking AI do not put a person in control.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "An owner asks AI to turn a voice note into a checklist for opening the shop in the morning. What should happen next?",
      options: [
        "Print and file it, since the AI version will already be complete",
        "Have the staff who open up test it and add what is missing",
        "Ask the AI to make it longer so that every case is covered",
        "Issue it to staff as a rule, with no chance to comment on it",
      ],
      correctIndex: 1,
      explanation:
        "The people who do the job spot the missing and wrong steps fastest, and they are more likely to use a checklist they helped shape. A longer or unquestioned list is not a better one.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "AI sorts your inbox and drafts replies. Which email should always come to you before anything is sent?",
      options: [
        "A supplier confirming a delivery time for next Tuesday morning",
        "A trade body newsletter about an upcoming local networking event",
        "A customer asking what time the shop opens on Saturday",
        "A customer disputing an invoice and mentioning legal action",
      ],
      correctIndex: 3,
      explanation:
        "Disputes, legal mentions and anything with money or reputation at stake need the owner's judgement. Routine confirmations and simple questions are safe for AI drafts that are checked or sent from templates.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "An automation copies web orders into the delivery sheet. The order form is changed and nothing is copied for a week before anyone notices. What would have limited the damage?",
      options: [
        "An alert when no orders arrive in a period when some are expected",
        "A faster automation tool that copies orders every few seconds",
        "More AI steps so the automation can guess any missing fields",
        "A monthly look at the sheet to see whether it seems about right",
      ],
      correctIndex: 0,
      explanation:
        "Silent failure is the dangerous kind. An alert for 'nothing has happened when something should have' catches it within hours. Speed, guessing or a monthly glance would not have spotted the gap in time.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "You are about to connect a new AI tool to an automation that handles customer bookings. What should you check first?",
      options: [
        "Whether the tool uses the newest AI model on the market",
        "What data it touches, where it is stored and who can see it",
        "How many steps it has, since fewer steps are always much safer",
        "Whether it runs at night, when fewer customers are online",
      ],
      correctIndex: 1,
      explanation:
        "Customer data now flows into a new tool, so you need to know what goes in, where it is kept and who can access it. The model version, step count and timing matter far less than that.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question:
        "An owner asks AI to shortlist CVs for candidates 'who would fit our team culture'. What is the main risk?",
      options: [
        "The AI will pick too many candidates for a small business",
        "CVs are too short for the AI to judge anything useful at all",
        "Candidates will be able to tell that AI made the shortlist",
        "Vague fit criteria can screen people out unfairly, unseen",
      ],
      correctIndex: 3,
      explanation:
        "'Culture fit' is vague and can stand in for background or age, and the AI applies it invisibly across every CV. Fair hiring uses the job's real requirements, applied the same way to everyone, with a person deciding.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question:
        "An automation emails each new starter an AI-drafted welcome pack including pay, hours and holiday details. Where should the human checkpoint go?",
      options: [
        "After a month, asking the new starter whether the pack helped",
        "Before sending, checking pay, hours and holiday details are right",
        "At the start, choosing which AI tool will draft the welcome pack",
        "Nowhere, since the pack is drafted from the business's own data",
      ],
      correctIndex: 1,
      explanation:
        "Pay and holiday details are contractual, so an error causes real problems and is awkward to take back. The check belongs before sending; feedback later is useful but cannot undo a wrong promise.",
    },

    // ── Module 5: Money: Pricing, Numbers and Decisions ───────────────────
    {
      moduleNumber: 5,
      difficulty: 1,
      question: "Before pasting your sales spreadsheet into an AI tool, what should you do?",
      options: [
        "Convert it to a PDF so the AI cannot change any of the figures",
        "Add every other file you have so the AI sees the whole picture",
        "Remove customer names and details, keeping only what is needed",
        "Round every figure to the nearest thousand to keep things simple",
      ],
      correctIndex: 2,
      explanation:
        "Anonymising and trimming the data protects customers and still lets the AI answer the question. More files add risk and noise, and heavy rounding hides the very changes you are looking for.",
    },
    {
      moduleNumber: 5,
      difficulty: 1,
      question: "What does gross margin measure?",
      options: [
        "The share of sales left after the direct cost of what you sold",
        "The total money in the bank at the end of each trading month",
        "The profit left after every cost, including rent and wages",
        "The rise in sales compared with the same month last year",
      ],
      correctIndex: 0,
      explanation:
        "Gross margin is sales minus the direct cost of goods sold, as a share of sales. Profit after rent, wages and other costs is net profit, which is a different and later figure.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "An AI tool says your gross margin last month was 45%. When you check the figures yourself you get 38%. What should you do?",
      options: [
        "Use the AI's figure, since it is usually better at arithmetic",
        "Average the two figures and use roughly 41% in your planning",
        "Ask the same question again until two of the answers agree",
        "Ask it to show its working, find the error, then recheck it",
      ],
      correctIndex: 3,
      explanation:
        "Seeing the working shows where the difference comes from, such as a wrong cost line or a formula error, and then you can confirm the right figure. Averaging or re-asking until answers agree does not make either correct.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "Coffee bean costs have risen and a café owner wants AI's help with pricing. Which prompt is most useful?",
      options: [
        "Ask what price the most successful cafés in the country charge",
        "Share costs, prices and sales, and ask for options with trade-offs",
        "Ask for the single best price, with no need to explain the reason",
        "Ask it to raise every price by the same amount as the cost rise",
      ],
      correctIndex: 1,
      explanation:
        "Your own costs, prices and volumes let the AI work out what each option does to margin, and trade-offs keep the decision with you. Other cafés' prices, an unexplained answer or a blanket rule ignore your situation.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "What is the most useful way to use AI for a sales forecast for next year?",
      options: [
        "Ask for one precise figure for next year's total sales",
        "Ask it to name the busiest month for each of the next five years",
        "Build cautious, expected and hopeful cases with assumptions",
        "Copy last year forward, since next year will be the same",
      ],
      correctIndex: 2,
      explanation:
        "Scenarios with their assumptions written down show the range you might face and what drives it, so you can plan for the cautious case. A single precise figure looks certain when it is not.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "A supplier raises prices by 12%. The AI-drafted reply says 'a competitor has offered us the same for 20% less', which is not true. What is the problem?",
      options: [
        "It is too polite, so the supplier will not take it seriously",
        "It should threaten to leave at once, rather than negotiate",
        "It is fine, since negotiating always involves some bluffing",
        "It invents a fact that could wreck trust if they check it",
      ],
      correctIndex: 3,
      explanation:
        "An invented quote can be tested and, once found out, damages a relationship a small business relies on. A firm, honest email asking for the reason, a phase-in or a volume deal is safer.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "An automation sends reminders for overdue invoices. One customer paid by bank transfer, but the payment has not yet been matched. Which design avoids an embarrassing reminder?",
      options: [
        "A person checks recent payments before any reminder goes out",
        "Send reminders more often so late payers are caught sooner",
        "Word every reminder firmly so customers pay the first time",
        "Add late fees automatically to every invoice still unpaid",
      ],
      correctIndex: 0,
      explanation:
        "The data the automation relies on can lag behind reality. A quick check against recent payments before chasing protects good customers; more reminders, firmer words or automatic fees make the mistake worse.",
    },

    // ── Module 6: Your 90-Day AI Plan for the Business ────────────────────
    {
      moduleNumber: 6,
      difficulty: 1,
      question: "When scoring possible AI projects on impact and effort, which should usually go first?",
      options: [
        "High impact and high effort, since big projects impress staff",
        "Low impact and low effort, since they cannot possibly go wrong",
        "High impact and low effort, since they pay off soon and cheaply",
        "Whichever task the newest AI tool on the market is best at",
      ],
      correctIndex: 2,
      explanation:
        "Quick wins with real impact build evidence and confidence for bigger projects. Low-impact work wastes the effort, and starting from what a tool is good at ignores what the business needs.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "Your two part-time staff are worried AI will replace them. What is the best way to bring them along?",
      options: [
        "Roll it out quietly so they only notice once it is working",
        "Tell them nothing at all will change, so there is no need to worry",
        "Let each person use any AI tool they like, with no guidance",
        "Explain the aims, involve them in choosing tasks, train them",
      ],
      correctIndex: 3,
      explanation:
        "People support changes they understand and help shape, and training makes them confident. Hiding it, false reassurance or a free-for-all all tend to create distrust or risky habits.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "Your project is 'faster replies to enquiries'. Which measure best shows whether it worked?",
      options: [
        "Median time from enquiry to first reply, before and after",
        "The number of AI prompts the team runs in a typical working week",
        "How much the team says they like using the new AI tools",
        "The number of AI tools the business has now signed up to",
      ],
      correctIndex: 0,
      explanation:
        "The measure should match the goal and have a baseline. Prompt counts, opinions and tool counts measure activity, not whether customers are answered faster.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "An AI-drafted email to a customer contains a wrong price. Who is responsible?",
      options: [
        "The AI provider, since its model wrote the content itself",
        "Nobody, since AI-written content falls outside normal rules",
        "The business, through the person who approved and sent it",
        "The customer, since they chose to act on an AI's message",
      ],
      correctIndex: 2,
      explanation:
        "What the business sends is the business's responsibility, however it was drafted. That is why the plan names who checks and approves customer-facing content.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question:
        "An owner rewards staff for the number of AI-drafted social posts they publish each week. What is the most likely result?",
      options: [
        "Enquiries rise in step, since posting more always sells more",
        "Post count rises, while quality and enquiries may not improve",
        "Staff will ignore the target, since it has no real effect",
        "The AI tool will limit posts to protect the brand's quality",
      ],
      correctIndex: 1,
      explanation:
        "When a measure becomes a target, people improve the measure (Goodhart's law). Rewarding volume gets volume; measuring enquiries or bookings from posts rewards what the business actually needs.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question: "Why should a 90-day AI plan include what you will stop doing?",
      options: [
        "Time freed by AI drains away unless you decide where it goes",
        "It shows staff the plan is serious by cutting their hours",
        "It is a legal requirement for businesses that start using AI",
        "It lets you cancel every current tool and start from scratch",
      ],
      correctIndex: 0,
      explanation:
        "Saved minutes tend to disappear into more of the same busywork. Deciding what stops, and what the time goes to instead, is how the plan turns into more sales or real time back.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question:
        "An owner's plan starts eight AI projects at once with no owners. A month later nothing is finished. What is the best fix?",
      options: [
        "Add two more projects, since more attempts means more wins",
        "Buy a single AI platform that can run all eight projects",
        "Cut to three, each with an owner, a measure and a first step",
        "Pause until the quiet season, then restart all eight together",
      ],
      correctIndex: 2,
      explanation:
        "Too many projects with no owner spread attention so thin that none finishes. Three focused projects, each owned and measured, deliver results the business can then build on.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CAPSTONE
// ═══════════════════════════════════════════════════════════════════════════

export const SMB_CAPSTONE: SeedCapstone = {
  passThreshold: 70,
  briefMd: `## The brief

Run a **30-day AI rollout in your own business** and show what happened. This is the practical proof behind the certificate: that you can use AI to win and keep customers and get time back, with you in control of what matters.

Keep it modest and real. Three small workflows running for a few weeks beat a grand plan that never started. You do not need everything to have worked, but you must have run each workflow on real work and measured it honestly.

## What to submit

One document of roughly **1,500 to 2,500 words**, plus attachments (screenshots, prompts, tables), covering these six parts in order.

**1. Your business as a system.** Your customer-journey map from Module 1: stages, channels, who handles each, and where customers or enquiries wait. Mark the **bottleneck** and the evidence for it, and show one **reinforcing loop** with arrows. Explain how the map shaped which workflows you chose.

**2. Three AI workflows, running.** One for **marketing**, one for **customers** (enquiries, quotes, reviews, retention or complaints) and one for **admin or operations**. For each: what it does, where AI is used, who checks the output, and a **before and after measure** with real figures, such as time spent per week, reply time, enquiries or rebookings. Say what did not improve as well as what did.

**3. Your brand-voice prompt and prompt library.** The brand-voice prompt in full, with the examples of your real writing it uses, plus the prompts behind your three workflows, saved so someone else in the business could run them. Show at least one prompt you changed after testing and why.

**4. One automation with a human checkpoint.** The trigger, the steps, where AI is used, where a person checks and what they check for, the alert for when it fails (including when nothing happens), the data it touches, and how you tested it.

**5. A one-page AI guideline for your staff.** Plain language, one page: which tools are approved, what customer and business data must never go into them, what must be checked before anything reaches a customer, the honesty rules for marketing and reviews, and who to ask. If you work alone, write it for your future first hire.

**6. Reflection.** What worked, what did not, what surprised you, what you will stop doing, and your next three projects for the following 90 days with owners and measures.

## What good looks like

A reviewer should be able to trace every choice back to your map. Good submissions are specific (real stages, real prompts, real before-and-after figures), honest about what did not work, and clear about where a person stays in control. Remove or replace customer names, contact details and anything else personal before you submit; describe the data instead if you need to. Do not include invented reviews, testimonials or figures: if you have no measure yet, say so and say how you will get one.`,
  rubric: [
    {
      criterion: "Systems view of the business",
      weight: 20,
      description:
        "Is the customer-journey map real and specific, with channels, owners and waiting times? Is the bottleneck identified from evidence, is a genuine reinforcing loop described, and do the chosen workflows clearly follow from the map rather than from whichever tool was handy?",
    },
    {
      criterion: "Three workflows with honest before and after measures",
      weight: 25,
      description:
        "Are there three running workflows covering marketing, customers and admin, each with a clear description, a named checker and a before and after measure using real figures? Are results reported honestly, including what did not improve?",
    },
    {
      criterion: "Brand-voice prompt and prompt library",
      weight: 15,
      description:
        "Does the brand-voice prompt describe the business, customers and voice concretely, with real writing examples and honesty rules? Are the workflow prompts saved as reusable templates, with at least one improvement shown after testing?",
    },
    {
      criterion: "Automation with a human checkpoint",
      weight: 15,
      description:
        "Is the automation clearly specified (trigger, steps, AI use)? Does a person check before anything reaches a customer or commits money, with an alert for failures including silent ones, the data it touches listed, and evidence it was tested on awkward cases?",
    },
    {
      criterion: "Staff AI guideline and responsible use",
      weight: 15,
      description:
        "Is the one-page guideline plain and usable: approved tools, data that must stay out, checks before sending, honest marketing and review rules, and who to ask? Is customer data handled carefully throughout the submission?",
    },
    {
      criterion: "Reflection and next steps",
      weight: 10,
      description:
        "Is the reflection honest about what worked and what did not? Does it name what the owner will stop doing and set out three focused next projects with owners and measures?",
    },
  ],
};
