// Share links for badges and certificates. Client-safe.

/**
 * LinkedIn "Add licence or certification" prefill
 * (https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME...).
 */
export function linkedInAddUrl(o: { name: string; issuedAt: Date | string; certUrl: string; certId: string }): string {
  const d = new Date(o.issuedAt);
  const q = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: o.name,
    organizationName: "TIBLOGICS",
    issueYear: String(d.getUTCFullYear()),
    issueMonth: String(d.getUTCMonth() + 1),
    certUrl: o.certUrl,
    certId: o.certId,
  });
  return `https://www.linkedin.com/profile/add?${q.toString()}`;
}

export function shareLinks(url: string, text: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    email: `mailto:?subject=${t}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  };
}
