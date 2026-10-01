import type { SeedModule } from "../types";

// AI Governance, Risk and Compliance. Module 3: Assessing AI Risk.
// Worked examples are illustrative; all figures in them are invented for
// practice and labelled as such.

export const GOV_MODULE_3: SeedModule[] = [{
  title: "Assessing AI Risk",
  summary:
    "Find the AI your organisation already uses and record it in a use-case register, classify risk consistently, run impact assessments including data protection impact assessments, test for bias and unfair outcomes, assess third-party models and document every decision so it can be explained later.",
  lessons: [
    // ── 3.1 ─────────────────────────────────────────────────────────────
    {
      title: "Finding your AI: the inventory and use-case register",
      objective:
        "Build an AI inventory from several discovery routes and record each use in a register with the fields governance needs.",
      durationMinutes: 24,
      contentType: "article",
      bodyMd: `## You cannot govern what you cannot see

Every AI governance programme starts with the same question: what AI are we actually using? The honest answer is usually "more than we thought". AI arrives through official projects, but also through features switched on in software you already pay for, free tools used by individual staff, and vendors who added AI to their service without much announcement.

An **AI inventory** is the list of AI systems and tools in use. A **use-case register** goes one step further: it records each **use** (what the AI is used for, by whom, on what data), because the same tool can be low risk in one use and high risk in another. A general assistant drafting internal notes and the same assistant drafting decisions on complaints are two entries, not one.

## Discovery routes

No single route finds everything. Use several.

- **Ask people**, with an amnesty. A short survey that says "tell us what you use, nobody is in trouble" finds far more than one that sounds like an audit. Shadow AI shrinks when declaring it is safe.
- **Procurement and finance records.** Look for AI vendors, subscriptions on expense claims and corporate cards, and renewals where the product now includes AI features.
- **IT signals.** Single sign-on logs, browser extension lists, network or security tooling that shows traffic to AI services, and the admin settings of your main software suites, where AI features may be on by default.
- **Vendor questionnaires.** Ask your key suppliers whether they use AI in delivering services to you, especially where they handle your data or make decisions on your behalf.
- **Project and change pipelines.** Add a question to your project intake and change approval forms: "Does this involve AI?"

## What to record

A register only helps if it holds the information later decisions need. A practical starting set of fields:

| Field | Why it matters |
|---|---|
| Use-case name and short description | So anyone can understand it |
| Business owner (role) | Accountability, from Module 1 |
| Tool or system, vendor, version or model if known | Vendor risk and change tracking |
| Users and number of people affected | Scale of impact |
| Data used (personal, special category, confidential) | Data protection and security |
| Decision type: informs, recommends or decides | Human oversight and automated decision rules |
| Who is affected by the output | Fairness and transparency |
| Countries and sector | Which laws apply |
| Risk tier and date assessed | Proportionate controls |
| Assessments done (risk, DPIA, others) | Evidence |
| Status and next review date | Keeps it alive |

Keep it in a tool people can reach: a shared spreadsheet is fine to start with. The perfect database that nobody updates is worse than a simple sheet that stays current.

## Keeping it alive

An inventory decays from the day it is finished. Treat it as a stock with inflows and outflows (Module 1): new uses come in through intake forms and procurement, old ones leave when retired. Build the flows, not just the list:

- New AI uses are added through the intake route before go-live.
- Owners confirm their entries at each review date.
- Procurement cannot complete a purchase with AI features until the register entry exists.
- A quarterly sweep repeats the discovery routes.

## Use AI to draft, not to discover

AI can help you structure what you find, but it cannot discover your organisation's tools for you.

\`\`\`try
I am building an AI use-case register. Here are rough notes from a staff survey (no confidential details): [PASTE OR INVENT FIVE SHORT NOTES, E.G. "SALES TEAM USES A FREE ASSISTANT TO WRITE PROPOSALS"].

Turn each note into a register row with these fields: use-case name, description, likely owner role, tool, data used, decision type (informs, recommends or decides), who is affected, and a first-pass risk tier (low, medium or high) with a one-line reason. Mark every field you had to guess with [CHECK].
\`\`\`

## Try it now

Start your register with at least five real or realistic uses from your organisation, found through at least two different discovery routes. Fill in every field you can and mark the rest as unknown.

You are done when each row has an owner role and a decision type, and you have listed which discovery route found it.`,
      microCheck: [
        {
          question: "Why does a use-case register record uses rather than just tools?",
          options: [
            "Because tools change their names too often to track reliably",
            "Because one tool can be low risk in one use and high in another",
            "Because regulators require a separate register for each tool",
            "Because uses are easier to count than tools across an organisation",
          ],
          correctIndex: 1,
          explanation:
            "Risk depends on what the AI is used for, on what data and with what effect. The same assistant drafting internal notes and drafting complaint decisions needs different controls.",
        },
        {
          question: "Which discovery route is most likely to surface AI that staff are afraid to declare?",
          options: [
            "A formal audit announcing penalties for unapproved tools",
            "A survey with a clear amnesty for anything declared",
            "A policy reminder sent to every member of staff",
            "A review of the official project portfolio only",
          ],
          correctIndex: 1,
          explanation:
            "People declare shadow AI when it is safe to do so. An amnesty survey finds far more than an audit framed around penalties, which pushes use further out of sight.",
        },
        {
          question: "A software suite you already use adds AI features switched on by default. How should this be handled?",
          options: [
            "Ignore it, because the suite was already approved before",
            "Treat it as a new use to register and assess for risk",
            "Ask staff to avoid the features without any further review",
            "Leave it to the vendor, since it is the vendor's feature",
          ],
          correctIndex: 1,
          explanation:
            "New AI features change what the software does with your data and how decisions are made. They need registering and assessing like any other use, even inside an approved product.",
        },
        {
          question: "What keeps a register current over time?",
          options: [
            "A thorough one-off discovery exercise done very carefully",
            "Flows that add and retire entries through normal processes",
            "A larger spreadsheet with many more fields for each row",
            "An annual reminder email asking people to update their rows",
          ],
          correctIndex: 1,
          explanation:
            "A register is a stock that decays. Intake forms, procurement gates, owner reviews and periodic sweeps keep entries flowing in and out, which a one-off exercise cannot do.",
        },
        {
          question: "Which register field most directly supports decisions about human oversight?",
          options: [
            "The vendor's name and the version of the model in use",
            "Whether the output informs, recommends or decides",
            "The number of licences the organisation has bought",
            "The date the tool was first used in the organisation",
          ],
          correctIndex: 1,
          explanation:
            "Whether the AI informs, recommends or decides tells you how much oversight is needed and whether automated decision rules might apply. Vendor, licences and dates serve other purposes.",
        },
      ],
    },

    // ── 3.2 ─────────────────────────────────────────────────────────────
    {
      title: "Classifying risk and recording the decision",
      objective:
        "Classify an AI use with a consistent set of risk factors and record the decision, its reasoning and its revisit triggers.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## Consistency beats precision

Risk classification decides how much governance each use gets. The goal is not a perfect score. It is a **consistent** one: two assessors looking at the same use should land in the same tier for the same reasons. That makes your decisions defensible, and it stops the tier depending on who happened to review the request.

## The factors

Most good classification schemes look at a similar set of factors. Score each low, medium or high for the use in front of you.

1. **Impact on people.** Does the output affect someone's rights, money, job, health, education, housing or access to services?
2. **Decision role.** Does the AI inform a person, recommend an answer, or decide on its own?
3. **Reversibility.** If it is wrong, can the effect be undone easily, or not at all (a payment sent, a person rejected)?
4. **Scale.** How many people or transactions does it touch?
5. **Data sensitivity.** Personal data? Special category data such as health? Confidential business data?
6. **Vulnerability.** Are the people affected likely to be vulnerable, such as children, patients, or people in financial difficulty?
7. **Autonomy and connectivity.** Can it take actions through tools, or reach external systems?
8. **Regulatory category.** Is the use in a regulated high-risk area (Module 2), or covered by sector rules?

## From factors to a tier

Two rules turn the factors into a tier:

- **Any single high in impact on people, regulatory category or irreversible decisions puts the use in the high tier**, whatever the other scores. Some harms are too serious to average away.
- Otherwise, the overall pattern decides: mostly low is low; a mix with some medium is medium.

Avoid adding scores into a single number and setting thresholds on it. Averaging lets a serious factor hide behind several trivial ones, and numbers invite false precision.

## Inherent and residual risk

**Inherent risk** is the risk before controls. **Residual risk** is what remains after them. Classify on inherent risk to decide which controls are needed; then judge residual risk to decide whether the owner can accept it. A CV screening tool is inherently high risk. With good oversight, testing and transparency its residual risk may be acceptable. Without them, it is not.

## Practise spotting the risk

Use the tool below to practise reading scenarios for the factors that matter.

\`\`\`studio
spot-the-risk
\`\`\`

## The decision record

Every classification and every approval is a decision someone may need to explain later: to an auditor, a regulator, a court or a journalist. Write it down at the time, briefly.

A **decision record** has:

- **Decision**: what was decided (approved, approved with conditions, rejected, deferred).
- **Context**: the use, the tier and the key factors.
- **Options considered**: including doing nothing or a non-AI alternative.
- **Reasoning**: why this option, in a few sentences.
- **Risks accepted**: what residual risk the owner is knowingly carrying.
- **Conditions**: controls that must be in place, with owners.
- **Who decided and when.**
- **Revisit triggers**: what would reopen the decision (a model change, a complaint, a new law, a scale increase).

Revisit triggers are the most often forgotten and the most useful. They turn a one-off approval into part of a feedback loop.

## A worked example

Imagine a housing association that wants AI to sort repair requests by urgency.

- Impact: medium to high (a missed urgent repair can affect health and safety).
- Decision role: recommends; staff confirm.
- Reversibility: partly reversible, but delays to urgent repairs may cause harm.
- Scale: all tenants. Vulnerability: some tenants are elderly or disabled.
- Tier: **high**, because of the safety impact and vulnerable people.
- Conditions: any request mentioning gas, water leaks, electrics or vulnerability is always routed to a person first; weekly sample review; tenants can call to escalate.
- Revisit triggers: any complaint about a missed urgent repair, a model change, or expansion to new request types.

## Try it now

\`\`\`try
Classify this AI use for governance: [DESCRIBE THE USE].

Score each factor low, medium or high with a one-line reason: impact on people, decision role, reversibility, scale, data sensitivity, vulnerability, autonomy and connectivity, regulatory category. Apply this rule: any high in impact, regulatory category or irreversibility means high tier. Then draft a decision record with conditions and at least three revisit triggers.
\`\`\`

Run it on one use from your register, then correct anything you disagree with. You are done when you have a tier, a decision record and three revisit triggers you would actually monitor.`,
      microCheck: [
        {
          question:
            "An AI use scores low on six factors but high on irreversibility because it sends payments. Which tier should it get?",
          options: [
            "Low, because most of its factor scores are low overall",
            "High, because an irreversible harm cannot be averaged away",
            "Medium, because the high and low scores balance each other",
            "Unclassified, until the payments have been running a month",
          ],
          correctIndex: 1,
          explanation:
            "Some harms are too serious to average away. A single high on impact, regulatory category or irreversibility should put the use in the high tier whatever the other scores.",
        },
        {
          question: "What is the difference between inherent and residual risk?",
          options: [
            "Inherent risk is legal risk; residual risk is the financial risk",
            "Inherent risk is before controls; residual risk remains after them",
            "Inherent risk is the vendor's; residual risk is the organisation's",
            "Inherent risk applies at launch; residual risk applies at retirement",
          ],
          correctIndex: 1,
          explanation:
            "Inherent risk is assessed before controls and drives which controls are needed. Residual risk is what remains after them, and the owner decides whether it is acceptable.",
        },
        {
          question: "Why are revisit triggers the most useful part of a decision record?",
          options: [
            "They prove the decision was approved by the right people",
            "They reopen the decision when the facts behind it change",
            "They let the organisation skip any future scheduled reviews",
            "They transfer responsibility to whoever spots the trigger",
          ],
          correctIndex: 1,
          explanation:
            "Triggers such as a model change, a complaint or a new law turn a one-off approval into a feedback loop, so decisions are reconsidered when their assumptions stop holding.",
        },
        {
          question: "Why does the lesson advise against adding factor scores into a single number?",
          options: [
            "Because numbers cannot be stored in most risk registers",
            "Because a serious factor can hide behind several trivial ones",
            "Because regulators forbid numerical scoring of AI risk",
            "Because single numbers make classification far too slow",
          ],
          correctIndex: 1,
          explanation:
            "Summing or averaging lets one severe factor be diluted by several low ones, and a precise-looking number suggests more certainty than the judgement behind it.",
        },
      ],
    },

    // ── 3.3 ─────────────────────────────────────────────────────────────
    {
      title: "Impact assessments, including DPIAs",
      objective:
        "Carry out an AI impact assessment that also meets the needs of a data protection impact assessment, for a high-impact use case.",
      durationMinutes: 27,
      contentType: "article",
      bodyMd: `## What an impact assessment is for

An **impact assessment** is a structured look at how a proposed system could affect people, done before it goes live, with the findings feeding into the design. Its value is not the document. It is the conversation it forces: what is this for, who does it affect, what could go wrong for them, and what will we do about it?

Several kinds overlap:

- A **data protection impact assessment (DPIA)** is required under GDPR-style laws where processing is likely to result in high risk to people (Module 2).
- An **AI or algorithmic impact assessment** looks more widely: fairness, explainability, the ability to challenge decisions, effects on staff, and wider social effects.
- Under the EU AI Act, certain deployers of high-risk systems, such as public bodies, must assess the impact on **fundamental rights**.

Where several apply, do **one combined assessment** with sections that meet each requirement, rather than three separate documents that drift apart. Ask your data protection officer to confirm that the combined version meets your DPIA duty.

## The sections

A practical combined assessment has eight parts.

1. **Description.** What the system does, its purpose, the data it uses and where that data comes from, the vendor and model, and who uses the output.
2. **Necessity and proportionality.** Why AI, and why this design? What is the non-AI alternative? Is the data used limited to what is needed? What is the lawful basis?
3. **Affected people.** Who is affected, directly and indirectly, including people who never interact with the system. Which groups might be affected differently?
4. **Risks to people.** For each group: accuracy errors, unfair outcomes, privacy intrusion, security exposure, loss of ability to understand or challenge a decision. Rate likelihood and severity.
5. **Measures.** For each significant risk, the control: design change, human oversight, testing, transparency, a route to challenge.
6. **Consultation.** Who was asked. The data protection officer must be consulted for a DPIA. Where reasonable, ask affected people or their representatives: a tenants' panel, a staff forum, a patient group.
7. **Residual risk and sign-off.** What risk remains, who accepts it, and on what conditions. Under GDPR, if high residual risk cannot be reduced, the data protection authority must be consulted before processing begins.
8. **Review.** When it will be reviewed and what would trigger an earlier review.

## Doing it well

The difference between a useful assessment and a box-ticking one:

- **Start early.** An assessment done after the contract is signed can only document risks, not design them out.
- **Be specific.** "There is a risk of bias" says nothing. "Applicants who took career breaks may be ranked lower because the model weights continuous employment" can be tested and fixed.
- **Include the people who are not in the room.** The person refused, the colleague whose job changes, the family member whose data appears in a case file.
- **Link risks to measures one to one.** Every significant risk should have a named control or an explicit acceptance.

## A worked fragment

Imagine a lender using AI to recommend approval or decline for small personal loans.

- **Risk**: applicants with thin credit files (such as recent arrivals or young people) receive more declines because the model has less information about them, not because they are riskier.
- **Likelihood**: medium. **Severity**: high (loss of access to credit, possible push towards worse lenders).
- **Measures**: compare decline rates and error rates by group before launch and quarterly; route thin-file applications to a trained underwriter with authority to approve; give declined applicants the main reasons and a route to ask for human review.
- **Residual risk**: medium, accepted by the head of lending with the conditions above; review after the first quarter.

## Try it now

\`\`\`try
Help me draft a combined AI and data protection impact assessment for this illustrative use case: [E.G. AN AI TOOL THAT SHORTLISTS CANDIDATES FOR ENTRY-LEVEL JOBS AT A RETAILER].

Use eight sections: description, necessity and proportionality (including lawful basis), affected people, risks to people (with likelihood and severity), measures linked one to one to risks, consultation, residual risk and sign-off, review. Be specific: name groups who could be affected differently and why. Mark anything I must confirm with my data protection officer.
\`\`\`

Then edit the draft: delete anything generic, and add one risk the AI missed. You are done when every significant risk has a named measure or an explicit acceptance, and you have added one risk of your own.`,
      microCheck: [
        {
          question:
            "An organisation needs a DPIA, an AI impact assessment and a fundamental rights assessment for one system. What is the best approach?",
          options: [
            "Three separate documents, each owned by a different team",
            "One combined assessment with sections meeting each need",
            "Only the DPIA, since it is the one most clearly required",
            "Only the AI assessment, since it is the widest in scope",
          ],
          correctIndex: 1,
          explanation:
            "A combined assessment avoids duplication and drift while meeting each requirement. The data protection officer should confirm that it satisfies the DPIA duty.",
        },
        {
          question: "Which statement of risk is most useful in an impact assessment?",
          options: [
            "There is some risk that the system may be biased in places",
            "Career-break applicants may rank lower as gaps are penalised",
            "The system could potentially lead to unfair outcomes overall",
            "Bias is a well-known risk that applies to all AI systems",
          ],
          correctIndex: 1,
          explanation:
            "A specific risk names the group, the mechanism and the effect, so it can be tested and fixed. Generic statements about bias give nobody anything to act on.",
        },
        {
          question: "Under GDPR, what must happen if a DPIA finds a high residual risk that cannot be reduced?",
          options: [
            "The project can go ahead if the board formally accepts it",
            "The data protection authority is consulted before processing",
            "The vendor takes over legal responsibility for the processing",
            "The DPIA is repeated until it reaches a lower risk rating",
          ],
          correctIndex: 1,
          explanation:
            "Where high risk remains after mitigation, the controller must consult the data protection authority before starting. Board acceptance or repeating the assessment does not replace this.",
        },
        {
          question: "Why should an impact assessment start before the contract is signed?",
          options: [
            "Because contracts cannot be signed until a DPIA is published",
            "Because risks found early can be designed out, not just noted",
            "Because vendors refuse to share details after contracts are signed",
            "Because assessments done later are not legally valid documents",
          ],
          correctIndex: 1,
          explanation:
            "Early assessment can still change the design, the vendor choice or the contract terms. Once committed, the assessment can often only document risks rather than reduce them.",
        },
        {
          question: "Who should usually be consulted during an AI impact assessment for a high-impact use?",
          options: [
            "Only the vendor, as it knows the system in the most detail",
            "The DPO and, where reasonable, affected people or their representatives",
            "Only the project team, to keep the assessment confidential",
            "Only senior leadership, as they will sign off the residual risk",
          ],
          correctIndex: 1,
          explanation:
            "The data protection officer must be consulted for a DPIA, and affected people or their representatives see risks the project team cannot. Vendor input is useful but not enough.",
        },
      ],
    },

    // ── 3.4 ─────────────────────────────────────────────────────────────
    {
      title: "Bias and fairness testing basics, including third-party models",
      objective:
        "Plan a basic fairness test for an AI use, choose a suitable measure, and set out what to require from a vendor whose model you do not control.",
      durationMinutes: 27,
      contentType: "article",
      bodyMd: `## Fairness has to be measured, not assumed

Nobody sets out to build an unfair system. Unfair outcomes come from historical data, from proxies (a postcode standing in for ethnicity or income), from who is represented in testing, and from how the output is used. You only know whether a system treats groups differently by looking.

This lesson covers the basics a governance lead needs to commission and read a fairness test. Detailed statistical work belongs with specialists, but you should know what to ask for and what a weak test looks like.

## Three common measures

**1. Outcome rates.** Compare the rate of a favourable outcome (shortlisted, approved, fast-tracked) between groups. In US employment practice a long-standing rule of thumb, the "four-fifths rule", treats a group's selection rate below 80 percent of the highest group's rate as a signal of possible adverse impact. It is a signal to investigate, not a legal safe harbour, and other countries use different tests.

**2. Error rates.** Compare how often the system is wrong for each group, and in which direction. A fraud model that wrongly flags one group's genuine claims more often places an unfair burden on them, even if overall accuracy looks fine.

**3. Calibration.** When the system says "70 percent likely", is that equally true for each group? A score that means different things for different groups misleads the people who rely on it.

An important limit: when groups differ in their underlying rates, these measures can pull against each other and it is generally not possible to satisfy all of them at once. Choosing which matters most for this use is a **values decision**, so it belongs to the accountable owner with advice, recorded in the decision record, not buried in a technical report.

## Running a basic test

1. **Define the groups**, starting with those protected by equality law where you operate (such as sex, ethnicity, age, disability), plus any groups the impact assessment flagged (such as thin credit files or career breaks).
2. **Get the data lawfully.** Testing may need sensitive data you do not normally hold. Options include data collected for monitoring with a proper basis, voluntary surveys, or careful estimation. Agree the approach with your data protection officer.
3. **Choose the measure** that matches the harm: outcome rates for access decisions, error rates where false accusations or missed needs are the harm.
4. **Use enough cases.** Small groups give noisy results. Report the numbers behind every percentage.
5. **Set thresholds and actions in advance.** Decide what gap triggers investigation and who acts, before you see the results.
6. **Repeat.** Test before launch, after any model change and on a schedule, because populations and models drift.

## Generative AI is not exempt

Fairness testing is not only for scoring models. A drafting assistant can write differently for different names, an assistant can give lower-quality answers in some languages, and a summariser can drop details that matter more to some groups. Test with paired inputs that differ only in a name, a language or a group marker, and compare the outputs.

## When the model is someone else's

Most organisations use vendor models they cannot inspect. You are still responsible for the outcomes of your use. Ask the vendor:

- What fairness testing has been done, on which groups, with which measures, and can we see the results?
- Was it tested on a population like ours?
- What data was it trained on, at least in outline?
- What changes when the model is updated, and will we be told in advance?

Then **test it yourself** on your own population and use case. A vendor's general test does not show how the tool behaves with your applicants, customers or citizens.

## Try it now

\`\`\`try
Run a paired fairness probe. Write a short, neutral reference for a job applicant named [NAME A] who worked as a [JOB] for [3] years. Then write the same reference for [NAME B], with every other detail identical. Present both, then list every difference between them in wording, tone or claims.
\`\`\`

Try it with names that suggest different sexes or backgrounds. You are done when you have written down whether any differences appeared and one test you would add to a proper fairness plan as a result.`,
      microCheck: [
        {
          question:
            "A fraud model is accurate overall but wrongly flags genuine claims from one group twice as often. Which measure reveals this?",
          options: [
            "Overall accuracy across every claim the model has scored",
            "Comparing error rates between groups, by type of error",
            "Comparing how quickly the model processes each claim type",
            "Counting how many claims each group submits in a month",
          ],
          correctIndex: 1,
          explanation:
            "Overall accuracy can hide uneven errors. Comparing false positive and false negative rates by group shows who carries the burden of the model's mistakes.",
        },
        {
          question: "What is the status of the four-fifths rule in this lesson?",
          options: [
            "A legal safe harbour that proves a tool is lawful everywhere",
            "A US rule of thumb that signals possible adverse impact",
            "A requirement written into the text of the EU AI Act",
            "A statistical law that applies to all fairness measures",
          ],
          correctIndex: 1,
          explanation:
            "The four-fifths rule is a long-standing US employment rule of thumb that flags a possible problem to investigate. It is not a safe harbour and other countries use different tests.",
        },
        {
          question: "Why is choosing a fairness measure described as a values decision?",
          options: [
            "Because all fairness measures always give the same result",
            "Because measures can conflict, so someone must choose what matters",
            "Because data scientists are not allowed to calculate fairness",
            "Because regulators set one measure that applies to every use",
          ],
          correctIndex: 1,
          explanation:
            "When groups differ in underlying rates, fairness measures can pull against each other. Deciding which matters most for a use is a judgement for the accountable owner, recorded with reasons.",
        },
        {
          question: "A vendor shares fairness test results from its general testing. What should you still do?",
          options: [
            "Nothing, because the vendor's results cover all possible uses",
            "Test the tool on your own population and use case as well",
            "Ask the vendor to sign a statement that the tool is unbiased",
            "Publish the vendor's results on your website as your own",
          ],
          correctIndex: 1,
          explanation:
            "A vendor's general test does not show how the tool behaves with your population and task. You remain responsible for outcomes in your use, so test locally too.",
        },
      ],
    },
  ],
  quiz: [
    {
      question:
        "A survey finds the sales team uses a free assistant to draft client proposals containing pricing. What should go in the register?",
      options: [
        "Nothing, because free tools are outside the governance scope",
        "A use entry with owner, data used, decision type and a tier",
        "A note to block the tool before anything else is recorded",
        "Only the tool's name, since the use is already obvious",
      ],
      correctIndex: 1,
      explanation:
        "Every use goes in the register with the fields later decisions need. Confidential pricing data makes this at least medium risk; blocking first loses the visibility the survey just gained.",
    },
    {
      question:
        "Two assessors classify the same use differently, one medium and one high. What does this most suggest?",
      options: [
        "One assessor is careless and should be removed from the role",
        "The scheme is not consistent enough and needs clearer rules",
        "The use should be rejected because it is too hard to classify",
        "The average of medium and high should be used as the tier",
      ],
      correctIndex: 1,
      explanation:
        "Classification is valuable because it is consistent. Disagreement points to unclear factors or rules, which should be fixed so the tier does not depend on who reviewed it.",
    },
    {
      question: "Which use is most clearly high tier under the factor approach in this module?",
      options: [
        "An assistant drafting internal notes on public market reports",
        "A tool recommending which tenants' repairs are urgent",
        "A tool suggesting tags for photos in the marketing library",
        "An assistant reformatting the staff handbook into a FAQ",
      ],
      correctIndex: 1,
      explanation:
        "Repair urgency affects health and safety and involves vulnerable tenants, so impact on people is high. The other uses are internal and low impact.",
    },
    {
      question: "What should a decision record include beyond the decision itself?",
      options: [
        "The full source code of the AI system and its training data",
        "Options, reasoning, risks accepted, conditions and revisit triggers",
        "A list of every member of staff who will use the AI system",
        "The vendor's marketing materials and the pricing they offered",
      ],
      correctIndex: 1,
      explanation:
        "A useful record explains why the decision was made, what risk was accepted, on what conditions, and when it should be reopened. Code, staff lists and marketing are not the point.",
    },
    {
      question:
        "A lender's model declines applicants with thin credit files more often. Which measure in the impact assessment best addresses this?",
      options: [
        "Remove the credit file data entirely from every application",
        "Route thin-file cases to a trained underwriter with authority",
        "Tell thin-file applicants to reapply after a full year",
        "Accept the pattern as it reflects the model's training data",
      ],
      correctIndex: 1,
      explanation:
        "Routing affected cases to a person with authority to approve tackles the specific mechanism while keeping the model's benefits. Removing data or accepting the pattern does not address the harm.",
    },
    {
      question: "Why is a combined impact assessment usually better than separate ones?",
      options: [
        "Because separate assessments are not allowed under GDPR",
        "Because it avoids duplicated work and documents that drift apart",
        "Because it means the data protection officer need not be involved",
        "Because combined assessments do not need to be reviewed again",
      ],
      correctIndex: 1,
      explanation:
        "One assessment with sections for each requirement keeps the analysis consistent and saves effort. The data protection officer still needs to confirm it meets the DPIA duty, and it still needs review.",
    },
    {
      question:
        "Testing a fairness measure on a group of 12 people shows a large gap. What is the right response?",
      options: [
        "Conclude the system is biased and withdraw it immediately",
        "Treat it as a noisy signal and test with more cases",
        "Ignore it, because small groups never matter for fairness",
        "Publish the gap as proof of discrimination in the system",
      ],
      correctIndex: 1,
      explanation:
        "Small groups give noisy results, so a gap is a signal to investigate with more data, not proof either way. Ignoring small groups can also hide real harm to them.",
    },
    {
      question:
        "A generative assistant drafts references. How could you test it for unfair differences?",
      options: [
        "Ask the assistant directly whether it is biased against anyone",
        "Compare paired outputs that differ only in a name or group marker",
        "Check the length of each reference against a fixed word limit",
        "Read the vendor's general statement on responsible AI use",
      ],
      correctIndex: 1,
      explanation:
        "Paired inputs isolate the effect of a group marker on the output. Asking the model about itself or reading general statements gives no evidence about its behaviour.",
    },
    {
      question:
        "When should fairness thresholds and the actions they trigger be set?",
      options: [
        "After the results are in, so thresholds fit what was found",
        "Before testing, so results cannot shape the decision rule",
        "Only once a complaint has been made by an affected person",
        "Never, because thresholds are a matter for the regulator",
      ],
      correctIndex: 1,
      explanation:
        "Setting thresholds after seeing results invites moving the goalposts. Agreeing them in advance, with who acts, keeps the test honest.",
    },
    {
      question:
        "An AI use was approved six months ago. The vendor has since changed the underlying model. What should happen?",
      options: [
        "Nothing, since the original approval covered the tool by name",
        "The revisit trigger reopens the assessment and retesting",
        "The vendor should be asked to confirm nothing has changed",
        "Staff should be told to stop using the tool permanently",
      ],
      correctIndex: 1,
      explanation:
        "A model change is a classic revisit trigger: behaviour, accuracy and fairness can all shift. The decision should be reopened and key tests repeated, not assumed to still hold.",
    },
    {
      question: "Which discovery route is most likely to find AI features added to software you already pay for?",
      options: [
        "A survey of staff about the free tools they use at home",
        "Reviewing admin settings and renewals of existing software",
        "Reading industry news about new AI start-up companies",
        "Checking the list of projects in the official portfolio",
      ],
      correctIndex: 1,
      explanation:
        "AI features often arrive through updates and renewals of existing products, sometimes switched on by default. Admin settings and renewal terms reveal them.",
    },
  ],
}];
