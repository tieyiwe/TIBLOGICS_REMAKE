// Extracted from app/api/blog/auto-refresh/route.ts.
//
// That route was 3,258 lines, of which 2,546 were this content. The logic it
// actually performs is a few hundred lines and was impossible to review with
// a thousand lines of article prose sitting in the middle of it. Moving the
// data out changes nothing at runtime; it just makes the route readable.

export const CATEGORY_TOPIC_BANK: Record<string, string[]> = {
  // Deliberately empty. Breaking news has to come from a real, current source
  // (the agent pulls those from Hacker News and DEV.to). This pool used to hold
  // twenty pre-written "breaking" headlines — o3, Gemini 2.0 Flash, Llama 4 —
  // which the agent published as today's news whenever real news ran short, a
  // year or more after the fact, and some stated market figures ("AI trading
  // now controls 70% of volume") with nothing behind them.
  "breaking": [],
  "ai-business": [
    "How to Build an AI-Powered Lead Qualification System Without a CRM Upgrade",
    "AI for Accounts Receivable: Cutting Payment Delays and Chasing Invoices Automatically",
    "Building an AI Employee Onboarding System That Works While You Sleep",
    "How AI Is Transforming Customer Retention for Subscription Businesses",
    "AI Competitive Intelligence: How Small Businesses Track Rivals Without a Research Team",
    "Using AI to Write Better Proposals and Win More Business",
    "AI-Powered Performance Reviews: Saving HR Time While Improving Consistency",
    "How AI Is Changing Pricing Strategy for Small and Mid-Sized Businesses",
    "Using AI to Manage and Triage Business Email at Scale",
    "How to Build a Revenue Intelligence System With AI and Your Existing CRM",
    "AI for Business Development: Finding and Qualifying Opportunities Faster",
    "The AI Customer Success Stack: Tools That Reduce Churn Without Adding Headcount",
    "How AI Is Eliminating the Weekly Status Meeting",
    "AI-Generated Business Reports: Getting Weekly Insights Without Weekly Labor",
    "Using AI to Systemize and Document Your Business Processes",
  ],
  "tips": [
    "The 5 Prompt Patterns That Produce Consistently Better Business AI Output",
    "How to Build a Personal AI Assistant Using Claude Projects",
    "The AI Workflow Stack Every Freelancer Should Have Running by Next Week",
    "How to Use Perplexity AI to Research Competitors in Under 10 Minutes",
    "Building a Daily AI Briefing That Keeps You Current Without the Noise",
    "How to Evaluate Any AI Tool in 30 Minutes Before Committing",
    "Writing System Prompts That Make Your AI Consistent and On-Brand",
    "How to Use AI to Produce a Month of Content in a Single Afternoon",
    "The Anti-Hallucination Checklist: Verifying AI Output Before You Use It",
    "How to Introduce AI Tools to a Skeptical Team Without Losing Buy-In",
    "Building a Prompt Library Your Whole Team Can Use and Trust",
    "How to Use AI to Speed Up Your Weekly Reporting",
    "Getting Consistent AI Results: The Role Task Context Constraint Framework",
    "How to Automate Your Most Time-Consuming Business Task This Week",
    "AI Output Editing: The Fast Workflow That Makes AI Writing Sound Human",
  ],
  "tools": [
    "Notion AI vs. Coda AI: Which Document Intelligence Tool Wins for Small Teams?",
    "The Best AI Tools for Business Writing in 2026: An Honest Comparison",
    "AI Legal Research Tools That Help Non-Lawyers Navigate Contracts",
    "Descript vs. Otter.ai vs. Fireflies: Which Meeting AI Is Worth Paying For?",
    "The Best AI Image Generation Tools for Business Marketing in 2026",
    "HubSpot AI Features vs. Zoho Zia: Which CRM AI Actually Helps Sales?",
    "AI Bookkeeping Tools That Handle the Work Your Accountant Bills You For",
    "The Best Free AI Tools for Small Business Owners Right Now",
    "Canva AI vs. Adobe Firefly: Which Design AI Delivers More for Non-Designers?",
    "AI Social Media Tools That Actually Save Time and Maintain Brand Voice",
    "Make vs. Zapier in 2026: Which Automation Platform Has Pulled Ahead?",
    "The Best AI Writing Assistants for Email and Business Communication",
    "AI Proposal and Quoting Tools for Service Businesses",
    "Google NotebookLM for Business: Building a Queryable Knowledge Base for Free",
    "Voice AI for Business: Tools That Handle Calls and Meetings Intelligently",
  ],
  // Playbooks, not case studies. These were fifteen success stories with the
  // result already in the headline ("Reduced No-Shows by 60 Percent"), so the
  // agent had to invent a company and results to fit each one, and published
  // them under the TIBLOGICS name. Real case studies need a real client; until
  // there is one, the category explains how to approach the problem honestly.
  "case-studies": [
    "AI Scheduling for Clinics: What It Can Realistically Do About No-Shows",
    "Using an AI Pre-Screener to Qualify Real Estate Leads: A Practical Playbook",
    "AI Route Optimization for Small Trucking Fleets: Where the Savings Come From",
    "AI Personalization for E-Commerce Email: What to Test First",
    "Speeding Up Construction Bid Preparation With AI: A Step-by-Step Approach",
    "Automating Patient Communications in a Dental Practice: What to Automate and What Not To",
    "AI-Assisted Contract Review for Small Law Firms: A Safe Way to Start",
    "Handling Customer Inquiries With an AI Agent: A Playbook for Logistics Businesses",
    "AI Tutoring for Training Companies: How to Measure Whether It Actually Helps",
    "Automating Compliance Reporting in HR Consulting: Where AI Fits",
    "Predicting Member Churn With AI: What a Gym Needs Before It Starts",
    "Scaling Logistics Operations Without New Hires: Where AI Agents Help",
    "Preparing Client Reports With AI in Financial Advice: Keeping Quality and Compliance",
    "AI-Personalized Offers for Boutique Hotels: A Guide to Direct Bookings",
    "AI Resume Screening in Recruiting: Faster Hiring Without Unfair Filters",
  ],
  "industry": [
    "The State of AI Adoption in Professional Services: 2026 Benchmarks",
    "How AI Is Reshaping the Future of Remote and Hybrid Work",
    "AI in Retail: From Inventory Optimization to Personalized Shopping Experiences",
    "The AI Skills Gap Is Growing: What Business Leaders Must Do in the Next 12 Months",
    "How AI Is Transforming the Healthcare Revenue Cycle",
    "AI and Cybersecurity: How Businesses Are Fighting AI-Powered Attacks With AI",
    "The Rise of Agentic AI: What's Actually Deployed vs. What's Still Hype",
    "AI in Financial Services: The Tools That Are Changing How Money Moves",
    "How AI Is Disrupting the Insurance Industry From Claims to Customer Experience",
    "The Creator Economy and AI: New Business Models Emerging From the Shift",
    "AI in Real Estate: How Agents Brokers and Developers Are Adapting",
    "How AI Is Changing Supply Chain Resilience for Mid-Market Businesses",
    "The Impact of AI on Customer Expectations: The New Service Standard",
    "AI and the Future of Professional Learning and Development",
    "How African Businesses Are Leapfrogging Legacy Systems With AI-First Operations",
    "How AI Is Reshaping Stock Market Analysis and Portfolio Management in 2026",
    "AI and the Global Economy: What Labor Market Data Is Telling Us About Automation",
    "The AI Wealth Gap: How Artificial Intelligence Is Concentrating Economic Power",
    "How AI Is Changing Inflation Forecasting and Monetary Policy for Central Banks",
    "AI and Trade: How Tariff Modeling and Supply Chain AI Are Reshaping Global Commerce",
  ],
};

// Frontier tech beyond AI software: chips, quantum, robotics, space, biotech,
// energy, spatial computing, networks. Evergreen explainers only (no dated
// claims in the headline), each written with a "what it means for businesses
// and people" angle. The agent still has to verify any fact it states.
CATEGORY_TOPIC_BANK["advanced-tech"] = [
  "AI Chips Explained: GPUs, TPUs and Custom Silicon, and Why They Decide What AI Costs You",
  "Why Chip Manufacturing Is So Hard: Fabs, Lithography and the Supply Chain Behind Every Device",
  "Quantum Computing in Plain English: What It Can Do, What It Cannot, and When It Matters for Business",
  "Post-Quantum Cryptography: Why Your Encryption Needs an Upgrade Plan Before Quantum Computers Arrive",
  "Humanoid Robots: What They Can Actually Do Today and Where They Will Show Up First",
  "Warehouse and Factory Robotics: How Automation Is Changing Logistics for Mid-Sized Businesses",
  "Self-Driving Cars and Robotaxis: How Autonomy Levels Work and What They Mean for Transport Businesses",
  "Commercial Drones: Delivery, Agriculture and Inspection Use Cases That Already Pay Off",
  "Satellite Internet Explained: How Low-Earth-Orbit Networks Are Connecting Remote Regions",
  "The New Space Economy: How Cheaper Launches Are Creating Opportunities on the Ground",
  "Biotech Meets AI: How Protein Design and Drug Discovery Models Are Changing Medicine",
  "Health Tech Wearables: What Continuous Monitoring Means for Patients, Clinics and Insurers",
  "Battery Technology Explained: Lithium-Ion, Sodium-Ion and Solid-State, and Why It Matters for EVs and Solar",
  "Fusion Energy in Plain English: Where It Really Stands and What It Would Change",
  "Grid AI: How Utilities Use Smart Software to Balance Solar, Wind and Data Center Demand",
  "AR, VR and Spatial Computing: Practical Business Uses Beyond the Headset Hype",
  "6G and the Future of Networks: What Comes After 5G and Why Businesses Should Care",
  "Brain-Computer Interfaces: How They Work, Who They Help, and the Privacy Questions They Raise",
  "Cybersecurity at the Frontier: Deepfakes, AI-Driven Attacks and the Defenses That Work",
  "Edge Computing and On-Device AI: Why More Processing Is Moving Out of the Cloud",
];

export const CATEGORY_META: Record<string, { emoji: string; gradient: string }> = {
  "breaking":    { emoji: "⚡", gradient: "from-red-600 to-orange-500" },
  "ai-business": { emoji: "💼", gradient: "from-[#1B3A6B] to-[#2251A3]" },
  "tips":        { emoji: "💡", gradient: "from-purple-600 to-violet-500" },
  "tools":       { emoji: "🔧", gradient: "from-teal-600 to-emerald-500" },
  "case-studies":{ emoji: "📊", gradient: "from-[#F47C20] to-yellow-500" },
  "industry":    { emoji: "🌐", gradient: "from-slate-600 to-gray-500" },
  "advanced-tech": { emoji: "🚀", gradient: "from-indigo-700 to-cyan-500" },
};
