import Link from "next/link";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import NewScanForm from "./NewScanForm";

// The admin scanner: scan any public website, then review the full report and
// send it to the site's owner from the scan's page.
export const dynamic = "force-dynamic";

export default async function NewScanPage() {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-[24px] leading-tight text-[var(--a-ink)] sm:text-[26px]">Scanner Leads</h1>
        <p className="font-dm text-sm text-[var(--a-ink-3)] mt-0.5">
          Scan a company&apos;s website, check the full report, then send it to the owner with an offer to fix what it found.
        </p>
        <nav aria-label="Sections" className="mt-4 flex gap-1 border-b border-[var(--a-border)]">
          <Link href="/admin_pro/scanner-leads" className="-mb-px inline-flex h-10 items-center border-b-2 border-transparent px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink-3)] hover:text-[var(--a-ink)]">Leads</Link>
          <span aria-current="page" className="-mb-px inline-flex h-10 items-center border-b-2 border-[var(--a-orange)] px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">Scan a website</span>
          <Link href="/admin_pro/scanner-leads/cyber" className="-mb-px inline-flex h-10 items-center border-b-2 border-transparent px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink-3)] hover:text-[var(--a-ink)]">Cyber scan</Link>
          <Link href="/admin_pro/scanner-leads/scan-log" className="-mb-px inline-flex h-10 items-center border-b-2 border-transparent px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink-3)] hover:text-[var(--a-ink)]">Scan log</Link>
        </nav>
      </div>
      <NewScanForm />
      <div className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5 font-dm text-sm text-[var(--a-ink-2)] space-y-2">
        <p className="font-semibold text-[var(--a-ink)]">How it works</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>The scanner checks the site&apos;s public pages: speed, SEO, AI readiness, lead capture and security (headers, TLS, cookies, email security, exposed files). No free-scan limit for the team.</li>
          <li>The scan is unlocked at once, so the report link shows everything. Nothing is emailed yet.</li>
          <li>On the scan&apos;s page, review the problems and the internal fix plan, then send the report to the owner in their language, with your note, the PDF and &quot;Fix this for me&quot; links back to us.</li>
        </ol>
        <p className="text-xs text-[var(--a-ink-3)]">Only scan sites you have a reason to contact, and send to a real business address. Unsubscribed addresses are never emailed.</p>
      </div>
    </div>
  );
}
