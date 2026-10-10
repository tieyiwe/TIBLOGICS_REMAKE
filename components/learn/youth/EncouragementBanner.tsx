import prisma from "@/lib/prisma";
import { ensureNotificationTables } from "@/lib/learn/inbox/notifications";
import EncouragementDismiss from "./EncouragementDismiss";

// AI-Empowered Youth: the latest unread encouragement from a parent or
// sponsor (or the day-3 nudge), at the top of the learner dashboard until
// they close it (it stays in Inbox > Notifications). Nothing otherwise.
export default async function EncouragementBanner({ studentId }: { studentId: string }) {
  let row: { id: string; title: string; body: string } | undefined;
  try {
    await ensureNotificationTables();
    row = (
      await prisma.$queryRawUnsafe<Array<{ id: string; title: string; body: string }>>(
        `SELECT "id","title","body" FROM "LearnerNotification"
          WHERE "studentId" = $1 AND "kind" IN ('encouragement','nudge') AND "readAt" IS NULL AND "createdAt" > now() - interval '14 days'
          ORDER BY "createdAt" DESC LIMIT 1`,
        studentId,
      )
    )[0];
  } catch {
    return null;
  }
  if (!row) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-[var(--orange)] bg-white p-4" role="status" data-testid="encouragement-banner">
      <span aria-hidden="true" className="text-2xl">💌</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[var(--ink)]">{row.title}</p>
        <p className="mt-1 break-words text-sm leading-relaxed text-[var(--ink2)]">{row.body}</p>
      </div>
      <EncouragementDismiss id={row.id} />
    </div>
  );
}
