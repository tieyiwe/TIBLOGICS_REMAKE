"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

/** `session` from the server skips the initial /api/auth/session fetch. */
export function SessionWrapper({ session, children }: { session?: Session | null; children: React.ReactNode }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
