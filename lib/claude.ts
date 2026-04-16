import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export async function streamChat(
  messages: Anthropic.Messages.MessageParam[],
  systemPrompt: string,
  maxTokens = 1024
): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  if (content.type === "text") return content.text;
  return "";
}

export default anthropic;
