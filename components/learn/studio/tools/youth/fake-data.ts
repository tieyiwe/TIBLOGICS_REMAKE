// Cards for "Fake or Real?" (AI-Empowered Youth). Every item is made up or a
// well-known, easy-to-verify general fact; no real public figures, brands or
// news outlets. The words (text, clue, why) are in
// lib/i18n/messages/studio-youth.ts as studio.fake-or-real.item.<id>.*

export type Verdict = "real" | "fake" | "check";
export type ItemKind = "headline" | "quote" | "chatbot" | "photo" | "video" | "audio" | "post" | "ad";
export type DeckId = "warm-up" | "deepfake-tells" | "fact-check";

export interface FakeItem {
  id: string;
  deck: DeckId;
  kind: ItemKind;
  answer: Verdict;
  /** Who posted it (a made-up handle or site; shown as is). */
  src: string;
  /** For photo, video and audio cards: a simple emoji "picture". */
  scene?: string;
}

export const KIND_ICON: Record<ItemKind, string> = {
  headline: "📰",
  quote: "💬",
  chatbot: "🤖",
  photo: "📷",
  video: "🎬",
  audio: "🎧",
  post: "📱",
  ad: "📢",
};

export const VERDICT_ICON: Record<Verdict, string> = { real: "✅", fake: "❌", check: "🔍" };

export const FAKE_ITEMS: FakeItem[] = [
  // Warm-up: headlines, posts, quotes and chatbot answers with clear clues.
  { id: "w1", deck: "warm-up", kind: "headline", answer: "real", src: "Young Science Weekly" },
  { id: "w2", deck: "warm-up", kind: "headline", answer: "fake", src: "AmazingFactz.club" },
  { id: "w3", deck: "warm-up", kind: "post", answer: "fake", src: "@share_it_now_2026" },
  { id: "w4", deck: "warm-up", kind: "chatbot", answer: "fake", src: "HelpBot" },
  { id: "w5", deck: "warm-up", kind: "quote", answer: "fake", src: "@daily.brain.quotes" },
  { id: "w6", deck: "warm-up", kind: "headline", answer: "real", src: "History Explorer Magazine" },
  { id: "w7", deck: "warm-up", kind: "ad", answer: "fake", src: "free-consoles-4u.win" },
  { id: "w8", deck: "warm-up", kind: "headline", answer: "real", src: "Kids' Science Corner" },
  { id: "w9", deck: "warm-up", kind: "post", answer: "check", src: "@class7b_chat" },
  { id: "w10", deck: "warm-up", kind: "chatbot", answer: "real", src: "StudyBuddy AI" },
  { id: "w11", deck: "warm-up", kind: "headline", answer: "fake", src: "TotallyRealNews.biz" },
  { id: "w12", deck: "warm-up", kind: "headline", answer: "real", src: "Plant World Journal" },

  // Deepfake tells: AI-made or edited photos, videos and voices.
  { id: "d1", deck: "deepfake-tells", kind: "photo", answer: "fake", src: "@starstage_fanpage", scene: "🎤🙋‍♀️✋" },
  { id: "d2", deck: "deepfake-tells", kind: "photo", answer: "fake", src: "@citywalks_pics", scene: "🏪🔤❓" },
  { id: "d3", deck: "deepfake-tells", kind: "photo", answer: "fake", src: "@sunset_besties", scene: "🌅👫🔦" },
  { id: "d4", deck: "deepfake-tells", kind: "audio", answer: "fake", src: "Unknown number", scene: "🎙️🤖🔑" },
  { id: "d5", deck: "deepfake-tells", kind: "video", answer: "fake", src: "@breaking.clips.now", scene: "📺👩‍💼👄" },
  { id: "d6", deck: "deepfake-tells", kind: "photo", answer: "real", src: "@milo_the_cat_diary", scene: "🐈💤⌨️" },
  { id: "d7", deck: "deepfake-tells", kind: "photo", answer: "fake", src: "@storm_watch_viral", scene: "🦈🌊🏙️" },
  { id: "d8", deck: "deepfake-tells", kind: "video", answer: "check", src: "@pawsome_clips", scene: "🐕🛹✨" },
  { id: "d9", deck: "deepfake-tells", kind: "photo", answer: "fake", src: "@concert_crowd_cam", scene: "🎸👥🫠" },
  { id: "d10", deck: "deepfake-tells", kind: "audio", answer: "fake", src: "@speedy_drinks_promo", scene: "🏃‍♂️🥤🔊" },
  { id: "d11", deck: "deepfake-tells", kind: "photo", answer: "real", src: "Hillside School (official account)", scene: "🌈⚽🏫" },
  { id: "d12", deck: "deepfake-tells", kind: "photo", answer: "fake", src: "@museum_mysteries", scene: "🦖🚶🏛️" },

  // Fact-check: practise lateral reading (who says it, what evidence, what
  // do other sources say).
  { id: "f1", deck: "fact-check", kind: "post", answer: "fake", src: "@schoolnews_4u" },
  { id: "f2", deck: "fact-check", kind: "headline", answer: "check", src: "brainboost-blog.net" },
  { id: "f3", deck: "fact-check", kind: "chatbot", answer: "fake", src: "AnswerBot" },
  { id: "f4", deck: "fact-check", kind: "headline", answer: "real", src: "Space Science for Everyone" },
  { id: "f5", deck: "fact-check", kind: "post", answer: "fake", src: "Wrold News Today" },
  { id: "f6", deck: "fact-check", kind: "quote", answer: "check", src: "@inspire.every.day" },
  { id: "f7", deck: "fact-check", kind: "headline", answer: "real", src: "Weather and Sky Monthly" },
  { id: "f8", deck: "fact-check", kind: "post", answer: "check", src: "Neighbour in the town group chat" },
  { id: "f9", deck: "fact-check", kind: "headline", answer: "fake", src: "health-secrets-now.info" },
  { id: "f10", deck: "fact-check", kind: "ad", answer: "fake", src: "MindReader Pro app" },
  { id: "f11", deck: "fact-check", kind: "headline", answer: "real", src: "Body Basics Encyclopedia" },
  { id: "f12", deck: "fact-check", kind: "post", answer: "check", src: "@weather_guy_tom (52 followers)" },
];

export const DECKS: DeckId[] = ["warm-up", "deepfake-tells", "fact-check"];

/** Seconds per card: longer for the decks that need more reading. */
export const DECK_SECONDS: Record<DeckId | "sandbox", number> = {
  "warm-up": 25,
  "deepfake-tells": 30,
  "fact-check": 35,
  sandbox: 30,
};
