import type { PromptDraft } from "./define";

// Additions to the Finance Professionals toolkit (accountants, bookkeepers,
// tax preparers, financial advisors). No guarantees, return predictions or
// performance claims; advice stays within the professional's scope.

const SAFE = "No guarantees, return predictions or performance claims, and nothing that reads as individual investment or tax advice beyond what I specify.";

export const FINANCE_EXTRA: PromptDraft[] = [
  // ── Client Emails & Everyday Communication ──
  {
    c: "Client Emails & Everyday Communication",
    t: "Email Explaining a Delay in Their Return or Deliverable",
    u: "Work is running late and you need to tell the client honestly.",
    p: `Write an email to a client explaining that their [DELIVERABLE, e.g. tax return, financial statements] will be later than expected. Reason [REASON, e.g. waiting on a corrected 1099, a complex item]. New expected date [DATE]. What we need from them [IF ANYTHING]. Any deadline implications and how we are handling them [EXTENSION OR NONE]. Honest, calm, under 180 words.`,
    tip: "Tell clients about delays before the date passes. Proactive notice turns frustration into trust.",
  },
  {
    c: "Client Emails & Everyday Communication",
    t: "Email Responding to a Client's Urgent 'Quick Question'",
    u: "A client sends a 'quick question' that actually needs real work.",
    p: `Write a friendly reply to a client's question: [QUESTION]. Acknowledge it, explain briefly why it needs a proper look (it affects [WHAT]), outline what we would do [STEPS], the time or fee involved [FEE OR SCOPE NOTE], and offer a time to discuss. Under 150 words. Do not answer the substance until the scope is agreed.`,
    tip: "Pricing 'quick questions' openly protects your time and teaches clients which questions are included.",
  },
  {
    c: "Client Emails & Everyday Communication",
    t: "Email Explaining a Secure Document Portal",
    u: "Clients keep emailing sensitive documents and you want them to use the portal.",
    p: `Write an email to clients of [FIRM NAME] explaining why we use a secure portal [PORTAL NAME] instead of email for tax and financial documents: protecting their identity, how to log in [STEPS], how to upload, and who to call for help [CONTACT]. Friendly, under 200 words. Add a short reply template for when a client emails sensitive documents anyway.`,
    tip: "Reply to every emailed Social Security number with the portal link. Habits change after a few gentle reminders.",
  },
  {
    c: "Client Emails & Everyday Communication",
    t: "Email Announcing Your Busy-Season Schedule",
    u: "Tax season is coming and clients need to know how to work with you.",
    p: `Write an email to clients of [FIRM NAME] about busy-season arrangements for [YEAR]: our document deadline for timely filing [DATE], how to book appointments [LINK], response times during busy season [TIMES], extension policy [POLICY], and fee or engagement letter reminders [DETAILS]. Clear, friendly, under 230 words.`,
    tip: "A firm internal document deadline, well communicated, is the single best defence against April chaos.",
  },
  {
    c: "Client Emails & Everyday Communication",
    t: "Email Warning Clients About Tax and Phishing Scams",
    u: "Scams spike during tax season and you want to protect clients.",
    p: `Write a scam alert email for clients of [FIRM NAME]: the IRS generally makes first contact by mail and does not demand immediate payment by gift card or wire, how we will and will not contact them, examples of common scams (fake IRS calls, phishing emails impersonating us), and what to do if they are unsure (call us at [VERIFIED NUMBER]). Under 220 words, calm and practical.`,
    tip: "Send it in January. Clients remember the firm that warned them before the scam call came.",
  },

  // ── Client Onboarding & Meetings ──
  {
    c: "Client Onboarding & Meetings",
    t: "Checklist Onboarding a Business Client for Bookkeeping",
    u: "A new small business client needs bookkeeping set up properly.",
    p: `Create an onboarding checklist for a new bookkeeping client, a [BUSINESS TYPE] using [SOFTWARE]. Include: access to bank and card feeds, prior-year returns and financials, chart of accounts review, payroll provider, sales tax registrations [STATES], recurring vendors, receipts process, owner draws and reimbursements, month-end timeline, and the first catch-up period. Owner and deadline per item.`,
    tip: "Agree the receipts process on day one. Missing receipts are the biggest monthly-close bottleneck.",
  },
  {
    c: "Client Onboarding & Meetings",
    t: "Agenda for a Mid-Year Tax Planning Meeting",
    u: "You want to help clients act before year-end, not just report after.",
    p: `Create a 45-minute mid-year tax planning meeting agenda for a [CLIENT TYPE, e.g. small business owner, W-2 household]. Include: changes this year (income, family, business), year-to-date review, estimated payments, retirement contribution options, timing of income and expenses, entity or payroll questions, and action items with deadlines. Add 8 questions to send the client beforehand. ${SAFE}`,
    tip: "Mid-year meetings are where you prove value. Clients rarely leave an adviser who saves them money proactively.",
  },
  {
    c: "Client Onboarding & Meetings",
    t: "Script Explaining Your Fee Structure in the First Meeting",
    u: "You want prospects to understand fees clearly before they sign.",
    p: `Write a clear script for explaining how [FIRM NAME] charges: [FEE MODEL, e.g. flat monthly, fixed fee per return, AUM percentage, hourly]. Include what is included, what costs extra [EXTRAS], how often fees change, and how clients are billed. Honest and simple, under 200 words, with answers to 'Why not hourly?' and 'Can I pay less if I do more myself?'.`,
    tip: "Explaining fees confidently in the first meeting reduces price objections later.",
  },
  {
    c: "Client Onboarding & Meetings",
    t: "Template Engagement Letter Summary Page",
    u: "Clients sign engagement letters without reading them.",
    p: `Write a one-page plain-language summary to accompany our engagement letter for [SERVICE]. Cover: what we will do, what we will not do, what the client must provide and by when, fees and billing, responsibility for accuracy of information provided, and how either side can end the engagement. Note that the full engagement letter controls. Under 350 words.`,
    tip: "A one-page summary cuts scope disputes because clients actually read it.",
  },
  {
    c: "Client Onboarding & Meetings",
    t: "Email Preparing a Client for Their First Review Meeting",
    u: "You want clients to arrive at review meetings prepared.",
    p: `Write a pre-meeting email for a [REVIEW TYPE] with [CLIENT PLACEHOLDER] on [DATE]. Include: the agenda [TOPICS], documents or updates to bring [LIST], 3 questions to think about beforehand, how long it will take, and how to join [DETAILS]. Under 180 words.`,
    tip: "Pre-meeting questions make clients think in advance, which makes the meeting twice as productive.",
  },

  // ── Marketing & Social Media Content ──
  {
    c: "Marketing & Social Media Content",
    t: "Post Explaining One Tax Change for Small Businesses",
    u: "A tax rule changed and you want to explain it simply to your audience.",
    p: `Write a LinkedIn post explaining [TAX CHANGE] for small business owners. Include what changed (only the facts I give: [FACTS]), who it affects, one practical action, and an invitation to talk. Under 180 words, plain language. Add a line that it is general information, not advice for their situation.`,
    tip: "One change, one action. Posts that tell people what to do get saved and shared.",
  },
  {
    c: "Marketing & Social Media Content",
    t: "Plan Content Series Answering Client Questions",
    u: "You want content ideas that come directly from what clients ask.",
    p: `Turn these client questions: [PASTE QUESTIONS] into a 6-week content series for [FIRM NAME]. For each week: a post title, the main point, a short video idea, and an email newsletter angle. Plain language and general information only. ${SAFE}`,
    tip: "Every question you answer twice is a piece of content waiting to be written.",
  },
  {
    c: "Marketing & Social Media Content",
    t: "Website Service Page for Bookkeeping or Tax Services",
    u: "Your service pages are thin and do not convert.",
    p: `Write a service page for [SERVICE] at [FIRM NAME] in [AREA]. Include: who it is for, problems it solves, what is included, how the process works, pricing approach [PRICING OR 'FROM'], credentials (facts: [CPA, EA, YEARS]), FAQs (4), and how to book. 500 to 700 words. ${SAFE}`,
    tip: "Showing pricing ('from $X a month') filters out poor-fit leads and builds trust.",
  },
  {
    c: "Marketing & Social Media Content",
    t: "Email Invitation to a Year-End Planning Webinar",
    u: "You want to fill a webinar and turn attendees into clients.",
    p: `Write a promotion kit for a year-end planning webinar by [FIRM NAME] on [DATE]: an invitation email, a reminder email, a LinkedIn post, and a follow-up email for attendees with a consultation offer. Topic: [TOPICS]. Each under 180 words. General education only; no promises of savings.`,
    tip: "The follow-up email to attendees is where clients come from. Send it within 24 hours.",
  },
  {
    c: "Marketing & Social Media Content",
    t: "Profile Adviser or CPA Bio That Builds Trust",
    u: "Your bio lists credentials but does not connect with clients.",
    p: `Write a website bio for [NAME, CREDENTIALS] at [FIRM NAME]. Facts: experience [YEARS AND FOCUS], who they serve [CLIENTS], approach [APPROACH], credentials and licences [LIST], and a personal detail they approved [DETAIL]. 180 to 220 words, warm and specific. Use only credentials that are held; no 'best' or 'top' claims. For registered advisers, include required disclosures [DISCLOSURE TEXT].`,
    tip: "Say who you work best with. Specific bios attract the right clients and gently filter the rest.",
  },

  // ── Prospecting, Referrals & Follow-Ups ──
  {
    c: "Prospecting, Referrals & Follow-Ups",
    t: "Email to a New Business Owner Who Just Registered",
    u: "You want to reach new businesses early, before they pick an accountant.",
    p: `Write a helpful outreach email from [FIRM NAME] to a new [BUSINESS TYPE] owner in [AREA]. Offer a free resource [CHECKLIST, e.g. first-year tax and bookkeeping checklist], mention 3 common first-year mistakes in general terms, and invite a short call. Under 150 words, helpful, not salesy. Comply with email marketing rules (identify yourself, include opt-out and address).`,
    tip: "Lead with the checklist. New owners are overwhelmed and remember who helped first.",
  },
  {
    c: "Prospecting, Referrals & Follow-Ups",
    t: "Script Asking a Banker or Attorney for Referrals",
    u: "You want professional referral partners, not just client referrals.",
    p: `Write talking points for a coffee meeting with a [PARTNER TYPE] to build a referral relationship. Include: learning about their clients and needs, explaining the clients I serve best [CLIENT PROFILE], how I would look after their clients (response time, communication), how I refer to them, and a simple next step. Natural, reciprocal tone. No referral fees where prohibited.`,
    tip: "Ask what makes a referral a good experience for them. Then deliver exactly that on the first one.",
  },
  {
    c: "Prospecting, Referrals & Follow-Ups",
    t: "Email Following Up After a Free Consultation",
    u: "A prospect had a consultation and you want to convert them.",
    p: `Write a follow-up email after a consultation with [PROSPECT PLACEHOLDER] about [NEED]. Summarise what we discussed [KEY POINTS], what we recommend [SERVICE], price and next steps [PROPOSAL], and a clear deadline if one matters [e.g. tax deadline]. Under 200 words, warm and specific.`,
    tip: "Send it the same day, while the conversation is fresh. Speed signals the service they will get.",
  },
  {
    c: "Prospecting, Referrals & Follow-Ups",
    t: "Plan Referral Thank-You Program",
    u: "You want to thank people who refer clients, appropriately.",
    p: `Design a referral thank-you approach for [FIRM NAME]: a handwritten note template, a small gift idea within ethical limits [PROFESSIONAL RULES], how to update the referrer (with client consent), and a yearly appreciation touch. Keep it compliant with rules on referral fees for [CPA, EA OR REGISTERED ADVISER]. One page.`,
    tip: "A handwritten note within a week of the referral does more than any gift.",
  },
  {
    c: "Prospecting, Referrals & Follow-Ups",
    t: "Response to 'I Found a Cheaper Accountant'",
    u: "A client or prospect is comparing you with a lower-priced option.",
    p: `Write a respectful response to a client who said they found a cheaper [SERVICE] provider. Include: thanking them, asking what matters most to them, clarifying what our fee includes [INCLUDED], questions to compare fairly (scope, responsiveness, audit support, planning), and letting them decide without pressure. Under 180 words, no criticism of the competitor.`,
    tip: "Give them comparison questions in writing. Clients often discover the cheaper quote leaves things out.",
  },

  // ── Financial Planning & Advisory Work ──
  {
    c: "Financial Planning & Advisory Work",
    t: "Explainer: Emergency Fund and Cash Reserves",
    u: "Clients ask how much cash they should keep on hand.",
    p: `Write a plain-language client explainer on emergency funds and cash reserves for [CLIENT TYPE, e.g. households, small business owners]. Cover common rules of thumb and why they vary, where people usually keep reserves, how to build one gradually, and when to revisit it. Under 350 words, general education. ${SAFE}`,
    tip: "Frame reserves in months of expenses, using the client's own numbers; it makes the target real.",
  },
  {
    c: "Financial Planning & Advisory Work",
    t: "Worksheet: Cash Flow Review for a Client",
    u: "A client does not know where their money goes each month.",
    p: `Create a simple monthly cash flow worksheet and a guide for reviewing it with a client: income, fixed costs, variable costs, savings and debt payments, and the gap. Then use these numbers [CLIENT NUMBERS] to produce a summary with 3 observations and 3 questions for the meeting. Non-judgemental tone. ${SAFE}`,
    tip: "Ask the client to track one month before the meeting. Their own numbers change behaviour more than advice does.",
  },
  {
    c: "Financial Planning & Advisory Work",
    t: "Talking Points for Required Minimum Distributions",
    u: "A client is approaching RMD age and needs a clear explanation.",
    p: `Write talking points explaining required minimum distributions to a client turning [AGE]. Cover in general terms: what RMDs are, when they start under current rules (confirm the current age threshold), which accounts they apply to, how the amount is calculated in principle, deadlines, and options for timing and withdrawal. Plain language. Note that rules changed recently and should be confirmed for the client's situation. ${SAFE}`,
    tip: "RMD rules have changed several times since 2019. Always confirm the current thresholds before the meeting.",
  },
  {
    c: "Financial Planning & Advisory Work",
    t: "Checklist: Financial To-Dos After a Major Life Event",
    u: "A client married, divorced, had a child or lost a spouse.",
    p: `Create a financial checklist for a client after [LIFE EVENT]: accounts and titling, beneficiaries, insurance, tax filing status and withholding, estate documents, budgets, and deadlines. Group by 'this month', 'within 3 months' and 'within a year'. Compassionate introduction for difficult events. General guidance; items to review with their advisers.`,
    tip: "Life events are when clients value you most. A thoughtful checklist is remembered for years.",
  },
  {
    c: "Financial Planning & Advisory Work",
    t: "Explainer: Retirement Account Types Compared",
    u: "Clients confuse 401(k), IRA, Roth and SEP accounts.",
    p: `Write a plain-language comparison of [ACCOUNT TYPES, e.g. 401(k), traditional IRA, Roth IRA, SEP IRA, Solo 401(k)] for [CLIENT TYPE]. Table: who can use it, tax treatment going in and coming out, general contribution rules (say limits change yearly and confirm current figures), and typical uses. Then 3 questions to discuss with the client. ${SAFE}`,
    tip: "Contribution limits change every year; link to the IRS page rather than hard-coding numbers in client material.",
  },

  // ── Tax Season & Accounting Workflows ──
  {
    c: "Tax Season & Accounting Workflows",
    t: "Email Explaining What Records to Keep and for How Long",
    u: "Clients ask what they can throw away.",
    p: `Write a client guide on record retention for [CLIENT TYPE, e.g. individuals, small businesses]: common documents and general IRS guidance on how long to keep them (for example, generally 3 years after filing, longer in some situations), what to keep permanently, digital storage tips, and secure disposal. Under 300 words. Note that some situations need longer retention and to ask us.`,
    tip: "Send it after filing season with a 'what to shred' checklist. Clients love decluttering permission.",
  },
  {
    c: "Tax Season & Accounting Workflows",
    t: "Checklist Year-End Close for Small Business Clients",
    u: "You want every business client's year-end closed cleanly.",
    p: `Create a year-end close checklist for small business clients using [SOFTWARE]: reconcile all accounts, review receivables and payables, inventory count [IF APPLICABLE], fixed asset additions, payroll and contractor reporting (1099s, W-2s) deadlines, accruals, owner equity, and documents to request from the client. Owner and deadline per item.`,
    tip: "Request 1099 vendor details in November. January is too late to chase missing tax IDs.",
  },
  {
    c: "Tax Season & Accounting Workflows",
    t: "Email Explaining an Amended Return",
    u: "A client needs to amend a return and is worried.",
    p: `Write a calm email to a client explaining why their [YEAR] return needs to be amended: reason [REASON, e.g. a corrected 1099 arrived]. Explain what an amended return is, whether they are likely to owe or receive money [IF KNOWN], typical timing, fees [FEE], and next steps. Under 200 words, reassuring and factual.`,
    tip: "Explain that amending is normal and responsible. Clients fear the word more than the process.",
  },
  {
    c: "Tax Season & Accounting Workflows",
    t: "SOP Tax Return Review Checklist",
    u: "You want fewer errors getting to clients and the IRS.",
    p: `Create a tax return review checklist for [RETURN TYPE, e.g. Form 1040, 1120-S] at [FIRM NAME]: prior-year comparison, source documents matched, carryovers, estimated payments, credits and eligibility, state returns, signatures and e-file authorisation, and client letter. Two-level review: preparer and reviewer. Checkbox format.`,
    tip: "A prior-year comparison catches most errors in minutes. Make it the first step, not the last.",
  },
  {
    c: "Tax Season & Accounting Workflows",
    t: "Email Explaining a Balance Due and Payment Options",
    u: "A client owes more than they can pay right now.",
    p: `Write a supportive email to a client who owes [AMOUNT] for [YEAR]. Explain the filing and payment deadline [DATE], that filing on time matters even if they cannot pay in full, general IRS payment options (payment plans, short-term extensions to pay), how interest and penalties work in general terms, and how we can help set up a plan. Under 230 words, calm and non-judgemental.`,
    tip: "Tell clients to file on time even if they cannot pay. The failure-to-file penalty is usually far larger.",
  },

  // ── Pricing, Proposals & Client Reports ──
  {
    c: "Pricing, Proposals & Client Reports",
    t: "Proposal: Moving a Client to a Monthly Advisory Package",
    u: "You want to move clients from one-off work to a monthly package.",
    p: `Write a proposal to move [CLIENT PLACEHOLDER] from [CURRENT ARRANGEMENT] to a monthly package: [PACKAGE CONTENTS AND PRICE]. Explain what changes for them (year-round access, planning, fewer surprises), what is included, and how billing works. Under 350 words, focused on their benefits, with a simple yes step.`,
    tip: "Show what they paid last year for ad hoc work next to the package price; the comparison often sells it.",
  },
  {
    c: "Pricing, Proposals & Client Reports",
    t: "Report: Monthly Financial Snapshot for a Business Owner",
    u: "Business clients do not read financial statements.",
    p: `Turn these monthly figures for a [BUSINESS TYPE] into a one-page snapshot for the owner: [REVENUE, GROSS MARGIN, EXPENSES, NET PROFIT, CASH, RECEIVABLES, PAYABLES, PRIOR MONTH]. Include 5 key numbers with plain explanations, what changed and why (if known), 2 things to watch, and one question for our next call. Do not invent figures.`,
    tip: "Owners read one page with plain words. Save the full statements for the appendix.",
  },
  {
    c: "Pricing, Proposals & Client Reports",
    t: "Analysis: Cash Flow Forecast for a Small Business",
    u: "A business client wants to know if they will run short of cash.",
    p: `Build a 13-week cash flow forecast outline for a [BUSINESS TYPE] from: opening cash [AMOUNT], expected receipts by week [RECEIPTS], fixed payments [PAYMENTS], payroll [PAYROLL], and known one-off items [ITEMS]. Show the weekly table, the lowest cash point, and 3 options if cash gets tight. Show calculations; do not invent numbers.`,
    tip: "Update the forecast weekly with actuals; its value is in spotting the pinch point weeks ahead.",
  },
  {
    c: "Pricing, Proposals & Client Reports",
    t: "Email: Annual Price Adjustment With Value Recap",
    u: "Fees need to rise and you want to justify them with value.",
    p: `Write an email announcing a fee adjustment for [SERVICE] from [OLD] to [NEW] starting [DATE]. Include a short recap of what we did for them this year [HIGHLIGHTS], why fees are changing [REASON], what stays the same, and how to discuss it. Warm, confident, under 220 words.`,
    tip: "Lead with the value recap, not the price. Clients accept increases they can see the reason for.",
  },
  {
    c: "Pricing, Proposals & Client Reports",
    t: "Pricing: Value-Based Pricing Worksheet",
    u: "You want to move away from hourly billing.",
    p: `Act as a pricing consultant for accounting firms. Build a value-pricing worksheet for [SERVICE]: the client's outcomes and what they are worth to them [OUTCOMES], our costs and hours [COSTS], complexity factors, risk, and three price options. Then draft the price conversation script. Show the reasoning.`,
    tip: "Ask the client what the outcome is worth to them before quoting; it changes what they expect to pay.",
  },

  // ── Operations, SOPs & Admin ──
  {
    c: "Operations, SOPs & Admin",
    t: "Policy Written Information Security Plan (WISP) Outline",
    u: "Tax preparers must have a written security plan and you need one.",
    p: `Create an outline for a Written Information Security Plan for [FIRM NAME], a [SIZE] tax and accounting firm, following IRS Publication 5708 and the FTC Safeguards Rule. Sections: responsible person, risk assessment, employee training, access controls, multi-factor authentication, encryption, vendor oversight, incident response, and annual review. Mark items to complete as [TO DO]. I will confirm requirements against the current IRS guidance.`,
    tip: "A WISP is required for paid tax preparers. Having one also lowers the damage if a breach happens.",
  },
  {
    c: "Operations, SOPs & Admin",
    t: "Plan Automating Recurring Client Reminders",
    u: "You spend hours sending the same reminders every month.",
    p: `Design an automated reminder system for [FIRM NAME] using [TOOLS]: estimated tax payment reminders, document requests, monthly bookkeeping deadlines, and engagement letter renewals. For each: trigger, timing, message (under 80 words), and when a person should step in. Include a testing checklist.`,
    tip: "Automate the routine reminders, and keep personal messages for the clients who ignore them.",
  },
  {
    c: "Operations, SOPs & Admin",
    t: "Checklist Capacity Planning Before Busy Season",
    u: "You want to know if the team can handle the workload before it arrives.",
    p: `Create a capacity plan for [FIRM NAME]'s busy season: client list by service and complexity [COUNTS], hours per return or engagement [ESTIMATES], staff hours available [HOURS], and target completion dates. Calculate whether capacity covers demand, and suggest options if not (earlier deadlines, extensions, temporary help, declining new work). Show calculations.`,
    tip: "Most burnout in busy season was predictable in November. Run the numbers early.",
  },
  {
    c: "Operations, SOPs & Admin",
    t: "Training Guide for Seasonal Staff",
    u: "You hire seasonal help and need them productive fast.",
    p: `Create a one-week training guide for seasonal staff at [FIRM NAME] doing [ROLE]. Include: systems and logins, security and confidentiality rules, workflow and status tracking, common return types and review standards, client communication rules, and who to ask. Day-by-day plan with a check-off list.`,
    tip: "Pair seasonal staff with one reviewer for their first ten returns; errors drop quickly.",
  },
  {
    c: "Operations, SOPs & Admin",
    t: "Policy AI Use in an Accounting Practice",
    u: "Staff use AI tools and you need rules to protect client data.",
    p: `Draft an AI use policy for [FIRM NAME]: approved tools [TOOLS], never entering client personal or tax information into tools without appropriate confidentiality terms, reviewing all AI output, not relying on AI for tax law conclusions without checking sources, disclosure to clients where appropriate, and alignment with the firm's WISP. Under 500 words.`,
    tip: "Add it to your WISP. Regulators increasingly expect AI tools to be covered by your security plan.",
  },

  // ── Difficult Clients & Sticky Situations ──
  {
    c: "Difficult Clients & Sticky Situations",
    t: "Email Declining to Take an Aggressive Tax Position",
    u: "A client wants you to claim something you are not comfortable with.",
    p: `Write a respectful, firm email to a client who wants to claim [POSITION]. Explain in plain terms why we cannot support it as requested [REASON], the risks (penalties, audits), and what we can do instead [ALTERNATIVES]. Keep the relationship, under 220 words. Our professional standards apply (Circular 230 or AICPA standards as relevant).`,
    tip: "Put the conversation in writing after the call; it protects you if the client later files elsewhere.",
  },
  {
    c: "Difficult Clients & Sticky Situations",
    t: "Script Delivering News of an IRS Audit Letter",
    u: "A client received an audit or examination letter and is frightened.",
    p: `Write talking points for a call with a client who received [NOTICE TYPE] for [YEAR]. Include: calming them (most notices are resolvable), what the letter asks for [SUMMARY], the response deadline [DATE], what we will do, what they must not do (ignore it, call the IRS without us if we represent them), representation fees [FEE], and next steps.`,
    tip: "Most IRS letters are correspondence notices, not in-person audits. Saying so early lowers anxiety.",
  },
  {
    c: "Difficult Clients & Sticky Situations",
    t: "Email Handling a Client Who Keeps Missing Deadlines",
    u: "A client's late documents keep putting deadlines at risk.",
    p: `Write a firm, friendly email to a client who has missed [NUMBER] document deadlines. Explain the impact [RISK, e.g. extension needed, penalties, rush fees], restate the new deadline [DATE], what happens if it is missed [POLICY], and offer help to make it easier [SUPPORT]. Under 180 words.`,
    tip: "State the consequence once, clearly, then apply it consistently. Inconsistency teaches clients to be late.",
  },
  {
    c: "Difficult Clients & Sticky Situations",
    t: "Response to a Client Upset About Their Refund Size",
    u: "A client blames you because their refund is smaller than last year.",
    p: `Write an email to a client upset that their refund dropped from [LAST YEAR] to [THIS YEAR]. Explain in plain words the main reasons [REASONS, e.g. withholding changes, income changes, expired credits], that a refund is a return of over-withheld tax, and how to adjust withholding for next year [SUGGESTION]. Empathetic, under 230 words.`,
    tip: "Offer a quick withholding check. Turning the complaint into a plan usually ends the frustration.",
  },
  {
    c: "Difficult Clients & Sticky Situations",
    t: "Email Responding to a Client Who Wants Their Files",
    u: "A departing client requests their records.",
    p: `Write a professional email responding to a client's request for their records as they move to another firm. Confirm what we will provide (their original documents and [RECORDS PER OUR POLICY AND PROFESSIONAL RULES]), timing, format, any outstanding fees and how professional rules treat records in that situation [CHECK RULES], and a courteous close. Under 200 words.`,
    tip: "Professional rules often require returning client-provided records even if fees are unpaid. Check before withholding anything.",
  },

  // ── Bonus: Power Prompts ──
  {
    c: "Bonus: Power Prompts",
    t: "Plan Complete Tax Planning Letter for a Business Owner",
    u: "You want a year-end planning letter that shows real value.",
    p: `Act as a senior tax adviser. From this client profile: [BUSINESS TYPE, ENTITY, INCOME ESTIMATE, PAYROLL, RETIREMENT PLANS, MAJOR PURCHASES PLANNED], draft a year-end planning letter: key opportunities to discuss (retirement contributions, timing of income and expenses, equipment purchases, entity and payroll considerations), each with an estimated effect only if I provide the numbers, deadlines, and decisions needed from the client. Mark every item for review before sending. ${SAFE}`,
    tip: "Send it in October. Planning letters in December leave too little time to act.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan Client Advisory Board Meeting",
    u: "You want feedback and loyalty from your best clients.",
    p: `Design a client advisory board for [FIRM NAME]: who to invite (6 to 10 clients of different types), the meeting format (90 minutes, twice a year), discussion questions about our services, communication and pricing, how to thank members, and how to report back what we changed. Include an invitation email.`,
    tip: "Clients on an advisory board almost never leave, and they refer more. It is marketing disguised as feedback.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan Launching a Fractional CFO Service",
    u: "You want to offer higher-value advisory work to growing businesses.",
    p: `Act as a consultant to accounting firms. Help me design a fractional CFO service for [TARGET CLIENTS]. Include: what is included at 3 tiers, pricing logic, deliverables and meeting rhythm, skills and tools needed, how to identify candidates in my current client base [CLIENT LIST SUMMARY], a pilot plan, and a one-page service description.`,
    tip: "Start with three existing clients who already ask advisory questions; they are your pilot.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan Full Busy-Season Operations Playbook",
    u: "You want to run the next busy season calmly from start to finish.",
    p: `Create a busy-season playbook for [FIRM NAME]: pre-season (engagement letters, organisers, deadlines, capacity), intake and status tracking, review standards, client communication calendar, extension strategy, staff wellbeing, and post-season review. Month by month from [START] to [END], with owners and templates needed.`,
    tip: "Hold the post-season review within two weeks of the deadline, while the pain is still fresh.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan Niche Firm Positioning",
    u: "You want to specialise in an industry to stand out.",
    p: `Act as a marketing strategist for accounting and advisory firms. My firm: [SERVICES, CLIENT MIX, LOCATION]. Evaluate niches [OPTIONS, e.g. dental practices, construction, creators] using my current clients, market demand and competition. For the strongest: positioning statement, service packages, pricing approach, 5 content ideas, referral partners, and a 90-day launch plan.`,
    tip: "Look at your five most profitable clients. Your niche is often already in your client list.",
  },
];
