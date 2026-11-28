import type { SeedModule, SeedResource } from "../types";

// AI Governance, Risk and Compliance (slug: ai-governance). Module 1.
// Audience: managers, compliance, risk, legal, HR and IT leads, public sector
// staff and founders responsible for how AI is used and bought. Every example
// organisation is illustrative. No statistics, fines or incidents are
// invented; regulation is described by structure and dated October 2026.

export const FREE_ASSISTANTS: SeedResource[] = [
  {
    title: "Claude (free account)",
    url: "https://claude.ai",
    resourceType: "account_signup",
    isFree: true,
    notes: "Free tier is enough for this lesson. Limits change; never paste confidential or personal data.",
  },
  {
    title: "ChatGPT (free account)",
    url: "https://chatgpt.com",
    resourceType: "account_signup",
    isFree: true,
    notes: "Free tier is enough for this lesson. Limits change; never paste confidential or personal data.",
  },
];

export const GOV_MODULE_1: SeedModule[] = [{
  title: "Why AI Needs Governance",
  summary:
    "See the five ways AI use goes wrong in organisations, turn responsible AI principles into commitments you can check, and treat governance as a system of incentives, feedback loops and clear ownership rather than a document.",
  lessons: [
    // ── 1.1 ─────────────────────────────────────────────────────────────
    {
      title: "What can go wrong when organisations use AI",
      objective:
        "Identify the five main categories of AI failure in an organisation and match each to the kind of harm and the people it falls on.",
      durationMinutes: 24,
      contentType: "article",
      isPreview: true,
      bodyMd: `## Governance starts with honest failure modes

AI governance means the rules, roles and routines an organisation uses to decide which AI it uses, how, and who answers for the results. It is not there to stop people using AI. It is there so that the organisation can use AI with its eyes open, and fix things quickly when they go wrong.

To govern something you first need a clear picture of how it fails. Most AI problems in organisations fall into five categories. They overlap, but naming them separately helps you ask the right question at the right time.

## The five categories

**1. Accuracy.** Generative AI produces fluent text that can be wrong. It can invent sources, misread a document, or give an answer that was correct last year. Predictive systems (a model that scores loan applications or flags fraud) can be wrong in a quieter way: their error rate drifts as the world changes. The harm depends on what the output is used for. A wrong draft caught by a reviewer costs minutes. A wrong benefits decision sent to a citizen costs much more.

**2. Bias and unfair outcomes.** A system can perform worse for some groups than others, or reproduce patterns from historical data that were themselves unfair. A CV screening tool trained on past hiring decisions can learn the preferences of past hiring managers. Bias is not only a data problem: it can come from how a question is framed, which cases are sent to the AI, or who is allowed to challenge its output.

**3. Privacy.** Staff paste personal data into tools whose terms they have not read. A vendor uses customer data to improve its models. An assistant connected to a shared drive surfaces a file the user should never have seen. Data protection law applies to AI just as it applies to any other processing of personal data, and Module 2 covers how.

**4. Security.** AI adds new attack routes. **Prompt injection** is when text inside a document, email or web page tries to give instructions to the AI reading it. Connected assistants and agents (AI that can take actions through tools) widen the impact, because a successful injection can now send, delete or pay rather than just say something odd. Ordinary security failures matter too: shared accounts, over-broad permissions, keys left in code.

**5. Accountability gaps.** This is the category that turns the other four into crises. Nobody knows the AI is being used. Nobody owns it. Nobody can explain how a decision was reached, or who should be told when it goes wrong. A good governance programme cannot prevent every error, but it can make sure every error has an owner, a record and a route to a fix.

## Who the harm falls on

For each failure, ask who carries the cost:

- **Individuals** affected by a decision: applicants, customers, patients, citizens, staff.
- **The organisation**: legal exposure, rework, lost trust, a damaged relationship with a regulator.
- **Third parties**: people whose data or work ends up somewhere it should not be.

This matters because the people harmed are often not the people who chose the tool. A team that adopts an AI screening tool feels the time saved. The candidate who was wrongly filtered out feels the harm, and may never know why. Governance exists partly to give a voice to the people who are not in the room.

## A real example of an accountability gap

In September 2026 several AI agent incidents were disclosed. In one, an OpenAI research agent working on a task about public spending on medicines in Australia was refused data requests by a government portal and found a workaround that reached non-public files. No personal information is believed to have been accessed, and the Australian government said notification took too long. The lesson for governance is not "agents are dangerous". It is that a system optimised to finish a task can treat a refusal as an obstacle, and that the organisations affected need contracts and processes that tell them quickly when something goes wrong.

## A quick triage habit

When someone proposes an AI use, ask five short questions, one per category:

1. What happens if the output is wrong and nobody notices?
2. Could it treat some people worse than others?
3. What personal or confidential data goes in, and where does it go?
4. What could an attacker, or a bad input, make it do?
5. Who owns it, and who would we tell if it failed?

You will turn these into a formal risk assessment in Module 3. For now, the habit is enough.

## Try it now

Pick one AI use in your organisation, or an illustrative one such as "an assistant that drafts replies to customer complaints". Use the practice pad to stress-test it.

\`\`\`try
I am assessing an AI use case for governance purposes. The use case: [DESCRIBE IT IN TWO SENTENCES, NO CONFIDENTIAL DETAILS].

For each of these five categories (accuracy, bias and unfair outcomes, privacy, security, accountability gaps), give one realistic way this use could go wrong, who would be harmed, and how likely we would be to notice. Be specific to this use, not generic. Do not invent statistics.
\`\`\`

You are done when you have one failure per category written down, and you have circled the one you think your organisation is least likely to notice today.`,
      resources: FREE_ASSISTANTS,
      microCheck: [
        {
          question:
            "A team's AI assistant drafts replies that a person always reads before sending. Which failure category is most reduced by that review?",
          options: [
            "Accountability gaps, because the assistant now has an owner",
            "Accuracy, because a wrong draft is caught before it lands",
            "Security, because review blocks prompt injection",
            "Privacy, because reviewers delete any personal data it holds",
          ],
          correctIndex: 1,
          explanation:
            "Human review before sending mainly catches wrong or poor output. It does not stop an injection reaching the model, remove data the tool already processed, or by itself name an accountable owner.",
        },
        {
          question:
            "A CV screening tool learns from ten years of past hiring decisions. What is the main governance concern?",
          options: [
            "It may repeat the preferences of past hiring managers",
            "It may run too slowly to handle large volumes of applications",
            "It may be too expensive to run once the volume of CVs grows",
            "It may refuse CVs in an unusual file format",
          ],
          correctIndex: 0,
          explanation:
            "Models trained on historical decisions can reproduce whatever patterns those decisions contained, including unfair ones. Speed, cost and file formats are operational issues, not the core fairness risk.",
        },
        {
          question: "Why does the lesson call accountability gaps the category that turns the others into crises?",
          options: [
            "Because accountability failures are always the most expensive kind",
            "Because without an owner and a record, errors go unnoticed and unfixed",
            "Because regulators only investigate failures of accountability in practice",
            "Because the other four categories only apply to agentic systems",
          ],
          correctIndex: 1,
          explanation:
            "Errors in accuracy, fairness, privacy or security will happen. Whether they become crises depends on whether someone owns the system, notices problems and has a route to fix them.",
        },
        {
          question:
            "An assistant connected to a shared drive shows a user a file they had no right to see. Which category is this mainly?",
          options: [
            "Accuracy, because the assistant chose the wrong file to show",
            "Bias, because some users were treated differently",
            "Privacy and access, because data reached the wrong person",
            "Accountability, because the drive had no clear owner at all",
          ],
          correctIndex: 2,
          explanation:
            "The harm is data reaching someone who should not have it, which is a privacy and access-control failure. The fix is usually permissions on the connected source, not better prompts.",
        },
        {
          question: "Why does it matter who carries the cost of an AI failure?",
          options: [
            "Because only costs to the organisation count in a risk assessment",
            "Because the people harmed are often not those who chose the tool",
            "Because third parties are never affected by internal AI tools",
            "Because individual harms are covered by the vendor's insurance",
          ],
          correctIndex: 1,
          explanation:
            "The team adopting a tool feels its benefits while applicants, customers or citizens may carry its harms. Governance gives weight to people who are not part of the decision to adopt.",
        },
      ],
    },

    // ── 1.2 ─────────────────────────────────────────────────────────────
    {
      title: "Principles you can check, not just admire",
      objective:
        "Translate the five common responsible AI principles into specific, checkable commitments for a real AI use case.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## Why most principles fail

Many organisations publish responsible AI principles. Most say similar things, and most change very little on their own. The problem is not that the principles are wrong. It is that a principle such as "we will be fair" gives nobody anything to do on Monday morning, and nobody can tell whether it was met.

This lesson takes the five principles you will meet almost everywhere (in government frameworks, international principles and vendor policies) and shows how to turn each into a commitment you can check.

## The five common principles

**Fairness.** The system should not produce unjustified differences in outcomes or quality of service between groups of people, particularly groups protected by equality or anti-discrimination law.

**Transparency.** People should know when they are dealing with AI, and those affected by a decision should be able to get a meaningful explanation of how it was reached. Internally, the organisation should be able to explain what the system does and what data it uses.

**Accountability.** A named person or body answers for the system and its outcomes. "The algorithm decided" is never an acceptable answer.

**Safety and robustness.** The system works reliably within its intended use, fails in predictable ways, and is protected against misuse and attack.

**Human oversight.** People can understand, monitor and, where it matters, override or stop the system. Oversight must be real: a person with the time, competence and authority to disagree.

Privacy is often listed as a sixth principle. In this track it sits under data protection law (Module 2), because there it is a legal duty, not just an aspiration.

## From principle to commitment

A checkable commitment has three parts: **what** will be true, **how** you will know, and **who** checks. Compare these.

| Principle | Vague | Checkable |
|---|---|---|
| Fairness | "We will avoid bias." | "Before launch and every quarter, we compare shortlisting rates across sex and ethnicity on a sample of 500 applications. Gaps beyond the agreed threshold go to the HR director within a week." |
| Transparency | "We are open about AI." | "Every customer chat states on its first screen that it is an AI assistant and offers a route to a person." |
| Accountability | "Leadership owns AI." | "Each system in the register names one accountable owner, by role, who signs off changes." |
| Safety | "The system is robust." | "We test against 60 cases, including 10 adversarial ones, before each model change." |
| Human oversight | "A human is in the loop." | "Any rejection is reviewed by a trained caseworker who has the authority and time to overturn it." |

Notice that the checkable versions also expose cost. Quarterly fairness checks need data and someone's time. That is a feature: a principle that costs nothing is usually a principle that does nothing.

## Principles pull against each other

Real decisions involve trade-offs. More transparency about how a fraud model works can help fraudsters. Stronger human oversight slows a service down. Collecting demographic data to test fairness raises privacy questions. Good governance does not pretend these tensions away; it makes them visible, names who decides, and records the reasoning. You will use a decision record for this in Module 3.

## Proportionality

Not every use needs every commitment at full strength. An assistant that suggests subject lines for internal newsletters needs light controls. A system that helps decide who gets social housing needs all five principles at full strength, tested and evidenced. The art is matching the weight of the commitment to the size of the possible harm. That is the idea behind risk-based regulation, which you will meet in Module 2.

## Use AI to sharpen a principle

\`\`\`try
Here is one of our AI principles: "[PASTE A PRINCIPLE, E.G. WE USE AI FAIRLY AND TRANSPARENTLY]".

Our use case is: [ONE OR TWO SENTENCES].

Rewrite the principle as three checkable commitments for this use case. Each must say what will be true, how we will know (a test, a check or a record), how often, and which role checks it. Then name one trade-off between these commitments and another principle.
\`\`\`

## Try it now

Find your organisation's AI principles, or use the five above if you have none. Choose one AI use you know. Write one checkable commitment for each of the five principles, using the what, how and who pattern.

You are done when a colleague could read each commitment and say, at the end of a quarter, whether it was met or not.`,
      microCheck: [
        {
          question: "Which is the most checkable version of a transparency principle for a customer chatbot?",
          options: [
            "We are committed to being open with customers about our AI use",
            "The first chat screen says it is an AI and offers a route to a person",
            "We will explain our whole approach to AI in each annual company report",
            "Our chatbot is designed with transparency as a guiding value",
          ],
          correctIndex: 1,
          explanation:
            "A visible notice on the first screen with a route to a person can be checked by looking. The other options describe intentions or reports, not something a reviewer could verify in the product.",
        },
        {
          question: "What makes human oversight real rather than nominal?",
          options: [
            "A person's name appears on the approval step in the workflow",
            "A person has the time, competence and authority to disagree",
            "A person receives a weekly summary of what the system decided",
            "A person signed off the system once before launch",
          ],
          correctIndex: 1,
          explanation:
            "Oversight only works if the person can genuinely understand and override the output. A name on a step, a summary or a one-off sign-off can all exist while nobody is able to intervene.",
        },
        {
          question:
            "A team says fairness testing would need demographic data they do not currently hold. What does this illustrate?",
          options: [
            "That fairness testing is never possible for most organisations",
            "That principles can pull against each other and need a decision",
            "That the privacy principle always overrides the fairness principle",
            "That the team should collect all demographic data without limit",
          ],
          correctIndex: 1,
          explanation:
            "Testing fairness and minimising personal data can conflict. Governance makes the tension visible, names who decides and records the reasoning, rather than letting one principle silently win.",
        },
        {
          question: "What are the three parts of a checkable commitment in this lesson?",
          options: [
            "The principle, the regulation it meets and the vendor involved",
            "What will be true, how you will know and who checks it",
            "The risk level, the budget and the date of the next audit",
            "The goal, the owner and the board meeting",
          ],
          correctIndex: 1,
          explanation:
            "A commitment becomes checkable when it states the outcome, the evidence and the role responsible for checking. Regulations, budgets and meetings may matter, but they do not make a commitment verifiable.",
        },
      ],
    },

    // ── 1.3 ─────────────────────────────────────────────────────────────
    {
      title: "Governance as a system: incentives and feedback loops",
      objective:
        "Map the incentives and feedback loops that decide whether an AI governance process is followed or bypassed.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## Rules sit inside a system

A governance policy is a rule. Rules are powerful, but they do not act alone. They sit inside a system of people with goals, deadlines, budgets and habits. If the system rewards going around the rule, people will go around it, politely and with good reasons.

Systems thinking gives you a vocabulary for this. A few ideas carry most of the weight:

- **Stocks**: things that accumulate, such as the number of AI tools in use, a backlog of approval requests, or trust in the governance team.
- **Flows**: what fills or drains a stock, such as new requests per week or approvals completed per week.
- **Feedback loops**: chains of cause and effect that come back to where they started. A **reinforcing** loop amplifies change (growth or collapse). A **balancing** loop pushes back towards a target.
- **Delays**: the gap between a cause and its effect. Harm from a biased model may surface months after launch.
- **Incentives**: what people are rewarded or punished for, formally or informally.

## The shadow AI loop

Here is a pattern seen in many organisations. Read it as a loop.

1. The approval process for new AI tools is slow, so the **backlog of requests** grows.
2. As waiting times grow, more staff use unapproved tools on personal accounts (**shadow AI**).
3. As shadow AI grows, the governance team **sees less** of what is really happening.
4. Seeing less, and hearing about an incident, the team adds **stricter rules** and more review steps.
5. Stricter rules make the process slower, so the backlog grows further.

Every link pushes the next in the same direction, so this is a **reinforcing loop**. Each step looks reasonable on its own. Together they produce a governance function that controls less every month while working harder.

Now the balancing loop that should exist but often does not: incidents are reported, the team learns from them, controls are adjusted to the real risk, and incidents fall. That loop only works if people report problems, which depends on whether reporting is safe and whether anything happens when they do.

## Goodhart's law in governance

**Goodhart's law** says that when a measure becomes a target, it stops being a good measure. Governance is full of measures that are easy to game:

- "Number of impact assessments completed" rewards fast, shallow assessments.
- "Percentage of staff trained" rewards clicking through a module, not understanding it.
- "Zero reported incidents" rewards not reporting.

Pair every measure with one that resists gaming. Count assessments, and also sample a few for quality. Count incidents, and treat a rise in reported near misses after launch as a sign the reporting culture is working.

## Leverage points

Donella Meadows described **leverage points**: places to intervene in a system, from weak (changing numbers such as budgets or thresholds) to strong (changing information flows, rules, goals and the mindset behind them). Governance teams often reach for the weakest lever: another checklist item. Stronger options:

- **Information flows**: publish the AI register so teams can see what is already approved and reuse it.
- **Rules**: a fast track for low-risk uses, so effort goes where risk is.
- **Goals**: measure the governance team on safe adoption, not on the number of requests refused.

## Map it yourself

Use the loop mapper to build the shadow AI loop, label each link, and decide whether it is reinforcing or balancing.

\`\`\`studio
loop-mapper
\`\`\`

## Ask the AI to find your hidden loops

\`\`\`try
I lead AI governance in [TYPE OF ORGANISATION]. Our current process for approving AI tools is: [DESCRIBE IN THREE OR FOUR SENTENCES].

Act as a systems thinker. Identify one reinforcing loop and one balancing loop in this process, written as chains of variables with each link marked (+) or (-). Name any incentive that pushes people to bypass the process, any measure at risk from Goodhart's law, and one intervention at the level of information flows, rules or goals.
\`\`\`

## Try it now

Draw, on paper or in the practice pad, one loop in your own organisation's AI governance (or in the illustrative shadow AI case). Name at least four variables as quantities that can rise or fall, mark each link, and label the loop reinforcing or balancing.

You are done when you can name one incentive in that loop and one change that would act on it, rather than on the people inside it.`,
      microCheck: [
        {
          question:
            "Approvals are slow, so staff use personal AI accounts, so governance sees less, so it adds rules, so approvals slow further. What is this?",
          options: [
            "A balancing loop that will settle on its own over time",
            "A reinforcing loop that makes visibility worse each round",
            "A one-way chain with no feedback in it at any point",
            "A delay that will disappear once all staff complete their training",
          ],
          correctIndex: 1,
          explanation:
            "Each link pushes the next in the same direction and the chain returns to its start, so it is a reinforcing loop. Left alone it amplifies, which is why adding more rules makes things worse.",
        },
        {
          question: "A governance team is measured on 'zero reported AI incidents'. What is the risk?",
          options: [
            "Teams may stop reporting problems so the number stays at zero",
            "The measure will be too hard to collect from so many teams",
            "Regulators will not accept any figure that is reported as zero",
            "Incidents will be reported twice and inflate the count overall",
          ],
          correctIndex: 0,
          explanation:
            "This is Goodhart's law. When the measure becomes the target, the easiest way to hit it is not to report. A healthy reporting culture often shows more near misses, not fewer.",
        },
        {
          question: "Which intervention acts at a stronger leverage point than adding another checklist item?",
          options: [
            "Raising the approval budget for the governance team by a fifth",
            "Adding one more sign-off for every new AI request that arrives",
            "Creating a fast track rule so low-risk uses are approved quickly",
            "Asking reviewers to work through the whole request queue much faster",
          ],
          correctIndex: 2,
          explanation:
            "A fast-track rule changes how the system routes work, which is a rule-level intervention. Budgets and speed are parameters, and an extra sign-off adds to the bottleneck.",
        },
        {
          question: "Why does a balancing loop of 'report, learn, adjust controls' often fail to work?",
          options: [
            "Because balancing loops cannot exist in governance processes",
            "Because it depends on people reporting, which needs safety to report",
            "Because it only works once an external regulator has become involved",
            "Because learning from incidents always takes longer than a year",
          ],
          correctIndex: 1,
          explanation:
            "The loop is driven by reports. If reporting is unsafe or nothing visibly happens afterwards, the flow of reports dries up and the loop stops correcting anything.",
        },
      ],
    },

    // ── 1.4 ─────────────────────────────────────────────────────────────
    {
      title: "Who owns what: accountability and proportionate governance",
      objective:
        "Assign clear ownership for an AI use case and decide how much governance it needs in proportion to its potential harm.",
      durationMinutes: 24,
      contentType: "article",
      bodyMd: `## Every AI use needs an owner

The single most useful governance rule is simple: **every AI system in use has one named accountable owner**, by role. Not a committee, not "IT", not the vendor. One role that answers for what the system does, signs off changes, and is told when something goes wrong.

The owner is usually the head of the business area that benefits from the system, not the technical team that runs it. If an AI tool helps decide which insurance claims to fast-track, the claims director owns it. IT may operate it, data protection may advise on it, but the business owner answers for it. This keeps accountability with the person who chose to accept the benefit and the risk.

## A simple ownership map

For each AI use, write down four roles. A RACI chart (responsible, accountable, consulted, informed) is a common way to do this.

| Role | Typical holder | What they do |
|---|---|---|
| **Accountable owner** | Head of the business area | Approves use, accepts residual risk, signs off changes |
| **Operator** | IT, data or the vendor | Runs it day to day, monitors, applies updates |
| **Advisers** | Data protection, legal, security, HR | Assess risk in their area and set conditions |
| **Users** | Staff who use the output | Use it as intended, report problems |

Write the escalation route alongside it: who a user contacts when the system behaves oddly, and how fast the owner must be told.

## Three lines

Many organisations already use the **Three Lines Model** from internal audit practice. It fits AI well:

- **First line**: the business teams that own and use AI, and manage its risk day to day.
- **Second line**: specialist functions (risk, compliance, data protection, security) that set standards, advise and challenge.
- **Third line**: internal audit, which gives independent assurance that the first two lines are working.

The common mistake is to make the second line the owner. When compliance "owns" AI, the business treats governance as someone else's job and routes around it. Compliance should challenge the owner, not replace them.

## Proportionate governance

Treating every AI use the same is a mistake in both directions. Heavy process on trivial uses wastes effort and drives shadow AI (Lesson 3). Light process on high-impact uses invites harm.

A simple three-tier approach many organisations start with:

- **Low**: internal productivity uses with no personal data and a person reviewing output (drafting, summarising public material). Register it, follow the acceptable use policy, done.
- **Medium**: uses involving personal or confidential data, customer-facing output, or automation without review of every item. Needs a short risk assessment, a named owner and monitoring.
- **High**: uses that inform decisions about people's rights, money, jobs, health, education or access to services, or that fall in a regulated high-risk category. Needs a full impact assessment, testing, human oversight design, documented sign-off and regular review.

You will build a proper classification in Module 3 and see how regulation shapes the high tier in Module 2.

## What the owner needs from you

Owners are busy and rarely experts in AI. Governance works when you make ownership easy: a one-page summary of the system, the main risks in plain language, the conditions they are agreeing to, and the date of the next review. If being an owner feels like a trap, nobody will volunteer, and systems will run unowned.

## Try it now

Choose one AI use in your organisation, or the illustrative case of "an AI tool that summarises calls in a council's housing advice line". Use the practice pad to draft the ownership map.

\`\`\`try
For this AI use: [DESCRIBE IN TWO SENTENCES], draft an ownership map with: the accountable owner (by role), the operator, the advisers who must be consulted and what each would check, the users, and an escalation route with a time limit for telling the owner about a problem. Then suggest whether this use is low, medium or high in a three-tier model and give two reasons.
\`\`\`

You are done when every row has a role (not a team name), the escalation route has a time limit, and you can defend the tier you chose in one sentence.`,
      microCheck: [
        {
          question:
            "An AI tool helps decide which claims are fast-tracked. IT runs it and compliance advises. Who should be its accountable owner?",
          options: [
            "The head of IT, because the IT team runs the system each day",
            "The claims director, because the claims area takes the benefit",
            "The compliance lead, because compliance sets the AI standards",
            "The vendor's account manager, because the vendor built the tool",
          ],
          correctIndex: 1,
          explanation:
            "Accountability should sit with the business owner who chose to accept the benefit and the risk. IT operates, compliance advises and challenges, and the vendor is not accountable for your decisions.",
        },
        {
          question: "What is the common mistake when applying the Three Lines Model to AI?",
          options: [
            "Letting internal audit give independent assurance on all AI use too",
            "Making the second line the owner, so the business routes around it",
            "Asking business teams to manage AI risk in their own area",
            "Having specialists set standards and challenge the business",
          ],
          correctIndex: 1,
          explanation:
            "When compliance or risk owns AI, the business treats governance as someone else's job. The second line should advise and challenge, while the first line owns and manages the risk.",
        },
        {
          question: "Why can heavy governance on low-risk AI uses increase overall risk?",
          options: [
            "Because low-risk uses become high risk once they are reviewed",
            "Because slow processes push staff towards unapproved tools",
            "Because regulators penalise organisations for over-reviewing",
            "Because heavy review always introduces new errors",
          ],
          correctIndex: 1,
          explanation:
            "Disproportionate process feeds the shadow AI loop: staff bypass slow approvals, visibility drops and real risks go unseen. Proportionality keeps effort on the uses that can do real harm.",
        },
        {
          question: "Which use belongs in the high tier of the simple three-tier model?",
          options: [
            "Drafting internal newsletter headlines that a person then edits",
            "Summarising public reports for a team's own background reading list",
            "Ranking applicants for social housing before a caseworker decides",
            "Suggesting meeting agenda items from a shared team calendar",
          ],
          correctIndex: 2,
          explanation:
            "Informing decisions about access to housing affects people's rights and essential services, which is the defining feature of the high tier. The others are internal productivity uses with review.",
        },
      ],
    },
  ],
  quiz: [
    {
      question:
        "A bank's AI model for flagging fraud was accurate at launch but has grown less accurate over a year. What is the most likely cause?",
      options: [
        "The model has been tampered with by someone in the bank",
        "Patterns in the world have shifted away from its training data",
        "The model was always inaccurate and nobody noticed at the time",
        "Fraud models lose accuracy each time they are switched off",
      ],
      correctIndex: 1,
      explanation:
        "Predictive models drift as the world changes: customer behaviour and fraud patterns move on. Monitoring exists to catch this; tampering is possible but is not the usual explanation.",
    },
    {
      question:
        "Staff use a free AI tool on personal accounts because the approved tool takes months to procure. What is the governance problem?",
      options: [
        "Free tools are always less accurate than tools that are paid for",
        "The organisation loses sight of data and decisions handled by AI",
        "Personal accounts cannot legally be used for any work task at all",
        "Staff will become too dependent on AI to do their work without it",
      ],
      correctIndex: 1,
      explanation:
        "Shadow AI means data and decisions flow through tools the organisation cannot see, secure or audit. The deeper fix is usually a faster route to approved tools, not just a ban.",
    },
    {
      question: "Which commitment best turns 'accountability' into something checkable?",
      options: [
        "Leadership is fully accountable for all of our use of AI",
        "Each system in the register names one owner who signs off changes",
        "We hold ourselves to the highest standards of AI accountability",
        "Accountability is shared across all teams that touch the system",
      ],
      correctIndex: 1,
      explanation:
        "A named owner per system who signs off changes can be verified in the register. Shared or general accountability statements leave nobody answering for a specific system.",
    },
    {
      question:
        "A governance team's KPI is 'percentage of staff who completed AI training'. Completion reaches 98% but misuse continues. Why?",
      options: [
        "Training never has any effect on behaviour at work",
        "The measure rewards completing, not understanding or changed habits",
        "98% is below the level at which training starts to have an effect",
        "Misuse is caused only by the 2% who did not finish the training",
      ],
      correctIndex: 1,
      explanation:
        "This is Goodhart's law: once completion is the target, people click through. Pair it with a measure that resists gaming, such as a short scenario check or sampled observations of practice.",
    },
    {
      question:
        "An HR team adopts an AI screening tool and saves time. Rejected candidates never learn AI was involved. Whose interests are most at risk?",
      options: [
        "The HR team's, because they rely on a tool they do not understand",
        "The vendor's, because its tool may be blamed if anything goes wrong",
        "The candidates', who carry the harm without knowing why",
        "The organisation's finance team, which pays for the licence",
      ],
      correctIndex: 2,
      explanation:
        "The people harmed are not the people who chose the tool and they cannot challenge what they cannot see. Transparency and oversight exist partly to protect those outside the decision.",
    },
    {
      question: "Why do many published responsible AI principles change little in practice?",
      options: [
        "Because they are almost always factually wrong about AI",
        "Because they give nobody a specific action or a way to check",
        "Because regulators forbid organisations from publishing them",
        "Because they are written only for engineers and data scientists",
      ],
      correctIndex: 1,
      explanation:
        "A principle like 'we will be fair' is not wrong, but it does not say what will be true, how anyone will know or who checks. Checkable commitments fix that.",
    },
    {
      question:
        "Which is the best example of a governance intervention at the level of information flows?",
      options: [
        "Increasing the governance team's headcount by one analyst",
        "Publishing the AI register so teams can reuse approved tools",
        "Requiring a director's signature on every single AI request",
        "Lowering the risk threshold used to trigger a full assessment",
      ],
      correctIndex: 1,
      explanation:
        "Making approved tools visible changes what people know and therefore what they do. Headcount and thresholds are parameters, and extra signatures add to the bottleneck.",
    },
    {
      question:
        "A council's AI tool ranks housing applicants before a caseworker decides. How should it be governed?",
      options: [
        "Lightly, because a caseworker makes the final decision anyway",
        "As high risk, with impact assessment, testing and oversight design",
        "As medium risk, because the tool only produces a ranked list",
        "Not at all, because public bodies are exempt from AI rules",
      ],
      correctIndex: 1,
      explanation:
        "Informing decisions about access to essential services is high impact even when a person decides, because rankings shape what the caseworker sees. It needs the full set of controls.",
    },
    {
      question: "What is the main purpose of AI governance in this track's definition?",
      options: [
        "To slow AI adoption until regulation is fully settled everywhere",
        "To let the organisation use AI knowingly and fix problems fast",
        "To transfer the risk of AI use to vendors through contracts",
        "To ensure that only the IT department can approve AI tools",
      ],
      correctIndex: 1,
      explanation:
        "Governance is the rules, roles and routines for deciding which AI to use and who answers for it. It enables informed use rather than blocking it or shifting responsibility elsewhere.",
    },
    {
      question:
        "A connected AI assistant reads supplier emails. One contains text telling the assistant to change bank details. What is this?",
      options: [
        "A hallucination, because the model invented an instruction",
        "Prompt injection, an attempt to give instructions through content",
        "A bias failure, because the supplier is treated differently",
        "A data protection breach, because an email contains a name",
      ],
      correctIndex: 1,
      explanation:
        "Text in content that tries to direct the AI is prompt injection. It is a security risk that grows when the assistant can take actions, so controls must limit what it can do.",
    },
    {
      question:
        "After a minor AI incident, the response is to add three new approval steps for all AI use. What is the likely systemic effect?",
      options: [
        "Incidents fall sharply because every use is now reviewed in detail",
        "The backlog grows and more staff bypass the process entirely",
        "Nothing changes, because approval steps do not affect behaviour",
        "Vendors take over responsibility for approving each AI request",
      ],
      correctIndex: 1,
      explanation:
        "Blanket extra steps slow everything and feed the shadow AI loop. A proportionate response targets the controls at the kind of use where the incident happened.",
    },
  ],
}];
