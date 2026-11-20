// The ARFA Academy ad placed inside researched AI Times articles (the
// owner's standing request: every article carries one). Plain HTML, styled
// by the article page (.prose-blog aside.arfa-ad), and labelled as ours so it
// never reads like editorial. Prices are left out on purpose: they change, the
// academy page always has the current ones.

export interface ArfaAd {
  /** One line tying the article to the academy. */
  hook: string;
  /** Two or three sentences on what the reader would learn. */
  body: string;
  /** The track to open (a slug under /learning-box). */
  track: { slug: string; label: string };
}

const SHARED =
  "100% online, at your own pace, with hands-on labs, a quiz per module, a timed final exam and a capstone reviewed by a human being. The certificate means something because it is hard to get.";

export function arfaAd(a: ArfaAd): string {
  return `
<aside class="arfa-ad" aria-label="From TIBLOGICS: ARFA, the TIBLOGICS AI Academy">
<p class="arfa-ad-label">From TIBLOGICS · ARFA AI Academy</p>
<h3>${a.hook}</h3>
<p>${a.body} ${SHARED}</p>
<p class="arfa-ad-cta"><a href="/learning-box/${a.track.slug}">Explore ${a.track.label} →</a> <a href="/learning-box">See every ARFA track</a></p>
</aside>
`;
}
