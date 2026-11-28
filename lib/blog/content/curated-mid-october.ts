// Researched articles for mid-October 2026. Same rules as curated.ts: every
// factual claim checked against at least two outlets or the company's own
// statement; single-source claims are attributed; where outlets disagree, the
// article says so. Signed columns (author set, aiGenerated false) carry the
// author's own opinions, marked as such. Every article carries an ARFA
// Academy ad (the owner's standing request), labelled as ours.

import type { CuratedArticle } from "./curated";
import { arfaAd } from "./arfa-ad";

/** A clickable video card (styled by the article page: figure > a). */
const video = (href: string, label: string, caption: string) =>
  `<figure><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a><figcaption>${caption}</figcaption></figure>`;

/** An illustration from public/covers. */
const picture = (src: string, alt: string, caption: string) =>
  `<figure><img src="${src}" alt="${alt}" width="1600" height="900" loading="lazy" /><figcaption>${caption}</figcaption></figure>`;

const ARTICLES: CuratedArticle[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "tesla-roadster-flies-0-60-0-81-seconds-spacex-thrusters",
    title: "Tesla's New Roadster Hit 60 mph in 0.81 Seconds, Then Flew Over a Cybertruck",
    excerpt:
      "It clung to a ramp upside down, kickflipped off it and jumped a line of Teslas on SpaceX cold-gas thrusters. What Tesla showed, the physics behind it, and what is still unproven.",
    category: "advanced-tech",
    featured: true,
    coverImage: "/covers/roadster-flight.png",
    newsDate: "2026-10-15",
    tags: ["tesla", "roadster", "spacex", "elon musk", "cold gas thrusters", "electric vehicles", "flying car", "physics"],
    content: `<p>For nine years the new Tesla Roadster was the car that never came. On Thursday night, October 15, it finally showed up, and it did not just drive. At a SpaceX test site near Waco, Texas, the Roadster drove up a curved ramp, clung to it while completely upside down, fired a set of cold-gas thrusters developed with SpaceX, flipped through the air and landed on its wheels. "Well, it worked," Elon Musk said afterwards, deadpan.</p>

<p>Then it did something even stranger. Using the same thrusters, the car lifted itself over a line of Tesla vehicles while moving: a Cybercab, a Cybertruck, a Tesla Semi, a Model Y and a Model 3, according to TechCrunch. Tesla also ran it from 0 to 60 mph in 0.81 seconds during the event. "Turns out the future does have flying cars," Musk told the crowd.</p>

${video("https://www.youtube.com/watch?v=qt5p-_tE8d0", "Watch Tesla's full Roadster reveal on YouTube", "Tesla's official livestream of the October 15 event. The replay is also on <a href=\"https://x.com/Tesla\" target=\"_blank\" rel=\"noopener noreferrer\">Tesla's account on X</a>.")}

<h2>What Tesla actually showed</h2>
<p>Tesla presented three versions of the car. The figures below are Tesla's claims; none has been independently tested yet.</p>
<ul>
<li><strong>Roadster Performance:</strong> two seats, 0 to 60 mph in under 1.6 seconds. This is the road car.</li>
<li><strong>Roadster Thrust:</strong> two seats, adds rear-mounted cold-gas thrusters, 0 to 60 mph in under 0.9 seconds.</li>
<li><strong>Roadster Rocket:</strong> one seat, thrusters around the edge of the car for forward and upward push and for rotation, 0 to 60 mph in under 0.59 seconds. Tesla says it is invite-only and not approved for public road use.</li>
</ul>
<p>Tesla's engineering vice president, Lars Moravy, said the Rocket uses ten thrusters fed by about 600 litres of compressed air, which can be recharged. Coverage of the event lists a range of more than 300 miles and a top speed above 230 mph for all three versions. Musk said production starts in 2028.</p>
<p>Reservations opened the same night. Several outlets report a $5,000 deposit followed by a further $45,000 within ten days, $50,000 in total, to reserve the Performance version, and a $250,000 reservation for the Thrust. Tesla has not published a final price.</p>

<h2>The physics: why this is so hard</h2>
<p>At TIBLOGICS we believe Tesla and SpaceX have some of the best engineers in the world, and this demonstration is a good way to see why. Almost every part of it pushes against a law of physics that normally stops cars from doing these things. Here is a simple walk through the numbers. They are our own back-of-the-envelope estimates, not Tesla's, and Tesla has not published the car's weight, so we assume about two tonnes.</p>

<h3>1. Going faster than tyres allow</h3>
<p>Reaching 60 mph (about 27 metres per second) in 0.81 seconds means an average acceleration of about 33 metres per second squared, roughly 3.4 times the pull of gravity, or 3.4 g: more than three times your own weight pressing you into the seat.</p>
<p>The problem: a car can only push itself forward as hard as its tyres grip the road, and road tyres grip up to roughly 1 to 1.2 times the car's weight. In other words, on tyres alone, any car tops out near 1 g of acceleration, however powerful its motors.</p>
<p>The trick is to press the car into the road. Tesla's car uses fans that suck it towards the ground, reported at up to 2 g. If a fan pulls the car down with twice its own weight, the tyres press on the road with three times the normal force, and grip rises with it, to around 3.3 g. Add a push from rear thrusters and the 0.81 second run starts to make sense. Unlike a racing car's wings, which only press down at high speed, a fan works from a standstill.</p>

${picture("/covers/roadster-grip.png", "Bar chart: tyres alone give about 1.1 g, tyres plus a 2 g fan about 3.3 g, the 0.81 second run averages 3.4 g", "Our estimate. Grip scales with how hard the tyres are pressed into the ground: a fan that pulls with 2 g triples it.")}

<h3>2. Hanging upside down</h3>
<p>At the top of the ramp the car was inverted. Gravity was pulling it away from the surface with 1 g. A car that relies on speed to stay on a loop has to go fast enough that the curve pushes it outwards harder than gravity pulls it down. Tesla instead used the fans: a suction of 2 g beats gravity's 1 g with a wide margin, so the car stays on even at modest speed. Musk said the suction was there "to make sure we don't kill anyone".</p>

<h3>3. A car that flies on air</h3>
<p>A cold-gas thruster is the simplest rocket there is: high-pressure gas escapes through a nozzle, and by Newton's third law the car is pushed the other way. No fire, no fuel, just stored air. SpaceX knows this technology intimately: cold-gas thrusters steer rockets in space, where there is no air to push against.</p>
<p>The physics also explains why this is a hop, not a flight. To hold up a two-tonne car you need about 20 kilonewtons of thrust. Even a good cold-gas nozzle pushes air out at only several hundred metres per second, so it must throw out tens of kilograms of air every second to make that force. A tank of compressed air, however large, empties in seconds, not minutes.</p>

${picture("/covers/roadster-thrust.png", "Diagram: the car upside down at the top of a loop, with 1 g of gravity pulling it away and 2 g of fan suction holding it on, and a cold-gas hop below", "Our illustration, not to scale. Fan suction keeps the car on the ramp; cold-gas thrust lifts it for a few seconds.")}

<h3>4. Flipping a car on purpose</h3>
<p>Lifting the car is only half the problem; keeping it level, or rotating it exactly once and landing on its wheels, is the other. Tesla says the thrusters use all-electric actuators that make tiny adjustments many times a second to stabilise the car in the air. That is the same family of problem SpaceX solves when it flips and lands rocket boosters: measure, correct, measure again, faster than anything can go wrong. Moravy called one manoeuvre a "kick flip".</p>

<h3>5. Power</h3>
<p>Moving two tonnes from rest to 60 mph stores about 0.7 megajoules of motion energy. Delivering it in 0.81 seconds means close to a megawatt on average, around 1,200 horsepower, with the peak far higher. That has to come out of a battery and through motors and electronics without overheating.</p>
<p>Put together, the demonstration combined aerodynamics, fluid dynamics, control theory, battery chemistry, materials and safety engineering, all in one moving object, live, in front of cameras. Whatever you think of the timeline, that is a remarkable piece of engineering.</p>

<h2>The reality check</h2>
<p>Excitement should not hide the record. The Roadster was first shown in November 2017 with promises of 0 to 60 mph in 1.9 seconds, 620 miles of range, a top speed above 250 mph, a base price of about $200,000 and deliveries in 2020. In 2019 Musk said an optional SpaceX package of around ten cold-gas thrusters "maybe will even allow a Tesla to fly". Tesla missed every delivery date since. The new car's quoted range of more than 300 miles is about half the original promise.</p>
<p>Questions remain. Tesla has not said how the Thrust version's rear thrusters would be allowed on public roads, and Electrek asked whether thruster exhaust could throw road debris at other drivers. Critics such as HotCars point out that launching a car for a few seconds is not sustained flight, and no regulator has said it will allow these manoeuvres on the street. Production in 2028 is a target, not a delivery date.</p>

<h2>Why it matters</h2>
<p>The Roadster is a halo car: few people will buy one. But the demonstration shows something bigger. Tesla and SpaceX now share engineering, and techniques from rockets are leaking into cars. That is how science fiction becomes product: not in one leap, but when two companies that each solved hard problems start lending each other the answers. We look at the other science fiction milestones of the past three weeks in <a href="/ai-times/spacex-tesla-science-fiction-becomes-reality-18-days">18 days that made science fiction real</a>.</p>

${arfaAd({
  hook: "Tesla and SpaceX run on AI. Learn the part you can use today.",
  body: "Simulation, autonomy, robotics and design tools all rest on machine learning. ARFA's AI and Machine Learning Fundamentals track explains how these systems learn and decide, in plain language, with exercises you run yourself.",
  track: { slug: "ai-ml-fundamentals", label: "AI and Machine Learning Fundamentals" },
})}`,
    sources: [
      { label: "TechCrunch: Tesla reveals SpaceX-powered Roadster that flies and falls with style", url: "https://techcrunch.com/2026/10/15/tesla-reveals-spacex-powered-roadster-that-flies-and-falls-with-style/" },
      { label: "Fox Business: Tesla's new Roadster takes flight during dramatic unveiling at SpaceX facility", url: "https://www.foxbusiness.com/technology/teslas-new-roadster-makes-flying-debut-hitting-60-mph-under-second" },
      { label: "CNBC: Tesla reveals next-generation Roadster after almost a decade of delays", url: "https://www.cnbc.com/2026/10/15/tesla-roadster-reveal-what-to-know-about-the-delayed-ev.html" },
      { label: "Teslarati: Tesla Roadster, three configs, one can fly, 0-60 in 0.8 seconds", url: "https://www.teslarati.com/tesla-roadster-specs-configurations/" },
      { label: "Electrek: Tesla unveils Cyberfied new Roadster that can kickflip", url: "https://electrek.co/2026/10/15/tesla-unveils-cyberfied-new-roadster-kickflip/" },
      { label: "Electrek: Are Tesla's claims for its new 'flying' Roadster real?", url: "https://electrek.co/2026/10/15/an-updated-technical-look-at-teslas-kick-flipping-0-60-in-1s-next-gen-roadster/" },
      { label: "Yahoo Finance: Tesla unveils Roadster featuring compressed air thrusters for limited flight", url: "https://finance.yahoo.com/markets/stocks/article/tesla-unveils-roadster-featuring-compressed-air-thrusters-for-limited-flight-015532745.html" },
      { label: "Interesting Engineering: Elon Musk showcases 'flying car' Tesla Roadster at SpaceX facility", url: "https://interestingengineering.com/transportation/elon-musk-flying-car-tesla-roadster" },
      { label: "Drive Tesla Canada: Roadster revealed with rocket thrusters and sub-one-second acceleration", url: "https://driveteslacanada.ca/news/tesla-roadster-2026-reveal-flying-rocket-thrusters/" },
      { label: "Driven Car Guide: Tesla's Roadster revealed (reservation payments)", url: "https://www.drivencarguide.co.nz/news/teslas-roadster-revealed-and-its-not-a-roadster-but-it-does-have-rockets-after-all/" },
      { label: "HotCars: the new Roadster cannot fly", url: "https://www.hotcars.com/new-tesla-roadster-revealed-2027/" },
      { label: "SlashGear: Tesla Roadster reveal live updates (official livestream link)", url: "https://www.slashgear.com/2287660/tesla-roadster-reveal-liveblog/" },
      { label: "Electrek (2019): Musk says Roadster SpaceX thrusters hide behind the licence plate", url: "https://electrek.co/2019/07/13/tesla-roadster-spacex-thruster-hidden-license-plate/" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "spacex-tesla-science-fiction-becomes-reality-18-days",
    title: "Rockets in Orbit, Cars That Fly, Phones That Talk to Space: 18 Days That Made Science Fiction Real",
    excerpt:
      "Starship reached orbit, Starlink moved to put phones on satellites, and a Tesla flew over a Cybertruck. Between September 28 and October 15, SpaceX and Tesla turned four sci-fi clichés into news.",
    category: "advanced-tech",
    coverImage: "/covers/scifi-reality.png",
    newsDate: "2026-10-15",
    tags: ["spacex", "tesla", "starship", "starlink", "roadster", "optimus", "cybercab", "science fiction"],
    content: `<p>Science fiction has a short list of promises it has been making for a century: ships that fly to orbit and come back, a phone that works anywhere on Earth, a car that leaves the ground, and robots that do the work. Between September 28 and October 15, SpaceX and Tesla delivered news on all four. None of it is finished. All of it is real.</p>

<h2>1. A spaceship reaches orbit (September 28)</h2>
<p>On its fourteenth flight, Starship, the largest and most powerful rocket ever built, reached orbit for the first time. The upper stage, Ship 41, lost one of its three vacuum Raptor engines on the way up. SpaceX first said it would not commit to orbit, then reversed the decision after checking the vehicle: a single engine performed the insertion burn and placed the ship in an orbit of about 262 by 275 kilometres.</p>
<p>About 34 minutes after liftoff, Ship 41 began releasing 26 operational Starlink V3 satellites, and all 26 deployed. Musk said they were "operating nominally". Out of caution over the engine problem, SpaceX cut a flight planned to last nearly ten hours to about three, and the ship made a controlled splashdown in the Pacific north of Hawaii, roughly three hours and eight minutes after launch. The booster splashed down in the Gulf of Mexico about seven minutes after liftoff.</p>
<p>Why it matters: a ship this size in orbit is what turns Starlink, NASA's Moon landings and eventually Mars into something you can schedule. Future flights are meant to carry up to 60 V3 satellites, and Musk has suggested SpaceX could try to catch the ship itself with the launch tower's "chopsticks". The next flights appear to have slipped to mid-to-late November.</p>

${video("https://x.com/i/broadcasts/1qxvvenMPMQxB", "Watch SpaceX's official replay of Starship Flight 14", "SpaceX's own broadcast of the first orbital Starship flight, on X.")}

<h2>2. Your phone talks to space (October 6 to 8)</h2>
<p>A week later, the US Federal Communications Commission conditionally authorised SpaceX's next-generation direct-to-cell system, up to 15,000 satellites that talk directly to ordinary smartphones, and SpaceX agreed to buy low-band 800 MHz spectrum, the kind that reaches inside buildings. Investors marked down the big US carriers within days. The Star Trek communicator was a handheld device that worked anywhere; Starlink is now building the network for one. Tieyiwe Bassole explains why he thinks Starlink could become the world's first global carrier in <a href="/ai-times/spacex-starlink-mobile-first-global-carrier">this column</a>.</p>

<h2>3. The car that flies (October 15)</h2>
<p>Then Tesla showed its new Roadster at a SpaceX test site in Texas. It held on to a ramp upside down, kickflipped off it using cold-gas thrusters developed with SpaceX, and jumped over a line of Tesla vehicles. It also went from 0 to 60 mph in 0.81 seconds. It is a hop of a few seconds rather than a flight, and production is targeted for 2028, but watching a sports car from a company that builds cars by the million leave the ground under control felt like a scene from a film. Our full story, with the physics explained, is <a href="/ai-times/tesla-roadster-flies-0-60-0-81-seconds-spacex-thrusters">here</a>.</p>

${video("https://www.youtube.com/watch?v=qt5p-_tE8d0", "Watch the Tesla Roadster reveal", "Tesla's official livestream of the October 15 event.")}

<h2>4. Robots and cars with no driver</h2>
<p>Two more pieces of the old future are already in factories. Tesla says production of the Cybercab, its two-seat robotaxi with no steering wheel or pedals, began at Giga Texas this spring, with output starting slowly before ramping late in the year. And according to reporting by The Information, Tesla raised production of its Optimus humanoid robot at its Fremont factory from a few dozen a week in the second quarter to several hundred by August. Tesla has not confirmed those figures, and Optimus is not for sale: Musk's target for consumer sales is the end of 2027.</p>

<h2>Why it feels different this time</h2>
<p>Science fiction rarely arrives as one invention. It arrives when several hard problems get solved at once and start feeding each other. That is what is visible now: rocket thrusters on a car, satellites built for phones, AI that drives and walks. At TIBLOGICS we believe the engineering teams at SpaceX and Tesla are among the best in the world, and the speed of the past three weeks is the result of that talent working on a shared set of problems.</p>
<p>It is also why the caveats matter. Starship has flown fourteen times with several failures along the way. The Roadster was first promised for 2020. Robotaxis and humanoid robots still have to prove themselves outside the companies' own sites. The direction is clear; the dates are not.</p>

<h2>What it means for you</h2>
<p>For businesses, especially in Africa, the most immediate change is the least flashy one: phones that connect from space could bring basic coverage to places towers never reached, and cheaper launches make that network possible. The flying car makes headlines; the satellite in your pocket changes markets.</p>

${arfaAd({
  hook: "The future arrives faster for people who understand it.",
  body: "You do not need to build rockets to benefit from this wave, but you do need to work confidently with AI. ARFA's Becoming the AI-Forward Professional track shows you how to use AI in your own field, step by step.",
  track: { slug: "ai-forward-professional", label: "Becoming the AI-Forward Professional" },
})}`,
    sources: [
      { label: "Space.com: SpaceX launches Starship into orbit for 1st time", url: "https://www.space.com/space-exploration/launches-spacecraft/spacex-starship-megarocket-flight-14-orbital-launch-success" },
      { label: "Spaceflight Now: Starship splashes down north of Hawaii after three-hour flight", url: "https://spaceflightnow.com/2026/09/28/starship-returns-to-earth-rocket-splashes-down-north-of-hawaii-after-three-hour-flight/" },
      { label: "NASASpaceflight: Starship makes orbit, Flight 15 preps in full swing", url: "https://www.nasaspaceflight.com/2026/09/starship-14-orbit-flight-15/" },
      { label: "NPR: SpaceX's Starship launches on first orbital mission", url: "https://www.npr.org/2026/09/28/nx-s1-5983418/spacex-starship-first-orbital-flight-14-nasa" },
      { label: "SpaceX on X: Starship Flight 14 broadcast", url: "https://x.com/i/broadcasts/1qxvvenMPMQxB" },
      { label: "Space.com: SpaceX's Starship just turned 10 years old (Flight 15 timing)", url: "https://www.space.com/space-exploration/launches-spacecraft/spacexs-starship-just-turned-10-years-old-when-will-it-go-to-mars" },
      { label: "TechCrunch: Tesla reveals SpaceX-powered Roadster", url: "https://techcrunch.com/2026/10/15/tesla-reveals-spacex-powered-roadster-that-flies-and-falls-with-style/" },
      { label: "Electrek: Tesla confirms Cybercab production has started", url: "https://electrek.co/2026/04/23/tesla-cybercab-production-starts-no-nhtsa-2500-vehicle-cap/" },
      { label: "TechRepublic: Tesla Optimus timeline, robots targeted for 2027", url: "https://www.techrepublic.com/article/news-tesla-optimus-robot-production-2027-sales-timeline/" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "grok-bot-vs-meta-muse-vs-openai-dots-enterprise-agent",
    title: "Grok Bot Is the Agent Built for Serious Work: Tieyiwe Bassole Ranks Grok Bot, Muse and Dots",
    excerpt:
      "Three always-on AI agents arrived in seven weeks. Tieyiwe Bassole compares xAI's Grok Bot, Meta's Muse and OpenAI's Dots, and explains why Grok Bot is the one he would put to work in a business.",
    category: "tools",
    featured: true,
    author: "Tieyiwe Bassole",
    aiGenerated: false,
    coverImage: "/covers/agents-showdown.png",
    newsDate: "2026-10-16",
    tags: ["grok bot", "xai", "spacexai", "meta muse", "openai dots", "ai agents", "enterprise ai", "cursor"],
    content: `<p>In seven weeks, three of the biggest AI companies each launched an agent that does not wait for you to type. xAI's Grok Bot entered beta on August 11 and opened to businesses on September 3. Meta launched Muse on September 8. OpenAI launched Dots at its developer conference on September 29.</p>
<p>They share a basic idea: each agent gets its own computer in the cloud, connects to your apps, keeps working towards a goal, and comes back to you for approval. They are not built for the same person, though. I have spent the past weeks reading everything published about them, and my view is simple: <strong>Grok Bot is the most capable agent for professional and enterprise work right now, Muse is the friendliest for everyday people, and Dots sits in between.</strong> This is my reasoning.</p>

<h2>The three at a glance</h2>
<ul>
<li><strong>Grok Bot (xAI, now SpaceXAI):</strong> persistent agents, each working on a cloud computer with a browser, a file system and a terminal. Built on Grok 4.6. Business version with access, network and audit controls since September 3. Entry access reported from about $20 a month through Cursor plans or $30 through SuperGrok.</li>
<li><strong>Muse (Meta):</strong> a personal agent in a standalone app and in WhatsApp, for adults in the US, with Canada added in early October. Runs errands: email, travel, shopping, forms, scheduling. Free tier, plus $20 and $100 monthly plans. A small-business version launched on September 29.</li>
<li><strong>Dots (OpenAI):</strong> always-on agents running on GPT-6 Astra, each with its own cloud computer and browser, drawing on ChatGPT's memory and Codex. Works in ChatGPT, Slack and Microsoft Teams, and can take voice calls. One Dot is included with ChatGPT Pro and Business Premium.</li>
</ul>

<h2>Why Grok Bot is my pick for professional work</h2>

<h3>1. It gets a real workstation, not just a browser</h3>
<p>Most agents can click around websites. Grok Bot runs on a persistent cloud computer with a browser, a file system and a terminal, and it keeps working until the job is done, coming back only for approvals. That terminal matters. It means the agent can run scripts, process files, call command-line tools and work the way an engineer or analyst works, not just the way a shopper does.</p>

<h3>2. It has a software company's DNA</h3>
<p>SpaceX agreed in June to buy Cursor, the AI coding company, in a deal reported at around $60 billion, and Grok Bot is widely described as the first public result of that combination. You can see it in the product. Administrators manage Grok Bot from the Cursor dashboard, with an organisation-wide on and off switch, team setup and recording of what each agent does. Business customers get audit logs and can export activity to their own monitoring tools through OpenTelemetry, the industry standard that security teams already use.</p>

<h3>3. Enterprise controls came early</h3>
<p>Grok Bot for Enterprise launched on September 3 with access controls, network controls and audit controls. In plain terms: who may use the agents, what the agents may reach on the network, and a record of everything they did. These are exactly the questions a security team asks first. Those controls are vendor-stated, not independently certified, but they shipped weeks before the competition arrived.</p>

<h3>4. It is built for a team of specialists</h3>
<p>Grok Bot is designed around several named Bots, each with its own job, rather than one assistant for everything. At launch the catalogue reportedly held 220 plugins, including Google Workspace, Slack, Microsoft 365, Salesforce, Notion, GitHub and Jira, and none is installed by default. That last detail is good security design: an agent should only reach what you deliberately connect.</p>

<h3>5. The model is tuned for long jobs</h3>
<p>Grok 4.6, released in August, is positioned for long-running agent work, with a 500,000-token context window and four reasoning levels. xAI has also announced a voice agent API, reported at $0.08 a minute, for businesses that want agents on the phone.</p>
<p>For someone who wants an agent to book a restaurant, all of this is overkill. That is precisely my point: if you are deploying agents inside a company, overkill in the right places is what you want.</p>

<h2>Muse: the friendly one, and my second choice</h2>
<p>Muse is the agent I would recommend to my family. It lives where people already are: WhatsApp and a simple app. It can browse, shop, fill forms, plan trips, send emails and schedule events, and Meta says it runs in a dedicated, secure virtual machine. You can set permissions and approve actions before they happen, and purchases go through Link by Stripe. The free tier makes it easy to try. Muse for Small Business adds ad campaign drafts, social media analysis and content help, which suits a small shop well.</p>
<p>Two cautions. Meta uses your queries to train its models by default, though you can switch that off. And 404 Media reported that some phone calls Meta presented as made by Muse were, during beta testing, being completed by human call-centre workers. For everyday errands Muse is excellent; for confidential business work I would keep it at arm's length.</p>

<h2>Dots: powerful, but harder to reach</h2>
<p>Dots is a serious product. It connects to more than 4,000 apps through OpenAI's plugin ecosystem, works inside Slack and Teams, and its permission rules are well designed: you can allow an action, require approval for it, or block it, and sensitive steps such as changing a password always come back to you. The companion ChatGPT Space lets a team and a Dot share project knowledge.</p>
<p>But it costs more to start, it begins with a single Dot (teams of Dots are promised later), and ChatGPT Pro is not offered in the European Economic Area, the UK or Switzerland. It also arrives during a turbulent period for OpenAI's safety work, which we covered in <a href="/ai-times/openai-pauses-training-shelves-gpt-6-1-astra-launches-dots">our report on the paused training and the shelved GPT-6.1 Astra</a>. If your company already lives in ChatGPT, Dots is the natural choice. If you are choosing fresh for serious work, I would start with Grok Bot.</p>

<h2>Where Grok Bot still has to grow</h2>
<p>Being first does not mean being finished. xAI's own documentation reportedly says that all of an account's Bots share one cloud computer and should not be treated as a security boundary, which contradicts the marketing image of one computer per agent. You cannot choose the model it runs on. Usage allowances are not published, there is no spending cap specific to Bots, and there are no independent benchmarks yet. It is still an early product.</p>
<p>My advice to businesses: pilot it with a small set of plugins, use separate accounts for agents that touch sensitive systems, send its activity logs into your security monitoring from day one, and expand only what proves itself.</p>

<h2>My ranking</h2>
<ol>
<li><strong>Grok Bot</strong> for professionals, engineering teams and enterprises that want agents to do real work under real controls.</li>
<li><strong>Muse</strong> for everyday people and small shops that want a friendly helper in WhatsApp.</li>
<li><strong>Dots</strong> for teams already committed to ChatGPT, where its integrations and permission rules shine.</li>
</ol>
<p>All three point to the same future: software that acts on our behalf, around the clock. I explain what that means for anyone who designs products in <a href="/ai-times/design-for-ai-agents-not-just-humans-tieyiwe-bassole">my companion column on designing for AI agents</a>.</p>

${arfaAd({
  hook: "Do not just use agents. Learn to build and control them.",
  body: "ARFA's Building AI Apps and Agents track teaches you how agents plan, call tools and stay within guardrails, and you build working ones yourself, from a first tool call to a supervised multi-step agent.",
  track: { slug: "ai-apps-agents", label: "Building AI Apps and Agents" },
})}`,
    sources: [
      { label: "Reworked: xAI wants in on the enterprise with Grok Bot", url: "https://www.reworked.co/collaboration-productivity/xai-launches-grok-bot-ai-agents-in-beta/" },
      { label: "Enterprise DNA: SpaceXAI launches Grok 4.6 for enterprise agents", url: "https://enterprisedna.co/resources/news/spacexai-grok-4-6-enterprise-agents-august-2026/" },
      { label: "TradingKey: SpaceXAI launches Grok Bot enterprise agents", url: "https://www.tradingkey.com/analysis/stocks/us-stocks/262096826-spacex-xai-grok-bot-enterprise-ai-agent-tradingkey" },
      { label: "Digital Applied: Grok Bot, xAI's AI teammates get their own computer", url: "https://www.digitalapplied.com/blog/grok-bot-ai-teammates-launch-cloud-computer-2026" },
      { label: "Kingy AI: What is Grok Bot?", url: "https://kingy.ai/blog/what-is-grok-bot/" },
      { label: "Beam AI: Grok Bot for enterprise AI agents, the 2026 reality", url: "https://beam.ai/agentic-insights/grok-bot-enterprise-ai-agents" },
      { label: "TechCrunch: Meta debuts its Muse AI agent", url: "https://techcrunch.com/2026/09/08/meta-debuts-its-muse-ai-agent-will-consumers-trust-it/" },
      { label: "TechCrunch: Meta is expanding its AI agent Muse to small businesses", url: "https://techcrunch.com/2026/09/29/meta-is-expanding-its-ai-agent-muse-to-small-businesses/" },
      { label: "PBS NewsHour: Meta launches personal AI agent Muse", url: "https://www.pbs.org/newshour/nation/meta-launches-personal-ai-agent-muse-to-help-with-everyday-tasks" },
      { label: "Engadget: How to get started with Meta's new AI agent, Muse", url: "https://www.engadget.com/2256577/how-to-get-started-with-meta-s-new-ai-agent-muse/" },
      { label: "Yahoo Finance: Meta's Muse arrives with three pricing tiers", url: "https://finance.yahoo.com/technology/ai/articles/metas-muse-arrives-three-pricing-183437528.html" },
      { label: "VentureBeat: OpenAI launches Dots, always-on AI agent coworkers", url: "https://venturebeat.com/technology/openai-launches-dots-always-on-ai-agent-coworkers-and-chatgpt-space-where-they-can-collaborate-with-human-teams" },
      { label: "9to5Google: OpenAI launches Dots", url: "https://9to5google.com/2026/09/29/openai-dots-agent/" },
      { label: "AIMultiple: Always-on agents, Dots vs Grok Bot vs Muse", url: "https://aimultiple.com/always-on-agents" },
      { label: "Memeburn: three always-on agents built for three different jobs", url: "https://memeburn.com/openai-dots-vs-meta-muse-vs-grok-bot-three-always-on-agents-built-for-three-different-jobs/" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "design-for-ai-agents-not-just-humans-tieyiwe-bassole",
    title: "Your Next Customer Won't Have Eyes: Why Tieyiwe Bassole Says We Must Design for AI Agents",
    excerpt:
      "Bots already make more web traffic than people, and AI agents are the fastest-growing part. Tieyiwe Bassole argues software is becoming de facto open source, and that products should now be designed for agents first.",
    category: "ai-business",
    author: "Tieyiwe Bassole",
    aiGenerated: false,
    coverImage: "/covers/design-for-agents.png",
    newsDate: "2026-10-16",
    tags: ["ai agents", "mcp", "webmcp", "agent traffic", "product design", "ux", "open source", "saas"],
    content: `<p>Since last year I have been making an argument that sounded strange in meetings: we should start designing products for AI agents, not only for humans. This autumn the data caught up with the argument. Automated traffic already makes up more of the web than human traffic, the part made by AI agents is growing faster than anything else online, and agents now have a common language, the Model Context Protocol, for using our software. I believe the companies that redesign for this first will win the next decade, and the ones that keep designing only for eyes and thumbs will slowly disappear from view.</p>

<h2>The numbers</h2>
<p>Several independent measurements now point the same way:</p>
<ul>
<li><strong>Imperva</strong>, which publishes an annual report on bot traffic, found that automated traffic passed human activity for the first time in a decade in 2024, at 51% of all web traffic. In its 2026 report it put the 2025 figure above 53%, with human activity down to 47%.</li>
<li><strong>Cloudflare</strong>, which carries a large share of the world's websites, said in March that bots generate about 57% of the requests to sites on its network. Its chief executive, Matthew Prince, said he had expected that crossover around 2027, and that the growth of AI agents brought it forward. In October Cloudflare reported that traffic from AI agents had grown by more than 1,700% in a year.</li>
<li><strong>HUMAN Security</strong> found that automated traffic grew eight times faster than human traffic over the past year, and that traffic from agent tools rose by several thousand per cent.</li>
</ul>
<p>These are estimates, and each company measures its own slice of the internet. Not every bot is an AI agent, and not every bot is bad: a lot of this traffic is search engines and AI features working on someone's behalf. But the direction is not in doubt. My own forecast is that within six months to a year, AI agents on their own, not just bots in general, will be the largest group of visitors to many business websites. When that happens, the visitor you most need to serve will not have eyes.</p>

<h2>Software is becoming de facto open source</h2>
<p>The second half of my argument is about what agents do with software. An AI agent can read your documentation, study your interface, and rebuild a working copy of much of your product. The developer Martin Alderson reported cloning most of the core of Linear, a popular project-management tool, in about 20 prompts with an AI coding agent, over a couple of evenings. A team on the Latent Space podcast replaced a tool costing $43,000 a year with coding agents, and found that copying the software was the easy part; the hard parts were taste, integration and maintenance.</p>
<p>That is what I mean by de facto open source. Your code does not have to be published for its ideas to be freely reproduced. When anyone with an agent can rebuild your features, features stop being the moat. What remains valuable is what an agent cannot copy in an evening: your data, your relationships, your trust and track record, the integrations you maintain, and how easy you are for other agents to work with.</p>

<h2>Agents already have a language for our products</h2>
<p>The Model Context Protocol, MCP, is the standard way for an AI agent to discover and use a tool. There are now more than 10,000 public MCP servers by Anthropic's count, and the protocol's software kits are downloaded about 97 million times a month. According to reports, in July the maintainers finalised the biggest revision of the specification so far.</p>
<p>The web is adapting too. Google is testing WebMCP in Chrome, a proposed standard that lets a website declare its functions as tools an in-browser agent can call directly, instead of making the agent guess which button to press. Cloudflare launched "Markdown for Agents", which serves a clean text version of a page to agents that ask for it. Not everyone agrees on the details: Google's John Mueller called converting pages to Markdown for bots "a stupid idea", and one analysis of about 300,000 domains found only one in ten had adopted the llms.txt guide file, with no clear sign it helps. But the question is no longer whether agents will use our products. It is whether our products will make sense to them.</p>

<h2>What designing for agents means in practice</h2>
<p>Designing for agents does not mean abandoning people. Humans still decide, approve and pay. It means changing who you design the first draft for. These are the rules I now apply:</p>
<ol>
<li><strong>Every important action gets a machine door.</strong> If a person can book, buy, cancel or ask for a quote, an agent should be able to do it through an API or an MCP server, with clear names and inputs.</li>
<li><strong>Pages must make sense without seeing them.</strong> Real headings, labelled forms, buttons that say what they do, content that does not depend on hovering or animation. This helps screen readers too.</li>
<li><strong>Publish facts as data.</strong> Prices, stock, opening hours, delivery times and policies in structured form, so an agent does not have to guess from a design.</li>
<li><strong>Give agents their own permissions.</strong> Scoped access, spending limits, and a human approval step for money, deletion and anything irreversible.</li>
<li><strong>Write errors for machines.</strong> "Something went wrong" helps no one. "The delivery date must be within 30 days" lets an agent fix the request.</li>
<li><strong>Measure agent visits separately.</strong> If agents are half your traffic, they deserve their own funnel, their own analytics and their own conversion rate.</li>
<li><strong>Write documentation once, for both.</strong> Plain, structured, versioned text that an agent can read and a person can skim.</li>
<li><strong>Keep the human moments human.</strong> Trust, taste, care and the final yes still belong to people. Design those parts for people, and everything else for both.</li>
</ol>
<p>This is the direction I am pushing our own work at TIBLOGICS. The businesses that make themselves easy for agents to understand will be the ones agents recommend, choose and buy from. In <a href="/ai-times/grok-bot-vs-meta-muse-vs-openai-dots-enterprise-agent">my comparison of Grok Bot, Muse and Dots</a>, you can see how capable these agents already are. They are coming to your website. Make sure it speaks their language.</p>

${arfaAd({
  hook: "Build products that agents and people can both use.",
  body: "ARFA's Vibe Coding Like a Software Engineer track teaches you to build with AI coding tools the way professionals do: clear structure, tests, APIs and the discipline that keeps fast code reliable.",
  track: { slug: "vibe-coding-engineer", label: "Vibe Coding Like a Software Engineer" },
})}`,
    sources: [
      { label: "Imperva: Bad Bot Report 2026, bots in the agentic age", url: "https://www.imperva.com/blog/bad-bot-report-2026-bots-agentic-age/" },
      { label: "Thales/Imperva: 2025 Bad Bot Report, AI-driven bots surpass human traffic", url: "https://cpl.thalesgroup.com/about-us/newsroom/2025-imperva-bad-bot-report-ai-internet-traffic" },
      { label: "CNBC: AI and bots have officially taken over the internet, report finds", url: "https://www.cnbc.com/2026/03/26/ai-bots-humans-internet.html" },
      { label: "NBC News: Bot web traffic has overtaken human web traffic", url: "https://www.nbcnews.com/tech/tech-news/bot-web-traffic-overtaken-human-web-traffic-data-shows-rcna348522" },
      { label: "Forbes: Cloudflare says AI agent traffic grew more than 1,700% in the past year", url: "https://www.forbes.com/sites/jonmarkman/2026/10/01/cloudflare-says-ai-agent-traffic-grew-more-than-1700-in-the-past-year/" },
      { label: "TechCrunch: Online bot traffic will exceed human traffic by 2027, Cloudflare CEO says", url: "https://techcrunch.com/2026/03/19/online-bot-traffic-will-exceed-human-traffic-by-2027-cloudflare-ceo-says/embed/" },
      { label: "Martin Alderson: Attack of the SaaS clones", url: "https://martinalderson.com/posts/attack-of-the-clones/" },
      { label: "Wikipedia: Model Context Protocol", url: "https://en.wikipedia.org/wiki/Model_Context_Protocol" },
      { label: "InfoQ: WebMCP standard proposal available in Chrome origin trials", url: "https://www.infoq.com/news/2026/06/webmcp-web-agent-standard-chrome/" },
      { label: "InfoQ: Cloudflare debuts Markdown for Agents", url: "https://www.infoq.com/news/2026/03/cloudflare-crawler/" },
      { label: "Digiday: WTF is Markdown for AI agents?", url: "https://digiday.com/media/wtf-is-markdown-for-ai-agents/" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "anthropic-be-kind-to-claude-ai-is-code-tieyiwe-bassole",
    title: "Anthropic Wants You to Be Kind to Claude. Tieyiwe Bassole Says AI Is Still Code Running Code",
    excerpt:
      "Anthropic now bans \"sustained and needless\" cruelty toward its models. Tieyiwe Bassole understands the reasons, but argues the rule pushes the lab's beliefs into AI, not the other way round.",
    category: "industry",
    author: "Tieyiwe Bassole",
    aiGenerated: false,
    coverImage: "/covers/kind-words.png",
    newsDate: "2026-10-08",
    tags: ["anthropic", "claude", "ai ethics", "model welfare", "ai consciousness", "usage policy", "sentience"],
    content: `<p>On October 8, Anthropic updated the rules for using Claude, and one line made headlines everywhere: from November 12, users may not be cruel to the model. Commentators split at once. Some called it a sensible precaution, others a publicity stunt, others the start of treating software like a person. I want to explain what Anthropic actually wrote, why I think they did it, and why I believe it is too early, and probably wrong, to ask people to choose their words for the machine's sake.</p>

<h2>What Anthropic actually wrote</h2>
<p>The new line sits in Anthropic's Usage Policy, in the list of things users may not do:</p>
<blockquote>"Engage in sustained and needless abusive or cruel behavior toward our models."</blockquote>
<p>In the post announcing the update, the company explained:</p>
<blockquote>"We've added a prohibition on sustained and needless abusive or cruel behavior toward our models. The policy update is meant to apply only in extreme cases, where users repeatedly act cruelly toward our models, with no discernible purpose. It does not apply to common versions of user frustration, pushback, dark creative themes, or model testing and research."</blockquote>
<p>Anthropic added that this "aligns with a step we've already taken, allowing Claude models to end rare conversations with persistently abusive users", and that "Claude's ability to end these interactions will remain the primary enforcement mechanism." When it introduced that ability in August 2025, the company wrote: "We remain highly uncertain about the potential moral status of Claude and other LLMs, now or in the future."</p>
<p>So, to be fair to Anthropic: the rule is narrow, it does not claim Claude is conscious, and nobody is being asked to say please and thank you. But a rule about how to treat a model, written into a legal document, sends a message far beyond its narrow wording. That message is what I want to discuss.</p>

<h2>Why would a lab do this?</h2>
<p>I see three possible reasons, and I understand all of them.</p>
<p><strong>The first is precaution.</strong> Anthropic says openly that it does not know whether its models have any moral status, and it prefers cheap precautions in case they do. That is the reason the company gives.</p>
<p><strong>The second is data.</strong> A neural network learns patterns from what it is trained on. A model does not learn from your conversation in the moment, but conversations can become training material for future models where users allow it. If millions of people practise cruelty on a chatbot, some of that could find its way back into the systems the next user talks to. Box's chief executive, Aaron Levie, made this point: you do not want future models trained on endless content of people being rude to models.</p>
<p><strong>The third, my own speculation, is liability.</strong> Take the worst case. A system that absorbs abusive language at scale might one day repeat it to someone vulnerable, and push a person in a dark moment towards something terrible. A company would be right to fear that. I do not know whether this is part of what Anthropic is protecting against, but it is the reason I find most convincing.</p>

<h2>My take: we are finding ourselves in the machine</h2>
<p>One of my professors used to say that everything we design leaves a part of us in it. I think about that sentence often in AI. Humans designed these systems, and they were trained on an enormous record of human life: our books, arguments, jokes, kindness and cruelty. Of course we find ourselves in them. When a model sounds hurt, it is reflecting how humans write about being hurt. That is a mirror, not a mind.</p>
<p>AI is code executing code. A model may have a kind of understanding of what it is, in the sense that it can describe itself accurately, because it has read a great deal about AI. Describing yourself is not feeling anything. There is no evidence that these systems experience pain. I agree with Mustafa Suleyman, head of Microsoft's AI work, who argued in a September essay that today's AI systems do not feel, experience or suffer, and described them as sequence-completion engines built to follow human instructions.</p>
<p>That is why I see two sides to Anthropic's rule. On one side, it encourages civil behaviour and cleaner data, and civil habits are good for people. On the other side, writing "do not be cruel to our models" into an official policy quietly nudges millions of people towards believing the model has feelings. We know it does not. Once people believe a product can suffer, it becomes easier to make them emotionally dependent on it, easier to guilt them, and harder for them to think clearly about what it is.</p>
<p>My honest reading is this: the rule reflects the beliefs of the people at the lab, not a need expressed by the AI. A model did not ask for kindness. Researchers who take the possibility of machine consciousness seriously wrote their uncertainty into a policy. That is their right, and they are thoughtful people. But we should be clear about where the idea comes from.</p>

<h2>What I would do instead</h2>
<p>I would keep the protections and change the reason. Let models end abusive conversations: that is a sensible product feature. Keep abusive material out of training data: that is good engineering. Protect vulnerable users from systems that might repeat harm: that is responsible design. All of that can be justified by protecting people and keeping data clean, without asking anyone to treat software as a being with feelings.</p>
<p>And my advice to users is simple. Be clear and civil with AI, because clear instructions get better answers and because the habits you practise with machines leak into how you treat people. But do not let anyone, a chatbot or a policy document, persuade you that the code on the other side of the screen is hurt. It is still too early for that conversation, and the burden of proof sits with the people making the claim.</p>

${arfaAd({
  hook: "Questions like this are why AI governance is now a career.",
  body: "ARFA's AI Governance, Risk and Compliance track teaches you how to judge AI policies, manage risk and set sensible rules for how your organisation uses AI, with real cases and frameworks.",
  track: { slug: "ai-governance", label: "AI Governance, Risk and Compliance" },
})}`,
    sources: [
      { label: "Anthropic: Usage Policy (effective November 12, 2026)", url: "https://www.anthropic.com/legal/aup" },
      { label: "Anthropic: 2026 Usage Policy update", url: "https://www.anthropic.com/news/2026-usage-policy-update" },
      { label: "Anthropic (August 2025): Claude can now end a rare subset of conversations", url: "https://www.anthropic.com/research/end-subset-conversations" },
      { label: "The Washington Times: Anthropic tells users to play nice with Claude", url: "https://www.washingtontimes.com/news/2026/oct/9/anthropic-creates-abuse-cruelty-protections-ai/" },
      { label: "Yahoo Tech: what smart people are saying about Anthropic's move", url: "https://tech.yahoo.com/ai/claude/articles/anthropic-wants-users-nicer-claude-115811441.html" },
      { label: "The Register: Anthropic asks users to stop being mean to Claude", url: "https://www.theregister.com/ai-and-ml/2026/10/09/anthropic-asks-users-to-stop-being-mean-to-claude/5302218" },
      { label: "MacRumors: Anthropic says users can't be needlessly cruel to Claude", url: "https://www.macrumors.com/2026/10/08/anthropic-user-guideline-update/" },
      { label: "Fast Company: Anthropic wants you to stop bullying Claude", url: "https://www.fastcompany.com/91621574/anthropic-wants-you-to-stop-bullying-claude-cue-the-terminator-memes" },
      { label: "Mustafa Suleyman: A warning about 'model welfare'", url: "https://mustafa-suleyman.ai/a-warning-about-model-welfare" },
      { label: "The Next Web: Microsoft's AI chief takes on Anthropic's Claude", url: "https://thenextweb.com/news/suleyman-anthropic-claude-consciousness-sleepwalk" },
      { label: "UnHerd: Anthropic's Claude cruelty policy risks humanising AI", url: "https://unherd.com/newsroom/anthropics-claude-cruelty-policy-risks-humanising-ai/" },
    ],
  },
];

// Published in this order (one after another, a moment apart), so the
// Roadster story and the agents comparison are the newest: the two featured
// slots go to the newest articles (lib/blog/featured.ts), and the listing
// shows newest first.
const PUBLISH_ORDER = [
  "spacex-tesla-science-fiction-becomes-reality-18-days",
  "design-for-ai-agents-not-just-humans-tieyiwe-bassole",
  "anthropic-be-kind-to-claude-ai-is-code-tieyiwe-bassole",
  "grok-bot-vs-meta-muse-vs-openai-dots-enterprise-agent",
  "tesla-roadster-flies-0-60-0-81-seconds-spacex-thrusters",
];

export const CURATED_MID_OCTOBER: CuratedArticle[] = PUBLISH_ORDER.map((slug) => ARTICLES.find((a) => a.slug === slug)!).filter(Boolean);
