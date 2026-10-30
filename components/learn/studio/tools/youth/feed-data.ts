// Feed Simulator (AI-Empowered Youth): the made-up posts and the pretend
// recommendation algorithm. Pure functions, no React. Post titles are in
// lib/i18n/messages/studio-youth.ts (studio.feed-simulator.post.<id>);
// creators are invented handles, never real people or brands.

export const TOPICS = ["football", "music", "gaming", "science", "comedy", "dance", "cooking", "news", "fashion", "coding", "animals"] as const;
export type Topic = (typeof TOPICS)[number];

export const TOPIC_EMOJI: Record<Topic, string> = {
  football: "⚽",
  music: "🎵",
  gaming: "🎮",
  science: "🔬",
  comedy: "😂",
  dance: "💃",
  cooking: "🍳",
  news: "🗞️",
  fashion: "👟",
  coding: "💻",
  animals: "🐾",
};

/** Card backgrounds per topic (the topic name is always shown as text too). */
export const TOPIC_BG: Record<Topic, string> = {
  football: "from-[#0F7B45] to-[#0B5A33]",
  music: "from-[#6D28D9] to-[#4C1D95]",
  gaming: "from-[#1B3A6B] to-[#0D1B2A]",
  science: "from-[#0E7490] to-[#155E75]",
  comedy: "from-[#D97706] to-[#B45309]",
  dance: "from-[#BE185D] to-[#9D174D]",
  cooking: "from-[#C2410C] to-[#9A3412]",
  news: "from-[#334155] to-[#1E293B]",
  fashion: "from-[#9333EA] to-[#6B21A8]",
  coding: "from-[#2251A3] to-[#1B3A6B]",
  animals: "from-[#65A30D] to-[#3F6212]",
};

export interface Post {
  id: string;
  topic: Topic;
  creator: string;
  emoji: string;
  /** Length in seconds (shown on the card). */
  secs: number;
}

const P = (id: string, topic: Topic, creator: string, emoji: string, secs: number): Post => ({ id, topic, creator, emoji, secs });

export const POSTS: Post[] = [
  P("fb1", "football", "@pitch_tricks", "⚽🦶✨", 34),
  P("fb2", "football", "@keeper_kai", "🧤⚽🥅", 41),
  P("fb3", "football", "@girls_fc_united", "⚽👟🏆", 28),
  P("fb4", "football", "@tactics_board", "📋⚽🧠", 55),
  P("mu1", "music", "@beat_bakery", "🥁🎶🔥", 30),
  P("mu2", "music", "@uke_wednesday", "🪕🎵😊", 45),
  P("mu3", "music", "@choir_kids_live", "🎤👧👦", 38),
  P("mu4", "music", "@bedroom_producer", "🎧🎹💡", 52),
  P("ga1", "gaming", "@pixel_pioneer", "🎮🏰🐉", 47),
  P("ga2", "gaming", "@speedrun_sami", "⏱️🎮🏁", 39),
  P("ga3", "gaming", "@retro_rewind", "👾🕹️📼", 33),
  P("ga4", "gaming", "@indie_dev_diary", "🛠️🎮🌱", 58),
  P("sc1", "science", "@lab_coat_lena", "🧪💥🌈", 40),
  P("sc2", "science", "@space_snacks", "🪐🔭⭐", 50),
  P("sc3", "science", "@bug_detective", "🐜🔍🌿", 36),
  P("sc4", "science", "@why_sky_blue", "🌤️🔬❓", 44),
  P("co1", "comedy", "@cardboard_comedy", "📦😂🎭", 25),
  P("co2", "comedy", "@grandma_reacts", "👵😲😂", 29),
  P("co3", "comedy", "@prank_free_zone", "🙃🍌😆", 22),
  P("co4", "comedy", "@puns_daily", "🥁😏📚", 18),
  P("da1", "dance", "@step_squad", "💃🕺✨", 31),
  P("da2", "dance", "@tiny_tap", "👞🎵👏", 27),
  P("da3", "dance", "@wheel_moves", "♿💃🌟", 35),
  P("da4", "dance", "@dance_in_class", "🏫💃📏", 24),
  P("ck1", "cooking", "@ten_minute_chef", "🍳⏲️🥞", 48),
  P("ck2", "cooking", "@spice_route_kids", "🌶️🍲🌍", 57),
  P("ck3", "cooking", "@bake_fail_win", "🧁😅🎉", 42),
  P("ck4", "cooking", "@lunchbox_lab", "🥪🍎📦", 33),
  P("nw1", "news", "@kids_news_minute", "🗞️🌍🕐", 60),
  P("nw2", "news", "@town_reporter_jo", "🏘️🎙️📝", 46),
  P("nw3", "news", "@climate_check", "🌡️📈🌱", 53),
  P("nw4", "news", "@good_news_only", "🌟🤝🗞️", 37),
  P("fa1", "fashion", "@thrift_flip", "👕✂️♻️", 40),
  P("fa2", "fashion", "@sneaker_sketch", "👟✏️🎨", 32),
  P("fa3", "fashion", "@uniform_hacks", "🎒👔✨", 26),
  P("fa4", "fashion", "@colour_mixer", "🧣🎨🌈", 29),
  P("cd1", "coding", "@code_club_cat", "💻🐱⌨️", 49),
  P("cd2", "coding", "@robot_garage", "🤖🔧💡", 56),
  P("cd3", "coding", "@game_in_a_day", "🕹️💻⏰", 59),
  P("cd4", "coding", "@app_for_good", "📱💚🧩", 43),
  P("an1", "animals", "@pond_watch", "🐸🌿💧", 30),
  P("an2", "animals", "@rescue_pups", "🐶🏠❤️", 38),
  P("an3", "animals", "@octopus_facts", "🐙🌊🧠", 35),
  P("an4", "animals", "@birds_at_my_window", "🐦🪟🌅", 27),
];

export const POST_BY_ID = new Map(POSTS.map((p) => [p.id, p]));

export interface Weights {
  watch: number;
  likes: number;
  shares: number;
  similar: number;
  explore: number;
}
export const WEIGHT_KEYS: (keyof Weights)[] = ["watch", "likes", "shares", "similar", "explore"];
export const DEFAULT_WEIGHTS: Weights = { watch: 6, likes: 5, shares: 4, similar: 5, explore: 1 };
export const WEIGHT_COLOR: Record<keyof Weights, string> = {
  watch: "#2a78d6",
  likes: "#e34948",
  shares: "#1baf7a",
  similar: "#eda100",
  explore: "#4a3aa7",
};

/** One post the learner has seen and what they did with it. */
export interface Seen {
  id: string;
  /** 0.1 skipped, 1 watched to the end. */
  w: number;
  l?: 1;
  s?: 1;
  /** Shown by autopilot. */
  a?: 1;
}

const DECAY = 0.92;
const NO_REPEAT = 3;

export type Parts = Record<keyof Weights, number>;

/** How strongly each topic shows up in each signal, recent actions counting more. */
export function signals(history: Seen[]) {
  const watch = {} as Record<Topic, number>;
  const likes = {} as Record<Topic, number>;
  const shares = {} as Record<Topic, number>;
  for (const tp of TOPICS) watch[tp] = likes[tp] = shares[tp] = 0;
  const n = history.length;
  history.forEach((h, i) => {
    const p = POST_BY_ID.get(h.id);
    if (!p) return;
    const d = DECAY ** (n - 1 - i);
    watch[p.topic] += d * (h.w - 0.35);
    if (h.l) likes[p.topic] += d;
    if (h.s) shares[p.topic] += d;
  });
  // Topics of the last 5 posts the learner engaged with (liked, shared or watched).
  const engaged = history.filter((h) => h.l || h.s || h.w >= 0.8).slice(-5).map((h) => POST_BY_ID.get(h.id)?.topic);
  const recent = new Set(history.slice(-10).map((h) => POST_BY_ID.get(h.id)?.topic));
  return { watch, likes, shares, engaged, recent };
}

/** Squashes a signal into -1..1: more of it counts, but less and less. */
const sat = (x: number) => Math.sign(x) * (1 - Math.exp(-Math.abs(x) / 2));

/** The algorithm's score for one topic, split by signal (each part at most its weight, explore 1.5x). */
export function topicParts(topic: Topic, sig: ReturnType<typeof signals>, w: Weights): Parts {
  const sim = sig.engaged.length ? sig.engaged.filter((x) => x === topic).length / sig.engaged.length : 0;
  return {
    watch: w.watch * sat(sig.watch[topic]),
    likes: w.likes * sat(sig.likes[topic]),
    shares: w.shares * sat(sig.shares[topic]),
    similar: w.similar * sim,
    explore: sig.recent.has(topic) ? 0 : w.explore * 1.5,
  };
}

export const total = (p: Parts) => p.watch + p.likes + p.shares + p.similar + p.explore;

/** Small stable tie-breaker so equal scores don't always pick the same post. */
function jitter(id: string, n: number): number {
  let h = 2166136261 ^ n;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** The next post: highest score among posts not shown in the last few. */
export function nextPost(history: Seen[], w: Weights): { post: Post; parts: Parts } {
  const sig = signals(history);
  const recentIds = new Set(history.slice(-NO_REPEAT).map((h) => h.id));
  let best: { post: Post; parts: Parts; score: number } | null = null;
  for (const p of POSTS) {
    if (recentIds.has(p.id)) continue;
    const parts = topicParts(p.topic, sig, w);
    // Slight preference for posts the learner has seen fewer times.
    const times = history.filter((h) => h.id === p.id).length;
    const score = total(parts) - times * 0.4 + jitter(p.id, history.length) * 0.6;
    if (!best || score > best.score) best = { post: p, parts, score };
  }
  return best ?? { post: POSTS[0], parts: topicParts(POSTS[0].topic, sig, w) };
}

/** Share of different topics in the last `win` posts (1 = all different). */
export function diversity(history: Seen[], win = 10): number {
  const last = history.slice(-win);
  if (!last.length) return 1;
  const set = new Set(last.map((h) => POST_BY_ID.get(h.id)?.topic));
  return set.size / last.length;
}

/** Diversity after each post (for the chart). */
export function diversityHistory(history: Seen[], win = 10): number[] {
  const out: number[] = [];
  for (let i = 1; i <= history.length; i++) out.push(diversity(history.slice(0, i), win));
  return out;
}

export function topTopic(history: Seen[]): Topic | null {
  const sig = signals(history);
  let best: Topic | null = null;
  let v = 0;
  for (const tp of TOPICS) {
    const s = sig.likes[tp] * 2 + Math.max(0, sig.watch[tp]);
    if (s > v) {
      v = s;
      best = tp;
    }
  }
  return best;
}

export function isSeenList(v: unknown): v is Seen[] {
  return Array.isArray(v) && v.length <= 400 && v.every((h) => !!h && typeof h === "object" && POST_BY_ID.has((h as Seen).id) && typeof (h as Seen).w === "number");
}

export function isWeights(v: unknown): v is Weights {
  return !!v && typeof v === "object" && WEIGHT_KEYS.every((k) => typeof (v as Weights)[k] === "number" && (v as Weights)[k] >= 0 && (v as Weights)[k] <= 10);
}

/** The bubble the "break-the-bubble" challenge starts in: football and gaming, all liked. */
export const BUBBLE_START: Seen[] = ["fb1", "ga1", "fb2", "fb3", "ga2", "fb4", "fb1", "ga3", "fb2", "fb3"].map((id) => ({ id, w: 1, l: 1 }));
export const BUBBLE_TOPICS: Topic[] = ["football", "gaming"];
