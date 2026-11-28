import type { PromptDraft } from "./define";

// Additions to the Realtor toolkit, written for Toolkit Live. Listing and
// marketing prompts follow Fair Housing: describe the property, never the
// buyer or the neighbours.

const FH = "Follow Fair Housing rules: describe the property and its features, never the type of buyer or the people in the area.";

export const REALTOR_EXTRA: PromptDraft[] = [
  // ── Client Communication ──
  {
    c: "Client Communication",
    t: "Email Explaining Written Buyer Agreements",
    u: "Buyers ask why they must sign an agreement before touring homes.",
    p: `Act as a real estate agent in [STATE]. Write a plain-language email to a new buyer explaining the written buyer representation agreement we sign before touring homes, a practice required since the August 2024 NAR settlement rule changes. Explain what the agreement covers [TERM, SCOPE], how my compensation works and that it is negotiable [OUR TERMS], what happens if a seller offers to pay buyer-agent compensation, and how they can end it [TERMINATION TERMS]. Warm, clear, under 280 words. Do not give legal advice; suggest they ask questions or consult an attorney.`,
    tip: "Explain it before the first showing, not at the door of the first house. Buyers who understand it sign without friction.",
  },
  {
    c: "Client Communication",
    t: "Email Weekly Update to Buyers During Their Search",
    u: "Your buyers are searching and you want to keep them engaged between showings.",
    p: `Write a weekly update email to buyers searching for [HOME CRITERIA] in [AREAS] with a budget of [BUDGET]. Include: new listings that fit [LISTINGS], homes that went under contract and what that tells us [MARKET NOTES], anything to adjust in the search [SUGGESTIONS], and next showings [DATES]. Under 220 words, encouraging and practical.`,
    tip: "Share what sold and for how much; it recalibrates expectations faster than any conversation.",
  },
  {
    c: "Client Communication",
    t: "Email Explaining Contingencies in Plain English",
    u: "Buyers or sellers do not understand the contingencies in their contract.",
    p: `Write a plain-language email to a [BUYER/SELLER] explaining the contingencies in their contract: [LIST, e.g. inspection, appraisal, financing, sale of home]. For each: what it means, the deadline [DATES], what happens if it is not met, and what they need to do. Under 300 words. Note that the contract terms control and they can ask their attorney about legal questions.`,
    tip: "Put every contingency deadline in their calendar for them; missed deadlines are how deals die.",
  },
  {
    c: "Client Communication",
    t: "Text Messages for Every Stage of a Transaction",
    u: "You want ready-to-send texts that keep clients informed at each milestone.",
    p: `Write short text messages (under 300 characters each) for a [BUYER/SELLER] at these milestones: offer submitted, offer accepted, inspection scheduled, inspection results received, appraisal ordered, appraisal back, loan approved, closing scheduled, and keys in hand. Each warm, clear, with the next step. Personalise with [CLIENT FIRST NAME] and [PROPERTY ADDRESS].`,
    tip: "Save these as phone shortcuts. Consistent updates are what clients praise most in reviews.",
  },
  {
    c: "Client Communication",
    t: "Email Explaining Rent vs Buy With Their Numbers",
    u: "A renter asks whether buying makes sense for them.",
    p: `Act as a real estate agent. Write an email comparing renting and buying for a client using their numbers: current rent [RENT], target purchase price [PRICE], down payment [AMOUNT], estimated rate [RATE FROM LENDER], taxes and insurance estimates [ESTIMATES], and how long they plan to stay [YEARS]. Show a simple monthly comparison and the non-monetary trade-offs. Encourage them to confirm figures with a lender. No promises about appreciation.`,
    tip: "Ask a lender partner to review the numbers before sending; it builds trust with both.",
  },

  // ── Listing Descriptions & Property Marketing ──
  {
    c: "Listing Descriptions & Property Marketing",
    t: "Listing Description for Land or a Vacant Lot",
    u: "You are listing land and need copy that sells potential, not just acreage.",
    p: `Act as a real estate copywriter. Write an MLS description for a vacant lot: size [ACREAGE], zoning [ZONING], utilities available [UTILITIES], road access [ACCESS], topography and views [FEATURES], and possible uses allowed by zoning [USES]. Include a line advising buyers to verify zoning and permits with [COUNTY/CITY]. Under 1,000 characters. ${FH}`,
    tip: "Land buyers search by use. Lead with what the lot is zoned for, not how pretty it is.",
  },
  {
    c: "Listing Descriptions & Property Marketing",
    t: "Listing Description for a Multi-Family or Income Property",
    u: "You are listing a duplex or small apartment building for investors.",
    p: `Write an investor-focused listing description for a [NUMBER]-unit property. Facts: unit mix [MIX], current rents [RENTS], occupancy [OCCUPANCY], leases [TERMS], recent updates [UPDATES], expenses provided [EXPENSES]. Lead with the numbers, then the property. Include 'Seller figures to be verified by buyer.' Under 1,000 characters. Do not calculate returns unless I give the figures. ${FH}`,
    tip: "Investors decide on numbers first. Put rents and occupancy in the first line.",
  },
  {
    c: "Listing Descriptions & Property Marketing",
    t: "Listing Description for New Construction",
    u: "You are listing a new build and want to highlight what buyers get.",
    p: `Write a listing description for a new construction home by [BUILDER]. Details: layout [BEDS, BATHS, SQ FT], included finishes [FINISHES], energy features [FEATURES], warranty [BUILDER WARRANTY], completion date [DATE], and upgrades available [OPTIONS]. Under 1,000 characters, specific and factual. ${FH}`,
    tip: "Energy features and the builder warranty are what buyers compare between new builds. Name them specifically.",
  },
  {
    c: "Listing Descriptions & Property Marketing",
    t: "Listing Description for a Rental Property",
    u: "You are listing a home for lease and need a clear, compliant ad.",
    p: `Write a rental listing for [PROPERTY TYPE] at [AREA]. Details: rent [RENT], deposit [DEPOSIT], lease term [TERM], beds, baths and size [DETAILS], included utilities [UTILITIES], pet policy [POLICY], parking [PARKING], availability date [DATE], and screening criteria applied to all applicants [CRITERIA]. ${FH} Do not refuse housing vouchers or other lawful sources of income where local law protects them. Under 900 characters.`,
    tip: "State the same screening criteria for everyone in the ad; it is fairer and protects you from complaints.",
  },
  {
    c: "Listing Descriptions & Property Marketing",
    t: "Rewrite Listing Copy for Accuracy and Fair Housing",
    u: "You have a draft description and want it cleaned up before it goes live.",
    p: `Review this listing description: [PASTE DESCRIPTION]. Rewrite it to: remove any Fair Housing risk (words about who should live there, the neighbours, schools as quality claims, safety claims), remove exaggerations that are not supported by facts, keep the strongest real features first, and stay under [CHARACTER LIMIT]. List every change you made and why.`,
    tip: "Run every listing through this before it hits the MLS. Complaints often start with a single word.",
  },

  // ── Social Media & Content ──
  {
    c: "Social Media & Content",
    t: "Post Explaining One Market Statistic Simply",
    u: "You have local market data and want a post people understand.",
    p: `Write a social post explaining one local market statistic for [AREA] this month: [STATISTIC, e.g. median days on market went from 18 to 27]. Explain what it means for buyers and for sellers in plain words, one practical takeaway, and a call to action. Under 120 words. Use only the figure I give; name the data source [SOURCE].`,
    tip: "One number explained well beats ten numbers listed. Always name the source.",
  },
  {
    c: "Social Media & Content",
    t: "Script Myth vs Fact Video Series",
    u: "You want short videos that correct common buyer and seller myths.",
    p: `Write 5 scripts for 30-second myth vs fact videos for a real estate agent in [MARKET]. Myths to cover: [MYTHS, e.g. you need 20 percent down, spring is the only time to sell]. Each: hook stating the myth, the fact in plain language, one example, and a call to action. Accurate and general; suggest viewers confirm specifics with a lender or attorney where relevant.`,
    tip: "Myth videos get shared because people want to correct their friends. Keep each to one myth.",
  },
  {
    c: "Social Media & Content",
    t: "Post Client Success Story (With Permission)",
    u: "You closed a meaningful deal and want to share it without oversharing.",
    p: `Write a client success post for [PLATFORM] about helping [CLIENT TYPE, e.g. first-time buyers] [RESULT, e.g. win in a multiple-offer situation]. Clients approved sharing [CONFIRMED]. Tell the story in 4 short parts: the challenge, the plan, what happened, the result. Under 150 words, no financial details or personal information beyond what they approved, and no promises that others will get the same result.`,
    tip: "Get written permission and a photo from the clients at closing; that is when they are happiest to share.",
  },
  {
    c: "Social Media & Content",
    t: "Plan Community Event Content",
    u: "You want local content that builds your presence without selling.",
    p: `Create 6 social posts around community events in [AREA] this month: [EVENTS]. Mix event announcements, a local business spotlight [BUSINESS], and a recap post. Each caption under 80 words with an image idea. Community-focused, no listing promotion in these posts. ${FH}`,
    tip: "Local event posts get shared by the event organisers too, reaching people who do not follow you yet.",
  },
  {
    c: "Social Media & Content",
    t: "Email Quarterly Home Value Update",
    u: "You want past clients to hear from you with something useful.",
    p: `Write a quarterly email to past clients in [AREA] about home values. Include: what happened in the local market this quarter [DATA AND SOURCE], what it could mean for homeowners (refinancing, remodelling, selling), an offer of a free home value review [HOW TO BOOK], and one seasonal maintenance tip. Under 250 words, no pressure. Include unsubscribe and address lines.`,
    tip: "Homeowners love hearing what their home might be worth. It keeps you remembered for referrals.",
  },

  // ── Lead Generation & Follow-Up ──
  {
    c: "Lead Generation & Follow-Up",
    t: "Script Calling a Past Client for Referrals",
    u: "You want to reconnect with past clients without sounding salesy.",
    p: `Write a phone script for calling a past client who bought or sold with me [YEARS] years ago. Open with a genuine check-in [PERSONAL DETAIL], offer something useful (home value update, contractor recommendations), then naturally ask whether anyone they know is thinking about buying or selling. Add responses for 'not right now' and 'actually, we're thinking of moving'.`,
    tip: "Give before you ask. The useful offer is what makes the referral ask feel natural.",
  },
  {
    c: "Lead Generation & Follow-Up",
    t: "Email Sequence for Rental Tenants Who Could Buy",
    u: "You work with renters and want to help those ready to buy.",
    p: `Write a 3-email sequence for renters in [AREA] who may be able to buy. Email 1: what it takes to buy, in plain words. Email 2: a simple rent vs buy comparison with example numbers clearly labelled as an illustration. Email 3: an invitation to a free buyer consultation with a lender partner [LENDER]. Each under 180 words. No pressure, no promises about approval.`,
    tip: "Partner with a lender for a joint webinar; renters often do not know what they already qualify for.",
  },
  {
    c: "Lead Generation & Follow-Up",
    t: "Script Following Up With a Buyer Who Went to Another Agent's Open House",
    u: "A buyer lead met another agent and you want to stay in the picture fairly.",
    p: `Write a friendly, professional follow-up to a buyer lead who mentioned touring homes with other agents. Offer what I bring [SPECIALTIES, MARKET KNOWLEDGE], explain that a written buyer agreement will set out how we work together [BRIEFLY], and invite a short consultation. Respect that they may already have an agreement with someone else. Under 150 words.`,
    tip: "Ask whether they have signed with another agent before pitching. It avoids awkward conflicts.",
  },
  {
    c: "Lead Generation & Follow-Up",
    t: "Plan Lead Nurture for Long-Term Buyers",
    u: "A lead is 6 to 12 months from buying and needs light, useful touches.",
    p: `Create a 12-month nurture plan for a buyer lead planning to buy in [TIMEFRAME] in [AREA] with [SITUATION, e.g. saving for down payment]. One touch per month: mix of useful emails, a check-in call, market updates, and milestones (pre-approval, saving tips). Give the topic and a one-line message for each month.`,
    tip: "Set calendar reminders for every touch the day you get the lead. Long-term leads are won by consistency.",
  },
  {
    c: "Lead Generation & Follow-Up",
    t: "Letter to Homeowners in a Target Neighborhood",
    u: "You want a mailing to homeowners that is useful and not spammy.",
    p: `Write a one-page letter to homeowners in [NEIGHBORHOOD] from [AGENT NAME]. Include a local market snapshot [DATA AND SOURCE], one useful tip for homeowners [TIP], an offer of a free home value review, and contact details. Personal, under 250 words. Comply with do-not-contact requests and include required brokerage information [BROKERAGE DETAILS].`,
    tip: "Handwrite the envelope for your top 50 homes; open rates jump dramatically.",
  },

  // ── Objection Handling & Negotiation ──
  {
    c: "Objection Handling & Negotiation",
    t: "Response to 'Why Do I Need a Buyer's Agent?'",
    u: "A buyer questions the value of representation after the commission changes.",
    p: `Write a respectful, confident answer for a buyer who asks why they need a buyer's agent. Explain what I do [SERVICES: search, pricing, negotiation, inspection and repair negotiation, contract deadlines, closing coordination], how my compensation is set out in our written agreement and is negotiable, and one short example of value (no client names). Under 200 words, no pressure, no criticism of buying without an agent.`,
    tip: "Walk them through a sample timeline with the deadlines you manage. Seeing it is more persuasive than telling.",
  },
  {
    c: "Objection Handling & Negotiation",
    t: "Strategy for Writing an Offer in a Multiple-Offer Situation",
    u: "Your buyers are competing and need a strong, sensible offer strategy.",
    p: `Act as an experienced buyer's agent. Help me build an offer strategy for a home listed at [LIST PRICE] with [NUMBER] offers expected. Buyer's limits: max price [MAX], financing [LOAN TYPE, DOWN PAYMENT], flexibility on closing [DATES], contingencies they can and cannot waive [DETAILS]. Suggest offer terms, escalation clause considerations [IF USED IN MARKET], and risks of each choice to discuss with the buyer. Do not recommend waiving protections without explaining the risk.`,
    tip: "Ask the listing agent what matters most to the seller besides price. Terms often win.",
  },
  {
    c: "Objection Handling & Negotiation",
    t: "Response to a Low Offer on a Seller's Home",
    u: "Your seller received a low offer and is offended.",
    p: `Write talking points for advising a seller who received an offer of [OFFER] on a home listed at [LIST PRICE]. Include: acknowledging their feelings, looking at the full terms [TERMS], what the market data says [DATA], options (counter, counter with terms, decline), and a recommended counter strategy with reasoning. Calm and objective.`,
    tip: "Encourage a counter rather than silence. Low offers often come from buyers testing, not insulting.",
  },
  {
    c: "Objection Handling & Negotiation",
    t: "Script Asking for Seller Concessions or Credits",
    u: "Your buyers need help with closing costs or repairs and you want to ask well.",
    p: `Write talking points for asking the listing agent for [CONCESSION, e.g. a $5,000 closing cost credit] on behalf of buyers for [PROPERTY]. Include the reason [INSPECTION FINDINGS, MARKET CONDITIONS], supporting facts, what the buyers offer in return [IF ANYTHING], and a fallback position. Professional and collaborative. Remind me to confirm with the lender that the credit is allowed under the loan.`,
    tip: "Always check lender limits on seller credits first; a credit the loan cannot use helps nobody.",
  },
  {
    c: "Objection Handling & Negotiation",
    t: "Response to 'We Want to List Without Photos or Staging'",
    u: "A seller wants to save money and skip presentation.",
    p: `Write a respectful response to a seller who does not want professional photos or staging for [PROPERTY]. Explain what buyers see first online, what I include at no extra cost [SERVICES], low-cost preparation options, and a compromise [OPTION]. Use no invented statistics. Under 170 words.`,
    tip: "Show them two local listings side by side, one well photographed, one not. It makes the case in seconds.",
  },

  // ── Showings, Open Houses & Buyer Support ──
  {
    c: "Showings, Open Houses & Buyer Support",
    t: "Email Explaining the Appraisal Process to Buyers",
    u: "Buyers are nervous about the appraisal.",
    p: `Write a plain-language email explaining the appraisal to buyers purchasing [PROPERTY] with [LOAN TYPE]. Cover: what an appraisal is, who orders it, how long it usually takes [TIMEFRAME], what happens if it comes in low (options: renegotiate, cover the gap, challenge, appraisal contingency terms [IF ANY]), and what they need to do. Under 250 words.`,
    tip: "Explain the low-appraisal options before it happens. Panic comes from surprise, not from the problem.",
  },
  {
    c: "Showings, Open Houses & Buyer Support",
    t: "Checklist Buyer Moving Timeline",
    u: "Buyers have an accepted offer and need to plan the move.",
    p: `Create a moving timeline for buyers closing on [DATE]: 6 weeks out through moving day. Include utilities setup and transfer, movers, change of address, insurance [HOMEOWNERS POLICY BEFORE CLOSING], final walkthrough, closing documents, and first-week tasks (change locks, find the water shutoff). Checklist format.`,
    tip: "Send this the day the offer is accepted; buyers remember the agent who made moving easier.",
  },
  {
    c: "Showings, Open Houses & Buyer Support",
    t: "Email Feedback Request to Showing Agents",
    u: "You want useful feedback after showings to share with your seller.",
    p: `Write a short feedback request to agents who showed [PROPERTY]. Ask 4 quick questions: overall impression, price opinion, what buyers liked, what held them back. Make it easy to answer in one line each. Under 90 words, courteous. Then write how I will summarise feedback for the seller weekly.`,
    tip: "Ask within a few hours of the showing. Agents answer while it is fresh or not at all.",
  },
  {
    c: "Showings, Open Houses & Buyer Support",
    t: "Plan Virtual Tour for Out-of-Area Buyers",
    u: "Buyers are relocating and cannot tour in person.",
    p: `Create a plan for a live video tour of [PROPERTY] for out-of-area buyers. Include: what to show in order, what buyers usually miss on video (smells, noise, light, neighbouring properties), questions to ask them during the tour, recording or not [WITH CONSENT], and a follow-up email summarising pros and cons. ${FH}`,
    tip: "Show the view from every window and the street in both directions; remote buyers worry most about what is next door.",
  },
  {
    c: "Showings, Open Houses & Buyer Support",
    t: "Script Open House Follow-Up Call",
    u: "You met visitors at an open house and want to follow up well.",
    p: `Write a follow-up call script for open house visitors at [PROPERTY]. Thank them, ask what they thought, ask where they are in their search and whether they are working with an agent, and offer something useful [LISTINGS, MARKET INFO]. Respect that some are neighbours or already represented. Under 150 words of talking points plus responses to 3 common replies.`,
    tip: "Call within 24 hours. Visitors forget which agent they met after a weekend of open houses.",
  },

  // ── Transactions, Operations & SOPs ──
  {
    c: "Transactions, Operations & SOPs",
    t: "SOP Buyer Agreement and Compensation Documentation",
    u: "You want a consistent process for buyer agreements after the rule changes.",
    p: `Write an SOP for [BROKERAGE] agents for written buyer agreements: when it must be signed (before touring, including virtual tours), how to explain it, where to store it, how compensation terms are recorded, handling seller-offered compensation, amendments, and termination. Numbered steps. Flag anything that depends on state law or brokerage policy as [CHECK WITH BROKER].`,
    tip: "Audit a few files each month. Missing agreements are an easy compliance gap to close.",
  },
  {
    c: "Transactions, Operations & SOPs",
    t: "Checklist Wire Fraud Warning for Clients",
    u: "You want every client warned about wire fraud before closing.",
    p: `Write a wire fraud warning for clients of [BROKERAGE]: that criminals impersonate agents and title companies, that we will never email wiring instructions changes, to call the title company at a verified number [HOW TO VERIFY] before sending money, and what to do if they suspect fraud. Clear, direct, under 200 words. Add a one-line text version.`,
    tip: "Send it at contract and again 3 days before closing. Wire fraud losses are large and often unrecoverable.",
  },
  {
    c: "Transactions, Operations & SOPs",
    t: "Email Coordinating Repairs Before Closing",
    u: "Agreed repairs need to be completed and documented before closing.",
    p: `Write an email to the listing agent confirming agreed repairs for [PROPERTY]: the list [REPAIRS], who completes them [LICENSED CONTRACTORS IF REQUIRED], deadline [DATE], documentation needed (receipts, invoices, photos), and when the buyers will verify. Professional, specific, under 200 words.`,
    tip: "Ask for invoices from licensed contractors; 'fixed by the seller's nephew' causes final walkthrough disputes.",
  },
  {
    c: "Transactions, Operations & SOPs",
    t: "Template Transaction Summary Sheet",
    u: "You want one page with every key fact for each deal.",
    p: `Create a one-page transaction summary template: property, clients, other agent, lender, title or escrow, key dates (acceptance, inspection deadline, appraisal, financing, closing), contingencies, earnest money, repair agreements, and notes. Then fill it from these deal details: [DETAILS].`,
    tip: "Pin the summary to the top of every transaction file; it answers most questions in seconds.",
  },
  {
    c: "Transactions, Operations & SOPs",
    t: "Plan Onboarding a New Transaction Coordinator",
    u: "You hired a transaction coordinator and want a smooth handover.",
    p: `Create a 2-week onboarding plan for a new transaction coordinator working with [AGENT/TEAM]. Include systems and logins [SYSTEMS], templates, the communication style clients expect, which tasks they own versus the agent, escalation rules, and a review after their first 3 files.`,
    tip: "Write down which decisions stay with you. Ambiguity about authority causes most coordinator mistakes.",
  },

  // ── Market Research, Pricing & Business Planning ──
  {
    c: "Market Research, Pricing & Business Planning",
    t: "Analysis Absorption Rate and Months of Inventory",
    u: "You want to explain whether it is a buyer's or seller's market with numbers.",
    p: `Calculate and explain the market for [AREA/PRICE RANGE] using: active listings [NUMBER], homes sold in the last [MONTHS] months [NUMBER]. Calculate monthly absorption and months of inventory, explain what it means for buyers and sellers in plain words, and draft 3 talking points for a listing appointment. Show the math; do not invent data.`,
    tip: "Months of inventory by price range tells a very different story from the whole market. Segment it.",
  },
  {
    c: "Market Research, Pricing & Business Planning",
    t: "Plan Pricing Strategy Presentation for a Seller",
    u: "You want to present your pricing recommendation clearly and persuasively.",
    p: `Build a pricing presentation outline for [PROPERTY]: comparable sales [COMPS WITH ADJUSTMENTS], active competition [ACTIVE LISTINGS], market pace [DAYS ON MARKET], my recommended price range and why, what happens at different price points (too high, right, slightly under), and a plan to review after [DAYS] days. Clear slides-style headings with speaker notes.`,
    tip: "Show the competition the buyer will compare them against; sellers price against buyers' alternatives, not their hopes.",
  },
  {
    c: "Market Research, Pricing & Business Planning",
    t: "Analysis Cost per Closing by Lead Source",
    u: "You want to know which marketing actually pays.",
    p: `Analyse my lead sources: for each [SOURCE: SPEND, LEADS, APPOINTMENTS, CLOSINGS, GROSS COMMISSION]. Calculate cost per lead, cost per closing, conversion rates, and return on spend. Rank sources and recommend where to increase, hold or cut spending. Show the calculations; do not invent figures.`,
    tip: "Track appointments, not just leads. A cheap source that never books meetings is expensive.",
  },
  {
    c: "Market Research, Pricing & Business Planning",
    t: "Plan Niche Specialty Strategy",
    u: "You want to become known for a specific type of client or property.",
    p: `Act as a real estate business coach. I am an agent in [MARKET] considering a niche: [OPTIONS, e.g. first-time buyers, downsizers, investors, relocation, a specific neighbourhood]. For each option: demand signals to check, competition, how to build credibility, marketing channels, and a 90-day launch plan for the strongest one. ${FH}`,
    tip: "Pick a niche based on a type of transaction, not a type of person; niches defined by people can raise Fair Housing issues.",
  },
  {
    c: "Market Research, Pricing & Business Planning",
    t: "Plan Monthly Business Review for Agents",
    u: "You want a monthly habit of reviewing your business.",
    p: `Create a monthly business review template for a real estate agent: pipeline (leads, appointments, active clients, pending, closed), income and expenses, lead sources, database touches, reviews gained, and one improvement for next month. Then review these numbers: [NUMBERS] and give 3 recommendations.`,
    tip: "Block the first Monday of every month for this. Agents who review monthly adjust before a slow quarter hits.",
  },

  // ── Difficult Situations & Reputation ──
  {
    c: "Difficult Situations & Reputation",
    t: "Email When an Inspection Reveals a Major Problem",
    u: "The inspection found a serious issue and your buyers are worried.",
    p: `Write an email to buyers after an inspection of [PROPERTY] found [ISSUE]. Explain what the inspector reported in plain words, recommended next steps (specialist evaluation [TYPE], cost estimate), their options under the contract [INSPECTION CONTINGENCY DEADLINE], and a calm recommendation to get facts before deciding. Under 240 words.`,
    tip: "Get a specialist's estimate before negotiating. Numbers turn panic into a decision.",
  },
  {
    c: "Difficult Situations & Reputation",
    t: "Script Handling a Client Who Wants to Back Out",
    u: "A buyer or seller wants to cancel a signed contract.",
    p: `Write talking points for a conversation with a [BUYER/SELLER] who wants to back out of their contract for [REASON]. Include: listening to the real concern, explaining their options and consequences under the contract [CONTINGENCIES, EARNEST MONEY TERMS], suggesting they consult an attorney for legal questions, and next steps. Calm and non-judgemental; do not give legal advice.`,
    tip: "Often the real issue is fear, not the house. Ask what changed before discussing the contract.",
  },
  {
    c: "Difficult Situations & Reputation",
    t: "Email Responding to a Complaint About Another Agent",
    u: "A client is upset with the other side's agent and you need to handle it professionally.",
    p: `Write an email to my client about their frustration with the other agent in the transaction [ISSUE]. Acknowledge the frustration, explain what I am doing about it [ACTION], keep the focus on the goal (closing), and avoid criticising the other agent in writing. Under 180 words.`,
    tip: "Never criticise the other agent in writing; emails get forwarded, and the deal still has to close.",
  },
  {
    c: "Difficult Situations & Reputation",
    t: "Email Telling a Seller Their Home Is Not Selling",
    u: "A listing has sat for weeks and you need an honest conversation.",
    p: `Write an honest, supportive email to a seller whose home at [PROPERTY] has been on the market [DAYS] days with [SHOWINGS AND FEEDBACK]. Summarise what the market is telling us, compare with competing homes [COMPETITION], and present options (price adjustment [SUGGESTION], improvements, marketing changes, pause). Recommend one with reasoning. Under 280 words.`,
    tip: "Send the feedback summary weekly from day one. Price conversations are easier when the evidence has been building.",
  },
  {
    c: "Difficult Situations & Reputation",
    t: "Response to a Client Asking About Neighbourhood Demographics",
    u: "A buyer asks about the race, religion or 'type of people' in an area.",
    p: `Write a friendly, clear response to a buyer who asked about the [DEMOGRAPHIC QUESTION] of a neighbourhood. Explain that Fair Housing rules mean I cannot steer or characterise areas by protected characteristics, then offer helpful, objective ways to research on their own (visit at different times, public data sources, commute times, amenities they care about). Warm, not preachy, under 150 words.`,
    tip: "Offer objective research tools every time. It helps the buyer and keeps you compliant.",
  },

  // ── Bonus: Power Prompts ──
  {
    c: "Bonus: Power Prompts",
    t: "Plan Complete Buyer Consultation Presentation",
    u: "You want a polished buyer consultation that builds trust and explains everything.",
    p: `Create a buyer consultation presentation for [AGENT NAME] in [MARKET]. Sections: about me (facts [CREDENTIALS]), the buying process step by step, current market conditions [DATA], financing basics and lender introduction, how we find the right home, making competitive offers, the written buyer agreement and compensation, inspections to closing, and what I need from them. Speaker notes for each section and a one-page leave-behind summary.`,
    tip: "Give the leave-behind as a PDF after the meeting; buyers re-read it before every big step.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan Seller Net Sheet and Pricing Scenarios",
    u: "Sellers want to know what they will walk away with at different prices.",
    p: `Create a seller net sheet comparison for [PROPERTY] at three prices [PRICE 1, 2, 3]. Include estimated payoff [MORTGAGE BALANCE], commission [AS AGREED], title and closing costs [ESTIMATES], transfer taxes [RATE], concessions [IF ANY], and other costs [OTHER]. Show net proceeds for each, clearly marked as estimates to be confirmed by title. Then write a short explanation for the seller.`,
    tip: "Show the net at several prices; sellers decide better when they see what a price change really costs them.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan Full Relocation Buyer Package",
    u: "A buyer is relocating from another state and needs everything in one place.",
    p: `Create a relocation package for buyers moving to [AREA] from [ORIGIN] with [PRIORITIES, e.g. commute to downtown, yard, budget]. Include: overview of areas matching their criteria (objective facts: commute times, housing types, price ranges [DATA]), a timeline for buying remotely, how virtual tours and remote closings work, local services to set up, and questions to ask me. ${FH}`,
    tip: "Build this once per market and personalise it; relocation buyers are some of the most loyal referral sources.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan Expired Listing Rescue Plan",
    u: "You won an expired listing and need a plan to sell it this time.",
    p: `Act as a top listing agent. The home at [PROPERTY] expired after [DAYS] days at [PRICE] with [FEEDBACK]. Diagnose likely reasons (price, presentation, marketing, access, condition), then build a relaunch plan: pricing recommendation with comps [COMPS], preparation and staging list, new photography and description, launch timeline, and weekly check-ins with the seller.`,
    tip: "Show the seller the diagnosis before the plan; they need to see why it did not sell to trust what comes next.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Plan Database Reactivation Campaign",
    u: "Your database is full of contacts you have not spoken to in years.",
    p: `Create a 30-day database reactivation campaign for an agent with [NUMBER] contacts in [MARKET]. Include: segmenting the list (past clients, sphere, old leads), a personal re-introduction message for each segment, a value offer (market report, home value review), a call schedule (how many per day), and how to track responses. Scripts under 100 words each. Respect unsubscribes and do-not-call rules.`,
    tip: "Ten personal calls a day for a month reactivates more business than any mass email.",
  },
];
