import type { ReactNode } from "react";

/** Splits "plain <em>accent</em> plain" from a dictionary string so each
 *  language can put the accented words where its grammar wants them. */
export function accent(text: string, render: (words: string, i: number) => ReactNode): ReactNode[] {
  return text.split(/<em>(.*?)<\/em>/).map((part, i) => (i % 2 === 1 ? render(part, i) : part));
}
