import type { SeedModule } from "../types";

// AI Governance, Risk and Compliance. Module 6: Running an AI Governance
// Programme. Standards are described in general terms only. The EU AI Act's
// AI literacy duty is described by its general shape; learners are told to
// check current guidance.

export const GOV_MODULE_6: SeedModule[] = [{
  title: "Running an AI Governance Programme",
  summary:
    "Turn everything into a working programme: clear roles for a committee, owners and champions, an AI management system that runs on a plan-do-check-act cycle, role-based training and AI literacy, metrics and reporting that leadership can act on, continuous improvement, and a realistic 90-day plan.",
  lessons: [
    // ── 6.1 ─────────────────────────────────────────────────────────────
    {
      title: "Roles: the committee, owners and champions",
      objective:
        "Design the roles and decision rights for an AI governance programme sized to your organisation.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## Structure follows decisions

Governance roles exist to make decisions well and quickly. Start from the decisions, not the organisation chart: who approves a new high tier use, who accepts residual risk, who can pause a system, who sets policy, who checks that the whole thing works. Then give each decision to a role.

## The core roles

**Executive sponsor.** A senior leader who owns the programme as a whole, secures time and budget, and reports to the board. Without one, governance becomes a side project that loses every argument with a deadline.

**AI governance lead.** Runs the programme day to day: the register, the process, the templates, the reporting. In a small organisation this may be part of someone's role; in a large one, a small team. The lead facilitates and challenges; they do not own individual systems.

**AI governance group or committee.** A small cross-functional group: typically representatives from the business, technology, data protection, security, legal or compliance, HR and risk. Its jobs: approve policy, decide on high tier uses (or review the owner's decision), resolve disagreements between advisers, and review programme metrics. Keep it small enough to decide. Give it written terms of reference: purpose, membership, quorum, what it decides and what it does not.

**System owners.** One accountable owner per use, from Module 1. They are the first line: they answer for their systems and run them within the conditions set.

**Specialist advisers.** Data protection, security, legal, HR, procurement. They assess risks in their area and set conditions. They do not own the system.

**Champions.** Respected practitioners in each department who help colleagues use AI well, answer everyday questions, spot new uses and bring problems forward early. Champions are the programme's eyes and ears. They need a little time, recognition and a direct line to the governance lead.

**Internal audit.** Independent assurance that the programme works as designed, on a cycle that fits the risk.

## Decision rights in one table

| Decision | Who decides | Who must be consulted |
|---|---|---|
| Low tier use | System owner | Governance lead (register entry) |
| Medium tier use | System owner | Data protection, security as relevant |
| High tier use | System owner with committee review | All relevant advisers |
| Pause a system | System owner or governance lead | Informed afterwards: committee |
| Policy change | Committee, sponsor signs | Advisers, champions |

Note that both the owner and the governance lead can pause a system. Stopping should be easy; restarting needs the evidence.

## Avoiding common traps

- **A committee that approves everything.** If every request goes to committee, the queue grows and the shadow AI loop starts. Delegate low and medium tiers.
- **A committee that never meets on time.** Set a standing slot and allow decisions by written procedure for urgent cases.
- **Champions without time.** A title with no hours attached becomes a badge, not a role.
- **The lead as owner of everything.** When the governance lead is seen as the owner of all AI, business owners disengage. The lead runs the system; owners own their uses.

## Sizing it

A team of thirty does not need a committee of eight. A small organisation might have: the managing director as sponsor, an operations manager as governance lead, a monthly thirty-minute review with the data protection adviser and IT lead, and one champion per team. A large organisation might have a governance team, a committee with terms of reference, and a champion network of dozens. The roles are the same; their size differs.

## Try it now

\`\`\`try
Help me design AI governance roles for [TYPE AND SIZE OF ORGANISATION]. Our current situation: [ONE OR TWO SENTENCES].

Propose: the executive sponsor, the governance lead, a committee with membership and draft terms of reference (purpose, quorum, what it decides, what it does not), how system owners and advisers fit in, and a champion network with time commitment. Include a decision rights table for low, medium and high tier uses, pausing a system and changing policy. Size everything to the organisation; do not over-engineer.
\`\`\`

You are done when you have a decision rights table that names roles (not people) and a one-paragraph terms of reference for the committee.`,
      microCheck: [
        {
          question:
            "Every AI request, however small, goes to a monthly committee. What is the most likely result?",
          options: [
            "Better decisions, because every use gets senior attention",
            "A growing queue that pushes low-risk use out of sight",
            "Fewer AI uses, because staff stop wanting to use AI",
            "Faster approvals, because the committee meets regularly",
          ],
          correctIndex: 1,
          explanation:
            "Sending everything to committee creates a bottleneck and feeds the shadow AI loop. Delegating low and medium tiers keeps the committee for decisions that need it.",
        },
        {
          question: "What is the main role of AI champions in a governance programme?",
          options: [
            "To approve high tier uses on behalf of the whole committee",
            "To help colleagues, spot new uses and raise issues early",
            "To own every AI system used in their department",
            "To audit the governance programme independently",
          ],
          correctIndex: 1,
          explanation:
            "Champions are the programme's eyes and ears in each team. They do not approve, own or audit; those are owner, committee and internal audit roles.",
        },
        {
          question: "Why should both the system owner and the governance lead be able to pause a system?",
          options: [
            "Because two people must agree before anything can be paused",
            "Because stopping should be easy while restarting needs evidence",
            "Because the governance lead is the true owner of every AI system",
            "Because regulators require two pause holders for every system",
          ],
          correctIndex: 1,
          explanation:
            "Making it easy to stop limits harm quickly; requiring evidence to restart keeps control. Neither role makes the governance lead the owner.",
        },
        {
          question: "What is the risk when the governance lead is seen as the owner of all AI?",
          options: [
            "The lead becomes too powerful within the organisation",
            "Business owners disengage from systems they should own",
            "The register becomes too accurate to be kept up to date",
            "Vendors refuse to deal with anyone except the lead",
          ],
          correctIndex: 1,
          explanation:
            "When governance is seen as owning AI, the first line treats risk as someone else's job. The lead runs the system of governance; owners answer for their uses.",
        },
      ],
    },

    // ── 6.2 ─────────────────────────────────────────────────────────────
    {
      title: "An AI management system in practice",
      objective:
        "Assemble the parts of an AI management system and run it on a plan-do-check-act cycle that drives continuous improvement.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## From parts to a system

By now you have the parts: a register, a classification, assessments, policies, oversight designs, documentation, monitoring, incident response, procurement checks and roles. An **AI management system** is what connects them so they run as a whole, improve over time and can show evidence that they work.

ISO/IEC 42001 sets out requirements for such a system (Module 2). You do not need to seek certification to use its broad shape, which is common to ISO management system standards. The shape follows a **plan-do-check-act** cycle.

## Plan

- **Context and scope.** Which parts of the organisation and which AI uses the system covers, and the internal and external issues that matter (laws, customer expectations, strategy).
- **Policy and objectives.** The AI policy, and a few measurable objectives for the programme, such as "every high tier use has a current impact assessment".
- **Risk process.** How you identify, classify and treat AI risk (Module 3).
- **Roles and resources.** Who does what, and with what time (Lesson 1).

## Do

- **Operational controls.** Intake, assessments, procurement checks, gates, oversight, documentation, security (Modules 3 to 5).
- **Competence and awareness.** Training matched to roles (Lesson 3).
- **Documented information.** The register, records and decisions, kept current and findable.

## Check

- **Monitoring and measurement.** System-level monitoring (Module 4) and programme metrics (Lesson 3).
- **Internal audit.** A periodic independent look at whether the system works as designed: sample some register entries, check the assessments, test whether the kill switch holder knows what to do.
- **Management review.** At least yearly, and more often at first, leadership reviews the programme: metrics, incidents, audit findings, changes in law and in the organisation's use of AI, and whether objectives are being met.

## Act

- **Corrective action.** When something does not work (a missed assessment, an incident, an audit finding), fix the cause, not only the instance.
- **Continual improvement.** Use what you learn to change the system: simplify a template people struggle with, add a fast track, tighten a control that failed.

## Continuous improvement is a feedback loop

In systems terms, plan-do-check-act is a deliberately designed **balancing loop**: it compares how the programme performs with its objectives and corrects the gap. Like any loop it can fail in predictable ways:

- **Weak sensors.** If incidents are not reported or metrics are gamed, the loop corrects towards a false picture.
- **Long delays.** An annual review cannot correct a monthly problem. Match the review rhythm to how fast things change.
- **No actuator.** Findings that nobody has the authority or budget to act on change nothing. Every finding needs an owner and a date.
- **Drifting goals.** If targets are quietly lowered whenever they are missed, the loop settles at a worse standard. This is sometimes called the "eroding goals" pattern.

## A minimum viable management system

For a smaller organisation, a lightweight version might be:

- A two-page AI policy and a one-page acceptable use policy.
- A register in a shared spreadsheet.
- Templates for classification, impact assessment and decision records.
- A monthly thirty-minute review of new uses, incidents and metrics.
- A yearly management review and a light internal check by someone independent of the programme.
- A corrective action log with owners and dates.

## Try it now

\`\`\`try
Here is what our AI governance currently consists of: [LIST WHAT YOU HAVE, E.G. A POLICY, A PARTIAL REGISTER, NO INCIDENT ROUTE].

Map it against a plan-do-check-act AI management system: context and scope, policy and objectives, risk process, roles, operational controls, competence, documented information, monitoring, internal audit, management review, corrective action and continual improvement. For each, say present, partial or missing. Then name the three gaps that most weaken the feedback loop, and why.
\`\`\`

You are done when you have a gap list with an owner and a target date for each of the top three gaps.`,
      microCheck: [
        {
          question: "Does an organisation need ISO/IEC 42001 certification to use a plan-do-check-act AI management system?",
          options: [
            "Yes, the structure may only be used once certified",
            "No, the shape can be used whether or not you certify",
            "Yes, unless the organisation has under fifty members of staff",
            "No, because the standard has nothing to do with AI",
          ],
          correctIndex: 1,
          explanation:
            "Certification is optional. The management system shape is useful on its own, and certification adds independent assurance for those who need it.",
        },
        {
          question:
            "Audit findings are recorded each year but nothing changes because nobody is assigned to act. Which part of the loop is missing?",
          options: [
            "The sensor, because findings are not being recorded at all",
            "The actuator, because no one has authority to act on them",
            "The goal, because the programme has too many objectives",
            "The delay, because findings are recorded far too quickly",
          ],
          correctIndex: 1,
          explanation:
            "Findings without an owner, authority or budget cannot correct anything. Every finding needs an owner and a date to close the loop.",
        },
        {
          question: "A target of 'all high tier uses assessed' is missed, so it is lowered to 'most'. Then missed again and lowered again. What is this?",
          options: [
            "Continual improvement adapting the target to reality",
            "The eroding goals pattern, settling at a worse standard",
            "A reinforcing loop of rapid growth in the AI assessments",
            "Normal corrective action following an internal audit",
          ],
          correctIndex: 1,
          explanation:
            "Lowering the goal whenever it is missed lets performance drift downwards. Corrective action should address why the target was missed, not quietly move it.",
        },
        {
          question: "What is the main purpose of management review in an AI management system?",
          options: [
            "To approve every new AI use proposed in the organisation",
            "For leadership to judge if the programme meets its aims",
            "To replace internal audit with a leadership discussion",
            "To write new AI policies at every scheduled meeting",
          ],
          correctIndex: 1,
          explanation:
            "Management review is where leadership looks at metrics, incidents, audit findings and changes, and decides whether the programme is working and what to change.",
        },
      ],
    },

    // ── 6.3 ─────────────────────────────────────────────────────────────
    {
      title: "AI literacy, training, metrics and reporting",
      objective:
        "Plan role-based AI literacy training and a set of paired metrics that give leadership an honest picture of the programme.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## AI literacy is a control

Many controls in this track depend on people: users who know what not to paste, reviewers who can spot a wrong answer, owners who understand what they are accepting. **AI literacy** is the knowledge and judgement people need for their role. Under the EU AI Act, providers and deployers are expected to take measures to ensure a sufficient level of AI literacy among staff dealing with AI systems on their behalf, taking into account their roles and context. Check current guidance on what that means in practice.

## Role-based training

One course for everyone wastes most people's time. Match training to roles:

| Role | What they need |
|---|---|
| **Everyone** | What AI is and is not good at, the acceptable use policy, data rules, how to report a problem |
| **Regular users** of a specific tool | Its intended use, known limitations, how to check its output |
| **Reviewers and overseers** | The system's typical errors, automation bias, how and when to override |
| **System owners** | Risk classification, what they are accepting, monitoring and incident duties |
| **Governance, risk, legal, procurement** | Regulation, assessments, vendor due diligence, contracts |
| **Board and senior leaders** | Strategic risk, their oversight role, how to read programme reports |

Make it practical: real examples from your organisation, short scenario checks rather than recall quizzes, and refreshers when tools or rules change. Record who has been trained for which role, because that is evidence of a control.

## Metrics: what to measure

Programme metrics tell leadership whether governance is working. Group them into five families, and pair each with a check that resists gaming (Goodhart's law, Module 1).

1. **Coverage.** Share of known AI uses in the register with an owner and a tier. *Pair with*: uses found by sweeps or amnesties that were not registered (a sign of what you are missing).
2. **Timeliness.** Median time from request to decision, by tier. *Pair with*: a sample of decisions reviewed for quality, so speed does not come from cutting corners.
3. **Assurance.** Share of high tier uses with a current impact assessment, in-date testing and a named pause holder. *Pair with*: an internal check of a few assessments for depth.
4. **Outcomes.** Incidents and near misses by severity, time to contain, complaints and challenges, fairness test results. *Pair with*: reporting culture indicators, because a fall in reports can mean less reporting rather than fewer problems.
5. **Capability.** Role-based training coverage. *Pair with*: scenario check results or observed practice.

Keep the set small: perhaps eight to twelve measures. Too many metrics and none get attention.

## Reporting to leadership

Leaders need to decide things, not read data. A good quarterly report fits on one or two pages:

- **Headline**: is the programme on track, in one sentence.
- **Top risks**: the three to five most significant AI risks, with trend and owner.
- **Metrics**: the small set, with trend over time rather than a single snapshot.
- **Incidents**: what happened, what was done, what changed.
- **Changes in law and use**: anything material from the regulatory register or new high tier uses.
- **Decisions needed**: what you need leadership to decide or support, with a recommendation.

Write in plain language. Be honest about weaknesses. A report that is always green teaches leaders to stop reading it, and hides the problems they most need to see.

## Draft a report

\`\`\`try
Draft a one-page quarterly AI governance report for our leadership team, using these illustrative inputs: [LIST A FEW FACTS, E.G. 42 USES REGISTERED, 3 HIGH TIER, 1 INCIDENT, TRAINING FOR REVIEWERS NOT STARTED].

Structure: headline, top risks with trend and owner, a small metrics table with trend, incidents and what changed, changes in law and use, decisions needed with a recommendation. Pair each metric with a check that resists gaming. Be plain and honest; do not make it look better than the inputs justify.
\`\`\`

## Try it now

Choose eight metrics for your programme across the five families, each paired with a check. You are done when every metric has a source, an owner and a reporting frequency, and you have written the one decision you would most like leadership to make this quarter.`,
      microCheck: [
        {
          question:
            "Reported AI incidents fall sharply after a new rule that every report triggers a formal investigation. What should you suspect?",
          options: [
            "AI systems have become much safer since the rule came in",
            "People are reporting less, not that problems have fallen",
            "The investigation rule has fixed all the underlying causes",
            "The incident definition has become too broad to be useful",
          ],
          correctIndex: 1,
          explanation:
            "Making reporting burdensome reduces reports. That is why outcome metrics are paired with reporting culture indicators: fewer reports can mean less visibility, not fewer problems.",
        },
        {
          question: "What training do reviewers who oversee an AI decision tool most need?",
          options: [
            "A general history of artificial intelligence research",
            "The system's typical errors and how and when to override",
            "Detailed training on the vendor's pricing and licences",
            "The same short awareness course given to all other staff",
          ],
          correctIndex: 1,
          explanation:
            "Reviewers need to recognise the system's errors, resist automation bias and know their authority to override. General awareness alone does not equip them for oversight.",
        },
        {
          question: "Why should a leadership report show trends rather than a single snapshot?",
          options: [
            "Because snapshots cannot legally be shown to a board",
            "Because direction of travel shows if things improve",
            "Because trends make the report longer and more thorough",
            "Because a snapshot always shows a better result",
          ],
          correctIndex: 1,
          explanation:
            "Leaders need to know whether things are getting better or worse to decide whether to act. A single figure without context hides the direction of travel.",
        },
        {
          question: "What is the risk of a governance report that is always green?",
          options: [
            "Leaders stop reading it and the real problems stay hidden",
            "Regulators will automatically investigate the organisation",
            "Green reports take much longer to prepare than red ones",
            "Staff will assume that AI governance is no longer needed",
          ],
          correctIndex: 0,
          explanation:
            "A report that never shows problems loses credibility and attention. Honest reporting of weaknesses is what lets leaders act before small problems grow.",
        },
      ],
    },

    // ── 6.4 ─────────────────────────────────────────────────────────────
    {
      title: "Your first 90 days",
      objective:
        "Write a realistic 90-day plan that establishes the foundations of an AI governance programme and the feedback loops that will keep it improving.",
      durationMinutes: 27,
      contentType: "article",
      bodyMd: `## Start with visibility and quick, safe wins

The temptation in a new governance programme is to write a long policy first. Resist it. In the first 90 days you want three things: to **see** what AI is being used, to make the **safe route easy**, and to put the **loops** in place that will improve the programme over time. Perfection comes later, if at all.

## Days 1 to 30: foundations

- **Sponsor and lead.** Confirm the executive sponsor and the governance lead, with time allocated.
- **Discovery.** Run the amnesty survey and the other discovery routes (Module 3). Build register version one.
- **Interim acceptable use policy.** One page: approved tools, traffic-light data rules, how to ask, how to report. Better a short interim policy now than a perfect one in six months.
- **A safe default tool.** If staff have no approved option, work with IT and procurement to provide one with appropriate data terms. This is often the single biggest risk reduction available.
- **An incident route.** A named contact and a simple way to report, even before the full playbook exists.
- **Quick triage of what you find.** Anything that looks high tier and is already live gets a named owner and a first look straight away.

## Days 31 to 60: risk and controls

- **Classification.** Tier every use in the register with the factor approach.
- **High tier first.** Start impact assessments for live high tier uses, beginning with those affecting the most people or the most vulnerable.
- **Procurement gate.** Agree with procurement that purchases with AI features need a register entry and a tier before they complete, with the vendor checklist scaled to tier.
- **Oversight check.** For each high tier use, check the five oversight conditions (Module 4).
- **Roles.** Draft committee terms of reference and decision rights; recruit the first champions.
- **Owner briefings.** Short sessions for system owners on what they are accountable for.

## Days 61 to 90: loops and reporting

- **Monitoring.** Set up the key signals for high tier uses with owners and thresholds.
- **Incident playbook and tabletop.** Write the playbook and rehearse it once.
- **Regulatory register.** Start it with official sources and review dates (Module 2).
- **Metrics and first report.** Pick the paired metrics and send leadership the first honest report, including what is not yet in place.
- **Training plan.** Role-based plan, starting with reviewers and owners of high tier uses.
- **Management review and roadmap.** Review the first 90 days and agree the next nine months.

## Think about the system, not just the tasks

A plan is a list of tasks; a programme is a system. Before you finalise, check the loops:

- **Shadow AI loop.** Does your plan make the safe route faster than the unsafe one? If approvals will be slow, add a fast track for low tier uses now.
- **Reporting loop.** Is reporting safe and visibly acted on, so reports keep coming?
- **Learning loop.** Do incidents, audits and metrics feed back into changes, with owners and dates?
- **Incentives.** Are any teams rewarded in ways that push against governance, such as speed targets with no quality measure? Who can change that?
- **Delays.** Which harms would only show up months later, and what early signal would warn you?

## What to leave for later

Certification, a full policy library, sophisticated tooling and an exhaustive training programme can wait. Focus on what reduces the most risk soonest and builds the loops that improve everything else.

## Try it now

\`\`\`try
Write a 90-day AI governance plan for [TYPE AND SIZE OF ORGANISATION], where today [DESCRIBE THE STARTING POINT IN TWO SENTENCES].

Split it into days 1 to 30, 31 to 60 and 61 to 90. For each item give an owner (by role) and a done-state. Then review the plan as a systems thinker: does it make the safe route faster than the unsafe one, keep reporting safe, feed lessons back, and address any incentive pushing against governance? Suggest changes. Keep it realistic for the resources described.
\`\`\`

You are done when your plan has an owner and a done-state for every item, and you have made at least one change after the systems review.`,
      microCheck: [
        {
          question:
            "A new governance lead plans to spend the first three months writing a comprehensive AI policy. What is the main risk?",
          options: [
            "The policy will be too short to cover every possible case",
            "Use stays invisible and unsafe while the policy is written",
            "Staff will read the new policy far too carefully and slow down",
            "Regulators will object to a policy written too quickly",
          ],
          correctIndex: 1,
          explanation:
            "Months spent on a perfect policy leave AI use unseen and unmanaged. Visibility, a safe default tool and an interim policy reduce more risk sooner.",
        },
        {
          question: "Why is providing an approved default AI tool often a big early risk reduction?",
          options: [
            "Because approved tools never produce incorrect outputs",
            "Because it moves use from unprotected accounts to a safer route",
            "Because it allows the organisation to skip keeping a register at all",
            "Because vendors take on all liability for approved tools",
          ],
          correctIndex: 1,
          explanation:
            "Staff with no approved option use personal accounts without data protections. A safe default brings that use into the open and under appropriate terms.",
        },
        {
          question: "In the first 30 days, a live high tier AI use is discovered with no owner. What should happen?",
          options: [
            "Wait until the classification phase in days 31 to 60",
            "Give it a named owner and a first look straight away",
            "Switch it off permanently until the policy is finished",
            "Add it to the register and take no further action yet",
          ],
          correctIndex: 1,
          explanation:
            "Live high tier uses carry real risk today, so they get an owner and an initial look immediately. Waiting or switching off without assessment are both poor defaults.",
        },
        {
          question: "Which check best reflects the systems review of a 90-day plan?",
          options: [
            "Whether the plan has more than fifty separate tasks",
            "Whether the safe route is faster than the unsafe one",
            "Whether every task is assigned to the governance lead",
            "Whether the plan uses the same template as last year",
          ],
          correctIndex: 1,
          explanation:
            "If the safe route is slower, the shadow AI loop wins. Checking loops, incentives and delays is what turns a task list into a programme.",
        },
      ],
    },
  ],
  quiz: [
    {
      question:
        "A 300-person firm proposes a twelve-member AI committee that approves every AI use. What is the best advice?",
      options: [
        "Proceed, since a larger committee always makes better decisions",
        "Shrink it and delegate low and medium tiers to system owners",
        "Remove the committee and let IT approve all AI uses alone",
        "Proceed, but meet weekly so the queue never builds up",
      ],
      correctIndex: 1,
      explanation:
        "A small committee that reviews high tier decisions and policy, with delegation for lower tiers, avoids a bottleneck while keeping senior attention where it matters.",
    },
    {
      question: "Who should accept residual risk for a high tier AI use?",
      options: [
        "The AI governance lead",
        "The system owner, with committee review",
        "The vendor, who built the underlying model",
        "The champion in the team using the system",
      ],
      correctIndex: 1,
      explanation:
        "The owner answers for the use and accepts its residual risk; for high tier uses the committee reviews that decision. The lead, vendor and champions have other roles.",
    },
    {
      question:
        "An internal audit samples five register entries and finds two with out-of-date assessments. What is the right corrective action?",
      options: [
        "Update those two entries and close the finding",
        "Fix the two and find why assessments go out of date",
        "Remove the two entries from the register until reviewed",
        "Lower the target for in-date assessments next year",
      ],
      correctIndex: 1,
      explanation:
        "Corrective action addresses the cause, not just the instance. If assessments drift out of date, the review trigger or ownership needs fixing too.",
    },
    {
      question: "Which metric pairing best resists gaming?",
      options: [
        "Decision time, paired with a quality sample",
        "Number of policies, paired with number of pages",
        "Training completion, paired with login counts",
        "Incidents reported, paired with a target of zero",
      ],
      correctIndex: 0,
      explanation:
        "Pairing speed with a quality sample catches decisions made fast by cutting corners. The other pairings measure volume or encourage hiding problems.",
    },
    {
      question:
        "What does the EU AI Act's AI literacy expectation broadly ask of providers and deployers?",
      options: [
        "That every employee earns a formal AI qualification",
        "Measures for sufficient AI literacy for staff's roles",
        "That only certified engineers may use any AI system at all",
        "Annual exams for all staff on the text of the Act",
      ],
      correctIndex: 1,
      explanation:
        "The expectation is broadly to take measures so staff dealing with AI have sufficient literacy for their role and context. It does not require formal qualifications or exams for all.",
    },
    {
      question:
        "A board member says the quarterly AI report is too long to read. What is the best change?",
      options: [
        "Add an appendix with every metric that is tracked",
        "One or two pages: headline, top risks, decisions needed",
        "Stop reporting until there is a significant incident",
        "Send the full register to the board instead of a report",
      ],
      correctIndex: 1,
      explanation:
        "Leaders need to decide, not read data. A short report with the headline, top risks, trends and decisions needed is far more useful than more detail.",
    },
    {
      question:
        "Management review happens once a year, but the organisation's AI use changes monthly. What is the systems problem?",
      options: [
        "The sensor is too sensitive for the pace of change",
        "The loop's delay is too long to correct problems",
        "The goal is set too high for the programme to achieve",
        "There are too many actuators acting at the same time",
      ],
      correctIndex: 1,
      explanation:
        "A balancing loop with a long delay cannot correct fast-moving problems. Match the review rhythm to how quickly things change, with lighter monthly reviews.",
    },
    {
      question: "In a 90-day plan, why set up an incident route in the first 30 days rather than waiting for the full playbook?",
      options: [
        "Because regulators require it within thirty days of starting",
        "Because problems can happen now and need somewhere to go",
        "Because the playbook is not needed once a route exists",
        "Because incident routes are cheaper than any other control",
      ],
      correctIndex: 1,
      explanation:
        "AI is already in use, so problems can occur from day one. A simple named route lets people report now; the full playbook follows in the later phase.",
    },
    {
      question: "What makes champions effective rather than a badge?",
      options: [
        "A formal title and a mention in the company newsletter",
        "Some protected time, recognition and a line to the lead",
        "Authority to approve all AI uses within their own team",
        "Ownership of every AI system their department uses",
      ],
      correctIndex: 1,
      explanation:
        "Champions need time to help, recognition for doing it and a direct route to raise issues. Approval and ownership belong to other roles.",
    },
    {
      question:
        "A sales team is rewarded only on deal speed and keeps using unapproved AI to write proposals. Which intervention acts on the cause?",
      options: [
        "Send the sales team a stronger reminder of the policy",
        "Add a quality goal and a fast approved tool",
        "Block all AI websites on the sales team's laptops",
        "Ask the sales team to complete training a second time",
      ],
      correctIndex: 1,
      explanation:
        "The incentive drives the behaviour. Changing the goal and making the safe route fast acts on the structure, while reminders, blocks and retraining leave the incentive in place.",
    },
    {
      question: "Which item can most reasonably wait until after the first 90 days?",
      options: [
        "A route for staff to report AI problems",
        "Pursuing ISO/IEC 42001 certification",
        "An owner for each live high tier use",
        "An interim acceptable use policy",
      ],
      correctIndex: 1,
      explanation:
        "Certification is valuable for some organisations but builds on foundations that come first. Reporting routes, owners and an interim policy reduce risk immediately.",
    },
  ],
}];
