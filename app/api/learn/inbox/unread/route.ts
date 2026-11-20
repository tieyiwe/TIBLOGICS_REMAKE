import { NextResponse } from "next/server";
import { getStudent } from "@/lib/learn/session";
import { unreadCount } from "@/lib/learn/inbox/threads";
import { unreadNotifications } from "@/lib/learn/inbox/notifications";

export const dynamic = "force-dynamic";

// Unread Inbox conversations plus unread notifications, for the nav bell.
// Signed-out: 0, not an error.
export async function GET() {
  const student = await getStudent();
  const [messages, notifications] = student ? await Promise.all([unreadCount(student.id), unreadNotifications(student.id)]) : [0, 0];
  return NextResponse.json(
    { unread: messages + notifications, messages, notifications },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
