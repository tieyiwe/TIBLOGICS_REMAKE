import type { ElementType } from "react";

/**
 * Renders a dictionary string that carries light inline markup (<b>, <strong>,
 * <em>, <a>, <br>). Only ever pass text from our own message files, never
 * anything a visitor typed.
 */
export default function Html({
  html,
  as: Tag = "span",
  className,
}: {
  html: string;
  as?: ElementType;
  className?: string;
}) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
