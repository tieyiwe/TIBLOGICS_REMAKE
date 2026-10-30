import type { PromptDraft } from "./define";

// Additions to the Agency toolkit. Claims in client copy must be supported,
// endorsements disclosed, and reviews never invented.

const TRUE = "Use only facts and results I provide; no invented statistics, testimonials or reviews, and flag any claim that needs substantiation.";

export const AGENCY_EXTRA: PromptDraft[] = [
  // ── Client Communication & Account Management ──
  {
    c: "Client Communication & Account Management",
    t: "Email: Weekly Client Update in Five Lines",
    u: "Clients want to know what is happening without reading a long report.",
    p: `Write a weekly client update for [CLIENT] in exactly five short lines: what we shipped this week [WORK], one result or signal [RESULT], what is next [NEXT], what we need from them [ASK AND DEADLINE], and any risk [RISK OR NONE]. Friendly, scannable, under 120 words. ${TRUE}`,
    tip: "Send it the same day every week. Predictable updates cut 'just checking in' emails from clients.",
  },
  {
    c: "Client Communication & Account Management",
    t: "Email: Setting Expectations at Kickoff",
    u: "A new client relationship starts and you want to prevent misunderstandings.",
    p: `Write a post-kickoff email to [CLIENT] summarising how we will work: scope [SCOPE], timeline and milestones [DATES], communication rhythm and channels, feedback rounds included [NUMBER], approval process, how changes are handled (change requests), and who does what on both sides. Under 300 words.`,
    tip: "Put the number of revision rounds in writing at kickoff. It prevents most scope arguments later.",
  },
  {
    c: "Client Communication & Account Management",
    t: "Email: Presenting Creative Work Clearly",
    u: "You are sending creative for review and want useful feedback, not vague reactions.",
    p: `Write an email presenting [CREATIVE WORK] to [CLIENT]. Include: the objective it answers [OBJECTIVE], the idea in one sentence, why we made key choices [RATIONALE], what we need feedback on (specific questions), what is already agreed and not up for debate, and the feedback deadline [DATE]. Under 220 words.`,
    tip: "Ask specific questions ('Does the headline match your brand voice?'). Open requests get opinions; specific ones get decisions.",
  },
  {
    c: "Client Communication & Account Management",
    t: "Plan: Quarterly Business Review Agenda",
    u: "You want QBRs that show value and grow the account.",
    p: `Create a quarterly business review agenda for [CLIENT]: results against goals [RESULTS], what worked and what did not, insights about their customers, recommendations for next quarter, budget discussion, and the client's upcoming priorities. 60 minutes, with pre-read contents and 5 questions to ask the client about their business.`,
    tip: "Spend a third of the QBR on the client's business priorities. That is where new work comes from.",
  },
  {
    c: "Client Communication & Account Management",
    t: "Email: Introducing a New Account Manager",
    u: "The client's main contact is changing and you want a smooth handover.",
    p: `Write an email introducing [NEW ACCOUNT MANAGER] to [CLIENT], replacing [PREVIOUS CONTACT]. Include their relevant experience [FACTS], what stays the same, handover plan (joint call on [DATE], documents shared), and reassurance about continuity. Warm and confident, under 200 words.`,
    tip: "Hold a joint handover call. Clients feel abandoned when a contact disappears by email.",
  },

  // ── New Business & Pitching ──
  {
    c: "New Business & Pitching",
    t: "Pitch: Discovery Call Question Guide",
    u: "You want discovery calls that uncover real needs and budget.",
    p: `Create a 30-minute discovery call guide for a prospect in [INDUSTRY] interested in [SERVICE]. Include: opening, questions on business goals, current marketing and what has not worked, success metrics, decision process and timeline, budget range, and next steps. Add how to qualify out politely if it is not a fit.`,
    tip: "Ask 'What happens if you do nothing?' It reveals urgency and budget better than asking about budget.",
  },
  {
    c: "New Business & Pitching",
    t: "Proposal: Scope of Work With Clear Deliverables",
    u: "Your proposals are vague and lead to scope creep.",
    p: `Write a scope of work for [SERVICE] for [CLIENT]. Include: objectives, deliverables with quantities [e.g. 12 posts per month], what is excluded, timeline, client responsibilities, revision rounds, reporting, fees and payment terms [FEES], and assumptions. Clear numbered sections, under 700 words.`,
    tip: "List what is excluded as carefully as what is included; that section saves the relationship later.",
  },
  {
    c: "New Business & Pitching",
    t: "Case Study: Writing an Agency Case Study",
    u: "You want a case study that wins new clients.",
    p: `Write a case study for [AGENCY NAME] about work for [CLIENT OR ANONYMISED DESCRIPTION] with permission [CONFIRMED]. Structure: the challenge, what we did and why, the results with real numbers [RESULTS AND TIMEFRAME], and a client quote if approved [QUOTE]. 400 to 500 words. ${TRUE}`,
    tip: "Include what did not work at first and how you adjusted; it makes results believable.",
  },
  {
    c: "New Business & Pitching",
    t: "Email: Breakup Email for a Stalled Prospect",
    u: "A prospect has gone quiet after a proposal.",
    p: `Write a polite breakup email to a prospect who received our proposal for [SERVICE] on [DATE] and has not replied. Assume priorities changed, offer to close the file or reconnect later, and leave one easy reply option. Under 90 words, gracious.`,
    tip: "Breakup emails often get the most replies. Removing pressure invites honesty.",
  },
  {
    c: "New Business & Pitching",
    t: "Pitch: Credentials Deck Outline",
    u: "You need a short agency credentials deck.",
    p: `Create a 10-slide credentials deck outline for [AGENCY NAME] targeting [CLIENT TYPE]. Slides: who we are, who we help, our approach, services, 2 case studies [CASES], team, how we work, pricing approach, why us (facts), and next steps. Headline and key points for each slide. ${TRUE}`,
    tip: "Tailor slide 2 and the case studies to each prospect; the rest can stay the same.",
  },

  // ── Ad Copy & Creative Production ──
  {
    c: "Ad Copy & Creative Production",
    t: "Ads: Hook Variations for Video Ads",
    u: "You need many hooks to test for short video ads.",
    p: `Write 15 hooks (first 3 seconds) for video ads for [PRODUCT OR SERVICE] aimed at [AUDIENCE]. Mix: question, bold statement, problem call-out, surprising fact (only true facts I give [FACTS]), and demonstration. Each under 12 words, with a suggested visual. ${TRUE}`,
    tip: "Test hooks before bodies. The first three seconds decide whether the rest is ever seen.",
  },
  {
    c: "Ad Copy & Creative Production",
    t: "Brief: Creative Brief for Designers",
    u: "Designers need a clear brief to get it right the first time.",
    p: `Write a creative brief for [PROJECT] for [CLIENT]. Include: objective, audience, key message, supporting points, tone, mandatory elements (logo, legal lines [LINES]), formats and sizes [FORMATS], references [LINKS], what to avoid, and deadline. One page.`,
    tip: "Include 'what to avoid'. It prevents the most common round of revisions.",
  },
  {
    c: "Ad Copy & Creative Production",
    t: "Copy: Email Subject Line Testing Set",
    u: "You want subject lines to test for a client's campaign.",
    p: `Write 12 subject lines and preview texts for [CLIENT]'s email about [TOPIC] to [AUDIENCE]. Mix curiosity, benefit, urgency (only if real [DEADLINE]), personalisation, and question formats. Under 50 characters each. Mark the 3 strongest to test with reasons.`,
    tip: "Avoid fake urgency; it lifts opens once and damages trust for every send after.",
  },
  {
    c: "Ad Copy & Creative Production",
    t: "Review: Ad Copy Compliance and Claims Check",
    u: "You want to catch risky claims before ads launch.",
    p: `Review this ad copy for [CLIENT] in [INDUSTRY]: [PASTE COPY]. Flag: unsubstantiated claims ('best', 'number one', 'guaranteed'), health, financial or environmental claims, endorsements needing disclosure, pricing claims, and platform policy risks. Suggest safer rewrites and list the evidence the client must hold for each claim that stays.`,
    tip: "Keep the client's evidence for each claim in the project folder. Platforms and regulators can ask.",
  },
  {
    c: "Ad Copy & Creative Production",
    t: "Copy: Landing Page Rewrite for Conversion",
    u: "A client's landing page does not convert.",
    p: `Rewrite this landing page for [CLIENT]: [PASTE CURRENT COPY]. Goal: [CONVERSION GOAL]. Audience: [AUDIENCE]. Improve: headline clarity, benefit-led subheads, proof (only real [PROOF]), objection handling, and a single clear call to action. Keep facts unchanged, and explain the 5 most important changes.`,
    tip: "Match the headline to the ad people clicked. Message mismatch is the most common conversion leak.",
  },

  // ── Social Media & Content Marketing ──
  {
    c: "Social Media & Content Marketing",
    t: "Plan: Content Pillars for a Client Brand",
    u: "A client's social content is random and you want structure.",
    p: `Define 4 content pillars for [CLIENT] ([BUSINESS, AUDIENCE, GOALS]). For each pillar: purpose, 5 post ideas, formats that suit it, and how it supports business goals. Then propose a weekly posting mix. ${TRUE}`,
    tip: "Pillars make approvals faster; clients agree to the strategy once, not every post.",
  },
  {
    c: "Social Media & Content Marketing",
    t: "Content: Turn a Webinar Into a Month of Content",
    u: "A client ran a webinar and you want to repurpose it.",
    p: `Turn this webinar transcript or summary: [PASTE] into a month of content for [CLIENT]: 8 social posts, 4 short video clip ideas with timestamps [IF AVAILABLE], 1 blog post outline, 2 email newsletter sections, and 1 LinkedIn article outline. Keep the speaker's actual points; do not add claims.`,
    tip: "Mine the Q&A section; audience questions make the most engaging content.",
  },
  {
    c: "Social Media & Content Marketing",
    t: "Social: Community Management Response Guide",
    u: "You manage a client's comments and DMs and need consistent responses.",
    p: `Create a community management guide for [CLIENT]: tone of voice, response time targets, templates for common questions [QUESTIONS], how to handle complaints publicly then move to DM, when to escalate to the client [ESCALATION RULES], and what never to say (medical, legal or pricing promises). Include 10 sample replies.`,
    tip: "Agree escalation rules in writing. A bad reply to a crisis comment can become the story.",
  },
  {
    c: "Social Media & Content Marketing",
    t: "SEO: Content Brief for a Writer",
    u: "You need writers to produce content that ranks.",
    p: `Create an SEO content brief for [CLIENT] on [TOPIC]. Include: target keyword and related terms [KEYWORDS], search intent, audience, suggested title and headings, questions to answer, internal links [PAGES], sources to cite, word count range, and call to action. Note what makes it better than the current top results [NOTES FROM REVIEW].`,
    tip: "Tell writers what the top results miss. That gap is how new content ranks.",
  },
  {
    c: "Social Media & Content Marketing",
    t: "Influencer: Influencer Brief and Disclosure Rules",
    u: "A client is working with creators and you need a clear brief.",
    p: `Write an influencer brief for [CLIENT]'s campaign with [CREATOR TYPE]: campaign goal, key messages (2 to 3), content deliverables [DELIVERABLES], do's and don'ts, approval process, timeline, usage rights [TERMS], and FTC disclosure requirements (clear '#ad' or 'Paid partnership' at the start, not hidden). Friendly tone.`,
    tip: "Put disclosure requirements in the contract, not just the brief. Both creator and brand can be responsible.",
  },

  // ── Strategy & Campaign Planning ──
  {
    c: "Strategy & Campaign Planning",
    t: "Plan: Go-to-Market Plan for a Client Launch",
    u: "A client is launching a product and needs a marketing plan.",
    p: `Create a go-to-market plan for [CLIENT] launching [PRODUCT] to [AUDIENCE]. Include: positioning statement, key messages, channels and roles (owned, paid, earned), pre-launch, launch and post-launch phases with activities, budget split [BUDGET], KPIs, and risks. Timeline over [WEEKS] weeks.`,
    tip: "Plan the post-launch phase as carefully as launch day; most launches fade in week three.",
  },
  {
    c: "Strategy & Campaign Planning",
    t: "Plan: Marketing Funnel Audit",
    u: "You want to find where a client's funnel leaks.",
    p: `Audit [CLIENT]'s marketing funnel from these numbers: [IMPRESSIONS, CLICKS, VISITS, LEADS, QUALIFIED LEADS, CUSTOMERS, BY CHANNEL]. Calculate conversion at each stage, compare channels, identify the biggest leak, and recommend 5 fixes ranked by impact and effort. Show calculations; do not invent data.`,
    tip: "Fix the biggest leak first. Adding traffic to a leaky funnel just makes the leak more expensive.",
  },
  {
    c: "Strategy & Campaign Planning",
    t: "Plan: Messaging Framework",
    u: "A client's messaging is inconsistent across channels.",
    p: `Build a messaging framework for [CLIENT]: brand promise, positioning, 3 message pillars with proof points [PROOF], messages by audience segment [SEGMENTS], tone of voice with examples, and words to use and avoid. One page, usable by writers and designers. ${TRUE}`,
    tip: "Give examples of the voice, not adjectives. 'Friendly but expert' means different things to different writers.",
  },
  {
    c: "Strategy & Campaign Planning",
    t: "Plan: Budget Allocation Across Channels",
    u: "A client asks how to split their marketing budget.",
    p: `Recommend a budget allocation for [CLIENT] with [MONTHLY BUDGET] and goals [GOALS]. Past channel performance: [DATA BY CHANNEL]. Propose splits with reasoning, a test budget for a new channel, what to measure, and when to reallocate. Show calculations; do not invent performance data.`,
    tip: "Keep 10 to 20 percent for testing. Without it, you never discover the next good channel.",
  },
  {
    c: "Strategy & Campaign Planning",
    t: "Plan: Customer Persona From Real Data",
    u: "You want personas based on evidence, not guesses.",
    p: `Build 2 customer personas for [CLIENT] from this real data: [CUSTOMER INTERVIEWS, SURVEY RESULTS, CRM DATA, REVIEWS]. For each: goals, problems, triggers to buy, objections, where they spend time, and the message that resonates. Quote real language from the data. Mark anything inferred rather than evidenced. Avoid demographic stereotypes.`,
    tip: "Base personas on problems and behaviours, not age and gender. They are more useful and less biased.",
  },

  // ── Research & Competitive Analysis ──
  {
    c: "Research & Competitive Analysis",
    t: "Research: Customer Interview Guide",
    u: "You want to interview a client's customers to find real insights.",
    p: `Create a 30-minute customer interview guide for [CLIENT]'s customers. Include: warm-up, the moment they realised they needed a solution, alternatives they considered, why they chose [CLIENT], what almost stopped them, how they describe the value, and what they would tell a friend. Open questions only, with follow-up probes.`,
    tip: "Ask about the moment they started looking. It reveals the triggers your ads should target.",
  },
  {
    c: "Research & Competitive Analysis",
    t: "Analysis: Competitor Ad Review",
    u: "You want to understand how competitors advertise.",
    p: `Analyse these competitor ads for [CLIENT]'s market: [PASTE AD TEXT AND DESCRIPTIONS FROM AD LIBRARIES]. Identify their main messages, offers, audiences they seem to target, creative formats, and gaps [CLIENT] could own. Summarise in a table plus 5 recommendations. Do not invent competitor data.`,
    tip: "Use the platforms' public ad libraries; long-running competitor ads are usually the ones that work.",
  },
  {
    c: "Research & Competitive Analysis",
    t: "Research: Search Demand and Topic Map",
    u: "You want to map what a client's customers search for.",
    p: `From this keyword data for [CLIENT]: [KEYWORDS WITH VOLUMES FROM YOUR SEO TOOL], group keywords into topics, classify search intent, identify quick wins (existing pages to improve) and new content opportunities, and propose a 3-month content plan. Do not invent search volumes.`,
    tip: "Start with keywords where the client already ranks on page two; those move fastest.",
  },
  {
    c: "Research & Competitive Analysis",
    t: "Analysis: Brand Perception From Online Mentions",
    u: "You want to know how people talk about a client's brand.",
    p: `Analyse these online mentions and reviews of [CLIENT]: [PASTE MENTIONS]. Identify: overall sentiment, recurring praise, recurring complaints, language customers use, and comparisons with competitors. Recommend 3 messaging changes. Quote exactly; do not invent mentions.`,
    tip: "Customers' exact words make the best ad copy; they already persuaded someone.",
  },
  {
    c: "Research & Competitive Analysis",
    t: "Research: Market Sizing Estimate",
    u: "A client asks how big their market is.",
    p: `Help me estimate the market size for [PRODUCT] in [REGION] using a bottom-up approach: number of potential customers [SOURCE DATA], share likely to buy, purchase frequency, and average price [DATA]. Show every assumption and calculation, give a low, mid and high estimate, and list the data we should verify. Do not invent source data.`,
    tip: "Bottom-up estimates built from the client's own numbers are far more credible than big top-down figures.",
  },

  // ── Reporting & Performance Analysis ──
  {
    c: "Reporting & Performance Analysis",
    t: "Report: Explaining a Performance Drop",
    u: "Results dropped this month and you need to explain why.",
    p: `Write a client explanation of a performance drop for [CLIENT]: [METRIC] fell from [OLD] to [NEW]. Known factors: [FACTORS, e.g. seasonality, platform changes, budget shifts]. Include: what happened, likely causes (evidence-based), what we are doing about it [ACTIONS], and when we expect to see recovery. Honest and calm, under 280 words.`,
    tip: "Report a drop before the client notices it. Owning bad news builds more trust than good results do.",
  },
  {
    c: "Reporting & Performance Analysis",
    t: "Analysis: Attribution Explained for Clients",
    u: "Clients question which channel deserves credit for sales.",
    p: `Write a plain-language explanation for [CLIENT] of how we attribute results: the attribution model we use [MODEL], its limits (tracking gaps, privacy changes), how channels work together, and how we make decisions despite imperfect data. Under 350 words, no jargon.`,
    tip: "Explain attribution limits early. Clients who understand them stop demanding impossible precision.",
  },
  {
    c: "Reporting & Performance Analysis",
    t: "Report: Test Results Write-Up",
    u: "You ran an A/B test and want to report it properly.",
    p: `Write up this test for [CLIENT]: hypothesis [HYPOTHESIS], variants [A AND B], audience and duration [DETAILS], results [RESULTS WITH SAMPLE SIZES], and statistical confidence if calculated [CONFIDENCE]. Include what we learned, whether the result is conclusive, and the next test. Do not overstate small differences.`,
    tip: "Record inconclusive tests too. Knowing what does not matter saves future budget.",
  },
  {
    c: "Reporting & Performance Analysis",
    t: "Dashboard: KPI Dashboard Design for a Client",
    u: "A client wants one dashboard that shows what matters.",
    p: `Design a monthly KPI dashboard for [CLIENT] with goals [GOALS]. Choose 6 to 8 KPIs, define each (formula and source), set targets, show how they connect to business outcomes, and write a one-paragraph narrative template. Suggest a layout from top-line to channel detail.`,
    tip: "Put business outcomes (sales, leads) at the top and channel metrics below. Clients care about the top.",
  },
  {
    c: "Reporting & Performance Analysis",
    t: "Report: Annual Results Review",
    u: "It is the end of the year and you want to show the full value of your work.",
    p: `Write an annual results review for [CLIENT]: goals set, results achieved [RESULTS], major campaigns and learnings, how results compare with the previous year [DATA], investment and return [DATA], and recommendations for next year. Under 700 words, clear headings. ${TRUE}`,
    tip: "Pair the review with next year's plan. It turns the report into a renewal conversation.",
  },

  // ── Difficult Conversations & Objection Handling ──
  {
    c: "Difficult Conversations & Objection Handling",
    t: "Script: Client Wants Results Faster",
    u: "A client is impatient for results from SEO or brand work.",
    p: `Write talking points for a client impatient about [CHANNEL, e.g. SEO] results after [TIME]. Include: acknowledging their concern, realistic timelines with leading indicators we can show now [INDICATORS], what we are doing, options to get faster wins alongside (for example paid search), and agreeing checkpoints. Honest, no overpromising.`,
    tip: "Show leading indicators (rankings, traffic trends) so progress is visible before revenue arrives.",
  },
  {
    c: "Difficult Conversations & Objection Handling",
    t: "Email: Pushing Back on a Bad Creative Idea",
    u: "The client wants something you believe will hurt results.",
    p: `Write a respectful email pushing back on the client's request to [REQUEST]. Explain our concern with evidence [EVIDENCE OR REASONING], offer an alternative [ALTERNATIVE], and propose a test if appropriate. Acknowledge it is their decision. Under 220 words.`,
    tip: "Offer a test instead of an argument. Data settles creative disagreements without damaging the relationship.",
  },
  {
    c: "Difficult Conversations & Objection Handling",
    t: "Script: Client Asking for Unpaid Extra Work",
    u: "A client keeps asking for 'small' additions outside the scope.",
    p: `Write a friendly, firm reply to a client asking for [EXTRA WORK] outside the agreed scope. Reference the scope [SCOPE ITEM], explain what is included, offer a change request with price and timing [PRICE], or suggest what could be swapped out. Under 160 words, no defensiveness.`,
    tip: "Offering a swap ('we can do this instead of that') keeps goodwill without giving work away.",
  },
  {
    c: "Difficult Conversations & Objection Handling",
    t: "Email: Missed Deadline Apology With a Plan",
    u: "Your agency missed a deadline and the client is unhappy.",
    p: `Write an apology to [CLIENT] for missing the deadline on [DELIVERABLE]. Take responsibility without excuses, state the new delivery date [DATE], explain what we are doing to prevent it recurring [CHANGE], and offer something concrete if appropriate [GESTURE]. Under 180 words.`,
    tip: "One clear apology and a specific fix beat long explanations.",
  },
  {
    c: "Difficult Conversations & Objection Handling",
    t: "Script: Client Considering Taking Work In-House",
    u: "A client wants to move marketing in-house.",
    p: `Write talking points for a conversation with a client considering moving [SERVICES] in-house. Include: understanding their reasons, an honest comparison of costs and capabilities (hiring, tools, management time), a hybrid option (we support their team [OPTIONS]), and a graceful transition offer if they go ahead. Respectful and helpful.`,
    tip: "Offer to help them hire and train. Clients remember agencies that leave gracefully, and often return.",
  },

  // ── Operations, SOPs & Admin ──
  {
    c: "Operations, SOPs & Admin",
    t: "SOP: Client Onboarding Process",
    u: "Onboarding new clients is inconsistent across the team.",
    p: `Write a client onboarding SOP for [AGENCY NAME]: contract and invoice, welcome email, access requests (ads, analytics, CMS, social [LIST]), kickoff meeting agenda, brand and asset collection, project setup in [TOOL], first 30-day plan, and a check-in at day 30. Owner and timing for each step.`,
    tip: "Collect all platform access before kickoff; waiting for logins wastes the first two weeks.",
  },
  {
    c: "Operations, SOPs & Admin",
    t: "Pricing: Agency Service Pricing Review",
    u: "You suspect you are undercharging for some services.",
    p: `Review pricing for [SERVICES] at [AGENCY NAME]: current price, hours spent on average [HOURS], team cost per hour [COST], overhead [OVERHEAD], and target margin [MARGIN]. Calculate effective hourly rate and margin per service, flag underpriced services, and suggest new pricing or scope changes. Show calculations.`,
    tip: "Track time for one month even if you bill flat fees. It reveals which clients and services lose money.",
  },
  {
    c: "Operations, SOPs & Admin",
    t: "Hiring: Job Post for a Marketing Specialist",
    u: "You need to hire and want a fair, attractive job post.",
    p: `Write a job post for a [ROLE] at [AGENCY NAME]. Include: what the agency does and who we serve, responsibilities [DUTIES], skills and experience needed [REQUIREMENTS], tools [TOOLS], remote or office [DETAILS], pay range [RANGE] and benefits, and how to apply (portfolio or task). Inclusive wording, under 400 words.`,
    tip: "Ask for a short portfolio rather than a long test; strong candidates skip lengthy unpaid tasks.",
  },
  {
    c: "Operations, SOPs & Admin",
    t: "Policy: AI Use Policy for Agency Work",
    u: "The team uses AI for client work and you need rules.",
    p: `Draft an AI use policy for [AGENCY NAME]: approved tools [TOOLS], client confidentiality (no confidential client data in tools without appropriate terms), human review of all output, fact and claim checking, disclosure to clients [POLICY], copyright and image rights considerations, and what to do if a client prohibits AI. Under 550 words.`,
    tip: "Check client contracts; some prohibit AI-generated work, and the policy should respect that.",
  },
  {
    c: "Operations, SOPs & Admin",
    t: "Template: Project Retrospective",
    u: "You want to learn from every project.",
    p: `Create a project retrospective template for [AGENCY NAME]: goals vs results, what went well, what did not, timeline and budget variance, client feedback, and actions for next time with owners. Add facilitation tips for a blame-free 45-minute session.`,
    tip: "Run a retrospective even on successful projects. You learn what to repeat, not just what to avoid.",
  },

  // ── Agency-Specific & Specialized Tasks ──
  {
    c: "Agency-Specific & Specialized Tasks",
    t: "Brief: Video Production Brief and Shot List",
    u: "You are producing a video for a client.",
    p: `Create a video production brief for [CLIENT] for a [LENGTH] video about [TOPIC]. Include: objective, audience, key message, script outline, shot list, locations and talent [DETAILS], music and captions, formats and aspect ratios [PLATFORMS], approvals, and schedule. One page plus the shot list.`,
    tip: "Shoot vertical and horizontal versions on the day. Re-shooting for another format costs far more.",
  },
  {
    c: "Agency-Specific & Specialized Tasks",
    t: "Plan: Website Redesign Project Plan",
    u: "A client needs a website redesign and you want a clear plan.",
    p: `Create a website redesign project plan for [CLIENT]: discovery (goals, audit, analytics review), sitemap and content plan, design, development, content migration, SEO protection (redirect map, metadata), testing, launch, and post-launch monitoring. Timeline, owners, and client inputs needed at each stage.`,
    tip: "Build the redirect map before launch. Lost redirects are the most common way redesigns destroy search traffic.",
  },
  {
    c: "Agency-Specific & Specialized Tasks",
    t: "Plan: PR Pitch to Journalists",
    u: "A client has news and wants press coverage.",
    p: `Write a media pitch for [CLIENT]'s news: [NEWS]. Include a subject line, a 3-sentence pitch explaining why it matters to the outlet's readers [OUTLET], supporting facts [FACTS], an available spokesperson, and assets available. Under 180 words. Then list 10 types of outlets or journalists to target.`,
    tip: "Pitch the story, not the company. Journalists want what their readers care about.",
  },
  {
    c: "Agency-Specific & Specialized Tasks",
    t: "Plan: Email Marketing Program Setup",
    u: "A client has no email program and you are building one.",
    p: `Create an email program plan for [CLIENT] ([BUSINESS TYPE]): list growth tactics, welcome flow, nurture flows by segment, regular newsletter cadence, key automated flows (abandoned cart or lead follow-up), compliance (consent, unsubscribe, address), and KPIs. Prioritise the first 90 days.`,
    tip: "Build the welcome flow first. It usually earns more per email than any campaign.",
  },
  {
    c: "Agency-Specific & Specialized Tasks",
    t: "Brief: Local SEO Plan for a Multi-Location Client",
    u: "A client has several locations and needs local visibility.",
    p: `Create a local SEO plan for [CLIENT] with [NUMBER] locations. Include: Google Business Profile optimisation for each, location pages with unique content, review generation, citations consistency, local links, and tracking by location. A checklist per location and a 60-day rollout.`,
    tip: "Unique location pages with real local details outperform templated pages with swapped city names.",
  },

  // ── Bonus: Power Prompts ──
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Full Marketing Audit for a New Client",
    u: "You want to audit a new client's whole marketing and prioritise.",
    p: `Act as a senior marketing strategist. For [CLIENT] ([BUSINESS, GOALS, CHANNELS, BUDGET]), build an audit covering brand and messaging, website and conversion, SEO, paid media, email, social, content, analytics and tracking. For each: what to check, what good looks like, and a score template. Finish with a prioritised 90-day roadmap based on these findings: [FINDINGS].`,
    tip: "Present the three biggest opportunities, not everything you found. Focus wins approval.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Agency Positioning and Niche Strategy",
    u: "Your agency is a generalist and you want to stand out.",
    p: `Act as an agency growth consultant. My agency: [SERVICES, CLIENTS, RESULTS, TEAM]. Identify 3 niche options (by industry or problem) based on our best clients, then for the strongest: positioning statement, ideal client profile, productised service offers, pricing, 5 content pieces, and a 90-day plan to win 3 clients in the niche.`,
    tip: "Your best three clients usually point to your niche. Look for what they have in common.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Productise an Agency Service",
    u: "You want a fixed-scope, fixed-price offer that sells easily.",
    p: `Help me turn [SERVICE] into a productised offer for [TARGET CLIENT]. Define: the outcome promised (realistic), fixed deliverables, timeline, price with reasoning [COSTS], what is excluded, the delivery process with templates, a one-page sales description, and an upsell path. ${TRUE}`,
    tip: "Productised offers sell faster because buyers understand exactly what they get.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Client Retention and Expansion Program",
    u: "You want clients to stay longer and buy more.",
    p: `Design a retention and expansion program for [AGENCY NAME]: health score criteria for each client, early warning signs, QBR rhythm, proactive idea sharing, account expansion opportunities by service [SERVICES], and an escalation playbook for at-risk clients. Include a monthly review template.`,
    tip: "Share one proactive idea per month with each client; it is the cheapest retention tool you have.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Complete Campaign Kit From One Brief",
    u: "You want every campaign asset drafted from a single brief.",
    p: `From this campaign brief: [PASTE BRIEF], produce a campaign kit: key message and tagline options, 5 ad variations per channel [CHANNELS], a landing page outline, a 3-email sequence, 6 social posts, a press or blog angle, and a measurement plan. Keep all claims to the facts in the brief. ${TRUE}`,
    tip: "Generate everything, then cut hard. The kit is a starting point for your team's judgement, not the final work.",
  },
];
