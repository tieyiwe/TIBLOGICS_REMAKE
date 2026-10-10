"use client";
import { useState, useMemo } from "react";
import { Download, Mail, Phone, Building2, ExternalLink, Users } from "lucide-react";
import { Badge, Button, DataTable, EmptyState, PageHeader, SearchInput, Segmented, StatCard, Toolbar, type BadgeTone } from "@/components/admin/ui";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  detail: string;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * One CSV cell, safe to open in a spreadsheet.
 *
 * Contacts come from public forms, so every field is attacker-controlled. The
 * export used to wrap values in quotes without escaping quotes inside them
 * (breaking rows), and left values starting with =, +, - or @ alone, which
 * Excel and Sheets run as formulas: a "name" of =HYPERLINK(...) would execute
 * on the admin's machine. Quotes are doubled, and a leading formula character
 * is neutralised with an apostrophe.
 */
function csvCell(value: string): string {
  let v = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return `"${v.replace(/"/g, '""')}"`;
}

export default function ContactsClient({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  const sources = useMemo(() => ["ALL", ...Array.from(new Set(contacts.map(c => c.source)))], [contacts]);

  const filtered = useMemo(() => contacts.filter(c => {
    const matchSource = sourceFilter === "ALL" || c.source === sourceFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q);
    return matchSource && matchSearch;
  }), [contacts, search, sourceFilter]);

  function exportCSV() {
    const header = "Name,Email,Phone,Company,Source,Detail,Date";
    const rows = filtered.map(c =>
      [c.name, c.email, c.phone ?? "", c.company ?? "", c.source, c.detail, formatDate(c.createdAt)].map(csvCell).join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tiblogics-contacts.csv"; a.click();
  }

  const SOURCE_TONE: Record<string, BadgeTone> = {
    "Service Request": "info",
    Booking: "success",
    Prospect: "orange",
    "Scanner Lead": "warn",
    Newsletter: "neutral",
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contacts"
        subtitle="Everyone who has interacted with TIBLOGICS across all channels."
        actions={
          <Button onClick={exportCSV} variant="secondary" icon={Download}>
            Export CSV
          </Button>
        }
        className="mb-0"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["Service Request", "Booking", "Prospect", "Newsletter"].map((src) => (
          <StatCard key={src} label={src} value={contacts.filter((c) => c.source === src).length} />
        ))}
      </div>

      <Toolbar className="mb-0">
        <SearchInput
          label="Search contacts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, company"
        />
        <Segmented
          ariaLabel="Filter by source"
          value={sourceFilter}
          onChange={setSourceFilter}
          options={sources.map((s) => ({ value: s, label: s === "ALL" ? "All" : s }))}
        />
      </Toolbar>

      <DataTable
        caption="Contacts"
        rows={filtered}
        rowKey={(c) => c.id}
        empty={
          <EmptyState
            icon={Users}
            title={contacts.length === 0 ? "No contacts yet" : "No contacts match"}
            body={contacts.length === 0 ? "Bookings, service requests, prospects and newsletter sign-ups appear here." : "Try a different search or source."}
            action={
              contacts.length > 0 ? (
                <Button variant="secondary" onClick={() => { setSearch(""); setSourceFilter("ALL"); }}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        }
        columns={[
          {
            key: "contact",
            header: "Contact",
            primary: true,
            render: (c) => (
              <div className="min-w-0">
                <p className="font-semibold text-[var(--a-ink)]">{c.name}</p>
                <a href={`mailto:${c.email}`} className="mt-0.5 flex items-center gap-1 break-all text-xs font-normal text-[var(--a-blue)] hover:underline">
                  <Mail size={11} aria-hidden />
                  {c.email}
                </a>
              </div>
            ),
          },
          {
            key: "details",
            header: "Details",
            render: (c) => (
              <div className="min-w-0">
                {c.phone && (
                  <p className="mb-0.5 flex items-center gap-1 text-xs text-[var(--a-ink-2)]">
                    <Phone size={11} aria-hidden />
                    {c.phone}
                  </p>
                )}
                {c.company && (
                  <p className="mb-0.5 flex items-center gap-1 text-xs text-[var(--a-ink-2)]">
                    <Building2 size={11} aria-hidden />
                    {c.company}
                  </p>
                )}
                <p className="max-w-[260px] truncate text-xs text-[var(--a-ink-3)]">{c.detail}</p>
              </div>
            ),
          },
          { key: "source", header: "Source", render: (c) => <Badge tone={SOURCE_TONE[c.source] ?? "neutral"}>{c.source}</Badge> },
          {
            key: "date",
            header: "Date",
            render: (c) => <span className="text-xs text-[var(--a-ink-3)] tabular-nums">{formatDate(c.createdAt)}</span>,
          },
          {
            key: "mail",
            header: <span className="sr-only">Email</span>,
            hideOnMobile: true,
            align: "right",
            render: (c) => (
              <a
                href={`mailto:${c.email}`}
                aria-label={`Email ${c.name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]"
              >
                <ExternalLink size={14} aria-hidden />
              </a>
            ),
          },
        ]}
      />

      <p className="text-right font-dm text-xs text-[var(--a-ink-3)]">
        {filtered.length} of {contacts.length} contacts
      </p>
    </div>
  );
}
