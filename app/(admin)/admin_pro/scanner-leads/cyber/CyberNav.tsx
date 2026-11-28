import Link from "next/link";

const TABS = [
  ["Leads", "/admin_pro/scanner-leads"],
  ["Scan a website", "/admin_pro/scanner-leads/new"],
  ["Cyber scan", "/admin_pro/scanner-leads/cyber"],
  ["Engagements", "/admin_pro/scanner-leads/cyber/engagements"],
  ["Pen-test tools", "/admin_pro/scanner-leads/cyber/tools"],
  ["Scan log", "/admin_pro/scanner-leads/scan-log"],
] as const;

export default function CyberNav({ current, title, intro }: { current: string; title: string; intro: string }) {
  return (
    <div>
      <h1 className="font-syne text-[24px] font-bold leading-tight text-[var(--a-ink)] sm:text-[26px]">{title}</h1>
      <p className="mt-0.5 font-dm text-sm text-[var(--a-ink-3)]">{intro}</p>
      <nav aria-label="Sections" className="mt-4 flex gap-1 overflow-x-auto border-b border-[var(--a-border)]">
        {TABS.map(([label, href]) =>
          href === current ? (
            <span key={href} aria-current="page" className="-mb-px inline-flex h-10 shrink-0 items-center border-b-2 border-[var(--a-orange)] px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{label}</span>
          ) : (
            <Link key={href} href={href} className="-mb-px inline-flex h-10 shrink-0 items-center border-b-2 border-transparent px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink-3)] hover:text-[var(--a-ink)]">{label}</Link>
          ),
        )}
      </nav>
    </div>
  );
}

export function NoAccess() {
  return <p className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5 font-dm text-sm text-[var(--a-ink-2)]">The cyber scanner needs the &quot;Scanner leads: manage&quot; permission. Ask the owner for access.</p>;
}
