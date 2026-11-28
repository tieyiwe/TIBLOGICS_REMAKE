// The AI agents the readiness check looks at, by what blocking them costs a
// business.
//
//   assistant  fetches a page live because a person asked an AI assistant
//              (look this up, compare these, buy this). Blocking it turns
//              away a customer who is already asking about you.
//   search     builds the index AI search and answer engines recommend from
//              (ChatGPT search, Claude, Perplexity, Google, Copilot, Siri).
//              Blocking it keeps you out of AI recommendations ("AI SEO").
//   training   collects text to train future models. Blocking it is a
//              legitimate business choice: reported, never scored.
//
// `token` is the name robots.txt uses (User-agent: <token>). `ua` is the
// User-Agent string sent in the live access test; agents that only exist as
// a robots.txt token (Google-Extended, Applebot-Extended) have none.

export type AgentRole = "assistant" | "search" | "training";

export interface Agent {
  token: string;
  company: string;
  role: AgentRole;
  /** What it powers, in plain words (English; shown as is, a product name). */
  powers: string;
  ua?: string;
}

const MOZ = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible;";

export const AGENTS: Agent[] = [
  // People asking an assistant, live.
  { token: "ChatGPT-User", company: "OpenAI", role: "assistant", powers: "ChatGPT (browsing, shopping, agents)", ua: `${MOZ} ChatGPT-User/1.0; +https://openai.com/bot)` },
  { token: "Claude-User", company: "Anthropic", role: "assistant", powers: "Claude (fetching pages for a user)", ua: `${MOZ} Claude-User/1.0; +Claude-User@anthropic.com)` },
  { token: "Perplexity-User", company: "Perplexity", role: "assistant", powers: "Perplexity (answers and shopping)", ua: `${MOZ} Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)` },
  { token: "MistralAI-User", company: "Mistral AI", role: "assistant", powers: "Le Chat", ua: `${MOZ} MistralAI-User/1.0; +https://docs.mistral.ai/robots)` },
  { token: "Meta-ExternalFetcher", company: "Meta", role: "assistant", powers: "Meta AI (links people share)" },

  // AI search and answer indexes.
  { token: "OAI-SearchBot", company: "OpenAI", role: "search", powers: "ChatGPT search results", ua: `${MOZ} OAI-SearchBot/1.0; +https://openai.com/searchbot)` },
  { token: "Claude-SearchBot", company: "Anthropic", role: "search", powers: "Claude search results" },
  { token: "PerplexityBot", company: "Perplexity", role: "search", powers: "Perplexity search index", ua: `${MOZ} PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)` },
  { token: "Googlebot", company: "Google", role: "search", powers: "Google Search and AI Overviews" },
  { token: "Bingbot", company: "Microsoft", role: "search", powers: "Bing and Copilot" },
  { token: "Applebot", company: "Apple", role: "search", powers: "Siri and Spotlight" },
  { token: "DuckAssistBot", company: "DuckDuckGo", role: "search", powers: "DuckDuckGo AI answers" },
  { token: "Amazonbot", company: "Amazon", role: "search", powers: "Alexa answers" },

  // Model training.
  { token: "GPTBot", company: "OpenAI", role: "training", powers: "OpenAI model training", ua: `${MOZ} GPTBot/1.2; +https://openai.com/gptbot)` },
  { token: "ClaudeBot", company: "Anthropic", role: "training", powers: "Anthropic model training", ua: `${MOZ} ClaudeBot/1.0; +claudebot@anthropic.com)` },
  { token: "Google-Extended", company: "Google", role: "training", powers: "Gemini training (robots.txt only)" },
  { token: "Applebot-Extended", company: "Apple", role: "training", powers: "Apple model training (robots.txt only)" },
  { token: "CCBot", company: "Common Crawl", role: "training", powers: "Open web dataset used by many models" },
  { token: "Meta-ExternalAgent", company: "Meta", role: "training", powers: "Meta model training" },
  { token: "Bytespider", company: "ByteDance", role: "training", powers: "ByteDance model training" },
];

/** A normal browser, the baseline the live test compares each agent with. */
export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** The agents sent in the live access test (one request each). */
export const LIVE_TEST_AGENTS = ["ChatGPT-User", "Claude-User", "PerplexityBot", "OAI-SearchBot", "GPTBot", "ClaudeBot"];
