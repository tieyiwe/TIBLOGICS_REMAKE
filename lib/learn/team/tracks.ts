import { YOUTH_SLUGS } from "@/lib/learn/youth";

// Tracks a team can assign: live, and not the AI-Empowered Youth lanes, which
// are for young people with a parent's consent and are never part of a team
// seat (an adult assigned one would only meet a paywall).
export const TEAM_TRACKS = { status: "live", slug: { notIn: [...YOUTH_SLUGS] } };
