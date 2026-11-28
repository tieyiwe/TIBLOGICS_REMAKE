import type { SeedLesson, SeedQuestion } from "../types";

// AI and Machine Learning Fundamentals: the 30 Doors security checklist
// applied to data and ML pipelines. Appended to the end of Module 6
// ("Responsible, Secure and Governed AI"); existing titles and positions
// unchanged. Product names are examples at the time of writing (October 2026).

export const ML_DOORS_LESSON: SeedLesson = {
  title: "Securing data and ML pipelines: the doors that matter",
  objective: "Check a data or ML pipeline for exposed keys, over-broad data access, personal data in training data and logs, unsafe dependencies and untested recovery.",
  durationMinutes: 25,
  contentType: "article",
  bodyMd: `## Pipelines have doors too

The previous lesson covered security risks and the shared responsibility model at a conceptual level. This one makes it concrete for the work an ML practitioner actually does: notebooks, data pipelines, training jobs and calls to model APIs.

A 30-door pre-launch checklist is used for apps built with AI. Fourteen of those doors apply directly to data and ML work. Think of each as a door into your data, your models or your budget.

## Keys and notebooks (doors 1 to 5)

Notebooks are where keys leak. A cell with \`api_key = "sk-..."\` is saved in the notebook file, its output and its version history, and notebooks are shared freely.

\`\`\`text
# Risky: the key is saved in the notebook and its history
client = Client(api_key="sk-live-...")

# Better: read it from the environment (or a secrets manager)
import os
client = Client(api_key=os.environ["MODEL_API_KEY"])
\`\`\`

- Keep \`.env\` and credentials files out of version control, and scan for secrets before committing (doors 1 and 2).
- Rotate any key that was ever committed or shared in a notebook, even briefly (door 3).
- Never embed a model API key in a dashboard or web demo that runs in the browser (door 4).
- Pin library versions and commit the lockfile or a pinned requirements file, so a training run is reproducible and a surprise package update cannot slip in (door 5).

## Who can read the data (doors 8, 13 and 17)

- **Least-privilege data access (door 8).** Training jobs and notebooks should read through a role that can see only the tables and columns they need, ideally with row-level rules where the data is shared.
- **Validate inputs (door 13).** Data arriving from outside, including user feedback used for retraining, can be malformed or deliberately poisoned. Check schemas, ranges and sources before it reaches a training set.
- **Private storage (door 17).** Datasets and model artefacts in cloud buckets should be private by default. A public bucket of training data can expose every record in it.

## Personal data, spend and dependencies (doors 20, 24, 26 and 28)

- **Spending caps (door 20)** on cloud and model API accounts. A training job with the wrong instance size, or a batch job in a loop, is a billing incident.
- **Check packages exist (door 24).** AI coding assistants sometimes suggest packages that do not exist, and attackers register those names. Check the official registry page before installing.
- **Keep production data away from experiments and agents (door 26).** Use samples, synthetic data or properly de-identified extracts.
- **No personal data in logs (door 28).** Training logs, experiment trackers and error messages often print sample rows. Log aggregate metrics and IDs, not records.

## Recovery and accountability (doors 29 and 30)

Record who changed which dataset, label set or model version and when (door 29); this is also your lineage. Back up the data and artefacts you cannot recreate, and test a restore (door 30).

\`\`\`studio
security-doors:view-ml
\`\`\`

\`\`\`try
Here is a short description of my data or ML pipeline: [WHERE DATA
COMES FROM, WHERE IT IS STORED, HOW TRAINING OR INFERENCE RUNS, WHICH
MODEL APIS IT CALLS, WHO HAS ACCESS]. Check it against these security
doors: keys in notebooks or code, pinned dependencies, least-privilege
data access, validation of incoming data, private storage, spending
limits, checked packages, separation of production data from
experiments, personal data in logs, an audit trail of dataset and model
changes, and tested recovery. For each, say what to check and what good
looks like. Do not ask me for any real keys or data.
\`\`\`

## Try it now

1. Search one notebook or repository you work in for hard-coded keys, and move any you find to environment variables (then rotate them).
2. Check whether the bucket or folder holding your training data is private.
3. Work through the doors in the tool and mark each one for your pipeline.

You are done when no key is stored in your notebooks or code, your data storage is private, and every door in the view is marked.`,
  microCheck: [
    {
      question: "A shared notebook contains a cell with the model API key typed in directly. The cell was later deleted. What should you do?",
      options: [
        "Rotate the key, since earlier versions and copies still contain it",
        "Nothing, because the cell no longer appears in the current notebook",
        "Clear the notebook's outputs, which removes the key from its history",
        "Rename the notebook so that anyone who copied it cannot find it",
      ],
      correctIndex: 0,
      explanation:
        "Notebook files, outputs and version history keep old cells, and notebooks are shared. A key that was ever exposed must be replaced; deleting the cell does not undo copies.",
    },
    {
      question: "Your experiment tracker logs ten sample rows from the training data on every run. Why is that a problem for personal data?",
      options: [
        "Logs spread records to more people and tools than the dataset itself",
        "Sample rows make the tracker slower to load for the whole team",
        "Logged rows change the model's accuracy on the evaluation set",
        "Trackers cannot display rows that contain both numbers and text together",
      ],
      correctIndex: 0,
      explanation:
        "Logs and trackers are copied and widely readable. Logging aggregate metrics and IDs instead of records keeps personal data where access is controlled.",
    },
    {
      question: "User feedback is fed back into retraining automatically. Which door does this touch most?",
      options: [
        "Door 13: validate incoming data before it reaches the training set",
        "Door 12: rate limit all logins to the feedback form on the company website",
        "Door 27: show users generic error pages when feedback fails",
        "Door 16: lock down which websites can embed the feedback form",
      ],
      correctIndex: 0,
      explanation:
        "Feedback is untrusted input. Without checks on schema, ranges and sources, malformed or deliberately poisoned data can shape the next model.",
    },
    {
      question: "What is the safest data to give an AI coding agent that is helping you write a training pipeline?",
      options: [
        "A small synthetic or de-identified sample, never production data",
        "The full production dataset, so the agent sees realistic patterns",
        "A copy of production data with the column names removed",
        "Production data, provided the agent promises not to keep it",
      ],
      correctIndex: 0,
      explanation:
        "Agents run code and can be steered or make mistakes. Synthetic or properly de-identified samples let them help without exposing real people's records.",
    },
  ],
};

export const ML_DOORS_QUIZ: SeedQuestion[] = [
  {
    question: "A training dataset sits in a cloud bucket set to public so a partner could download it easily. What is the better approach?",
    options: [
      "Keep the bucket private and give the partner scoped, time-limited access",
      "Leave it public, but give the files very long names that are hard to guess",
      "Leave it public, since training data is not usually personal data",
      "Email the whole dataset to the partner as an attachment instead",
    ],
    correctIndex: 0,
    explanation:
      "A public bucket exposes every record to anyone who finds it. Private storage with scoped, expiring access gives the partner what they need and nothing more.",
  },
  {
    question: "Why should an ML project pin library versions and commit the lockfile or pinned requirements?",
    options: [
      "Runs are reproducible and a surprise package update cannot slip in",
      "Pinned libraries always train models faster than the newer library versions",
      "Cloud providers refuse to run jobs that use unpinned libraries",
      "Pinning removes the need to check whether packages are genuine",
    ],
    correctIndex: 0,
    explanation:
      "Pinning records exactly what was tested, so results can be reproduced and a compromised or breaking update does not arrive unnoticed. It does not replace checking packages.",
  },
];
