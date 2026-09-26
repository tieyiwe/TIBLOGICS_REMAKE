import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Pre-written seed articles — no Claude API required.
// One article per category so the blog is never empty on first production load.
const QUICK_SEEDS = [
  {
    title: "5 Ways AI Is Helping Small Businesses Cut Costs Without Cutting Corners",
    excerpt: "AI isn't just for enterprise — small businesses that move first are already seeing real savings.",
    category: "ai-business",
    tags: ["ai", "small business", "automation", "cost savings"],
    coverEmoji: "💼",
    coverGradient: "from-[#1B3A6B] to-[#2251A3]",
    coverImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    featured: true,
    content: `<p>For years, AI was something you read about in tech news and assumed was built for companies with massive budgets. That story is changing fast — and the businesses winning right now are the ones that moved early.</p><h2>1. Automating Customer Follow-Ups</h2><p>One of the most common time sinks for small business owners is following up with leads and clients. AI-powered automation tools can send personalized follow-up messages, appointment reminders, and check-in emails automatically — all triggered by actions your customers take.</p><h2>2. Handling Repetitive Customer Questions</h2><p>If your inbox or front desk regularly fields the same 10 questions, an AI chat assistant can handle those instantly — 24/7, with no wait time.</p><h2>3. Smarter Scheduling</h2><p>For service businesses, intelligent scheduling tools are eliminating double-bookings, optimizing routes, and reducing no-shows through automated reminders.</p><h2>4. AI-Assisted Proposals</h2><p>AI tools can now generate first-draft proposals, scope-of-work documents, and pricing breakdowns — turning a 2-hour task into a 10-minute review.</p><h2>What This Means for Small Businesses</h2><p>The playing field is leveling. The question isn't whether you can afford AI — it's whether you can afford to keep doing things manually while your competitors don't.</p><p><strong>Practical takeaway:</strong> Pick one repetitive task that costs your team more than 3 hours a week and ask: could an AI tool handle this?</p>`,
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
    content: `<p>You've probably heard people talk about AI hallucinating — making up facts with complete confidence. RAG (Retrieval-Augmented Generation) is the architecture that fixes this.</p><h2>The Problem RAG Solves</h2><p>A general-purpose AI model like ChatGPT or Claude doesn't know your company's pricing, your internal processes, or your client history. RAG connects the AI to your actual knowledge sources before it answers.</p><h2>How It Works</h2><p>Think of it like giving an AI a searchable library. When a user asks a question, the system retrieves relevant documents first, then the AI writes a response based on what it found.</p><h2>Real Business Applications</h2><ul><li><strong>Internal knowledge assistant:</strong> Your team gets accurate answers instantly.</li><li><strong>Customer support AI:</strong> Answers product questions using your actual documentation.</li><li><strong>Contract analysis:</strong> Upload agreements — let the AI summarize and flag what matters.</li></ul><h2>What This Means for Small Businesses</h2><p>Businesses of all sizes can now deploy AI assistants that know their specific context — making every customer interaction faster and more accurate.</p>`,
  },
  {
    title: "From Chatbot to AI Agent: The Difference That Changes Everything",
    excerpt: "A chatbot answers questions. An AI agent takes action. Understanding the difference reshapes how you think about automation.",
    category: "breaking",
    tags: ["ai agents", "chatbots", "automation", "business ai"],
    coverEmoji: "⚡",
    coverGradient: "from-red-600 to-orange-500",
    coverImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>When most people think of business AI, they picture a chat window in the corner of a website — a bot that answers FAQs. That's a chatbot, and while useful, it's only a fraction of what AI can do for your business today.</p><h2>What a Chatbot Does</h2><p>A chatbot is reactive. It waits for a user to ask something, matches the question to a response, and replies. It doesn't initiate actions or connect to other systems.</p><h2>What an AI Agent Does</h2><p>An AI agent is proactive and autonomous. It can monitor your CRM for uncontacted leads, read an incoming email and create a task, check inventory levels and submit reorder requests — all without being asked.</p><h2>Why This Matters</h2><p>The shift from chatbot to agent is the shift from "helpful information" to "work actually getting done." A chatbot reduces inbound support volume. An AI agent eliminates entire categories of manual work.</p><h2>What This Means for Small Businesses</h2><p>You don't need a 50-person team to deploy AI agents. With the right implementation, a 3-person operation can have AI handling the equivalent of a full-time coordinator's workload.</p>`,
  },
  {
    title: "The AI Tools Actually Worth Your Attention Right Now",
    excerpt: "From document intelligence to autonomous agents, these are the tools reshaping how businesses actually operate.",
    category: "tools",
    tags: ["ai tools", "productivity", "business software", "automation"],
    coverEmoji: "🔧",
    coverGradient: "from-teal-600 to-emerald-500",
    coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>The AI tools market has matured rapidly. Two years ago, most businesses were experimenting with basic chatbots. Today, the tools available to even small businesses would have seemed enterprise-only not long ago.</p><h2>Document Intelligence</h2><p>Tools in this space extract structured data from invoices, contracts, and forms; summarize long reports; and compare agreements side by side. For businesses handling any volume of paperwork, this alone can save dozens of hours per week.</p><h2>AI-Powered Customer Communication</h2><p>The new generation of AI communication tools handle multi-turn conversations, escalate intelligently to humans, draft and send emails based on triggers, and maintain context across channels.</p><h2>Workflow Automation Platforms</h2><p>AI has fundamentally upgraded no-code automation. Modern platforms can ingest unstructured inputs — an email, a form, a voice note — interpret intent, and trigger the right action in the right system.</p><h2>What This Means for Small Businesses</h2><p>The tooling is here. What most small businesses still lack is implementation — someone who understands their specific context and can configure these tools to actually solve their problems.</p>`,
  },
  {
    title: "How a Small Law Firm Reduced Contract Review Time by 80% With AI",
    excerpt: "A three-attorney firm was spending 40% of billable hours on contract review. AI cut that to under 10% — without changing what clients paid.",
    category: "case-studies",
    tags: ["legal", "ai", "contract review", "case study"],
    coverEmoji: "📊",
    coverGradient: "from-[#F47C20] to-yellow-500",
    coverImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>A three-attorney immigration and business law firm was facing a familiar problem: a disproportionate amount of time spent on contract review — reading, flagging issues, comparing drafts, and summarizing key terms for clients.</p><h2>The Problem</h2><p>Contract review for a single commercial lease agreement could take three to four hours. The founding partner estimated that 40% of her billable time fell into this category.</p><h2>The Implementation</h2><p>The firm implemented an AI contract review system that could ingest PDF and Word agreements and produce a structured analysis — clause-by-clause summary, flagged non-standard provisions, missing standard protections, and a plain-English client summary.</p><h2>The Results</h2><p>Within 60 days, a commercial lease that previously took four hours now took 45 minutes. Across the firm's monthly volume, this translated to roughly 60 recovered attorney hours per month.</p><h2>What This Means for Small Businesses</h2><p>Professional service firms often assume AI isn't applicable to their work because it requires judgment. The reality is that much of the time consumed is pattern-matching and documentation — exactly what AI handles best.</p>`,
  },
  {
    title: "The State of AI Adoption in Professional Services: 2026 Benchmarks",
    excerpt: "New data on how law firms, consultancies, and accounting practices are deploying AI — and what separates early leaders from laggards.",
    category: "industry",
    tags: ["ai adoption", "professional services", "benchmarks", "industry trends"],
    coverEmoji: "🌐",
    coverGradient: "from-slate-600 to-gray-500",
    coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    featured: false,
    content: `<p>AI adoption in professional services has crossed the early-adopter phase. As of mid-2026, the question is no longer whether to adopt AI, but how fast and how deep.</p><h2>Where Adoption Is Happening</h2><p>Document review, research summarization, and client communication drafting are the three highest-adoption use cases across legal, accounting, and consulting. Together, they account for more than 60% of professional services AI deployments.</p><h2>The Productivity Gap</h2><p>Firms in the top quartile of AI adoption report 35–50% faster turnaround on routine deliverables compared to non-adopters. The gap is widening, not narrowing — early movers are compounding their advantage as they iterate.</p><h2>What's Holding Back Laggards</h2><p>The two most common blockers: concerns about data privacy and a lack of clear internal ownership for AI initiatives. Both are solvable with planning, but they require executive commitment to solve.</p><h2>What This Means for Small Businesses</h2><p>In professional services, AI is moving from competitive advantage to table stakes. Firms that haven't started yet are not in a neutral position — they're falling behind firms that started 12–18 months ago.</p>`,
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function POST() {
  try {
    const existingTitles = new Set(
      (await prisma.blogPost.findMany({ select: { title: true } }))
        .map((p) => p.title.toLowerCase())
    );

    let inserted = 0;
    let skipped = 0;

    for (const seed of QUICK_SEEDS) {
      if (existingTitles.has(seed.title.toLowerCase())) {
        skipped++;
        continue;
      }

      const base = slugify(seed.title);
      let slug = base;
      let i = 1;
      while (await prisma.blogPost.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
      }

      await prisma.blogPost.create({
        data: {
          slug,
          title: seed.title,
          excerpt: seed.excerpt,
          content: seed.content,
          category: seed.category,
          tags: seed.tags,
          coverEmoji: seed.coverEmoji,
          coverGradient: seed.coverGradient,
          coverImage: seed.coverImage,
          author: "TIBLOGICS Editorial",
          readingTime: Math.ceil(seed.content.replace(/<[^>]*>/g, "").split(" ").length / 200),
          featured: seed.featured,
          published: true,
          aiGenerated: false,
        },
      });
      inserted++;
    }

    return NextResponse.json({ ok: true, inserted, skipped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/blog/seed]", msg);
    // Surface the real error so we can diagnose
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
