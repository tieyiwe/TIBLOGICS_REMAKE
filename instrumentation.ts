// Runs once per server start (node_modules/next/dist/docs: instrumentation).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  // In the background: the server starts answering at once.
  const { warmDatabase } = await import("./lib/db/warm");
  void warmDatabase();
  // Separately sold monthly tracks: tables, and the one-time mark that keeps
  // them for learners already on the all-tracks plan. Before any new sale.
  const { ensureTrackSubscriptionTables } = await import("./lib/learn/track-subscriptions");
  void ensureTrackSubscriptionTables().catch((err) => console.error("[startup] track subscriptions", err));
}
