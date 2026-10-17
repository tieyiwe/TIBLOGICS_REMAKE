import type { SeedModule } from "../types";

// AI and Machine Learning Fundamentals. Module 3: Evaluating Models.
// All organisations and figures in examples are fictional and illustrative.

export const ML_MODULE_3: SeedModule[] = [{
  title: "Evaluating Models",
  summary:
    "Read a confusion matrix and choose between accuracy, precision, recall and F1; understand thresholds, ROC and AUC, and regression error measures; evaluate generative AI with test sets, rubrics, human review and checked model judges; and keep model metrics tied to business outcomes.",
  lessons: [
    // ── Lesson 3.1 ────────────────────────────────────────────────────────
    {
      title: "Accuracy, precision, recall and the confusion matrix",
      objective:
        "Calculate accuracy, precision, recall and F1 from a confusion matrix, and choose the metric that matches the cost of each kind of error.",
      durationMinutes: 27,
      contentType: "mixed",
      bodyMd: `## Why accuracy is not enough

**Accuracy** is the share of predictions that were right. It sounds like the obvious measure, and for balanced problems it is a fair start. But imagine a fraud model where 1 transaction in 100 is fraudulent. A model that says "not fraud" every single time is 99% accurate and catches nothing. On **imbalanced data**, where one outcome is rare, accuracy can look excellent while the model is useless.

To see what is really happening, you need the confusion matrix.

## The confusion matrix

For a yes or no prediction (call "yes" the **positive** class, such as "fraud"), every prediction lands in one of four boxes:

| | Actually positive | Actually negative |
|---|---|---|
| **Predicted positive** | True positive (TP) | False positive (FP) |
| **Predicted negative** | False negative (FN) | True negative (TN) |

- A **false positive** is a false alarm: a genuine transaction flagged as fraud.
- A **false negative** is a miss: a fraudulent transaction let through.

From those four numbers come the metrics that matter:

- **Accuracy** = (TP + TN) / everything. How often it is right overall.
- **Precision** = TP / (TP + FP). When it says "positive", how often is it right? High precision means few false alarms.
- **Recall** (also called sensitivity, or true positive rate) = TP / (TP + FN). Of all the real positives, how many did it catch? High recall means few misses.
- **F1 score** = the harmonic mean of precision and recall: 2 × P × R / (P + R). A single number that is only high when both are reasonably high.

## Which errors cost more?

Choosing a metric is a business decision, because it depends on what each mistake costs.

- **Recall matters most** when misses are expensive: screening for a serious illness, detecting safety faults, catching fraud before money leaves. You accept more false alarms to catch more real cases.
- **Precision matters most** when false alarms are expensive: blocking a customer's card, sending an investigator out, auto-rejecting a job applicant. You accept some misses to avoid wrongly acting on innocent cases.
- **F1** is a reasonable single summary when both matter and you need to compare models, but always look at precision and recall separately too.

There is usually a trade-off. Make the model flag more cases and recall rises while precision falls. Make it stricter and precision rises while recall falls. The next lesson shows how that trade-off is controlled.

## Try the numbers

Change the four counts below and watch the metrics move. Start with the "always says no" fraud model: TP 0, FP 0, FN 10, TN 990.

\`\`\`playground
<!doctype html>
<html>
<body style="font-family: sans-serif; padding: 12px">
  <h3>Confusion matrix calculator</h3>
  <label>TP <input id="tp" type="number" value="40" style="width:70px"></label>
  <label>FP <input id="fp" type="number" value="20" style="width:70px"></label>
  <label>FN <input id="fn" type="number" value="10" style="width:70px"></label>
  <label>TN <input id="tn" type="number" value="930" style="width:70px"></label>
  <button onclick="calc()">Calculate</button>
  <pre id="out"></pre>
  <script>
    function pct(x) { return isFinite(x) ? (x * 100).toFixed(1) + "%" : "n/a"; }
    function calc() {
      var tp = Number(document.getElementById("tp").value);
      var fp = Number(document.getElementById("fp").value);
      var fn = Number(document.getElementById("fn").value);
      var tn = Number(document.getElementById("tn").value);
      var total = tp + fp + fn + tn;
      var accuracy = (tp + tn) / total;
      var precision = tp / (tp + fp);
      var recall = tp / (tp + fn);
      var f1 = 2 * precision * recall / (precision + recall);
      document.getElementById("out").textContent =
        "Accuracy:  " + pct(accuracy) + "\\n" +
        "Precision: " + pct(precision) + "\\n" +
        "Recall:    " + pct(recall) + "\\n" +
        "F1:        " + pct(f1);
    }
    calc();
  </script>
</body>
</html>
\`\`\`

With TP 0, FP 0, FN 10, TN 990, accuracy is 99% and recall is 0%. That single example is worth remembering whenever someone quotes accuracy alone.

## Beyond two classes

When there are several categories (routing tickets to five teams, for example), you can build a larger confusion matrix and calculate precision and recall for each category. Averages across categories can hide one category that performs badly, so look at each one, especially small ones.

## Try it now

Pick a yes or no prediction from your work (or use: "flag invoices likely to be fraudulent"). Write down:

1. What is a false positive here, and what does it cost?
2. What is a false negative, and what does it cost?
3. Which metric you would prioritise, and the minimum you would accept for the other.

You are done when you can say, in one sentence, why your chosen metric fits the cost of mistakes, and you have checked your reasoning with the calculator using made-up counts.`,
      microCheck: [
        {
          question: "A model that screens for a rare but serious fault reports 98% accuracy. Faults occur in about 2% of items. What should you ask first?",
          options: [
            "What its recall is, since predicting 'no fault' always scores 98%",
            "Whether 98% accuracy is higher than last year's figure was",
            "How long the model took to train on the full dataset",
            "Whether the accuracy was calculated using percentages",
          ],
          correctIndex: 0,
          explanation:
            "On imbalanced data a model that never predicts the rare class can match the base rate. Recall shows how many real faults it catches, which is what matters here.",
        },
        {
          question: "A model flags 50 transactions as fraud. 30 are real fraud. What is its precision?",
          options: [
            "30%, because 30 out of 100 is the precision",
            "60%, because 30 of the 50 flagged were correct",
            "40%, because 20 of the 50 flagged were wrong",
            "It cannot be known without the true negatives",
          ],
          correctIndex: 1,
          explanation:
            "Precision is true positives divided by everything predicted positive: 30 / 50 = 60%. True negatives are not needed for precision.",
        },
        {
          question: "An airline's model automatically cancels bookings it thinks are fraudulent, upsetting genuine customers. Which metric deserves most weight?",
          options: [
            "Precision, because false alarms harm genuine customers",
            "Recall, because every fraud must be caught at any cost",
            "Accuracy, because it combines all four outcomes fairly",
            "Training speed, because cancellations need to be fast",
          ],
          correctIndex: 0,
          explanation:
            "When acting on a false positive is costly, precision matters most. You accept some missed fraud rather than cancel many genuine bookings.",
        },
        {
          question: "What does a high F1 score tell you?",
          options: [
            "Both precision and recall are reasonably high",
            "Accuracy is high, whatever precision and recall are",
            "The model has very few true negatives in its results",
            "Recall is high, even if precision is close to zero",
          ],
          correctIndex: 0,
          explanation:
            "F1 is the harmonic mean of precision and recall, so it is only high when both are. A very low value in either drags F1 down.",
        },
        {
          question: "A ticket-routing model has good average precision across five teams. Why look at each team separately?",
          options: [
            "Averages can hide one team's category performing badly",
            "Precision cannot be calculated for more than two classes",
            "Each team needs a separately trained model by law",
            "The average is always lower than any single team's score",
          ],
          correctIndex: 0,
          explanation:
            "A strong average can mask a small category with poor results. Per-category precision and recall show where the model fails.",
        },
      ],
    },

    // ── Lesson 3.2 ────────────────────────────────────────────────────────
    {
      title: "Thresholds, ROC curves and regression errors",
      objective:
        "Explain how a decision threshold trades precision against recall, interpret ROC curves and AUC at an intuitive level, and choose an error measure for a numeric prediction.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## Scores, not verdicts

Most classification models do not output "yes" or "no". They output a **score**, often a probability between 0 and 1: "this claim has a 0.72 chance of being fraudulent". A **threshold** turns the score into a decision. Above 0.5, flag it; below, let it through.

That threshold is a business choice, not a technical fact. Lower it to 0.3 and the model flags more cases: recall rises (fewer misses) and precision usually falls (more false alarms). Raise it to 0.8 and the reverse happens. The same model can serve very different purposes depending on where you set the line.

A practical way to choose: decide what each false positive and false negative costs, and what capacity you have. If your team can review 100 flagged cases a day, set the threshold so roughly 100 are flagged, then check the recall you get at that level.

## ROC curves and AUC

A **ROC curve** (receiver operating characteristic, a name from radar engineering) shows the trade-off across every possible threshold. It plots:

- The **true positive rate** (recall) on one axis.
- The **false positive rate** (the share of genuine negatives wrongly flagged) on the other.

A model that guesses at random traces a diagonal line. A useful model bows up towards the top-left corner: it catches many positives before raising many false alarms.

**AUC** (area under the curve) summarises the whole curve in one number from 0 to 1.

- **0.5** means no better than random guessing.
- **1.0** means perfect separation.
- In between, higher is better. One intuitive reading: AUC is the chance that the model gives a randomly chosen positive case a higher score than a randomly chosen negative case.

AUC is useful for comparing models without committing to a threshold. But it has limits. It says nothing about the threshold you will actually use, and on very imbalanced data a high AUC can still go with poor precision at practical thresholds. Engineers sometimes use a **precision-recall curve** instead for rare-event problems. You do not need to draw these curves; you need to ask "at the threshold we will use, what are precision and recall?"

## Errors for numeric predictions

For regression (predicting a number), there is no confusion matrix. Instead you measure how far off the predictions are.

- **Mean absolute error (MAE)**: the average size of the errors, in the original units. "On average, our delivery time predictions are off by 12 minutes." Easy to explain.
- **Root mean squared error (RMSE)**: squares errors before averaging, then takes the square root. It punishes large errors more heavily. Use it when a few big misses are much worse than many small ones.
- **Mean absolute percentage error (MAPE)**: the average error as a percentage of the actual value. Handy for comparing across products of different sizes, but it behaves badly when actual values are near zero.
- **R squared**: roughly, the share of variation in the outcome that the model explains, from 0 (none) to 1 (all). Useful, but a high R squared does not guarantee useful predictions.

## Which error measure fits?

Imagine a bakery predicting daily demand for each product.

- For staff planning, MAE in loaves is easy to discuss: "we are typically off by 8 loaves".
- If running out on a busy day is far worse than a few spare loaves, RMSE highlights the occasional large miss.
- Comparing a product that sells 500 a day with one that sells 20, MAPE puts them on the same scale.

Also ask whether errors are **biased**: does the model consistently over-predict or under-predict? Average error can be small while every prediction leans the same way, which matters if, say, under-prediction means empty shelves.

\`\`\`try
I have a model that predicts [WHAT, e.g. delivery time in minutes]. Errors in one direction cost [COST OF UNDER-PREDICTING] and in the other [COST OF OVER-PREDICTING]. Explain in plain English which error measure (MAE, RMSE, MAPE) I should report to managers, which I should use to compare models, and what extra check I need for consistently biased errors.
\`\`\`

## Try it now

For a classification problem from your work, write down the team's daily review capacity and use it to describe how you would choose a threshold. For a numeric prediction, choose MAE, RMSE or MAPE and justify it in two sentences.

You are done when both choices are tied to a cost or capacity you can name, not to which number looks best.`,
      microCheck: [
        {
          question: "A team lowers its fraud model's threshold from 0.6 to 0.3. What usually happens?",
          options: [
            "Recall rises and precision usually falls",
            "Precision rises and recall usually falls",
            "Both precision and recall rise together",
            "Nothing changes, as the model is the same",
          ],
          correctIndex: 0,
          explanation:
            "A lower threshold flags more cases, catching more real fraud (higher recall) but also more genuine cases (lower precision). The model is the same; the decision rule changed.",
        },
        {
          question: "A model has an AUC of 0.5. What does this mean?",
          options: [
            "It separates positives from negatives no better than chance",
            "It is correct for exactly half of all its predictions",
            "It has perfect recall but only half the possible precision",
            "It needs a threshold of 0.5 to work as it was designed",
          ],
          correctIndex: 0,
          explanation:
            "An AUC of 0.5 is the random-guessing line. It is a ranking measure, not the share of correct predictions.",
        },
        {
          question: "Occasional large errors in a demand forecast cause stock-outs that cost far more than small errors. Which measure highlights this?",
          options: [
            "RMSE, because squaring punishes large errors more",
            "MAE, because it treats every error size the same",
            "Accuracy, because it counts the correct forecasts",
            "AUC, because it covers every possible threshold",
          ],
          correctIndex: 0,
          explanation:
            "RMSE squares errors before averaging, so big misses weigh more. MAE treats all errors linearly; accuracy and AUC are classification measures.",
        },
        {
          question: "A review team can handle about 80 flagged cases a day. How should this inform the threshold?",
          options: [
            "Set it so roughly 80 are flagged, then check the recall",
            "Always use 0.5, because capacity is not a model concern",
            "Set it as low as possible so that every case is flagged",
            "Ignore capacity and simply maximise the AUC value",
          ],
          correctIndex: 0,
          explanation:
            "The threshold is a business choice. Matching it to review capacity, then checking the precision and recall that result, ties the model to how it will really be used.",
        },
        {
          question: "A delivery model's average error is small, but it under-predicts delivery times almost every time. Why does this matter?",
          options: [
            "Consistent bias can mislead customers even if the average is small",
            "It does not matter, because a small average error is enough",
            "It means the model is overfitting, so it must be made larger",
            "It shows the model should be switched to classification now",
          ],
          correctIndex: 0,
          explanation:
            "Errors that always lean one way are biased. Customers would routinely get later deliveries than promised, which a single average can hide.",
        },
      ],
    },

    // ── Lesson 3.3 ────────────────────────────────────────────────────────
    {
      title: "Evaluating generative AI",
      objective:
        "Design an evaluation for a generative AI system using a test set, a rubric, human review and a checked model-as-judge.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## Why generative AI is harder to score

A fraud model's answer is right or wrong. A generated summary, email or answer can be right in many ways and wrong in many subtle ones: accurate but rude, fluent but invented, helpful but too long. There is rarely a single correct output to compare against. So generative AI evaluation combines several methods, and it has to be designed deliberately.

## Start with a test set

A **test set** for generative AI is a collection of realistic inputs, each with a note of what a good output must and must not do. It should include:

- **Typical cases**: what most users will send.
- **Edge cases**: very short or very long inputs, ambiguous requests, other languages, missing information.
- **Hard or risky cases**: questions the system should refuse or escalate, inputs containing instructions that try to hijack the system (prompt injection, Module 6), sensitive topics.

Write the expectations **before** running the system, so you are not persuaded by whatever it produces. Thirty well-chosen cases tell you more than three hundred random ones. Keep the set and rerun it whenever the prompt, model or data changes, to catch **regressions** (things that used to work and now do not).

## Checks and rubrics

Two kinds of criteria work together.

- **Pass/fail checks** are observable: "under 150 words", "cites a source document", "does not promise a refund", "valid JSON". Some can be automated with simple code. Mark the ones that must always pass.
- **Rubrics** score qualities of degree on a scale, with each level described by what you would see: "3: answers the question fully using only the provided policy; 2: answers mostly but adds one unsupported detail; 1: misses the question or invents policy."

Common rubric dimensions for generative AI are **correctness**, **groundedness** (is every claim supported by the source material?), **completeness**, **relevance**, **tone and format**, and **safety**.

## Human review

People remain the reference standard for judging quality, especially for tone, nuance and domain correctness. But human review is slow and inconsistent unless it is organised:

- Give reviewers the rubric and a few scored examples.
- Have two people score a sample independently and compare. If they disagree often, the rubric needs sharpening.
- Hide which version produced each output when comparing two variants (**blind comparison**), so reviewers are not swayed.

## Model as judge, with checks

Scoring hundreds of outputs by hand is costly, so teams often use another model to score outputs against the rubric. This is called **LLM-as-judge**. It is useful and scalable, but it has known weaknesses: judges can favour longer answers, favour outputs in their own style, be swayed by the order in which answers are shown, and miss factual errors they cannot verify.

Treat the judge as a measuring instrument that needs calibrating:

1. **Calibrate against people.** Have humans score a sample, run the judge on the same sample, and check how often they agree. Only rely on the judge where agreement is good.
2. **Give it the rubric and the source.** A judge checking groundedness needs the documents the answer should be based on.
3. **Ask for reasons before the score**, so you can audit its judgements.
4. **Swap the order** in pairwise comparisons, and use a different model from the one being judged where you can.
5. **Keep spot-checking.** A sample of judge decisions should still be reviewed by people over time.

Practise building a small test bench for a prompt below.

\`\`\`studio
test-bench
\`\`\`

## Try it now

Choose a generative AI use you have seen or might build (meeting summaries, a policy question answerer, product descriptions). Then:

\`\`\`try
I want to evaluate a generative AI system that [WHAT IT DOES] for [WHO]. Draft:
1. Ten test inputs: five typical, three edge cases and two risky ones.
2. For each, one sentence on what a good output must and must not do.
3. Four pass/fail checks, marking which must always pass.
4. A three-level rubric for groundedness.
Do not run the system; just design the evaluation.
\`\`\`

Then review what it produced: delete any unrealistic cases and correct any wrong expectations. You are done when you have a test set of at least ten cases with expectations you agree with, and one sentence on how you would check a model judge against human scores.`,
      microCheck: [
        {
          question: "Why should expectations for each test case be written before running the system?",
          options: [
            "So you are not swayed by whatever the system happens to produce",
            "Because the system cannot run until all expectations are stored",
            "So the expectations can be used to train the model directly",
            "Because rubrics are not allowed once outputs have been seen",
          ],
          correctIndex: 0,
          explanation:
            "Writing expectations first keeps the standard independent of the output. Otherwise a fluent but wrong answer can quietly become the benchmark.",
        },
        {
          question: "A team uses a model to judge which of two answers is better and notices it nearly always prefers the first one shown. What should they do?",
          options: [
            "Swap the order and calibrate the judge against human scores",
            "Always show the preferred answer first to save on costs",
            "Replace the rubric with a simple instruction to pick the best one",
            "Stop human review entirely, since the judge is consistent",
          ],
          correctIndex: 0,
          explanation:
            "Position bias is a known judge weakness. Swapping order and checking agreement with people shows whether the judge can be trusted.",
        },
        {
          question: "Which is a pass/fail check rather than a rubric criterion?",
          options: [
            "The reply never promises a refund before approval",
            "The reply is warm and appropriately reassuring",
            "The reply explains the whole policy clearly and fully",
            "The reply reads naturally for a busy customer",
          ],
          correctIndex: 0,
          explanation:
            "Whether a refund is promised can be observed as yes or no. Warmth, clarity and natural reading are qualities of degree better scored on a rubric.",
        },
        {
          question: "Two reviewers scoring the same outputs disagree on most of them. What does this suggest?",
          options: [
            "The rubric needs clearer level descriptions and examples",
            "One of the reviewers should be replaced by a model judge",
            "The test set is too small to be scored by any people",
            "The system is performing perfectly and needs no review",
          ],
          correctIndex: 0,
          explanation:
            "Low agreement usually means the rubric is vague. Describing each level by what you would observe, with scored examples, makes judgements consistent.",
        },
        {
          question: "Why rerun the same test set after changing the prompt or the model?",
          options: [
            "To catch regressions where things that worked now fail",
            "Because the test set expires after every single run",
            "To give the model more practice on the same inputs",
            "Because each rerun steadily increases the model's accuracy",
          ],
          correctIndex: 0,
          explanation:
            "Changes can fix one case and break another. Rerunning a fixed set on every change shows regressions before users meet them.",
        },
      ],
    },

    // ── Lesson 3.4 ────────────────────────────────────────────────────────
    {
      title: "Business metrics versus model metrics",
      objective:
        "Connect model metrics to the business outcome they are meant to serve, and anticipate how a measure can be gamed once it becomes a target.",
      durationMinutes: 23,
      contentType: "article",
      bodyMd: `## A good model can still be a bad project

Model metrics (precision, recall, error, rubric scores) tell you how well the model performs its narrow task. They do not tell you whether the business is better off. A churn model with excellent recall delivers nothing if the retention team never calls the people it flags. A support assistant with high rubric scores fails if customers still phone back.

So every project needs two layers of measurement:

- **Model metrics**: is the model doing its task well?
- **Business metrics**: is the outcome we care about improving? Revenue kept, hours saved, complaints reduced, errors avoided, customers served faster.

And a link between them that someone has thought through.

## Build the chain from model to outcome

Write the chain out explicitly. For the churn example:

1. The model identifies members likely to cancel (recall and precision at the chosen threshold).
2. The retention team calls the top flagged members each week (call completion rate).
3. Some of those members are persuaded to stay (save rate).
4. Fewer members cancel overall than would have without the programme (the business outcome).

Each link can break. The model can be good and the calls never happen. The calls can happen and nobody is persuaded. And the hardest question: would those members have stayed anyway? To know whether the model caused the improvement, compare with a group that was not contacted, ideally chosen at random (a **controlled experiment** or **A/B test**). Without a comparison, you cannot tell the model's effect from the season, a price change or luck.

## Goodhart's law

The economist Charles Goodhart's observation is usually paraphrased as: **when a measure becomes a target, it ceases to be a good measure.** People, and optimising systems, find ways to hit the number that do not achieve the purpose.

Imagine these:

- A support team is measured on "tickets closed by the AI assistant". Tickets get closed, but customers simply reopen new ones.
- A model is tuned to maximise "conversations handled". Conversations get longer and more frequent, which looks like success while customers struggle.
- A content model is rewarded for "time spent on page", and learns that confusing pages keep people longer.

Machine learning makes Goodhart's law sharper, because a model optimises its objective relentlessly and without common sense. Reinforcement learning agents gaming their rewards (Module 1) are the same pattern.

## Defences

- **Pair metrics that pull against each other.** Tickets closed **and** reopen rate. Speed **and** quality score. Recall **and** precision.
- **Measure the outcome, not just the activity.** Problems solved, not conversations held.
- **Keep a human look at real cases.** Read a sample of outputs and outcomes every month, not only the dashboard.
- **Ask who could game it, and how**, before you launch, including the model itself.
- **Watch for delays.** Some effects (customer trust, staff skills) show up months later. Plan a later review rather than declaring victory at week two.

Map the chain from model to outcome, and the loops that could game it, in the tool below.

\`\`\`studio
loop-mapper
\`\`\`

## Try it now

\`\`\`try
I am planning an AI system that [WHAT IT DOES]. The model metric we will track is [MODEL METRIC] and the business outcome we want is [OUTCOME]. Write the chain of links from model to outcome, name the metric at each link, then act as someone who wants to hit the targets without delivering the outcome: list three ways the metrics could be gamed, and a paired metric that would expose each.
\`\`\`

You are done when you have a written chain of at least three links, one paired metric for each gameable measure, and a note of how you would know whether the outcome would have happened anyway.`,
      microCheck: [
        {
          question: "A churn model has strong recall, but cancellations have not fallen. What is the most useful next step?",
          options: [
            "Check each link from flagged member to retention call to outcome",
            "Retrain the model to push its recall even higher than it is now",
            "Switch to a deep learning model to improve its precision",
            "Report the recall figure as proof that the project worked",
          ],
          correctIndex: 0,
          explanation:
            "Model performance is only one link. The calls may not happen or may not persuade anyone. Tracing the chain shows where value is lost.",
        },
        {
          question: "An AI assistant is targeted on 'tickets closed', and closures rise while reopened tickets rise too. Which idea explains this?",
          options: [
            "Goodhart's law: the measure became a target and was gamed",
            "Concept drift: the meaning of the tickets changed over time",
            "Underfitting: the model was too simple for the task",
            "Leakage: closure data was used as a training feature",
          ],
          correctIndex: 0,
          explanation:
            "Once closures were the target, the system found ways to close tickets without solving problems. Pairing closures with reopen rate exposes this.",
        },
        {
          question: "How can a team tell whether a retention programme actually caused fewer cancellations?",
          options: [
            "Compare with a similar group that was not contacted",
            "Check whether the model's precision rose over time",
            "Ask the retention team whether they felt it had worked",
            "Count how many calls were made in the first month",
          ],
          correctIndex: 0,
          explanation:
            "Without a comparison group, ideally randomly chosen, you cannot separate the programme's effect from seasonality, pricing or chance.",
        },
        {
          question: "Which pair of metrics best guards against gaming a 'speed of reply' target for an AI assistant?",
          options: [
            "Speed of reply paired with a quality score from review",
            "Speed of reply paired with the total number of replies",
            "Speed of reply paired with the length of each reply",
            "Speed of reply paired with the server's response time",
          ],
          correctIndex: 0,
          explanation:
            "Metrics that pull against each other expose gaming. Faster but worse replies would show up as a falling quality score.",
        },
        {
          question: "Why plan a review months after launch, not only at week two?",
          options: [
            "Some effects, like trust or staff skills, appear after delays",
            "Models always perform worse in their first two weeks of use",
            "Regulators always require a review after exactly six months of use",
            "Early results are always too positive to be worth reading",
          ],
          correctIndex: 0,
          explanation:
            "Delays are a core systems idea: some consequences take months to show. A later review catches effects an early snapshot misses.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "A model to detect a rare equipment fault is 99% accurate. Faults happen in 1% of cases. What is the most important missing information?",
      options: [
        "Its recall and precision on the fault class",
        "The size of the training set used in months",
        "The number of features the model considered",
        "Whether the accuracy was rounded to one place",
      ],
      correctIndex: 0,
      explanation:
        "With a 1% fault rate, predicting 'no fault' every time scores 99%. Only recall and precision on the rare class show whether the model is useful.",
    },
    {
      question: "From a confusion matrix: TP 40, FP 10, FN 40, TN 910. What is the recall?",
      options: [
        "50%, because 40 of the 80 real positives were caught",
        "80%, because 40 of the 50 flagged were real positives",
        "95%, because 950 of the 1,000 predictions were right",
        "40%, because 40 is the number of true positives found",
      ],
      correctIndex: 0,
      explanation:
        "Recall is TP / (TP + FN) = 40 / 80 = 50%. 80% is the precision (40 / 50) and 95% is the accuracy.",
    },
    {
      question: "A medical screening tool must miss as few real cases as possible; follow-up tests are cheap. What should the team prioritise?",
      options: [
        "High recall, accepting more false alarms",
        "High precision, accepting more missed cases",
        "High accuracy, regardless of the class balance",
        "The lowest possible number of flagged cases",
      ],
      correctIndex: 0,
      explanation:
        "When misses are costly and false alarms are cheap to resolve, recall matters most. A lower threshold catches more real cases.",
    },
    {
      question: "What does an AUC of 0.85 most directly tell you?",
      options: [
        "The model ranks positives above negatives fairly well",
        "The model is correct for 85% of all its predictions",
        "The model's precision at a 0.5 threshold is 85%",
        "The model will catch 85% of positives in real use",
      ],
      correctIndex: 0,
      explanation:
        "AUC measures how well scores separate positives from negatives across all thresholds. It is not accuracy, precision or recall at any specific threshold.",
    },
    {
      question: "Which error measure is easiest to explain to managers as 'on average we are off by this much'?",
      options: [
        "Mean absolute error, in the original units",
        "Root mean squared error, after squaring",
        "R squared, as a share of explained variation",
        "AUC, as an area under the ROC curve",
      ],
      correctIndex: 0,
      explanation:
        "MAE is the average size of errors in the same units as the prediction, such as minutes or loaves, so it is the most intuitive to report.",
    },
    {
      question: "A team evaluates its new support chatbot by reading five answers it produced and agreeing they look good. What is the biggest weakness?",
      options: [
        "No designed test set with expectations, edge or risky cases",
        "Five answers is too many for a person to read carefully",
        "The answers should have been scored by accuracy instead",
        "Reading answers is unnecessary when users seem happy",
      ],
      correctIndex: 0,
      explanation:
        "A handful of outputs judged after the fact proves little. A test set with expectations written first, including edge and risky cases, gives evidence.",
    },
    {
      question: "Before relying on a model-as-judge to score thousands of outputs, what should a team do?",
      options: [
        "Check its scores agree with human scores on a sample",
        "Ask the judge model itself whether it is reliable enough",
        "Use the same model that produced the outputs to judge",
        "Remove the rubric so the judge can use its own taste",
      ],
      correctIndex: 0,
      explanation:
        "A judge is a measuring instrument that needs calibrating against people. Self-judging and rubric-free judging make bias more likely.",
    },
    {
      question: "Which rubric dimension asks whether every claim in a generated answer is supported by the source documents?",
      options: [
        "Groundedness against the sources",
        "Relevance to the question asked",
        "Fluency of the written language",
        "Tone suited to the audience",
      ],
      correctIndex: 0,
      explanation:
        "Groundedness checks that claims are supported by the provided material. An answer can be relevant and fluent while still inventing facts.",
    },
    {
      question: "A recommendation model is rewarded for 'time spent on page'. Pages become harder to navigate. What happened?",
      options: [
        "The model optimised a proxy measure against the real goal",
        "The model underfitted because the pages were too simple",
        "The model's AUC fell because of a change of threshold",
        "The data was split by time instead of being split at random",
      ],
      correctIndex: 0,
      explanation:
        "This is Goodhart's law: time on page was a stand-in for value, and optimising it directly produced confusion rather than engagement.",
    },
    {
      question: "A model's precision rose after the threshold was raised. What else should you check?",
      options: [
        "Whether recall fell to a level the business cannot accept",
        "Whether the training data was changed to match the threshold",
        "Whether the AUC rose by the same amount as the precision",
        "Whether accuracy is now exactly equal to the precision",
      ],
      correctIndex: 0,
      explanation:
        "Raising the threshold usually trades recall for precision. The model is unchanged, so AUC is unchanged; what matters is whether the lost recall is acceptable.",
    },
    {
      question: "Which pair of measures best represents both layers of evaluation for an invoice-checking model?",
      options: [
        "Recall on invalid invoices, and money recovered per month",
        "Recall on invalid invoices, and precision on the same class",
        "Training time in hours, and the number of features used",
        "Accuracy on training data, and accuracy on test data",
      ],
      correctIndex: 0,
      explanation:
        "One model metric plus one business outcome connects the model to value. The other pairs are all model-level or engineering measures.",
    },
    {
      question: "A support team compares two prompt versions by having reviewers rate outputs, but reviewers know which version wrote each answer. What is the risk?",
      options: [
        "Reviewers may be swayed by knowing which version is newer",
        "The outputs cannot be compared fairly without a model judge",
        "The test set will expire after reviewers have read it",
        "Human reviewers are never used for comparing prompts",
      ],
      correctIndex: 0,
      explanation:
        "Knowing the source biases judgement. Blind comparison, with versions hidden and order shuffled, gives a fairer result.",
    },
  ],
}];
