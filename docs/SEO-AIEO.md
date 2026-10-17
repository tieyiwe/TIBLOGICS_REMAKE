# SEO and AI search (AIEO) for tiblogics.com

How TIBLOGICS is set up to be found in Google and Bing, and cited by AI
assistants (ChatGPT, Perplexity, Google AI Overviews and Gemini, Claude,
Microsoft Copilot, Meta AI). What was built, the three settings to add, how
to check it works, and the habits that keep it working.

## 1. What is in place

**Every public page has complete metadata** (`lib/seo/meta.ts`):
a title of 60 characters or fewer, a description of 155 or fewer, a
canonical URL on `https://tiblogics.com`, Open Graph and Twitter cards, and
the visitor's language (English, French or Swahili). Private pages
(`/learn`, `/admin_pro`, `/api`, `/go`, `/r`, checkout, thank-you and
confirmation pages, private badges, revoked certificates, campaign pages
flagged noindex) are marked `noindex` in the page and in the
`X-Robots-Tag` header.

**Structured data (JSON-LD)** describes the company and its offers to search
and AI engines (`lib/seo/jsonld.ts`):

| Where | Types |
| --- | --- |
| Every page | Organization (logo, contact points, areas served, social profiles), founder (Person), WebSite with search |
| Home, Services, Tools, Toolkit Live, Blueprint, ARFA catalog and each track | FAQPage, matching the questions shown on the page |
| /learning-box | EducationalOrganization (ARFA), ItemList of tracks |
| Each track | Course with CourseInstance (online, workload in hours, English and French), Offer with the real price, the certificate awarded |
| Services | Service, one per service |
| Store products | Product with Offer (price, availability, images). No ratings: add them only when there are real reviews |
| Tools | SoftwareApplication (price only when it is set) |
| AI Times articles | BlogPosting (author, dates, image, language) |
| Events | EducationEvent / Event (only when a date is set) |
| Nested pages | BreadcrumbList |

**Pages written for AI answers.** Short "Key takeaways" and FAQ blocks, in
plain server-rendered HTML in all three languages, on the home page,
`/services`, `/tools`, `/learning-box`, every track page, Toolkit Live and
the Automation Blueprint. They answer what people ask assistants: what is
ARFA, how much it costs, is it in French, do I get a certificate, is it for
small businesses or parents. Prices, hours and track names come from the
database and the pricing code, so they never drift. The copy lives in
`lib/i18n/messages/seo.ts`.

**A company fact sheet** at `/about/facts`: who, what, where, founder,
languages, services, products and contacts in short, quotable sentences.
AI engines lift answers from pages like this.

**Files for crawlers**

- `/robots.txt` (`app/robots.ts`): names and allows Googlebot, Bingbot,
  Applebot, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot,
  Perplexity-User, ClaudeBot, Claude-SearchBot, Claude-User, Google-Extended,
  Applebot-Extended, CCBot, Meta-ExternalAgent and others; blocks the private
  areas; points to the sitemap.
- `/sitemap.xml` (`app/sitemap.ts`): every public page, live track, published
  product, collection, article (with its French and Swahili versions as
  hreflang alternates), event, lead magnet and landing page. Built on each
  request, so new content appears at once.
- `/llms.txt` and `/llms-full.txt`: plain-text summaries for AI assistants
  (the llms.txt convention), generated from the live catalog. The full
  version holds every track, FAQ and fact.
- `/ai-times/feed.xml`: RSS feed of the latest 50 articles with full text.

**Technical**

- `www.tiblogics.com` redirects permanently to `tiblogics.com`; old paths
  (`/blog`, `/shop`, `/courses`, `/ai-academy`) redirect permanently.
- A missing track, product, article, collection, magnet or landing page
  returns a real 404 (checked in `proxy.ts` before the page streams).
- AI crawlers receive titles and meta tags in the first part of the HTML
  (`htmlLimitedBots` in `next.config.js`), and articles are rendered on the
  server, so crawlers that do not run JavaScript read the full text.
- IndexNow: publishing or editing an article, product, track, lead magnet or
  landing page notifies Bing (which feeds ChatGPT search and Copilot), Yandex
  and others within seconds (`lib/seo/indexnow.ts`).

## 2. Settings to add (Replit Secrets or your host's environment)

| Variable | What to put | Where it comes from |
| --- | --- | --- |
| `GOOGLE_SITE_VERIFICATION` | The `content` value only, e.g. `AbC123...` | Google Search Console → Add property → URL prefix `https://tiblogics.com` → HTML tag |
| `BING_SITE_VERIFICATION` | The `content` value of the `msvalidate.01` tag | Bing Webmaster Tools → Add site → HTML Meta Tag |
| `INDEXNOW_KEY` | Any 8 to 128 letters, digits or dashes. A UUID is ideal: run `uuidgen` | You choose it. The site serves it at `https://tiblogics.com/<key>.txt` |

Restart the app after setting them. Without a variable, that feature simply
stays off. The old placeholder verification tag has been removed.

## 3. Submit the site

**Google Search Console** (search.google.com/search-console)

1. Add the property `https://tiblogics.com` (or a Domain property via DNS,
   which also covers `www`). With `GOOGLE_SITE_VERIFICATION` set, choose
   "HTML tag" and click Verify.
2. Sitemaps → enter `sitemap.xml` → Submit.
3. URL Inspection → paste `https://tiblogics.com/learning-box` → Request
   indexing. Repeat for `/`, `/services`, `/about/facts` and your best tracks.

**Bing Webmaster Tools** (bing.com/webmasters)

1. Add the site, or import it from Search Console (fastest).
2. Sitemaps → submit `https://tiblogics.com/sitemap.xml`.
3. IndexNow → after setting `INDEXNOW_KEY`, the page shows submitted URLs
   within a day of your next publish. Bing powers ChatGPT search and Copilot,
   so this matters for AI visibility.

## 4. Check that it works

- **Rich results:** https://search.google.com/test/rich-results, test a track
  page (Course, FAQ, Breadcrumb), a product (Product) and an article.
- **Any schema:** https://validator.schema.org with the same URLs.
- **robots and AI crawlers:** open `https://tiblogics.com/robots.txt` and
  check GPTBot, ClaudeBot and PerplexityBot are listed with `Allow: /`. If
  you use Cloudflare or another firewall, make sure its "block AI bots" or
  "bot fight" setting is OFF, or it will override robots.txt.
- **What a crawler sees:**
  `curl -A "GPTBot" https://tiblogics.com/learning-box | grep -o "<title>.*</title>"`
- **llms.txt:** open `https://tiblogics.com/llms.txt`.
- **IndexNow key:** open `https://tiblogics.com/<your key>.txt`; it should
  show the key.
- **Ask the engines:** in ChatGPT (search on), Perplexity, Gemini, Copilot
  and Claude, ask "What is ARFA AI Academy?", "Who is TIBLOGICS?",
  "AI course in French with a certificate". Note which pages they cite.

## 5. Habits that make AI engines cite TIBLOGICS

1. **Say the same facts everywhere.** Name, one-line description, founder,
   regions, languages, email and website should match word for word on the
   site, LinkedIn, Google Business Profile, Crunchbase, X, Facebook and
   directories. AI engines trust facts they see repeated.
2. **Create and complete profiles:** Google Business Profile, LinkedIn
   company page, Crunchbase, Bing Places, Clutch, GoodFirms, G2 (for the
   tools), Course Report or Class Central (for ARFA), and local directories
   in the countries you serve. Add any new official profile to `ORG.sameAs`
   in `lib/seo/site.ts`.
3. **Publish answers, not slogans.** One clear question per article heading,
   answered in the first two sentences. Add the question to the relevant FAQ
   block when it comes up with clients.
4. **Keep numbers real.** Never add ratings, client logos or statistics
   without the evidence. When you have genuine reviews, collect them in one
   place first; only then can Review markup be added.
5. **Update `/about/facts`** when something changes (new service, new
   region, founding year if you want it public) and bump `FACTS_REVIEWED`.
6. **Get mentioned.** Podcasts, guest articles, partner pages and press in
   Africa and North America. AI engines weigh what others say.
7. **Translate.** The French versions of tracks and articles are a real
   advantage: few AI courses rank in French.

## 6. Monthly checklist

- [ ] Search Console: Pages report, fix "Not indexed" errors that matter;
      Enhancements show Course, FAQ, Product, Breadcrumb with no errors.
- [ ] Bing Webmaster Tools: crawl errors, IndexNow submissions arriving.
- [ ] Rich Results Test on one track, one product, one article.
- [ ] `robots.txt`, `llms.txt` and `sitemap.xml` open and look right.
- [ ] Ask ChatGPT, Perplexity, Gemini and Copilot the five questions in
      section 4 and note changes.
- [ ] Profiles (LinkedIn, Google Business Profile, Crunchbase) still match
      the fact sheet.
- [ ] At least two new AI Times articles and one new FAQ answer.
- [ ] Core Web Vitals (Search Console → Experience): no "Poor" URLs.

## 7. Where things live in the code

| What | File |
| --- | --- |
| Site URL, company facts, social profiles | `lib/seo/site.ts` |
| Page metadata helper | `lib/seo/meta.ts` |
| JSON-LD builders and serializer | `lib/seo/jsonld.ts`, `components/seo/JsonLd.tsx` |
| Takeaways and FAQ blocks | `components/seo/AnswerBlocks.tsx`, copy in `lib/i18n/messages/seo.ts` |
| ARFA facts (prices, hours) for FAQs and llms.txt | `lib/seo/academy.ts` |
| llms.txt / llms-full.txt | `lib/seo/llms.ts`, `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts` |
| Sitemap, robots | `app/sitemap.ts`, `app/robots.ts` |
| RSS | `app/(public)/ai-times/feed.xml/route.ts` |
| IndexNow | `lib/seo/indexnow.ts`, `app/api/indexnow-key/[key]/route.ts` |
| Real 404s for missing content | `lib/seo/exists.ts`, `proxy.ts` |
| www redirect, X-Robots-Tag, AI crawler metadata | `next.config.js` |
| Fact sheet | `app/(public)/about/facts/page.tsx` |
