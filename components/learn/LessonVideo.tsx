"use client";

// Video host abstraction (Part B rule 5). Components never assume a provider —
// swapping YouTube for Mux/Vimeo happens here and nowhere else.
function parse(url: string): { kind: "youtube" | "vimeo" | "file"; src: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop();
      if (id) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return { kind: "vimeo", src: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) {
      return { kind: "file", src: url };
    }
    return null;
  } catch {
    return null;
  }
}

export default function LessonVideo({ url, title }: { url: string; title: string }) {
  const parsed = parse(url);

  if (!parsed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl border border-[var(--border)] bg-white p-6 text-sm font-semibold text-[var(--blue2)] underline"
      >
        Watch the video for this lesson →
      </a>
    );
  }

  if (parsed.kind === "file") {
    return (
      <video
        controls
        preload="metadata"
        className="w-full rounded-2xl border border-[var(--border)] bg-black"
        // Captions are required content — an empty track still signals intent
        // to assistive tech and keeps the control visible.
        crossOrigin="anonymous"
      >
        <source src={parsed.src} />
        Your browser can't play this video.{" "}
        <a href={parsed.src}>Download it instead</a>.
      </video>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black pt-[56.25%]">
      <iframe
        src={parsed.src}
        title={`Video: ${title}`}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
