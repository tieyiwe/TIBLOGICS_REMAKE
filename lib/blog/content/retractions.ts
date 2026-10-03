// Articles taken down from AI Times, and why.
//
// The news agent applies this list on every run: any published post whose title
// matches is set to unpublished. Nothing is deleted, so a retraction is undone
// by removing its entry here (and republishing the post in admin).
//
// Both entries below were pre-written articles from when the site was first
// generated, found in an audit on 2026-09-28. They are also gone from
// seed-posts.ts / spotlights.ts, so a fresh database never recreates them.

export interface Retraction {
  /** Exact title as published. */
  title: string;
  reason: string;
}

export const RETRACTIONS: Retraction[] = [
  {
    title: "How a Boutique Accounting Firm Automated 60% of Client Reporting With AI",
    reason:
      'Credits "Prestige Financial Advisory, a boutique accounting firm ... in Barbados" with invented ' +
      "results. A real boutique firm in Bridgetown, Prestige Accounting Inc., runs a division called " +
      "Prestige Financial Services, so readers would reasonably take it to be them.",
  },
  {
    title: "DeepSeek R2 Just Landed. Here's What It Actually Means for the Global AI Race.",
    reason:
      "Reports a DeepSeek R2 release, with benchmark claims, that had not happened: as of July 2026 " +
      "DeepSeek had not released R2 and shipped its V4 series instead.",
  },
];
