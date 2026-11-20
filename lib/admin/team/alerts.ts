// Emails the owner about sensitive staff events: data exports, learner
// deletions, permission or role changes, a staff sign-in from a new device,
// and repeated failed staff sign-ins. Sent to ADMIN_NOTIFY_EMAIL (default
// info@tiblogics.com) from the main TIBLOGICS address. Never throws; at most
// 20 alerts of one kind per hour so a loop cannot flood the inbox.
import { checkRateLimit } from "@/lib/rate-limit";

export type AlertKind = "export" | "learner_delete" | "access_change" | "new_device" | "failed_signins";

const TITLES: Record<AlertKind, string> = {
  export: "Data export by a staff member",
  learner_delete: "A learner account was deleted",
  access_change: "Staff access changed",
  new_device: "Staff sign-in from a new device",
  failed_signins: "Repeated failed staff sign-ins",
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]!);
}

export function ownerAlertAddress(): string {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || "info@tiblogics.com";
}

export async function sendOwnerAlert(kind: AlertKind, summary: string, rows: Array<[string, string | null | undefined]>): Promise<void> {
  try {
    if (!(await checkRateLimit(`staff-alert:${kind}`, 20, 3_600_000))) return;
    const { default: mailer } = await import("@/lib/resend");
    const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");
    const table = rows
      .filter(([, v]) => v != null && v !== "")
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#5A6E84;font-size:13px;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:6px 0;color:#0D1B2A;font-size:13px;">${esc(String(v))}</td></tr>`,
      )
      .join("");
    await mailer.emails.send({
      to: ownerAlertAddress(),
      subject: `[TIBLOGICS admin] ${TITLES[kind]}`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E3E9F1;">
    <div style="background:#1B3A6B;padding:18px 24px;"><span style="color:#fff;font-size:18px;font-weight:700;">TIB<span style="color:#F47C20;">LOGICS</span></span><span style="color:#C9D6EA;font-size:13px;margin-left:8px;">Security alert</span></div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 8px;color:#0D1B2A;font-size:18px;">${esc(TITLES[kind])}</h2>
      <p style="margin:0 0 16px;color:#3A4A5C;font-size:14px;line-height:1.6;">${esc(summary)}</p>
      <table style="border-collapse:collapse;">${table}</table>
      <p style="margin:20px 0 0;"><a href="${base}/admin_pro/team/activity" style="display:inline-block;background:#B8500A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:700;">Open staff activity</a></p>
      <p style="margin:16px 0 0;color:#5A6E84;font-size:12px;">Sent to ${esc(ownerAlertAddress())} (ADMIN_NOTIFY_EMAIL). Times are UTC.</p>
    </div>
  </div>
</body></html>`,
    });
  } catch (err) {
    console.error("[team/alerts]", kind, err instanceof Error ? err.message : err);
  }
}
