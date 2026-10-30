/**
 * Plain punctuation. Readers now spot em dashes, curly quotes and ellipsis
 * characters as signs of AI writing, and the owner asked for none. The model
 * is told so, and anything that slips through is replaced.
 */
export function plainText(text: string): string {
  return text
    .replace(/\s*[\u2014\u2015]\s*/g, ", ")
    .replace(/(\d)\s*\u2013\s*(\d)/g, "$1-$2")
    .replace(/\s*\u2013\s*/g, ", ")
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u2192\u2794\u27A1]/g, "->")
    .replace(/\u00A0/g, " ")
    .replace(/,\s*([.,;:!?])/g, "$1")
    .replace(/ {2,}/g, " ");
}
