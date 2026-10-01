import { NextResponse } from "next/server";
import { getStudent } from "@/lib/learn/session";
import { unreadCount } from "@/lib/learn/inbox/threads";

export const dynamic = "force-dynamic";

// Unread Inbox conversations for the nav badge. Signed-out: 0, not an error.
export async function GET() {
  const student = await getStudent();
  const unread = student ? await unreadCount(student.id) : 0;
  return NextResponse.json({ unread }, { headers: { "Cache-Control": "no-store, private" } });
}
