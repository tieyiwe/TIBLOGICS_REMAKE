import Image from "next/image";

/**
 * A product or collection image filling its (positioned) box. Images served
 * from this site go through next/image (resized, AVIF/WebP, lazy unless
 * `priority`); an image URL on another host, which next.config.js may not
 * allow, stays a plain lazy <img>.
 */
export default function ShopImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  style,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const local = src.startsWith("/") && !src.startsWith("//") && !src.includes("?");
  if (local) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} style={{ objectFit: "cover", ...style }} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }}
    />
  );
}
