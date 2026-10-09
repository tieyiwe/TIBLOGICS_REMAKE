// Which permission each admin page and admin API path needs. Read by proxy.ts,
// which checks every staff request against it before the page or route runs,
// so a page that only calls requireAdminPage() (any staff) is still limited
// to the people whose role opens that area. Route handlers keep their own
// checks; this is the shared outer gate, and the only place that knows that a
// GET is a "view" and a POST/PATCH/DELETE is a "manage".
//
// Pure (no database): the proxy passes the person's live permissions in.
import { can, type Viewer } from "./permissions";

/**
 * key: what a read needs (a feature key means "at least view").
 * write: what a write needs; defaults to "<key>:manage" for a feature key.
 * methods: only these methods are checked (mixed public/admin routes).
 * exact: match the path exactly instead of as a prefix.
 * Special keys: "__staff__" (any staff), "__admin__" (admin or owner),
 * "__owner__", "__pass__" (not checked here; the route decides).
 */
export interface AccessRule {
  path: string;
  key: string;
  write?: string;
  methods?: string[];
  exact?: boolean;
  /** Match only paths below this one ("/api/prospects/abc", not "/api/prospects"). */
  children?: boolean;
  /** Paths below, relative to `path`, that this rule leaves alone. */
  exclude?: RegExp;
}

export const PAGE_RULES: AccessRule[] = [
  { path: "/admin_pro", key: "__staff__", exact: true },
  { path: "/admin_pro/login", key: "__pass__" },
  { path: "/admin_pro/accept-invite", key: "__pass__" },
  { path: "/admin_pro/no-access", key: "__staff__" },
  { path: "/admin_pro/team", key: "team" },
  { path: "/admin_pro/command-center", key: "command_center" },
  { path: "/admin_pro/command-center/finance", key: "finance" },
  { path: "/admin_pro/finance", key: "finance" },
  { path: "/admin_pro/analytics", key: "insights" },
  { path: "/admin_pro/analytics/visitors", key: "analytics" },
  // Feature usage: most-used pages and buttons (lib/analytics/usage.ts).
  { path: "/admin_pro/analytics/usage", key: "analytics" },
  { path: "/admin_pro/growth", key: "growth" },
  { path: "/admin_pro/growth/leads", key: "growth" },
  { path: "/admin_pro/growth/outreach", key: "growth" },
  { path: "/admin_pro/growth/content", key: "growth_content" },
  { path: "/admin_pro/growth/calendar", key: "growth_content" },
  { path: "/admin_pro/growth/links", key: "growth_content" },
  { path: "/admin_pro/growth/settings", key: "growth_content" },
  { path: "/admin_pro/growth/campaigns", key: "growth_content" },
  { path: "/admin_pro/growth/acquire", key: "growth_content" },
  { path: "/admin_pro/prospects", key: "prospects" },
  { path: "/admin_pro/contacts", key: "contacts" },
  { path: "/admin_pro/reviews", key: "contacts" },
  { path: "/admin_pro/appointments", key: "appointments" },
  { path: "/admin_pro/scanner-leads", key: "scanner_leads" },
  { path: "/admin_pro/agents", key: "agents" },
  { path: "/admin_pro/communications", key: "communications" },
  { path: "/admin_pro/communications/support", key: "learners" },
  { path: "/admin_pro/learn", key: "events" },
  { path: "/admin_pro/learn/learners", key: "learners" },
  { path: "/admin_pro/learn/exams", key: "learners" },
  { path: "/admin_pro/learn/scholarships", key: "learners" },
  { path: "/admin_pro/blog", key: "blog" },
  { path: "/admin_pro/newsletter", key: "blog" },
  { path: "/admin_pro/events", key: "events" },
  { path: "/admin_pro/shop", key: "shop" },
  { path: "/admin_pro/promotions", key: "promotions" },
  { path: "/admin_pro/revenue", key: "revenue" },
  { path: "/admin_pro/toolkit", key: "tools" },
  { path: "/admin_pro/blueprints", key: "tools" },
  { path: "/admin_pro/monitor", key: "tools" },
  { path: "/admin_pro/test-access", key: "tools" },
  { path: "/admin_pro/tools", key: "tools" },
  { path: "/admin_pro/ai-usage", key: "ai_usage" },
  { path: "/admin_pro/audit", key: "audit" },
  { path: "/admin_pro/service-requests", key: "service_requests" },
  { path: "/admin_pro/partnerships", key: "service_requests" },
  { path: "/admin_pro/waitlist", key: "service_requests" },
  { path: "/admin_pro/settings", key: "settings" },
];

const W = ["POST", "PUT", "PATCH", "DELETE"];

export const API_RULES: AccessRule[] = [
  // Routes with their own non-session authentication, or public by design.
  { path: "/api/admin/cc-webhook", key: "__pass__" },
  { path: "/api/admin/recover-password", key: "__pass__" },
  { path: "/api/admin/setup", key: "__pass__" },
  { path: "/api/admin/change-password", key: "__pass__" },
  { path: "/api/admin/collaborators/accept", key: "__pass__" },
  { path: "/api/admin/clear-dev-data", key: "__pass__" },
  // Any staff member; the handler filters by permission itself.
  { path: "/api/admin/search", key: "__staff__" },
  { path: "/api/admin/notifications", key: "__staff__" },
  // Team & Roles: the handlers apply the finer rules (owner, admins, escalation).
  { path: "/api/admin/team", key: "team", write: "team" },
  { path: "/api/admin/team/pageview", key: "__staff__", write: "__staff__" },
  { path: "/api/admin/collaborators", key: "__admin__" },
  { path: "/api/admin/sync-db", key: "__admin__" },
  { path: "/api/admin/sync-history", key: "command_center" },
  { path: "/api/admin/agents", key: "agents" },
  { path: "/api/admin/agents/aria/post", key: "growth_content", write: "growth.publish" },
  { path: "/api/admin/analytics", key: "insights" },
  { path: "/api/admin/analytics/usage", key: "analytics" },
  { path: "/api/admin/appointments", key: "appointments" },
  { path: "/api/admin/reviews", key: "contacts" },
  { path: "/api/admin/meeting-settings", key: "appointments" },
  { path: "/api/admin/audit", key: "audit" },
  { path: "/api/admin/blog", key: "blog" },
  { path: "/api/admin/blueprints", key: "tools" },
  { path: "/api/admin/test-access", key: "tools" },
  { path: "/api/admin/collections", key: "shop" },
  { path: "/api/admin/products", key: "shop" },
  { path: "/api/admin/orders", key: "shop" },
  { path: "/api/admin/shop", key: "shop" },
  { path: "/api/admin/communications", key: "communications" },
  { path: "/api/admin/communications/support", key: "learners", write: "communications:manage" },
  { path: "/api/admin/events", key: "events" },
  { path: "/api/admin/registrations", key: "events" },
  { path: "/api/admin/learn", key: "events" },
  { path: "/api/admin/learn/learners", key: "learners" },
  { path: "/api/admin/learn/scholarships", key: "learners" },
  // The message composer's learner picker.
  { path: "/api/admin/learn/learners/search", key: "communications" },
  { path: "/api/admin/finance", key: "finance" },
  { path: "/api/admin/pm", key: "command_center" },
  { path: "/api/admin/projects", key: "command_center" },
  { path: "/api/admin/growth", key: "growth_content" },
  { path: "/api/admin/scanner-leads", key: "scanner_leads" },
  { path: "/api/admin/growth/leads", key: "growth" },
  { path: "/api/admin/growth/outreach", key: "growth" },
  { path: "/api/admin/growth/outreach/approve", key: "growth", write: "growth.send" },
  { path: "/api/admin/growth/outreach/run", key: "growth", write: "growth.send" },
  { path: "/api/admin/growth/mission", key: "growth" },
  { path: "/api/admin/promotions", key: "promotions" },
  { path: "/api/admin/prospects", key: "prospects" },
  // Shared public/admin routes: only the admin methods are checked.
  { path: "/api/analytics/realtime", key: "analytics", exact: true },
  { path: "/api/appointments", key: "appointments", methods: ["GET"], exact: true },
  { path: "/api/appointments", key: "appointments", children: true, exclude: /^(available|availability|blocked-dates)$|\/status$/ },
  { path: "/api/appointments/availability", key: "appointments", methods: W, exact: true },
  { path: "/api/appointments/blocked-dates", key: "appointments", methods: W, exact: true },
  { path: "/api/blog/auto-refresh", key: "blog", exact: true },
  { path: "/api/blog/breaking-news", key: "blog", methods: W, exact: true },
  { path: "/api/blog/dedup", key: "blog", exact: true },
  { path: "/api/blog/generate-post", key: "blog", exact: true },
  { path: "/api/blog/news-agent", key: "blog", exact: true },
  { path: "/api/blog/repair-posts", key: "blog", exact: true },
  { path: "/api/blog/seed", key: "blog", exact: true },
  { path: "/api/blog/posts", key: "blog", methods: W },
  { path: "/api/claude/agents", key: "agents", exact: true },
  { path: "/api/contacts", key: "contacts", methods: ["GET"], exact: true },
  { path: "/api/events/notify", key: "events", methods: ["GET"], exact: true },
  { path: "/api/events/register", key: "events", methods: ["GET"], exact: true },
  { path: "/api/newsletter/campaigns", key: "blog", exact: true },
  { path: "/api/newsletter/compose", key: "blog", exact: true },
  { path: "/api/newsletter/send", key: "blog", exact: true },
  { path: "/api/newsletter/subscribers", key: "blog", exact: true },
  { path: "/api/partnerships", key: "service_requests", methods: ["GET"], exact: true },
  { path: "/api/prospects", key: "prospects", methods: ["GET"], exact: true },
  { path: "/api/prospects", key: "prospects", children: true },
  { path: "/api/scanner-leads", key: "scanner_leads", methods: ["GET"], exact: true },
  { path: "/api/service-requests", key: "service_requests", methods: ["GET"], exact: true },
  { path: "/api/service-requests", key: "service_requests", children: true },
  { path: "/api/waitlist", key: "service_requests", methods: ["GET"], exact: true },
];

/** Longest matching rule for the path and method, or null. */
export function matchRule(rules: AccessRule[], path: string, method: string): AccessRule | null {
  let best: AccessRule | null = null;
  for (const r of rules) {
    if (r.methods && !r.methods.includes(method)) continue;
    let hit: boolean;
    if (r.children) hit = path.startsWith(r.path + "/") && !(r.exclude?.test(path.slice(r.path.length + 1)) ?? false);
    else if (r.exact) hit = path === r.path;
    else hit = path === r.path || path.startsWith(r.path + "/");
    if (hit && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.exact))) best = r;
  }
  return best;
}

const READ = new Set(["GET", "HEAD", "OPTIONS"]);

/** The permission a request needs under a rule. */
export function requiredKey(rule: AccessRule, method: string): string {
  if (READ.has(method)) return rule.key;
  if (rule.write) return rule.write;
  if (rule.key.startsWith("__")) return rule.key;
  return `${rule.key}:manage`;
}

/** CSV downloads need the export capability on top of the area. */
export function isExportPath(path: string): boolean {
  return /\/export(\/|$)/.test(path);
}

export type Decision = { ok: true; key: string | null } | { ok: false; key: string };

export function decide(viewer: Viewer, kind: "page" | "api", path: string, method: string): Decision {
  const rule = matchRule(kind === "page" ? PAGE_RULES : API_RULES, path, method);
  if (!rule || rule.key === "__pass__") return { ok: true, key: null };
  const key = requiredKey(rule, method);
  if (!can(viewer, key)) return { ok: false, key };
  if (kind === "api" && isExportPath(path) && !path.startsWith("/api/admin/team") && !can(viewer, "data.export")) {
    return { ok: false, key: "data.export" };
  }
  return { ok: true, key };
}

/** The area a path belongs to, for the activity log ("blog", "learners"...). */
export function areaOf(path: string): string | null {
  const rule = matchRule(path.startsWith("/api/") ? API_RULES : PAGE_RULES, path, "GET") ?? matchRule(API_RULES, path, "POST");
  if (!rule || rule.key.startsWith("__")) return path.startsWith("/admin_pro") ? "dashboard" : null;
  return rule.key.split(/[:.]/)[0];
}
