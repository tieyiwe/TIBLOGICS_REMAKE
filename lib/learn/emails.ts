// Transactional emails for ARFA (AI Readiness For All), the AI Academy of
// TIBLOGICS. Every learner email goes through the ARFA mailer
// (arfa_edu@tiblogics.com) so they match the training emails.
import { arfaMailer } from "@/lib/resend";
import prisma from "@/lib/prisma";
import { translator, type T } from "./i18n";
import type { JoinChoice } from "./join/choice";

// Each email goes out in the learner's saved language (Student.locale). A
// caller that already has it passes `locale`; otherwise it is looked up by
// email address, and anything unknown falls back to English.
async function tFor(email: string, locale?: string | null): Promise<T> {
  if (locale) return translator(locale);
  const s = await prisma.student.findUnique({ where: { email }, select: { locale: true } }).catch(() => null);
  return translator(s?.locale);
}

// Mirrors the fallback chain used by checkout/billing-portal. Without the
// NEXTAUTH_URL step, a deployment that sets only NEXTAUTH_URL sends links to
// the hardcoded production domain — which 404s if that domain is running an
// older build than the one that sent the email.
const SITE = (
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com"
).replace(/\/$/, "");

/** ARFA = AI Readiness For All. The education contact for every learner email. */
export const ARFA_EMAIL = process.env.ARFA_SMTP_USER ?? "arfa_edu@tiblogics.com";

// The branded header, "ARFA · AI Academy" over "AI Readiness For All": the
// ARFA wordmark (navy "AR", orange "FA", as on public/arfa-banner.png) in live
// text, so it shows even with images off.
function arfaHeader(t: T) {
  return `<div style="background:#FFFFFF;border-bottom:3px solid #F47C20;padding:24px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;padding-right:14px;border-right:2px solid #1B2A5E;">
            <div style="font-size:34px;line-height:1;font-weight:900;letter-spacing:-.01em;color:#1B2A5E;font-family:Arial,Helvetica,sans-serif;">AR<span style="color:#F47C20;">FA</span></div>
          </td>
          <td style="vertical-align:middle;padding-left:14px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:17px;line-height:1.2;font-weight:800;color:#1B2A5E;">${t("learn.brand.academy")}</div>
            <div style="font-size:11px;line-height:1.4;font-weight:700;color:#F47C20;letter-spacing:.08em;text-transform:uppercase;margin-top:2px;">AI Readiness For All</div>
            <div style="font-size:10px;line-height:1.4;color:#8A9BA0;letter-spacing:.06em;text-transform:uppercase;margin-top:2px;">${t("learn.brand.by")} TIBLOGICS</div>
          </td>
        </tr></table>
      </div>`;
}

function shell(t: T, title: string, bodyHtml: string, cta?: { href: string; label: string }, afterHtml = "") {
  return `
  <div style="background:#F4F7FB;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;">
      ${arfaHeader(t)}
      <div style="padding:32px;">
        <h1 style="font-size:21px;color:#131A1B;margin:0 0 14px;line-height:1.3;">${title}</h1>
        ${bodyHtml}
        ${cta ? `<div style="text-align:center;margin:28px 0 4px;">
          <a href="${cta.href}" style="display:inline-block;background:linear-gradient(135deg,#F47C4C,#F9A738);color:#131A1B;font-weight:800;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:50px;">${cta.label}</a>
        </div>` : ""}
        ${afterHtml ? `<div style="margin-top:24px;">${afterHtml}</div>` : ""}
      </div>
      <div style="background:#F4F7FB;padding:18px 32px;text-align:center;color:#8A9BA0;font-size:12px;">
        <div style="font-weight:700;color:#5b6b72;margin-bottom:4px;">${t("learn.email.footerBrand")}</div>
        © ${new Date().getFullYear()} TIBLOGICS · ${t("learn.email.rights")} · <a href="${SITE}" style="color:#8A9BA0;">tiblogics.com</a>
      </div>
    </div>
  </div>`;
}

/** Names and other account fields are typed by users; never put them in HTML raw. */
const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const p = (t: string) => `<p style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;">${t}</p>`;

/** /learn/install: the step-by-step "Install the ARFA app" page for every browser. */
const INSTALL_URL = `${SITE}/learn/install`;

/**
 * Numbered "first steps" rows (navy circles), each with a title, a line of
 * text and a link: `${key}.title`, `${key}.body` and `${key}.link`.
 */
function stepRows(t: T, items: Array<{ key: string; href: string }>) {
  const rows = items
    .map(
      ({ key, href }, i) => `<tr><td style="padding:0 0 14px;vertical-align:top;width:40px;">
          <div style="width:28px;height:28px;border-radius:14px;background:#1B2A5E;color:#fff;font-weight:800;font-size:14px;line-height:28px;text-align:center;">${i + 1}</div>
        </td>
        <td style="padding:0 0 14px;font-size:14px;color:#5b6b72;line-height:1.6;">
          <strong style="color:#131A1B;">${t(`${key}.title`)}</strong><br/>
          ${t(`${key}.body`)}<br/>
          <a href="${href}" style="color:#F47C20;font-weight:700;text-decoration:none;">${t(`${key}.link`)} &rarr;</a>
        </td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">${rows}</table>`;
}

/**
 * "Welcome to ARFA (AI Readiness For All)": sent on every new learner
 * account, from the sign-up form (app/api/learn/auth/signup) and from the
 * first "Continue with Google" (lib/learn/google-auth.ts). In the learner's
 * language, from and reply-to arfa_edu@tiblogics.com.
 */
export function studentWelcomeEmail(s: { name: string }, t: T) {
  const first = esc(s.name.split(" ")[0] || s.name);
  const h2 = (v: string) =>
    `<h2 style="font-size:15px;color:#1B2A5E;margin:26px 0 10px;text-transform:uppercase;letter-spacing:.06em;">${v}</h2>`;
  const pillars = [1, 2, 3, 4]
    .map(
      (n) => `<tr><td style="padding:0 0 10px;vertical-align:top;width:18px;color:#F47C20;font-size:16px;line-height:1.4;">&#9679;</td>
        <td style="padding:0 0 10px;font-size:14px;color:#5b6b72;line-height:1.6;"><strong style="color:#1B2A5E;">${t(`learn.email.welcome.pillar.${n}.title`)}.</strong> ${t(`learn.email.welcome.pillar.${n}.body`)}</td></tr>`,
    )
    .join("");
  const steps = stepRows(t, [
    { key: "learn.email.welcome.step.1", href: `${SITE}/learning-box#path` },
    { key: "learn.email.welcome.step.2", href: `${SITE}/learn/tracks` },
    { key: "learn.email.welcome.step.3", href: `${SITE}/learn/community` },
    { key: "learn.email.welcome.step.4", href: INSTALL_URL },
  ]);
  const body =
    `<div style="display:none;max-height:0;overflow:hidden;">${t("learn.email.welcome.preheader")}</div>` +
    p(t("learn.email.welcome.p1")) +
    h2(t("learn.email.welcome.whatTitle")) +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">${pillars}</table>` +
    h2(t("learn.email.welcome.stepsTitle")) +
    steps +
    p(t("learn.email.welcome.p2"));
  const outro =
    p(t("learn.email.welcome.help", { email: `<a href="mailto:${ARFA_EMAIL}" style="color:#F47C20;">${ARFA_EMAIL}</a>` })) +
    p(`${t("learn.email.welcome.signoff")}<br/><strong style="color:#131A1B;">${t("learn.email.welcome.team")}</strong>`) +
    `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:18px 0 0;border-top:1px solid #e6ebf1;padding-top:14px;">${t("learn.email.welcome.about")} <a href="${SITE}/learning-box" style="color:#8A9BA0;">${SITE.replace(/^https?:\/\//, "")}/learning-box</a></p>`;
  return {
    subject: t("learn.email.welcome.subject"),
    html: shell(
      t,
      t("learn.email.welcome.title", { name: first }),
      body,
      { href: `${SITE}/learn`, label: `${t("learn.email.welcome.cta")} &rarr;` },
      outro,
    ),
  };
}

export async function sendStudentWelcomeEmail(s: { email: string; name: string; locale?: string | null }) {
  const t = await tFor(s.email, s.locale);
  const { subject, html } = studentWelcomeEmail(s, t);
  await arfaMailer.emails.send({ to: s.email, subject, html });
}

// ── Context-aware welcome for the one-page join flow (/learning-box/join) ──
//
// A learner who creates their account on the join page is not sent the plain
// welcome above. They get exactly one of these instead (lib/learn/join/pending.ts):
//   purchased  payment confirmed: "your access is active", Start lesson 1
//   pending    no payment after about an hour: welcome + Finish your enrolment
// and an existing learner who chose a plan there and left gets the pending
// version once as a reminder (reminderOnly). Team members keep the team
// invitation and welcome emails (lib/learn/team).

export type JoinWelcomeState =
  | {
      kind: "purchased";
      product: "track" | "monthly" | "team";
      track?: { slug: string; title: string; firstLessonId: string | null } | null;
    }
  | {
      kind: "pending";
      choice: JoinChoice;
      track: { slug: string; title: string } | null;
      /** Same-site path back to the join page with the choice preselected. */
      resumePath: string;
      reminderOnly?: boolean;
    };

function choiceLabel(t: T, choice: JoinChoice, trackTitle: string | null) {
  if (choice.kind === "track") return t("learn.email.join.choice.track", { track: esc(trackTitle ?? choice.slug) });
  if (choice.kind === "monthly") return t("learn.email.join.choice.monthly");
  return t("learn.email.join.choice.team", { n: Math.max(1, choice.seats) });
}

function checkList(items: string[]) {
  const rows = items
    .map(
      (x) => `<tr><td style="padding:0 0 8px;vertical-align:top;width:20px;color:#0F6E56;font-size:15px;line-height:1.5;font-weight:800;">&#10003;</td>
        <td style="padding:0 0 8px;font-size:14px;color:#5b6b72;line-height:1.6;">${x}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">${rows}</table>`;
}

export function joinWelcomeEmail(s: { name: string }, state: JoinWelcomeState, t: T) {
  const first = esc(s.name.split(" ")[0] || s.name);
  const h2 = (v: string) =>
    `<h2 style="font-size:15px;color:#1B2A5E;margin:26px 0 10px;text-transform:uppercase;letter-spacing:.06em;">${v}</h2>`;
  const outro =
    p(t("learn.email.welcome.help", { email: `<a href="mailto:${ARFA_EMAIL}" style="color:#F47C20;">${ARFA_EMAIL}</a>` })) +
    p(`${t("learn.email.welcome.signoff")}<br/><strong style="color:#131A1B;">${t("learn.email.welcome.team")}</strong>`) +
    `<p style="font-size:12px;color:#8A9BA0;line-height:1.6;margin:18px 0 0;border-top:1px solid #e6ebf1;padding-top:14px;">${t("learn.email.welcome.about")} <a href="${SITE}/learning-box" style="color:#8A9BA0;">${SITE.replace(/^https?:\/\//, "")}/learning-box</a></p>`;
  const pre = (v: string) => `<div style="display:none;max-height:0;overflow:hidden;">${v}</div>`;
  // Below the main button, so "Start lesson 1" (or "Finish your enrolment")
  // stays the one primary action.
  // The community needs access, so a learner who has not paid yet only gets
  // the install step.
  const quick = (withCommunity: boolean) =>
    h2(t("learn.email.join.quickTitle")) +
    stepRows(t, [
      { key: "learn.email.welcome.step.4", href: INSTALL_URL },
      ...(withCommunity ? [{ key: "learn.email.welcome.step.3", href: `${SITE}/learn/community` }] : []),
    ]);

  if (state.kind === "purchased") {
    const track = state.track ?? null;
    const title = track ? esc(track.title) : "";
    const product = state.product;
    const subject =
      product === "team"
        ? t("learn.email.join.paid.subject.team")
        : product === "track" && track
          ? t("learn.email.join.paid.subject.track", { track: track.title })
          : t("learn.email.join.paid.subject.monthly");
    const lead =
      product === "team"
        ? t("learn.email.join.paid.lead.team")
        : product === "track"
          ? t("learn.email.join.paid.lead.track", { track: `<strong style="color:#131A1B;">${title}</strong>` })
          : t("learn.email.join.paid.lead.monthly");
    const included =
      product === "team"
        ? [1, 2, 3, 4].map((n) => t(`team.offer.item.${n}`))
        : product === "track"
          ? [1, 2, 3, 4, 5].map((n) => t(`learn.email.join.paid.track.item.${n}`))
          : [1, 2, 3, 4, 5].map((n) => t(`learn.subscribe.item.${n}`));
    const lessonHref = track?.firstLessonId
      ? `${SITE}/learn/lesson/${track.firstLessonId}`
      : track
        ? `${SITE}/learn/track/${track.slug}`
        : `${SITE}/learn/tracks`;
    const cta =
      product === "team"
        ? { href: `${SITE}/learn/team`, label: `${t("learn.email.join.paid.cta.team")} &rarr;` }
        : track
          ? { href: lessonHref, label: `${t("learn.email.join.paid.cta.lesson1")} &rarr;` }
          : { href: `${SITE}/learn/tracks`, label: `${t("learn.email.join.paid.cta.pick")} &rarr;` };
    const next =
      product === "team"
        ? p(t("learn.email.join.paid.next.team", { link: `<a href="${SITE}/learn" style="color:#F47C20;font-weight:700;">${t("learn.email.join.paid.dashboard")}</a>` }))
        : p(t("learn.email.join.paid.next", { link: `<a href="${SITE}/learn" style="color:#F47C20;font-weight:700;">${t("learn.email.join.paid.dashboard")}</a>` }));
    const body =
      pre(t("learn.email.join.paid.preheader")) +
      p(lead) +
      h2(t("learn.email.join.paid.included")) +
      checkList(included) +
      next;
    return {
      subject,
      html: shell(t, t("learn.email.welcome.title", { name: first }), body, cta, quick(true) + p(t("learn.email.welcome.p2")) + outro),
    };
  }

  const label = choiceLabel(t, state.choice, state.track?.title ?? null);
  const href = `${SITE}${state.resumePath.startsWith("/") && !state.resumePath.startsWith("//") ? state.resumePath : "/learning-box/join"}`;
  const reminder = !!state.reminderOnly;
  const pillars = [1, 2, 3, 4]
    .map(
      (n) => `<tr><td style="padding:0 0 10px;vertical-align:top;width:18px;color:#F47C20;font-size:16px;line-height:1.4;">&#9679;</td>
        <td style="padding:0 0 10px;font-size:14px;color:#5b6b72;line-height:1.6;"><strong style="color:#1B2A5E;">${t(`learn.email.welcome.pillar.${n}.title`)}.</strong> ${t(`learn.email.welcome.pillar.${n}.body`)}</td></tr>`,
    )
    .join("");
  const choiceBox = `<div style="background:#F4F7FB;border-left:3px solid #F47C20;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <div style="font-size:12px;color:#8A9BA0;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">${t("learn.email.join.pending.yourChoice")}</div>
      <div style="font-size:15px;color:#131A1B;font-weight:700;line-height:1.5;">${label}</div>
    </div>`;
  const body =
    pre(t(reminder ? "learn.email.join.reminder.preheader" : "learn.email.join.pending.preheader")) +
    p(t(reminder ? "learn.email.join.reminder.p1" : "learn.email.join.pending.p1")) +
    choiceBox +
    p(t("learn.email.join.pending.p2")) +
    (reminder
      ? ""
      : h2(t("learn.email.welcome.whatTitle")) +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">${pillars}</table>`);
  const after =
    (reminder ? "" : quick(false)) +
    p(t("learn.email.join.pending.explore", { link: `<a href="${SITE}/learning-box" style="color:#F47C20;font-weight:700;">${t("learn.email.join.pending.catalog")}</a>` })) +
    outro;
  return {
    subject: t(reminder ? "learn.email.join.reminder.subject" : "learn.email.join.pending.subject"),
    html: shell(
      t,
      reminder ? t("learn.email.join.reminder.title", { name: first }) : t("learn.email.welcome.title", { name: first }),
      body,
      { href, label: `${t("learn.email.join.pending.cta")} &rarr;` },
      after,
    ),
  };
}

export async function sendJoinWelcomeEmail(s: { email: string; name: string; locale?: string | null; state: JoinWelcomeState }) {
  const t = await tFor(s.email, s.locale);
  const { subject, html } = joinWelcomeEmail(s, s.state, t);
  await arfaMailer.emails.send({ to: s.email, subject, html });
}

export async function sendMilestoneEmail(s: {
  email: string; name: string; milestone: string; detail: string; points: number; locale?: string | null;
}) {
  const t = await tFor(s.email, s.locale);
  await arfaMailer.emails.send({
    to: s.email,
    subject: `🎉 ${s.milestone} | ARFA`,
    html: shell(
      t,
      `${s.milestone}`,
      p(esc(s.detail)) + p(t("learn.email.milestone.points", { points: `<strong style="color:#131A1B;">+${s.points}</strong>` })),
      { href: `${SITE}/learn`, label: `${t("learn.email.milestone.cta")} →` },
    ),
  });
}

export async function sendCapstoneStatusEmail(s: {
  email: string; name: string; trackTitle: string;
  status: "in_review" | "revisions_requested" | "passed" | "failed";
  notes?: string | null; score?: number | null; locale?: string | null;
}) {
  const t = await tFor(s.email, s.locale);
  const key = { in_review: "inReview", revisions_requested: "revisions", passed: "passed", failed: "failed" }[s.status];
  const map = {
    subject: `${s.status === "passed" ? "🎉 " : ""}${t(`learn.email.capstone.${key}.subject`)}`,
    title: t(`learn.email.capstone.${key}.title`),
  };

  const body =
    p(t("learn.email.capstone.track", { title: `<strong style="color:#131A1B;">${esc(s.trackTitle)}</strong>` })) +
    p(t(`learn.email.capstone.${key}.body`)) +
    (s.score != null ? p(t("learn.email.capstone.score", { score: `<strong style="color:#131A1B;">${s.score}%</strong>` })) : "") +
    (s.notes ? `<div style="background:#F4F7FB;border-left:3px solid #F47C20;border-radius:8px;padding:14px 16px;margin:16px 0;">
        <div style="font-size:12px;color:#8A9BA0;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">${t("learn.email.capstone.notes")}</div>
        <div style="font-size:14px;color:#131A1B;line-height:1.7;white-space:pre-wrap;">${esc(s.notes)}</div>
      </div>` : "");

  await arfaMailer.emails.send({
    to: s.email,
    subject: map.subject,
    html: shell(t, map.title, body, { href: `${SITE}/learn`, label: `${t("learn.email.capstone.cta")} →` }),
  });
}

export async function sendCertificateEmail(s: {
  email: string; name: string; certificateName: string;
  verificationId: string; distinction: boolean; locale?: string | null;
}) {
  const t = await tFor(s.email, s.locale);
  const verifyUrl = `${SITE}/certificates/${s.verificationId}`;
  const linkedIn =
    `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME` +
    `&name=${encodeURIComponent(s.certificateName)}` +
    `&organizationName=${encodeURIComponent("TIBLOGICS")}` +
    `&certUrl=${encodeURIComponent(verifyUrl)}`;

  await arfaMailer.emails.send({
    to: s.email,
    subject: `🏅 ${t("learn.email.cert.subject", { cert: s.certificateName })}`,
    html: shell(
      t,
      t("learn.email.cert.title", { name: esc(s.name.split(" ")[0]) }),
      p(
        t(s.distinction ? "learn.email.cert.earnedDistinction" : "learn.email.cert.earned", {
          cert: `<strong style="color:#131A1B;">${esc(s.certificateName)}</strong>`,
        }),
      ) +
      p(t("learn.email.cert.p2")) +
      p(`${t("learn.email.cert.verify")}<br/><a href="${verifyUrl}" style="color:#F47C20;">${verifyUrl}</a>`) +
      p(`<a href="${linkedIn}" style="color:#F47C20;font-weight:600;">${t("learn.email.cert.linkedin")} →</a>`),
      { href: verifyUrl, label: `${t("learn.email.cert.cta")} →` },
    ),
  });
}

/** Password reset. The link carries the raw token; only its hash is stored. */
export async function sendPasswordResetEmail(s: { email: string; name: string; token: string; locale?: string | null }) {
  const t = await tFor(s.email, s.locale);
  await arfaMailer.emails.send({
    to: s.email,
    subject: t("learn.email.reset.subject"),
    html: shell(
      t,
      t("learn.email.reset.title", { name: esc(s.name.split(" ")[0]) }),
      p(t("learn.email.reset.p1")) + p(t("learn.email.reset.p2")),
      { href: `${SITE}/learn/reset?token=${encodeURIComponent(s.token)}`, label: `${t("learn.email.reset.cta")} →` },
    ),
  });
}

// The same branded layout for emails sent from elsewhere in Learn
// (community: cohorts, reply digests).
export { shell as learnEmailShell, esc as learnEmailEsc, p as learnEmailP, SITE as LEARN_SITE };

// ── Certificates (lib/learn/cert) ───────────────────────────────────────────

/** "You earned it: confirm the name to print." Sent when a certificate is issued. */
export async function sendCertificateClaimEmail(s: { email: string; name: string; certificateName: string; reference: string; locale?: string | null }) {
  const t = await tFor(s.email, s.locale);
  const claimUrl = `${SITE}/learn/certificates/${encodeURIComponent(s.reference)}/claim`;
  await arfaMailer.emails.send({
    to: s.email,
    subject: `🎓 ${t("learn.email.claim.subject", { cert: s.certificateName })}`,
    html: shell(
      t,
      t("learn.email.claim.title", { name: esc(s.name.split(" ")[0]) }),
      p(t("learn.email.claim.p1", { cert: `<strong style="color:#131A1B;">${esc(s.certificateName)}</strong>` })) + p(t("learn.email.claim.p2")),
      { href: claimUrl, label: `${t("learn.email.claim.cta")} →` },
    ),
  });
}

/**
 * Congratulations, with the certificate shown in the email and attached as a
 * PDF. Sent once the learner has confirmed the name.
 */
export async function sendCertificateCongratsEmail(s: {
  email: string;
  name: string;
  certificateName: string;
  reference: string;
  distinction: boolean;
  verifyUrl: string;
  linkedInUrl: string;
  png: Buffer;
  pdf: Buffer;
  pdfName: string;
  locale?: string | null;
}) {
  const t = await tFor(s.email, s.locale);
  const viewUrl = `${SITE}/learn/certificates/${encodeURIComponent(s.reference)}?celebrate=1`;
  const pdfUrl = `${SITE}/certificates/${encodeURIComponent(s.reference)}/pdf`;
  const btn = (href: string, label: string, primary = false) =>
    `<a href="${href}" style="display:inline-block;margin:4px;${primary ? "background:#1B3A6B;color:#fff;" : "background:#fff;color:#1B3A6B;border:2px solid #1B3A6B;"}font-weight:800;font-size:14px;text-decoration:none;padding:11px 22px;border-radius:50px;">${label}</a>`;
  const body =
    `<div style="text-align:center;font-size:40px;line-height:1;margin:0 0 10px;">🎉🎓🎉</div>` +
    p(t(s.distinction ? "learn.email.congrats.p1Distinction" : "learn.email.congrats.p1", { cert: `<strong style="color:#131A1B;">${esc(s.certificateName)}</strong>` })) +
    `<a href="${viewUrl}" style="display:block;margin:18px 0;border-radius:12px;overflow:hidden;border:1px solid #e6ebf1;"><img src="cid:certificate" alt="${esc(s.certificateName)}" width="496" style="display:block;width:100%;height:auto;"/></a>` +
    p(t("learn.email.congrats.p2")) +
    `<div style="text-align:center;margin:8px 0 18px;">${btn(pdfUrl, t("learn.email.congrats.download"))}${btn(s.linkedInUrl, t("learn.email.congrats.linkedin"))}</div>` +
    p(`${t("learn.email.congrats.reference")} <strong style="color:#131A1B;font-family:monospace;">${esc(s.reference)}</strong><br/>${t("learn.email.congrats.verify")} <a href="${s.verifyUrl}" style="color:#F47C20;">${s.verifyUrl.replace(/^https?:\/\//, "")}</a>`);
  await arfaMailer.emails.send({
    to: s.email,
    subject: `🎉 ${t("learn.email.congrats.subject", { cert: s.certificateName })}`,
    html: shell(t, t("learn.email.congrats.title", { name: esc(s.name.split(" ")[0]) }), body, { href: viewUrl, label: `${t("learn.email.congrats.cta")} →` }),
    attachments: [
      { filename: "certificate.png", content: s.png, contentType: "image/png", cid: "certificate" },
      { filename: s.pdfName, content: s.pdf, contentType: "application/pdf" },
    ],
  });
}

