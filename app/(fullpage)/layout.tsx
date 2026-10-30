// Full-screen layout — no platform nav/footer.
// Used by event landing pages so they control their own visual experience.
export default function FullPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
