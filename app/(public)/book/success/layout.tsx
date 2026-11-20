import { Suspense } from "react";
import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo/meta";

// A booking confirmation for one visitor: never in search results.
export const metadata: Metadata = privateMetadata();

// The page reads useSearchParams(), which needs a Suspense boundary (the
// section's loading.tsx used to be it). The page never suspends at request
// time, so this adds no fallback and no delay.
export default function BookSuccessLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
