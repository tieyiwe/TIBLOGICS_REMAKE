import type { SeedModule, SeedResource } from "../types";

// AI and Machine Learning Fundamentals (slug: ai-ml-fundamentals). Module 1.
// Audience: professionals, analysts, managers and aspiring builders who want a
// solid, vendor-neutral technical foundation in how AI and ML work. No coding
// required; small ```playground demos make ideas tangible. All organisations,
// people and figures in examples are fictional and illustrative. Product names
// are examples only and are dated October 2026.

export const ML_FREE_ASSISTANTS: SeedResource[] = [
  {
    title: "Claude (free account)",
    url: "https://claude.ai",
    resourceType: "account_signup",
    isFree: true,
    notes: "Free tier is enough for this lesson. Limits change; never paste confidential data.",
  },
  {
    title: "ChatGPT (free account)",
    url: "https://chatgpt.com",
    resourceType: "account_signup",
    isFree: true,
    notes: "Free tier is enough for this lesson. Limits change; never paste confidential data.",
  },
];

export const ML_MODULE_1: SeedModule[] = [{
  title: "How Machines Learn",
  summary:
    "Separate AI, machine learning and deep learning; understand supervised, unsupervised and reinforcement learning; learn the vocabulary of features, labels, training and inference; and follow the machine learning lifecycle from data to monitoring.",
  lessons: [
    // ── Lesson 1.1 ────────────────────────────────────────────────────────
    {
      title: "AI, machine learning and deep learning",
      objective:
        "Distinguish artificial intelligence, machine learning, deep learning and generative AI, and explain how a learned system differs from one built from hand-written rules.",
      durationMinutes: 24,
      contentType: "article",
      isPreview: true,
      bodyMd: `## Three circles, one inside the other

People use "AI", "machine learning" and "deep learning" as if they meant the same thing. They do not, and mixing them up is one of the quickest ways to lose credibility with an engineer.

- **Artificial intelligence (AI)** is the broadest idea: computer systems doing tasks that we would normally say need human intelligence, such as recognising speech, making a recommendation or planning a route. AI includes approaches that do not learn at all, such as a rules engine written by experts.
- **Machine learning (ML)** is a subset of AI. Instead of a person writing the rules, the system **learns patterns from examples** (data) and uses those patterns to make predictions or decisions about new cases.
- **Deep learning** is a subset of ML that uses **neural networks** with many layers. It is behind most modern progress in images, speech and language, because it can learn useful patterns from raw data without people hand-crafting every input.

**Generative AI** sits inside deep learning. It refers to models that produce new content (text, images, audio, code) rather than only a label or a number. The large language models behind modern chat assistants are generative AI.

Picture three circles nested inside each other: AI on the outside, ML inside it, deep learning inside that, with generative AI as a region within deep learning.

## Rules versus learning

The real difference between a traditional program and a machine learning model is **where the logic comes from**.

Imagine an insurance team wants to flag suspicious claims.

- **Rules approach.** An analyst writes: "Flag any claim over a set amount made within 30 days of a policy starting." The logic is explicit, easy to explain and easy to audit. But it only catches what someone thought of, and fraudsters learn the rules.
- **Machine learning approach.** The team gives a model thousands of past claims, each marked as "confirmed fraud" or "genuine". The model finds combinations of signals that tend to go with fraud, including ones nobody had written down. It can adapt when retrained on new data. But its logic is harder to explain, and it is only as good as the examples it learned from.

Neither is better in general. Rules are often the right answer when the logic is known, stable and must be fully explainable. ML earns its place when the patterns are too many, too subtle or too changeable for a person to write down.

## What "learning" actually means

When we say a model "learns", we mean something specific and quite mechanical. A model is a mathematical function with adjustable settings called **parameters** (or weights). Training is the process of adjusting those parameters so that the model's outputs match the examples as closely as possible, measured by a score of how wrong it is (often called the **loss**).

The model does not understand claims, customers or language the way you do. It finds statistical patterns that were useful for reducing its error on the training data. That is why a model can be impressively accurate on familiar cases and confidently wrong on unfamiliar ones.

## Where generative AI fits

A large language model is a deep learning model trained on a very large amount of text to predict the next small piece of text (a **token**). The same idea of adjusting parameters to reduce error applies; the scale is simply far larger. You will look inside these models in Module 4. For now, the key point is that a chat assistant is a product built around a machine learning model, and it inherits ML's strengths and weaknesses: it generalises from patterns, and it can be wrong in fluent, convincing ways.

## Try it now

Use the practice pad, or a free Claude or ChatGPT account, to test your understanding.

\`\`\`try
I work as [YOUR ROLE] in [YOUR SECTOR]. Give me three examples of tasks in my area:
1. one best handled by simple hand-written rules,
2. one where traditional machine learning (a prediction from structured data) fits,
3. one where generative AI fits.
For each, say in one sentence why that approach fits better than the other two. Do not invent statistics.
\`\`\`

Read the answer critically. You are done when you can explain, in your own words, why one of its three examples is in the right circle, and you have spotted at least one example you would place differently, with a reason.`,
      resources: ML_FREE_ASSISTANTS,
      microCheck: [
        {
          question: "A colleague calls a spreadsheet macro that applies fixed discount rules 'machine learning'. What is the most accurate correction?",
          options: [
            "It is AI in the broad sense, but it does not learn from data",
            "It is deep learning, because it runs on a computer automatically",
            "It is generative AI, because it produces new prices from rules",
            "It is supervised learning, because a person supervised the rules",
          ],
          correctIndex: 0,
          explanation:
            "Fixed, hand-written rules may count as AI in the broadest sense, but machine learning means the logic is learned from examples. Supervised learning refers to labelled data, not a person writing rules.",
        },
        {
          question: "Which statement best describes the relationship between ML and deep learning?",
          options: [
            "Deep learning is a separate field that replaced ML",
            "Deep learning is a subset of ML using layered neural networks",
            "ML is a subset of deep learning used only for simple tasks",
            "They are two names for exactly the same set of methods",
          ],
          correctIndex: 1,
          explanation:
            "Deep learning sits inside machine learning: it is ML that uses neural networks with many layers. It did not replace other ML methods, which remain common for structured data.",
        },
        {
          question: "A compliance team needs logic that is stable, known in advance and must be fully explainable to a regulator. What is usually the better starting point?",
          options: [
            "A large generative model prompted to make each decision",
            "A deep neural network trained on past decisions",
            "Clear hand-written rules that encode the known logic",
            "An unsupervised model that finds its own groupings",
          ],
          correctIndex: 2,
          explanation:
            "When the logic is known, stable and must be explained, rules are often simpler, cheaper and easier to audit. ML earns its place when patterns are too many or too subtle to write down.",
        },
        {
          question: "What does it mean, mechanically, for a model to 'learn' during training?",
          options: [
            "It memorises a written explanation of each example",
            "Its parameters are adjusted to reduce its measured error",
            "It searches the internet for the right answers and stores them",
            "An engineer edits its rules after reading each example",
          ],
          correctIndex: 1,
          explanation:
            "Training adjusts the model's parameters (weights) to reduce a loss score on the examples. The model finds statistical patterns; it does not store explanations or look anything up.",
        },
        {
          question: "Why can a chat assistant be fluent and still wrong?",
          options: [
            "It is a rules engine whose rules are sometimes out of date",
            "It generalises from learned patterns rather than checking facts",
            "It deliberately adds small errors to avoid copying its training data",
            "It only fails when the user's internet connection is weak",
          ],
          correctIndex: 1,
          explanation:
            "A language model is an ML model that produces likely text from learned patterns. Nothing in that process checks facts, so plausible but false output is possible.",
        },
      ],
    },

    // ── Lesson 1.2 ────────────────────────────────────────────────────────
    {
      title: "Supervised, unsupervised and reinforcement learning",
      objective:
        "Classify a business problem as supervised, unsupervised or reinforcement learning, and explain what kind of data each one needs.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## Three ways to learn from data

Machine learning methods are grouped by **what kind of feedback the model gets** while it learns. Knowing which family a problem belongs to tells you what data you will need, which is usually the hardest part of any project.

## Supervised learning: learning from answered examples

In **supervised learning**, every training example comes with the right answer, called a **label**. The model learns to map inputs to labels, then predicts labels for new inputs.

- A bank's past loan applications, each labelled "repaid" or "defaulted".
- Customer emails, each labelled with the team that handled it.
- House details, each labelled with the price it sold for.

Supervised learning splits into two common tasks:

- **Classification**: the label is a category ("spam" or "not spam", "repaid" or "defaulted").
- **Regression**: the label is a number (a price, a delivery time, next month's demand).

The catch is the labels. Someone has to produce them, and they must be correct and consistent. In many organisations the data exists but the labels do not, or they were recorded for a different purpose. Labelling can be the most expensive part of a supervised project.

## Unsupervised learning: finding structure without answers

In **unsupervised learning**, there are no labels. The model looks for structure in the data on its own.

- **Clustering** groups similar items: customers with similar buying habits, support tickets about similar problems.
- **Anomaly detection** flags items that look unlike the rest: an unusual transaction, a sensor reading out of pattern.
- **Dimensionality reduction** compresses many measurements into a few that capture most of the variation, which helps with visualisation and with later modelling.

Unsupervised results need human interpretation. A clustering model may split customers into five groups, but it does not tell you what the groups mean or whether they matter. A person has to look and decide.

## Reinforcement learning: learning by trial and reward

In **reinforcement learning (RL)**, an **agent** takes actions in an **environment** and receives **rewards** or penalties. Over many attempts it learns a strategy (a **policy**) that earns the most reward over time.

RL fits problems that are sequences of decisions where the consequences arrive later: controlling a robot arm, playing a game, adjusting a warehouse's stock orders over weeks. It is powerful but demanding, because the agent needs a great many attempts, usually in a simulation, and a reward that truly reflects what you want. A badly designed reward gets gamed: the agent finds a way to score highly that you did not intend. That is the same trap as Goodhart's law, which you will meet again in Module 3.

A variant you will hear about is **reinforcement learning from human feedback (RLHF)**: people rate model outputs and those ratings shape the model's behaviour. It is one of the techniques used to make large language models more helpful and better behaved.

## Self-supervised learning: the trick behind large language models

There is a fourth idea worth knowing. **Self-supervised learning** creates labels from the data itself. Hide the next word in a sentence and ask the model to predict it: the hidden word is the label, and nobody had to write it. This is how large language models are pre-trained on huge amounts of text without armies of labellers.

## Quick decision guide

| You have | You want | Family |
|---|---|---|
| Examples with known answers | Predict the answer for new cases | Supervised |
| Data with no answers | Find groups or oddities | Unsupervised |
| A way to try actions and score outcomes | Learn a strategy over time | Reinforcement |

Practise sorting real tasks by approach in the tool below.

\`\`\`studio
task-sorter
\`\`\`

## Try it now

Pick three problems from your own work or sector where someone has said "we could use AI for that". For each, write one line: the family (supervised, unsupervised or reinforcement), what one training example would look like, and whether labels already exist.

\`\`\`try
Here are three problems from my work: [PROBLEM 1], [PROBLEM 2], [PROBLEM 3]. For each, tell me whether it is best framed as supervised, unsupervised or reinforcement learning, what a single training example would look like, and what labels (if any) would be needed. Then challenge one of my framings: what could make it the wrong family?
\`\`\`

You are done when each problem has a family, an example and a note on labels, and you have changed or defended at least one framing after the challenge.`,
      microCheck: [
        {
          question: "A retailer has five years of transactions but no notes on customer types, and wants to discover natural customer segments. Which approach fits?",
          options: [
            "Supervised classification using purchase totals as labels",
            "Unsupervised clustering to find groups without labels",
            "Reinforcement learning with a reward for each purchase",
            "Regression predicting each customer's segment number",
          ],
          correctIndex: 1,
          explanation:
            "With no labels and a goal of finding groups, clustering is the natural fit. Supervised methods need known answers, and nobody has labelled the segments.",
        },
        {
          question: "A team wants to predict next week's demand, in units, for each product. What kind of task is this?",
          options: [
            "Supervised regression, because the label is a number",
            "Supervised classification, because products are categories",
            "Unsupervised clustering, because demand varies by product",
            "Reinforcement learning, because demand happens over time",
          ],
          correctIndex: 0,
          explanation:
            "Predicting a numeric quantity from past examples with known outcomes is supervised regression. Classification predicts a category, not a quantity.",
        },
        {
          question: "A reinforcement learning agent in a warehouse simulation is rewarded for 'orders marked complete' and starts marking orders complete without shipping them. What went wrong?",
          options: [
            "The agent was given too much labelled training data",
            "The reward did not truly reflect the outcome wanted",
            "Reinforcement learning cannot be used in simulations",
            "The agent needed unsupervised clustering first",
          ],
          correctIndex: 1,
          explanation:
            "Agents optimise the reward they are given. If the reward is a proxy that can be gamed, they will game it, which is Goodhart's law in action.",
        },
        {
          question: "How are large language models mostly pre-trained without people labelling every example?",
          options: [
            "Self-supervised: hidden next words act as the labels",
            "Unsupervised clustering of documents into topics",
            "Reinforcement learning with rewards from search engines",
            "Supervised learning with labels written by annotators",
          ],
          correctIndex: 0,
          explanation:
            "Self-supervised learning makes labels from the data itself, such as the next token in a sentence. Human feedback is used later to shape behaviour, not for the bulk of pre-training.",
        },
        {
          question: "A manager says 'we have lots of data, so supervised learning will be easy'. What is the most important question to ask?",
          options: [
            "Whether the data is stored in a modern cloud database",
            "Whether reliable labels exist for the outcome we want",
            "Whether the data has been collected for over ten years",
            "Whether the team prefers Python or another language",
          ],
          correctIndex: 1,
          explanation:
            "Supervised learning needs correct, consistent labels for the outcome being predicted. Plenty of data without suitable labels can still mean a costly labelling project.",
        },
      ],
    },

    // ── Lesson 1.3 ────────────────────────────────────────────────────────
    {
      title: "Features, labels, training and inference",
      objective:
        "Identify the features and label in a prediction problem, and explain the difference between training a model and using it for inference.",
      durationMinutes: 24,
      contentType: "mixed",
      bodyMd: `## The vocabulary engineers will use

Four words come up in every conversation about machine learning. Get them straight and you can follow most technical discussions.

- **Feature**: an input the model uses to make its prediction. For a house price model: floor area, number of bedrooms, postcode area, age of the building. Features are often called variables, attributes or columns.
- **Label**: the answer the model is trying to predict, available for training examples. For the house model: the price it sold for.
- **Training**: the phase where the model learns from examples that have both features and labels, adjusting its parameters to reduce error.
- **Inference**: the phase where the trained model receives features for a new case, with no label, and produces a prediction.

A useful way to hold it: **training is school, inference is the job.** Training happens occasionally, can take a long time and needs labelled data. Inference happens every time someone uses the model, needs to be fast and cheap, and is where the model meets the real world.

## Features are where domain knowledge lives

Choosing and preparing features is called **feature engineering**, and it is where your knowledge of the business matters most. Imagine a gym predicting which members will cancel. Raw data might include sign-up date and every visit. Useful features might be "visits in the last 30 days compared with the 30 before", "days since last visit" or "has used a class this month". An engineer may not think of these; someone who knows the business will.

Three warnings about features:

1. **Leakage.** A feature that would not be known at the moment of prediction, or that secretly contains the answer, makes a model look brilliant in testing and fail in use. If "cancellation reason" is a feature in a cancellation model, the model is cheating.
2. **Proxies for protected characteristics.** A postcode can stand in for ethnicity or income. Removing a sensitive column does not guarantee the model cannot infer it (Module 6 returns to this).
3. **Scale.** Many methods compare features numerically, so a feature measured in thousands can swamp one measured from 1 to 10 unless they are rescaled.

## A model you can touch

Below is about the simplest classifier there is: **nearest neighbour**. It stores labelled examples and, for a new case, finds the most similar example and copies its label. Each fruit has two features (weight and smoothness) and one label (apple or orange).

Change the weight and smoothness and press Classify. Then try: add a new example row, or remove the line that divides weight by 10 and see how weight starts to dominate.

\`\`\`playground
<!doctype html>
<html>
<body style="font-family: sans-serif; padding: 12px">
  <h3>Nearest-neighbour fruit sorter</h3>
  <p>Features: weight in grams, smoothness from 1 to 10. Label: apple or orange.</p>
  <label>Weight <input id="w" type="number" value="150"></label>
  <label>Smoothness <input id="s" type="number" value="8"></label>
  <button onclick="classify()">Classify</button>
  <p id="out"></p>
  <script>
    // Training data: each row has features and a label. Add or change rows.
    var examples = [
      { weight: 170, smooth: 9, label: "apple" },
      { weight: 140, smooth: 8, label: "apple" },
      { weight: 120, smooth: 9, label: "apple" },
      { weight: 130, smooth: 3, label: "orange" },
      { weight: 160, smooth: 2, label: "orange" }
    ];
    function classify() {
      var w = Number(document.getElementById("w").value);
      var s = Number(document.getElementById("s").value);
      var best = null;
      var bestDist = Infinity;
      examples.forEach(function (e) {
        // Weight is divided by 10 so it does not swamp smoothness (scaling).
        var dw = (e.weight - w) / 10;
        var ds = e.smooth - s;
        var d = Math.sqrt(dw * dw + ds * ds);
        if (d < bestDist) { bestDist = d; best = e; }
      });
      document.getElementById("out").textContent =
        "Prediction: " + best.label + " (closest example: " + best.weight +
        " g, smoothness " + best.smooth + ")";
    }
    classify();
  </script>
</body>
</html>
\`\`\`

Notice three things. The model is only as good as its examples: give it a lemon and it will still say apple or orange. "Training" here is just storing the rows, while "inference" is the distance calculation each time you press the button. And scaling changed the answer without any change to the data.

## Where generative AI fits

The same vocabulary applies to large language models, loosely. During pre-training the "features" are the tokens so far and the "label" is the next token. At inference, when you send a prompt, the model predicts one token after another. The prompt is your feature set for that moment, which is why giving it the right context matters so much.

## Try it now

Choose one prediction you would find useful at work (who will miss a payment, which enquiries are urgent, how long a job will take). Write down:

1. The label, in one precise sentence (what exactly, measured when).
2. Five candidate features, each one you could actually get **at the moment of prediction**.
3. One feature you are tempted to use that would cause leakage, and why.

You are done when every feature passes the "would I know this at prediction time?" test and your label is precise enough that two colleagues would record it the same way.`,
      microCheck: [
        {
          question: "In a model that predicts whether a support ticket will be escalated, which item is the label?",
          options: [
            "The time of day the ticket arrived",
            "Whether the ticket was escalated",
            "The number of words in the ticket",
            "The product the customer mentions",
          ],
          correctIndex: 1,
          explanation:
            "The label is the outcome being predicted, here escalation. The others are possible features: information available when the ticket arrives.",
        },
        {
          question: "A churn model scores brilliantly in testing but poorly in use. One feature is 'account closure date'. What is the likely problem?",
          options: [
            "Leakage: the feature reveals the outcome being predicted",
            "Scaling: the date feature is measured in the wrong units",
            "Clustering: the model should have been unsupervised",
            "Inference: the model is too slow to run on new cases",
          ],
          correctIndex: 0,
          explanation:
            "A closure date only exists once a customer has left, so it leaks the answer. It is not available at prediction time, which is why test results did not hold up.",
        },
        {
          question: "Which statement best describes inference?",
          options: [
            "Adjusting a model's parameters using a set of labelled examples",
            "Using a trained model to predict for a new, unlabelled case",
            "Choosing which features to include in a training set",
            "Checking a dataset for missing values before training",
          ],
          correctIndex: 1,
          explanation:
            "Inference is the model in use: new features in, a prediction out. Adjusting parameters on labelled data is training.",
        },
        {
          question: "In the nearest-neighbour demo, removing the division of weight by 10 changes predictions. Why?",
          options: [
            "Weight values are larger, so they dominate the distance",
            "The model forgets its stored examples when edited",
            "Smoothness becomes the label instead of a feature",
            "The browser cannot handle numbers larger than 100 reliably",
          ],
          correctIndex: 0,
          explanation:
            "Distance-based models compare features numerically, so a feature with a much larger range swamps the others unless rescaled. That is why scaling matters.",
        },
        {
          question: "Why does the lesson say features are 'where domain knowledge lives'?",
          options: [
            "Because only domain experts are allowed to see the data",
            "Because knowing the business suggests signals that predict well",
            "Because features must be written in business language",
            "Because domain experts write the model's code by hand instead",
          ],
          correctIndex: 1,
          explanation:
            "People who know the work can suggest derived signals, such as recent change in behaviour, that engineers may miss. Good features often matter more than the choice of algorithm.",
        },
      ],
    },

    // ── Lesson 1.4 ────────────────────────────────────────────────────────
    {
      title: "The machine learning lifecycle",
      objective:
        "Map the machine learning lifecycle from problem framing to monitoring, and explain why it is a loop rather than a straight line.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## It is a loop, not a project with an end

A common picture of machine learning is: collect data, train a model, done. In practice a model is closer to a living system. The world it predicts keeps changing, so the work never quite stops. Engineers describe this as the **ML lifecycle**, and seeing it as a loop is the first piece of systems thinking in this track.

## The stages

**1. Frame the problem.** What decision will the prediction support, who acts on it, and what does success look like in business terms? "Predict churn" is not a frame. "Each Monday, give the retention team a ranked list of members likely to cancel in the next 30 days, so they can call the top 50" is.

**2. Collect and prepare data.** Find the data, check its quality, define labels, handle missing values, build features and split the data for training and testing (Module 2). This stage usually takes the most time.

**3. Train.** Choose a model type, fit it to the training data and tune its settings (called **hyperparameters**, such as how deep a decision tree may grow).

**4. Evaluate.** Test the model on data it has never seen, with metrics that match the business goal (Module 3). Compare it with a simple **baseline**, such as "predict the most common outcome" or the current manual process. A model that cannot beat a sensible baseline is not worth deploying.

**5. Deploy.** Put the model where it can be used: an application, a dashboard, an automated workflow. Deployment includes decisions about speed, cost, who sees the predictions and what happens when the model is unsure.

**6. Monitor.** Watch the model in use. Are predictions still accurate? Has the incoming data changed? Are people using the output as intended?

**7. Retrain or retire.** When performance slips, go back round: new data, new training, new evaluation. Sometimes the right answer is to retire the model.

## Why it drifts

A model learns the world as it was in its training data. When the world changes, its performance can fall silently. Two kinds of change matter:

- **Data drift**: the inputs change. A new product line, a new customer group, a change in how a form is filled in.
- **Concept drift**: the relationship between inputs and outcome changes. What signalled fraud last year may not signal it now, because fraudsters adapt.

Without monitoring, nobody notices until the damage shows up elsewhere: complaints, losses, a manager asking why the list has stopped working.

## The feedback loop, and its traps

Monitoring creates a **feedback loop**: the model's results inform the next version. That loop can help or harm.

- A **balancing loop** keeps the model on track: errors are spotted, fed back and corrected.
- A **reinforcing loop** can amplify a problem. Imagine a model that decides which neighbourhoods get more inspections. More inspections find more issues, which become new training data, which sends even more inspections to the same places. The model "confirms" its own pattern while other areas go unchecked.

Seeing these loops before you build is far cheaper than discovering them after.

## Who does what

You do not need to do every stage yourself, but you should know who owns each one: a business owner for framing and success measures, data engineers for pipelines, data scientists for training and evaluation, platform or ML engineers for deployment and monitoring (often called **MLOps**), and someone accountable for the risk. Many failed projects had excellent models and no owner for stage 6.

Map the lifecycle as a loop in the tool below, marking where feedback enters and where a delay could hide a problem.

\`\`\`studio
loop-mapper
\`\`\`

## Try it now

Take the prediction you defined in the last lesson, or another from your work. Write one line for each of the seven stages: what would happen, and who would own it. Then answer two questions: what change in the world would most likely cause drift, and how would you notice it within a month?

\`\`\`try
I am planning a machine learning model that [WHAT IT PREDICTS] for [WHO USES IT]. Walk me through the seven stages of the ML lifecycle for this case (frame, data, train, evaluate, deploy, monitor, retrain or retire). For each stage, name the biggest risk. Then describe one possible reinforcing feedback loop that could make the model worse over time.
\`\`\`

You are done when every stage has an owner and you have one concrete drift signal you could check monthly.`,
      microCheck: [
        {
          question: "A fraud model's accuracy falls steadily over a year although the input data looks similar. Which explanation fits best?",
          options: [
            "Concept drift: the link between signals and fraud has changed",
            "Data leakage: the model was given the answer during its training",
            "Overfitting: the model was trained for too short a time",
            "Clustering: the model has started grouping transactions",
          ],
          correctIndex: 0,
          explanation:
            "When inputs look similar but the relationship to the outcome changes, as when fraudsters adapt, that is concept drift. Monitoring and retraining address it.",
        },
        {
          question: "Why should a new model be compared with a simple baseline?",
          options: [
            "Baselines are required before any model can be deployed",
            "To show the model adds value over a cheap existing option",
            "Because simple baselines always outperform complex models in practice",
            "To make the evaluation results look more impressive",
          ],
          correctIndex: 1,
          explanation:
            "If a model cannot beat a sensible baseline, such as the current manual process or predicting the most common outcome, it is not worth the cost and risk of deploying.",
        },
        {
          question: "A model sends more inspections to areas where it previously found problems, and its findings become new training data. What systems pattern is this?",
          options: [
            "A balancing loop that steadily corrects the model's errors",
            "A reinforcing loop that can amplify its own pattern",
            "A delay that hides the model's true accuracy",
            "A bottleneck caused by too few inspectors",
          ],
          correctIndex: 1,
          explanation:
            "Predictions shape the data used for the next version, so the pattern strengthens itself while other areas go unchecked. That is a reinforcing loop.",
        },
        {
          question: "Which is the best problem framing for an ML project?",
          options: [
            "Use AI to improve customer retention across the whole business",
            "Rank members likely to cancel in 30 days for weekly calls",
            "Build the most accurate churn model the team can manage",
            "Apply deep learning to all of our membership data",
          ],
          correctIndex: 1,
          explanation:
            "A good frame names the prediction, the time window, who acts on it and how. The others are goals or techniques with no decision attached.",
        },
        {
          question: "A project team has data scientists and engineers but no named owner for monitoring after launch. What is the main risk?",
          options: [
            "The model will be too slow to train on new data",
            "Performance can decline unnoticed until harm appears",
            "The model will automatically retrain itself on bad data",
            "The deployment will fail its first security review",
          ],
          correctIndex: 1,
          explanation:
            "Without someone watching performance and inputs, drift goes unnoticed and the first signal is often business damage. Monitoring needs an owner as much as training does.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "An executive asks whether the company's new chat assistant is 'AI or machine learning'. What is the most accurate answer?",
      options: [
        "Both: it is generative AI built on a deep learning model",
        "Neither: it is a rules engine with a friendly interface",
        "Only AI, because language is not a machine learning task",
        "Only ML, because chat assistants are not counted as AI",
      ],
      correctIndex: 0,
      explanation:
        "Generative AI sits inside deep learning, which sits inside ML, which sits inside AI. A chat assistant built on a large language model belongs to all of them.",
    },
    {
      question: "A hospital wants to flag scans that look unlike any it has seen before, without labelled examples of every problem. Which approach fits?",
      options: [
        "Supervised regression on the age of each patient",
        "Unsupervised anomaly detection on the scan data",
        "Reinforcement learning with rewards per scan read",
        "A rules engine listing every known abnormality",
      ],
      correctIndex: 1,
      explanation:
        "Anomaly detection finds cases that differ from the usual pattern without needing labels for each kind of problem. Flagged scans would still need expert review.",
    },
    {
      question: "Which pair correctly matches task and output?",
      options: [
        "Classification predicts a number; regression predicts a category",
        "Classification predicts a category; regression predicts a number",
        "Clustering predicts a label; regression predicts a group",
        "Regression finds groups; clustering predicts a quantity",
      ],
      correctIndex: 1,
      explanation:
        "Classification outputs a category such as spam or not spam. Regression outputs a number such as a price. Clustering finds groups without labels.",
    },
    {
      question: "A delivery firm builds a model to predict late deliveries and includes 'customer complaint received' as a feature. What is the problem?",
      options: [
        "Complaints are free text, so they can never be used as features",
        "Complaints usually follow lateness, so it leaks the outcome",
        "The feature is unsupervised, so it confuses the model",
        "Complaint data is always too small to be useful",
      ],
      correctIndex: 1,
      explanation:
        "A complaint about lateness is usually only known after the delivery is late. Using it at prediction time is leakage, so test results will overstate real performance.",
    },
    {
      question: "What is the main practical difference between training and inference?",
      options: [
        "Training uses new cases; inference uses old labelled cases",
        "Training learns from labelled data; inference predicts new cases",
        "Training happens in use; inference happens before launch",
        "Training is fast and cheap; inference is always slow and costly",
      ],
      correctIndex: 1,
      explanation:
        "Training adjusts the model using labelled examples, usually occasionally. Inference applies the trained model to new cases every time it is used, so it must be fast and affordable.",
    },
    {
      question: "A team trains a model, gets good test results, deploys it and moves on to the next project. Which lifecycle stage is missing?",
      options: [
        "Problem framing with a named decision",
        "Monitoring for drift and degradation in use",
        "Feature engineering with the relevant domain experts",
        "Splitting data into training and test sets",
      ],
      correctIndex: 1,
      explanation:
        "The lifecycle is a loop. Without monitoring, data or concept drift can quietly degrade the model, and nobody notices until the business does.",
    },
    {
      question: "Why does reinforcement learning need a carefully designed reward?",
      options: [
        "Because the agent will optimise whatever the reward measures",
        "Because rewards are the labels used in supervised learning",
        "Because rewards decide how many clusters the model finds",
        "Because a reward is only used once at the end of training",
      ],
      correctIndex: 0,
      explanation:
        "An RL agent learns whatever strategy earns the most reward. If the reward is a gameable proxy, the agent will exploit it rather than achieve the real goal.",
    },
    {
      question: "A colleague removes 'ethnicity' from a lending dataset and says the model is now fair. Which feature could still act as a proxy?",
      options: [
        "The loan amount requested by the applicant",
        "The applicant's home postcode area",
        "The date the application was submitted",
        "The repayment term chosen by the applicant",
      ],
      correctIndex: 1,
      explanation:
        "Location can correlate strongly with ethnicity and income, so a model can effectively infer a removed characteristic. Removing a column does not guarantee fairness.",
    },
    {
      question: "Which situation most clearly calls for machine learning rather than hand-written rules?",
      options: [
        "Applying a fixed tax rate to every invoice",
        "Spotting subtle patterns that change as fraudsters adapt",
        "Rejecting online forms that leave a mandatory field empty",
        "Routing emails by a short list of known keywords",
      ],
      correctIndex: 1,
      explanation:
        "ML earns its place when patterns are too many, too subtle or too changeable to write down. Fixed, known logic is better served by rules.",
    },
    {
      question: "What does it mean that a model has 'parameters'?",
      options: [
        "It has settings adjusted during training to fit the data",
        "It has a long list of rules written by the engineering team",
        "It has a fixed set of answers stored for each question",
        "It has user preferences saved between each session",
      ],
      correctIndex: 0,
      explanation:
        "Parameters, or weights, are the adjustable numbers inside a model. Training changes them to reduce error; they are not rules written by people.",
    },
    {
      question: "During evaluation, a churn model performs no better than 'predict that nobody cancels'. What should the team conclude?",
      options: [
        "The model is ready to deploy because its accuracy looks high",
        "The model adds no value over a trivial baseline yet",
        "The baseline is unfair and should be ignored",
        "The model needs to be deployed to gather more data",
      ],
      correctIndex: 1,
      explanation:
        "A model must beat a sensible baseline to justify its cost and risk. Matching a trivial prediction means it has not yet learned anything useful.",
    },
  ],
}];
