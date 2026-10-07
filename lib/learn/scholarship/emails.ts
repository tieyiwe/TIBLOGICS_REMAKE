import { arfaMailer } from "@/lib/resend";
import { LEARN_SITE, learnEmailEsc as esc, learnEmailP as p, learnEmailShell as shell } from "@/lib/learn/emails";
import { translator } from "@/lib/learn/i18n";
import { isLocale } from "@/lib/i18n/config";

// The Tilo Vision Scholarship congratulations email, sent when staff approve
// an award. It says what is covered, how to claim it (create an ARFA account
// with this address, or sign in) and until when, in the recipient's language.

const strong = (s: string) => `<strong style="color:#131A1B;">${s}</strong>`;

export const offerUrl = (token: string) => `${LEARN_SITE}/scholarship/${token}`;

export async function sendScholarshipAward(to: {
  email: string;
  name: string;
  code: string;
  locale: string;
  token: string;
  coveragePct: number;
  trackCount: number;
  /** The tracks it may be used on, when staff chose a list. */
  tracks: string[];
  message: string | null;
  expiresAt: Date;
  hasAccount: boolean;
}) {
  const t = translator(to.locale);
  const fmt = new Intl.DateTimeFormat(isLocale(to.locale) ? to.locale : "en", { dateStyle: "long" });
  const first = to.name.trim().split(/\s+/)[0];
  const link = offerUrl(to.token);
  const next = encodeURIComponent(`/scholarship/${to.token}`);
  const signupUrl = `${LEARN_SITE}/learn/signup?next=${next}&email=${encodeURIComponent(to.email)}`;
  const loginUrl = `${LEARN_SITE}/learn/login?next=${next}`;
  const a = (href: string, label: string) => `<a href="${href}" style="color:#1B2A5E;font-weight:700;">${esc(label)}</a>`;

  const coverage = to.coveragePct >= 100 ? t("learn.scholar.coverage.full") : t("learn.scholar.coverage.part", { pct: String(to.coveragePct) });
  const tracksLine = t(to.trackCount === 1 ? "learn.scholar.tracks.one" : "learn.scholar.tracks.other", { n: String(to.trackCount) });
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#5b6b72;">${esc(k)}</td><td style="padding:6px 0;font-size:14px;font-weight:800;color:#131A1B;text-align:right;">${v}</td></tr>`;

  const award = `<div style="margin:6px 0 18px;border:1px solid #F4C9A0;border-radius:14px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1B2A5E,#27407F);padding:16px 20px;color:#fff;">
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#F9A738;font-weight:800;">${esc(t("learn.scholar.kicker"))}</div>
        <div style="font-size:19px;font-weight:900;margin-top:4px;">The Tilo Vision Scholarship</div>
      </div>
      <div style="padding:12px 20px;background:#FFFBF6;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${row(t("learn.scholar.award.coverage"), esc(coverage))}
          ${row(t("learn.scholar.award.tracks"), esc(tracksLine))}
          ${row(t("learn.scholar.award.code"), esc(to.code))}
          ${row(t("learn.scholar.award.claimBy"), esc(fmt.format(to.expiresAt)))}
        </table>
      </div>
    </div>`;

  const steps = [1, 2, 3].map((n) => `<li style="margin-bottom:6px;">${esc(t(`learn.scholar.email.step${n}`))}</li>`).join("");

  const body =
    p(esc(t("learn.scholar.email.hello", { name: first }))) +
    p(t("learn.scholar.email.p1", { scholarship: strong("The Tilo Vision Scholarship") })) +
    award +
    (to.tracks.length
      ? p(esc(t("learn.scholar.email.tracksList"))) +
        `<ul style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:18px;">${to.tracks.map((x) => `<li>${strong(esc(x))}</li>`).join("")}</ul>`
      : p(esc(t("learn.scholar.email.anyTrack")))) +
    (to.message
      ? `<div style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #F47C20;background:#F4F7FB;border-radius:8px;font-size:14px;line-height:1.7;color:#131A1B;white-space:pre-line;">${esc(to.message)}</div>`
      : "") +
    p(strong(esc(t("learn.scholar.email.howTitle")))) +
    `<ol style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;padding-left:20px;">${steps}</ol>` +
    p(esc(t("learn.scholar.email.sameEmail", { email: to.email }))) +
    `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:0 0 6px;">${esc(t("learn.scholar.email.scope"))}</p>`;

  const after =
    (to.hasAccount ? "" : `<p style="font-size:14px;color:#5b6b72;text-align:center;margin:0 0 12px;">${t("learn.scholar.email.haveAccount", { link: a(loginUrl, t("learn.scholar.signIn")) })}</p>`) +
    `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:0;word-break:break-all;">${t("learn.scholar.email.fallback", { url: a(link, link) })}</p>`;

  await arfaMailer.emails.send({
    to: to.email,
    subject: t("learn.scholar.email.subject", { name: first }),
    html: shell(
      t,
      esc(t("learn.scholar.email.title")),
      body,
      to.hasAccount ? { href: loginUrl, label: `${t("learn.scholar.email.ctaKnown")} →` } : { href: signupUrl, label: `${t("learn.scholar.email.cta")} →` },
      after,
    ),
  });
}
