import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getContacts } from "@/lib/admin/contacts";

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const contacts = await getContacts();
    return NextResponse.json({ contacts, total: contacts.length });
  } catch (err) {
    console.error("[GET /api/contacts]", err);
    return NextResponse.json({ contacts: [], total: 0 });
  }
}
