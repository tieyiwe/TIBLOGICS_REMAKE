"use client";
import { useState, useEffect, useMemo } from "react";
import { Search, Download, Mail, Phone, Building2, ExternalLink } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  detail: string;
  createdAt: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "Service Request": "bg-[#EBF0FA] text-[#2251A3]",
  "Booking":         "bg-green-100 text-green-700",
  "Prospect":        "bg-[#FEF0E3] text-[#F47C20]",
  "Scanner Lead":    "bg-purple-100 text-purple-700",
  "Newsletter":      "bg-gray-100 text-gray-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/contacts")
      .then(r => r.json())
      .then(d => setContacts(d.contacts ?? []))
      .finally(() => setLoading(false));
  }, []);

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
      [c.name, c.email, c.phone ?? "", c.company ?? "", c.source, c.detail, formatDate(c.createdAt)].map(v => `"${v}"`).join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tiblogics-contacts.csv"; a.click();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-[#0D1B2A]">Contacts</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
            Everyone who has interacted with TIBLOGICS across all channels.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 text-sm font-dm font-medium text-[#2251A3] hover:text-[#1B3A6B] border border-[#D2DCE8] rounded-xl px-4 py-2 hover:bg-[#EBF0FA] transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="w-full pl-9 pr-4 py-2 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {sources.map(s => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`text-xs font-dm font-medium px-3 py-1.5 rounded-full border transition-colors ${
                sourceFilter === s
                  ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                  : "bg-white text-[#3A4A5C] border-[#D2DCE8] hover:border-[#2251A3]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["Service Request", "Booking", "Prospect", "Newsletter"].map(src => {
          const count = contacts.filter(c => c.source === src).length;
          return (
            <div key={src} className="bg-white border border-[#D2DCE8] rounded-xl p-3 text-center">
              <p className="font-syne font-bold text-xl text-[#0D1B2A]">{count}</p>
              <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{src}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center font-dm text-sm text-[#7A8FA6]">Loading contacts…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center font-dm text-sm text-[#7A8FA6]">No contacts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-dm">
              <thead>
                <tr className="border-b border-[#F4F7FB] bg-[#F8FAFD]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider hidden md:table-cell">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A8FA6] uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3"/>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-[#F4F7FB] hover:bg-[#F8FAFD] transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#0D1B2A]">{c.name}</p>
                      <a href={`mailto:${c.email}`} className="text-xs text-[#2251A3] hover:underline flex items-center gap-1 mt-0.5">
                        <Mail size={11} />{c.email}
                      </a>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {c.phone && (
                        <p className="text-xs text-[#3A4A5C] flex items-center gap-1 mb-0.5">
                          <Phone size={11} />{c.phone}
                        </p>
                      )}
                      {c.company && (
                        <p className="text-xs text-[#3A4A5C] flex items-center gap-1 mb-0.5">
                          <Building2 size={11} />{c.company}
                        </p>
                      )}
                      <p className="text-xs text-[#7A8FA6] truncate max-w-[200px]">{c.detail}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[c.source] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.source}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-xs text-[#7A8FA6]">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <a href={`mailto:${c.email}`} className="text-[#7A8FA6] hover:text-[#1B3A6B] transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="font-dm text-xs text-[#7A8FA6] text-right">{filtered.length} of {contacts.length} contacts</p>
    </div>
  );
}
