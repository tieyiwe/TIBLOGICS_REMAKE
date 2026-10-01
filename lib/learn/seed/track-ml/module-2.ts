import type { SeedModule } from "../types";

// AI and Machine Learning Fundamentals. Module 2: Data and Models.
// All organisations and figures in examples are fictional and illustrative.

export const ML_MODULE_2: SeedModule[] = [{
  title: "Data and Models",
  summary:
    "Judge whether data is fit for a model, split it properly and recognise overfitting, understand the common model types in plain terms, and decide which approach suits a business problem, including when machine learning is the wrong answer.",
  lessons: [
    // ── Lesson 2.1 ────────────────────────────────────────────────────────
    {
      title: "Data quality and bias",
      objective:
        "Assess a dataset for the quality problems and sources of bias that would undermine a model trained on it.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## The model is a mirror of its data

A machine learning model learns patterns from examples. It has no other source of knowledge. If the examples are incomplete, inconsistent or skewed, the model learns that too, and repeats it at scale and with confidence. Engineers sum this up as "garbage in, garbage out", but the more useful version is: **a model reflects the data it was given, including its gaps and its history.**

This is why experienced teams spend most of a project on data rather than on algorithms.

## Six questions about data quality

Before anyone trains anything, ask these about the dataset.

1. **Is it complete?** Missing values are normal, but where they cluster matters. If income is missing mostly for self-employed applicants, a model may learn something odd about that group.
2. **Is it accurate?** Typos, wrong units, duplicated records, default values left in place ("01/01/1900" as a birth date).
3. **Is it consistent?** The same thing recorded the same way across teams, systems and years. "Cancelled", "cancelled - customer" and "CX" may all mean one outcome.
4. **Is it timely?** Data from before a major change (a new product, a new policy, a pandemic) may describe a world that no longer exists.
5. **Is it relevant?** Does it contain signals that plausibly relate to the outcome, available at prediction time?
6. **Are the labels trustworthy?** Labels are often a by-product of someone's job, recorded in a hurry. If two people would label the same case differently, the model is learning noise.

## Where bias comes from

**Bias** in this sense means the model performs systematically worse, or decides systematically differently, for some groups or situations. It rarely comes from anyone's intention. It comes from the data and the framing.

- **Historical bias.** The data faithfully records past decisions that were themselves unfair. A hiring model trained on who was hired before learns the old preferences.
- **Sampling or representation bias.** Some groups or situations are under-represented. A speech model trained mostly on one accent will do worse with others.
- **Measurement bias.** The thing measured is a poor stand-in for the thing you care about. Using "arrests" as a measure of "crime" bakes in where police were sent.
- **Label bias.** The people producing labels bring their own judgement or inconsistency. Customer "satisfaction" labelled by staff under target pressure may not mean satisfaction.
- **Selection bias from the system itself.** You only see outcomes for cases you acted on. A lender only learns repayment behaviour for people it approved, never for those it rejected.

That last one is a systems problem: the model's own decisions shape the data it will learn from next, which links back to the feedback loops in Module 1.

## Practical checks

You do not need to be a statistician to ask useful questions.

- **Profile the data.** How many rows, what time period, what share is missing in each column, what share of each outcome?
- **Break it down by group.** Count examples and outcomes by region, age band, product, channel or any group that matters for fairness. Big imbalances are a warning.
- **Read some raw records.** Ten minutes reading actual rows often reveals more than a dashboard: odd codes, copy-and-paste notes, impossible values.
- **Ask how it was collected.** Who entered it, why, under what pressure, and what was never recorded?

\`\`\`try
I am assessing a dataset for a machine learning project. It contains [DESCRIBE THE COLUMNS, TIME PERIOD AND HOW IT WAS COLLECTED, WITHOUT ANY REAL PERSONAL DATA]. The model will predict [OUTCOME] to support [DECISION].

List the five most likely data quality problems and the three most likely sources of bias, specific to this dataset. For each, suggest one check I could run and what result would worry me.
\`\`\`

## Fixing is not always possible

Some problems can be repaired: cleaning, standardising codes, collecting more examples from under-represented groups, relabelling a sample carefully. Others cannot. If the outcome you want to predict was never recorded fairly, no amount of modelling will fix it. Part of your job is to say so early, before money is spent.

## Try it now

Pick a dataset you know at work (a CRM export, a ticket log, a spreadsheet of applications). Without opening any personal data in an AI tool, answer the six quality questions for it in a few words each, and name the one source of bias you think is most likely.

You are done when you have a short data note: six answers, one bias, and one check you could run this week to confirm or rule it out.`,
      microCheck: [
        {
          question: "A recruitment model is trained on ten years of past hiring decisions. Which bias is the most direct risk?",
          options: [
            "Historical bias: it learns the preferences behind past decisions",
            "Measurement bias: the dates of each decision may be recorded wrongly",
            "Concept drift: the model will be retrained too often to be stable",
            "Leakage: candidate names reveal the answer to the model directly",
          ],
          correctIndex: 0,
          explanation:
            "Past hiring decisions record past preferences, fair or not. A model trained to reproduce them inherits those patterns, which is historical bias.",
        },
        {
          question: "A lender trains a repayment model only on applicants it approved. What problem does this create?",
          options: [
            "The model will be too slow to run in production systems",
            "It never sees outcomes for rejected people, so it is skewed",
            "Approved applicants always have perfect quality data",
            "It turns the problem into unsupervised learning by default",
          ],
          correctIndex: 1,
          explanation:
            "Outcomes are only observed for cases the system acted on. The model learns nothing about how rejected applicants would have behaved, which is selection bias.",
        },
        {
          question: "Two staff members would label the same support ticket differently about a third of the time. What does that suggest?",
          options: [
            "The labels are noisy, so the model may learn inconsistency",
            "The model will correct the staff members' labels by itself",
            "The dataset needs more columns rather than better labels",
            "The tickets should be clustered instead of labelled at all",
          ],
          correctIndex: 0,
          explanation:
            "If people disagree on labels, the model learns that disagreement as if it were signal. Clear labelling guidelines and checks on agreement come before modelling.",
        },
        {
          question: "Which first step is most likely to reveal odd codes and impossible values in a dataset?",
          options: [
            "Training a deep neural network and seeing if it fails",
            "Reading a sample of the raw records yourself carefully",
            "Asking the AI vendor whether the data is good enough",
            "Removing every column that has any missing values",
          ],
          correctIndex: 1,
          explanation:
            "A short read of actual rows often surfaces default dates, copy-and-paste notes and inconsistent codes that summary charts hide. Deleting columns wholesale throws away signal.",
        },
        {
          question: "A city uses 'number of reported potholes' to decide where roads are worst. Reports come mostly from areas with active residents' apps. What is this?",
          options: [
            "Measurement bias: reports stand in poorly for road condition",
            "Overfitting: the model memorised the potholes in training",
            "Reinforcement learning: residents are rewarded for reporting",
            "Data drift: the roads changed after the model was trained",
          ],
          correctIndex: 0,
          explanation:
            "Reports measure who reports, not just where roads are bad. When the measured thing is a poor stand-in for what matters, that is measurement bias.",
        },
      ],
    },

    // ── Lesson 2.2 ────────────────────────────────────────────────────────
    {
      title: "Splitting data and overfitting",
      objective:
        "Explain why data is split into training, validation and test sets, and recognise the signs of overfitting and underfitting.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## Never mark your own homework

If you test a model on the same examples it learned from, you learn almost nothing. It may simply have memorised them. What you care about is how it performs on **new** cases, the ones it will meet in real use. So before training, the data is divided.

- **Training set**: the examples the model learns from. Often the largest share.
- **Validation set**: examples used during development to compare models and tune settings (hyperparameters). The team looks at these results many times.
- **Test set**: examples locked away until the very end, used once to estimate real-world performance.

The split is often something like 70/15/15 or 80/10/10, but the proportions matter less than the discipline. **The test set must stay untouched.** Every time a team peeks at test results and adjusts the model, the test set quietly becomes part of training, and the final score becomes optimistic.

A related technique you may hear about is **cross-validation**: the data is split into several folds, and the model is trained and checked several times, each time holding back a different fold. It gives a steadier estimate when data is limited.

## Overfitting and underfitting

**Overfitting** is when a model learns the training data too closely, including its noise and quirks, and does worse on new data. It is like a student who memorised last year's exam answers and is lost when the questions change.

**Underfitting** is the opposite: the model is too simple to capture the real pattern, so it does poorly on both training and new data.

The tell-tale signs:

| Training performance | Validation performance | Likely diagnosis |
|---|---|---|
| Poor | Poor | Underfitting: model too simple or features too weak |
| Excellent | Much worse | Overfitting: model memorising, not generalising |
| Good | Similar, slightly lower | Healthy |

Common remedies for overfitting include more (and more varied) data, a simpler model, fewer features, stopping training earlier, and **regularisation** (techniques that penalise overly complex patterns). Remedies for underfitting include better features or a more flexible model.

## How splits go wrong

Splitting looks mechanical, but it is where many impressive results fall apart.

- **Leakage across the split.** The same customer appears in both training and test sets, so the model recognises them rather than generalising. Split by customer, not by row.
- **Time travel.** For anything that predicts the future, a random split lets the model learn from next year to predict last year. Use a **time-based split**: train on earlier data, test on later data, as it will be used in reality.
- **Unrepresentative test sets.** If the test set lacks a group or situation that matters, its score says nothing about that group.
- **Preprocessing before splitting.** Calculating averages or scaling using the whole dataset lets information from the test set leak into training. Prepare using training data only.

## Imagine it in practice

A property firm builds a model to predict sale prices. The team reports an excellent result. You ask two questions: "Was the split random or by date?" and "Could the same property appear in both sets, from different sales?" The answers are "random" and "yes". The excellent result now means very little, because the model may have been tested on houses, and price trends, it had already seen. Asking those two questions is a skill, and you now have it.

\`\`\`try
Act as a sceptical reviewer of a machine learning result. A team says their model, which predicts [OUTCOME] from [DATA], scored [RESULT] on their test set. List the eight questions you would ask about how the data was split and prepared before trusting that number, and say what a worrying answer to each would look like.
\`\`\`

## Try it now

Think of a prediction your organisation might make (sales next month, which tickets will escalate, which invoices will be paid late). Write down:

1. Would you split randomly, by time, or by entity (customer, site, property)? Why?
2. One way the same entity could end up on both sides of the split.
3. What sign in the results would make you suspect overfitting?

You are done when each answer is a specific sentence about your case, not a general rule.`,
      microCheck: [
        {
          question: "A model scores very well on training data and much worse on validation data. What is the most likely diagnosis?",
          options: [
            "Underfitting, because the model is too simple for the task",
            "Overfitting, because it has memorised training quirks",
            "Concept drift, because the world changed during training",
            "A healthy model, because some drop is always expected",
          ],
          correctIndex: 1,
          explanation:
            "A large gap between strong training and weak validation performance is the classic sign of overfitting. Underfitting shows weak performance on both.",
        },
        {
          question: "A team tunes its model repeatedly by checking the test set after each change. What is the problem?",
          options: [
            "The test set effectively becomes training data, so scores flatter",
            "Checking the test set often makes the model train much slower",
            "The validation set should never be used for tuning at all",
            "Repeated tuning always causes underfitting on new cases",
          ],
          correctIndex: 0,
          explanation:
            "Each adjustment based on test results leaks information from the test set into the model. The final score then overstates real-world performance; the validation set is for tuning.",
        },
        {
          question: "A model forecasts next quarter's sales. How should the data be split?",
          options: [
            "Randomly, so each set has a mix of every time period",
            "By time: train on earlier periods, test on later ones",
            "By product, with each product appearing in one set only",
            "Not at all, because forecasts cannot be tested in advance",
          ],
          correctIndex: 1,
          explanation:
            "A time-based split mirrors real use, where the model only has the past. A random split lets the model learn from the future it is meant to predict.",
        },
        {
          question: "A clinic's model has the same patient's visits in both training and test sets. Why does this matter?",
          options: [
            "The model may recognise the patient rather than generalise",
            "Patients' visits must always be stored in separate systems",
            "It makes the model underfit because there is too much data",
            "It only matters if the patient's name is used as a feature",
          ],
          correctIndex: 0,
          explanation:
            "When the same entity appears on both sides, the model can exploit what it learned about that patient, inflating test scores. Split by patient, not by visit.",
        },
        {
          question: "Which is a common remedy for overfitting?",
          options: [
            "Adding many more features with little relevance",
            "Using a simpler model or more varied training data",
            "Testing the model only on its own training examples",
            "Training for longer until training error reaches zero",
          ],
          correctIndex: 1,
          explanation:
            "Simpler models, more varied data, fewer features, early stopping and regularisation reduce overfitting. Driving training error to zero usually makes it worse.",
        },
      ],
    },

    // ── Lesson 2.3 ────────────────────────────────────────────────────────
    {
      title: "Common model types in plain terms",
      objective:
        "Describe in plain language how regression, classification, clustering, decision trees and neural networks work, and when each is a sensible choice.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## You do not need the maths, but you need the shapes

Engineers choose among many model types. You do not need to build them, but you should know roughly how each one thinks, what it is good at, and what it costs in explainability. This lets you ask the right questions and spot when a choice looks odd.

## Linear and logistic regression

**Linear regression** predicts a number by adding up weighted features: price equals a base amount, plus so much per square metre, plus so much per bedroom, and so on. The weights are learned from data. It is simple, fast and easy to explain ("each extra bedroom adds roughly this much, all else equal"). It struggles when relationships are curved or depend on combinations of features.

**Logistic regression**, despite its name, is a **classification** method. It combines weighted features in a similar way and turns the result into a probability between 0 and 1, such as "probability this invoice will be paid late". A threshold (say 0.5) turns the probability into a yes or no. It is a strong, explainable baseline for many business problems.

## Decision trees and their families

A **decision tree** asks a sequence of yes or no questions: "Is the customer's tenure under 6 months? If yes, have they contacted support more than twice?" Each path ends in a prediction. Trees are intuitive and easy to show to a non-specialist. A single deep tree, though, tends to overfit.

**Ensembles** combine many trees to get more accurate, more stable predictions:

- A **random forest** trains many trees on different samples of the data and lets them vote.
- **Gradient-boosted trees** build trees one after another, each one correcting the errors of the last.

For tabular business data (rows and columns, like a spreadsheet), tree ensembles are very often among the strongest performers. They are less transparent than a single tree, but tools exist to show which features drove a prediction (Module 6).

## Clustering

**Clustering** is unsupervised: it groups similar items without labels. A common method, **k-means**, places a chosen number of centre points and repeatedly moves each one to the middle of the items closest to it, until the groups settle. You decide how many groups; the method decides who goes where. The groups then need a human to interpret and name them, and to judge whether they are useful.

## Neural networks

A **neural network** passes inputs through layers of simple units. Each unit combines its inputs with weights and passes the result on. With many layers (**deep learning**), networks can learn very complex patterns, especially from raw data such as images, audio and text, where hand-crafting features is impractical.

The trade-offs: neural networks usually need a lot of data and computing power, are harder to explain, and on ordinary tabular business data they often do not beat a well-tuned tree ensemble. Large language models are very large neural networks of a particular design (the transformer, Module 4).

## A quick comparison

| Model type | Typical use | Explainability | Data needed |
|---|---|---|---|
| Linear or logistic regression | Numbers or yes/no from tabular data | High | Modest |
| Decision tree | Simple rules-like predictions | High | Modest |
| Tree ensembles | Strong tabular prediction | Medium | Moderate |
| Clustering (k-means) | Finding segments | Medium (needs interpretation) | Moderate |
| Neural networks | Images, audio, text, complex patterns | Low | Large |

## How to use this in a conversation

Good questions to ask an engineer:

- "What simple baseline did you compare against, and by how much did this beat it?"
- "Why this model type rather than something more explainable?"
- "If we need to explain an individual decision to a customer or regulator, how would we do that with this model?"

There is a well-known principle in statistics, sometimes called Occam's razor: prefer the simplest model that does the job. A slightly more accurate model that nobody can explain or maintain is often the worse business choice.

\`\`\`try
Explain to me, as a non-technical manager, how [MODEL TYPE: e.g. a random forest, k-means clustering, logistic regression] works, using an analogy from [MY SECTOR]. Keep it under 200 words. Then give me two questions I should ask an engineer who proposes using it, and what a good answer would sound like.
\`\`\`

## Try it now

Take one prediction from your work. Using the table above, write which model type you would expect an engineer to try first, which they might try second, and what you would trade off between them (accuracy, explainability, data needed). Then run the prompt above for the first model type.

You are done when you can explain both choices to a colleague in two sentences each.`,
      microCheck: [
        {
          question: "Despite its name, what does logistic regression usually do?",
          options: [
            "It predicts a continuous number such as a house sale price",
            "It classifies by estimating the probability of an outcome",
            "It groups unlabelled items into clusters automatically",
            "It generates new text from a prompt one token at a time",
          ],
          correctIndex: 1,
          explanation:
            "Logistic regression outputs a probability for a category, and a threshold turns it into a yes or no. It is a classification method and a common, explainable baseline.",
        },
        {
          question: "A team has a spreadsheet-like dataset of customer accounts and wants strong predictive accuracy. Which family is very often a strong performer here?",
          options: [
            "Tree ensembles such as random forests or boosted trees",
            "Very deep neural networks trained on the raw table rows",
            "k-means clustering with a large number of clusters",
            "Reinforcement learning agents rewarded per prediction",
          ],
          correctIndex: 0,
          explanation:
            "For tabular business data, tree ensembles are frequently among the best performers and need less data than deep networks. Clustering does not predict a labelled outcome.",
        },
        {
          question: "A k-means model has split customers into six groups. What still needs to happen?",
          options: [
            "Nothing, the model has already named and explained each group",
            "A person must interpret the groups and judge if they are useful",
            "The groups must be used as labels for regression straight away",
            "The model must be retrained until it finds exactly two clear groups",
          ],
          correctIndex: 1,
          explanation:
            "Clustering finds structure but does not explain it. People have to interpret what each group means and whether the grouping helps any decision.",
        },
        {
          question: "Why might a team choose a single decision tree over a more accurate ensemble?",
          options: [
            "Single trees are always more accurate on brand new data",
            "It can be shown and explained easily to non-specialists",
            "Ensembles cannot be used with tabular business data",
            "Single trees never overfit, whatever their depth is",
          ],
          correctIndex: 1,
          explanation:
            "A single tree is easy to explain, which can matter more than a small accuracy gain, especially where decisions must be justified. Deep single trees do tend to overfit.",
        },
        {
          question: "Where do neural networks have the clearest advantage over simpler methods?",
          options: [
            "Small tabular datasets that need fully explainable results",
            "Raw images, audio and text where features are hard to craft",
            "Problems where the logic is fixed and known in advance",
            "Any task where the team has only a small computing budget",
          ],
          correctIndex: 1,
          explanation:
            "Deep networks shine on raw, unstructured data where they can learn their own features. On small tabular data with explainability needs, simpler models are often better.",
        },
      ],
    },

    // ── Lesson 2.4 ────────────────────────────────────────────────────────
    {
      title: "Choosing the right approach, and when not to use ML",
      objective:
        "Decide whether a business problem suits rules, traditional machine learning, generative AI or no AI at all, and justify the choice.",
      durationMinutes: 24,
      contentType: "article",
      bodyMd: `## Start from the decision, not the technology

The most expensive mistake in AI projects is starting with "we should use AI" and looking for somewhere to put it. Start instead with a decision or task that matters, and ask what would genuinely improve it. Sometimes the answer is machine learning. Often it is a better process, a clearer rule or a simple report.

A useful sequence of questions:

1. **What decision or task are we improving, and who owns it?**
2. **What happens today, and what does it cost (time, errors, missed opportunities)?**
3. **What would "better" look like, measurably?**
4. **Is there a pattern to learn, and data that captures it?**
5. **What happens when the system is wrong, and who catches it?**

## Four broad options

| Option | Fits when | Example |
|---|---|---|
| **No AI: fix the process** | The problem is unclear ownership, missing steps or bad data entry | Invoices are late because nobody owns approvals |
| **Rules** | Logic is known, stable and must be fully explainable | Flag any expense claim without a receipt |
| **Traditional ML** | A prediction or classification from structured data, with history and labels | Predict which orders will be returned |
| **Generative AI** | Working with language, documents or images: drafting, summarising, extracting, answering questions | Summarise customer calls for the account manager |

These combine. A sensible system might use rules for hard limits, an ML score to prioritise, and generative AI to draft a message for a person to approve.

## When not to use machine learning

Machine learning is a poor fit when:

- **There is little or no relevant data**, or the outcome has never been recorded.
- **The logic is simple and known.** A rule is cheaper, faster and fully explainable.
- **Errors are unacceptable and cannot be caught.** If one wrong prediction causes serious harm and there is no human check, ML's probabilistic nature is a problem.
- **Every decision must be explained in exact terms**, and no explainable model performs well enough.
- **The environment changes faster than you can retrain**, so the model is always out of date.
- **Nobody will act on the output.** A beautiful prediction that does not change any decision has no value.
- **The cost exceeds the benefit.** Data work, build, monitoring and governance add up. A small gain on a low-volume task rarely pays back.

## A worked example

Imagine a regional charity that wants "AI to help with grant applications". Following the questions:

- The decision: which of the roughly two hundred applications a round should go to the panel.
- Today: two staff read every application in full, and it takes weeks.
- Better: shortlisting done in days, with no loss of fairness.
- Data: past applications and decisions exist, but only a few rounds, and past decisions may carry historical bias.

Traditional ML on so few past decisions is risky and could repeat old bias. A more sensible design: rules for eligibility (hard criteria), generative AI to summarise each application against the published criteria in a fixed template, and staff making every shortlisting decision using the summaries. The AI saves reading time; people keep the judgement. That is a systems answer, not a technology answer.

## Systems view: what changes around it

Any AI system changes the process around it. Ask what happens upstream (will people change how they fill in forms?), downstream (who handles the cases the model gets wrong?) and over time (will staff lose the skill to do the task manually?). These second-order effects are often where the real risks and benefits sit.

Practise judging fit in the tool below: sort tasks by whether AI suits them, and how.

\`\`\`studio
task-sorter
\`\`\`

## Try it now

Choose one "we could use AI for that" idea from your organisation. Run it through the five questions above, then place it in one of the four options (or a combination).

\`\`\`try
Here is an idea for using AI in my organisation: [DESCRIBE THE IDEA]. The decision it supports is [DECISION] and today it works like this: [CURRENT PROCESS]. Challenge the idea: is this best solved by fixing the process, rules, traditional ML, generative AI or a combination? Give the strongest argument against using ML at all, then your recommendation.
\`\`\`

You are done when you have a one-paragraph recommendation that names the option, the main reason, and one thing that would change your mind.`,
      microCheck: [
        {
          question: "Invoices are paid late because nobody clearly owns approvals. A manager proposes an ML model to predict late invoices. What is the better first step?",
          options: [
            "Collect five more years of invoice data before deciding",
            "Fix the process by assigning a clear approval owner",
            "Train a deep learning model instead of simple ML",
            "Use generative AI to write reminders to every supplier",
          ],
          correctIndex: 1,
          explanation:
            "Predicting late invoices does not fix the cause, which is unclear ownership. When the problem is the process, change the process before adding a model.",
        },
        {
          question: "Which situation is the clearest case against using machine learning?",
          options: [
            "A large history of labelled outcomes exists for the task",
            "Nobody will change any decision based on the prediction",
            "The pattern is subtle and changes slowly over the years",
            "Errors can be caught cheaply by a reviewer before use",
          ],
          correctIndex: 1,
          explanation:
            "A prediction that changes no decision has no value, however accurate. The other conditions are favourable to ML rather than against it.",
        },
        {
          question: "A team needs to summarise long customer call transcripts for account managers. Which option fits best?",
          options: [
            "Generative AI drafting summaries for people to use",
            "A rules engine with a list of important call phrases",
            "Unsupervised clustering of calls into ten groups",
            "Linear regression predicting the length of each call",
          ],
          correctIndex: 0,
          explanation:
            "Summarising language is a natural generative AI task. Rules and clustering cannot produce a readable summary, and regression predicts a number.",
        },
        {
          question: "In the charity example, why was traditional ML on past grant decisions judged risky?",
          options: [
            "Grant applications are written in text, which ML cannot read",
            "Few past rounds exist and past decisions may carry bias",
            "Charities are not permitted to use any form of ML at all",
            "Rules for eligibility would conflict with any ML model",
          ],
          correctIndex: 1,
          explanation:
            "With little history, a model has too few examples, and it would learn whatever biases shaped earlier decisions. A design that keeps judgement with staff was safer.",
        },
        {
          question: "Which question best reflects a systems view of a proposed AI tool?",
          options: [
            "Which vendor offers the most accurate model this year?",
            "Who handles the cases the model gets wrong, and how?",
            "How many features can we add to the training data?",
            "Can the model run on our existing laptops and phones?",
          ],
          correctIndex: 1,
          explanation:
            "A systems view looks at what happens around the model: errors, hand-offs, people and knock-on effects. The other questions focus on the tool alone.",
        },
      ],
    },

    // ── Lesson 2.5 ────────────────────────────────────────────────────────
    // Added after the original four so seed matching by position is stable.
    {
      title: "Recognising AI workloads: vision, language, speech and documents",
      objective:
        "Identify the main vision, language, speech and document workloads, choose between a prebuilt service, a custom model and a general foundation model for each, and name how each should be judged.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## Name the workload before you pick the tool

Long before chat assistants, most AI in production did narrower jobs: reading a number plate, flagging an angry email, turning a phone call into text. These jobs are still everywhere, often inside products you already use. Being able to name the **workload** (the kind of task the AI performs) tells you what data it needs, how to measure it and what can go wrong. It also helps you spot when a proposal uses a heavy tool for a light job.

There are four families worth knowing.

## Vision workloads

- **Image classification** gives one label to a whole image: "damaged" or "not damaged", "cat" or "dog".
- **Object detection** finds several things in one image and says where each is, usually with a box around it. Counting items on a shelf or spotting a missing safety helmet are detection tasks.
- **Segmentation** outlines the exact area of each thing, pixel by pixel. Measuring how much of a leaf is diseased needs segmentation, not just detection.
- **Optical character recognition (OCR)** reads printed or handwritten text from images and scans.
- **Face detection** finds that a face is present (to blur it, for example). **Facial recognition** identifies who the person is. These are very different in risk. Identifying people from their faces is one of the most restricted uses of AI: some biometric uses are prohibited or high-risk under the EU AI Act, and many providers limit access to it. Treat it as a legal question first and a technical one second.

## Language workloads

- **Text classification**, including **sentiment analysis** (is this review positive, negative or mixed?).
- **Entity extraction**: pulling out names, organisations, dates, amounts and places. **Key phrase extraction** pulls out the main topics.
- **Language detection** and **translation**.
- **Summarisation** and **question answering** over a text.

Dedicated language models did each of these separately. A general large language model can do all of them from a prompt, which is flexible, but a small dedicated model can be cheaper and more predictable for one high-volume job.

## Speech workloads

- **Speech to text** (transcription), often with **diarisation**: working out who spoke when.
- **Text to speech** (speech synthesis), including custom voices. Cloning a real person's voice needs their clear consent.
- **Speech translation**, which chains the two with translation in between.

Speech systems are a textbook case of the representation bias from Lesson 2.1. Accents, background noise and specialist vocabulary all raise error rates, so test on recordings from your own callers and staff.

## Documents: where the families meet

Extracting data from invoices, forms and contracts combines several workloads: OCR to read the text, layout analysis to understand tables and fields, and entity extraction to fill a structured record (supplier, date, total). Good document pipelines also check the result (does the line total add up?) and send low-confidence fields to a person rather than guessing.

## Three ways to get the work done

| Option | Example | Strengths | Watch for |
|---|---|---|---|
| **Prebuilt service** | A cloud API for OCR, translation or transcription | Fast to start, no training data needed | Generic categories; check where data is processed |
| **Custom-trained model** | A classifier trained on your labelled defect photos | Fits your own categories; cheap per item at volume | Needs labelled data and retraining |
| **General foundation model** | A multimodal model prompted to describe and classify a photo | Flexible, handles varied tasks with reasoning | Cost per item, consistency, harder to measure |

A sensible default: try a prebuilt service for a standard task, a general model when the task varies or needs judgement, and a custom model when your categories are specific and the volume is high. Whatever you choose, test it on your own data, because performance on someone else's examples tells you little.

## How to judge each one

- **Classification and sentiment**: precision and recall (Module 3), checked across groups.
- **Detection**: misses and false alarms, and whether boxes land in the right place.
- **OCR and transcription**: the share of characters or words that come out wrong, often called the **word error rate** for speech.
- **Translation and summaries**: review by fluent people, supported by automatic overlap scores (Module 5).

\`\`\`try
I have this task at work: [DESCRIBE IT, e.g. "sort photos of returned goods into resellable, repairable and scrap"]. Tell me which AI workload family and specific workload this is, whether a prebuilt service, a custom-trained model or a general foundation model fits best, what data I would need to test it, and which measure I should use to judge it. Flag any legal or privacy concerns.
\`\`\`

## Try it now

List three tasks in your organisation that involve images, audio, scanned documents or large volumes of text. For each, name the workload (for example "object detection" or "entity extraction"), pick one of the three options from the table, and write the measure you would use. Run the prompt above on the one you are least sure about.

You are done when each of the three tasks has a named workload, a chosen option with a one-line reason, and a measure.`,
      microCheck: [
        {
          question: "A retailer wants to count how many of each product are visible on a shelf photo. Which workload is this?",
          options: [
            "Object detection, finding and locating each item",
            "Image classification, giving the photo one label",
            "Sentiment analysis of the product packaging text",
            "Speech to text over the store's audio recordings",
          ],
          correctIndex: 0,
          explanation:
            "Counting needs each item found and located, which is object detection. Classification gives a single label to the whole image, so it cannot count separate items.",
        },
        {
          question: "What separates face detection from facial recognition?",
          options: [
            "Detection finds a face; recognition says whose it is",
            "Detection needs video; recognition works on photos",
            "Detection is regulated; recognition is unrestricted",
            "Detection uses OCR; recognition uses translation",
          ],
          correctIndex: 0,
          explanation:
            "Detecting that a face is present is low risk. Identifying the person is biometric identification, one of the most restricted uses of AI and a legal question before a technical one.",
        },
        {
          question: "A transcription tool works well in testing but makes many errors on a call centre's real calls. What is the most likely cause?",
          options: [
            "Test audio lacked the callers' accents and line noise",
            "Transcription tools only work in a single language",
            "The calls were too short for a model to transcribe",
            "Speech to text always needs a custom voice first",
          ],
          correctIndex: 0,
          explanation:
            "Speech models degrade with accents, noise and vocabulary they rarely saw. Testing on your own recordings reveals this before launch; generic test audio hides it.",
        },
        {
          question: "A firm processes 200,000 invoices a year in a standard format. Which option is a sensible first try?",
          options: [
            "A prebuilt document extraction service, tested on samples",
            "Training a custom vision model from scratch on day one",
            "A general chat assistant with each invoice pasted by hand",
            "Continued pre-training of a large model on all invoices",
          ],
          correctIndex: 0,
          explanation:
            "Invoices are a standard, high-volume task that prebuilt services handle well, and testing on real samples shows whether it is good enough. Building from scratch is costly without evidence it is needed.",
        },
        {
          question: "Which measure fits a speech to text system best?",
          options: [
            "The share of words that come out wrong",
            "The area under a ROC curve per speaker",
            "The number of boxes drawn on each frame",
            "The ROUGE score against the call summary",
          ],
          correctIndex: 0,
          explanation:
            "Word error rate counts substituted, missing and extra words against a correct transcript. The other measures belong to classification, detection or summarisation.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "A speech recognition system works well for most staff but poorly for those with certain regional accents. What is the most likely cause?",
      options: [
        "Representation bias: those accents were rare in training data",
        "Leakage: the test set included the staff members' voices",
        "Underfitting: the model was far too simple for any speech",
        "Concept drift: the accents changed after the model launched",
      ],
      correctIndex: 0,
      explanation:
        "When a group is under-represented in training data, a model tends to perform worse for that group. More varied data for those accents is the usual remedy.",
    },
    {
      question: "Why is the test set kept untouched until the very end?",
      options: [
        "To give an honest estimate of performance on unseen data",
        "Because test data is usually lower quality than training data",
        "So the model can be trained on it at the final stage instead",
        "Because regulators require that it is stored separately",
      ],
      correctIndex: 0,
      explanation:
        "The test set stands in for new cases. If it influences development, it stops being unseen and the final score becomes optimistic.",
    },
    {
      question: "A model performs poorly on both training and validation data. What is the likely diagnosis and remedy?",
      options: [
        "Overfitting; use a simpler model with fewer features",
        "Underfitting; use better features or a more flexible model",
        "Leakage; remove the test set from the training data",
        "Drift; retrain the model on data from last year",
      ],
      correctIndex: 1,
      explanation:
        "Poor performance everywhere means the model has not captured the real pattern. Better features or a more flexible model help; simplifying further would not.",
    },
    {
      question: "A team scales all features using averages calculated from the whole dataset, then splits it. What is wrong?",
      options: [
        "Information from the test set leaks into training preparation",
        "Scaling should only ever be applied to the final test set",
        "Averages cannot be calculated for features with missing values",
        "Nothing, because scaling does not affect what a model learns",
      ],
      correctIndex: 0,
      explanation:
        "Preparing data with statistics from the whole dataset lets test information influence training. Fit any preparation on the training data only, then apply it to the rest.",
    },
    {
      question: "An engineer proposes a deep neural network for a small, tabular dataset where every decision must be explained to customers. What is a fair challenge?",
      options: [
        "Has a simpler, more explainable model been tried as a baseline?",
        "Could the network be made deeper to improve its accuracy further?",
        "Why not use clustering, since it needs no labels at all here?",
        "Would reinforcement learning give more explainable answers?",
      ],
      correctIndex: 0,
      explanation:
        "On small tabular data with explanation needs, logistic regression or a decision tree is often good enough and far easier to justify. The network must earn its extra complexity.",
    },
    {
      question: "What does a random forest do?",
      options: [
        "Combines many decision trees and lets them vote",
        "Builds one very deep tree that never overfits",
        "Groups unlabelled data into a chosen number of sets",
        "Generates new examples to enlarge the training data",
      ],
      correctIndex: 0,
      explanation:
        "A random forest trains many trees on different samples and combines their votes, which makes predictions more accurate and stable than a single tree.",
    },
    {
      question: "Which is the best example of measurement bias?",
      options: [
        "Using 'number of complaints' to measure product quality",
        "Having fewer examples from one region than from others",
        "Splitting data randomly when it should be split by time",
        "Using a model that is too simple for a complex pattern",
      ],
      correctIndex: 0,
      explanation:
        "Complaints measure who complains as much as quality itself, so they are a skewed stand-in. Fewer examples from one region is representation bias.",
    },
    {
      question: "A retailer wants to block refunds over a fixed amount without a manager's approval. What is the best approach?",
      options: [
        "A simple rule, because the logic is known and fixed",
        "A classification model trained on past refund data",
        "A generative model asked to judge each refund request",
        "Clustering refunds to find the ones that look unusual",
      ],
      correctIndex: 0,
      explanation:
        "The logic is known, stable and must be enforced exactly, so a rule is cheaper and fully explainable. ML would add cost and uncertainty for no gain.",
    },
    {
      question: "Cross-validation is most useful when:",
      options: [
        "Data is limited and you want a steadier performance estimate",
        "The test set has already been used too many times by the team",
        "You want to avoid splitting the data into any sets at all",
        "The model is generative and produces text rather than labels",
      ],
      correctIndex: 0,
      explanation:
        "Cross-validation trains and checks the model several times on different folds, giving a more reliable estimate when there is not much data. It does not repair a contaminated test set.",
    },
    {
      question: "A project plans to retrain a model once a year, but the patterns it relies on change every few weeks. What does this suggest?",
      options: [
        "ML may be a poor fit unless retraining can keep pace",
        "The model should be made larger to cover future patterns",
        "The yearly retrain will be enough if the data is clean",
        "The patterns will settle once the model is deployed",
      ],
      correctIndex: 0,
      explanation:
        "If the environment changes faster than the model is updated, it is always out of date. Either the retraining cycle changes or a different approach is needed.",
    },
    {
      question: "A good first question when someone says 'let's use AI for this' is:",
      options: [
        "Which decision are we improving, and who owns it?",
        "Which large language model is the newest available?",
        "How many engineers can we hire for the project?",
        "Can we start training a model by the end of the week?",
      ],
      correctIndex: 0,
      explanation:
        "Starting from the decision and its owner keeps the work tied to value. Starting from the technology tends to produce solutions looking for a problem.",
    },
    {
      question: "An insurer wants to measure what share of a dented car door is damaged in each claim photo. Which workload fits?",
      options: [
        "Segmentation, outlining the damaged area exactly",
        "Object detection, putting one box around the car",
        "Image classification, labelling the photo damaged",
        "Entity extraction from the text of the claim form",
      ],
      correctIndex: 0,
      explanation:
        "Measuring an area needs the exact outline of the damage, which is segmentation. A box or a single label says that damage exists but not how much of the door it covers.",
    },
    {
      question: "A team wants to sort 30,000 support emails a month into its own nine categories. Prompting a general model works but is costly. What is a reasonable next option?",
      options: [
        "A custom classifier trained on labelled past emails",
        "A speech synthesis model to read the emails aloud",
        "A prebuilt translation service for every incoming email",
        "Facial recognition to identify who sent each email",
      ],
      correctIndex: 0,
      explanation:
        "Specific categories at high volume suit a custom classifier trained on labelled history, which is cheap per item. The other workloads do not sort text into categories.",
    },
  ],
}];
