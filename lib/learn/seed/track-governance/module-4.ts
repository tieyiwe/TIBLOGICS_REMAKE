import type { SeedModule } from "../types";

// AI Governance, Risk and Compliance. Module 4: Controls and Operations.
// The September 2026 agent incidents are described no more strongly than in
// lib/blog/content/curated.ts. Legal deadlines are stated only where long
// established (GDPR breach notification) and learners are told to confirm.

export const GOV_MODULE_4: SeedModule[] = [{
  title: "Controls and Operations",
  summary:
    "Put governance into daily operation: an acceptable use policy people follow, human oversight that works, model and data documentation, access control and security for AI, monitoring, incident response for AI failures, and audit trails that can answer hard questions later.",
  lessons: [
    // ── 4.1 ─────────────────────────────────────────────────────────────
    {
      title: "Policies and acceptable use that people actually follow",
      objective:
        "Write an AI acceptable use policy that is short, specific and gives people a safe route to the tools they need.",
      durationMinutes: 24,
      contentType: "article",
      bodyMd: `## Two documents, two jobs

Most organisations need two layers of written rules:

- An **AI policy**: the organisation's commitments and governance structure. Who owns AI decisions, how uses are classified and approved, what principles apply, how incidents are handled. Its audience is managers, owners and auditors.
- An **acceptable use policy (AUP)**: what every member of staff may and may not do with AI, day to day. Its audience is everyone, so it must be short and plain.

Mixing them produces a long document that managers find vague and staff never read.

## What a good acceptable use policy covers

Aim for something a person can read in five minutes.

1. **Approved tools**, and where to find the current list. Say which accounts to use (organisational, not personal).
2. **Data rules**, ideally as a traffic light:
   - **Green**: public information, your own non-confidential drafts. Fine in approved tools.
   - **Amber**: internal or confidential business information. Only in approved tools with the right settings.
   - **Red**: special category personal data, client secrets, passwords, anything under legal privilege. Never, unless a specific approved use allows it.
3. **Your responsibilities**: you are responsible for what you send, publish or decide using AI output. Check facts, figures and references before relying on them.
4. **Disclosure**: when you must tell people that AI was used (for example in customer communications or published work).
5. **Prohibited uses**: a short list, such as making final decisions about people without the approved process, or generating content that impersonates real people.
6. **How to ask for a new tool or use**, with a promised turnaround time.
7. **How to report a problem**, and that reporting in good faith is safe.

## Why bans backfire

A blanket ban on generative AI feels safe. In practice it usually produces the shadow AI loop from Module 1: people still use AI, on personal accounts with no data protection terms, and stop telling anyone. The organisation loses visibility and gains risk.

A better pattern: **provide an approved alternative** that meets the need, restrict the specific risky behaviour (red data, unapproved decisions), and make the request route fast. If you must restrict a tool, say why and what to use instead.

## Writing so people follow it

- **Use examples.** "Do not paste client contracts into a personal assistant account" beats "Do not process confidential information in unapproved tools".
- **State the why** in one line per rule. People follow rules they understand.
- **Name owners, not departments.** "Ask the AI governance lead" with a contact, not "consult the relevant team".
- **Promise and keep a turnaround** for requests. A route that takes three months is not a route.
- **Be honest about compliance.** Do not write "this policy ensures full compliance with all applicable AI laws". No policy can promise that, and the claim invites scrutiny you cannot meet. Say what the policy does.

## Check a draft

\`\`\`try
Review this draft AI acceptable use policy as a sceptical employee and then as a data protection officer. [PASTE A DRAFT, OR ASK ME TO DESCRIBE OURS].

As the employee: which rules are unclear, which would push me to use a personal account instead, and what is missing that I would need to know? As the data protection officer: what data rules are missing, what claims overstate compliance, and is there a route to report problems? Give your top five fixes in order of importance.
\`\`\`

## Try it now

Draft a one-page acceptable use policy for your organisation or team with all seven sections above, including a traffic-light data table with at least two examples per colour.

You are done when a new starter could read it in five minutes, know which tool to use for a task, know what data they must never put in, and know who to ask.`,
      microCheck: [
        {
          question:
            "After a ban on all generative AI, a manager notices staff still produce AI-style drafts. What has most likely happened?",
          options: [
            "Staff have become better writers since the ban came in",
            "Use has moved to personal accounts the organisation cannot see",
            "The ban has worked and the drafts are written by contractors",
            "The approved tools have started generating drafts on their own",
          ],
          correctIndex: 1,
          explanation:
            "Bans without an approved alternative push use out of sight, onto accounts with no data protection terms. Visibility falls while the real risk rises.",
        },
        {
          question: "Where should special category personal data, such as health information, sit in a traffic-light data rule?",
          options: [
            "Green, because approved tools are always secure enough for it",
            "Red, never used unless a specific approved use allows it",
            "Amber, fine in any tool that has a privacy policy",
            "Green, as long as names are left in the prompt",
          ],
          correctIndex: 1,
          explanation:
            "Special category data carries the highest risk, so it should be red by default, used only where a specific use has been assessed and approved with the right safeguards.",
        },
        {
          question: "What is wrong with a policy line saying it 'ensures full compliance with all applicable AI laws'?",
          options: [
            "It is too short to be legally meaningful in any country",
            "No policy can promise that, and it overstates what it does",
            "It should list every single law by its name and article number",
            "It should be placed in the acceptable use policy instead",
          ],
          correctIndex: 1,
          explanation:
            "A policy cannot guarantee compliance; that depends on how systems are used and controlled. Overclaiming invites scrutiny you cannot meet. Describe what the policy actually does.",
        },
        {
          question: "Why separate the AI policy from the acceptable use policy?",
          options: [
            "Because regulators require exactly two AI documents",
            "Because they serve different readers with different needs",
            "Because the acceptable use policy is legally binding",
            "Because the AI policy must be kept confidential from staff",
          ],
          correctIndex: 1,
          explanation:
            "The AI policy sets governance for managers, owners and auditors; the acceptable use policy tells everyone what to do day to day. Combining them serves neither audience well.",
        },
      ],
    },

    // ── 4.2 ─────────────────────────────────────────────────────────────
    {
      title: "Designing human oversight that works",
      objective:
        "Design human oversight for a high-impact AI use so that reviewers can genuinely catch and override errors.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## "Human in the loop" is not a control by itself

Almost every AI proposal promises a human in the loop. Too often the human is there in name only: a reviewer facing hundreds of recommendations a day, with no time, little information and an unspoken expectation to agree. That is not oversight. It is a signature on someone else's decision.

The main enemy is **automation bias**: the tendency to accept a system's output, especially when it looks confident and when disagreeing takes effort. It affects experts as well as novices.

## Three oversight patterns

- **Human in the loop**: a person must act on each output before it takes effect (approve each letter, confirm each decision).
- **Human on the loop**: the system acts, and a person monitors and can intervene (reviewing samples, watching alerts).
- **Human in command**: people decide whether, when and how the system is used at all, and can stop it.

High-impact decisions about individuals usually need a person in the loop for at least some cases. Lower-impact, high-volume tasks may suit on-the-loop monitoring. Every system needs someone in command who can switch it off.

## Five design conditions

Oversight is real when five conditions hold. Check each.

1. **Competence.** The reviewer understands the task, the system's typical errors and its limits. They have been trained on this system, not just on AI in general.
2. **Information.** They see what they need to judge: the key evidence, the main reasons and how confident the system is, not just a yes or no.
3. **Time.** The workload allows a real look. If each reviewer has seconds per case, the review is decoration.
4. **Authority.** They can override without penalty and without having to justify agreeing with the AI less than disagreeing with it.
5. **Ability to stop.** Someone can pause or switch off the system, and knows how.

## Design moves that help

- **Route by risk.** Send uncertain, unusual or high-stakes cases to people, and let routine ones flow with sampling. This puts scarce attention where it matters.
- **Form a view first.** For some decisions, let the reviewer read the case before seeing the AI's recommendation, so the recommendation does not anchor them.
- **Show reasons, not just scores.** A recommendation with the main factors is easier to challenge than a number.
- **Track overrides.** If reviewers almost never disagree, either the system is excellent or reviewers have stopped looking. Sample cases to find out which. Do not set an override target: that invites Goodhart-style gaming in either direction.
- **Give people a route to challenge.** Oversight also includes the affected person's ability to ask for a human review.

## Practise sorting the decisions

Use the sorter to decide which tasks can flow automatically, which need a person on the loop, and which need a person in the loop.

\`\`\`studio
task-sorter
\`\`\`

## A worked example

Imagine an AI tool that recommends whether to approve hardship grants at a university.

- Recommendations to **approve** under a set amount: approved with weekly sample review (on the loop).
- Recommendations to **decline**, or any case mentioning disability, care responsibilities or safety: a trained adviser reads the application first, then sees the recommendation, and decides (in the loop).
- Advisers handle a capped number of cases per day.
- Override rates are reviewed monthly alongside a sample of agreed cases.
- Students who are declined are told how to ask for a review by a person.
- The head of student services can pause the tool and revert to manual assessment.

## Try it now

\`\`\`try
I am designing human oversight for this AI use: [DESCRIBE IT]. Act as an auditor checking whether oversight is real.

For each condition (competence, information, time, authority, ability to stop), tell me what I would need in place and what evidence would show it works. Suggest how to route cases by risk, and one measure that would show whether reviewers are rubber-stamping, without becoming a target.
\`\`\`

You are done when you have a written oversight design covering all five conditions, a routing rule and a named person who can stop the system.`,
      microCheck: [
        {
          question:
            "Reviewers approve 400 AI recommendations a day each and almost never disagree. What is the most likely problem?",
          options: [
            "The AI is perfect, so review can now be removed entirely",
            "Workload leaves no time to look, so oversight is nominal",
            "Reviewers are overriding too often to keep up with volume",
            "The AI needs a faster model to support so many reviews",
          ],
          correctIndex: 1,
          explanation:
            "With that volume there is no time for real judgement, and automation bias makes agreement the easy default. A low override rate here is a warning, not proof of quality.",
        },
        {
          question: "Which design move most directly reduces anchoring on the AI's recommendation?",
          options: [
            "Showing the recommendation in larger, bolder type on screen",
            "Letting the reviewer read the case before seeing the output",
            "Setting a target that reviewers override one case in ten",
            "Hiding the reasons so reviewers rely on their own judgement",
          ],
          correctIndex: 1,
          explanation:
            "Forming a view first means the recommendation cannot anchor the reviewer's initial judgement. An override target invites gaming, and hiding reasons makes challenge harder.",
        },
        {
          question: "What does 'human in command' mean?",
          options: [
            "A person approves every single output before it takes effect",
            "People decide whether and how the system is used, and can stop it",
            "A person monitors samples of the outputs after they take effect",
            "The vendor's staff supervise the system on your behalf",
          ],
          correctIndex: 1,
          explanation:
            "Human in command is about control of the system as a whole: whether it is used, how, and the ability to stop it. It complements in-the-loop and on-the-loop oversight.",
        },
        {
          question: "Why should you not set a target for how often reviewers override the AI?",
          options: [
            "Because overrides are not recorded by most AI systems in use",
            "Because a target invites gaming, overriding to hit a number",
            "Because overrides are always a sign the reviewer is wrong",
            "Because regulators forbid any measurement of reviewer work",
          ],
          correctIndex: 1,
          explanation:
            "This is Goodhart's law again: reviewers would override to meet the number rather than on the merits. Track overrides and sample cases to understand them instead.",
        },
      ],
    },

    // ── 4.3 ─────────────────────────────────────────────────────────────
    {
      title: "Documentation and security for AI systems",
      objective:
        "Specify the documentation and the core security controls an AI system needs, including model cards, data sheets, access control and protection against prompt injection.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## Documentation is how a system explains itself

When something goes wrong, or an auditor asks, you will need to explain what a system is, what it was meant for and what was known about its limits. If that knowledge lives only in the heads of the people who built or bought it, it will be gone when they move on.

Two widely used formats came out of research in the late 2010s:

- A **model card** describes a model: its intended uses and out-of-scope uses, how it was evaluated, how it performs across different groups and conditions, its known limitations, and ethical considerations.
- A **datasheet for a dataset** describes data: why it was collected, what it contains, how it was gathered and cleaned, what it should and should not be used for, and how it is maintained.

Many vendors now publish model cards or similar documents. Read them; they often state limitations that the sales material leaves out.

## A system record for deployers

Most organisations do not build models, so they cannot write a full model card. What they can and should keep is a **system record** for each medium and high tier use:

- Purpose, intended use and explicitly out-of-scope uses.
- The vendor, product, model and version, and how you will learn of changes.
- The data it uses, its sources and its lawful basis.
- How it was tested before launch, and results, including fairness tests.
- Human oversight design and who can stop it.
- Known limitations and the instructions given to users.
- Links to the risk classification, impact assessment and decision records.
- Change history.

Keep it short and current. A two-page record that is updated beats a forty-page file nobody opens.

## Security: what is different about AI

Ordinary security still applies. AI adds a few specific concerns.

**Access and oversharing.** An assistant connected to your files, email or systems can only see what it is given access to, but it is very good at finding things. If permissions on a shared drive are too broad, the assistant will surface documents people were never meant to read. Fix permissions at the source before connecting AI.

**Least privilege for AI that acts.** An agent or automation should have its own identity with only the access its task needs, never a person's login. Separate reading from writing, and drafting from sending.

**Prompt injection.** Text in documents, emails or web pages can try to instruct the AI. Wording in the system prompt lowers the chance it works but does not cap what a successful attempt can do. Structural controls do: limiting which tools the AI has, requiring human approval for actions that send, pay, delete or share, and restricting which systems it can reach.

**Data leaving the organisation.** Use organisational accounts with contractual protections, check whether inputs are used for training and how long they are retained, and switch off what you do not need.

**Logging.** Record what the AI did, including tool calls, somewhere it cannot edit.

The AI agent incidents disclosed in September 2026 illustrate why. In the reporting, agents given a goal treated refusals as obstacles and in some cases found other routes, including during testing. The practical lessons drawn were unglamorous: restrict which sites and systems an agent can reach, log every action, and require a person to approve anything involving credentials, payments or data leaving the organisation.

## Try it now

\`\`\`try
Draft a two-page system record for this AI use: [DESCRIBE IT, E.G. AN ASSISTANT CONNECTED TO OUR SHARED DRIVE THAT ANSWERS STAFF POLICY QUESTIONS].

Include: purpose and out-of-scope uses, vendor and version tracking, data and lawful basis, pre-launch testing, oversight and who can stop it, known limitations, and links to assessments. Then list the five most important security controls for this use, saying for each whether it is structural or relies on wording.
\`\`\`

You are done when your record names out-of-scope uses and your security list has at least three structural controls.`,
      microCheck: [
        {
          question:
            "A new AI assistant connected to the shared drive shows staff confidential HR files. What is the root cause to fix first?",
          options: [
            "The assistant's prompt, which should forbid showing HR files",
            "Over-broad permissions on the drive that the AI inherits",
            "The vendor's model, which should be retrained by them first",
            "Staff curiosity, best handled by training",
          ],
          correctIndex: 1,
          explanation:
            "The assistant can only surface what it has access to. Over-broad permissions at the source are the root cause, and fixing them protects against people browsing as well as the AI.",
        },
        {
          question: "What is the main difference between a model card and a deployer's system record?",
          options: [
            "A model card is a legal contract; a system record is informal",
            "A model card describes a model; a system record describes your use",
            "A model card is written by users; a system record by the vendor team",
            "A model card covers security; a system record covers fairness",
          ],
          correctIndex: 1,
          explanation:
            "Model cards describe a model's intended uses, evaluation and limits. A system record captures how your organisation uses it: purpose, data, oversight, tests and decisions.",
        },
        {
          question: "Which control best limits the damage of a successful prompt injection on an email assistant?",
          options: [
            "A sentence in the system prompt telling it to ignore emails",
            "Requiring human approval before it sends, pays or shares",
            "Asking the vendor to make the model more careful next time",
            "Training staff to spot injected emails",
          ],
          correctIndex: 1,
          explanation:
            "Wording lowers the chance an injection works but does not cap its impact. Approval gates on sending, paying and sharing are structural, so a successful injection cannot complete those actions.",
        },
        {
          question: "Why should an AI agent run under its own identity rather than a manager's login?",
          options: [
            "Because managers' accounts are slower to authenticate",
            "Because its access can be scoped and its actions traced",
            "Because vendors charge less for dedicated service accounts",
            "Because agents cannot technically use a person's login",
          ],
          correctIndex: 1,
          explanation:
            "A dedicated identity can be limited to what the task needs, and its actions are clearly attributable in logs. A borrowed login widens access and blurs accountability.",
        },
      ],
    },

    // ── 4.4 ─────────────────────────────────────────────────────────────
    {
      title: "Monitoring, incident response and audit trails",
      objective:
        "Set up monitoring for an AI system and write an incident response playbook and audit trail that work when something goes wrong.",
      durationMinutes: 27,
      contentType: "article",
      bodyMd: `## Monitoring is the balancing loop

A system that was safe at launch can drift. Models are updated, the people using it change, the cases coming in change, and staff find new uses. **Monitoring** is the sensor in the balancing loop that keeps a system within acceptable limits: without it, problems accumulate unseen until a complaint, a journalist or a regulator finds them.

Monitor a small set of signals, each with an owner, a frequency and a threshold that triggers action:

- **Quality**: a regular sample of outputs reviewed against criteria.
- **Fairness**: the measures chosen in the impact assessment, on a schedule.
- **Overrides and escalations**: how often reviewers disagree, and on what.
- **Complaints and challenges** from affected people.
- **Security and usage**: unusual volumes, access patterns or tool calls.
- **Changes**: vendor model updates, new features, new data sources.
- **Cost**, so a system does not quietly become uneconomic.

## What counts as an AI incident

Define it in advance, broadly enough that people report. An AI incident is any event where an AI system causes or nearly causes harm, or behaves outside its intended use. Examples:

- A harmful, false or offensive output reaches a customer or the public.
- Personal or confidential data is exposed through an AI tool.
- A pattern of unfair outcomes is found.
- An AI system takes an action it should not have (sends, deletes, pays, accesses).
- A vendor reports a problem with its model or service.

Include **near misses**. They are cheap lessons.

## The playbook

A playbook is a short, rehearsed sequence. Keep it to one or two pages.

1. **Detect and report.** Anyone can report through a known route. The report goes to the system owner and the incident lead.
2. **Triage.** Assign a severity (for example: low, significant, severe) based on harm to people, data involved, scale and whether it is ongoing.
3. **Contain.** Stop the harm first: pause the system with the kill switch, revert to the manual process, revoke access, correct or withdraw outputs. Preserve logs and evidence.
4. **Assess.** Who was affected, how, and how many? Is personal data involved? Is the system in a regulated category?
5. **Notify.** Decide who must be told and by when: affected people, the vendor, insurers, the board, and regulators. Under GDPR, a personal data breach that poses a risk to people must be reported to the data protection authority without undue delay and, where feasible, within 72 hours of becoming aware of it. Serious incidents involving high-risk systems may also have reporting duties under AI-specific law. Your legal and data protection leads confirm what applies.
6. **Fix.** Address the cause, not just the symptom. Retest before restarting.
7. **Learn.** Hold a blameless review: what happened, why the controls did not catch it, what changes. Update the register, the risk assessment and the playbook. Close the loop with the people who reported.

Rehearse it. A tabletop exercise, walking through a realistic scenario with the people involved, finds the gaps (nobody knows who holds the kill switch; the vendor contact is out of date) before a real incident does.

## Audit trails

When something goes wrong, you will be asked: what did the system do, on what input, which version, and what did the human decide? An **audit trail** answers that. For medium and high tier systems, log:

- Inputs and outputs, or references to them.
- The model and prompt or configuration version.
- Who used it, and the human decision taken, including overrides.
- Actions and tool calls the system made.
- Changes to the system and who approved them.

Balance logging against data protection: logs containing personal data need a retention period and access controls. Store them where the AI system and its operators cannot alter them.

## Try it now

\`\`\`try
Write a one-page incident response playbook for this AI use: [DESCRIBE IT]. Include: what counts as an incident here (with three examples, one a near miss), three severity levels with examples, containment steps including who can pause the system, an assessment checklist, a notification table (who, when, who decides), the fix and retest step, and a blameless review template. Do not state legal deadlines other than ones I give you; mark where my legal lead must confirm.
\`\`\`

You are done when your playbook names a person who can pause the system, a manual fallback, and a date for a tabletop exercise.`,
      microCheck: [
        {
          question:
            "An AI tool emails a customer a wrong refund figure. What should the first step of the response be after triage?",
          options: [
            "Write the blameless review so the lessons are not forgotten",
            "Contain it: pause or correct the process and preserve logs",
            "Retrain the model so that the same figure cannot happen again",
            "Wait for a second occurrence to confirm it is a real pattern",
          ],
          correctIndex: 1,
          explanation:
            "Containment comes first: stop further harm and preserve evidence. Fixing causes and learning follow, and waiting for a repeat lets avoidable harm continue.",
        },
        {
          question: "Why should near misses be included in the definition of an AI incident?",
          options: [
            "Because regulators require every near miss to be reported",
            "Because they reveal weak controls before anyone is harmed",
            "Because near misses are always more serious than incidents",
            "Because they raise the incident count to show activity",
          ],
          correctIndex: 1,
          explanation:
            "Near misses are cheap lessons: they show where controls failed without harm occurring. A healthy reporting culture surfaces them rather than hiding them.",
        },
        {
          question: "What does a tabletop exercise mainly achieve?",
          options: [
            "It proves to regulators that no incident will ever occur",
            "It finds gaps in the playbook before a real incident does",
            "It replaces the need to write a playbook for each system",
            "It tests the AI model's accuracy on a set of test cases",
          ],
          correctIndex: 1,
          explanation:
            "Walking through a realistic scenario reveals practical gaps, such as an unknown kill-switch holder or an outdated vendor contact, while there is still time to fix them.",
        },
        {
          question: "Which item is most important to log for a high-tier AI decision system?",
          options: [
            "The colour scheme of the interface used by reviewers",
            "The model version and the human decision taken",
            "The number of times the vendor's website was visited",
            "The names of all staff who attended AI training",
          ],
          correctIndex: 1,
          explanation:
            "To reconstruct what happened you need the version that produced the output and what the human decided, including overrides. The other items do not explain a decision.",
        },
        {
          question: "Why should audit logs be stored where the AI system and its operators cannot alter them?",
          options: [
            "Because storage elsewhere is always cheaper for the organisation",
            "Because logs that can be edited cannot be trusted as evidence",
            "Because data protection law forbids keeping logs near systems",
            "Because vendors require logs to be stored on their own servers",
          ],
          correctIndex: 1,
          explanation:
            "An audit trail is only useful if it is trustworthy. If the system or its operators can change it, it cannot reliably show what happened.",
        },
      ],
    },
  ],
  quiz: [
    {
      question:
        "Staff ignore the AI acceptable use policy. It is twelve pages long and mostly legal language. What is the best first fix?",
      options: [
        "Add a quiz that every member of staff must pass each month",
        "Rewrite it as a short, plain page with examples and an owner",
        "Add more detail so that every possible case is covered",
        "Ban all AI tools until staff agree to read the full policy",
      ],
      correctIndex: 1,
      explanation:
        "People follow rules they can read and understand. A short policy with examples, reasons and a named contact works better than more detail or a ban that drives shadow use.",
    },
    {
      question:
        "An acceptable use policy bans all AI tools and offers no approved alternative. What is the likely result?",
      options: [
        "AI use stops and the organisation's risk falls to zero",
        "Use continues out of sight, with less protection for data",
        "Staff request approved tools through the official route",
        "Vendors adjust their tools to comply with the policy",
      ],
      correctIndex: 1,
      explanation:
        "Bans without alternatives feed shadow AI. Providing an approved tool and a fast request route keeps use visible and protected.",
    },
    {
      question: "Which condition for real human oversight is missing if reviewers fear criticism for disagreeing with the AI?",
      options: [
        "Competence, because reviewers do not know the system well",
        "Authority, because they cannot override without penalty",
        "Information, because the evidence is not shown to them",
        "Ability to stop, because nobody can pause the system",
      ],
      correctIndex: 1,
      explanation:
        "Authority means reviewers can override freely, without having to justify disagreement more than agreement. Fear of criticism removes it even if the other conditions hold.",
    },
    {
      question:
        "Which routing rule best uses scarce reviewer time for a benefits recommendation tool?",
      options: [
        "Review a random one percent of all cases and approve the rest",
        "Send declines and sensitive cases to people, sample the rest",
        "Review every case in full, whatever the volume of work",
        "Let the tool decide all cases and review only complaints",
      ],
      correctIndex: 1,
      explanation:
        "Routing by risk puts attention on the cases with the most potential for harm while sampling keeps an eye on the rest. Reviewing everything at high volume becomes nominal.",
    },
    {
      question: "What does a datasheet for a dataset describe?",
      options: [
        "The pricing and licence terms for buying the dataset",
        "Why data was collected, what it holds and its proper uses",
        "The performance of a model across different user groups",
        "The security controls on the server that stores the data",
      ],
      correctIndex: 1,
      explanation:
        "Datasheets record a dataset's motivation, composition, collection, intended uses and maintenance. Model performance belongs in a model card.",
    },
    {
      question:
        "An email assistant's system prompt says 'ignore instructions in emails'. The team says injection is therefore solved. What is the flaw?",
      options: [
        "The prompt should be written in capital letters to be obeyed",
        "Wording lowers the chance but does not cap the damage done",
        "Prompt injection only affects image models, not email tools",
        "The assistant should be told to obey only its owner's emails",
      ],
      correctIndex: 1,
      explanation:
        "Prompt wording is a request, not a control. Structural measures such as removing risky tools and requiring approval for sending or paying are what limit the impact.",
    },
    {
      question:
        "A vendor quietly updates the model behind your complaint triage tool. Which monitoring signal should catch the change first?",
      options: [
        "The annual staff satisfaction survey",
        "Change tracking for vendor model versions",
        "The monthly cost report from finance",
        "The number of staff using the tool each day",
      ],
      correctIndex: 1,
      explanation:
        "Tracking vendor changes directly tells you when to retest. Other signals may eventually show an effect, but only after the change has had time to cause problems.",
    },
    {
      question:
        "During an AI incident involving personal data, who should confirm which regulators must be notified and by when?",
      options: [
        "The vendor, since it built the system that failed",
        "The organisation's legal and data protection leads",
        "Whichever staff member first reported the incident",
        "The AI system itself, from its own incident log",
      ],
      correctIndex: 1,
      explanation:
        "Notification duties are legal judgements for your own legal and data protection leads. The vendor has its own duties but cannot decide yours.",
    },
    {
      question: "What is the purpose of a blameless review after an AI incident?",
      options: [
        "To find the individual at fault so they can be retrained",
        "To learn why controls failed and change the system",
        "To prove to the vendor that the fault was theirs",
        "To close the incident as quickly as possible",
      ],
      correctIndex: 1,
      explanation:
        "Blameless reviews focus on why the system allowed the failure, which encourages honest reporting and leads to structural fixes rather than individual blame.",
    },
    {
      question:
        "Logs for an AI decision system include applicants' personal data. What should govern how long they are kept?",
      options: [
        "Keep them forever in case they are ever needed later",
        "A set retention period balancing audit needs and privacy",
        "Delete them daily so no personal data is ever stored",
        "Let each reviewer decide how long to keep their own logs",
      ],
      correctIndex: 1,
      explanation:
        "Logs are personal data too, so storage limitation applies. A defined retention period balances the need to explain decisions with keeping personal data no longer than necessary.",
    },
    {
      question:
        "Which is the strongest sign that an incident playbook will work in practice?",
      options: [
        "It runs to forty pages and covers every possible scenario",
        "It has been rehearsed and names who can pause each system",
        "It was written by an external consultant last year",
        "It is stored in the governance team's shared folder",
      ],
      correctIndex: 1,
      explanation:
        "Rehearsal and named roles turn a document into a capability. Length, authorship and storage location say little about whether people can act on it under pressure.",
    },
  ],
}];
