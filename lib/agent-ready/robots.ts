// robots.txt as crawlers read it (RFC 9309, the rules Google and the AI
// companies follow):
//
// - Lines are grouped: one or more User-agent lines, then their rules. Groups
//   naming the same agent are merged.
// - A crawler obeys only the group with the most specific User-agent that
//   matches its name (case-insensitive), else the "*" group, else nothing.
//   A named group replaces "*" entirely: it does NOT add to it.
// - For a path, the longest matching rule wins; on a tie Allow wins. "*"
//   matches any run of characters and "$" anchors the end.

export interface RobotsRule {
  allow: boolean;
  path: string;
  /** 1-based line in the file, to quote it back to the owner. */
  line: number;
}

export interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
  /** First line of the group. */
  line: number;
}

export interface ParsedRobots {
  groups: RobotsGroup[];
  sitemaps: string[];
  /** Lines that are not a known field (typos such as "Useragent:", "Dissallow:"). */
  unknown: Array<{ line: number; text: string }>;
}

const KNOWN = new Set(["user-agent", "allow", "disallow", "sitemap", "crawl-delay", "host", "clean-param", "content-signal", "request-rate", "visit-time", "noindex"]);

export function parseRobots(text: string): ParsedRobots {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  const unknown: Array<{ line: number; text: string }> = [];
  let cur: RobotsGroup | null = null;
  let lastWasAgent = false;
  const lines = text.replace(/^﻿/, "").split(/\r\n|\r|\n/).slice(0, 5000);
  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    const noComment = raw.replace(/#.*$/, "").trim();
    if (!noComment) return;
    const idx = noComment.indexOf(":");
    if (idx < 0) {
      unknown.push({ line: lineNo, text: raw.trim().slice(0, 200) });
      return;
    }
    const field = noComment.slice(0, idx).trim().toLowerCase();
    const value = noComment.slice(idx + 1).trim();
    if (field === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [], line: lineNo };
        groups.push(cur);
      }
      if (value) cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;
    if (field === "sitemap") {
      if (value) sitemaps.push(value.slice(0, 500));
      return;
    }
    if (field === "allow" || field === "disallow") {
      // Rules before any User-agent line belong to no group (ignored by crawlers).
      if (!cur) return;
      // "Disallow:" with no path means "nothing is disallowed".
      if (!value) return;
      cur.rules.push({ allow: field === "allow", path: value, line: lineNo });
      return;
    }
    if (!KNOWN.has(field)) unknown.push({ line: lineNo, text: raw.trim().slice(0, 200) });
  });
  return { groups, sitemaps, unknown };
}

/**
 * The rules a crawler obeys: the merged groups with the longest User-agent
 * that matches its name, or "*". null: no group applies (all allowed).
 */
export function groupFor(robots: ParsedRobots, token: string): { agent: string; rules: RobotsRule[]; lines: number[] } | null {
  const name = token.toLowerCase();
  let best = "";
  for (const g of robots.groups) {
    for (const a of g.agents) {
      if (a === "*") continue;
      // "googlebot" applies to "googlebot-image"; the most specific wins.
      if (name.startsWith(a) && a.length > best.length) best = a;
    }
  }
  const pick = best || "*";
  const hits = robots.groups.filter((g) => g.agents.includes(pick));
  if (!hits.length) return null;
  return { agent: pick, rules: hits.flatMap((g) => g.rules), lines: hits.map((g) => g.line) };
}

function patternToRegex(path: string): RegExp {
  const anchored = path.endsWith("$");
  const body = (anchored ? path.slice(0, -1) : path)
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

function normPath(p: string): string {
  try {
    // Compare in the percent-encoded form, like crawlers do.
    return encodeURI(decodeURI(p));
  } catch {
    return p;
  }
}

/** Whether `token` may fetch `path` (path plus query), and the deciding rule. */
export function isAllowed(robots: ParsedRobots, token: string, path: string): { allowed: boolean; rule: RobotsRule | null; agent: string | null } {
  const g = groupFor(robots, token);
  if (!g) return { allowed: true, rule: null, agent: null };
  const target = normPath(path || "/");
  let winner: RobotsRule | null = null;
  let winLen = -1;
  for (const r of g.rules) {
    if (!patternToRegex(normPath(r.path)).test(target)) continue;
    const len = r.path.length;
    if (len > winLen || (len === winLen && r.allow && winner && !winner.allow)) {
      winner = r;
      winLen = len;
    }
  }
  return { allowed: !winner || winner.allow, rule: winner, agent: g.agent };
}
