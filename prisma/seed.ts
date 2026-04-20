import { PrismaClient, ProjectCategory, ProjectStatus, ProjectPriority } from "@prisma/client";

const prisma = new PrismaClient();

const PROJECTS = [
  {
    name: "AI Central",
    description: "AI Agent Marketplace SaaS — 26 agents, credit system, Next.js 15/FastAPI/Supabase",
    category: "SAAS" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "HIGH" as ProjectPriority,
    progress: 65, revenueEarned: 0, revenuePotential: 180000, monthlyRecurring: 0,
    deadline: new Date("2026-06-30"), starred: true, color: "#6366f1",
    tasks: ["Complete agent marketplace UI", "Build credit system", "Stripe integration", "Launch beta"]
  },
  {
    name: "Goal Tester",
    description: "Live AI-powered SMART goal platform with Tax Tester feature. goaltester.com",
    category: "SAAS" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "MEDIUM" as ProjectPriority,
    progress: 85, revenueEarned: 2400, revenuePotential: 48000, monthlyRecurring: 200,
    deadline: new Date("2026-04-30"), starred: false, color: "#2251A3",
    tasks: ["Tax Tester feature complete", "Marketing campaign", "User acquisition", "90-day content calendar done"]
  },
  {
    name: "InStory Method Platform",
    description: "AI-personalized K-8 learning stories. School licensing $3,999–$13,999/yr. MCPS pipeline.",
    category: "SAAS" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "CRITICAL" as ProjectPriority,
    progress: 75, revenueEarned: 0, revenuePotential: 250000, monthlyRecurring: 0,
    deadline: new Date("2026-07-01"), starred: true, color: "#0F6E56",
    tasks: ["Platform spec complete", "ISM Algorithm enforcement", "Practice Arena gamification", "MCPS pitch deck", "School pricing tiers built"]
  },
  {
    name: "CareFlow AI",
    description: "AI-powered social work agency platform. Twilio/Bland.ai automated client wellness check-ins.",
    category: "SAAS" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "HIGH" as ProjectPriority,
    progress: 60, revenueEarned: 0, revenuePotential: 120000, monthlyRecurring: 0,
    deadline: new Date("2026-08-01"), starred: false, color: "#1A7A5E",
    tasks: ["Architecture complete", "Lorna's agency as pilot target", "Twilio integration", "Build CAREFLOW_BUILD_PROMPT deployed", "Beta launch"]
  },
  {
    name: "ShipFrica",
    description: "White-label shipping SaaS for African diaspora. Starter $199/mo, Pro $399, Enterprise $700.",
    category: "SAAS" as ProjectCategory, status: "PAUSED" as ProjectStatus, priority: "MEDIUM" as ProjectPriority,
    progress: 80, revenueEarned: 0, revenuePotential: 96000, monthlyRecurring: 0,
    deadline: new Date("2026-09-01"), starred: false, color: "#F47C20",
    tasks: ["Multi-tenant architecture done", "Pricing tiers built", "Marketplace built", "Launch marketing plan"]
  },
  {
    name: "AutoIQ OBD2",
    description: "Forensic ECU log retrieval app v5.1. Supabase auth, onboarding. getautoiq.com",
    category: "SAAS" as ProjectCategory, status: "PAUSED" as ProjectStatus, priority: "LOW" as ProjectPriority,
    progress: 70, revenueEarned: 0, revenuePotential: 60000, monthlyRecurring: 0,
    deadline: new Date("2026-10-01"), starred: false, color: "#854F0B",
    tasks: ["v5.1 complete", "Domain live at getautoiq.com", "App Store submission", "Marketing launch"]
  },
  {
    name: "SSR International Airport",
    description: "Mauritius AML airport contract. 5 AI solutions pitch. Discovery phase with Chairman Raju.",
    category: "CLIENT" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "CRITICAL" as ProjectPriority,
    progress: 35, revenueEarned: 0, revenuePotential: 85000, monthlyRecurring: 2500,
    deadline: new Date("2026-06-01"), starred: true, color: "#2251A3",
    tasks: ["Proposal deck complete", "Meeting with Chairman Raju done", "Discovery email sent to Ziyaad", "Follow-up discovery call", "Contract negotiation", "Solution implementation"]
  },
  {
    name: "Caribbean Flavor Restaurant",
    description: "Full digital transformation. Website, online ordering, AI phone agent, social media.",
    category: "CLIENT" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "HIGH" as ProjectPriority,
    progress: 55, revenueEarned: 5400, revenuePotential: 10800, monthlyRecurring: 549,
    deadline: new Date("2026-05-15"), starred: true, color: "#D85A30",
    tasks: ["Interactive proposal sent", "Service agreement signed", "Website redesign", "Online ordering system", "AI Phone Agent (Bland AI)", "Social media setup"]
  },
  {
    name: "ONAPAC Congo",
    description: "Agricultural digitization platform. $1.7M+ proposal. North American market expansion.",
    category: "CLIENT" as ProjectCategory, status: "PAUSED" as ProjectStatus, priority: "MEDIUM" as ProjectPriority,
    progress: 25, revenueEarned: 0, revenuePotential: 1700000, monthlyRecurring: 0,
    deadline: new Date("2026-12-01"), starred: false, color: "#3B6D11",
    tasks: ["Initial proposal complete", "Trade desk research done", "Follow-up meeting", "Contract"]
  },
  {
    name: "Dental Suite Gaithersburg",
    description: "Dental clinic proposal with interactive pricing widget. Replit implementation ready.",
    category: "CLIENT" as ProjectCategory, status: "CONCEPT" as ProjectStatus, priority: "LOW" as ProjectPriority,
    progress: 30, revenueEarned: 0, revenuePotential: 8500, monthlyRecurring: 500,
    deadline: new Date("2026-07-01"), starred: false, color: "#534AB7",
    tasks: ["Proposal built", "Pricing widget done", "Schedule demo", "Close"]
  },
  {
    name: "AI Implementation Academy",
    description: "Skool platform. 3 courses, 90+ lessons. Founding members $97/mo. Launch in progress.",
    category: "EDUCATION" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "HIGH" as ProjectPriority,
    progress: 70, revenueEarned: 0, revenuePotential: 120000, monthlyRecurring: 0,
    deadline: new Date("2026-05-01"), starred: true, color: "#7c3aed",
    tasks: ["90 lessons built", "3-course structure done", "Intro video script done", "Founding member launch", "Phase 2: price increase"]
  },
  {
    name: "The In-Story Method Book",
    description: "Amazon KDP self-publishing. 6x9 paperback. Full manuscript complete. Ready for upload.",
    category: "EDUCATION" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "HIGH" as ProjectPriority,
    progress: 92, revenueEarned: 0, revenuePotential: 15000, monthlyRecurring: 0,
    deadline: new Date("2026-04-30"), starred: false, color: "#D4537E",
    tasks: ["Full manuscript complete", "Interior formatting done", "Back cover done", "KDP checklist done", "Upload to KDP", "Launch"]
  },
  {
    name: "Nathan's Times Tables Book",
    description: "Children's book 1-16 Times Tables written/illustrated by Nathan. Amazon KDP 8.5x11.",
    category: "EDUCATION" as ProjectCategory, status: "COMPLETED" as ProjectStatus, priority: "LOW" as ProjectPriority,
    progress: 100, revenueEarned: 0, revenuePotential: 2000, monthlyRecurring: 0,
    deadline: new Date("2026-02-01"), starred: false, color: "#E05F00",
    tasks: ["Book complete", "KDP formatted", "Published"]
  },
  {
    name: "TIBLOGICS Website v2",
    description: "This project — new website with TIBS agent, booking system, tools, admin dashboard.",
    category: "INTERNAL" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "CRITICAL" as ProjectPriority,
    progress: 20, revenueEarned: 0, revenuePotential: 0, monthlyRecurring: 0,
    deadline: new Date("2026-05-15"), starred: true, color: "#F47C20",
    tasks: ["Design mockup done", "Master build prompt done", "Next.js setup", "Public website", "Admin dashboard", "Tools", "Booking system", "Deploy"]
  },
  {
    name: "Etsy — The Smart Zone",
    description: "Digital products shop. Notion templates, credit repair tracker ($35). Active.",
    category: "INTERNAL" as ProjectCategory, status: "ACTIVE" as ProjectStatus, priority: "LOW" as ProjectPriority,
    progress: 60, revenueEarned: 0, revenuePotential: 12000, monthlyRecurring: 0,
    deadline: new Date("2026-12-01"), starred: false, color: "#BA7517",
    tasks: ["Shop live", "Credit repair tracker listed", "5 more products", "Marketing"]
  },
];

const BLOG_POSTS = [
  {
    slug: "5-ways-ai-is-helping-small-businesses-cut-costs",
    title: "5 Ways AI Is Helping Small Businesses Cut Costs Without Cutting Corners",
    excerpt: "AI isn't just for enterprise — small businesses that move first are already seeing real savings.",
    category: "ai-business",
    tags: ["ai", "small business", "automation", "cost savings"],
    coverEmoji: "💼",
    coverGradient: "from-[#1B3A6B] to-[#2251A3]",
    coverImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    featured: true,
    content: `<p>For years, AI was something you read about in tech news and assumed was built for companies with massive budgets. That story is changing fast — and the businesses winning right now are the ones that moved early.</p>

<h2>1. Automating Customer Follow-Ups</h2>
<p>One of the most common time sinks for small business owners is following up with leads and clients. AI-powered automation tools can send personalized follow-up messages, appointment reminders, and check-in emails automatically — all triggered by actions your customers take. The result: more booked appointments, fewer dropped leads, and hours saved each week.</p>

<h2>2. Handling Repetitive Customer Questions</h2>
<p>If your inbox or front desk regularly fields the same 10 questions, an AI chat assistant can handle those instantly — 24/7, with no wait time. This doesn't replace your team; it frees them to focus on the conversations that actually need a human touch.</p>

<h2>3. Smarter Scheduling and Dispatch</h2>
<p>For service businesses — contractors, healthcare providers, cleaning services — intelligent scheduling tools are eliminating double-bookings, optimizing routes, and reducing no-shows through automated reminders. Some businesses report cutting scheduling time by 70%.</p>

<h2>4. AI-Assisted Proposals and Quotes</h2>
<p>Writing detailed proposals is slow and repetitive. AI tools can now generate first-draft proposals, scope-of-work documents, and pricing breakdowns based on your templates and client inputs — turning a 2-hour task into a 10-minute review.</p>

<h2>5. Data-Backed Decisions Without a Data Team</h2>
<p>AI-powered dashboards can surface insights from your sales data, booking patterns, and customer behavior that used to require a dedicated analyst. Now a solo operator or small team can make the same informed decisions as a much larger business.</p>

<h2>What This Means for Small Businesses</h2>
<p>The playing field is leveling. Every tool listed above is accessible to businesses with 5 employees or 500. The question isn't whether you can afford AI — it's whether you can afford to keep doing things manually while your competitors don't.</p>

<p><strong>Practical takeaway:</strong> Pick one repetitive task that costs your team more than 3 hours a week and ask: could an AI tool handle this? Start there.</p>`,
  },
  {
    slug: "what-is-rag-and-why-your-business-should-care",
    title: "What Is RAG and Why Should Your Business Actually Care?",
    excerpt: "Retrieval-Augmented Generation is the technology making AI actually useful for business-specific knowledge.",
    category: "tips",
    tags: ["rag", "ai", "knowledge base", "llm"],
    coverEmoji: "💡",
    coverGradient: "from-purple-600 to-violet-500",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>You've probably heard people talk about AI hallucinating — making up facts with complete confidence. RAG (Retrieval-Augmented Generation) is the architecture that fixes this, and it's become the backbone of every serious business AI deployment.</p>

<h2>The Problem RAG Solves</h2>
<p>A general-purpose AI model like ChatGPT or Claude is trained on data from the internet up to a certain date. It doesn't know your company's pricing, your internal processes, your client history, or your proprietary documents. Ask it a specific business question and it'll either guess, hallucinate, or tell you it doesn't know.</p>
<p>RAG changes this by connecting the AI to your actual knowledge sources before it answers. Instead of relying on memorized training data, the AI retrieves relevant documents, policies, or records first — then uses them to compose an accurate, grounded answer.</p>

<h2>How It Works (Without the Jargon)</h2>
<p>Think of it like giving an AI a searchable library instead of asking it to memorize everything. When a user asks a question, the system first searches the library for relevant content, hands that content to the AI, and then the AI writes a clear response based on what it found — citing sources it actually has.</p>

<h2>Real Business Applications</h2>
<ul>
<li><strong>Internal knowledge assistant:</strong> Your team can ask questions about policies, SOPs, and client data — and get accurate answers instantly.</li>
<li><strong>Customer support AI:</strong> An AI that answers product questions using your actual documentation, not generic internet knowledge.</li>
<li><strong>Contract and document analysis:</strong> Upload agreements, reports, or research — let the AI summarize, compare, or flag what matters.</li>
<li><strong>Sales enablement:</strong> Give your sales team an AI that knows your products, case studies, and pricing inside out.</li>
</ul>

<h2>What This Means for Small Businesses</h2>
<p>RAG-based AI systems used to require significant engineering resources. That's no longer true. Businesses of all sizes can now deploy AI assistants that know their specific context — making every customer interaction and internal query faster and more accurate.</p>

<p><strong>Practical takeaway:</strong> If you're evaluating AI tools for your business, ask specifically whether they use RAG or connect to your data — not just a general AI model. The difference in usefulness is significant.</p>`,
  },
  {
    slug: "ai-readiness-checklist-is-your-business-ready",
    title: "The AI Readiness Checklist: How to Know If Your Business Is Ready",
    excerpt: "Most businesses aren't held back by AI — they're held back by unclear processes that AI would expose.",
    category: "tips",
    tags: ["ai readiness", "checklist", "strategy", "small business"],
    coverEmoji: "📋",
    coverGradient: "from-teal-600 to-emerald-500",
    coverImage: "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>Before spending a dollar on AI implementation, there's a more important question to answer: is your business actually ready for it? Not in a technical sense — in a process sense. AI amplifies what's already there. If your operations are chaotic, AI makes them chaotically faster.</p>

<h2>The 5 Signs You're Ready</h2>
<ul>
<li><strong>You can describe the problem clearly.</strong> "We want to save time" isn't specific enough. "Our team spends 4 hours a week manually sending follow-up emails" is the kind of clarity AI can act on.</li>
<li><strong>You have some data.</strong> AI needs inputs — customer records, transaction history, interaction logs. You don't need perfect data, but you need something to work with.</li>
<li><strong>Your core process exists (even if it's rough).</strong> AI automates and enhances processes. If the process doesn't exist yet, define it first.</li>
<li><strong>Your team is open to change.</strong> Technology adoption fails when the team resists it. A 30-minute conversation about what AI will and won't do goes a long way.</li>
<li><strong>You know what success looks like.</strong> Time saved? Leads converted? Tickets resolved? Name it before you start so you can measure it after.</li>
</ul>

<h2>The 3 Signs You're Not Quite There</h2>
<ul>
<li>You're hoping AI will fix an organizational problem (communication breakdowns, unclear accountability, trust issues). It won't.</li>
<li>You don't have a repeatable process yet — just individual judgment calls each time.</li>
<li>Your data lives in spreadsheets with inconsistent formatting and no one owns it.</li>
</ul>

<h2>The Honest Middle Ground</h2>
<p>Most businesses fall somewhere between "fully ready" and "not ready at all." That's normal. The right AI implementation partner will help you close those gaps — sometimes the most valuable work happens before a single line of AI code is written.</p>

<h2>What This Means for Small Businesses</h2>
<p>AI readiness isn't a binary — it's a spectrum. The goal isn't to be perfect before starting; it's to be honest about where you are so the implementation plan reflects reality.</p>

<p><strong>Practical takeaway:</strong> Run through this checklist before your next AI conversation. It'll make that conversation 10x more productive.</p>`,
  },
  {
    slug: "from-chatbot-to-ai-agent-the-difference-that-changes-everything",
    title: "From Chatbot to AI Agent: The Difference That Changes Everything",
    excerpt: "A chatbot answers questions. An AI agent takes action. Understanding the difference could reshape how you think about automation.",
    category: "ai-business",
    tags: ["ai agents", "chatbots", "automation", "business ai"],
    coverEmoji: "🤖",
    coverGradient: "from-[#1B3A6B] to-[#2251A3]",
    coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>When most people think of business AI, they picture a chat window in the corner of a website — a bot that answers FAQs and escalates to a human when things get complicated. That's a chatbot, and while useful, it's only a fraction of what AI can do for your business today.</p>

<h2>What a Chatbot Does</h2>
<p>A chatbot is reactive. It waits for a user to ask something, matches the question to a pre-built response or a language model, and replies. It doesn't initiate actions, doesn't connect to other systems (unless explicitly built to), and typically can't carry complex tasks across multiple steps.</p>

<h2>What an AI Agent Does</h2>
<p>An AI agent is proactive and autonomous. It can:</p>
<ul>
<li>Monitor your CRM for leads that haven't been contacted and trigger outreach</li>
<li>Read an incoming email, extract the key information, create a task, and notify the right person</li>
<li>Check inventory levels, identify low stock, and submit a reorder request — all without being asked</li>
<li>Analyze this week's bookings, compare to last month, and generate a summary report</li>
</ul>
<p>Agents connect to your tools (calendars, CRMs, email, databases) and take actions — not just answer questions.</p>

<h2>Why This Matters for Your Business</h2>
<p>The shift from chatbot to agent is the shift from "helpful information" to "work actually getting done." A chatbot reduces inbound support volume. An AI agent eliminates entire categories of manual work.</p>

<h2>What This Means for Small Businesses</h2>
<p>You don't need a 50-person team to deploy AI agents. With the right implementation, a 3-person operation can have AI handling the equivalent of a full-time coordinator's workload.</p>

<p><strong>Practical takeaway:</strong> If you've only explored chatbots, you've only seen the beginning. Ask your next AI conversation partner specifically about agents — what they can automate end-to-end, not just answer.</p>`,
  },
  {
    slug: "workflow-automation-vs-ai-which-do-you-need",
    title: "Workflow Automation vs. AI: What's the Difference and Which Do You Need?",
    excerpt: "Not every business problem needs AI. Sometimes the right answer is smarter automation — and knowing the difference saves you time and money.",
    category: "industry",
    tags: ["automation", "workflow", "ai strategy", "no-code"],
    coverEmoji: "⚙️",
    coverGradient: "from-slate-600 to-gray-500",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>There's a tendency in tech conversations to use "AI" as a catch-all for anything smart or automated. But AI and workflow automation are distinct tools — and choosing the wrong one for a problem costs time, money, and momentum.</p>

<h2>Workflow Automation: Rules-Based, Reliable, Fast</h2>
<p>Workflow automation handles tasks that follow predictable patterns with clear triggers. If a form is submitted → send a confirmation email. If a deal is marked won → create an invoice. If a support ticket isn't resolved in 48 hours → escalate to a manager.</p>
<p>This kind of automation is deterministic: given the same input, you always get the same output. Tools like Zapier, Make, and n8n excel here.</p>
<p><strong>Best for:</strong> Data syncing, notification triggers, form processing, report generation, routine approvals.</p>

<h2>AI: Judgment-Based, Flexible, Context-Aware</h2>
<p>AI comes in where rules break down — where the answer depends on context, nuance, or unstructured data. Classifying customer sentiment. Generating a personalized response. Summarizing a 40-page contract.</p>
<p><strong>Best for:</strong> Content generation, document understanding, customer conversation, complex routing decisions, predictions.</p>

<h2>The Power Move: Combine Both</h2>
<p>A lead comes in → <em>automation</em> captures it and adds it to the CRM → <em>AI</em> scores the lead and drafts a personalized outreach email → <em>automation</em> schedules the send and logs the activity. Neither tool alone would handle the full flow.</p>

<h2>What This Means for Small Businesses</h2>
<p>Start with automation for your most repetitive, rule-based tasks. Layer in AI for anything requiring judgment or language. The combination multiplies efficiency without multiplying cost.</p>

<p><strong>Practical takeaway:</strong> Before any AI project, ask: "Does this task require judgment, or does it just need to happen reliably when X occurs?" If the latter — automation is your answer.</p>`,
  },
  {
    slug: "ai-implementation-gone-wrong-4-mistakes",
    title: "AI Implementation Gone Wrong: 4 Mistakes That Derail Business AI Projects",
    excerpt: "Most AI projects don't fail because of the technology. They fail because of what happens before the technology is ever touched.",
    category: "case-studies",
    tags: ["ai implementation", "mistakes", "strategy", "lessons learned"],
    coverEmoji: "📊",
    coverGradient: "from-[#F47C20] to-yellow-500",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>After working on AI implementations across industries — healthcare, logistics, education, retail — patterns emerge. The technology almost never causes failure. What causes failure is more predictable, and more preventable, than most people expect.</p>

<h2>Mistake 1: Solving the Wrong Problem</h2>
<p>A restaurant chain wanted AI to "improve customer experience." After three months and significant budget, they had a chatbot that answered menu questions. Customer satisfaction barely moved. The actual problem — slow kitchen communication causing order errors — never got addressed.</p>
<p>The fix: Spend time defining the problem with specificity before selecting any solution.</p>

<h2>Mistake 2: Skipping the Data Conversation</h2>
<p>A healthcare provider wanted an AI assistant that could answer questions about patient history. The build started. Then someone asked: where does the patient data live? Turns out it was spread across three legacy systems, inconsistently formatted, and partially paper-based. The project stalled for months.</p>
<p>The fix: Before any AI project, audit your data. Where is it? How clean is it? Who owns it?</p>

<h2>Mistake 3: No Internal Champion</h2>
<p>A logistics company deployed a route optimization AI. The operations team never adopted it. Post-mortem revealed the implementation team never worked closely with the drivers or their managers.</p>
<p>The fix: Identify an internal champion early — someone who believes in the project and can advocate for adoption among their peers.</p>

<h2>Mistake 4: Expecting Perfection on Day One</h2>
<p>AI systems improve with use. A first deployment that's 80% effective and gets refined over 90 days will outperform a "perfect" system that never launches.</p>
<p>The fix: Define a "good enough to launch" threshold. Get it live, measure it, and iterate.</p>

<h2>What This Means for Small Businesses</h2>
<p>Small businesses are actually at an advantage here — less bureaucracy means faster course correction. The key is being intentional about these four areas before starting.</p>

<p><strong>Practical takeaway:</strong> Use this list as a pre-project checklist. If you can't answer the problem, data, champion, and launch-threshold questions clearly — you're not ready to start building yet.</p>`,
  },
  {
    slug: "top-ai-tools-transforming-business-operations-2025",
    title: "The Top AI Tools Transforming Business Operations in 2025",
    excerpt: "From document intelligence to autonomous agents, these are the tools reshaping how businesses actually operate.",
    category: "tools",
    tags: ["ai tools", "productivity", "business software", "automation"],
    coverEmoji: "🔧",
    coverGradient: "from-teal-600 to-emerald-500",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>The AI tools market has matured rapidly. Two years ago, most businesses were experimenting with basic chatbots. Today, the tools available to even small businesses would have seemed like enterprise-only capabilities just 18 months ago.</p>

<h2>Document Intelligence: AI That Reads So You Don't Have To</h2>
<p>One of the highest-ROI categories right now. Tools in this space can extract structured data from invoices, contracts, and forms; summarize long reports; flag anomalies in documents; and compare agreements side by side.</p>
<p><strong>What to look for:</strong> Accuracy on your document types, ability to handle multiple formats (PDF, image, email), and integration with your existing storage or CRM.</p>

<h2>AI-Powered Customer Communication</h2>
<p>Beyond simple chatbots, the new generation of AI communication tools can handle multi-turn conversations, escalate intelligently to humans, draft and send emails based on triggers, and maintain conversation context across channels.</p>

<h2>Workflow and Process Automation Platforms</h2>
<p>AI has fundamentally upgraded no-code automation. Modern platforms can ingest unstructured inputs (an email, a form submission, a voice note), interpret intent, and trigger the right action in the right system.</p>

<h2>Analytics and Business Intelligence</h2>
<p>AI-powered BI tools can now answer natural language questions about your data, surface anomalies automatically, and generate narrative summaries of performance reports — no SQL or data analyst required.</p>

<h2>What This Means for Small Businesses</h2>
<p>The tooling is here. What most small businesses still lack is implementation — someone who understands their specific context and can configure these tools to actually solve their problems.</p>

<p><strong>Practical takeaway:</strong> Map your biggest time sinks and recurring pain points first, then find tools that address those specific bottlenecks — not the most impressive demo.</p>`,
  },
  {
    slug: "ai-regulation-what-business-owners-need-to-know",
    title: "AI Regulation Is Coming: What Business Owners Need to Know Now",
    excerpt: "Governments worldwide are moving on AI rules. Here's what's changing and what it means for your business — without the legal jargon.",
    category: "breaking",
    tags: ["ai regulation", "compliance", "policy", "business"],
    coverEmoji: "⚡",
    coverGradient: "from-red-600 to-orange-500",
    coverImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>For the past two years, AI regulation has been a policy discussion. In 2025, it's becoming operational reality. Whether you're a small business using AI tools or building AI-powered products, the regulatory environment is shifting in ways that affect your decisions today.</p>

<h2>What's Actually Happening</h2>
<p>The EU AI Act — the world's first comprehensive AI regulatory framework — is now in phased implementation. In the United States, sector-specific guidance is emerging from the FTC, HHS (for healthcare AI), and NIST. Several US states have passed or are passing their own AI transparency and bias requirements.</p>
<p>The core themes across nearly all frameworks: transparency, accountability, and fairness.</p>

<h2>What High-Risk Means for You</h2>
<p>Regulations apply most strictly to AI used in hiring decisions, credit decisions, medical diagnosis, law enforcement, or critical infrastructure. Lower-risk uses (marketing personalization, internal productivity tools, content generation) face lighter requirements.</p>

<h2>The Practical Steps Right Now</h2>
<ul>
<li><strong>Inventory your AI use.</strong> Know every AI tool your business uses and what decisions it influences.</li>
<li><strong>Understand your vendors' compliance posture.</strong> Ask what their regulatory compliance roadmap looks like.</li>
<li><strong>Document your AI decision-making.</strong> For any consequential AI-assisted decision, maintain a record of what data was used.</li>
<li><strong>Watch for sector-specific rules.</strong> Healthcare, finance, and HR are moving fastest on AI-specific regulation.</li>
</ul>

<h2>What This Means for Small Businesses</h2>
<p>Most small businesses won't face direct regulatory burden in the near term. But being thoughtful about AI use now builds the foundation for compliance as rules expand, and it builds customer trust regardless of legal requirements.</p>

<p><strong>Practical takeaway:</strong> Being transparent about your AI use and maintaining human oversight of consequential decisions is good practice whether or not you're required to do it yet.</p>`,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.projectTask.deleteMany();
  await prisma.project.deleteMany();

  // Seed admin settings
  await prisma.adminSettings.upsert({
    where: { key: "notification_email" },
    create: { key: "notification_email", value: "ai@tiblogics.com" },
    update: {},
  });
  await prisma.adminSettings.upsert({
    where: { key: "claude_model" },
    create: { key: "claude_model", value: "claude-sonnet-4-20250514" },
    update: {},
  });
  await prisma.adminSettings.upsert({
    where: { key: "booking_buffer_minutes" },
    create: { key: "booking_buffer_minutes", value: "30" },
    update: {},
  });

  // Seed projects
  for (const p of PROJECTS) {
    const { tasks, ...projectData } = p;
    const project = await prisma.project.create({
      data: projectData,
    });
    // Create tasks
    for (let i = 0; i < tasks.length; i++) {
      await prisma.projectTask.create({
        data: {
          projectId: project.id,
          text: tasks[i],
          done: false,
          order: i,
        },
      });
    }
    console.log(`✅ Created project: ${project.name}`);
  }

  // Remove stale AI-generated posts (old articles from external APIs like HN/DEV.to)
  const deleted = await prisma.blogPost.deleteMany({ where: { aiGenerated: true } });
  console.log(`🗑️  Removed ${deleted.count} stale AI-generated posts`);

  // Seed blog posts (upsert by slug first)
  for (let idx = 0; idx < BLOG_POSTS.length; idx++) {
    const bp = BLOG_POSTS[idx];
    await prisma.blogPost.upsert({
      where: { slug: bp.slug },
      create: {
        slug: bp.slug,
        title: bp.title,
        excerpt: bp.excerpt,
        content: bp.content,
        category: bp.category,
        tags: bp.tags,
        coverEmoji: bp.coverEmoji,
        coverGradient: bp.coverGradient,
        coverImage: bp.coverImage,
        author: "TIBLOGICS Editorial",
        readingTime: Math.ceil(bp.content.replace(/<[^>]*>/g, "").split(" ").length / 200),
        featured: idx === 0,
        published: true,
        aiGenerated: false,
      },
      update: {
        coverImage: bp.coverImage,
        coverEmoji: bp.coverEmoji,
        coverGradient: bp.coverGradient,
        published: true,
      },
    });
    console.log(`✅ Blog post: ${bp.title}`);
  }

  // Patch any posts still missing coverImage with a category-based Unsplash image
  const CATEGORY_COVER: Record<string, string> = {
    "breaking":     "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    "ai-business":  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    "tips":         "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    "tools":        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "case-studies": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    "industry":     "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
  };
  const noCover = await prisma.blogPost.findMany({ where: { coverImage: null }, select: { id: true, category: true } });
  for (const p of noCover) {
    await prisma.blogPost.update({
      where: { id: p.id },
      data: { coverImage: CATEGORY_COVER[p.category] ?? CATEGORY_COVER["industry"] },
    });
  }
  if (noCover.length) console.log(`🖼️  Patched cover images on ${noCover.length} posts`);

  // Deduplicate: keep the curated post when titles collide, remove extras
  const allPosts = await prisma.blogPost.findMany({
    orderBy: [{ aiGenerated: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, aiGenerated: true },
  });
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const p of allPosts) {
    const key = p.title.toLowerCase().replace(/\s+/g, " ").slice(0, 60);
    if (seen.has(key)) dupes.push(p.id);
    else seen.add(key);
  }
  if (dupes.length) {
    await prisma.blogPost.deleteMany({ where: { id: { in: dupes } } });
    console.log(`🗑️  Removed ${dupes.length} duplicate posts`);
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
