import VideoTemplate from '@/components/video/VideoTemplate';

import type { Metadata } from "next";

// The animated explainer rendered for embedding (components/video). Not a
// page in its own right, so it stays out of search results.
export const metadata: Metadata = {
  title: "TIBLOGICS Video Preview",
  robots: { index: false, follow: true },
};

export default function VideoPage() {
  return <VideoTemplate />;
}
