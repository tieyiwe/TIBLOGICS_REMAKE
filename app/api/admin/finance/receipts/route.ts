import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { currentStaff, writeGuard } from "@/lib/admin/command-center/guard";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

// Receipts are stored privately in the database (FinReceipt.data) and only
// served by /api/admin/finance/receipts/[id] to people with Finance access.
// PDF, PNG, JPEG or WebP up to 5 MB; the type is decided from the file's own
// bytes, not its name or the browser's claim.
const MAX_BYTES = 5 * 1024 * 1024;

function sniff(b: Uint8Array): string | null {
  const s = (i: number, str: string) => [...str].every((c, j) => b[i + j] === c.charCodeAt(0));
  if (b.length >= 5 && s(0, "%PDF-")) return "application/pdf";
  if (b.length >= 8 && b[0] === 0x89 && s(1, "PNG") && b[4] === 0x0d && b[5] === 0x0a) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && s(0, "RIFF") && s(8, "WEBP")) return "image/webp";
  return null;
}

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "receipts", { max: 20, multipart: true });
  if (blocked) return blocked;
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES + 64 * 1024) return NextResponse.json({ error: "Receipts can be up to 5 MB" }, { status: 413 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return NextResponse.json({ error: "Could not read the upload" }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "Attach a file" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "The file is empty" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Receipts can be up to 5 MB" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) return NextResponse.json({ error: "Upload a PDF, PNG, JPEG or WebP file" }, { status: 415 });

  const base = (file.name || "receipt").replace(/\.[^.]*$/, "").replace(/[^\w .-]+/g, "").trim().slice(0, 80) || "receipt";
  const filename = `${base}.${EXT[mime]}`;
  await ensureFinanceTables();
  const row = await prisma.finReceipt.create({
    data: { filename, mime, size: bytes.length, data: Buffer.from(bytes), uploadedById: staff.id },
    select: { id: true, filename: true, mime: true, size: true },
  });
  await audit(staff.session, "finance.receipt.upload", { type: "finance_receipt", id: row.id, label: filename }, { size: row.size, mime });
  return NextResponse.json({ receipt: row }, { status: 201 });
}
