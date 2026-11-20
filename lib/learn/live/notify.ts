import { contact, myRsvps, type SessionRow } from "./sessions";
import { sendRsvpEmail, type RsvpMail } from "./emails";

// Fire-and-log wrappers: an RSVP or a cancellation stands even when the mail
// server is down.

export async function mailRsvp(studentId: string, s: SessionRow, kind: RsvpMail): Promise<void> {
  try {
    const to = await contact(studentId);
    if (!to) return;
    const position = kind === "waitlist" ? (await myRsvps(studentId, [s.id])).get(s.id)?.position ?? 0 : 0;
    await sendRsvpEmail(to, s, kind, position);
  } catch (err) {
    console.error("[learn/live] rsvp email", err);
  }
}

export async function mailPromoted(studentIds: string[], s: SessionRow): Promise<void> {
  for (const id of studentIds) await mailRsvp(id, s, "promoted");
}
