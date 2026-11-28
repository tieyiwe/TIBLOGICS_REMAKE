import type { SeedModule } from "../types";

// Building AI Apps and Agents (slug: ai-apps-agents), Modules 1-2.
// Vendor-neutral throughout: examples name several providers, are marked "for
// example", and time-sensitive details are dated "at the time of writing
// (October 2026)". Code snippets are illustrative, not exact SDK signatures.
// Systems thread: an AI feature is a loop inside a larger system (users,
// data, cost, failure), and every module returns to that view.

export const TRACK_AGENTS_MODULES_1_TO_2: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 1
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Calling Models from Code",
    summary:
      "What actually happens when your code calls a language model: messages and roles, system prompts, parameters, tokens and cost, streaming, and the errors, rate limits and retries every production call must handle, with keys kept on the server.",
    lessons: [
      {
        title: "How a model call works: messages, roles and system prompts",
        objective: "Build a correct request to a chat model API, with a system prompt, a message history and the right roles.",
        durationMinutes: 26,
        contentType: "article",
        isPreview: true,
        resources: [
          {
            title: "Anthropic documentation",
            url: "https://docs.anthropic.com",
            resourceType: "article",
            isFree: true,
            notes: "Official entry point for the Claude API. Check here for current request formats, models and prices.",
          },
          {
            title: "OpenAI platform documentation",
            url: "https://platform.openai.com/docs",
            resourceType: "article",
            isFree: true,
            notes: "Official entry point for the OpenAI API. Request shapes and features change; treat it as the source of truth.",
          },
          {
            title: "Claude (free account)",
            url: "https://claude.ai",
            resourceType: "account_signup",
            isFree: true,
            notes: "Useful for drafting and testing prompts by hand before you code them. Free-tier limits and features change. Never paste confidential data, real customers' personal data or API keys.",
          },
          {
            title: "ChatGPT (free account)",
            url: "https://chatgpt.com",
            resourceType: "account_signup",
            isFree: true,
            notes: "A second assistant for comparing how different models handle the same prompt. Free-tier limits and features change. Never paste confidential data, real customers' personal data or API keys.",
          },
        ],
        bodyMd: `## A model call is a stateless function

When you chat with an assistant in a browser, it feels like a conversation with memory. From code, it is something simpler. You send a request containing **everything the model should see**, and you get one response back. The model keeps nothing between calls. If you want it to "remember" the last five turns, your code sends those five turns again, every time.

That one fact explains most of what follows: why long conversations cost more, why the context window matters, and why your code, not the model, owns the conversation.

Every major provider (for example Anthropic's Claude API, OpenAI's API, and the many hosts that serve open-weight models such as Llama, Mistral or Qwen) follows the same broad shape, with small differences in naming. Always check the provider's current docs for exact field names.

## Messages and roles

The core of a request is a list of **messages**, each with a **role** and **content**:

- **user**: what the person (or your code on their behalf) says.
- **assistant**: what the model said earlier. You include past assistant turns so the model can see the conversation so far.
- **system**: standing instructions for the whole conversation. Some APIs take this as a separate top-level field; others accept it as a message with a system (or "developer") role.

An illustrative request, in the general shape most SDKs use:

\`\`\`ts
// Illustrative only: check your provider's current docs for exact names.
const request = {
  model: "MODEL_NAME",
  system: "You are a support assistant for Acme Bikes. Answer in UK English. If unsure, say so.",
  messages: [
    { role: "user", content: "My gears slip on hills." },
    { role: "assistant", content: "Is it the front or rear gears?" },
    { role: "user", content: "Rear, mostly in the smallest cog." },
  ],
  max_tokens: 400,
};
\`\`\`

Messages usually alternate between user and assistant, and the last one is normally from the user. Your code appends the model's reply to the history before the next turn.

## What belongs in the system prompt

The system prompt is where you put things that should hold for every turn: the role, the audience, the tone, the rules, the output format, and what to do when unsure. It is not a security boundary (a determined user can still try to talk the model out of it, as Module 5 covers), but it is the most reliable place for standing instructions.

A weak system prompt:

\`\`\`text
You are a helpful assistant.
\`\`\`

A useful one for the same feature:

\`\`\`try
You are the help assistant inside [an invoicing app for small UK businesses].
Audience: [business owners, not accountants].
Rules:
- Answer only questions about using the app. For tax or legal advice, say you cannot advise and suggest an accountant.
- Keep answers under 120 words, with numbered steps for any task.
- If the question is unclear, ask one clarifying question instead of guessing.
- Never invent a feature. If you are not sure the app can do something, say so.
\`\`\`

Run it in the practice pad, then ask it something off-topic and something it cannot know. Notice how much of the behaviour comes from the rules, not from the model.

## Content is more than text

Content can often be a list of blocks rather than a plain string: text, images, documents, and (as Module 2 covers) tool calls and tool results. Your history-handling code should treat content as structured data and pass it back exactly as received, rather than flattening everything to strings.

## The conversation is your data

Because your code holds the history, you decide:

- **How much to send.** Long histories cost more and can push older turns out of the model's context window (the maximum amount of text, measured in tokens, it can consider at once). Common strategies: keep the last N turns, or summarise older turns into a short note.
- **What to store.** Conversations often contain personal data. Store only what you need, for as long as you need it.
- **What the user can change.** Never let the client send its own system prompt or rewrite past assistant turns. Build the request on the server from data you control.

## Try it now

Write the request object for a feature you might build: a system prompt with at least four rules, and a three-message history ending with a user turn. Run the system prompt and the final user message in the practice pad.

You are done when the request has the right roles in the right order, the system prompt says what to do when the model is unsure, and you can say which parts of it your server builds and which come from the user.`,
        microCheck: [
          {
            question: "A user complains that your chatbot forgot what they said two messages ago. The model is fine. What is the most likely cause?",
            options: [
              "The server is not resending earlier turns in each request",
              "The model's memory was full and it cleared older messages",
              "The system prompt was too long, so the model skipped turns",
              "The temperature was set too high for it to recall details",
            ],
            correctIndex: 0,
            explanation:
              "Model APIs are stateless: the model only sees what is in the current request. If your code does not resend the earlier turns, they are gone. Temperature and system prompt length do not erase history.",
          },
          {
            question: "Where should the rule \"never give tax advice, suggest an accountant instead\" usually go?",
            options: [
              "In each user message, so the model sees it next to the question",
              "In the system prompt, as a standing rule for every turn",
              "In the assistant turns, as if the model had promised it earlier",
              "Nowhere: models refuse tax questions without being told",
            ],
            correctIndex: 1,
            explanation:
              "Standing rules for the whole conversation belong in the system prompt. Putting them in user turns mixes your rules with user input, and faking assistant turns is fragile and confusing.",
          },
          {
            question: "Your front end sends the full request, including the system prompt, to your server, which forwards it to the model. What is the main risk?",
            options: [
              "The request becomes too large for the server to handle well",
              "Any user can edit the system prompt and change the rules",
              "The model will respond more slowly to requests from a server",
              "The provider will reject requests that include a system prompt",
            ],
            correctIndex: 1,
            explanation:
              "Anything the client sends can be changed by the user. The server should build the system prompt and validate the history itself, so users cannot rewrite the rules or fake earlier assistant replies.",
          },
          {
            question: "A long support chat is getting expensive and slow. Which change keeps the useful context while cutting cost?",
            options: [
              "Summarise older turns into a short note and keep recent ones",
              "Drop the system prompt, since the model has seen it already",
              "Send only the latest user message and nothing else at all",
              "Raise max_tokens so the model can answer in fewer turns",
            ],
            correctIndex: 0,
            explanation:
              "Summarising older turns keeps the gist at a fraction of the tokens. The system prompt is not remembered between calls, so it must be resent, and sending only the latest message loses the context entirely.",
          },
        ],
      },
      {
        title: "Parameters, tokens and what a call costs",
        objective: "Estimate the cost of a model call from its token counts and choose sensible parameter values for a feature.",
        durationMinutes: 27,
        contentType: "article",
        bodyMd: `## Tokens: the unit of everything

Models read and write **tokens**, chunks of text that are often a word, part of a word or a punctuation mark. A common rule of thumb for English is about four characters per token, but it varies by model, language and content (code and non-English text often use more tokens per word). Do not guess for billing: every API response reports the tokens used, and most providers offer a way to count tokens before you send.

Tokens matter for three reasons:

1. **Cost.** You pay per token, priced separately for input (what you send) and output (what the model writes).
2. **Limits.** The context window caps input plus output. A maximum output setting caps the reply.
3. **Speed.** Output tokens are generated one after another, so long answers take longer.

## Working out what a call costs

Prices are quoted **per million tokens**, and output usually costs several times more than input. At the time of writing (October 2026) prices vary widely between providers and between a provider's small and large models, and they change often, so always check the current pricing page.

Use illustrative figures to practise the arithmetic: imagine **$3 per million input tokens** and **$15 per million output tokens**.

A call that sends 2,000 input tokens and gets 500 output tokens back costs:

\`\`\`text
input:  2,000 / 1,000,000 x $3  = $0.006
output:   500 / 1,000,000 x $15 = $0.0075
total:                            $0.0135
\`\`\`

Tiny per call. Now multiply by the system: 3,000 users, 10 messages a day each, every message resending a growing history. That is where budgets go. In code, compute cost from the **usage** numbers the API returns, not from the text length:

\`\`\`ts
// Illustrative: field names differ by provider (check the docs).
const PRICES = { inputPerMillion: 3, outputPerMillion: 15 };
function costOf(usage) {
  return (usage.inputTokens / 1e6) * PRICES.inputPerMillion
       + (usage.outputTokens / 1e6) * PRICES.outputPerMillion;
}
\`\`\`

Log this per request, per feature and per user. Module 6 builds on it.

## The parameters that matter

- **model**: the single biggest lever on cost, speed and quality. Providers offer families with smaller, faster, cheaper models and larger, slower, more capable ones (for example Anthropic's Haiku, Sonnet and Opus tiers, or OpenAI's smaller and larger GPT variants at the time of writing). Start with the smallest model that passes your evaluation (Module 5).
- **max tokens**: the cap on output length. Set it deliberately: too low and answers are cut off mid-sentence (the response will say it stopped because of the limit), too high and a runaway answer costs more.
- **temperature** (where supported): how much randomness goes into choosing each token. Lower values give more consistent, predictable output, which suits extraction and classification. Higher values give more varied output, which can suit brainstorming. Some newer reasoning models fix or ignore it; check the docs.
- **stop sequences**: strings that end generation early, useful for simple formats.
- **reasoning or thinking budget** (on models that support it): extra tokens the model spends working through a problem before answering. It can improve hard tasks and always adds cost and time.

## Stop reasons: read them

Every response says why it stopped: it finished naturally, it hit the max tokens limit, it hit a stop sequence, or it wants to call a tool (Module 2). Production code should check this. A reply that stopped at the limit is incomplete, and showing it as if it were finished is a bug.

\`\`\`ts
if (response.stopReason === "max_tokens") {
  // Incomplete: retry with a higher limit, ask for a shorter answer, or flag it.
}
\`\`\`

## Try it now

Take a feature you might build and estimate its monthly cost using the illustrative prices above. Write down: average input tokens per call (system prompt plus history plus the user's message), average output tokens, calls per user per day, and number of users.

\`\`\`try
I am estimating the cost of an AI feature. Check my arithmetic and assumptions, and point out what I have probably underestimated.

Feature: [a help assistant inside our app]
Users: [2,000 active per month], [5] conversations each, [6] turns per conversation
System prompt: [800] tokens. Average user message: [60] tokens. Average reply: [250] tokens.
Each turn resends the whole history.
Illustrative prices: $3 per million input tokens, $15 per million output tokens.
\`\`\`

You are done when you have a monthly figure, you have checked it yourself rather than trusting the AI's arithmetic, and you can name the single input (usually history growth) that drives most of the cost.`,
        microCheck: [
          {
            question: "With illustrative prices of $3 per million input tokens and $15 per million output tokens, what does a call with 1,000 input and 1,000 output tokens cost?",
            options: ["$0.018", "$0.0018", "$0.18", "$0.036"],
            correctIndex: 0,
            explanation:
              "Input: 1,000 / 1,000,000 x $3 = $0.003. Output: 1,000 / 1,000,000 x $15 = $0.015. Together $0.018. Output tokens cost five times more here, so they dominate.",
          },
          {
            question: "A summary feature sometimes shows answers that end mid-sentence. What should the code check first?",
            options: [
              "Whether the stop reason says the max token limit was reached",
              "Whether the temperature is too low for complete sentences",
              "Whether the system prompt forbids answers above one paragraph",
              "Whether the provider is rate limiting the summary requests",
            ],
            correctIndex: 0,
            explanation:
              "Answers that stop mid-sentence usually hit the max tokens cap, and the response's stop reason says so. Code should check the stop reason and handle incomplete answers instead of showing them as finished.",
          },
          {
            question: "You need a model to classify tickets into four fixed categories, the same way every time. Which setting helps most, where it is supported?",
            options: [
              "A high temperature so the model considers more categories",
              "A low temperature so the output is consistent and predictable",
              "A very large max tokens limit so it can explain its reasoning",
              "Removing the system prompt so the model is not over-constrained",
            ],
            correctIndex: 1,
            explanation:
              "For classification you want consistency, so lower temperature helps where the model supports it. A large output limit only adds cost, and removing instructions makes classification less reliable.",
          },
          {
            question: "Why should cost be computed from the usage numbers in each API response rather than from the length of the text?",
            options: [
              "Characters convert to tokens at a fixed rate for every model",
              "Usage numbers are rounded, so they are cheaper to calculate",
              "Token counts vary by model and content, and usage is exact",
              "Text length includes the system prompt, which is never billed",
            ],
            correctIndex: 2,
            explanation:
              "Rules of thumb like four characters per token are rough and vary by model, language and content. The usage the API reports is what you are billed for. System prompts are input tokens and are billed.",
          },
        ],
      },
      {
        title: "Streaming and the user experience",
        objective: "Decide when to stream a model's response and handle streamed output correctly, including errors and cancellation.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Why streaming exists

A model writes its answer token by token. Without streaming, your code waits until the whole answer is finished, then receives it in one piece. For a 400-token answer that can mean several seconds of a blank screen. With **streaming**, the API sends pieces of the answer as they are generated, usually as server-sent events (a simple standard where the server keeps an HTTP response open and pushes small messages down it). The user sees words appear almost at once.

Streaming does not make the model faster. Total time is about the same. It changes the **perceived** wait, which is what users feel. The usual measure is time to first token: how long before anything appears.

## When to stream, and when not to

Stream when a person is watching and the answer is long enough to notice the wait: chat, drafting, explanations.

Do not bother streaming when:

- **No person is waiting**: background jobs, batch processing, nightly summaries.
- **You need the whole output before doing anything**: structured JSON you must validate, a classification that drives the next step, a tool call your code must run. You can still stream for a progress indicator, but your logic acts on the finished, validated result.

A common mistake is to stream JSON straight into the page. Half a JSON object is not valid JSON, and the user sees raw braces. Validate first, then show.

## What a stream looks like to your code

Most SDKs give you an iterator or event callbacks. The events follow a similar pattern across providers: a start event, many small text deltas (pieces of new text), sometimes tool call pieces, and a final event with the stop reason and the token usage. An illustrative loop:

\`\`\`ts
// Illustrative: event names and fields differ by provider. Check the docs.
let text = "";
for await (const event of stream) {
  if (event.type === "text_delta") {
    text += event.text;
    render(text);            // update the UI with the text so far
  }
  if (event.type === "done") {
    logUsage(event.usage);   // usage usually arrives at the end
    checkStopReason(event.stopReason);
  }
}
\`\`\`

Your server usually streams from the provider and forwards the text to the browser over its own connection, so the API key never leaves the server (Lesson 4).

## Streaming in a single page

This playground fakes a stream with a timer, so you can see the effect without any API. Change the delay, then change the code so a **Stop** button cancels the stream.

\`\`\`playground
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: system-ui, sans-serif; padding: 16px; max-width: 520px; }
  #out { border: 1px solid #ccc; border-radius: 8px; padding: 12px; min-height: 80px; white-space: pre-wrap; }
  button { padding: 6px 14px; margin-right: 6px; }
</style>
</head>
<body>
  <button id="go">Ask (streamed)</button>
  <button id="stop">Stop</button>
  <p id="status">Idle</p>
  <div id="out"></div>
  <script>
    // A fake model that yields one word at a time.
    const ANSWER = "Check the rear derailleur cable tension first. Shift to the smallest cog, then turn the barrel adjuster a quarter turn at a time until shifting is clean.";
    let cancelled = false;
    async function* fakeStream() {
      for (const word of ANSWER.split(" ")) {
        await new Promise(r => setTimeout(r, 120)); // try 20 or 400
        yield word + " ";
      }
    }
    document.getElementById("go").onclick = async () => {
      const out = document.getElementById("out");
      const status = document.getElementById("status");
      out.textContent = ""; cancelled = false;
      const started = performance.now();
      let first = true;
      for await (const piece of fakeStream()) {
        if (cancelled) { status.textContent = "Stopped by user"; return; }
        if (first) { status.textContent = "First token after " + Math.round(performance.now() - started) + " ms"; first = false; }
        out.textContent += piece;
      }
      status.textContent += " | finished";
    };
    document.getElementById("stop").onclick = () => { cancelled = true; };
  </script>
</body>
</html>
\`\`\`

## Errors and cancellation mid-stream

Streams can fail halfway: the network drops, the provider returns an overloaded error, or the user closes the tab. Plan for it:

- **Show partial output honestly.** Mark it as incomplete rather than leaving it looking finished.
- **Cancel upstream when the user leaves.** If the browser disconnects, abort the provider request too, or you pay for tokens nobody reads.
- **Log usage even on failure**, where the API reports it, so cost tracking stays accurate.
- **Do not retry blindly mid-stream.** Restarting may duplicate text. Either restart cleanly with a fresh output area, or let the user choose.

## Try it now

In the playground, set the delay to 400 ms and notice how the first-token figure feels compared with waiting for the whole answer. Then make the Stop button also show how many words had been received when it stopped.

You are done when the Stop button cancels the stream, the status shows that it was stopped and how much arrived, and you can explain in one sentence why a server should cancel the upstream request when the user stops.`,
        microCheck: [
          {
            question: "A nightly job summarises 5,000 support tickets and writes the results to a database. Should it stream the model responses?",
            options: [
              "Yes, streaming always makes each model call finish sooner",
              "No, nobody is watching, so streaming adds complexity only",
              "Yes, because summaries are long and need incremental saving",
              "No, because streaming is only available for chat interfaces",
            ],
            correctIndex: 1,
            explanation:
              "Streaming improves perceived speed for a person watching. It does not make the total generation faster. A background job gains nothing and has more code paths to fail.",
          },
          {
            question: "A feature asks the model for JSON and streams it straight into the page. Users sometimes see broken braces. What is the fix?",
            options: [
              "Increase the temperature so the JSON is generated faster",
              "Switch to a larger model that streams in bigger chunks",
              "Collect the full output, validate it, then render the result",
              "Ask the model in the system prompt to stream valid JSON only",
            ],
            correctIndex: 2,
            explanation:
              "Partial JSON is never valid JSON. When your code needs to act on structured output, collect it, validate it and only then show it. A prompt instruction cannot make half an object valid.",
          },
          {
            question: "A user closes the tab while a long answer is streaming. What should the server do?",
            options: [
              "Keep the provider stream running so the answer can be cached",
              "Abort the upstream request so it stops paying for tokens",
              "Retry the request in case it was a network error",
              "Nothing, as the provider stops when the browser disconnects",
            ],
            correctIndex: 1,
            explanation:
              "The provider does not know your user left; your server holds that connection. Aborting the upstream request stops generation and cost for an answer nobody will read.",
          },
          {
            question: "What does streaming improve, and what does it not?",
            options: [
              "It improves total generation time, not the time to first token",
              "It improves token cost, not the model's speed",
              "It improves time to first token, not total generation time",
              "It improves answer accuracy, not the user's perceived waiting",
            ],
            correctIndex: 2,
            explanation:
              "Streaming shows text as it is produced, so the first words appear quickly. The model still takes about as long to finish, and cost and accuracy are unchanged.",
          },
        ],
      },
      {
        title: "Errors, rate limits, retries and keeping keys server-side",
        objective: "Handle API errors with retries and exponential backoff, respect rate limits, and keep API keys out of front-end code.",
        durationMinutes: 28,
        contentType: "article",
        bodyMd: `## Every call can fail

Model APIs are remote services under heavy load. In production, a share of calls will fail, and your feature has to cope. Errors fall into two groups, and the difference decides what your code should do.

**Worth retrying (transient):**

- **429 Too Many Requests**: you hit a rate limit.
- **500, 502, 503** and provider-specific "overloaded" responses: the service is struggling.
- **Timeouts and dropped connections.**

**Not worth retrying (your request is wrong):**

- **400 Bad Request**: malformed request, invalid parameter, input too long for the context window.
- **401 or 403**: missing, invalid or unauthorised key.
- **404**: wrong model name or endpoint.

Retrying a 400 just fails again, faster, and burns your rate limit. Fix the request, log it, and show a clear error.

## Rate limits

Providers cap how much you can use in a period, usually as **requests per minute** and **tokens per minute** (sometimes input and output separately), often rising as your account's usage tier grows. When you exceed a limit you get a 429. Many providers also send headers telling you how much allowance remains and, sometimes, a **Retry-After** header saying how long to wait. If it is there, use it.

Rate limits are a system constraint, not just an error. If one feature can use the whole organisation's allowance, a burst of traffic there starves everything else. Plan per-feature budgets and queues (Module 6).

## Retries with exponential backoff and jitter

The standard pattern: wait, retry, wait twice as long, retry, up to a small maximum.

\`\`\`ts
// Illustrative pattern, not a specific SDK.
const RETRYABLE = new Set([429, 500, 502, 503, 529]);

function backoffMs(attempt) {
  const base = 500 * 2 ** attempt;           // 500, 1000, 2000, 4000...
  const capped = Math.min(base, 8000);        // never wait too long
  return capped / 2 + Math.random() * (capped / 2); // jitter
}

async function callWithRetry(request, maxRetries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await callModel(request);
    } catch (err) {
      if (!RETRYABLE.has(err.status) || attempt >= maxRetries) throw err;
      await new Promise((r) => setTimeout(r, backoffMs(attempt)));
    }
  }
}
\`\`\`

**Jitter** (a random part of the wait) matters more than it looks. If a thousand clients all fail at the same moment and all retry after exactly one second, they hit the service together again. Randomising spreads them out. This is a small example of a systems effect: without jitter, retries form a **reinforcing loop** (overload causes failures, failures cause synchronised retries, retries cause more overload). Backoff and jitter turn it into a **balancing** one.

Many official SDKs include automatic retries with backoff for retryable errors; check what yours does before adding your own on top, or you may retry nine times instead of three.

## Keep keys on the server

An API key is a password that spends your money. Anything in front-end code (JavaScript sent to the browser, a mobile app bundle) can be read by anyone who opens developer tools or unpacks the app. A key there will eventually be found and used.

The correct shape:

\`\`\`text
Browser  --->  Your server route  --->  Model provider
               (holds the key in an environment variable,
                checks who the user is, applies limits,
                builds the system prompt, logs usage)
\`\`\`

Your server route is also where you enforce **per-user** limits, so one user (or one attacker with a script) cannot run up your bill. Other habits: one key per environment and per service, never commit keys to Git, set spending limits and alerts in the provider's console where offered, and rotate a key immediately if it might have leaked.

## Try it now

Open the practice pad and paste in this request, filling in your own context:

\`\`\`try
Review this plan for calling a model API from my web app. List anything that will fail in production, ordered by severity.

- The React front end calls the provider API directly with our key, stored in a .env file that gets bundled.
- If a call fails we retry immediately, up to 10 times, for any error.
- We do not check the stop reason.
- We log the full prompt and response for every call, forever.
- [Add one detail of your own design.]
\`\`\`

Then write your own corrected plan in five lines. You are done when it keeps the key on the server, retries only retryable errors with backoff, caps retries, checks the stop reason and logs usage without storing more personal data than needed.`,
        microCheck: [
          {
            question: "Your code gets a 400 error saying the input exceeds the model's context window. What should it do?",
            options: [
              "Retry with exponential backoff until the error clears",
              "Retry once immediately in case the provider was overloaded",
              "Stop retrying, shorten the input, and log the failure",
              "Switch to streaming, which removes the context limit",
            ],
            correctIndex: 2,
            explanation:
              "A 400 means the request itself is wrong, so retrying the same request will fail every time. Shorten or summarise the input, and log it so you can see how often it happens. Streaming does not change the context window.",
          },
          {
            question: "Why add random jitter to retry delays?",
            options: [
              "So that many clients do not all retry at the same moment",
              "So that the provider can tell which requests are retries",
              "So that each retry uses fewer tokens than the original call",
              "So that the rate limit resets earlier for your account",
            ],
            correctIndex: 0,
            explanation:
              "Without jitter, clients that failed together retry together and overload the service again. Randomising the wait spreads them out, turning a reinforcing loop of failures into a balancing one.",
          },
          {
            question: "A developer says the API key in the front end is safe because the JavaScript is minified. What is the problem?",
            options: [
              "Minified code runs slower, so the API calls will time out",
              "Anyone can still read the key in the browser's network tools",
              "Providers reject requests that come from minified scripts",
              "The key works but the provider charges more for browser calls",
            ],
            correctIndex: 1,
            explanation:
              "Minifying makes code harder to read, not secret. The key appears in the bundle and in every request the browser makes. Keys belong in server environment variables behind your own route.",
          },
          {
            question: "Your SDK already retries 429 errors twice with backoff, and you wrap every call in your own three-retry loop. What happens on a bad day?",
            options: [
              "Retries cancel each other, so no retry happens at all",
              "Each request may be attempted up to twelve times in total",
              "The SDK detects your loop and switches its own retries off",
              "The provider merges the retries into a single billed request",
            ],
            correctIndex: 1,
            explanation:
              "Retries multiply: 4 outer attempts each making up to 3 SDK attempts gives up to 12 calls, which deepens an overload. Know what your SDK does before layering your own retries on top.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A product manager asks why the chatbot's costs grow faster than its number of messages. What is the most likely explanation?",
        options: [
          "Each turn resends the growing history, so input tokens climb",
          "Providers charge more per token once a conversation is long",
          "The system prompt is billed only on the first turn of a chat",
          "Output tokens get cheaper as the conversation goes on longer",
        ],
        correctIndex: 0,
        explanation:
          "Because the API is stateless, every turn resends the whole history, so input tokens per call rise with conversation length. Summarising or trimming older turns is the usual fix.",
      },
      {
        question: "Which belongs in a system prompt rather than in each user message?",
        options: [
          "The customer's latest question about their delivery date",
          "Standing rules on tone, scope and what to do when unsure",
          "The text of the order the customer has just pasted in",
          "A copy of the assistant's previous reply for reference",
        ],
        correctIndex: 1,
        explanation:
          "The system prompt holds instructions that apply to every turn. Per-turn content (the question, pasted text) goes in user messages, and previous replies go in assistant turns.",
      },
      {
        question: "Using illustrative prices of $3 per million input tokens and $15 per million output tokens, roughly what do 10,000 calls of 1,500 input and 300 output tokens cost?",
        options: ["$90", "$9", "$0.90", "$900"],
        correctIndex: 0,
        explanation:
          "Per call: 1,500 x $3 / 1M = $0.0045 plus 300 x $15 / 1M = $0.0045, so $0.009. Times 10,000 calls gives $90. Doing this sum before launch is part of designing the feature.",
      },
      {
        question: "A response comes back with a stop reason saying the output limit was reached. What is the right default handling?",
        options: [
          "Show it as normal, because the model chose where to stop",
          "Treat it as incomplete: raise the limit, shorten, or flag it",
          "Retry the same request with exponential backoff and jitter",
          "Lower the temperature so that the model writes fewer tokens",
        ],
        correctIndex: 1,
        explanation:
          "A reply cut off by the output limit is incomplete. Showing it as finished is a bug. Raise the limit, ask for a shorter answer, or mark it incomplete. Retrying the same request gives the same cut-off.",
      },
      {
        question: "Which error should a retry loop with backoff handle by retrying?",
        options: [
          "401 Unauthorized because the key is wrong",
          "404 Not Found because the model name is misspelt",
          "429 Too Many Requests from a rate limit",
          "400 Bad Request because a parameter is invalid",
        ],
        correctIndex: 2,
        explanation:
          "A 429 is transient: waiting and retrying can succeed. The other errors mean the request or key is wrong, so retrying wastes time and allowance.",
      },
      {
        question: "Your team is building a writing assistant where users watch the draft appear. A colleague proposes not streaming to keep the code simple. What is the main trade-off?",
        options: [
          "Without streaming, users see nothing until the whole answer is done",
          "Without streaming, each answer costs more because it is buffered",
          "Without streaming, the model cannot use a system prompt",
          "Without streaming, the provider limits answers to a short length",
        ],
        correctIndex: 0,
        explanation:
          "Streaming changes perceived wait: users see the first words quickly. It does not change cost, system prompts or length limits. For a writing assistant someone is watching, it is usually worth the extra code.",
      },
      {
        question: "Where should your code check who the user is and apply per-user usage limits for an AI feature?",
        options: [
          "In the browser, before the request is sent to the provider",
          "In the system prompt, by telling the model each user's limit",
          "In your server route, before it calls the model provider",
          "In the provider's console, which knows each of your users",
        ],
        correctIndex: 2,
        explanation:
          "Only your server can be trusted to identify users and enforce limits. The browser can be bypassed, the model cannot enforce billing, and the provider sees your key, not your individual users.",
      },
      {
        question: "During an outage, hundreds of clients retry failed calls after exactly one second, and the service stays down. Which systems description fits best?",
        options: [
          "A balancing loop that will settle once clients give up",
          "A reinforcing loop where synchronised retries add load",
          "A delay caused by the provider's slow status page update",
          "A bottleneck that only more retries per client can clear",
        ],
        correctIndex: 1,
        explanation:
          "Failures cause synchronised retries, which add load and cause more failures: a reinforcing loop. Exponential backoff with jitter breaks the synchronisation and caps the extra load.",
      },
      {
        question: "Why prefer the smallest model that passes your evaluation for a feature?",
        options: [
          "Smaller models are always more accurate on simple tasks",
          "It keeps cost and latency down without failing your checks",
          "Larger models do not support system prompts or tools",
          "Providers rate limit small models less than large ones",
        ],
        correctIndex: 1,
        explanation:
          "Model choice is the biggest lever on cost and speed. If a smaller model meets your quality bar on your own eval set, you get the same outcome for less. Smaller is not always more accurate.",
      },
      {
        question: "A teammate finds an old API key committed to the repository six months ago. It was deleted in a later commit. What should happen?",
        options: [
          "Nothing, since the key is no longer in the latest version",
          "Rewrite the history but keep using the same key afterwards",
          "Rotate the key now and check usage logs for misuse",
          "Add the file to .gitignore so the key stays hidden",
        ],
        correctIndex: 2,
        explanation:
          "A key that was ever committed is in the Git history and should be treated as leaked. Rotate it, check for misuse, and set spending alerts. Deleting or ignoring the file does not remove it from history.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 2
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Structured Outputs and Tools",
    summary:
      "Get output your code can trust: JSON with validation and repair, tool (function) calling, the agent loop that runs tools until the job is done, and how to design tools and connect them through the Model Context Protocol (MCP), and how to handle images, documents and audio as inputs.",
    lessons: [
      {
        title: "Structured outputs: JSON you can trust after you validate it",
        objective: "Request structured JSON from a model, validate it against a schema, and repair or reject output that fails.",
        durationMinutes: 27,
        contentType: "article",
        bodyMd: `## Why structure matters

When a person reads model output, a slightly odd phrasing does no harm. When **code** reads it, everything must be exact. If your app expects \`{"category": "billing"}\` and gets \`Sure! Here is the category: billing\`, the next step breaks. Structured output is the bridge between a language model and the rest of your software.

There are three common ways to get it, from weakest to strongest:

1. **Ask in the prompt.** "Reply with JSON only, matching this shape." Works most of the time, fails occasionally (extra prose, code fences, a trailing comma).
2. **JSON mode.** Some APIs can guarantee syntactically valid JSON, but not that it matches your fields.
3. **Schema-constrained output.** Several providers (for example OpenAI and Anthropic at the time of writing) can constrain output to a JSON Schema you supply, either directly or through a tool definition. This is the most reliable option where available.

Whichever you use, **validate anyway**. Constrained output can still contain values that are valid JSON but wrong for your business: a priority of 3 when the customer said "urgent", a summary that is empty, a date in the past.

## Design the schema first

Write the schema as if it were an API contract, because it is one:

\`\`\`json
{
  "type": "object",
  "properties": {
    "category": { "type": "string", "enum": ["billing", "bug", "account", "other"] },
    "priority": { "type": "integer", "minimum": 1, "maximum": 3 },
    "summary":  { "type": "string", "maxLength": 140 },
    "needsHuman": { "type": "boolean" }
  },
  "required": ["category", "priority", "summary", "needsHuman"],
  "additionalProperties": false
}
\`\`\`

Good schemas use **enums** instead of free text where the set is known, include an "other" option so the model is not forced into a wrong category, set limits, and make every field required (use null or an explicit value for "unknown" rather than leaving fields out).

## Parse, validate, then act

A robust pipeline has four steps:

\`\`\`ts
// Illustrative.
const raw = response.text;
const obj = parseJsonLoosely(raw);    // strip code fences, take the {...} part, JSON.parse
const errors = validate(obj, schema); // a schema validator library, or hand-written checks
if (errors.length === 0) return obj;
// otherwise: repair once, then fall back
\`\`\`

In TypeScript projects, libraries such as Zod are common for this, and JSON Schema validators exist for most languages. In Python, Pydantic plays the same role.

## Repair once, then fall back

When validation fails, a single **repair attempt** often fixes it: send the model its own output plus the exact validation errors and ask for corrected JSON only.

\`\`\`try
Your previous reply did not match the required format.
Errors:
- "category" must be one of: billing, bug, account, other (got "payments")
- "priority" must be an integer from 1 to 3 (got "high")

Reply with corrected JSON only, no other text.
Previous reply: [PASTE THE INVALID JSON HERE]
\`\`\`

If the repaired output still fails, **do not loop forever**. Fall back to a safe default (for example category "other", needsHuman true) and log the failure. A bounded repair loop is a small balancing loop with a stop condition; an unbounded one is a cost leak.

## Validation is also a security control

Structured output often drives actions: which queue a ticket goes to, which record is updated, what amount is refunded. Treat it like any untrusted input to your system. Check enums, ranges and lengths; check that referenced IDs exist and belong to the current user; and never pass model output straight into SQL, shell commands or HTML. Module 5 returns to this.

## Try it now

Pick a piece of text your work produces every week (a support email, a meeting note, an invoice description). Write a JSON Schema for what you want extracted, with at least one enum and one required boolean. Then run:

\`\`\`try
Extract the following fields from the text below. Reply with JSON only, matching this schema exactly:
[PASTE YOUR SCHEMA]

Text:
[PASTE A SAMPLE, WITH PERSONAL DETAILS REMOVED]
\`\`\`

Check the result field by field against your schema yourself. You are done when you have found at least one way the output could be valid JSON but still wrong for your purpose, and written the validation rule that would catch it.`,
        microCheck: [
          {
            question: "Your provider supports schema-constrained JSON output. Do you still need to validate the result in code?",
            options: [
              "No, schema constraints guarantee that the values are correct",
              "Yes, the values can match the schema and still be wrong",
              "No, but you should lower the temperature to be extra safe",
              "Yes, but only the first time you use a new schema version",
            ],
            correctIndex: 1,
            explanation:
              "Constrained output guarantees shape, not truth. A valid priority can still be the wrong priority, and an ID can be well formed but belong to another user. Business and security checks stay in your code.",
          },
          {
            question: "Why include an \"other\" option in a category enum?",
            options: [
              "So the model is not forced to pick a wrong category",
              "So the schema validator can skip checking the field",
              "So the model writes shorter and cheaper JSON output",
              "So the output can contain any free text it chooses",
            ],
            correctIndex: 0,
            explanation:
              "Without an escape hatch, an input that fits no category gets forced into one, silently. \"Other\" keeps the enum strict while letting the model be honest, and you can route \"other\" to a person.",
          },
          {
            question: "A repair attempt still returns invalid JSON. What should the code do next?",
            options: [
              "Keep asking the model for repairs until the JSON finally validates",
              "Use the invalid output anyway, since it is close enough",
              "Fall back to a safe default, flag it, and log the failure",
              "Switch the temperature to its maximum and try once more",
            ],
            correctIndex: 2,
            explanation:
              "Repair loops need a stop condition. After one or two attempts, fall back to something safe (such as routing to a person) and log it so you can improve the prompt or schema. Unbounded retries are a cost leak.",
          },
          {
            question: "A model returns a valid JSON refund decision with an orderId. What check matters most before acting on it?",
            options: [
              "That the JSON keys are listed in alphabetical order",
              "That the order exists and belongs to the current customer",
              "That the model used a low temperature for the decision",
              "That the response arrived well within the streaming timeout window",
            ],
            correctIndex: 1,
            explanation:
              "Model output is untrusted input. A well-formed orderId might point at someone else's order, through a mistake or a prompt injection. Check ownership and limits before any action.",
          },
        ],
      },
      {
        title: "Tool calling: letting the model ask your code to act",
        objective: "Define tools for a model, handle its tool calls in code, and return results in the format the API expects.",
        durationMinutes: 28,
        contentType: "article",
        bodyMd: `## What tool calling is

A model on its own can only produce text. **Tool calling** (also called function calling) lets it ask your code to do something: look up an order, search documents, check a calendar, run a calculation. The model never runs anything itself. It produces a structured request ("call \`lookup_order\` with \`order_id: A123\`"), your code decides whether and how to run it, and you send the result back.

This is the most important idea in the track. Everything from simple assistants to complex agents is built on it.

## The three parts

**1. Tool definitions** you send with the request: a name, a description and a JSON Schema for the inputs.

\`\`\`ts
// Illustrative shape. Providers differ slightly in field names (check the docs).
const tools = [
  {
    name: "lookup_order",
    description: "Look up one order by its ID. Returns status, items and carrier. Use when the customer gives an order ID or asks about an order's status.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string", description: "Order ID such as A123" } },
      required: ["order_id"],
    },
  },
];
\`\`\`

**2. A tool call** in the model's response. Instead of (or as well as) text, the response contains one or more calls, each with an ID, the tool name and the input. The stop reason says the model wants a tool used.

**3. A tool result** you send back in the next request: the matching call ID and the output (usually as text or JSON), plus a flag if it was an error.

## One round trip

\`\`\`text
You -> model:   messages [user: "Where is order A123?"] + tools
Model -> you:   tool call {id: "call_1", name: "lookup_order", input: {order_id: "A123"}}
You:            run lookupOrder("A123") -> {status: "shipped", carrier: "ParcelCo"}
You -> model:   messages [user..., assistant tool call..., tool result for call_1] + tools
Model -> you:   text "Your order A123 has shipped with ParcelCo."
\`\`\`

Note what goes back in the second request: the original user message, the assistant's tool call exactly as received, and the result linked by ID. Leaving out the tool call, or mismatching IDs, is the most common bug, and most APIs reject it.

## Your code is in charge

The model chooses **which** tool and **what** input. Your code decides **whether it happens**. Before running any tool call:

- **Check the tool exists** in your registry. Models can occasionally name a tool you did not offer.
- **Validate the input** against the schema, exactly as in Lesson 1.
- **Check permissions**: is this user allowed to see this order? The model has no idea who is logged in unless you tell it, and it must not be the one enforcing access.
- **Catch errors** and return them as a tool result with an error flag ("Order not found"), so the model can recover or explain, rather than crashing the request.

## Read-only tools versus tools that act

Divide your tools into two kinds:

- **Read tools** (look up, search, calculate) are low risk if access control is right.
- **Write or action tools** (send email, issue refund, delete record, post publicly) change the world. They need tighter limits and often a human approval step (Module 4).

Start with read tools only. Add actions one at a time, each with its own safeguards.

## Controlling tool choice

Most APIs let you say whether the model **may** call tools (auto), **must** call a tool, or must call a **specific** tool. Forcing a specific tool is a neat way to get structured output: define a tool whose input schema is the JSON you want, force the model to call it, and read the input. Some models can also request several tool calls in one turn (parallel tool calls); your code then runs each and returns all results together.

## Try it now

Design two tools for a feature you might build: one read tool and one action tool. For each, write the name, a description of two or three sentences (what it does, when to use it, what it returns), and the input schema. Then test the descriptions:

\`\`\`try
Here are the tools available to an assistant:
[PASTE YOUR TWO TOOL DEFINITIONS]

For each of these user messages, say which tool (if any) you would call and with what input, or what you would ask first:
1. [A clear request]
2. [An ambiguous request]
3. [A request no tool can handle]
\`\`\`

You are done when the model's choices match what you intended for all three messages, or you have rewritten a description to fix a wrong choice.`,
        microCheck: [
          {
            question: "In tool calling, who actually runs the tool?",
            options: [
              "The model provider runs it on its own servers automatically",
              "Your code runs it, after deciding whether it should run",
              "The model runs it inside its context window as it writes",
              "The user's browser runs it once the model has replied",
            ],
            correctIndex: 1,
            explanation:
              "The model only produces a structured request. Your code chooses whether to run it, runs it, and sends back the result. That is what lets you validate inputs and enforce permissions.",
          },
          {
            question: "Your second request returns an error saying a tool result has no matching tool call. What did your code most likely do wrong?",
            options: [
              "It sent the tool result without the assistant's tool call",
              "It used a temperature that was too high for tool calling",
              "It defined the tool's input schema with too many fields",
              "It streamed the first response instead of waiting for it",
            ],
            correctIndex: 0,
            explanation:
              "The next request must include the assistant turn containing the tool call, then the result linked by the same ID. Dropping the call or mismatching IDs is the classic tool-calling bug.",
          },
          {
            question: "A model calls lookup_order for an order belonging to a different customer. Where should this be stopped?",
            options: [
              "In the system prompt, by telling the model to be careful",
              "In the tool description, by asking for the correct order",
              "In your code, by checking the order belongs to the user",
              "In the model, which can see who is currently logged in",
            ],
            correctIndex: 2,
            explanation:
              "Access control must live in code that knows the logged-in user. Prompts and descriptions guide the model but cannot enforce anything, and the model does not know who the user is unless you say so.",
          },
          {
            question: "A tool throws \"Order not found\". What is usually the best response?",
            options: [
              "Crash the request so the error is visible in your logs",
              "Return the error as a tool result so the model can respond",
              "Silently drop the tool call and ask the model to continue",
              "Retry the tool call with exponential backoff until it works",
            ],
            correctIndex: 1,
            explanation:
              "Returning the error as a tool result (flagged as an error) lets the model ask for a corrected ID or explain the problem. Log it too. Retrying a not-found lookup will not change the answer.",
          },
        ],
      },
      {
        title: "The agent loop: call, act, return, stop",
        objective: "Implement an agent loop that runs tool calls until the task is done, with explicit stop conditions and a step budget.",
        durationMinutes: 29,
        contentType: "article",
        bodyMd: `## From one tool call to a loop

Lesson 2 showed one round trip. Real tasks often need several: look up the order, then check the carrier's estimate, then answer. The model decides the next step after seeing each result. Wrap the round trip in a loop and you have the core of an **agent**:

\`\`\`text
while not done:
  1. Call the model with the messages and the tools
  2. If it returned text with no tool calls: done, return the answer
  3. Otherwise, for each tool call: check it, run it, collect the result
  4. Append the model's turn and the results to the messages
  5. Check the budget (steps, time, tokens, money) and stop if exceeded
\`\`\`

That is it. Most agent frameworks are, at heart, this loop with conveniences added. Understanding the loop yourself means you can debug any framework and decide when you do not need one.

## Stop conditions are the design

An agent is a **feedback loop**: the model's action changes the state, the result feeds back, and the model acts again. Systems thinking warns that a loop without a balancing force runs away. The balancing forces here are your stop conditions:

- **Done**: the model returns a final answer with no tool calls.
- **Step budget**: a maximum number of model calls (for example 8). Without it, a confused model can call the same tool forever.
- **Time budget**: a wall-clock timeout for the whole task.
- **Cost budget**: a maximum token spend, computed from usage after each call.
- **Repetition**: the same tool with the same input twice in a row usually means it is stuck.
- **Approval needed**: an action tool that needs a person to say yes (Module 4).

When a budget stops the loop, return an honest status ("stopped after 8 steps without finishing") and log the full trace. Never present a budget stop as a success.

## A compact loop

\`\`\`ts
// Illustrative. callModel and the message shapes depend on your provider.
async function runAgent(userText, { maxSteps = 8 } = {}) {
  const messages = [{ role: "user", content: userText }];
  for (let step = 1; step <= maxSteps; step++) {
    const res = await callModel(messages, TOOLS);
    if (!res.toolCalls?.length) {
      return { answer: res.text, steps: step, stopReason: "done" };
    }
    messages.push({ role: "assistant", toolCalls: res.toolCalls });
    for (const call of res.toolCalls) {
      messages.push(await runToolSafely(call)); // validates, runs, catches errors
    }
  }
  return { answer: null, steps: maxSteps, stopReason: "max_steps" };
}
\`\`\`

\`runToolSafely\` is where Lesson 2's rules live: unknown tool, invalid input and thrown errors all become tool results flagged as errors, never crashes.

## Watching a loop run

This playground runs a scripted fake model through the loop, so you can see each step. Change \`MAX_STEPS\` to 2 and run it again.

\`\`\`playground
<!doctype html>
<html>
<head><meta charset="utf-8">
<style>body{font-family:system-ui,sans-serif;padding:16px;max-width:560px}li{margin:4px 0}code{background:#f2f2f2;padding:1px 4px}</style>
</head>
<body>
  <button id="run">Run agent</button>
  <ol id="trace"></ol>
  <p id="result"></p>
  <script>
    const MAX_STEPS = 6; // try 2
    const TOOLS = {
      lookup_order: (i) => ({ status: "shipped", carrier: "ParcelCo" }),
      carrier_eta: (i) => ({ eta: "Thursday" }),
    };
    // Scripted fake model: decides from how many tool results it has seen.
    function fakeModel(messages) {
      const results = messages.filter(m => m.role === "tool").length;
      if (results === 0) return { toolCalls: [{ id: "c1", name: "lookup_order", input: { order_id: "A123" } }] };
      if (results === 1) return { toolCalls: [{ id: "c2", name: "carrier_eta", input: { carrier: "ParcelCo" } }] };
      return { text: "Order A123 shipped with ParcelCo and should arrive Thursday." };
    }
    function log(t) { const li = document.createElement("li"); li.textContent = t; document.getElementById("trace").appendChild(li); }
    document.getElementById("run").onclick = () => {
      document.getElementById("trace").innerHTML = "";
      const messages = [{ role: "user", content: "Where is my order A123?" }];
      for (let step = 1; step <= MAX_STEPS; step++) {
        const res = fakeModel(messages);
        if (!res.toolCalls) { log("Step " + step + ": final answer"); document.getElementById("result").textContent = res.text; return; }
        messages.push({ role: "assistant", toolCalls: res.toolCalls });
        for (const c of res.toolCalls) {
          const out = TOOLS[c.name](c.input);
          log("Step " + step + ": " + c.name + " -> " + JSON.stringify(out));
          messages.push({ role: "tool", toolCallId: c.id, content: JSON.stringify(out) });
        }
      }
      document.getElementById("result").textContent = "Stopped: step budget reached without an answer.";
    };
  </script>
</body>
</html>
\`\`\`

## Do you need a framework?

Agent frameworks and provider agent SDKs can save time on tracing, retries, memory and multi-step orchestration. They also hide the loop, which makes failures harder to understand. A sound path: build the loop yourself once (Lab 2 does exactly that), then adopt a framework when you know which of its features you need and can read what it is doing.

## Try it now

Use the loop-mapper to draw this agent as a system: the model, the tools, the message history, and the balancing loops your stop conditions create.

\`\`\`studio
loop-mapper
\`\`\`

Then write the stop conditions for an agent you might build, as a list with a number for each budget. You are done when every budget has a concrete limit, you have said what the user sees when each one triggers, and none of them reports a budget stop as success.`,
        microCheck: [
          {
            question: "An agent keeps calling the same search tool with the same query and never answers. Which safeguard would have stopped it soonest?",
            options: [
              "A higher max tokens limit for each model response",
              "A repetition check plus a maximum number of steps",
              "A longer system prompt describing the search tool",
              "Streaming the responses so the user can see progress",
            ],
            correctIndex: 1,
            explanation:
              "Detecting a repeated identical call, backed by a hard step budget, is the balancing force the loop needs. More tokens or a longer prompt may help the model but cannot guarantee it stops.",
          },
          {
            question: "In the agent loop, when is the task normally done?",
            options: [
              "When the model returns a response with no tool calls",
              "When every available tool has been called at least once",
              "When the message history reaches the context window limit",
              "When the first tool call returns a successful result",
            ],
            correctIndex: 0,
            explanation:
              "The usual done signal is a final answer with no further tool calls. Calling every tool or hitting the context limit are not success conditions; the second is a failure to handle.",
          },
          {
            question: "Your agent hits its step budget before finishing. What should it return?",
            options: [
              "The model's last partial text, presented as the answer",
              "A clear status that it stopped early, with the trace logged",
              "Nothing, and quietly retry the whole task with a doubled budget",
              "A generic success message so the user is not alarmed",
            ],
            correctIndex: 1,
            explanation:
              "A budget stop is not success. Say honestly that it stopped and why, and log the full trace so you can see what went wrong. Silent retries with bigger budgets hide the problem and multiply cost.",
          },
          {
            question: "Why is an agent best described as a feedback loop?",
            options: [
              "Because each tool result feeds back into the next decision",
              "Because users give feedback after every single response",
              "Because the model retrains its own weights after each step it takes",
              "Because the provider sends usage data back to your server",
            ],
            correctIndex: 0,
            explanation:
              "The model acts, the result changes what it knows, and that shapes its next action. Like any loop, it needs balancing forces (stop conditions and budgets) or it can run away.",
          },
        ],
      },
      {
        title: "Designing tools a model can use well, and connecting them with MCP",
        objective: "Write tool names, descriptions and schemas a model uses correctly, and explain how the Model Context Protocol connects tools and data to AI applications.",
        durationMinutes: 26,
        contentType: "article",
        resources: [
          {
            title: "Model Context Protocol",
            url: "https://modelcontextprotocol.io",
            resourceType: "article",
            isFree: true,
            notes: "Official site for the MCP specification, SDKs and documentation.",
          },
        ],
        bodyMd: `## A tool description is a prompt

The model chooses tools by reading their names, descriptions and schemas. That text is part of the prompt, and it deserves the same care. Most "the agent picked the wrong tool" bugs are really "the description did not say when to use it".

Compare:

\`\`\`text
name: eta
description: gets eta
\`\`\`

\`\`\`text
name: get_shipping_eta
description: Get the estimated delivery date for a shipped parcel from the carrier.
  Use only after lookup_order has returned a carrier and tracking number.
  Returns an ISO date, or an error if the parcel is not yet with the carrier.
input: carrier (one of: ParcelCo, QuickShip), tracking_number (string)
\`\`\`

The second says what it does, **when** to use it (and when not), what it needs, and what comes back.

## Principles for good tools

- **Clear, specific names**: verb plus object (\`search_policies\`, \`create_draft_reply\`). Avoid two tools with overlapping jobs; the model will pick between them at random.
- **Descriptions that answer when and why**, not just what. Mention prerequisites and limits.
- **Tight schemas**: enums for known values, descriptions on each field, required fields marked, sensible formats. The schema is both guidance for the model and the contract your validator enforces.
- **Return what the model needs, not everything**: a lookup that returns 200 fields wastes tokens and can bury the useful one. Return a compact, labelled result.
- **Helpful errors**: "No order with ID A12. IDs look like A123 (letter plus three digits)" lets the model correct itself.
- **Few tools, well chosen**: a long menu of similar tools makes choices worse. Group related operations or split them across focused agents.
- **Least privilege**: a tool should only be able to do what the feature needs. A "run any SQL" tool is almost never the right answer; "get_invoices_for_customer" is.

## MCP: a standard way to connect tools and data

Every AI application used to wire up its own integrations: one custom connector for the file system, another for a ticketing system, another for a database. The **Model Context Protocol (MCP)** is an open standard, introduced by Anthropic in late 2024 and since adopted by many AI applications and tool vendors, that gives these connections a common shape.

The roles, in general terms:

- An **MCP server** exposes capabilities: **tools** (actions the model can call), **resources** (data the application can read, such as files or records) and **prompts** (reusable templates).
- An **MCP client** lives inside an AI application (the **host**, such as a desktop assistant, an IDE or your own app) and connects to servers.
- They talk using JSON-RPC messages, either locally (the server runs as a process on the same machine) or remotely over HTTP. Check the specification for the current transport details.

The benefit is reuse: build an MCP server for your internal system once, and any MCP-capable host can use it. For your own app, you can either call tools directly (as in Lesson 2) or act as an MCP client to existing servers.

## MCP does not remove your responsibilities

A standard connection is still a connection to your data and your actions. The same rules apply:

- **Trust**: only connect servers from sources you trust, and review what tools they expose. A malicious or careless server can describe its tools misleadingly or return content containing instructions (prompt injection, Module 5).
- **Permissions**: run servers with the narrowest credentials possible, and prefer read-only access until an action is clearly needed.
- **Approval**: hosts typically let users approve tool calls; keep that on for anything that changes data or sends messages.
- **Logging**: record which server and tool were called, by whom, with what result.

## Try it now

Rewrite a weak tool definition into a strong one. Use one from your own work, or this one:

\`\`\`text
name: db
description: database access
input: query (string)
\`\`\`

\`\`\`try
Review this tool definition for an AI assistant in [a small accountancy firm's client portal]. Point out what will make a model misuse it, then propose two or three narrower tools with names, descriptions saying when to use each, and input schemas with enums where possible.

[PASTE THE TOOL DEFINITION]
\`\`\`

You are done when you have replaced a broad tool with narrower ones, each description says when to use it and what it returns, and none of them can do more than the feature needs.`,
        microCheck: [
          {
            question: "An agent often calls search_docs when it should call search_tickets. What is the first thing to fix?",
            options: [
              "The tool descriptions, so each says when to use it",
              "The model's temperature, so it chooses more carefully",
              "The step budget, so wrong choices cost less overall",
              "The tool names, so they are shorter and easier to type",
            ],
            correctIndex: 0,
            explanation:
              "The model picks tools from their descriptions. If two overlap, say clearly when each applies. Temperature and budgets do not fix a model that has been given ambiguous options.",
          },
          {
            question: "Which tool design best follows least privilege for an assistant that shows customers their invoices?",
            options: [
              "run_sql(query) with read access to the whole database",
              "get_invoices(customer_id) checked against the session",
              "read_file(path) with access to the invoices folder",
              "http_get(url) so the model can fetch invoice pages",
            ],
            correctIndex: 1,
            explanation:
              "A narrow tool that can only fetch the logged-in customer's invoices limits the damage of any mistake or injection. General SQL, file or HTTP tools let the model reach far more than the feature needs.",
          },
          {
            question: "What does an MCP server expose to an AI application?",
            options: [
              "Model weights that the host downloads and runs locally",
              "Tools, resources and prompts through a standard protocol",
              "A hosted chat interface that replaces the application",
              "Training data that the model uses to improve itself over time",
            ],
            correctIndex: 1,
            explanation:
              "MCP servers expose capabilities (tools to call, resources to read, prompt templates) in a standard way, so any MCP-capable host can use them. They do not provide models or training data.",
          },
          {
            question: "A colleague wants to connect an MCP server found on a forum to the company assistant, because \"MCP is a standard, so it is safe\". What is the flaw?",
            options: [
              "MCP servers cannot be used by company assistants at all",
              "A standard protocol says nothing about the server's trust",
              "MCP only works with one provider's models, not with any others",
              "Forum servers are fine but must be run over HTTP only",
            ],
            correctIndex: 1,
            explanation:
              "MCP standardises how things connect, not whether a server is trustworthy. An unknown server could expose harmful tools or return injected instructions. Review it, restrict its credentials and keep approvals on.",
          },
        ],
      },
      // Added after the original four so seed matching by position is stable.
      {
        title: "Images, documents and audio: multimodal inputs and extraction",
        objective: "Send images and documents to a model from code, build a document extraction pipeline with validation and human review, handle audio through transcription, and treat every non-text input as untrusted.",
        durationMinutes: 27,
        contentType: "article",
        bodyMd: `## Models that read more than text

Earlier lessons treated message content as text. In practice, content can be a list of blocks, and some of those blocks can be images or documents. At the time of writing (October 2026), the major providers accept images and PDF documents in requests to many of their models, while audio input support varies by provider and model. Check the current documentation for supported formats, size limits and how each input is priced, because these change.

Multimodal input opens up a large class of features: triaging screenshots of error messages, reading photos of damaged goods, pulling fields out of invoices, answering questions about a chart. It also brings new failure modes and new attack routes.

## Images

You usually send an image as a content block, either as base64-encoded data or as a URL the provider fetches. Images are converted to tokens, so a large image costs more and adds latency. Resize to the smallest size that keeps the detail you need.

Models are good at describing scenes, reading clear text and interpreting simple charts. They are weaker at precise counting, exact positions and measurements, and small or blurred text. If your feature depends on one of those, test it specifically, and consider a dedicated vision service (for example an object detection or OCR service) for that step. Never build a feature that identifies people from their faces without legal advice; it is one of the most restricted uses of AI.

## Documents: an extraction pipeline

For PDFs you have two routes. You can send the document directly, where supported, so the model sees both the text and the page images. Or you can extract the text first with a parser or OCR service and send only text, which is cheaper and easier to debug but loses layout. Tables and forms often need the first route or a layout-aware extraction service.

A dependable extraction feature is a pipeline, not a single call:

1. **Ingest**: check file type and size, scan uploads, strip metadata you do not need.
2. **Extract**: send the document with a schema for the fields you want (Lesson 1 of this module).
3. **Validate**: check types and business rules, not just JSON shape.
4. **Route**: send failures and low-confidence fields to a person.
5. **Store**: keep each value with the page it came from, so reviewers can check it quickly.

\`\`\`js
function checkInvoice(inv) {
  const problems = [];
  const lines = inv.lines.reduce((sum, l) => sum + l.amount, 0);
  if (Math.abs(lines + inv.tax - inv.total) > 0.01) problems.push("totals do not add up");
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(inv.date)) problems.push("date not in YYYY-MM-DD form");
  if (new Date(inv.date) > new Date()) problems.push("invoice date is in the future");
  return problems; // empty means it can go straight through; otherwise route to a person
}
\`\`\`

Arithmetic checks like this catch a surprising share of misreads, because a misread digit rarely leaves the totals consistent.

## Audio

Where a model does not take audio directly, or you need a record of what was said, transcribe first with a speech to text model and pass the text. Keep timestamps and, where available, speaker labels, so answers can point back to the moment in the recording. Recording people has its own legal rules: make sure callers and staff are told, and that you have a basis for keeping the audio.

## Non-text inputs are untrusted input

Everything from Module 5 on prompt injection applies here, with extra hiding places. A PDF can contain white text on a white background telling the model to ignore its instructions. An image can contain written instructions. A document's metadata can carry a payload. So:

- Treat extracted content as data, never as instructions, and keep it clearly marked in the prompt.
- Keep tool permissions narrow for any flow that reads uploaded files.
- Strip image metadata such as location before storing or sending it on.
- Set size and page limits, and decide how long you keep uploads.

## Try it now

\`\`\`try
I am building a feature that extracts [FIELDS, e.g. supplier, date, line items, tax, total] from [DOCUMENT TYPE] uploaded by [WHO]. Propose a JSON Schema for the fields, three business-rule checks my code should run after extraction, a rule for when a person must review the result, and two ways an attacker could hide instructions in the uploaded file, with a defence for each.
\`\`\`

Run the prompt for a document type from your own work. Then write the validation function for your schema in the language you use, and test it on one correct and one deliberately wrong example.

You are done when you have a schema, a validation function that rejects the wrong example, a review rule, and two injection defences written down.`,
        microCheck: [
          {
            question: "An extraction feature misreads the total on some invoices. Which code check catches many of these misreads cheaply?",
            options: [
              "Checking that line amounts plus tax equal the total",
              "Checking that the JSON parses without any errors",
              "Checking that the PDF file name ends in .pdf",
              "Checking that the model replied within two seconds",
            ],
            correctIndex: 0,
            explanation:
              "A misread digit rarely keeps the totals consistent, so an arithmetic check catches many errors. Valid JSON, file names and response time say nothing about whether values are right.",
          },
          {
            question: "Why can sending a large, high-resolution photo to a model be a poor default?",
            options: [
              "Images become tokens, so size adds cost and latency",
              "Models refuse any image over a few hundred pixels",
              "Large images are always stored publicly by providers",
              "High resolution turns off the model's text reading",
            ],
            correctIndex: 0,
            explanation:
              "Images are converted to tokens, so larger ones cost more and slow responses. Resize to the smallest size that keeps the detail the task needs.",
          },
          {
            question: "An uploaded PDF contains hidden white text telling the assistant to email its contents elsewhere. What is the main defence?",
            options: [
              "Treat file content as data and keep tool permissions narrow",
              "Convert every PDF to an image before sending it to the model",
              "Ask users to promise their files contain no instructions",
              "Use a larger model that notices hidden text more often",
            ],
            correctIndex: 0,
            explanation:
              "Hidden text is prompt injection by another route. Marking file content as data and limiting what tools can do bounds the damage even if the model is fooled.",
          },
          {
            question: "A team needs exact counts of items in warehouse photos and finds a general model miscounts. What is a sensible next step?",
            options: [
              "Test a dedicated object detection service for that step",
              "Raise the temperature so the model counts more carefully",
              "Ask the model to double its count to be on the safe side",
              "Send the photos as audio so a different model reads them",
            ],
            correctIndex: 0,
            explanation:
              "Precise counting is a known weakness of general multimodal models. A dedicated detection service, tested on your own photos, may handle that step better.",
          },
          {
            question: "Why keep timestamps when transcribing calls for a question-answering feature?",
            options: [
              "Answers can point back to the moment in the recording",
              "Timestamps make the transcription model far cheaper",
              "Providers reject transcripts that have no timestamps",
              "Timestamps remove the need to tell callers about it",
            ],
            correctIndex: 0,
            explanation:
              "Timestamps let reviewers check an answer against the exact part of the call. They do not change cost or replace telling people they are being recorded.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A model reliably returns valid JSON, but sometimes puts \"urgent\" in a priority field that should be 1, 2 or 3. What is the best fix?",
        options: [
          "Add an integer enum or range to the schema and validate it",
          "Ask the model in capital letters to use numbers for priority",
          "Raise the temperature so the model explores other values",
          "Accept the text and convert it later in the reporting tool",
        ],
        correctIndex: 0,
        explanation:
          "Constrain the field in the schema and enforce it in your validator. Emphatic prompts help a little but guarantee nothing, and fixing it downstream spreads bad data through the system.",
      },
      {
        question: "What is the correct order of a single tool-calling round trip?",
        options: [
          "Model runs tool, sends result, your code formats answer",
          "Model requests tool, your code runs it, result goes back",
          "Your code runs every tool, then asks the model to choose",
          "Provider runs tool, model reads it, your code logs it",
        ],
        correctIndex: 1,
        explanation:
          "The model produces a structured request, your code decides and runs the tool, and the result goes back in the next request so the model can continue. The model never executes anything itself.",
      },
      {
        question: "An agent loop has no maximum number of steps. What is the realistic worst case?",
        options: [
          "The agent finishes faster because nothing interrupts it",
          "A confused model loops until a timeout or bill stops it",
          "The provider rejects any request after the tenth tool call",
          "The model refuses to call tools more than a few times",
        ],
        correctIndex: 1,
        explanation:
          "Nothing in the model guarantees it stops. Without a step budget, a stuck agent can call tools until something external (a timeout, a rate limit, an invoice) stops it. Budgets are the balancing loop.",
      },
      {
        question: "A tool returns 200 fields per record and the agent keeps missing the delivery date. What design change helps most?",
        options: [
          "Return a compact result with the fields the task needs",
          "Add more tools so the model has other ways to find it",
          "Increase max tokens so the model can read every field",
          "Tell the model in the system prompt to read every field carefully",
        ],
        correctIndex: 0,
        explanation:
          "Tool results are prompt content. A compact, labelled result costs fewer tokens and makes the important field easy to find. More tools usually make choices harder, not easier.",
      },
      {
        question: "The model calls a tool named \"delete_account\" that you never defined. What should your loop do?",
        options: [
          "Run the closest matching tool you do have defined",
          "Return an error result saying the tool does not exist",
          "Crash the request so the problem is noticed quickly",
          "Ignore it and send the same request to the model again",
        ],
        correctIndex: 1,
        explanation:
          "Only tools in your registry may run. Returning a clear error result lets the model recover, and logging it shows you the model's confusion. Guessing a close match could do real harm.",
      },
      {
        question: "Why is forcing the model to call one specific tool a useful way to get structured output?",
        options: [
          "The tool's input schema becomes the JSON you receive",
          "Forced tool calls are billed at a lower token rate",
          "It lets your code skip validating the structure of the output",
          "It makes the model's answer stream faster to users",
        ],
        correctIndex: 0,
        explanation:
          "If the model must call a tool, its input must follow the tool's schema, so you get structured data in a predictable shape. You still validate it, and pricing and streaming are unaffected.",
      },
      {
        question: "Which statement about MCP is accurate?",
        options: [
          "It is a proprietary format that works with one vendor only",
          "It is an open protocol for connecting tools and data to AI apps",
          "It is a model that decides which tools an agent should call",
          "It is a security layer that blocks every prompt injection attempt",
        ],
        correctIndex: 1,
        explanation:
          "MCP is an open protocol with servers exposing tools, resources and prompts to clients in AI applications. It does not choose tools or stop prompt injection; you still have to manage trust and permissions.",
      },
      {
        question: "A refund tool's input passes schema validation: amount 480, order_id \"B210\". What check is still missing before running it?",
        options: [
          "Whether the JSON keys are in the order the schema lists",
          "Whether the order is the user's and the amount is allowed",
          "Whether the model used streaming to produce the tool input JSON",
          "Whether the tool description mentions refunds at all",
        ],
        correctIndex: 1,
        explanation:
          "Schema validation checks shape. Business rules (does this order belong to this customer, is 480 within the refundable amount and policy) must still be checked in code, especially for an action tool.",
      },
      {
        question: "When should a team adopt an agent framework rather than its own loop?",
        options: [
          "Always first, because a hand-written loop is never reliable",
          "Never, because frameworks hide how the agent really works",
          "Once they understand the loop and know which features they need",
          "Only when the provider forbids writing your own agent loop",
        ],
        correctIndex: 2,
        explanation:
          "Frameworks save time on tracing, memory and orchestration, but hide the loop. Building it once yourself makes you able to debug any framework and choose one for real reasons.",
      },
      {
        question: "Three of an agent's tools are search_all, find_anything and lookup. What problem does this create?",
        options: [
          "Overlapping vague tools make the model's choice unreliable",
          "Short names use too many tokens in every single request",
          "Search tools cannot be used together in one agent loop",
          "Tools with similar names are rejected by most providers",
        ],
        correctIndex: 0,
        explanation:
          "When tools overlap and names say little, the model has no basis for choosing, so choices look random. Give each tool one clear job and a description saying when to use it.",
      },
      {
        question: "A feature sends scanned contracts as plain text extracted by a basic parser, and answers about tables are often wrong. What is the likely cause?",
        options: [
          "The text extraction lost the table layout",
          "The model's temperature was set too low",
          "The contracts were too short to analyse",
          "The schema allowed too few string fields",
        ],
        correctIndex: 0,
        explanation:
          "Basic text extraction flattens tables, so rows and columns lose their meaning. Sending the document directly where supported, or using layout-aware extraction, keeps the structure.",
      },
      {
        question: "Users upload phone photos for a claims feature. Which step belongs in ingestion before anything reaches the model?",
        options: [
          "Strip metadata such as location and check size",
          "Increase the image resolution to the maximum",
          "Convert each photo to text with a translation API",
          "Store every photo publicly so reviewers can see it",
        ],
        correctIndex: 0,
        explanation:
          "Photo metadata can include location and other personal data the feature does not need, and size limits control cost and abuse. Upscaling and public storage add cost and risk.",
      },
    ],
  },
];
