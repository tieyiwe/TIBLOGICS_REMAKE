"use client";

export interface UserContext {
  pagesVisited: string[];
  toolsUsed: string[];
  currentPage: string;
  sessionDuration: number;
  industryHint: string;
  searchQuery: string;
  referrer: string;
}

const STORAGE_KEY = "tib_context";
const SESSION_START_KEY = "tib_session_start";

export function trackPageVisit(page: string) {
  if (typeof window === "undefined") return;
  const ctx = getContext();
  if (!ctx.pagesVisited.includes(page)) {
    ctx.pagesVisited = [...ctx.pagesVisited.slice(-9), page];
  }
  ctx.currentPage = page;
  saveContext(ctx);
}

export function trackToolUse(tool: string) {
  if (typeof window === "undefined") return;
  const ctx = getContext();
  if (!ctx.toolsUsed.includes(tool)) {
    ctx.toolsUsed = [...ctx.toolsUsed, tool];
  }
  saveContext(ctx);
}

export function setIndustryHint(industry: string) {
  if (typeof window === "undefined") return;
  const ctx = getContext();
  ctx.industryHint = industry;
  saveContext(ctx);
}

export function getContext(): UserContext {
  if (typeof window === "undefined") {
    return emptyContext();
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const sessionStart = Number(sessionStorage.getItem(SESSION_START_KEY) ?? Date.now());
    if (!sessionStorage.getItem(SESSION_START_KEY)) {
      sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
    const base = stored ? JSON.parse(stored) : emptyContext();
    return {
      ...base,
      sessionDuration: Math.floor((Date.now() - sessionStart) / 1000),
      referrer: document.referrer || "direct",
    };
  } catch {
    return emptyContext();
  }
}

function emptyContext(): UserContext {
  return {
    pagesVisited: [],
    toolsUsed: [],
    currentPage: "",
    sessionDuration: 0,
    industryHint: "",
    searchQuery: "",
    referrer: "",
  };
}

function saveContext(ctx: UserContext) {
  try {
    const { sessionDuration, referrer, ...persistable } = ctx;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch {}
}
