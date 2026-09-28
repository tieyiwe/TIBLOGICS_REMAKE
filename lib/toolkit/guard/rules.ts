// Compliance Guard: phrase rules per industry.
//
// These are screening rules, not legal determinations. Each one flags wording
// that regulators, platforms or professional bodies have specifically called
// out, names where that comes from, and suggests a safer way to say it. A
// flag means "look at this before it goes out", never "this is illegal", and
// a clean result is not clearance. The UI says so on every check.
//
// Word lists lean on published guidance rather than instinct:
//   Real estate  – Fair Housing Act 42 U.S.C. 3604(c); HUD's 1995 advertising
//                  guidance (the "Achtenberg memo"); state source-of-income laws
//   Finance      – SEC Marketing Rule (Advisers Act Rule 206(4)-1); FINRA Rule
//                  2210; Treasury Circular 230 §10.30 for tax practitioners
//   Nonprofit    – IRC §6115 quid pro quo disclosure; IRC §170 substantiation;
//                  state charitable-solicitation law on donor intent
//   Agency       – FTC Act §5; FTC Endorsement Guides (16 CFR 255); FTC rule on
//                  fake reviews and testimonials (16 CFR 465); CAN-SPAM
//   Restaurant   – FDA gluten-free labeling rule (21 CFR 101.91); FDA/USDA
//                  claim rules; state alcohol-promotion law

export type Vertical = "realtor" | "finance" | "nonprofit" | "agency" | "restaurant" | "general";
export type Severity = "high" | "medium" | "low";

export interface GuardRule {
  id: string;
  verticals: Vertical[] | "all";
  severity: Severity;
  /** Case-insensitive; matched against the text as written. */
  pattern: RegExp;
  /** What the problem is, in one sentence. */
  why: string;
  /** Where the concern comes from. */
  basis: string;
  /** How to say it instead. */
  fix: string;
}

// Whole-phrase match. Lookarounds rather than \b, because \b never matches
// next to a non-word character: "#1 rated" or "free*" would silently never fire.
const w = (words: string[]) => new RegExp(`(?<![\\w])(?:${words.join("|")})(?![\\w])`, "gi");

export const RULES: GuardRule[] = [
  // ── Real estate: Fair Housing ────────────────────────────────────────────
  {
    id: "fh-familial-status",
    verticals: ["realtor"],
    severity: "high",
    pattern: w(["no (?:kids|children)", "adults? only", "(?:perfect|ideal|great) for (?:a )?(?:singles?|couples?|young professionals?|empty[- ]nesters?|retirees)", "not suitable for (?:kids|children|families)", "mature (?:couple|adults?|persons?|individuals?)"]),
    why: "Describes who should live here by family status, which the Fair Housing Act protects.",
    basis: "Fair Housing Act §3604(c) (familial status); HUD advertising guidance",
    fix: "Describe the property, not the buyer: \"quiet cul-de-sac\", \"low-maintenance layout\", \"one-level living\".",
  },
  {
    id: "fh-family-preference",
    verticals: ["realtor"],
    severity: "medium",
    pattern: w(["(?:perfect|ideal|great|made) for (?:a )?(?:growing |young |large |small )?famil(?:y|ies)", "family[- ]friendly (?:neighborhood|community|area|street)", "family neighborhood"]),
    why: "Implies a preference for households with children, which can be read as steering on familial status.",
    basis: "Fair Housing Act §3604(c); HUD advertising guidance",
    fix: "Name the features instead: \"fenced yard\", \"four bedrooms\", \"near parks and the library\".",
  },
  {
    id: "fh-religion-race-origin",
    verticals: ["realtor"],
    severity: "high",
    pattern: w(["christian (?:home|family|community|neighborhood)", "jewish (?:neighborhood|community)", "muslim (?:neighborhood|community)", "(?:white|black|hispanic|latino|asian|ethnic|integrated|minority) (?:neighborhood|community|area|buyers?|families)", "english[- ]speaking only", "must speak english", "no (?:immigrants|foreigners)"]),
    why: "Refers to race, religion or national origin of residents or buyers, all protected classes.",
    basis: "Fair Housing Act §3604(c) (race, color, religion, national origin)",
    fix: "Remove references to who lives nearby. Describe amenities, commute times and the property itself.",
  },
  {
    id: "fh-disability",
    verticals: ["realtor"],
    severity: "high",
    pattern: w(["no wheelchairs?", "able[- ]bodied", "must be able to climb", "not for (?:the )?(?:disabled|handicapped)", "no (?:mentally|emotionally) ill", "no service animals?"]),
    why: "Excludes or discourages people with disabilities, a protected class; service animals are not pets.",
    basis: "Fair Housing Act §3604(c) (handicap); HUD guidance on assistance animals",
    fix: "State accessibility facts neutrally: \"second-floor unit, no elevator\", \"three steps to entry\".",
  },
  {
    id: "fh-sex",
    verticals: ["realtor"],
    severity: "high",
    pattern: w(["bachelor pad", "(?:female|male|women|men)s? only", "ideal for (?:a )?(?:single )?(?:man|woman|gentleman|lady)", "man cave"]),
    why: "Signals a preference by sex, a protected class. (\"Man cave\" is usually harmless but is often flagged; rename it.)",
    basis: "Fair Housing Act §3604(c) (sex)",
    fix: "Use room descriptions: \"studio apartment\", \"bonus room\", \"finished basement den\".",
  },
  {
    id: "fh-exclusive",
    verticals: ["realtor"],
    severity: "medium",
    pattern: w(["exclusive (?:neighborhood|community|area)", "restricted (?:neighborhood|community)", "private community of like[- ]minded"]),
    why: "\"Exclusive\" and \"restricted\" have a history as code for racial exclusion and are named in HUD guidance.",
    basis: "HUD advertising guidance (1995); NAR fair housing training",
    fix: "Say what is actually there: \"gated entry\", \"HOA-maintained grounds\", \"limited number of homes\".",
  },
  {
    id: "fh-steering-safety-schools",
    verticals: ["realtor"],
    severity: "medium",
    pattern: w(["safe (?:neighborhood|area|community|street)", "low[- ]crime", "crime[- ]free", "good schools?", "best schools?", "great school district", "desirable (?:neighborhood|area) for"]),
    why: "Subjective safety and school-quality claims can steer buyers and are a common complaint trigger.",
    basis: "NAR Code of Ethics Art. 10 guidance; HUD steering cases",
    fix: "Point to sources instead of judging: \"assigned to Lincoln Elementary (verify with the district)\", \"see local crime maps at …\".",
  },
  {
    id: "fh-income-source",
    verticals: ["realtor"],
    severity: "high",
    pattern: w(["no section 8", "section 8 not accepted", "no (?:housing )?vouchers", "no government assistance", "must be employed", "employed professionals only"]),
    why: "Refusing housing vouchers or public assistance is illegal source-of-income discrimination in many states and cities.",
    basis: "State and local source-of-income laws (e.g. CA, NY, NJ, WA, and many cities)",
    fix: "State the actual financial criteria that apply to everyone, e.g. \"income of 2.5× rent from any lawful source\".",
  },
  {
    id: "fh-senior",
    verticals: ["realtor"],
    severity: "low",
    pattern: w(["seniors? only", "retirement community", "55\\+ only", "over[- ]55", "adult community"]),
    why: "Age-restricted marketing is lawful only for housing that qualifies under the Housing for Older Persons Act.",
    basis: "Fair Housing Act §3607(b) (HOPA exemption)",
    fix: "Keep it if the community is HOPA-qualified and say so; otherwise describe features like \"single-level\" instead.",
  },

  // ── Finance: SEC Marketing Rule, FINRA 2210, Circular 230 ─────────────────
  {
    id: "fin-guarantee",
    verticals: ["finance"],
    severity: "high",
    pattern: w(["guaranteed? (?:returns?|income|growth|results?|profits?|gains?)", "risk[- ]free", "no risk", "can(?:no|')t lose", "zero risk", "(?:safe|secure) investment", "principal is (?:always )?protected"]),
    why: "Guarantees or \"no risk\" statements about investments are treated as misleading.",
    basis: "SEC Marketing Rule 206(4)-1(a); FINRA Rule 2210(d)(1)",
    fix: "Describe the approach and risks: \"aims to…\", \"all investing involves risk, including loss of principal\".",
  },
  {
    id: "fin-promissory",
    verticals: ["finance"],
    severity: "high",
    pattern: w(["will (?:double|triple|grow|outperform|beat)", "beat the market", "outperform the market", "never lose money", "you will retire (?:early|rich)", "make you (?:rich|wealthy)"]),
    why: "Predicts or promises investment results.",
    basis: "FINRA Rule 2210(d)(1)(F) (no predictions or projections); SEC Marketing Rule",
    fix: "Replace outcomes with process: \"we build a plan around your goals and review it quarterly\".",
  },
  {
    id: "fin-performance",
    verticals: ["finance"],
    severity: "medium",
    pattern: /\b(?:returned|earned|gained|averag(?:ed|ing)|delivered)\s+(?:an?\s+)?(?:average\s+)?(?:of\s+)?\d+(?:\.\d+)?\s?%/gi,
    why: "Specific performance figures need required context: time periods, net-of-fees results and disclosures.",
    basis: "SEC Marketing Rule 206(4)-1(d) (performance presentation)",
    fix: "Remove the figure, or have compliance add net-of-fee returns, periods and disclosures before use.",
  },
  {
    id: "fin-superlative",
    verticals: ["finance"],
    severity: "medium",
    pattern: w(["(?:the )?best (?:financial )?(?:advisor|adviser|planner|firm|accountant|cpa)", "#1 (?:advisor|adviser|firm|planner)", "number one (?:advisor|adviser|firm)", "top[- ]rated (?:advisor|adviser|firm)"]),
    why: "Unsubstantiated superlatives and third-party ratings need the rating's source, date and criteria.",
    basis: "SEC Marketing Rule (third-party ratings); FINRA 2210(d)(1)(B)",
    fix: "Use verifiable facts: \"CFP® professional since 2012\", or cite the rating with its source and date.",
  },
  {
    id: "fin-testimonial",
    verticals: ["finance"],
    severity: "medium",
    pattern: w(["testimonials?", "(?:our|happy) clients say", "client reviews?", "(?:5|five)[- ]star reviews?"]),
    why: "Testimonials in adviser marketing require disclosures (client status, compensation, conflicts).",
    basis: "SEC Marketing Rule 206(4)-1(b); FINRA Rule 2210(d)(6)",
    fix: "Include the required disclosures next to any testimonial, or check with your compliance officer first.",
  },
  {
    id: "fin-tax-claims",
    verticals: ["finance"],
    severity: "high",
    pattern: w(["irs[- ](?:approved|certified|endorsed)", "approved by the irs", "guaranteed (?:biggest |maximum |larger )?refund", "biggest refund guaranteed", "eliminate your tax(?:es)?", "pay no tax(?:es)?", "tax[- ]free (?:income|money) guaranteed"]),
    why: "Implies IRS endorsement or guarantees tax outcomes; tax practitioners may not advertise either.",
    basis: "Treasury Circular 230 §10.30; IRS guidance on practitioner advertising",
    fix: "Describe the service: \"we review every credit and deduction you qualify for\".",
  },
  {
    id: "fin-fiduciary",
    verticals: ["finance"],
    severity: "low",
    pattern: w(["fiduciary", "fee[- ]only", "no conflicts? of interest", "unbiased advice"]),
    why: "Accurate only if true for every service and account; regulators test these claims against how you are paid.",
    basis: "SEC and state securities regulator enforcement on misleading status claims",
    fix: "Keep it only if it applies to all of your services, and link to your Form ADV or disclosure.",
  },

  // ── Nonprofit: donor intent and deductibility ────────────────────────────
  {
    id: "np-full-deductible",
    verticals: ["nonprofit"],
    severity: "high",
    pattern: w(["fully tax[- ]deductible", "100% tax[- ]deductible", "entire (?:ticket|purchase|amount) is (?:tax[- ])?deductible"]),
    why: "When donors receive goods or services (a gala dinner, a raffle item), only the amount above fair market value is deductible.",
    basis: "IRC §6115 (quid pro quo disclosure over $75); IRS Publication 1771",
    fix: "\"Your gift is tax-deductible to the extent allowed by law. The fair market value of the dinner is $X.\"",
  },
  {
    id: "np-all-goes-to",
    verticals: ["nonprofit"],
    severity: "medium",
    pattern: w(["100% (?:of (?:your|every|each) (?:gift|donation|dollar) )?goes (?:directly )?to", "every (?:penny|dollar|cent) goes (?:directly )?to", "no overhead", "zero overhead", "all (?:of )?(?:your|the) (?:gift|donation|money) goes"]),
    why: "Only accurate if costs are covered by a separate funder; otherwise it misstates how gifts are used.",
    basis: "State charitable-solicitation law (deceptive solicitation); BBB Wise Giving standards",
    fix: "Say what is true: \"Our board covers operating costs, so gifts to this fund go to …\" or cite your program ratio.",
  },
  {
    id: "np-match",
    verticals: ["nonprofit"],
    severity: "medium",
    pattern: w(["(?:your )?gift (?:will be )?(?:doubled|matched|tripled)", "double your (?:impact|gift)", "matching gift"]),
    why: "A match claim must reflect a real, committed match, including its cap and deadline.",
    basis: "State charitable-solicitation law; FTC Act §5 (deceptive claims)",
    fix: "Name the matcher, the cap and the deadline: \"The Smith Foundation will match gifts up to $10,000 through June 30.\"",
  },
  {
    id: "np-restricted",
    verticals: ["nonprofit"],
    severity: "medium",
    pattern: w(["use (?:the|these|restricted) (?:funds|gifts?) (?:for|to cover) (?:general|operating|other)", "reallocate (?:restricted|designated) (?:funds|gifts?)", "redirect (?:the )?(?:restricted|designated) (?:funds|gifts?)"]),
    why: "Restricted gifts must be used as the donor specified; repurposing needs donor consent or legal process.",
    basis: "State law on donor-restricted gifts (UPMIFA); state attorney general enforcement",
    fix: "Ask the donor for written permission to redirect, or keep the gift in its designated fund.",
  },
  {
    id: "np-client-privacy",
    verticals: ["nonprofit"],
    severity: "low",
    pattern: w(["(?:client|patient|resident|participant)'?s? (?:full )?name", "real names?", "their (?:diagnosis|medical|immigration|case) (?:details|history|status)"]),
    why: "Stories about the people you serve need their consent and should not expose sensitive details.",
    basis: "Donor Bill of Rights / ethical storytelling standards; HIPAA where health information is involved",
    fix: "Get written consent, change names, and leave out diagnoses, immigration status and case details.",
  },

  // ── Agency: FTC endorsements, claims, email ──────────────────────────────
  {
    id: "ag-fake-reviews",
    verticals: ["agency", "restaurant", "general"],
    severity: "high",
    pattern: w(["write (?:\\d+ |some |a few |several )?(?:fake |sample )?(?:customer |google |yelp |amazon )?reviews? (?:for|as|from)", "(?:fake|made[- ]up|invented) (?:reviews?|testimonials?)", "reviews? from (?:customers|people) who (?:didn't|did not|never)", "pretend to be a (?:customer|guest|client)"]),
    why: "Writing reviews or testimonials that do not come from real customers is prohibited, with civil penalties per violation.",
    basis: "FTC rule on consumer reviews and testimonials (16 CFR Part 465, 2024)",
    fix: "Ask real customers for reviews, and use their words as written.",
  },
  {
    id: "ag-endorsement-disclosure",
    verticals: ["agency", "general"],
    severity: "medium",
    pattern: w(["influencer", "sponsored post", "gifted (?:product|item)", "brand ambassador", "affiliate link", "in exchange for (?:a )?(?:free|discount|review)"]),
    why: "Paid or gifted endorsements need a clear, conspicuous disclosure of the relationship.",
    basis: "FTC Endorsement Guides, 16 CFR 255.5",
    fix: "Add \"#ad\", \"Sponsored\" or \"I received this for free\" at the start of the post, not buried in hashtags.",
  },
  {
    id: "ag-unsubstantiated",
    verticals: ["agency", "general", "restaurant"],
    severity: "medium",
    pattern: w(["clinically proven", "scientifically proven", "doctor[- ]recommended", "#1 (?:rated|in|choice)", "number one (?:rated|in)", "(?:the )?best in (?:town|the (?:city|state|country|world))", "guaranteed results", "100% guaranteed"]),
    why: "Objective claims (proven, #1, best, guaranteed) need evidence in hand before they run.",
    basis: "FTC Act §5; FTC Policy Statement on Advertising Substantiation",
    fix: "Use what you can prove: \"rated 4.8 on Google (212 reviews, May 2026)\", or make it clearly opinion.",
  },
  {
    id: "ag-results-typical",
    verticals: ["agency", "general"],
    severity: "medium",
    pattern: w(["(?:tripled|doubled|10x|5x) (?:their|our clients'?) (?:revenue|sales|leads|traffic)", "results like these", "you (?:can|will) (?:get|see) (?:the same|similar) results"]),
    why: "Showcasing exceptional results implies they are typical; the FTC expects typical results to be disclosed.",
    basis: "FTC Endorsement Guides, 16 CFR 255.2(b)",
    fix: "Say what is typical, or add \"Results vary. [Client] saw X over Y months.\"",
  },
  {
    id: "ag-free",
    verticals: ["agency", "general", "restaurant"],
    severity: "low",
    pattern: w(["free (?:trial|gift|consultation|audit)[^.]{0,40}(?:credit card|payment|purchase) required", "free\\*"]),
    why: "\"Free\" with conditions must state those conditions clearly next to the offer.",
    basis: "FTC Guide Concerning Use of the Word \"Free\" (16 CFR 251)",
    fix: "State the conditions in the same place and type size as the word \"free\".",
  },
  {
    id: "ag-scarcity",
    verticals: ["agency", "general", "restaurant", "nonprofit"],
    severity: "low",
    pattern: w(["only \\d+ (?:spots?|seats?|left|remaining)", "ends (?:tonight|today|at midnight)", "last chance", "limited time only", "expires in \\d+ (?:hours?|minutes?)"]),
    why: "Scarcity and deadlines must be real; invented urgency is a deceptive practice.",
    basis: "FTC Act §5; FTC guidance on dark patterns (2022)",
    fix: "Keep it only if the limit is real, and state the actual date or number.",
  },
  {
    id: "ag-email-footer",
    verticals: ["agency", "general", "restaurant", "nonprofit"],
    severity: "low",
    pattern: w(["email (?:blast|campaign|newsletter) to (?:our|the|a) (?:list|customers|subscribers)", "cold email (?:campaign|sequence)"]),
    why: "Commercial email needs a working unsubscribe link and a physical postal address.",
    basis: "CAN-SPAM Act, 15 U.S.C. 7704",
    fix: "Make sure the send includes an unsubscribe link and your business mailing address.",
  },

  // ── Restaurant: food and alcohol claims ──────────────────────────────────
  {
    id: "rs-allergen-free",
    verticals: ["restaurant"],
    severity: "high",
    pattern: w(["(?:nut|peanut|allergen|dairy|shellfish|soy|egg)[- ]free", "safe for (?:people with )?(?:allergies|celiacs?|anyone with)", "no risk of cross[- ]contact", "100% gluten[- ]free kitchen"]),
    why: "An allergen-free claim is a safety promise; shared kitchens rarely can make it.",
    basis: "FDA Food Allergen Labeling (FALCPA); state and local food codes",
    fix: "\"Made without nuts. Our kitchen handles nuts, so we can't guarantee against cross-contact.\"",
  },
  {
    id: "rs-gluten-free",
    verticals: ["restaurant"],
    severity: "medium",
    pattern: w(["gluten[- ]free"]),
    why: "\"Gluten-free\" means under 20 ppm gluten under the FDA rule; restaurants are expected to meet it when they use the term.",
    basis: "FDA gluten-free rule, 21 CFR 101.91, and FDA guidance for restaurants",
    fix: "Use it only for items you control for cross-contact; otherwise say \"made without gluten-containing ingredients\".",
  },
  {
    id: "rs-health-claims",
    verticals: ["restaurant"],
    severity: "low",
    pattern: w(["(?:boosts?|strengthens?) (?:your )?immun(?:e|ity)", "detox(?:ifying)?", "cures?", "prevents? (?:cancer|disease|illness)", "heart[- ]healthy", "low[- ]fat", "organic"]),
    why: "Health, nutrient-content and \"organic\" claims have defined meanings and need to be accurate.",
    basis: "FDA nutrient-content and health-claim rules; USDA National Organic Program",
    fix: "Describe ingredients and preparation instead, and use \"organic\" only for certified organic ingredients.",
  },
  {
    id: "rs-alcohol",
    verticals: ["restaurant"],
    severity: "medium",
    pattern: w(["bottomless (?:mimosas?|drinks?|beer|wine)", "all[- ]you[- ]can[- ]drink", "unlimited (?:drinks|alcohol|beer|wine|mimosas?)", "free (?:shots?|drinks?|beer|wine)", "drink specials? all day"]),
    why: "Many states restrict unlimited-drink and free-alcohol promotions.",
    basis: "State alcoholic-beverage control laws (e.g. MA, UT, NC restrict happy hours and unlimited drinks)",
    fix: "Check your state's rules before promoting; price-per-drink specials are safer.",
  },
  {
    id: "rs-review-privacy",
    verticals: ["restaurant", "agency", "general"],
    severity: "medium",
    pattern: w(["(?:your|the guest's|the customer's) (?:reservation|order|visit) (?:on|at) \\d", "(?:we (?:checked|looked up)) (?:your|their) (?:reservation|order|account)", "your (?:table|party) of \\d+ (?:on|at)"]),
    why: "Public replies that reveal a customer's visit details can breach their privacy and escalate the complaint.",
    basis: "Platform review policies (Google, Yelp); general privacy expectations",
    fix: "Keep public replies general and move specifics to a private message or phone call.",
  },
];

export const VERTICAL_LABELS: Record<Vertical, string> = {
  realtor: "Real estate",
  finance: "Financial services",
  nonprofit: "Nonprofit",
  agency: "Marketing agency",
  restaurant: "Restaurant",
  general: "General business",
};

export function rulesFor(vertical: Vertical): GuardRule[] {
  return RULES.filter((r) => r.verticals === "all" || r.verticals.includes(vertical));
}
