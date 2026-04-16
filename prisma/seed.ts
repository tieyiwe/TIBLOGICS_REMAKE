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
