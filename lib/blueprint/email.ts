import { mailTransport, MAIL_FROM } from "@/lib/resend";

// Automation Blueprint emails. Customer-typed values are escaped.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function frame(title: string, body: string): string {
  return `
  <div style="background:#F4F7FB;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;">
      <div style="background:linear-gradient(135deg,#0D1B2A,#1B3A6B);padding:26px 32px;">
        <div style="font-size:19px;font-weight:800;color:#fff;letter-spacing:.04em;">TIB<span style="color:#F47C20;">LOGICS</span> · Automation Blueprint</div>
      </div>
      <div style="padding:32px;">
        <h1 style="font-size:21px;color:#0D1B2A;margin:0 0 14px;">${title}</h1>
        ${body}
      </div>
      <div style="background:#F4F7FB;padding:18px 32px;text-align:center;color:#7A8FA6;font-size:12px;line-height:1.6;">
        This link is private to you. If it is ever shared by mistake, request a new one at tiblogics.com/tools/automation-blueprint and the old one stops working.
      </div>
    </div>
  </div>`;
}

const p = (t: string) => `<p style="font-size:14px;color:#3A4A5C;line-height:1.7;margin:0 0 12px;">${t}</p>`;
const button = (href: string, label: string) =>
  `<div style="margin:22px 0;"><a href="${esc(href)}" style="display:inline-block;background:#F47C20;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 28px;border-radius:10px;">${label}</a></div>`;

export async function sendBlueprintPaidEmail(b: { email: string; name: string; company: string; link: string; creditCode: string; credit: string; creditUntil: string }) {
  await mailTransport().sendMail({
    from: MAIL_FROM,
    to: b.email,
    subject: `Your Automation Blueprint for ${b.company} is being written`,
    html: frame(
      `Thanks, ${esc(b.name.split(" ")[0])}`,
      p(`We're writing the blueprint for <strong>${esc(b.company)}</strong> now. It usually takes a few minutes; we'll email you again the moment it's ready, and the link below will show it.`) +
        button(b.link, "Open your blueprint") +
        p(`Your credit code is <strong>${esc(b.creditCode)}</strong>. If you hire TIBLOGICS to build any part of the plan before ${esc(b.creditUntil)}, the ${esc(b.credit)} you paid comes off the project.`),
    ),
  });
}

export async function sendBlueprintReadyEmail(b: { email: string; name: string; company: string; link: string }) {
  await mailTransport().sendMail({
    from: MAIL_FROM,
    to: b.email,
    subject: `Your Automation Blueprint for ${b.company} is ready`,
    html: frame(
      "Your blueprint is ready",
      p(`The Automation Blueprint for <strong>${esc(b.company)}</strong> is ready to read. It sets out where your team's time goes, what to automate first, and a week-by-week plan.`) +
        button(b.link, "Read your blueprint") +
        p("Questions about any part of it? Reply to this email."),
    ),
  });
}

export async function sendBlueprintLinkEmail(b: { email: string; links: Array<{ company: string; link: string }> }) {
  await mailTransport().sendMail({
    from: MAIL_FROM,
    to: b.email,
    subject: "Your Automation Blueprint link",
    html: frame(
      "Here's a fresh link",
      p("Any link we sent before has stopped working.") + b.links.map((l) => p(esc(l.company)) + button(l.link, "Open blueprint")).join(""),
    ),
  });
}
