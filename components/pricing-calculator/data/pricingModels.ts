export interface PricingModelDef {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  drawbacks: string[];
  bestFor: string;
  example: string;
}

export const PRICING_MODELS: PricingModelDef[] = [
  {
    id: "usage-based",
    name: "Usage-Based",
    description: "Customers pay only for what they consume — per API call, token, or action.",
    benefits: [
      "Low barrier to entry — no upfront cost",
      "Scales naturally with customer growth",
      "Customers feel they're getting fair value",
      "Easy to upsell as usage grows",
    ],
    drawbacks: [
      "Unpredictable monthly revenue",
      "Customers may limit usage to control costs",
      "Complex billing infrastructure required",
      "Hard to forecast and budget for",
    ],
    bestFor: "Developer tools, APIs, infrastructure services",
    example: "Charge $0.002 per API call. A customer making 50K calls/mo pays $100.",
  },
  {
    id: "subscription",
    name: "Subscription",
    description: "Fixed monthly or annual fee for access to the product, regardless of usage.",
    benefits: [
      "Predictable, recurring revenue (MRR/ARR)",
      "Simple billing — customers know what to expect",
      "Encourages deep product adoption",
      "Higher LTV than one-time purchases",
    ],
    drawbacks: [
      "Customers may feel they're overpaying at low usage",
      "Churn risk if perceived value drops",
      "Harder to capture high-usage value upside",
      "Requires strong ongoing value delivery",
    ],
    bestFor: "SaaS products, productivity tools, content platforms",
    example: "Starter $29/mo, Pro $79/mo, Business $199/mo — all with unlimited core features.",
  },
  {
    id: "per-seat",
    name: "Per-Seat",
    description: "Price per user or seat, common in B2B enterprise SaaS.",
    benefits: [
      "Revenue grows with customer team size",
      "Intuitive for enterprise procurement",
      "Aligns value with organizational adoption",
      "Easy to budget for buyers",
    ],
    drawbacks: [
      "Customers minimize seats to cut costs",
      "Doesn't capture individual power users' value",
      "Can slow adoption in large orgs",
      "Revenue ceiling per account",
    ],
    bestFor: "Team collaboration tools, enterprise software, CRMs",
    example: "$15/seat/mo. A 50-person team pays $750/mo.",
  },
  {
    id: "credit-based",
    name: "Credit-Based",
    description: "Customers buy credit packs upfront and spend them on product actions.",
    benefits: [
      "Upfront cash flow (pay before use)",
      "Customers stay engaged to use credits",
      "Natural upsell when credits run low",
      "Flexible — works for variable-cost features",
    ],
    drawbacks: [
      "Unused credits create liability",
      "Complexity in tracking and displaying credits",
      "Customers may resist buying blind",
      "Expiry policies can cause friction",
    ],
    bestFor: "AI generation tools, design platforms, creative apps",
    example: "500 credits for $20. Image generation = 5 credits. 100 images costs $20.",
  },
  {
    id: "hybrid",
    name: "Hybrid",
    description: "Base subscription fee plus usage charges above a monthly limit.",
    benefits: [
      "Predictable base revenue + usage upside",
      "Protects customers from runaway bills",
      "Captures value from high-usage customers",
      "Best of both subscription and usage-based",
    ],
    drawbacks: [
      "More complex to explain and bill",
      "Customers may be confused by dual billing",
      "Requires careful overage pricing",
      "More invoicing infrastructure needed",
    ],
    bestFor: "High-volume AI apps, communication platforms, data services",
    example: "$49/mo includes 10K requests. Additional requests at $0.005 each.",
  },
  {
    id: "freemium",
    name: "Freemium",
    description: "Free tier for basic access, paid plans for advanced features or higher limits.",
    benefits: [
      "Low friction for user acquisition",
      "Large free user base for viral growth",
      "Organic word-of-mouth from free users",
      "Conversion funnel at scale",
    ],
    drawbacks: [
      "High infrastructure cost for free users",
      "Low conversion rates (typically 2–5%)",
      "Free users create support burden",
      "Risk of staying on free tier forever",
    ],
    bestFor: "Consumer apps, developer tools, collaboration software",
    example: "Free: 100 requests/mo. Pro $19/mo: 10K requests + priority support.",
  },
  {
    id: "tiered",
    name: "Tiered",
    description: "Multiple plans with increasing features, limits, and capabilities.",
    benefits: [
      "Serves multiple customer segments",
      "Natural upgrade path as needs grow",
      "Clear value differentiation per tier",
      "Captures wide range of willingness to pay",
    ],
    drawbacks: [
      "Complex to design and maintain tiers",
      "Customers may downgrade in slow periods",
      "Feature gating can feel frustrating",
      "Risk of tier cannibalization",
    ],
    bestFor: "B2B SaaS, productivity tools, marketing platforms",
    example: "Basic $29 (1 user, 1K/mo), Pro $79 (5 users, 10K/mo), Enterprise $299 (unlimited).",
  },
  {
    id: "volume-based",
    name: "Volume-Based",
    description: "Per-unit price decreases automatically as customer usage increases.",
    benefits: [
      "Incentivizes customers to use more",
      "Competitive for high-volume customers",
      "Transparent and fair pricing signal",
      "Reduces churn from heavy users",
    ],
    drawbacks: [
      "Margins compress at scale",
      "Difficult to forecast revenue precisely",
      "Complex pricing tables to communicate",
      "Can devalue product at high volumes",
    ],
    bestFor: "APIs, data services, storage, communication platforms",
    example: "0–10K requests: $0.01 each. 10K–100K: $0.007. 100K+: $0.005.",
  },
];
