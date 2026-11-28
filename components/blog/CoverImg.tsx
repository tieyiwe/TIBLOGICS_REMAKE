import type { ImgHTMLAttributes } from "react";
import { coverWebpSrcSet } from "@/lib/blog/cover-webp";

/**
 * An article cover. Our drawn covers (/covers/<name>.png) are sent as WebP at
 * the size the slot needs (about a sixth of the PNG); any other image is a
 * plain <img>. `sizes` says how wide the slot is, as for <img sizes>.
 */
export default function CoverImg({ src, sizes, ...img }: ImgHTMLAttributes<HTMLImageElement> & { src: string; sizes: string }) {
  const webp = coverWebpSrcSet(src);
  // eslint-disable-next-line @next/next/no-img-element
  if (!webp) return <img src={src} sizes={sizes} {...img} />;
  return (
    // display: contents, so the <img> sizes itself against the slot as before.
    <picture className="contents">
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} {...img} />
    </picture>
  );
}
