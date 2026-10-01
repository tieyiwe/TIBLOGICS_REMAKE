import type { SeedModule } from "../types";

// AI Governance, Risk and Compliance. Module 5: Buying and Building Responsibly.
// Contract content is general education, not legal advice. Vendor examples
// are illustrative. The September 2026 disclosure delays are described no
// more strongly than in lib/blog/content/curated.ts.

export const GOV_MODULE_5: SeedModule[] = [{
  title: "Buying and Building Responsibly",
  summary:
    "Ask vendors the due diligence questions that matter, know the contract terms that protect you (data use, training on your data, liability, audit rights, exit), run procurement with checks scaled to risk, test vendor claims instead of believing them, and build in-house AI through clear governance gates.",
  lessons: [
    // ── 5.1 ─────────────────────────────────────────────────────────────
    {
      title: "Vendor due diligence: the questions that matter",
      objective:
        "Write a due diligence questionnaire for an AI vendor, scaled to the risk tier of the use, and judge which answers need evidence.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## You cannot outsource accountability

Buying an AI system moves the building work to someone else. It does not move the accountability. If a vendor's tool treats your customers unfairly or leaks your data, the people affected will hold you responsible, and so will most regulators. Due diligence is how you find out, before you sign, whether the vendor's practices are good enough for your use.

Scale the effort to the risk tier from Module 3. A low tier productivity tool needs a short check. A high tier decision system needs the full set of questions, with evidence.

## Seven areas to ask about

**1. The product and its intended use.** What exactly does it do? What uses does the vendor say it is not suitable for? Is your intended use within its intended use? A tool built for marketing copy is not designed for decisions about people.

**2. Data.** What data of yours does it process, where, and for how long? Is any of it used to train or improve the vendor's models, and can that be switched off contractually, not just in a setting? Who are the sub-processors (the vendor's own suppliers)? Where is data stored and processed?

**3. Model and change.** Which underlying model does it use, and is it the vendor's own or a third party's? How often does it change, and will you be told in advance? Can you stay on a version while you retest?

**4. Testing and performance.** How was it tested, on what data, with what measures? What were the results across different groups? What are the known limitations and failure modes?

**5. Security.** What security standards and independent assessments does the vendor hold? How are access, keys and logs handled? How do they defend against prompt injection and misuse if the tool connects to your systems or can take actions?

**6. Governance and compliance.** Who in the vendor is accountable for AI risk? Do they have an AI management system or align to a recognised framework? For regulated uses, what does the vendor provide to help you meet your obligations as a deployer (instructions for use, logs, documentation)?

**7. Incidents and support.** How will they tell you about incidents, and how fast? What support do they give during one? Have they had incidents, and what changed afterwards?

## Answers that need evidence

Some answers can be taken at face value for a low tier use. For medium and high tiers, ask for evidence:

| Claim | Evidence to ask for |
|---|---|
| "We do not train on your data" | The contract clause, not the marketing page |
| "Independently audited for security" | The report or certificate, its scope and date |
| "Tested for bias" | The method, groups, measures and results |
| "Compliant with AI regulation" | Which obligations, for which role, with what documents |
| "Humans review outputs" | Who, how many, what they check |

A vendor who will not provide evidence for a high tier use is giving you an answer, just not the one in the brochure.

## Why notification speed matters

In the AI agent incidents disclosed in September 2026, public disclosure came weeks after the events, and the Australian government criticised how long notification took. Whatever the rights and wrongs of those cases, the governance lesson is that "the vendor will tell us" is not a plan. Ask how quickly, by what route, and write it into the contract (next lesson).

## Draft a questionnaire

\`\`\`try
Draft a due diligence questionnaire for an AI vendor. Our use: [DESCRIBE IT]. Our risk tier: [LOW, MEDIUM OR HIGH].

Cover seven areas: product and intended use, data (including training on our data and sub-processors), model and change notification, testing and performance across groups, security, governance and compliance support for us as a deployer, and incidents. Scale the number of questions to the tier. For each question, say whether we need evidence and what form it should take.
\`\`\`

## Try it now

Run the prompt for one real or illustrative purchase, then cut it down: keep only the questions whose answers would change your decision. You are done when you have a questionnaire of a length suited to the tier, with the evidence requirements marked.`,
      microCheck: [
        {
          question:
            "A vendor's website says 'we never train on customer data'. For a high tier use, what should you ask for?",
          options: [
            "A screenshot of the website page as it appears today",
            "The contract clause that commits the vendor to it",
            "A verbal assurance from the vendor's sales manager",
            "Nothing more, since a public statement is binding",
          ],
          correctIndex: 1,
          explanation:
            "Marketing pages can change without notice. A contractual commitment is enforceable and is the evidence a high tier use needs.",
        },
        {
          question:
            "A tool was built for writing marketing copy. A team wants to use it to draft decisions on staff grievances. What is the first concern?",
          options: [
            "The tool's licence may not cover enough users for HR",
            "The use is outside what the tool was designed and tested for",
            "Marketing tools are always less secure than HR systems",
            "Grievance decisions are too short for the tool to process",
          ],
          correctIndex: 1,
          explanation:
            "Using a tool outside its intended use means its testing and safeguards may not apply. Decisions about staff are high impact and need a tool fit for that purpose.",
        },
        {
          question: "Why ask a vendor who its sub-processors are?",
          options: [
            "To compare their prices against the vendor's own prices",
            "Because your data may flow to them and needs protecting",
            "Because sub-processors must sign your acceptable use policy",
            "To check whether the vendor is large enough to be trusted",
          ],
          correctIndex: 1,
          explanation:
            "Sub-processors handle your data on the vendor's behalf, so data protection duties extend to them. You need to know who they are and where they process data.",
        },
        {
          question: "How should due diligence effort relate to the use case?",
          options: [
            "The same full questionnaire for every vendor and every use",
            "Scaled to the risk tier, with evidence for higher tiers",
            "Lighter for larger vendors, since they are more trustworthy",
            "Heavier for cheaper tools, since they are usually riskier",
          ],
          correctIndex: 1,
          explanation:
            "Proportionality applies to buying as much as to governance in general. A low tier tool needs a short check; a high tier system needs the full set with evidence.",
        },
      ],
    },

    // ── 5.2 ─────────────────────────────────────────────────────────────
    {
      title: "Contracts: data, training, liability, audit and exit",
      objective:
        "Identify the contract terms that matter most for an AI purchase and spot the gaps in a vendor's standard terms.",
      durationMinutes: 27,
      contentType: "article",
      bodyMd: `## The contract is your main control over a vendor

Once you depend on a vendor, the contract is the main thing that tells them what they must do, what they must tell you and what happens when it goes wrong. Most AI vendors offer standard terms written to protect themselves. Some will negotiate, especially for larger or regulated customers; some will not. Either way, you need to know what the terms say and what risk you are accepting.

This lesson is general education, not legal advice. Your legal team or adviser should review any contract. Your job as a governance lead is to tell them what matters for this use.

## Data use and training

- **Purpose limits.** The vendor processes your data only to provide the service to you, under a data processing agreement where personal data is involved.
- **No training on your data**, written as a contractual commitment, covering inputs, outputs, files and feedback. Check whether "improving the service" is defined so widely that it amounts to the same thing.
- **Retention and deletion.** How long prompts, outputs and logs are kept, and deletion on request and at the end of the contract.
- **Location and transfers.** Where data is stored and processed, and the legal basis for any international transfers.
- **Sub-processors.** A list, and notice of changes with a right to object.

## Change, incidents and information

- **Model change notification.** Advance notice of material changes to the model or features, ideally with the option to stay on a version for a period while you retest.
- **Incident notification.** A specific time limit and route for telling you about security incidents and AI failures affecting you, plus cooperation during your investigation. "Without undue delay" with nothing else is weaker than a stated window.
- **Regulatory cooperation.** The information and help you need to meet your own obligations: documentation, logs, instructions for use, support with impact assessments.

## Liability and indemnities

Standard terms often cap the vendor's liability at a small multiple of fees, and exclude the kinds of loss you are most worried about. Understand the gap between the cap and the harm a failure could cause. Options include negotiating higher caps for data protection breaches, specific indemnities (for example against third-party intellectual property claims over outputs, which some vendors now offer with conditions), insurance, or reducing your exposure through design. Do not assume the contract transfers the risk; it rarely transfers all of it, and it never transfers your accountability to the people affected.

## Audit and assurance rights

You will not usually get to inspect a large vendor's systems. Ask instead for **information rights**: independent audit reports and certificates on request, answers to reasonable security and compliance questionnaires, and notice if a certification lapses. For high tier uses, ask for evidence of testing on an ongoing basis, not just at sale.

## Exit

Plan the exit before you enter. Ask:

- Can you get your data, configurations, prompts and any fine-tuned assets back, in a usable format?
- Will the vendor confirm deletion afterwards?
- Is there a transition period with continued service?
- Can you terminate if the vendor makes a material change you cannot accept, or if it is acquired?
- What would it cost, in time and effort, to switch? Lock-in is a risk to record, not a surprise to discover.

## Read a summary critically

Use this prompt on a real vendor's public terms (never paste confidential contracts into an unapproved tool), or on an illustrative summary.

\`\`\`try
Below is a summary of an AI vendor's standard terms. Review it for a customer using the tool for [DESCRIBE THE USE AND TIER].

Check: data use and training on our data, retention and deletion, location and sub-processors, model change notice, incident notification time limit, help with our regulatory obligations, liability cap and exclusions, audit and information rights, and exit. For each, say whether it is adequate, weak or missing, and quote the words that led you to that view. Do not give legal conclusions; list questions for our lawyer.

<terms>
[PASTE PUBLIC TERMS OR AN ILLUSTRATIVE SUMMARY]
</terms>
\`\`\`

## Try it now

Make a one-page contract checklist with the five headings from this lesson and at least three checks under each. You are done when you could hand it to your legal team with a purchase and they would know exactly what you need from the contract.`,
      microCheck: [
        {
          question:
            "A vendor's terms say it may use customer data 'to improve and develop our services'. What should you check?",
          options: [
            "Whether the wording is short enough to fit on one page",
            "Whether it lets the vendor train its models on your data",
            "Whether the vendor has used that wording for many years",
            "Whether the phrase appears in competitors' terms as well",
          ],
          correctIndex: 1,
          explanation:
            "Broad 'improve the service' wording can amount to training on your data. You need a clear contractual position on training, covering inputs, outputs, files and feedback.",
        },
        {
          question:
            "The vendor's liability is capped at twelve months' fees. A failure could harm thousands of customers. What does this mean?",
          options: [
            "The vendor will pay for all harm caused, whatever the total",
            "Much of the risk stays with you and needs another response",
            "The cap shows the vendor's tool is unlikely to fail at all",
            "Your accountability for the harm passes to the vendor",
          ],
          correctIndex: 1,
          explanation:
            "A low cap leaves most of the potential loss with you. Negotiate, insure or reduce exposure through design, and remember accountability to the people affected never transfers.",
        },
        {
          question: "Which incident notification term is strongest?",
          options: [
            "The vendor will notify you when it considers it appropriate",
            "The vendor will notify you within a stated time, by a set route",
            "The vendor will publish a notice on its public status page in time",
            "The vendor will mention incidents in its annual report",
          ],
          correctIndex: 1,
          explanation:
            "A stated time limit and a defined route give you a clear, enforceable expectation. Discretionary or public-only notices may come too late or not reach you.",
        },
        {
          question: "Why plan the exit before signing an AI contract?",
          options: [
            "Because exit terms are the only part that lawyers usually review in full",
            "Because data return and lock-in are hard to fix once you depend on it",
            "Because vendors always refuse to discuss exit after signing",
            "Because planning an exit shows the vendor you distrust them",
          ],
          correctIndex: 1,
          explanation:
            "Once your processes depend on a tool, your negotiating position weakens. Data return, deletion, transition and termination rights are best secured at the start.",
        },
        {
          question: "What are 'information rights' in an AI contract?",
          options: [
            "Your right to read the vendor's internal emails about you",
            "Rights to audit reports, certificates and answers on request",
            "The vendor's right to collect information about your staff",
            "A right to publish the vendor's source code if the service fails",
          ],
          correctIndex: 1,
          explanation:
            "Large vendors rarely allow on-site audits, so information rights give you assurance through independent reports, certificates, questionnaire answers and notice of lapses.",
        },
      ],
    },

    // ── 5.3 ─────────────────────────────────────────────────────────────
    {
      title: "Procurement checklists and testing vendor claims",
      objective:
        "Run an AI purchase through a risk-scaled procurement checklist and test a vendor's performance claims on your own cases.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## Procurement is a governance gate

For most organisations, buying is the main way AI arrives. That makes procurement one of the strongest leverage points in the whole governance system: a rule that says "no AI purchase completes without a register entry and a risk tier" catches uses that would otherwise slip through. It changes the structure rather than relying on everyone remembering.

## A risk-scaled checklist

Every purchase with AI features goes through the same stages. The depth at each stage depends on the tier.

1. **Need.** What problem does this solve, and what is the non-AI alternative? Who is the owner?
2. **Register and tier.** Add the use to the register and classify it (Module 3).
3. **Due diligence.** Questionnaire scaled to tier, with evidence for medium and high (Lesson 1).
4. **Data protection.** DPIA where required; data processing agreement in place.
5. **Security review.** Proportionate to what data the tool touches and what it can do.
6. **Contract.** The terms from Lesson 2, reviewed by legal for medium and high tiers.
7. **Pilot and evaluation.** For medium and high tiers, test on your own cases before full roll-out.
8. **Sign-off.** The owner signs the decision record, accepting residual risk with conditions.
9. **Onboarding to operations.** Monitoring, oversight, incident route and review date set up before go-live.

For a low tier tool, stages 3 to 7 might take an hour. For a high tier system, they might take months. Publish the expected time for each tier, so nobody is surprised.

## Reading vendor claims

Vendor claims are marketing until tested. Common patterns and the questions they should prompt:

- **"95% accurate."** On what data? Measured how? For which groups? Accuracy on the vendor's test set says little about accuracy on your cases.
- **"Bias-free" or "unbiased."** No system can honestly claim this. Ask what was tested, how, and with what results.
- **"Fully compliant with the EU AI Act."** Compliance depends on the use and on the deployer's own actions. Ask which obligations, for which role, with which documents.
- **"Your data is never stored."** Ask about logs, caches, backups and sub-processors.
- **"Human in the loop built in."** Ask who the human is: you, or them? With what time and authority?
- **"Explainable AI."** Ask to see an explanation for a real case and whether a non-specialist could act on it.

## Test, do not trust

The most reliable evidence is your own test. Build a small evaluation set before the pilot:

- **Representative cases** drawn from your real work, with personal data removed or minimised.
- **Edge cases**: unusual, ambiguous or incomplete inputs.
- **Group-sensitive cases** to check for unfair differences (paired inputs, from Module 3).
- **Adversarial cases**: inputs designed to make the tool misbehave, such as embedded instructions.

Write the expected outcome for each case before running the tool. Compare the vendor's claims with what you see, and record it.

## Practise challenging a claim

Use critic mode to practise finding the weak points in confident claims.

\`\`\`studio
critic-mode
\`\`\`

## Try it now

\`\`\`try
Here is a vendor's claim about its AI product: "[PASTE A CLAIM FROM A REAL VENDOR'S PUBLIC PAGE, OR WRITE AN ILLUSTRATIVE ONE]".

Act as a sceptical procurement lead. List what the claim does and does not say, the questions I should ask, the evidence that would satisfy me, and three test cases from my own work ([DESCRIBE THE WORK]) that would check the claim. Do not assume the claim is false; say what would show it is true.
\`\`\`

You are done when you have three test cases with expected outcomes written down before running anything.`,
      microCheck: [
        {
          question:
            "Why is a rule that 'no AI purchase completes without a register entry' a strong leverage point?",
          options: [
            "Because it makes every purchase take months to complete",
            "Because it builds the check into the structure of buying",
            "Because it moves accountability for AI to procurement",
            "Because it stops staff from ever using AI without approval",
          ],
          correctIndex: 1,
          explanation:
            "Building the check into procurement changes the system's rules, so uses are caught without relying on memory or goodwill. It does not move accountability or stop all shadow use.",
        },
        {
          question: "A vendor claims its tool is 'unbiased'. What is the best response?",
          options: [
            "Accept it, since vendors are liable for false statements",
            "Ask what was tested, how and with what results",
            "Reject the vendor, since the claim must be untrue",
            "Ask the vendor to repeat the claim in writing",
          ],
          correctIndex: 1,
          explanation:
            "No system can honestly be called bias-free, but the vendor may have done useful testing. Ask for the method and results, and test it yourself.",
        },
        {
          question: "Why should expected outcomes for test cases be written before running the tool?",
          options: [
            "Because vendors require expected outcomes before a pilot",
            "So the tool's answers cannot shape what counts as correct",
            "Because test cases are invalid without a written answer",
            "So the pilot can be finished more quickly than planned",
          ],
          correctIndex: 1,
          explanation:
            "Writing expectations first avoids judging outputs by how plausible they look. It keeps the evaluation honest and comparable across tools.",
        },
        {
          question: "A vendor says its product is 'fully compliant with the EU AI Act'. What is the key gap in this claim?",
          options: [
            "The EU AI Act does not apply to any products sold by vendors",
            "Compliance also depends on your use and your own obligations",
            "Only regulators may use the word compliant in marketing",
            "The claim should mention every article by its number",
          ],
          correctIndex: 1,
          explanation:
            "A provider's compliance does not cover the deployer's obligations or a use outside the intended purpose. Ask which obligations, for which role, with which documents.",
        },
      ],
    },

    // ── 5.4 ─────────────────────────────────────────────────────────────
    {
      title: "Building in-house with governance gates",
      objective:
        "Design a set of governance gates for an in-house AI project, scaled to risk, from idea to retirement.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## Building changes your role

When you build AI in-house, even on top of a vendor's model, you take on more of the responsibility a vendor would otherwise carry. You choose the data, the design, the prompts and the testing. Under the EU AI Act, an organisation that develops a high-risk system and puts it into service under its own name can be a **provider**, with the heavier obligations that role brings (Module 2). Check your role for any build in a regulated area.

Gates make this manageable. A **governance gate** is a checkpoint where a project must show specific evidence before it moves to the next stage. Gates catch problems while they are cheap to fix.

## The gates

Scale each gate to the risk tier. A low tier internal tool may pass gates 1 to 3 in one short review. A high tier system needs each gate in full.

**Gate 0: Intake.** The problem, the owner, the non-AI alternative, a register entry and a first-pass tier. The question: is this worth exploring, and how much governance will it need?

**Gate 1: Design.** Impact assessment (including DPIA where needed), data sources and lawful basis, the human oversight design, what the system must never do, and the evaluation plan with expected outcomes. The question: is the design acceptable before we build?

**Gate 2: Pre-launch.** Evaluation results against the plan, including fairness tests and adversarial cases; security review; system record and user instructions; monitoring set up; incident playbook ready; people trained. The question: does the evidence show it is fit for its intended use?

**Gate 3: Launch.** Owner signs the decision record. Launch to a limited group first, with a rollback plan. The question: are we ready to be accountable for this in use?

**Gate 4: Post-launch review.** After an agreed period (for example 30 and 90 days), review monitoring data, overrides, complaints and incidents against the expectations set at Gate 1. The question: is it working as intended, for everyone?

**Change gate.** Any material change (new model, new data, new use, new population) returns to the appropriate gate. Write down in advance what counts as material.

**Retirement.** Decide what happens to data, logs and documentation, and tell users. Retirement is a decision too.

## Who decides at each gate

The owner decides, with advice. For medium and high tiers, the advisers (data protection, security, legal, HR where relevant) state their conditions in writing. A governance group or committee may review high tier gates. Keep it light: the aim is evidence and a recorded decision, not a meeting for its own sake.

## Gates as a system

Gates can create the same backlog loop as any approval process (Module 1). To keep them flowing:

- **Publish what each gate needs**, with templates, so teams prepare evidence as they build.
- **Fast track** low tier projects with a single combined check.
- **Measure time in gate** as well as outcomes, and look for where work queues.
- **Do not count gates passed** as a success measure. Count problems caught early and incidents avoided, and sample gate evidence for quality.

## A worked example

Imagine a charity building an assistant that drafts responses to people asking about benefits entitlements, checked by an adviser before sending.

- Gate 0: owner is the head of advice services; tier is high (access to essential services, vulnerable people).
- Gate 1: impact assessment flags risk of wrong entitlements and of advisers trusting drafts; oversight design requires advisers to check entitlement figures against the official calculator.
- Gate 2: evaluation on 80 past enquiries with expected answers, including edge cases; drafts with errors must be caught in review.
- Gate 3: pilot with two advisers; rollback is the existing manual process.
- Gate 4: 30-day review of error rates found in review and adviser feedback.

## Try it now

\`\`\`try
Design governance gates for this in-house AI project: [DESCRIBE IT]. Risk tier: [TIER].

For gates 0 to 4, plus the change gate and retirement, list the evidence required, who decides, and the question each gate answers. Scale the depth to the tier. Then suggest two ways to stop the gates becoming a bottleneck, and one measure of the gates' success that resists gaming.
\`\`\`

You are done when every gate has named evidence and a decision-maker, and you have defined what counts as a material change.`,
      microCheck: [
        {
          question:
            "An organisation builds a high-risk AI system on a vendor's model and puts it into service under its own name. What may follow?",
          options: [
            "It stays a deployer because the model belongs to the vendor",
            "It may be a provider with the heavier duties of that role",
            "It is exempt as it did not train the model",
            "It shares the deployer role with the vendor in equal parts",
          ],
          correctIndex: 1,
          explanation:
            "Developing a high-risk system and putting it into service under your own name can make you a provider, even when it is built on another company's model.",
        },
        {
          question: "At which gate should the human oversight design be agreed?",
          options: [
            "Gate 3, at launch, once the system has been built",
            "Gate 1, at design, before the system is built",
            "Gate 4, after launch",
            "The change gate, when the model is first updated",
          ],
          correctIndex: 1,
          explanation:
            "Oversight needs to be designed in from the start, because it shapes the interface, workload and routing. Adding it at launch usually produces nominal oversight.",
        },
        {
          question: "A project team proposes 'number of gates passed' as the gates' success measure. What is the risk?",
          options: [
            "It is too hard to count the gates passed across projects",
            "It rewards passing gates rather than catching problems",
            "It makes the gates slower for low tier projects only",
            "It cannot be reported to a board in a simple way",
          ],
          correctIndex: 1,
          explanation:
            "Counting passes invites shallow evidence and easy approvals, which is Goodhart's law. Measure problems caught early and sample gate evidence for quality instead.",
        },
        {
          question: "A live in-house system is switched to a new underlying model. What should happen?",
          options: [
            "Nothing, since the system passed all its gates at launch",
            "It returns to the appropriate gate as a material change",
            "It is retired and rebuilt from Gate 0 as a new project",
            "The new model's vendor signs off the change for you",
          ],
          correctIndex: 1,
          explanation:
            "A new model is a material change that can alter accuracy, fairness and behaviour. The change gate sends it back for the relevant evidence, without restarting the whole project.",
        },
      ],
    },
  ],
  quiz: [
    {
      question:
        "Your organisation buys an AI tool that later treats some customers unfairly. Who do affected customers and regulators mainly hold accountable?",
      options: [
        "The vendor alone, as the builder of the tool",
        "Your organisation, as the one that chose to use it",
        "The customers, who agreed to the terms of service",
        "Nobody, as AI outputs are not anyone's responsibility",
      ],
      correctIndex: 1,
      explanation:
        "Buying moves the building work, not the accountability. The organisation that uses the tool answers for how it affects its customers, whatever it can recover from the vendor.",
    },
    {
      question: "Which question best tests whether a vendor's model change process is safe for you?",
      options: [
        "How many models has the vendor released in total so far?",
        "Will we get advance notice and can we stay on a version?",
        "Is the new model always larger than the previous one?",
        "Does the vendor announce new models at public events?",
      ],
      correctIndex: 1,
      explanation:
        "Advance notice and the ability to stay on a version give you time to retest before behaviour changes. Release counts, model size and announcements do not protect you.",
    },
    {
      question:
        "A vendor offers a pilot on its own demo data. Why is this not enough for a high tier use?",
      options: [
        "Demo data is always deliberately made too difficult",
        "It shows nothing about performance on your own cases",
        "Pilots are not allowed for high tier uses under the law",
        "Demo data usually contains too much personal information",
      ],
      correctIndex: 1,
      explanation:
        "Performance on the vendor's data says little about your population, edge cases and risks. Test on your own representative, edge, group-sensitive and adversarial cases.",
    },
    {
      question:
        "A vendor will not provide any evidence for its bias testing claims for a high tier hiring tool. What does this tell you?",
      options: [
        "Nothing, since vendors are not expected to share test results",
        "That the claim cannot be relied on for this use",
        "That the tool must be biased and should be reported",
        "That you should run the tool without any testing",
      ],
      correctIndex: 1,
      explanation:
        "Without evidence, the claim cannot support a high tier decision. It does not prove bias, but you would need your own thorough testing, or a different vendor.",
    },
    {
      question: "Which contract term most directly protects you from lock-in?",
      options: [
        "A clause naming the vendor's preferred payment method",
        "Return of data, prompts and configurations in usable form",
        "A clause allowing the vendor to raise prices each year",
        "A commitment to use the vendor for all future AI projects",
      ],
      correctIndex: 1,
      explanation:
        "Getting your data, prompts and configurations back in a usable format makes switching possible. The other terms either do nothing for exit or increase dependence.",
    },
    {
      question:
        "Procurement takes six months for every AI tool, however small. What is the likely systemic effect?",
      options: [
        "Staff wait patiently and risk falls across the organisation",
        "Low-risk needs go to shadow AI, reducing visibility",
        "Vendors lower their prices to speed up the process",
        "The number of AI incidents falls to zero over time",
      ],
      correctIndex: 1,
      explanation:
        "Uniformly slow procurement feeds the shadow AI loop. A fast track for low tier tools keeps them visible and frees effort for high tier purchases.",
    },
    {
      question:
        "A vendor says 'your data is never stored'. Which follow-up question matters most?",
      options: [
        "Which colour scheme does the product use for its interface?",
        "What about logs, caches, backups and sub-processors?",
        "How many customers have signed up in the last year?",
        "Does the vendor store data for any of its own staff?",
      ],
      correctIndex: 1,
      explanation:
        "Data often persists in logs, caches, backups or with sub-processors even when the main service does not keep it. Those are what the claim needs to cover.",
    },
    {
      question: "At which gate is evaluation evidence, including fairness and adversarial tests, mainly reviewed?",
      options: [
        "Gate 0, intake, when the idea is first proposed",
        "Gate 2, pre-launch, before the system goes live",
        "Retirement, once the system is switched off",
        "Gate 4, only if a complaint has been received",
      ],
      correctIndex: 1,
      explanation:
        "Gate 2 asks whether the evidence shows the system is fit for its intended use, so evaluation results are reviewed there. Intake is too early and later gates are too late.",
    },
    {
      question:
        "A team proposes skipping the post-launch review because the system passed all its pre-launch tests. What is the risk?",
      options: [
        "None, as pre-launch tests prove long-term performance",
        "Real use can differ from tests, and drift goes unseen",
        "The vendor will not support systems without a review",
        "The pre-launch tests will become invalid after 90 days",
      ],
      correctIndex: 1,
      explanation:
        "Live use brings cases, users and behaviour the tests did not cover, and systems drift. The post-launch review checks real performance against the expectations set at design.",
    },
    {
      question:
        "Standard vendor terms exclude liability for data protection breaches. What is a sensible governance response?",
      options: [
        "Sign anyway, as standard terms are never negotiable",
        "Record the gap and negotiate, insure or reduce exposure",
        "Assume the exclusion is unenforceable and ignore it",
        "Ask staff to avoid putting any data into the tool",
      ],
      correctIndex: 1,
      explanation:
        "The gap between the vendor's liability and the potential harm is a risk to record and treat. Options include negotiation, insurance or design changes that reduce what is at stake.",
    },
    {
      question:
        "A charity builds an assistant drafting benefits advice. Which is the most appropriate rollback plan at launch?",
      options: [
        "Turn the assistant off and stop giving advice for a while",
        "Revert to the existing manual process used before launch",
        "Ask the vendor to fix the model within the same day",
        "Keep the assistant running while a fix is developed",
      ],
      correctIndex: 1,
      explanation:
        "A rollback should return to a known safe way of working, so the service continues while the problem is fixed. Stopping advice harms the people the service exists for.",
    },
  ],
}];
