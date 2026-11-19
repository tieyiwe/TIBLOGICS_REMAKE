import prisma from "@/lib/prisma";
import { sendAdminNewRegistrationAlert, sendEventWelcomeEmail } from "@/lib/resend";
import { groupNotePrefix } from "./seat-pricing";

/**
 * After an event booking is paid for (or confirmed free): the admin alert,
 * and the welcome email to the booker and to every extra seat of a group
 * booking. The caller marks the registrations paid first, once.
 */
export async function confirmEventRegistration(registrationId: string): Promise<void> {
  const reg = await prisma.eventRegistration.findUniqueOrThrow({ where: { id: registrationId } });
  const extras = reg.confirmationNumber
    ? await prisma.eventRegistration.findMany({ where: { notes: { startsWith: groupNotePrefix(reg.confirmationNumber) } } })
    : [];

  sendAdminNewRegistrationAlert({
    firstName: reg.firstName,
    lastName: reg.lastName,
    email: reg.email,
    eventName: reg.eventName,
    confirmationNumber: reg.confirmationNumber ?? undefined,
    whatsapp: reg.whatsapp,
  }).catch((err) => console.error("[events] admin alert failed:", err instanceof Error ? err.message : err));

  for (const r of [reg, ...extras]) {
    if (!r.email.includes("@")) continue;
    await sendEventWelcomeEmail({
      firstName: r.firstName,
      email: r.email,
      eventName: r.eventName,
      confirmationNumber: r.confirmationNumber,
    }).catch((err) => console.error(`[events] welcome email failed (${r.id}):`, err instanceof Error ? err.message : err));
  }
}
