import type { SeedModule } from "../types";

// AI for Small Business Owners: Grow Sales and Get Time Back (slug: ai-small-business), Modules 1-3.
// Systems thinking is the thread: Module 1 builds the owner's "business map"
// (the customer journey from first contact to repeat purchase), and later
// lessons refer back to it, its bottleneck and its reinforcing loops.

export const SMB_MODULES_1_TO_3: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 1
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Where AI Pays Off in a Small Business",
    summary:
      "See your business as a system from first contact to repeat purchase, find the hours and the money that leak out of it, pick affordable tools, and set simple guardrails before AI touches a customer.",
    lessons: [
      {
        title: "Map your business as a system",
        objective: "Map your customer journey from first contact to repeat purchase and mark where time and money leak.",
        durationMinutes: 25,
        contentType: "article",
        isPreview: true,
        bodyMd: `## Start with the business, not the tool

Most owners meet AI the same way: someone shows them a clever trick, and they wonder where they could use it. That is a tool-first question, and it usually points you at whatever is most annoying this week rather than at what is actually holding the business back.

A better question is: "How does a stranger become a paying customer, and then a regular?" Answer that and you have a map of your business as a system. A system is simply parts, connections and a purpose. Your parts are the steps a customer goes through and the people (often just you) who handle them. The connections are the hand-offs between those steps. The purpose is customers who buy, come back and tell others.

Once you can see the whole journey, you can put AI where it pays, and you will stop wasting evenings on tricks that change nothing.

## The customer journey in six steps

Almost every small business, from a salon to a plumbing firm to an online shop, runs some version of this:

1. **Found**: someone discovers you (search, social media, a friend, walking past).
2. **Enquire**: they get in touch, or browse and consider.
3. **Quote or book**: you give a price, a proposal or an appointment.
4. **Buy and deliver**: they pay, and you do the work or ship the order.
5. **Follow up**: you check they are happy, ask for a review, sort any problem.
6. **Return and refer**: they buy again and send friends your way.

Write your own version. A restaurant might have "book a table, eat, pay, leave a review". A consultancy might have "discovery call, proposal, contract, project, check-in". Use the words you actually use.

## Where time and money leak

For each step, ask four questions:

- **Who handles it?** Often "me, in the evening".
- **How long does it take, and how long does the customer wait?** Waiting is often longer than working.
- **Where do people drop out?** Enquiries never answered, quotes never chased, customers never asked back.
- **What gets redone?** Quotes rewritten, orders corrected, the same question answered for the tenth time.

Imagine a small decorating business. The owner does good work, and customers who hire them are happy. Mapped honestly, the leaks show up quickly: enquiries arrive by phone while the owner is up a ladder, quotes take a week to write in the evenings, and nobody ever asks happy customers for a review. The work itself is not the problem. The journey around it is.

## One step sets the pace

Here is the most useful idea in this whole course. In any system, one step limits how much gets through. This comes from the theory of constraints, set out by Eliyahu Goldratt: the whole business can only move as fast as its narrowest point, which is called the bottleneck.

This matters because speeding up the wrong step just moves the queue. If the decorator uses AI to post on social media every day, more enquiries arrive, and they pile up in front of the same slow quoting step. More people wait, more of them give up, and the owner feels busier with nothing to show for it. Faster quoting would have helped. Faster marketing made the jam worse.

So before you add AI anywhere, find the step where customers wait longest or drop out most. That is where to start.

## Loops that grow the business

Some parts of the journey feed back into the start. A happy customer leaves a review, the review helps a stranger find you, that stranger becomes a customer who leaves another review. This is a **reinforcing loop**: each turn makes the next one stronger. Referrals work the same way.

Reinforcing loops also run backwards. Slow replies lead to lost customers, fewer reviews and fewer new enquiries. Mark the loops on your map: they show you where a small improvement keeps paying.

## Try it now

Paste this into the practice pad, fill in the brackets, and run it.

\`\`\`try
I run [YOUR BUSINESS: type, size, location]. My customers are mostly [CUSTOMER TYPE].
Here is how a customer goes from first hearing about us to buying again:
[DESCRIBE EACH STEP IN A LINE OR TWO, INCLUDING WHO HANDLES IT]

Please:
1. Turn this into a numbered customer journey of 5 to 7 steps.
2. For each step, list where time or money might leak (waiting, drop-outs, rework).
3. Ask me up to 5 questions about the steps you are least sure of.
Do not suggest tools yet.
\`\`\`

Answer its questions, then correct anything it got wrong. You are done when you have a journey of five to seven steps written down, with the step where customers wait longest circled and at least one reinforcing loop marked. Keep this map: the rest of the course calls it "your business map".`,
        microCheck: [
          {
            question: "Why does the lesson suggest mapping the customer journey before choosing any AI tool?",
            options: [
              "It shows which step holds the business back, so effort goes there",
              "Most AI tools need a written customer journey before they will work",
              "A map lets you hand every single step over to an AI assistant",
              "Mapping is mainly a way to explain the business to new staff",
            ],
            correctIndex: 0,
            explanation:
              "The map shows the whole system, including waits and drop-outs, so you can target the step that limits growth. Handing every step to AI, or picking the most annoying one, often changes nothing that matters.",
          },
          {
            question: "A florist uses AI to double their social posts, but quotes for weddings still take a week. What is the likely result?",
            options: [
              "More enquiries pile up waiting for the same slow quoting step",
              "Quotes speed up because the business now looks more active",
              "Sales double in line with the number of posts published",
              "Nothing changes, because social posts never bring enquiries",
            ],
            correctIndex: 0,
            explanation:
              "Speeding up a step that is not the bottleneck just moves the queue. Extra enquiries wait in front of the slow quoting step, and some of those customers give up and go elsewhere.",
          },
          {
            question: "Which of these is a reinforcing loop in a small business?",
            options: [
              "Happy customers leave reviews that help new customers find you",
              "A supplier raises prices, so you raise yours to keep your margin",
              "You hire extra help in December and let them go in January",
              "A customer pays late, so you add a reminder to your invoices",
            ],
            correctIndex: 0,
            explanation:
              "In a reinforcing loop each turn strengthens the next: reviews bring customers who leave more reviews. The other options are one-off responses or seasonal adjustments, not self-strengthening cycles.",
          },
          {
            question: "When mapping each step, why does the lesson ask how long the customer waits, not just how long you work?",
            options: [
              "Waiting is often longer than working and is where customers give up",
              "Waiting time is what most AI tools are designed to measure for you",
              "Customers only judge a business on the time it spends working",
              "Working time cannot be changed, so waiting is the only thing left",
            ],
            correctIndex: 0,
            explanation:
              "A quote that takes one hour to write can still leave a customer waiting a week. That wait is where people drop out, so it is a far better guide to the bottleneck than effort alone.",
          },
          {
            question: "Imagine a salon where bookings are easy but clients rarely rebook. Where does the map suggest looking first?",
            options: [
              "The follow-up and return steps, where customers are being lost",
              "The discovery step, since more new clients will fix the problem",
              "The booking step, because it is the one clients see first",
              "The payment step, since it is the last one before they leave",
            ],
            correctIndex: 0,
            explanation:
              "The leak is after the visit, so that is where effort pays. Pouring more new clients into a journey that does not bring them back just keeps the owner running to stand still.",
          },
        ],
      },
      {
        title: "The owner's time audit: find 5-10 hours a week",
        objective: "Sort a week of your own tasks to find the hours AI can safely give back.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Where the week actually goes

Ask most owners where their time goes and they will say "everywhere". That is honest but not useful. You cannot reclaim time you cannot see, so this lesson is about seeing it.

The aim is not to squeeze every minute. It is to find a handful of repeated, low-judgement tasks that AI can draft or speed up, so you get evenings back or spend the time on the step your business map says is the bottleneck.

## Step 1: write down a real week

For one week, or from memory of last week if you must, list what you did that was not the core work customers pay for. Be specific. "Admin" is not a task. "Replied to eight enquiries asking about prices" is.

Typical entries look like:

- Answering the same questions by email, phone or message
- Writing quotes and chasing the ones that went quiet
- Writing social posts or a newsletter
- Replying to reviews
- Writing job adverts, rotas, policies or supplier emails
- Sorting receipts and working out what to order

Next to each, add a rough time and how often it happens.

## Step 2: sort into four piles

Put each task into one of four piles:

| Pile | What it means | Example |
|---|---|---|
| **Draft with AI** | Mostly writing or rewording, and you check before it goes out | First reply to an enquiry, a newsletter draft |
| **Template once** | Same thing every time, so write it once and reuse | Booking confirmation, aftercare notes |
| **Keep human** | Needs your judgement, relationships or care | A complaint from a long-standing customer, pricing a tricky job |
| **Stop or simplify** | Nobody would notice if it changed | A weekly report nobody reads |

Two piles are easy to miss. **Template once** often saves more than AI does: a good set of standard replies can be written with AI in an afternoon and then used without it. And **stop or simplify** costs nothing at all.

## Step 3: check against your map

Now look at your business map from the last lesson. Which of the "draft with AI" tasks sit at your bottleneck? If quoting is where customers wait, then speeding up quotes is worth far more than speeding up social posts, even if posts take longer.

This is why the audit comes after the map. Time saved on the wrong step is still nice for you, but it does not grow the business. Time saved at the bottleneck does both.

## Let AI help you sort

You can do the sorting yourself, but AI is quick at a first pass. Remove customer names and personal details before you paste anything in.

\`\`\`try
I own [YOUR BUSINESS] with [NUMBER] staff. Below is a list of tasks I did last week that were not the core work customers pay for, with rough times.

[PASTE YOUR TASK LIST, NO CUSTOMER NAMES OR PERSONAL DETAILS]

Sort every task into one of four piles: Draft with AI, Template once, Keep human, Stop or simplify.
Show a table with: task, pile, hours per week, and one sentence on why.
Then total the hours in "Draft with AI" and "Template once".
Flag any task where getting it wrong could upset a customer or break a rule, and put those in Keep human unless I say otherwise.
\`\`\`

Treat the result as a suggestion. You know which customers need a personal touch and which tasks carry risk. Move anything that feels wrong.

## Be realistic about the savings

AI rarely removes a task entirely. It turns "write from scratch" into "check and adjust". That is still a big saving on repetitive writing, but checking takes real time, and the first few weeks are slower while you build prompts and templates. If your list suggests you will save twenty hours, you have probably put too much in the AI pile.

A reasonable first target is a few hours a week from two or three tasks you do often. Pick those, and ignore the rest for now.

## Try it now

Run the prompt above with last week's tasks. Then choose the **three** tasks you will tackle first: at least one should sit at or near the bottleneck on your business map, and at least one should be a "template once" job.

You are done when you have a sorted table, a total of hours in the first two piles, and three named tasks written at the top of your business map with a rough time each currently takes.`,
        microCheck: [
          {
            question: "An owner lists \"admin, about ten hours\" in their time audit. What is the problem with that entry?",
            options: [
              "It is too vague to tell which tasks AI or templates could help with",
              "Ten hours is too little to be worth auditing in a small business",
              "Admin should never be included because it is not customer work",
              "AI tools cannot help with admin, so the entry wastes space",
            ],
            correctIndex: 0,
            explanation:
              "The audit only works if tasks are specific enough to sort. \"Replied to eight price enquiries\" can be templated or drafted; \"admin\" cannot be acted on at all.",
          },
          {
            question: "You answer the same five questions about parking, prices and cancellations every week. Which pile fits best?",
            options: [
              "Template once, then reuse the answers with light editing",
              "Keep human, because each customer deserves a fresh reply",
              "Stop or simplify, because customers can find it themselves",
              "Draft with AI from scratch each time the question arrives",
            ],
            correctIndex: 0,
            explanation:
              "Repeated questions with the same answers are ideal for templates. You can use AI once to write good answers, then reuse them without a new prompt every time.",
          },
          {
            question: "Your audit shows social posts take four hours a week and quotes take two. Your map shows customers drop out waiting for quotes. What should you tackle first?",
            options: [
              "Quotes, because they sit at the bottleneck on your map",
              "Social posts, because they currently take the most time",
              "Both equally, splitting the effort between them each week",
              "Neither, until you have audited a full month of your time",
            ],
            correctIndex: 0,
            explanation:
              "Time saved at the bottleneck grows the business as well as freeing you up. Saving time on posts is pleasant, but more posts would only feed more people into the slow quoting step.",
          },
          {
            question: "A task list suggests AI will save you 25 hours a week straight away. What is the most sensible reaction?",
            options: [
              "Be sceptical, since checking takes time and setup is slow at first",
              "Accept it, since AI can usually handle most admin on its own",
              "Hire less help next month to bank the savings immediately",
              "Double it, since the tools will get faster over the next year",
            ],
            correctIndex: 0,
            explanation:
              "AI turns writing into checking rather than removing the task. Early weeks include building prompts and templates, so a very large estimate usually means too much went in the AI pile.",
          },
          {
            question: "Why should you remove customer names before pasting your task list into an AI tool?",
            options: [
              "It avoids sharing personal data the tool does not need to see",
              "AI tools refuse to work with any text that contains names",
              "Names make the sorting less accurate, so results get worse",
              "It is only needed if the list will be shared with staff later",
            ],
            correctIndex: 0,
            explanation:
              "Sorting tasks does not need customer details, so leave them out. Sharing only what the job needs is a simple habit that keeps you on the right side of data protection rules.",
          },
        ],
      },
      {
        title: "Choosing tools on a small budget",
        objective: "Choose a small, affordable set of AI tools that fits the tasks you picked.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Three kinds of tool

You do not need a stack of subscriptions. Most small businesses get a long way with a few well-chosen tools. They fall into three kinds:

1. **General AI assistants.** Chat tools you type into, for example ChatGPT, Claude, Gemini or Microsoft Copilot. They draft, rewrite, summarise, brainstorm and explain. Most have a free tier and a paid tier.
2. **AI built into tools you already pay for.** Many email, website, accounting, booking, design and office tools now include AI features: drafting replies, writing product descriptions, summarising meetings, tidying images. You may already have these without realising.
3. **Specialist tools.** Built for one job, for example a website chat assistant, a review management tool or an AI phone answering service. Useful when one task is big enough to justify them.

Features, names and prices change often. Treat any tool named in this course as an example, and check what it currently offers and costs before you rely on it.

## Start with what you already have

Before signing up for anything new, check the tools you already pay for. Look for words like "AI", "assist", "generate" or a sparkle icon in their menus, and read their help pages.

Built-in AI has real advantages for a small business:

- Your data may already be in that tool, so there is less copying and pasting.
- You already know the tool and have agreed its terms.
- It is often included in your plan, or a small add-on.

The downside is that built-in features can be narrower than a general assistant. That is fine. Use each for what it does well.

## When a free tier is enough, and when to pay

A free general assistant is a sensible place to start while you learn. Consider paying when:

- **You hit limits** on how much you can use it and it is slowing you down.
- **You need business terms.** Paid business or team plans often give clearer commitments about how your data is handled, for example whether conversations are used to train models. Read the current terms for any plan before you paste in business information.
- **Several people need it** and you want shared settings or saved instructions.
- **A specialist tool clearly pays for itself** at your bottleneck, for example if missed calls are losing you jobs.

A simple test: can you name the task, the hours it will save each month, and roughly what those hours are worth? If not, wait.

## A small-budget checklist

Before you commit to any tool, ask:

| Question | Why it matters |
|---|---|
| Which task on my list does this handle? | Stops you buying tools for problems you do not have |
| What happens to the data I put in? | Customer data needs care (next lesson) |
| Can I try it free or cancel monthly? | Avoids being locked into a tool that does not fit |
| Does it work with what I already use? | Every copy and paste is a new place for mistakes |
| Who in the business will use it? | A tool nobody opens is a cost, not a saving |

## Let AI help you compare, then check

AI can help you think through options, but its knowledge of products and prices may be out of date. Use it to structure your thinking, then check the details on each tool's own website.

\`\`\`try
I run [YOUR BUSINESS] with [NUMBER] people. The three tasks I want help with are:
1. [TASK 1]
2. [TASK 2]
3. [TASK 3]
Tools I already pay for: [LIST, e.g. email, website builder, booking system, accounts software].
Budget for new tools: about [AMOUNT] a month.

For each task, tell me whether a general AI assistant, an AI feature in one of my existing tools, or a specialist tool is likely to fit best, and why.
List what I should check on each tool's website before deciding (features, data terms, price, cancellation).
Say clearly where your product knowledge might be out of date.
\`\`\`

## Try it now

Run the prompt with your three tasks from the time audit. Then spend ten minutes checking the menus and help pages of two tools you already pay for.

You are done when you have written, for each of your three tasks, which tool you will try first, whether it is free, included or paid, and one thing you checked on the tool's own site (for example its data terms or cancellation policy).`,
        microCheck: [
          {
            question: "Before signing up for a new AI tool, what does the lesson suggest you check first?",
            options: [
              "Whether tools you already pay for have AI features that fit",
              "Which new AI tool has the most features listed on its website",
              "Whether competitors in your area have bought the same tool",
              "Which tool offers the longest contract at the lowest price",
            ],
            correctIndex: 0,
            explanation:
              "Built-in AI may already cover the task, with your data already in place and terms already agreed. Buying new tools first often means paying twice and copying data between systems.",
          },
          {
            question: "An assistant tells you a specialist tool costs a certain amount a month. What should you do?",
            options: [
              "Check the current price and features on the tool's own website",
              "Trust it, since AI assistants are updated with prices every day",
              "Assume it has doubled, since AI answers are always pessimistic",
              "Ask the same assistant again to confirm the figure is correct",
            ],
            correctIndex: 0,
            explanation:
              "An assistant's product knowledge can be out of date or wrong, and prices change. Asking the same assistant again does not verify anything; the tool's own site is the source to check.",
          },
          {
            question: "Which is the strongest reason to move from a free AI assistant to a paid business plan?",
            options: [
              "You need clearer terms on how business information is handled",
              "Paid plans always write better marketing copy than free plans",
              "Customers can tell when a business uses a free AI assistant",
              "Free plans are not allowed for any kind of commercial use",
            ],
            correctIndex: 0,
            explanation:
              "Business plans often come with clearer commitments on data handling, which matters once you work with business information. The other claims are not reliable reasons, and terms vary, so read them.",
          },
          {
            question: "A salon owner is offered an AI phone answering service. Which question best decides if it is worth it?",
            options: [
              "Are missed calls actually losing bookings at the bottleneck?",
              "Does it use the newest and most capable AI model on the market?",
              "Have other salons nearby started using a similar service?",
              "Can it answer calls in more languages than staff can speak?",
            ],
            correctIndex: 0,
            explanation:
              "A specialist tool earns its cost when it fixes a real leak in your customer journey. If missed calls are not losing bookings, the service adds cost without moving the business forward.",
          },
        ],
      },
      {
        title: "Guardrails from day one",
        objective: "Set four simple rules for customer data, honest marketing and checking AI output before it is sent.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Why guardrails come first

AI makes it quick to produce emails, posts and replies. That is the benefit, and it is also the risk: a mistake that used to happen once can now happen fifty times before lunch. A few simple rules, set before you start, protect your customers, your reputation and you.

This is not legal advice. It is a set of sensible habits. If you are unsure about a specific situation, speak to an adviser, your trade body or the relevant regulator.

## Rule 1: treat customer data with care

Most countries have data protection laws. In the UK and EU, for example, the GDPR sets rules on collecting and using personal information, and similar laws exist elsewhere. You do not need to be an expert to follow the basic spirit:

- **Share only what the task needs.** To draft a reply about a delayed order, the AI does not need the customer's full name, address or phone number. Use "the customer" or a first name.
- **Know where it goes.** Check your AI tool's terms: does it store conversations, and are they used to train its models? Many tools let you change this in settings, and business plans often differ from free ones. Check the current terms yourself.
- **Keep sensitive details out.** Health information (for a clinic or salon doing treatments), payment details and anything about children need particular care. If in doubt, leave it out.
- **Tell people if you use their data in new ways.** If you start using AI to analyse customer information, check your privacy notice still describes what you do.

## Rule 2: be honest in marketing

AI will happily write "the best in town", "guaranteed results" or "trusted by thousands". Advertising and consumer protection laws in most countries require marketing claims to be true and not misleading, whoever or whatever wrote them. You are responsible for every word you publish.

- **No claims you cannot back up.** If you cannot prove "fastest", do not say it.
- **No fake reviews or testimonials.** Never have AI write reviews, and never post made-up customer quotes. This is unlawful in many places and breaks the rules of review platforms.
- **Disclose AI where it is required or expected.** Some platforms and rules require you to label AI-generated content, especially realistic images. If a customer thinks they are chatting to a person, tell them when they are not.
- **Real photos of real work.** AI images can be useful for backgrounds or ideas, but showing an AI image as "our work" misleads customers.

## Rule 3: check before anything goes out

AI output reads confidently even when it is wrong. It can invent opening hours, prices, policies or product details. Before sending or publishing, check:

- **Facts**: prices, dates, times, addresses, what is included.
- **Promises**: does it commit you to anything you did not intend, such as a refund, a discount or a deadline?
- **Tone**: would you say this to the customer's face?
- **Names and details**: right customer, right order, right job.

For routine templates, check carefully once and then spot-check. For anything new, anything about money, or anything going to an unhappy customer, read every word.

## Rule 4: a human owns every customer message

AI drafts. A person decides. Whoever presses send owns the message. If staff use AI, make sure they know these rules too, and know they can ask before sending something they are unsure about.

## Write your rules down

A one-page policy that everyone can see is worth more than good intentions. AI can help you draft it.

\`\`\`try
Write a one-page AI use policy for [YOUR BUSINESS], a [TYPE OF BUSINESS] with [NUMBER] staff in [COUNTRY].
Cover four rules in plain English:
1. What customer information must never be pasted into AI tools (we handle [TYPES OF DATA, e.g. contact details, booking notes, health information]).
2. Marketing must be true: no fake reviews, no claims we cannot prove, label AI content where required.
3. Check facts, promises, tone and names before anything is sent or published.
4. A named person approves every customer message.
Keep it under 300 words, friendly in tone, with a short checklist at the end.
Add a note that this is not legal advice and that we should check local rules.
\`\`\`

## Try it now

Run the prompt, then edit the result so it matches your business: the data you actually hold, the tools you actually use, and who approves what. Check your AI tool's current data settings and note what you found.

You are done when you have a one-page policy you would be happy for a customer to read, saved where you and any staff can find it, with a line recording what your AI tool's settings say about storing and training on your conversations.`,
        microCheck: [
          {
            question: "You want AI to help draft a reply about a delayed order. What should you paste in?",
            options: [
              "The order issue and a first name, without address or phone",
              "The full customer record so the reply is as accurate as possible",
              "Nothing about the order, only a request for a generic apology",
              "The customer's details, as long as you delete the chat later",
            ],
            correctIndex: 0,
            explanation:
              "Share only what the task needs. The AI needs the situation, not the address or phone number. Deleting a chat afterwards does not undo sharing data the tool never needed.",
          },
          {
            question: "An AI draft for your website says \"voted best café in the city\". You have never won such a vote. What should you do?",
            options: [
              "Remove it, because marketing claims must be true",
              "Keep it, because the AI wrote it and not you",
              "Keep it, but move it lower down the web page",
              "Soften it to \"one of the best cafés in the city\"",
            ],
            correctIndex: 0,
            explanation:
              "You are responsible for everything you publish, whoever drafted it. Softening an unprovable claim still implies something you cannot back up, so the honest fix is to remove it.",
          },
          {
            question: "A staff member suggests using AI to write a few five-star reviews to get started. What is the right response?",
            options: [
              "Refuse, since fake reviews mislead customers and break platform rules",
              "Allow it, as long as the reviews describe services you really offer",
              "Allow it, if the reviews are posted from different staff accounts",
              "Allow a small number, then replace them once real reviews arrive",
            ],
            correctIndex: 0,
            explanation:
              "Fake reviews are misleading to customers, are unlawful in many places and break review platform rules. Accurate descriptions or temporary use do not make a made-up review honest.",
          },
          {
            question: "An AI reply to an unhappy customer offers a full refund you had not planned to give. What does this show?",
            options: [
              "Why promises and money need checking before anything is sent",
              "That AI tools understand customer service better than owners",
              "That refunds should always be offered to unhappy customers",
              "That AI should not be used for any customer emails at all",
            ],
            correctIndex: 0,
            explanation:
              "AI can commit you to things you did not intend. Checking promises and money is one of the core checks, and it is why messages to unhappy customers deserve a full read.",
          },
          {
            question: "Which describes Rule 4, that a human owns every customer message?",
            options: [
              "AI drafts, and the person who presses send is responsible",
              "Only the owner may send messages that AI has helped to draft",
              "Customers must sign off every message before it is sent out",
              "AI messages must be sent from a separate personal account",
            ],
            correctIndex: 0,
            explanation:
              "The rule is about responsibility, not job titles. Staff can send AI-assisted messages, but whoever sends it owns it and should check it first.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Imagine a bakery that gets plenty of orders but takes three days to reply to custom cake enquiries. Where should AI effort go first?",
        options: [
          "Replying to enquiries faster, since that is where customers wait",
          "More social posts, since visibility always comes first for sales",
          "Bookkeeping, since it is the task the owner likes least of all",
          "A new website, since that is the first thing customers will see",
        ],
        correctIndex: 0,
        explanation:
          "The slow reply is the bottleneck, where customers wait and drop out. More posts would add to the queue, and bookkeeping may be tedious but it is not holding back sales.",
      },
      {
        question: "What does \"speeding up the wrong step just moves the queue\" mean for a small business?",
        options: [
          "Work piles up at the slowest step, so gains elsewhere do not help",
          "Customers will always queue however fast the business becomes",
          "AI tools make every step slower in the first few weeks of use",
          "Queues are good for business because they show high demand",
        ],
        correctIndex: 0,
        explanation:
          "In the theory of constraints the whole system moves at the pace of its bottleneck. Speeding up another step just sends work faster into the same jam.",
      },
      {
        question: "Imagine a plumber whose happy customers never leave reviews because nobody asks them. What does the systems view say?",
        options: [
          "A reinforcing loop of reviews bringing new work is not being fed",
          "Reviews do not matter for trades, so this can safely be ignored",
          "The plumber should post more on social media to make up for it",
          "The plumber should lower prices to encourage more reviews",
        ],
        correctIndex: 0,
        explanation:
          "Reviews help strangers find and trust you, which brings more customers who can leave reviews. Asking happy customers is a cheap way to strengthen that loop.",
      },
      {
        question: "In a time audit, which task belongs in the \"template once\" pile?",
        options: [
          "Aftercare instructions sent after every treatment",
          "Pricing an unusual job for a long-standing client",
          "Replying to a complaint about a damaged delivery",
          "Deciding whether to take on a new member of staff",
        ],
        correctIndex: 0,
        explanation:
          "Aftercare notes are the same every time, so write them well once and reuse them. The other tasks need judgement about a particular person or situation.",
      },
      {
        question: "An owner saves three hours a week using AI for social posts, but quotes still take a week. What is the fair verdict?",
        options: [
          "Useful for the owner, but it does not relieve the bottleneck",
          "A clear success, since any time saved grows the whole business",
          "A failure, since social posts are never worth any time at all",
          "Too early to tell, since AI savings only show after a year",
        ],
        correctIndex: 0,
        explanation:
          "Time back is welcome, but the business only grows faster when the bottleneck improves. The next step is to point AI at quoting, where customers are waiting.",
      },
      {
        question: "You find your email software has an AI feature for drafting replies. Why might you try it before a new tool?",
        options: [
          "It is already where your emails are, and may be in your plan",
          "Built-in AI is always more accurate than a general assistant",
          "New AI tools are not allowed to read emails from customers",
          "Using many tools at once is banned under data protection law",
        ],
        correctIndex: 0,
        explanation:
          "Built-in features avoid copying data between tools and may cost nothing extra. They are not always more capable, so the reason is convenience and cost, not accuracy.",
      },
      {
        question: "Before paying for a specialist AI tool, which question best shows it is worth it?",
        options: [
          "Which task does it handle, and what are the hours saved worth?",
          "Is it the tool that competitors in my sector have chosen to buy?",
          "Does it have the longest list of features in its price range?",
          "Will it still be the most advanced tool on the market next year?",
        ],
        correctIndex: 0,
        explanation:
          "A tool earns its cost by handling a named task and saving time you value. Feature lists and what others buy do not tell you whether it fits your business.",
      },
      {
        question: "A clinic receptionist wants to paste a patient's full notes into a free AI tool to draft a letter. What is the main concern?",
        options: [
          "Health details are sensitive and the tool's data terms may not fit",
          "Free AI tools cannot write letters in a professional enough tone",
          "The letter will be too long if the full notes are pasted in",
          "Patients may prefer a handwritten letter over a typed one",
        ],
        correctIndex: 0,
        explanation:
          "Health information needs particular care under data protection rules, and free tools may store or train on what you paste. Share only what is needed, and check the tool's terms.",
      },
      {
        question: "Your AI tool generates a realistic photo of a finished kitchen for your fitting business. How should you use it?",
        options: [
          "Not as \"our work\", since that would mislead potential customers",
          "As \"our work\", as long as you could build a similar kitchen",
          "As \"our work\", but only on social media rather than the website",
          "As \"our work\", provided the image is edited slightly first",
        ],
        correctIndex: 0,
        explanation:
          "Presenting an AI image as a job you did misleads customers about your work. Use real photos of real jobs, and label AI images where they are used for illustration.",
      },
      {
        question: "Which check matters most before sending an AI-drafted reply to an unhappy customer?",
        options: [
          "Reading every word for facts, promises and tone before it goes",
          "Making sure the reply is longer than the customer's own message",
          "Running it through a second AI tool to confirm it is accurate",
          "Checking that it includes a discount code to keep them happy",
        ],
        correctIndex: 0,
        explanation:
          "Unhappy customers are where mistakes cost most, so read every word. A second AI tool is not a reliable check, and discounts are a decision for you, not a default.",
      },
      {
        question: "An owner's time audit suggests AI could save 30 hours a week straight away. What is the most likely explanation?",
        options: [
          "Tasks needing judgement or checking were put in the AI pile",
          "The owner's business is simply ideal for complete automation",
          "The AI tool used for sorting was a particularly advanced one",
          "The owner has not included enough tasks in the audit yet",
        ],
        correctIndex: 0,
        explanation:
          "AI turns writing into checking, and many tasks need judgement. An estimate that large usually means the AI pile is overloaded, so move risky or personal tasks back to keep human.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 2
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Marketing That Sounds Like You",
    summary:
      "Turn your brand voice and ideal customer into a reusable prompt, produce a month of posts and emails in about an hour a week, make your local listing and website answer real questions honestly, and test ads and offers without guessing.",
    lessons: [
      {
        title: "Your brand voice and customer profile as a reusable prompt",
        objective: "Write a reusable brand brief that makes AI drafts sound like your business and speak to your real customers.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Why AI drafts sound like everyone else

Ask a general AI assistant to "write a post for my bakery" and you get something cheerful, vague and interchangeable with every other bakery. "Indulge in our delicious treats!" That is because the AI knows nothing about you, so it falls back on the average of everything it has read.

The fix is not a cleverer one-line prompt. It is a short **brand brief**: a page describing who you are, who you serve and how you talk. Write it once, paste it at the top of every marketing request (or save it as custom instructions or a project in tools that offer this), and every draft starts much closer to your voice.

## Part 1: your customer profile

Marketing works when it speaks to a specific person. Describe your best customers, the ones you would happily have more of:

- **Who they are**: for example "busy parents within 20 minutes' drive" or "small firms with no in-house IT".
- **What they want**: the result, not the service. People do not want a boiler service; they want a warm house and no surprise bills.
- **What worries them**: price, reliability, mess, being talked down to, being let down again.
- **What they ask before buying**: the questions you hear every week.
- **Where they find you**: search, a local group, word of mouth, a marketplace.

Use what you actually know from conversations, reviews and enquiries. Do not invent a persona with a made-up name and hobbies. A few true sentences beat a page of guesswork.

## Part 2: your voice

Voice is how you sound. Describe it with contrasts, because single words like "friendly" mean different things to different people:

- Friendly **but not** jokey
- Expert **but not** technical
- Confident **but not** pushy

Then add:

- **Words you use** and **words you never use** (perhaps you say "clients", never "customers", or you hate "bespoke").
- **Two or three real examples** of your writing that you are proud of: a good email, a post that did well, your About page.
- **Facts the AI must not change**: services, areas covered, opening hours, prices or "from" prices, guarantees you really offer.

The facts section matters. It is your guard against the AI inventing an offer or a service you do not provide.

## Build the brief with AI

You can draft the brief yourself, or let AI interview you. The interview approach often works better, because it asks things you would not think to write down.

\`\`\`try
Help me write a one-page brand brief for [YOUR BUSINESS], a [TYPE OF BUSINESS] in [TOWN OR AREA].
Interview me first. Ask me one question at a time, up to 10 questions, about:
- my best customers, what they want and what worries them
- how I want to sound (use "this but not that" contrasts)
- words I use and words I avoid
- facts that must never be changed (services, area, hours, prices, guarantees)
When you have enough, write the brief under these headings: Customers, Voice, Words, Facts, Examples.
Keep it under 400 words. Do not invent any facts I have not given you.
\`\`\`

## Test and tune the brief

A brief is only good if the drafts it produces sound like you. Test it:

1. Paste the brief, then ask for something ordinary, such as a post about your opening hours over a bank holiday.
2. Read it aloud. Would a regular customer believe you wrote it?
3. If not, say what is wrong ("too many exclamation marks", "we would never say treat yourself") and add that to the brief, not just to this one chat.

Each correction you add to the brief improves every future draft. That is a small reinforcing loop in your marketing: better brief, better drafts, less editing, more time to improve the brief.

## Try it now

Run the interview prompt and answer honestly. Then test the brief on one real piece of marketing you need this week.

You are done when you have a saved brand brief under 400 words with all five headings, you have tested it on one draft, and you have added at least one correction to it based on what the first draft got wrong.`,
        microCheck: [
          {
            question: "Why do AI marketing drafts often sound generic when you give a one-line request?",
            options: [
              "The AI knows little about you, so it falls back on the average",
              "AI tools are deliberately set to write in a neutral house style",
              "One-line requests make the AI write shorter and blander posts",
              "Generic wording performs best, so AI tools are trained to use it",
            ],
            correctIndex: 0,
            explanation:
              "Without context the AI fills gaps with typical wording from everything it has read. A brand brief gives it your customers, your voice and your facts, so it has something specific to work with.",
          },
          {
            question: "Why does the lesson suggest describing your voice with contrasts like \"friendly but not jokey\"?",
            options: [
              "Contrasts are the only format that AI assistants can understand",
              "Single words mean different things, so contrasts pin down the tone",
              "Contrasts make the brief longer, which makes the AI write better",
              "Customers expect every business to describe itself in this way",
            ],
            correctIndex: 1,
            explanation:
              "\"Friendly\" could mean warm or could mean full of jokes. Saying what you are and what you are not narrows it down, which is why contrasts work better than single adjectives.",
          },
          {
            question: "An owner creates a customer persona called \"Sarah, 34, loves yoga\" without any evidence. What is the problem?",
            options: [
              "Personas should always be men and women, never just one person",
              "Made-up detail can steer marketing towards customers who don't exist",
              "Personas must include an income figure to be of any use at all",
              "The name is too common for the AI to tell it apart from others",
            ],
            correctIndex: 1,
            explanation:
              "Invented detail feels useful but can pull your marketing away from real customers. A few true sentences from actual conversations and enquiries are a better guide.",
          },
          {
            question: "What is the main job of the \"Facts\" section in a brand brief?",
            options: [
              "To stop the AI inventing services, prices or guarantees you lack",
              "To make the brief look complete when staff read it for the first time",
              "To give the AI enough keywords to rank well in local search results",
              "To record your history so posts can mention how long you have traded",
            ],
            correctIndex: 0,
            explanation:
              "AI can confidently invent offers or services. Listing the facts that must not change gives it a fixed reference and makes wrong claims easier to spot when you check.",
          },
          {
            question: "A draft uses a phrase you would never say. Where should the correction go?",
            options: [
              "Into this one chat, since each draft is different anyway",
              "Into the saved brief, so every future draft improves too",
              "Nowhere, since you can simply edit the phrase out by hand",
              "Into a separate list of banned phrases kept by your staff",
            ],
            correctIndex: 1,
            explanation:
              "Adding the fix to the brief means you never have to make the same correction again. Fixing it only in one chat or by hand leaves the problem waiting in the next draft.",
          },
        ],
      },
      {
        title: "Social posts, emails and newsletters in an hour a week",
        objective: "Plan and draft a month of social posts and one newsletter using a simple content calendar and your brand brief.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## The problem is not writing, it is deciding

Most owners do not struggle to write a post. They struggle to decide what to post, every single day, while doing everything else. That daily decision is what eats the time, and it is why marketing so often stops altogether in busy weeks.

A **content calendar** solves this. You decide once a month what to say and when, then batch the writing. With your brand brief and AI, a month of posts and a newsletter can realistically fit into about an hour a week once you have a routine. The first month will take longer.

## Content that earns attention

Before planning, pick a handful of recurring themes that are useful to your customers and true to your business. For example:

| Theme | What it looks like |
|---|---|
| **Answer a question** | One question customers ask before buying, answered clearly |
| **Behind the scenes** | How you do the work, who does it, what goes into it |
| **Show the result** | A real photo of real work, with the customer's permission |
| **Useful tip** | Something that helps them, even if they never buy |
| **Offer or news** | A seasonal offer, new service or change to hours |

Keep offers to a small share of posts. People follow businesses that are useful or interesting, and tune out ones that only sell.

## Plan the month in one sitting

Once a month, spend twenty minutes planning. Give the AI your brand brief, your themes and what is happening next month.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Plan next month's content for [YOUR BUSINESS]. Next month includes: [EVENTS, SEASONS, OFFERS, NEW SERVICES, CLOSURES].
Our themes are: answer a question, behind the scenes, show the result, useful tip, offer or news.
We post [NUMBER] times a week on [PLATFORMS] and send one email newsletter a month.

Give me a table: date, platform, theme, post idea in one line, photo or video I need to take.
Offers should be no more than one in five posts.
Do not invent events, offers or customer stories. Where you need one, write [NEEDS REAL EXAMPLE].
\`\`\`

The last line matters. AI will happily invent a "customer story" if you let it. Marking the gaps keeps you honest and tells you which real photos or examples to collect.

## Write in batches

Once a week, take that week's rows and draft them together. Batching is faster than writing one post a day because you only switch into "marketing mode" once.

- Paste the brief and the week's rows, and ask for all the posts in one go.
- Ask for platform differences where they matter: shorter for some, more detail for others.
- Read each one against the brief. Check every fact, date and price.
- Add your real photos. Schedule them using the scheduler built into your social platform or a scheduling tool, if you use one.

## The monthly newsletter

Email reaches people who have already chosen to hear from you, which makes it valuable for repeat business. Keep it short: one main story, one useful tip, one clear call to action.

A useful pattern is to let AI turn the month's best-performing posts into the newsletter, rather than starting from nothing. Only email people who have agreed to receive marketing from you, and include an easy way to unsubscribe: marketing email rules in many countries, including the UK and EU, require consent and an opt-out.

## Close the loop

Marketing is a feedback system. Once a month, look at which posts got comments, messages, clicks or bookings, not just likes. Tell the AI what worked when you plan the next month. Over time your calendar learns what your customers respond to.

And remember your business map. If enquiries already outrun your ability to reply or quote, more posts will make the queue longer. Fix the bottleneck first, or plan fewer posts until you can handle more enquiries.

## Try it now

Run the planning prompt for next month. Then draft the first week's posts in one batch, check them against your brief, and fill every [NEEDS REAL EXAMPLE] with something true or drop it.

You are done when you have a month's calendar in a table and one week of checked, ready-to-schedule posts with real photos chosen, and you have noted how long the batch took.`,
        microCheck: [
          {
            question: "According to the lesson, what usually eats the most time in small business social media?",
            options: [
              "Choosing the right platform for each individual post",
              "Deciding what to post, day after day, among other work",
              "Writing captions, which AI now does entirely on its own",
              "Editing photos so that they look professional enough",
            ],
            correctIndex: 1,
            explanation:
              "The daily decision is the hidden cost, which is why marketing stops in busy weeks. A monthly calendar makes the decision once, so the writing becomes a quick batch job.",
          },
          {
            question: "The AI's content plan includes \"a story about a happy customer called Tom\". You have no customer called Tom. What should you do?",
            options: [
              "Keep it, since a story like that is useful for building trust",
              "Change the name so the story sounds more like a real person",
              "Replace it with a true example you have permission to use",
              "Keep it, but post it on a platform with a smaller audience",
            ],
            correctIndex: 2,
            explanation:
              "A made-up customer story is misleading, whatever the name or platform. Use a real example with permission, or drop the post. Asking the AI to mark gaps helps you spot these.",
          },
          {
            question: "Why does the lesson suggest writing a week of posts in one batch?",
            options: [
              "Batching gives the AI more context to copy from past posts",
              "Platforms rank posts higher when they are drafted together",
              "Batching means you switch into marketing mode only once a week",
              "Batched posts need no checking because the style is the same",
            ],
            correctIndex: 2,
            explanation:
              "Switching tasks has a real cost for a busy owner. Doing the week at once is quicker, but every post still needs checking for facts, dates and prices.",
          },
          {
            question: "Which is the most useful measure when reviewing last month's posts?",
            options: [
              "Enquiries, messages or bookings the posts actually led to",
              "The number of likes each post received in its first hour",
              "How many posts went out compared with the month before",
              "Which posts took the least time to write and schedule",
            ],
            correctIndex: 0,
            explanation:
              "Likes are easy to count but do not pay bills. Enquiries and bookings show which themes move people along the customer journey, which is what the next plan should repeat.",
          },
          {
            question: "An owner's business map shows quotes already take ten days. What does that mean for the content calendar?",
            options: [
              "Post more often, so there are more enquiries to choose from",
              "Keep posting volume steady and fix the quoting step first",
              "Stop all marketing permanently until the business is quieter",
              "Switch every post to offers, so enquiries become quick sales",
            ],
            correctIndex: 1,
            explanation:
              "More posts would feed more enquiries into a queue that is already too long. Relieving the quoting bottleneck first means extra marketing turns into sales rather than frustration.",
          },
        ],
      },
      {
        title: "Local search and your website",
        objective: "Improve your local listing, FAQs and service pages so they answer real customer questions honestly.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## How local customers find you

When someone searches "electrician near me" or "hair salon [town]", the results usually show a map with local business listings before the ordinary web pages. For many small businesses that listing, for example a Google Business Profile, is seen by more people than the website. Other platforms, such as Apple Maps, Bing Places and review sites, have their own listings too.

Search engines try to show the most relevant, trustworthy and nearby results. Nobody outside the search companies knows exactly how ranking works, and it changes. What is stable is this: complete, accurate, helpful information that answers what searchers want tends to serve you well. That is also exactly what customers want, so it is worth doing either way.

## Your listing: complete, accurate, active

Check your listing against this list:

- **Name, address, phone, hours** exactly right, and the same everywhere they appear online.
- **Categories and services** that match what you actually do.
- **Description** written for customers, not stuffed with search phrases.
- **Real photos** of your premises, team and work, added regularly.
- **Posts or updates** for offers, events and news, where the platform supports them.
- **Questions and answers**, where available, covering common questions.
- **Reviews** answered (Module 3 covers this).

AI can help write the description, posts and answers. It cannot know your hours, prices or service area, so those must come from you. Check each platform's current features and rules, since they change.

## Keyword stuffing: why not to

Keyword stuffing means cramming search phrases into text: "Best plumber Leeds, emergency plumber Leeds, cheap plumber Leeds". It reads badly, customers notice, and search engines' published guidelines treat it as spam. Putting search phrases in your business name when they are not part of your real name can also break listing rules.

Write naturally. Say what you do and where you do it, once, clearly. If someone reading it aloud would wince, rewrite it.

## FAQs from real questions

Your best FAQ material is already in your inbox. The questions customers ask before buying are the ones other people are searching for. A good FAQ page saves you answering the same thing repeatedly and reassures people before they get in touch.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Here are questions customers have asked us recently (names removed):
[PASTE 10 TO 20 REAL QUESTIONS]

Group similar questions and write an FAQ of 8 to 12 entries for our website.
Each answer: 2 to 4 sentences, plain English, in our voice.
Use only facts from the brief or the questions. Where you need a fact I have not given (a price, a time, a policy), write [CHECK: what is needed] instead of guessing.
\`\`\`

Every [CHECK] is something you must fill in with the truth before publishing. Never let a guessed price or policy go live.

## Service pages that answer the searcher

A searcher who lands on your "boiler servicing" page wants to know: do you do it, where, roughly what it costs or how pricing works, how soon, and why they should trust you. A good service page answers those in order and ends with one clear next step.

A simple structure: what the service is and who it is for; what is included; area covered; how pricing works; what happens next; real reviews or real photos; how to book.

Ask AI to draft a page from your brief using that structure, then check every claim. "Fully insured", "qualified" or "accredited" must be true and, where it matters, specific. If you say you are registered with a trade scheme, you must be.

## Try it now

Pick one: your local listing description, your FAQ page, or your main service page. Use the FAQ prompt above, or adapt it for the listing or service page.

You are done when the new text is live (or ready to publish), every [CHECK] has been replaced with a true fact, no search phrase is repeated unnaturally, and you have checked that your name, address, phone and hours match across your listing and website.`,
        microCheck: [
          {
            question: "What is the most reliable approach to local search for a small business?",
            options: [
              "Repeat search phrases often so the listing ranks higher",
              "Keep information complete, accurate and genuinely helpful",
              "Change the business name to include the service and town",
              "Post several times a day to show search engines activity",
            ],
            correctIndex: 1,
            explanation:
              "Nobody outside search companies knows the exact ranking rules, but accurate, helpful information serves customers and search engines alike. Stuffing phrases or renaming the business can break listing rules.",
          },
          {
            question: "An AI-drafted FAQ says \"call-outs are free within 10 miles\". You charge for call-outs. What went wrong?",
            options: [
              "The prompt was too short, so the AI ran out of useful ideas",
              "The AI guessed a policy instead of flagging a missing fact",
              "The brief used the wrong tone of voice for an FAQ page",
              "The FAQ had too many entries for the AI to keep them all right",
            ],
            correctIndex: 1,
            explanation:
              "AI fills gaps with plausible guesses. Asking it to write [CHECK] where a fact is missing, and filling each one yourself, stops invented policies from going live.",
          },
          {
            question: "Where does the lesson suggest finding the questions for your FAQ page?",
            options: [
              "From enquiries and messages customers have actually sent you",
              "From a list of popular search phrases for your type of business",
              "From an AI tool asked to guess what customers might want to know",
              "From the FAQ pages of the biggest competitors in your sector",
            ],
            correctIndex: 0,
            explanation:
              "Real questions from real customers are what other people are searching for too. They also mean the FAQ saves you time on the questions you actually get asked.",
          },
          {
            question: "A service page draft says \"fully accredited\". You are insured but belong to no accreditation scheme. What should you do?",
            options: [
              "Keep it, as insurance and accreditation mean roughly the same",
              "Keep it, as long as the page also mentions your insurance",
              "Change it to state only what is true, such as being insured",
              "Move it to the bottom of the page where fewer people will read it",
            ],
            correctIndex: 2,
            explanation:
              "Claims about qualifications and accreditation must be true. Saying you are accredited when you are not misleads customers, wherever on the page it appears.",
          },
        ],
      },
      {
        title: "Ads and offers: write, test, read the results",
        objective: "Write two versions of an ad or offer, test them fairly, and decide from the results rather than a hunch.",
        durationMinutes: 27,
        contentType: "article",
        bodyMd: `## Start with the offer, not the words

An ad is only as good as what it offers. Before writing anything, be clear on four things:

- **Who** it is for (from your brand brief).
- **What** they get, and why it matters to them.
- **Why now**: a season, a deadline, limited availability, or simply a reason to act.
- **What next**: one action, such as book, call, message or visit.

The offer must be one you can deliver. If your business map shows a bottleneck, an ad that brings fifty enquiries in a week could swamp it. Match the size of the push to what you can handle, or aim the offer at your quieter times.

## Writing ads with AI

AI is good at producing variations quickly. The job is to give it the facts and constraints, then choose.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Write ad copy for [PLATFORM, e.g. a social media ad, a search ad, a local newspaper, a leaflet].
Offer: [EXACTLY WHAT IS OFFERED, PRICE, DATES, CONDITIONS].
Audience: [WHO, FROM THE BRIEF].
Action: [BOOK / CALL / MESSAGE / VISIT].

Give me two versions that differ in ONE thing only: the main message.
Version A leads with [e.g. saving time]. Version B leads with [e.g. peace of mind].
Keep everything else the same: same offer, same action, same length.
Use only facts I have given. No claims like "best" or "guaranteed" unless I have said they are true.
\`\`\`

Check the platform's current rules on ad length, content and restricted topics before you publish. Some sectors, such as health treatments, finance or alcohol, have extra advertising rules.

## Honest offers only

Advertising rules in most countries say ads must not mislead. In practice that means:

- **A "sale" must be real.** Do not show a "was" price you never really charged.
- **Conditions must be clear.** If the offer is for new customers only, or ends on a date, say so.
- **Urgency must be true.** "Only 3 left" or "ends Friday" must be accurate.
- **Results must be realistic.** Do not promise outcomes you cannot guarantee.

AI will write false urgency happily if you ask for "urgent" copy. You are responsible for it.

## Testing two versions fairly

Testing two versions against each other is often called an **A/B test**. The idea is simple: change one thing, keep everything else the same, and see which does better. Many ad platforms have built-in tools for this; check what yours offers.

For a fair test:

- **Change one thing.** If you change the headline, image and offer at once, you will not know which one made the difference.
- **Decide the measure first.** Bookings or enquiries are better than clicks, and clicks are better than views.
- **Give it enough time and budget.** A handful of clicks can swing either way by chance. If each version only gets a few responses, treat the result as a hint, not a verdict.
- **Run them at the same time.** Otherwise a bank holiday or a rainy week could be the real cause.

Even without an ad budget you can test: two versions of a leaflet with different offer codes, or two email subject lines sent to halves of your list.

## Reading the results

When the test ends, paste the numbers into AI and ask it to explain them plainly. Ask it to be cautious.

\`\`\`try
I ran two versions of an ad for [YOUR BUSINESS] for [NUMBER] days at the same time.
Version A (leads with [MESSAGE A]): [VIEWS] views, [CLICKS] clicks, [ENQUIRIES OR BOOKINGS] enquiries or bookings, cost [AMOUNT].
Version B (leads with [MESSAGE B]): [VIEWS] views, [CLICKS] clicks, [ENQUIRIES OR BOOKINGS] enquiries or bookings, cost [AMOUNT].

Work out the cost per enquiry for each. Tell me which did better on enquiries, and whether the numbers are big enough to trust or could easily be chance.
Suggest one single change to test next. Do not overstate the result.
\`\`\`

Check the arithmetic yourself. AI can make calculation errors, and a wrong cost per enquiry could send your budget the wrong way.

## Try it now

Pick one offer you could run in the next month. Use the first prompt to write two versions that differ in one thing only. Check both against the honest-offers list.

You are done when you have two checked versions, a written note of the one thing that differs, the measure you will judge them on (enquiries or bookings, not likes), and a start and end date for running them side by side.`,
        microCheck: [
          {
            question: "You test two ads but change the headline, image and price at once. Version B wins. What can you conclude?",
            options: [
              "The new headline was the main reason that B did better",
              "You cannot tell which of the changes made B do better",
              "The lower price was the reason, as price always matters most",
              "Version B will keep winning in every future campaign",
            ],
            correctIndex: 1,
            explanation:
              "Changing several things at once means the result cannot be pinned to any one of them. A fair test changes one thing and keeps the rest the same.",
          },
          {
            question: "An AI draft says \"Only 2 slots left this week!\" but you have plenty of space. What should you do?",
            options: [
              "Keep it, since urgency is a normal part of good advertising",
              "Keep it, but change the number to make it more believable",
              "Remove it, since false urgency misleads the people reading it",
              "Keep it, but only use it in paid ads rather than free posts",
            ],
            correctIndex: 2,
            explanation:
              "Urgency claims must be true. Invented scarcity misleads customers and can break advertising rules, however common it is or wherever it appears.",
          },
          {
            question: "Version A got 3 bookings and version B got 2, each from a small number of clicks. What is the sensible reading?",
            options: [
              "A is clearly better, so switch the whole budget to it now",
              "B is better value, since fewer bookings means lower costs",
              "It is a hint at most, as small numbers can swing by chance",
              "The test failed, so neither version should ever be run again",
            ],
            correctIndex: 2,
            explanation:
              "With so few responses, one or two bookings either way could be luck. Treat it as a hint, run longer or with more budget, and avoid big decisions on tiny numbers.",
          },
          {
            question: "Why might a successful ad be bad news for a business with a slow quoting step?",
            options: [
              "Ads that work too well are often penalised by the platforms",
              "Extra enquiries pile up at the bottleneck and customers give up",
              "Customers who respond to ads tend to spend less than others",
              "Successful ads always cost more money than unsuccessful ones",
            ],
            correctIndex: 1,
            explanation:
              "More enquiries only help if the business can handle them. If quoting is the bottleneck, the queue grows and customers drift away, so match the push to your capacity.",
          },
          {
            question: "Which measure is best for judging which ad version won?",
            options: [
              "Enquiries or bookings, decided before the test has begun",
              "Likes and shares, since they show which ad people enjoy most",
              "Views, since the ad seen most will bring in most sales",
              "Whichever measure makes the preferred version look best",
            ],
            correctIndex: 0,
            explanation:
              "Enquiries and bookings are closest to what the business needs. Choosing the measure in advance stops you picking whichever number flatters the version you already liked.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A salon owner's AI posts all sound like \"Pamper yourself today!\", which they would never say. What is the best fix?",
        options: [
          "Write a brand brief with voice, banned words and real examples",
          "Switch to a different AI tool that writes in a much better style",
          "Stop using AI and write every post by hand from now on",
          "Add more emojis so the posts sound friendlier and less formal",
        ],
        correctIndex: 0,
        explanation:
          "Generic drafts come from missing context, not the wrong tool. A brief with voice contrasts, words to avoid and real examples gives the AI your style to copy.",
      },
      {
        question: "Why should the brand brief include a \"Facts\" section listing services, area and prices?",
        options: [
          "It stops the AI inventing offers and makes errors easier to spot",
          "It helps the AI choose keywords for better local search rankings",
          "It is a legal requirement for any business that uses AI tools",
          "It makes the brief long enough for the AI to take it seriously",
        ],
        correctIndex: 0,
        explanation:
          "AI can confidently invent services or prices. A fixed list of true facts gives it a reference and gives you something to check drafts against.",
      },
      {
        question: "An owner's content plan has an offer in every post. What is the likely problem?",
        options: [
          "Followers tune out businesses that only ever try to sell",
          "Platforms do not allow businesses to post offers every day",
          "Offers are illegal unless they run for at least one month",
          "AI tools cannot write more than a few offers in each month",
        ],
        correctIndex: 0,
        explanation:
          "People follow businesses that are useful or interesting. Mixing in answers, tips and behind-the-scenes posts keeps attention, so offers land better when they appear.",
      },
      {
        question: "You want to send your monthly newsletter to everyone who has ever emailed you. What should you check first?",
        options: [
          "That they agreed to receive marketing and can easily unsubscribe",
          "That the newsletter is short enough to read easily on a mobile phone",
          "That the AI tool you used is allowed to write marketing emails",
          "That the list is large enough to be worth sending a newsletter",
        ],
        correctIndex: 0,
        explanation:
          "Marketing email rules in many countries, including the UK and EU, require consent and an opt-out. Emailing someone does not by itself mean they agreed to your newsletter.",
      },
      {
        question: "An AI rewrite of your listing says \"Cheap plumber Leeds, emergency plumber Leeds, best plumber Leeds\". What is wrong?",
        options: [
          "It is keyword stuffing, which reads badly and is treated as spam",
          "It mentions Leeds too few times to rank well in the local searches",
          "It should list more services so that it matches more searches",
          "It is fine for a listing, though it would be wrong on a website",
        ],
        correctIndex: 0,
        explanation:
          "Cramming search phrases reads badly to customers and search engine guidelines treat it as spam. Say what you do and where, once and naturally.",
      },
      {
        question: "An AI-drafted FAQ answer includes a cancellation policy you have never had. How could the prompt have prevented this?",
        options: [
          "By asking the AI to write [CHECK] where a fact was missing",
          "By asking the AI to make the answers shorter and simpler",
          "By asking for more FAQ entries so the error was diluted",
          "By asking the AI to copy the policy of a larger business",
        ],
        correctIndex: 0,
        explanation:
          "AI fills gaps with plausible guesses. Telling it to flag missing facts instead of guessing, then filling each flag with the truth, keeps invented policies off your site.",
      },
      {
        question: "Your service page says \"fully qualified team\". One of your three staff is still training. What should you do?",
        options: [
          "Keep the wording, since most of the team is fully qualified",
          "Keep it, but remove the trainee's photo from the team page",
          "Reword it so every claim on the page is accurate and true",
          "Keep it, since customers rarely ask about qualifications",
        ],
        correctIndex: 2,
        explanation:
          "Claims about qualifications must be true for everyone they describe. Rewording to something accurate, such as naming qualified staff, avoids misleading customers.",
      },
      {
        question: "Your ad \"was £80, now £50\" but you have never charged £80. Why is this a problem?",
        options: [
          "Showing a \"was\" price you never charged is misleading",
          "Discounts over a third are banned on most ad platforms",
          "Customers distrust any discount that ends in a zero",
          "AI tools are not allowed to write prices into ads",
        ],
        correctIndex: 0,
        explanation:
          "A fake reference price makes the saving look bigger than it is, which misleads customers and breaks advertising rules in many places. Only show a \"was\" price you genuinely charged.",
      },
      {
        question: "Which A/B test is set up most fairly?",
        options: [
          "Two headlines, same image and offer, run in the same week",
          "Two headlines, run one month after the other on one budget",
          "Two different offers with new images and a new call to action",
          "One ad run twice, to see whether results come out the same",
        ],
        correctIndex: 0,
        explanation:
          "A fair test changes one thing and runs both versions at the same time. Running them in different months lets season or weather explain the difference instead.",
      },
      {
        question: "An AI works out that version A costs £12 per enquiry and B costs £9. What should you do before shifting budget?",
        options: [
          "Check the arithmetic and whether the numbers are big enough",
          "Shift the whole budget straight away, since B is cheaper",
          "Ask the AI to write a third version that combines both",
          "Stop both ads, since neither result is perfectly certain",
        ],
        correctIndex: 0,
        explanation:
          "AI can make calculation errors, and small numbers can swing by chance. A quick check of both protects your budget before you act on the result.",
      },
      {
        question: "A café's ads bring more customers than staff can serve at lunch, and queues put people off. What does the systems view suggest?",
        options: [
          "Aim offers at quieter times, or fix lunchtime service first",
          "Increase the ad budget so more customers keep arriving",
          "Stop all advertising and rely only on word of mouth",
          "Switch the ads to a different platform with less reach",
        ],
        correctIndex: 0,
        explanation:
          "Lunchtime service is the bottleneck, so more demand there just grows the queue. Shifting demand to quiet times or relieving the bottleneck turns marketing into sales.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 3
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Winning and Keeping Customers",
    summary:
      "Reply to enquiries quickly without losing the personal touch, write quotes and follow-ups that close, ask for and answer reviews properly, and keep customers coming back, including when something goes wrong.",
    lessons: [
      {
        title: "Answering enquiries fast",
        objective: "Build a set of enquiry replies and decide where AI chat, if any, fits with a clear human handoff.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## Speed is part of the service

When someone gets in touch, they are often contacting other businesses at the same time. The one that replies first with a clear, helpful answer has a real advantage. For many small businesses, the enquiry step is where the most customers quietly drop out, not because the reply was bad but because it came too late.

Look at your business map. If enquiries wait hours or days for a reply, this is likely your bottleneck, and speeding it up pays more than almost anything else in this course.

## Layer 1: templates for the common questions

Most enquiries are variations on a few themes: price, availability, what is included, area covered, how to book. Write a strong reply for each once, and you can answer most enquiries in a minute or two.

Start from real enquiries. Remove names and contact details first.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Here are 10 to 20 recent enquiries we received, with personal details removed:
[PASTE ENQUIRIES]

1. Group them into the 5 to 8 most common types.
2. For each type, write a reply template in our voice: warm, clear, under 120 words, ending with one next step (book, call, send photos, choose a time).
3. Use [BRACKETS] for anything that changes per customer, such as [NAME], [DATE], [PRICE].
4. Where you need a fact I have not given, write [CHECK: what is needed] instead of guessing.
\`\`\`

Save the finished templates somewhere you can reach from your phone, such as your email tool's saved replies or a notes app. Each reply still gets a quick personal touch: use their name, mention what they asked about.

## Layer 2: AI drafting for the unusual ones

Some enquiries do not fit a template: a detailed brief, a tricky request, a long message. Paste the enquiry (without contact details) plus your brand brief into your assistant and ask for a draft reply. Check facts, prices and promises before sending, as in your guardrails from Module 1.

Many email and messaging tools now have built-in AI that can suggest replies. Check what yours offers and what it does with your messages.

## Layer 3: AI chat on your website, with a way out

AI chat assistants on websites can answer common questions at any hour. Several website builders, booking systems and specialist tools offer them; check current features and costs. They can help, but only if they are set up with care:

- **Feed it your real information**: FAQs, services, hours, area, booking process. It should answer only from that.
- **Say it is an AI.** Customers should know they are not talking to a person. Some rules require this.
- **A clear human handoff.** It must be easy to reach a person: "Would you like someone from the team to get back to you?" with a form or number, and a real reply within a stated time.
- **Hand off anything sensitive**: complaints, prices for unusual jobs, health questions, anything it is unsure of.
- **Test it hard before launch.** Ask it awkward questions. See if it invents prices or policies. Keep testing after launch.
- **Read the conversations** regularly, to spot wrong answers and new questions for your FAQ.

A badly set-up chatbot can be worse than none: a customer who gets a wrong price or gets stuck in a loop may not come back. For many small businesses, fast templated replies from a real person are the better first step.

## Watch the whole system

Faster replies mean more enquiries move on to the next step: quotes and bookings. If that step is slow, the queue just moves there. Keep an eye on what happens after you speed up replies; the next lesson tackles quotes.

## Try it now

Run the template prompt with your real enquiries. Fill every [CHECK] with a true fact and save the templates where you can use them.

You are done when you have at least five saved reply templates, each ending with one clear next step, and you have used one on a real enquiry. Note on your business map how long enquiries now wait for a reply.`,
        microCheck: [
          {
            question: "Why can the enquiry step be the bottleneck even when your replies are well written?",
            options: [
              "Customers contact several businesses and slow replies lose them",
              "Well-written replies take longer for customers to read and act on",
              "Search engines rank businesses lower when their replies are long",
              "Customers prefer short replies, so quality makes little difference",
            ],
            correctIndex: 0,
            explanation:
              "Many customers ask several businesses at once, so timing matters as much as quality. A great reply sent two days later often arrives after they have already booked elsewhere.",
          },
          {
            question: "What is the main purpose of [BRACKETS] in an enquiry reply template?",
            options: [
              "To show the AI which parts of the reply matter most to customers",
              "To mark details that change for each customer, such as name or date",
              "To hide the parts of the reply that were written by the AI tool",
              "To make the template look more formal and professional to readers",
            ],
            correctIndex: 1,
            explanation:
              "Brackets mark what must be filled in each time, so nothing generic or wrong is sent. Checking every bracket is filled before sending is part of the routine.",
          },
          {
            question: "Your website chatbot is asked about a complaint. What should it do?",
            options: [
              "Answer as fully as it can so the customer does not need to wait",
              "Offer a discount straight away to calm the customer down quickly",
              "Pass it to a person, with a clear way to reach one and a timescale",
              "Explain the company policy and then close the conversation politely",
            ],
            correctIndex: 2,
            explanation:
              "Complaints need human judgement and care. A good chatbot recognises sensitive topics and hands off to a person, rather than improvising answers or offers.",
          },
          {
            question: "Which is a sign a website AI chat has been set up responsibly?",
            options: [
              "It uses a human name and photo so customers feel more at ease",
              "It answers every question, including ones outside its information",
              "It says it is an AI and offers an easy route to a real person",
              "It is switched on at launch and then left to run without checks",
            ],
            correctIndex: 2,
            explanation:
              "Customers should know they are talking to an AI and be able to reach a person easily. Pretending to be human or answering beyond its information misleads customers.",
          },
          {
            question: "After templates cut reply times, quotes start piling up. What does this show?",
            options: [
              "The templates were a mistake and should be switched off again",
              "The bottleneck has moved on to the quoting step, which is next",
              "Customers are asking for too many quotes and should be filtered",
              "Quotes have become slower because staff are busy with templates",
            ],
            correctIndex: 1,
            explanation:
              "Relieving one bottleneck usually reveals the next. That is progress, and a sign to turn attention to the quoting step rather than undo the improvement.",
          },
        ],
      },
      {
        title: "Quotes, proposals and follow-ups that close",
        objective: "Produce a quote or proposal template and a follow-up sequence that respects the customer and wins more work.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## Why good quotes still lose

Plenty of good businesses lose work they should have won. Common reasons: the quote arrived late, it was unclear what was included, it listed tasks but not results, or nobody followed up when the customer went quiet. None of these is about price or quality. All of them are fixable.

On many business maps, the quote step is where time and money leak most: it takes the owner hours in the evening, customers wait, and quotes that go quiet are simply forgotten.

## What a clear quote contains

A quote or proposal should let the customer say yes without a phone call. Check yours has:

- **Their problem in their words**: shows you listened.
- **What you will do**, in plain language.
- **What is included and what is not**: the main source of later disputes.
- **Price**, with how it is worked out, and any options.
- **Timescale**: when you can start, how long it takes.
- **Why you**: real reviews, real photos of similar jobs, relevant qualifications.
- **Terms**: deposit, payment, validity period, cancellation.
- **Next step**: exactly how to accept.

Options can help. A choice of two or three levels, such as standard and premium, lets people choose how to buy from you rather than whether to. Only offer options you are genuinely happy to deliver.

## From notes to quote with AI

Many owners have the details in their head or a scrappy note after a site visit or a call. AI is good at turning notes into a clean quote. You supply every price and fact.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Turn my notes into a clear quote for a customer. Use these headings: Your needs, What we will do, Included, Not included, Price, Timescale, Why us, Terms, How to accept.

My notes: [PASTE YOUR NOTES FROM THE CALL OR VISIT, NO CONTACT DETAILS]
Prices: [YOUR PRICES, EXACTLY]
Terms: [DEPOSIT, PAYMENT, HOW LONG THE QUOTE IS VALID]

Use only the prices and facts I have given. Write [CHECK: what is needed] for anything missing.
Plain English, under 400 words, in our voice.
\`\`\`

Check every price, date and inclusion. A quote is a commitment: in many places an accepted quote can form a contract, so a wrong figure can be costly. Once you are happy with a few, save the structure as your quote template, ideally in whatever quoting, invoicing or document tool you already use.

## Following up without nagging

Many customers who go quiet have not said no. They are busy, comparing, or waiting for a partner's opinion. A polite follow-up is service, not pestering. A simple sequence:

| When | Purpose | Example angle |
|---|---|---|
| 2 to 3 days | Check it arrived and offer to answer questions | "Happy to talk through any part of it" |
| About a week | Add something useful | A relevant tip, photo of a similar job, or an answer to a common worry |
| Before it expires | Close the loop politely | "The quote is valid until [DATE]. Shall I hold the slot, or leave it for now?" |

Then stop. Three polite contacts is plenty for most situations. Pressure tactics, such as false deadlines or invented demand, break the honesty rules from Module 1 and damage trust.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Write three short follow-up messages for a customer who received a quote for [SERVICE] on [DATE] and has not replied.
1. After 3 days: check it arrived, offer to answer questions.
2. After a week: add one useful thing, such as [A TIP, A PHOTO OF A SIMILAR JOB, AN ANSWER TO A COMMON WORRY].
3. Before the quote expires on [DATE]: polite final check, easy to say no.
Each under 80 words. Friendly, no pressure, no false urgency.
\`\`\`

## Learn from lost quotes

When someone says no, ask briefly why, if it feels appropriate. Price, timing, trust or fit? Over months, those answers tell you what to change. This is a feedback loop: without it, you keep making the same quote and wondering why it loses.

## Try it now

Take your last real quote or one you need to send this week. Run the quote prompt with your notes and prices, check every figure, and send it. Then set up the three follow-ups for it.

You are done when you have a checked quote template, three follow-up messages saved and scheduled (or diarised), and a note of the date each will go out.`,
        microCheck: [
          {
            question: "A customer disputes a job because they thought tidying up was included. Which part of the quote would have prevented this?",
            options: [
              "A \"Why us\" section with more photos of similar finished jobs",
              "A clear list of what is included and what is not included",
              "A shorter quote, so that the customer read it all the way through",
              "A lower price, so that the customer did not look for extras",
            ],
            correctIndex: 1,
            explanation:
              "Unclear inclusions are a common source of disputes. Stating what is and is not included sets expectations before the work starts, when they are easiest to agree.",
          },
          {
            question: "You ask AI to turn your site-visit notes into a quote. Where should the prices come from?",
            options: [
              "From the AI's estimate of typical prices for that service locally",
              "From you, exactly as you set them, with gaps flagged for checking",
              "From an average of the AI's suggestion and your own rough guess",
              "From the last quote you sent, whatever the size of the new job",
            ],
            correctIndex: 1,
            explanation:
              "A quote can become a commitment, so every price must be yours. AI estimates can be out of date or simply wrong, and flagging gaps stops guesses slipping through.",
          },
          {
            question: "A customer has not replied to a quote for five days. What is the most useful view of this?",
            options: [
              "They have said no, so move on and never contact them about it again",
              "They may be busy or comparing, so a polite follow-up is helpful",
              "They need pressure, so tell them the price rises tomorrow",
              "They are waiting for a discount, so offer one without asking",
            ],
            correctIndex: 1,
            explanation:
              "Silence rarely means a firm no. A polite follow-up offering help is good service. False deadlines mislead, and discounting unprompted gives margin away needlessly.",
          },
          {
            question: "Why does the lesson suggest asking customers why they turned a quote down?",
            options: [
              "To persuade them to change their mind during the same conversation",
              "It creates a feedback loop that shows what to change in future quotes",
              "Customers expect to be asked, and are annoyed if they are not asked",
              "It gives you a reason to follow up with them again the next month",
            ],
            correctIndex: 1,
            explanation:
              "Reasons for lost quotes are feedback. Without them you keep sending the same quote and guessing; with them you can fix price, timing, trust or fit.",
          },
        ],
      },
      {
        title: "Reviews: asking properly, replying well",
        objective: "Ask happy customers for reviews within the rules and write honest, helpful replies to good and bad reviews.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Reviews are a reinforcing loop

Reviews are one of the clearest reinforcing loops in a small business. Happy customers leave reviews, reviews help strangers trust you, those strangers become customers, and some of them leave reviews. The loop also works in reverse: few reviews, or unanswered bad ones, make new customers hesitate.

Most happy customers never leave a review, simply because nobody asked. That is the cheapest leak to fix on your business map.

## The rules: what you must not do

Review rules come from two places: consumer protection law, which in many countries (including the UK) bans fake reviews and misleading review practices, and each review platform's own policies. Check the current rules for your country and the platforms you use. The safe principles are:

- **No fake reviews.** Never write reviews yourself, have staff or friends pose as customers, or use AI to generate them. Never buy them.
- **No cherry-picking who you ask.** Some platforms prohibit asking only customers you expect to be happy (sometimes called review gating). Ask customers in general, not just the ones you think will be positive.
- **Be careful with incentives.** Many platforms ban offering discounts, gifts or prize draws in exchange for reviews. Where incentives are allowed at all, they usually must not depend on the review being positive and must be disclosed. The simplest approach is not to offer them.
- **Do not hide or suppress genuine negative reviews**, or pressure customers to change them.
- **Do not post AI-generated "testimonials"** on your website or ads as if they were real customer words.

## Asking properly

A good request is short, personal, well timed and easy to act on. Ask soon after the job is done or the purchase arrives, while the experience is fresh.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Write a short message asking a customer to leave a review of [YOUR BUSINESS] on [PLATFORM], sent [WHEN, e.g. the day after the job].
- Under 60 words, warm and personal, uses [NAME] and mentions [WHAT WE DID FOR THEM].
- Asks for an honest review, not a good one.
- Includes [REVIEW LINK].
- No incentives of any kind.
Give me one version for text message and one for email.
\`\`\`

Make asking a routine step in your customer journey, such as part of your job completion or dispatch process, not something you remember now and then.

## Replying to reviews

Replies are read by future customers as much as by the reviewer. They show how you treat people.

**For positive reviews**: thank them by name, mention something specific from their review, keep it short. Avoid copying the same reply onto every review; people notice.

**For negative reviews**: this is where AI helps most, because it helps you write calmly when you do not feel calm. A good reply:

- Thanks them and acknowledges their experience without arguing.
- Apologises for what went wrong, where something did.
- Corrects facts politely, only if needed, without blame.
- Offers to sort it out offline, with a name and a way to get in touch.
- Never shares private details about the customer or their job.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Here is a review we received: [PASTE REVIEW, REMOVE THE REVIEWER'S SURNAME AND ANY PERSONAL DETAILS]
Here is what actually happened from our side: [THE FACTS, BRIEFLY]

Write a public reply under 100 words. Calm, polite, not defensive. Acknowledge their experience, apologise for anything we got wrong, and invite them to contact [NAME] on [CONTACT METHOD] to put it right.
Do not reveal any private details about the customer or the job. Do not argue or blame.
\`\`\`

Read it before posting. Would you be comfortable if the reviewer, a future customer and a journalist all read it? If the review makes false claims or breaks platform rules, use the platform's reporting process rather than fighting it in public.

## Try it now

Write your review request using the first prompt, and decide exactly when in your customer journey it will be sent. Then reply to your three most recent unanswered reviews (or, if you have none, practise on a realistic example you write yourself, and do not post it).

You are done when your request message is saved, the point in the journey where it goes out is marked on your business map, and three replies are written and checked.`,
        microCheck: [
          {
            question: "A friend offers to post a few five-star reviews to help your new business. What should you do?",
            options: [
              "Accept, as long as they have visited your business at least once",
              "Decline, since reviews must come from genuine customer experiences",
              "Accept, but ask them to write about services you really provide",
              "Accept, but only on platforms that do not verify their reviewers",
            ],
            correctIndex: 1,
            explanation:
              "Reviews posed as genuine customer experiences when they are not are fake, whatever the service described. Fake reviews are banned in many countries and by platform rules.",
          },
          {
            question: "An owner sends review requests only to customers who said they were delighted. What is the risk?",
            options: [
              "It is selective asking, which some platforms ban as review gating",
              "Delighted customers are less likely to leave any review at all",
              "It is fine, since you are allowed to choose who you contact",
              "The reviews will be too similar and read as though they are fake",
            ],
            correctIndex: 0,
            explanation:
              "Asking only people you expect to be positive gives a misleading picture and is against some platforms' rules. Asking customers in general keeps your reviews honest.",
          },
          {
            question: "You plan to offer 10% off the next visit for every review. What should you check first?",
            options: [
              "Whether 10% is a big enough discount to encourage people to act",
              "Whether the platform and local rules allow any review incentive",
              "Whether the discount can be limited to four and five star reviews",
              "Whether customers will think the offer is too generous to be real",
            ],
            correctIndex: 1,
            explanation:
              "Many platforms ban incentives for reviews, and a discount only for good reviews would be misleading. The simplest approach is to ask without offering anything.",
          },
          {
            question: "An AI draft reply to a bad review mentions the customer's address and the cost of their job. What is wrong?",
            options: [
              "Nothing, since the details prove the business is telling the truth",
              "It is too short to deal with the complaint in enough detail",
              "It shares private details publicly, which it should never do",
              "It should also mention the customer's full name for clarity",
            ],
            correctIndex: 2,
            explanation:
              "Public replies must never reveal private details about the customer or their job. Offer to take the conversation offline instead, where details can be discussed properly.",
          },
          {
            question: "Why does the lesson call reviews a reinforcing loop?",
            options: [
              "Each good review makes the next review longer and more detailed",
              "Reviews bring customers who leave more reviews, so it compounds",
              "Platforms show more reviews to businesses that pay to advertise",
              "Bad reviews are always balanced out by good ones over time",
            ],
            correctIndex: 1,
            explanation:
              "In a reinforcing loop, each turn strengthens the next. Reviews bring trust, trust brings customers, customers bring reviews. The same loop can also run downwards.",
          },
        ],
      },
      {
        title: "Keeping customers: win-back, loyalty and complaints",
        objective: "Design a simple plan to bring lapsed customers back, reward loyalty and handle complaints well.",
        durationMinutes: 28,
        contentType: "article",
        bodyMd: `## The customers you already have

Winning a new customer takes marketing, enquiries, quotes and trust. A past customer already knows you. That is why the last step of your business map, return and refer, deserves as much attention as the first. It is also where the biggest reinforcing loops live: regulars spend again, recommend you and leave reviews.

Yet many small businesses do nothing between visits. Customers drift away not because they were unhappy, but because they forgot, or someone else reached them first.

## Win-back: people who have gone quiet

Start by working out who has lapsed. What counts as lapsed depends on your business: a hairdresser might look at clients not seen in three months, a boiler engineer at customers due an annual service, a shop at buyers who have not ordered in a year.

Your booking system, till, online shop or accounts software may be able to list these; check what it can export. You do not need to paste the list into an AI tool. Use AI to write the message, then send it through your normal system to the people who have agreed to hear from you.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

Write a short win-back message for customers of [YOUR BUSINESS] who last [BOUGHT OR VISITED] more than [TIME PERIOD] ago.
- Under 80 words, warm, no guilt-tripping.
- Give a genuine reason to come back: [e.g. a seasonal reminder, a new service, their annual service is due].
- One clear next step: [BOOK / REPLY / VISIT].
- Include [NAME] and an easy way to opt out of future messages.
Give me two versions: one reminder-led, one news-led.
\`\`\`

Rules on marketing messages apply here too: only contact people who agreed to hear from you, and always offer an opt-out. A genuine service reminder (for example, a boiler service due) may be treated differently from marketing in some places; check the rules that apply to you.

## Loyalty without complication

Loyalty schemes do not have to be clever. What matters is that regulars feel noticed. Options that suit a small business:

- **Remembering them**: preferences, last order, the name of their dog. Your booking or customer system can hold notes, stored with the same care as any personal data.
- **A simple reward**: for example every tenth coffee or a thank-you after a set number of visits. Many till and booking systems include this; check features and cost.
- **First access**: new services, limited stock or popular slots offered to regulars first.
- **A personal thank-you**: a short note after a big job or a year as a customer.

Ask AI to suggest options that fit your margins and customers, then pick one you can run consistently. A scheme you forget to honour does more harm than no scheme at all.

## Complaints: the moment of truth

A complaint handled well can leave a customer more loyal than before. Handled badly, it breaks the loop in the other direction: a lost customer, a bad review, and friends who hear the story.

A calm process helps:

1. **Listen first.** Let them explain. Do not defend yet.
2. **Acknowledge and apologise** for their experience, and for anything you got wrong.
3. **Find the facts** before promising anything.
4. **Offer a fair fix** and say when it will happen.
5. **Follow through**, then check they are satisfied.
6. **Learn**: what in the system caused it?

AI is useful for drafting calm replies and for thinking through options. It should not decide the outcome. Refunds, replacements and goodwill gestures are your call, and consumer rights law in many countries sets minimum rights customers have, whatever your own policy says.

\`\`\`try
[PASTE YOUR BRAND BRIEF]

A customer has complained. Their message: [PASTE, WITH PERSONAL DETAILS REMOVED]
The facts from our side: [WHAT HAPPENED]
What I am willing to offer: [e.g. redo the work, partial refund, replacement]

Draft a reply under 150 words: acknowledge, apologise for what we got wrong, explain the fix and when it will happen, and give a named contact.
Then, separately, suggest what in our process might have caused this and one change that would prevent it next time.
Do not offer anything beyond what I have said I am willing to offer.
\`\`\`

## Complaints are system feedback

Step six is where systems thinking pays. A single complaint is an event. The same complaint three times is a pattern, and a pattern points to something in how the business works: an unclear quote, a missed hand-off, a promise the website makes that the team cannot keep. Keep a simple complaints log and review it monthly. Fix the cause, and the complaints stop arriving.

## Try it now

Choose one: a win-back message for your lapsed customers, a simple loyalty idea, or a complaint-handling reply and process. Use the matching prompt, check the output, and put it into use.

You are done when you have sent one real win-back message or started one loyalty step, and you have set up a simple complaints log (date, issue, fix, cause) with the "return and refer" step on your business map updated to show what you now do there.`,
        microCheck: [
          {
            question: "You want to send a win-back message to lapsed customers. What should you avoid pasting into the AI tool?",
            options: [
              "Your brand brief and the reason you want customers to return",
              "The full customer list with names, emails and purchase history",
              "The time period after which you count a customer as lapsed",
              "The next step you would like returning customers to take",
            ],
            correctIndex: 1,
            explanation:
              "AI only needs to write the message, not see the list. Keep personal data in your own systems and send through them, sharing only what the task needs.",
          },
          {
            question: "A café launches a loyalty card but staff often forget to stamp it. What is the likely effect?",
            options: [
              "Little effect, since customers rarely notice loyalty schemes",
              "Customers feel let down, which can be worse than no scheme",
              "More visits, since the card still reminds people of the café",
              "Staff save time, which makes up for any customer frustration",
            ],
            correctIndex: 1,
            explanation:
              "A scheme that is not honoured sends the opposite message to the one intended. Pick something simple enough to run every time, or it can damage loyalty.",
          },
          {
            question: "An AI complaint reply offers a full refund and a free future service. You had offered only to redo the work. What went wrong?",
            options: [
              "The AI was too polite, so it offered more than it needed to",
              "The AI decided the outcome, which is the owner's decision alone",
              "The customer's complaint was too long for the AI to understand",
              "The brand brief made the tone too generous for complaints",
            ],
            correctIndex: 1,
            explanation:
              "AI drafts, you decide. Telling it exactly what you are willing to offer, and checking promises before sending, stops it committing you to things you did not intend.",
          },
          {
            question: "Three customers this month complain their job overran the quoted time. What does the systems view suggest?",
            options: [
              "Apologise to each one and treat them as three separate events",
              "A pattern points to a cause, such as how time is estimated",
              "Offer each a discount so they do not leave negative reviews",
              "Remove timescales from quotes so customers cannot complain",
            ],
            correctIndex: 1,
            explanation:
              "One complaint is an event, but repeats are a pattern with a cause in the system. Fixing how jobs are estimated stops the complaints rather than just handling them.",
          },
          {
            question: "Why does the lesson say the \"return and refer\" step deserves as much attention as the first?",
            options: [
              "Past customers already trust you, and they drive the growth loops",
              "New customers are no longer worth pursuing once you have regulars",
              "Loyalty schemes are required for businesses that use AI marketing",
              "It is the only step where AI tools can be used without any risk",
            ],
            correctIndex: 0,
            explanation:
              "Regulars buy again, refer friends and leave reviews, feeding the reinforcing loops that grow a business. Neglecting them means constantly refilling a leaking bucket.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Imagine a dog groomer who replies to enquiries once a day in the evening. Many enquirers have booked elsewhere by then. What should come first?",
        options: [
          "A new website with a more modern design and better photos",
          "Saved reply templates so enquiries get answered in minutes",
          "More social posts so there are more enquiries to choose from",
          "A loyalty card, so that existing customers visit more often",
        ],
        correctIndex: 1,
        explanation:
          "The enquiry step is where customers are being lost, so it is the bottleneck. More posts would only add to the queue, and templates make fast replies possible between jobs.",
      },
      {
        question: "Your website chat assistant tells a customer a price that is not on your price list. What was most likely missing from its setup?",
        options: [
          "A friendlier personality so that customers enjoy the chat more",
          "Limiting it to your real information and handing off when unsure",
          "A newer AI model, since older models make up prices more often",
          "A longer welcome message explaining what the chat can be used for",
        ],
        correctIndex: 1,
        explanation:
          "A chat assistant should answer only from your real information and pass anything it is unsure of to a person. Testing with awkward questions before launch catches invented prices.",
      },
      {
        question: "What should happen when a website chatbot cannot answer a customer's question?",
        options: [
          "It should give its best guess so the customer is not left waiting",
          "It should offer an easy way to reach a person, with a reply time",
          "It should ask the customer to try again with a simpler question",
          "It should end the chat politely and suggest they visit the FAQ",
        ],
        correctIndex: 1,
        explanation:
          "A clear human handoff is essential. Guessing risks wrong information, and sending customers round in circles loses them at the step where they were ready to buy.",
      },
      {
        question: "Which quote is most likely to be accepted without a phone call?",
        options: [
          "One listing tasks in trade terms with a single total at the end",
          "One stating needs, inclusions, exclusions, price and how to accept",
          "One kept to a single line so the customer can read it at a glance",
          "One sent with a note that the price rises unless accepted today",
        ],
        correctIndex: 1,
        explanation:
          "A clear quote answers the customer's questions before they ask. Jargon, missing detail and false deadlines all create doubt or break the honesty rules.",
      },
      {
        question: "A customer has not replied to your quote in a week. Which follow-up is best?",
        options: [
          "A reminder that you are very busy and may not have space later",
          "A short, useful message offering to answer any questions",
          "A new quote with 20% off, sent without them asking for it",
          "A daily message until they reply one way or the other",
        ],
        correctIndex: 1,
        explanation:
          "Silence is usually busyness, not refusal. A helpful, low-pressure message is good service; invented scarcity, unasked discounts and daily chasing damage trust.",
      },
      {
        question: "An owner uses AI to write a set of glowing testimonials for the website, based on real jobs. Why is this a problem?",
        options: [
          "Real jobs are fine to describe, but only as case studies",
          "Testimonials not written by real customers are misleading",
          "AI-written testimonials are usually too long for websites",
          "Testimonials should be on review sites, not your own site",
        ],
        correctIndex: 1,
        explanation:
          "A testimonial presents itself as a customer's own words. Invented ones mislead, even if the job was real. Use genuine quotes with the customer's permission.",
      },
      {
        question: "A platform's rules ban incentives for reviews. What can you still do to get more reviews?",
        options: [
          "Offer a prize draw instead, since that is not a direct incentive",
          "Ask every customer promptly and personally, with an easy link",
          "Ask staff to leave reviews based on what customers told them",
          "Offer a discount by text message so the platform cannot see it",
        ],
        correctIndex: 1,
        explanation:
          "Asking everyone promptly, with a direct link, is allowed and effective. Prize draws often count as incentives, and staff or hidden-incentive reviews break the rules.",
      },
      {
        question: "A one-star review claims you were rude, and you believe you were polite. How should you reply publicly?",
        options: [
          "Explain in detail why the customer is wrong, with the job details",
          "Stay calm, acknowledge their experience and offer to talk offline",
          "Say nothing, since replies only draw more attention to the review",
          "Ask your regular customers to post five-star reviews in response",
        ],
        correctIndex: 1,
        explanation:
          "Future customers read the reply more than the review. A calm, non-defensive reply that moves the conversation offline shows good character; arguing or rallying reviews does not.",
      },
      {
        question: "You want to send win-back emails to past customers. What must be true first?",
        options: [
          "The AI tool has been given the full list to personalise each email",
          "They agreed to hear from you, and each email has an easy opt-out",
          "They bought something in the last month, so they still remember you",
          "The emails include a discount, since that is legally required",
        ],
        correctIndex: 1,
        explanation:
          "Marketing rules in many countries require consent and an opt-out. Pasting the full list into AI is unnecessary, since AI only needs to help write the message.",
      },
      {
        question: "Complaints about late deliveries keep coming in. An owner answers each one well but nothing changes. What is missing?",
        options: [
          "Better reply templates, so the answers sound more sincere",
          "Treating the pattern as feedback and fixing the cause",
          "A larger refund each time, so customers are not upset",
          "An AI chatbot to handle complaints outside office hours",
        ],
        correctIndex: 1,
        explanation:
          "Repeated complaints are a pattern with a cause in the system. Handling each one well is necessary, but only fixing the cause stops the complaints arriving.",
      },
      {
        question: "An owner speeds up enquiries and quotes. Why is the \"return and refer\" step the natural next focus?",
        options: [
          "It feeds the reinforcing loops of repeat sales, reviews and referrals",
          "Regulatory rules require businesses to have a loyalty scheme",
          "New customers stop arriving once enquiries become fast",
          "AI tools are cheaper to use for repeat customers than new ones",
        ],
        correctIndex: 0,
        explanation:
          "Past customers who return, refer and review strengthen the loops that bring new customers in. Without that step, the business must keep refilling the start of the journey.",
      },
      {
        question: "In a complaint, what role should AI play?",
        options: [
          "Deciding the fair outcome, since it is impartial between parties",
          "Drafting a calm reply and suggesting causes, with you deciding",
          "Replying automatically, so the customer gets an instant answer",
          "Nothing, since complaints must never involve any AI at all",
        ],
        correctIndex: 1,
        explanation:
          "AI helps you write calmly and think through causes, but outcomes like refunds are your decision, within consumer rights law. An instant automatic reply risks the wrong promise.",
      },
    ],
  },
];
