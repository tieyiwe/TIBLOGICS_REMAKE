import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import AppointmentsClient from "./AppointmentsClient";

// Bookings are per-request and session-scoped — never cached or prerendered.
export const dynamic = "force-dynamic";

/**
 * Appointments admin — server-rendered initial read.
 *
 * Replaces the useEffect fetch of /api/appointments that used to run after the
 * page's JavaScript had loaded. Every mutation (confirm, reschedule, cancel,
 * delete, brief, voice) still goes through its existing /api/... route.
 */
export default async function AppointmentsPage() {
  // This page reads every client's name, email, company and private notes, so
  // it repeats the staff check requireAdmin() applies to the API routes rather
  // than trusting proxy.ts or the client-side layout guard.
  await requireAdminPage();

  // A database outage renders the page's own empty state instead of throwing
  // into the error boundary, matching how the public store page degrades.
  const rows = await prisma.appointment
    .findMany({ orderBy: { date: "desc" } })
    .catch((err) => {
      console.error("[admin/appointments page] appointments", err);
      return [];
    });

  // Serialised to the same JSON shape the client component previously received
  // from /api/appointments, so its date/money formatting is unchanged.
  const appointments = rows.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    timeSlot: a.timeSlot,
    timezone: a.timezone,
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    company: a.company,
    goalNotes: a.goalNotes,
    serviceType: a.serviceType,
    serviceDuration: a.serviceDuration,
    servicePrice: a.servicePrice,
    totalAmount: a.totalAmount,
    status: a.status,
    paymentStatus: a.paymentStatus ?? "",
    zoomLink: a.zoomLink,
    notes: a.notes,
    confirmedAt: a.confirmedAt ? a.confirmedAt.toISOString() : null,
    cancelledAt: a.cancelledAt ? a.cancelledAt.toISOString() : null,
    cancelReason: a.cancelReason,
    addOnRecording: a.addOnRecording,
    addOnActionPlan: a.addOnActionPlan,
    addOnSlackAccess: a.addOnSlackAccess,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AppointmentsClient initialAppointments={appointments} />;
}
