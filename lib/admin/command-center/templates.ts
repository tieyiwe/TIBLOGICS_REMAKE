// Project templates: "New project from template" creates the project with
// these task lists and milestones. Due dates are offsets in days from the
// project's start date. Plain data: shown in the client, applied on the server.

export interface TemplateTask {
  title: string;
  /** Days after the project start. */
  due?: number;
  priority?: "urgent" | "high" | "medium" | "low" | "none";
  labels?: string[];
  subtasks?: string[];
  recurrence?: "weekly" | "monthly";
  estimateMinutes?: number;
}

export interface ProjectTemplate {
  key: string;
  name: string;
  description: string;
  category: "CLIENT" | "SAAS" | "EDUCATION" | "INTERNAL";
  color: string;
  goals: string;
  /** Project length in days (sets the deadline). */
  days: number;
  milestones: Array<{ title: string; due: number }>;
  tasks: TemplateTask[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    key: "client_ai",
    name: "Client AI implementation",
    description: "Discovery, pilot and handover of an AI workflow for a client business.",
    category: "CLIENT",
    color: "#F47C20",
    goals: "- Agree measurable success metrics with the client\n- Ship a working pilot their team uses every week\n- Hand over with documentation and training",
    days: 60,
    milestones: [
      { title: "Discovery complete", due: 7 },
      { title: "Pilot live", due: 30 },
      { title: "Handover", due: 60 },
    ],
    tasks: [
      { title: "Kickoff call and goals", due: 2, priority: "high", labels: ["client"], subtasks: ["Send agenda", "Confirm stakeholders", "Share notes after the call"] },
      { title: "Audit current workflows", due: 5, priority: "high", labels: ["discovery"] },
      { title: "Data access and security review", due: 7, priority: "high", labels: ["security"], subtasks: ["List data sources", "Confirm what data leaves their systems", "Sign data processing terms"] },
      { title: "Define success metrics", due: 7, priority: "medium", labels: ["discovery"] },
      { title: "Send deposit invoice", due: 3, priority: "high", labels: ["finance"] },
      { title: "Build prototype", due: 21, priority: "high", labels: ["build"], estimateMinutes: 960 },
      { title: "Pilot with the client team", due: 30, priority: "high", labels: ["build"] },
      { title: "Send weekly status update to client", due: 7, priority: "medium", labels: ["client"], recurrence: "weekly" },
      { title: "Training session", due: 45, priority: "medium", labels: ["client"] },
      { title: "Documentation and handover", due: 55, priority: "medium", labels: ["delivery"] },
      { title: "Send final invoice", due: 60, priority: "high", labels: ["finance"] },
    ],
  },
  {
    key: "arfa_track",
    name: "New ARFA track launch",
    description: "Plan, write, review and launch a new ARFA AI Academy track.",
    category: "EDUCATION",
    color: "#7C3AED",
    goals: "- A complete track with lessons, quizzes, labs and a capstone\n- English and French ready at launch\n- First 50 enrolments in the launch month",
    days: 45,
    milestones: [
      { title: "Content complete", due: 21 },
      { title: "QA signed off", due: 35 },
      { title: "Launch", due: 45 },
    ],
    tasks: [
      { title: "Track outline and outcomes", due: 3, priority: "high", labels: ["content"] },
      { title: "Draft lessons", due: 14, priority: "high", labels: ["content"], estimateMinutes: 1200 },
      { title: "Write quizzes and final exam", due: 18, priority: "medium", labels: ["content"] },
      { title: "Build labs", due: 20, priority: "medium", labels: ["content"] },
      { title: "Capstone brief and rubric", due: 21, priority: "medium", labels: ["content"] },
      { title: "Narrated lesson videos", due: 28, priority: "medium", labels: ["video"] },
      { title: "French translation review", due: 30, priority: "medium", labels: ["i18n"] },
      { title: "QA pass on every lesson", due: 35, priority: "high", labels: ["qa"], subtasks: ["Links and images", "Quizzes score correctly", "Mobile layout"] },
      { title: "Landing page and catalog entry", due: 38, priority: "medium", labels: ["marketing"] },
      { title: "Launch email and social posts", due: 44, priority: "medium", labels: ["marketing"] },
    ],
  },
  {
    key: "marketing",
    name: "Marketing campaign",
    description: "Brief, creative, launch and measurement for a campaign.",
    category: "INTERNAL",
    color: "#0F766E",
    goals: "- Reach the target audience with one clear offer\n- Track sign-ups and revenue per channel",
    days: 30,
    milestones: [
      { title: "Creative approved", due: 10 },
      { title: "Campaign live", due: 14 },
      { title: "Results review", due: 30 },
    ],
    tasks: [
      { title: "Campaign brief and audience", due: 2, priority: "high", labels: ["plan"] },
      { title: "Budget and channels", due: 3, priority: "medium", labels: ["plan"] },
      { title: "Creative and copy", due: 9, priority: "high", labels: ["creative"] },
      { title: "Landing page with tracked links", due: 12, priority: "high", labels: ["web"] },
      { title: "Email sequence", due: 12, priority: "medium", labels: ["email"] },
      { title: "Social content calendar", due: 13, priority: "medium", labels: ["social"] },
      { title: "Launch", due: 14, priority: "urgent", labels: ["launch"] },
      { title: "Review campaign metrics", due: 21, priority: "medium", labels: ["analytics"], recurrence: "weekly" },
      { title: "Results write-up", due: 30, priority: "medium", labels: ["analytics"] },
    ],
  },
];

export const templateByKey = (key: string | null | undefined) => PROJECT_TEMPLATES.find((t) => t.key === key) ?? null;
