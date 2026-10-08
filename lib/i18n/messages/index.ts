import type { Locale } from "../config";
import type { Messages } from "./types";
import common from "./common";
import home from "./home";
import site from "./site";
import tools from "./tools";
import learn from "./learn";
import labs from "./labs";
import toolkit from "./toolkit";
import calculator from "./calculator";
import pages from "./pages";
import tutorMsgs from "./tutor";
import masteryMsgs from "./mastery";
import communityMsgs from "./community";
import videoMsgs from "./video";
import teamMsgs from "./team";
import studio from "./studio";
import studioAutomation from "./studio-automation-builder";
import studioLoops from "./studio-loop-mapper";
import studioPrompt from "./studio-prompt-builder";
import studioSorter from "./studio-task-sorter";
import studioRisk from "./studio-spot-the-risk";
import studioWireframe from "./studio-wireframe-builder";
import studioArena from "./studio-prompt-arena";
import studioCritic from "./studio-critic-mode";
import studioBench from "./studio-test-bench";
import studioDoors from "./studio-security-doors";
import game from "./game";
import method from "./method";
import resumeMsgs from "./resume";
import badgesMsgs from "./badges";
import liveMsgs from "./live";
import pwaMsgs from "./pwa";
import a11yMsgs from "./a11y";
import acquireMsgs from "./acquire";
import referralsMsgs from "./referrals";
import inboxMsgs from "./inbox";
import promoMsgs from "./promo";
import seoMsgs from "./seo";
import joinMsgs from "./join";
import scannerChecks from "./scanner-checks";
import scannerReport from "./scanner-report";
import scholarshipMsgs from "./scholarship";
import casesMsgs from "./cases";

const ALL: Messages[] = [common, home, site, tools, learn, labs, toolkit, calculator, pages, game, studio, studioAutomation, studioLoops, studioPrompt, studioSorter, studioRisk, studioWireframe, studioArena, studioCritic, studioBench, studioDoors, method, tutorMsgs, masteryMsgs, communityMsgs, videoMsgs, teamMsgs, resumeMsgs, liveMsgs, badgesMsgs, pwaMsgs, a11yMsgs, acquireMsgs, referralsMsgs, inboxMsgs, promoMsgs, seoMsgs, joinMsgs, scannerChecks, scannerReport, scholarshipMsgs, casesMsgs];

const cache = new Map<Locale, Record<string, string>>();

/** The full dictionary for a locale, with English filling any gaps. */
export function dictionary(locale: Locale): Record<string, string> {
  const hit = cache.get(locale);
  if (hit) return hit;
  const out: Record<string, string> = {};
  for (const m of ALL) {
    Object.assign(out, m.en);
    if (locale !== "en") for (const [k, v] of Object.entries(m[locale])) if (v) out[k] = v;
  }
  cache.set(locale, out);
  return out;
}

/** How much of a locale is translated, for the admin and tests. */
export function coverage(locale: Locale): { total: number; missing: string[] } {
  const missing: string[] = [];
  let total = 0;
  for (const m of ALL) {
    for (const k of Object.keys(m.en)) {
      total++;
      if (!m[locale][k]) missing.push(k);
    }
  }
  return { total, missing };
}
