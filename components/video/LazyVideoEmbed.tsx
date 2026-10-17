"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Mounts the showcase only once it is about to be seen.
//
// next/dynamic alone moves the code out of the initial bundle but still
// fetches it the moment the component renders, which for a below-the-fold
// element means paying for framer-motion and six scenes before the visitor has
// scrolled anywhere near it. Waiting for intersection makes the deferral real.
// The placeholder keeps the frame's 16:9 box while the code downloads; with
// no loading state the box collapsed to nothing for a moment and the page
// below jumped twice (layout shift).
const Placeholder = () => <div className="w-full rounded-2xl bg-[#0D1B2A]" style={{ aspectRatio: "16/9" }} aria-hidden="true" />;
const VideoEmbed = dynamic(() => import("./VideoEmbed"), { ssr: false, loading: Placeholder });

export default function LazyVideoEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (old browser, or a test environment): show it
    // rather than leave a permanent grey box.
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }, // start loading just before it is needed
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {show ? <VideoEmbed /> : <Placeholder />}
    </div>
  );
}
