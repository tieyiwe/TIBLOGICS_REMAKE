import { prisma } from "@/lib/prisma";

async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.adminSettings.findUnique({ where: { key } });
  return row?.value ?? null;
}

/** Formats date + timeSlot into "YYYY-MM-DDTHH:MM:00" local time string for APIs */
function localDateTime(date: Date, timeSlot: string): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return `${yyyy}-${mm}-${dd}T09:00:00`;

  let h = parseInt(match[1]);
  const min = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;

  return `${yyyy}-${mm}-${dd}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

interface MeetingData {
  serviceType: string;
  date: Date;
  timeSlot: string;
  timezone: string;
  serviceDuration: number;
  firstName: string;
  lastName: string;
}

/**
 * Tries Zoom first, then Google Meet.
 * Returns the join URL or null if neither is configured / both fail.
 */
export async function createMeeting(appt: MeetingData): Promise<string | null> {
  // ── Zoom ──────────────────────────────────────────────────────────────────
  const [zoomAccountId, zoomClientId, zoomClientSecret] = await Promise.all([
    getSetting("zoom_account_id"),
    getSetting("zoom_client_id"),
    getSetting("zoom_client_secret"),
  ]);

  if (zoomAccountId && zoomClientId && zoomClientSecret) {
    const link = await createZoomMeeting(appt, zoomAccountId, zoomClientId, zoomClientSecret);
    if (link) return link;
    console.warn("[meeting] Zoom configured but meeting creation failed — falling through to Google Meet");
  }

  // ── Google Meet ────────────────────────────────────────────────────────────
  const [googleClientId, googleClientSecret, googleRefreshToken] = await Promise.all([
    getSetting("google_client_id"),
    getSetting("google_client_secret"),
    getSetting("google_refresh_token"),
  ]);

  if (googleClientId && googleClientSecret && googleRefreshToken) {
    const link = await createGoogleMeetMeeting(appt, googleClientId, googleClientSecret, googleRefreshToken);
    if (link) return link;
    console.warn("[meeting] Google Meet configured but meeting creation failed");
  }

  return null;
}

/** Returns which providers are fully configured (without revealing secrets) */
export async function getMeetingProviderStatus(): Promise<{
  zoom: boolean;
  google: boolean;
}> {
  const [zoomAccountId, zoomClientId, zoomClientSecret, googleClientId, googleClientSecret, googleRefreshToken] =
    await Promise.all([
      getSetting("zoom_account_id"),
      getSetting("zoom_client_id"),
      getSetting("zoom_client_secret"),
      getSetting("google_client_id"),
      getSetting("google_client_secret"),
      getSetting("google_refresh_token"),
    ]);

  return {
    zoom: Boolean(zoomAccountId && zoomClientId && zoomClientSecret),
    google: Boolean(googleClientId && googleClientSecret && googleRefreshToken),
  };
}

// ── Zoom ─────────────────────────────────────────────────────────────────────

async function createZoomMeeting(
  appt: MeetingData,
  accountId: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
    // 1. Get access token via Server-to-Server OAuth
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    if (!tokenRes.ok) {
      console.error("[zoom] token error", await tokenRes.text());
      return null;
    }
    const { access_token } = await tokenRes.json() as { access_token: string };

    // 2. Create scheduled meeting
    const topic = `TIBLOGICS — ${appt.serviceType.replace(/_/g, " ")} · ${appt.firstName} ${appt.lastName}`;
    const start_time = localDateTime(appt.date, appt.timeSlot);

    const meetRes = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        type: 2, // scheduled
        start_time,
        duration: appt.serviceDuration,
        timezone: appt.timezone,
        settings: {
          join_before_host: true,
          waiting_room: false,
          auto_recording: "none",
        },
      }),
    });

    if (!meetRes.ok) {
      console.error("[zoom] create meeting error", await meetRes.text());
      return null;
    }
    const { join_url } = await meetRes.json() as { join_url?: string };
    return join_url ?? null;
  } catch (err) {
    console.error("[zoom] unexpected error", err);
    return null;
  }
}

/** Test Zoom credentials — returns true if a token can be obtained */
export async function testZoomCredentials(
  accountId: string,
  clientId: string,
  clientSecret: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ── Google Meet ───────────────────────────────────────────────────────────────

async function createGoogleMeetMeeting(
  appt: MeetingData,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string | null> {
  try {
    // 1. Exchange refresh token for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!tokenRes.ok) {
      console.error("[google] token error", await tokenRes.text());
      return null;
    }
    const { access_token } = await tokenRes.json() as { access_token: string };

    // 2. Create calendar event with Meet link
    const startDt = localDateTime(appt.date, appt.timeSlot);
    const endDt = addMinutes(startDt, appt.serviceDuration);
    const summary = `TIBLOGICS — ${appt.serviceType.replace(/_/g, " ")} · ${appt.firstName} ${appt.lastName}`;
    const requestId = `tiblogics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const eventRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          start: { dateTime: startDt, timeZone: appt.timezone },
          end: { dateTime: endDt, timeZone: appt.timezone },
          conferenceData: {
            createRequest: {
              requestId,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      }
    );

    if (!eventRes.ok) {
      console.error("[google] create event error", await eventRes.text());
      return null;
    }
    const event = await eventRes.json() as {
      conferenceData?: {
        entryPoints?: Array<{ entryPointType: string; uri: string }>;
      };
    };
    return (
      event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")?.uri ?? null
    );
  } catch (err) {
    console.error("[google] unexpected error", err);
    return null;
  }
}

/** Test Google credentials — returns true if a token can be refreshed */
export async function testGoogleCredentials(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<boolean> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function addMinutes(dt: string, minutes: number): string {
  return new Date(new Date(dt).getTime() + minutes * 60_000).toISOString().slice(0, 19);
}
