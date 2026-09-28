// Checks the prompts written for Toolkit Live (lib/toolkit/prompts).
// Run: npx tsx --tsconfig tsconfig.json scripts/validate-toolkit-prompts.mts
import { EXTRA_FOR_EXISTING, NEW_INDUSTRIES } from "../lib/toolkit/prompts";
import type { PromptDraft } from "../lib/toolkit/prompts/define";

const BANNED = /[—–―‘’“”…→• ]/;
let errors = 0;
const fail = (where: string, msg: string) => { errors++; console.error(`✗ ${where}: ${msg}`); };

function check(group: string, list: PromptDraft[]) {
  const titles = new Set<string>();
  const cats = new Map<string, number>();
  for (const [i, d] of list.entries()) {
    const where = `${group} #${i + 1} "${d.t}"`;
    for (const [k, v] of Object.entries(d)) {
      const m = BANNED.exec(String(v));
      if (m) fail(where, `${k} contains ${JSON.stringify(m[0])}`);
    }
    if (titles.has(d.t.toLowerCase())) fail(where, "duplicate title");
    titles.add(d.t.toLowerCase());
    if (d.p.length < 220) fail(where, `prompt is short (${d.p.length} chars)`);
    if (d.p.length > 1600) fail(where, `prompt is long (${d.p.length} chars)`);
    if (!/\[[^\]]{2,160}\]/.test(d.p)) fail(where, "no [FIELD] to fill in");
    if (d.u.length < 25) fail(where, "use-this-when is too short");
    if (d.tip.length < 25) fail(where, "pro tip is too short");
    cats.set(d.c, (cats.get(d.c) ?? 0) + 1);
  }
  console.log(`${group}: ${list.length} prompts, ${cats.size} categories (${[...cats.values()].join("/")})`);
}

for (const [v, list] of Object.entries(EXTRA_FOR_EXISTING)) check(`${v} (added)`, list);
for (const pack of NEW_INDUSTRIES) check(pack.id, pack.prompts);
if (errors) {
  console.error(`\n${errors} problem(s).`);
  process.exit(1);
}
console.log("\nAll prompts pass.");
