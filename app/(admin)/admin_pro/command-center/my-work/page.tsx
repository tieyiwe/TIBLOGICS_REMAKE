import prisma from "@/lib/prisma";
import { requireCcPage } from "@/lib/admin/command-center/guard";
import { myWork } from "@/lib/admin/command-center/pm";
import { ccShellData } from "@/lib/admin/command-center/page-data";
import { addDays, dayToDate, keyOf } from "@/lib/admin/command-center/dates";
import { hasPermission, PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";
import MyWorkClient from "./MyWorkClient";

export const dynamic = "force-dynamic";

/** My work: tasks assigned to me across projects, today's meetings, my inbox. */
export default async function MyWorkPage() {
  const staff = await requireCcPage(PERM_COMMAND_CENTER);
  const [shell, work, prefs] = await Promise.all([
    ccShellData(staff),
    myWork(staff.id),
    prisma.pmPrefs.findUnique({ where: { staffId: staff.id } }).catch(() => null),
  ]);
  // Meetings come from Appointments, shown only to people who can open them.
  const today = new Date().toISOString().slice(0, 10);
  const meetings = hasPermission(staff.session.user, "appointments")
    ? await prisma.appointment
        .findMany({
          where: { date: { gte: new Date(`${addDays(today, -1)}T00:00:00Z`), lte: dayToDate(addDays(today, 8)) }, status: { in: ["PENDING", "CONFIRMED"] } },
          select: { id: true, firstName: true, lastName: true, company: true, serviceType: true, date: true, timeSlot: true, timezone: true, zoomLink: true, status: true },
          orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
          take: 50,
        })
        .then((rows) => rows.map((r) => ({ ...r, dateKey: keyOf(r.date)!, date: undefined })))
        .catch(() => [])
    : null;
  return <MyWorkClient shell={shell} initial={work} meetings={meetings} emailDigest={prefs?.emailDigest ?? true} />;
}
