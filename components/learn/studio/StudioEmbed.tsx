"use client";

import StudioHost from "./StudioHost";

/**
 * A Studio tool inside a lesson: ```studio tool-id or ```studio tool-id:challenge-id
 * in the lesson Markdown.
 */
export default function StudioEmbed({ spec }: { spec: string }) {
  const [toolId, challengeId] = spec.trim().split(/\s+/)[0].split(":");
  return <StudioHost toolId={toolId} challengeId={challengeId || null} embedded />;
}
