// Runs once per server start (node_modules/next/dist/docs: instrumentation).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  // In the background: the server starts answering at once.
  const { warmDatabase } = await import("./lib/db/warm");
  void warmDatabase();
}
