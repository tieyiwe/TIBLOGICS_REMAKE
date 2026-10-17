import { mailTransport, MAIL_FROM } from "@/lib/resend";
import { AREA_LABELS, describeChange, type Change, type Gap, type SiteSummary } from "./report";

// Readiness Monitor emails: the welcome with the dashboard link, the report
// after a run, and a replacement link on request.
//
// Hosts come from URLs subscribers typed, so everything interpolated is
// escaped; a competitor "URL" is not allowed to inject markup into a mail.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function frame(title: string, body: string, footer: string): string {
  return `
  <div style="background:#F4F7FB;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf1;">
      <div style="background:linear-gradient(135deg,#0D1B2A,#1B3A6B);padding:26px 32px;">
        <div style="font-size:19px;font-weight:800;color:#fff;letter-spacing:.04em;">TIB<span style="color:#F47C20;">LOGICS</span> · Readiness Monitor</div>
      </div>
      <div style="padding:32px;">
        <h1 style="font-size:21px;color:#0D1B2A;margin:0 0 14px;">${title}</h1>
        ${body}
      </div>
      <div style="background:#F4F7FB;padding:18px 32px;text-align:center;color:#7A8FA6;font-size:12px;line-height:1.6;">${footer}</div>
    </div>
  </div>`;
}

const button = (href: string, label: string) => `
  <div style="margin:24px 0;">
    <a href="${esc(href)}" style="display:inline-block;background:#F47C20;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 28px;border-radius:10px;">${label}</a>
  </div>`;

const linkNote = `This link is your key to the dashboard, so keep it private. If it is ever shared by mistake, request a new one from tiblogics.com/tools/readiness-monitor and the old link stops working.`;

export async function sendMonitorWelcomeEmail(p: { email: string; name?: string | null; siteUrl: string; link: string }) {
  const hi = p.name ? `, ${esc(p.name.split(" ")[0])}` : "";
  const html = frame(
    `You're set up${hi}`,
    `<p style="font-size:14px;color:#3A4A5C;line-height:1.7;margin:0;">
       The first scan of <strong>${esc(p.siteUrl)}</strong> and your competitors is running now. Your dashboard
       fills in within a minute or two, and we rescan every week after that. You'll get an email when there is
       something worth knowing: a score that moved, a problem fixed, or a new one.
     </p>
     ${button(p.link, "Open your dashboard")}`,
    linkNote,
  );
  await mailTransport().sendMail({ from: MAIL_FROM, to: p.email, subject: "Your Readiness Monitor is live", html });
}

export async function sendMonitorLinkEmail(p: { email: string; links: Array<{ siteUrl: string; link: string }> }) {
  const html = frame(
    "Your dashboard link",
    `<p style="font-size:14px;color:#3A4A5C;line-height:1.7;margin:0 0 8px;">
       Here is a fresh link. Any link we sent before has stopped working.
     </p>
     ${p.links.map((l) => `<p style="font-size:13px;color:#7A8FA6;margin:18px 0 0;">${esc(l.siteUrl)}</p>${button(l.link, "Open dashboard")}`).join("")}`,
    linkNote,
  );
  await mailTransport().sendMail({ from: MAIL_FROM, to: p.email, subject: "Your Readiness Monitor link", html });
}

export async function sendMonitorReportEmail(p: {
  email: string;
  link: string;
  sites: SiteSummary[];
  gaps: Gap[];
  changes: Change[];
  rank: { rank: number; of: number } | null;
  first: boolean;
}) {
  const own = p.sites.find((s) => s.isOwn);
  const rows = p.sites
    .map((s) => {
      const cells = s.scores
        ? (["overall", "ai", "seo", "perf", "ux"] as const)
            .map((a) => `<td style="padding:9px 6px;text-align:center;font-size:13px;color:#0D1B2A;${a === "overall" ? "font-weight:800;" : ""}">${s.scores![a]}</td>`)
            .join("")
        : `<td colspan="5" style="padding:9px 6px;font-size:12px;color:#B45309;">Could not scan: ${esc(s.error ?? "unknown error")}</td>`;
      return `<tr style="border-top:1px solid #eef1f4;">
        <td style="padding:9px 6px;font-size:13px;color:#0D1B2A;${s.isOwn ? "font-weight:700;" : ""}">${esc(s.host)}${s.isOwn ? " (you)" : ""}</td>${cells}</tr>`;
    })
    .join("");

  const changeList = p.changes.length
    ? `<h2 style="font-size:15px;color:#0D1B2A;margin:26px 0 8px;">Since the last scan</h2>
       <ul style="margin:0;padding-left:18px;color:#3A4A5C;font-size:13px;line-height:1.8;">
         ${p.changes.slice(0, 10).map((c) => `<li>${esc(describeChange(c))}</li>`).join("")}
       </ul>`
    : "";

  const gapList = p.gaps.length
    ? `<h2 style="font-size:15px;color:#0D1B2A;margin:26px 0 8px;">Where competitors are ahead</h2>
       <ul style="margin:0;padding-left:18px;color:#3A4A5C;font-size:13px;line-height:1.8;">
         ${p.gaps.slice(0, 5).map((g) => `<li>${esc(g.yours)} <span style="color:#7A8FA6;">(${esc(g.aheadHosts.join(", "))} ${g.aheadHosts.length === 1 ? "does" : "do"} this)</span></li>`).join("")}
       </ul>`
    : "";

  const headline = !own?.scores
    ? "We could not scan your site this time"
    : p.rank
    ? `You scored ${own.scores.overall}, ranked ${p.rank.rank} of ${p.rank.of}`
    : `You scored ${own.scores.overall}`;

  const html = frame(
    esc(headline),
    `<table style="width:100%;border-collapse:collapse;">
       <tr>
         <th style="text-align:left;padding:6px;font-size:11px;color:#7A8FA6;text-transform:uppercase;">Site</th>
         ${(["overall", "ai", "seo", "perf", "ux"] as const).map((a) => `<th style="padding:6px;font-size:11px;color:#7A8FA6;text-transform:uppercase;">${AREA_LABELS[a]}</th>`).join("")}
       </tr>
       ${rows}
     </table>
     ${changeList}
     ${gapList}
     ${button(p.link, "See the full report")}`,
    `You're receiving this because you subscribe to the TIBLOGICS Readiness Monitor. We only email when a run finds something new. ${linkNote}`,
  );

  await mailTransport().sendMail({
    from: MAIL_FROM,
    to: p.email,
    subject: p.first ? "Your first Readiness Monitor report" : `Readiness Monitor: ${headline}`,
    html,
  });
}
