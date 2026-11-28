import { NextResponse } from "next/server";
import { resolveMx, resolveTxt } from "node:dns/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { mailTransport } from "@/lib/resend";
import prisma from "@/lib/prisma";
import { sendSampleReport } from "@/lib/scanner/email";

// Staff: is the scanner's email getting through? Run on the live server.
//   1. The mail server login (Titan SMTP, the TITAN_SMTP_* secrets).
//   2. The sending domain's DNS: SPF (may Titan send for it?), DKIM (signed?),
//      DMARC (what receivers do with failures) and MX. Without SPF and DKIM,
//      Gmail and Outlook send mail to spam or refuse it.
//   3. A sample of the visitor report email, to the staff member's address.
// POST { sample?: boolean } -> { smtp, dns, sample, recent }

export const maxDuration = 60;

const FROM = process.env.TITAN_SMTP_USER ?? "info@tiblogics.com";

async function txt(name: string): Promise<string[]> {
  try {
    return (await resolveTxt(name)).map((r) => r.join(""));
  } catch {
    return [];
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${ms / 1000}s`)), ms))]);
}

export async function POST(req: Request) {
  const denied = await requirePermission("scanner_leads:manage");
  if (denied) return denied;
  const limited = await staffAiLimit("scanner-mail-check", 20);
  if (limited) return limited;
  const body = (await req.json().catch(() => ({}))) as { sample?: boolean };
  const domain = FROM.split("@")[1] ?? "tiblogics.com";

  // 1. SMTP
  let smtp: { ok: boolean; detail: string };
  if (!process.env.TITAN_SMTP_PASS) {
    smtp = { ok: false, detail: "TITAN_SMTP_PASS is not set in Secrets: no email can be sent." };
  } else {
    try {
      await withTimeout(mailTransport().verify(), 15_000, "Mail server");
      smtp = { ok: true, detail: `Logged in to ${process.env.TITAN_SMTP_HOST ?? "smtp.titan.email"} as ${FROM}.` };
    } catch (err) {
      smtp = { ok: false, detail: `Mail server login failed: ${(err instanceof Error ? err.message : String(err)).slice(0, 200)}` };
    }
  }

  // 2. DNS
  const [root, dmarcRec, titanDkim, defDkim, mx] = await Promise.all([
    txt(domain),
    txt(`_dmarc.${domain}`),
    txt(`titan1._domainkey.${domain}`),
    txt(`default._domainkey.${domain}`),
    resolveMx(domain).catch(() => []),
  ]);
  const spf = root.find((r) => /^v=spf1/i.test(r)) ?? null;
  const dmarc = dmarcRec.find((r) => /^v=DMARC1/i.test(r)) ?? null;
  const dkim = [...titanDkim, ...defDkim].find((r) => /p=/.test(r)) ?? null;
  const dns = {
    domain,
    spf: { ok: !!spf && /titan/i.test(spf), record: spf, note: !spf ? "No SPF record." : /titan/i.test(spf) ? "Titan is allowed to send for the domain." : "SPF does not mention Titan (expected include:spf.titan.email)." },
    dkim: { ok: !!dkim, record: dkim ? `${dkim.slice(0, 60)}…` : null, note: dkim ? "A DKIM key is published." : "No DKIM key found at titan1._domainkey or default._domainkey. Turn on DKIM in Titan and add the record it gives you." },
    dmarc: { ok: !!dmarc, record: dmarc, note: dmarc ? `Policy: ${/p=(\w+)/i.exec(dmarc)?.[1] ?? "?"}.` : "No DMARC record. Add one, e.g. v=DMARC1; p=none; rua=mailto:" + FROM },
    mx: { ok: mx.length > 0, record: mx.map((m) => m.exchange).join(", ") || null, note: mx.length ? "Replies can be received." : "No MX record: replies cannot arrive." },
  };

  // 3. Sample
  let sample: { ok: boolean; detail: string } | null = null;
  if (body.sample) {
    const to = (await getServerSession(authOptions))?.user?.email;
    const latest = await prisma.scannerLead.findFirst({ where: { token: { not: null } }, orderBy: { createdAt: "desc" }, select: { id: true, domain: true } });
    if (!to) sample = { ok: false, detail: "Your account has no email address." };
    else if (!latest) sample = { ok: false, detail: "No scan yet to use as a sample." };
    else {
      try {
        await withTimeout(sendSampleReport(latest.id, to), 30_000, "Sending");
        sample = { ok: true, detail: `Sample report for ${latest.domain ?? "the latest scan"} sent to ${to}. Check that it arrived in the inbox, not spam.` };
      } catch (err) {
        sample = { ok: false, detail: `Not sent: ${(err instanceof Error ? err.message : String(err)).slice(0, 200)}` };
      }
    }
  }

  // Recent results emails
  const since = new Date(Date.now() - 7 * 86_400_000);
  const [asked, sent] = await Promise.all([
    prisma.scannerLead.count({ where: { consentAt: { gte: since }, email: { not: null } } }),
    prisma.scannerLead.count({ where: { consentAt: { gte: since }, emailedAt: { not: null } } }),
  ]);
  return NextResponse.json({ smtp, dns, sample, recent: { days: 7, asked, sent } });
}
