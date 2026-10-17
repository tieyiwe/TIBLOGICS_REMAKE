/**
 * How often the news agent publishes a full run. Shared by the agent route and
 * the admin page. Every other day by default (cost); a genuinely major story
 * still goes out between runs (the breaking check).
 *   AI_TIMES_REFRESH_HOURS  6 to 168 (default 48)
 */
const hours = Number(process.env.AI_TIMES_REFRESH_HOURS);
export const REFRESH_INTERVAL_MS = (Number.isFinite(hours) && hours >= 6 && hours <= 168 ? hours : 48) * 60 * 60 * 1000;
