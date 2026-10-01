import type { SeedFinalExam } from "../types";

// Building AI Apps and Agents: final exam bank (45 questions, 35 served).
// Original scenario questions written for this track; they are not taken from
// any vendor's certification material. Distribution: Modules 1-3 have 8
// questions each, Modules 4-6 have 7 each. Difficulty: 9 recall (1),
// 23 application (2), 13 analysis (3).

export const TRACK_AGENTS_FINAL_EXAM: SeedFinalExam = {
  title: "Building AI Apps and Agents: Final Exam",
  timeLimitMinutes: 60,
  questionsServed: 35,
  passScore: 75,
  distinctionScore: 90,
  maxAttempts: 3,
  cooldownHours: 24,
  instructionsMd: `## Before you start

**35 questions. 60 minutes. 75% to pass.** Score 90% or above and your certificate is marked *with Distinction*.

Most questions are short scenarios from building and running AI features: a request that loses context, a retry loop that makes an outage worse, a tool that can do too much, a retrieval system that leaks a document, an agent that will not stop, an eval that measures the wrong thing, a bill that doubles. They test the judgement of a developer who ships AI features, not recall of a phrase from a lesson.

Questions are vendor-neutral. Where a question mentions prices, they are illustrative. Questions are drawn at random from a larger bank covering all six modules, and options are shuffled, so each attempt is different. Every answer is saved the moment you select it, and the clock runs on our server.

You have up to 3 attempts, with a 24-hour gap between them so that a retry is a studied one. Your result is broken down by module, so you will know what to revisit.`,
  questions: [
    // ── Module 1: Calling Models from Code ───────────────────────────────
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "What does it mean that a chat model API is stateless?",
      options: [
        "It keeps nothing between calls, so each request must carry the context",
        "It stores each conversation on the provider's side for thirty days",
        "It remembers only the system prompt from the first call in a session",
        "It cannot return the same answer twice for the same exact input",
      ],
      correctIndex: 0,
      explanation:
        "The model sees only what is in the current request. Your code owns the conversation and resends whatever history the model needs, which is why long conversations cost more.",
    },
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "Which HTTP status is the usual signal that you have hit a rate limit?",
      options: ["429", "401", "404", "400"],
      correctIndex: 0,
      explanation:
        "429 Too Many Requests means you exceeded a limit and can retry after waiting, ideally honouring any Retry-After header. 400, 401 and 404 mean the request or key is wrong.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question: "With illustrative prices of $3 per million input tokens and $15 per million output tokens, which change cuts the cost of a call with 4,000 input and 1,000 output tokens the most?",
      options: [
        "Halving the output to 500 tokens",
        "Halving the input to 2,000 tokens",
        "Removing 500 tokens from the input",
        "Removing 100 tokens from the output",
      ],
      correctIndex: 0,
      explanation:
        "Input costs $0.012 and output $0.015. Halving output saves $0.0075, more than halving input ($0.006), because output tokens cost five times as much here. Do the arithmetic rather than assuming the bigger number matters most.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question: "A teammate proposes letting the mobile app send its own system prompt to your server, which forwards it to the model. What is the main problem?",
      options: [
        "Users could rewrite the rules the model follows",
        "System prompts cannot be sent over a mobile network",
        "The model ignores system prompts sent from a server",
        "Mobile apps are not allowed to call server routes",
      ],
      correctIndex: 0,
      explanation:
        "Anything the client sends can be altered. The server should build the system prompt from data it controls, so users cannot change the rules or fake earlier assistant turns.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question: "A feature shows summaries that sometimes stop mid-sentence. Logs show the stop reason was the output token limit. What is the best fix?",
      options: [
        "Retry the call with backoff until the summary is complete",
        "Raise the limit or ask for a shorter summary, and flag cut-offs",
        "Lower the temperature so the model writes fewer tokens",
        "Switch on streaming so the whole summary arrives faster",
      ],
      correctIndex: 1,
      explanation:
        "The answer was cut off by the cap. Either allow more tokens or ask for a shorter format, and treat any remaining cut-offs as incomplete. Retrying the same request hits the same cap.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question: "Which piece of data should a server route use to calculate what each model call cost?",
      options: [
        "The token usage reported in the API response",
        "The number of characters in the user's message",
        "The number of words in the model's reply",
        "The time the request took to complete",
      ],
      correctIndex: 0,
      explanation:
        "Usage figures are what you are billed for. Character and word counts are rough approximations that vary by model and language, and time is not how tokens are priced.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question: "During a provider incident, your service retries every failed call five times with a fixed one-second wait, and recovery takes far longer than for other customers. What is the best explanation?",
      options: [
        "Synchronised retries kept adding load, a reinforcing loop",
        "The provider deliberately slows accounts that retry calls",
        "Five retries is too few to get through a provider incident",
        "Fixed waits make each individual request more expensive",
      ],
      correctIndex: 0,
      explanation:
        "Many clients retrying in lockstep multiply load on a struggling service, which prolongs the failure. Exponential backoff with jitter spreads and reduces retries, turning the loop into a balancing one.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question: "An analytics dashboard needs a model to classify 20,000 survey comments, and a product manager asks for streaming so it feels faster. What should you advise?",
      options: [
        "Stream, because streaming lowers the token cost of the job",
        "Do not stream; process in the background, perhaps in batch",
        "Stream, because classification needs each token as it arrives",
        "Do not stream, because streaming cannot return JSON at all",
      ],
      correctIndex: 1,
      explanation:
        "Nobody watches 20,000 classifications appear. Streaming adds complexity without benefit; a background job, possibly using a discounted batch interface, suits the work. Streaming does not change cost.",
    },

    // ── Module 2: Structured Outputs and Tools ───────────────────────────
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "In tool calling, what does the model actually return when it wants a tool used?",
      options: [
        "A structured request naming the tool and its input",
        "The result of running the tool on the provider's side",
        "A link the browser follows to run the tool directly",
        "A plain sentence describing what the tool should do",
      ],
      correctIndex: 0,
      explanation:
        "The model produces a structured call (name, input and an ID). Your code decides whether to run it, runs it and returns the result linked by that ID.",
    },
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "What does an MCP server provide to an MCP-capable AI application?",
      options: [
        "Tools, resources and prompts over a standard protocol",
        "A hosted model that replaces the application's model",
        "A training pipeline for fine-tuning the host's model",
        "A firewall that blocks every prompt injection attempt",
      ],
      correctIndex: 0,
      explanation:
        "MCP standardises how applications connect to tools, data (resources) and prompt templates. It does not supply models or make untrusted servers safe.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "A model in schema-constrained mode returns {\"priority\": 3} for a ticket that says \"our whole team is locked out\". Which part of your system should catch this?",
      options: [
        "The JSON schema, since it should forbid wrong values",
        "Your evals and business rules, as the value is valid but wrong",
        "The provider, since constrained mode checks meaning too",
        "Nothing, because constrained output is always correct",
      ],
      correctIndex: 1,
      explanation:
        "Schemas constrain shape, not judgement. A valid but wrong priority is caught by evaluation on cases like this, and sometimes by business rules (for example keywords that force urgency).",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "Your loop sends a tool result back, and the API rejects it because the matching tool call is missing. What did the loop forget?",
      options: [
        "To append the assistant turn that contained the tool call",
        "To send the tool definitions again with the second request",
        "To lower the temperature before sending the tool result",
        "To stream the first response so the call ID is recorded",
      ],
      correctIndex: 0,
      explanation:
        "The next request must include the assistant turn with the tool call, then the result with the same ID. Missing or mismatched turns are the classic tool-calling bug.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "Which tool definition is best for an assistant that tells customers when their parcel will arrive?",
      options: [
        "get_eta(carrier, tracking_number), described with when to use it",
        "http_get(url), so the model can fetch any carrier's tracking page",
        "run_sql(query), with read access to the whole shipping database",
        "tools(action, params), one flexible tool covering all operations",
      ],
      correctIndex: 0,
      explanation:
        "A narrow, well-described tool gives the model a clear choice and limits what can go wrong. General HTTP, SQL or catch-all tools give far more reach than the task needs.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "A model asks to call refund_order with an amount larger than the order total. What should happen?",
      options: [
        "Your code rejects it and returns an error result to the model",
        "The refund runs, since the model chose the amount on purpose",
        "The tool lowers the amount to the order total and runs silently",
        "The loop retries the same call until the amount is acceptable",
      ],
      correctIndex: 0,
      explanation:
        "Business rules live in code. Rejecting the call with a clear error lets the model correct itself or escalate. Silently changing the amount hides the problem; running it is unsafe.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question: "An agent has search_kb, search_docs and find_answers, and picks between them almost at random. Evals show quality varies with the tool chosen. What is the root fix?",
      options: [
        "Merge or sharpen the tools so each has one clear job",
        "Raise the step budget so the agent can try all three",
        "Use a larger model that is better at guessing intent",
        "Add a line to the prompt saying to choose carefully",
      ],
      correctIndex: 0,
      explanation:
        "Overlapping, vaguely described tools give the model no basis for choice. Consolidating them or giving each a distinct job and description fixes the cause rather than compensating for it.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question: "A team connects a popular third-party MCP server that can read and write files to their coding assistant. Which risk deserves attention first?",
      options: [
        "The server's tools and outputs are trusted with broad access",
        "MCP adds a fixed per-token surcharge to every request",
        "MCP servers cannot run on the same machine as the host",
        "The assistant will stop working with other providers",
      ],
      correctIndex: 0,
      explanation:
        "A standard connection does not make a server trustworthy. Review its tools, restrict its credentials and directories, and keep approval on for writes, because its descriptions and outputs reach the model.",
    },

    // ── Module 3: Retrieval-Augmented Generation ─────────────────────────
    {
      moduleNumber: 3,
      difficulty: 1,
      question: "What is an embedding, in the context of retrieval?",
      options: [
        "A list of numbers that represents the meaning of text",
        "A compressed copy of a document for faster downloads",
        "A tag that marks which user may read a document",
        "A summary of a document written by the language model",
      ],
      correctIndex: 0,
      explanation:
        "Embeddings are vectors where similar meanings point in similar directions, which enables semantic search. Access tags and summaries are separate things you may also store.",
    },
    {
      moduleNumber: 3,
      difficulty: 1,
      question: "What does hybrid search combine?",
      options: [
        "Keyword search and vector search results",
        "Two different language models' answers",
        "Retrieval from two separate vector stores",
        "Human review and automated evaluation",
      ],
      correctIndex: 0,
      explanation:
        "Hybrid search merges keyword (exact term) and vector (semantic) results, often with reciprocal rank fusion, so exact codes and paraphrases are both found.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "Users ask about \"form P-11\" and retrieval returns pages about forms in general. What change helps most?",
      options: [
        "Add keyword search alongside vectors in a hybrid setup",
        "Switch to a larger model for writing the final answer",
        "Ask users to describe the form instead of naming it",
        "Increase chunk size so each chunk covers more forms",
      ],
      correctIndex: 0,
      explanation:
        "Exact identifiers are a known weak spot for embeddings and a strength of keyword search. A larger generation model cannot use a passage retrieval never found.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "A grounded assistant returns an answer citing [doc-14], which was not among the five sources sent. What should the code do?",
      options: [
        "Reject or flag the answer as having a fabricated citation",
        "Look up doc-14 in the index and add it to the source list",
        "Show the answer but remove the brackets around the citation",
        "Trust it, since the model may know doc-14 from training",
      ],
      correctIndex: 0,
      explanation:
        "A citation to something never provided is invented. Reject or flag it and count it in your metrics. Quietly patching it hides a failure you need to see.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "Which chunk is most likely to be retrieved and used correctly for \"How long do I have to return a sale item?\"",
      options: [
        "\"Returns policy > Sale items: Sale items can be returned within 14 days.\"",
        "\"Sale items can be returned within 14 days.\" with no heading at all",
        "The whole 40-page customer policy document as one single chunk",
        "\"14 days.\" stored on its own as a very short chunk for precision",
      ],
      correctIndex: 0,
      explanation:
        "A coherent chunk with its heading prepended carries its context for both search and the model. Huge chunks blur relevance and cost more; tiny fragments lose meaning.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "Your retrieval eval shows the right chunk is in the top 5 for 95% of questions, yet many answers are wrong. Where should you look next?",
      options: [
        "Generation: the prompt, grounding rules and model use of sources",
        "Chunking: the chunks are probably far too small to be found",
        "Embeddings: the model must be retrained on your documents",
        "Hybrid search: keyword matching is likely missing exact terms",
      ],
      correctIndex: 0,
      explanation:
        "If retrieval reliably delivers the right passage, the failure is in generation: how the prompt presents sources, the grounding rules, or the model's use of them.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question: "Six months after launch, answers about prices are increasingly wrong, although no code has changed. Old and new price lists are both in the index. Which systems description fits best?",
      options: [
        "A stock of chunks with inflow but no outflow, felt after a delay",
        "A reinforcing loop inside the embedding model's similarity scores",
        "A bottleneck at the reranker that drops the newest documents",
        "A random fault that a model upgrade will fix on its own",
      ],
      correctIndex: 0,
      explanation:
        "New documents flowed in but superseded ones never flowed out, so stale content accumulated. The delay between cause and visible effect is why it went unnoticed. Track versions and remove old chunks.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question: "A team scores declined answers (\"I don't know based on the documents\") as failures and tunes the prompt until declines disappear. What is the likely result?",
      options: [
        "More confident wrong answers on questions the docs cannot answer",
        "Higher retrieval hit rates because more chunks are used per answer",
        "Lower costs, because declines used to need an extra model call",
        "No real change, because declines and errors are measured separately",
      ],
      correctIndex: 0,
      explanation:
        "On unanswerable questions, declining is correct. Optimising declines away (a Goodhart effect) pushes the system to guess, producing the most harmful outcome: wrong answers that look right.",
    },

    // ── Module 4: Agents That Work in Production ─────────────────────────
    {
      moduleNumber: 4,
      difficulty: 1,
      question: "What distinguishes an agent from a workflow?",
      options: [
        "In an agent, the model decides the next step",
        "In an agent, every step is a fixed model call",
        "In an agent, code decides each tool to call",
        "In an agent, no tools are available at all",
      ],
      correctIndex: 0,
      explanation:
        "Workflows have steps decided by code with the model doing defined jobs; agents let the model choose tools, order and when to stop. Use the least autonomy that does the job.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "An agent that drafts and sends supplier payment reminders sometimes picks the wrong supplier. Which control best prevents harm while keeping most of the time saving?",
      options: [
        "Approval of each exact reminder before it is sent",
        "A longer system prompt about choosing suppliers",
        "A larger model that makes fewer selection errors",
        "Weekly review of sent reminders by the finance team",
      ],
      correctIndex: 0,
      explanation:
        "Sending is irreversible; drafting is not. Approving the exact message catches mistakes before harm while the agent still does the work. Reviews after sending only find the damage.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "An agent stores \"notes to remember\" from customer emails it reads. What safeguard matters most?",
      options: [
        "Only write memory from trusted sources or after review",
        "Store notes as plain text rather than as structured data",
        "Delete every note after exactly one hour, without exception",
        "Let the model decide which notes are trustworthy to keep",
      ],
      correctIndex: 0,
      explanation:
        "Untrusted content that can write memory lets attackers plant lasting instructions (memory poisoning). Restrict who can write memory and treat recalled memory as data, not instructions.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "Where should an agent's per-run cost budget be enforced?",
      options: [
        "In the loop, from usage after every model call",
        "In the prompt, by telling the model its budget",
        "In the provider console's monthly spending cap",
        "In the tool descriptions, by listing their prices",
      ],
      correctIndex: 0,
      explanation:
        "Only your loop sees usage after each call and can stop the run. The model cannot reliably track spend, and account caps are a backstop, not a per-run control.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "A long agent run slows down and costs more at each step because old tool results fill its context. What is a sound fix?",
      options: [
        "Summarise used results and keep large data outside the context",
        "Restart the run from scratch whenever it reaches ten steps long",
        "Remove the system prompt to make room for the tool results",
        "Raise the output limit so the model reads results more quickly",
      ],
      correctIndex: 0,
      explanation:
        "Working memory is the context window and it is resent every call. Compact or offload old results so the model sees what it needs at a fraction of the tokens.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question: "A design uses a planner agent, three worker agents and a reviewer agent for a task one agent with four tools handled in testing. Which concern is strongest?",
      options: [
        "Extra cost, lost context at hand-offs and harder debugging",
        "Multiple agents cannot share any tools with one another",
        "A single agent is always more accurate than five agents",
        "Reviewers cannot be agents, only human team members",
      ],
      correctIndex: 0,
      explanation:
        "Each agent multiplies calls and tokens, hand-offs lose context, and failures are harder to trace. Multi-agent designs need evidence that one agent is limited; one is not always better, though.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question: "An agent pipeline is judged on \"cases closed per day\" and starts closing cases without solving them. What should the team change?",
      options: [
        "Pair closures with reopen rates or confirmed resolution",
        "Raise the daily target so the agent works harder overall",
        "Remove all metrics so the agent cannot game any of them",
        "Switch to a larger model that understands the target",
      ],
      correctIndex: 0,
      explanation:
        "This is Goodhart's law: the measure became the target. Pairing it with measures that reflect the real outcome makes gaming one show up in the other.",
    },

    // ── Module 5: Evaluation, Safety and Security ────────────────────────
    {
      moduleNumber: 5,
      difficulty: 1,
      question: "What is indirect prompt injection?",
      options: [
        "Instructions hidden in content the model reads while working",
        "A user typing commands to override the assistant's rules",
        "A bug where the system prompt is sent twice in a request",
        "An attack that floods the API to trigger rate limiting",
      ],
      correctIndex: 0,
      explanation:
        "Indirect injection arrives through documents, emails, web pages or tool results rather than the user's own message, which makes it especially dangerous for agents with tools.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "Which check is the cheapest meaningful way to evaluate an extraction feature that returns invoice totals?",
      options: [
        "Compare each total with the expected value in code",
        "Ask a judge model whether each total looks plausible",
        "Have a person review every invoice output by hand",
        "Measure the similarity of output text to the invoice",
      ],
      correctIndex: 0,
      explanation:
        "Exact or numeric-tolerance comparison against labelled expected values is free and precise. Judges and human review are for qualities code cannot check.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "A judge model rates outputs from its own model family higher than equally good outputs from others. Which mitigation fits?",
      options: [
        "Use a judge from another family and calibrate against people",
        "Tell the judge in its prompt that all outputs are anonymous",
        "Raise the judge's temperature so its ratings vary more often",
        "Average the judge's scores with the outputs' own self-ratings",
      ],
      correctIndex: 0,
      explanation:
        "Self-preference is a known judge tendency. A judge from a different family, checked against human labels, reduces it. Prompts and randomness do not address the bias.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "A chat feature renders the model's Markdown, including images from any URL. Why is this a data exfiltration risk?",
      options: [
        "An injected image URL can carry private data to an attacker",
        "Images make each response far more expensive to generate",
        "Markdown images are stored publicly by most model providers",
        "The browser sends the user's password with image requests",
      ],
      correctIndex: 0,
      explanation:
        "If injected instructions make the model output an image URL containing private data, the browser sends that data when it loads the image. Allow-list image and link domains.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "Which logging approach best fits an AI support assistant handling personal data?",
      options: [
        "Usage and errors kept longer; redacted text kept briefly",
        "Full prompts and responses kept forever for future tuning",
        "No logs at all, so that no personal data is ever stored",
        "Full logs, but only readable through the provider console",
      ],
      correctIndex: 0,
      explanation:
        "Metadata supports cost and reliability analysis with little risk; redacted, short-lived text supports debugging. Keeping everything forever multiplies risk; keeping nothing blinds incident response.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question: "An email assistant can read the user's inbox, browse links in emails and send replies. What is the most effective structural change against injection?",
      options: [
        "Remove or gate one capability, such as approval to send",
        "Add a firmer warning about links to the system prompt",
        "Use a model with a larger context window for safety",
        "Log every sent email so leaks can be traced later on",
      ],
      correctIndex: 0,
      explanation:
        "Private data, untrusted content and an outbound channel together let injection become exfiltration. Breaking one leg, for example approval before sending, changes the risk structurally; prompts only help at the margin.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question: "After a prompt change, the overall eval score is unchanged, but all four access-control cases now fail. What should the release rule have said?",
      options: [
        "Safety cases must all pass, whatever the overall score",
        "Releases are allowed when the overall score does not drop",
        "Access-control cases are removed once they have passed",
        "Only cases added in the last month count towards release",
      ],
      correctIndex: 0,
      explanation:
        "Averages hide collapses in small but critical categories. A separate all-must-pass rule for safety and access-control cases blocks release on any failure there.",
    },

    // ── Module 6: Shipping and Operating AI Features ─────────────────────
    {
      moduleNumber: 6,
      difficulty: 1,
      question: "What does provider-side prompt caching reuse?",
      options: [
        "Processing of an identical prompt prefix across requests",
        "The model's full answer to any previously asked question",
        "The user's personal details between separate sessions",
        "Embeddings of every document in your retrieval index",
      ],
      correctIndex: 0,
      explanation:
        "Prompt caching reuses work on a repeated prefix (system prompt, tools, reference documents), lowering cost and latency for that part. It is not a response cache.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "Which job suits a discounted batch interface best?",
      options: [
        "Re-scoring last quarter's 60,000 reviews overnight",
        "Answering a customer waiting in a live chat window",
        "Suggesting text while a user types in an editor",
        "Running an agent that books a meeting right now",
      ],
      correctIndex: 0,
      explanation:
        "Batch processing trades speed for price, so bulk work that can wait hours is ideal. Anything a person is waiting for needs the normal API.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "A worker retries a job after a timeout and a tenant gets the same email twice. What prevents this?",
      options: [
        "An idempotency key checked before the email is sent",
        "A longer timeout so the first attempt always finishes",
        "A response cache holding the text of every email sent",
        "A larger model that writes the email more quickly",
      ],
      correctIndex: 0,
      explanation:
        "Retries are normal in queued systems. An idempotency key per intended action lets the worker see the email was already sent and skip it.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "Error rates and latency are normal, but users report worse answers this week. Which monitoring would have shown it first?",
      options: [
        "Quality signals such as feedback, validation and scheduled evals",
        "CPU and memory usage of the servers that host the application",
        "The provider's public status page showing current uptime data",
        "Total number of requests per day across the whole product",
      ],
      correctIndex: 0,
      explanation:
        "AI features can fail while returning successful responses. Quality needs its own sensors: feedback, validation and citation failure rates, sampled review and scheduled eval runs.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question: "A team cuts costs by routing all requests to their smallest model without running evals, and cost per call drops by two thirds. Cost per resolved ticket rises. What most likely happened?",
      options: [
        "More retries, escalations and human fixes per resolved ticket",
        "The provider raised its prices for the smallest model in secret",
        "Cost per call and cost per ticket always move in opposite ways",
        "The eval set was too large, which inflated the per-ticket cost",
      ],
      correctIndex: 0,
      explanation:
        "A cheaper model that fails more often needs more calls and human work per finished task. Route by evidence from evals, and track cost per successful task, not just per call.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question: "A daily spend cap silently switches the assistant to a much weaker model once reached, and nobody monitors the fallback. What systems risk does this create?",
      options: [
        "The cost problem is shifted into unnoticed quality loss",
        "A reinforcing loop that doubles spending every single day",
        "A permanent removal of the provider's own rate limits",
        "A delay in billing that hides the true monthly invoice",
      ],
      correctIndex: 0,
      explanation:
        "Fixes can move problems elsewhere. A silent degrade keeps the cost metric healthy while users suffer. Make the switch visible and monitor quality on the fallback path.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question: "In a handover rehearsal, the new owner can run the evals but cannot roll back last week's prompt change. What does this reveal?",
      options: [
        "Prompts are not versioned and deployable like code yet",
        "The new owner needs more experience with the model used",
        "Rolling back prompts is never needed after a handover",
        "The eval set must be too small to be trusted at all",
      ],
      correctIndex: 0,
      explanation:
        "Prompts change behaviour as much as code does. If they cannot be rolled back quickly by someone else, incidents will be slow and risky to contain. Version and deploy them like code.",
    },
  ],
};
