export const maxDuration = 120;
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { streamChat } from "@/lib/claude";

const REFRESH_INTERVAL_MS = 72 * 60 * 60 * 1000; // 72 hours (3 days)

const AI_KEYWORDS = [
  "ai", "llm", "gpt", "claude", "gemini", "machine learning", "openai",
  "anthropic", "neural", "artificial intelligence", "chatgpt", "mistral",
  "generative", "transformer", "langchain", "agent", "rag",
];

const CATEGORY_IMAGES: Record<string, string[]> = {
  "breaking": [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
  ],
  "ai-business": [
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1664575602276-acd073f104c1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
  ],
  "tips": [
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b6f6d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
  ],
  "tools": [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
  ],
  "case-studies": [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80",
  ],
  "industry": [
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=800&q=80",
  ],
};

let _imageCounters: Record<string, number> = {};
function pickUniqueImage(category: string): string {
  const pool = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES["industry"];
  const idx = (_imageCounters[category] ?? 0) % pool.length;
  _imageCounters[category] = idx + 1;
  return pool[idx];
}

const CATEGORY_META: Record<string, { emoji: string; gradient: string }> = {
  "breaking":    { emoji: "⚡", gradient: "from-red-600 to-orange-500" },
  "ai-business": { emoji: "💼", gradient: "from-[#1B3A6B] to-[#2251A3]" },
  "tips":        { emoji: "💡", gradient: "from-purple-600 to-violet-500" },
  "tools":       { emoji: "🔧", gradient: "from-teal-600 to-emerald-500" },
  "case-studies":{ emoji: "📊", gradient: "from-[#F47C20] to-yellow-500" },
  "industry":    { emoji: "🌐", gradient: "from-slate-600 to-gray-500" },
};

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  time: number;
}

interface DevArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  tag_list: string[];
}

function isAIRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}

async function fetchHackerNews(): Promise<HNStory[]> {
  try {
    const topIds: number[] = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { signal: AbortSignal.timeout(8000) }
    ).then((r) => r.json());

    const stories = await Promise.all(
      topIds.slice(0, 60).map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(5000),
        })
          .then((r) => r.json())
          .catch(() => null)
      )
    );

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    return stories
      .filter((s): s is HNStory => s && s.title && isAIRelated(s.title) && s.time > thirtyDaysAgo)
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchDevTo(): Promise<DevArticle[]> {
  try {
    const articles: DevArticle[] = await fetch(
      "https://dev.to/api/articles?tag=ai&per_page=10&top=2",
      { signal: AbortSignal.timeout(8000) }
    ).then((r) => r.json());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return articles
      .filter((a) => isAIRelated(a.title) && a.published_at > thirtyDaysAgo)
      .slice(0, 5);
  } catch {
    return [];
  }
}

async function generatePost(
  title: string,
  sourceUrl: string | undefined,
  sourceTitle: string
): Promise<{ excerpt: string; content: string; category: string; tags: string[] }> {
  const prompt = `Write an informative, engaging blog post for TIBLOGICS (an AI agency blog) based on this news:

Title: "${title}"
Source: ${sourceTitle}

Requirements:
- 450-600 words
- Start with a compelling opening sentence (no "Introduction" heading)
- Use 3-4 subheadings (## format)
- Include a "What This Means for Small Businesses" section
- End with a practical takeaway
- Tone: expert but accessible, no jargon without explanation
- Include HTML formatting: <h2>, <p>, <ul>, <li>, <strong>

Also determine:
- category: one of [breaking, ai-business, tips, tools, case-studies, industry]
- tags: 3-5 relevant lowercase tags as JSON array
- excerpt: 1 compelling sentence (max 160 chars)

Return a JSON object:
{
  "excerpt": "...",
  "content": "<h2>...</h2><p>...</p>...",
  "category": "...",
  "tags": ["...", "..."]
}`;

  try {
    const raw = await streamChat(
      [{ role: "user", content: prompt }],
      "You are a professional AI technology journalist writing for an AI agency blog. Write engaging, accurate, practical content.",
      900
    );
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      excerpt: `${title} — the latest development in AI worth knowing about.`,
      content: `<p>${title}</p>`,
      category: "industry",
      tags: ["ai", "technology"],
    };
  }
}

const SEED_POSTS = [
  {
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
<p>For a healthcare business: an agent schedules appointments, sends reminders, follows up on missed visits, and flags high-risk patients for a nurse's review — all automatically.<br/>
For a logistics company: an agent tracks shipments, updates clients, escalates delays, and reconciles invoices without anyone touching a spreadsheet.</p>

<h2>What This Means for Small Businesses</h2>
<p>You don't need a 50-person team to deploy AI agents. With the right implementation, a 3-person operation can have AI handling the equivalent of a full-time coordinator's workload.</p>

<p><strong>Practical takeaway:</strong> If you've only explored chatbots, you've only seen the beginning. Ask your next AI conversation partner specifically about agents — what they can automate end-to-end, not just answer.</p>`,
  },
  {
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
<p>This kind of automation is deterministic: given the same input, you always get the same output. Tools like Zapier, Make, and n8n excel here. It's fast to implement, easy to debug, and highly reliable.</p>
<p><strong>Best for:</strong> Data syncing, notification triggers, form processing, report generation, routine approvals.</p>

<h2>AI: Judgment-Based, Flexible, Context-Aware</h2>
<p>AI comes in where rules break down — where the answer depends on context, nuance, or unstructured data. Classifying customer sentiment in a support email. Generating a personalized response to a complex inquiry. Deciding which sales rep should get a lead based on a dozen factors. Summarizing a 40-page contract.</p>
<p>AI doesn't follow if-then rules — it applies judgment trained on patterns. That makes it powerful for ambiguous, variable, or language-heavy tasks.</p>
<p><strong>Best for:</strong> Content generation, document understanding, customer conversation, complex routing decisions, predictions.</p>

<h2>The Power Move: Combine Both</h2>
<p>The best implementations use both. A lead comes in → <em>automation</em> captures it and adds it to the CRM → <em>AI</em> scores the lead and drafts a personalized outreach email → <em>automation</em> schedules the send and logs the activity. Neither tool alone would handle the full flow.</p>

<h2>What This Means for Small Businesses</h2>
<p>Start with automation for your most repetitive, rule-based tasks. Layer in AI for anything requiring judgment or language. The combination multiplies efficiency without multiplying cost.</p>

<p><strong>Practical takeaway:</strong> Before any AI project, ask: "Does this task require judgment, or does it just need to happen reliably when X occurs?" If the latter — automation is your answer. It's simpler, cheaper, and often faster to deploy.</p>`,
  },
  {
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
<p>The fix: Spend time defining the problem with specificity before selecting any solution. "Improve X metric by Y amount by automating Z" is a real objective. "Improve customer experience" is not.</p>

<h2>Mistake 2: Skipping the Data Conversation</h2>
<p>A healthcare provider wanted an AI assistant that could answer questions about patient history. The build started. Then someone asked: where does the patient data live? Turns out it was spread across three legacy systems, inconsistently formatted, and partially paper-based. The project stalled for months.</p>
<p>The fix: Before any AI project, audit your data. Where is it? How clean is it? Who owns it? What are the compliance requirements around it?</p>

<h2>Mistake 3: No Internal Champion</h2>
<p>A logistics company deployed a route optimization AI. The operations team never adopted it. Drivers kept using their old methods. The tool sat unused. Post-mortem revealed that the implementation team never worked closely with the drivers or their managers — the people who would actually use it.</p>
<p>The fix: Identify an internal champion early — someone on the team who believes in the project, understands the daily workflow, and can advocate for adoption among their peers.</p>

<h2>Mistake 4: Expecting Perfection on Day One</h2>
<p>AI systems improve with use. A first deployment that's 80% effective and gets refined over 90 days will outperform a "perfect" system that never launches because it's still being perfected.</p>
<p>The fix: Define a "good enough to launch" threshold. Get it live, measure it, and iterate. The feedback loop from real-world use is irreplaceable.</p>

<h2>What This Means for Small Businesses</h2>
<p>Small businesses are actually at an advantage here — less bureaucracy means faster course correction. The key is being intentional about these four areas before starting, not discovering them partway through.</p>

<p><strong>Practical takeaway:</strong> Use this list as a pre-project checklist. If you can't answer the problem, data, champion, and launch-threshold questions clearly — you're not ready to start building yet.</p>`,
  },
  {
    title: "The Top AI Tools Transforming Business Operations in 2025",
    excerpt: "From document intelligence to autonomous agents, these are the tools reshaping how businesses actually operate.",
    category: "tools",
    tags: ["ai tools", "productivity", "business software", "automation"],
    coverEmoji: "🔧",
    coverGradient: "from-teal-600 to-emerald-500",
    coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>The AI tools market has matured rapidly. Two years ago, most businesses were experimenting with basic chatbots. Today, the tools available to even small businesses would have seemed like enterprise-only capabilities just 18 months ago. Here's a practical look at what's actually worth your attention.</p>

<h2>Document Intelligence: AI That Reads So You Don't Have To</h2>
<p>One of the highest-ROI categories right now. Tools in this space can extract structured data from invoices, contracts, and forms; summarize long reports; flag anomalies in documents; and compare agreements side by side. For businesses handling any volume of paperwork — healthcare, legal, real estate, logistics — this alone can save dozens of hours per week.</p>
<p><strong>What to look for:</strong> Accuracy on your document types, ability to handle multiple formats (PDF, image, email), and integration with your existing storage or CRM.</p>

<h2>AI-Powered Customer Communication</h2>
<p>Beyond simple chatbots, the new generation of AI communication tools can handle multi-turn conversations, escalate intelligently to humans, draft and send emails based on triggers, and maintain conversation context across channels. The difference between a 2022 chatbot and a 2025 AI agent is roughly the difference between a vending machine and a skilled customer service rep.</p>

<h2>Workflow and Process Automation Platforms</h2>
<p>AI has fundamentally upgraded no-code automation. Modern platforms can ingest unstructured inputs (an email, a form submission, a voice note), interpret intent, and trigger the right action in the right system. The "if this, then that" model is being replaced by "understand this, decide what to do, do it."</p>

<h2>Analytics and Business Intelligence</h2>
<p>AI-powered BI tools can now answer natural language questions about your data, surface anomalies automatically, and generate narrative summaries of performance reports. You no longer need to know SQL or hire a data analyst to get insights from your own business data.</p>

<h2>What This Means for Small Businesses</h2>
<p>The tooling is here. What most small businesses still lack is implementation — someone who understands their specific context and can configure these tools to actually solve their problems, rather than adding more software that goes unused.</p>

<p><strong>Practical takeaway:</strong> Don't adopt tools for their own sake. Map your biggest time sinks and recurring pain points first, then find tools that address those specific bottlenecks — not the most impressive demo.</p>`,
  },
  {
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
<p>The core themes across nearly all regulatory frameworks: transparency (people should know when they're interacting with AI), accountability (someone must be responsible for AI decisions), and fairness (AI systems must not discriminate in high-stakes contexts).</p>

<h2>What High-Risk Means for You</h2>
<p>Regulations apply most strictly to "high-risk" AI applications: AI used in hiring decisions, credit decisions, medical diagnosis, law enforcement, or critical infrastructure. If your business uses AI to screen job applicants, evaluate loan applications, or make medical decisions — compliance requirements are already materializing.</p>
<p>Lower-risk uses (marketing personalization, internal productivity tools, content generation) face lighter requirements — mainly around transparency and human oversight.</p>

<h2>The Practical Steps Right Now</h2>
<ul>
<li><strong>Inventory your AI use.</strong> Know every AI tool your business uses and what decisions it influences.</li>
<li><strong>Understand your vendors' compliance posture.</strong> If you're using third-party AI tools, ask what their regulatory compliance roadmap looks like.</li>
<li><strong>Document your AI decision-making.</strong> For any consequential AI-assisted decision, maintain a record of what data was used and how the decision was made.</li>
<li><strong>Watch for sector-specific rules.</strong> Healthcare, finance, and HR are moving fastest on AI-specific regulation.</li>
</ul>

<h2>What This Means for Small Businesses</h2>
<p>Most small businesses won't face direct regulatory burden in the near term — the rules are focused on high-stakes applications and large-scale systems. But being thoughtful about AI use now builds the foundation for compliance as rules expand, and it builds customer trust regardless of legal requirements.</p>

<p><strong>Practical takeaway:</strong> AI compliance isn't just a legal issue — it's a trust issue. Being transparent about your AI use and maintaining human oversight of consequential decisions is good practice whether or not you're required to do it yet.</p>`,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkOnly = searchParams.get("check") === "true";
  const force = searchParams.get("force") === "true";

  try {
    const lastRefreshSetting = await prisma.adminSettings.findUnique({
      where: { key: "blog_last_refresh" },
    });
    const lastRefresh = lastRefreshSetting
      ? new Date(lastRefreshSetting.value)
      : null;
    const needsRefresh =
      force || !lastRefresh || Date.now() - lastRefresh.getTime() > REFRESH_INTERVAL_MS;

    if (checkOnly) {
      return NextResponse.json({
        needsRefresh,
        lastRefresh: lastRefresh?.toISOString() ?? null,
        nextRefresh: lastRefresh
          ? new Date(lastRefresh.getTime() + REFRESH_INTERVAL_MS).toISOString()
          : null,
      });
    }

    if (!needsRefresh) {
      return NextResponse.json({ message: "Content is up to date", postsAdded: 0 });
    }

    let postsAdded = 0;
    const errors: string[] = [];

    // Seed immediately if DB is empty — no external API needed
    const existingCount = await prisma.blogPost.count();
    if (existingCount === 0) {
      for (let idx = 0; idx < SEED_POSTS.length; idx++) {
        const sp = SEED_POSTS[idx];
        try {
          const dupCheck = await prisma.blogPost.findFirst({
            where: { title: { contains: sp.title.slice(0, 50), mode: "insensitive" } },
          });
          if (dupCheck) continue;
          const baseSlug = sp.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 70);
          let slug = baseSlug; let si = 1;
          while (await prisma.blogPost.findUnique({ where: { slug } })) slug = `${baseSlug}-${si++}`;
          await prisma.blogPost.create({
            data: {
              slug,
              title: sp.title,
              excerpt: sp.excerpt,
              content: sp.content,
              category: sp.category,
              tags: sp.tags,
              coverEmoji: sp.coverEmoji,
              coverGradient: sp.coverGradient,
              coverImage: sp.coverImage,
              author: "TIBLOGICS Editorial",
              readingTime: Math.ceil(sp.content.replace(/<[^>]*>/g, "").split(" ").length / 200),
              featured: idx === 0,
              published: true,
              aiGenerated: false,
            },
          });
          postsAdded++;
        } catch { /* skip */ }
      }
    }

    // Then fetch from external sources to add fresh AI-generated posts on top
    const [hnStories, devArticles] = await Promise.all([
      fetchHackerNews(),
      fetchDevTo(),
    ]);

    const sources: Array<{ title: string; url?: string; source: string }> = [
      ...hnStories.map((s) => ({ title: s.title, url: s.url, source: "Hacker News" })),
      ...devArticles.map((a) => ({ title: a.title, url: a.url, source: "DEV.to" })),
    ];

    for (const item of sources.slice(0, 5)) {
      try {
        const existing = await prisma.blogPost.findFirst({
          where: {
            OR: [
              { title: { contains: item.title.slice(0, 50), mode: "insensitive" } },
              ...(item.url ? [{ sourceUrl: item.url }] : []),
            ],
          },
        });
        if (existing) continue;

        const generated = await generatePost(item.title, item.url, item.source);
        const meta = CATEGORY_META[generated.category] ?? CATEGORY_META["industry"];

        const baseSlug = item.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 70);

        let slug = baseSlug;
        let i = 1;
        while (await prisma.blogPost.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${i++}`;
        }

        await prisma.blogPost.create({
          data: {
            slug,
            title: item.title,
            excerpt: generated.excerpt,
            content: generated.content,
            category: generated.category,
            tags: generated.tags,
            coverEmoji: meta.emoji,
            coverGradient: meta.gradient,
            coverImage: pickUniqueImage(generated.category),
            author: "Echelon AI",
            readingTime: Math.ceil(generated.content.replace(/<[^>]*>/g, "").split(" ").length / 200),
            featured: false,
            published: true,
            aiGenerated: true,
            sourceUrl: item.url,
            sourceTitle: item.source,
          },
        });
        postsAdded++;
      } catch (e) {
        errors.push(String(e));
      }
    }

    // Update last refresh timestamp
    await prisma.adminSettings.upsert({
      where: { key: "blog_last_refresh" },
      create: { key: "blog_last_refresh", value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });

    await prisma.blogRefreshLog.create({
      data: {
        success: errors.length === 0,
        postsAdded,
        message: errors.length > 0 ? errors.slice(0, 3).join("; ") : null,
      },
    });

    return NextResponse.json({ message: `Added ${postsAdded} new posts`, postsAdded });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Auto-refresh error:", msg);
    return NextResponse.json({ error: "Refresh failed", detail: msg }, { status: 500 });
  }
}
