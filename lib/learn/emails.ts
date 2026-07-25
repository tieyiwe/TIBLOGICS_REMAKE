// Transactional emails for TIBLOGICS Learn, sent via the existing ARFA
// (education-branded) mailer so they match the training emails.
import { arfaMailer } from "@/lib/resend";

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com").replace(/\/$/, "");

function shell(title: string, bodyHtml: string, cta?: { href: string; label: string }) {
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
        © ${new Date().getFullYear()} TIBLOGICS · All rights reserved
      </div>
    </div>
  </div>`;
}

const p = (t: string) => `<p style="font-size:14px;color:#5b6b72;line-height:1.7;margin:0 0 14px;">${t}</p>`;

export async function sendStudentWelcomeEmail(s: { email: string; name: string }) {
  await arfaMailer.emails.send({
    to: s.email,
    subject: "Welcome to TIBLOGICS Learn 🎓",
    html: shell(
      `Welcome, ${s.name.split(" ")[0]}!`,
      p("Your TIBLOGICS Learn account is ready. Browse the catalog, start a track, and work through practical lessons that end in a real, verifiable certificate.") +
      p("Every track gives you quick checks after each lesson, a quiz per module, a final exam, and a capstone reviewed by a human — so your certificate actually means something."),
      { href: `${SITE}/courses`, label: "Browse the catalog →" },
    ),
  });
}

export async function sendMilestoneEmail(s: {
  email: string; name: string; milestone: string; detail: string; points: number;
}) {
  await arfaMailer.emails.send({
    to: s.email,
    subject: `🎉 ${s.milestone} — TIBLOGICS Learn`,
    html: shell(
      `${s.milestone}`,
      p(s.detail) + p(`<strong style="color:#131A1B;">+${s.points} points</strong> added to your total.`),
      { href: `${SITE}/learn`, label: "Keep learning →" },
    ),
  });
}

export async function sendCapstoneStatusEmail(s: {
  email: string; name: string; trackTitle: string;
  status: "in_review" | "revisions_requested" | "passed" | "failed";
  notes?: string | null; score?: number | null;
}) {
  const map = {
    in_review:            { subject: "Your capstone is under review", title: "Capstone received — under review" },
    revisions_requested:  { subject: "Revisions requested on your capstone", title: "A few revisions needed" },
    passed:               { subject: "🎉 Your capstone passed!", title: "Your capstone passed!" },
    failed:               { subject: "Capstone result", title: "Capstone not yet passed" },
  }[s.status];

  const body =
    p(`Track: <strong style="color:#131A1B;">${s.trackTitle}</strong>`) +
    (s.status === "passed"
      ? p("Congratulations — this was the last requirement. Your certificate is being issued and will arrive in a separate email.")
      : s.status === "revisions_requested"
      ? p("Your submission is close. Address the reviewer's notes below and resubmit — there's no limit on resubmissions.")
      : s.status === "in_review"
      ? p("A TIBLOGICS reviewer has your submission. We aim to return feedback within 5 business days.")
      : p("Your submission didn't meet the rubric threshold this time. The reviewer's notes below explain exactly what to strengthen — you can resubmit.")) +
    (s.score != null ? p(`Score: <strong style="color:#131A1B;">${s.score}%</strong>`) : "") +
    (s.notes ? `<div style="background:#F4F7FB;border-left:3px solid #F47C20;border-radius:8px;padding:14px 16px;margin:16px 0;">
        <div style="font-size:12px;color:#8A9BA0;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Reviewer notes</div>
        <div style="font-size:14px;color:#131A1B;line-height:1.7;white-space:pre-wrap;">${s.notes}</div>
      </div>` : "");

  await arfaMailer.emails.send({
    to: s.email,
    subject: map.subject,
    html: shell(map.title, body, { href: `${SITE}/learn`, label: "Open my dashboard →" }),
  });
}

export async function sendCertificateEmail(s: {
  email: string; name: string; certificateName: string;
  verificationId: string; distinction: boolean;
}) {
  const verifyUrl = `${SITE}/certificates/${s.verificationId}`;
  const linkedIn =
    `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME` +
    `&name=${encodeURIComponent(s.certificateName)}` +
    `&organizationName=${encodeURIComponent("TIBLOGICS")}` +
    `&certUrl=${encodeURIComponent(verifyUrl)}`;

  await arfaMailer.emails.send({
    to: s.email,
    subject: `🏅 Your ${s.certificateName} certificate is ready`,
    html: shell(
      `Congratulations, ${s.name.split(" ")[0]}!`,
      p(`You've earned the <strong style="color:#131A1B;">${s.certificateName}</strong> certificate${s.distinction ? ` <strong style="color:#F47C20;">with Distinction</strong>` : ""}.`) +
      p("You passed every quick check and module quiz, cleared the final exam, and had your capstone approved by a human reviewer. That's the whole thing — well done.") +
      p(`Anyone can verify it at:<br/><a href="${verifyUrl}" style="color:#F47C20;">${verifyUrl}</a>`) +
      p(`<a href="${linkedIn}" style="color:#F47C20;font-weight:600;">Add it to your LinkedIn profile →</a>`),
      { href: verifyUrl, label: "View my certificate →" },
    ),
  });
}
