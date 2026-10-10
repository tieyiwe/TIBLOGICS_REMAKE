"use client";

import type { ReactNode } from "react";
import { trackAcquire, type RefType } from "./track";

/** A CTA link that counts the click (the href is checked on the server). */
export default function TrackedLink({
  href,
  refType,
  slug,
  className,
  children,
}: {
  href: string;
  refType: RefType;
  slug: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={() => trackAcquire(refType, slug, "cta")}>
      {children}
    </a>
  );
}
