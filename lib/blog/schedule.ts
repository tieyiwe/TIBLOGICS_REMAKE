/**
 * How often the news agent publishes a full run. Shared by the agent route and
 * the admin page. Daily by default, so AI Times keeps up with the news; a
 * genuinely major story still goes out between runs (the breaking check).
 *   AI_TIMES_REFRESH_HOURS  6 to 168 (default 24)
 */
const hours = Number(process.env.AI_TIMES_REFRESH_HOURS);
export const REFRESH_INTERVAL_MS = (Number.isFinite(hours) && hours >= 6 && hours <= 168 ? hours : 24) * 60 * 60 * 1000;
