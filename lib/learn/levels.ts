// The three certification levels, in order.
//
// The Learning Box presents one path rather than a flat catalog: Basic, then
// Intermediate, then Expert. Each level is a full track with its own
// certificate. The order is recommended, not enforced; an experienced learner
// can start at Level 2, and the site says what each level assumes.

export interface CertLevel {
  level: 1 | 2 | 3;
  name: "Basic" | "Intermediate" | "Expert";
  slug: string;
  /** One line: what a holder of this certificate can do. */
  promise: string;
  /** What this level assumes, so a learner can pick their starting point. */
  assumes: string;
}

export const CERT_LEVELS: CertLevel[] = [
  {
    level: 1,
    name: "Basic",
    slug: "ai-foundations",
    promise: "Use AI safely and well for everyday tasks, and know when not to.",
    assumes: "No experience needed.",
  },
  {
    level: 2,
    name: "Intermediate",
    slug: "ai-practitioner",
    promise: "Use AI reliably for real work: repeatable prompts, your own data, quality checks and automation.",
    assumes: "You already use AI tools for everyday tasks.",
  },
  {
    level: 3,
    name: "Expert",
    slug: "ai-systems-expert",
    promise: "Design and lead AI use across an organisation: agents, evaluation, security, governance and cost.",
    assumes: "You use AI confidently for real work and want to lead it.",
  },
];

export const LEVEL_SLUGS = new Set(CERT_LEVELS.map((l) => l.slug));

export function levelFor(slug: string): CertLevel | undefined {
  return CERT_LEVELS.find((l) => l.slug === slug);
}
