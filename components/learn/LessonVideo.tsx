"use client";

import VideoPlayer from "./video/VideoPlayer";

// Video host abstraction (Part B rule 5). Components never assume a provider:
// parsing (YouTube, Vimeo, MP4/WebM, HLS) lives in lib/learn/video/shared.ts
// and playback in components/learn/video/VideoPlayer.tsx. This is the plain
// form, without chapters, captions or saved progress.
export default function LessonVideo({ url, title }: { url: string; title: string }) {
  return <VideoPlayer url={url} title={title} />;
}
