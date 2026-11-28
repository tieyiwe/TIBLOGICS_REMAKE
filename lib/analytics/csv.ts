import { NextResponse } from "next/server";

/** RFC 4180 quoting, and a leading quote on cells a spreadsheet would run as a formula. */
export function csvCell(v: unknown): string {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";

export function csvResponse(rows: unknown[][], name: string): NextResponse {
  const safe = name.replace(/[^\w.-]/g, "-").slice(0, 100);
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safe}.csv"`,
      "Cache-Control": "no-store, private",
    },
  });
}
