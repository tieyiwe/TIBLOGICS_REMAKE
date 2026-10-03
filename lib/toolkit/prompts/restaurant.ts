import type { PromptDraft } from "./define";

// Additions to the Restaurant toolkit. Food safety, allergen and labour claims
// must be accurate; reviews and results are never invented.

const TRUE = "Use only the facts I give you; do not invent awards, reviews, statistics or health claims.";

export const RESTAURANT_EXTRA: PromptDraft[] = [
  // ── Guest Communication & Reservations ──
  {
    c: "Guest Communication & Reservations",
    t: "Script: Phone Greeting and Reservation Call Flow",
    u: "Hosts answer the phone differently and bookings or details get missed.",
    p: `Write a phone script for hosts at [RESTAURANT NAME] covering: the greeting, taking a reservation (date, time, party size, name, phone, occasion, dietary needs, seating preference), what to say when we are full [WAITLIST OR ALTERNATIVE TIMES], our policies to mention [DEPOSIT, CANCELLATION, TIME LIMIT], and a warm close that repeats the booking back. Keep each line short enough to say naturally. Add a short version for peak hours.`,
    tip: "Repeating the booking back to the guest catches most wrong dates and misspelled names before they become no-shows.",
  },
  {
    c: "Guest Communication & Reservations",
    t: "Email: Deposit and Cancellation Policy for Large Parties",
    u: "Large-party no-shows are costing you covers and you are introducing a deposit.",
    p: `Write a friendly email to guests booking parties of [PARTY SIZE THRESHOLD]+ at [RESTAURANT NAME] explaining our deposit of [AMOUNT], when it is charged, how it is applied to the bill, the cancellation window [HOURS OR DAYS], what happens with late changes to headcount, and how to pay [PAYMENT METHOD]. Explain the reason in one honest sentence without sounding defensive. Under 200 words.`,
    tip: "Say the deposit comes off the final bill in the first two lines. Guests object far less when they see it is not an extra fee.",
  },
  {
    c: "Guest Communication & Reservations",
    t: "Text: Day-Before Reservation Reminder with Easy Confirm",
    u: "You want to cut no-shows with a short reminder the day before.",
    p: `Write three SMS versions (under 160 characters each) reminding a guest of their reservation at [RESTAURANT NAME] on [DATE] at [TIME] for [PARTY SIZE]. Include a simple way to confirm or cancel [REPLY Y/N OR LINK] and, in one version, a note about [PARKING, PATIO, OR SPECIAL]. Friendly, not pushy, no excessive emojis.`,
    tip: "A one-tap confirm or cancel frees up tables you can rebook the same day instead of holding them for no-shows.",
  },
  {
    c: "Guest Communication & Reservations",
    t: "Email: Welcoming a First-Time Guest After Their Visit",
    u: "New guests visit once and you want them to come back.",
    p: `Write a short thank-you email to a first-time guest at [RESTAURANT NAME] sent the day after their visit. Mention something specific we offer that they may not have tried [DISH, BRUNCH, EVENT], invite them back with [OFFER OR REASON TO RETURN], and ask one quick question about their experience with a link [FEEDBACK LINK]. Under 130 words, warm and personal, signed by [NAME AND ROLE].`,
    tip: "Pointing to one specific thing to try next time gives the guest a reason to return beyond 'come again'.",
  },
  {
    c: "Guest Communication & Reservations",
    t: "Response: Handling Special Occasion Requests",
    u: "Guests ask for birthday, anniversary or proposal help and staff are unsure what you can promise.",
    p: `Write a reply to a guest planning a [OCCASION] at [RESTAURANT NAME] on [DATE] who asked for [THEIR REQUEST]. Confirm what we can do [WHAT WE OFFER], what we cannot [LIMITS, e.g. no outside cakes, no candles], any cost [FEES], and what we need from them in advance [DETAILS AND DEADLINE]. Also write a one-paragraph internal note for the shift team so the moment goes smoothly.`,
    tip: "The internal note matters as much as the reply. Most special-occasion failures are handoff failures between shifts.",
  },

  // ── Reviews & Reputation Management ──
  {
    c: "Reviews & Reputation Management",
    t: "Response: Replying to a Mixed Three-Star Review",
    u: "A review praises some things and criticises others and you want to handle both.",
    p: `Write a public reply to this three-star review of [RESTAURANT NAME]: [PASTE REVIEW]. Thank them for the specific positives they mentioned, acknowledge the specific criticism without excuses, say briefly what we are doing about it [ACTION TAKEN], and invite them back or to contact [MANAGER NAME AND CONTACT]. Under 110 words. Do not offer compensation publicly. ${TRUE}`,
    tip: "Mixed reviews are read closely by undecided diners. A calm, specific reply often matters more here than on five-star reviews.",
  },
  {
    c: "Reviews & Reputation Management",
    t: "Response: Replying to a Review Complaining About Price",
    u: "A guest says your food is overpriced and you want to respond without arguing.",
    p: `Write a public reply to a review of [RESTAURANT NAME] that says our prices are too high: [PASTE REVIEW]. Thank them, explain in one or two honest sentences what goes into our pricing [SOURCING, PORTIONS, PREP], mention a lower-cost way to enjoy us if we have one [HAPPY HOUR, LUNCH MENU], and close warmly. No defensiveness, no sarcasm, under 100 words. ${TRUE}`,
    tip: "Pointing to a lower price entry point turns a price complaint into a useful tip for the next reader.",
  },
  {
    c: "Reviews & Reputation Management",
    t: "Plan: Monthly Review Response Routine for a Busy Manager",
    u: "Reviews pile up across platforms and replies are inconsistent or late.",
    p: `Create a simple weekly routine for responding to reviews on [PLATFORMS] for [RESTAURANT NAME], taking no more than [MINUTES] per week. Include: who owns it [ROLE], response time targets by star rating, three reply templates to adapt (positive, mixed, negative), when to take a conversation offline, what to escalate to the owner, and how to log recurring issues for the team. Keep it to one page.`,
    tip: "Logging recurring complaints is the valuable part. Replies fix perception; the log fixes the actual problem.",
  },
  {
    c: "Reviews & Reputation Management",
    t: "Script: Asking for Reviews at the Table Without Being Awkward",
    u: "You want more reviews but staff feel uncomfortable asking.",
    p: `Write three short, natural ways a server at [RESTAURANT NAME] can invite a clearly happy guest to leave a review on [PLATFORM], plus how to hand over [QR CARD, RECEIPT NOTE]. Include guidance on when to ask (and when not to), and a rule that we never offer discounts or freebies in exchange for reviews and never ask only happy guests to post on one site while steering unhappy guests elsewhere.`,
    tip: "Incentivised or filtered review requests can break platform rules and consumer protection law. A genuine, open ask is safer and works.",
  },
  {
    c: "Reviews & Reputation Management",
    t: "Response: Replying to a Review in Another Language",
    u: "A tourist or local guest left a review in a language other than English.",
    p: `Here is a review of [RESTAURANT NAME] written in [LANGUAGE]: [PASTE REVIEW]. First give me an accurate English translation. Then write a warm reply in [LANGUAGE] with an English version underneath, addressing their specific points, under 100 words. Flag any phrase where the tone might not translate well so I can check it with a native speaker.`,
    tip: "Replying in the reviewer's language signals care to every future guest who speaks it, which matters in tourist areas.",
  },

  // ── Marketing & Social Media Content ──
  {
    c: "Marketing & Social Media Content",
    t: "Post: Staff Spotlight That Guests Actually Read",
    u: "You want to show the people behind the food and build local connection.",
    p: `Write an Instagram and Facebook caption spotlighting [STAFF NAME], our [ROLE] at [RESTAURANT NAME]. Use these details they approved: [HOW LONG THEY HAVE WORKED HERE, FAVOURITE DISH, FUN FACT, QUOTE]. Open with a hook that is not "Meet...", keep it under 120 words, end with a light call to visit, and add 3 to 5 relevant local hashtags. Also suggest the photo to take.`,
    tip: "Always get staff approval for what you share. Spotlights also help recruiting because candidates see real people.",
  },
  {
    c: "Marketing & Social Media Content",
    t: "Script: 30-Second Reel of a Signature Dish",
    u: "Short video gets reach but you do not know what to film.",
    p: `Write a shot list and voiceover or on-screen text for a 20 to 30 second vertical video of [DISH] at [RESTAURANT NAME]. Include: a hook in the first two seconds, 5 to 7 shots with duration each (prep, sizzle, plating, first bite), suggested sound, on-screen text in short lines, and a closing call to action [VISIT, ORDER, BOOK]. It must be filmable on a phone during a quiet prep window.`,
    tip: "Film the most satisfying moment (the pour, the cut, the cheese pull) first. It is your hook and your thumbnail.",
  },
  {
    c: "Marketing & Social Media Content",
    t: "Plan: Google Business Profile Posts for a Month",
    u: "Your Google listing gets more views than your website but you rarely update it.",
    p: `Write four weekly Google Business Profile posts for [RESTAURANT NAME] in [CITY] for [MONTH]. Use these updates: [SPECIALS, EVENTS, HOURS CHANGES, NEW ITEMS]. Each post under 80 words, with a clear button action [BOOK, ORDER, CALL], a photo suggestion, and natural wording that includes what people search for, like [CUISINE] near [NEIGHBOURHOOD]. ${TRUE}`,
    tip: "Keep holiday hours on your Google profile accurate. Wrong hours there cost more guests than almost any bad review.",
  },
  {
    c: "Marketing & Social Media Content",
    t: "Email: Re-Engaging Subscribers Who Stopped Opening",
    u: "Part of your email list has gone quiet and you want to wake them up or clean the list.",
    p: `Write a short re-engagement email for subscribers of [RESTAURANT NAME] who have not opened an email in [MONTHS]. Include a subject line (and two alternatives), one reason to come back now [NEW MENU, EVENT, OFFER], a simple choice (stay subscribed or unsubscribe), and a friendly tone with no guilt. Under 120 words.`,
    tip: "Removing people who never open improves delivery for everyone else on the list. A smaller engaged list beats a big silent one.",
  },
  {
    c: "Marketing & Social Media Content",
    t: "Plan: Content Ideas From What Happens in a Normal Week",
    u: "You run out of things to post and do not have time for photo shoots.",
    p: `List 15 social media post ideas for [RESTAURANT NAME] that come from everyday operations, using what we do each week: [DELIVERIES, PREP, SPECIALS, STAFF, REGULARS, EVENTS]. For each give: the idea, the photo or video to capture in under two minutes, a one-line caption starter, and the best day to post. Mix behind-the-scenes, food, people and community.`,
    tip: "Batch-capture on your quietest prep day. Ten minutes of phone footage can cover two weeks of posts.",
  },

  // ── Menu Development & Food Descriptions ──
  {
    c: "Menu Development & Food Descriptions",
    t: "Checklist: Allergen Labelling Review for a Menu",
    u: "You are updating the menu and need allergen information to be accurate and clear.",
    p: `Review this menu for allergen communication: [PASTE MENU WITH INGREDIENTS]. For each item, list which of the major allergens required in [COUNTRY OR STATE] it likely contains based on the ingredients given, flag items where hidden allergens are common (sauces, dressings, fryer oil, garnishes), and suggest clear icon or note wording. Mark everything as a draft that must be checked against our actual recipes and supplier specs.`,
    tip: "Allergen information is a legal and safety matter. Treat this as a first pass and verify every item against the real recipe card.",
  },
  {
    c: "Menu Development & Food Descriptions",
    t: "Plan: Menu Layout That Guides the Eye to Profitable Items",
    u: "Your best-margin dishes are buried and the menu feels crowded.",
    p: `Suggest a menu layout for [RESTAURANT NAME] using these items with prices and approximate food cost: [PASTE ITEMS]. Recommend sections and their order, where to place high-margin items, how many items per section, how to show prices (no dollar signs, no dotted lines to prices), which items deserve a box or short story, and what to cut to reduce clutter. Explain each recommendation in one line.`,
    tip: "Fewer choices per section usually speeds up ordering and table turns. Seven or so items per category is a common starting point.",
  },
  {
    c: "Menu Development & Food Descriptions",
    t: "Description: Vegan and Gluten-Free Options That Sound Appealing",
    u: "Your plant-based and gluten-free dishes read like afterthoughts.",
    p: `Write menu descriptions for these vegan or gluten-free items at [RESTAURANT NAME]: [ITEMS WITH INGREDIENTS]. Lead with flavour and texture, not what is missing. Keep each to 15 to 25 words. Use "gluten-free" only for items listed as prepared to our gluten-free standard [OUR PROTOCOL]; otherwise suggest "made without gluten ingredients" plus a cross-contact note.`,
    tip: "A dish that sounds delicious sells to the whole table, not just the guest with the dietary need.",
  },
  {
    c: "Menu Development & Food Descriptions",
    t: "Plan: Building a Brunch or Lunch Menu From Existing Inventory",
    u: "You want to add a daypart without buying lots of new ingredients.",
    p: `Design a [BRUNCH OR LUNCH] menu of [NUMBER] items for [RESTAURANT NAME] that reuses our current inventory as much as possible: [LIST KEY INGREDIENTS AND PREP ITEMS]. For each dish give a name, a 15-word description, the ingredients reused, any new ingredients needed, prep complexity (low, medium, high), and a suggested price range based on [TARGET FOOD COST %]. Flag dishes that would strain the line.`,
    tip: "Cross-utilisation is how new dayparts stay profitable. If a dish needs three new SKUs, it needs a strong reason to exist.",
  },
  {
    c: "Menu Development & Food Descriptions",
    t: "Description: Cocktail and Mocktail Menu Copy",
    u: "Your drink list is just names and ingredients and does not sell.",
    p: `Write drink menu copy for [RESTAURANT NAME] for these cocktails and mocktails: [NAMES AND INGREDIENTS]. For each: a short evocative line (under 15 words) about taste and mood, and the key ingredients in a clean list. Give mocktails equal care so they feel like a real choice. Suggest a section order and two names we could improve.`,
    tip: "Well-written mocktails often lift average checks from non-drinkers who would otherwise order water.",
  },

  // ── Advertising Copy & Promotions ──
  {
    c: "Advertising Copy & Promotions",
    t: "Ad: Weeknight Traffic Driver for a Slow Night",
    u: "Mondays or Tuesdays are empty and you want a promotion that brings people in.",
    p: `Create a promotion for [SLOW NIGHT] at [RESTAURANT NAME] with a margin-safe offer based on [OFFER IDEA OR BUDGET]. Write: the offer name, a social ad (headline and 60-word body), an in-house table card, and a one-line staff script. Include clear terms [DATES, LIMITS, DINE-IN ONLY]. Then list three ways to tell if it worked after four weeks.`,
    tip: "Recurring themed nights (taco Tuesday style) usually outperform one-off discounts because guests build a habit.",
  },
  {
    c: "Advertising Copy & Promotions",
    t: "Ad: Gift Card Campaign for the Holidays",
    u: "Gift cards are easy revenue in December but you rarely promote them.",
    p: `Write a holiday gift card campaign for [RESTAURANT NAME]: two social posts, one email (subject line plus 100-word body), counter signage copy, and a staff script. Include any bonus offer [e.g. buy X get Y bonus card, with its own expiry] and required terms for [COUNTRY OR STATE], noting that rules on gift card expiry and fees vary and must be checked.`,
    tip: "Bonus cards should carry their own clear expiry and terms, kept separate from the purchased gift card.",
  },
  {
    c: "Advertising Copy & Promotions",
    t: "Ad: Catering Promotion for Local Offices",
    u: "You want steady weekday catering orders from nearby businesses.",
    p: `Write a catering outreach package for [RESTAURANT NAME] targeting offices near [AREA]: a one-page flyer (headline, 3 package options with per-person pricing [PACKAGES], how to order, lead time), a short cold email to an office manager, and a follow-up email one week later. Emphasise reliability: on-time delivery, labelled dietary options, and setup. ${TRUE}`,
    tip: "Office managers value reliability over novelty. Lead with 'on time and labelled', then the food.",
  },
  {
    c: "Advertising Copy & Promotions",
    t: "Ad: Promoting a Chef's Tasting Menu or Special Dinner",
    u: "You are running a ticketed or limited-seat dinner and need to sell it out.",
    p: `Write promotion copy for a [TASTING MENU OR SPECIAL DINNER] at [RESTAURANT NAME] on [DATE]: price [PRICE], seats available [NUMBER], courses [MENU], pairing option [PAIRING]. Create an announcement post, an email to regulars, a reminder post for when half the seats are gone (only if true), and a last-call post. Keep urgency honest.`,
    tip: "Email your regulars 48 hours before announcing publicly. Early access is a reward that costs you nothing.",
  },
  {
    c: "Advertising Copy & Promotions",
    t: "Ad: Local Partnership Offer With a Nearby Business",
    u: "You want to share customers with a gym, theatre, salon or shop next door.",
    p: `Draft a partnership pitch from [RESTAURANT NAME] to [PARTNER BUSINESS] proposing [OFFER IDEA, e.g. show a ticket stub for a free dessert]. Include: the email pitch (under 180 words), the mutual benefit, how redemption will be tracked [CODE OR CARD], promo copy for both businesses to post, and a simple one-month trial with a check-in date.`,
    tip: "Track redemptions with a unique code per partner so you know which partnership is worth renewing.",
  },

  // ── Staff Management, Training & SOPs ──
  {
    c: "Staff Management, Training & SOPs",
    t: "Training: Allergy Order Procedure From Table to Plate",
    u: "An allergy order goes wrong and you need a clear, repeatable process.",
    p: `Write a step-by-step allergy order procedure for [RESTAURANT NAME] covering front and back of house: how servers ask and record the allergy [POS METHOD], how it is communicated to the kitchen, prep steps to avoid cross-contact [OUR EQUIPMENT AND STATIONS], who checks the plate before it leaves, how it is delivered to the guest, and what to do if anyone is unsure. Keep it to one page with a short quiz of 5 questions for staff.`,
    tip: "Make 'if unsure, ask the manager' an explicit step. Most allergy incidents start with someone guessing.",
  },
  {
    c: "Staff Management, Training & SOPs",
    t: "Training: Upselling Script That Feels Like Hospitality",
    u: "Check averages are flat and servers feel pushy when they suggest add-ons.",
    p: `Write a short training guide for servers at [RESTAURANT NAME] on suggestive selling. Cover: describing specific items instead of asking "anything else?", natural moments to suggest [STARTERS, DRINKS, DESSERTS, SIDES], 8 example lines using our menu [KEY ITEMS], reading when a guest does not want suggestions, and a role-play exercise for pre-shift. Keep it warm, not salesy.`,
    tip: "Recommending one specific dish by name works better than listing options. It sounds like a tip, not a pitch.",
  },
  {
    c: "Staff Management, Training & SOPs",
    t: "Plan: 30-60-90 Day Plan for a New Kitchen Manager",
    u: "You are promoting or hiring a kitchen manager and want clear expectations.",
    p: `Create a 30-60-90 day plan for a new kitchen manager at [RESTAURANT NAME]. Current situation: [KEY ISSUES, e.g. food cost, turnover, consistency]. Include learning goals, systems to take ownership of [ORDERING, SCHEDULING, INVENTORY, TRAINING], measurable targets [TARGETS], weekly check-in topics, and signs they are on track or need support.`,
    tip: "Agree the targets together in week one. A plan they helped shape is one they will actually use.",
  },
  {
    c: "Staff Management, Training & SOPs",
    t: "SOP: Cash Handling and End-of-Night Close",
    u: "Drawer counts are inconsistent and you want a tighter, fair process.",
    p: `Write a cash handling and closing SOP for [RESTAURANT NAME] covering: starting bank amount [AMOUNT], who can access the drawer, handling voids and comps [APPROVAL RULES], tip-out process [OUR POLICY], counting and recording at close, two-person verification, safe drop, and what happens when a drawer is over or short. Keep the tone neutral so honest staff do not feel accused.`,
    tip: "Check your local wage laws before deducting shortages from pay. In many places it is restricted or illegal.",
  },
  {
    c: "Staff Management, Training & SOPs",
    t: "Plan: Reducing Staff Turnover With Low-Cost Changes",
    u: "You keep hiring and training people who leave within months.",
    p: `Suggest a retention plan for [RESTAURANT NAME] given this situation: team size [NUMBER], typical tenure [MONTHS], main reasons people leave [REASONS FROM EXIT CHATS], budget [BUDGET]. Give 10 practical changes ranked by cost and impact (scheduling, training, recognition, growth paths, communication), with how to roll out the top three in the next 30 days and how to measure change.`,
    tip: "Predictable schedules posted early are one of the cheapest retention tools in hospitality.",
  },

  // ── Operations, Vendors & Admin ──
  {
    c: "Operations, Vendors & Admin",
    t: "Checklist: Food Waste Audit for One Week",
    u: "You suspect waste is eating your margin but do not know where.",
    p: `Create a one-week food waste tracking system for [RESTAURANT NAME]. Include: a simple log sheet (item, amount, reason: spoilage, overproduction, plate waste, prep trim, errors), where to place it, who records, and how to review it. Then, based on these results if I have them [PASTE LOG OR SKIP], suggest the top five fixes such as par levels, prep changes, or menu cross-use.`,
    tip: "Weigh waste in a bin for a week. Numbers change behaviour far faster than reminders.",
  },
  {
    c: "Operations, Vendors & Admin",
    t: "Plan: Setting Par Levels and an Ordering Schedule",
    u: "You run out of key items or over-order and throw stock away.",
    p: `Help me set par levels for [RESTAURANT NAME]. Here are our key items with average weekly usage, delivery days and shelf life: [PASTE DATA]. For each item suggest a par level, reorder point and order day, with a simple formula I can reuse. Flag items where usage varies a lot by day of week and how to adjust for [BUSY PERIODS OR EVENTS].`,
    tip: "Review pars monthly and after menu changes. Pars set once and forgotten drift out of line with real usage.",
  },
  {
    c: "Operations, Vendors & Admin",
    t: "Email: Setting Up Third-Party Delivery Menus Properly",
    u: "Your delivery app menu is a copy of your dine-in menu and orders travel badly.",
    p: `Review this dine-in menu for delivery: [PASTE MENU]. Recommend which items to remove because they travel poorly, which to adapt (packaging, sauces on the side), pricing adjustments to cover commission of [COMMISSION %] and packaging cost [COST], item descriptions under 20 words, and photo priorities. Note any local rules on displaying different prices for delivery.`,
    tip: "Delivery-only tweaks like sauces on the side and vented packaging protect your reviews more than any promotion.",
  },
  {
    c: "Operations, Vendors & Admin",
    t: "Checklist: Preventive Maintenance Calendar for Equipment",
    u: "Equipment breaks on your busiest nights and repairs are expensive.",
    p: `Create a preventive maintenance calendar for [RESTAURANT NAME] using our equipment list: [EQUIPMENT, e.g. walk-in, fryers, hood, ice machine, dishwasher]. For each: daily, weekly, monthly and annual tasks, who is responsible, and which tasks should be done by a licensed technician. Include a simple log format and the vendor contact fields to fill in.`,
    tip: "Hood and fire suppression servicing is usually required by code. Keep the certificates where an inspector can see them.",
  },
  {
    c: "Operations, Vendors & Admin",
    t: "Email: Responding to a Landlord or Neighbour Complaint",
    u: "A neighbour or landlord complains about noise, smell, trash or deliveries.",
    p: `Write a calm, cooperative reply from [RESTAURANT NAME] to [LANDLORD OR NEIGHBOUR] about their complaint: [PASTE COMPLAINT]. Acknowledge the issue, state what we will do and by when [ACTIONS AND DATES], offer a direct contact [NAME AND PHONE], and avoid admitting fault beyond the facts. Under 180 words. Add a short note on what to document internally.`,
    tip: "Fix the small, visible thing within a week (bins, delivery timing). Goodwill with neighbours protects your licences.",
  },

  // ── Financial Tasks: Pricing, Costing & Reporting ──
  {
    c: "Financial Tasks: Pricing, Costing & Reporting",
    t: "Analysis: Recipe Costing Card for a Single Dish",
    u: "You are not sure what a dish really costs to make.",
    p: `Build a recipe costing card for [DISH]. Ingredients with quantities per portion and purchase price and unit: [PASTE]. Calculate cost per portion including yield loss [YIELD % FOR TRIMMED ITEMS], add a line for garnish and oil, show food cost percentage at our current price [PRICE], and suggest a price range for a target food cost of [TARGET %]. Show your working so I can reuse it.`,
    tip: "Always cost from yielded weight, not purchase weight. Trim and cooking loss is where hidden cost lives.",
  },
  {
    c: "Financial Tasks: Pricing, Costing & Reporting",
    t: "Analysis: Menu Engineering Matrix",
    u: "You want to know which dishes are stars and which are dragging you down.",
    p: `Run a menu engineering analysis on these items from [PERIOD]: [ITEM, UNITS SOLD, PRICE, FOOD COST]. Calculate contribution margin and popularity for each, classify them as Stars, Plowhorses, Puzzles or Dogs, and give one recommended action per item (keep, reprice, reposition, rework, remove). Present it as a table and summarise the three biggest opportunities.`,
    tip: "Run this each quarter. A 'Dog' that is a guest favourite may still earn its place, but you should know it is costing you.",
  },
  {
    c: "Financial Tasks: Pricing, Costing & Reporting",
    t: "Report: Prime Cost Check Each Week",
    u: "You want one number that tells you if the week was healthy.",
    p: `Using this week's numbers for [RESTAURANT NAME]: sales [SALES], food and beverage purchases [COGS], labour including taxes and benefits [LABOUR], calculate prime cost and prime cost percentage. Compare it to our target [TARGET %] and last four weeks [PASTE IF AVAILABLE]. Explain in plain language what moved and suggest two actions for next week.`,
    tip: "Prime cost weekly beats a perfect P&L monthly. You can still fix a bad week; you cannot fix a bad month after it ends.",
  },
  {
    c: "Financial Tasks: Pricing, Costing & Reporting",
    t: "Analysis: Is This Promotion Actually Profitable?",
    u: "A discount brought people in but you are not sure it made money.",
    p: `Evaluate this promotion at [RESTAURANT NAME]: offer [OFFER], period [DATES], redemptions [NUMBER], average check with the offer [AMOUNT] vs normal [AMOUNT], food cost of the discounted item [COST], extra labour [HOURS]. Estimate net profit impact, compare it to a normal week [NORMAL WEEK DATA], and tell me whether to repeat, change or drop it. List any assumptions.`,
    tip: "Track whether promo guests come back at full price. A promotion that builds regulars can be worth a thin first visit.",
  },
  {
    c: "Financial Tasks: Pricing, Costing & Reporting",
    t: "Plan: Cash Flow Forecast for the Next 13 Weeks",
    u: "You need to see cash crunches before they happen.",
    p: `Build a 13-week cash flow forecast template for [RESTAURANT NAME]. Inputs: expected weekly sales [SALES BY WEEK OR AVERAGE], seasonality notes [NOTES], fixed costs and due dates [RENT, LOANS, INSURANCE], payroll schedule [FREQUENCY], supplier terms [TERMS], and known one-offs [TAXES, REPAIRS]. Show weekly opening cash, inflows, outflows and closing cash, and flag weeks below [MINIMUM CASH].`,
    tip: "Share the forecast with your accountant. Quarterly tax payments are the most common surprise in restaurant cash flow.",
  },

  // ── Difficult Situations & Conflict ──
  {
    c: "Difficult Situations & Conflict",
    t: "Script: Handling a Guest Who Has Had Too Much to Drink",
    u: "Staff need a respectful way to stop service to an intoxicated guest.",
    p: `Write a script and procedure for [RESTAURANT NAME] for refusing further alcohol service to a visibly intoxicated guest, based on [STATE OR COUNTRY] responsible service rules. Cover: signs to look for, who makes the call [ROLE], private and calm wording, offering food, water and a ride [RIDESHARE OR TAXI], what to do if they become aggressive, and how to log the incident.`,
    tip: "Always involve a manager and log the incident. Responsible service laws put real liability on the business and the server.",
  },
  {
    c: "Difficult Situations & Conflict",
    t: "Response: A Social Media Post Going Viral Against You",
    u: "A negative post, video or story about you is spreading fast.",
    p: `Help me respond to this post about [RESTAURANT NAME] that is getting attention: [PASTE POST AND CONTEXT]. What actually happened, as far as we know: [FACTS]. Draft: a holding statement for the next hour, a fuller public response once facts are confirmed, internal talking points for staff, and a list of things NOT to do (arguing in comments, deleting criticism, sharing private guest details). ${TRUE}`,
    tip: "Tell staff not to comment personally. One employee reply can undo a careful public statement.",
  },
  {
    c: "Difficult Situations & Conflict",
    t: "Script: Guest With a Service Animal or Pet Question",
    u: "A guest brings an animal and staff are unsure what they may ask.",
    p: `Write a short guide for staff at [RESTAURANT NAME] in [COUNTRY OR STATE] on guests with animals. Cover what staff may and may not ask about service animals under the rules that apply to us [e.g. ADA in the US], how pets are handled [OUR POLICY, e.g. patio only], respectful wording for common situations, and when an animal can be asked to leave (such as being out of control). Flag anything to confirm with a local authority.`,
    tip: "In the US, staff may ask only two questions about a service animal. Getting this wrong can lead to a discrimination complaint.",
  },
  {
    c: "Difficult Situations & Conflict",
    t: "Email: Addressing a Staff Complaint About a Manager",
    u: "An employee raises a concern about how a manager treats them.",
    p: `Write a response from [OWNER OR GM] to an employee who raised this concern about a manager: [SUMMARY, NO NAMES NEEDED]. Thank them, confirm how the concern will be handled [PROCESS], who will be involved, expected timeline, that retaliation is not allowed, and how to reach me in the meantime. Under 180 words. Also list the documentation I should keep and when to involve HR or legal help.`,
    tip: "Respond in writing within a day, even if the investigation takes longer. Silence reads as dismissal.",
  },
  {
    c: "Difficult Situations & Conflict",
    t: "Script: Guest Leaves Without Paying (Dine and Dash)",
    u: "It happened again and you want a clear, safe response for staff.",
    p: `Write a dine-and-dash policy for [RESTAURANT NAME]. Include prevention steps (section awareness, payment timing for large or unfamiliar groups), what staff should do in the moment (do not chase or physically stop anyone), how to record details, when to contact police, and a statement that servers are never charged for the loss if [OUR POLICY]. Check local wage rules on deductions.`,
    tip: "Staff safety comes first. Chasing a guest into the street is never worth the cost of a meal.",
  },

  // ── Planning, Strategy & Events ──
  {
    c: "Planning, Strategy & Events",
    t: "Plan: Launching Online Ordering for Pickup",
    u: "You want direct pickup orders instead of relying on delivery apps.",
    p: `Create a launch plan for direct online pickup ordering at [RESTAURANT NAME] using [PLATFORM]. Include: menu subset for pickup, pickup time slots and kitchen capacity [ORDERS PER 15 MIN], packaging, pickup area setup, staff roles, a soft-launch week, launch promotion [OFFER], announcement copy for email, social and in-store, and three numbers to track weekly.`,
    tip: "Cap orders per time slot from day one. An overwhelmed line during launch week creates reviews you will be answering for months.",
  },
  {
    c: "Planning, Strategy & Events",
    t: "Plan: Hosting a Charity or Community Night",
    u: "You want to support a local cause and build community goodwill.",
    p: `Plan a community night at [RESTAURANT NAME] supporting [CAUSE OR ORGANISATION] on [DATE]. Include: the giving model [e.g. X% of sales, with how it is calculated], agreement points with the organisation, promotion copy for both sides, staff briefing, and how we report the total raised afterwards. Make the donation terms specific and transparent.`,
    tip: "Say exactly what is donated ('15% of food sales from 5 to 9pm'). Vague 'a portion of proceeds' promises can mislead guests.",
  },
  {
    c: "Planning, Strategy & Events",
    t: "Plan: Patio or Seasonal Seating Launch",
    u: "Patio season is coming and you want to open it smoothly and fill it.",
    p: `Create a patio opening plan for [RESTAURANT NAME] opening on [DATE] with [NUMBER] seats. Cover: permits and inspections to confirm [LOCAL RULES], furniture, heating or shade, weather policy for reservations, extra staffing, a patio-specific drink or menu [IDEAS], and a launch announcement with photo ideas. Include a checklist for the week before opening.`,
    tip: "Decide the rain policy for patio bookings before you open. Guests remember how you handled the storm.",
  },
  {
    c: "Planning, Strategy & Events",
    t: "Plan: Rebranding or Refreshing the Concept",
    u: "Sales are slipping and the concept feels dated.",
    p: `Help me evaluate a concept refresh for [RESTAURANT NAME]. Current situation: [CUISINE, PRICE POINT, GUEST PROFILE, SALES TREND, WHAT GUESTS SAY]. Local competition: [COMPETITORS]. Give me options from light (menu and decor touch-ups) to full rebrand, with rough cost ranges I should verify, risks, what to keep for loyal regulars, and how to test changes before committing.`,
    tip: "Ask your regulars first. They are the guests most likely to leave if a refresh removes what they love.",
  },
  {
    c: "Planning, Strategy & Events",
    t: "Plan: Wine Dinner or Pairing Event With a Supplier",
    u: "A wine, beer or spirits rep offered to co-host an event.",
    p: `Plan a pairing dinner at [RESTAURANT NAME] with [SUPPLIER OR PRODUCER] on [DATE] for [SEATS] guests at [TICKET PRICE]. Include: a 4 to 5 course menu concept matched to [PRODUCTS], cost and margin estimate, who pays for what with the supplier, the evening's run of show, host talking points, ticket sales copy, and follow-up to attendees. Note any local rules on alcohol promotions or tastings.`,
    tip: "Agree in writing what the supplier covers (product, staff, promotion) before you announce the event.",
  },

  // ── Bonus: Power Prompts ──
  {
    c: "Bonus: Power Prompts",
    t: "Power Prompt: Full Diagnostic of Why Sales Are Down",
    u: "Sales dropped and you need to find out why before you spend money fixing the wrong thing.",
    p: `Act as a restaurant consultant. Sales at [RESTAURANT NAME] are down [PERCENT] over [PERIOD]. Here is what I know: covers [DATA], average check [DATA], daypart and day-of-week trends [DATA], recent changes [MENU, PRICES, STAFF, HOURS], review themes [THEMES], local changes [COMPETITION, CONSTRUCTION, EVENTS]. Ask me up to five clarifying questions first. Then give a ranked list of likely causes with the evidence for each, what data would confirm it, and one low-cost test for each cause.`,
    tip: "Split the drop into fewer guests vs lower spend per guest first. The fix for each is completely different.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Power Prompt: Build a Regulars Program Without Discounting",
    u: "You want more repeat visits but do not want to train guests to wait for deals.",
    p: `Design a recognition program for regulars at [RESTAURANT NAME] that relies on experience, not discounts. Our guests: [GUEST PROFILE]. Tools we have: [POS, CRM, RESERVATION SYSTEM]. Include: how we identify regulars, 10 low-cost recognition ideas (remembering orders, first taste of new dishes, priority booking), staff scripts, how to record preferences respectfully, and how to measure repeat visit rate over 90 days.`,
    tip: "Recording a guest's usual order and name in your reservation system is often the highest-value, lowest-cost loyalty tool.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Power Prompt: Complete Opening Playbook for a New Hire Cohort",
    u: "You are opening, reopening or hiring a big group at once and need them ready fast.",
    p: `Build a training playbook for [NUMBER] new front and back of house hires starting [DATE] at [RESTAURANT NAME]. Include: a day-by-day schedule for the first two weeks, menu and allergy training, service steps, POS training, food safety basics required in [LOCATION], mock service nights, sign-off checklists per role, and a quiz per role. Mark which parts must be delivered by a certified trainer.`,
    tip: "Run at least two friends-and-family services before opening to paying guests. Real pressure reveals gaps training misses.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Power Prompt: Turn Last Month's Numbers Into an Action Plan",
    u: "You have reports but they do not tell you what to do next.",
    p: `Here are last month's numbers for [RESTAURANT NAME]: [SALES, COVERS, AVERAGE CHECK, FOOD COST %, LABOUR %, TOP AND BOTTOM ITEMS, REVIEW RATING, ANY NOTES]. Summarise in plain language what went well and what did not, identify the three changes with the biggest profit impact, and turn them into a 30-day action plan with owners, deadlines and the metric to watch for each. ${TRUE}`,
    tip: "Pick only three actions. Restaurants that try to fix ten things in a month usually fix none.",
  },
  {
    c: "Bonus: Power Prompts",
    t: "Power Prompt: Launch a New Signature Dish Across the Whole Business",
    u: "You created a dish you believe in and want it to become known for it.",
    p: `Plan a full launch for [DISH] at [RESTAURANT NAME] launching [DATE]. Include: a menu description, costing check at price [PRICE], line prep and plating standards card, server tasting and talking points, a two-week content plan (reel, posts, email, Google update), a local media pitch paragraph, a launch night idea, and how to measure success at 30 days (units sold, reorders, mentions in reviews). ${TRUE}`,
    tip: "Let every server taste it before launch. Staff who have eaten a dish sell it with far more conviction.",
  },
];
