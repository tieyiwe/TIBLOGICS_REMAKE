import Markdown from "@/components/learn/Markdown";
import { safePostMarkdown } from "@/lib/learn/community/shared";

// A learner's post through the lesson Markdown renderer (no raw HTML), with
// the interactive lesson fences turned into plain code blocks.
export default function PostBody({ source }: { source: string }) {
  return (
    <div className="community-post text-sm [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_p]:mb-2 [&_p:last-child]:mb-0">
      <Markdown source={safePostMarkdown(source)} />
    </div>
  );
}
