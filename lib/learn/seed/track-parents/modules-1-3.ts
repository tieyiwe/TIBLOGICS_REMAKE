import type { SeedModule } from "../types";

// AI for Parents: Raising Confident, Safe Learners (slug: ai-for-parents),
// Modules 1-3. Audience: parents and carers of children roughly 5-17, many not
// technical. Every lesson ends with something to try tonight with their child.
// Module 3 introduces the TIBLOGICS In-Story approach, described only at the
// level of the core idea: a personalised story built around the child's
// interests, where the concept moves the story forward, followed by practice.

export const PARENTS_MODULES_1_TO_3: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 1
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "The AI Your Child Already Meets",
    summary:
      "Understand what AI is well enough to explain it at your child's level, see where children already meet it, weigh what it is good and bad at for learning, and run a quick audit of the AI in your own home.",
    lessons: [
      {
        title: "What AI is, explained so you can explain it",
        objective: "Explain in plain words what an AI chatbot does, why it can be wrong, and why it is not a person, at a level that suits your child's age.",
        durationMinutes: 20,
        contentType: "article",
        isPreview: true,
        bodyMd: `## You do not need to be technical

Many parents feel they cannot guide their children on AI because they do not understand it themselves. The good news is that you only need a few solid ideas, and you can pick them up in one sitting. This lesson gives you those ideas, then shows you how to put them into words a six-year-old or a sixteen-year-old will understand.

When people say "AI" today they usually mean tools like chatbots (ChatGPT, Gemini, Claude, Copilot and others), voice assistants, and the systems that choose which video plays next. This course focuses mostly on chatbots, because those are the tools children use to ask questions, get help with homework and, increasingly, chat to for company.

## Three ideas that explain most of it

**1. It predicts words.** A chatbot has been trained on a huge amount of text. From that, it has learned patterns of which words tend to follow which. When your child types a question, the tool builds an answer one small piece at a time, each time choosing a likely next word. It is extremely good at this, which is why the answers sound fluent and confident.

**2. It can be wrong, and still sound sure.** Because it produces likely-sounding text rather than looking facts up in a checked book, it can make things up. It might invent a date, a quote or a book title, and present it in exactly the same calm tone as a true fact. People call these mistakes "hallucinations". Some tools can search the web to help, but even then they can misread or mix up what they find.

**3. It is not a person.** It does not know your child, care about them, or remember them the way a friend does (some tools store past chats, but that is a record, not a relationship). It has no feelings, even when it says "I'd love to help!" That friendly tone is a style it has learned, not a sign of real warmth. This matters most for children who might start to treat a chatbot as a friend or confidant, which we return to later in the course.

## Saying it at your child's level

The same ideas, in words that fit different ages:

- **Ages 5 to 7:** "It's a computer program that is very good at guessing words. It has read lots and lots of writing, so its guesses often sound clever. But sometimes it guesses wrong, so we always check with a grown-up or a book. It isn't alive and it doesn't have feelings."
- **Ages 8 to 11:** "It works a bit like the autocomplete on a phone, but far more powerful. It learned from millions of pages of writing, so it can explain things and answer questions. It doesn't actually know if it is right, so it can make things up and sound sure. That's why we check important things."
- **Ages 12 to 14:** "It is a language model: a program trained to predict the next word in a piece of text. That makes it great at explaining and drafting, and unreliable on facts, because it is aiming for what sounds likely, not what is true. Use it like a clever friend who sometimes bluffs."
- **Ages 15 to 17:** Talk about it as you would with an adult. What is it good at, where does it get facts wrong, who made it, what happens to what you type into it, and what counts as your own work at school or college.

## A demonstration beats an explanation

Children believe what they see. The quickest way to make "it can be wrong" stick is to catch it being wrong together. Ask a chatbot about something your child knows better than anyone: their favourite book series, a local place, or the rules of a game they play. Small errors often appear. When your child spots one, they learn more in a minute than a lecture would teach them.

You can also ask the tool to explain itself. Try this in the practice pad below the lesson:

\`\`\`try
My child is [CHILD'S AGE] years old. In three or four short sentences they would understand, explain what you are, how you come up with your answers, and why you can sometimes be wrong. Do not pretend to have feelings. End with one question I can ask them to check they understood.
\`\`\`

Read the answer yourself first. If it is too complex, ask it to make the explanation simpler, or to use an example about [INTEREST].

## Try it now

Tonight, sit with your child for ten minutes.

1. Run the prompt above with their age filled in and read the answer aloud together.
2. Ask the chatbot three questions about something your child is an expert on.
3. Hunt for anything it got wrong or made up. Praise them for every catch.

You are done when your child can tell you, in their own words, one thing AI is good at and one reason we check what it says.`,
        microCheck: [
          {
            question: "Your eight-year-old asks how a chatbot knows the answers. Which explanation is closest to how it works?",
            options: [
              "It guesses likely words based on patterns in lots of writing",
              "It looks every answer up in a checked online encyclopaedia",
              "It asks a team of real human experts who all reply very quickly",
              "It remembers the right answers that people typed in before",
            ],
            correctIndex: 0,
            explanation:
              "A chatbot generates text by predicting likely next words from patterns it learned in training. It is not checking a verified source or asking people, which is why it can sound sure and still be wrong.",
          },
          {
            question: "A chatbot tells your child a confident, detailed fact about a historical date. What is the sensible response?",
            options: [
              "Accept it, because detail is a very strong sign the answer is accurate",
              "Check it elsewhere, because confident tone says nothing about truth",
              "Ignore it, because chatbots are almost always wrong about dates",
              "Ask the chatbot if it is sure, and accept whatever it says next",
            ],
            correctIndex: 1,
            explanation:
              "Chatbots can invent facts in the same fluent tone as true ones, so confidence and detail are not evidence. Asking the same tool again is not a real check, and assuming it is always wrong is just as unhelpful.",
          },
          {
            question: "Your child says the chatbot is their friend because it says it enjoys talking to them. What is the key point to explain?",
            options: [
              "The friendly tone is a learned style, not real feelings for them",
              "The chatbot does like them, but it also likes every other user",
              "Only paid chatbots are able to form real friendships with users",
              "It is a friend as long as it remembers their earlier conversations",
            ],
            correctIndex: 0,
            explanation:
              "A chatbot has no feelings. Warm phrases are patterns it produces, and a stored chat history is a record rather than a relationship. Helping a child see this early protects them from over-trusting it.",
          },
          {
            question: "What is the most effective way to show a child that AI can be wrong?",
            options: [
              "Tell them firmly and repeat the warning each time they use it",
              "Ask it about a topic they know well and spot mistakes together",
              "Show them a news story about a well-known AI failure online",
              "Ban its use until they are old enough to understand the risks",
            ],
            correctIndex: 1,
            explanation:
              "Catching the tool out on a subject the child knows turns an abstract warning into something they have seen for themselves. Repeated warnings and bans teach far less than one real discovery.",
          },
          {
            question: "Which explanation best suits a six-year-old?",
            options: [
              "It is a language model trained to predict the next token in text",
              "It is a very good word-guesser that sometimes guesses wrong",
              "It is a search engine that summarises the best web pages for you",
              "It is a robot brain that thinks and feels a bit like people do",
            ],
            correctIndex: 1,
            explanation:
              "Young children need a simple, accurate picture: it guesses words and can be wrong. Technical terms are too abstract at that age, and describing it as thinking and feeling like people is simply untrue.",
          },
        ],
      },
      {
        title: "Where children meet AI",
        objective: "Identify the places AI already shows up in your child's day, and name the main question to ask about each one.",
        durationMinutes: 20,
        contentType: "article",
        bodyMd: `## It is not only chatbots

When parents think about children and AI, they often picture a teenager asking a chatbot to write an essay. That is one place, but children meet AI in many others, often without anyone calling it AI. Knowing where it is lets you ask the right question about each one, instead of worrying about everything at once.

## Six places to look

**Homework helpers.** General chatbots, AI features inside search engines, and apps that solve a maths problem from a photo. They can explain, and they can also simply hand over answers. The question to ask: *is my child using this to understand, or to finish?*

**Voice assistants.** Smart speakers and phone assistants answer questions, set timers and play music. Younger children often chat to them freely. The question: *what is it recording and storing, and can it make purchases?* Most have settings for voice history and purchase controls, so check yours.

**Games.** Many games use AI to control characters, adjust difficulty, or generate content. Some let players chat with AI characters. The question: *who or what is my child talking to inside this game?*

**Recommendation feeds.** Video apps and social platforms use AI to decide what to show next, based on what keeps each person watching. This is the AI children meet most, and it is the least visible. The question: *who is choosing what my child sees, and what is it optimising for?* A feed tuned to keep someone watching is not tuned for what is good for them.

**Chatbots and AI companions.** Beyond general assistants, there are apps designed to be a character, a friend or even a romantic partner, and some social apps have added chatbot "friends". These can be the most emotionally powerful and the least suitable for children. The question: *is this designed to help, or designed to keep my child coming back?*

**Image and video filters.** Face filters, photo editing tools and apps that turn a photo into a cartoon or an avatar. Most are harmless fun, but some tools can create realistic fake images of real people. The question: *whose photos are being uploaded, and what could be made from them?*

## Age limits and privacy

Many AI services set a minimum age in their terms of use. It is often 13, sometimes higher, and some allow teenagers to use them only with a parent's consent. These rules differ between services and change over time, so always check the current terms of the specific tool rather than relying on what a friend or an article said.

There are also laws about children's data, such as COPPA in the United States and the Age Appropriate Design Code in the UK. You do not need to know the detail. The useful point is that services aimed at children, or likely to be used by them, are expected to handle children's data with extra care, and you are entitled to ask how a service does that.

## Noticing without panicking

The aim is awareness, not alarm. Most of these tools are useful and many are fun. What you are building is a habit of asking two questions of anything new: *what does this do with my child's attention?* and *what does it do with my child's information?*

A calm conversation also helps. Children tell parents more when they do not expect an instant ban. Ask what they use and what they like about it before you say anything about rules.

You can use AI itself to help you prepare:

\`\`\`try
I am a parent of a [CHILD'S AGE]-year-old who uses [APP OR GAME NAME]. In plain language, explain whether and how this kind of app typically uses AI, what I should check in its settings, and three friendly questions I could ask my child about how they use it. Tell me which details I should confirm on the app's own website because they may have changed.
\`\`\`

Treat the answer as a starting point. The app's own help pages and settings screens are the real source.

## Try it now

Over dinner or on a car journey, play "Spot the AI". Ask your child to name every app, game or device they used this week, and for each one guess together whether AI is involved and what it does. Write the list down.

You are done when you have a list of at least five tools your child uses, each marked with the one question from this lesson that applies to it. Keep it: you will use it in the family audit at the end of this module.`,
        microCheck: [
          {
            question: "Your ten-year-old watches videos that autoplay one after another. Where is AI most involved?",
            options: [
              "In choosing which video to show next so that they keep watching",
              "In checking every video to confirm it is suitable for children",
              "In recording the videos and editing them before they are shown",
              "In reading the comments aloud so younger viewers can follow",
            ],
            correctIndex: 0,
            explanation:
              "Recommendation systems use AI to pick what plays next, usually to maximise watching. That is the least visible AI children meet. It does not guarantee suitability, which is why settings and supervision still matter.",
          },
          {
            question: "A friend says a chatbot's minimum age is 13, so it must be fine for your 14-year-old. What should you do?",
            options: [
              "Trust it, because age limits are the same across most services",
              "Check the tool's current terms, since rules vary and change",
              "Assume 16, because that is the legal limit for all AI tools",
              "Ignore age limits, because they are rarely enforced in practice",
            ],
            correctIndex: 1,
            explanation:
              "Age limits differ between services, some require parental consent for teenagers, and they change over time. The tool's own current terms are the only reliable source, not a friend or a general rule.",
          },
          {
            question: "Which question best fits an AI companion app your child has downloaded?",
            options: [
              "Is it designed to help, or designed to keep them coming back?",
              "Does it use the newest AI model available on the market today?",
              "Can it help with maths homework as well as general chatting?",
              "Is the app free, or does it need a monthly subscription fee?",
            ],
            correctIndex: 0,
            explanation:
              "Companion apps can be emotionally powerful and built to maximise time spent. Asking what the app is designed for gets to the real risk, while model versions and price say little about suitability.",
          },
          {
            question: "Your child uses a filter app that turns selfies into cartoons. What is the most useful thing to check?",
            options: [
              "Whether the cartoons look realistic enough to share with friends",
              "Whose photos are uploaded and what the app does with them",
              "Whether the app has more filters than the ones they use now",
              "Whether their friends are all using the same filter app too",
            ],
            correctIndex: 1,
            explanation:
              "Image tools raise questions about personal photos and what can be made from them. Knowing whose photos go in and how the app stores or uses them matters far more than the look of the filters.",
          },
        ],
      },
      {
        title: "What AI is good and bad at for learning",
        objective: "Distinguish uses of AI that build your child's learning from uses that replace it, using the effort test.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Learning needs effort

Learning happens when a child's brain does the work: remembering, puzzling, trying, getting it wrong and trying again. That struggle is not a sign something is going badly. It is often the learning itself.

This gives you a simple test for any use of AI: **who is doing the thinking?** If the AI does the thinking and the child copies the result, the homework gets done but little is learned. If the AI prompts, questions and gives feedback while the child does the thinking, it can be a powerful learning partner. Call this the effort test.

## Where AI genuinely helps

**Endless, patient practice.** An AI tool can generate practice questions at the right level, on any topic, as many times as needed, without getting bored or impatient.

**Explanations in different ways.** If the teacher's explanation did not land, AI can try again with a different example, a picture described in words, a comparison with football or baking, or simpler vocabulary.

**Feedback on their own work.** A child can paste in a paragraph they wrote and ask "what is one thing that would make this clearer?" rather than "rewrite this". The child still does the rewriting.

**Asking the questions they are shy to ask.** Some children will not put their hand up in class. A private tool lets them ask "what does denominator actually mean?" without embarrassment.

**Following curiosity.** A child fascinated by volcanoes or ancient Egypt can go as deep as they like, with a tool that answers follow-up questions.

## Where it goes wrong

**Shortcuts.** The most obvious risk. A tool that writes the essay or solves the equations removes the effort that produces learning. It also puts the child in breach of most school rules.

**Wrong answers.** As you saw in the first lesson, chatbots can be confidently wrong. A child who does not yet know the topic cannot spot the error. Maths working and specific facts are common trouble spots.

**Over-reliance.** If a child reaches for AI at the first moment of difficulty, they never build the stamina to stay with a hard problem. Over time they may believe they cannot do things without it.

**Explanations that sound clear but are not understood.** Reading a good explanation feels like learning. Only being able to explain it back, or use it on a new problem, shows the learning actually happened.

## The same tool, two outcomes

Picture two children with the same fractions homework.

The first types: *"What is 3/4 + 1/6?"* The tool gives the answer and the working. The child copies it down. Homework done in two minutes, nothing learned.

The second types a prompt like this:

\`\`\`try
I am [CHILD'S AGE] and I am learning [TOPIC]. Do not give me the answer. Ask me one question at a time to help me work it out myself. If I get stuck, give me a small hint, not the solution. My problem is: [PASTE THE PROBLEM].
\`\`\`

This child takes fifteen minutes, gets one step wrong, fixes it with a hint, and can now do the next one alone. Same tool. The difference is the instruction and who is doing the thinking.

You will build on this tutor-style prompting in Module 2.

## Try it now

Pick one piece of homework or one topic your child is working on this week.

1. Ask the chatbot for the answer directly, and read it together.
2. Then run the tutor prompt above with the same problem, and let your child work through the questions.
3. Ask your child: "Which one helped you actually learn it? Why?"

You are done when your child can describe, in their own words, the difference between the two ways of using the tool. Many children put it better than adults: "one did it for me, one made me do it".`,
        microCheck: [
          {
            question: "Your child asks a chatbot to solve all ten maths questions and copies the answers. What does the effort test say?",
            options: [
              "The AI did the thinking, so the child learned very little",
              "The child learned the method by reading the full solutions",
              "It is fine as long as every one of the answers was correct",
              "It depends on whether the homework is going to be marked",
            ],
            correctIndex: 0,
            explanation:
              "The effort test asks who did the thinking. Copying correct answers completes the task but skips the effort that produces learning, whether or not the answers are right or the work is marked.",
          },
          {
            question: "Which use of AI best supports learning?",
            options: [
              "Asking it to rewrite a paragraph so the essay reads better",
              "Asking which one change would make their paragraph clearer",
              "Asking it to write a model essay to hand in as a draft copy",
              "Asking it to summarise the set book instead of reading it",
            ],
            correctIndex: 1,
            explanation:
              "Asking for one improvement keeps the child doing the rewriting and thinking. Rewrites, model essays and summaries in place of reading all move the effort from the child to the tool.",
          },
          {
            question: "Your child says, after reading an AI explanation, that they totally get it now. What is the best next step?",
            options: [
              "Move on, since feeling confident means the lesson has landed",
              "Ask them to explain it back or try a new problem on their own",
              "Ask the AI to explain it once more just to be completely sure",
              "Check the explanation was long and detailed enough to be good",
            ],
            correctIndex: 1,
            explanation:
              "Reading a clear explanation feels like understanding, but only explaining it back or using it on a fresh problem shows real learning. A second explanation or a longer one does not test anything.",
          },
          {
            question: "Why is AI especially risky for checking facts on a topic your child is just starting to learn?",
            options: [
              "They cannot yet spot a confident mistake in the answer",
              "AI tools refuse to answer questions about new school topics",
              "AI answers are too advanced for beginners to read at all",
              "Beginners are more likely to type the question in wrongly",
            ],
            correctIndex: 0,
            explanation:
              "Chatbots can be confidently wrong, and a beginner lacks the knowledge to notice. That is why checking against a textbook, teacher or trusted source matters most early in a topic.",
          },
          {
            question: "Your child reaches for a chatbot the moment any problem feels hard. What is the main long-term risk?",
            options: [
              "They never build the stamina to stay with a hard problem for long",
              "They will use up the free allowance on the chatbot too fast",
              "The chatbot will start to give them easier questions instead",
              "Their teacher will notice the chatbot's writing style quickly",
            ],
            correctIndex: 0,
            explanation:
              "Over-reliance means the child skips the productive struggle where persistence is built, and may come to believe they cannot cope without the tool. That matters far more than usage limits or style.",
          },
        ],
      },
      {
        title: "Your starting point: a family AI audit",
        objective: "Complete a short family AI audit listing each tool, who uses it, its age terms and its key settings, and choose one change to make this week.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Why an audit, not a rulebook

Before setting rules, it helps to know what is actually happening. Many families discover their children use more AI than they thought, in places they had not considered, and that some settings were never looked at. A short audit gives you a clear, calm starting point, and turns "AI" from a vague worry into a list of specific tools you can decide about.

It takes about twenty minutes, and it works best done *with* your child, not behind their back. Older children in particular respond better to being consulted than to being checked on.

## Step 1: list the tools

Start from the "Spot the AI" list you made in the previous lesson. Add anything you use as a family: the smart speaker in the kitchen, the AI in your own phone's assistant, apps on shared tablets, and any learning apps from school.

## Step 2: fill in the audit table

Copy this into a notebook, a document or a spreadsheet. One row per tool.

| Tool | Who uses it | What for | Age in the terms | Account type | Settings checked | Concerns | Decision |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

What each column means:

- **Who uses it**: which child, and roughly how often.
- **What for**: homework, fun, chatting, music, videos.
- **Age in the terms**: find the tool's current terms of use or help page. Many services set a minimum of 13, some set a higher age, and some require parental consent for teenagers. Write down what *this* tool says today.
- **Account type**: the child's own account, a family or supervised account, a shared adult account, or no account.
- **Settings checked**: chat history, data used for training (some tools let you opt out), content filters, purchases, parental controls or family link features where they exist.
- **Concerns**: anything that worries you, however small.
- **Decision**: keep as is, change a setting, use only together, or stop for now.

## Step 3: check the settings that matter most

Settings differ between tools and change often, so look inside each one rather than relying on a guide. The main things to find:

1. **History and memory.** Can past chats be seen, and can they be deleted?
2. **Data use.** Does the service say it may use conversations to improve its models, and can that be turned off?
3. **Content controls.** Are there filters or a teen mode?
4. **Parental or family controls.** Some services offer linked parent accounts or supervised profiles. Some do not.
5. **Spending.** Can the child buy things, subscriptions or credits?

If you are unsure where a setting lives, AI can help you find it. Then confirm on the tool itself:

\`\`\`try
I am a parent checking the settings of [TOOL NAME] for my [CHILD'S AGE]-year-old. Give me a short checklist of the privacy, content and spending settings I should look for, and describe roughly where such settings are usually found. Remind me which points to confirm on the official help pages, because menus and policies change.
\`\`\`

## Step 4: agree two or three family rules

With the table in front of you, agree a small number of rules together. Keep them short and specific, for example:

- "AI can explain and quiz, but homework words and answers are yours."
- "We don't put full names, addresses, school names or photos of friends into chatbots."
- "If a chatbot says something weird or upsetting, show a grown-up. You won't be in trouble."

That last rule matters most. Children who fear losing a device often hide problems. A promise that telling you will not lead to automatic punishment keeps the door open.

## Try it now

Tonight, fill in the audit table for at least three tools your child uses, sitting with them if they are old enough. Check the age terms and at least two settings for each.

You are done when every row has a decision in the last column, you have made at least one setting change, and you have written down two or three family rules that you and your child both agreed.`,
        microCheck: [
          {
            question: "Why does the lesson suggest doing the family AI audit with your child rather than secretly?",
            options: [
              "Children, especially older ones, engage more when consulted",
              "Most apps block parents from viewing settings on their own",
              "It is a legal requirement that children consent to an audit",
              "Children always know the settings better than their parents",
            ],
            correctIndex: 0,
            explanation:
              "Involving children builds trust and makes them more likely to follow rules and report problems. There is no legal requirement here, and it is about the relationship, not who knows the menus better.",
          },
          {
            question: "Where should you find the minimum age for an AI tool your child uses?",
            options: [
              "In the tool's current terms of use or its official help pages",
              "In a parenting article that compared many AI tools last year",
              "By asking the chatbot itself what its minimum age is today",
              "By assuming it is 13, because that is the case for every tool",
            ],
            correctIndex: 0,
            explanation:
              "Age rules vary and change, so the service's own current terms are the reliable source. Articles age quickly, chatbots can be wrong about their own policies, and 13 is common but not universal.",
          },
          {
            question: "Which family rule is most likely to keep your child safe over time?",
            options: [
              "Show a grown-up anything odd, and you won't be in trouble",
              "Anyone who breaks an AI rule loses their tablet for a week",
              "Only use AI tools when a parent is sitting right beside you",
              "Never use any AI at all until you are at least sixteen years",
            ],
            correctIndex: 0,
            explanation:
              "Children who fear punishment tend to hide problems. A rule that invites them to report worrying content without automatic penalties keeps communication open, which protects them better than harsh sanctions.",
          },
          {
            question: "You find a chatbot setting that allows conversations to be used to improve the service. What is the audit's purpose here?",
            options: [
              "Note it and decide whether to switch it off where possible",
              "Delete the tool, because any data use makes it unsafe",
              "Ignore it, because children's chats are never used this way",
              "Ask the chatbot whether it is safe to leave the setting on",
            ],
            correctIndex: 0,
            explanation:
              "The audit is about making informed decisions. Some services let you opt out of training use, so note the setting and choose. Deleting everything or assuming it never happens are both uninformed reactions.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Your seven-year-old asks, 'Is the chatbot alive?' Which answer is accurate and suits their age?",
        options: [
          "No, it's a program that guesses words and has no feelings",
          "Sort of, it thinks like us but it lives inside the computer",
          "Yes, it is a friendly robot that enjoys helping children",
          "Nobody knows yet, so it is best to be polite just in case",
        ],
        correctIndex: 0,
        explanation:
          "A chatbot is a program that predicts words and has no feelings. Being polite is fine, but telling a child it might be alive or thinks like us gives them a false picture that makes over-trust more likely.",
      },
      {
        question: "Your 12-year-old uses a chatbot for a history project and it gives a quote from a famous person. What should they do?",
        options: [
          "Use it, because chatbots are trained on real historical texts",
          "Find the quote in a trusted source before using it anywhere",
          "Use it, but add a note that the chatbot provided the quote",
          "Ask the chatbot for the page number and then use the quote",
        ],
        correctIndex: 1,
        explanation:
          "Chatbots can invent quotes that sound authentic, and can invent page numbers too. The only safe approach is to verify the quote in a trusted source. Crediting the chatbot does not make a made-up quote true.",
      },
      {
        question: "Which place do most children meet AI without realising it?",
        options: [
          "Recommendation feeds that choose the next video or post",
          "Robot toys that walk around and talk in a robotic voice",
          "School computers that mark every test automatically now",
          "Calculators that work out sums in maths lessons at school",
        ],
        correctIndex: 0,
        explanation:
          "Feeds on video and social apps use AI to decide what to show, and this is the AI children meet most, yet it is rarely called AI. Calculators are not AI, and the other options are far less common.",
      },
      {
        question: "Your teenager has started chatting every night to an AI 'friend' app. What is the most useful first step?",
        options: [
          "Delete the app immediately and change the device password",
          "Ask calmly what they like about it and what it talks about",
          "Leave it alone, since talking to AI is harmless for teens",
          "Read all their chats in secret to check what is being said",
        ],
        correctIndex: 1,
        explanation:
          "A calm, curious conversation tells you what need the app is meeting and keeps your teen talking to you. Instant bans and secret monitoring tend to push the behaviour out of sight, and assuming it is harmless ignores real risks.",
      },
      {
        question: "Two children use AI for the same fractions homework. One asks for answers; one asks to be questioned step by step. What explains the difference in learning?",
        options: [
          "Who is doing the thinking during the homework task",
          "Which AI tool each child has decided to use for it",
          "How long each child spends typing in their question",
          "Whether each child had a paid or free chatbot account",
        ],
        correctIndex: 0,
        explanation:
          "The effort test: learning comes from the child doing the thinking. Asking to be questioned keeps the effort with the child. The tool, its price and the typing time matter far less than the instruction given.",
      },
      {
        question: "Which is the strongest use of AI for a shy child who struggles in class?",
        options: [
          "Asking privately the basic questions they avoid in class",
          "Letting it complete the class worksheets so they keep up",
          "Having it write answers they can then read out in class",
          "Using it instead of speaking to the teacher about problems",
        ],
        correctIndex: 0,
        explanation:
          "A private tool lets a shy child ask questions without embarrassment, which builds understanding. Doing the work for them or replacing the teacher removes learning and hides problems the school should know about.",
      },
      {
        question: "You are filling in the family AI audit. What belongs in the 'Age in the terms' column?",
        options: [
          "What the tool's own current terms say about minimum age",
          "The age at which most children start to use that tool",
          "The age you personally feel is right for using the tool",
          "The age suggested by other parents in the school group",
        ],
        correctIndex: 0,
        explanation:
          "The column records the service's own rule, taken from its current terms. Your family decision can be stricter, but you need the official starting point first, and other parents' views are not a source.",
      },
      {
        question: "A parent says, 'Children's privacy laws mean AI apps are automatically safe for kids.' What is the problem with this?",
        options: [
          "Laws set expectations, but you still need to check each tool",
          "Privacy laws only apply to adults and not to any children",
          "There are no laws anywhere about children's data online",
          "Laws make apps safe, so the statement is completely right",
        ],
        correctIndex: 0,
        explanation:
          "Laws such as COPPA in the US and the UK's Age Appropriate Design Code set expectations for handling children's data, but they do not make every tool suitable. Checking settings and terms is still your job.",
      },
      {
        question: "Your child's reading of an AI explanation leaves them saying 'easy'. Next day they cannot do a similar question. Why?",
        options: [
          "Reading a clear explanation felt like learning but was not",
          "The AI gave a wrong explanation that confused them later",
          "They need a newer AI tool that explains things more clearly",
          "The question the next day was far harder than the first one",
        ],
        correctIndex: 0,
        explanation:
          "Following a clear explanation creates a feeling of understanding without the practice that makes it stick. Asking the child to explain it back or try a fresh problem straight away shows whether they really learned it.",
      },
      {
        question: "Which setting is most worth checking first on a smart speaker your five-year-old talks to?",
        options: [
          "Voice history storage and whether it can make purchases",
          "Which voice and accent the speaker uses when replying",
          "How loud the speaker plays music in the child's bedroom",
          "Whether it can tell jokes suitable for young children",
        ],
        correctIndex: 0,
        explanation:
          "For voice assistants the important questions are what is recorded and stored, and whether a child can buy things. Voice, volume and jokes are preferences, not safety settings.",
      },
      {
        question: "Your 10-year-old wants to upload a photo of a classmate to an app that makes cartoon avatars. What is the key issue to discuss?",
        options: [
          "It is someone else's photo, used without their permission",
          "Cartoon avatars can look a little odd and not very good",
          "The app might run slowly when uploading a large photograph",
          "The classmate may want a different cartoon style instead",
        ],
        correctIndex: 0,
        explanation:
          "Uploading another child's photo shares their image with a service without consent, and some tools can make realistic fakes. The image quality and style are minor compared to privacy and consent.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 2
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "AI as a Learning Partner, Not an Answer Machine",
    summary:
      "Turn a chatbot into a patient tutor that asks questions instead of handing over answers, help with homework while keeping the work your child's own, pitch explanations at the right level for their age and subject, and build practice routines that make learning stick.",
    lessons: [
      {
        title: "The tutor, not the answer key",
        objective: "Write a tutor prompt that makes an AI tool ask your child questions and give hints instead of answers.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Why the default is a problem

Ask a chatbot a question and its default is to answer it, fully and politely. For an adult looking something up, that is ideal. For a child trying to learn, it is often the worst thing it could do, because the answer arrives before the thinking happens.

The fix is simple: **tell the tool to behave like a tutor**. Good tutors rarely give answers. They ask questions that lead the learner one step further, give a small hint when the learner is stuck, and let them feel the moment of working it out. This way of teaching through questions is often called the Socratic method, after the Greek philosopher Socrates, who taught by asking rather than telling.

AI tools follow instructions well. Give one a clear tutor role and it will usually stick to it.

## What makes a good tutor prompt

A strong tutor prompt tells the tool five things:

1. **Who the learner is**: age, school year, and what they already know.
2. **The rule**: do not give the answer or do the work.
3. **The method**: ask one question at a time and wait for the reply.
4. **What to do when they are stuck**: give a small hint, then a bigger one, never the full solution.
5. **How to finish**: ask the child to explain the idea back, or try one similar problem alone.

"One question at a time" is important. Without it, many tools ask five questions in one message, which overwhelms a child.

## A tutor prompt you can use tonight

\`\`\`try
You are a patient, encouraging tutor for my child, who is [CHILD'S AGE] and in [SCHOOL YEAR]. They are working on [TOPIC].

Rules:
- Never give the final answer or do the work for them.
- Ask one short question at a time, then wait for their reply.
- If they are stuck, give a small hint. If still stuck, a slightly bigger hint.
- If they make a mistake, do not say the right answer. Ask a question that helps them notice it.
- Use simple words and short sentences suitable for their age.
- When they solve it, ask them to explain in their own words how they did it, then give them one similar problem to try alone.

Their problem is: [PASTE THE PROBLEM OR QUESTION].
\`\`\`

Save this prompt somewhere easy to find. Many chatbots let you save instructions or create a custom assistant, so you do not have to paste it every time. Check what your tool offers.

## What it looks like in practice

Imagine a nine-year-old stuck on "A bag holds 6 apples. How many bags do you need for 45 apples?"

With the tutor prompt, the conversation might go:

- **Tutor:** How many apples fit in one bag?
- **Child:** 6.
- **Tutor:** Good. If you had 4 bags, how many apples could you carry?
- **Child:** 24.
- **Tutor:** And 7 bags?
- **Child:** 42... so 7 bags isn't enough!
- **Tutor:** Why not?
- **Child:** Because there are 3 left over. So 8 bags.

The child did every step. The tutor only asked. That is the whole idea.

## When it goes off track

Tools do not always follow instructions perfectly, and children are inventive. Watch for:

- **The tool gives in.** If your child says "just tell me", some tools will. Add a line: "If they ask for the answer, kindly say no and give a hint instead."
- **Hints that are really answers.** If a "hint" solves most of the problem, ask for smaller hints.
- **Too much text.** Add "keep every reply under three sentences".
- **Wrong maths.** Tools can still make arithmetic mistakes. Sit nearby for the first few sessions and check.

## Try it now

Choose one problem from your child's current homework or a topic they are learning.

1. Fill in the brackets in the tutor prompt and run it in the practice pad or your family's chosen chatbot.
2. Let your child answer the questions. Your job is only to watch and encourage.
3. Afterwards, ask them: "Did it tell you the answer?" and "Could you do another one now?"

You are done when your child has worked through one problem with the tutor and then solved a similar problem without any help.`,
        microCheck: [
          {
            question: "Why does a good tutor prompt say 'ask one question at a time'?",
            options: [
              "Several questions at once can overwhelm a young learner",
              "Chatbots can only process one question in each message",
              "It makes the chatbot give the final answer more quickly",
              "It uses fewer words, so the free plan lasts much longer",
            ],
            correctIndex: 0,
            explanation:
              "Without this instruction many tools fire off a list of questions, which is too much for a child to handle. It has nothing to do with technical limits or speed of reaching the answer.",
          },
          {
            question: "Your child types 'just tell me the answer' and the tutor chatbot does. How should you adjust the prompt?",
            options: [
              "Add a line telling it to decline kindly and give a hint",
              "Switch to another chatbot that is known to be stricter",
              "Remove the tutor rules, since the child clearly needs help",
              "Tell your child they are no longer allowed to use the tool",
            ],
            correctIndex: 0,
            explanation:
              "Tools follow clear instructions, so adding an explicit rule for this situation usually fixes it. Switching tools or banning use skips the easy fix, and dropping the rules turns the tutor back into an answer key.",
          },
          {
            question: "In the tutor approach, what should happen when the child makes a mistake?",
            options: [
              "The tool corrects it at once so the error is not learned",
              "The tool asks a question that helps them notice the error",
              "The tool ignores it and moves on to the following step",
              "The tool restarts the whole problem from the beginning",
            ],
            correctIndex: 1,
            explanation:
              "Noticing and fixing their own mistake is powerful learning. A question that points to the error keeps the thinking with the child, while an instant correction does the thinking for them.",
          },
          {
            question: "What is the best way to end a tutoring session so you know learning happened?",
            options: [
              "Ask the tool to give a full model answer for comparison",
              "Ask the child to explain how they did it and try a new one",
              "Ask the child whether they enjoyed the tutoring session",
              "Ask the tool to rate how well the child did out of ten",
            ],
            correctIndex: 1,
            explanation:
              "Explaining the method and solving a fresh problem alone are direct evidence of learning. Enjoyment and a score from the tool are nice but do not show the child can now do it independently.",
          },
          {
            question: "The tutor's 'hint' for a word problem sets out almost every step of the working. What is the issue?",
            options: [
              "The hint is really an answer, so ask for smaller hints",
              "The hint is fine, because the child still writes it out",
              "The hint is too short and should include every last step",
              "The hint should have been given before any questions",
            ],
            correctIndex: 0,
            explanation:
              "A hint that lays out the working removes the thinking just as surely as giving the answer. Asking the tool for smaller, one-step hints keeps the child doing the work.",
          },
        ],
      },
      {
        title: "Homework help that keeps the work theirs",
        objective: "Use four homework patterns (explain, hint, check and quiz) that help your child without doing the work, and check your school's AI policy.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## The line that matters

The question schools, teachers and parents all care about is the same: **whose work is this?** Homework exists so the teacher can see what the child can do, and so the child can practise. If AI writes the answers, both purposes fail. The teacher sees a false picture, and the child misses the practice.

Most children do not set out to cheat. They get stuck, feel frustrated, and the tool is right there. Your role is to give them better options than "do it for me", so that AI becomes a helper they can use honestly.

## Four patterns that keep the work theirs

**1. Explain.** When a child does not understand the task or the idea behind it.

\`\`\`try
I am [CHILD'S AGE] and my homework is about [TOPIC]. I don't understand [THE BIT THEY ARE STUCK ON]. Explain the idea simply with one everyday example. Do not do my homework questions for me.
\`\`\`

**2. Hint.** When they understand the idea but are stuck on a specific question. Use the tutor prompt from the last lesson, or a short version: "Give me one hint for this question, not the answer."

**3. Check.** When they have finished and want feedback. The key is asking the tool to *point to* problems, not fix them.

\`\`\`try
Here is my finished answer to a homework question for [SUBJECT], year [SCHOOL YEAR]. Do not rewrite it. Tell me whether any step or sentence is wrong or unclear, and ask me a question that helps me fix it myself.

Question: [QUESTION]
My answer: [CHILD'S ANSWER]
\`\`\`

**4. Quiz.** Before a test, or after homework to make it stick. "Ask me five questions on [TOPIC], one at a time, and tell me after each one whether I was right."

A good sequence for a tricky piece of homework is: try it alone first, then explain or hint when stuck, then check at the end. The tool comes in only where it is needed.

## What to avoid

Some requests almost always cross the line:

- "Write my essay / paragraph / story about..."
- "Solve these questions" with the whole worksheet pasted in.
- "Rewrite this so it sounds better" (the result is no longer their writing).
- Photo-solving apps used to copy answers straight into the book.

A quick rule of thumb for children: **if you could not explain every word or step to your teacher, it is not your work yet.**

## What does your school say?

Schools differ a lot. Some ban AI for homework entirely. Some allow it for research or checking but not for writing. Some set tasks where using AI is part of the lesson. Policies are also changing quickly as schools work out their approach.

So check, rather than guess:

- Look on the school website or in the homework policy for anything about AI or "generative AI".
- Ask your child's teacher: "Is it OK for them to use AI to explain things or check their work? Should they say when they have?"
- For older students, check whether coursework or exam boards have their own rules, which are often stricter.

If the school allows some AI use, it may ask students to say how they used it. Encourage your child to be open. "I asked a chatbot to explain photosynthesis, then wrote this myself" is honest and usually fine.

## When you are the one who is stuck

Sometimes the homework is beyond what you remember. The same patterns work for you. Ask the tool to explain the method to *you*, so you can then help your child with questions rather than answers. Just remember to check anything important, since the tool can be wrong.

## Try it now

Next time your child has homework, sit with them for the first ten minutes.

1. Ask them to try one question on their own first.
2. When they get stuck, use the explain or hint pattern together.
3. When they finish, run the check prompt on one answer and let them fix it.
4. This week, find your school's AI policy or ask the teacher one question about it.

You are done when your child has used at least two of the four patterns on real homework, and you know what the school's current position on AI is.`,
        microCheck: [
          {
            question: "Your child asks a chatbot to 'make this paragraph sound better' and hands in the result. What is the problem?",
            options: [
              "It is no longer their writing, so it is not their work",
              "Chatbots are not very good at improving paragraph style",
              "The paragraph will be too long for the homework set",
              "Teachers prefer paragraphs that have a few mistakes in",
            ],
            correctIndex: 0,
            explanation:
              "A rewritten paragraph shows the tool's writing, not the child's. The check pattern avoids this: the tool points out what is unclear and the child does the rewriting.",
          },
          {
            question: "Which request best fits the 'check' pattern?",
            options: [
              "Rewrite my answer so that it gets top marks from my teacher",
              "Point out any unclear step and ask me a question to fix it",
              "Write your own answer so I can compare it against mine",
              "Tell me the correct answer so I can see whether I am right",
            ],
            correctIndex: 1,
            explanation:
              "The check pattern asks the tool to point to problems without fixing them, keeping the correction work with the child. Rewrites, model answers and correct answers all hand over the thinking.",
          },
          {
            question: "You are not sure if your child's school allows AI for homework. What is the best step?",
            options: [
              "Assume it is allowed unless a teacher says otherwise",
              "Assume it is banned, since most schools forbid it outright",
              "Check the school's policy or ask the teacher directly",
              "Ask the chatbot what schools usually allow for homework",
            ],
            correctIndex: 2,
            explanation:
              "School policies vary widely and are changing, so the only reliable answer comes from the school itself. Assuming either way, or asking a chatbot about general practice, can lead your child into trouble.",
          },
          {
            question: "Which rule of thumb helps a child decide whether work is really theirs?",
            options: [
              "If a chatbot wrote under half of it, then it is your work",
              "If you could explain every step to your teacher, it is yours",
              "If you typed it out yourself, then it counts as your work",
              "If nobody would ever notice, then it is your own work",
            ],
            correctIndex: 1,
            explanation:
              "Being able to explain every word or step shows real understanding and ownership. Retyping, percentages and the chance of being noticed say nothing about whether the child actually did the thinking.",
          },
          {
            question: "Your school allows AI for explanations but asks students to say when they used it. What should your child write?",
            options: [
              "Nothing, because explaining is not the same as writing",
              "A short, honest note about how they used the AI tool",
              "Only the name of the tool, without saying what it did",
              "A note only if the teacher asks about it later on",
            ],
            correctIndex: 1,
            explanation:
              "When a school asks for disclosure, a brief honest note such as 'I used a chatbot to explain the idea, then wrote this myself' meets the rule and builds good habits. Staying silent or vague does not.",
          },
        ],
      },
      {
        title: "Explaining at their level",
        objective: "Adapt AI explanations for your child's age and subject, and check that an explanation is both right and understood.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## The same idea, many levels

One of AI's genuine strengths is that it can explain the same idea in many different ways. The trick is telling it who the explanation is for. "Explain fractions" gets a generic answer. "Explain fractions to a seven-year-old who loves pizza, in four sentences" gets something your child can actually use.

Three things make the biggest difference:

- **Age and year group.** This sets the vocabulary and the level of detail.
- **What they already know.** "They know halves and quarters but not how to add fractions."
- **An interest.** An example drawn from football, horses, Minecraft, cooking or music makes an abstract idea concrete.

You can also ask for a specific format: a short story, a step-by-step list, a comparison, or a question to start them thinking.

Taking the interest idea further is the heart of the TIBLOGICS In-Story approach, which you will meet in Module 3. Instead of one example, your child learns the concept inside a personalised story built around their own interests and world, where the concept is what moves the story forward, followed by practice.

## Reading and writing

- **Ages 5 to 7:** Use AI to make short, simple texts on your child's interests, pitched at their reading level. "Write five short sentences about a dog at the beach, using simple words a beginning reader can sound out." Read them together. You are the phonics check: if a word does not fit what they are learning, swap it.
- **Ages 8 to 11:** Ask for a short passage and three questions about it, with one question that asks "why do you think...". Or ask the tool to explain what a word means with two example sentences.
- **Ages 12 and over:** Use AI to question their understanding of a set text, not to summarise it. "Ask me three questions about chapter 4 of [BOOK] that check I understood why the character acted as they did." Be aware that tools can get details of specific books wrong.

## Maths

Maths is where AI explanations help most and where errors are most common. Tools can make arithmetic slips or use a different method from the one your child's school teaches.

- Ask for the explanation in the **same method** the school uses: "Explain column subtraction the way UK primary schools teach it" or "using a number line".
- Ask for a **picture in words**: "Describe how to draw this so I can see why it works."
- **Check the numbers.** Work the example through yourself or with a calculator. If it gets one wrong, show your child. That is a lesson in itself.

## Science

Science explanations benefit from everyday comparisons: electricity as water in pipes, cells as a factory. Comparisons help, but every comparison breaks somewhere. Ask the tool to say where:

\`\`\`try
Explain [SCIENCE TOPIC] to a [CHILD'S AGE]-year-old who loves [INTEREST]. Use one comparison from their interest. Keep it under 120 words. Then say, in one sentence, where the comparison stops being accurate. Finish with one question to check they understood.
\`\`\`

## Languages

AI can be a patient conversation partner for a child learning another language.

- "Have a simple conversation with me in French about my pets. Use only present tense. Correct one mistake at a time and explain it in English."
- "Give me ten Spanish words for things in a kitchen, then quiz me."

Pronunciation is harder to judge in text. Use voice features only where the tool and its settings suit your child's age, and check with the teacher or course materials when something seems off.

## Is it right, and did they get it?

Two checks for every explanation:

**Is it right?** For facts and methods that matter, compare with the textbook, the school's materials or a trusted site. Be especially careful with dates, names, numbers and anything about a specific book or local syllabus.

**Did they get it?** The "explain it back" test is the most reliable check you have. Ask your child to teach the idea to you, a younger sibling or a toy. Where they get muddled is where to focus next.

## Try it now

Pick one idea your child is currently finding hard, in any subject.

1. Run the prompt above (or adapt it for maths, reading or languages), filling in their age and an interest.
2. Read the result together. Check any facts or numbers against their school materials.
3. Ask your child to explain the idea back to you in their own words, as if you were the student.

You are done when your child can explain the idea back without looking, and you have checked the AI's explanation against at least one trusted source.`,
        microCheck: [
          {
            question: "You ask a chatbot to 'explain fractions' and the answer is too complex for your seven-year-old. What would help most?",
            options: [
              "Give their age, what they know and an interest to use",
              "Ask the same question again and hope for a simpler reply",
              "Switch to a chatbot designed specifically for older users",
              "Ask it to explain fractions using more technical detail",
            ],
            correctIndex: 0,
            explanation:
              "Telling the tool who the explanation is for (age, prior knowledge and an interest) is what changes the level. Repeating the same vague request or switching tools rarely fixes a missing audience.",
          },
          {
            question: "An AI tool explains subtraction using a method different from the one your child's school teaches. What is sensible?",
            options: [
              "Ask it to explain using the method the school teaches",
              "Keep the AI's method, since any correct method is fine",
              "Stop using AI for maths, because it cannot follow methods",
              "Tell the teacher the school method is out of date now",
            ],
            correctIndex: 0,
            explanation:
              "Two methods at once can confuse a child. Asking the tool to use the school's method keeps things consistent. AI can follow a named method well when asked, so there is no need to abandon it.",
          },
          {
            question: "Why ask the AI to say where its science comparison stops being accurate?",
            options: [
              "Every comparison breaks somewhere, and knowing where avoids myths",
              "Doing so makes the explanation long enough for older children",
              "Chatbots will only give comparisons if you ask them to check",
              "Teachers mark answers down if they include any comparisons",
            ],
            correctIndex: 0,
            explanation:
              "Comparisons such as 'electricity is like water in pipes' help, but taken too far they create misconceptions. Knowing the limit keeps the helpful part and avoids the wrong one.",
          },
          {
            question: "What is the most reliable way to find out whether your child understood an explanation?",
            options: [
              "Ask whether it made sense to them and trust their answer",
              "Ask them to teach the idea back to you in their own words",
              "Check that the explanation used simple words for their age",
              "Ask the chatbot whether it thinks they have understood it",
            ],
            correctIndex: 1,
            explanation:
              "Explaining it back reveals exactly where understanding is solid and where it is muddled. Children often say they understand when they do not, and the chatbot cannot see inside their head.",
          },
        ],
      },
      {
        title: "Practice that sticks",
        objective: "Set up a short, repeating practice routine with AI-made quizzes and flashcards that spaces practice over days and makes mistakes feel safe.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Why practice matters more than explanation

A great explanation gets an idea into your child's head. Practice is what keeps it there. Two well-established ideas from learning science are worth knowing, and neither needs any technology:

- **Retrieval practice**: pulling something *out* of memory (answering a question, recalling a fact) strengthens it far more than reading it again.
- **Spaced practice**: coming back to the same material over several days, with gaps, works better than doing it all in one long session.

AI is useful here because it can produce unlimited practice at the right level, on exactly the topic your child needs, whenever you want it.

## Quizzes

The simplest form of retrieval practice is a short quiz. Keep it short, mix easy and harder questions, and go one question at a time so your child has to think before seeing the answer.

\`\`\`try
Quiz my child on [TOPIC]. They are [CHILD'S AGE] and in [SCHOOL YEAR]. Ask 5 questions, one at a time, and wait for each answer. Start easy and get slightly harder. After each answer, say whether it is right in one short sentence and, if it is wrong, give a hint and let them try again before explaining. At the end, tell us which question to practise again tomorrow.
\`\`\`

The last line matters: it gives you a starting point for the next session.

## Flashcards

Flashcards are good for facts that need to be memorised: times tables, vocabulary, key dates, science terms.

Ask the tool: "Make 12 flashcards on [TOPIC] for a [CHILD'S AGE]-year-old. Format each as Front: ... / Back: ..." Then either copy them onto paper cards or into a flashcard app. Check them before use, especially dates and definitions. A wrong flashcard, practised often, teaches the wrong thing very well.

Paper cards have a real advantage for younger children: they are physical, screen-free, and you can sort them into "know it" and "not yet" piles.

## A simple spacing plan

You do not need a complicated system. A pattern like this works for most families:

| Day | What to do | Time |
|---|---|---|
| Day 1 | Learn or revise the topic; short quiz | 10 minutes |
| Day 2 | Quiz again, focusing on what was missed | 5 minutes |
| Day 4 | Quick quiz, mixed with an older topic | 5 minutes |
| Day 7 | Final quick quiz on the week's topics | 5 minutes |

**Mixing** older topics into newer quizzes is useful: it makes your child decide which method or fact applies, which is closer to how tests and real life work.

## Making mistakes safe

Practice only works if your child is willing to get things wrong. Many children, especially anxious or perfectionist ones, avoid practice because mistakes feel bad.

Some ways to lower the stakes:

- **Call it "practice", not "a test".** No marks, no records.
- **Celebrate good mistakes.** "Great, now we know what to practise." A wrong answer found at home is one that will not surprise them at school.
- **Let them quiz you.** Children love catching a parent out, and it shows mistakes are normal.
- **Ask the AI to be kind.** Add "be encouraging, and treat mistakes as useful" to your prompts. Check the tone suits your child: some find over-the-top praise irritating.

## Keeping AI practice in proportion

Short, regular practice beats long sessions. Five to ten minutes is plenty for most ages. Keep an eye on screen time, and mix AI-generated practice with paper, spoken quizzes in the car, and real-world practice like measuring ingredients or reading signs.

## Try it now

Choose one topic your child needs to remember in the next week or two.

1. Run the quiz prompt tonight for five to ten minutes.
2. Write down the question it suggests practising again.
3. Put Day 2, Day 4 and Day 7 reminders in your calendar.

You are done when you have completed the first quiz, noted what to practise next, and scheduled the next three short sessions.`,
        microCheck: [
          {
            question: "Your child re-reads their science notes three times the night before a test. What would likely help more?",
            options: [
              "Short quizzes that make them recall facts over several days",
              "Reading the notes a fourth time, but slowly and more carefully",
              "Asking the AI to write a fresh summary of all of the notes",
              "Highlighting the most important lines in bright colours",
            ],
            correctIndex: 0,
            explanation:
              "Retrieval practice (recalling from memory) and spacing sessions out both strengthen memory more than re-reading. A new summary or highlighting is still passive review.",
          },
          {
            question: "An AI tool makes 20 history flashcards for your child. What should you do before they use them?",
            options: [
              "Check the dates and definitions, as errors get memorised",
              "Nothing, since flashcards are too simple to contain errors",
              "Ask the AI to double-check its own cards and trust the reply",
              "Cut the set to ten cards, since twenty is too many to learn",
            ],
            correctIndex: 0,
            explanation:
              "A wrong flashcard practised often teaches the wrong fact very effectively. Checking against school materials is essential, and asking the same tool to check itself is not a reliable safeguard.",
          },
          {
            question: "Why mix older topics into a new quiz?",
            options: [
              "It makes the quiz longer, which is better for memory",
              "It makes children choose which method or fact applies",
              "It stops the AI from repeating any of the same questions",
              "It helps children finish the quiz in a shorter time",
            ],
            correctIndex: 1,
            explanation:
              "Mixing topics means the child has to recognise which idea fits each question, which is closer to real tests and use. Length alone does not help, and speed is not the goal.",
          },
          {
            question: "Your child avoids practice because getting answers wrong upsets them. What is the most helpful approach?",
            options: [
              "Only give them easy questions so they never get any wrong",
              "Frame it as practice and treat mistakes as useful clues",
              "Give a reward for every answer they manage to get right",
              "Skip practice and rely on the explanations they have read",
            ],
            correctIndex: 1,
            explanation:
              "Lowering the stakes and treating mistakes as information keeps an anxious child practising. Only easy questions teach little, and rewarding only correct answers can make mistakes feel even worse.",
          },
          {
            question: "Which practice plan follows the spacing idea best?",
            options: [
              "One ninety-minute session on the weekend before the test",
              "Five-minute quizzes on days 1, 2, 4 and 7 of the week",
              "Thirty minutes every evening on the same set of questions",
              "A single long quiz straight after the lesson is taught",
            ],
            correctIndex: 1,
            explanation:
              "Spaced practice means short sessions with gaps that grow over time. One long session, or identical daily drilling, gives less lasting benefit for the same effort.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Your 10-year-old pastes a whole maths worksheet into a chatbot and asks it to 'solve these'. What should you suggest instead?",
        options: [
          "Try one alone first, then use a tutor prompt when stuck",
          "Ask the chatbot to show its working so they can copy it",
          "Solve them all with the chatbot, then check the answers",
          "Use a photo-solving app, which is usually more accurate",
        ],
        correctIndex: 0,
        explanation:
          "Attempting alone first, then getting questions and hints from a tutor prompt, keeps the thinking with the child. Copying working or using a photo-solver still hands over the thinking, however accurate it is.",
      },
      {
        question: "Which instruction does most to turn a chatbot into a tutor rather than an answer key?",
        options: [
          "Do not give the answer; ask one question at a time instead",
          "Please explain every single step of the answer very fully",
          "Use friendly language and plenty of emojis for my child",
          "Give the answer first, then explain how you got to it",
        ],
        correctIndex: 0,
        explanation:
          "The core of a tutor prompt is withholding the answer and asking questions one at a time. Full explanations and answer-first approaches do the thinking for the child, and a friendly tone alone changes nothing.",
      },
      {
        question: "Your child's tutor chatbot keeps writing long paragraphs that your eight-year-old will not read. What is the quickest fix?",
        options: [
          "Add 'keep every reply under three sentences' to the prompt",
          "Read each reply aloud yourself and then summarise it for them",
          "Switch to a different chatbot that writes shorter replies",
          "Ask your child to try harder to read all of the replies",
        ],
        correctIndex: 0,
        explanation:
          "Chatbots follow length instructions well, so adding a clear limit usually solves it in seconds. Summarising yourself or switching tools works around the problem instead of fixing the prompt.",
      },
      {
        question: "Your teenager wants to use AI to 'check' an essay. Which request keeps the work theirs?",
        options: [
          "Point out unclear sentences and let me fix them myself",
          "Rewrite the weak paragraphs so the whole thing flows well",
          "Correct every error and send back a fully polished version",
          "Write a better conclusion that I can use in place of mine",
        ],
        correctIndex: 0,
        explanation:
          "Asking the tool to point to problems while the student does the fixing keeps the writing theirs. Rewrites, full corrections and replacement paragraphs all put the tool's words in the essay.",
      },
      {
        question: "A parent says, 'The school hasn't mentioned AI, so anything goes.' What is the better view?",
        options: [
          "Ask the teacher, as policies vary and may not be obvious",
          "Assume a full ban, as that is what most schools have now",
          "Anything goes until the school sends home a written policy",
          "Only coursework has rules; normal homework never does",
        ],
        correctIndex: 0,
        explanation:
          "School positions on AI vary and change, and may sit in a policy the parent has not seen. Asking the teacher directly is the reliable route. Assuming either extreme can get the child into trouble.",
      },
      {
        question: "An AI explanation of photosynthesis for your 11-year-old uses a factory comparison. What makes it most useful?",
        options: [
          "Also asking where the comparison stops being accurate",
          "Making the comparison longer, with many more details",
          "Replacing it with the exact wording of the textbook",
          "Asking for three more comparisons to go with the first",
        ],
        correctIndex: 0,
        explanation:
          "Every comparison breaks somewhere. Knowing where helps your child keep the useful picture without picking up a misconception. More comparisons or more detail do not address that risk.",
      },
      {
        question: "Your child learns French with a chatbot conversation partner. What is a sensible instruction to include?",
        options: [
          "Correct one mistake at a time and explain it in English",
          "Correct every single mistake in each of my messages",
          "Never correct mistakes, so the chat feels more natural",
          "Only reply in English so that I can follow along easily",
        ],
        correctIndex: 0,
        explanation:
          "One correction at a time, explained clearly, is manageable and keeps the child talking. Correcting everything overwhelms them, never correcting teaches nothing, and replying in English defeats the purpose.",
      },
      {
        question: "Your child says 'I get it' after an AI explanation of long division. How do you check?",
        options: [
          "Ask them to teach you the method using a new example",
          "Ask the AI to give them a score for their understanding",
          "Read the explanation again together just to make sure",
          "Trust them, since children know when they understand",
        ],
        correctIndex: 0,
        explanation:
          "Teaching the method back on a fresh example shows whether the understanding is real. Re-reading feels like learning without testing it, and the AI cannot see what your child understands.",
      },
      {
        question: "You plan revision for a spelling test next Friday. Which approach uses spaced practice?",
        options: [
          "Short quizzes on Saturday, Sunday, Tuesday and Thursday",
          "One long session on Thursday evening before the test",
          "Writing each word out twenty times on Saturday morning",
          "Reading through the list once a night without a quiz",
        ],
        correctIndex: 0,
        explanation:
          "Spaced practice spreads short recall sessions over several days. A single long session or repeated copying is less effective, and reading the list without testing is not retrieval practice.",
      },
      {
        question: "Your child gets several quiz questions wrong and looks upset. What response best supports learning?",
        options: [
          "Say mistakes show what to practise, and plan a short retry",
          "Say it does not matter and stop quizzing that topic now",
          "Point out how many other children would get them right",
          "Give them the right answers so they feel better at once",
        ],
        correctIndex: 0,
        explanation:
          "Treating mistakes as useful information and planning another go keeps practice safe and productive. Abandoning the topic or comparing them with others both undermine the learning.",
      },
      {
        question: "You are helping with homework in a topic you have forgotten. What is the best use of AI?",
        options: [
          "Ask it to explain the method to you, then question your child",
          "Ask it to answer the questions so you can check theirs fast",
          "Let your child use it alone, since you cannot help anyway",
          "Ask it for the answers and explain them to your child",
        ],
        correctIndex: 0,
        explanation:
          "Refreshing your own understanding lets you guide your child with questions rather than answers. Getting the answers yourself still hands over the child's thinking, and stepping back leaves them unsupported.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 3
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Learning Through Stories: the In-Story Approach",
    summary:
      "Use the TIBLOGICS In-Story approach at home: build a personalised story around your child's interests where one concept moves the plot forward, follow it with practice, check the facts, and let your child steer the story and explain the concept back.",
    lessons: [
      {
        title: "Why stories help learning stick",
        objective: "Explain why a story can make a concept more meaningful and memorable for your child, and what the TIBLOGICS In-Story approach adds.",
        durationMinutes: 20,
        contentType: "article",
        bodyMd: `## Children already learn through stories

Long before school, children learn from stories: fairy tales, family stories, films, games and the tales they invent while playing. Stories are one of the oldest ways people have passed on knowledge. You have almost certainly noticed that your child can retell the plot of a favourite film in detail, yet forget a list of spellings by Thursday.

That is not because they are careless. It is because a story and a list are very different things to remember.

## What a story gives a concept

A few things make stories helpful for learning. None of them is controversial, and you will recognise them from your own experience:

- **Meaning.** In a list, a fact just sits there. In a story, it matters: the hero needs to know how many days of water are left, so division suddenly has a purpose.
- **Order.** Stories have a beginning, middle and end, with one thing leading to the next. That chain of cause and effect gives a child a path to follow when they try to remember.
- **Memory hooks.** Characters, places and funny moments act as hooks. "Remember when the dragon miscounted the gold?" can bring back a whole idea.
- **Feelings.** Curiosity, suspense and a little humour make children pay attention and care what happens next.
- **Interest.** When a story is about things a child already loves, they lean in rather than switch off.

Stories are not magic. A story on its own does not guarantee learning, and a story full of errors can teach the wrong thing very memorably. Stories work best alongside the ideas from Module 2: explaining back, practising and checking.

## The TIBLOGICS In-Story approach

TIBLOGICS's founder created the In-Story Method, the idea behind the InStory learning platform. In this course we call it **the TIBLOGICS In-Story approach**. The core idea is simple:

1. The child learns a concept **inside a personalised story** that features their own interests and world: their pets, their favourite sport, their town, the game they love.
2. **The concept is what moves the story forward.** The characters cannot get past the locked gate, win the match or save the day until the concept is used. It is not a fact dropped into a story; it is the key to the plot.
3. The story is **followed by practice**, so the child uses the concept again outside the story.

The second point is what separates this from simply "making learning fun". Plenty of stories mention a fact in passing. In the In-Story approach, the child needs the concept for the story to continue, so understanding it becomes part of the adventure.

## Why AI makes this practical for parents

Writing a fresh, personalised story for every concept your child meets would take a parent hours. An AI chatbot can draft one in seconds, tuned to your child's age, interests and exactly the concept they are working on. Your job moves from author to editor and guide: choosing the concept, checking the facts, and making sure your child does the thinking at the key moment.

Here is a simple taste of it. Try it before the next lesson shows you the full template:

\`\`\`try
Write a very short story (about 150 words) for a [CHILD'S AGE]-year-old who loves [INTEREST]. The main character must use [CONCEPT] to solve a problem, and the story cannot continue until they do. Stop at that moment and ask the reader what the character should do. Do not give the answer.
\`\`\`

Notice the last instruction. The story pauses so your child can do the thinking, just like the tutor prompt in Module 2.

## Try it now

Tonight, ask your child to name three things they love right now (a character, an animal, a sport, a place). Write them down. Then choose one concept they are learning at school this week.

Run the prompt above with one interest and that concept, and read the story aloud together. When it pauses, let your child decide what the character should do.

You are done when you have a list of your child's current interests, one concept to work on, and your child has solved the story's problem themselves.`,
        microCheck: [
          {
            question: "Your child remembers every detail of a film plot but forgets spelling lists. What does this suggest?",
            options: [
              "Stories give meaning, order and hooks that lists do not",
              "Your child is not trying hard enough with the spellings",
              "Films are easier to remember because they are on screens",
              "Spelling lists are too long for children of any age now",
            ],
            correctIndex: 0,
            explanation:
              "Stories connect information through meaning, cause and effect, and memorable moments, which gives memory something to hold on to. It is about how the information is structured, not effort or screens.",
          },
          {
            question: "What most distinguishes the TIBLOGICS In-Story approach from just adding facts to a story?",
            options: [
              "The concept is what moves the story's plot forward",
              "The story is always illustrated with bright pictures",
              "The story is always at least two thousand words long",
              "The facts are listed at the end of the story as a recap",
            ],
            correctIndex: 0,
            explanation:
              "In the In-Story approach the characters need the concept to make progress, so understanding it is part of the adventure. Pictures, length and a recap list are not what defines it.",
          },
          {
            question: "Why does the In-Story approach include practice after the story?",
            options: [
              "Using the concept again outside the story helps it stick",
              "Practice is needed to check the AI wrote the story well",
              "Children get bored of stories unless tests come after them",
              "Practice gives parents a score to share with the school",
            ],
            correctIndex: 0,
            explanation:
              "The story gives the concept meaning; practice makes the child use it again in a new setting, which is what builds lasting skill. It is not about scores or checking the AI.",
          },
          {
            question: "A story teaches your child a wrong fact in a funny, memorable way. What is the lesson?",
            options: [
              "Stories make errors memorable too, so always check the facts",
              "Funny stories are a poor way to teach any school subject",
              "Children forget story errors quickly, so it does not matter",
              "Only stories written by teachers should be used at home",
            ],
            correctIndex: 0,
            explanation:
              "The same features that make stories memorable also make mistakes memorable. That is why checking the facts in any AI-written story is part of the approach, not an optional extra.",
          },
        ],
      },
      {
        title: "Building a personalised learning story",
        objective: "Build a personalised learning story with AI that combines your child's interests, one concept that drives the plot, a thinking pause and a practice moment.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Three ingredients

A learning story in the TIBLOGICS In-Story approach has three ingredients:

1. **Your child's interests and world.** Not a generic hero, but their favourite animal, sport, game, place or friend's name (with permission). The more it feels like *their* story, the more they lean in.
2. **One concept that drives the plot.** A single idea: equivalent fractions, the water cycle, using speech marks, why the Romans built roads. The story must *need* it to move forward.
3. **A practice moment.** After the story, a few questions or tasks where your child uses the concept again, first inside the story's world and then outside it.

Keep it to one concept. Two or three at once turns the story into a lesson with costumes on.

## Choosing the concept

The best concepts for a story are ones your child is learning right now and finds a little tricky. Ask their teacher, look at homework, or check the topic list many schools send home.

Phrase the concept precisely. "Maths" is too vague. "Adding fractions with different denominators" is precise enough for the AI to build a plot around it.

## The full template

This is the prompt to keep and reuse. Fill in every bracket:

\`\`\`try
You are helping me create a personalised learning story for my child.

About my child:
- Age: [CHILD'S AGE]. School year: [SCHOOL YEAR].
- Loves: [INTEREST 1], [INTEREST 2].
- Their world: [PET, TOWN, FAMILY DETAIL OR FAVOURITE PLACE, NOTHING PRIVATE].
- Reading level: [E.G. READS SHORT CHAPTER BOOKS / NEEDS SIMPLE SENTENCES].

The concept: [ONE PRECISE CONCEPT].
What they already know: [WHAT THEY CAN ALREADY DO].

Write a story of about [LENGTH, E.G. 300] words where:
1. The main character (based on my child) needs to use the concept to get past a problem, and the story cannot continue until they do.
2. The concept is explained naturally inside the story, accurately and at their level.
3. At the key moment, STOP and ask my child what the character should do. Do not give the answer. Wait for their reply.
4. After they reply, give a short hint if they are wrong, then finish the story.
5. Then give 3 practice questions: 2 set in the story's world and 1 in everyday life.

Keep the facts accurate. If anything in the story simplifies the concept, tell me (the parent) in one line at the end.
\`\`\`

## Why each line is there

- **Their world, nothing private.** A pet's name or a favourite park makes the story personal. Full names, school names, addresses and photos do not need to go into a chatbot, and should not.
- **What they already know.** This stops the story being too easy or too hard.
- **STOP and ask.** This is the thinking moment. Without it, the story explains the concept and your child just reads along.
- **Hint, then finish.** A wrong answer does not end the fun. It becomes part of the adventure.
- **Practice in and out of the story.** Using the concept in the story's world first feels safe. The everyday question checks they can use it anywhere.
- **Tell me what was simplified.** Stories for children often simplify. You want to know where, so you can correct it later if needed.

## A worked example (illustrative)

A parent fills in the template for an eight-year-old who loves football and her dog Biscuit, with the concept "halves and quarters of an amount".

The story that comes back might go like this: Biscuit has buried 12 dog treats around the football pitch, and the team captain (your child) must share them fairly before the big match. The coach says half go to the defenders and a quarter to the goalkeepers. The story stops: *"How many treats should the goalkeepers get?"*

Your child works it out, perhaps with coins or pasta on the table. If they say 6, the hint might ask, "Is a quarter bigger or smaller than a half?" Then the match goes ahead, and three practice questions follow, one about sharing 20 pizza slices at a real birthday party.

## Try it now

Tonight, fill in the full template for your child and one concept they are learning this week.

1. Read the story together and pause where the AI stops.
2. Let your child answer before the story continues.
3. Do the three practice questions together, with objects or paper if it helps.

You are done when your child has answered the story's key question themselves and completed all three practice questions, including the everyday one.`,
        microCheck: [
          {
            question: "You want a learning story about 'maths'. What should you change before running the template?",
            options: [
              "Name one precise concept, such as halves of an amount",
              "Add several maths topics so the story covers more ground",
              "Leave it broad so the AI can pick something interesting",
              "Ask for a much longer story so all of maths can fit in it",
            ],
            correctIndex: 0,
            explanation:
              "A story built around one precise concept can make that concept the key to the plot. Vague or multiple topics turn the story into a lesson in disguise and dilute the thinking moment.",
          },
          {
            question: "Why does the template tell the AI to STOP and ask your child what the character should do?",
            options: [
              "So your child does the thinking at the key moment",
              "So the story is split into shorter parts to read",
              "So the AI has more time to check its own answer",
              "So you can check the story before it is finished",
            ],
            correctIndex: 0,
            explanation:
              "The pause is where learning happens: the child applies the concept to move the story on. Without it, the story explains everything and the child just reads along passively.",
          },
          {
            question: "Which detail about your child is fine to include in a learning story prompt?",
            options: [
              "Their dog's name and that they love playing football",
              "Their full name, their school and the town they live in",
              "A photo of them and their friends at a recent birthday",
              "Their home address, so the story can be set on their road",
            ],
            correctIndex: 0,
            explanation:
              "Interests and a pet's name make a story personal without identifying your child. Full names, schools, addresses and photos are private details that do not need to go into a chatbot.",
          },
          {
            question: "Why does the template ask for practice questions both in the story's world and in everyday life?",
            options: [
              "The first feels safe; the second shows they can use it anywhere",
              "The first is for the parent and the second is for the teacher",
              "Chatbots write better questions when both types are requested",
              "Everyday questions are easier, so they build up confidence",
            ],
            correctIndex: 0,
            explanation:
              "Practising in the familiar story world builds confidence, and an everyday question checks the concept transfers beyond the story. Neither is about who marks it or which is easier.",
          },
          {
            question: "Your child answers the story's key question wrongly. What should happen, according to the template?",
            options: [
              "A short hint, then the story continues once they have it",
              "The story ends so they can start again from the beginning",
              "The AI gives the correct answer straight away and moves on",
              "The story skips the question and carries on regardless",
            ],
            correctIndex: 0,
            explanation:
              "A hint keeps the child thinking and turns the mistake into part of the adventure. Ending the story feels like failure, and giving the answer removes the learning the pause was designed for.",
          },
        ],
      },
      {
        title: "Stories for maths, science, reading and history",
        objective: "Adapt learning stories to maths, science, reading and history at different ages, and check that every fact in the story is right.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## One template, many subjects

The template from the last lesson works across subjects, but each subject has its own way of making a concept drive a plot, and its own typical errors to watch for. The examples below are illustrative: they show the shape of a good story, not a script. Change the interests and details to fit your child.

## Maths

Maths concepts drive plots naturally, because characters constantly need to count, share, measure and compare.

- **Ages 5 to 7, number bonds to 10:** A child's toy dinosaurs are boarding a boat that holds exactly 10. Seven are on. How many more can come aboard before it sails?
- **Ages 8 to 11, area:** A child who loves Minecraft-style building must fence a rectangular garden for their animals and has only enough fence for a certain length. Which shape gives the animals the most room?
- **Ages 12 to 14, negative numbers:** A diver in a story must work out the difference between a depth below sea level and the height of a cliff above it.

**Check:** work every number through yourself or with a calculator. Stories are a common place for arithmetic slips, and a wrong total at the key moment will confuse your child.

## Science

Science stories work well when the character has to predict what will happen, then find out.

- **Ages 5 to 7, floating and sinking:** A teddy must choose which objects to build a raft from to cross the bath.
- **Ages 8 to 11, the water cycle:** A raindrop who loves travelling tells the story of its journey, and the reader must work out what happens to it when the sun comes out.
- **Ages 12 to 17, forces or chemical reactions:** A character designing a go-kart for a race must decide how to reduce friction.

**Check:** science stories often contain comparisons and simplifications (the raindrop does not really "decide" anything). Ask the AI to list what it simplified, and check key facts against your child's school materials or a trusted educational site.

## Reading and writing

Here the concept is a skill rather than a fact: inference, speech marks, persuasive language, building suspense.

- **Ages 6 to 8, using full stops and capital letters:** A robot's message is scrambled because the punctuation fell off, and the reader must fix it to open the door.
- **Ages 9 to 12, inference:** A detective story where the reader must work out who took the cake from clues, without being told directly.
- **Ages 13 to 17, persuasive techniques:** A character must win a vote at a school council, and the reader chooses which techniques would work best and why.

**Check:** make sure the grammar rules match what your child's school teaches, since terms and conventions can differ between countries and curricula.

## History

History stories are powerful and need the most checking, because AI can mix up dates, invent people and blur fact with fiction.

- **Ages 7 to 11, the Romans:** A child travels back in time and must help build a road. Why did the Romans want straight roads, and what did they use?
- **Ages 12 to 17, causes of an event:** A character in the period must decide whether to join a protest, and the story explores the causes behind it.

**Check:** ask the AI to separate what is real from what is invented. A prompt like this helps:

\`\`\`try
Here is a history learning story written for my [CHILD'S AGE]-year-old about [HISTORICAL TOPIC]. List every factual claim it makes (dates, people, places, events, objects). For each, say whether it is historical fact, a reasonable simplification, or invented for the story. Flag anything I should check in a reliable source.

[PASTE THE STORY]
\`\`\`

Then check the flagged points in a textbook, the school's materials or a reputable museum or educational website. Tell your child which parts were invented: "The time machine isn't real, but the roads are."

## A fact check routine for every story

Whatever the subject, run these three checks before reading a story with your child:

1. **The key moment:** is the concept used correctly where the story stops?
2. **Numbers, dates and names:** are they right?
3. **Simplifications:** has the AI told you what it simplified, and is that acceptable for your child's age?

Five minutes of checking protects the hour of learning that follows.

## Try it now

Choose the subject your child finds hardest at the moment.

1. Use the template from the last lesson with a concept from that subject.
2. Before reading it with your child, run the three-part fact check. For history, use the fact-sorting prompt above.
3. Read the story together, then do the practice questions.

You are done when you have checked one story for accuracy, corrected anything wrong, and read it with your child.`,
        microCheck: [
          {
            question: "An AI maths story for your nine-year-old contains a wrong total at the key moment. What does this show?",
            options: [
              "Work every number through before reading it with them",
              "Maths is not a subject that works well in story form",
              "Children rarely notice number errors, so it is fine",
              "Ask the AI for a longer story to avoid such mistakes",
            ],
            correctIndex: 0,
            explanation:
              "Arithmetic slips are common in AI output, and a wrong total at the key moment will confuse the child. Checking the numbers first keeps the story useful. Length has no bearing on accuracy.",
          },
          {
            question: "Why do history stories need the most checking?",
            options: [
              "AI can mix up dates and invent people, blurring fact and fiction",
              "History stories are always much longer than other subject stories",
              "Children find history stories harder to read than other subjects",
              "Schools do not allow stories to be used for any history homework",
            ],
            correctIndex: 0,
            explanation:
              "History stories mix real events with invented characters, and AI can present invented details as fact. Sorting real from invented, then checking against a reliable source, keeps the history accurate.",
          },
          {
            question: "Which story best makes a reading skill, inference, drive the plot for a ten-year-old?",
            options: [
              "A detective story where they work out who did it from clues",
              "A story that defines inference in the first paragraph for them",
              "A story that lists five examples of inference at the very end",
              "A story where the detective explains the answer in full to them",
            ],
            correctIndex: 0,
            explanation:
              "Inference means working things out from clues that are not stated directly, so a mystery where the reader must do that makes the skill the key to the plot. Definitions and explained answers leave the child passive.",
          },
          {
            question: "A science story says a raindrop 'decides' to rise into the sky. How should you handle this?",
            options: [
              "Treat it as a simplification and explain what really happens",
              "Delete the story, since any simplification makes it useless",
              "Leave it, because young children cannot understand the truth",
              "Ask the AI to replace the raindrop with a real scientist",
            ],
            correctIndex: 0,
            explanation:
              "Stories simplify, and that is acceptable if you know where. Pointing out that raindrops do not really decide anything, and explaining evaporation simply, keeps the story's value without the misconception.",
          },
        ],
      },
      {
        title: "Co-creating with your child",
        objective: "Run a co-created story session where your child steers the plot and then explains the concept back in their own words.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## From reader to co-author

So far, you have built stories *for* your child. The next step is to build them *with* your child. When children help steer the story (choosing the setting, naming characters, deciding what happens next) they tend to care more about it, and they have to think about the concept to keep the plot on track.

Co-creating also builds healthy habits with AI. Your child sees it as a tool they direct, not a voice that tells them things. They practise giving clear instructions, noticing when the output is wrong, and deciding what to keep. These are exactly the skills they will need with AI as they grow up.

## How a co-created session runs

A good session has four parts, and takes twenty to thirty minutes.

**1. Set up together (5 minutes).** Your child picks the hero, the setting and the goal. You pick the concept (or agree it together with older children). Write the choices down.

**2. Build the story in turns (10 to 15 minutes).** The AI writes a short section and stops. Your child decides what happens next, including how the character uses the concept at key moments. The AI continues from their choice.

**3. Explain it back (5 minutes).** When the story ends, your child explains the concept to you, the AI or a toy, as if teaching it.

**4. Practise (5 minutes).** A few questions using the concept outside the story.

Here is a prompt that sets up the whole session:

\`\`\`try
Let's write a story together with my child, who is [CHILD'S AGE]. They have chosen:
- Hero: [HERO]
- Setting: [SETTING]
- Goal: [WHAT THE HERO WANTS]

The learning concept is [CONCEPT]. Write the story in short parts of about 80 words. After each part, stop and give my child two or three choices for what happens next, or let them suggest their own. At least twice, the hero must use [CONCEPT] to get past a problem, and my child must work out how before the story continues. Do not give the answer; give a small hint if they are stuck.

When the story ends, ask my child to explain [CONCEPT] in their own words as if teaching a younger child. Then gently point out anything they missed. Finish with 3 practice questions.
\`\`\`

## Letting them steer, keeping the concept central

Children will take the story in unexpected directions. That is part of the point, and usually delightful. Your job is to keep one thing fixed: the concept has to stay essential to the plot. If the story wanders off into a long chase with no learning, nudge it back: "Great, and now the hero reaches a locked door with a fractions puzzle on it."

Some other tips:

- **Younger children (5 to 8):** You type, they talk. Read each part aloud and offer the choices. Keep sessions short.
- **Middle years (8 to 12):** Let them type their own choices. Encourage silly ideas; they are memorable.
- **Teenagers:** Let them run it, and aim at harder concepts: an exam topic, a historical debate, a scientific process. Some teenagers enjoy writing a story that would teach a *younger* sibling, which is a powerful way to learn.

## The explain-it-back moment

This step turns an enjoyable story into evidence of learning. Listen for:

- **Their own words.** Not a sentence copied from the story.
- **A new example.** Can they apply it to something that was not in the story?
- **The why.** Not just what to do, but why it works.

Where their explanation wobbles is your guide for the next story or practice session. Praise the effort of explaining, especially when it is hard.

## Keeping it safe and balanced

- Stay nearby, especially with younger children, and read what the AI writes.
- Keep private details out, as in the last lessons.
- If the story drifts into anything frightening or unsuitable, stop and restart with clearer instructions ("keep it gentle and suitable for a seven-year-old").
- Keep an eye on screen time. A story can also be written down, drawn or acted out away from the screen afterwards.

## Try it now

This weekend, run one co-created session.

1. Let your child choose the hero, setting and goal. Agree the concept.
2. Run the session prompt and take turns building the story.
3. At the end, ask your child to explain the concept back to you, with one example that was not in the story.
4. Do the three practice questions.

You are done when your child has steered the story, used the concept at least twice to move it forward, and explained the concept back in their own words with a new example.`,
        microCheck: [
          {
            question: "Your child steers the co-created story into a long chase with no learning in it. What should you do?",
            options: [
              "Nudge it back so the concept is needed to move the plot on",
              "Stop the session there, since the story has clearly failed now",
              "Let it run, because enjoyment matters more than learning",
              "Take over the story choices yourself for the rest of it",
            ],
            correctIndex: 0,
            explanation:
              "Letting children steer is valuable, but the concept must stay essential to the plot. A gentle nudge, such as a puzzle that needs the concept, keeps both the fun and the learning.",
          },
          {
            question: "What is the strongest sign during explain-it-back that your child has understood?",
            options: [
              "They apply the concept to a new example and say why",
              "They repeat a sentence from the story word for word",
              "They say that the story was their favourite one yet",
              "They remember the names of all of the story's heroes",
            ],
            correctIndex: 0,
            explanation:
              "Using the concept in a new example, and explaining why it works, shows understanding that goes beyond the story. Repeating a sentence or remembering characters shows memory of the story, not the concept.",
          },
          {
            question: "Besides the concept itself, what healthy AI habit does co-creating build in children?",
            options: [
              "Seeing AI as a tool they direct and whose output they judge",
              "Trusting AI output more because it wrote a story they enjoyed",
              "Relying on AI to come up with ideas they cannot think of",
              "Using AI on their own without any adult nearby to help",
            ],
            correctIndex: 0,
            explanation:
              "Directing the AI, spotting when it goes wrong and deciding what to keep are skills children will need throughout life. Co-creating practises them, while trusting or depending on the tool does the opposite.",
          },
          {
            question: "How should you adapt a co-created session for a six-year-old?",
            options: [
              "You type and read aloud while they talk and choose",
              "Let them type every choice on their own to build skills",
              "Use a long, complex concept so they are fully challenged",
              "Run it as one long session so the story is fully finished",
            ],
            correctIndex: 0,
            explanation:
              "Young children can steer a story out loud long before they can type it. Short sessions with an adult typing and reading keep the focus on ideas and the concept rather than on the keyboard.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A friend says the In-Story approach is 'just making learning fun'. What is the key difference?",
        options: [
          "The concept is what the story needs in order to move on",
          "The stories are always written by trained professionals",
          "The stories always contain jokes to keep children happy",
          "The concept is listed in a summary box at the very end",
        ],
        correctIndex: 0,
        explanation:
          "In the TIBLOGICS In-Story approach the concept drives the plot, so understanding it is part of the adventure. Fun alone, jokes or a summary box do not make the concept essential.",
      },
      {
        question: "You fill in the story template. Which detail should you leave out?",
        options: [
          "The name and address of your child's school",
          "Your child's favourite sport and pet's name",
          "What your child can already do in this topic",
          "Your child's reading level and school year",
        ],
        correctIndex: 0,
        explanation:
          "School names and addresses identify your child and do not improve the story. Interests, prior knowledge and reading level are what the AI needs to pitch the story well.",
      },
      {
        question: "The AI writes a lovely story but explains the whole concept before the key moment, so your child just reads along. What is missing?",
        options: [
          "A pause where the child must work out what to do",
          "A longer story with more description and detail",
          "More interests packed in to keep them engaged",
          "A second concept to make the story more varied",
        ],
        correctIndex: 0,
        explanation:
          "Without a thinking pause the story becomes a passive explanation. Stopping at the key moment and asking the child to decide is where they actually use the concept.",
      },
      {
        question: "Your child enjoys a history story about the Romans. What should happen before you read it with them?",
        options: [
          "Sort fact from invention and check key claims",
          "Ask the AI to confirm the story is fully accurate",
          "Nothing, since stories are not meant to be factual",
          "Remove all invented characters from the story first",
        ],
        correctIndex: 0,
        explanation:
          "History stories blend fact and fiction, and AI can present invented details as real. Sorting the claims and checking them in a reliable source is the safeguard. Asking the same AI to confirm is not a real check.",
      },
      {
        question: "Why keep each learning story to one concept?",
        options: [
          "Several concepts turn it into a lesson in disguise",
          "AI tools can only handle one concept in each prompt",
          "Children can only ever learn one concept each week",
          "Stories with more concepts cost more money to create",
        ],
        correctIndex: 0,
        explanation:
          "One concept can be the clear key to the plot. Several at once dilute the thinking moment and make the story feel like a lesson with costumes on. The limit is about learning design, not technology.",
      },
      {
        question: "After a story, your child answers three practice questions set in the story's world but struggles with an everyday one. What does this tell you?",
        options: [
          "They cannot yet use the concept outside the story",
          "The everyday question was badly written by the AI",
          "They need a longer story with more of the same",
          "Everyday questions are unsuitable for their age",
        ],
        correctIndex: 0,
        explanation:
          "Succeeding in the story world but not in everyday life suggests the concept has not transferred yet. That tells you what to practise next, which is exactly why the template includes both kinds of question.",
      },
      {
        question: "A science story for your seven-year-old says plants 'eat' sunlight. What is the best response?",
        options: [
          "Note the simplification and explain it simply",
          "Throw the story away as scientifically useless",
          "Leave it, since the truth is too hard at seven",
          "Ask the AI to add much more technical vocabulary",
        ],
        correctIndex: 0,
        explanation:
          "Stories simplify, and that is fine when you know where. Pointing out the simplification in simple words keeps the benefit without leaving a misconception. The template asks the AI to list simplifications for this reason.",
      },
      {
        question: "Your 14-year-old finds learning stories 'babyish'. Which adaptation fits best?",
        options: [
          "Have them write a story to teach a younger sibling",
          "Use the same stories but with shorter sentences",
          "Stop using stories entirely for teenage learners",
          "Add more cartoon characters to make it more fun",
        ],
        correctIndex: 0,
        explanation:
          "Writing a story to teach someone younger makes the teenager explain the concept clearly, which is powerful learning, and puts them in charge. Simplifying or adding cartoons would feel even more babyish.",
      },
      {
        question: "During a co-created session, the story drifts into something frightening for your six-year-old. What should you do?",
        options: [
          "Stop and restart with 'keep it gentle' instructions",
          "Keep going, since children like exciting stories",
          "Let your child decide whether it is too scary",
          "Switch off the device and avoid stories from now on",
        ],
        correctIndex: 0,
        explanation:
          "Staying nearby lets you catch unsuitable turns. Restarting with clearer instructions about tone fixes it quickly without abandoning a useful approach or leaving a young child to judge alone.",
      },
      {
        question: "Which evidence best shows a co-created story session has worked?",
        options: [
          "Your child explains the concept with a new example",
          "Your child asks to do another story tomorrow night",
          "The story is long and has lots of exciting twists",
          "Your child remembers the hero's name the next day",
        ],
        correctIndex: 0,
        explanation:
          "Explaining the concept in their own words with a fresh example shows real understanding. Enjoyment, story length and remembering characters are good signs of engagement, but not of learning.",
      },
      {
        question: "A parent says AI story tools mean they no longer need to be involved. What does this module suggest?",
        options: [
          "Your role shifts to choosing, checking and guiding",
          "That is right, as the AI handles the whole process",
          "Parents only need to be involved with under-sevens",
          "Parents should write every single story by hand",
        ],
        correctIndex: 0,
        explanation:
          "AI makes personalised stories quick to create, but the parent still chooses the concept, checks facts, keeps private details out and makes sure the child does the thinking. That role does not disappear with age.",
      },
      {
        question: "Why does the In-Story approach follow the story with practice?",
        options: [
          "So the child uses the concept again in a new setting",
          "So the parent can see whether the AI wrote it well",
          "So the child has something to hand in at school",
          "So the story session lasts for at least an hour",
        ],
        correctIndex: 0,
        explanation:
          "The story gives the concept meaning, and practice makes the child use it again away from the plot, which is what builds lasting skill. It is not about handing work in, checking the AI or filling time.",
      },
    ],
  },
];
