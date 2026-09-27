import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 120_000, // 2 min — generous for blog generation
});

// Set CLAUDE_MODEL / CLAUDE_FAST_MODEL in the environment to change models
// without a deploy — useful when a new one lands and you want to try it.
//
// The writing model does the work readers see: articles, headlines, analysis.
// The fast model handles the mechanical, high-volume jobs — translations and
// tip extraction — where the cheaper model is the right tool rather than a
// compromise.
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5";
export const CLAUDE_FAST_MODEL = process.env.CLAUDE_FAST_MODEL ?? "claude-haiku-4-5";

// Uses SSE streaming so the connection stays alive during generation.
// messages.create() sits silent while tokens compute → hosting kills it.
// messages.stream() sends tokens as they arrive → no idle timeout.
export async function streamChat(
  messages: Anthropic.Messages.MessageParam[],
  systemPrompt: string,
  maxTokens = 1024
): Promise<string> {
  const text = await anthropic.messages
    .stream({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    })
    .finalText();

  return text;
}

export default anthropic;
