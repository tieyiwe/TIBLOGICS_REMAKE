import type { CyberContext, ModuleOutput, PageInfo } from "../context";
import type { Severity } from "../types";
import { Out, OWASP } from "./util";

// Exposed files and admin areas. ACTIVE: requests a fixed list of well-known
// paths, so it runs only inside an authorised engagement (lib/cyber/engagement.ts).
// A path counts only when the answer matches what that file really looks like
// (a soft 404 page never counts), and the report records that it was found,
// its size and type, never its contents.

interface Probe {
  path: string;
  id: string;
  severity: Severity;
  title: string;
  /** The response really is this file. */
  match: (body: string, status: number, type: string) => boolean;
  impact: string;
  fix: string[];
}

const SECRET_FIX = ["Delete the file from the web server now (or block it).", "Assume everything in it is known: change every password, API key and token it contained.", "Block dot-files and backups for good (snippets below)."];
const BLOCK_SNIPPETS = [
  { label: "nginx", code: "location ~ /\\.(?!well-known) { deny all; }\nlocation ~* \\.(bak|old|orig|save|swp|sql|zip|tar|gz|7z)$ { deny all; }" },
  { label: "Apache (.htaccess)", code: "<FilesMatch \"^\\.|\\.(bak|old|orig|save|swp|sql|zip|tar|gz|7z)$\">\n  Require all denied\n</FilesMatch>\nRedirectMatch 404 /\\.git" },
];

const PROBES: Probe[] = [
  { path: "/.env", id: "exposed-env", severity: "critical", title: "The .env file (passwords and API keys) is public", match: (b, s) => s === 200 && /^[A-Z][A-Z0-9_]{2,}=/m.test(b) && !/<html|<!doctype/i.test(b), impact: "This file usually holds the database password, email password and API keys. Anyone can download it and take over the database, send email as the business or run up bills on its accounts.", fix: SECRET_FIX },
  { path: "/.git/HEAD", id: "exposed-git", severity: "critical", title: "The site's source code repository (.git) is public", match: (b, s) => s === 200 && /^ref: refs\//.test(b.trim()), impact: "The whole source code, its history and any passwords ever committed can be downloaded with free tools.", fix: ["Block /.git on the server (or deploy without the .git folder).", "Review the history for passwords and keys and change them."] },
  { path: "/.git/config", id: "exposed-git-config", severity: "critical", title: "The .git configuration is public", match: (b, s) => s === 200 && /\[core\]/.test(b), impact: "Confirms the source repository is downloadable, and may reveal where the code is hosted.", fix: ["Block /.git on the server."] },
  { path: "/.svn/entries", id: "exposed-svn", severity: "high", title: "The Subversion folder (.svn) is public", match: (b, s) => s === 200 && /^\d+\s*$/m.test(b.slice(0, 20)) && !/<html/i.test(b), impact: "Source code and file lists can be downloaded.", fix: ["Block /.svn on the server and remove it from the web root."] },
  { path: "/wp-config.php.bak", id: "exposed-wpconfig-bak", severity: "critical", title: "A backup of wp-config.php is public", match: (b, s) => s === 200 && /DB_PASSWORD|DB_NAME/.test(b), impact: "It holds the WordPress database password and secret keys in readable form.", fix: SECRET_FIX },
  { path: "/wp-config.php~", id: "exposed-wpconfig-tilde", severity: "critical", title: "An editor backup of wp-config.php is public", match: (b, s) => s === 200 && /DB_PASSWORD|DB_NAME/.test(b), impact: "It holds the WordPress database password and secret keys in readable form.", fix: SECRET_FIX },
  { path: "/config.php.bak", id: "exposed-config-bak", severity: "critical", title: "A configuration backup is public", match: (b, s) => s === 200 && /<\?php|password|passwd|db_/i.test(b) && !/<html/i.test(b), impact: "Configuration backups usually contain database and service passwords.", fix: SECRET_FIX },
  { path: "/backup.zip", id: "exposed-backup-zip", severity: "critical", title: "A site backup archive is public", match: (b, s, t) => s === 200 && (b.startsWith("PK") || /zip|octet-stream/i.test(t)) && !/<html/i.test(b.slice(0, 300)), impact: "A full backup gives away the code, configuration passwords and often customer data.", fix: ["Delete backups from the web root; store them off the server.", "Change the passwords inside."] },
  { path: "/backup.sql", id: "exposed-sql", severity: "critical", title: "A database dump is public", match: (b, s) => s === 200 && /CREATE TABLE|INSERT INTO|-- MySQL dump|PostgreSQL database dump/i.test(b), impact: "The database, with customer details and password hashes, can be downloaded by anyone. This is a reportable data breach in most countries.", fix: ["Delete it now.", "Check the server logs for who downloaded it; take legal advice on breach notification.", "Change all passwords."] },
  { path: "/dump.sql", id: "exposed-sql-dump", severity: "critical", title: "A database dump is public", match: (b, s) => s === 200 && /CREATE TABLE|INSERT INTO|-- MySQL dump|PostgreSQL database dump/i.test(b), impact: "The database, with customer details and password hashes, can be downloaded by anyone.", fix: ["Delete it now.", "Check who downloaded it; change all passwords."] },
  { path: "/.htpasswd", id: "exposed-htpasswd", severity: "critical", title: "The .htpasswd password file is public", match: (b, s) => s === 200 && /^[^:\s<]+:(\$apr1\$|\$2[aby]\$|\{SHA\}|[A-Za-z0-9./]{13})/m.test(b), impact: "Password hashes for protected areas can be cracked offline.", fix: ["Move it outside the web root and block dot-files.", "Change those passwords."] },
  { path: "/.npmrc", id: "exposed-npmrc", severity: "critical", title: "An .npmrc file with registry tokens is public", match: (b, s) => s === 200 && /_authToken|registry=/i.test(b) && !/<html/i.test(b), impact: "Package registry tokens can be used to publish malicious code under the company's name.", fix: SECRET_FIX },
  { path: "/.vscode/sftp.json", id: "exposed-sftp", severity: "critical", title: "An editor's SFTP settings (with server login) are public", match: (b, s) => s === 200 && /"host"\s*:/.test(b) && /"(password|username)"\s*:/.test(b), impact: "Gives the server address and login used to upload the site.", fix: SECRET_FIX },
  { path: "/docker-compose.yml", id: "exposed-compose", severity: "high", title: "docker-compose.yml is public", match: (b, s) => s === 200 && /^services:|^version:/m.test(b) && !/<html/i.test(b), impact: "Reveals the server set-up and often passwords in environment settings.", fix: ["Remove it from the web root; change any passwords in it."] },
  { path: "/web.config", id: "exposed-webconfig", severity: "high", title: "web.config is readable", match: (b, s) => s === 200 && /<configuration[\s>]/i.test(b), impact: "IIS configuration often contains connection strings with passwords.", fix: ["Make sure IIS serves .config files as forbidden (the default); remove copies from the web root."] },
  { path: "/phpinfo.php", id: "exposed-phpinfo", severity: "high", title: "A phpinfo() page is public", match: (b, s) => s === 200 && /phpinfo\(\)|PHP Version \d/.test(b), impact: "Shows the exact server set-up, paths, modules and sometimes environment secrets, which makes targeted attacks easy.", fix: ["Delete phpinfo.php (and info.php, test.php) from the server."] },
  { path: "/info.php", id: "exposed-infophp", severity: "high", title: "A phpinfo() page is public", match: (b, s) => s === 200 && /phpinfo\(\)|PHP Version \d/.test(b), impact: "Shows the exact server set-up and sometimes secrets.", fix: ["Delete info.php from the server."] },
  { path: "/server-status", id: "exposed-server-status", severity: "medium", title: "Apache server-status is public", match: (b, s) => s === 200 && /Apache Server Status/i.test(b), impact: "Shows live requests, including visitors' addresses and URLs (which can include tokens).", fix: ["Restrict mod_status to localhost (Require local) or turn it off."] },
  { path: "/wp-content/debug.log", id: "exposed-wp-debug", severity: "high", title: "The WordPress debug log is public", match: (b, s) => s === 200 && /PHP (Fatal error|Warning|Notice|Deprecated)/.test(b), impact: "Error logs reveal file paths, plugin names and sometimes data or queries, and grow without limit.", fix: ["Delete wp-content/debug.log and set WP_DEBUG_LOG to false (or a path outside the web root)."] },
  { path: "/actuator/env", id: "exposed-actuator", severity: "high", title: "Spring Boot actuator endpoints are public", match: (b, s) => s === 200 && /propertySources|activeProfiles/.test(b), impact: "Exposes configuration and sometimes credentials; other actuator endpoints can dump memory.", fix: ["Restrict actuator endpoints to an internal network or require authentication."] },
  { path: "/elmah.axd", id: "exposed-elmah", severity: "high", title: "The ELMAH error log is public", match: (b, s) => s === 200 && /Error Log for/i.test(b), impact: "Error logs show stack traces and sometimes session cookies.", fix: ["Restrict elmah.axd to administrators (allowRemoteAccess=\"false\")."] },
  { path: "/.DS_Store", id: "exposed-dsstore", severity: "low", title: "A .DS_Store file is public", match: (b, s) => s === 200 && b.includes("Bud1"), impact: "Lists the files in the folder, including ones not linked from the site (backups, old pages).", fix: ["Delete .DS_Store files from the server and block dot-files."] },
  { path: "/swagger.json", id: "exposed-swagger", severity: "info", title: "API documentation is public", match: (b, s) => s === 200 && /"swagger"|"openapi"/.test(b), impact: "A full map of the API helps attackers find weak endpoints. Fine if intended; make sure every endpoint requires authentication.", fix: ["Publish API docs only if intended; otherwise restrict them."] },
  { path: "/openapi.json", id: "exposed-openapi", severity: "info", title: "API documentation is public", match: (b, s) => s === 200 && /"openapi"|"swagger"/.test(b), impact: "A full map of the API helps attackers find weak endpoints.", fix: ["Restrict it unless the API is meant to be public."] },
];

const LISTING_DIRS = ["/uploads/", "/wp-content/uploads/", "/backup/", "/files/", "/images/", "/assets/"];

export async function exposure(ctx: CyberContext, page: PageInfo): Promise<ModuleOutput> {
  const o = new Out("exposure");
  const origin = new URL(page.finalUrl).origin;
  const get = (p: string, max = 6000) => ctx.http(origin + p, { follow: false, max, timeoutMs: 7000 }).catch(() => null);

  for (const p of PROBES) {
    const r = await get(p.path);
    if (r && p.match(r.body, r.status, r.headers.get("content-type") ?? "")) {
      const size = r.headers.get("content-length") ?? `${r.body.length}+`;
      o.fail({
        id: p.id, severity: p.severity, title: p.title,
        evidence: `${origin}${p.path} answered HTTP ${r.status} (${size} bytes, ${r.headers.get("content-type") ?? "no type"}) and matches this kind of file. Contents not stored.`,
        impact: p.impact, fix: p.fix, snippets: p.severity === "critical" || p.severity === "high" ? BLOCK_SNIPPETS : undefined,
        effort: "minutes", standard: OWASP.misconfig,
      }, `${p.path} not public`);
    } else o.pass(p.id, `${p.path} not public`);
  }

  const listed: string[] = [];
  for (const d of LISTING_DIRS) {
    const r = await get(d, 4000);
    if (r && r.status === 200 && /<title>\s*Index of \//i.test(r.body)) listed.push(d);
  }
  if (listed.length) {
    o.fail({
      id: "dir-listing", severity: "medium", title: "Folder contents are listed publicly",
      evidence: listed.map((d) => origin + d).join(", "),
      impact: "Anyone can browse every file in these folders, including private uploads, invoices or backups never linked from the site.",
      fix: ["Turn off directory listing on the server."],
      snippets: [{ label: "nginx", code: "autoindex off;" }, { label: "Apache (.htaccess)", code: "Options -Indexes" }],
      effort: "minutes", standard: OWASP.access,
    }, "Directory listing off");
  } else o.pass("dir-listing", "Directory listing off");

  // Admin areas and WordPress specifics
  const pma = (await get("/phpmyadmin/")) ?? null;
  if (pma && pma.status === 200 && /phpMyAdmin/i.test(pma.body)) {
    o.fail({ id: "phpmyadmin-public", severity: "high", title: "phpMyAdmin is reachable from the internet", evidence: `${origin}/phpmyadmin/ shows the phpMyAdmin login.`, impact: "The database admin tool is a top target for password guessing and has a long history of vulnerabilities.", fix: ["Remove it, or restrict it to your IP address / a VPN.", "Use strong unique database passwords."], effort: "minutes", standard: OWASP.access }, "phpMyAdmin not public");
  }
  if (page.html.includes("/wp-content/") || page.html.includes("/wp-includes/")) {
    const [users, xmlrpc, login] = await Promise.all([get("/wp-json/wp/v2/users", 20_000), get("/xmlrpc.php", 2000), get("/wp-login.php", 4000)]);
    if (users && users.status === 200 && /"slug"\s*:/.test(users.body)) {
      const n = (users.body.match(/"slug"\s*:/g) ?? []).length;
      o.fail({ id: "wp-user-enum", severity: "medium", title: "WordPress usernames can be listed", evidence: `${origin}/wp-json/wp/v2/users lists ${n} user(s). Names not stored.`, impact: "Attackers get the exact login names to target with password guessing; half of the work of breaking in.", fix: ["Block the users endpoint for visitors who are not logged in (a security plugin such as Wordfence or a small snippet).", "Use 2-factor authentication for every admin account."], snippets: [{ label: "WordPress (functions.php)", code: "add_filter('rest_endpoints', function ($e) {\n  if (!is_user_logged_in()) { unset($e['/wp/v2/users'], $e['/wp/v2/users/(?P<id>[\\d]+)']); }\n  return $e;\n});" }], effort: "minutes", standard: OWASP.auth }, "WordPress users hidden");
    } else o.pass("wp-user-enum", "WordPress users hidden");
    if (xmlrpc && /XML-RPC server accepts POST requests only/i.test(xmlrpc.body)) {
      o.fail({ id: "wp-xmlrpc", severity: "medium", title: "WordPress XML-RPC is enabled", evidence: `${origin}/xmlrpc.php is active.`, impact: "XML-RPC lets attackers try hundreds of passwords in one request and is used for DDoS reflection. Few sites still need it.", fix: ["Disable XML-RPC unless you use the WordPress mobile app or Jetpack (security plugins have a switch)."], snippets: [{ label: "WordPress (functions.php)", code: "add_filter('xmlrpc_enabled', '__return_false');" }, { label: "Apache (.htaccess)", code: "<Files xmlrpc.php>\n  Require all denied\n</Files>" }], effort: "minutes", standard: OWASP.auth }, "XML-RPC off");
    } else o.pass("wp-xmlrpc", "XML-RPC off");
    if (login && login.status === 200 && /user_login/.test(login.body)) {
      o.fail({ id: "wp-login-public", severity: "low", title: "The WordPress login page is open to everyone", evidence: `${origin}/wp-login.php`, impact: "Bots try passwords against it all day. Fine if logins are protected well.", fix: ["Turn on 2-factor authentication for all administrators.", "Limit login attempts (Wordfence, Limit Login Attempts Reloaded) or put the login behind Cloudflare."], effort: "minutes", standard: OWASP.auth });
    }
  }
  return o;
}
