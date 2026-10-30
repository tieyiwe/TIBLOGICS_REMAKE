import type { SeedModule } from "../types";

// AI and Machine Learning Fundamentals. Module 5: Applying Foundation Models.
// All organisations, prices and figures in examples are fictional and
// illustrative. Product names are examples only, dated October 2026.

export const ML_MODULE_5: SeedModule[] = [{
  title: "Applying Foundation Models",
  summary:
    "Choose a model on capability, cost, latency, context and data residency; decide between prompting, retrieval and fine-tuning; estimate running costs; and launch with evaluation, monitoring and a human in the loop designed as part of the whole system.",
  lessons: [
    // ── Lesson 5.1 ────────────────────────────────────────────────────────
    {
      title: "Choosing a model",
      objective:
        "Compare candidate foundation models against capability, cost, latency, context length, data handling and deployment constraints, and shortlist one for a given use case.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## There is no best model, only a best fit

New models are released constantly, and each launch claims to top some leaderboard. For a real application, the question is not "which model is best?" but "which model is good enough for this task, at a cost, speed and risk we can live with?" A smaller, cheaper, faster model that passes your tests often beats a frontier model that is ten times the price.

## The selection criteria

**1. Capability on your task.** Public benchmarks are a rough guide at most. What matters is performance on your own test set (Module 3): your documents, your questions, your edge cases. Shortlist two or three models and run the same set through each.

**2. Cost.** Most services price per token, with separate rates for input and output, and output usually costs several times more. Larger, more capable models cost more per token. Some providers offer discounts for batch processing (non-urgent work run in bulk) or for reusing the same long prompt prefix across requests (often called prompt caching). Lesson 5.3 covers estimation.

**3. Latency.** How quickly must the answer arrive? A live chat needs a first response within seconds; an overnight report does not. Larger models and longer outputs are slower. Measure **time to first token** (when text starts to appear) and total time.

**4. Context window.** How much text must the model consider at once? Long contracts or many retrieved passages need a larger window. Bigger is not free: more input tokens cost more and can slow responses.

**5. Modality and features.** Do you need image input, audio, structured output (such as reliable JSON), tool use, or fine-tuning support?

**6. Data handling and residency.** Where is your data processed and stored? Is it used to train the provider's models (for most business services it is not by default, but check the terms)? How long is it retained? Does the service meet the data protection and sector rules you are bound by, and can it run in the regions you require?

**7. Deployment model and control.**

- **Hosted API from the model's provider**: quickest to start.
- **Managed service from a cloud provider**: for example, at the time of writing (October 2026), the major clouds each offer a service for calling a choice of foundation models inside your cloud account, such as Amazon Bedrock or Google Cloud's Vertex AI. This can simplify security, billing and data residency if you already use that cloud.
- **Open-weight models** (whose weights are published for anyone to download, under a licence) run on your own infrastructure or a provider's. More control and privacy, more engineering and operating effort. Check the licence terms for commercial use.

**8. Vendor and operational factors.** Rate limits, uptime commitments, support, how often models are retired or changed (and how much notice you get), and how hard it would be to switch.

## A shortlisting table

Imagine a housing association building an assistant to answer tenants' repair questions from its own repair policies.

| Criterion | What matters here |
|---|---|
| Capability | Accurate, grounded answers from policy text; plain, kind language |
| Cost | High volume of short questions; cost per conversation must stay low |
| Latency | Tenants are on phones; answers within a few seconds |
| Context | A few retrieved policy passages per question; modest |
| Data | Tenants may mention health and personal circumstances; strict handling and UK or EU processing needed |
| Deployment | Already uses one cloud provider; a managed service there is attractive |

That profile points to a mid-sized or small, fast model in a managed service with suitable data terms, tested against a larger model on the same questions. If the smaller model passes, it wins.

## Avoid lock-in by design

Keep prompts, test sets and evaluation separate from any one provider's tools where you can, and route model calls through one internal component. Then switching models, which you will do as prices and capabilities change, means rerunning your tests rather than rebuilding your system.

## Try it now

\`\`\`try
I am choosing a foundation model for this use case: [DESCRIBE THE TASK, USERS, VOLUME AND DATA SENSITIVITY]. Build me a selection table with the criteria: capability, cost, latency, context, modality, data handling and residency, deployment model, and vendor factors. For each, say what matters for my case and what question I should ask a provider. Do not recommend specific products or quote prices.
\`\`\`

You are done when you have the table, have added one criterion-specific test you would run on shortlisted models, and can say which criterion is the deciding one for your case.`,
      microCheck: [
        {
          question: "A small model passes all of a team's tests at a fraction of the cost of a frontier model, which scores slightly higher. What is usually the sensible choice?",
          options: [
            "The small model, since it is good enough at a far lower cost",
            "The frontier model, since higher scores always justify any cost",
            "Neither, until a public leaderboard ranks them both the same",
            "Both together, sending each request to both and picking one",
          ],
          correctIndex: 0,
          explanation:
            "The goal is the model that is good enough for the task at acceptable cost and risk. If the small model passes your tests, its cost and speed advantages usually win.",
        },
        {
          question: "Why are public benchmarks only a rough guide when choosing a model?",
          options: [
            "Performance on your own data and edge cases is what matters",
            "Benchmarks are banned from use in any business decisions",
            "Benchmarks only measure the price of each model per token",
            "Public benchmarks are always run on image models alone",
          ],
          correctIndex: 0,
          explanation:
            "Benchmarks test general tasks that may not resemble yours. A shortlist run on your own test set shows how each model handles your documents and cases.",
        },
        {
          question: "A healthcare provider must keep patient data processed within a specific region. Which criterion is decisive?",
          options: [
            "Data handling and residency terms of the service",
            "The size of the model's context window in tokens",
            "The time to first token for very short answers",
            "Whether the model can generate images as well",
          ],
          correctIndex: 0,
          explanation:
            "Legal and contractual limits on where data is processed rule options in or out before capability or speed are compared.",
        },
        {
          question: "What is the main trade-off of running an open-weight model on your own infrastructure?",
          options: [
            "More control and privacy, but more engineering and operating effort",
            "Lower capability in every case, but no licence terms to check",
            "Faster responses always, but no possibility of fine-tuning it",
            "No running costs at all, but no ability to process business data",
          ],
          correctIndex: 0,
          explanation:
            "Open weights give control over where and how the model runs, at the cost of hosting, scaling and maintaining it yourself. Licence terms still need checking.",
        },
        {
          question: "Why route all model calls through one internal component?",
          options: [
            "So switching models later means rerunning tests, not rebuilding",
            "Because providers refuse requests from more than one component",
            "So that each request is automatically sent to the largest model",
            "Because this removes the need for any evaluation of new models",
          ],
          correctIndex: 0,
          explanation:
            "Models and prices change often. A single integration point, plus provider-neutral tests, makes switching a controlled change rather than a rebuild.",
        },
      ],
    },

    // ── Lesson 5.2 ────────────────────────────────────────────────────────
    {
      title: "Prompting, RAG or fine-tuning: a decision guide",
      objective:
        "Decide whether a use case needs prompt engineering, retrieval-augmented generation, fine-tuning or a combination, and justify the choice.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## Three tools for three different gaps

When a foundation model does not do what you need out of the box, there are three main ways to close the gap. They solve different problems, cost different amounts and carry different risks. The most common mistake is reaching for the most impressive-sounding one (fine-tuning) for a problem the cheapest one (prompting) would solve.

| Approach | What it changes | Best for | Effort and cost |
|---|---|---|---|
| **Prompt engineering** | The instructions, examples and context in each request | Task definition, format, tone, reasoning steps, light specialisation | Low; fast to change |
| **RAG** | The information supplied at question time | Facts the model does not know: private, specific or changing content; citations | Medium; needs a content pipeline |
| **Fine-tuning** | The model's weights, via further training on examples | Consistent style or format at scale, specialised tasks, shorter prompts, sometimes a smaller model doing a bigger model's job | Medium to high; needs quality training data and retraining over time |

## The decision questions

Work through these in order.

**1. Have we pushed prompting properly?** Clear instructions, examples of good output, a defined format, the relevant context and a test set to measure against. Many "the model cannot do this" conclusions are really "we have not told it clearly". Always start here; it is also the baseline the other options must beat.

**2. Is the gap about knowledge?** If the model needs facts it does not have (your policies, your products, this week's figures), or answers must cite sources, use **RAG**. Fine-tuning is a poor way to add facts: they go stale, the model can still mix them up, and it cannot cite where they came from.

**3. Is the gap about behaviour, at scale?** If prompting gets the content right but the format, style or specialised judgement is inconsistent across thousands of requests, or prompts have become very long and expensive, **fine-tuning** may help. It needs hundreds to thousands of high-quality examples of exactly the behaviour you want, and an evaluation to prove it beat a well-prompted baseline.

**4. Do we need both?** Combinations are common: RAG for the facts, plus a fine-tuned model for the house style. Or a fine-tuned small model for a narrow, high-volume task, with a larger prompted model for the rest.

## Worked examples

Imagine three requests to an AI team.

- **"Answer staff questions about our 300 HR policies, with references."** Knowledge gap, changing content, citations required: **RAG**, with a well-engineered prompt.
- **"Classify incoming emails into our 12 categories, 50,000 a month."** Start with a prompt containing the category definitions and examples. If accuracy is good, stop. If it plateaus, or volume makes a long prompt costly, consider **fine-tuning** a smaller model on labelled past emails, or even a traditional ML classifier (Module 2).
- **"Write product descriptions in our distinctive brand voice."** Start with a prompt containing a style guide and several examples. If the voice is still inconsistent after real effort, **fine-tuning** on approved past descriptions is a reasonable next step. Facts about each product still come from the product data in the prompt.

## Costs that hide

- **Prompting**: long prompts are paid for on every request. Prompt caching can reduce this where offered.
- **RAG**: the content pipeline is ongoing work: owners, updates, re-indexing and permission rules. Retrieved passages add input tokens to every request.
- **Fine-tuning**: training data must be gathered, cleaned and checked; the training run costs money; a fine-tuned model may cost more per token to run; and when the base model is retired or improved, you may need to do it again.

## Systems view

Each option moves work to a different part of the system. Prompting puts the burden on prompt design and testing. RAG puts it on content ownership. Fine-tuning puts it on data curation and retraining. Ask which of those your organisation can actually sustain. A RAG system with nobody owning the content will decay; a fine-tuned model nobody can retrain will freeze in time.

\`\`\`studio
prompt-arena
\`\`\`

Use the arena to compare a bare prompt with one that adds examples and context, before concluding you need anything heavier.

## Try it now

\`\`\`try
Act as an AI solutions architect. My use case: [DESCRIBE IT, INCLUDING VOLUME, HOW OFTEN THE UNDERLYING INFORMATION CHANGES, WHETHER CITATIONS ARE NEEDED AND WHAT "GOOD" LOOKS LIKE]. Work through these questions in order: have I pushed prompting properly; is the gap knowledge or behaviour; is fine-tuning justified; would a combination fit? Recommend one approach, state the evidence that would change your recommendation, and list the ongoing work it creates for my team.
\`\`\`

You are done when you have a recommendation, the test that would prove it beat a well-prompted baseline, and a named owner for the ongoing work it creates.`,
      microCheck: [
        {
          question: "A team plans to fine-tune a model on its product catalogue so the assistant 'knows' current prices, which change weekly. What is the better approach?",
          options: [
            "RAG, retrieving current prices from the catalogue at question time",
            "Fine-tuning every week, so the model always has the latest prices",
            "Pre-training a new model that includes the catalogue from scratch",
            "Prompting the model to estimate prices from its general knowledge",
          ],
          correctIndex: 0,
          explanation:
            "Changing facts belong in retrieval, where they can be updated and cited. Weekly fine-tuning is costly and still cannot cite sources reliably.",
        },
        {
          question: "What should always be tried first, and why?",
          options: [
            "Prompt engineering, as it is cheapest and sets the baseline",
            "Fine-tuning, as it gives the most lasting improvement",
            "RAG, as every use case needs company documents",
            "Pre-training, as it gives the most control overall",
          ],
          correctIndex: 0,
          explanation:
            "Well-designed prompts often close the gap. They are also the baseline that RAG or fine-tuning must beat to justify their extra cost and upkeep.",
        },
        {
          question: "Prompting gets the content right, but a company's 40,000 monthly summaries vary in format and the long prompt is costly. Which option is most worth testing?",
          options: [
            "Fine-tuning a model on high-quality examples of the format",
            "Adding RAG over unrelated company documents to every request",
            "Raising the temperature so the format becomes more uniform",
            "Removing all examples from the prompt to save on tokens",
          ],
          correctIndex: 0,
          explanation:
            "Consistent behaviour at scale and long, costly prompts are where fine-tuning can pay off. It still has to beat the prompted baseline on a test set.",
        },
        {
          question: "Which hidden ongoing cost belongs to RAG in particular?",
          options: [
            "Owning, updating and re-indexing the source content over time",
            "Retraining the model's weights every time the base model changes",
            "Paying for a training run before the system can answer anything",
            "Collecting thousands of labelled examples of the right behaviour",
          ],
          correctIndex: 0,
          explanation:
            "RAG moves the burden to content: owners, updates, retired versions and permissions. Retraining and labelled examples are fine-tuning costs.",
        },
        {
          question: "Why is fine-tuning a poor way to give a model facts that need citations?",
          options: [
            "A fine-tuned model cannot reliably show where a fact came from",
            "Fine-tuning deletes the model's ability to write full sentences",
            "Facts are always removed from training data during fine-tuning",
            "Citations can only be produced by models that are not fine-tuned",
          ],
          correctIndex: 0,
          explanation:
            "Facts absorbed into weights have no attached source, and can be mixed up. Retrieval keeps each fact tied to a passage that can be cited and checked.",
        },
      ],
    },

    // ── Lesson 5.3 ────────────────────────────────────────────────────────
    {
      title: "Estimating cost",
      objective:
        "Estimate the monthly running cost of a foundation model application from tokens, volume and price, and identify the levers that reduce it.",
      durationMinutes: 25,
      contentType: "mixed",
      bodyMd: `## The arithmetic is simple; the assumptions are not

The running cost of a generative AI feature comes mostly from tokens. The core formula:

**Cost per request** = (input tokens × input price) + (output tokens × output price)

**Monthly cost** = cost per request × requests per month

Prices are usually quoted per million tokens. The hard part is not the sum. It is estimating the inputs honestly: how long the prompts really are once system instructions, retrieved passages and conversation history are included, how long the answers are, and how many requests there will really be.

## What goes into the input

For a typical RAG assistant, each request's input includes:

- **System prompt**: instructions, rules, format. Often several hundred to a few thousand tokens, sent every time.
- **Retrieved passages**: for example, five chunks of a few hundred tokens each.
- **Conversation history**: in a chat, earlier turns are usually re-sent, so input grows with every turn.
- **The user's message**: often the smallest part.

That is why input tokens often dominate volume, while output tokens, being pricier, can still dominate cost for long answers.

## A worked example

Imagine a council's resident help assistant. All prices below are invented for illustration; real prices vary widely by model and change often, so always check the provider's current price list.

- Input per request: 1,500 system prompt + 2,000 retrieved + 500 history and question = 4,000 tokens.
- Output per request: 300 tokens.
- Illustrative prices: 1.00 per million input tokens, 5.00 per million output tokens.
- Cost per request: (4,000 × 1.00 + 300 × 5.00) / 1,000,000 = 0.0055.
- Volume: 3,000 conversations a day, about 3 requests each, 30 days = 270,000 requests.
- Monthly model cost: about 1,485.

Then add what is not tokens: embedding and vector storage for RAG, logging and monitoring, evaluation runs (model-as-judge costs tokens too), engineering time, and human review time. These can rival the model bill.

## Try the calculation

Change the numbers in the estimator below. Notice which change moves the total most: halving the system prompt, halving the output, or switching to a model at a fifth of the price.

\`\`\`playground
<!doctype html>
<html>
<body style="font-family: sans-serif; padding: 12px">
  <h3>Token cost estimator (illustrative prices only)</h3>
  <label>Input tokens per request <input id="inTok" type="number" value="4000"></label><br>
  <label>Output tokens per request <input id="outTok" type="number" value="300"></label><br>
  <label>Price per million input tokens <input id="inP" type="number" value="1" step="0.01"></label><br>
  <label>Price per million output tokens <input id="outP" type="number" value="5" step="0.01"></label><br>
  <label>Requests per month <input id="vol" type="number" value="270000"></label><br>
  <button onclick="calc()">Estimate</button>
  <p id="out"></p>
  <script>
    function v(id) { return Number(document.getElementById(id).value); }
    function calc() {
      var perReq = (v("inTok") * v("inP") + v("outTok") * v("outP")) / 1000000;
      var month = perReq * v("vol");
      var inShare = (v("inTok") * v("inP")) / (v("inTok") * v("inP") + v("outTok") * v("outP"));
      document.getElementById("out").textContent =
        "Per request: " + perReq.toFixed(5) +
        " | Per month: " + month.toFixed(2) +
        " | Share of cost from input: " + (inShare * 100).toFixed(0) + "%";
    }
    calc();
  </script>
</body>
</html>
\`\`\`

For a fuller estimate with current model prices, build options and usage scenarios, use the TIBLOGICS [AI Product Cost Calculator](/tools/calculator).

## The levers

- **Right-size the model.** Use the smallest model that passes your tests; route only hard requests to a larger one.
- **Trim the input.** Shorter system prompts, fewer and better retrieved chunks, summarised conversation history.
- **Control output length.** Ask for concise answers and set a maximum.
- **Cache.** Reuse responses to identical frequent questions, and use prompt caching for shared prompt prefixes where offered.
- **Batch.** Run non-urgent work in bulk where batch discounts exist.
- **Avoid waste.** Retries, runaway agent loops and duplicate calls can quietly multiply cost. Set limits and alerts.

## Build a range, not a number

Usage is uncertain, especially at launch. Give a **low, expected and high** estimate, state the assumptions behind each, and set a budget alert at the level that would surprise you. A single confident figure is the estimate most likely to be wrong.

## Try it now

Pick a use case from earlier in the track. Estimate input tokens (system prompt, retrieved content, history, question), output tokens and monthly requests. Put them into the estimator with prices from a provider's current price list (note the date), and produce a low, expected and high monthly figure.

You are done when you have three figures, the assumptions behind each, and the single lever that would cut the expected figure most.`,
      microCheck: [
        {
          question: "A chat assistant's cost per conversation keeps rising the longer conversations go on. What is the most likely reason?",
          options: [
            "Earlier turns are re-sent as input on every new request",
            "Providers raise the price per token as a chat goes on",
            "Output tokens become free after the first few replies",
            "The model retrains itself after each turn of the chat",
          ],
          correctIndex: 0,
          explanation:
            "Most chat systems resend conversation history each turn, so input tokens grow as the chat lengthens. Summarising or trimming history controls this.",
        },
        {
          question: "Using illustrative prices of 2 per million input and 10 per million output tokens, what does a request with 1,000 input and 500 output tokens cost?",
          options: [
            "0.007, from 0.002 for input plus 0.005 for output",
            "0.012, from adding the two prices then multiplying",
            "0.0015, from 1,500 tokens at one shared price each",
            "7.0, because prices are quoted per thousand tokens",
          ],
          correctIndex: 0,
          explanation:
            "Input: 1,000 × 2 / 1,000,000 = 0.002. Output: 500 × 10 / 1,000,000 = 0.005. Total 0.007. Input and output are priced separately.",
        },
        {
          question: "Which cost is easy to miss when estimating a RAG assistant's running cost?",
          options: [
            "Evaluation runs, monitoring and human review time",
            "The output tokens generated for every user answer",
            "The input tokens in the user's typed question itself",
            "The per-token price listed by the model provider",
          ],
          correctIndex: 0,
          explanation:
            "Token costs are visible on the bill. Evaluation, monitoring, storage, engineering and review time are real costs too, and can rival the model bill.",
        },
        {
          question: "Why give a low, expected and high estimate rather than one figure?",
          options: [
            "Usage is uncertain, and a range exposes the assumptions",
            "Providers require three estimates before giving access",
            "A single figure is always higher than the real cost",
            "Ranges make the project look cheaper to decision makers",
          ],
          correctIndex: 0,
          explanation:
            "Volumes and lengths at launch are guesses. A range with stated assumptions, plus a budget alert, is more honest and more useful than one confident number.",
        },
        {
          question: "A team's cost is dominated by a 6,000-token system prompt sent with every request. Which lever fits best?",
          options: [
            "Trim the prompt and use prompt caching where it is offered",
            "Increase output length so each request does more work",
            "Switch to a larger model that understands it more quickly",
            "Send the prompt twice so the model follows it more closely",
          ],
          correctIndex: 0,
          explanation:
            "A long, repeated prefix is exactly what trimming and prompt caching address. A larger model usually costs more per token, not less.",
        },
      ],
    },

    // ── Lesson 5.4 ────────────────────────────────────────────────────────
    {
      title: "Launching, monitoring and the human in the loop",
      objective:
        "Plan a launch with pre-launch evaluation, production monitoring and human-in-the-loop checkpoints designed as part of the whole system.",
      durationMinutes: 27,
      contentType: "article",
      bodyMd: `## Before launch: evidence, not enthusiasm

A demo that impresses a meeting is not evidence that a system is ready. Before launch, you want:

- **A test set** of realistic, edge and risky cases with expectations written first (Module 3), run on the final configuration: model, prompt, retrieval settings and all.
- **Must-pass checks** that are actually passing: no invented policy, no personal data in outputs, refusal of out-of-scope requests, resistance to prompt injection.
- **A comparison with the current way of working.** Faster than today, and at least as accurate? If you cannot say, you do not yet know whether it helps.
- **Known limits written down**, so users and support staff know what it does not do.
- **A limited first release.** A pilot with one team or a small share of users, with an easy way to report problems and a clear decision date.

## After launch: monitoring

Generative AI systems change even when you change nothing. Providers update or retire models, your content changes, and users ask things you did not anticipate. Monitor four layers:

1. **Operational**: errors, latency, uptime, cost per day and per request. Alerts on spikes.
2. **Quality**: rerun your test set on a schedule and after every change; sample real conversations for human review against the rubric; track user ratings and complaints.
3. **Inputs**: what users are actually asking. New topics or a shift in question types is a form of **drift**, like data drift in Module 1, and a sign your content or prompt needs updating.
4. **Outcomes**: the business metric the system exists to move (Module 3), with its paired counter-metric.

Log enough to investigate a problem (inputs, retrieved sources, outputs, model version), while respecting data protection rules on what you keep and for how long.

## Designing the human in the loop

"A human reviews it" is not a design. A real human-in-the-loop design answers:

- **Where is the checkpoint?** Before anything leaves the organisation, before money moves, before a decision about a person is final. Place it where errors are cheapest to catch.
- **What does the reviewer see?** The output, the sources it used, and a clear flag of uncertainty, so they can check rather than rubber-stamp.
- **What decides who reviews what?** All outputs, a random sample, or only those that trip a rule (low confidence, sensitive topic, high value)?
- **What happens to their corrections?** Do they feed back into prompts, content and test sets? If not, the same errors recur forever.
- **Is the workload realistic?** A reviewer facing 400 drafts an hour will approve them all.

That last point is a systems trap called **automation bias**: people come to trust an automated system and stop checking, especially when it is usually right. The safeguard decays exactly as the system seems to succeed. Counter it with manageable volumes, occasional known-bad test items to keep reviewers alert, and tracking how often reviewers change outputs (if it drops to zero, ask why).

## Seeing the whole loop

Put it together and an AI application is a loop, not a line:

**Inputs** (user questions, documents) → **model and retrieval** → **checks and human review** → **action or answer** → **outcomes** → **feedback** (ratings, corrections, monitoring) → back to **prompts, content and test sets**.

Each part has an owner. Where any link has no owner, the loop breaks: errors are seen but not fixed, or fixed but not tested. Delays matter too. If corrections take three months to reach the content, users lose trust in the meantime.

Map this loop for a system of your own in the tool below, marking owners and delays.

\`\`\`studio
loop-mapper
\`\`\`

## Try it now

\`\`\`try
Here is an AI system I am planning: [DESCRIBE WHAT IT DOES, WHO USES IT AND WHAT ACTIONS FOLLOW FROM ITS OUTPUT]. Draft a one-page launch and monitoring plan with: pre-launch evidence needed; pilot scope and decision date; monitoring across operations, quality, inputs and outcomes; and a human-in-the-loop design stating where the checkpoint sits, what the reviewer sees, what triggers review, how corrections feed back, and how to guard against automation bias.
\`\`\`

Edit the draft until every element names an owner. You are done when the plan fits on one page and each part of the loop has someone responsible for it.`,
      microCheck: [
        {
          question: "A team plans to launch an assistant to all customers after a well-received demo. What is the strongest objection?",
          options: [
            "A demo is not evidence; it needs a test set and a limited pilot first",
            "Demos always use a different model from the one that runs in production",
            "Customers should never be given access to any AI assistant at all",
            "The launch should wait until a newer model has been released",
          ],
          correctIndex: 0,
          explanation:
            "A demo shows chosen cases. A test set with edge and risky cases, and a limited pilot with a decision date, provide evidence before wide exposure.",
        },
        {
          question: "Reviewers approve almost every AI-drafted letter, and the rate at which they change drafts has fallen to nearly zero. What should you suspect?",
          options: [
            "Automation bias: reviewers may have stopped really checking",
            "The model has become perfect and review can now be removed",
            "The test set must have been deleted by mistake last month",
            "The drafts are too short for reviewers to find any problems",
          ],
          correctIndex: 0,
          explanation:
            "When people trust a usually-right system, checking decays. Manageable volumes, planted test items and tracking edit rates help keep review real.",
        },
        {
          question: "Users of a policy assistant start asking about a newly announced scheme that the content does not cover. Which monitoring layer catches this?",
          options: [
            "Input monitoring, which shows a shift in what users are asking",
            "Operational monitoring of latency, uptime and server error rates",
            "Cost monitoring of tokens used per day and per request",
            "Monitoring of how many times the model has been retrained",
          ],
          correctIndex: 0,
          explanation:
            "Tracking what users ask reveals new topics, a kind of drift. It signals that content or prompts need updating before answers go wrong.",
        },
        {
          question: "Where should a human checkpoint usually sit in an AI system that drafts replies to customers?",
          options: [
            "Before anything is sent outside the organisation",
            "After the customer has received and read the reply",
            "Only at the end of each quarter, as a summary review",
            "Before the model is first trained by its provider",
          ],
          correctIndex: 0,
          explanation:
            "Checkpoints belong where errors are cheapest to catch and before irreversible or external effects. Once a reply has been sent, the damage is done.",
        },
        {
          question: "Reviewers fix the same kind of error in AI drafts every week. What is missing from the design?",
          options: [
            "A route for corrections to feed back into prompts, content and tests",
            "A second reviewer to fix the same errors again after the first one does",
            "A larger model so the reviewers have more text to correct",
            "A rule that reviewers may not edit drafts, only approve them",
          ],
          correctIndex: 0,
          explanation:
            "Without a feedback route, corrections never change the system, so errors recur. Feeding them into prompts, content and test sets closes the loop.",
        },
      ],
    },

    // ── Lesson 5.5 ────────────────────────────────────────────────────────
    // Added after the original four so seed matching by position is stable.
    {
      title: "Customising and measuring a foundation model: methods, settings and scores",
      objective:
        "Distinguish the main ways of customising a foundation model, prepare data for fine-tuning, set inference parameters for a task, and choose suitable measures such as overlap scores, semantic similarity, benchmarks and human review.",
      durationMinutes: 27,
      contentType: "article",
      bodyMd: `## Under the bonnet of "fine-tuning"

Lesson 5.2 helped you decide whether to fine-tune. This lesson explains what the options actually are, how the data is prepared, which settings you control on every request, and how generated text is scored. You will meet these terms in vendor documentation and in conversations with engineers, so it pays to know what each one means.

All fine-tuning is a form of **transfer learning**: reusing what a model learned on one broad task as the starting point for a narrower one. That is why a few thousand examples can change a model that took vast amounts of data to build.

## Five ways to change a model

| Method | What happens | Typical use | Who usually does it |
|---|---|---|---|
| **Supervised (instruction) fine-tuning** | Train on pairs of input and ideal output | House format, tone, a specialised task | You, through a provider's service |
| **Parameter-efficient fine-tuning** | Train a small add-on set of weights instead of all of them; **LoRA** (low-rank adaptation) is a common method | The same goals, cheaper, with swappable add-ons | You or your engineers |
| **Continued pre-training** | Feed large volumes of unlabelled text from one domain | Absorbing the vocabulary of law, medicine or a technical field | Teams with a lot of domain text and compute |
| **Preference tuning** | People (or a model) rank alternative answers and the model is trained towards the preferred ones; **reinforcement learning from human feedback (RLHF)** is the best-known form | Helpfulness, safety, declining harmful requests | Mostly model providers |
| **Distillation** | A large model's outputs train a smaller, cheaper model | Speed and cost on a narrow task | You, if the licence allows it |

Two cautions. First, check the provider's terms: some forbid using outputs to train other models. Second, every one of these changes the model's weights, so it must be re-evaluated, and repeated when the base model is retired.

## Preparing the data

The quality of a fine-tune is mostly the quality of its examples.

- **Fit and consistent.** Each example shows exactly the behaviour you want, and labels follow one written guideline.
- **Representative.** Include the awkward cases, not just the easy ones, and the full range of people and situations the system will meet.
- **Held out.** Keep a test set that is never used in training, so you can measure honestly (Module 2).
- **Lawful and documented.** Remove personal data you do not need, confirm you have the right to use the content, and record where it came from (Module 6).

## Settings you control on every request

These **inference parameters** change behaviour without any training:

- **Temperature**: higher gives more varied output, lower gives more predictable output.
- **Top-p** (nucleus sampling): the model picks only from the smallest group of likely next tokens whose probabilities add up to p. Lower values make output more focused.
- **Top-k**: the model picks only from the k most likely next tokens.
- **Maximum output tokens**: a hard cap on length, and so on cost.
- **Stop sequences**: text that ends generation when it appears.

Providers usually advise adjusting temperature or top-p, not both at once. You also choose **real-time** or **batch** inference. Batch suits work that is not urgent, such as overnight classification, and at the time of writing (October 2026) several providers price it lower; check current terms.

## Scoring generated text

| Measure | How it works | Good for | Blind spot |
|---|---|---|---|
| **ROUGE** | Counts how much of a reference text's wording appears in the output | Summaries | Rewards matching words, not correct meaning |
| **BLEU** | Counts how much of the output's wording appears in reference translations | Translation | Penalises valid wording that differs |
| **Semantic similarity** (BERTScore is one example) | Compares meaning using embeddings (Module 4) | Paraphrases, short answers | Can miss a single wrong fact |
| **Public benchmarks** | Standard test sets shared across models | A rough first shortlist | May not resemble your task; may have leaked into training data |
| **Human review and rubrics** | People, or checked model judges, score against criteria (Module 3) | Quality that matters to users | Slower and costlier |

Automatic scores are cheap and repeatable, which makes them good for spotting regressions. They are poor at judging whether an answer is right or useful. A sound evaluation pairs at least one automatic score with human review on a sample.

## Try it now

\`\`\`try
I want to adapt a foundation model for this task: [DESCRIBE THE TASK, THE VOLUME AND WHAT GOOD OUTPUT LOOKS LIKE]. Which customisation method from this list fits, if any: better prompting, supervised fine-tuning, parameter-efficient fine-tuning, continued pre-training, distillation? Suggest starting values for temperature and maximum output tokens, say whether batch inference fits, and propose one automatic measure plus one human review step to evaluate it.
\`\`\`

Run the prompt for one task from your work. Check its advice against the tables above and correct anything that does not fit.

You are done when you have a chosen method (or a reason to stay with prompting), two parameter settings with reasons, and an evaluation that pairs an automatic score with human review.`,
      microCheck: [
        {
          question: "A team wants the benefits of fine-tuning but with lower training cost and the option to swap behaviours. Which method fits?",
          options: [
            "Parameter-efficient fine-tuning such as LoRA",
            "Continued pre-training on all of the company text",
            "Preference tuning with thousands of raters",
            "Raising temperature on every single request",
          ],
          correctIndex: 0,
          explanation:
            "Parameter-efficient methods train a small add-on set of weights, which is cheaper and lets you swap add-ons. Continued pre-training and preference tuning are far heavier undertakings.",
        },
        {
          question: "A summarisation system scores well on ROUGE, but reviewers find summaries that reverse the meaning of the source. Why can both be true?",
          options: [
            "ROUGE rewards shared words, not correct meaning",
            "ROUGE only works on translations, not summaries",
            "Reviewers are less reliable than automatic scores",
            "A high ROUGE score proves the summary is accurate",
          ],
          correctIndex: 0,
          explanation:
            "Overlap scores count matching wording, so a summary that reuses the source's words while flipping its meaning can still score well. Human review catches what overlap misses.",
        },
        {
          question: "An extraction task returns rambling answers and sometimes runs on far longer than needed. Which settings help most?",
          options: [
            "Lower temperature and a maximum output token cap",
            "Higher temperature and a larger top-k value",
            "Continued pre-training on longer documents",
            "Switching from batch to real-time inference",
          ],
          correctIndex: 0,
          explanation:
            "Lower temperature makes output more predictable and a token cap limits length and cost. Raising randomness or retraining does not address rambling output on a narrow task.",
        },
        {
          question: "Why must the test set for a fine-tune be kept out of the training examples?",
          options: [
            "Otherwise the score measures memory, not skill",
            "Otherwise the provider charges for that data twice",
            "Otherwise the model refuses to read the data",
            "Otherwise the fine-tune runs far too quickly",
          ],
          correctIndex: 0,
          explanation:
            "A model scored on examples it trained on can look excellent while failing on new cases. A held-out set gives an honest estimate of performance on unseen inputs.",
        },
        {
          question: "A firm classifies 100,000 archived documents once, with no deadline. Which choice reduces cost without lowering quality?",
          options: [
            "Run the work through batch inference",
            "Raise top-p so outputs vary more widely",
            "Use real-time calls with retries switched off",
            "Fine-tune a model before testing any prompt",
          ],
          correctIndex: 0,
          explanation:
            "Batch inference suits non-urgent bulk work and is often priced lower. Changing sampling or skipping retries does not reduce cost safely, and fine-tuning first skips the cheaper baseline.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "A public sector team must choose a model for a citizen help assistant. Which first step gives the most reliable comparison?",
      options: [
        "Run two or three shortlisted models on the team's own test set",
        "Choose whichever model topped the very latest public leaderboard",
        "Ask each vendor which of their models is the most accurate",
        "Pick the model with the largest context window available",
      ],
      correctIndex: 0,
      explanation:
        "Your own test set reflects your content, users and edge cases. Leaderboards and vendor claims measure other things.",
    },
    {
      question: "A live chat assistant feels sluggish to users even though its answers are good. Which measure should the team look at first?",
      options: [
        "Time to first token and total response time",
        "The number of parameters reported for the model",
        "The size of the training data the model used",
        "The number of documents held in the vector index",
      ],
      correctIndex: 0,
      explanation:
        "Latency is what users feel. Time to first token and total time show where the delay is; a smaller model or shorter outputs can help.",
    },
    {
      question: "A company wants an assistant to answer questions from its 2,000-page technical manual, which is updated monthly, with page references. What should it use?",
      options: [
        "RAG over the manual, with citations and monthly re-indexing",
        "Fine-tuning a model on the manual each and every time it is updated",
        "A prompt asking the model to recall the manual from memory",
        "Pre-training a new model on the manual and nothing else",
      ],
      correctIndex: 0,
      explanation:
        "Large, changing content with references is the classic RAG case. Fine-tuning would go stale between updates and cannot reliably cite pages.",
    },
    {
      question: "Using illustrative prices of 0.50 per million input and 2.00 per million output tokens, roughly what do 100,000 requests of 2,000 input and 200 output tokens cost?",
      options: [
        "140, from 100 for input plus 40 for output",
        "250, from adding both prices for each request",
        "1,400, from pricing tokens per hundred thousand",
        "14, from counting only the output token cost",
      ],
      correctIndex: 0,
      explanation:
        "Input: 2,000 × 100,000 × 0.50 / 1,000,000 = 100. Output: 200 × 100,000 × 2.00 / 1,000,000 = 40. Total 140.",
    },
    {
      question: "Which is the clearest sign that fine-tuning might be justified?",
      options: [
        "Well-tested prompts still give inconsistent format at high volume",
        "The model does not know the company's latest price list",
        "The team has not yet written a test set for the task",
        "A vendor says fine-tuned models are always more accurate",
      ],
      correctIndex: 0,
      explanation:
        "Fine-tuning targets behaviour at scale after prompting has been pushed and measured. Missing facts call for retrieval, and without a test set there is no baseline.",
    },
    {
      question: "An AI system has excellent pre-launch test results, but six months later answer quality has fallen though nobody changed the prompt. What is a likely cause?",
      options: [
        "The model version, content or user questions have changed",
        "Test results always fall by the same amount every six months",
        "Prompts wear out and must be rewritten word for word yearly",
        "The context window shrinks as the system gets more usage",
      ],
      correctIndex: 0,
      explanation:
        "Provider updates, content changes and shifts in what users ask all change behaviour. Scheduled reruns of the test set and input monitoring catch this.",
    },
    {
      question: "A manager's cost estimate for an assistant uses only the user's question as input tokens. What has been missed?",
      options: [
        "The system prompt, retrieved passages and resent history",
        "The output tokens, which are always free for chat assistants",
        "The cost of pre-training, which is charged to each user",
        "Nothing, because only the user's question is ever charged",
      ],
      correctIndex: 0,
      explanation:
        "Every request carries the system prompt, retrieved content and usually conversation history. These often dwarf the user's question.",
    },
    {
      question: "Which human-in-the-loop design is strongest for an AI that drafts decisions on benefit applications?",
      options: [
        "A caseworker reviews each draft with its sources before it is final",
        "A manager skims a weekly summary of the AI's approved decisions",
        "Applicants may appeal later if the AI's decision seems to be wrong",
        "The AI decides alone but logs each decision for later audit",
      ],
      correctIndex: 0,
      explanation:
        "Decisions about people need review before they take effect, with the evidence visible. Weekly summaries, appeals and audits come too late to prevent harm.",
    },
    {
      question: "Which lever most directly reduces cost for a high-volume task where a small model passes all the tests?",
      options: [
        "Route requests to the small model instead of a large one",
        "Add more retrieved passages to every request to be safe",
        "Ask for longer answers so that users ask fewer questions overall",
        "Raise the temperature so the model answers more briefly",
      ],
      correctIndex: 0,
      explanation:
        "Right-sizing the model is often the biggest lever. More passages and longer answers raise cost, and temperature does not control length.",
    },
    {
      question: "Why should test sets, prompts and evaluation be kept separate from any one provider's tools where possible?",
      options: [
        "So the team can switch models by rerunning tests, not rebuilding",
        "Because providers do not allow tests to be stored on their systems",
        "So that every model gives identical answers to the same prompts",
        "Because evaluation tools from providers are always inaccurate",
      ],
      correctIndex: 0,
      explanation:
        "Models and prices change often. Provider-neutral tests and prompts make switching a controlled, evidence-based change.",
    },
    {
      question: "A pilot's success measure is 'number of AI drafts approved'. What is the risk, and what would you pair it with?",
      options: [
        "It can be gamed by rubber-stamping; pair it with an edit or error rate",
        "It is too hard to count; replace it with the model's AUC score instead",
        "It is always accurate; no paired measure is needed at all",
        "It measures cost; pair it with the price per million tokens",
      ],
      correctIndex: 0,
      explanation:
        "Approval counts rise if reviewers stop checking. Pairing with errors found later, or the rate of edits, exposes rubber-stamping.",
    },
    {
      question: "A legal publisher has millions of pages of case law and wants a model fluent in its terminology before any task-specific training. Which method matches this goal?",
      options: [
        "Continued pre-training on the unlabelled case law",
        "Distillation from a smaller, cheaper open model",
        "Lowering top-k so the model picks fewer tokens",
        "Preference tuning with a handful of rankings",
      ],
      correctIndex: 0,
      explanation:
        "Continued pre-training on large volumes of domain text helps a model absorb a field's vocabulary. Sampling settings and small preference sets do not add domain knowledge.",
    },
    {
      question: "A translation feature is compared across two models using BLEU alone. What should be added before choosing?",
      options: [
        "Review of a sample by fluent human speakers",
        "A higher temperature for both models in tests",
        "A public benchmark on unrelated maths problems",
        "A longer maximum output token limit for both",
      ],
      correctIndex: 0,
      explanation:
        "BLEU penalises valid wording that differs from the references and cannot judge whether meaning survived. Fluent reviewers on a sample catch what the score misses.",
    },
  ],
}];
