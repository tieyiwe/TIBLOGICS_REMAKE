import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 120_000, // 2 min — generous for blog generation
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

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
