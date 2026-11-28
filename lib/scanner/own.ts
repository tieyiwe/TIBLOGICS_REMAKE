import type { Tech } from "./extra";

// Our own site: a scan of it never names the stack it runs on (platform,
// shop engine, script libraries). Every other site's report still does.

const OWN_HOSTS = new Set(["tiblogics.com"]);
try {
  const h = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : "";
  if (h && h !== "localhost" && h !== "127.0.0.1") OWN_HOSTS.add(h.replace(/^www\./, ""));
} catch {
  /* no app URL */
}

export function isOwnSite(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return OWN_HOSTS.has(new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, ""));
  } catch {
    return false;
  }
}

export function hideOwnStack(tech: Tech, url: string | null | undefined): Tech {
  return isOwnSite(url) ? { ...tech, cms: null, cmsVersion: null, shop: null, libraries: [] } : tech;
}
