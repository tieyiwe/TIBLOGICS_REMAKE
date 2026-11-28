// Streams inside the admin shell (sidebar and header stay) while a page reads
// its data, so the shell paints at once and slow dashboards fill in after.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" className="animate-pulse space-y-5">
      <span className="sr-only">Loading</span>
      <div className="h-7 w-64 max-w-full rounded-lg bg-[var(--a-surface-2)]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]" />
        ))}
      </div>
      <div className="h-72 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]" />
    </div>
  );
}
