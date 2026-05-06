interface MeetingData {
  serviceType: string;
  date: Date;
  timeSlot: string;
  timezone: string;
  serviceDuration: string;
  firstName: string;
  lastName: string;
}

/** Parses duration string like "30 min", "90 min + Deliverable", "1h" → minutes */
export function parseDurationMinutes(dur: string): number {
  const hourMatch = dur.match(/^(\d+)\s*h/i);
  if (hourMatch) return parseInt(hourMatch[1]) * 60;
  const minMatch = dur.match(/(\d+)/);
  return minMatch ? parseInt(minMatch[1]) : 60;
}

/** Returns "HH:MM AM/PM" end time given a start slot and duration string */
export function calcEndTime(timeSlot: string, durationStr: string): string {
  const minutes = parseDurationMinutes(durationStr);
  const match = timeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return "";
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  const totalMins = h * 60 + m + minutes;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  const ampm = endH < 12 ? "AM" : "PM";
  const displayH = endH % 12 || 12;
  return `${displayH}:${String(endM).padStart(2, "0")} ${ampm}`;
}

/** Generates a Jitsi Meet link — no API credentials required */
export async function createMeeting(appt: MeetingData): Promise<string> {
  const date = appt.date.toISOString().slice(0, 10);
  const slug = `tiblogics-${appt.firstName}-${appt.lastName}-${date}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const subject = encodeURIComponent(`TIBLOGICS Session (${appt.serviceDuration})`);
  return `https://meet.jit.si/${slug}#config.subject=${subject}`;
}

/** Kept for backwards-compatibility with settings page — Jitsi needs no credentials */
export async function getMeetingProviderStatus(): Promise<{
  zoom: boolean;
  google: boolean;
  jitsi: boolean;
}> {
  return { zoom: false, google: false, jitsi: true };
}

/** No-op stubs retained so existing imports don't break */
export async function testZoomCredentials(
  _accountId: string,
  _clientId: string,
  _clientSecret: string
): Promise<boolean> {
  return false;
}

export async function testGoogleCredentials(
  _clientId: string,
  _clientSecret: string,
  _refreshToken: string
): Promise<boolean> {
  return false;
}
