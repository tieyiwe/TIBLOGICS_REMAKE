import type { SeedModule } from "../types";

// AI Governance, Risk and Compliance. Module 2: The Regulatory Landscape.
// Law and standards are described by structure only, dated October 2026.
// No application dates, fines or enforcement figures are stated as settled;
// learners are told to check official timetables and current guidance.

export const GOV_MODULE_2: SeedModule[] = [{
  title: "The Regulatory Landscape",
  summary:
    "Understand risk-based AI regulation through the EU AI Act's structure, how data protection law applies to AI, the main international frameworks and standards (NIST AI RMF, ISO/IEC 42001, ISO/IEC 23894, OECD principles), sector rules, and how to keep track of change without drowning in it.",
  lessons: [
    // ── 2.1 ─────────────────────────────────────────────────────────────
    {
      title: "Risk-based regulation: how the EU AI Act is built",
      objective:
        "Explain the risk-based structure of the EU AI Act and place an AI use case in the right tier with the role your organisation plays.",
      durationMinutes: 26,
      contentType: "article",
      bodyMd: `## Why risk-based

A law that treated every AI system the same would either smother harmless uses or wave through dangerous ones. Most AI regulation therefore takes a **risk-based approach**: the heavier the potential harm, the heavier the obligations. The European Union's AI Act, adopted in 2024, is the most developed example and a useful model even if you do not operate in the EU. It can also reach organisations outside the EU, for example when they place AI systems on the EU market or when the output of a system is used in the EU.

A note on dates: the Act's obligations apply in **phases**, and the timetable can be adjusted by later EU decisions. At the time of writing (October 2026), check the official EU sources for which obligations apply now and which are still to come. This lesson describes the structure, which is far more stable than the dates.

This lesson is general education, not legal advice. For a specific system, take advice from someone qualified in the relevant law.

## The tiers

Think of the Act as four layers.

**1. Prohibited practices.** A short list of uses considered unacceptable, with narrow exceptions in some cases. They include AI that manipulates people or exploits their vulnerabilities in ways that cause significant harm, social scoring that leads to unjustified detrimental treatment, and certain uses of biometric systems, such as some forms of real-time remote biometric identification in public spaces for law enforcement. If a proposed use is anywhere near this list, stop and get legal advice.

**2. High-risk systems.** The core of the Act. A system is high-risk in two main ways: it is a safety component of a product already covered by EU product safety law (for example certain medical devices or machinery), or it is used in listed sensitive areas. Those areas include biometrics, critical infrastructure, education and vocational training, **employment and worker management** (such as CV screening or promotion decisions), **access to essential services** (such as credit scoring or eligibility for public benefits), law enforcement, migration and border control, and the administration of justice. There are some carve-outs, for example where a system only performs a narrow procedural task, so the classification needs care.

**3. Transparency obligations.** Some systems carry specific duties to tell people what is going on: people should know when they are interacting with an AI system unless it is obvious, deepfakes should be disclosed, and AI-generated content should be marked in certain ways.

**4. General-purpose AI models.** Providers of models that can be used for many tasks (such as the large language models behind popular assistants) have obligations around technical documentation, information for the organisations building on them, copyright policy and a summary of training content. Models judged to pose systemic risk carry further duties, such as evaluation and incident reporting.

Everything else, which is most everyday AI use, carries few specific obligations under the Act, although other laws (data protection, equality, consumer protection) still apply in full.

## Your role matters as much as the tier

The Act gives different obligations to different roles. The two that matter most for most organisations:

- **Provider**: develops an AI system, or has one developed, and places it on the market or puts it into service under its own name. Providers of high-risk systems carry the heaviest duties: a risk management system, data governance, technical documentation, logging, instructions for use, human oversight design, accuracy and security, and a conformity assessment before the system is placed on the market.
- **Deployer**: uses an AI system under its authority in a professional context. Deployers of high-risk systems must use them in line with the instructions for use, assign human oversight to competent people, monitor operation, keep the logs they control, and inform people in certain situations (for example workers affected by workplace AI). Some deployers, such as public bodies and certain providers of credit or insurance, must also carry out an assessment of the impact on fundamental rights.

Most organisations reading this are deployers. But be careful: if you substantially modify a high-risk system or put your own name on it, you can become a provider.

## A worked classification

Imagine a recruitment agency that buys a tool which ranks applicants for its clients' vacancies.

- **Tier**: employment is a listed area, and ranking applicants goes beyond a narrow procedural task, so this is very likely high-risk.
- **Role**: the agency is a deployer. The vendor is the provider.
- **What follows**: the agency must use the tool as instructed, assign trained people to oversee rankings with real authority to depart from them, keep logs, monitor for problems, and tell affected people what they are entitled to know. It should also ask the vendor for evidence of the provider's obligations (Module 5).

## Try it now

Pick two AI uses: one in your organisation and one illustrative high-impact use. Use the practice pad to test your classification, then check the reasoning yourself against the structure above.

\`\`\`try
Using only the general structure of the EU AI Act (prohibited practices, high-risk systems in listed areas or as product safety components, transparency obligations, general-purpose AI models), help me classify this use: [DESCRIBE THE USE IN TWO SENTENCES].

Say which tier it most likely falls into and why, whether my organisation is more likely a provider or a deployer, and what facts would change the answer. Do not state application dates; tell me to check the official timetable. Flag anything where I need legal advice.
\`\`\`

You are done when each use has a tier, a role and one fact that would change the answer.`,
      microCheck: [
        {
          question:
            "A UK company with no EU office sells an AI tool used by employers in France. Can the EU AI Act be relevant to it?",
          options: [
            "No, the Act only covers companies registered inside the EU",
            "Yes, it can reach providers placing systems on the EU market",
            "No, the Act covers public bodies but not private companies",
            "Yes, but only once the company opens an office in the EU",
          ],
          correctIndex: 1,
          explanation:
            "The Act can apply to organisations outside the EU when they place AI systems on the EU market or their output is used in the EU. Registration or an office there is not the test.",
        },
        {
          question: "Which use is most likely to be high-risk under the EU AI Act's structure?",
          options: [
            "A tool that suggests subject lines for marketing emails",
            "A tool that ranks job applicants for a shortlist",
            "A spam filter on a company's shared email inbox",
            "A translation tool used for internal meeting notes",
          ],
          correctIndex: 1,
          explanation:
            "Employment, including recruitment and selection, is one of the listed sensitive areas. The other uses are not in listed areas and do not make decisions about people's opportunities.",
        },
        {
          question: "How should you treat the EU AI Act's application dates when advising your organisation?",
          options: [
            "As fixed in law and safe to quote from any summary online",
            "As phased and subject to change, so check the official timetable",
            "As irrelevant, since every obligation already applies in full now",
            "As advisory only, since phased laws are not legally binding",
          ],
          correctIndex: 1,
          explanation:
            "Obligations apply in phases and the timetable can be adjusted by later decisions. Always check the current official sources rather than relying on a summary or an AI assistant's memory.",
        },
        {
          question:
            "A bank buys a credit scoring system and uses it as instructed. Under the Act's roles, what is the bank most likely?",
          options: [
            "A provider, because it pays for and runs the scoring system",
            "A deployer, because it uses the system under its own authority",
            "A distributor, because it passes the scores on to its customers",
            "Neither role, because banks are covered by separate rules only",
          ],
          correctIndex: 1,
          explanation:
            "Using an AI system under your authority in a professional context makes you a deployer. The vendor that develops and markets it is the provider. Heavy modification could change that.",
        },
        {
          question: "What do transparency obligations under the Act mainly require?",
          options: [
            "That every AI system publishes its full source code openly",
            "That people know when they deal with AI or AI-made content",
            "That organisations list every AI tool on their public website",
            "That vendors share training data with all of their customers",
          ],
          correctIndex: 1,
          explanation:
            "The transparency layer is about telling people when they are interacting with AI, when content is a deepfake, and marking AI-generated content. It does not require publishing code or data.",
        },
      ],
    },

    // ── 2.2 ─────────────────────────────────────────────────────────────
    {
      title: "Data protection law and AI",
      objective:
        "Apply the core principles of data protection law to an AI use, including lawful basis, minimisation, automated decision-making and the roles of controller and processor.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## AI is processing, and the law already applies

Whenever an AI system handles information about an identifiable person, data protection law applies. There is no AI exemption. In the EU and the UK the main law is the **General Data Protection Regulation (GDPR)**, kept in UK law as the UK GDPR alongside the Data Protection Act 2018. Many other countries have their own laws built on similar ideas, including South Africa's Protection of Personal Information Act, Kenya's Data Protection Act and Nigeria's Data Protection Act, as well as laws in Brazil, parts of Asia and several US states. The details differ, so check the law where you and the people whose data you use are based. This lesson uses GDPR as the worked example because its ideas travel well.

This is general education, not legal advice. Your data protection officer or adviser is your first stop.

## The principles, applied to AI

GDPR rests on a handful of principles. Each has a specific bite for AI.

- **Lawfulness, fairness and transparency.** You need a **lawful basis** for each purpose (the six are consent, contract, legal obligation, vital interests, public task and legitimate interests). People must be told, in plain language, that AI is used and how. Sensitive data, such as health or ethnicity, needs an additional condition.
- **Purpose limitation.** Data collected to deliver a service cannot simply be reused to train a model without checking that the new purpose is compatible or has its own basis.
- **Data minimisation.** Send the AI only what the task needs. Pasting a full case file when the task needs three facts is a minimisation failure.
- **Accuracy.** Generative AI can invent facts about real people. If those outputs are stored or acted on, the accuracy principle is engaged.
- **Storage limitation.** Prompts, outputs and logs are data too. Decide how long they are kept.
- **Security.** Appropriate technical and organisational measures, which for AI include access controls on connected data and checks on the vendor.
- **Accountability.** You must be able to show compliance, not just achieve it. Records, assessments and decisions matter.

## Automated decisions

GDPR gives people specific protection against decisions made **solely by automated means** that have legal or similarly significant effects on them, such as refusing credit or rejecting a job application with no meaningful human involvement. Such decisions are restricted, and where they are allowed, safeguards apply: the right to obtain human intervention, to express a point of view and to contest the decision. The UK has since amended its rules in this area, so check current regulator guidance for the UK position.

"Meaningful human involvement" is the key phrase. A person who rubber-stamps every AI recommendation without the information, time or authority to disagree does not turn an automated decision into a human one. This links directly to human oversight design in Module 4.

## Controllers, processors and vendors

The **controller** decides why and how personal data is processed. A **processor** processes it on the controller's behalf. When you use an AI vendor, you are usually the controller and the vendor is your processor, which requires a written contract with specific terms. But if the vendor uses your data for its own purposes, such as training its models, it may be acting as a controller for that use, and you need to know. This is one of the most important questions in vendor due diligence (Module 5).

International transfers matter too: if the vendor processes data in another country, transfer rules may apply.

## Data protection impact assessments

GDPR requires a **data protection impact assessment (DPIA)** before processing that is likely to result in a high risk to people. Regulators commonly treat innovative technology, large-scale profiling and automated decisions as signs that a DPIA is needed, so many AI uses involving personal data will need one. You will write one in Module 3.

## A quick self-check

\`\`\`try
I want to use AI for this task: [DESCRIBE IT, WITHOUT REAL PERSONAL DATA].

Walk me through a GDPR-style check: what personal data is involved, a likely lawful basis and why, whether any sensitive data is involved, how to minimise what goes to the AI, whether the vendor is a processor or might act as a controller, whether this could be a solely automated decision with significant effects, and whether a DPIA is likely needed. Flag where I need my data protection officer.
\`\`\`

## Try it now

Take one AI use in your organisation that involves personal data. Write down: the lawful basis, one minimisation step you could take today, what the vendor does with the data, and whether a DPIA has been done.

You are done when you have either found the existing DPIA or written one sentence explaining to your data protection lead why you think one is or is not needed.`,
      microCheck: [
        {
          question:
            "A team wants to reuse customer service transcripts to fine-tune a model. Which principle should they check first?",
          options: [
            "Storage limitation, because transcripts are kept for too long",
            "Purpose limitation, because training is a new use of the data",
            "Accuracy, because the transcripts may contain spelling mistakes",
            "Security, because transcripts are stored in the cloud already",
          ],
          correctIndex: 1,
          explanation:
            "Data collected to deliver a service cannot simply be reused for model training. The new purpose must be compatible or have its own lawful basis, and people may need to be told.",
        },
        {
          question:
            "A loan officer approves or rejects every AI recommendation in seconds with no extra information. What is the data protection concern?",
          options: [
            "The decisions may in effect be solely automated decisions",
            "The loan officer is processing too little personal data",
            "The AI system is acting as a data controller in its own right",
            "The officer needs consent before reading any application",
          ],
          correctIndex: 0,
          explanation:
            "Human involvement must be meaningful. A person who rubber-stamps every recommendation without information, time or authority to disagree does not turn an automated decision into a human one.",
        },
        {
          question:
            "Your AI vendor's terms say it may use your customer data to improve its models. What does this suggest?",
          options: [
            "Nothing, because vendors are always processors under the law",
            "The vendor may act as a controller for that use of the data",
            "Your organisation stops being a controller for that customer data",
            "The data is no longer personal once it is used for training",
          ],
          correctIndex: 1,
          explanation:
            "Using data for its own purposes, such as training, can make a vendor a controller for that processing. You need to know this, justify it and tell people, or switch it off.",
        },
        {
          question: "Which is the best example of data minimisation in AI use?",
          options: [
            "Pasting the whole case file so the AI has full context",
            "Sending only the three facts the summary actually needs",
            "Deleting the AI tool's chat history once each year",
            "Encrypting the case file before it is stored on the drive",
          ],
          correctIndex: 1,
          explanation:
            "Minimisation means using only the data the task needs. Deletion schedules relate to storage limitation and encryption to security; both matter, but neither reduces what was sent.",
        },
      ],
    },

    // ── 2.3 ─────────────────────────────────────────────────────────────
    {
      title: "Frameworks and standards: NIST, ISO and the OECD",
      objective:
        "Compare the NIST AI Risk Management Framework, ISO/IEC 42001, ISO/IEC 23894 and the OECD AI Principles, and choose which to use for a given organisational need.",
      durationMinutes: 25,
      contentType: "article",
      bodyMd: `## Laws tell you what, frameworks help with how

Regulation sets obligations. It rarely tells you how to organise yourself to meet them. Voluntary frameworks and international standards fill that gap. They are also useful where no AI-specific law applies yet, because they give you a recognised structure to point to when a board, customer or regulator asks how you manage AI risk.

Four are worth knowing. This lesson describes them in general terms; the standards themselves are published documents (ISO standards are purchased from ISO or a national standards body), and you should read the source before claiming alignment.

## The NIST AI Risk Management Framework

The **NIST AI RMF** was published by the US National Institute of Standards and Technology. It is **voluntary**, free to use, and not limited to the US. It is organised around four functions:

- **Govern**: the culture, policies, roles and accountability that make risk management happen. It is cross-cutting and supports the other three.
- **Map**: understand the context: what the system is for, who it affects, what could go wrong.
- **Measure**: assess, analyse and track the risks identified, using tests, metrics and review.
- **Manage**: prioritise and act on the risks: treat, accept, transfer or avoid them, and respond to incidents.

It also describes characteristics of trustworthy AI, such as being valid and reliable, safe, secure and resilient, accountable and transparent, explainable, privacy-enhanced, and fair with harmful bias managed. NIST has published companion material, including a profile for generative AI. The framework is a good thinking tool for a risk team and maps well onto the modules of this track.

## ISO/IEC 42001: an AI management system

**ISO/IEC 42001** specifies requirements for an **AI management system**: the organisation-wide set of policies, objectives, processes and reviews used to govern AI. It follows the same high-level structure as other ISO management system standards, such as ISO/IEC 27001 for information security, so organisations that already run one will recognise the shape: context, leadership, planning, support, operation, performance evaluation and improvement, with a set of reference controls.

Two things make it distinctive. It is **certifiable**: an accredited body can audit you against it. And it is about the **organisation**, not a single model. Certification says your management system meets the standard; it does not certify that any particular AI system is safe or legal. Be wary of vendors who blur that line.

## ISO/IEC 23894: guidance on AI risk management

**ISO/IEC 23894** gives **guidance** (not certifiable requirements) on managing risk specific to AI. It builds on the general risk management standard ISO 31000 and adapts its process (establish context, identify, analyse, evaluate and treat risk, then monitor and review) to AI-specific sources of risk. It pairs naturally with 42001: 42001 says you need an AI risk process; 23894 helps you design it.

## The OECD AI Principles

The **OECD AI Principles**, first adopted in 2019 and updated since, are intergovernmental principles that many countries have signed up to. They cover inclusive growth and well-being, respect for human rights and democratic values including fairness and privacy, transparency and explainability, robustness, security and safety, and accountability, plus recommendations to governments. They are not a management tool, but they shape national policies and are a useful common language when working across borders.

## Choosing between them

| Need | Best starting point |
|---|---|
| A shared vocabulary for values with partners in several countries | OECD AI Principles |
| A practical way for a risk team to structure AI risk work | NIST AI RMF |
| Designing the AI risk process itself | ISO/IEC 23894 |
| External, certifiable assurance of how the organisation governs AI | ISO/IEC 42001 |

They are complementary, not rivals. Many organisations use NIST's functions to organise the work and 42001 as the management system that holds it together.

## Try it now

\`\`\`try
I work in [ROLE] at [TYPE OF ORGANISATION]. Our current AI governance consists of: [ONE OR TWO SENTENCES].

In general terms, compare how the NIST AI RMF (Govern, Map, Measure, Manage), ISO/IEC 42001 (AI management system) and ISO/IEC 23894 (AI risk management guidance) could help us. Recommend one to start with and why. Do not quote the standards' text; describe them in your own words and tell me where I should read the source.
\`\`\`

You are done when you can say, in two sentences to a colleague, which framework you would start with and what the first concrete step would be.`,
      microCheck: [
        {
          question:
            "A supplier says its chatbot is 'ISO/IEC 42001 certified, so it is safe and legal'. What is wrong with this claim?",
          options: [
            "ISO/IEC 42001 is a US law rather than an international standard",
            "Certification covers a management system, not a specific product",
            "ISO/IEC 42001 can only be applied by public sector organisations",
            "ISO/IEC 42001 certification is only ever granted to model makers",
          ],
          correctIndex: 1,
          explanation:
            "ISO/IEC 42001 certifies an organisation's AI management system. It does not certify that a particular AI system is safe or lawful, so the claim overstates what certification means.",
        },
        {
          question: "Which NIST AI RMF function covers culture, policies, roles and accountability?",
          options: [
            "Map, which sets out the context for each AI system",
            "Govern, which runs across and supports the other three",
            "Measure, which tracks risks with tests and metrics",
            "Manage, which treats the risks and handles incidents",
          ],
          correctIndex: 1,
          explanation:
            "Govern is the cross-cutting function: it establishes the culture, policies and accountability that make Map, Measure and Manage happen in practice.",
        },
        {
          question: "How does ISO/IEC 23894 relate to ISO/IEC 42001?",
          options: [
            "23894 replaced 42001 and is now the only AI standard in use",
            "23894 guides the AI risk process that 42001 says you need",
            "23894 is a certification scheme and 42001 is only guidance",
            "23894 covers AI models while 42001 covers training data only",
          ],
          correctIndex: 1,
          explanation:
            "ISO/IEC 42001 sets requirements for an AI management system, including a risk process. ISO/IEC 23894 is guidance on AI risk management that helps you design that process.",
        },
        {
          question: "An organisation with no AI-specific law in its country asks why it should use a framework. What is the best reason?",
          options: [
            "Frameworks are legally binding in every country that has signed",
            "They give a recognised structure to show how AI risk is managed",
            "They replace the need to comply with data protection law",
            "They guarantee that no AI incident will occur once adopted",
          ],
          correctIndex: 1,
          explanation:
            "Voluntary frameworks give a credible, recognised structure for managing AI risk and explaining it to boards, customers and regulators. They do not override other law or guarantee outcomes.",
        },
      ],
    },

    // ── 2.4 ─────────────────────────────────────────────────────────────
    {
      title: "Sector rules and keeping track of change",
      objective:
        "Identify the existing sector rules that apply to an AI use and set up a lightweight regulatory watch that keeps your organisation current.",
      durationMinutes: 24,
      contentType: "article",
      bodyMd: `## Old laws, new tools

Much of the law that governs AI was written before generative AI existed, and still applies. A discriminatory hiring decision is unlawful whether a manager or a model made it. A misleading advertising claim is misleading whether a copywriter or an assistant wrote it. The first question for any AI use is not "what does the AI law say?" but "what rules already govern this activity?".

## Sector rules in general terms

Every sector has its own layer. Some common patterns:

- **Financial services.** Supervisors have long expected banks and insurers to manage **model risk**: to validate models, document them, monitor them and keep humans accountable for them. Consumer credit rules often require that people can understand why they were refused. Treating customers fairly rules apply to AI-driven decisions as much as to any other.
- **Health and care.** Software that diagnoses, predicts or recommends treatment can be regulated as a medical device. Clinical safety, patient confidentiality and professional duties of clinicians all apply.
- **Employment.** Equality and anti-discrimination law applies to hiring, promotion and performance management. Some places add specific rules: for example New York City requires bias audits for certain automated employment decision tools. Workers and their representatives may have rights to be informed or consulted about monitoring and new technology.
- **Public sector.** Public bodies usually have duties to act lawfully, rationally and fairly, to give reasons for decisions and, in many countries, to consider equality impacts. Some governments also expect public bodies to publish information about the algorithmic tools they use.
- **Consumer protection and advertising.** Claims about what your product's AI does must be true and substantiated. Regulators in several countries have acted against exaggerated AI claims.
- **Intellectual property.** Copyright questions arise both in what models were trained on and in who owns the output. These are unsettled in many places; take advice for anything commercial.

Your legal and compliance colleagues will know your sector's rules. Your job is to make sure AI uses are routed to them, which is why the register (Module 3) records the sector and the decision type for each use.

## Why change is hard to track

AI regulation is moving on several fronts at once: new laws, amendments to their timetables, guidance from regulators, standards and court decisions. Different countries move at different speeds. Some, at the time of writing (October 2026), rely mainly on existing regulators applying broad principles; others have passed AI-specific laws. Several African countries have national AI strategies or policies, and data protection authorities across the continent are increasingly active. What was true six months ago may not be true now.

Two traps to avoid:

- **Asking an AI assistant for the current law.** Models have a knowledge cutoff and can confidently state out-of-date or invented details. Use AI to summarise an official document you provide, not to tell you what the law is.
- **Relying on vendor or consultant summaries alone.** They are useful starting points but may be simplified or selective. Go to the official source for anything you act on.

## A lightweight regulatory watch

You do not need a large team. You need a routine.

1. **A regulatory register**: a simple table with law or guidance, jurisdiction, what it covers, status (proposed, adopted, in force, phased), which AI uses it touches, owner, and next review date.
2. **Trusted sources**: the official journal or legislation site for each jurisdiction you operate in, your data protection authority, your sector regulators, and the standards bodies.
3. **A rhythm**: a named person checks sources monthly and records changes; the register is reviewed quarterly by the governance group; anything material goes to the affected owners.
4. **A trigger**: any new AI use in a new country or sector prompts a check, rather than waiting for the quarterly review.

## Summarise a source, do not ask for the law

\`\`\`try
Below is the text of an official guidance page I copied from a regulator's website. Summarise, for a non-lawyer manager: what it covers, who it applies to, what it asks organisations to do, and any dates it states (quote them exactly and tell me to confirm them). Do not add anything that is not in the text.

<source>
[PASTE THE TEXT OF AN OFFICIAL PAGE]
</source>
\`\`\`

## Try it now

Start your regulatory register with five rows: one AI-specific law or proposal, one data protection law, one sector rule, one framework or standard, and one item of regulator guidance relevant to your organisation. For each, record the official source and a next review date.

You are done when every row has an official source link (not a blog or vendor page) and a named owner.`,
      microCheck: [
        {
          question:
            "A firm says its AI hiring tool is fine because 'there is no AI law in our country yet'. What is the flaw?",
          options: [
            "AI laws already exist in every single country in the world",
            "Equality law still applies to hiring decisions made with AI",
            "Hiring tools are exempt from every law in most countries",
            "The vendor carries all legal responsibility for the tool",
          ],
          correctIndex: 1,
          explanation:
            "Existing law applies regardless of the tool. Discriminatory hiring is unlawful whether a person or a model made the decision, so the absence of an AI-specific law is not a defence.",
        },
        {
          question: "Why should you not ask an AI assistant what the current AI regulation says?",
          options: [
            "Assistants are banned from discussing any legal topics at all",
            "Its knowledge may be out of date or simply invented",
            "Regulations are too long for any assistant to read",
            "Assistants only know about laws in the United States",
          ],
          correctIndex: 1,
          explanation:
            "Models have a knowledge cutoff and can state outdated or fabricated details confidently. Use AI to summarise an official text you supply, and verify anything you act on against the source.",
        },
        {
          question: "Which is the best trigger for an out-of-cycle regulatory check?",
          options: [
            "A new quarter beginning on the governance calendar",
            "A new AI use in a country or sector you do not yet cover",
            "A vendor releasing a newer version of its marketing site",
            "A colleague sharing an opinion piece about AI regulation",
          ],
          correctIndex: 1,
          explanation:
            "A new country or sector brings new rules, so it should prompt a check straight away. Calendar reviews catch the rest; marketing updates and opinion pieces are not reliable signals.",
        },
        {
          question: "A bank's credit model is used by staff to approve loans. Which existing expectation applies most directly?",
          options: [
            "Medical device rules on clinical safety and patient records",
            "Model risk management: validate, document and monitor models",
            "Advertising rules on how products may be described in public",
            "Public sector duties to publish details of algorithmic tools",
          ],
          correctIndex: 1,
          explanation:
            "Financial supervisors have long expected model risk management for models used in decisions such as credit. The other rules belong to other sectors or activities.",
        },
      ],
    },
  ],
  quiz: [
    {
      question:
        "A health insurer uses AI to help set individual premiums. Which combination of rules is most likely to be relevant?",
      options: [
        "Only the EU AI Act, since it replaces other rules for AI",
        "AI regulation, data protection and insurance conduct rules",
        "Only the insurer's own internal acceptable use policy",
        "Only advertising rules, since premiums are shown to customers",
      ],
      correctIndex: 1,
      explanation:
        "AI-specific law, data protection (health data is sensitive) and sector rules all apply together. No single law replaces the others, and internal policy cannot override any of them.",
    },
    {
      question: "Which statement best describes a risk-based approach to AI regulation?",
      options: [
        "Every AI system carries the same obligations whatever its use",
        "Obligations grow with the potential harm of the system's use",
        "Only AI systems built by large companies are regulated at all",
        "Obligations depend mainly on how advanced the model is inside",
      ],
      correctIndex: 1,
      explanation:
        "Risk-based regulation scales obligations to the potential for harm, so high-impact uses carry more duties. Company size or model sophistication are not the main test.",
    },
    {
      question:
        "An organisation substantially modifies a vendor's high-risk AI system and sells it under its own brand. What may change?",
      options: [
        "Nothing, because it is still the vendor's underlying system",
        "It may take on the obligations of a provider for that system",
        "It becomes exempt because it has changed the original design",
        "It becomes a distributor with no obligations of its own",
      ],
      correctIndex: 1,
      explanation:
        "Substantial modification or putting your own name on a high-risk system can make you a provider, with the heavier duties that role carries. Changing a system never creates an exemption.",
    },
    {
      question: "Which of these is a general-purpose AI model in the EU AI Act's sense?",
      options: [
        "A spreadsheet macro that ranks invoices by their due date",
        "A large language model that can be used for many tasks",
        "A rule-based form that routes complaints to departments",
        "A fixed checklist used to triage incoming support tickets",
      ],
      correctIndex: 1,
      explanation:
        "General-purpose models are capable of a wide range of tasks and are built on by others, like the large language models behind popular assistants. Fixed rules and macros are not.",
    },
    {
      question:
        "A council wants to use AI to prioritise which benefit claims are checked for fraud. Which step should come first?",
      options: [
        "Buy the tool quickly before regulation becomes any stricter",
        "Check the tier, its role and run a DPIA before going further",
        "Ask an AI assistant which laws apply to councils this year",
        "Wait until every country has finished regulating AI use",
      ],
      correctIndex: 1,
      explanation:
        "Access to public benefits is a sensitive area, personal data is involved and the decisions can be significant. Classification and a DPIA come first; AI assistants are not a reliable source of current law.",
    },
    {
      question: "What are the four functions of the NIST AI Risk Management Framework?",
      options: [
        "Plan, Do, Check and Act",
        "Govern, Map, Measure and Manage",
        "Identify, Protect, Detect and Respond",
        "Assess, Approve, Audit and Archive",
      ],
      correctIndex: 1,
      explanation:
        "The NIST AI RMF is organised around Govern, Map, Measure and Manage, with Govern cross-cutting. Plan-Do-Check-Act is a general management cycle, and the third option echoes other security frameworks.",
    },
    {
      question:
        "Your board wants external, independent assurance of how the whole organisation governs AI. Which is the best fit?",
      options: [
        "The OECD AI Principles, adopted by many governments",
        "Certification against ISO/IEC 42001 by an accredited body",
        "The NIST AI RMF, used as an internal thinking tool",
        "A vendor's own statement that its tools are responsible",
      ],
      correctIndex: 1,
      explanation:
        "ISO/IEC 42001 is a certifiable management system standard, so an accredited body can audit you against it. The OECD principles and NIST AI RMF are not certification schemes, and vendor statements are not independent.",
    },
    {
      question:
        "A team pastes full HR case files into an assistant to get a three-line summary of the outcome. Which principle is weakest?",
      options: [
        "Accuracy, because the summary may contain small errors",
        "Data minimisation, because far more data is sent than needed",
        "Storage limitation, because case files are kept for years",
        "Purpose limitation, because HR files are used for HR work",
      ],
      correctIndex: 1,
      explanation:
        "Sending entire case files to produce a short summary uses far more personal data than the task needs. Minimisation would send only the relevant facts, ideally with identifiers removed.",
    },
    {
      question:
        "Your organisation operates in the EU, the UK and Kenya. How should it approach data protection for an AI tool?",
      options: [
        "Follow only GDPR, since it is the strictest law of the three",
        "Check each applicable law, since the details differ by country",
        "Follow Kenyan law only, since it was passed most recently",
        "Ignore local laws if the vendor is based in the United States",
      ],
      correctIndex: 1,
      explanation:
        "Data protection laws share many ideas but differ in detail, and each one can apply to the people whose data you process. Check every applicable law rather than assuming one covers the rest.",
    },
    {
      question: "Which source should a regulatory register rely on for each entry?",
      options: [
        "A popular newsletter summarising the week's AI news",
        "The official legislation site or the regulator's own page",
        "An AI assistant's answer about the current legal position",
        "A vendor's blog post explaining what the law requires",
      ],
      correctIndex: 1,
      explanation:
        "Official sources are the only ones safe to act on. Newsletters, vendors and AI assistants can be useful pointers but may be simplified, selective or out of date.",
    },
    {
      question:
        "A company tells customers its chatbot is a human adviser named 'Sam'. Which kind of obligation does this most clearly conflict with?",
      options: [
        "Obligations on general-purpose model providers to publish data",
        "Transparency duties to tell people they are dealing with AI",
        "Prohibitions on biometric identification in public spaces",
        "Requirements for conformity assessment of medical devices",
      ],
      correctIndex: 1,
      explanation:
        "Transparency obligations require that people know when they are interacting with an AI system unless it is obvious. Presenting a chatbot as a human does the opposite.",
    },
  ],
}];
