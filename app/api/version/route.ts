import { NextResponse } from "next/server";

// The build the server is running, so open tabs can tell when a new version
// has been published (components/UpdateWatcher.tsx). Public and harmless:
// only the build time, which next.config.js bakes into every build.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { build: process.env.NEXT_PUBLIC_BUILD_TIME || "" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
