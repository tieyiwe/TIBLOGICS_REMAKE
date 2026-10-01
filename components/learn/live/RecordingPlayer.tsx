"use client";

import { useEffect, useState } from "react";
import VideoPlayer from "@/components/learn/video/VideoPlayer";

// The lesson video player for a session recording. Mounted after hydration:
// the YouTube embed URL carries the page's origin, which the server cannot
// know, so rendering it on the server would not match the browser.
export default function RecordingPlayer({ url, title }: { url: string; title: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="aspect-video w-full rounded-xl bg-[var(--s2)]" aria-hidden="true" />;
  return <VideoPlayer url={url} title={title} />;
}
