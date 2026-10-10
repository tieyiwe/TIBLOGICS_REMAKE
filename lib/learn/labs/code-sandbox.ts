// Client-safe helpers shared by Code Studio (components/learn/CodeStudio.tsx)
// and the youth Vibe Code Studio: the in-page check runner and the
// added/removed line count shown when reviewing an AI change.

export interface SandboxCheck { id: string; code: string }

// The checks are compiled into the check page as inline scripts, one per
// check, rather than built at run time with `new AsyncFunction(code)`.
//
// The site's Content-Security-Policy allows inline scripts but not eval, and a
// srcdoc frame inherits its parent's policy, so the old runner's
// AsyncFunction call was refused and EVERY check failed for every learner,
// even on a correct solution ("Refused to evaluate a string as JavaScript").
// One script per check also means a syntax error in one check cannot take the
// others down with it.
const CHECKS_VAR = "__tibChecks";

/** Keep check code from closing its <script> element early. */
export const scriptSafe = (code: string) => code.replace(/<\/(script)/gi, "<\\/$1");

export function checkScripts(checks: SandboxCheck[]): string {
  const defs = checks
    .map(
      (c, i) =>
        `<script>window.${CHECKS_VAR}=window.${CHECKS_VAR}||{};window.${CHECKS_VAR}[${i}]=async function(doc,win){\n${scriptSafe(c.code)}\n};</script>`,
    )
    .join("\n");
  const ids = scriptSafe(JSON.stringify(checks.map((c) => c.id)));
  return `${defs}
<script>
window.addEventListener("message", async function (e) {
  var d = e.data || {};
  if (d.type !== "tib-run-checks") return;
  var ids = ${ids};
  var fns = window.${CHECKS_VAR} || {};
  var out = [];
  for (var i = 0; i < ids.length; i++) {
    var fn = fns[i];
    if (typeof fn !== "function") { out.push({ id: ids[i], pass: false, message: "The check could not be loaded", kind: "error" }); continue; }
    try {
      var r = await Promise.race([
        fn(document, window),
        new Promise(function (_, rej) { setTimeout(function () { rej({ tibTimeout: true }); }, 3000); })
      ]);
      out.push(r === true ? { id: ids[i], pass: true, message: "" } : { id: ids[i], pass: false, message: typeof r === "string" ? r : "", kind: "fail" });
    } catch (err) {
      if (err && err.tibTimeout) out.push({ id: ids[i], pass: false, message: "Timed out", kind: "timeout" });
      else out.push({ id: ids[i], pass: false, message: String((err && err.message) || err), kind: "error" });
    }
  }
  parent.postMessage({ type: "tib-check-results", nonce: d.nonce, results: out }, "*");
});
</script>`;
}

/** The page with the check runner added just before </body>. */
export function withRunner(code: string, checks: SandboxCheck[]): string {
  const runner = checkScripts(checks);
  const i = code.toLowerCase().lastIndexOf("</body>");
  return i === -1 ? code + runner : code.slice(0, i) + runner + code.slice(i);
}

/** Lines added and removed between two versions, for the review panel. */
export function diffStat(a: string, b: string): { added: string[]; removed: string[] } {
  const count = (s: string) => {
    const m = new Map<string, number>();
    for (const l of s.split("\n")) if (l.trim()) m.set(l, (m.get(l) ?? 0) + 1);
    return m;
  };
  const ca = count(a), cb = count(b);
  const added: string[] = [], removed: string[] = [];
  for (const [l, n] of cb) for (let i = 0; i < n - (ca.get(l) ?? 0); i++) added.push(l);
  for (const [l, n] of ca) for (let i = 0; i < n - (cb.get(l) ?? 0); i++) removed.push(l);
  return { added, removed };
}
