import type { ElementType } from "react";
import {
  LayoutDashboard,
  Rocket,
  BarChart2,
  Columns,
  GanttChartSquare,
  List,
  RefreshCw,
  Calendar,
  Users,
  Search,
  Radar,
  Wand2,
  FileText,
  DollarSign,
  Settings,
  FileEdit,
  BookOpen,
  Bot,
  Mail,
  Briefcase,
  Sparkles,
  ShoppingBag,
  GraduationCap,
  KeyRound,
  Gauge,
  TrendingUp,
  CalendarDays,
  Link2,
  Palette,
  Send,
  UsersRound,
  Layers,
  MessagesSquare,
  Radio,
  Clapperboard,
  Handshake,
  Hourglass,
  Contact,
  UserSearch,
  Activity,
  Eye,
  Megaphone,
  Magnet,
  MessageSquareText,
  ScrollText,
} from "lucide-react";

export interface NavSubItem {
  label: string;
  href: string;
  icon: ElementType;
}

export interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
  subItems?: NavSubItem[];
  /** Extra words the command palette matches on. */
  keywords?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin_pro", icon: LayoutDashboard, keywords: "home today" },
      {
        label: "Command Center",
        href: "/admin_pro/command-center",
        icon: Rocket,
        keywords: "projects",
        subItems: [
          { label: "Overview", href: "/admin_pro/command-center", icon: BarChart2 },
          { label: "Kanban", href: "/admin_pro/command-center/kanban", icon: Columns },
          { label: "Timeline", href: "/admin_pro/command-center/timeline", icon: GanttChartSquare },
          { label: "All Projects", href: "/admin_pro/command-center/list", icon: List },
          { label: "Sync", href: "/admin_pro/command-center/sync", icon: RefreshCw },
        ],
      },
      { label: "Analytics", href: "/admin_pro/analytics", icon: BarChart2, keywords: "owner analytics kpi" },
    ],
  },
  {
    id: "sales",
    label: "Sales & Growth",
    items: [
      {
        label: "Growth hub",
        href: "/admin_pro/growth",
        icon: TrendingUp,
        keywords: "marketing",
        subItems: [
          { label: "Hub", href: "/admin_pro/growth", icon: TrendingUp },
          { label: "Calendar", href: "/admin_pro/growth/calendar", icon: CalendarDays },
          { label: "Links & attribution", href: "/admin_pro/growth/links", icon: Link2 },
          { label: "Brand & audiences", href: "/admin_pro/growth/settings", icon: Palette },
        ],
      },
      { label: "Leads", href: "/admin_pro/growth/leads", icon: UserSearch, keywords: "growth crm pipeline" },
      { label: "Outreach", href: "/admin_pro/growth/outreach", icon: Send, keywords: "email sequences" },
      { label: "Content", href: "/admin_pro/growth/content", icon: Sparkles, keywords: "content kits social posts" },
      { label: "Campaigns", href: "/admin_pro/growth/campaigns", icon: Megaphone, keywords: "marketing campaign launch" },
      { label: "Acquisition", href: "/admin_pro/growth/acquire", icon: Magnet, keywords: "landing pages lead magnets referrals" },
      { label: "Prospects", href: "/admin_pro/prospects", icon: Users },
      { label: "Contacts", href: "/admin_pro/contacts", icon: Contact },
      {
        label: "Appointments",
        href: "/admin_pro/appointments",
        icon: Calendar,
        keywords: "bookings meetings",
        subItems: [
          { label: "All Appointments", href: "/admin_pro/appointments", icon: Calendar },
          { label: "Availability", href: "/admin_pro/appointments/availability", icon: Settings },
        ],
      },
      { label: "Scanner Leads", href: "/admin_pro/scanner-leads", icon: Search },
      {
        label: "Agents",
        href: "/admin_pro/agents",
        icon: Bot,
        keywords: "ai agents aria rex nova",
        subItems: [
          { label: "All Agents", href: "/admin_pro/agents", icon: Sparkles },
          { label: "Aria (Marketing)", href: "/admin_pro/agents/aria", icon: Bot },
          { label: "Rex (Sales)", href: "/admin_pro/agents/rex", icon: Bot },
          { label: "Nova (Operations)", href: "/admin_pro/agents/nova", icon: Bot },
        ],
      },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { label: "Communications", href: "/admin_pro/communications", icon: MessageSquareText, keywords: "message learners email broadcast inbox" },
      { label: "Learners", href: "/admin_pro/learn/learners", icon: Users, keywords: "students arfa academy" },
    ],
  },
  {
    id: "learn",
    label: "ARFA · AI Academy",
    items: [
      { label: "Learn admin", href: "/admin_pro/learn", icon: GraduationCap, keywords: "arfa ai academy learning tracks lessons" },
      { label: "Teams", href: "/admin_pro/learn/teams", icon: UsersRound },
      { label: "Cohorts", href: "/admin_pro/learn/cohorts", icon: Layers },
      { label: "Community", href: "/admin_pro/learn/community", icon: MessagesSquare, keywords: "forum reports" },
      { label: "Live", href: "/admin_pro/learn/live", icon: Radio, keywords: "live sessions" },
      { label: "Videos", href: "/admin_pro/learn/videos", icon: Clapperboard },
      { label: "Tutor", href: "/admin_pro/learn/tutor", icon: Bot, keywords: "ai tutor" },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      {
        label: "AI Times",
        href: "/admin_pro/blog",
        icon: BookOpen,
        keywords: "posts articles",
        subItems: [
          { label: "All Posts", href: "/admin_pro/blog", icon: FileEdit },
          { label: "News Agent", href: "/admin_pro/blog/news-agent", icon: Bot },
        ],
      },
      { label: "Newsletter", href: "/admin_pro/newsletter", icon: Mail },
      { label: "Events", href: "/admin_pro/events", icon: CalendarDays, keywords: "training workshops" },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    items: [
      { label: "Store", href: "/admin_pro/shop", icon: ShoppingBag, keywords: "shop products orders" },
      { label: "Revenue", href: "/admin_pro/revenue", icon: DollarSign, keywords: "money sales" },
      { label: "Toolkit Live", href: "/admin_pro/toolkit", icon: Wand2 },
      { label: "Blueprints", href: "/admin_pro/blueprints", icon: FileText, keywords: "automation blueprints" },
      { label: "Monitor", href: "/admin_pro/monitor", icon: Radar, keywords: "readiness monitor" },
    ],
  },
  {
    id: "ops",
    label: "Insights & Ops",
    items: [
      { label: "AI Usage", href: "/admin_pro/ai-usage", icon: Gauge, keywords: "tokens cost llm" },
      { label: "Tool analytics", href: "/admin_pro/tools", icon: Activity },
      { label: "Visitor analytics", href: "/admin_pro/analytics/visitors", icon: Eye, keywords: "traffic" },
      { label: "Audit log", href: "/admin_pro/audit", icon: ScrollText, keywords: "activity history security" },
      { label: "Test access", href: "/admin_pro/test-access", icon: KeyRound },
      { label: "Service requests", href: "/admin_pro/service-requests", icon: Briefcase },
      { label: "Partnerships", href: "/admin_pro/partnerships", icon: Handshake },
      { label: "Waitlist", href: "/admin_pro/waitlist", icon: Hourglass },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [{ label: "Settings", href: "/admin_pro/settings", icon: Settings, keywords: "team collaborators password" }],
  },
];

// Maps nav hrefs to the permission key required to see them. Carried over
// verbatim from the previous sidebar; entries marked (inherited) are routes
// that used to be sub-items or are new links, and take their parent's key so
// visibility is unchanged.
export const NAV_PERMISSION_MAP: Record<string, string> = {
  "/admin_pro/command-center": "command_center",
  "/admin_pro/command-center/kanban": "command_center", // (inherited)
  "/admin_pro/command-center/timeline": "command_center", // (inherited)
  "/admin_pro/command-center/list": "command_center", // (inherited)
  "/admin_pro/command-center/sync": "command_center", // (inherited)
  "/admin_pro/appointments": "appointments",
  "/admin_pro/appointments/availability": "appointments", // (inherited)
  "/admin_pro/contacts": "contacts",
  "/admin_pro/prospects": "prospects",
  "/admin_pro/scanner-leads": "scanner_leads",
  "/admin_pro/tools": "tools",
  "/admin_pro/monitor": "tools",
  "/admin_pro/toolkit": "tools",
  "/admin_pro/blueprints": "tools",
  "/admin_pro/test-access": "tools",
  "/admin_pro/revenue": "revenue",
  "/admin_pro/blog": "blog",
  "/admin_pro/blog/news-agent": "blog", // (inherited)
  "/admin_pro/newsletter": "blog",
  "/admin_pro/service-requests": "service_requests",
  "/admin_pro/partnerships": "service_requests",
  "/admin_pro/waitlist": "service_requests",
  "/admin_pro/shop": "shop",
  "/admin_pro/learn": "events",
  "/admin_pro/learn/learners": "events",
  "/admin_pro/learn/live": "events",
  "/admin_pro/learn/teams": "events", // (inherited, new link)
  "/admin_pro/learn/cohorts": "events", // (inherited, new link)
  "/admin_pro/learn/community": "events", // (inherited, new link)
  "/admin_pro/learn/videos": "events", // (inherited, new link)
  "/admin_pro/learn/tutor": "events", // (inherited, new link)
  "/admin_pro/analytics": "__admin_only__",
  "/admin_pro/analytics/visitors": "analytics",
  "/admin_pro/agents": "agents",
  "/admin_pro/agents/aria": "agents", // (inherited)
  "/admin_pro/agents/rex": "agents", // (inherited)
  "/admin_pro/agents/nova": "agents", // (inherited)
  "/admin_pro/settings": "__admin_only__",
  "/admin_pro/ai-usage": "__admin_only__",
  // Growth: the section and its lead workspace are open to the "growth"
  // permission; content, scheduling, links and brand settings are admin-only.
  "/admin_pro/growth": "growth",
  "/admin_pro/growth/leads": "growth",
  "/admin_pro/growth/outreach": "growth",
  "/admin_pro/growth/content": "__admin_only__",
  "/admin_pro/growth/calendar": "__admin_only__",
  "/admin_pro/growth/links": "__admin_only__",
  "/admin_pro/growth/settings": "__admin_only__",
  "/admin_pro/growth/campaigns": "__admin_only__",
  "/admin_pro/growth/campaigns/new": "__admin_only__",
  "/admin_pro/growth/acquire": "__admin_only__",
  // People / ops: owner and admin only.
  "/admin_pro/communications": "__admin_only__",
  "/admin_pro/audit": "__admin_only__",
};

export type NavViewer = { isAdmin: boolean; permissions: string[] };

export function canSee(href: string, viewer: NavViewer): boolean {
  if (viewer.isAdmin || viewer.permissions.includes("*")) return true;
  const required = NAV_PERMISSION_MAP[href];
  if (!required) return true; // dashboard and unlisted items always visible
  if (required === "__admin_only__") return false;
  return viewer.permissions.includes(required);
}

export function visibleSections(viewer: NavViewer): NavSection[] {
  return NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items
      .filter((item) => canSee(item.href, viewer))
      .map((item) => ({ ...item, subItems: item.subItems?.filter((sub) => canSee(sub.href, viewer)) })),
  })).filter((s) => s.items.length > 0);
}

/** Every reachable href in the given sections, flattened (items + sub-items). */
export function flattenNav(sections: NavSection[]) {
  const out: { label: string; href: string; icon: ElementType; section: string; parent?: string; keywords?: string }[] = [];
  const seen = new Set<string>();
  for (const s of sections) {
    for (const item of s.items) {
      if (!seen.has(item.href)) {
        seen.add(item.href);
        out.push({ label: item.label, href: item.href, icon: item.icon, section: s.label, keywords: item.keywords });
      }
      for (const sub of item.subItems ?? []) {
        if (seen.has(sub.href)) continue;
        seen.add(sub.href);
        out.push({ label: `${item.label}: ${sub.label}`, href: sub.href, icon: sub.icon, section: s.label, parent: item.label });
      }
    }
  }
  return out;
}

/** Longest nav href that the pathname sits under (most specific wins). */
export function activeHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const h of hrefs) {
    const hit = h === "/admin_pro" ? pathname === "/admin_pro" : pathname === h || pathname.startsWith(h + "/");
    if (hit && (!best || h.length > best.length)) best = h;
  }
  return best;
}
