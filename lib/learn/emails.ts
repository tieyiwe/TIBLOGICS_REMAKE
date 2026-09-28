// Transactional emails for TIBLOGICS Learn, sent via the existing ARFA
// (education-branded) mailer so they match the training emails.
import { arfaMailer } from "@/lib/resend";
import prisma from "@/lib/prisma";
import { translator, type T } from "./i18n";

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

function shell(t: T, title: string, bodyHtml: string, cta?: { href: string; label: string }) {
  return `
  <div style="background:#F4F7FB;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;">
      <div style="background:linear-gradient(135deg,#131A1B,#1C2526);padding:26px 32px;">
        <div style="font-size:19px;font-weight:800;color:#fff;letter-spacing:.04em;">
          TIB<span style="color:#F47C20;">LOGICS</span>
          <span style="color:rgba(255,255,255,.35);font-weight:400;"> | </span>
          <span style="color:#F9A738;">Learn</span>
        </div>
      </div>
      <div style="padding:32px;">
        <h1 style="font-size:21px;color:#131A1B;margin:0 0 14px;line-height:1.3;">${title}</h1>
        ${bodyHtml}
        ${cta ? `<div style="text-align:center;margin:28px 0 4px;">
          <a href="${cta.href}" style="display:inline-block;background:linear-gradient(135deg,#F47C4C,#F9A738);color:#131A1B;font-weight:800;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:50px;">${cta.label}</a>
        </div>` : ""}
      </div>
      <div style="background:#F4F7FB;padding:18px 32px;text-align:center;color:#8A9BA0;font-size:12px;">
        © ${new Date().getFullYear()} TIBLOGICS · ${t("learn.email.rights")}
      </div>
    </div>
  </div>`;
}

/** Names and other account fields are typed by users; never put them in HTML raw. */
const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const p = (t: string) => `<p style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;">${t}</p>`;

export async function sendStudentWelcomeEmail(s: { email: string; name: string; locale?: string | null }) {
  const t = await tFor(s.email, s.locale);
  await arfaMailer.emails.send({
    to: s.email,
    subject: `${t("learn.email.welcome.subject")} 🎓`,
    html: shell(
      t,
      t("learn.email.welcome.title", { name: esc(s.name.split(" ")[0]) }),
      p(t("learn.email.welcome.p1")) + p(t("learn.email.welcome.p2")),
      { href: `${SITE}/learning-box`, label: `${t("learn.email.welcome.cta")} →` },
    ),
  });
}

export async function sendMilestoneEmail(s: {
  email: string; name: string; milestone: string; detail: string; points: number; locale?: string | null;
}) {
  const t = await tFor(s.email, s.locale);
  await arfaMailer.emails.send({
    to: s.email,
    subject: `🎉 ${s.milestone} | TIBLOGICS Learn`,
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
        <div style="font-size:14px;color:#131A1B;line-height:1.7;white-space:pre-wrap;">${s.notes}</div>
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
