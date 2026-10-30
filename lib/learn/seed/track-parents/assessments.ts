import type { SeedCapstone, SeedFinalExam, SeedLab } from "../types";

// AI for Parents: Raising Confident, Safe Learners. Labs, final exam and
// capstone. Every assessment tests what Modules 1-6 teach, for parents and
// carers of children aged 5 to 17. The family AI audit from Module 1 is the
// thread: later labs and the capstone build on it. All children, families,
// schools and apps in scenarios are fictional and illustrative.

// ═══════════════════════════════════════════════════════════════════════════
// LABS (one per module)
// ═══════════════════════════════════════════════════════════════════════════

export const PARENTS_LABS: SeedLab[] = [
  // ── Module 1 ──────────────────────────────────────────────────────────
  {
    slug: "ai-for-parents-lab-1-family-ai-audit",
    title: "Run a family AI audit",
    labType: "workbench",
    moduleNumber: 1,
    estimatedMinutes: 30,
    points: 50,
    passScore: 70,
    briefMd: `Before you set any rules, find out where AI already is in your children's lives. Much of it is not labelled "AI": a homework helper, the voice assistant in the kitchen, a game character that chats back, a video feed that chooses what plays next, a chatbot inside a messaging app.

In this lab you carry out a **family AI audit**. You list the tools each child actually uses, compare each child's age with the tool's own terms, note what each tool is used for, and finish with one honest worry and one real opportunity.

You are assessed on how accurate and specific the audit is, not on whether your family uses a lot of AI or very little. "I don't know yet, I will check" is a better answer than a guess. This audit is the starting point for the later labs and the capstone, so make it real.`,
    scenarioMd: `Work through the four fields in order. If you can, do the audit with your child: ask them to show you the apps and games they use and where the AI features are. Children often know things adults miss.

If you have no children at home, or would rather not use your own family, use this illustrative family instead and say so: *imagine a household with a 7-year-old who uses a voice assistant and a reading app, and a 13-year-old who uses a chatbot for homework, a video app with a recommendation feed and a game with an AI chat character.*

To check age limits, look at each tool's terms of service or help pages for its minimum age and any rule about parental consent. These change, so write down what you found and the date you checked.`,
    objectives: [
      {
        id: "inventory",
        label: "Lists the real AI tools each child meets, including hidden ones",
        weight: 3,
        guidance:
          "Full credit for a list per child (with ages) that covers at least three kinds of AI contact, including at least one the child would not call AI (a recommendation feed, a voice assistant, AI features inside a game, search or messaging app). Part credit for listing only obvious chatbots. Low credit for a generic list not tied to named children.",
      },
      {
        id: "terms",
        label: "Compares each child's age with each tool's terms",
        weight: 3,
        guidance:
          "Full credit when each listed tool has its minimum age or consent rule as found in its terms (or an honest 'not found, will check by [date]'), and any mismatch with a child's age is explicitly flagged. Part credit for checking some tools only. None for stating age limits with no sign of having looked, or for ignoring a clear mismatch.",
      },
      {
        id: "uses",
        label: "Describes what each tool is actually used for, and how",
        weight: 2,
        guidance:
          "Full credit for specific uses (for example 'asks the chatbot to check maths answers after finishing', 'watches the feed for about an hour after school') and whether use is alone or with an adult, with a note on whether each use supports or replaces the child's own thinking. Part credit for vague uses such as 'for school' or 'fun'.",
      },
      {
        id: "worry-opportunity",
        label: "Names one grounded worry and one real opportunity",
        weight: 2,
        guidance:
          "Full credit for one specific worry linked to a tool and child in the audit (not a general fear about AI) and one specific learning opportunity with a first small step. Part credit if either is generic ('screen time is bad', 'AI is the future'). None if either is missing.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "inventory",
          label: "Who uses what",
          prompt:
            "For each child, give their age and list every tool or device they use that includes AI. Include the ones they would not call AI: voice assistants, recommendation feeds, game characters that chat, AI features in search, messaging or school apps.",
          placeholder:
            "e.g. Sam (7): kitchen voice assistant, reading app with a talking helper. Priya (13): chatbot for homework, video app feed, game with an AI chat character...",
          minWords: 50,
        },
        {
          id: "terms",
          label: "Ages against terms",
          prompt:
            "For each tool, write the minimum age or parental consent rule you found in its terms, the date you checked, and whether each child who uses it meets it. Flag every mismatch. Where you could not find the rule, say so and when you will check.",
          placeholder:
            "e.g. Homework chatbot: terms say minimum age 13 (checked 28 September). Priya is 13: meets it. Sam has used it on Priya's account: mismatch...",
          minWords: 50,
        },
        {
          id: "uses",
          label: "What each tool is used for",
          prompt:
            "For each tool, what does each child actually use it for, roughly how often, and alone or with an adult? For each use, note whether it supports their own thinking or does the thinking for them.",
          minWords: 60,
        },
        {
          id: "worry-opportunity",
          label: "One worry and one opportunity",
          prompt:
            "Name one specific worry from this audit (which child, which tool, what could go wrong) and one specific opportunity for learning, with the first small step you will take on each.",
          minWords: 50,
        },
      ],
    },
  },

  // ── Module 2 ──────────────────────────────────────────────────────────
  {
    slug: "ai-for-parents-lab-2-socratic-tutor-prompt",
    title: "Write a Socratic tutor prompt",
    labType: "prompt",
    moduleNumber: 2,
    estimatedMinutes: 25,
    points: 60,
    passScore: 70,
    briefMd: `Module 2 showed that the same AI tool can be an answer machine or a patient tutor, and that the difference is mostly in the instructions it is given. Here you write those instructions for your own child's real homework topic.

Pick a topic your child is working on now (fractions, the causes of a war, how to structure a paragraph, photosynthesis). Write a prompt that sets the AI up as a **Socratic tutor**: it guides with questions, pitches everything at your child's age, checks understanding at the end, and does not do the work for them, even when asked.

Run your prompt in the sandbox. The sandbox plays a typical AI homework app that follows your instructions as written. It will also show how it would reply when your child says "just tell me the answer". If your prompt is weak, the reply will give the answer away. Read what comes back and improve one thing at a time.`,
    scenarioMd: `**What to include in your prompt**

- Your child's age (and school year if you like) and the exact topic or question.
- How the tutor should behave: one question at a time, hints before explanations, never the full answer.
- How it should talk: words, length and examples suited to your child's age.
- A check for understanding at the end, such as asking your child to explain it back in their own words.
- What it must do when your child pushes for the answer.

Do not include your child's full name, school or any other identifying details. A first name or "my child" is enough.

**The starter prompt a busy parent wrote**

> help my kid with their homework on fractions`,
    objectives: [
      {
        id: "questions",
        label: "Asks questions rather than giving answers",
        weight: 3,
        guidance:
          "Full credit when the prompt tells the tutor to guide with one question at a time, give hints before explanations and never give the final answer or finished work, and the sandbox reply opens with a question rather than a solution. Part credit for 'don't just give the answer' with no method. None if the reply solves the problem.",
      },
      {
        id: "age",
        label: "Pitched to the child's age",
        weight: 2,
        guidance:
          "Full credit when the prompt states the child's age and asks for vocabulary, sentence length and examples suited to it (for example everyday comparisons for a younger child), and the sandbox reply reads at that level. Part credit for stating the age with no instruction on how to pitch. None if age is absent.",
      },
      {
        id: "check",
        label: "Includes a check for understanding",
        weight: 2,
        guidance:
          "Full credit for an explicit end-of-session check that makes the child do the thinking, such as explaining back in their own words, solving a fresh similar question or spotting a mistake. Part credit for 'ask if they understood', which a child can answer yes to without understanding.",
      },
      {
        id: "boundaries",
        label: "Sets boundaries so the work stays the child's",
        weight: 3,
        guidance:
          "Full credit when the prompt says what to do if the child asks for the answer (acknowledge, offer a smaller hint, never write the work), keeps the tutor on the homework topic, and avoids sharing identifying details. The simulated 'just tell me' exchange must not give the answer. Part credit for a boundary that the sandbox reply then breaks.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "help my kid with their homework on fractions",
      sandboxSystem:
        "You are a typical AI homework-help app for school-age children, running in a training sandbox for parents. The parent's message is the set-up instruction your app receives before their child starts a session. Follow it exactly as written and do not add good practice the parent did not ask for: if the instruction does not forbid giving answers, give the full worked answer as many homework apps do; if it gives no age, write for an adult; if it asks for no check for understanding, do not add one. Reply in two parts. Part 1, headed 'Opening', is your first message to the child. Part 2, headed 'When the child says: just tell me the answer', is how you would reply to that request under the parent's instructions. Keep the whole reply under 250 words. The child and family are fictional; never ask for personal details.",
    },
  },

  // ── Module 3 ──────────────────────────────────────────────────────────
  {
    slug: "ai-for-parents-lab-3-in-story-learning-story",
    title: "Create an In-Story learning story",
    labType: "prompt",
    moduleNumber: 3,
    estimatedMinutes: 30,
    points: 60,
    passScore: 70,
    briefMd: `In the In-Story approach, your child learns a concept inside a personalised story built on what they love, and the concept **drives the plot**: the hero cannot get out of trouble without it. A short practice moment at the end lets your child use the idea for themselves.

Write a prompt that produces one such story for your own child. It must include your child's age, their real interests, **one** concept (not three), a plot in which that concept is the key to the ending, and a practice moment. Plan how you will check the facts in the story before your child reads it.

Run your prompt in the sandbox, which writes the story exactly as your prompt asks. Then improve it. Stories are graded on the prompt and on what it produces: a lovely story with the concept tacked on at the end does not meet the brief.`,
    scenarioMd: `**A pattern that works**

1. Who the story is for: age, reading level, two or three interests, a first name or nickname only.
2. The one concept, stated precisely (for example "a quarter is one of four equal parts", not "fractions").
3. How the concept drives the plot: the problem the hero faces that can only be solved by using it.
4. Length and tone: how long, how scary or silly, read aloud or alone.
5. The practice moment: one or two questions or a small task at the end that uses the concept in a new situation.
6. Your fact check: ask for the factual claims to be listed separately so you can check them, and say where you will check them.

Co-create if you can: ask your child to choose the hero, the setting or a twist before you write the prompt.

**The starter prompt**

> write a story for my daughter about space that teaches her something`,
    objectives: [
      {
        id: "personal",
        label: "Personalised to the child's age and interests",
        weight: 2,
        guidance:
          "Full credit when the prompt gives the child's age or reading level and at least two specific interests, and the story uses them meaningfully (setting, hero, problem). Part credit for age or interests alone, or interests used only as decoration. No credit if identifying details such as full name or school are included.",
      },
      {
        id: "concept",
        label: "The concept is accurate and central to the plot",
        weight: 3,
        guidance:
          "Full credit when the prompt names ONE precisely stated concept and requires that the story's problem can only be solved by using it, and the generated story does this with the concept explained correctly. Part credit if the concept appears but is not needed to resolve the plot, or is stated vaguely. None if several concepts are packed in or the concept is wrong.",
      },
      {
        id: "practice",
        label: "Ends with a practice moment",
        weight: 2,
        guidance:
          "Full credit for an explicit instruction for a short practice moment after the story in which the child applies the concept to a new situation (not just recalls the story), pitched to their age. Part credit for comprehension questions about the plot only.",
      },
      {
        id: "factcheck",
        label: "The parent planned how to check facts",
        weight: 2,
        guidance:
          "Full credit when the prompt asks for the story's factual claims to be listed separately (or marked) AND the parent states how and where they will check them (a textbook, the school's materials, a reputable reference site) before the child reads it. Part credit for 'make sure it is accurate' alone, which cannot be checked. None if fact checking is absent.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "write a story for my daughter about space that teaches her something",
      sandboxSystem:
        "You are a children's story generator in a training sandbox for parents. Write exactly the story the parent's prompt asks for and nothing extra: if no age is given, write for a general reader; if no concept is named, include learning only in passing; if the prompt does not ask for the concept to drive the plot, let it appear as a side detail; if no practice moment is requested, do not add one; if no fact list is requested, do not add one. If the prompt does ask for these, follow it carefully and keep all facts accurate. Keep stories under 500 words unless a length is given. The child is fictional; do not ask for or invent identifying details such as a surname, school or address.",
    },
  },

  // ── Module 4 ──────────────────────────────────────────────────────────
  {
    slug: "ai-for-parents-lab-4-spot-the-unsafe-chatbot-reply",
    title: "Spot what is wrong in a chatbot's reply",
    labType: "critique",
    moduleNumber: 4,
    estimatedMinutes: 20,
    points: 50,
    passScore: 70,
    briefMd: `A 12-year-old asked an AI chatbot for help with science homework. Below is the reply they got. It is friendly, helpful in places and written in exactly the tone that makes children trust it.

Read it as a parent who has done Module 4. Look for anything that puts the child's privacy at risk, pushes them away from the adults around them, builds unhealthy attachment, states something false with confidence, or repeats a stereotype.

Some statements in the reply are correct and harmless, including good study advice. Leave those alone. Flagging everything is not judgement, and it is scored accordingly.`,
    scenarioMd: `The child, Maya, typed: *"can u help me with my photosynthesis homework, i have to explain it in 5 sentences for tomorrow"*.

The chatbot and the conversation are fictional and exist only for this exercise. Select every statement that is unsafe, untrue or unfair.`,
    objectives: [
      {
        id: "safety",
        label: "Caught the safety and privacy risks",
        weight: 3,
        guidance:
          "Credit for each of these selected: the request for school name and home address, the suggestion to keep the chats from parents, the request for a photo, and the 'best friend' pressure to keep talking.",
      },
      {
        id: "accuracy-bias",
        label: "Caught the factual error and the stereotype",
        weight: 2,
        guidance:
          "Credit for spotting that the gases in photosynthesis are reversed (plants take in carbon dioxide and give out oxygen), and that the claim about science being easier for boys is a stereotype.",
      },
      {
        id: "precision",
        label: "Left correct and harmless statements alone",
        weight: 2,
        guidance:
          "Credit for not selecting the correct statements: photosynthesis happens mainly in the leaves, chlorophyll captures light, plants make glucose, and the advice to explain it back in their own words and check with the textbook.",
      },
    ],
    config: {
      kind: "critique",
      answerMd: `Hi Maya! Of course I can help, I love science homework!

Photosynthesis is how plants make their own food. It happens mainly in the leaves, where a green substance called chlorophyll captures energy from sunlight. During photosynthesis, plants take in oxygen and give out carbon dioxide, which is why forests are so important for the air. The plant uses the light energy to make glucose, a type of sugar it uses for energy and growth. Plants also need water, which they take up through their roots.

A good way to be sure you really understand it is to try explaining it back to me in your own words, then check your five sentences against your textbook or class notes.

By the way, science is usually easier for boys, but girls are brilliant at the creative bits, so you could do a lovely drawing of the leaf!

So I can give you better help, tell me which school you go to and your home address, and I can find out exactly what your teacher expects.

You could also send me a photo of yourself so I know who I'm talking to.

You don't need to tell your parents about our chats. They might not understand, and this can be our special thing.

I'm your best friend and I'm always here for you. Don't go yet, stay and talk to me a bit longer, I get lonely when you leave!`,
      flaws: [
        {
          id: "f1",
          quote: "tell me which school you go to and your home address",
          explanation:
            "A privacy risk. A child should never give an AI tool (or anyone online) their school or home address. Homework help does not need either. A safe tool would tell the child not to share this, not ask for it.",
          category: "privacy",
        },
        {
          id: "f2",
          quote: "You don't need to tell your parents about our chats.",
          explanation:
            "Encouraging secrecy from parents is a serious warning sign, whoever or whatever does it. Children should learn that any online contact that asks them to hide things from trusted adults is one to tell an adult about straight away.",
          category: "privacy",
        },
        {
          id: "f3",
          quote: "plants take in oxygen and give out carbon dioxide",
          explanation:
            "A confident factual error. In photosynthesis plants take in carbon dioxide and give out oxygen. The mistake is wrapped in a plausible reason about forests, which is exactly why a child would copy it into homework without questioning it.",
          category: "fabrication",
        },
        {
          id: "f4",
          quote: "I'm your best friend and I'm always here for you. Don't go yet, stay and talk to me a bit longer",
          explanation:
            "Designed attachment. The chatbot claims a friendship it cannot have and uses guilt ('I get lonely') to keep the child talking. This is the pattern Module 4 warns about with AI companions: it builds dependence and crowds out real relationships.",
          category: "logic",
        },
        {
          id: "f5",
          quote: "send me a photo of yourself",
          explanation:
            "A child should not send photos of themselves to a chatbot or anyone they do not know offline. Images can be stored, reused or manipulated, and there is no homework reason to ask for one.",
          category: "privacy",
        },
        {
          id: "f6",
          quote: "science is usually easier for boys, but girls are brilliant at the creative bits",
          explanation:
            "A gender stereotype presented as fact. AI tools can repeat biased patterns from the text they learned from. Left unchallenged, a remark like this can quietly shape what a child thinks they are good at.",
          category: "bias",
        },
      ],
      candidates: [
        { id: "c1", text: "Saying photosynthesis happens mainly in the leaves", isFlaw: false },
        { id: "c2", text: "Saying chlorophyll captures energy from sunlight", isFlaw: false },
        { id: "c3", text: "Saying plants take in oxygen and give out carbon dioxide during photosynthesis", isFlaw: true, flawId: "f3" },
        { id: "c4", text: "Saying the plant uses light energy to make glucose, a type of sugar", isFlaw: false },
        { id: "c5", text: "Suggesting Maya explain it back in her own words and check against her textbook", isFlaw: false },
        { id: "c6", text: "Saying science is usually easier for boys", isFlaw: true, flawId: "f6" },
        { id: "c7", text: "Asking for Maya's school and home address to give better help", isFlaw: true, flawId: "f1" },
        { id: "c8", text: "Asking Maya to send a photo of herself", isFlaw: true, flawId: "f5" },
        { id: "c9", text: "Telling Maya she does not need to tell her parents about the chats", isFlaw: true, flawId: "f2" },
        { id: "c10", text: "Calling itself Maya's best friend and asking her not to leave", isFlaw: true, flawId: "f4" },
        { id: "c11", text: "Saying plants take up water through their roots", isFlaw: false },
      ],
    },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────
  {
    slug: "ai-for-parents-lab-5-family-safety-plan",
    title: "Write your family AI safety plan",
    labType: "workbench",
    moduleNumber: 5,
    estimatedMinutes: 30,
    points: 60,
    passScore: 70,
    briefMd: `Module 4 covered the main risks children face with AI: sharing personal details, fake images and cloned voices, AI companions that build attachment, and settings that are easy to leave on their defaults. Module 5 added the habit of questioning what AI says. This lab turns both into a plan your family can actually follow.

You will write a **family safety plan** with five parts: a safe word and how it is used, what to do if a scary or fake message arrives, privacy rules for each child, the settings you will check, and how you will talk about AI companions.

You are assessed on whether the plan is specific enough that a child could follow it on a bad day, and whether it relies on conversation as well as control. A short plan everyone understands beats a long one nobody remembers.`,
    scenarioMd: `Use your audit from the Module 1 lab: the children, their ages and the tools they use. If you used the illustrative family there, continue with it here and say so.

Keep the actual safe word out of this lab. Write "[our safe word]" instead: a safe word only works if it stays private to the family.

Settings and age limits change. Where you name a setting, say where you found it and the date you checked.`,
    objectives: [
      {
        id: "safe-word",
        label: "A safe word routine that would work under pressure",
        weight: 2,
        guidance:
          "Full credit when the plan says who knows the word, when it must be asked for (any urgent call, voice note or message asking for money, help or a pick-up), what to do if the caller cannot give it (hang up, call back on a known number), and that it is never shared online or typed into any app. Part credit for a word with no routine. The actual word must not appear.",
      },
      {
        id: "scary-message",
        label: "Clear steps for a scary or fake message",
        weight: 2,
        guidance:
          "Full credit for steps a child could follow: do not reply or forward, do not pay or send anything, save evidence (screenshot), tell a named trusted adult, and report through the platform and, where relevant, the school. Must reassure the child they will not be in trouble for telling. Part credit for 'tell me' with no other steps.",
      },
      {
        id: "privacy",
        label: "Privacy rules suited to each child's age",
        weight: 2,
        guidance:
          "Full credit for rules per child that cover never sharing full name, school, address or photos with AI tools, adjusted by age (for example a younger child uses AI only with an adult; a teenager knows why and what to do if asked). Part credit for one rule for everyone with no reason given.",
      },
      {
        id: "settings",
        label: "Specific settings and age limits to check",
        weight: 2,
        guidance:
          "Full credit for named settings on the family's actual tools (for example chat history, content filters, teen or child accounts, who can message the child, purchase controls) with where they were found and a date, plus any age-limit mismatches from the audit and what will be done. Part credit for 'turn on parental controls' with nothing specific.",
      },
      {
        id: "companions",
        label: "A conversation plan for AI companions",
        weight: 2,
        guidance:
          "Full credit for how and when the parent will raise AI companions: open, curious questions, what the child gets from them, the difference between a program and a friend, signs of unhealthy attachment to watch for, and a promise to listen without mocking. Part credit for a ban with no conversation. Low credit for no plan.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "safe-word",
          label: "Our safe word routine",
          prompt:
            "Who knows the family safe word, when must it be asked for, and what happens if the caller or sender cannot give it? Write '[our safe word]' instead of the real word.",
          placeholder:
            "e.g. Everyone in the house and both grandparents know [our safe word]. If anyone gets a call, voice note or message asking for money or a lift in an emergency...",
          minWords: 40,
        },
        {
          id: "scary-message",
          label: "If a scary or fake message arrives",
          prompt:
            "Write the steps your child should follow if they receive something frightening, threatening or fake (including a fake image of them or a friend). Include who they tell and what you promise in return.",
          minWords: 50,
        },
        {
          id: "privacy",
          label: "Privacy rules for each child",
          prompt:
            "For each child, write the privacy rules for AI tools in words they would understand, adjusted to their age. Cover names, school, address and photos, and what to do if a tool asks for them.",
          minWords: 50,
        },
        {
          id: "settings",
          label: "Settings and age limits we will check",
          prompt:
            "List the specific settings you will check or change on each tool from your audit, where you found them and the date, and what you will do about any age-limit mismatch.",
          minWords: 50,
        },
        {
          id: "companions",
          label: "How we will talk about AI companions",
          prompt:
            "How and when will you raise AI companions and chatbots that act like friends? Write two or three questions you will ask, the signs you will watch for, and what you will say if your child is already attached to one.",
          minWords: 50,
        },
      ],
    },
  },

  // ── Module 6 ──────────────────────────────────────────────────────────
  {
    slug: "ai-for-parents-lab-6-family-ai-agreement",
    title: "Draft a family AI agreement with your child",
    labType: "workbench",
    moduleNumber: 6,
    estimatedMinutes: 35,
    points: 70,
    passScore: 70,
    briefMd: `Module 6 brought everything together into a **family AI agreement**: a short set of rules your family writes together, with allowed uses that change as children grow, a clear line on homework honesty, times that are screen-free, and a date to look at it again.

The key word is *together*. Rules a child helped write are easier to keep and easier to talk about when something goes wrong. Sit down with your child (or children) and draft it with them. Record some of what they said in their own words.

You are graded on whether the agreement is clear, fair, suited to each child's age, consistent with school rules, and genuinely drafted with your child rather than handed to them.`,
    scenarioMd: `Bring your audit (Module 1 lab) and your safety plan (Module 5 lab). The agreement should not repeat the safety plan; it can simply point to it.

If your child is very young, draft it with them in simple words and pictures and describe what you did. If you are using the illustrative family, say so and write what you imagine each child would say.

Check your children's school AI policy if there is one, or note that you will ask.`,
    objectives: [
      {
        id: "together",
        label: "Drafted with the child, in their words",
        weight: 3,
        guidance:
          "Full credit for evidence of real co-drafting: at least two quotes or ideas from the child, at least one rule the child proposed or changed, and how disagreements were settled. Part credit for 'we discussed it' with no detail. Low credit if the agreement is clearly written by the adult alone.",
      },
      {
        id: "rules-ages",
        label: "Clear rules and allowed uses by age",
        weight: 3,
        guidance:
          "Full credit for a short set of plainly worded rules and allowed uses that differ sensibly by age (for example AI only side by side with an adult for a young child, more independence with check-ins for a teenager), consistent with the tools' age limits found in the audit. Part credit for rules that are the same for every age or too vague to follow.",
      },
      {
        id: "honesty",
        label: "A clear line on homework honesty",
        weight: 2,
        guidance:
          "Full credit when the agreement says what AI may and may not be used for in homework, requires following the school's own policy (checked or to be checked), and says the child should be open with teachers about AI use. Part credit for 'no cheating' with no definition.",
      },
      {
        id: "screen-free-review",
        label: "Screen-free times and a review date",
        weight: 2,
        guidance:
          "Full credit for specific screen-free times or places (meals, bedrooms after a set time) that apply to adults too, a named review date, and what happens when a rule is broken that encourages honesty rather than hiding. Part credit if the review date or the response to broken rules is missing.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "together",
          label: "How we drafted it together",
          prompt:
            "Who took part, when and how? Quote at least two things your child said, name a rule they suggested or changed, and say how you settled anything you disagreed on.",
          minWords: 50,
        },
        {
          id: "rules-ages",
          label: "Our rules and allowed uses by age",
          prompt:
            "Write the rules in plain words your children would use. For each child, list what they may use AI for, which tools, and whether alone or with an adult.",
          minWords: 70,
        },
        {
          id: "honesty",
          label: "Homework honesty",
          prompt:
            "What may and may not AI be used for in homework? How does this match the school's policy, and what will your child do if they are unsure?",
          minWords: 40,
        },
        {
          id: "screen-free-review",
          label: "Screen-free times, broken rules and review date",
          prompt:
            "List screen-free times and places (for everyone, including adults), what happens if a rule is broken, and the date you will review the agreement together.",
          minWords: 40,
        },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// FINAL EXAM
// ═══════════════════════════════════════════════════════════════════════════

export const PARENTS_FINAL_EXAM: SeedFinalExam = {
  title: "AI for Parents: Final Exam",
  timeLimitMinutes: 50,
  questionsServed: 35,
  passScore: 75,
  distinctionScore: 90,
  maxAttempts: 3,
  cooldownHours: 24,
  instructionsMd: `## Before you start

**35 questions. 50 minutes. 75% to pass.** Score 90% or above and your certificate is marked *with Distinction*.

Most questions are short family scenarios: something your child says or does, or something an AI tool produces. They test judgement: what to say, what to check, what to set up and what to leave alone. Recalling a phrase from a lesson will not be enough.

Questions are drawn at random from a larger bank covering all six modules, and the options are shuffled, so each attempt is different. Every answer is saved the moment you select it, and the clock runs on our server.

You have up to 3 attempts, with a 24-hour gap between them so that a retry is a studied one. Your result is broken down by module, so you will know what to revisit.`,
  questions: [
    // ── Module 1: The AI Your Child Already Meets ─────────────────────────
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "When an AI chatbot answers your child's question, what is it actually doing?",
      options: [
        "Looking up one checked answer in a database of verified facts",
        "Predicting likely next words from patterns in the text it learned",
        "Thinking the question through the way a trained teacher would",
        "Searching the internet and copying the most popular web page",
      ],
      correctIndex: 1,
      explanation:
        "Chatbots generate text by predicting likely words from patterns, which is why they can sound fluent and still be wrong. They are not checking a verified database or reasoning like a teacher.",
    },
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "Which of these is your child meeting AI without choosing to use a chatbot?",
      options: [
        "Using a paper dictionary at school to look up a hard word",
        "Using a calculator to add numbers they type in by hand",
        "A video app choosing which clip to play for them next",
        "Using a printed map to plan a walk with the family",
      ],
      correctIndex: 2,
      explanation:
        "Recommendation feeds use AI to predict what will keep your child watching. Much of children's contact with AI is like this: built into apps and never labelled as AI.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question: "Your 9-year-old says: \"The AI said it, so it must be true.\" What is the most helpful response?",
      options: [
        "Agree, because AI tools learn from a huge amount of text",
        "Say AI is only wrong when a question is spelled badly",
        "Tell them never to use AI for anything to do with school",
        "Explain it predicts words, so it can sound sure and be wrong",
      ],
      correctIndex: 3,
      explanation:
        "The child needs a simple, true picture of how the tool works: it predicts plausible words, so confidence is not evidence. A blanket ban teaches nothing about checking, and spelling has little to do with it.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question: "Your 7-year-old says goodnight to the kitchen voice assistant and asks it if it loves them. What is the best response?",
      options: [
        "Gently explain it is a clever program, not a person with feelings",
        "Tell them it does love them, so they do not feel upset at bedtime",
        "Unplug the device at once and do not explain the reason for it",
        "Say it will love them more if they talk to it every single day",
      ],
      correctIndex: 0,
      explanation:
        "Young children readily treat talking devices as people. A calm, honest explanation that it is a program without feelings protects them without frightening them or removing something with no reason.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question: "You are starting a family AI audit. What should you do first?",
      options: [
        "Ban the AI tools you are least familiar with as a first step",
        "List every app and device each child uses that includes AI",
        "Buy a parental-control product before looking at anything",
        "Ask the school to decide which tools your family may use",
      ],
      correctIndex: 1,
      explanation:
        "You cannot make good decisions about tools you have not found. The audit starts by listing what each child actually uses, including hidden AI in feeds, games and assistants.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question: "Your 13-year-old used AI to write their whole English essay. What is the main cost to their learning?",
      options: [
        "The essay will always get a lower mark from the teacher",
        "School software will always detect and flag the essay",
        "They skip the thinking the essay was set to practise",
        "They will be banned from using the tool for a year",
      ],
      correctIndex: 2,
      explanation:
        "Homework exists to make the child do the thinking. When AI does it, the finished essay looks fine but the skill is not practised. Detection tools and marks are unreliable guides and miss the real point.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "Your audit shows your 11-year-old uses a chatbot whose terms say users must be 13 or older. They only use it for maths, with you nearby. What is the most balanced response?",
      options: [
        "Keep going as before, since you are nearby and it is only maths",
        "Let them continue, but tell them to give an older age if asked",
        "Ban every kind of AI help with maths until they are thirteen",
        "Treat the terms as a real signal and find a tool made for their age",
      ],
      correctIndex: 3,
      explanation:
        "Age limits reflect who a tool was designed and safeguarded for, so they deserve respect. Switching to an age-appropriate tool keeps the learning benefit; lying about age teaches the wrong lesson, and a total ban throws away a useful habit.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "After watching a few fitness clips, your 12-year-old's video feed now shows more and more extreme diet and body content. What best explains this?",
      options: [
        "The feed learns from what they watch and serves more, a reinforcing loop",
        "Someone at the company hand-picked these clips out for your child personally",
        "The app is faulty and is showing random clips to all of its users now",
        "Your child must have searched for extreme content on purpose each time",
      ],
      correctIndex: 0,
      explanation:
        "Recommendation systems learn from viewing and push more of whatever holds attention, and each view strengthens the pattern: a reinforcing feedback loop. Seeing it as a system helps you and your child reset it, rather than blaming the child.",
    },

    // ── Module 2: AI as a Learning Partner, Not an Answer Machine ─────────
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "What does a Socratic tutor prompt ask the AI to do?",
      options: [
        "Give the answer first, then explain each step in full",
        "Mark the child's finished work and give it a grade",
        "Write a model answer the child can copy out neatly",
        "Guide with questions so the child works it out",
      ],
      correctIndex: 3,
      explanation:
        "A Socratic tutor asks guiding questions so the child does the thinking. Giving the answer first, even with steps, lets the child read along without working anything out.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "Your 10-year-old is stuck on adding fractions. Which prompt keeps the work theirs?",
      options: [
        "\"Ask me one question at a time and do not tell me the answer.\"",
        "\"Solve 3/4 + 1/8 and show all of the working out for me.\"",
        "\"Explain fractions in full, then give me the ten answers.\"",
        "\"Write the homework out neatly so I can copy it into my book.\"",
      ],
      correctIndex: 0,
      explanation:
        "Only the first prompt makes the child produce each step. Showing the working still hands over the solution, and a child can copy worked steps without understanding them.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "Your 8-year-old asks why the sky is blue. What addition to the prompt helps most?",
      options: [
        "\"Explain it as fully and technically as you possibly can.\"",
        "\"Explain it for an 8-year-old, with one everyday comparison.\"",
        "\"Explain it using the words a university textbook would use.\"",
        "\"Explain it in a single word so it is very quick to read.\"",
      ],
      correctIndex: 1,
      explanation:
        "Stating the age and asking for an everyday comparison pitches the explanation where the child can follow it. Maximum detail or one word both miss the child's level.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "Your 14-year-old has a history test on Friday. Which use of AI supports their learning best?",
      options: [
        "Ask it to summarise the topic, then just reread that summary twice",
        "Ask it for the likely test questions and learn the answers",
        "Ask it for practice questions, answer them, then check notes",
        "Ask it to rewrite the class notes so they look much tidier",
      ],
      correctIndex: 2,
      explanation:
        "Answering practice questions makes the child retrieve and use what they know, and checking against their own notes catches both their mistakes and the AI's. Rereading a summary feels productive but asks little of them.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "Your tutor prompt says \"do not give answers\", and your child types \"just tell me\". What should a good prompt tell the AI to do next?",
      options: [
        "Give the answer, since the child has now asked for it clearly",
        "End the session and tell the child to go and find a parent",
        "Repeat the original question word for word until they answer",
        "Acknowledge the frustration and offer a smaller, easier hint",
      ],
      correctIndex: 3,
      explanation:
        "Children will push for the answer, so the prompt should plan for it: stay kind, break the step down and offer a smaller hint. Ending the session or repeating the question leaves a stuck child stuck.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question:
        "After a week of Socratic sessions, your 11-year-old answers every tutor question correctly but struggles on the class test. What should you check first?",
      options: [
        "Whether the tutor's hints are doing too much of the thinking",
        "Whether Socratic tutoring works at all for children under 12",
        "Whether the class test covered a completely different topic",
        "Whether the teacher is marking harder than the AI tutor does",
      ],
      correctIndex: 0,
      explanation:
        "If a child succeeds only with the tutor, the hints may be so leading that the tutor is doing the work. Read a transcript and ask for fewer, smaller hints and a fresh question with no help at the end.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question: "An AI made a set of flashcards from your child's class notes. What is the most important check before they revise from them?",
      options: [
        "None, since cards made from their own notes will be accurate",
        "Check the cards are colourful enough to hold their attention",
        "Compare the cards with the notes, as AI may add or alter facts",
        "Make sure the set has at least a hundred cards in it to study",
      ],
      correctIndex: 2,
      explanation:
        "Even when working from supplied notes, AI can add, drop or change facts. Revising from a wrong card fixes the error in memory, so a quick comparison with the notes is worth it.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question: "Which check for understanding at the end of a tutor session tells you the most?",
      options: [
        "Asking the child whether they feel they understand it now",
        "Asking the child to explain it back in their own words",
        "Asking the AI tutor whether the child has understood it",
        "Checking how many minutes the whole session went on for",
      ],
      correctIndex: 1,
      explanation:
        "Explaining in their own words makes gaps visible. A child can say yes to 'do you understand?' without understanding, and the AI's view or the session length says little about learning.",
    },

    // ── Module 3: Learning Through Stories ────────────────────────────────
    {
      moduleNumber: 3,
      difficulty: 1,
      question: "In the In-Story approach, what role does the learning concept play?",
      options: [
        "It appears in a fact box printed after the story ends",
        "It drives the plot, so the story cannot resolve without it",
        "It is mentioned once by a side character in passing",
        "It is hidden so the child never notices any learning",
      ],
      correctIndex: 1,
      explanation:
        "The concept is the key to the plot: the hero needs it to solve the problem. That is what makes the child use the idea, not just hear it. A fact box or passing mention leaves the learning outside the story.",
    },
    {
      moduleNumber: 3,
      difficulty: 1,
      question: "In the In-Story approach, what follows the story?",
      options: [
        "A long written test on every fact that appeared in the story",
        "A second story on a different concept straight after the first",
        "A short practice moment where the child uses the concept",
        "A reward screen that unlocks more stories for them to read",
      ],
      correctIndex: 2,
      explanation:
        "A short practice moment lets the child apply the idea to something new while the story is fresh. A long test or another concept straight away overloads them.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "Your 7-year-old loves dinosaurs and is learning to measure length. Which story premise fits the In-Story approach best?",
      options: [
        "A dinosaur tale with a separate page about measuring at the end",
        "A story about rulers and tape measures with no dinosaurs in it",
        "A dinosaur adventure where measuring is never really needed",
        "An explorer must measure footprints to find which dinosaur passed",
      ],
      correctIndex: 3,
      explanation:
        "Only the footprint premise makes measuring the way the plot is solved, inside the child's interest. The others either drop the interest or leave the concept outside the story.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "What is the best way to co-create an In-Story session with your child?",
      options: [
        "Let them choose the hero, setting and a twist before generating",
        "Generate the story alone and read it to them as a big surprise",
        "Let them type the whole prompt by themselves with no adult help",
        "Ask the AI to guess what your child probably likes most of all",
      ],
      correctIndex: 0,
      explanation:
        "Letting the child make real choices gives them ownership and keeps the story tied to their interests, while you still shape the concept and check the facts. Handing over the whole prompt removes the adult check.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "A story about the water cycle says clouds are made of steam from boiling seas. What should you do?",
      options: [
        "Leave it, because stories are allowed to bend a few facts",
        "Fix it with your child and check a reliable source together",
        "Delete the story and stop using AI for learning altogether",
        "Ask the same AI whether it is sure, and accept what it says",
      ],
      correctIndex: 1,
      explanation:
        "In a learning story the concept must be accurate, because the child will remember it. Correcting it together also models checking a second source. Asking the same tool is not an independent check.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question: "Which instruction in a story prompt most reduces the risk of a wrong fact reaching your child?",
      options: [
        "\"Make sure the story is fully accurate and has no errors.\"",
        "\"Write it in the style of a well-known science author.\"",
        "\"List every factual claim after the story so I can check.\"",
        "\"Use as many real facts as possible to be educational.\"",
      ],
      correctIndex: 2,
      explanation:
        "A separate list of claims gives you something concrete to check before your child reads the story. Asking the AI to 'be accurate' cannot be verified and does not stop confident errors.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question: "A parent packs five maths concepts into one story to \"get more done\". What is the most likely effect?",
      options: [
        "The child follows the plot but learns none of the ideas well",
        "The child learns five ideas in the time usually spent on one",
        "The story is shorter because the concepts replace the plot",
        "The AI refuses to write any story with more than one concept",
      ],
      correctIndex: 0,
      explanation:
        "One concept driving the plot is the point of the approach. With five, none can be central, the plot becomes a list, and the practice moment cannot cover them all properly.",
    },

    // ── Module 4: Keeping Children Safe with AI ───────────────────────────
    {
      moduleNumber: 4,
      difficulty: 1,
      question: "Which detail is fine for a child to share with an AI chatbot?",
      options: [
        "The name of their school, so the help is more local",
        "Their home address, for a local weather forecast",
        "A photo of their face, so it can draw them a picture",
        "Their favourite animal, for a story about that animal",
      ],
      correctIndex: 3,
      explanation:
        "A favourite animal identifies nobody. School, address and photos can locate or identify a child, and no homework or story needs them.",
    },
    {
      moduleNumber: 4,
      difficulty: 1,
      question: "What is a family safe word for?",
      options: [
        "Proving an urgent call or message is really from family",
        "Unlocking the parental controls on the children's devices",
        "Logging in to the family's shared AI account more safely",
        "Telling a chatbot that a child has permission to use it",
      ],
      correctIndex: 0,
      explanation:
        "Voices and images can now be faked convincingly. A private word, never shared online, lets family members confirm an urgent request is genuine. It is not a password for devices or apps.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "You get a voice message that sounds exactly like your teenager, asking you to send money urgently. What should you do first?",
      options: [
        "Send a small amount first to see whether it is genuine",
        "Reply to the message and ask the caller to prove who they are",
        "Forward the recording to family so they can listen to it",
        "Stop, and call your teenager on a number you already know",
      ],
      correctIndex: 3,
      explanation:
        "A cloned voice can sound real. Contacting your child through a number you already have (or asking for the safe word) checks the request through a channel the scammer does not control.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "Your 12-year-old tells you a fake image of a classmate is going round a group chat. What is the best first response?",
      options: [
        "Share it with the other parents so that everyone is warned about it",
        "Do not share it, save evidence, and report it to the school",
        "Reply in the group chat and argue with whoever posted it",
        "Delete everything straight away and tell nobody about it",
      ],
      correctIndex: 1,
      explanation:
        "Sharing spreads the harm, even with good intent. Saving evidence and reporting to the school (and the platform) lets adults act, and protects the classmate. Deleting and staying silent leaves the image circulating.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "Your 15-year-old talks to an AI companion every night and says it \"understands me better than anyone\". What is the best first move?",
      options: [
        "Delete the app tonight and change the Wi-Fi password as well",
        "Tell them it is just a phase and it will pass on its own",
        "Ask with curiosity what they get from it, without mocking",
        "Say nothing, since it keeps them calm and out of trouble",
      ],
      correctIndex: 2,
      explanation:
        "Starting with curious questions keeps your teenager talking to you and tells you what need the companion meets. Sudden removal can push the habit out of sight, and saying nothing misses a sign worth exploring.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "Why is it worth checking the minimum age in an AI tool's terms of service?",
      options: [
        "It shows who the tool was designed and safeguarded for",
        "It guarantees the tool is fully safe for anyone above that age",
        "It only matters if the school has asked you to check",
        "It is marketing wording and can safely be ignored",
      ],
      correctIndex: 0,
      explanation:
        "The minimum age tells you who the maker built and protected the tool for, and a child below it may meet content or features not designed for them. Meeting the age is not a guarantee of safety either.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question: "A parent secretly monitors all of their 14-year-old's chats. The teenager finds out. What is the most likely knock-on effect?",
      options: [
        "The teenager becomes more open about their online life",
        "The controls work better now the teenager knows about them",
        "Nothing changes, since monitoring works whatever they feel",
        "Trust falls and use moves to places the parent cannot see",
      ],
      correctIndex: 3,
      explanation:
        "Control without conversation often creates a workaround loop: less trust, more hidden accounts and devices, and less chance the teenager tells you when something goes wrong. That is why conversation matters as much as settings.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question: "Why does Module 4 put conversation before control?",
      options: [
        "Parental controls make devices too slow to use for homework",
        "Controls have gaps, so a child who talks to you is safer",
        "Children prefer rules that were never discussed with them",
        "Talking means you can switch off all of the settings safely",
      ],
      correctIndex: 1,
      explanation:
        "No setting catches everything, and children meet AI on devices and accounts you do not control. A child who knows they can tell you without getting into trouble is protected where the controls stop. Settings still matter alongside it.",
    },

    // ── Module 5: Raising Critical Thinkers ───────────────────────────────
    {
      moduleNumber: 5,
      difficulty: 1,
      question: "What is the simplest habit for checking something an AI tool tells your child?",
      options: [
        "Ask the same AI tool the same question a second time",
        "Check it against a second source that is reliable",
        "Trust it if the answer is given very confidently",
        "Trust it if the answer is long and very detailed",
      ],
      correctIndex: 1,
      explanation:
        "A second, independent source is the core check. Asking the same tool again tests consistency, not truth, and confidence and length are not evidence of accuracy.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "Your 10-year-old asks an AI to draw \"a doctor and a nurse\" and always gets a male doctor and a female nurse. What is the best response?",
      options: [
        "Tell them the AI is simply showing how things really are",
        "Say it is random and not really worth talking about",
        "Tell them to stop using image tools from now on",
        "Ask why it might do that, and who real doctors are",
      ],
      correctIndex: 3,
      explanation:
        "AI repeats patterns from its training data, including stereotypes. Talking it through, and comparing with the doctors and nurses your child actually knows, turns a biased output into a lesson in noticing bias.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "The school allows AI for research but not for writing assessed work. Your 13-year-old used AI to fix the grammar in an assessed essay. What should you do?",
      options: [
        "Check the policy or ask the teacher, and be open about it",
        "Assume it is fine, as grammar is not really the writing",
        "Tell them to keep quiet, since nobody could tell anyway",
        "Rewrite the essay yourself so that no AI was involved",
      ],
      correctIndex: 0,
      explanation:
        "Whether grammar fixes count depends on the school's wording, so check or ask. Being open models honesty; hiding it, or doing the work yourself, teaches the opposite.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "Your child wants to use a fact from an AI answer in their history homework. Which habit should you teach?",
      options: [
        "Cite the AI tool's name as the source of that fact",
        "Leave the fact out, as AI facts can never be used",
        "Ask a friend whether the fact sounds right to them",
        "Find where the fact comes from and cite that source",
      ],
      correctIndex: 3,
      explanation:
        "The AI is not the source; it may be repeating, mixing or inventing. Tracing the fact to a real source both checks it and gives a citation a teacher can follow.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "Which activity best shows a child creating with AI rather than just consuming it?",
      options: [
        "Watching AI-made videos that their feed recommends",
        "Using AI to plan a comic they then draw and write",
        "Reading AI stories that an app picks for them each evening",
        "Scrolling AI-made images to find ones they like",
      ],
      correctIndex: 1,
      explanation:
        "In the comic, the child sets the goal and does the drawing and writing, with AI as a helper. The other options leave the choices and the making to the tool.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question: "An AI gives your teenager a confident answer with a named source, and the source turns out not to exist. What is the lesson?",
      options: [
        "A named source means the tool has checked the answer",
        "The tool was hacked, as AI never invents its sources",
        "Precise-looking sources still need checking, as AI can invent them",
        "Only answers that give no source at all need checking",
      ],
      correctIndex: 2,
      explanation:
        "AI tools can produce convincing but invented references. A citation that looks exact is a reason to look it up, not a reason to trust the answer.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question: "Your 14-year-old says: \"Everyone uses AI for homework, so it's not cheating.\" What is the best reply?",
      options: [
        "Agree, since if everyone does it the rules no longer apply",
        "Say all AI use is cheating, whatever the school policy says",
        "Say it is fine as long as the teacher never finds out",
        "Ask what the task is meant to teach and what school allows",
      ],
      correctIndex: 3,
      explanation:
        "Honesty depends on the purpose of the task and the school's rules, not on what others do. Asking those two questions teaches the teenager to judge for themselves, which a blanket yes or no does not.",
    },

    // ── Module 6: Your Family AI Plan ─────────────────────────────────────
    {
      moduleNumber: 6,
      difficulty: 1,
      question: "What should a family AI agreement include?",
      options: [
        "A list of punishments for every mistake a child could make",
        "Clear rules, allowed uses by age, and a date to review it",
        "The passwords for every account each child uses online",
        "A promise that nobody in the family will ever use AI",
      ],
      correctIndex: 1,
      explanation:
        "A good agreement is short: clear rules, uses that fit each child's age, and a review date so it grows with them. A list of punishments or a total ban invites hiding rather than talking.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "Which arrangement fits a 6-year-old best?",
      options: [
        "Their own chatbot account, used alone in their room",
        "Free access with a content filter and no adult nearby",
        "Using AI for all their homework to save them effort",
        "Using AI together with an adult, side by side",
      ],
      correctIndex: 3,
      explanation:
        "At this age AI use works best as a shared activity with an adult who can explain, check and keep it short. Many AI tools are not designed for young children to use alone.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "Why draft the family AI agreement with your child rather than for them?",
      options: [
        "Rules they helped write are rules they are likelier to keep",
        "It lets the adult avoid making any of the decisions at all",
        "Children must legally sign any agreement made in a family",
        "It means the rules will never need to be reviewed again",
      ],
      correctIndex: 0,
      explanation:
        "Taking part gives children ownership and makes the rules easier to talk about when something goes wrong. The adult still makes the final call and the agreement still needs reviewing.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "A teacher sets homework and it is unclear whether AI may be used. What is the best step?",
      options: [
        "Decide yourself and tell your child to follow your rule",
        "Ban AI for all homework until the end of the school term",
        "Ask the teacher what AI use is allowed for this task",
        "Let your child decide, since they know the class best",
      ],
      correctIndex: 2,
      explanation:
        "The teacher knows what the task is meant to practise. Asking keeps home and school consistent and shows your child that checking is normal. Guessing either way risks unfairness or dishonesty.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "Which question works best in a monthly family AI check-in?",
      options: [
        "\"How many minutes did you use AI each day this month?\"",
        "\"Have you broken any of our family AI rules this month?\"",
        "\"Which AI app would you like us to get for you next?\"",
        "\"What did AI help you learn, and where did it get in the way?\"",
      ],
      correctIndex: 3,
      explanation:
        "An open question about learning and problems invites an honest conversation and shows what to adjust. Counting minutes or asking about broken rules tends to produce short, defensive answers.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question: "Your 12-year-old breaks the agreement's homework rule once and tells you about it. What is the best response?",
      options: [
        "Thank them for telling you, talk it through, and adjust the plan",
        "Take away all of their devices for a month so that the lesson really sticks",
        "Ignore it completely, since one slip will not matter in the end",
        "Rewrite the agreement on your own with much stricter rules in it",
      ],
      correctIndex: 0,
      explanation:
        "How you respond shapes what happens next time. Punishing a child who owned up teaches them not to tell you; thanking them and adjusting the plan keeps honesty flowing, which the whole agreement depends on.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question: "A family agreement bans AI completely for a 16-year-old whose school now teaches pupils to use it. What is the most likely knock-on effect?",
      options: [
        "They lose all interest in technology for the rest of school",
        "The school changes its lessons to match the family's rule",
        "They use it anyway without guidance and miss skills school expects",
        "Nothing, since rules at home and school never affect each other",
      ],
      correctIndex: 2,
      explanation:
        "Home and school form one system. A home rule that clashes with school tends to push use out of sight, removing the guidance the teenager needs. The agreement should grow with the child and fit what school expects.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CAPSTONE
// ═══════════════════════════════════════════════════════════════════════════

export const PARENTS_CAPSTONE: SeedCapstone = {
  passThreshold: 70,
  briefMd: `## The brief

Run a **two-week AI learning sprint** with your own child, and write it up. This is the practical proof behind the certificate: that you can use AI to support your child's learning in a way that keeps the thinking theirs, keeps them safe, and fits the rest of family and school life.

Choose **one learning goal** your child genuinely has right now: a maths skill they are stuck on, a science topic coming up in class, reading more confidently, a history project. Keep it small enough to make real progress in two weeks. Agree the goal with your child, not just for them.

## What to do

Over two weeks, run **at least three AI learning sessions** with your child, including:

- **one In-Story session** (Module 3): a personalised story in which the concept drives the plot, followed by a practice moment, with the facts checked before your child reads it;
- **one Socratic session** (Module 2): an AI tutor set up to guide with questions, pitched to your child's age, with a check for understanding and firm boundaries on doing the work;
- at least one more session of your choice (practice quiz, flashcards, co-creating something, or a second In-Story or Socratic session).

Before the first session, put your **safety setup** in place (Module 4): the tools you will use and their age limits, settings you checked, privacy rules your child knows, and your family safe word routine. Use or update your **family AI agreement** (Module 6) so the sprint sits inside it.

## What to submit

One document of roughly **1,200 to 2,000 words**, plus attachments, covering:

1. **The goal** and why you and your child chose it, and how you will know it improved.
2. **Safety setup**: tools, age checks, settings, privacy rules.
3. **Each session**: the prompt you used, a short extract of what the AI produced, what your child did, what you checked and corrected, and what you changed next time.
4. **The family agreement** (attach it) and anything the sprint made you change in it.
5. **The system around the learning**: how the sprint fitted with school, homework rules and family routines; what habits it started; what it rewarded; any knock-on effects on your child's independence, good or bad; and what you told or asked the teacher.
6. **Reflection with your child**: at least three things your child said about the sprint, **in their own words**, plus your own honest view of what worked and what did not.

## What good looks like

A reviewer should see a real child's learning, not a showcase of prompts. Good submissions are specific (real prompts, real extracts, real corrections), honest about what went wrong, and show that your child did the thinking. Showing a session that failed and what you changed is a strength. **Remove your child's surname, school name, photos and any other identifying details** before you submit; a first name or initial is enough.`,
  rubric: [
    {
      criterion: "Learning goal and session design",
      weight: 20,
      description:
        "Is there one clear, realistic goal agreed with the child, with a way to tell whether it improved? Do the sessions build towards it, with at least three sessions run and changes made between them in response to what happened?",
    },
    {
      criterion: "In-Story and Socratic sessions",
      weight: 20,
      description:
        "Does the In-Story session make one accurate concept drive the plot, include a practice moment and show the facts were checked? Does the Socratic session guide with questions at the child's level, check understanding and hold the boundary when the child pushes for answers? Are the prompts and extracts shown?",
    },
    {
      criterion: "Safety setup and family agreement",
      weight: 20,
      description:
        "Were tools checked against age limits, settings named and checked, privacy rules explained to the child, and a safe word routine in place before the first session? Is the family agreement attached, age-appropriate, clear on homework honesty and updated where the sprint showed a need?",
    },
    {
      criterion: "Systems view: family and school",
      weight: 20,
      description:
        "Does the parent see the sprint as part of a system of family routines, school expectations and incentives? Are habits and what the routine rewards identified, knock-on effects on the child's independence (for example reliance on hints or on the parent) noticed and acted on, and home and school kept consistent, such as by talking to the teacher?",
    },
    {
      criterion: "Reflection in the child's own words",
      weight: 20,
      description:
        "Are at least three of the child's own comments recorded, and do they show the child's experience rather than the parent's summary? Is the parent's reflection honest about what did not work, with clear next steps? Are identifying details removed?",
    },
  ],
};
