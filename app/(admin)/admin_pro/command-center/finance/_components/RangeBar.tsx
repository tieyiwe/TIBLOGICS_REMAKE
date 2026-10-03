"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button, buttonClasses, Select } from "@/components/admin/ui";
import { fmtDay } from "@/lib/admin/command-center/dates";
import { inputCls } from "../../_components/fields";
import { PRESETS } from "./range";

/** Date range picker (presets or custom) and the CSV export for the range. */
export function RangeBar({ range, exportKind }: { range: { from: string; to: string; preset: string }; exportKind: "income" | "expenses" }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        label="Period"
        value={range.preset}
        onChange={(e) => {
          if (e.target.value !== "custom") router.push(`${pathname}?range=${e.target.value}`);
        }}
      >
        {PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom</option>
      </Select>
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (from && to && from <= to) router.push(`${pathname}?from=${from}&to=${to}`);
        }}
      >
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" className={`${inputCls} w-[150px]`} />
        <span className="font-dm text-[13px] text-[var(--a-ink-3)]">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" className={`${inputCls} w-[150px]`} />
        <Button size="sm" type="submit" disabled={from === range.from && to === range.to}>
          Apply
        </Button>
      </form>
      <a
        href={`/api/admin/finance/export?kind=${exportKind}&from=${range.from}&to=${range.to}`}
        download
        className={buttonClasses("ghost", "sm")}
        aria-label={`Download CSV for ${fmtDay(range.from, { withYear: true })} to ${fmtDay(range.to, { withYear: true })}`}
      >
        <Download size={14} aria-hidden /> CSV
      </a>
    </div>
  );
}
