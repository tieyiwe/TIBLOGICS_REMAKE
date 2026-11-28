import { getT } from "@/lib/i18n/server";

// Shown inside the member chrome (nav stays) while a page loads its data, so a
// click answers at once instead of waiting for the slowest query on the page.
export default async function Loading() {
  const t = await getT();
  return (
    <div role="status" aria-busy="true" className="animate-pulse space-y-6">
      <span className="sr-only">{t("site.loading")}</span>
      <div className="h-7 w-2/3 max-w-md rounded-xl bg-[var(--s3)]" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-[var(--border)] bg-white" />
        ))}
      </div>
      <div className="h-40 rounded-2xl border border-[var(--border)] bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-[var(--border)] bg-white" />
        ))}
      </div>
    </div>
  );
}
