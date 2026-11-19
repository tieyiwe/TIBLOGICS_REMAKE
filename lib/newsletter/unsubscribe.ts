// The newsletter's unsubscribe link: /unsubscribe?email=... (a page with one
// button, app/(public)/unsubscribe). Links used to point at /unsubscribe,
// which did not exist, so every newsletter's unsubscribe link was a 404.
export function unsubscribeUrl(email: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com").replace(/\/$/, "");
  return `${base}/unsubscribe?email=${encodeURIComponent(email.trim().toLowerCase())}`;
}
