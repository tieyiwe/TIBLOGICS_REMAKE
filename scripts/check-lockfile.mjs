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

import { readFileSync, writeFileSync } from "fs";
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

// Repair rather than fail. The rewrite is content-identical — the proxy serves
// the registry's own tarballs, so every integrity hash still validates — and
// failing here would break the very deploy this is meant to protect, if the
// build environment installs through the proxy too.
writeFileSync(
  LOCKFILE,
  raw.replaceAll(`http://${INTERNAL_HOST}/npm/`, "https://registry.npmjs.org/"),
);

console.warn(
  `\n⚠ package-lock.json had ${offenders.length} dependency/dependencies resolving to ${INTERNAL_HOST},` +
    `\n  a host that exists only inside the Replit workspace. Left alone they break \`npm ci\` on the` +
    `\n  deployment build machine. Rewritten to registry.npmjs.org:\n`,
);
for (const url of offenders) console.warn("    " + url);
console.warn(
  `\n  Commit package-lock.json so this does not come back:\n` +
    `    git add package-lock.json && git commit -m "Repoint lockfile at the public registry"\n`,
);
