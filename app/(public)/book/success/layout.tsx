import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo/meta";

// A booking confirmation for one visitor: never in search results.
export const metadata: Metadata = privateMetadata();

export default function BookSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
