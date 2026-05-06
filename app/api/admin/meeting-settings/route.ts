import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMeetingProviderStatus,
  testZoomCredentials,
  testGoogleCredentials,
} from "@/lib/meeting-providers";

/** GET — returns which providers are fully configured (no secrets exposed) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getMeetingProviderStatus();
  return NextResponse.json(status);
}

/** POST — save credentials and optionally test the connection */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    provider: "zoom" | "google";
    test?: boolean;
    zoom?: { accountId: string; clientId: string; clientSecret: string };
    google?: { clientId: string; clientSecret: string; refreshToken: string };
  };

  if (body.provider === "zoom" && body.zoom) {
    const { accountId, clientId, clientSecret } = body.zoom;

    if (body.test) {
      const ok = await testZoomCredentials(accountId, clientId, clientSecret);
      return NextResponse.json({ success: ok, message: ok ? "Zoom connected successfully!" : "Invalid Zoom credentials. Check your Account ID, Client ID and Client Secret." });
    }

    // Save all three keys
    await Promise.all([
      upsert("zoom_account_id", accountId),
      upsert("zoom_client_id", clientId),
      upsert("zoom_client_secret", clientSecret),
    ]);
    return NextResponse.json({ success: true });
  }

  if (body.provider === "google" && body.google) {
    const { clientId, clientSecret, refreshToken } = body.google;

    if (body.test) {
      const ok = await testGoogleCredentials(clientId, clientSecret, refreshToken);
      return NextResponse.json({ success: ok, message: ok ? "Google Meet connected successfully!" : "Invalid Google credentials. Check your Client ID, Client Secret and Refresh Token." });
    }

    await Promise.all([
      upsert("google_client_id", clientId),
      upsert("google_client_secret", clientSecret),
      upsert("google_refresh_token", refreshToken),
    ]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

/** DELETE — remove all credentials for a provider */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await req.json() as { provider: "zoom" | "google" };

  const keys =
    provider === "zoom"
      ? ["zoom_account_id", "zoom_client_id", "zoom_client_secret"]
      : ["google_client_id", "google_client_secret", "google_refresh_token"];

  await prisma.adminSettings.deleteMany({ where: { key: { in: keys } } });
  return NextResponse.json({ success: true });
}

function upsert(key: string, value: string) {
  return prisma.adminSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
