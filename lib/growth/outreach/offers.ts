// What TIBLOGICS actually sells, as the lead scorer sees it. Every entry maps
// to a real page in this codebase:
//   services      app/(public)/services (AI Implementation & Agents, Workflow
//                 Automation, Web & App Development, AI Training & Academy)
//   free tools    app/(public)/tools/scanner, /tools/calculator
//   paid tools    /tools/toolkit-live (lib/toolkit), /tools/automation-blueprint
//                 (lib/blueprint), /tools/readiness-monitor (lib/monitor)
//   Learning Box  lib/learn/seed tracks (ai-small-business, ai-automation, ...)
//   Store         lib/shop/prompt-packs.ts (industry prompt packs, $79)

export interface Offer {
  key: string;
  name: string;
  kind: "service" | "tool" | "free-tool" | "course" | "product";
  path: string;
  /** When it fits, for the model and for the heuristic fallback. */
  fitsWhen: string;
  /** Industries (lower-case substrings) this offer is specific to. */
  industries?: string[];
}

export const OFFERS: Offer[] = [
  { key: "ai-implementation", name: "AI Implementation & Agents (done-for-you)", kind: "service", path: "/services",
    fitsWhen: "Busy service business losing leads or time on calls, bookings, enquiries or follow-ups; would benefit from an AI chat/phone/booking assistant." },
  { key: "workflow-automation", name: "Workflow Automation", kind: "service", path: "/services",
    fitsWhen: "Repetitive admin: quotes, invoicing, intake forms, scheduling, copying data between tools." },
  { key: "web-development", name: "Website build / rebuild", kind: "service", path: "/services",
    fitsWhen: "No website, an outdated or slow site, no SSL, or no online booking." },
  { key: "ai-training", name: "AI Training for teams", kind: "service", path: "/services",
    fitsWhen: "Team of 5+ that wants staff to use AI safely and productively." },
  { key: "website-scanner", name: "Free AI-readiness website scan", kind: "free-tool", path: "/tools/scanner",
    fitsWhen: "Low-commitment first touch for any business with a website; good opener when fit is unclear." },
  { key: "automation-blueprint", name: "Automation Blueprint (paid plan)", kind: "tool", path: "/tools/automation-blueprint",
    fitsWhen: "Owner who wants a concrete, prioritised automation plan before hiring anyone." },
  { key: "toolkit-live", name: "Toolkit Live (industry prompt library + Compliance Guard)", kind: "tool", path: "/tools/toolkit-live",
    fitsWhen: "Regulated or writing-heavy industries (legal, medical, insurance, realtor, finance, HR) doing their own marketing and client comms.",
    industries: ["legal", "law", "medical", "clinic", "dental", "insurance", "real estate", "realtor", "finance", "account", "hr", "agency"] },
  { key: "readiness-monitor", name: "Readiness Monitor (weekly site checks)", kind: "tool", path: "/tools/readiness-monitor",
    fitsWhen: "Has a decent website and cares about keeping it fast, secure and AI-ready." },
  { key: "learn-smb", name: "AI Academy: AI for Small Business Owners", kind: "course", path: "/learning-box/ai-small-business",
    fitsWhen: "Owner-operator who wants to learn to use AI themselves rather than hire." },
  { key: "learn-automation", name: "AI Academy: AI Automation Without Code", kind: "course", path: "/learning-box/ai-automation",
    fitsWhen: "Ops-minded owner or manager who wants to build their own automations." },
  { key: "learn-governance", name: "AI Academy: AI Governance, Risk and Compliance", kind: "course", path: "/learning-box/ai-governance",
    fitsWhen: "Larger or regulated organisation adopting AI that needs policy and risk control." },
  { key: "pack-realtor", name: "The Realtor AI Toolkit (prompt pack)", kind: "product", path: "/store/the-realtor-ai-toolkit",
    fitsWhen: "Real estate agents and brokerages.", industries: ["real estate", "realtor", "realty", "broker"] },
  { key: "pack-restaurant", name: "The Restaurant AI Toolkit (prompt pack)", kind: "product", path: "/store/the-restaurant-ai-toolkit",
    fitsWhen: "Restaurants, cafes, bars, caterers.", industries: ["restaurant", "cafe", "café", "bar", "catering", "bakery", "food"] },
  { key: "pack-finance", name: "The Finance Professional's AI Toolkit (prompt pack)", kind: "product", path: "/store/the-finance-professionals-ai-toolkit",
    fitsWhen: "Accountants, bookkeepers, financial advisors.", industries: ["account", "bookkeep", "financ", "tax", "cpa"] },
  { key: "pack-nonprofit", name: "The Nonprofit AI Toolkit (prompt pack)", kind: "product", path: "/store/the-nonprofit-ai-toolkit",
    fitsWhen: "Nonprofits, charities, community organisations.", industries: ["nonprofit", "non-profit", "charity", "foundation", "church"] },
  { key: "pack-agency", name: "The Agency AI Toolkit (prompt pack)", kind: "product", path: "/store/the-agency-ai-toolkit",
    fitsWhen: "Marketing, creative and digital agencies.", industries: ["agency", "marketing", "creative", "design studio"] },
];

export const OFFER_BY_KEY = new Map(OFFERS.map((o) => [o.key, o]));

export function offerName(key: string | null | undefined): string {
  return (key && OFFER_BY_KEY.get(key)?.name) || "AI implementation";
}
