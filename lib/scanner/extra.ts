// Service-linked checks for the AI Scanner.
//
// audit.ts scores how well a page is built. This file looks for the things a
// site is missing that TIBLOGICS can build: lead capture, booking, analytics,
// chat, security headers, email authentication. Each finding names the
// service that fixes it, so the report and the owner's lead alert can say
// "this is what we would do for you".
//
// Same rules as audit.ts:
//   - Deterministic. Same HTML, headers and DNS in, same result out.
//   - Every finding names its evidence (the tool found, the header value, the
//     library version, the year in the footer).
//   - Passive only. Nothing here sends a request to the scanned site; it reads
//     the page, the response headers and public DNS. Wording says "exposes",
//     "advertises" or "missing", never that a site is vulnerable.

import { hideOwnStack } from "./own";
import { resolveTxt, resolveMx } from "node:dns/promises";
import type { Finding, FindingType } from "./audit";

export type ExtraArea = "growth" | "security";
/** The TIBLOGICS service that fixes a finding (used for the owner's lead alert and the report). */
export type ServiceKey = "lead-capture" | "booking" | "analytics" | "security" | "email" | "performance" | "multilingual" | "ecommerce" | "content" | "ai-assistant" | "automation" | "seo";
export interface ExtraFinding extends Omit<Finding, "area"> {
  area: ExtraArea;
  service: ServiceKey;
  /** 3 = costs them customers now, 1 = nice to have. */
  impact: 1 | 2 | 3;
}
export interface DnsSignals { spf: string | null; dmarc: string | null; mx: boolean }
export interface PageSpeedResult { performance: number; lcpMs: number | null; cls: number | null; tbtMs: number | null; fcpMs: number | null; speedIndexMs: number | null; strategy: "mobile" }
export interface Tech {
  cms: string | null;
  /** Only when the page itself advertises it (generator meta, ?ver= on WordPress core assets). */
  cmsVersion: string | null;
  shop: string | null;
  analytics: string[];
  pixels: string[];
  booking: string | null;
  chat: string[];
  /** Native <form> elements that are not a search box or an add-to-cart form, plus embedded form tools (HubSpot, Typeform, Jotform...). */
  forms: number;
  emailCapture: boolean;
  clickToCall: boolean;
  whatsapp: boolean;
  /** Distinct link/button labels with an action word. */
  ctaCount: number;
  languages: string[];
  libraries: { name: string; version: string | null; outdated: boolean }[];
  copyrightYear: number | null;
  socialLinks: string[];
  reviews: boolean;
  mixedContent: number;
}
export interface ExtraSignals {
  html: string;
  finalUrl: string;
  /** Response headers of the main page, lower-case keys. */
  headers: Record<string, string>;
  /** null = DNS could not be checked (do not penalise). */
  dns: DnsSignals | null;
}
export interface ExtraResult {
  growthScore: number;
  securityScore: number;
  findings: ExtraFinding[];
  tech: Tech;
  /** Deterministic list of things TIBLOGICS could build for this site, best first, 3 to 6 items. */
  opportunities: OpportunityKey[];
}
export type OpportunityKey = "ai-chat-assistant" | "online-booking" | "lead-funnel" | "ai-faq-search" | "crm-automation" | "review-engine" | "multilingual-site" | "online-store" | "ai-product-recs" | "whatsapp-assistant" | "client-portal" | "content-engine" | "analytics-dashboard" | "email-nurture" | "quote-calculator" | "site-rebuild";

/** One scored check, as in audit.ts, plus the service that fixes it. */
interface Check {
  key: string;
  area: ExtraArea;
  weight: number;
  pass: boolean;
  /** Partial credit, 0..1. Defaults to pass ? 1 : 0. */
  score?: number;
  good: string;
  bad: string;
  goodMsg?: string;
  badMsg?: string;
  vars?: Record<string, string | number>;
  /** A failed check that is a nice-to-have rather than a defect. */
  soft?: boolean;
  service: ServiceKey;
  impact: 1 | 2 | 3;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function decodeEntities(v: string): string {
  return v
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&copy;/gi, "©")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

const stripTags = (s: string): string =>
  decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function metaContent(html: string, name: string): string | null {
  const a = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i").exec(html);
  if (a) return decodeEntities(a[1].trim());
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i").exec(html);
  return b ? decodeEntities(b[1].trim()) : null;
}

/** Every generator meta value (WordPress pages often carry several). */
function generators(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (!/name=["']generator["']/i.test(m[0])) continue;
    const c = /content=["']([^"']*)["']/i.exec(m[0]);
    if (c) out.push(decodeEntities(c[1].trim()));
  }
  return out;
}

/** Compare dotted versions: negative when a < b. */
function cmpVersion(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** First pattern that matches wins; returns its label. */
function firstMatch(src: string, table: [string, RegExp][]): string | null {
  for (const [label, re] of table) if (re.test(src)) return label;
  return null;
}

function allMatches(src: string, table: [string, RegExp][]): string[] {
  return table.filter(([, re]) => re.test(src)).map(([label]) => label);
}

// ── Detection tables ──────────────────────────────────────────────────────

const CMS: [string, RegExp][] = [
  ["WordPress", /\/wp-content\/|\/wp-includes\/|<meta[^>]+content=["']WordPress/i],
  ["Wix", /static\.wixstatic\.com|static\.parastorage\.com|<meta[^>]+content=["']Wix\.com/i],
  ["Squarespace", /static1?\.squarespace\.com|<!-- This is Squarespace\. -->|squarespace-cdn\.com/i],
  ["Shopify", /cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i],
  ["Webflow", /data-wf-page=|data-wf-site=|assets\.website-files\.com|cdn\.prod\.website-files\.com/i],
  ["Joomla", /<meta[^>]+content=["']Joomla|\/media\/jui\/|\/media\/system\/js\/core(?:\.min)?\.js/i],
  ["Drupal", /<meta[^>]+content=["']Drupal|drupal-settings-json|\/sites\/default\/files\/|Drupal\.settings/i],
  ["Ghost", /<meta[^>]+content=["']Ghost\s/i],
  ["Framer", /framerusercontent\.com|<meta[^>]+content=["']Framer/i],
  ["Duda", /irp\.cdn-website\.com|dudaone|<meta[^>]+content=["']Duda/i],
  ["GoDaddy", /img1\.wsimg\.com|<meta[^>]+content=["']Go Daddy Website Builder|<meta[^>]+content=["']GoDaddy/i],
  ["Weebly", /editmysite\.com|weebly\.com\/weebly/i],
  ["HubSpot CMS", /<meta[^>]+content=["']HubSpot|\.hubspotusercontent[\w-]*\.net\/hubfs/i],
  ["BigCommerce", /cdn\d*\.bigcommerce\.com/i],
  ["PrestaShop", /<meta[^>]+content=["']PrestaShop|prestashop\s*=|\/modules\/ps_/i],
  ["Magento", /Mage\.Cookies|\/static\/version\d+\/frontend\/|text\/x-magento-init/i],
  ["Next.js", /__NEXT_DATA__|\/_next\/static\//],
  ["Nuxt", /__NUXT__|\/_nuxt\//],
  ["Gatsby", /___gatsby|<meta[^>]+content=["']Gatsby/i],
  ["Hugo", /<meta[^>]+content=["']Hugo\s/i],
];

const SHOP: [string, RegExp][] = [
  ["Shopify", /cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i],
  ["WooCommerce", /\/plugins\/woocommerce\/|woocommerce-|wc-ajax|wc_add_to_cart/i],
  ["BigCommerce", /cdn\d*\.bigcommerce\.com/i],
  ["Wix Stores", /wixstores|wix-stores|ecom\.wix/i],
  ["Squarespace Commerce", /sqs-add-to-cart|squarespace-commerce|\/commerce\/cart/i],
  ["Ecwid", /app\.ecwid\.com|ecwid_/i],
  ["PrestaShop", /<meta[^>]+content=["']PrestaShop|prestashop\s*=/i],
  ["Magento", /Mage\.Cookies|\/static\/version\d+\/frontend\/|text\/x-magento-init/i],
  ["OpenCart", /catalog\/view\/theme\/|route=checkout\/cart/i],
  ["Shopware", /shopware/i],
  ["Snipcart", /cdn\.snipcart\.com/i],
  ["Gumroad", /gumroad\.com\/js/i],
];

const ANALYTICS: [string, RegExp][] = [
  ["GA4", /googletagmanager\.com\/gtag\/js\?id=G-|gtag\(\s*['"]config['"]\s*,\s*['"]G-/i],
  ["Google Tag Manager", /googletagmanager\.com\/gtm\.js|['"]GTM-[A-Z0-9]{4,}['"]|googletagmanager\.com\/ns\.html\?id=GTM-/i],
  ["Universal Analytics (old)", /google-analytics\.com\/(?:analytics|ga)\.js|['"]UA-\d{4,}-\d+['"]|gtag\/js\?id=UA-/i],
  ["Plausible", /plausible\.io\/js/i],
  ["Matomo", /matomo\.js|piwik\.js|_paq\.push/i],
  ["Hotjar", /static\.hotjar\.com|hotjar\.com\/c\/hotjar/i],
  ["Microsoft Clarity", /clarity\.ms\/tag/i],
  ["Fathom", /cdn\.usefathom\.com/i],
  ["Cloudflare Web Analytics", /static\.cloudflareinsights\.com\/beacon/i],
  ["Mixpanel", /cdn\.mxpnl\.com|mixpanel\.init/i],
  ["Segment", /cdn\.segment\.com\/analytics\.js/i],
  ["Heap", /heap(?:analytics)?\.(?:com|io)\/js\/heap|heap\.load\(/i],
  ["PostHog", /posthog\.init|posthog\.com\/static\/array\.js|i\.posthog\.com/i],
  ["Umami", /umami\.(?:is|js)|data-website-id=["'][0-9a-f-]{36}["']/i],
  ["Simple Analytics", /scripts\.simpleanalyticscdn\.com/i],
  ["Yandex Metrica", /mc\.yandex\.ru\/metrika/i],
  ["Adobe Analytics", /assets\.adobedtm\.com|omtrdc\.net/i],
  ["Wix Analytics", /frog\.wix\.com/i],
  ["Jetpack Stats", /stats\.wp\.com\/e-/i],
];

const PIXELS: [string, RegExp][] = [
  ["Meta Pixel", /connect\.facebook\.net\/[^"']*\/fbevents\.js|fbq\(\s*['"]init['"]/i],
  ["Google Ads", /googleadservices\.com\/pagead\/conversion|gtag\/js\?id=AW-|['"]AW-\d{6,}['"]/i],
  ["LinkedIn Insight", /snap\.licdn\.com\/li\.lms-analytics|_linkedin_partner_id/i],
  ["TikTok Pixel", /analytics\.tiktok\.com\/i18n\/pixel|ttq\.load\(/i],
  ["Pinterest Tag", /s\.pinimg\.com\/ct\/core\.js|pintrk\(\s*['"]load['"]/i],
  ["Snap Pixel", /sc-static\.net\/scevent\.min\.js|snaptr\(\s*['"]init['"]/i],
  ["X (Twitter) Pixel", /static\.ads-twitter\.com\/uwt\.js|twq\(\s*['"]init['"]/i],
  ["Microsoft Ads", /bat\.bing\.com\/bat\.js/i],
];

const BOOKING: [string, RegExp][] = [
  ["Calendly", /calendly\.com\//i],
  ["Acuity", /acuityscheduling\.com|\.as\.me\//i],
  ["Cal.com", /\b(?:app\.)?cal\.com\/[\w-]/i],
  ["SimplyBook", /simplybook\.(?:me|it|asia|cc)/i],
  ["Setmore", /setmore\.com/i],
  ["Square Appointments", /squareup\.com\/appointments|square\.site\/book|book\.squareup\.com/i],
  ["Booksy", /booksy\.com/i],
  ["Fresha", /fresha\.com/i],
  ["HubSpot meetings", /meetings(?:-eu1)?\.hubspot\.com/i],
  ["OpenTable", /opentable\.(?:com|co\.uk|fr|de|ca)/i],
  ["Resy", /widgets\.resy\.com|resy\.com\/cities/i],
  ["TheFork", /thefork\.|lafourchette\.com/i],
  ["Mindbody", /mindbodyonline\.com|widgets\.mindbodyonline|healcode\.com/i],
  ["Vagaro", /vagaro\.com/i],
  ["Zoho Bookings", /bookings\.zoho\.|zohobookings\./i],
  ["Microsoft Bookings", /outlook\.office365\.com\/owa\/calendar\/[^"']*\/bookings|book\.ms\//i],
  ["Doctolib", /doctolib\.(?:fr|de|it)/i],
  ["Planity", /planity\.com/i],
  ["Timely", /gettimely\.com|bookings\.gettimely/i],
  ["YouCanBookMe", /youcanbook\.me/i],
  ["SavvyCal", /savvycal\.com/i],
  ["TidyCal", /tidycal\.com/i],
  ["Treatwell", /treatwell\./i],
  ["Tock", /exploretock\.com/i],
  ["Appointy", /appointy\.com/i],
  ["Wix Bookings", /wix-bookings|bookings-widget\.wix/i],
  ["Amelia", /\/plugins\/ameliabooking\//i],
  ["Bookly", /\/plugins\/bookly-/i],
];

const CHAT: [string, RegExp][] = [
  ["Intercom", /widget\.intercom\.io|js\.intercomcdn\.com|intercomSettings/i],
  ["Drift", /js\.driftt\.com|drift\.load\(/i],
  ["Tawk.to", /embed\.tawk\.to/i],
  ["Crisp", /client\.crisp\.chat/i],
  ["Tidio", /code\.tidio\.co/i],
  ["LiveChat", /cdn\.livechatinc\.com/i],
  ["Zendesk", /static\.zdassets\.com|zopim\.com/i],
  ["HubSpot chat", /js\.usemessages\.com/i],
  ["Freshchat", /wchat\.freshchat\.com|fw-cdn\.com/i],
  ["Olark", /static\.olark\.com/i],
  ["Chatra", /call\.chatra\.io/i],
  ["Smartsupp", /smartsuppchat\.com/i],
  ["JivoChat", /code\.jivosite\.com|code\.jivo\.ru/i],
  ["Zoho SalesIQ", /salesiq\.zoho/i],
  ["Help Scout Beacon", /beacon-v2\.helpscout\.net/i],
  ["Gorgias", /config\.gorgias\.chat/i],
  ["Userlike", /userlike-cdn-widgets/i],
  ["Trengo", /static\.widget\.trengo\.eu/i],
  ["Messenger", /connect\.facebook\.net\/[^"']*\/sdk\/xfbml\.customerchat|class=["'][^"']*fb-customerchat|href=["']https?:\/\/m\.me\//i],
  ["Chatbase", /chatbase\.co\/embed/i],
  ["Voiceflow", /cdn\.voiceflow\.com/i],
  ["Botpress", /cdn\.botpress\.cloud/i],
  ["Landbot", /cdn\.landbot\.io/i],
  ["Kommunicate", /widget\.kommunicate\.io/i],
];

const FORM_EMBEDS: [string, RegExp][] = [
  ["HubSpot Forms", /js\.hsforms\.net|hbspt\.forms\.create/i],
  ["Typeform", /embed\.typeform\.com|\.typeform\.com\/to\//i],
  ["Jotform", /form\.jotform\.com|jotfor\.ms/i],
  ["Google Forms", /docs\.google\.com\/forms/i],
  ["Tally", /tally\.so\/(?:embed|widgets|r)\//i],
  ["Wufoo", /wufoo\.com\/embed/i],
  ["Formstack", /formstack\.com\/forms/i],
  ["Cognito Forms", /cognitoforms\.com/i],
  ["Microsoft Forms", /forms\.office\.com|forms\.microsoft\.com/i],
  ["Zoho Forms", /forms\.zohopublic\./i],
];

const NEWSLETTER: RegExp =
  /list-manage\.com\/subscribe|chimpstatic\.com|static\.klaviyo\.com|klaviyo-form|convertkit\.com|ck\.page|mailerlite\.com|ml-embedded|sibforms\.com|sendinblue|substack\.com\/embed|beehiiv\.com|createsend\.com|aweber\.com/i;

const CRM: [string, RegExp][] = [
  ["HubSpot", /js\.hs-scripts\.com|js\.hsforms\.net|js\.hs-analytics\.net|hbspt\./i],
  ["Mailchimp", /list-manage\.com|chimpstatic\.com/i],
  ["Klaviyo", /klaviyo\.com/i],
  ["ActiveCampaign", /trackcmp\.net|activehosted\.com/i],
  ["Zoho", /zoho\.(?:com|eu|in)|zohopublic\./i],
  ["Salesforce", /pardot\.com|salesforce\.com|force\.com\/servlet\/servlet\.WebToLead/i],
  ["Brevo", /sibforms\.com|sendinblue|brevo\.com/i],
  ["MailerLite", /mailerlite\.com/i],
  ["ConvertKit", /convertkit\.com|ck\.page/i],
  ["Keap", /infusionsoft\.com|keap\.app/i],
  ["Marketo", /munchkin\.marketo\.net|mktoForms/i],
  ["Pipedrive", /leadbooster-chat\.pipedrive\.com|pipedrivewebforms/i],
  ["HighLevel", /leadconnectorhq\.com|msgsndr\.com/i],
  ["Omnisend", /omnisnippet|omnisend\.com/i],
];

/** A chat launcher built into the site: labelled or named as chat. */
const CUSTOM_CHAT =
  /<(?:button|a|div)\b[^>]*(?:aria-label|title)=["'][^"']*\b(?:chat with|live chat|open (?:the )?chat|chat now|start (?:a )?chat|ask our (?:ai )?assistant|discuter avec|ouvrir le chat|zungumza na)\b[^"']*["']|(?:id|class)=["'][^"']*\b(?:chat-widget|chatbot|chat-launcher|live-chat|chat-bubble)\b/i;

const SOCIAL: [string, RegExp][] = [
  ["Facebook", /^https?:\/\/(?:[\w-]+\.)?facebook\.com\/(?!sharer|share\.php|dialog|plugins|tr\b)[\w.-]+/i],
  ["Instagram", /^https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|explore)[\w.-]+/i],
  ["LinkedIn", /^https?:\/\/(?:[\w-]+\.)?linkedin\.com\/(?:company|in|school|showcase)\//i],
  ["X", /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!intent|share|home)[\w]+/i],
  ["YouTube", /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:@|channel\/|c\/|user\/)|youtu\.be\/)/i],
  ["TikTok", /^https?:\/\/(?:www\.)?tiktok\.com\/@/i],
];

const REVIEW_WIDGETS =
  /widget\.trustpilot\.com|trustpilot-widget|elfsight\.com|elfsightcdn\.com|trustindex\.io|reviewsonmywebsite|google-reviews|grw-|yotpo\.com|judge\.me|judgeme|stamped\.io|okendo\.io|reviews\.io|widget\.reviews\.co|feefo\.com|birdeye\.com|cl\.avis-verifies\.com|guaranteed-reviews|loox\.io|spr-reviews|shopify-product-reviews|ekomi|trustedshops/i;

/** Action words in link and button labels. EN, FR, SW. */
const CTA_WORDS =
  /(?<![\p{L}])(?:book|booking|reserve|schedule|contact|get a quote|quote|get started|start|buy|shop now|order|add to cart|call|sign up|subscribe|register|enquire|inquire|request|apply|donate|try|demo|download|join|hire|talk to|let'?s talk|free trial|get in touch|réserver|reservez|réservez|demander|demandez|devis|contactez|contacter|nous contacter|acheter|achetez|commander|commandez|commencer|commencez|appeler|appelez|s'inscrire|inscrivez|abonnez|s'abonner|essayer|essayez|rejoindre|rejoignez|rendez-vous|écrivez-nous|télécharger|téléchargez|wasiliana|nunua|agiza|weka nafasi|jisajili|piga simu|anza|omba)(?![\p{L}])/iu;

interface LibRule { name: string; slugs: string[]; outdated: (v: string | null) => boolean }

const LIBS: LibRule[] = [
  // jQuery before 3.5.0 has the published htmlPrefilter XSS issues.
  { name: "jQuery", slugs: ["jquery"], outdated: (v) => !!v && cmpVersion(v, "3.5.0") < 0 },
  { name: "jQuery UI", slugs: ["jquery-ui", "jqueryui"], outdated: (v) => !!v && cmpVersion(v, "1.13.0") < 0 },
  { name: "Bootstrap", slugs: ["bootstrap", "twitter-bootstrap"], outdated: (v) => !!v && cmpVersion(v, "4.0.0") < 0 },
  // AngularJS (1.x) reached end of life in December 2021; any version is outdated.
  { name: "AngularJS", slugs: ["angular.js", "angularjs", "angular"], outdated: (v) => !v || v.startsWith("1.") },
  { name: "Moment.js", slugs: ["moment.js", "moment"], outdated: (v) => !!v && cmpVersion(v, "2.29.4") < 0 },
  { name: "Lodash", slugs: ["lodash.js", "lodash"], outdated: (v) => !!v && cmpVersion(v, "4.17.21") < 0 },
  // Vue 2 reached end of life in December 2023.
  { name: "Vue", slugs: ["vue"], outdated: (v) => !!v && cmpVersion(v, "3.0.0") < 0 },
  { name: "Prototype", slugs: ["prototype"], outdated: () => true },
  { name: "MooTools", slugs: ["mootools", "mootools-core"], outdated: () => true },
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const VER = String.raw`v?(\d+\.\d+(?:\.\d+)?)`;

/** A version for one library from one asset URL, or undefined when the URL is not that library. */
function libVersion(url: string, slug: string): string | null | undefined {
  const s = esc(slug);
  const patterns = [
    // cdnjs / Google: /ajax/libs/jquery/3.6.0/jquery.min.js
    new RegExp(`/${s}/${VER}/`, "i"),
    // jsdelivr / unpkg: jquery@3.6.0
    new RegExp(`(?:^|/)${s}@${VER}`, "i"),
    // file name: jquery-1.12.4.min.js, bootstrap.3.3.7.min.css
    new RegExp(`(?:^|/)${s}[-.]${VER}(?:\\.min|\\.slim|\\.bundle)*\\.(?:js|css)`, "i"),
    // WordPress core copies: /wp-includes/js/jquery/jquery.min.js?ver=3.6.0. Elsewhere
    // ?ver= is usually the theme or plugin version, not the library's.
    new RegExp(`/wp-includes/.*/${s}(?:\\.min)?\\.js\\?(?:[^"']*&)?ver=${VER}`, "i"),
  ];
  for (const re of patterns) {
    const m = re.exec(url);
    if (m) return m[1];
  }
  // The library with no version we can read.
  if (new RegExp(`/${s}(?:\\.min)?\\.js(?:[?#]|$)`, "i").test(url)) return null;
  return undefined;
}

function detectLibraries(html: string): Tech["libraries"] {
  const urls: string[] = [];
  for (const m of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi)) urls.push(m[1]);
  const found = new Map<string, string | null>();
  for (const rule of LIBS) {
    for (const url of urls) {
      // Plugins of a library are not the library (jquery-migrate, bootstrap-datepicker).
      for (const slug of rule.slugs) {
        const v = libVersion(url, slug);
        if (v === undefined) continue;
        const prev = found.get(rule.name);
        // Keep the lowest version seen; a versioned hit beats an unversioned one.
        if (prev === undefined || prev === null || (v && cmpVersion(v, prev) < 0)) found.set(rule.name, v ?? prev ?? null);
      }
    }
  }
  // Banner comments in inline scripts.
  const banners: [string, RegExp][] = [
    ["jQuery", /jQuery (?:JavaScript Library )?v(\d+\.\d+\.\d+)/],
    ["Bootstrap", /Bootstrap v(\d+\.\d+\.\d+)/],
    ["AngularJS", /AngularJS v(\d+\.\d+\.\d+)/],
  ];
  for (const [name, re] of banners) {
    const m = re.exec(html);
    if (m && !found.get(name)) found.set(name, m[1]);
  }
  // AngularJS apps announce themselves with ng-app even when bundled.
  if (!found.has("AngularJS") && /<[^>]+\sng-app(?:=|\s|>)/i.test(html)) found.set("AngularJS", null);
  // Modern Angular sets ng-version; that is not AngularJS.
  if (/\sng-version=["']\d/i.test(html) && found.get("AngularJS") == null) found.delete("AngularJS");

  return LIBS.filter((r) => found.has(r.name)).map((r) => {
    const version = found.get(r.name) ?? null;
    return { name: r.name, version, outdated: r.outdated(version) };
  });
}

function countForms(html: string): { native: number; embeds: string[]; signup: boolean } {
  let native = 0;
  let signup = false;
  for (const m of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const attrs = m[1];
    const body = m[2];
    if (/role=["']search["']/i.test(attrs) || /action=["'][^"']*search/i.test(attrs)) continue;
    if (/action=["'][^"']*\/cart(?:\/add)?/i.test(attrs)) continue;
    const inputs = body.match(/<(?:input|textarea|select)\b[^>]*>/gi) ?? [];
    const fields = inputs.filter((i) => !/type=["'](?:hidden|submit|button|image|reset)["']/i.test(i));
    if (fields.length === 0) continue;
    const searchy = fields.every((i) => /type=["']search["']|name=["'](?:s|q|query|search|keywords?)["']/i.test(i));
    if (searchy) continue;
    native++;
    // A short form built around an email field is a signup, not a contact form.
    const email = fields.some((i) => /type=["']email["']|(?:name|id)=["'][^"']*e-?mail/i.test(i));
    if (email && !/<textarea/i.test(body) && fields.length <= 3) signup = true;
  }
  return { native, embeds: allMatches(html, FORM_EMBEDS), signup };
}

const LANGUAGE_NAMES =
  />\s*(English|Français|Francais|Español|Espanol|Deutsch|Italiano|Português|Portugues|Nederlands|Kiswahili|Swahili|العربية|中文|日本語|Русский|Polski|Türkçe)\s*</gi;

function detectLanguages(html: string): { languages: string[]; switcher: boolean } {
  const langs = new Set<string>();
  const htmlLang = /<html[^>]+lang=["']([a-z]{2,3})/i.exec(html);
  if (htmlLang) langs.add(htmlLang[1].toLowerCase());
  for (const m of html.matchAll(/<link\b[^>]*hreflang=["']([a-z]{2,3})(?:-[a-z0-9]+)?["'][^>]*>/gi)) {
    langs.add(m[1].toLowerCase());
  }
  // A visible language switcher: <a hreflang>, the usual plugins, or links to /fr/ /en/ style paths.
  const plugin = /wpml|polylang|weglot|gtranslate|translatepress|lang(?:uage)?[-_]?(?:switch|select|picker|menu)|trp-language|glink\b/i.test(html);
  const anchorHreflang = /<a\b[^>]*hreflang=["'][a-z]{2}/i.test(html);
  const pathLangs = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*href=["'](?:https?:\/\/[^/"']+)?\/(en|fr|es|de|it|pt|nl|sw|ar|zh|ja|ru|pl|tr)(?:[-_][a-z]{2})?\/?["'#?]/gi)) {
    pathLangs.add(m[1].toLowerCase());
  }
  // A dropdown of language names (English / Français / Kiswahili ...).
  let selectSwitcher = false;
  for (const m of html.matchAll(/<select\b[\s\S]*?<\/select>/gi)) {
    const names = (m[0].match(LANGUAGE_NAMES) ?? []).map((n) => n.toLowerCase());
    if (new Set(names).size >= 2) { selectSwitcher = true; break; }
  }
  const switcher = plugin || anchorHreflang || selectSwitcher || pathLangs.size >= 2 ||
    (pathLangs.size === 1 && !!htmlLang && !pathLangs.has(htmlLang[1].toLowerCase()));
  return { languages: [...langs], switcher };
}

function copyrightYear(text: string, now: number): number | null {
  let best: number | null = null;
  for (const m of text.matchAll(/(?:©|\(c\)|copyright)\s*(?:(?:19|20)\d{2}\s*[-–—/]\s*)?((?:19|20)\d{2})/gi)) {
    const y = Number(m[1]);
    if (y >= 1995 && y <= now + 1 && (best === null || y > best)) best = y;
  }
  return best;
}

// ── Main audit ────────────────────────────────────────────────────────────

export function extraAudit(s: ExtraSignals): ExtraResult {
  const html = s.html;
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.headers)) headers[k.toLowerCase()] = v;
  let https = false;
  try { https = new URL(s.finalUrl).protocol === "https:"; } catch { /* keep false */ }
  const nowYear = new Date().getUTCFullYear();

  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const text = stripTags(visible);
  const words = text ? text.split(" ").length : 0;
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map((m) => decodeEntities(m[1]));

  // ── Tech ────────────────────────────────────────────────────────────────
  const gens = generators(html);
  const cms = firstMatch(html, CMS);
  let cmsVersion: string | null = null;
  for (const g of gens) {
    const m = /^(WordPress|Joomla!?|Drupal|Ghost|TYPO3 CMS|PrestaShop|Hugo|Gatsby|Craft CMS|Concrete CMS|DNN|Umbraco|Wix\.com Website Builder)[\s-]+(?:v(?:ersion)?\s*)?(\d+(?:\.\d+){0,2})/i.exec(g);
    if (m && !/^Wix/i.test(m[1])) { cmsVersion = m[2]; break; }
  }
  if (!cmsVersion && cms === "WordPress") {
    // WordPress puts its own version on core assets.
    const core = /\/wp-includes\/(?:css\/dist\/block-library|js\/wp-emoji-release|js\/wp-embed)[^"'?]*\?ver=(\d+\.\d+(?:\.\d+)?)/i.exec(html);
    cmsVersion = core?.[1] ?? null;
  }

  const shop = firstMatch(html, SHOP);
  const analytics = allMatches(html, ANALYTICS);
  const pixels = allMatches(html, PIXELS);
  const bookingTool = firstMatch(html, BOOKING);
  const bookingLink = hrefs.some((h) =>
    /\/(?:book(?:ing|ings)?|appointments?|schedule|reservations?|rendez-vous|prendre-rendez-vous|reserver|réserver|reservation)(?:[/?#.-]|$)/i.test(h.replace(/^https?:\/\/[^/]+/i, "")),
  );
  const whatsapp = /(?:href=["'](?:https?:\/\/)?(?:wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send)|whatsapp:\/\/send)/i.test(html);
  const chat = allMatches(html, CHAT);
  // A site's own chat assistant (no vendor script): a launcher labelled as chat.
  if (!chat.length && CUSTOM_CHAT.test(html)) chat.push("Built-in chat assistant");
  if (whatsapp) chat.push("WhatsApp");

  const { native, embeds, signup } = countForms(html);
  const forms = native + embeds.length;
  const emailCapture = signup || NEWSLETTER.test(html) ||
    /<(?:input|form|div|section)\b[^>]*(?:name|id|class)=["'][^"']*(?:newsletter|subscribe|signup|sign-up|optin|opt-in)[^"']*["']/i.test(html);
  const clickToCall = /href=["']tel:/i.test(html);

  const labels = new Set<string>();
  for (const m of html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const label = stripTags(m[2]).toLowerCase();
    if (label && label.length <= 40 && CTA_WORDS.test(label)) labels.add(label);
  }
  for (const m of html.matchAll(/<input\b[^>]*type=["']submit["'][^>]*value=["']([^"']+)["']/gi)) {
    const label = decodeEntities(m[1]).trim().toLowerCase();
    if (label && label.length <= 40 && CTA_WORDS.test(label)) labels.add(label);
  }
  const ctaCount = labels.size;

  const { languages, switcher } = detectLanguages(html);
  const libraries = detectLibraries(html);
  const year = copyrightYear(text, nowYear);

  const socialLinks: string[] = [];
  for (const [name, re] of SOCIAL) if (hrefs.some((h) => re.test(h))) socialLinks.push(name);

  const reviews = /"@type"\s*:\s*"(?:AggregateRating|Review)"|itemprop=["'](?:aggregateRating|review)["']/i.test(html) ||
    REVIEW_WIDGETS.test(html) ||
    /(?:class|id)=["'][^"']*\b(?:testimonials?|reviews?|temoignages?|t[ée]moignages?|avis-clients?)\b/i.test(html) ||
    /<h[1-4][^>]*>[^<]*(?:testimonials?|reviews|what (?:our )?(?:clients|customers) say|témoignages|avis (?:de nos )?clients|ils nous font confiance|maoni ya wateja|shuhuda)/i.test(html);

  let mixedContent = 0;
  if (https) {
    mixedContent += (html.match(/<(?:script|img|iframe|video|audio|source|embed)\b[^>]*\bsrc=["']http:\/\//gi) ?? []).length;
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      if (/rel=["'][^"']*stylesheet/i.test(m[0]) && /href=["']http:\/\//i.test(m[0])) mixedContent++;
    }
  }

  const tech: Tech = {
    cms, cmsVersion, shop, analytics, pixels, booking: bookingTool, chat, forms, emailCapture,
    clickToCall, whatsapp, ctaCount, languages, libraries, copyrightYear: year, socialLinks, reviews, mixedContent,
  };

  // ── Checks ──────────────────────────────────────────────────────────────
  const leadOk = forms > 0 || emailCapture;
  const hasGa4 = analytics.includes("GA4") || analytics.includes("Google Tag Manager");
  const uaOnly = analytics.includes("Universal Analytics (old)") && !hasGa4;
  const outdated = libraries.filter((l) => l.outdated);
  const libList = outdated.map((l) => (l.version ? `${l.name} ${l.version}` : l.name)).join(", ");
  const multi = languages.length >= 2 || switcher;

  const checks: Check[] = [
    // ── Growth ────────────────────────────────────────────────────────────
    { key: "lead-capture", area: "growth", weight: 3, service: "lead-capture", impact: 3, pass: leadOk,
      good: "Visitors can leave their details: a contact form or email signup is on the page",
      bad: "No contact form or email signup, so interested visitors leave without a way to reach you" },
    { key: "cta", area: "growth", weight: 2, service: "lead-capture", impact: 2, pass: ctaCount >= 2,
      score: ctaCount >= 2 ? 1 : ctaCount === 1 ? 0.5 : 0,
      good: `${ctaCount} clear calls to action (book, contact, buy...) guide visitors to the next step`,
      bad: ctaCount === 0 ? "No clear call to action, so visitors are not told what to do next"
        : "Only one clear call to action; most visitors need a second prompt to act",
      badMsg: ctaCount === 0 ? "cta.bad.none" : "cta.bad.one", vars: { n: ctaCount } },
    { key: "click-to-call", area: "growth", weight: 1, service: "lead-capture", impact: 2, pass: clickToCall, soft: true,
      good: "Phone number is a tap-to-call link",
      bad: "No tap-to-call link, so mobile visitors have to copy your number by hand" },
    { key: "whatsapp", area: "growth", weight: 1, service: "lead-capture", impact: 1, pass: whatsapp, soft: true,
      good: "WhatsApp contact link present",
      bad: "No WhatsApp link, a channel many customers prefer to email or phone" },
    // A store sells online rather than by appointment: booking is a suggestion there, not a defect.
    { key: "booking", area: "growth", weight: shop ? 1 : 3, service: "booking", impact: shop ? 1 : 3, pass: !!bookingTool || bookingLink, soft: !!shop,
      good: bookingTool ? `Online booking is in place (${bookingTool})` : "A booking or appointment page is linked",
      goodMsg: bookingTool ? "booking.good" : "booking.good.link",
      bad: "No online booking, so customers have to call or email to get an appointment",
      ...(bookingTool ? { vars: { tool: bookingTool } } : {}) },
    { key: "live-chat", area: "growth", weight: 2, service: "ai-assistant", impact: 2, pass: chat.length > 0, soft: true,
      good: `Live chat or messaging available (${chat.join(", ")})`,
      bad: "No live chat, so questions asked outside office hours go unanswered",
      vars: { tools: chat.join(", ") } },
    { key: "analytics", area: "growth", weight: 3, service: "analytics", impact: 3, pass: analytics.length > 0,
      good: `Visitor analytics installed (${analytics.join(", ")})`,
      bad: "No analytics detected, so there is no record of where visitors come from or what they do",
      vars: { tools: analytics.join(", ") } },
    ...(analytics.includes("Universal Analytics (old)") ? [{
      key: "analytics-legacy", area: "growth" as const, weight: 2, service: "analytics" as const, impact: 2 as const, pass: !uaOnly,
      good: "Google Analytics 4 is installed; the old Universal Analytics tag can be removed",
      bad: "Only the old Universal Analytics tag is installed; Google stopped collecting its data in July 2023",
    }] : []),
    { key: "pixels", area: "growth", weight: 1, service: "analytics", impact: 1, pass: pixels.length > 0, soft: true,
      good: `Ad tracking pixels installed (${pixels.join(", ")})`,
      bad: "No advertising pixel, so you cannot retarget visitors or measure ad conversions",
      vars: { tools: pixels.join(", ") } },
    { key: "social-proof", area: "growth", weight: 2, service: "content", impact: 2, pass: reviews,
      good: "Reviews or testimonials are shown on the page",
      bad: "No reviews or testimonials, so new visitors have no proof that others trust you" },
    { key: "social-links", area: "growth", weight: 1, service: "content", impact: 1, pass: socialLinks.length >= 2, soft: true,
      score: socialLinks.length >= 2 ? 1 : socialLinks.length === 1 ? 0.5 : 0,
      good: `Linked social profiles: ${socialLinks.join(", ")}`,
      bad: socialLinks.length === 0 ? "No links to social media profiles" : `Only one social profile linked (${socialLinks.join(", ")})`,
      badMsg: socialLinks.length === 0 ? "social-links.bad.none" : "social-links.bad.one",
      vars: { n: socialLinks.length, names: socialLinks.join(", ") } },
    ...(year !== null ? [{
      key: "freshness", area: "growth" as const, weight: 1, service: "content" as const, impact: 1 as const,
      pass: year >= nowYear - 1, score: year >= nowYear - 1 ? 1 : nowYear - year <= 2 ? 0.5 : 0,
      good: `Footer copyright is current (${year})`,
      bad: `Footer copyright says ${year}; visitors read an old date as a sign the site is not looked after`,
      vars: { year: String(year) },
    }] : []),
    { key: "multilingual", area: "growth", weight: 1, service: "multilingual", impact: 1, pass: multi, soft: true,
      good: languages.length >= 2 ? `Available in several languages (${languages.join(", ")})` : "A language switcher is on the page",
      goodMsg: languages.length >= 2 ? "multilingual.good" : "multilingual.good.switcher",
      bad: "Single language only, so visitors who read another language are left out",
      ...(languages.length >= 2 ? { vars: { langs: languages.join(", ") } } : {}) },

    // ── Security ──────────────────────────────────────────────────────────
    { key: "hsts", area: "security", weight: 2, service: "security", impact: 2, pass: !!headers["strict-transport-security"],
      good: "Strict-Transport-Security is set, so browsers always use HTTPS",
      bad: "Missing Strict-Transport-Security header, so a first visit can still be downgraded to plain HTTP" },
    (() => {
      const csp = headers["content-security-policy"];
      const reportOnly = !csp && !!headers["content-security-policy-report-only"];
      return { key: "csp", area: "security" as const, weight: 2, service: "security" as const, impact: 2 as const, pass: !!csp, soft: true,
        score: csp ? 1 : reportOnly ? 0.5 : 0,
        good: "Content-Security-Policy header is set, limiting which scripts can run",
        bad: reportOnly ? "Content-Security-Policy is in report-only mode, so it does not block anything yet"
          : "Missing Content-Security-Policy header, the main browser defence against injected scripts",
        badMsg: reportOnly ? "csp.bad.report" : "csp.bad" };
    })(),
    { key: "x-frame", area: "security", weight: 1, service: "security", impact: 1,
      pass: !!headers["x-frame-options"] || /frame-ancestors/i.test(headers["content-security-policy"] ?? ""),
      good: "Framing is restricted (X-Frame-Options or frame-ancestors)",
      bad: "Missing X-Frame-Options or frame-ancestors, so other sites can embed your pages in a frame" },
    { key: "x-content-type", area: "security", weight: 1, service: "security", impact: 1,
      pass: /nosniff/i.test(headers["x-content-type-options"] ?? ""),
      good: "X-Content-Type-Options: nosniff is set",
      bad: "Missing X-Content-Type-Options: nosniff header" },
    { key: "referrer-policy", area: "security", weight: 1, service: "security", impact: 1, soft: true,
      pass: !!headers["referrer-policy"] || !!metaContent(html, "referrer"),
      good: "Referrer-Policy is set",
      bad: "No Referrer-Policy, so full page addresses can be passed on to other sites" },
    (() => {
      const leaked = ["server", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version"]
        .map((h) => headers[h])
        .filter((v): v is string => !!v && /\d+\.\d+/.test(v));
      const banner = leaked.join("; ").slice(0, 80);
      return { key: "server-banner", area: "security" as const, weight: 2, service: "security" as const, impact: 2 as const,
        pass: leaked.length === 0,
        good: "Server headers do not advertise software versions",
        bad: `Server headers advertise software versions (${banner}), which tells attackers exactly what to look up`,
        vars: { banner } };
    })(),
    { key: "cms-version", area: "security", weight: 2, service: "security", impact: 2, pass: !cmsVersion, soft: true,
      score: cmsVersion ? 0.5 : 1,
      good: "The page does not advertise its CMS version",
      bad: `The page advertises ${cms ?? "its CMS"} version ${cmsVersion}, so anyone can see when it falls behind on updates`,
      vars: { cms: cms ?? "CMS", version: cmsVersion ?? "" } },
    { key: "outdated-libs", area: "security", weight: 3, service: "security", impact: 3, pass: outdated.length === 0,
      good: "No outdated JavaScript libraries detected",
      bad: `Outdated JavaScript libraries with published security fixes: ${libList}`,
      vars: { libs: libList } },
    ...(https ? [{
      key: "mixed-content", area: "security" as const, weight: 2, service: "security" as const, impact: 2 as const,
      pass: mixedContent === 0,
      good: "All scripts, images and frames load over HTTPS",
      bad: `Files loaded over plain HTTP on this HTTPS page: ${mixedContent} (scripts, images or frames). Browsers block or flag them`,
      vars: { n: mixedContent },
    }] : []),
  ];

  if (s.dns) {
    const spf = s.dns.spf;
    const open = !!spf && /(?:^|\s)[+?]?all\b/i.test(spf) && !/[-~]all\b/i.test(spf);
    checks.push({
      key: "spf", area: "security", weight: 2, service: "email", impact: 2, pass: !!spf && !open,
      score: !spf ? 0 : open ? 0.5 : 1,
      good: "SPF record lists who may send email for this domain",
      bad: !spf ? "No SPF record, so anyone can send email that claims to come from this domain"
        : "SPF record ends in a permissive \"all\", so it does not stop spoofed email",
      badMsg: !spf ? "spf.bad" : "spf.bad.open",
    });
    const dmarc = s.dns.dmarc;
    const policy = dmarc ? (/\bp\s*=\s*(none|quarantine|reject)/i.exec(dmarc)?.[1]?.toLowerCase() ?? "none") : null;
    checks.push({
      key: "dmarc", area: "security", weight: 3, service: "email", impact: 3, pass: policy === "quarantine" || policy === "reject",
      score: policy === "quarantine" || policy === "reject" ? 1 : policy === "none" ? 0.5 : 0,
      good: `DMARC policy is enforced (p=${policy})`,
      bad: policy === "none" ? "DMARC is set to p=none, so spoofed email is reported but still delivered"
        : "No DMARC record, so your emails are more likely to land in spam and your domain can be impersonated",
      badMsg: policy === "none" ? "dmarc.bad.none" : "dmarc.bad",
      ...(policy ? { vars: { policy } } : {}),
    });
  }

  const byArea = (area: ExtraArea) => {
    const list = checks.filter((c) => c.area === area);
    const total = list.reduce((n, c) => n + c.weight, 0);
    const got = list.reduce((n, c) => n + c.weight * (c.score ?? (c.pass ? 1 : 0)), 0);
    return total === 0 ? 0 : Math.round((got / total) * 100);
  };

  const findings = toFindings(checks);

  // ── Opportunities ───────────────────────────────────────────────────────
  const lowerText = text.toLowerCase();
  const serviceBiz = forms > 0 || clickToCall ||
    /appointment|consultation|rendez-vous|reservation|réservation|clinic|clinique|salon|spa\b|dental|dentist|restaurant|therap|coaching|lessons?\b|cours\b|miadi|huduma/i.test(lowerText);
  const productWords = /add to cart|buy now|shop now|order now|ajouter au panier|acheter|boutique|our products|nos produits|nunua sasa|(?:[$€£]\s?\d)|(?:\d\s?(?:€|eur|fcfa|xof|ksh|tsh)\b)/i.test(lowerText);
  const quoteWords = /get a quote|request a quote|free quote|free estimate|quotation|\bestimate\b|pricing|devis|tarifs?\b|nukuu|makadirio|bei\b/i.test(lowerText);
  const loginWords = /\blog ?in\b|sign in|my account|client (?:area|portal|login)|customer portal|portal\b|connexion|se connecter|mon compte|espace (?:client|membre)|ingia|akaunti yangu/i.test(lowerText) ||
    /href=["'][^"']*\/(?:login|signin|sign-in|account|my-account|portal|connexion|mon-compte)(?:[/?#"'])/i.test(html);
  const faqish = /\bfaq\b|frequently asked|questions fréquentes|foire aux questions|maswali yanayoulizwa/i.test(lowerText) || /"@type"\s*:\s*"FAQPage"/i.test(html);
  const crm = allMatches(html, CRM);
  const viewport = !!metaContent(html, "viewport");
  const oldSite = outdated.length > 0 || (year !== null && nowYear - year > 2) || !viewport;

  const ranked: [OpportunityKey, number][] = [];
  const add = (k: OpportunityKey, p: number, when: boolean) => { if (when) ranked.push([k, p]); };
  add("online-booking", 90, !bookingTool && !bookingLink && serviceBiz && !shop);
  add("site-rebuild", 88, oldSite);
  add("lead-funnel", 86, !leadOk || ctaCount < 2);
  add("ai-product-recs", 84, !!shop);
  add("ai-chat-assistant", 82, chat.length === 0);
  add("whatsapp-assistant", 80, whatsapp && chat.length === 1);
  add("online-store", 76, !shop && productWords);
  add("crm-automation", 74, forms > 0 && crm.length === 0);
  add("quote-calculator", 72, !shop && quoteWords);
  add("review-engine", 70, !reviews);
  add("analytics-dashboard", 66, analytics.length === 0 || uaOnly);
  add("email-nurture", 62, !emailCapture);
  add("client-portal", 58, loginWords);
  add("ai-faq-search", 56, faqish || words >= 1200);
  add("content-engine", 52, words < 300);
  add("multilingual-site", 50, !multi);
  ranked.sort((a, b) => b[1] - a[1]);

  const opportunities: OpportunityKey[] = ranked.slice(0, 6).map(([k]) => k);
  for (const k of ["ai-chat-assistant", "content-engine", "analytics-dashboard"] as const) {
    if (opportunities.length >= 3) break;
    if (!opportunities.includes(k)) opportunities.push(k);
  }

  return {
    growthScore: byArea("growth"),
    securityScore: byArea("security"),
    findings,
    tech: hideOwnStack(tech, s.finalUrl),
    opportunities,
  };
}

function toFindings(checks: Check[]): ExtraFinding[] {
  const findings: ExtraFinding[] = checks.map((c) => {
    const passed = (c.score ?? (c.pass ? 1 : 0)) >= 0.9;
    const type: FindingType = passed ? "good" : c.soft || (c.score ?? 0) >= 0.5 ? "warning" : "bad";
    return {
      check: c.key,
      area: c.area,
      service: c.service,
      impact: c.impact,
      type,
      text: passed ? c.good : c.bad,
      msg: passed ? c.goodMsg ?? `${c.key}.good` : c.badMsg ?? `${c.key}.bad`,
      ...(c.vars ? { vars: c.vars } : {}),
    };
  });
  // Problems first, and the costliest problems before the nice-to-haves.
  const order: Record<FindingType, number> = { bad: 0, warning: 1, good: 2 };
  findings.sort((a, b) => order[a.type] - order[b.type] || b.impact - a.impact);
  return findings;
}

// ── DNS ───────────────────────────────────────────────────────────────────

const NOT_FOUND = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

/** TXT records, [] when the name has none, throws on a resolver failure. */
async function txt(name: string): Promise<string[]> {
  try {
    return (await resolveTxt(name)).map((parts) => parts.join(""));
  } catch (err) {
    if (NOT_FOUND.has((err as NodeJS.ErrnoException).code ?? "")) return [];
    throw err;
  }
}

/** SPF (TXT on the apex starting v=spf1), DMARC (TXT on _dmarc.<apex>), MX present. */
export async function checkDns(hostname: string): Promise<DnsSignals | null> {
  const apex = hostname.trim().toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  if (!apex || !/^[a-z0-9.-]+$/.test(apex) || !apex.includes(".")) return null;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 4000); });
  const work = (async (): Promise<DnsSignals | null> => {
    try {
      const [apexTxt, dmarcTxt, mx] = await Promise.all([
        txt(apex),
        txt(`_dmarc.${apex}`),
        resolveMx(apex).then((r) => r.length > 0).catch((err: NodeJS.ErrnoException) => {
          if (NOT_FOUND.has(err.code ?? "")) return false;
          throw err;
        }),
      ]);
      return {
        spf: apexTxt.find((r) => /^v=spf1\b/i.test(r.trim())) ?? null,
        dmarc: dmarcTxt.find((r) => /^v=DMARC1\b/i.test(r.trim())) ?? null,
        mx,
      };
    } catch {
      return null;
    }
  })();
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

// ── PageSpeed Insights ────────────────────────────────────────────────────

interface PsiAudit { numericValue?: number }
interface PsiResponse {
  lighthouseResult?: {
    categories?: { performance?: { score?: number | null } };
    audits?: Record<string, PsiAudit | undefined>;
  };
}

/** Google PageSpeed Insights v5, mobile, performance only. null when unset, failed or slow. */
export async function fetchPageSpeed(url: string, timeoutMs = 45_000): Promise<PageSpeedResult | null> {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!key) return null;
  const endpoint =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" +
    `?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as PsiResponse;
    const lh = data.lighthouseResult;
    const score = lh?.categories?.performance?.score;
    if (typeof score !== "number") return null;
    const num = (id: string): number | null => {
      const v = lh?.audits?.[id]?.numericValue;
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };
    const ms = (id: string) => { const v = num(id); return v === null ? null : Math.round(v); };
    const cls = num("cumulative-layout-shift");
    return {
      performance: Math.round(score * 100),
      lcpMs: ms("largest-contentful-paint"),
      cls: cls === null ? null : Math.round(cls * 1000) / 1000,
      tbtMs: ms("total-blocking-time"),
      fcpMs: ms("first-contentful-paint"),
      speedIndexMs: ms("speed-index"),
      strategy: "mobile",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Findings from a PageSpeed result (paid report detail). Area "growth": slow pages lose customers. */
export function pageSpeedFindings(ps: PageSpeedResult): ExtraFinding[] {
  const p = ps.performance;
  const checks: Check[] = [
    { key: "pagespeed", area: "growth", weight: 3, service: "performance", impact: p < 50 ? 3 : 2,
      pass: p >= 90, score: p >= 90 ? 1 : p >= 50 ? 0.5 : 0,
      good: `Google PageSpeed mobile score is ${p}/100`,
      bad: p < 50 ? `Google PageSpeed mobile score is ${p}/100; phone visitors wait and many leave`
        : `Google PageSpeed mobile score is ${p}/100; 90 or more is the target`,
      badMsg: p < 50 ? "pagespeed.bad" : "pagespeed.bad.mid",
      vars: { score: p } },
  ];
  if (ps.lcpMs !== null) {
    const s = Math.round(ps.lcpMs / 100) / 10;
    checks.push({ key: "lcp", area: "growth", weight: 3, service: "performance", impact: 3,
      pass: ps.lcpMs <= 2500, score: ps.lcpMs <= 2500 ? 1 : ps.lcpMs <= 4000 ? 0.5 : 0,
      good: `Main content appears quickly on mobile (${s} s)`,
      bad: `Main content takes ${s} s to appear on mobile; under 2.5 s is the target`,
      vars: { s } });
  }
  if (ps.cls !== null) {
    checks.push({ key: "cls", area: "growth", weight: 2, service: "performance", impact: 2,
      pass: ps.cls <= 0.1, score: ps.cls <= 0.1 ? 1 : ps.cls <= 0.25 ? 0.5 : 0,
      good: `Layout stays stable while loading (shift ${ps.cls})`,
      bad: `Layout jumps while loading (shift ${ps.cls}; under 0.1 is the target), so visitors tap the wrong thing`,
      vars: { cls: ps.cls } });
  }
  if (ps.tbtMs !== null) {
    checks.push({ key: "tbt", area: "growth", weight: 2, service: "performance", impact: 2,
      pass: ps.tbtMs <= 200, score: ps.tbtMs <= 200 ? 1 : ps.tbtMs <= 600 ? 0.5 : 0,
      good: `Page responds to taps quickly (${ps.tbtMs} ms blocked)`,
      bad: `Scripts block the page for ${ps.tbtMs} ms while loading; under 200 ms is the target`,
      vars: { ms: ps.tbtMs } });
  }
  return toFindings(checks);
}
