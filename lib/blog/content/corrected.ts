// Corrected versions of pre-written AI Times articles.
//
// An audit on 2026-09-28 found pre-written articles that presented invented
// businesses and results as real, quoted statistics nobody had sourced,
// reported a court verdict without saying what it was, and described an
// Anthropic feature incorrectly. The owner chose to correct them rather than
// take them down.
//
// How corrections reach the site:
//   - seed-posts.ts and spotlights.ts use these versions, so a fresh
//     database never gets the old text.
//   - The news agent (npm run cron news) rewrites any existing post whose
//     title is listed in `replaces`, keeping its slug so links keep working,
//     and clears its cached translations.
//
// Rules the rewrites follow: no invented companies, people or results; any
// example number is labelled as illustrative and the arithmetic is shown;
// facts about real events are sourced in the article.

export interface CorrectedArticle {
  /** Titles this article has been published under, oldest first. */
  replaces: string[];
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author?: string;
  content: string;
}

const PLAYBOOK_NOTE =
  `<p><em>This is a playbook, not a client story. Where it uses numbers, they are an illustration to show the arithmetic: put your own in.</em></p>`;

export const CORRECTED_ARTICLES: CorrectedArticle[] = [
  // ── Former case studies, now playbooks ────────────────────────────────────
  {
    replaces: ["How a Small Law Firm Reduced Contract Review Time by 80% With AI"],
    title: "Contract Review With AI: A Playbook for Small Law Firms",
    excerpt: "Where AI helps with contract review, where it must not replace a lawyer, and how to measure whether it is saving your firm real time.",
    category: "tips",
    tags: ["legal", "ai", "contract review", "law firm", "playbook"],
    content: `${PLAYBOOK_NOTE}
<p>Contract review is where many small firms first look at AI, and for good reason: much of the work follows a pattern. Read the agreement, compare it with what you usually accept, flag what is unusual, and explain it to the client in plain English. The pattern is what AI is good at. The judgement about what to do is not.</p>
<h2>Where AI helps</h2>
<ul>
<li><strong>A clause-by-clause first pass.</strong> Summarise each clause and mark anything that departs from your firm's standard positions.</li>
<li><strong>Missing protections.</strong> List what a contract of this type usually contains and is absent here.</li>
<li><strong>Version comparison.</strong> Show what changed between the draft you sent and the one that came back.</li>
<li><strong>The client summary.</strong> A plain-English draft the lawyer edits rather than writes from scratch.</li>
</ul>
<h2>Where it must not decide</h2>
<p>Whether a risk is acceptable for this client, how hard to push in negotiation, and anything that depends on facts outside the document. Every AI output is a draft for a lawyer to check, and the firm stays responsible for the advice.</p>
<h2>Set-up that makes the difference</h2>
<ol>
<li><strong>Write down your standard positions</strong> for your common agreement types. The AI can only flag departures from a standard it has been given.</li>
<li><strong>Check confidentiality first.</strong> Use a tool whose terms say client documents are not used for training and are kept only as long as you need. Your bar's guidance on technology and confidentiality applies.</li>
<li><strong>Calibrate before relying on it.</strong> Have a lawyer review ten contracts both ways and note where the AI missed or over-flagged.</li>
</ol>
<h2>Measure it</h2>
<p>Time a sample of reviews before and after. Illustration: if a lease review takes 3 hours today and 1 hour with an AI first pass and lawyer check, and the firm reviews 20 a month, that is 40 hours a month. Whether the saving is real depends on your own before-and-after numbers, and on the lawyer check never being skipped.</p>
<p><strong>Practical takeaway:</strong> Start with the one agreement type you review most, write down your standard positions for it, and run the AI alongside your normal process for a month before changing anything.</p>`,
  },
  {
    replaces: ["How One Restaurant Chain Eliminated Its No-Show Problem With AI"],
    title: "Cutting Restaurant No-Shows With Automated Confirmations: A Playbook",
    excerpt: "How confirmation and reminder sequences reduce empty tables, how to set them up without annoying guests, and how to work out what no-shows cost you.",
    category: "tips",
    tags: ["restaurant", "no-shows", "reservations", "automation", "playbook"],
    content: `${PLAYBOOK_NOTE}
<p>A reserved table that stays empty costs a restaurant the covers, the prep and often a walk-in who was turned away. Most of the fix is not clever AI. It is a confirmation sequence that runs every time, plus a way to release tables that will not be used.</p>
<h2>Work out what no-shows cost you</h2>
<p>Count no-shows for four weeks. Multiply by your average party size and average spend per guest. Illustration: 12 no-show tables a week, 3 guests each, $45 per guest is about $1,600 a week in covers you prepared for. Your numbers will differ; the method is the point.</p>
<h2>The sequence</h2>
<ol>
<li><strong>Instant confirmation</strong> with the date, time, party size and a one-tap way to change or cancel.</li>
<li><strong>A reminder the day before</strong> asking the guest to confirm.</li>
<li><strong>A short same-day nudge</strong> by text, where the guest agreed to texts.</li>
<li><strong>A release rule</strong> for unconfirmed tables at busy times: offer them to your waitlist at a set hour, and say so in the booking terms.</li>
</ol>
<p>Most reservation platforms can already send the first three. AI earns its place in the parts that need language: answering replies ("can we make it five people?"), handling the waitlist conversation, and spotting patterns in which bookings tend not to show.</p>
<h2>Do it without annoying guests</h2>
<ul>
<li>Keep messages short and useful, and never more than three per booking.</li>
<li>Get consent for text messages and include a way to opt out.</li>
<li>Keep large parties and regulars on a personal call if that is how your house works.</li>
</ul>
<h2>Measure it</h2>
<p>Track the no-show rate, the share of cancelled tables refilled, and the hours staff spend on confirmation calls, for four weeks before and after.</p>
<p><strong>Practical takeaway:</strong> Turn on the confirmation and reminder features your booking system already has this week, then decide whether the reply-handling needs AI at all.</p>`,
  },
  {
    replaces: ["How a Diaspora Shipping Operator Scaled Without New Hires Using AI Agents"],
    title: "Answering Shipping Customers on WhatsApp With an AI Agent: A Playbook",
    excerpt: "For shipping and logistics businesses buried in status questions: how to tell whether an AI agent will help, what to connect it to, and when it must hand over to a person.",
    category: "tips",
    tags: ["shipping", "logistics", "whatsapp", "customer service", "ai agents", "playbook"],
    content: `${PLAYBOOK_NOTE}
<p>Small shipping businesses, including the many that serve diaspora communities, often run customer service on WhatsApp. Before holidays the same questions arrive in waves: where is my shipment, when will it arrive, what does it cost to send to this city, what can I send. A small team answering all of them has no time left for the problems that need a person.</p>
<h2>Check whether an agent will help</h2>
<p>For one week, tag every incoming question by type. If most of them fall into a short list of repeat questions, and the answers live in data you already hold (tracking, routes, prices, pickup hours, item rules), an agent can take the repeats. If most questions are one-off problems, it will not.</p>
<h2>What to connect</h2>
<ul>
<li><strong>WhatsApp Business Platform</strong> and your website chat, so customers stay where they are.</li>
<li><strong>Your tracking data</strong>, read-only, so status answers are real and not guessed.</li>
<li><strong>A written price list, route list and item rules</strong> the agent quotes from, never invents.</li>
</ul>
<h2>When it hands over</h2>
<p>Claims, damage, customs problems, complaints and anything involving money back go to a person, with the conversation summarised so the customer does not repeat themselves. Make the hand-over easy to trigger: a customer typing "agent" or sounding upset should reach a human.</p>
<h2>Measure it</h2>
<p>Track first-response time, the share of conversations resolved without a person, repeat contacts about the same shipment, and complaints about wrong answers. Illustration: if 200 messages a day arrive before a holiday and an agent resolves half, your team handles 100 instead of 200. Your share will depend on how many questions are truly repeats.</p>
<p><strong>Practical takeaway:</strong> Do the one-week tagging exercise first. It tells you whether to build an agent, and it produces the question list the agent is built from.</p>`,
  },
  {
    replaces: ["How a Caribbean Event Company Doubled Bookings Using an AI Scheduling Agent"],
    title: "Answering Event Enquiries Instantly With an AI Scheduling Agent: A Playbook",
    excerpt: "Event and venue businesses lose bookings to slow replies. How an AI agent can qualify enquiries and book the discovery call, and what should stay with your team.",
    category: "tips",
    tags: ["scheduling ai", "event management", "whatsapp", "lead response", "playbook"],
    content: `${PLAYBOOK_NOTE}
<p>For event planners and venues, an enquiry is often a race. The client who wants a date has messaged three businesses, and the one that replies first with something useful usually gets the call. When the team is busy running today's event, tomorrow's enquiries wait.</p>
<h2>What the agent does</h2>
<ol>
<li>Replies to a new enquiry at any hour, on the channel it arrived on (often WhatsApp).</li>
<li>Asks the qualifying questions you would ask: event type, date, guest count, budget range, venue needs.</li>
<li>Checks your real calendar and offers times for a discovery call.</li>
<li>Confirms the booking, sends reminders, and passes the details to the right person on your team.</li>
</ol>
<h2>What stays with your team</h2>
<p>The discovery call itself, proposals, pricing decisions and the relationship. The agent qualifies and schedules; people sell and deliver. Keep it that narrow and it is reliable.</p>
<h2>Set it up well</h2>
<ul>
<li>Write the qualifying questions and the answers to common ones (capacity, deposits, what is included) before building anything.</li>
<li>Give it a polite way to say "a person will reply" for anything it cannot answer.</li>
<li>Tell enquirers they are talking to an assistant.</li>
</ul>
<h2>Measure it</h2>
<p>Track time to first reply, the share of enquiries that book a call, call no-shows and bookings, for a month before and after. Illustration: if you receive 60 enquiries a month and slow replies lose one in five of them, faster replies are competing for 12 enquiries a month. Your baseline decides whether this is worth doing.</p>
<p><strong>Practical takeaway:</strong> Find the point where most enquiries go cold. If it is the wait for a first reply, that is exactly the gap a scheduling agent closes.</p>`,
  },
  {
    replaces: ["How a 3-Person Marketing Agency Scaled to 4x More Clients Using AI — Without Hiring"],
    title: "How a Small Marketing Agency Can Take On More Clients With AI: A Playbook",
    excerpt: "Map where a small agency's hours go, move the routine work to AI-assisted workflows, and protect the strategy clients actually pay for.",
    category: "tips",
    tags: ["marketing agency", "ai workflows", "content production", "reporting", "playbook"],
    content: `${PLAYBOOK_NOTE}
<p>Small agencies hit a ceiling that has nothing to do with demand: the team can only serve so many clients before drafting, research, reporting and coordination fill every hour. AI can raise that ceiling, but only after you know where the hours actually go.</p>
<h2>Step 1: Track time by task for two weeks</h2>
<p>Log time against tasks, not clients: drafting, research, reporting, scheduling and approvals, strategy. Most agencies find the routine categories are larger than they thought, and strategy is smaller.</p>
<h2>Step 2: Build workflows for the routine work</h2>
<ul>
<li><strong>Drafting.</strong> A prompt library per client holding brand voice, audience, banned topics and formats. AI writes the first draft; a person edits and approves.</li>
<li><strong>Research.</strong> A weekly automated digest of each client's sector news for a person to skim, instead of hours of manual monitoring.</li>
<li><strong>Reporting.</strong> Pull platform analytics automatically and have AI draft the commentary a person corrects.</li>
<li><strong>Coordination.</strong> Scheduling links and approval workflows in the tools you already use.</li>
</ul>
<h2>Step 3: Protect quality and trust</h2>
<p>Keep a human edit on everything that goes to a client. Check facts and claims before publishing, and disclose sponsored or gifted content as the FTC requires. Ask each client whether they are comfortable with AI-assisted drafting; some contracts forbid it.</p>
<h2>Measure it</h2>
<p>Repeat the two-week time log after three months. Illustration: if drafting a post drops from 90 to 30 minutes and you write 60 posts a month, that is 60 hours back. Hours freed only become capacity if you actually take on the extra client, so decide what the time is for.</p>
<p><strong>Practical takeaway:</strong> Do the time log before buying any tool. It will tell you which one workflow to build first.</p>`,
  },
  {
    replaces: ["How a West African Fintech Used AI to Cut Customer Verification From 3 Days to 8 Minutes"],
    title: "Faster Customer Verification With AI: A KYC Playbook for Fintechs",
    excerpt: "How automated document checks and face matching can shorten KYC, what regulators still expect a person to do, and how to measure drop-off at the verification step.",
    category: "tips",
    tags: ["fintech", "kyc", "identity verification", "compliance", "africa", "playbook"],
    content: `${PLAYBOOK_NOTE}
<p>For digital lenders and payment apps, the verification step is where many sign-ups are lost. If a person has to review every ID by hand, a queue builds, customers wait, and some never come back. Automation can clear the straightforward cases quickly, but only inside the rules your regulator sets.</p>
<h2>Measure the problem first</h2>
<p>Track how many people start verification, how many finish, and how long a decision takes. Illustration: if 1,000 people start and 400 finish, the step is losing 600. That number tells you whether speed is your problem or whether something else is, such as confusing instructions or failing uploads.</p>
<h2>What automation can do</h2>
<ul>
<li><strong>Document checks:</strong> read the ID, check format and expiry, and look for signs of tampering.</li>
<li><strong>Data matching:</strong> compare the extracted name, date of birth and ID number with what the customer entered.</li>
<li><strong>Face matching and liveness:</strong> confirm the person holding the phone is the person on the ID.</li>
<li><strong>Official checks:</strong> where the law allows, verify identity numbers with the national system (in Nigeria, for example, through BVN or NIN verification via licensed providers).</li>
<li><strong>Routing:</strong> clear the straightforward cases and send anything unusual to a person, with the automated findings attached.</li>
</ul>
<h2>What still needs a person</h2>
<p>Unclear or suspicious cases, sanctions and politically exposed person matches, and anything your regulator requires to be reviewed. Keep records of every decision. Test the system on your real customers' documents and phone cameras, and check error rates across groups, because face matching that works less well for some customers is both a fairness and a compliance problem.</p>
<h2>Measure it</h2>
<p>Completion rate, time to decision, the share sent to manual review, fraud found later, and complaints. Compare with your baseline after 90 days.</p>
<p><strong>Practical takeaway:</strong> Measure drop-off at every step of sign-up. If verification is the leak, talk to your compliance lead before a vendor: they decide what can be automated.</p>`,
  },

  // ── Former "real deployments" pieces ──────────────────────────────────────
  {
    replaces: ["AI Agents Are Taking Over Workflows: 5 Real Deployments That Are Saving Businesses Thousands Per Month"],
    title: "5 AI Agent Workflows Small Businesses Can Actually Deploy",
    excerpt: "Five agent workflows that suit small businesses, what each one needs connected, where a person must stay in the loop, and what to measure.",
    category: "ai-business",
    tags: ["ai agents", "automation", "workflows", "small business"],
    author: "TIBLOGICS Editorial",
    content: `<p>AI agents are useful where a job has clear steps, the data sits in systems an agent can reach, and a person can check the result quickly. These five fit that description for many small businesses. Each is described as a pattern to adapt, not as a result anyone has promised.</p>
<h2>1. Lead qualification</h2>
<p>The agent watches new sign-ups or enquiries, looks up public company details, scores each lead against your ideal customer, and drafts a first email for a person to approve. <strong>Connect:</strong> your CRM and form tool. <strong>Keep human:</strong> approving every message before it sends. <strong>Measure:</strong> time from enquiry to first reply, and meetings booked.</p>
<h2>2. Contract first pass</h2>
<p>The agent extracts key terms (payment, liability, termination, IP), compares them with your standard positions and flags departures. <strong>Keep human:</strong> all legal judgement, which must stay with a qualified person. <strong>Measure:</strong> review time and anything the first pass missed.</p>
<h2>3. First-line customer support</h2>
<p>The agent answers order status, returns and product questions from your live systems, and hands anything else to a person with a summary. <strong>Connect:</strong> order system, help desk, product data. <strong>Keep human:</strong> refunds beyond your rules, complaints, anything emotional. <strong>Measure:</strong> share resolved without a person, reopen rate, and customer satisfaction.</p>
<h2>4. Month-end reporting</h2>
<p>The agent collects figures from accounting, billing and project tools, reconciles what it can, flags anomalies and drafts the management pack. <strong>Keep human:</strong> sign-off by whoever owns the numbers. <strong>Measure:</strong> days to close and corrections needed.</p>
<h2>5. Content repurposing</h2>
<p>The agent turns one approved piece into drafts for each channel and queues them for review. <strong>Keep human:</strong> editing, fact-checking and brand judgement. <strong>Measure:</strong> hours per week and engagement per channel.</p>
<h2>What they have in common</h2>
<p>Agents do the first pass on well-defined, high-volume work, and people approve at the points where a mistake would be costly. Run any new agent alongside your current process for two weeks before relying on it, and compare the results.</p>
<p><strong>Practical takeaway:</strong> Pick the workflow that takes the most hours and has the clearest definition of a correct result. That is your first agent.</p>`,
  },
  {
    replaces: ["The Real ROI of AI Automation for Small Businesses: Numbers From Actual Deployments"],
    title: "The Real ROI of AI Automation for Small Businesses: How to Work It Out Before You Spend",
    excerpt: "A simple way to estimate what an automation will cost, what it will give back, and how long it takes to pay for itself, using your own numbers instead of vendor case studies.",
    category: "ai-business",
    tags: ["roi", "automation", "small business", "ai costs"],
    author: "TIBLOGICS Editorial",
    content: `<p>Vendor case studies promise dramatic returns, and small business owners are right to be sceptical: they come from large companies, with big implementation budgets, and only the successes get published. The honest answer to "what will this return for me?" is a calculation with your own numbers. Here is how to do it.</p>
<h2>1. What it costs</h2>
<ul>
<li><strong>Build:</strong> the hours to design, build, test and hand over the workflow, whether yours or a contractor's. Get a quote; do not guess.</li>
<li><strong>Tools:</strong> subscriptions for the automation platform and any AI service. Many have free tiers for low volume; check current pricing for your expected volume.</li>
<li><strong>Running costs:</strong> AI usage is billed by volume. Ask for an estimate based on your real monthly volume, and set a spending limit.</li>
<li><strong>Upkeep:</strong> a few hours a month to monitor and fix. Every automation needs an owner.</li>
</ul>
<h2>2. What comes back</h2>
<p>Time the task today, per occurrence, and count how often it happens. Multiply by what that time costs you. Then estimate honestly how much of it the automation will take over; a person usually still reviews the output.</p>
<h2>A worked example (illustrative numbers)</h2>
<p>Client onboarding takes 5 hours per new client. You sign 8 clients a month: 40 hours. Automation takes over about half: 20 hours saved. At a $35 loaded hourly cost, that is $700 a month. If the build costs $2,100 and running costs are $100 a month, the net saving is $600 a month and the build pays back in about three and a half months. Change any number and the answer changes, which is why you should run it with yours.</p>
<h2>3. Where returns disappoint</h2>
<p>Work that looks mechanical but needs judgement: sensitive complaints, high-value sales conversations, creative quality control. Automation gives these a head start, not a finished job, so count only the time it genuinely saves.</p>
<h2>What to look for</h2>
<p>The best first automations happen often, have a clear definition of a correct result, and take real time today. Anything else takes longer to pay back.</p>
<p><strong>Practical takeaway:</strong> List every task your team does more than three times a week, time the top three, and run the worked example above with your numbers before you buy anything.</p>`,
  },
  {
    replaces: ["AI for E-Commerce: The 6 Deployments That Are Actually Moving Revenue"],
    title: "AI for E-Commerce: 6 Deployments Worth Testing, and How to Measure Them",
    excerpt: "Six ways online stores are using AI, from product copy to returns, with the risks of each and the test that tells you whether it works for your store.",
    category: "ai-business",
    tags: ["ecommerce", "ai", "personalisation", "conversion", "returns"],
    author: "TIBLOGICS Editorial",
    content: `<p>Results for AI in e-commerce vary widely by store, catalogue and traffic, and published figures usually come from the vendors selling the tools. The useful question is not "what lift do others claim?" but "how do I test this on my store?". Here are six deployments worth testing, with the measure for each.</p>
<h2>1. Product descriptions at scale</h2>
<p>For large catalogues with thin or duplicated copy, AI can draft unique descriptions from each product's details. Quality matters: rewording the spec sheet adds nothing; real use cases and details do. <strong>Test:</strong> rewrite one category, leave a similar one alone, and compare organic traffic and conversion over two to three months.</p>
<h2>2. Search that understands intent</h2>
<p>Semantic search handles queries like "something for a beach wedding" that keyword search fails. <strong>Test:</strong> the share of searches returning no results, and conversion from search, before and after.</p>
<h2>3. Personalised email</h2>
<p>Content and timing based on what a customer browsed and bought, rather than one campaign to everyone. <strong>Test:</strong> split your list and compare revenue per recipient, unsubscribes and spam complaints.</p>
<h2>4. Abandoned cart recovery</h2>
<p>Choosing the message, timing and channel for each abandoned cart. Get consent for texts and keep any discount rules deliberate, or customers learn to abandon carts to get one. <strong>Test:</strong> a holdout group that gets your current sequence.</p>
<h2>5. Size and fit guidance</h2>
<p>For apparel, recommendations based on a customer's past purchases and returns. <strong>Test:</strong> return rate for "wrong size" on products with guidance versus without.</p>
<h2>6. Pricing support</h2>
<p>Models that suggest prices from demand, stock and competitor data. This is the riskiest of the six: prices that feel manipulative damage trust, and some practices draw regulatory attention. Keep human approval and margin floors. <strong>Test:</strong> gross margin and conversion on a small set of products first.</p>
<h2>How to run the tests</h2>
<p>Change one thing at a time, keep a comparison group, run long enough to cover a normal sales cycle, and decide in advance what result would make it worth keeping.</p>
<p><strong>Practical takeaway:</strong> Start with the deployment that attacks your biggest cost or leak: returns, failed searches or thin product pages. Measure it properly, then decide on the next.</p>`,
  },

  // ── News: facts corrected ─────────────────────────────────────────────────
  {
    replaces: ["Elon Musk vs. OpenAI: The Verdict Is In — and Its Implications Go Far Beyond the Courtroom"],
    title: "Musk v. OpenAI: A Jury Said He Sued Too Late. Here's What That Does and Doesn't Settle",
    excerpt: "On May 18, 2026 a federal jury found Elon Musk's claims against OpenAI and Sam Altman were filed too late, and the judge agreed. The core questions about OpenAI's mission were never decided.",
    category: "breaking",
    tags: ["openai", "elon musk", "lawsuit", "ai governance", "legal"],
    author: "TIBLOGICS Editorial",
    content: `<p><em>Corrected on September 28, 2026. An earlier version of this article said the case had reached a verdict without saying what it was, and described its effects in terms that were not supported. This version reports the outcome.</em></p>
<p>Elon Musk's lawsuit against OpenAI, its CEO Sam Altman, president Greg Brockman and others ended at trial on May 18, 2026, and not on the question most people were watching. A nine-member advisory jury in Oakland unanimously found that Musk's claims, including breach of charitable trust and unjust enrichment, were barred by the statute of limitations: he had waited too long to sue. U.S. District Judge Yvonne Gonzalez Rogers adopted the finding and dismissed the case. The jury deliberated for less than two hours, after about eleven days of testimony and argument that included Altman, Brockman, Microsoft CEO Satya Nadella and Musk himself.</p>
<h2>What the case was about</h2>
<p>Musk, an early funder and co-founder, argued that OpenAI's leaders had induced him to back a nonprofit dedicated to safe AI for the benefit of humanity, then turned it into a profit-driven company. He first sued in California state court in early 2024, withdrew that case, and refiled in federal court in August 2024. OpenAI's defence included that Musk had known of and supported for-profit plans years earlier; evidence at trial showed such discussions dated back to at least 2017.</p>
<h2>What the verdict decided, and what it didn't</h2>
<p>The jury decided timing, not merit. It found that Musk knew enough, early enough, that the legal window to sue had closed before he filed. It did not rule on whether OpenAI's leaders broke a promise or whether the company's shift from its original structure was proper. Musk called the result a technicality and said he would appeal to the Ninth Circuit.</p>
<p>Meanwhile the restructuring the case challenged had already happened. In October 2025 OpenAI completed its recapitalisation: the for-profit became OpenAI Group PBC, a public benefit corporation, controlled by the nonprofit OpenAI Foundation, with Microsoft holding a stake of roughly 27%.</p>
<h2>What it means for businesses using AI</h2>
<p>Nothing changes day to day. OpenAI's products and API terms are unaffected by the verdict. The lasting lesson is the one the case illustrated for two years: the ownership and governance of the companies behind AI models can change substantially, and customers have no say.</p>
<p><strong>Practical takeaway:</strong> Avoid depending on a single AI vendor for anything critical. Keep your prompts, data and integrations portable enough to switch between providers without a rebuild.</p>
<p><small>Sources: reporting by NPR, CNBC, NBC News, Fortune and Al Jazeera on the May 18, 2026 verdict; CNBC and Al Jazeera on OpenAI's October 28, 2025 restructuring.</small></p>`,
  },
  {
    replaces: ["Claude Agents Now Dream: What Developers Need to Know — and How to Upgrade Your Builds"],
    title: "Claude's \"Dreaming\" Explained: What It Is, Where It Works, and How Developers Should Use It",
    excerpt: "Dreaming is a scheduled memory process in Claude Managed Agents that reviews past sessions and curates what agents remember. It is not background reasoning, and it is not an API switch.",
    category: "tips",
    tags: ["claude", "anthropic", "ai agents", "memory", "developers"],
    author: "Tieyiwe Bass · Founder, TIBLOGICS",
    content: `<p><em>Corrected on September 28, 2026. An earlier version of this article described dreaming as agents reasoning continuously in the background, and advised enabling extended thinking to get it. Both were wrong. This version describes the feature as Anthropic documents it.</em></p>
<p>In May 2026 Anthropic added a feature called <strong>dreaming</strong> to Claude Managed Agents, its hosted platform for running agents. In Anthropic's words, dreaming is "a scheduled process in Claude Managed Agents that reviews agent sessions and memory stores, extracts patterns, and curates memories so agents improve over time." It launched as a research preview that developers request access to.</p>
<h2>What it actually does</h2>
<p>Managed Agents can keep a memory store: notes an agent writes down as it works. Over time that memory gets messy, with duplicates, outdated facts and lessons scattered across sessions. Dreaming runs between sessions, on a schedule, and tidies it: it reads recent sessions and the memory store, merges and updates what is there, drops what is stale, and pulls out patterns, including learnings shared across agents. Anthropic's summary: memory captures what an agent learns as it works; dreaming refines that memory between sessions.</p>
<p>You choose how much control to keep: dreaming can update memory automatically, or you can review its changes before they land.</p>
<h2>What it is not</h2>
<ul>
<li>It is <strong>not</strong> the model thinking in the background while nobody is using it. It is a memory-maintenance job.</li>
<li>It is <strong>not</strong> a setting on the ordinary Messages API. An agent you built yourself on the API does not get it by changing a parameter, and turning on extended thinking has nothing to do with it.</li>
</ul>
<p>Alongside dreaming, Anthropic announced <strong>outcomes</strong> (a separate grader checks an agent's work against a rubric you write), <strong>multiagent orchestration</strong> (a lead agent delegating to specialists) and <strong>webhooks</strong> for finished tasks.</p>
<h2>How developers should use it</h2>
<ol>
<li><strong>Decide what an agent should remember.</strong> Customer preferences and resolved edge cases, yes. Personal data it does not need, no. Memory is data you are responsible for.</li>
<li><strong>Start in review mode</strong> for client work, especially in regulated industries, so a person approves memory changes until you trust them.</li>
<li><strong>Audit memory periodically.</strong> Read what the agent now "knows" and correct anything wrong; a wrong memory repeats its mistake in every session.</li>
<li><strong>Measure with outcomes.</strong> Define a rubric for the agent's work and check whether results improve after dreaming runs.</li>
<li><strong>Not on Managed Agents?</strong> The idea still applies: a scheduled job that reviews your agent's logs and updates the instructions or knowledge it works from, with a person approving the changes.</li>
</ol>
<p><strong>Practical takeaway:</strong> If you run client agents that repeat mistakes or forget what they learned, a curated memory is the fix, whether through dreaming on Managed Agents or a review job of your own. Keep a person approving what gets remembered.</p>
<p><small>Source: Anthropic, "New in Claude Managed Agents: dreaming, outcomes, and multiagent orchestration" (May 2026).</small></p>`,
  },

  // ── AI Times page fallback seed ───────────────────────────────────────────
  {
    replaces: ["The State of AI Adoption in Professional Services: 2026 Benchmarks"],
    title: "AI in Professional Services: Where Firms Start, and What Holds Them Back",
    excerpt: "The tasks law, accounting and consulting firms most often hand to AI first, the two blockers that stall them, and how to get past both.",
    category: "industry",
    tags: ["ai adoption", "professional services", "law firms", "accounting"],
    author: "TIBLOGICS Editorial",
    content: `<p><em>Corrected on September 28, 2026. An earlier version of this article presented adoption percentages and productivity figures as "new data" without a source. They have been removed.</em></p>
<p>In law, accounting and consulting, the question has shifted from whether to use AI to where to start. The starting points are remarkably consistent, and so are the reasons firms stall.</p>
<h2>Where firms usually start</h2>
<ul>
<li><strong>Document review and summarisation:</strong> contracts, statements, discovery, due diligence.</li>
<li><strong>Research:</strong> first-pass summaries of regulations, case law or industry material, checked by a professional.</li>
<li><strong>Client communication:</strong> drafting emails, engagement letters and plain-English explanations.</li>
</ul>
<p>All three have the same shape: high volume, a recognisable pattern, and a professional who reviews the output before it reaches a client.</p>
<h2>What holds firms back</h2>
<p><strong>Confidentiality.</strong> Firms hold client information under professional duties. The answer is choosing tools whose terms keep client data out of training and under your control, and writing a short policy on what may be put into which tool.</p>
<p><strong>Nobody owns it.</strong> AI projects stall when they are everyone's side project. Name one person responsible, give them a small budget and a single first use case, and review results after 90 days.</p>
<h2>What this means for your firm</h2>
<p>You do not need a firm-wide programme to start. You need one high-volume task, a tool you are comfortable with on confidentiality, a person who owns it, and a before-and-after measure of the time it takes.</p>
<p><strong>Practical takeaway:</strong> Pick the document or drafting task your professionals repeat most, time it this month, and pilot AI on that task alone.</p>`,
  },
];

/** Every title a corrected article has been published under, mapped to it. */
export const CORRECTION_BY_OLD_TITLE = new Map(
  CORRECTED_ARTICLES.flatMap((a) => a.replaces.map((t) => [t.toLowerCase().trim(), a] as const)),
);
