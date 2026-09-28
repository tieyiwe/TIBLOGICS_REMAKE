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

export type Vertical =
  | "realtor" | "finance" | "nonprofit" | "agency" | "restaurant"
  | "social-work" | "medical" | "legal" | "insurance" | "home-services" | "ecommerce" | "hr"
  | "general";
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
    verticals: ["agency", "restaurant", "general", "medical", "legal", "insurance", "home-services", "ecommerce"],
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

  // ── Medical practices ────────────────────────────────────────────────────
  {
    id: "md-guarantee",
    verticals: ["medical"],
    severity: "high",
    pattern: w(["guaranteed (?:results|cure|recovery|outcome|relief)", "100% (?:effective|safe|success)", "cures?", "painless", "pain[- ]free", "no side effects", "risk[- ]free (?:procedure|treatment|surgery)", "permanent(?:ly)? (?:cure|fix|results)"]),
    why: "Promises about treatment outcomes or safety are treated as misleading, and outcomes vary by patient.",
    basis: "FTC Act §5 (health claims); state medical board advertising rules; AMA Code of Medical Ethics on advertising",
    fix: "Describe what the treatment involves and who it may help: \"many patients find…\", \"results vary; we'll discuss what to expect.\"",
  },
  {
    id: "md-phi",
    verticals: ["medical", "social-work"],
    severity: "high",
    pattern: /\b(?:date of birth|DOB|MRN|medical record (?:number|no\.?)|SSN|social security (?:number|no\.?))\b|\b\d{3}-\d{2}-\d{4}\b|\b(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/gi,
    why: "Looks like an identifier (date of birth, record or social security number). Identifiable health or client information should not go into marketing, social media or shared drafts.",
    basis: "HIPAA Privacy Rule (45 CFR 164.514 de-identification); NASW Code of Ethics 1.07 (confidentiality)",
    fix: "Remove identifiers. Refer to \"a patient\" or \"a client\", and use a secure, approved system for anything identifiable.",
  },
  {
    id: "md-testimonial",
    verticals: ["medical"],
    severity: "medium",
    pattern: w(["patient testimonials?", "before (?:and|&) after (?:photos?|pictures?|results)", "our patient \\w+ (?:said|says)", "real patient results?"]),
    why: "Patient stories and before-and-after images need written authorization and should not suggest typical results.",
    basis: "HIPAA marketing authorization (45 CFR 164.508(a)(3)); FTC Endorsement Guides (typical results)",
    fix: "Use only with the patient's written authorization, and add \"Individual results vary.\"",
  },
  {
    id: "md-superlative",
    verticals: ["medical"],
    severity: "low",
    pattern: w(["best (?:doctor|surgeon|dentist|clinic|practice|care) in", "top (?:doctor|surgeon|dentist) in", "#1 (?:doctor|clinic|practice)", "most experienced (?:doctor|surgeon)"]),
    why: "Comparative claims about physicians must be verifiable; many state boards treat unverifiable superlatives as misleading.",
    basis: "State medical board advertising rules; FTC Act §5",
    fix: "Use facts: years in practice, board certification, number of procedures performed (if you track it).",
  },

  // ── Social work ──────────────────────────────────────────────────────────
  {
    id: "sw-identifiers",
    verticals: ["social-work"],
    severity: "high",
    pattern: w(["(?:client|family|child|youth)'?s? (?:full )?name is", "case (?:number|no\\.?) ?#?\\d+", "lives at \\d+", "(?:her|his|their) address is"]),
    why: "Client-identifying details in drafts, reports shared beyond need, or outreach break confidentiality.",
    basis: "NASW Code of Ethics 1.07 (privacy and confidentiality); HIPAA and 42 CFR Part 2 where applicable",
    fix: "Use initials or \"the client\" in drafts, and keep identifiers in your agency's secure record system.",
  },
  {
    id: "sw-judgemental",
    verticals: ["social-work"],
    severity: "medium",
    pattern: w(["non[- ]?compliant", "manipulative", "attention[- ]seeking", "refused to cooperate", "in denial", "drug addict", "addict", "alcoholic", "junkie", "the mentally ill", "suffers from", "victim of (?:her|his|their) own"]),
    why: "Labelling or stigmatising language can bias readers of a record or report and undermine the client's dignity.",
    basis: "NASW Code of Ethics 1.01 and 1.12 (dignity; derogatory language); person-first documentation practice",
    fix: "Describe behaviour and context factually: \"did not attend three scheduled visits\", \"person with a substance use disorder\".",
  },
  {
    id: "sw-promise",
    verticals: ["social-work"],
    severity: "medium",
    pattern: w(["I promise (?:you|that)", "(?:will|guarantee to) keep (?:this|everything) (?:secret|confidential) no matter", "you will (?:definitely|certainly) get", "guaranteed (?:housing|placement|approval|benefits)"]),
    why: "Promising outcomes or absolute confidentiality is not something a social worker can guarantee (mandated reporting, eligibility decisions made by others).",
    basis: "NASW Code of Ethics 1.07(e) (limits of confidentiality) and 1.03 (informed consent)",
    fix: "Be clear about limits: \"What you tell me is private, except when someone's safety is at risk.\" \"I'll help you apply; the agency makes the decision.\"",
  },

  // ── Law firms ────────────────────────────────────────────────────────────
  {
    id: "lg-guarantee",
    verticals: ["legal"],
    severity: "high",
    pattern: w(["(?:we|I) (?:will|guarantee to) win", "guaranteed (?:win|results|outcome|settlement|verdict)", "you will (?:win|get compensation)", "no[- ]risk (?:case|lawsuit)", "100% success"]),
    why: "Lawyers may not promise or imply results they cannot guarantee.",
    basis: "ABA Model Rule 7.1 (false or misleading communications) and comment [3]; state bar advertising rules",
    fix: "Describe the process and experience instead, and include your state's past-results disclaimer where required.",
  },
  {
    id: "lg-specialist",
    verticals: ["legal"],
    severity: "medium",
    pattern: w(["specialist in", "specializ(?:e|es|ing) in", "certified specialist", "expert in (?:\\w+ )?law", "leading (?:attorney|lawyer|firm)", "best (?:attorney|lawyer|law firm)", "top[- ]rated (?:attorney|lawyer)"]),
    why: "\"Specialist\" and similar terms are restricted to lawyers certified by an approved body in many states, and superlatives must be verifiable.",
    basis: "ABA Model Rule 7.2(c) (certified specialist) and Rule 7.1; state bar rules",
    fix: "Say \"focuses on\" or \"practises in\", and use \"certified specialist\" only with the certifying organisation named.",
  },
  {
    id: "lg-past-results",
    verticals: ["legal"],
    severity: "medium",
    pattern: /\b(?:won|recovered|secured|obtained)\s+(?:over\s+|more than\s+)?\$\s?\d[\d,.]*\s*(?:k|m|million|billion|thousand)?/gi,
    why: "Past results can create unjustified expectations; many states require a disclaimer next to them.",
    basis: "ABA Model Rule 7.1 comment [3]; state bar rules (e.g. \"prior results do not guarantee a similar outcome\")",
    fix: "Add your state's required disclaimer next to the figure, or describe the case without the amount.",
  },
  {
    id: "lg-solicitation",
    verticals: ["legal"],
    severity: "medium",
    pattern: w(["(?:we|I) saw (?:that )?you (?:were|had) (?:in|an) (?:accident|crash)", "following your (?:accident|arrest|injury)", "call us now before", "act now or lose"]),
    why: "Targeted outreach to people known to need legal help is restricted, and some states require waiting periods or labels.",
    basis: "ABA Model Rule 7.3 (solicitation of clients); state rules on targeted mail (e.g. \"Advertising Material\" labels)",
    fix: "Check your state's solicitation rules before sending, and keep outreach general rather than referencing the person's event.",
  },

  // ── Insurance agencies ───────────────────────────────────────────────────
  {
    id: "in-guarantee",
    verticals: ["insurance"],
    severity: "high",
    pattern: w(["guaranteed (?:approval|acceptance|lowest (?:rate|price|premium)|savings)", "lowest rates? guaranteed", "everything is covered", "covers everything", "fully covered", "no exclusions", "you(?:'re| are) always covered"]),
    why: "Overstating coverage or guaranteeing price or approval misrepresents the policy.",
    basis: "State unfair trade practices acts (NAIC Model Unfair Trade Practices Act §4: misrepresentation and false advertising)",
    fix: "Describe what the policy can cover, and point to the policy terms: \"coverage depends on your policy; exclusions apply.\"",
  },
  {
    id: "in-free",
    verticals: ["insurance"],
    severity: "medium",
    pattern: w(["free (?:insurance|coverage|policy|gift card|gift) (?:for|when|if)", "sign up and (?:get|receive) (?:a )?\\$\\d+", "cash back (?:for|when) (?:you )?(?:buy|sign)"]),
    why: "Giving value to induce a purchase can be illegal rebating or an inducement under state insurance law.",
    basis: "State anti-rebating and inducement statutes (NAIC Model Act §4.H); state insurance department rules",
    fix: "Check your state's rebating rules before offering anything of value; describe the policy's benefits instead.",
  },
  {
    id: "in-savings",
    verticals: ["insurance"],
    severity: "low",
    pattern: /\bsave (?:up to |an average of )?\$?\d[\d,]*%?/gi,
    why: "Savings figures need a documented basis and usually a disclosure of how they were calculated.",
    basis: "State insurance advertising regulations; FTC Act §5",
    fix: "Keep a record of how the figure was calculated and add the basis, or say \"you may be able to save.\"",
  },

  // ── Home services and trades ─────────────────────────────────────────────
  {
    id: "hs-licensed",
    verticals: ["home-services"],
    severity: "medium",
    pattern: w(["licensed,? (?:bonded,? )?(?:and )?insured", "fully licensed", "licensed and insured", "certified (?:technicians?|installers?)"]),
    why: "Only accurate if every licence and policy is current for the work and area advertised; many states also require the licence number in ads.",
    basis: "State contractor licensing laws (e.g. California B&P Code 7030.5 licence number in ads); FTC Act §5",
    fix: "Keep it only if true today, and add your licence number where your state requires it.",
  },
  {
    id: "hs-lowest",
    verticals: ["home-services", "ecommerce"],
    severity: "medium",
    pattern: w(["lowest prices? (?:in town|guaranteed|anywhere)", "we(?:'ll| will) beat any (?:price|quote)", "cheapest in", "price match guarantee"]),
    why: "Price guarantees must be honoured exactly as stated, with any conditions clearly disclosed.",
    basis: "FTC Guides Against Deceptive Pricing (16 CFR 233); state consumer protection law",
    fix: "State the conditions right next to the promise, or describe your pricing honestly: \"upfront, written quotes.\"",
  },
  {
    id: "hs-warranty",
    verticals: ["home-services"],
    severity: "low",
    pattern: w(["lifetime (?:warranty|guarantee)", "(?:full|complete) warranty", "guaranteed for life", "100% satisfaction guaranteed"]),
    why: "Warranty claims must match the written warranty, including what \"lifetime\" means and what is excluded.",
    basis: "Magnuson-Moss Warranty Act; FTC Guides for the Advertising of Warranties (16 CFR 239)",
    fix: "Say what the warranty covers and for how long, and make the written terms available.",
  },

  // ── E-commerce and retail ────────────────────────────────────────────────
  {
    id: "ec-made-in-usa",
    verticals: ["ecommerce"],
    severity: "high",
    pattern: w(["made in (?:the )?(?:usa|u\\.s\\.a\\.|u\\.s\\.|america)", "american[- ]made", "proudly made in"]),
    why: "An unqualified Made in USA claim requires that all or virtually all of the product is made in the US.",
    basis: "FTC Made in USA Labeling Rule (16 CFR 323)",
    fix: "Use it only if it is all or virtually all US-made; otherwise qualify it: \"Assembled in the USA from imported parts.\"",
  },
  {
    id: "ec-was-price",
    verticals: ["ecommerce"],
    severity: "medium",
    pattern: w(["was \\$\\d+", "compare at \\$\\d+", "regular(?:ly)? \\$\\d+", "\\d+% off (?:the )?(?:regular|original) price", "retail value \\$\\d+"]),
    why: "A reference price must be one you actually charged, for a reasonable period, recently.",
    basis: "FTC Guides Against Deceptive Pricing (16 CFR 233.1); state reference-pricing laws",
    fix: "Only show a former price you genuinely charged; keep the dates and records.",
  },
  {
    id: "ec-eco",
    verticals: ["ecommerce"],
    severity: "medium",
    pattern: w(["eco[- ]friendly", "environmentally friendly", "sustainable", "green product", "carbon neutral", "biodegradable", "non[- ]toxic", "all[- ]natural", "chemical[- ]free"]),
    why: "Broad environmental and \"natural\" claims need specific, substantiated support.",
    basis: "FTC Green Guides (16 CFR 260); FTC Act §5",
    fix: "Be specific and provable: \"packaging is 80% recycled cardboard\", not \"eco-friendly\".",
  },

  // ── HR and recruiting ────────────────────────────────────────────────────
  {
    id: "hr-age",
    verticals: ["hr"],
    severity: "high",
    pattern: w(["young (?:and )?(?:energetic|dynamic|team|person|professional)", "recent (?:college )?grad(?:uate)?s? only", "digital natives?", "(?:up to|no more than|maximum of) \\d+ years(?:' | of )experience", "under \\d{2}", "over \\d{2} need not apply", "overqualified", "junior(?:ish)? (?:and )?young"]),
    why: "Wording that signals a preference for younger workers can be evidence of age discrimination.",
    basis: "Age Discrimination in Employment Act (29 U.S.C. 623(e)); EEOC guidance on job advertisements",
    fix: "Describe the skills and duties: \"comfortable learning new software\", \"entry-level role\".",
  },
  {
    id: "hr-protected",
    verticals: ["hr"],
    severity: "high",
    pattern: w(["(?:salesman|salesmen|waitress|foreman|chairman|handyman)", "native (?:english )?speakers?", "must be a (?:us|u\\.s\\.) citizen", "(?:male|female|men|women) (?:only|preferred|candidates)", "no (?:pregnant|mothers|kids)", "able[- ]bodied", "must be (?:christian|single|married)", "clean[- ]cut"]),
    why: "Language that suggests a preference based on sex, national origin, citizenship, disability, religion or family status can be discriminatory.",
    basis: "Title VII (42 U.S.C. 2000e-3(b)); ADA; IRCA citizenship discrimination (8 U.S.C. 1324b); EEOC guidance",
    fix: "Use neutral job titles, state the language level the job actually needs (\"fluent written English\"), and list duties, not traits.",
  },
  {
    id: "hr-salary",
    verticals: ["hr"],
    severity: "low",
    pattern: w(["competitive (?:salary|pay|compensation)", "salary (?:is )?negotiable", "pay depends on experience", "doe"]),
    why: "A growing number of states and cities require a good-faith pay range in job postings.",
    basis: "Pay transparency laws (e.g. Colorado, California, Washington, New York, Illinois)",
    fix: "Add the pay range for the role, and benefits, where the law requires it (and it attracts more applicants).",
  },
];

export const VERTICAL_LABELS: Record<Vertical, string> = {
  realtor: "Real estate",
  finance: "Financial services",
  nonprofit: "Nonprofit",
  agency: "Marketing agency",
  restaurant: "Restaurant",
  "social-work": "Social work",
  medical: "Medical practice",
  legal: "Law firm",
  insurance: "Insurance agency",
  "home-services": "Home services and trades",
  ecommerce: "E-commerce and retail",
  hr: "HR and recruiting",
  general: "General business",
};

export function rulesFor(vertical: Vertical): GuardRule[] {
  return RULES.filter((r) => r.verticals === "all" || r.verticals.includes(vertical));
}
