import type { SeedLesson, SeedQuestion } from "../types";

// AI Governance: mapping the 30 Doors security checklist to governance
// controls and vendor due diligence. Appended to the end of Module 4
// ("Controls and Operations"); existing titles and positions unchanged.

export const GOV_DOORS_LESSON: SeedLesson = {
  title: "From checklist to controls: the 30 doors in governance",
  objective: "Map a practical 30-door security checklist to governance controls and due-diligence questions, and decide which open doors block an AI system's launch.",
  durationMinutes: 25,
  contentType: "article",
  bodyMd: `## Why governance needs the doors

Governance work tends to live at the level of policies, risk tiers and accountability. That is right, but it leaves a gap: a well-governed AI use case can still ship with a secret key in its website or a route that returns any customer's record. Many AI-built tools are now produced quickly, sometimes by people who are not traditional developers, and the commonest security failures are concrete and checkable.

The **30 doors** are a practical pre-launch security checklist for apps built with AI, in five groups. This lesson connects them to the controls you already manage, so that the checklist becomes evidence inside your governance system rather than a separate technical exercise.

## Mapping doors to controls

| Door group | Doors | Governance control it evidences |
|---|---|---|
| Before you push | 1 to 5 | Secrets management; secure development; supply-chain (dependency) control |
| Auth and access | 6 to 12 | Access control and least privilege; identity management; segregation of admin duties |
| Input and data | 13 to 19 | Secure design; data protection by design; third-party integration controls |
| AI and agents | 20 to 26 | AI-specific risk controls: cost limits, misuse limits, human oversight of actions, model and tool supply chain, environment separation |
| When it breaks | 27 to 30 | Logging and monitoring; data minimisation in logs; audit trails; business continuity and tested recovery |

Two observations. First, doors 22 and 23 (untrusted input and limits on what a model can do) are where your **human oversight** design from this module becomes technical: the approval step before a consequential action is the control. Second, door 28 (no personal data or secrets in logs) and door 29 (audit trail) pull in opposite directions; your logging standard should say what is recorded, redacted and for how long.

## Due diligence: the questions that separate suppliers

Every door in the tool below carries a plain question for a developer or vendor. A few are especially telling:

- "Show me a test where one customer tries to read another customer's data." (door 7)
- "Which actions can the AI take without a person approving them?" (door 23)
- "Do the AI coding tools used to build this have access to production data?" (door 26)
- "When did you last restore a backup, and how long did it take?" (door 30)

Ask for **evidence** (a test result, a configuration, a date), not assurances. Record the answers in the use-case register so they can be re-checked at review.

\`\`\`studio
security-doors:view-governance
\`\`\`

## Deciding what blocks launch

Not every open door is equal. A proportionate rule your committee can adopt:

1. **Block launch** while any door exposes personal data, money or admin power (for example doors 4, 6, 7, 8, 11, 17, 19, 23).
2. **Launch with a dated fix and a named risk owner** for doors that reduce resilience or visibility (for example 27, 29) when compensating controls exist.
3. **Record Not applicable with a reason** that a reviewer could check.

\`\`\`try
Our organisation is about to approve an AI use case: [DESCRIBE IT, ITS
DATA, USERS, TOOLS AND WHO BUILT IT]. Using a 30-door security checklist
grouped as keys and code history, auth and access, input and data, AI
and agents, and when it breaks, produce a one-page control mapping: for
each group, the governance control it evidences, the evidence we should
require, the role accountable, and whether an open door should block
approval or can proceed with a dated fix.
\`\`\`

## Try it now

Take one AI system in your use-case register.

1. Work through the governance view in the tool, using the question on each door. Note the evidence you hold, or need.
2. Mark doors you have evidence for as Checked, and the rest as Needs work with an owner.
3. Add the copied report to the system's register entry and flag any door that should block approval.

You are done when every door is marked and the register entry shows which open doors block launch and who owns each fix.`,
  microCheck: [
    {
      question: "Which governance control does door 30 (backups with a tested restore) provide evidence for?",
      options: [
        "Business continuity and recovery",
        "Fairness and bias testing of the model",
        "Transparency notices shown to users",
        "Vendor contract liability and exit terms",
      ],
      correctIndex: 0,
      explanation:
        "A tested restore shows the organisation can recover data within a known time after an error or attack. It is direct evidence for continuity and recovery controls.",
    },
    {
      question: "A vendor answers 'our platform is secure by design' to every question. What should the governance record show?",
      options: [
        "Evidence requested per door, with the gaps marked as open",
        "The vendor's answer, accepted because they carry the liability",
        "A pass, since the vendor has more expertise than the reviewer",
        "Nothing, because assurances are not part of governance records",
      ],
      correctIndex: 0,
      explanation:
        "Assurances are not evidence. Recording which doors lack evidence keeps the decision honest and gives a clear list to resolve before approval.",
    },
    {
      question: "Which open door should most clearly block approval of an AI customer-service tool?",
      options: [
        "One customer can read another customer's records by changing an ID",
        "Error pages show a reference number instead of a full explanation",
        "The audit log is kept for twelve months rather than twenty-four",
        "Two dependencies are a minor version behind the latest release",
      ],
      correctIndex: 0,
      explanation:
        "Exposure of personal data between customers is an active harm. The other items are minor or acceptable with a dated fix and compensating controls.",
    },
    {
      question: "Doors 28 (no personal data in logs) and 29 (audit trail) can pull in opposite directions. How should governance resolve this?",
      options: [
        "A logging standard stating what is recorded, redacted and kept how long",
        "Log everything in full, because audit needs outweigh privacy needs",
        "Log nothing at all, because personal data must never be stored",
        "Let each development team decide case by case without a standard",
      ],
      correctIndex: 0,
      explanation:
        "An audit trail can record who did what without copying personal content. A written standard balances accountability with data minimisation consistently.",
    },
  ],
};

export const GOV_DOORS_QUIZ: SeedQuestion[] = [
  {
    question: "An AI tool was built by a business team using a coding agent that had production credentials. Which control is missing?",
    options: [
      "Environment separation that keeps production secrets away from build tools",
      "A transparency notice telling customers that AI was used in development",
      "A bias test on the coding agent's suggestions before they were accepted",
      "An exit clause in the contract with the coding agent's provider",
    ],
    correctIndex: 0,
    explanation:
      "Coding agents run commands and can be steered by text they read. Separating environments so production secrets are never in reach is the control (door 26).",
  },
  {
    question: "Where does a 30-door checklist add most value in a governance programme?",
    options: [
      "As launch evidence in the approval gate, recorded in the use-case register",
      "As a poster in the office reminding staff that security is important",
      "As an annual training quiz for every employee across the organisation",
      "As a replacement for the risk classification of each AI use case",
    ],
    correctIndex: 0,
    explanation:
      "The checklist turns broad controls into concrete, checkable evidence. Its value is at the decision point, recorded so it can be reviewed, not as a replacement for risk tiers.",
  },
];
