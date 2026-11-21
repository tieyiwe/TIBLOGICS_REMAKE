import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Download, Wrench } from "lucide-react";
import prisma from "@/lib/prisma";
import { ensureCyberTables, type ScanRow } from "@/lib/cyber/db";
import type { CyberResult } from "@/lib/cyber/types";
import CyberReport from "@/components/cyber/CyberReport";

// A security report shared with the client by the TIBLOGICS team. Private:
// an unguessable link, off by default, valid 30 days from sharing, never
// indexed. Shows the report and the ways to get it fixed.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Security report | TIBLOGICS", robots: { index: false, follow: false } };

export default async function SecurityReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();
  await ensureCyberTables();
  const row = (await prisma.$queryRawUnsafe<ScanRow[]>(`SELECT * FROM "CyberScan" WHERE "token" = $1 AND "sharedAt" > now() - interval '30 days' AND "status" = 'done'`, token))[0];
  if (!row?.result) notFound();
  const r = row.result as CyberResult;
  const { aiFixes: _omit, ...pub } = r as CyberResult & { aiFixes?: unknown };
  void _omit;
  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20 pt-32 sm:pt-40">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
        <div>
          <span className="section-tag">Security report{row.company ? ` · ${row.company}` : ""}</span>
          <h1 className="mt-2 break-words font-syne text-3xl font-extrabold text-[#0D1B2A] sm:text-4xl">How secure is {r.domain}?</h1>
          <p className="mt-2 max-w-3xl font-dm text-[#3A4A5C]">Prepared by TIBLOGICS. Every issue below comes with why it matters and how to fix it, most serious first. This link is private: please do not share it publicly.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`/api/security-report/${token}/pdf`} className="inline-flex items-center gap-2 rounded-xl border border-[#D2DCE8] bg-white px-4 py-2.5 font-dm text-sm font-semibold text-[#1B3A6B]" data-testid="public-pdf"><Download size={16} aria-hidden /> Download PDF</a>
            <Link href="/book?from=security-report" className="btn-primary"><CalendarCheck size={16} aria-hidden /> Book a call to get it fixed</Link>
          </div>
        </div>
        <CyberReport r={pub as CyberResult} mode="public" />
        <section className="flex flex-col gap-4 rounded-2xl bg-[#0D1B2A] p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <Wrench className="shrink-0 text-[#F47C20]" size={32} aria-hidden />
          <div className="flex-1">
            <h2 className="font-syne text-xl font-bold">Want this fixed for you?</h2>
            <p className="mt-1 font-dm text-sm text-white/80">TIBLOGICS fixes these issues, starting with the most serious, and re-tests to prove it. Reply to the email this link came in, or book a call.</p>
          </div>
          <Link href="/services/get-started?service=Cybersecurity" className="btn-primary justify-center">Request a fix</Link>
        </section>
      </div>
    </div>
  );
}
