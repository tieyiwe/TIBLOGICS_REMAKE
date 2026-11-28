// Researched articles for late October 2026 (news of October 14 to 23). Same
// rules as curated.ts: every factual claim checked against at least two
// outlets or the organisation's own statement; single-source claims are
// attributed; where outlets disagree, the article says so. Every article
// carries an ARFA Academy ad (the owner's standing request).

import type { CuratedArticle } from "./curated";
import { arfaAd } from "./arfa-ad";

const ARTICLES: CuratedArticle[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "php2shell-ai-found-php-flaws-patch-now",
    title: "AI Found a Hole in the Code Behind Most Websites, and Attackers Moved First. Patch PHP Today.",
    excerpt:
      "Two critical PHP flaws, found with AI and nicknamed PHP2Shell, let attackers take over WordPress, Drupal and Joomla sites. Probing started before the fix. Here is what to do now.",
    category: "breaking",
    featured: true,
    coverImage: "/covers/php2shell.png",
    newsDate: "2026-10-21",
    tags: ["php", "php2shell", "cybersecurity", "wordpress", "drupal", "joomla", "ai security", "vulnerability"],
    content: `<p>If your website, online shop or customer portal runs on PHP, this is the week to act. On October 21, the PHP project released emergency fixes for two critical flaws in the PHP engine itself, nicknamed PHP2Shell. The flaws let an attacker run their own code on an unpatched server without logging in, and they were found with the help of artificial intelligence. Security firms say attackers started probing for them before the fix was even published.</p>

<p>PHP is the language behind WordPress, Drupal, Joomla and a large share of the web: by W3Techs' long-running count, roughly three quarters of websites whose server language is known. That is why this one matters to almost every business with a website, not just to developers.</p>

<h2>What happened</h2>
<ul>
<li><strong>The flaws:</strong> two vulnerabilities, CVE-2026-109618 and CVE-2026-109619, each rated 9.2 out of 10 for severity. They sit in PHP's core, so even a site with very simple code can be exposed. The PHP security advisory calls updating "the only safe choice".</li>
<li><strong>Who is at risk:</strong> by the researchers' account, every PHP version released in the past decade is affected by at least one of the two flaws. The highest risk is for servers running Apache with mod_php, where a request can trigger the flaw before any of the site's own code runs.</li>
<li><strong>What an attacker can do:</strong> the cloud security firm Wiz says it demonstrated a full takeover, without a password, of the latest standard installations of WordPress, Drupal and Joomla, and that attackers could also read passwords, tokens and API keys from the server's memory.</li>
<li><strong>The fix:</strong> PHP 8.5.12, 8.4.27, 8.3.36 and 8.2.35. PHP 8.1 and older no longer get official releases; the PHP security team published minimal source fixes for 7.4, 8.0 and 8.1, which only a technical team can apply.</li>
</ul>

<h2>Found by AI, raced by attackers</h2>
<p>The story behind PHP2Shell is a preview of how security works now. According to Wiz and the security firm Calif, the first exploitable bug was identified in early August with the help of an OpenAI model, and Wiz independently found more using its own tooling together with models from Google and OpenAI. The bugs were reported privately so a fix could be prepared.</p>
<p>That is the good news: AI is finding serious problems that humans missed for years. The bad news is that attackers have the same tools. Amazon reported the first exploitation attempts on October 17, four days before the patches shipped, and the security firm watchTowr says it has seen exploitation attempts against its honeypot servers since October 21. Other firms describe the activity so far as mostly probing, and as of October 23 the US cybersecurity agency CISA had urged immediate patching but had not yet added the flaws to its list of known exploited vulnerabilities. Estimates of exposed servers vary widely, from about 1.3 million directly reachable systems in one researcher's count to roughly 5 million IP addresses running PHP in Recorded Future's.</p>
<p>The lesson is simple: the time between "a flaw is found" and "someone attacks it" is shrinking towards zero. Patching within days is no longer good practice; it is the minimum.</p>

<h2>What to do today, in plain steps</h2>
<ol>
<li><strong>Find out your PHP version.</strong> Your hosting control panel (cPanel, Plesk and similar) usually shows it, or your developer can tell you in a minute. If you use a fully managed service, ask your provider in writing whether they have applied the October 21 PHP updates.</li>
<li><strong>Update to a fixed version.</strong> 8.5.12, 8.4.27, 8.3.36 or 8.2.35, or newer. Then restart PHP (PHP-FPM or Apache) so the new version is actually running.</li>
<li><strong>If you are on PHP 8.1 or older, plan the upgrade now.</strong> Those versions no longer receive official releases. Until you upgrade, ask your host or developer to apply the published source fixes or put protective firewall rules in front of the site.</li>
<li><strong>Change your secrets.</strong> Because the flaws can expose memory, rotate database passwords, API keys and payment or email credentials stored on the server, especially if you patched late.</li>
<li><strong>Look for signs of a break-in.</strong> New administrator accounts, unfamiliar files in upload folders, changed pages or unexpected redirects. If in doubt, restore from a clean backup taken before October 17 and then patch.</li>
<li><strong>Keep WordPress, its plugins and themes updated too.</strong> PHP2Shell is in PHP itself, but attackers who get in rarely leave through the same door.</li>
</ol>

<h2>Why it matters for African businesses in particular</h2>
<p>Many small and medium businesses across the continent run on shared hosting and older PHP versions, often set up once and never touched again. Those are exactly the sites that stay exposed longest. If you do not know who maintains your website, this is the week to find out, and to agree with them how quickly security updates will be applied from now on.</p>

${arfaAd({
  hook: "AI now finds security holes faster than people. Learn how these systems really work.",
  body: "ARFA's AI Systems Expert track covers how modern AI systems are built, deployed and secured, so you can make good decisions about the AI tools your business relies on, and the risks that come with them.",
  track: { slug: "ai-systems-expert", label: "AI Systems Expert" },
})}`,
    sources: [
      { label: "Wiz: PHP2Shell, AI uncovers critical RCE vulnerabilities affecting 70% of the internet", url: "https://www.wiz.io/blog/php2shell-php-rce" },
      { label: "W3Techs: usage statistics of PHP for websites", url: "https://w3techs.com/technologies/details/pl-php" },
      { label: "The Hacker News: PHP issues emergency patches for two critical PHP2Shell RCE flaws", url: "https://thehackernews.com/2026/10/php-issues-emergency-patches-for-two.html" },
      { label: "SecurityWeek: PHP2Shell patches land as first exploitation attempts hit sensors", url: "https://www.securityweek.com/php2shell-patches-land-as-first-exploitation-attempts-hit-sensors/" },
      { label: "Fortune: AI helped discover the PHP vulnerability, now the race is on to patch it", url: "https://fortune.com/2026/10/21/ai-tools-discovered-the-php-vulnerability-that-could-take-down-70-of-the-internet-now-the-race-is-on-to-patch-it-before-ai-powered-hackers-attack/" },
      { label: "The Next Web: PHP rushes out emergency patches for two critical bugs AI found first", url: "https://thenextweb.com/news/php2shell-php-rce-ai-openai-wiz" },
      { label: "Recorded Future: PHP2Shell exploitation, two critical PHP flaws explained", url: "https://www.recordedfuture.com/blog/php2shell-vulnerability-exploitation" },
      { label: "Tenable: PHP2Shell frequently asked questions", url: "https://www.tenable.com/blog/php2shell-cve-2026-109618-cve-2026-109619-frequently-asked-questions-about-critical-php-remote" },
      { label: "watchTowr: PHP2Shell FAQ and observed exploitation", url: "https://watchtowr.com/intelligence/php-cve-2026-109618-faq/" },
      { label: "Forrester: PHP2Shell sends security teams scrambling", url: "https://www.forrester.com/blogs/php2shell-leak-sends-security-teams-scrambling/" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "tesla-q3-2026-optimus-late-robotaxi-on-time",
    title: "Tesla's Robots Are Running Late. Its Robotaxis Are Not. 5 Takeaways From Q3",
    excerpt:
      "Tesla beat expectations but earned far less, pushed Optimus deliveries to the end of 2027, and said Cybercabs could reach customers by year end. What the numbers really say.",
    category: "advanced-tech",
    coverImage: "/covers/tesla-q3.png",
    newsDate: "2026-10-21",
    tags: ["tesla", "optimus", "cybercab", "robotaxi", "earnings", "elon musk", "humanoid robots", "autonomy"],
    content: `<p>A week after Tesla showed a Roadster that flies over a Cybertruck, it reported its third-quarter results, and the message was more down to earth. Tesla sold more cars than expected and its margins improved, but its profit fell sharply as it spends heavily on artificial intelligence and robots. And the humanoid robot, Optimus, is now officially a story for the end of 2027.</p>

<h2>1. More cars sold than expected</h2>
<p>Tesla delivered 486,532 vehicles in the quarter, about 1.3% more than in the second quarter and above the roughly 462,000 analysts expected. Revenue was about $28.05 billion. Adjusted earnings came to $0.48 a share, ahead of forecasts, although outlets cite different consensus figures (43 or 45 cents), so the size of the beat depends on who you ask.</p>

<h2>2. But profit is down hard</h2>
<p>Operating income fell 56% from a year earlier, to about $718 million, an operating margin of just 2.6%. Gross margin actually improved, to 19.6%, so the drop comes from spending: operating expenses rose 39%, driven by AI and robotics research and stock-based pay. The energy business remains the bright spot, with 13.7 gigawatt-hours of storage deployed at a 33.1% gross margin.</p>

<h2>3. Optimus: late 2027</h2>
<p>Elon Musk said he expects the remaining problems with Optimus, in its AI, its mechanical design and its reliability, to be solved around the end of next year, with deliveries to outside customers starting around then. He warned that the early production ramp will be "shallow slope and is somewhat bumpy". Production lines exist, but a robot you can buy is at least a year away.</p>

<h2>4. Robotaxis: on the move now</h2>
<p>Autonomy is moving faster. Tesla says unsupervised driving miles grew roughly eightfold during the quarter, and that its Cybercab fleet in Austin has grown about ten times since it launched around a month ago. Robotaxi service is due to expand to Dallas next month. Musk said most Cybercabs will be owned by Tesla and offered as a transport service, and that Tesla is trying to get the first ones to customers by the end of 2026. Management was clear that autonomy only becomes a material source of revenue in 2027.</p>

<h2>5. Investors liked the cars, doubted the timeline</h2>
<p>According to one market report, the stock closed up about 3.4% before the results and slipped roughly 2% in after-hours trading. Analysts at JPMorgan noted that Tesla now guides to about $20 billion of capital spending for 2026, down from more than $25 billion, and William Blair's analyst said the pace and economics of robotaxis and Optimus will decide Tesla's value, not this quarter's car sales.</p>

<h2>What it means</h2>
<p>Read with our coverage of the <a href="/ai-times/tesla-roadster-flies-0-60-0-81-seconds-spacex-thrusters">flying Roadster</a> and <a href="/ai-times/spacex-tesla-science-fiction-becomes-reality-18-days">18 days that made science fiction real</a>, the picture is consistent: the science fiction is real, but it arrives in stages. Driverless taxis are carrying people in Austin now, with Dallas next. Robots in homes and factories are a 2027 story. For businesses, the practical takeaway is to watch autonomy and logistics first, and to treat humanoid robots as a plan for later, not a purchase for next year.</p>

${arfaAd({
  hook: "Robotaxis today, robots tomorrow. Be the person at work who understands what is real.",
  body: "ARFA's AI Practitioner track takes you from using AI tools to applying them properly at work: evaluating what a system can really do, building it into processes, and measuring the results.",
  track: { slug: "ai-practitioner", label: "AI Practitioner" },
})}`,
    sources: [
      { label: "Electrek: Tesla releases Q3 2026 financial results", url: "https://electrek.co/2026/10/21/tesla-tsla-q3-2026-financial-results/" },
      { label: "CNBC: Tesla Q3 2026 earnings, what analysts are saying", url: "https://www.cnbc.com/2026/10/22/tesla-q3-2026-earnings-analysts.html" },
      { label: "Investing.com: Tesla Q3 2026 slides, margins improve as capex rises for AI push", url: "https://www.investing.com/news/company-news/tesla-q3-2026-slides-margins-improve-as-capex-doubles-for-ai-push-93CH-4964383" },
      { label: "Yahoo Finance: Tesla Q3 2026 earnings call highlights", url: "https://finance.yahoo.com/markets/stocks/articles/tesla-inc-tsla-q3-2026-110148986.html" },
      { label: "The Motley Fool: Tesla Q3 2026 earnings call transcript", url: "https://www.fool.com/earnings/call-transcripts/2026/10/22/tesla-tsla-q3-2026-earnings-call-transcript/" },
      { label: "Investing.com: earnings call transcript, Tesla beats Q3 estimates as stock slips after hours", url: "https://www.investing.com/news/transcripts/earnings-call-transcript-tesla-beats-q3-2026-estimates-as-stock-slips-after-hours-93CH-4964365" },
      { label: "Tesla: Form 10-Q for the quarter ended September 30, 2026", url: "https://www.sec.gov/Archives/edgar/data/0001318605/000162828026066775/tsla-20260930.htm" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "africa-ai-week-world-bank-gpus-kenya-ai-bill-nigeria-elections",
    title: "Rent the GPUs, Pause the Law, Guard the Vote: Africa's Biggest AI Week of 2026",
    excerpt:
      "The World Bank wants African governments to rent AI computing, Kenya's Senate committee rejected the AI Bill, Nigeria is preparing for deepfakes in 2027, and a new model speaks 12 African languages.",
    category: "ai-business",
    featured: true,
    coverImage: "/covers/africa-ai-week.png",
    newsDate: "2026-10-20",
    tags: ["africa", "world bank", "kenya", "nigeria", "afdb", "ai policy", "african languages", "elections"],
    content: `<p>Some weeks, the story of AI in Africa is a single announcement. This was not one of them. In seven days, the World Bank set out how it wants African countries to get AI computing power, Kenya's Senate committee sent the country's AI Bill back to the drawing board, Nigeria's electoral body announced an AI unit for the 2027 elections, and a South African startup released a language model built for African languages. Here is what happened, and what it means for businesses and builders.</p>

<h2>1. The World Bank: rent the GPUs, think "small AI"</h2>
<p>On October 20, the World Bank Group launched its first digital strategy, built around four priorities: internet connectivity, cheaper devices and data, digital services and skills, and readiness for AI. It frames the whole effort around jobs, warning of a shortfall of about 780 million jobs in developing countries over the next 10 to 15 years.</p>
<p>Two ideas stand out. The first is "small AI": tools built for one task and local conditions, such as helping farmers diagnose crop diseases, supporting health workers, or helping a small business manage its stock. The second is the AI Infrastructure and Readiness Initiative, which would give governments pay-as-you-go access to shared GPU computing instead of building their own data centres, starting with Africa and Latin America, with Cassava Technologies and NVIDIA as knowledge partners. One report cites the bank's figures that sub-Saharan Africa has 18% of the world's population but only 0.6% of global data-centre capacity. As one analysis noted, though, the initiative does not yet name countries, a budget or a start date.</p>

<h2>2. $10 billion for AI, now in motion</h2>
<p>The African Development Bank and UNDP said their AI 10 Billion Initiative, launched at the Nairobi AI Forum in February, is moving from announcement to delivery. The plan is about $1 billion of financing a year for a decade, starting in five countries and reaching twenty by the end of 2027, with a stated ambition of contributing to 25 million jobs by 2035.</p>

<h2>3. Kenya hits pause on its AI law</h2>
<p>Kenya's Senate committee on information and communication technology rejected the Artificial Intelligence Bill, 2026, according to reporting by Techweez. The bill would have created an AI Commissioner able to register and audit AI systems, with penalties reported at up to Ksh 5 million in fines and two years in prison. The committee found the penalties too harsh and the rules too heavy for a young sector, echoing tech and digital-rights groups that called parts of it vague and punitive. A committee rejection is not the final word, but for now Kenya's AI start-ups will not face a new licensing regime.</p>

<h2>4. Nigeria prepares for deepfake elections</h2>
<p>At an AI and Democracy Forum in Abuja from October 14 to 16, organised with the civic group Yiaga Africa, Nigeria's electoral commission, INEC, announced it will set up an AI unit inside its ICT department to assess new technologies and manage their risks. The forum warned that deepfakes, cloned voices and coordinated disinformation could undermine the 2027 general elections, and asked INEC to publish an election-specific AI governance framework and to stress-test its results systems before the vote. INEC's chairman, Joash Amupitan, stressed that human accountability and judicial review must stay at the centre of the process.</p>

<h2>5. A model that speaks 12 African languages</h2>
<p>South Africa's Vambo AI released MORENA, an open-weight model of 1.5 billion parameters that it says was trained from scratch for 12 African languages, including Kiswahili, Hausa, Yorùbá, Igbo, isiZulu, isiXhosa and Nigerian Pidgin, plus English and French. Its performance claims have not been independently verified, but because the weights are public, researchers can now test them. Small, local, openly available: it is close to the "small AI" the World Bank is describing.</p>

<h2>What it means for you</h2>
<p>The direction across all five stories is the same: Africa's AI future is being built around practical, local tools and shared infrastructure, with regulators trying not to strangle it early. For businesses, that means more affordable AI that understands local languages and local problems, and a growing need for staff who can use it well. The next milestone is close: AI Expo Africa returns to Johannesburg on October 28 and 29.</p>

${arfaAd({
  hook: "Small AI needs people who know how to use it. Start with the foundations.",
  body: "ARFA's AI Foundations for Everyone track teaches you what AI can and cannot do, how to use it safely at work, and how to get real results, in clear language and at your own pace, from anywhere in Africa.",
  track: { slug: "ai-foundations", label: "AI Foundations for Everyone" },
})}`,
    sources: [
      { label: "World Bank: World Bank Group launches first digital strategy to expand access and create jobs", url: "https://www.worldbank.org/en/news/press-release/2026/10/20/world-bank-group-launches-first-digital-strategy-to-expand-access-and-create-jobs" },
      { label: "tech-ish: World Bank plans shared AI computing for Africa", url: "https://tech-ish.com/2026/10/23/world-bank-plans-shared-ai-computing-for-africa/" },
      { label: "Developing Telecoms: World Bank Group launches digital strategy for developing nations", url: "https://developingtelecoms.com/telecom-business/telecom-investment-mergers/21000-world-bank-group-launches-digital-strategy-for-developing-nations.html" },
      { label: "UNDP: AfDB and UNDP advance the AI 10 Billion Initiative", url: "https://www.undp.org/africa/press-releases/african-development-bank-and-undp-advance-ai-10-billion-initiative-turn-africas-ai-potential-productivity" },
      { label: "TechAfrica News: AfDB and UNDP advance $10 billion AI initiative to create 25 million jobs", url: "https://techafricanews.com/2026/10/16/african-development-bank-and-undp-advance-10-billion-ai-initiative-to-create-25-million-jobs/" },
      { label: "Techweez: Senate committee rejects AI bill, sending it back to the drawing board", url: "https://techweez.com/2026/10/16/senate-committee-rejects-ai-bill-sending-it-back-to-the-drawing-board/" },
      { label: "Citizen Digital: Senate bill seeks AI Commissioner office with Ksh 5M fine", url: "https://citizen.digital/article/senate-bill-seeks-establishment-of-ai-commissioner-office-with-ksh5m-fine-for-offenders-n379178" },
      { label: "Voice of Nigeria: INEC unveils AI safeguards ahead of 2027 elections", url: "https://von.gov.ng/inec-unveils-ai-safeguards-ahead-of-2027-elections/" },
      { label: "BusinessDay: Yiaga Africa, INEC move to shield 2027 polls from AI threats", url: "https://businessday.ng/life/article/yiaga-africa-inec-move-to-shield-2027-polls-from-ai-threats/" },
      { label: "allAfrica: South Africa's Vambo AI launches model for African languages", url: "https://allafrica.com/stories/202610090077.html" },
      { label: "iAfrica: Vambo AI releases MORENA, a 1.5B open-weight model for 12 African languages", url: "https://iafrica.com/vambo-ai-releases-morena-a-1-5b-open-weight-model-trained-from-scratch-for-12-african-languages/" },
      { label: "Lifestyle & Tech: AI Expo Africa returns to Johannesburg for its 9th edition", url: "https://lifestyleandtech.co.za/ai-cloud/article/2026-10-20/ai-expo-africa-returns-to-johannesburg-for-9th-edition-focused-on-responsible-ai" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "anthropic-draft-ai-safety-bill-explained",
    title: "Anthropic Wrote a Law to Stop Dangerous AI. Critics Say It Mostly Stops the Government",
    excerpt:
      "A leaked Anthropic draft bill would let a judge halt an AI model only if more than 50 lives or $1 billion were at risk. What it says, why critics object, and what Anthropic says it will change.",
    category: "industry",
    coverImage: "/covers/anthropic-bill.png",
    newsDate: "2026-10-20",
    tags: ["anthropic", "ai regulation", "ai safety", "congress", "ai policy", "frontier ai", "preemption"],
    content: `<p>Who should be allowed to switch off a dangerous AI model, and when? A draft US federal bill circulated by Anthropic, the company behind the Claude models, offers its answer, and it has started a fierce argument. Politico first reported the draft around October 16; TechCrunch and others followed. The text has not been filed in Congress, and Anthropic has already said part of it will be rewritten. Here is what it says, and why it matters even outside the United States.</p>

<h2>What the draft would do</h2>
<ul>
<li><strong>A very high bar for stopping a model.</strong> A model's release or use could be blocked only for a foreseeable and imminent risk of more than 50 deaths or serious injuries, or more than $1 billion in damage, coming from a biological weapon, a model escaping its developer's control, or a cyberattack.</li>
<li><strong>Outside evaluators, a regulator and a judge.</strong> Independent evaluators registered with the US Commerce Department would assess the most powerful models; one report says every 180 days. An evaluator that finds a qualifying risk would have to alert Commerce within 72 hours. Commerce would then have to go to a federal judge in Washington, D.C. to halt the model. According to one detailed account of the 37-page draft, that suspension would last an initial 45 days.</li>
<li><strong>One door only.</strong> Under the draft, no other federal agency could halt a model's development or use on its own.</li>
<li><strong>Limits on the states.</strong> The draft would preempt some state AI laws on public disclosure, third-party evaluation and incident reporting, while leaving child-safety and civil-rights laws alone.</li>
</ul>
<p>An Anthropic spokesperson said the bill reflects the company's Advanced AI Framework, which it has promoted with lawmakers since June, and its head of federal affairs, Anthony Cimino, said the thresholds were taken from California's AI safety law, SB 53.</p>

<h2>Why critics object</h2>
<p>The criticism has come mostly from the AI safety community, not from Anthropic's usual opponents. Nathan Calvin of the advocacy group Encode argued that the preemption clause appears to stop states from suspending dangerous models while setting an "absurdly high bar" for federal action. Charlie Bullock of the Institute for Law and AI warned that letting evaluators effectively certify themselves could start a race to the bottom, with auditors competing to offer the least demanding reviews at the lowest price; a rival proposal, the FRONTIER Act, requires licensed third-party evaluators. Other coverage noted the draft does not explain how evaluators would be protected from being influenced by the companies paying them.</p>

<h2>What Anthropic says it will change</h2>
<p>Cimino acknowledged that the preemption wording was "not precise enough" and said it would be rewritten, adding that Anthropic wants states to keep an important role in areas such as standards for independent evaluators and a lab's capacity to shut down a model.</p>

<h2>Why it matters beyond Washington</h2>
<p>Rules written for the most powerful AI companies tend to travel. Many African governments are drafting their own AI laws right now, as Kenya's debate this month showed. The questions in this draft are the right ones to ask anywhere: who decides a model is too dangerous, who checks the checkers, and how fast someone can act when something goes wrong. Whatever you think of Anthropic's answers, the fact that an AI company is writing the first draft of its own rules is itself the story to watch.</p>

${arfaAd({
  hook: "AI rules are being written now. Understand them before they shape your business.",
  body: "ARFA's AI Governance, Risk and Compliance track explains how AI laws and policies work, how to assess AI risks in your organisation, and how to set sensible internal rules, with real cases and frameworks.",
  track: { slug: "ai-governance", label: "AI Governance, Risk and Compliance" },
})}`,
    sources: [
      { label: "TechCrunch: Anthropic pitches AI safety bill that may block a model if 50+ people could be killed", url: "https://techcrunch.com/2026/10/20/anthropic-pitches-ai-safety-bill-that-may-block-a-model-if-50-people-could-be-killed/" },
      { label: "The Next Web: Anthropic to rewrite part of its leaked AI bill after safety backlash", url: "https://thenextweb.com/news/anthropic-leaked-ai-safety-bill-backlash-frontier" },
      { label: "PPC Land: Draft bill tied to Anthropic would let courts halt AI models for 45 days", url: "https://ppc.land/draft-bill-tied-to-anthropic-would-let-courts-halt-ai-models-for-45-days/" },
      { label: "Transformer: Anthropic's weak AI bill undermines its safety-first approach", url: "https://www.transformernews.ai/p/anthropic-leaked-ai-bill-undermines-safety-first-approach" },
      { label: "Daily Caller: Anthropic floats bill that would let feds step in only when more than 50 lives are on the line", url: "https://dailycaller.com/2026/10/19/anthropic-artificial-intelligence-governance-incident-safety-bill-aegis-act-anthony-cimino/" },
      { label: "Gadget Review: Anthropic's proposed AI safety bill only kicks in at 50 deaths or $1 billion", url: "https://www.gadgetreview.com/anthropics-proposed-ai-safety-bill-only-kicks-in-at-50-deaths-or-1-billion-in-damages" },
    ],
  },
];

// Published one after another in this order, so the PHP2Shell alert and the
// Africa roundup are the newest (the two featured slots, lib/blog/featured.ts).
const PUBLISH_ORDER = [
  "anthropic-draft-ai-safety-bill-explained",
  "tesla-q3-2026-optimus-late-robotaxi-on-time",
  "africa-ai-week-world-bank-gpus-kenya-ai-bill-nigeria-elections",
  "php2shell-ai-found-php-flaws-patch-now",
];

export const CURATED_LATE_OCTOBER: CuratedArticle[] = PUBLISH_ORDER.map((slug) => ARTICLES.find((a) => a.slug === slug)!).filter(Boolean);
