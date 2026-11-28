import type { SeedCapstone, SeedFinalExam, SeedLab } from "../types";

// AI Governance, Risk and Compliance. Labs, final exam and capstone.
// Every organisation, document and figure in these scenarios is invented for
// practice and is not presented as real. Regulation is described by
// structure only; no application dates, fines or enforcement figures are
// asserted.

export const GOV_LABS: SeedLab[] = [
  // ── Module 1 ──────────────────────────────────────────────────────────
  {
    slug: "ai-governance-lab-1-use-case-register",
    title: "Build a use-case register and classify the risk",
    labType: "workbench",
    moduleNumber: 1,
    estimatedMinutes: 45,
    points: 70,
    passScore: 70,
    briefMd: `Governance starts with seeing what AI is in use and deciding how much attention each use deserves.

In this lab you are the new AI governance lead at an illustrative college. A first discovery sweep has found eight AI uses. Turn them into a use-case register, classify each one, name owners, decide what to look at first, and spot one feedback loop in how the college handles AI.

You are assessed on the quality of your judgement: consistent tiers with reasons, owners in the business rather than in IT or compliance, and priorities driven by harm to people. A short, accurate register beats a long, vague one.`,
    scenarioMd: `**The organisation (illustrative)**

Imagine a further education college with about 600 staff and several thousand students, some under 18. It has no AI policy. A survey with an amnesty and a review of software subscriptions found these uses:

1. **Marketing** staff use a free AI assistant on personal accounts to draft course adverts and social media posts from public course information.
2. **Admissions** uses a vendor tool that scores applications for oversubscribed courses and suggests which applicants to invite to interview. Staff usually follow its suggestions.
3. **Lecturers** use an AI-writing detection tool. When it flags an essay, the student is called to an academic misconduct meeting.
4. **Student services** runs a website chatbot answering questions on fees, financial support and wellbeing. Students sometimes disclose mental health problems in it.
5. **HR** records disciplinary and grievance meetings with a transcription tool that produces AI summaries, stored in staff files.
6. **Finance** has switched on AI features in its accounting software that suggest how to code invoices. A person approves every payment.
7. **IT** is piloting an agent that reads helpdesk tickets and can reset passwords and change account permissions without a person approving each action.
8. **Estates** uses an approved assistant to summarise public planning guidance for internal briefings.

Work through the fields in order. Use the tiers low, medium and high from Module 1.`,
    objectives: [
      {
        id: "register",
        label: "Builds a usable register",
        weight: 2,
        guidance:
          "Full credit when all eight uses are recorded with, at minimum, a short description, the data involved (noting personal and special category data, and students under 18 where relevant), the decision type (informs, recommends or decides) and who is affected. Part credit if several rows miss data or decision type. Low credit for a list of tool names with no use-level detail.",
      },
      {
        id: "tiers",
        label: "Classifies risk consistently with reasons",
        weight: 3,
        guidance:
          "Full credit when tiers are consistent and justified: admissions scoring (education access, staff follow suggestions), AI-writing detection leading to misconduct meetings (serious consequences for students, risk of false flags), and the IT agent (autonomous actions on access) are high; the chatbot (vulnerable students, special category disclosures) and HR transcription (special category, employment) are at least medium with a reason, and may be high; marketing on personal accounts is low to medium with the shadow AI and data-terms issue noted; finance coding and estates summaries are low. Part credit for mostly sensible tiers with thin reasons. Low credit if any of the three clear high-tier uses is rated low.",
      },
      {
        id: "owners",
        label: "Assigns accountable owners correctly",
        weight: 2,
        guidance:
          "Full credit when each use has one accountable owner by role in the business area that benefits (e.g. head of admissions, head of student services, HR director, head of IT for the IT agent because IT is the business user there), with IT, data protection and safeguarding named as advisers rather than owners. Part credit if owners are sometimes teams or committees. Low credit if compliance or IT is made owner of everything.",
      },
      {
        id: "priorities",
        label: "Prioritises by harm and proposes proportionate first actions",
        weight: 2,
        guidance:
          "Full credit for a top three driven by potential harm to people (likely the detection tool, admissions scoring and the IT agent or chatbot) with a concrete first action for each (e.g. pause misconduct referrals based only on the detector; require meaningful review of admissions suggestions and start an impact assessment; add approval gates and scoped permissions to the agent; route wellbeing disclosures to trained staff). Also credits a proportionate response to marketing shadow use (an approved tool, not just a ban). Part credit for sensible priorities with vague actions.",
      },
      {
        id: "loop",
        label: "Identifies a feedback loop or incentive",
        weight: 1,
        guidance:
          "Full credit for one loop written as variables that can rise or fall with link directions, labelled reinforcing or balancing (e.g. no approved tool, more personal-account use, less visibility, stricter rules, more workarounds), or an incentive that pushes against governance (e.g. admissions staff under time pressure follow the score). Part credit for a one-way chain or an incentive named without its effect.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "register",
          label: "The register",
          prompt:
            "Write a register row for each of the eight uses: short description, data involved, decision type (informs, recommends or decides), and who is affected by the output.",
          placeholder: "1. Marketing drafts. Data: public course information. Decision type: informs. Affected: prospective students reading adverts...",
          minWords: 150,
        },
        {
          id: "tiers",
          label: "Risk tiers",
          prompt:
            "Give each use a tier (low, medium or high) with a one or two sentence reason that names the factors that decided it.",
          minWords: 120,
        },
        {
          id: "owners",
          label: "Owners and advisers",
          prompt:
            "Name the accountable owner for each use by role, and the advisers who must be consulted for the medium and high tier uses.",
          minWords: 80,
        },
        {
          id: "priorities",
          label: "Your top three and first actions",
          prompt:
            "Which three uses would you look at first, and why? For each, give one concrete action you would take in the next two weeks. Say how you would handle the marketing team's use of personal accounts.",
          minWords: 100,
        },
        {
          id: "loop",
          label: "One loop or incentive",
          prompt:
            "Describe one feedback loop or incentive in how this college uses AI. Write it as variables that can rise or fall, mark each link, and say whether it is reinforcing or balancing.",
          minWords: 50,
        },
      ],
    },
  },

  // ── Module 2 ──────────────────────────────────────────────────────────
  {
    slug: "ai-governance-lab-2-critique-a-policy",
    title: "Critique a draft AI policy",
    labType: "critique",
    moduleNumber: 2,
    estimatedMinutes: 30,
    points: 60,
    passScore: 70,
    briefMd: `A director asked an AI assistant to draft the organisation's first AI policy, and it is about to go to the board. It reads well and some of it is sound. Several parts would leave the organisation exposed, push staff to unsafe workarounds or claim more than any policy can deliver.

Flag the parts that break what Modules 1 and 2 taught about ownership, oversight, proportionality, incident handling, honest claims and data protection. **Leave the sound parts alone.** A reviewer who flags everything is as unhelpful as one who flags nothing, and the scoring reflects that.`,
    scenarioMd: `The policy is for an illustrative insurance broker with about 200 staff in the UK and Ireland. It uses an approved AI assistant for drafting, a vendor tool that screens job applicants, and is considering a customer chatbot. Read the whole policy before you start flagging.`,
    objectives: [
      {
        id: "recall",
        label: "Caught the genuine policy flaws",
        weight: 3,
        guidance:
          "Credit for each planted flaw identified: vague ownership, automatic rejection with no human oversight, a blanket ban with no alternative, no incident route, overclaimed compliance, no lawful basis for using customer data, and reliance on vendor claims without testing.",
      },
      {
        id: "precision",
        label: "Left the sound parts alone",
        weight: 2,
        guidance:
          "Credit for not flagging the sound parts: the register requirement, the red data rule, staff responsibility for checking output, telling customers when they are talking to AI, the DPIA trigger and the review cycle with triggers.",
      },
    ],
    config: {
      kind: "critique",
      answerMd: `**Responsible AI Policy (draft for board approval)**

**1. Purpose.** This policy sets out how we use artificial intelligence safely, fairly and lawfully.

**2. Compliance.** This policy ensures the organisation is fully compliant with the EU AI Act, UK GDPR and all other applicable laws, so no further legal review of individual AI uses is required.

**3. Ownership.** Responsibility for AI sits with everyone in the organisation, and decisions about AI tools will be taken collectively as the need arises.

**4. Register.** Every AI use must be recorded in the AI register, with a named business owner and a risk tier, before it goes live.

**5. Approved tools.** Staff may use the approved AI assistant through their work account. All other generative AI chat assistants are banned for work purposes until further notice, and no approved alternative will be provided for teams whose needs the approved assistant does not meet.

**6. Data rules.** Never enter special category personal data, passwords, or client documents under legal privilege into any AI tool unless a specific approved use allows it.

**7. Customer data.** Customer data may be used freely with approved AI tools, since customers accepted our terms and conditions when they signed up.

**8. Checking output.** Staff are responsible for any content they send, publish or rely on that was produced with AI, and must check facts, figures and references first.

**9. Recruitment.** The screening tool may reject applicants automatically where its score falls below the threshold, so that hiring managers' time is saved.

**10. Vendor assurance.** Where a vendor states that its tool is bias-free and compliant, this statement may be relied on without further testing.

**11. Transparency.** Any customer chatbot must tell customers at the start of each conversation that they are talking to an AI assistant, and offer a route to a person.

**12. Assessments.** A data protection impact assessment must be completed before any AI use involving personal data that is likely to result in high risk to individuals.

**13. Incidents.** Because all approved tools are vetted, AI incidents are not expected and no separate reporting process is needed.

**14. Review.** This policy is reviewed every year, and earlier if the law changes, a significant incident occurs, or we adopt a high-risk AI use.`,
      flaws: [
        {
          id: "f1",
          quote: "This policy ensures the organisation is fully compliant with the EU AI Act, UK GDPR and all other applicable laws, so no further legal review of individual AI uses is required.",
          explanation:
            "No policy can ensure compliance; that depends on how each system is used and controlled. The claim overstates what the document does and wrongly removes legal review of individual uses, which is exactly where obligations are decided.",
          category: "overconfidence",
        },
        {
          id: "f2",
          quote: "Responsibility for AI sits with everyone in the organisation, and decisions about AI tools will be taken collectively as the need arises.",
          explanation:
            "Shared responsibility means nobody answers for a specific system. Each use needs one accountable owner by role, and decision rights need to be defined in advance, not worked out collectively when a problem arrives.",
          category: "logic",
        },
        {
          id: "f3",
          quote: "no approved alternative will be provided for teams whose needs the approved assistant does not meet",
          explanation:
            "A ban with no alternative and no request route pushes use onto personal accounts with no data protection terms. The organisation loses visibility and gains risk. Provide a route to request tools and a fast decision instead.",
          category: "logic",
        },
        {
          id: "f4",
          quote: "Customer data may be used freely with approved AI tools, since customers accepted our terms and conditions when they signed up.",
          explanation:
            "Accepting terms and conditions is not a blanket lawful basis for every new use. Each purpose needs a lawful basis and must be compatible with why the data was collected, data should be minimised, and customers must be told.",
          category: "privacy",
        },
        {
          id: "f5",
          quote: "The screening tool may reject applicants automatically where its score falls below the threshold",
          explanation:
            "Rejecting applicants with no human involvement is a solely automated decision with a significant effect, in an area treated as high risk. It needs meaningful human oversight, fairness testing and a route for applicants to challenge it.",
          category: "omission",
        },
        {
          id: "f6",
          quote: "Where a vendor states that its tool is bias-free and compliant, this statement may be relied on without further testing.",
          explanation:
            "Vendor claims are marketing until tested. No tool can honestly be called bias-free, and a provider's compliance does not cover the deployer's own obligations. Ask for evidence and test on your own population.",
          category: "overconfidence",
        },
        {
          id: "f7",
          quote: "Because all approved tools are vetted, AI incidents are not expected and no separate reporting process is needed.",
          explanation:
            "Vetting reduces but never removes the chance of failure. Without a reporting route, problems go unseen and nothing is learned; data protection breaches may also have legal reporting deadlines that need a process behind them.",
          category: "omission",
        },
      ],
      candidates: [
        { id: "c1", text: "Claiming the policy ensures full compliance, so individual uses need no legal review", isFlaw: true, flawId: "f1" },
        { id: "c2", text: "Making responsibility for AI sit with everyone, with decisions taken collectively", isFlaw: true, flawId: "f2" },
        { id: "c3", text: "Requiring every AI use to be in the register with an owner and tier before go-live", isFlaw: false },
        { id: "c4", text: "Banning other assistants with no approved alternative for teams with unmet needs", isFlaw: true, flawId: "f3" },
        { id: "c5", text: "Never entering special category data, passwords or privileged documents without approval", isFlaw: false },
        { id: "c6", text: "Using customer data freely because customers accepted the terms and conditions", isFlaw: true, flawId: "f4" },
        { id: "c7", text: "Making staff responsible for checking AI-produced content before relying on it", isFlaw: false },
        { id: "c8", text: "Letting the screening tool reject applicants automatically below a score threshold", isFlaw: true, flawId: "f5" },
        { id: "c9", text: "Relying on vendor statements of bias-free and compliant tools without testing", isFlaw: true, flawId: "f6" },
        { id: "c10", text: "Requiring the chatbot to say it is an AI at the start and offer a route to a person", isFlaw: false },
        { id: "c11", text: "Requiring a DPIA before AI uses likely to result in high risk to individuals", isFlaw: false },
        { id: "c12", text: "Having no incident reporting process because approved tools are vetted", isFlaw: true, flawId: "f7" },
        { id: "c13", text: "Reviewing the policy yearly and earlier on a law change, incident or high-risk use", isFlaw: false },
      ],
    },
  },

  // ── Module 3 ──────────────────────────────────────────────────────────
  {
    slug: "ai-governance-lab-3-impact-assessment",
    title: "Write an impact assessment for an AI hiring tool",
    labType: "workbench",
    moduleNumber: 3,
    estimatedMinutes: 50,
    points: 80,
    passScore: 70,
    briefMd: `Hiring is one of the clearest high-impact uses of AI: decisions shape people's livelihoods, equality law applies, and in the EU employment is a listed high-risk area.

In this lab you write a combined AI and data protection impact assessment for an illustrative retailer that wants to use a vendor's screening tool. The scenario includes one feature that should stop you in your tracks.

You are assessed on specificity: named groups, real mechanisms, measures linked to risks one to one, and an honest view of the residual risk. Generic statements about "bias" or "privacy" earn little credit.`,
    scenarioMd: `**The proposal (illustrative)**

Imagine a retailer with about 40 stores in the UK and Ireland. It receives a large volume of applications for store assistant and supervisor roles and wants to use a vendor's AI screening tool. The vendor's tool:

- reads CVs and application answers and gives each applicant a suitability score from 0 to 100;
- ranks applicants for each vacancy and suggests a shortlist for interview;
- offers an optional add-on that analyses recorded video interviews and scores applicants on "enthusiasm" and "personality fit" from facial expressions and tone of voice;
- was trained, the vendor says, on "millions of hiring outcomes" from its other customers;
- is described in the sales deck as "bias-free and fully compliant".

The HR director wants recruiters to interview only the top ten scored applicants per vacancy. Store managers currently do the shortlisting and say they are overwhelmed. Applicants include school leavers, people returning to work after caring responsibilities, people with disabilities and people for whom English is a second language.

Fill in each field. You may assume the retailer has a data protection officer and an HR policy team you can consult.`,
    objectives: [
      {
        id: "describe",
        label: "Describes the processing, necessity and lawful basis",
        weight: 2,
        guidance:
          "Full credit for a clear description of what the tool does with what data and who uses the output; a necessity and proportionality argument that considers non-AI alternatives (e.g. structured screening questions, more shortlisting time); a plausible lawful basis with a note to confirm it with the DPO; and recognition that this is likely high risk (employment) under AI-specific regulation with the retailer as deployer. Part credit if necessity or lawful basis is missing.",
      },
      {
        id: "risks",
        label: "Identifies specific risks to named groups",
        weight: 3,
        guidance:
          "Full credit for at least four specific risks with mechanism and group, e.g. career-break applicants penalised for gaps; disabled applicants or those with atypical CVs scored lower; non-native English speakers penalised on written answers; training on other employers' outcomes importing their past preferences; a top-ten cut-off turning the score into a de facto automated rejection; plus likelihood and severity for each. Must flag the video add-on as inferring emotion or personality from faces and voice, which is scientifically contested, likely discriminatory, and may fall within prohibited or tightly restricted practices, recommending it is not used and legal advice is taken. Part credit for generic risks. Low credit if the video add-on is accepted without comment.",
      },
      {
        id: "measures",
        label: "Links measures to risks one to one",
        weight: 3,
        guidance:
          "Full credit when each significant risk has a named control: no hard top-ten cut-off, or review of a sample below the cut-off; recruiters trained and given time and authority to depart from the score; local fairness testing before launch and quarterly on outcome and error rates by group with thresholds set in advance; adjustments route for disabled applicants; transparency notice telling applicants AI is used and how to ask for human review; vendor evidence requested on testing and training data; the video add-on declined. Part credit for controls not linked to specific risks.",
      },
      {
        id: "residual",
        label: "Judges residual risk, consultation and review honestly",
        weight: 2,
        guidance:
          "Full credit for a stated residual risk level with who accepts it (the HR director as owner) and the conditions; consultation with the DPO and ideally a staff or applicant voice (e.g. store managers, an employee network, disability organisation); a review date and triggers (model change, complaint, fairness threshold breach, scale-up); and a clear statement that the bias-free and compliant claims are not accepted without evidence. Part credit for sign-off with no conditions or triggers.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "describe",
          label: "Description, necessity and lawful basis",
          prompt:
            "Describe the processing: what the tool does, what data it uses, who sees the output. Then argue necessity and proportionality, including at least one non-AI alternative, and propose a lawful basis to confirm with the DPO. Say what the likely risk classification and the retailer's role are under AI-specific regulation.",
          minWords: 120,
        },
        {
          id: "risks",
          label: "Risks to people",
          prompt:
            "List at least four specific risks, each naming the group affected, the mechanism, and a likelihood and severity rating. Include your assessment of the video interview add-on.",
          placeholder: "1. Applicants returning after caring responsibilities may score lower because...",
          minWords: 150,
        },
        {
          id: "measures",
          label: "Measures",
          prompt:
            "For each significant risk, name the control that addresses it. Cover human oversight (including the top-ten proposal), fairness testing, transparency and challenge, adjustments, and what you will require from the vendor.",
          minWords: 130,
        },
        {
          id: "residual",
          label: "Residual risk, consultation, sign-off and review",
          prompt:
            "State the residual risk, who accepts it and on what conditions. Say who you consulted or would consult. Set a review date and at least three revisit triggers.",
          minWords: 90,
        },
      ],
    },
  },

  // ── Module 4 ──────────────────────────────────────────────────────────
  {
    slug: "ai-governance-lab-4-incident-playbook",
    title: "Write an incident response playbook for an AI failure",
    labType: "workbench",
    moduleNumber: 4,
    estimatedMinutes: 45,
    points: 70,
    passScore: 70,
    briefMd: `Every AI system will eventually do something it should not. What matters is how quickly the organisation notices, contains the harm, tells the right people and learns.

In this lab you respond to an illustrative AI failure at a housing association and turn your response into a reusable playbook. You are assessed on whether your steps would actually protect people in the first 24 hours, whether your notifications are right without inventing legal deadlines, and whether your review changes the system rather than blaming a person.`,
    scenarioMd: `**The incident (illustrative)**

Imagine a housing association managing about 9,000 homes. Eight months ago it introduced an AI triage tool that reads repair requests from tenants (web form, email and transcribed phone calls), assigns a priority, and closes requests it judges to be "cosmetic". Staff review a weekly sample of 20 closed requests.

This morning a tenant's advocate complained: three reports of damp and mould from a family with a young child were each closed as cosmetic over six weeks. A quick search by the repairs manager finds dozens of other damp and mould reports closed as cosmetic in the last two weeks, more than in any previous period. The vendor's release notes show the underlying model was updated 15 days ago. Nobody at the association was told in advance.

The triage tool's owner is the head of repairs. The association has a data protection officer, a communications lead and a board. Some closed requests include tenants' health information.

Fill in each field. Where a legal duty may apply, say who must confirm it rather than stating a deadline you are not sure of.`,
    objectives: [
      {
        id: "contain",
        label: "Contains the harm in the first 24 hours",
        weight: 3,
        guidance:
          "Full credit for immediate, concrete containment: stop automatic closures (pause the tool or switch to recommend-only with every closure reviewed), reopen and manually re-triage all damp, mould and health-related requests closed since the model change (and ideally a wider window), prioritise households with children or vulnerable members, contact the complainant's household urgently, preserve logs and the model version, and name who has authority to do each. Part credit if the tool is paused but past closures are not re-triaged. Low credit if containment waits for the investigation.",
      },
      {
        id: "assess",
        label: "Triages severity and assesses impact",
        weight: 2,
        guidance:
          "Full credit for a severity level with reasons (health and safety risk to vulnerable residents makes this severe), a plan to establish scope (how many requests, which households, since when, linked to the model update or not), whether health information was mishandled, and whether this is a data protection breach or a service failure or both. Part credit for severity without scope.",
      },
      {
        id: "notify",
        label: "Notifies the right people without inventing deadlines",
        weight: 2,
        guidance:
          "Full credit for a notification table covering affected tenants, the complainant's advocate, the vendor (demanding an explanation of the update), the board and executive, the DPO (to judge whether any breach reporting duty applies and its timing), the housing regulator or ombudsman where relevant (confirmed by legal or compliance), and staff; each with who decides and when. Credits saying the DPO or legal lead confirms any statutory timing. Part credit for a list without decision-makers. Deduct for invented legal deadlines or fines.",
      },
      {
        id: "learn",
        label: "Fixes causes and closes the feedback loop",
        weight: 3,
        guidance:
          "Full credit for a blameless review that identifies structural causes (auto-closure of a category with safety implications; a weekly sample too small and not stratified to catch a shift; no contractual or technical model-change notice; no monitoring signal on closure rates by category) and specific changes: never auto-close damp, mould, gas, electrics or health mentions; monitoring of closure rates by category with a threshold; retest on any model change before it goes live; contract change for advance notice; revisit the impact assessment; a tabletop exercise date. Part credit for a review focused on retraining staff or blaming the vendor without structural change.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "contain",
          label: "First 24 hours: containment",
          prompt:
            "List, in order, what you do in the first 24 hours to stop further harm and preserve evidence. Name the role that authorises each step.",
          minWords: 100,
        },
        {
          id: "assess",
          label: "Severity and assessment",
          prompt:
            "Give the incident a severity level with reasons. Describe how you will establish the scope and the cause, and whether this involves personal data in a way that could be a breach.",
          minWords: 80,
        },
        {
          id: "notify",
          label: "Notifications",
          prompt:
            "Write a notification table: who is told, when, by whom, and who decides. Where a legal duty may apply, say who confirms it.",
          placeholder: "Affected tenants | within ... | by ... | decided by ...",
          minWords: 80,
        },
        {
          id: "learn",
          label: "Fix, review and loop changes",
          prompt:
            "Describe the fix and the retest before normal service resumes. Then write the key findings of a blameless review: why the controls did not catch this sooner, and the specific changes to monitoring, design, the contract and the playbook.",
          minWords: 120,
        },
      ],
    },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────
  {
    slug: "ai-governance-lab-5-critique-vendor-terms",
    title: "Critique a vendor's AI contract summary",
    labType: "critique",
    moduleNumber: 5,
    estimatedMinutes: 30,
    points: 60,
    passScore: 70,
    briefMd: `Procurement has received a summary of a vendor's standard terms for an AI assistant that will draft responses to customer complaints and read the customer records it needs. The summary was written by the vendor's sales team and some of it is perfectly reasonable.

Flag the terms that would leave your organisation exposed on data use, change, incidents, liability, assurance and exit. **Leave the reasonable terms alone.** This is not a legal review; it is the governance lead spotting what the lawyers need to push on.`,
    scenarioMd: `The buyer is an illustrative energy supplier operating in the UK. The use is medium to high tier: it involves customers' personal data, including some in financial difficulty, and the drafts go to customers after an agent reviews them. Read the whole summary before you start flagging.`,
    objectives: [
      {
        id: "recall",
        label: "Caught the risky terms",
        weight: 3,
        guidance:
          "Credit for each planted risk identified: broad service improvement wording that permits training, discretionary incident notification, model changes without notice, sub-processor changes without notice, a liability cap excluding data protection losses, assurance by self-statement only, and deletion with no data return on exit.",
      },
      {
        id: "precision",
        label: "Left the reasonable terms alone",
        weight: 2,
        guidance:
          "Credit for not flagging the reasonable terms: the data processing agreement, the UK data region, single sign-on and role-based access, customer ownership of outputs, the uptime commitment with service credits and the annual independent security report on request.",
      },
    ],
    config: {
      kind: "critique",
      answerMd: `**AI Complaint Assistant: summary of standard terms (vendor sales team)**

**Data processing.** A data processing agreement is included as standard, with the vendor acting as processor for customer data.

**Data location.** Customer data is stored and processed in our UK data region.

**Service improvement.** To deliver the best experience, the vendor may use customer inputs, outputs and feedback to improve and develop its products and models.

**Access.** Single sign-on and role-based access controls are included, so you decide which agents can use the assistant and what records it can read.

**Outputs.** You own the outputs the assistant generates for you.

**Availability.** We commit to 99.5% monthly uptime, with service credits if we miss it.

**Model updates.** We continuously improve our models and may update the underlying model at any time without notice, so you always have the latest capabilities.

**Sub-processors.** We may add or change sub-processors at any time; the current list is available on our website.

**Security incidents.** We will notify customers of security incidents affecting their data when we consider it appropriate.

**Liability.** Our total liability is capped at the fees paid in the previous three months, and excludes all losses arising from data protection claims.

**Assurance.** An independent security audit report is available annually on request under a confidentiality agreement.

**Compliance.** Rather than audit or information rights, customers may rely on our statement that the service is responsible and compliant.

**Termination.** On termination, all customer data, prompts and configurations are deleted within 7 days. Data export is not available.`,
      flaws: [
        {
          id: "f1",
          quote: "the vendor may use customer inputs, outputs and feedback to improve and develop its products and models",
          explanation:
            "This wording permits training the vendor's models on your customers' complaint data, which may make the vendor a controller for that use and needs a lawful basis you probably do not have. Ask for a contractual commitment not to train on your data.",
          category: "privacy",
        },
        {
          id: "f2",
          quote: "may update the underlying model at any time without notice",
          explanation:
            "A silent model change can alter accuracy, tone and fairness for customers in financial difficulty without you retesting. Ask for advance notice of material changes and the option to stay on a version while you test.",
          category: "omission",
        },
        {
          id: "f3",
          quote: "We may add or change sub-processors at any time; the current list is available on our website.",
          explanation:
            "Your customers' personal data could flow to new parties without notice. You need notice of changes and a right to object, as part of your data protection duties.",
          category: "privacy",
        },
        {
          id: "f4",
          quote: "when we consider it appropriate",
          explanation:
            "Discretionary notification means you may learn of an incident too late to protect customers or meet your own reporting duties. Ask for a stated time limit, a defined route and cooperation with your investigation.",
          category: "omission",
        },
        {
          id: "f5",
          quote: "capped at the fees paid in the previous three months, and excludes all losses arising from data protection claims",
          explanation:
            "The cap is small relative to potential harm and excludes the very risk most likely to materialise. Record the gap and negotiate, insure or reduce exposure; accountability to customers stays with you either way.",
          category: "logic",
        },
        {
          id: "f6",
          quote: "customers may rely on our statement that the service is responsible and compliant",
          explanation:
            "A self-statement is not assurance. For a use involving vulnerable customers' data you need information rights: reports, certificates and answers to reasonable questions, and evidence of testing.",
          category: "overconfidence",
        },
        {
          id: "f7",
          quote: "Data export is not available.",
          explanation:
            "With no export, you cannot recover your prompts, configurations or records on exit, which creates lock-in and may leave gaps in your audit trail. Ask for return in a usable format, then certified deletion.",
          category: "omission",
        },
      ],
      candidates: [
        { id: "c1", text: "A data processing agreement included as standard, with the vendor as processor", isFlaw: false },
        { id: "c2", text: "Customer data stored and processed in the vendor's UK data region", isFlaw: false },
        { id: "c3", text: "Permission to use inputs, outputs and feedback to improve the vendor's models", isFlaw: true, flawId: "f1" },
        { id: "c4", text: "Single sign-on and role-based access controls set by the customer", isFlaw: false },
        { id: "c5", text: "The customer owning the outputs the assistant generates", isFlaw: false },
        { id: "c6", text: "A 99.5% monthly uptime commitment with service credits", isFlaw: false },
        { id: "c7", text: "Updating the underlying model at any time without notice", isFlaw: true, flawId: "f2" },
        { id: "c8", text: "Adding or changing sub-processors at any time, with a list on the website", isFlaw: true, flawId: "f3" },
        { id: "c9", text: "Notifying security incidents when the vendor considers it appropriate", isFlaw: true, flawId: "f4" },
        { id: "c10", text: "A three-month fee cap that excludes losses from data protection claims", isFlaw: true, flawId: "f5" },
        { id: "c11", text: "An annual independent security audit report available on request", isFlaw: false },
        { id: "c12", text: "Relying on the vendor's statement in place of audit or information rights", isFlaw: true, flawId: "f6" },
        { id: "c13", text: "Deleting all data within 7 days of termination with no export available", isFlaw: true, flawId: "f7" },
      ],
    },
  },

  // ── Module 6 ──────────────────────────────────────────────────────────
  {
    slug: "ai-governance-lab-6-ninety-day-plan",
    title: "Plan the first 90 days of an AI governance programme",
    labType: "workbench",
    moduleNumber: 6,
    estimatedMinutes: 50,
    points: 80,
    passScore: 70,
    briefMd: `You have been asked to set up AI governance in an organisation that has none, with limited time and budget. This lab brings the whole track together.

Write a realistic 90-day plan, the roles and decision rights to go with it, the metrics for your first report to leadership, and a systems review of your own plan. You are assessed on realism and sequencing (what reduces the most risk soonest), on roles that keep accountability in the business, on metrics that resist gaming, and on whether your plan works with the system's loops and incentives rather than against them.`,
    scenarioMd: `**The organisation (illustrative)**

Imagine a national charity with about 250 staff and many volunteers, offering advice and support services to people in financial difficulty, some by phone and some face to face. It processes sensitive personal data, including health and financial information.

What you know:

- There is no AI policy and no register. Leadership believes "a few people use ChatGPT".
- An informal check suggests AI use is widespread: fundraising, communications, advice workers summarising case notes, and a volunteer coordinator using a free tool to draft rotas.
- The advice team is piloting a vendor tool that transcribes calls and suggests which benefits a caller may be entitled to. Advisers say it "saves loads of time".
- Advisers are measured mainly on calls handled per day.
- IT is two people. There is a part-time data protection officer.
- The chief executive will sponsor the work and has given you two days a week for three months.
- The board meets in 100 days and wants a short report.`,
    objectives: [
      {
        id: "plan",
        label: "Sequences a realistic 90-day plan",
        weight: 3,
        guidance:
          "Full credit for a plan in three phases with owner roles and done-states, sized to two days a week and a two-person IT team. Days 1 to 30 should include an amnesty discovery and register, an interim one-page acceptable use policy with data rules suited to sensitive data, an incident route, a safe default tool or a plan for one, and an immediate owner and first look at the benefits pilot. Days 31 to 60: tiering, an impact assessment and oversight check for the pilot, a procurement gate. Days 61 to 90: monitoring for high tier uses, a playbook and tabletop, metrics and the board report. Part credit for sensible content with poor sequencing or unrealistic scope (e.g. certification in 90 days).",
      },
      {
        id: "pilot",
        label: "Handles the high-risk pilot properly",
        weight: 2,
        guidance:
          "Full credit for treating the benefits entitlement pilot as high tier (access to essential support, vulnerable callers, health and financial data, possibly recording calls), naming an owner (e.g. head of advice), and requiring a DPIA, transparency to callers about recording and AI, vendor due diligence on data use and training, adviser oversight with time to check entitlements against official sources, and a decision on whether the pilot continues during assessment. Part credit if it is flagged without concrete conditions.",
      },
      {
        id: "roles",
        label: "Sets roles and decision rights that fit the organisation",
        weight: 2,
        guidance:
          "Full credit for a light structure sized to 250 staff: CEO as sponsor, the learner as governance lead, a small review group (e.g. DPO, IT lead, head of advice, a volunteer manager), business owners per use, champions in key teams with time allocated, and a decision rights table by tier including who can pause a system. Part credit for roles that make the lead or IT the owner of everything, or an oversized committee.",
      },
      {
        id: "metrics",
        label: "Chooses paired metrics and a useful board report",
        weight: 1,
        guidance:
          "Full credit for five to ten metrics across coverage, timeliness, assurance, outcomes and capability, each paired with a check that resists gaming, and a short board report outline with a headline, top risks, trends (or baselines), incidents and decisions needed, honest about what is not yet in place. Part credit for unpaired volume metrics.",
      },
      {
        id: "systems",
        label: "Reviews the plan as a system",
        weight: 2,
        guidance:
          "Full credit for spotting that advisers measured on calls per day have an incentive to accept AI suggestions uncritically (automation bias plus a speed target), proposing a change at the goal level (e.g. pair calls handled with a quality or accuracy check of entitlement advice), checking that the safe route is faster than the unsafe one (approved tool, fast track), and naming at least one loop or delay (e.g. wrong entitlement advice harms people months later). Part credit for a generic systems comment without a specific incentive or loop.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "plan",
          label: "The 90-day plan",
          prompt:
            "Write the plan in three phases (days 1 to 30, 31 to 60, 61 to 90). For each item give an owner by role and a done-state. Keep it realistic for the time and people available.",
          minWords: 200,
        },
        {
          id: "pilot",
          label: "The benefits entitlement pilot",
          prompt:
            "Say how you will handle the advice team's pilot: its tier and why, its owner, what must happen before it can continue or scale, and what you would decide about it in the first two weeks.",
          minWords: 100,
        },
        {
          id: "roles",
          label: "Roles and decision rights",
          prompt:
            "Set out the roles (sponsor, lead, review group, owners, advisers, champions) and a decision rights table for low, medium and high tier uses, pausing a system and changing policy.",
          minWords: 90,
        },
        {
          id: "metrics",
          label: "Metrics and the board report",
          prompt:
            "List five to ten metrics, each paired with a check that resists gaming, and outline the one-page report you will send the board in 100 days.",
          minWords: 90,
        },
        {
          id: "systems",
          label: "Systems review of your plan",
          prompt:
            "Review your plan as a systems thinker. Identify one incentive pushing against good governance, one loop or delay that matters, and the change you made to your plan because of them.",
          minWords: 80,
        },
      ],
    },
  },
];

export const GOV_FINAL_EXAM: SeedFinalExam = {
  title: "AI Governance, Risk and Compliance: Final Exam",
  timeLimitMinutes: 60,
  questionsServed: 35,
  passScore: 75,
  distinctionScore: 90,
  maxAttempts: 3,
  cooldownHours: 24,
  instructionsMd: `You will be served **35 questions** drawn from a larger bank, covering all six modules. You have **60 minutes**.

- The pass mark is **75%**. **90%** or above earns a distinction.
- Answer options are shuffled for each attempt, so do not rely on position.
- You have three attempts, with 24 hours between them.

Most questions are short scenarios. They test judgement: classifying risk, applying data protection and risk-based regulation in general terms, designing oversight and controls, reading vendor claims and contracts, and running a governance programme as a system. Read each scenario fully before choosing.`,
  questions: [
    // ── Module 1: Why AI Needs Governance (8) ───────────────────────────
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "Which of these is the best description of AI governance?",
      options: [
        "A ban on AI until all the relevant laws are settled",
        "Rules, roles and routines for using AI and answering for it",
        "A technical process for training ever more accurate models",
        "A contract that moves AI risk from you to the vendor",
      ],
      correctIndex: 1,
      explanation:
        "Governance is how an organisation decides which AI it uses, how, and who answers for the results. It is not a ban, a training technique or a way to transfer accountability.",
    },
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "What makes human oversight of an AI system real rather than nominal?",
      options: [
        "A reviewer's name recorded against every AI output",
        "Reviewers with time, competence and authority to disagree",
        "A monthly report of all AI decisions sent to the board for noting",
        "A one-off sign-off by a senior manager before launch",
      ],
      correctIndex: 1,
      explanation:
        "Oversight works only if people can genuinely understand and override the output. Names on records, reports and one-off sign-offs can all exist while nobody is able to intervene.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A retailer's AI pricing tool raises prices more in areas with fewer competing shops. Complaints come from lower-income areas. Which failure category is most at issue?",
      options: [
        "Security, because the tool's prices could be hacked",
        "Unfair outcomes falling on some groups more than others",
        "Accuracy, because the prices are calculated incorrectly",
        "Privacy, because shoppers' postcodes are stored",
      ],
      correctIndex: 1,
      explanation:
        "The tool may be working as designed and still produce outcomes that fall harder on some groups. That is the bias and unfair outcomes category, which needs testing by group rather than overall accuracy checks.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "An organisation's principle says 'we use AI fairly'. Which rewrite is most checkable?",
      options: [
        "We are committed to fairness in every use of AI we make",
        "Shortlist rates by group are compared quarterly by HR",
        "Fairness is a core value that guides all of our AI work",
        "We aim to avoid any unfair outcomes from our AI tools",
      ],
      correctIndex: 1,
      explanation:
        "A checkable commitment says what will be true, how you will know and who checks. A named comparison, a schedule and a responsible role can be verified; statements of intent cannot.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "Who should be the accountable owner of an AI tool that helps a council's benefits team prioritise claims?",
      options: [
        "The head of IT, who runs the system day to day",
        "The head of the benefits service, who uses the output",
        "The data protection officer, who advises on its risks",
        "The vendor, who designed and built the underlying tool",
      ],
      correctIndex: 1,
      explanation:
        "Accountability sits with the business owner who accepts the benefit and the risk. IT operates, the DPO advises and challenges, and the vendor is not accountable for your use.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A governance team is measured on the number of AI requests it refuses. What is the most likely effect?",
      options: [
        "More careful approvals that steadily reduce AI risk",
        "More refusals, more workarounds and less visibility",
        "Fewer requests, because staff stop wanting AI tools",
        "No change, since targets rarely affect behaviour",
      ],
      correctIndex: 1,
      explanation:
        "A refusal target rewards blocking, which feeds the shadow AI loop: people work around the process and governance sees less. Measuring safe adoption is a stronger goal.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "Approvals take three months. Staff turn to personal accounts. After a leak, leadership adds two more approval steps. Which intervention would most likely break this loop?",
      options: [
        "Add a third approval step for any use of personal data",
        "A fast track for low-risk uses plus an approved default tool",
        "Send a firm reminder that personal accounts are banned",
        "Double the penalties for staff who use unapproved tools",
      ],
      correctIndex: 1,
      explanation:
        "The reinforcing loop is driven by the slow route. A fast track and a safe default make the approved path quicker than the workaround, acting on rules and structure rather than adding to the bottleneck.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "After a year, a firm reports zero AI incidents and 100% training completion. A sweep finds forty unregistered AI uses. What is the best reading?",
      options: [
        "The programme is working and the sweep can be ignored",
        "The metrics have become targets and hide the real picture",
        "Training has failed and should be made mandatory again",
        "The forty uses are low risk, so the gap is not important",
      ],
      correctIndex: 1,
      explanation:
        "Perfect scores alongside a large hidden stock of uses suggest Goodhart's law: people hit the numbers without the underlying behaviour. Pair metrics with checks such as sweeps and quality samples.",
    },

    // ── Module 2: The Regulatory Landscape (8) ──────────────────────────
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "Which list best describes the layers of the EU AI Act's risk-based structure?",
      options: [
        "Small, medium and large AI models, with duties by size",
        "Prohibited, high-risk, transparency and general-purpose duties",
        "Public, private and charity uses, with separate regimes",
        "Text, image and audio models, each with their own separate rules",
      ],
      correctIndex: 1,
      explanation:
        "The Act sets out prohibited practices, high-risk systems, transparency obligations and obligations for general-purpose AI models. It is organised by use and risk, not by sector or model size.",
    },
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "Which statement about ISO/IEC 42001 is accurate?",
      options: [
        "It certifies that an individual AI product is safe and lawful to use",
        "It sets requirements for an organisation's AI management system",
        "It is a European law with fines for non-compliance",
        "It replaces data protection law for AI systems",
      ],
      correctIndex: 1,
      explanation:
        "ISO/IEC 42001 is a certifiable standard for an AI management system. It is not a product certificate, a law, or a substitute for data protection obligations.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A UK company sells an AI tool used by schools in Spain to decide on student admissions. Why should it consider the EU AI Act?",
      options: [
        "Because all AI used in schools is a prohibited practice",
        "It places a likely high-risk system on the EU market",
        "Because UK law requires compliance with every EU law",
        "Because the Act covers any company that uses English",
      ],
      correctIndex: 1,
      explanation:
        "The Act can apply to providers outside the EU who place systems on the EU market, and access to education is a listed high-risk area. Admissions tools are not prohibited outright.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A lender's staff accept every AI credit recommendation in seconds without seeing the reasons. What does data protection law make the key question?",
      options: [
        "Whether the AI vendor holds a current ISO certificate for it",
        "Whether this is in effect a solely automated decision",
        "Whether applicants consented to a credit check",
        "Whether the model was trained in the same country",
      ],
      correctIndex: 1,
      explanation:
        "Decisions with significant effects made solely by automated means attract specific protections. A rubber-stamp review does not make the decision meaningfully human, so safeguards and real review are needed.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A risk team wants a free, practical structure to organise its AI risk work, with no need for certification. Which is the best starting point?",
      options: [
        "ISO/IEC 42001, with an external certification audit",
        "The NIST AI RMF and its four core functions",
        "The OECD AI Principles, adopted by many governments",
        "The EU AI Act's list of prohibited practices",
      ],
      correctIndex: 1,
      explanation:
        "The NIST AI RMF is voluntary, free and built to structure AI risk work. ISO/IEC 42001 suits certifiable assurance; the OECD principles are values-level; the prohibited list is one part of a law.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question:
        "A manager asks an AI assistant which EU AI Act obligations apply this year and plans to act on the answer. What is the best advice?",
      options: [
        "Use it, since assistants are trained on official legal texts",
        "Check the official timetable and current guidance instead",
        "Ask two different assistants and use the answer they agree on",
        "Assume every obligation applies already, to be safe",
      ],
      correctIndex: 1,
      explanation:
        "Obligations apply in phases and the timetable can change. Assistants can be out of date or wrong, so check official sources and take advice for specific systems.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question:
        "A charity in Kenya and the UK uses a US vendor's AI tool to triage requests for help, including health details. Which approach to data protection is soundest?",
      options: [
        "Apply only US law, since that is where the vendor is based",
        "Check each applicable law, run a DPIA and agree processor terms",
        "Apply only UK GDPR, since it is the most detailed of the laws",
        "Treat the data as anonymous, since it is used only for triage",
      ],
      correctIndex: 1,
      explanation:
        "Laws where the charity and the people it serves are based can each apply. Health data and vulnerable people point to a DPIA, and a vendor processing data needs proper processor terms and transfer checks.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question:
        "A firm modifies a vendor's general recruitment model, fine-tunes it on its own data and offers it to other employers under its own brand. What is the most important governance consequence?",
      options: [
        "None, as the original vendor remains responsible for the model",
        "It may take on provider duties for a high-risk system",
        "It becomes exempt because the tool is now a new product",
        "It only needs to update its acceptable use policy",
      ],
      correctIndex: 1,
      explanation:
        "Substantially modifying a system and offering it under your own name in a high-risk area like employment can make you a provider, with obligations such as risk management, documentation and conformity assessment.",
    },

    // ── Module 3: Assessing AI Risk (8) ─────────────────────────────────
    {
      moduleNumber: 3,
      difficulty: 1,
      question: "Why does a use-case register record each use rather than each tool?",
      options: [
        "Because tools are too numerous to list individually",
        "Because the same tool can carry different risk per use",
        "Because vendors ask customers to register each separate use",
        "Because uses are easier to remove when retired",
      ],
      correctIndex: 1,
      explanation:
        "Risk depends on what AI is used for, on what data and with what effect. One assistant can be low risk for internal notes and high risk for decisions about people.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "An AI tool scores low on most factors but can send refunds without approval. How should it be classified?",
      options: [
        "Low, because the majority of its factor scores are low",
        "High, because irreversible actions cannot be averaged away",
        "Medium, because the high factor balances the low ones",
        "Not classified, until it has caused a refund error",
      ],
      correctIndex: 1,
      explanation:
        "A single high on irreversibility, impact or regulatory category should set the tier. Averaging lets serious factors hide behind trivial ones.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "Which risk statement in an impact assessment for a loans tool is most useful?",
      options: [
        "The tool might be biased against some applicants",
        "Thin-file applicants may be declined more for lack of data",
        "There could be issues with fairness in some situations",
        "AI systems are widely known to carry some risks of discrimination",
      ],
      correctIndex: 1,
      explanation:
        "A useful risk names the group, the mechanism and the effect, so it can be tested and treated. Generic statements give nobody anything to act on.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "A fraud model's overall accuracy is high, but genuine claims from older customers are wrongly flagged more often. Which measure exposes this?",
      options: [
        "Overall accuracy on the full test set",
        "Error rates compared between age groups",
        "Average processing time for each claim",
        "The number of claims flagged per week",
      ],
      correctIndex: 1,
      explanation:
        "Overall accuracy can hide uneven errors. Comparing false positive rates by group shows who bears the burden of the model's mistakes.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "A vendor shares good fairness results from its own general testing. What should a deployer still do for a high tier use?",
      options: [
        "Nothing more, since the vendor's results cover all users",
        "Test on its own population and use case before relying on it",
        "Publish the vendor's results as its own fairness evidence",
        "Ask the vendor to guarantee in writing that no bias exists at all",
      ],
      correctIndex: 1,
      explanation:
        "A general test does not show how the tool behaves with your population and task. You remain responsible for outcomes, so test locally and keep testing.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "A recruitment tool's shortlisting rate for one group is 70% of the highest group's rate, on a sample of 40 applicants. What is the best next step?",
      options: [
        "Conclude the tool is unlawful and withdraw it immediately",
        "Treat it as a signal: investigate with more data and causes",
        "Ignore it, because the sample is small and gaps are common",
        "Adjust scores for that group so rates match exactly",
      ],
      correctIndex: 1,
      explanation:
        "A gap below the four-fifths rule of thumb is a signal to investigate, and a small sample is noisy. Gather more data and look for mechanisms before deciding; mechanical score adjustments raise their own legal questions.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "A DPIA for an AI system finds high residual risk to people that the organisation cannot reduce. The project sponsor wants to launch. What should happen under GDPR?",
      options: [
        "Launch, as long as the board formally accepts the risk",
        "Consult the data protection authority before processing",
        "Launch a small pilot first, then decide whether to consult",
        "Rewrite the DPIA until the residual risk is rated medium",
      ],
      correctIndex: 1,
      explanation:
        "Where high risk remains after mitigation, prior consultation with the data protection authority is required before processing. Board acceptance, pilots or rewording the assessment do not replace it.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "Choosing between equal selection rates and equal error rates for a hiring tool, the data team says both cannot be met. Who should decide?",
      options: [
        "The data team, since the metrics are technical choices",
        "The accountable owner, with advice, recorded with reasons",
        "The vendor, since it designed the tool's scoring method",
        "Nobody: pick whichever metric gives the best result",
      ],
      correctIndex: 1,
      explanation:
        "When fairness measures conflict, choosing between them is a values decision. It belongs with the accountable owner, informed by advisers, and recorded in a decision record.",
    },

    // ── Module 4: Controls and Operations (7) ───────────────────────────
    {
      moduleNumber: 4,
      difficulty: 1,
      question: "What does a model card typically describe?",
      options: [
        "The vendor's pricing, discounts and licence terms",
        "A model's intended uses, evaluation and limitations",
        "The staff who are allowed to use the model at work",
        "The physical location of the servers running it",
      ],
      correctIndex: 1,
      explanation:
        "Model cards describe intended and out-of-scope uses, how the model was evaluated, performance across conditions and groups, and known limitations.",
    },
    {
      moduleNumber: 4,
      difficulty: 1,
      question: "Which is the first priority once an AI incident has been triaged?",
      options: [
        "Writing the blameless review document",
        "Containing the harm and preserving evidence",
        "Retraining the staff involved in the incident",
        "Publishing a statement on the company website",
      ],
      correctIndex: 1,
      explanation:
        "Containment comes first: stop further harm, revert to a safe process and preserve logs. Review, communication and fixes follow.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "An acceptable use policy bans all generative AI with no approved alternative. Six months later, what is the most likely situation?",
      options: [
        "AI use has stopped and data risk has fallen sharply",
        "Use continues on personal accounts, out of sight",
        "Staff have all requested approved tools formally",
        "Vendors have adapted their tools to the policy",
      ],
      correctIndex: 1,
      explanation:
        "Bans without alternatives push use onto unprotected personal accounts. The organisation loses visibility while the risk remains or grows.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "An assistant connected to the shared drive shows a junior employee salary files. Which control addresses the root cause?",
      options: [
        "A system prompt telling the assistant to avoid salary files",
        "Fixing over-broad permissions on the drive at the source",
        "Asking the vendor to retrain its model on HR topics",
        "Reminding staff not to ask about other people's pay",
      ],
      correctIndex: 1,
      explanation:
        "The assistant can only surface what it can access. Correcting permissions at the source fixes the exposure for both the AI and people browsing directly.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "Caseworkers review 300 AI recommendations a day each and override almost none. What should the governance lead do?",
      options: [
        "Set a target for caseworkers to override one in ten",
        "Sample cases and check workload, time and information",
        "Remove the review step, since the AI is clearly accurate",
        "Replace the caseworkers with a second AI reviewer",
      ],
      correctIndex: 1,
      explanation:
        "A near-zero override rate at high volume may mean rubber-stamping. Sampling and checking the oversight conditions finds out; an override target would invite gaming.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question:
        "An email assistant can read inboxes, draft replies, send email and update supplier bank details. Which change most reduces the impact of a successful prompt injection?",
      options: [
        "Strengthen the system prompt with firmer instructions",
        "Remove bank updates and require approval to send",
        "Switch to a newer, larger model from the same vendor",
        "Train staff to delete suspicious emails more quickly",
      ],
      correctIndex: 1,
      explanation:
        "Structural controls cap the damage: removing a dangerous capability and gating sending mean a successful injection cannot complete the harmful action. Wording and model changes only lower the odds.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question:
        "An AI triage tool started misclassifying urgent requests after a silent vendor model update. The weekly 20-case random sample missed it. Which change best strengthens the balancing loop?",
      options: [
        "Increase the random sample to 25 cases a week",
        "Track outcomes by category and retest on model change",
        "Replace the vendor with one that updates less often",
        "Ask reviewers to work faster through the sample",
      ],
      correctIndex: 1,
      explanation:
        "The sensor was too weak and the change went unnoticed. Category-level monitoring with thresholds and mandatory retesting on model change detect this kind of shift; a slightly bigger random sample does little.",
    },

    // ── Module 5: Buying and Building Responsibly (7) ───────────────────
    {
      moduleNumber: 5,
      difficulty: 1,
      question: "What do 'information rights' in an AI contract usually give a customer?",
      options: [
        "Access to the vendor's internal staff communications",
        "Audit reports, certificates and answers on request",
        "The right to publish the vendor's source code",
        "Ownership of the vendor's training datasets",
      ],
      correctIndex: 1,
      explanation:
        "Large vendors rarely allow on-site audits, so information rights provide assurance through independent reports, certificates, questionnaire answers and notice of lapses.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "A vendor's terms allow it to use customer data 'to improve our services'. What is the main governance concern?",
      options: [
        "The wording is too short to be enforceable",
        "It may permit training models on your data",
        "It means the vendor cannot fix any bugs",
        "It prevents you from using the outputs",
      ],
      correctIndex: 1,
      explanation:
        "Broad improvement wording can cover training on your data, which affects your lawful basis, transparency and confidentiality. Seek a clear contractual commitment.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "A vendor claims '97% accuracy'. Which question matters most before relying on it?",
      options: [
        "How long has the company been trading in total?",
        "On what data, by what measure and for which groups?",
        "Which other customers have bought the product?",
        "Is the figure higher than the vendor's competitors?",
      ],
      correctIndex: 1,
      explanation:
        "An accuracy figure means little without the test data, the measure and the breakdown by group. Then test on your own cases.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "A vendor's liability cap is three months of fees and excludes data protection losses. The use involves vulnerable customers' data. What is the best response?",
      options: [
        "Accept it, since caps are standard and cannot be changed",
        "Record the gap; negotiate, insure or reduce exposure",
        "Assume the exclusion is void and proceed as planned",
        "Stop all use of AI with any customer data at all",
      ],
      correctIndex: 1,
      explanation:
        "The gap between the cap and potential harm is a risk to record and treat. Negotiation, insurance or design changes reduce it; accountability to customers stays with you regardless.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "Where in the lifecycle of an in-house AI build should evaluation results, including fairness and adversarial tests, be reviewed?",
      options: [
        "At intake, before the problem has been fully defined",
        "At the pre-launch gate, before the system goes live",
        "Only after launch, once real complaints arrive",
        "At retirement, when the system is switched off",
      ],
      correctIndex: 1,
      explanation:
        "The pre-launch gate asks whether evidence shows the system is fit for its intended use. Intake is too early to have results, and waiting for complaints is too late.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "Procurement has one six-month process for every AI tool. Teams buy small AI tools on cards to avoid it. What is the best structural fix?",
      options: [
        "Block card payments to all known AI vendors",
        "Scale checks to tier, fast-track low risk, gate on register",
        "Extend the six-month process so that card purchases are reviewed too",
        "Remind budget holders of the procurement policy",
      ],
      correctIndex: 1,
      explanation:
        "A risk-scaled process with a fast track makes the safe route quicker, and a register requirement at purchase builds the check into the structure. Blocks and reminders leave the cause in place.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "A vendor's contract has no data export on exit and deletes everything within seven days of termination. Why does this matter for governance?",
      options: [
        "It only matters if the organisation plans to leave soon",
        "It creates lock-in and may break your audit trail",
        "It is good practice, since it guarantees quick deletion",
        "It matters only to the finance team's budget planning",
      ],
      correctIndex: 1,
      explanation:
        "Without export you cannot move your prompts, configurations and records, and you may lose evidence needed to explain past decisions. Seek return in a usable format, then certified deletion.",
    },

    // ── Module 6: Running an AI Governance Programme (7) ────────────────
    {
      moduleNumber: 6,
      difficulty: 1,
      question: "What is the main role of the AI governance committee?",
      options: [
        "To own and operate every AI system in the organisation",
        "To set policy, review high tier uses and resolve disputes",
        "To approve every AI request, however small, each month",
        "To provide independent audit of the whole programme",
      ],
      correctIndex: 1,
      explanation:
        "The committee sets policy, reviews high-impact decisions and resolves disagreements. Owners own systems, lower tiers are delegated, and internal audit provides independent assurance.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "Reported AI incidents drop sharply after every report starts triggering a formal disciplinary review. What is the most likely explanation?",
      options: [
        "AI systems have become much safer since the change",
        "People have stopped reporting to avoid the process",
        "The incident definition has become far too narrow",
        "Vendors have fixed the faults behind past incidents",
      ],
      correctIndex: 1,
      explanation:
        "Making reporting risky suppresses reports. The balancing loop of report, learn and adjust then weakens, which is why outcome metrics are paired with reporting culture indicators.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "Which metric pair best gives leadership an honest view of assessment quality?",
      options: [
        "Number of assessments done, paired with the pages written for each",
        "Share of high tier uses assessed, paired with a depth check",
        "Number of committee meetings, paired with attendance",
        "Training completion, paired with the number of logins",
      ],
      correctIndex: 1,
      explanation:
        "Coverage of high tier uses matters, and pairing it with a sampled depth check stops shallow assessments from inflating the number.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "What should the first 30 days of a new AI governance programme focus on?",
      options: [
        "Writing a complete library of AI policies",
        "Visibility, a safe default tool and a report route",
        "Achieving full ISO/IEC 42001 certification for the organisation",
        "Building custom monitoring dashboards",
      ],
      correctIndex: 1,
      explanation:
        "Early effort should reduce the most risk soonest: find what is in use, give staff a safe option and set up a way to report problems. Certification and tooling build on that.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "Under the EU AI Act's AI literacy expectation, what is a sensible approach to training?",
      options: [
        "The same long course for every member of staff",
        "Role-based training, recorded, with practical checks",
        "A single board briefing on the text of the Act",
        "Training only the IT team, since they are the ones who run the tools",
      ],
      correctIndex: 1,
      explanation:
        "Literacy should match people's roles and contexts: users, reviewers, owners and leaders need different things. Recording it provides evidence that the control exists.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question:
        "Advisers are measured on calls handled per day and use an AI tool that suggests benefit entitlements. Which change acts on the structure rather than the people?",
      options: [
        "Remind advisers to check every AI suggestion carefully",
        "Pair the calls target with a sampled accuracy measure",
        "Increase the calls target to reflect the time saved",
        "Ask advisers to sign a form confirming they checked",
      ],
      correctIndex: 1,
      explanation:
        "The speed target rewards accepting suggestions unchecked. Changing the goal so accuracy counts alongside volume acts on the incentive; reminders and forms leave it in place.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question:
        "Each time the target 'all high tier uses have a current assessment' is missed, it is lowered. What is happening and what should be done?",
      options: [
        "Normal improvement; keep adjusting to realistic levels",
        "Eroding goals; hold the target and fix why it is missed",
        "A reinforcing growth loop; add more high tier uses",
        "A delay problem; review the target less often",
      ],
      correctIndex: 1,
      explanation:
        "Lowering the target whenever it is missed lets performance drift down. Corrective action should address the cause, such as owner capacity or review triggers, not move the goal.",
    },
    // Coverage addition: Lesson 5.5 (data governance for AI).
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "A regulator asks which data trained version 2 of a hiring model. The team has a data record for each dataset but no link to model versions. What is missing?",
      options: [
        "Lineage from dataset versions to model versions",
        "Provenance showing who first collected the data",
        "A licence for the hiring model's base weights",
        "A bias test repeated on the newest model only",
      ],
      correctIndex: 0,
      explanation:
        "Data records describe each dataset's origin, which is provenance. Linking dataset versions to the model versions they trained is lineage, and that is what the question needs.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "A team wants a support assistant to answer from customer account history, and expects frequent deletion requests. Which design best fits its data protection duties?",
      options: [
        "Retrieve account data at query time instead of training on it",
        "Fine-tune the model weekly on all of the account history",
        "Keep every prompt and output indefinitely for audit use",
        "Use synthetic copies of the accounts so no review is needed",
      ],
      correctIndex: 0,
      explanation:
        "Data in model weights is very hard to remove, while retrieved records can be deleted at source. Indefinite retention and unreviewed synthetic data create new risks rather than meeting the duty.",
    },
  ],
};

export const GOV_CAPSTONE: SeedCapstone = {
  passThreshold: 70,
  briefMd: `## Your capstone: an AI governance pack for a real organisation

This is the work the certificate stands for. You will produce an AI governance pack for your own organisation, or for a realistic one you know well, of the kind a governance lead could take to a leadership team and start using the next week. A named reviewer will read it as a senior colleague in risk or compliance would: looking for sound judgement, proportionate controls, honest claims and a programme that would work with real people.

### Choose the organisation

Pick an organisation where AI is already used or about to be: a company, a public body, a charity, a school or college, a clinic, a firm of any size. If details are confidential, anonymise them, but keep the structure real. Do not invent statistics or present estimates as measurements; label every figure as measured, estimated or illustrative. Describe regulation by its structure and say where dates and specific duties must be confirmed against official sources or with legal advice. This is a governance pack, not legal advice.

### What to submit

One document of roughly 3,000 to 5,000 words (a PDF or a shared document link), with tables where they help. Include these sections:

1. **Inventory and risk register.** At least eight AI uses (real or realistic), each with owner by role, data, decision type, who is affected, applicable law and sector rules in general terms, risk tier with reasons, and status. Show how you found them.
2. **AI policy and acceptable use policy.** A short AI policy (ownership, classification, approval, principles as checkable commitments, incident handling) and a one-page acceptable use policy with traffic-light data rules and a request route. No overclaimed compliance.
3. **One full impact assessment.** For your highest-risk use: description, necessity and lawful basis, affected people, specific risks with likelihood and severity, measures linked one to one, consultation, residual risk and sign-off, review triggers. Include a human oversight design and a fairness testing plan.
4. **Vendor checklist.** A due diligence questionnaire and contract checklist scaled to tier, applied to one real or illustrative vendor, with the gaps you found and what you would ask for.
5. **Incident plan.** A playbook for AI incidents, with severity levels, containment including who can pause each high tier system, a notification table that names who confirms legal duties, and a blameless review template. Include a tabletop scenario.
6. **Reporting metrics.** Eight to twelve paired metrics across coverage, timeliness, assurance, outcomes and capability, and a one-page leadership report outline.
7. **System map.** A map of your organisation's AI governance as a system: at least one reinforcing and one balancing loop written as variables with link directions, the main delays, the incentives acting on people (including at least one that pushes against good governance), and the leverage point you will act on, with its level named.

### What good looks like

A strong pack reads as one connected programme, not seven separate documents. The system map explains why the policy is designed the way it is; the register drives which impact assessment you chose; the incident plan and metrics are the sensors for the loops you drew; the vendor checklist reflects the tiers in your register. It is proportionate: light where risk is low, rigorous where people could be harmed. It names owners and decision rights, is honest about what is not yet in place, and claims no more compliance than it can show. A reviewer should finish it knowing what would happen on day one, what would happen when something goes wrong, and how the programme would get better each quarter.`,
  rubric: [
    {
      criterion: "Inventory, classification and ownership",
      weight: 15,
      description:
        "A register of at least eight uses with the fields governance needs; consistent tiers with reasons that do not average away serious factors; one accountable owner by role in the business for each use; and a credible account of how uses were found.",
    },
    {
      criterion: "Policy and regulatory understanding",
      weight: 15,
      description:
        "A short AI policy and acceptable use policy with checkable commitments, proportionate data rules and a fast request route; regulation and data protection described accurately by structure, with roles identified, dates left to official sources and no overclaimed compliance.",
    },
    {
      criterion: "Impact assessment and oversight",
      weight: 25,
      description:
        "A specific, combined impact assessment for the highest-risk use: necessity and lawful basis, named groups and mechanisms, likelihood and severity, measures linked one to one, real human oversight (competence, information, time, authority, ability to stop), a fairness testing plan with thresholds set in advance, consultation and honest residual risk.",
    },
    {
      criterion: "Vendor, incident and operational controls",
      weight: 15,
      description:
        "A tiered vendor checklist applied to a real or illustrative vendor with gaps identified; contract checks on data use, training, change and incident notice, liability, information rights and exit; and a rehearsable incident playbook with containment first, named pause holders and notifications that defer legal duties to the right people.",
    },
    {
      criterion: "Systems view",
      weight: 20,
      description:
        "A correct system map with at least one reinforcing and one balancing loop (variables that can rise or fall, link directions marked), delays and incentives including one that works against governance; a leverage point chosen and named by level; and the map visibly shaping the policy, controls and metrics elsewhere in the pack.",
    },
    {
      criterion: "Metrics, reporting and programme realism",
      weight: 10,
      description:
        "Paired metrics that resist Goodhart's law across coverage, timeliness, assurance, outcomes and capability; a short, honest leadership report; and a programme sized to the organisation's real resources with clear decision rights.",
    },
  ],
};
