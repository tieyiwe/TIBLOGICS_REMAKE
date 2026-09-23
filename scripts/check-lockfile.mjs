// Guards against a lockfile that only installs inside the Replit workspace.
//
// Running `npm install` in the Replit Shell goes through Replit's package
// proxy, and npm records where each tarball came from in the lockfile's
// "resolved" fields — so they end up pointing at
// http://package-firewall.replit.local, a host that exists only inside the
// workspace.
//
// Everything keeps working locally, because an existing node_modules is never
// re-fetched. The deployment build is where it bites: it runs `npm ci` on a
// machine that cannot reach that host, the tarball fetch fails, and Publishing
// reports "build failed" with nothing pointing at the lockfile.
//
// `npm ci --dry-run` does NOT catch this — it resolves the tree without
// downloading tarballs, so it never touches the unreachable host.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const LOCKFILE = join(dirname(fileURLToPath(import.meta.url)), "..", "package-lock.json");
const INTERNAL_HOST = "package-firewall.replit.local";

let raw;
try {
  raw = readFileSync(LOCKFILE, "utf8");
} catch {
  // No lockfile (fresh checkout, or an install that skipped it) — nothing to check.
  process.exit(0);
}

const offenders = [...raw.matchAll(/"resolved":\s*"(http:\/\/package-firewall[^"]*)"/g)].map(
  (m) => m[1],
);

if (offenders.length === 0) process.exit(0);

console.error(
  `\n✖ package-lock.json has ${offenders.length} dependency/dependencies resolving to ${INTERNAL_HOST}.` +
    `\n  That host only exists inside the Replit workspace, so the deployment build will fail on \`npm ci\`.\n`,
);
for (const url of offenders) console.error("    " + url);
console.error(
  `\n  Fix it with:\n` +
    `    sed -i 's|http://${INTERNAL_HOST}/npm/|https://registry.npmjs.org/|g' package-lock.json\n` +
    `\n  Then commit package-lock.json. The tarballs are identical, so the integrity hashes still match.\n`,
);
process.exit(1);
