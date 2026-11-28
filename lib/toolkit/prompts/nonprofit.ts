import type { PromptDraft } from "./define";

// Additions to the Nonprofit toolkit. Donor communication stays honest about
// how gifts are used; stories about people served need their consent.

const HONEST = "Do not invent statistics, outcomes or stories; use only what I provide, and never imply a gift is fully tax-deductible when the donor receives something in return.";

export const NONPROFIT_EXTRA: PromptDraft[] = [
  // ── Donor Communication & Stewardship ──
  {
    c: "Donor Communication & Stewardship",
    t: "Call: Thank-You Call Script for Board Members",
    u: "You want board members to make thank-you calls but they do not know what to say.",
    p: `Write a 60-second thank-you call script for board members of [ORGANIZATION] calling donors who gave [AMOUNT RANGE] recently. Include: a warm opener, a specific thank-you for their gift to [PROGRAM], one sentence on impact [IMPACT FACT], a question about why they give, and a close with no ask. Add a voicemail version under 30 seconds. ${HONEST}`,
    tip: "Donors who get a thank-you call from a board member are far more likely to give again. No ask makes it memorable.",
  },
  {
    c: "Donor Communication & Stewardship",
    t: "Letter: Gift Acknowledgement Receipt With Required Language",
    u: "You need acknowledgement letters that meet IRS substantiation rules.",
    p: `Write a donation acknowledgement letter for [ORGANIZATION], a 501(c)(3). Include: donor name and gift date placeholders, the amount [AMOUNT] (or description of non-cash property, without a value), and the statement of whether any goods or services were provided in return [NONE / DESCRIPTION AND GOOD-FAITH ESTIMATE OF VALUE]. Warm thank-you first, then the required details. Under 220 words. Note: gifts of $250 or more require this written acknowledgement.`,
    tip: "Never put a value on donated goods in the receipt; that is the donor's responsibility, not yours.",
  },
  {
    c: "Donor Communication & Stewardship",
    t: "Email: Mid-Year Impact Update to Monthly Donors",
    u: "Monthly donors need to feel their steady giving matters.",
    p: `Write a mid-year email to monthly sustaining donors of [ORGANIZATION]. Share what their recurring gifts made possible this year [FACTS], one short story with consent [STORY], what is coming next [PLANS], and a thank-you. No ask. Under 250 words, warm and specific. ${HONEST}`,
    tip: "Monthly donors often get forgotten because they give automatically. A dedicated update keeps them giving.",
  },
  {
    c: "Donor Communication & Stewardship",
    t: "Plan: Planned Giving Introduction Conversation",
    u: "You want to raise legacy giving with loyal donors sensitively.",
    p: `Create a guide for introducing planned giving to long-time donors of [ORGANIZATION]: who to approach (loyalty over size), how to open the topic gently, 5 questions about their values and legacy, simple ways to leave a gift (bequest language [SAMPLE LANGUAGE FROM COUNSEL]), and follow-up. Respectful; encourage them to consult their own advisers. No pressure.`,
    tip: "Loyal donors of modest gifts are often the best legacy prospects. Look at years of giving, not size.",
  },
  {
    c: "Donor Communication & Stewardship",
    t: "Email: Donor Survey to Learn Why People Give",
    u: "You want to understand your donors' motivations.",
    p: `Write a short donor survey invitation and 6 questions for [ORGANIZATION]: why they first gave, what they care about most [PROGRAM OPTIONS], how they prefer to hear from us, what would make them give more or more often, and one open question. Under 120 words for the invitation, and promise to share what we learn.`,
    tip: "Share the survey results back to donors. Being listened to is itself a stewardship touch.",
  },

  // ── Grant Writing & Fundraising Proposals ──
  {
    c: "Grant Writing & Fundraising Proposals",
    t: "Section: Evaluation Plan for a Grant Proposal",
    u: "Funders want to know how you will measure results.",
    p: `Write an evaluation plan section for a grant proposal for [PROGRAM]. Outcomes: [OUTCOMES]. Include: indicators for each outcome, data collection methods and timing, who collects and analyses data, how participant privacy is protected, how findings will be used and reported to the funder, and budget for evaluation [AMOUNT IF ANY]. Realistic for an organization of our size [STAFF]. Under 450 words.`,
    tip: "Promise only what you can measure with the staff you have. Funders remember unmet evaluation promises.",
  },
  {
    c: "Grant Writing & Fundraising Proposals",
    t: "Section: Organizational Capacity and Sustainability",
    u: "Grant applications ask how you will sustain the program after funding ends.",
    p: `Write the organizational capacity and sustainability sections for a grant to [FUNDER] for [PROGRAM]. Capacity facts: [YEARS, STAFF, BUDGET, PAST RESULTS, PARTNERS]. Sustainability plan: [OTHER FUNDING SOURCES, EARNED REVENUE, PARTNERSHIPS]. Be specific and realistic, under 400 words total. ${HONEST}`,
    tip: "Name specific future funding sources. 'We will diversify funding' is the phrase reviewers trust least.",
  },
  {
    c: "Grant Writing & Fundraising Proposals",
    t: "Checklist: Grant Application Compliance Check",
    u: "You want to make sure an application meets every requirement before submitting.",
    p: `Create a pre-submission checklist from these funder guidelines: [PASTE GUIDELINES]. Include every required section, page and word limits, formatting, attachments (budget, audit, 990, board list, letters of support), eligibility items, and the deadline and submission method. Then review this draft [PASTE DRAFT OR OUTLINE] against the checklist and list what is missing.`,
    tip: "Missing attachments disqualify more applications than weak writing. Check them first.",
  },
  {
    c: "Grant Writing & Fundraising Proposals",
    t: "Letter: Letter of Support Request to a Partner",
    u: "You need partner letters of support for a grant.",
    p: `Write a request to [PARTNER ORGANIZATION] for a letter of support for our [FUNDER] application for [PROGRAM], due [DATE]. Explain the program briefly, their role [ROLE], and include a draft letter they can adapt: what they know of our work, how they will partner [COMMITMENT], and why the program matters. Make it easy for them. Under 300 words total.`,
    tip: "Send a draft letter with every request; partners are busy and appreciate not starting from scratch.",
  },
  {
    c: "Grant Writing & Fundraising Proposals",
    t: "Pitch: Corporate Sponsorship Proposal",
    u: "You want a local business to sponsor a program.",
    p: `Write a one-page sponsorship proposal from [ORGANIZATION] to [COMPANY] for [PROGRAM OR EVENT]. Include: why this fits their values and community [CONNECTION], what the sponsorship funds [USE], sponsorship levels and recognition [LEVELS], employee engagement opportunities, and next steps. Under 400 words. ${HONEST}`,
    tip: "Offer employee volunteering with the sponsorship; companies value engagement as much as logo placement.",
  },

  // ── Social Media & Content Marketing ──
  {
    c: "Social Media & Content Marketing",
    t: "Post: Explaining Where Donations Go",
    u: "Supporters ask how their money is used.",
    p: `Write 3 social posts explaining how donations to [ORGANIZATION] are used, using our real figures [BUDGET BREAKDOWN] and concrete examples ([AMOUNT] provides [WHAT]). Honest, transparent, under 80 words each. Do not claim 100% goes to programs unless it is true and explained. ${HONEST}`,
    tip: "Concrete equivalents ('$40 = a week of meals') work when accurate. Keep the calculation on file.",
  },
  {
    c: "Social Media & Content Marketing",
    t: "Video: Short Video Scripts Featuring Staff",
    u: "You want authentic short videos without a video team.",
    p: `Write 4 scripts for 30 to 45-second phone videos featuring staff at [ORGANIZATION]: a program coordinator explaining a typical day, a volunteer sharing why they help, a quick 'myth vs fact' about our cause, and a thank-you to donors. Each with a hook, key message, and call to action. Natural, unscripted-sounding lines. No client faces or stories without consent.`,
    tip: "Film in one take on a phone. Authentic beats polished for nonprofit social media.",
  },
  {
    c: "Social Media & Content Marketing",
    t: "Plan: Awareness Month Campaign",
    u: "Your cause has an awareness month and you want to use it well.",
    p: `Plan a 4-week social campaign for [AWARENESS MONTH] for [ORGANIZATION]. Week themes, 3 posts per week (education, story with consent, action), one email, and a simple way for supporters to take part (share, pledge, give [OPTIONS]). Captions under 80 words each. ${HONEST}`,
    tip: "Give supporters one easy action each week; campaigns that ask for everything at once get nothing.",
  },
  {
    c: "Social Media & Content Marketing",
    t: "Guide: Ethical Storytelling Checklist",
    u: "You want to tell participant stories respectfully.",
    p: `Create an ethical storytelling checklist for [ORGANIZATION]: informed consent (in their language, able to withdraw), avoiding poverty or trauma imagery, dignity-centred language, letting people tell their own story, protecting privacy (names, locations, children), and reviewing the story with the person before publishing. Add a short consent form outline.`,
    tip: "Ask people how they want to be described. It changes the story and the relationship.",
  },
  {
    c: "Social Media & Content Marketing",
    t: "Blog: Explainer on the Issue You Work On",
    u: "You want content that educates the public about your cause.",
    p: `Write a 700-word blog post explaining [ISSUE] in [COMMUNITY] for a general audience. Include: what the issue is, why it matters locally [FACTS WITH SOURCES], common misconceptions, what is being done (including our work), and how readers can help. Cite sources for every statistic [SOURCES]. ${HONEST}`,
    tip: "Link to credible sources; it builds your authority and gets your post shared by partners.",
  },

  // ── Email Campaigns & Newsletters ──
  {
    c: "Email Campaigns & Newsletters",
    t: "Email: Giving Tuesday Campaign Series",
    u: "You want a strong Giving Tuesday email sequence.",
    p: `Write a Giving Tuesday series for [ORGANIZATION]: a preview email the week before, a morning launch email, a midday progress update [GOAL AND MATCH IF REAL], an evening last-call, and a thank-you the next day with results. Subject lines included, each email under 180 words. Mention a match only if it is committed [MATCH DETAILS]. ${HONEST}`,
    tip: "Progress updates during the day drive the most gifts. Plan to send real numbers at midday.",
  },
  {
    c: "Email Campaigns & Newsletters",
    t: "Email: Emergency Appeal",
    u: "A sudden crisis needs rapid fundraising.",
    p: `Write an emergency appeal from [ORGANIZATION] responding to [SITUATION]. Include: what happened in plain terms, what we are doing right now [ACTIONS], exactly what funds will be used for [USES], an urgent but honest ask, and how we will report back. Under 250 words, subject line options. If funds raised exceed the need, say how they will be used [POLICY]. ${HONEST}`,
    tip: "Say what happens to surplus funds. It is honest, and it protects you from donor-intent problems later.",
  },
  {
    c: "Email Campaigns & Newsletters",
    t: "Email: Monthly Giving Upgrade Ask",
    u: "You want existing monthly donors to increase their gift.",
    p: `Write an upgrade email to monthly donors of [ORGANIZATION] giving [CURRENT AMOUNT]. Thank them first, show what an increase to [NEW AMOUNT] would make possible [IMPACT], make the upgrade one click [LINK], and make clear there is no pressure. Under 180 words. ${HONEST}`,
    tip: "Ask for a small, specific increase. '$5 more a month' converts far better than an open ask.",
  },
  {
    c: "Email Campaigns & Newsletters",
    t: "Email: Year-End Tax Reminder for Donors",
    u: "Donors want to give before December 31 and need clear information.",
    p: `Write a year-end email from [ORGANIZATION] reminding supporters that gifts made by December 31 may be deductible for this tax year if they itemize. Include ways to give (online, check postmarked by the deadline, stock, donor-advised funds, IRA qualified charitable distributions for those eligible), our EIN [EIN], and a note to consult their tax adviser. Under 220 words.`,
    tip: "List non-cash options; donors with appreciated stock or IRAs often give larger gifts that way.",
  },
  {
    c: "Email Campaigns & Newsletters",
    t: "Email: Advocacy Action Alert",
    u: "You need supporters to contact officials about a policy issue.",
    p: `Write an action alert for [ORGANIZATION] about [POLICY ISSUE]. Explain the issue in plain terms, why it matters to the people we serve [IMPACT], the specific action (call or email [OFFICIAL]), a short script they can use, and the deadline [DATE]. Under 220 words. Keep within 501(c)(3) lobbying limits; no support for or opposition to candidates.`,
    tip: "Give a script. Supporters who know exactly what to say are far more likely to call.",
  },

  // ── Volunteer Recruitment & Management ──
  {
    c: "Volunteer Recruitment & Management",
    t: "Plan: Volunteer Retention Plan",
    u: "Volunteers come once and do not return.",
    p: `Create a volunteer retention plan for [ORGANIZATION]: a great first shift (welcome, clear role, buddy), a thank-you within 48 hours, regular impact updates, recognition, growth opportunities (leadership roles, skills), and a check-in after 3 months. Include a simple tracking sheet and what to measure.`,
    tip: "The 48-hour thank-you with a specific detail about their shift is the biggest single factor in return visits.",
  },
  {
    c: "Volunteer Recruitment & Management",
    t: "Description: Skilled Volunteer (Pro Bono) Role",
    u: "You need professional skills (marketing, finance, IT) from volunteers.",
    p: `Write a skilled volunteer role description for [ORGANIZATION] needing [SKILL] for [PROJECT]. Include: project goal, deliverables, time commitment [HOURS OVER WEEKS], who they will work with, what support we provide, and what they gain. Under 280 words, professional. Add where to post it [PLATFORMS].`,
    tip: "Scope skilled projects tightly. Clear deliverables attract professionals; vague asks do not.",
  },
  {
    c: "Volunteer Recruitment & Management",
    t: "Guide: Volunteer Handbook Outline",
    u: "You need a volunteer handbook.",
    p: `Create a volunteer handbook outline for [ORGANIZATION]: welcome and mission, roles, scheduling and cancellations, safety and conduct, confidentiality and working with participants [POPULATION], safeguarding (especially with children or vulnerable adults [BACKGROUND CHECK POLICY]), reporting concerns, expenses, and recognition. For each section, list the key points.`,
    tip: "Keep a one-page 'quick start' version at the front; most volunteers will never read the rest.",
  },
  {
    c: "Volunteer Recruitment & Management",
    t: "Message: Re-Engaging Lapsed Volunteers",
    u: "Volunteers who used to help have drifted away.",
    p: `Write a warm message to volunteers who have not helped with [ORGANIZATION] in [MONTHS] months. Thank them for past help [SPECIFIC CONTRIBUTION], share what has changed [NEWS], offer flexible options (one-off, remote, short shifts [OPTIONS]), and ask what would work for them. Under 150 words, no guilt.`,
    tip: "Ask what would work for them now. Life changes, and flexible roles bring many back.",
  },
  {
    c: "Volunteer Recruitment & Management",
    t: "Report: Volunteer Impact Summary",
    u: "You want to show the value of volunteers to funders and the board.",
    p: `Create a volunteer impact summary for [ORGANIZATION] for [PERIOD]: number of volunteers [NUMBER], hours [HOURS], estimated value using the Independent Sector rate I provide [RATE], roles filled, outcomes supported [OUTCOMES], and one volunteer story [STORY WITH CONSENT]. Under 300 words. Show the calculation.`,
    tip: "Include the dollar value of volunteer hours in grant reports; some funders count it as in-kind support.",
  },

  // ── Board & Stakeholder Communication ──
  {
    c: "Board & Stakeholder Communication",
    t: "Guide: New Board Member Orientation Packet",
    u: "New board members need to get up to speed quickly.",
    p: `Create an orientation packet outline for new board members of [ORGANIZATION]: mission and programs, budget overview [BUDGET], board roles and legal duties (care, loyalty, obedience), committee structure, meeting schedule, give-or-get expectations [POLICY], conflict of interest policy, and key contacts. Add a 90-day onboarding plan with a board buddy.`,
    tip: "Explain fiduciary duties plainly in the first meeting. Board members often do not know they have legal responsibilities.",
  },
  {
    c: "Board & Stakeholder Communication",
    t: "Memo: Board Financial Report in Plain Language",
    u: "Board members do not understand the financial statements.",
    p: `Turn these financials into a plain-language board memo for [ORGANIZATION]: [REVENUE BY SOURCE, EXPENSES, BUDGET VS ACTUAL, CASH, RESERVES, RESTRICTED FUNDS]. Include: 5 key points, variances and why, cash position and months of reserves, restricted vs unrestricted funds explained, and decisions needed. One page. Do not invent figures.`,
    tip: "Always separate restricted from unrestricted funds; boards often think restricted cash is available.",
  },
  {
    c: "Board & Stakeholder Communication",
    t: "Plan: Strategic Planning Retreat Agenda",
    u: "You are running a board and staff strategic planning session.",
    p: `Design a one-day strategic planning retreat for [ORGANIZATION]: pre-work (survey, data pack), agenda with timings (review of mission and context, SWOT, priorities, goals, resources), facilitation methods for each session, how to reach decisions, and how to turn the output into a plan within 30 days.`,
    tip: "Send data before the retreat so the day is spent deciding, not reading.",
  },
  {
    c: "Board & Stakeholder Communication",
    t: "Script: Board Member Fundraising Asks",
    u: "Board members are nervous about asking friends for money.",
    p: `Write a short, natural script board members of [ORGANIZATION] can use to invite a friend to support us: why they personally care, one impact story [STORY], a specific invitation (tour, event, gift [AMOUNT OPTIONS]), and how to handle 'not now'. Under 200 words, plus 5 tips for making it comfortable.`,
    tip: "Invite friends to see the work before asking for money. Visits make the ask easy later.",
  },
  {
    c: "Board & Stakeholder Communication",
    t: "Report: Community Stakeholder Update Letter",
    u: "Community partners and local officials should hear about your work.",
    p: `Write an annual update letter from [ORGANIZATION] to community stakeholders (partners, local officials, faith leaders): key results [RESULTS], people served [NUMBERS], community partnerships, challenges we see in the community [ISSUES], and how they can help. Under 450 words. ${HONEST}`,
    tip: "Local officials remember organizations that keep them informed, and call them when opportunities arise.",
  },

  // ── Program Design & Impact Reporting ──
  {
    c: "Program Design & Impact Reporting",
    t: "Design: Participant Intake and Consent Form",
    u: "You need a clear intake form that respects participants.",
    p: `Create a participant intake form outline for [PROGRAM]: only the information we genuinely need [DATA NEEDED], why we ask for each, consent to participate and to data use, sharing and confidentiality explained plainly, optional demographic questions marked optional, and contact preferences. Plain language, respectful, one to two pages.`,
    tip: "Collect only what you use. Every extra question is a barrier for participants and a privacy risk.",
  },
  {
    c: "Program Design & Impact Reporting",
    t: "Plan: Pilot Program Design",
    u: "You want to test a new program idea before scaling it.",
    p: `Design a 3-month pilot for [PROGRAM IDEA] serving [POPULATION]. Include: goals, participant numbers, activities, staffing and budget [RESOURCES], what we will measure and how, success criteria for scaling, risks, and a decision point at the end. One page.`,
    tip: "Decide in advance what result would make you stop. Pilots without exit criteria never end.",
  },
  {
    c: "Program Design & Impact Reporting",
    t: "Analysis: Program Data Dashboard Design",
    u: "You want to track program results monthly.",
    p: `Design a simple monthly program dashboard for [PROGRAM]: 6 to 8 indicators (outputs and outcomes) [INDICATORS], definition and data source for each, targets, and a one-paragraph narrative template. Then fill it using this month's data [DATA]. Do not invent figures.`,
    tip: "Track a few indicators well. A dashboard nobody updates is worse than none.",
  },
  {
    c: "Program Design & Impact Reporting",
    t: "Report: Annual Impact Report Outline",
    u: "You want an annual impact report donors will read.",
    p: `Create an annual impact report outline for [ORGANIZATION]: a letter from the leader, the year in numbers [KEY FIGURES], 3 stories with consent [STORIES], financial summary [FINANCIALS], thanks to supporters, and what is next. Suggest a design approach (short, visual) and the key message for each section. ${HONEST}`,
    tip: "Four to eight pages is plenty. Donors read short, visual reports and skim long ones.",
  },
  {
    c: "Program Design & Impact Reporting",
    t: "Review: Participant Feedback Analysis",
    u: "You collected participant feedback and want to learn from it.",
    p: `Analyse this participant feedback from [PROGRAM]: [PASTE FEEDBACK]. Identify themes (what works, what does not), representative quotes (anonymised), suggestions for improvement, and 3 changes we could make. Then write a short 'You said, we did' message for participants. Quote exactly; do not invent feedback.`,
    tip: "Close the loop with participants. 'You said, we did' builds trust and future response rates.",
  },

  // ── Event Planning & Promotion ──
  {
    c: "Event Planning & Promotion",
    t: "Plan: Peer-to-Peer Fundraising Campaign",
    u: "You want supporters to fundraise from their own networks.",
    p: `Plan a peer-to-peer fundraising campaign for [ORGANIZATION] around [EVENT OR OCCASION]. Include: goal [GOAL], fundraiser recruitment email, a fundraiser toolkit (sample posts, emails, texts), a coaching email sequence for fundraisers, milestones and recognition, and a thank-you plan. ${HONEST}`,
    tip: "Fundraisers who set up their page and give first raise far more. Ask them to make the first gift.",
  },
  {
    c: "Event Planning & Promotion",
    t: "Checklist: Event Accessibility",
    u: "You want your event to be accessible to everyone.",
    p: `Create an accessibility checklist for [EVENT] at [VENUE]: physical access, seating, restrooms, sign language or captioning [NEEDS], dietary needs, sensory considerations, materials in accessible formats, and how guests can request accommodations in advance. Include wording for the invitation.`,
    tip: "Ask about access needs on the registration form; it signals welcome and helps you plan.",
  },
  {
    c: "Event Planning & Promotion",
    t: "Script: Emcee Script for a Fundraising Event",
    u: "Your emcee needs a script that keeps the event on time and on message.",
    p: `Write an emcee script for [EVENT] by [ORGANIZATION]: welcome, housekeeping, introductions [SPEAKERS], transitions, sponsor thanks [SPONSORS], the lead-up to the fundraising ask, and the close. Include timing for each segment and ad-lib notes for delays. Warm and upbeat.`,
    tip: "Script the transitions tightly. Events lose energy in the gaps, not in the speeches.",
  },
  {
    c: "Event Planning & Promotion",
    t: "Plan: Virtual or Hybrid Event",
    u: "You are running an online or hybrid event.",
    p: `Plan a [VIRTUAL/HYBRID] event for [ORGANIZATION] on [TOPIC OR PURPOSE]. Include: platform considerations, run of show with timings, engagement ideas (polls, chat, breakouts), how to make the ask online, tech rehearsal checklist, roles (host, producer, chat moderator), and follow-up. Keep online segments under 60 minutes.`,
    tip: "Give the online audience a dedicated host. Hybrid events usually forget the people at home.",
  },
  {
    c: "Event Planning & Promotion",
    t: "Email: Sponsor Thank-You and Recap",
    u: "You want sponsors to return next year.",
    p: `Write a thank-you and recap email to [SPONSOR] after [EVENT]. Include: a sincere thank-you, results [ATTENDANCE, FUNDS RAISED], how their brand was recognised [RECOGNITION WITH PHOTOS], impact of the funds [IMPACT], and an invitation to talk about next year. Under 250 words. ${HONEST}`,
    tip: "Send photos showing their recognition. Sponsors need them to justify renewing internally.",
  },

  // ── Difficult Conversations & Crisis Comms ──
  {
    c: "Difficult Conversations & Crisis Comms",
    t: "Statement: Leadership Transition Announcement",
    u: "Your executive director is leaving and supporters need to hear it well.",
    p: `Write an announcement from the board of [ORGANIZATION] about the departure of [ROLE, NAME PLACEHOLDER] effective [DATE]. Include gratitude for their contributions [HIGHLIGHTS], the transition plan (interim leadership [PLAN], search process), reassurance about programs continuing, and a contact for questions. Under 280 words, warm and steady.`,
    tip: "Tell major donors and key funders personally before the public announcement.",
  },
  {
    c: "Difficult Conversations & Crisis Comms",
    t: "Response: Funder Reducing or Ending Support",
    u: "A major funder is cutting support and you need to respond and plan.",
    p: `Write a gracious reply to [FUNDER] who is reducing support from [AMOUNT] to [AMOUNT]. Thank them for past support, ask to understand the reasons and whether future support is possible, and propose a conversation. Then outline an internal plan: impact assessment, other funders to approach, and communication to staff. Under 200 words for the reply.`,
    tip: "Stay gracious. Funders change priorities, and they talk to each other about how grantees respond.",
  },
  {
    c: "Difficult Conversations & Crisis Comms",
    t: "Script: Handling a Media Inquiry",
    u: "A reporter called about something sensitive.",
    p: `Create a media inquiry protocol and response for [ORGANIZATION] about [TOPIC]. Include: who speaks for us, how to take the inquiry (name, outlet, deadline, questions), a holding statement under 60 words, 3 key messages, questions to prepare for, and what never to say (confidential information about participants or staff).`,
    tip: "Never say 'no comment'. A short holding statement buys time without looking evasive.",
  },
  {
    c: "Difficult Conversations & Crisis Comms",
    t: "Memo: Staff Communication During a Funding Crisis",
    u: "Funding is tight and staff are anxious.",
    p: `Write an honest message from [LEADER ROLE] to staff about [FUNDING SITUATION]. Include what we know and do not know, what we are doing [ACTIONS], how and when we will update them [TIMELINE], what it means for them right now [IMPACT IF KNOWN], and support available. Under 300 words, transparent and caring.`,
    tip: "Commit to an update date and keep it, even if the news has not changed. Silence feeds rumours.",
  },
  {
    c: "Difficult Conversations & Crisis Comms",
    t: "Response: Safeguarding Concern Communication",
    u: "A safeguarding concern has been raised and communication must be careful.",
    p: `Create a communication plan for a safeguarding concern at [ORGANIZATION] involving [GENERAL DESCRIPTION WITHOUT NAMES]. Include: immediate duties (reporting to authorities as required, protecting those involved), who needs to know and when (board, insurers, funders as required), what can and cannot be shared, a holding statement, and documentation. Follow our safeguarding policy and legal advice.`,
    tip: "Report first, communicate second. Legal reporting duties come before any public statement.",
  },

  // ── Bonus: Power Prompts ──
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Full Major Gift Proposal Package",
    u: "You are asking a donor for a major gift and want everything ready.",
    p: `Create a major gift proposal package for [DONOR PLACEHOLDER] for [AMOUNT] to support [PROJECT]. Include: a 2-page proposal (need, plan, impact, budget, recognition), a one-page budget, a meeting agenda for the ask, the ask language itself, responses to 5 likely questions, and a stewardship plan for the first year after the gift. ${HONEST}`,
    tip: "Rehearse the ask out loud, then stop talking after you make it. Silence is part of the ask.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Year-Round Fundraising Calendar",
    u: "Your fundraising is reactive and you want a plan for the year.",
    p: `Build a 12-month fundraising calendar for [ORGANIZATION] with annual budget [BUDGET] and revenue mix [SOURCES]. Include: appeals, events, grant deadlines [KNOWN DEADLINES], major donor touches, stewardship months (no asks), Giving Tuesday and year-end, and board involvement. Monthly table with owners and revenue targets.`,
    tip: "Schedule stewardship months with no asks. Donors who hear thanks between appeals give more.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Capital Campaign Feasibility Questions",
    u: "You are considering a capital campaign and want to test readiness.",
    p: `Act as a capital campaign consultant. For [ORGANIZATION] considering a [AMOUNT] campaign for [PROJECT], create: readiness criteria (case, leadership, donor base, staff capacity), a feasibility interview guide for 20 key donors (12 questions), a gift range chart for the goal, and red flags that suggest waiting.`,
    tip: "Most campaigns need a lead gift of 10 to 20 percent of the goal. If you cannot name it, you are not ready.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Kit: Complete Grant Renewal Package",
    u: "A grant is up for renewal and you want to present a strong case.",
    p: `Create a grant renewal package for [FUNDER] for [PROGRAM]: a results summary against the original goals [GOALS AND RESULTS], lessons learned and changes made, the case for continued support, a renewal budget [BUDGET], and a thank-you letter. Honest about shortfalls with explanations. ${HONEST}`,
    tip: "Funders renew partners who report honestly on what did not work and what they learned.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan: Donor Retention Improvement Plan",
    u: "You lose many first-time donors and want to keep more.",
    p: `Analyse our donor retention: first-year donors [NUMBER] and how many gave again [NUMBER], repeat donor retention [RATE], and current stewardship practices [DESCRIPTION]. Calculate retention rates, identify gaps, and build a 12-month plan for first-time donors: welcome series, thank-you call, impact update, second-gift ask timing, and metrics. Show calculations.`,
    tip: "The second gift is the hardest. A donor who gives twice is far more likely to keep giving.",
  },
];
