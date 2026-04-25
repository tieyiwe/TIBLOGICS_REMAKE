interface MeetingData {
  serviceType: string;
  date: Date;
  timeSlot: string;
  timezone: string;
  serviceDuration: number;
  firstName: string;
  lastName: string;
}

/** Generates a Jitsi Meet link — no API credentials required */
export async function createMeeting(appt: MeetingData): Promise<string> {
  const date = appt.date.toISOString().slice(0, 10);
  const slug = `tiblogics-${appt.firstName}-${appt.lastName}-${date}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `https://meet.jit.si/${slug}`;
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
