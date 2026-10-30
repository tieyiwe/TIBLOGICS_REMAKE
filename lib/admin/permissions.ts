// Staff permission model, version 2: the one catalog of every admin feature
// area, the sensitive capabilities, the preset roles and the rule that turns
// a role plus per-person overrides into a person's effective access.
//
// Client-safe (no database, no Node APIs): the Team & Roles screen, the
// sidebar, the command palette and the server guards all read it.
//
// How access is stored and checked
//   - Each feature has a level: none, view or manage.
//   - Capabilities are separate yes/no switches for risky actions (deleting a
//     learner, sending to everyone, exporting data...).
//   - A person has a role (preset or custom) plus overrides: grants raise a
//     feature to a level or add a capability, revokes lower or remove them.
//     Effective access = role, then grants, then revokes.
//   - The effective access is flattened into the string list the rest of the
//     code already checks (session.user.permissions, Collaborator.permissions):
//       "blog"          the person can at least view the AI Times area
//       "blog:view"     same, explicit
//       "blog:manage"   the person can change things there
//       "data.export"   a capability
//     The plain key is what every pre-existing check (`permissions.includes(
//     "blog")`, requirePermission("events"), the sidebar map) looks for, so
//     those keep working unchanged. Writes to a view-only area are refused by
//     the method-aware check in proxy.ts (lib/admin/access-map.ts).
//   - "*" (with isAdmin) still means everything except the owner-only items.

export type Level = "none" | "view" | "manage";
export const LEVELS: Level[] = ["none", "view", "manage"];
const RANK: Record<Level, number> = { none: 0, view: 1, manage: 2 };

export interface Feature {
  key: string;
  group: string;
  label: string;
  description: string;
  /** What "manage" adds, shown in the grid. */
  manageNote?: string;
  /** Shown with a lock: think twice before granting. */
  sensitive?: boolean;
  /** Only "view" makes sense (the audit log is append-only). */
  viewOnly?: boolean;
}

export const FEATURE_GROUPS = ["Overview", "Sales & Growth", "People", "Academy", "Content", "Commerce", "Insights & Ops"] as const;

export const FEATURES: Feature[] = [
  // Overview
  { key: "command_center", group: "Overview", label: "Command Center", description: "Projects, tasks, milestones, notes, updates, time tracking and My work." },
  { key: "insights", group: "Overview", label: "Business analytics", description: "The owner analytics dashboard: KPIs, funnels and revenue trends." , viewOnly: true },
  // Sales & Growth
  { key: "growth", group: "Sales & Growth", label: "Leads & outreach", description: "Growth hub, lead workspace, enrichment, sequences and drafts.", manageNote: "Sending outreach email also needs the Send outreach capability." },
  { key: "growth_content", group: "Sales & Growth", label: "Content & campaigns", description: "Content kits, social posts, calendar, campaigns, links, brand settings and acquisition pages.", manageNote: "Publishing posts also needs the Publish growth content capability." },
  { key: "prospects", group: "Sales & Growth", label: "Prospects", description: "Prospect list and pipeline." },
  { key: "contacts", group: "Sales & Growth", label: "Contacts", description: "Everyone who booked, asked or wrote in." },
  { key: "appointments", group: "Sales & Growth", label: "Appointments", description: "Bookings, availability and blocked dates." },
  { key: "scanner_leads", group: "Sales & Growth", label: "Scanner leads", description: "Leads captured by the website scanner." },
  { key: "agents", group: "Sales & Growth", label: "AI agents", description: "Aria, Rex and Nova: agent leads, messages and runs." },
  // People
  { key: "learners", group: "People", label: "Learners", description: "Learner records and progress.", manageNote: "Manage: suspend, block, notes, tags, sign out everywhere. Deleting, passwords and free access are separate capabilities." },
  { key: "communications", group: "People", label: "Communications", description: "Learner inbox, help requests, templates and campaigns.", manageNote: "Sending also needs the Send messages capability." },
  { key: "team", group: "People", label: "Team & Roles", description: "See staff, roles and their activity.", manageNote: "Manage: invite and change access of non-admin staff (never more than you have yourself). Only the owner can grant this.", sensitive: true },
  // Academy
  { key: "events", group: "Academy", label: "ARFA AI Academy & Events", description: "Tracks, lessons, cohorts, live sessions, community, videos, tutor and events." },
  // Content
  { key: "blog", group: "Content", label: "AI Times & Newsletter", description: "Articles, news agent and the newsletter." },
  // Commerce
  { key: "shop", group: "Commerce", label: "Store", description: "Products, collections and orders.", manageNote: "Publishing products also needs the Publish store products capability." },
  { key: "promotions", group: "Commerce", label: "Promotions", description: "Discounts, sales and referral offers.", manageNote: "Turning a promotion on also needs the Publish promotions capability." },
  { key: "revenue", group: "Commerce", label: "Revenue", description: "Revenue reports." },
  { key: "finance", group: "Commerce", label: "Finance", description: "Income, expenses, receipts, budgets, P&L and per-project finance.", sensitive: true },
  { key: "tools", group: "Commerce", label: "Tools & products", description: "Toolkit Live, Blueprints, Monitor, test access and tool analytics." },
  // Insights & Ops
  { key: "analytics", group: "Insights & Ops", label: "Visitor analytics", description: "Traffic, pages and live visitors.", viewOnly: true },
  { key: "ai_usage", group: "Insights & Ops", label: "AI usage", description: "AI spend and usage per feature." , viewOnly: true },
  { key: "audit", group: "Insights & Ops", label: "Audit log", description: "Who did what and when. Append-only.", viewOnly: true, sensitive: true },
  { key: "service_requests", group: "Insights & Ops", label: "Service requests", description: "Service requests, partnerships and the waitlist." },
  { key: "settings", group: "Insights & Ops", label: "Settings", description: "Booking, notifications and integrations. Owner password and security stay with the owner.", sensitive: true },
];

export interface Capability {
  key: string;
  label: string;
  description: string;
  /** The feature this capability belongs with (shown next to it). */
  feature: string;
}

export const CAPABILITIES: Capability[] = [
  { key: "learners.delete", feature: "learners", label: "Delete learners", description: "Permanently delete a learner account and its data." },
  { key: "learners.password", feature: "learners", label: "Learner passwords and email", description: "Send reset links, set temporary passwords, change a learner's email." },
  { key: "learners.access", feature: "learners", label: "Grant free access", description: "Grant, extend or revoke complimentary access." },
  { key: "comms.send", feature: "communications", label: "Send messages", description: "Reply to learners and send campaigns to chosen learners or segments." },
  { key: "comms.send_all", feature: "communications", label: "Send to all learners", description: "Broadcast a campaign to every learner." },
  { key: "promotions.publish", feature: "promotions", label: "Publish promotions", description: "Turn promotions on or off (changes what customers pay)." },
  { key: "store.publish", feature: "shop", label: "Publish store products", description: "Publish or unpublish products and collections." },
  { key: "growth.send", feature: "growth", label: "Send outreach", description: "Approve and send outreach email to leads." },
  { key: "growth.publish", feature: "growth_content", label: "Publish growth content", description: "Approve, schedule and publish social posts and campaigns." },
  { key: "data.export", feature: "", label: "Export data", description: "Download CSV exports (learners, analytics, links, finance)." },
];

/** Things only the owner can ever do. Never grantable, not even to admins. */
export const OWNER_ONLY: Array<{ key: string; label: string }> = [
  { key: "team.admins", label: "Create, edit or remove Admins" },
  { key: "security", label: "Owner password, recovery and security settings" },
  { key: "audit.retention", label: "Log retention and deletion" },
  { key: "billing", label: "Billing and payment provider settings" },
];
export const OWNER_ONLY_KEYS = new Set(OWNER_ONLY.map((o) => o.key));

/** Capability-style names that are really a feature level. */
const ALIASES: Record<string, string> = {
  "finance.view": "finance:view",
  "finance.manage": "finance:manage",
  "team.manage": "team:manage",
  "team.view": "team:view",
  "settings.manage": "settings:manage",
};

export const FEATURE_KEYS = new Set(FEATURES.map((f) => f.key));
export const CAPABILITY_KEYS = new Set(CAPABILITIES.map((c) => c.key));
const FEATURE_BY_KEY = new Map(FEATURES.map((f) => [f.key, f]));

export function featureOf(key: string): Feature | undefined {
  return FEATURE_BY_KEY.get(key);
}

/** Normalises "x.manage"-style aliases to "x:manage". */
export function normaliseKey(key: string): string {
  return ALIASES[key] ?? key;
}

// ── Access shape ────────────────────────────────────────────────────────────

export interface Access {
  /** Feature key to level; missing means none. */
  levels: Record<string, Level>;
  /** Granted capability keys. */
  caps: string[];
}

export function emptyAccess(): Access {
  return { levels: {}, caps: [] };
}

/** Feature level within an access, with view-only features capped. */
export function levelOf(a: Access, feature: string): Level {
  const l = a.levels[feature] ?? "none";
  if (l === "manage" && FEATURE_BY_KEY.get(feature)?.viewOnly) return "view";
  return l;
}

/** Drops unknown keys and caps view-only features. */
export function cleanAccess(a: Partial<Access> | null | undefined): Access {
  const levels: Record<string, Level> = {};
  for (const [k, v] of Object.entries(a?.levels ?? {})) {
    if (!FEATURE_KEYS.has(k) || !LEVELS.includes(v as Level) || v === "none") continue;
    levels[k] = v === "manage" && FEATURE_BY_KEY.get(k)?.viewOnly ? "view" : (v as Level);
  }
  const caps = [...new Set((a?.caps ?? []).filter((c) => CAPABILITY_KEYS.has(c)))].sort();
  return { levels, caps };
}

// ── Overrides ───────────────────────────────────────────────────────────────
// An override entry is a string:
//   grant  "blog:view" | "blog:manage" | "learners.delete"
//   revoke "blog" (to none) | "blog:manage" (down to view) | "learners.delete"

export const OVERRIDE_RE = /^([a-z][a-z_]{1,39})(:(view|manage))?$|^([a-z][a-z_]{1,29}\.[a-z][a-z_]{1,29})$/;

export function validGrant(entry: string): boolean {
  if (CAPABILITY_KEYS.has(entry)) return true;
  const [f, l] = entry.split(":");
  if (!FEATURE_KEYS.has(f) || (l !== "view" && l !== "manage")) return false;
  return !(l === "manage" && FEATURE_BY_KEY.get(f)?.viewOnly);
}

export function validRevoke(entry: string): boolean {
  if (CAPABILITY_KEYS.has(entry)) return true;
  const [f, l] = entry.split(":");
  if (!FEATURE_KEYS.has(f)) return false;
  return l === undefined || l === "manage";
}

/** Role, then grants, then revokes. */
export function effectiveAccess(role: Access, grants: string[], revokes: string[]): Access {
  const levels: Record<string, Level> = { ...role.levels };
  const caps = new Set(role.caps);
  for (const g of grants) {
    if (!validGrant(g)) continue;
    if (CAPABILITY_KEYS.has(g)) {
      caps.add(g);
      continue;
    }
    const [f, l] = g.split(":") as [string, Level];
    if (RANK[l] > RANK[levels[f] ?? "none"]) levels[f] = l;
  }
  for (const r of revokes) {
    if (!validRevoke(r)) continue;
    if (CAPABILITY_KEYS.has(r)) {
      caps.delete(r);
      continue;
    }
    const [f, l] = r.split(":");
    if (l === "manage") {
      if (levels[f] === "manage") levels[f] = "view";
    } else delete levels[f];
  }
  return cleanAccess({ levels, caps: [...caps] });
}

/** The flat permission list stored on the collaborator and in the session. */
export function expandAccess(a: Access): string[] {
  const out: string[] = [];
  for (const f of FEATURES) {
    const l = levelOf(a, f.key);
    if (l === "none") continue;
    out.push(f.key, `${f.key}:view`);
    if (l === "manage") out.push(`${f.key}:manage`);
  }
  for (const c of a.caps) if (CAPABILITY_KEYS.has(c)) out.push(c);
  return out;
}

/** Reads a flat list back into levels and capabilities. */
export function accessFromList(list: string[]): Access {
  const levels: Record<string, Level> = {};
  const caps: string[] = [];
  for (const raw of list) {
    const p = normaliseKey(raw);
    if (CAPABILITY_KEYS.has(p)) {
      caps.push(p);
      continue;
    }
    const [f, l] = p.split(":");
    if (!FEATURE_KEYS.has(f)) continue;
    const lvl: Level = l === "manage" ? "manage" : "view";
    if (RANK[lvl] > RANK[levels[f] ?? "none"]) levels[f] = lvl;
  }
  return cleanAccess({ levels, caps });
}

// ── Checking ────────────────────────────────────────────────────────────────

export type Viewer = { isOwner?: boolean; isAdmin?: boolean; permissions?: string[] | null } | null | undefined;

/**
 * True when the viewer holds `key`:
 *   "blog" or "blog:view"  at least view
 *   "blog:manage"          manage
 *   "learners.delete"      that capability
 *   "*"                    admin (or owner)
 *   owner-only keys        the owner only
 * The owner always passes; admins pass everything except owner-only keys.
 */
export function can(viewer: Viewer, key: string): boolean {
  if (!viewer) return false;
  if (viewer.isOwner) return true;
  const k = normaliseKey(key);
  if (OWNER_ONLY_KEYS.has(k) || k === "__owner__") return false;
  const perms = viewer.permissions ?? [];
  if (viewer.isAdmin || perms.includes("*")) return true;
  if (k === "*" || k === "__admin__") return false;
  if (k === "__staff__") return true;
  if (perms.includes(k)) return true;
  // "blog:view" is satisfied by the plain key too (older lists have only it).
  if (k.endsWith(":view")) return perms.includes(k.slice(0, -5));
  return false;
}

// ── Legacy keys ─────────────────────────────────────────────────────────────
// Before v2 a collaborator held plain keys that granted whatever the area's
// routes allowed. Each maps to the v2 grants that give exactly that access.

export const LEGACY_MAP: Record<string, string[]> = {
  appointments: ["appointments:manage"],
  contacts: ["contacts:manage"],
  prospects: ["prospects:manage"],
  blog: ["blog:manage"],
  analytics: ["analytics:view"],
  service_requests: ["service_requests:manage"],
  scanner_leads: ["scanner_leads:manage"],
  revenue: ["revenue:view"],
  tools: ["tools:manage"],
  agents: ["agents:manage"],
  command_center: ["command_center:manage"],
  finance: ["finance:manage"],
  growth: ["growth:manage"],
  // "events" opened the Learn admin and, read-only, the learner pages.
  events: ["events:manage", "learners:view"],
  learners: ["learners:view"],
  shop: ["shop:manage"],
};

/** Legacy areas whose routes already let the holder download CSV exports. */
const LEGACY_EXPORTERS = new Set(["learners", "events", "analytics", "finance"]);

/** v2 grants equivalent to a legacy permission list (without "*"). */
export function grantsFromLegacy(perms: string[]): string[] {
  const out = new Set<string>();
  for (const p of perms) {
    if (p.includes(":") || p.includes(".")) {
      if (validGrant(p)) out.add(p);
      continue;
    }
    for (const g of LEGACY_MAP[p] ?? []) out.add(g);
    if (LEGACY_EXPORTERS.has(p)) out.add("data.export");
  }
  return [...out].sort();
}

// ── Roles ───────────────────────────────────────────────────────────────────

export interface RoleDef {
  id: string;
  name: string;
  description: string;
  preset: boolean;
  /** The Admin role: everything except the owner-only items. */
  admin?: boolean;
  access: Access;
}

const all = (level: Level): Record<string, Level> =>
  Object.fromEntries(FEATURES.map((f) => [f.key, f.viewOnly && level === "manage" ? "view" : level]));

export const ADMIN_ROLE_ID = "admin";
export const NO_ROLE_ID = "custom";

export const PRESET_ROLES: RoleDef[] = [
  {
    id: ADMIN_ROLE_ID,
    name: "Admin",
    description: "Everything except the owner-only items (admins, owner security, log retention).",
    preset: true,
    admin: true,
    access: { levels: all("manage"), caps: CAPABILITIES.map((c) => c.key) },
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Growth content, campaigns, the blog and newsletter, with view access to leads and analytics.",
    preset: true,
    access: {
      levels: { growth: "view", growth_content: "manage", blog: "manage", prospects: "view", contacts: "view", scanner_leads: "view", analytics: "view", promotions: "view", agents: "view" },
      caps: ["growth.publish"],
    },
  },
  {
    id: "sales",
    name: "Sales",
    description: "Leads, outreach, prospects, contacts, appointments and the AI sales agents.",
    preset: true,
    access: {
      levels: { growth: "manage", prospects: "manage", contacts: "manage", appointments: "manage", scanner_leads: "manage", agents: "manage", service_requests: "manage" },
      caps: ["growth.send"],
    },
  },
  {
    id: "academy_manager",
    name: "Academy manager",
    description: "Runs the ARFA AI Academy: content, cohorts, live sessions, learners and their messages.",
    preset: true,
    access: {
      levels: { events: "manage", learners: "manage", communications: "manage" },
      caps: ["comms.send", "learners.password", "learners.access"],
    },
  },
  {
    id: "instructor",
    name: "Instructor",
    description: "Teaches: academy content, cohorts and live sessions, with read access to learners.",
    preset: true,
    access: { levels: { events: "manage", learners: "view", communications: "view" }, caps: [] },
  },
  {
    id: "support",
    name: "Support",
    description: "Answers learners and customers: inbox, help requests, appointments and service requests.",
    preset: true,
    access: {
      levels: { learners: "view", communications: "manage", appointments: "manage", contacts: "view", service_requests: "manage" },
      caps: ["comms.send"],
    },
  },
  {
    id: "content_editor",
    name: "Content editor",
    description: "Writes and edits articles, the newsletter and growth content (publishing stays with others).",
    preset: true,
    access: { levels: { blog: "manage", growth_content: "manage", events: "view" }, caps: [] },
  },
  {
    id: "analyst",
    name: "Analyst",
    description: "Read-only access to analytics, revenue, tools and AI usage.",
    preset: true,
    access: { levels: { insights: "view", analytics: "view", revenue: "view", tools: "view", ai_usage: "view", growth: "view" }, caps: ["data.export"] },
  },
  {
    id: "finance",
    name: "Finance",
    description: "Finance, revenue and the store's orders, with CSV exports.",
    preset: true,
    access: { levels: { finance: "manage", revenue: "view", shop: "view", promotions: "view" }, caps: ["data.export"] },
  },
  {
    id: NO_ROLE_ID,
    name: "No base role",
    description: "Nothing by default; access comes only from this person's own overrides.",
    preset: true,
    access: { levels: {}, caps: [] },
  },
];

export const PRESET_IDS = new Set(PRESET_ROLES.map((r) => r.id));

export function presetRole(id: string): RoleDef | undefined {
  return PRESET_ROLES.find((r) => r.id === id);
}

/** Counts used by the grid and the members table. */
export function overrideCount(grants: string[], revokes: string[]): number {
  return grants.length + revokes.length;
}

/** Where a feature's level comes from, for the effective-access grid. */
export function levelSource(role: Access, grants: string[], revokes: string[], feature: string): "role" | "grant" | "revoke" | "none" {
  if (revokes.some((r) => r === feature || r === `${feature}:manage`)) return "revoke";
  if (grants.some((g) => g.startsWith(`${feature}:`))) {
    const eff = levelOf(effectiveAccess(role, grants, revokes), feature);
    if (RANK[eff] > RANK[levelOf(role, feature)]) return "grant";
  }
  return levelOf(role, feature) === "none" ? "none" : "role";
}

export function capSource(role: Access, grants: string[], revokes: string[], cap: string): "role" | "grant" | "revoke" | "none" {
  if (revokes.includes(cap)) return "revoke";
  if (grants.includes(cap) && !role.caps.includes(cap)) return "grant";
  return role.caps.includes(cap) ? "role" : "none";
}

/**
 * True when every permission in `wanted` is something the actor holds.
 * Used to stop privilege escalation: a non-owner can never hand out more
 * than they have themselves.
 */
export function withinActor(actor: Viewer, wanted: Access): boolean {
  if (!actor) return false;
  if (actor.isOwner) return true;
  for (const f of FEATURES) {
    const l = levelOf(wanted, f.key);
    if (l === "none") continue;
    if (!can(actor, `${f.key}:${l}`)) return false;
  }
  return wanted.caps.every((c) => can(actor, c));
}

export const RANKS = RANK;
